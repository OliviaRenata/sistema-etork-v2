import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WDAPI_BASE_URL = "https://wdapi2.com.br/consulta";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanPlate(input: string): string {
  return input.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método não permitido" }, 405);
  }

  const token = Deno.env.get("WDAPI_TOKEN") ?? "";
  if (!token) {
    return jsonResponse({ error: "Token da API de placa não configurado no servidor" }, 500);
  }

  try {
    const body = await req.json();
    const plate = cleanPlate(String(body?.plate ?? ""));

    if (plate.length < 7) {
      return jsonResponse({ error: "Placa inválida" }, 400);
    }

    const response = await fetch(`${WDAPI_BASE_URL}/${plate}/${token}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const text = await response.text();
      return jsonResponse(
        {
          error: "Falha na consulta da API externa",
          details: text || `Status ${response.status}`,
          status: response.status,
        },
        response.status,
      );
    }

    const data = await response.json();

    if (!data || (!data.modelo && !data.model)) {
      return jsonResponse({ error: "Dados de veículo não encontrados para a placa informada" }, 404);
    }

    return jsonResponse({
      plate,
      model: data.modelo || data.model || "",
      year: data.ano || "",
      engine: data.motor || "",
      fuel: data.combustivel || "",
      chassi: data.chassi || "",
      cv: data.potencia || "",
      raw: data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return jsonResponse({ error: "Erro ao consultar placa", details: message }, 500);
  }
});
