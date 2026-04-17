// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    // --- REMOVEMOS A TRAVA DE ADMIN AQUI ---
    // Agora qualquer usuário autenticado pode prosseguir para criar o pedido

    const body = await req.json();
    
    // Lógica simplificada para criação de pedido
    // Aqui você insere a lógica de INSERT na tabela orders
    // Exemplo:
    const { data: newOrder, error: orderErr } = await supabase
      .from("orders")
      .insert([{ 
        ...body, 
        created_by: user.id,
        status: 'solicitado' 
      }])
      .select()
      .single();

    if (orderErr) throw orderErr;

    return json({ message: "Pedido enviado com sucesso!", order: newOrder });

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