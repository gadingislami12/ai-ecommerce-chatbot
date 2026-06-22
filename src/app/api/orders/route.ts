import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const {
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      total_amount,
      payment_method,
      items,
    } = body;

    if (!customer_name || !customer_email || !shipping_address || !total_amount || !payment_method || !items || !items.length) {
      return NextResponse.json({ error: 'Missing required checkout fields' }, { status: 400 });
    }

    // 1. Insert order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert([{
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        total_amount,
        payment_method,
        status: 'pending',
      }])
      .select()
      .single();

    if (orderErr) throw orderErr;

    // 2. Insert order items
    const orderItemsPayload = items.map((item: { product_id: string; quantity: number; price: number }) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsErr } = await supabase
      .from('order_items')
      .insert(orderItemsPayload);

    if (itemsErr) {
      // Rollback order creation if items insert fails
      await supabase.from('orders').delete().eq('id', order.id);
      throw itemsErr;
    }

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (err: unknown) {
    console.error('API Error (POST orders):', err);
    const errMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
