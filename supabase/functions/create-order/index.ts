import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// CREDENCIAIS FIXAS
const SUPABASE_URL = "https://vkxhjynnaekpeklmfebr.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZreGhqeW5uYWVrcGVrbG1mZWJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI1NTkzNywiZXhwIjoyMDkxODMxOTM3fQ.WWedj2Iogv7jHBYtgZS9bWpRP00-z_QxIKMRyp69cFc";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const body = await req.json();

    const { data: newOrder, error: orderErr } = await supabase
      .from("orders")
      .insert({ 
        vehicle_plate: body.vehicle_plate,
        model: body.model,
        year: body.year,
        engine: body.engine,
        notes: body.notes,
        status: 'solicitado'
      })
      .select()
      .single();

    if (orderErr) {
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
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});