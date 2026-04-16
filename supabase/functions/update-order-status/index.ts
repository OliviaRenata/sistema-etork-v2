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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    
    if (authErr || !user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return json({ error: "Acesso negado: apenas administradores" }, 403);
    }

    const { order_id, new_status, notes } = await req.json();

    if (!order_id || !new_status) {
      return json({ error: "order_id e new_status são obrigatórios" }, 400);
    }

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, status, order_number, franchisee_id")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) {
      return json({ error: "Pedido não encontrado" }, 404);
    }

    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(new_status)) {
      return json({
        error: `Transição inválida: ${order.status} → ${new_status}. Permitido: ${allowed.join(", ") || "nenhuma"}`,
      }, 400);
    }

    const { error: updateErr } = await supabase
      .from("orders")
      .update({ status: new_status, updated_by: user.id })
      .eq("id", order_id);

    if (updateErr) throw updateErr;

    await supabase.from("order_status_history").insert({
      order_id,
      from_status: order.status,
      to_status: new_status,
      changed_by: user.id,
      notes: notes || null,
    });

    const { data: franchisee } = await supabase
      .from("franchisees")
      .select("user_id")
      .eq("id", order.franchisee_id)
      .single();

    if (franchisee) {
      const statusLabels = {
        em_producao: "Em Produção",
        enviado: "Enviado",
        concluido: "Concluído",
        cancelado: "Cancelado",
      };

      await supabase.from("notifications").insert({
        user_id: franchisee.user_id,
        type: "status_atualizado",
        title: `Pedido ${order.order_number} atualizado`,
        body: `Seu pedido foi atualizado para: ${statusLabels[new_status] || new_status}`,
        data: { order_id, order_number: order.order_number, new_status },
      });
    }

    if (new_status === "cancelado") {
      const { data: record } = await supabase
        .from("financial_records")
        .select("amount, franchisee_id")
        .eq("order_id", order_id)
        .eq("type", "debit")
        .single();

      if (record) {
        const { data: franchiseeData } = await supabase
          .from("franchisees")
          .select("balance")
          .eq("id", record.franchisee_id)
          .single();

        if (franchiseeData) {
          await supabase
            .from("franchisees")
            .update({ balance: (franchiseeData.balance || 0) + record.amount })
            .eq("id", record.franchisee_id);
        }

        await supabase.from("financial_records").insert({
          franchisee_id: record.franchisee_id,
          order_id,
          type: "credit",
          amount: record.amount,
          description: `Estorno — Pedido ${order.order_number} cancelado`,
          payment_status: "pago",
          paid_at: new Date().toISOString(),
          created_by: user.id,
        });
      }
    }

    return json({ 
      message: `Status atualizado: ${order.status} → ${new_status}`, 
      order_id, 
      new_status 
    });

  } catch (err) {
    console.error(err);
    return json({ error: "Erro interno do servidor" }, 500);
  }
});

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}