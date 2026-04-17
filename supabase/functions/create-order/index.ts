import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // 1. Lidar com CORS (Essencial para o Netlify conseguir chamar a função)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 2. Configurar o cliente Supabase usando variáveis de ambiente do SISTEMA
    // Nunca deixe a chave SERVICE_ROLE visível no código!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // 3. Verificar o usuário (Isso valida o JWT automaticamente)
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado", details: authError?.message }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // 4. Buscar o franqueado
    const { data: franchisee, error: franchiseeError } = await supabaseClient
      .from("franchisees")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (franchiseeError || !franchisee) {
      return new Response(JSON.stringify({ error: "Perfil de franqueado não encontrado" }), { 
        status: 403, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // 5. Processar o corpo da requisição
    const body = await req.json();

    // 6. Criar o pedido no banco de dados
    const { data: order, error: orderError } = await supabaseClient
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
    return new Response(JSON.stringify({ error: "Erro interno", details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});