import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Utiliza variáveis de ambiente nativas do Supabase para maior segurança
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? "";

serve(async (req) => {
  // Trata requisições OPTIONS (CORS Preflight)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Inicializa o cliente com a Service Role Key para ignorar restrições de RLS
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Captura os dados enviados pelo front-end (NewOrder.tsx)
    const body = await req.json();

    // Inserção na tabela 'orders'
    const { data: newOrder, error: orderErr } = await supabase
      .from("orders")
      .insert({ 
        vehicle_plate: body.vehicle_plate,
        model: body.model,
        year: body.year,
        engine: body.engine,
        cv: body.cv,
        fuel: body.fuel,
        km: body.km,
        transmission: body.transmission,
        hw_number: body.hw_number,
        sw_number: body.sw_number,
        system: body.system,
        reading_mode: body.readingMode,
        performance: body.performance || [],
        tool: body.tool || [],
        notes: body.notes,
        status: 'solicitado',
        // Garanta que o franchisee_id seja enviado se o campo for obrigatório
        franchisee_id: body.franchisee_id 
      })
      .select()
      .single();

    if (orderErr) {
      console.error("Erro na inserção do banco:", orderErr);
      return new Response(JSON.stringify({ error: orderErr.message }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Retorno de sucesso
    return new Response(JSON.stringify({ success: true, order: newOrder }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Erro crítico na função:", err.message);
    return new Response(JSON.stringify({ error: "Erro interno no servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});