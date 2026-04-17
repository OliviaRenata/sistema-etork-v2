import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();

    // REMOVIDA A VERIFICAÇÃO DO TOKEN - QUALQUER REQUISIÇÃO É ACEITA
    console.log("Criando pedido:", body);

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
        performance: body.performance,
        tool: body.tool,
        notes: body.notes,
        status: 'solicitado'
      })
      .select()
      .single();

    if (orderErr) {
      console.error("Erro ao criar pedido:", orderErr);
      return new Response(JSON.stringify({ error: orderErr.message }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    return new Response(JSON.stringify({ success: true, order: newOrder }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Erro:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});