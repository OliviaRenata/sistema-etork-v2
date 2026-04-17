// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_TRANSITIONS = {
  solicitado: ["em_producao", "cancelado"],
  em_producao: ["enviado", "cancelado"],
  enviado: ["concluido"],
  concluido: [],
  cancelado: [],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? "";
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Não autorizado", details: "Token ausente" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    
    if (authErr || !user) {
      return json({ error: "Não autorizado", details: "Sessão inválida" }, 401);
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return json({ error: "Acesso negado. Apenas administradores podem alterar status." }, 403);
    }

    const { order_id, new_status, notes } = await req.json();

    if (!order_id || !new_status) {
      return json({ error: "order_id e new_status são obrigatórios" }, 400);
    }

    // Buscar pedido atual
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, status, order_number, franchisee_id")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) {
      return json({ error: "Pedido não encontrado" }, 404);
    }

    // Validar transição
    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(new_status)) {
      return json({
        error: `Transição inválida: ${order.status} → ${new_status}. Permitido: ${allowed.join(", ") || "nenhuma"}`,
      }, 400);
    }

    // Atualizar status
    const { error: updateErr } = await supabase
      .from("orders")
      .update({ status: new_status, updated_by: user.id })
      .eq("id", order_id);

    if (updateErr) throw updateErr;

    // Registrar histórico
    await supabase.from("order_status_history").insert({
      order_id,
      from_status: order.status,
      to_status: new_status,
      changed_by: user.id,
      notes: notes || null,
    });

    return json({ 
      message: `Status atualizado: ${order.status} → ${new_status}`, 
      order_id, 
      new_status 
    });

  } catch (err) {
    console.error("Erro:", err);
    return json({ error: "Erro ao processar requisição", details: err.message }, 500);
  }
});

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}