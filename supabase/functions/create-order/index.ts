import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = "https://vkxhjynnaekpeklmfebr.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZreGhqeW5uYWVrcGVrbG1mZWJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI1NTkzNywiZXhwIjoyMDkxODMxOTM3fQ.WWedj2Iogv7jHBYtgZS9bWpRP00-z_QxIKMRyp69cFc";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Pega o token do header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized - No token" }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Criar cliente do Supabase com a service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar o token manualmente
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized - Invalid token", details: authError?.message }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    console.log("Usuário autenticado:", user.email);

    // Pegar o franqueado
    const { data: franchisee, error: franchiseeError } = await supabase
      .from("franchisees")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (franchiseeError || !franchisee) {
      return new Response(JSON.stringify({ error: "Franqueado não encontrado" }), { 
        status: 403, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const body = await req.json();

    // Criar o pedido
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        franchisee_id: franchisee.id,
        vehicle_plate: body.vehicle_plate,
        model: body.model,
        year: body.year,
        engine: body.engine,
        cv: body.cv,
        fuel: body.fuel,
        status: "solicitado"
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order error:", orderError);
      return new Response(JSON.stringify({ error: orderError.message }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    return new Response(JSON.stringify({ success: true, order }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});