// supabase/functions/create-order/index.ts
// Edge Function: POST /create-order
// Cria um novo pedido de remap

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// VALORES REAIS DO SEU SUPABASE
const supabaseUrl = "https://vkxhjynnaekpeklmfebr.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZreGhqeW5uYWVrcGVrbG1mZWJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI1NTkzNywiZXhwIjoyMDkxODMxOTM3fQ.WWedj2Iogv7jHBYtgZS9bWpRP00-z_QxIKMRyp69cFc";

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Auth check - valida token do usuário
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized: No token provided" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    
    if (authErr || !user) {
      console.error("Auth error:", authErr);
      return json({ error: "Unauthorized: Invalid token" }, 401);
    }

    // Busca o franqueado do usuário
    const { data: franchisee, error: franchiseeErr } = await supabase
      .from("franchisees")
      .select("id, active, balance, credit_limit")
      .eq("user_id", user.id)
      .single();

    if (franchiseeErr || !franchisee) {
      return json({ error: "Franqueado não encontrado" }, 403);
    }

    if (!franchisee.active) {
      return json({ error: "Franqueado inativo" }, 403);
    }

    const body = await req.json();

    // Valida campos obrigatórios
    if (!body.vehicle_plate) {
      return json({ error: "Placa do veículo é obrigatória" }, 400);
    }

    // Cria o pedido
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        franchisee_id: franchisee.id,
        vehicle_plate: body.vehicle_plate,
        chassi: body.chassi || null,
        model: body.model || null,
        year: body.year || null,
        engine: body.engine || null,
        cv: body.cv || null,
        fuel: body.fuel || null,
        km: body.km || null,
        transmission: body.transmission || null,
        hw_number: body.hw_number || null,
        sw_number: body.sw_number || null,
        system: body.system || null,
        reading_mode: body.readingMode || null,
        performance: body.performance || [],
        tool: body.tool || [],
        notes: body.notes || null,
        total_amount: body.total_amount || 0,
        status: "solicitado"
      })
      .select()
      .single();

    if (orderErr) {
      console.error("Order creation error:", orderErr);
      return json({ error: "Erro ao criar pedido: " + orderErr.message }, 500);
    }

    // Registro financeiro (débito)
    if (body.total_amount && body.total_amount > 0) {
      const { error: financeErr } = await supabase
        .from("financial_records")
        .insert({
          franchisee_id: franchisee.id,
          order_id: order.id,
          type: "debit",
          amount: body.total_amount,
          description: `Pedido ${order.order_number || order.id} - ${body.vehicle_plate}`,
          payment_status: "pendente"
        });

      if (financeErr) {
        console.error("Financial record error:", financeErr);
      }

      // Atualiza saldo do franqueado
      const { error: balanceErr } = await supabase
        .from("franchisees")
        .update({ balance: franchisee.balance - body.total_amount })
        .eq("id", franchisee.id);

      if (balanceErr) {
        console.error("Balance update error:", balanceErr);
      }
    }

    return json({ 
      success: true,
      order, 
      message: "Pedido criado com sucesso" 
    }, 201);

  } catch (err) {
    console.error("Unexpected error:", err);
    const errorMessage = err instanceof Error ? err.message : "Erro interno do servidor";
    return json({ error: errorMessage }, 500);
  }
});

function json(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});