// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? "";
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Token ausente" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    
    if (authErr || !user) {
      console.error("Auth error:", authErr);
      return json({ error: "Token inválido", details: authErr?.message }, 401);
    }

    const body = await req.json();
    
    // Buscar franqueado do usuário
    const { data: franchisee, error: franchiseeErr } = await supabase
      .from("franchisees")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (franchiseeErr || !franchisee) {
      return json({ error: "Franqueado não encontrado" }, 404);
    }

    const { data: newOrder, error: orderErr } = await supabase
      .from("orders")
      .insert({ 
        franchisee_id: franchisee.id,
        vehicle_plate: body.vehicle_plate,
        model: body.model,
        notes: body.notes,
        status: 'solicitado',
        created_by: user.id
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    return json({ message: "Pedido enviado com sucesso!", order: newOrder }, 201);

  } catch (err) {
    console.error("Erro:", err);
    return json({ error: "Erro ao processar pedido", details: err.message }, 500);
  }
});

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}