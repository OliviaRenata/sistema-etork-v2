// supabase/functions/create-order/index.ts
// Edge Function: POST /create-order
// Creates a validated order with items, files and notifications

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  item_id: string;
  quantity: number;
  notes?: string;
}

interface CreateOrderPayload {
  notes?: string;
  vehicle_plate?: string;
  items: OrderItem[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    // Get profile
    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();
    if (!profile) return json({ error: "Profile not found" }, 404);

    // Get franchisee
    const { data: franchisee } = await supabase
      .from("franchisees").select("id, active, balance, credit_limit")
      .eq("user_id", user.id).single();
    if (!franchisee || !franchisee.active) return json({ error: "Franqueado não encontrado ou inativo" }, 403);

    const body: CreateOrderPayload = await req.json();

    // Validate items
    if (!body.items?.length) return json({ error: "Pedido deve ter pelo menos 1 item" }, 400);

    // Fetch item prices server-side (never trust client prices)
    const itemIds = body.items.map(i => i.item_id);
    const { data: catalogItems } = await supabase
      .from("items").select("id, name, unit_price, active, requires_file")
      .in("id", itemIds);

    if (!catalogItems || catalogItems.length !== itemIds.length) {
      return json({ error: "Um ou mais itens não encontrados" }, 400);
    }

    const inactiveItem = catalogItems.find(i => !i.active);
    if (inactiveItem) return json({ error: `Item "${inactiveItem.name}" está inativo` }, 400);

    // Build order items with server-side prices
    const orderItems = body.items.map(oi => {
      const catalogItem = catalogItems.find(c => c.id === oi.item_id)!;
      return {
        item_id: oi.item_id,
        quantity: oi.quantity,
        unit_price: catalogItem.unit_price,
        notes: oi.notes,
      };
    });

    const totalAmount = orderItems.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0);

    // Credit check
    const availableCredit = franchisee.credit_limit + franchisee.balance;
    if (totalAmount > availableCredit) {
      return json({ error: `Saldo insuficiente. Disponível: R$ ${availableCredit.toFixed(2)}` }, 400);
    }

    // Plate lookup (if provided)
    let vehicleInfo = null;
    if (body.vehicle_plate) {
      vehicleInfo = await lookupVehiclePlate(body.vehicle_plate);
    }

    // Create order
    const { data: order, error: orderErr } = await supabase
      .from("orders").insert({
        franchisee_id: franchisee.id,
        notes: body.notes,
        vehicle_plate: body.vehicle_plate,
        vehicle_info: vehicleInfo,
        created_by: user.id,
        updated_by: user.id,
      }).select().single();

    if (orderErr) throw orderErr;

    // Insert order items
    const { error: itemsErr } = await supabase.from("order_items").insert(
      orderItems.map(oi => ({ ...oi, order_id: order.id }))
    );
    if (itemsErr) throw itemsErr;

    // Debit franchisee balance
    await supabase.from("franchisees")
      .update({ balance: franchisee.balance - totalAmount })
      .eq("id", franchisee.id);

    // Financial record
    await supabase.from("financial_records").insert({
      franchisee_id: franchisee.id,
      order_id: order.id,
      type: "debit",
      amount: totalAmount,
      description: `Pedido ${order.order_number}`,
      payment_status: "pendente",
      created_by: user.id,
    });

    // Status history
    await supabase.from("order_status_history").insert({
      order_id: order.id,
      from_status: null,
      to_status: "solicitado",
      changed_by: user.id,
      notes: "Pedido criado",
    });

    return json({ order, message: "Pedido criado com sucesso" }, 201);

  } catch (err) {
    console.error(err);
    return json({ error: "Erro interno do servidor" }, 500);
  }
});

async function lookupVehiclePlate(plate: string) {
  try {
    // Integration with Brazilian vehicle plate API
    // Replace with actual API endpoint/key
    const cleanPlate = plate.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    const response = await fetch(
      `https://brasilapi.com.br/api/fipe/tabela/v1`, // placeholder
      { headers: { "Content-Type": "application/json" } }
    );
    if (!response.ok) return null;
    return { plate: cleanPlate, queried_at: new Date().toISOString() };
  } catch {
    return null;
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
