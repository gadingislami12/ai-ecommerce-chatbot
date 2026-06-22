import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: orderId } = await params;
    const supabase = await createClient();
    const body = await request.json();
    const { status } = body;

    if (status !== 'paid' && status !== 'failed') {
      return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 });
    }

    // 1. Get current order to prevent duplicate processing
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status === 'paid') {
      return NextResponse.json({ success: true, message: 'Order already processed.' });
    }

    // 2. Update order status
    const { error: updateErr } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (updateErr) throw updateErr;

    // 3. Decrement product stock if status is 'paid'
    // Note: Product stock reduction is handled automatically on the database side
    // via the 'on_order_paid' PostgreSQL trigger to bypass RLS restrictions and ensure atomicity.

    return NextResponse.json({ success: true, newStatus: status });
  } catch (err: unknown) {
    console.error('API Error (POST pay order):', err);
    const errMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
