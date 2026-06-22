'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Order } from '@/types';
import Link from 'next/link';
import {
  CreditCard,
  ShieldCheck,
  QrCode,
  Building,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Loader2
} from 'lucide-react';

export default function PaymentGatewayPage() {
  const params = useParams();
  const orderId = params.id as string;
  const supabase = createClient();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Time remaining timer (simulating 15 minutes)
  const [timeRemaining, setTimeRemaining] = useState(900);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data, error: fetchErr } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (fetchErr) throw fetchErr;
        setOrder(data as Order);
      } catch (err: unknown) {
        console.error('Error fetching order for payment:', err);
        const errMsg = err instanceof Error ? err.message : 'Order not found';
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId, supabase]);

  // Timer interval
  useEffect(() => {
    if (order && order.status === 'pending' && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [order, timeRemaining]);

  const handleSimulatePayment = async (status: 'paid' | 'failed') => {
    setProcessing(true);
    setError(null);
    try {
      const response = await fetch(`/api/orders/${orderId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to simulate payment');
      }

      // Re-fetch order status
      const { data: updatedOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      
      if (updatedOrder) {
        setOrder(updatedOrder as Order);
      }
    } catch (err: unknown) {
      console.error('Payment simulation error:', err);
      const errMsg = err instanceof Error ? err.message : 'Error occurred during payment processing';
      setError(errMsg);
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-400 text-xs font-semibold">Loading secure payment screen...</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <XCircle className="h-16 w-16 text-rose-500 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold tracking-tight mb-2">Payment Details Error</h2>
        <p className="text-slate-400 text-sm max-w-sm text-center mb-8">
          {error || 'Unable to retrieve order details. Please verify your order link.'}
        </p>
        <Link href="/" className="rounded-xl bg-slate-900 border border-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-all">
          Return to Shop
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
        
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-white" />
            <span className="font-bold text-sm tracking-wide text-white uppercase">AuraCart Payment Secure</span>
          </div>
          <div className="flex items-center space-x-1 rounded bg-slate-950/40 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 border border-emerald-400/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>SECURE GATEWAY</span>
          </div>
        </div>

        {processing && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
            <span className="text-xs text-slate-300 font-semibold">Simulating payment processing...</span>
          </div>
        )}

        {/* 1. SUCCESS STATE */}
        {order.status === 'paid' && (
          <div className="p-8 text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-10 w-10 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-white">Payment Successful!</h2>
              <p className="text-slate-400 text-xs max-w-sm mx-auto">
                Thank you for your purchase. Your payment has been processed securely, and your products are now prepared for delivery.
              </p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-5 text-left space-y-3 text-xs">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-500">Order ID:</span>
                <span className="font-mono text-white font-semibold">{order.id}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-500">Customer Name:</span>
                <span className="text-white font-semibold">{order.customer_name}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-500">Total Paid:</span>
                <span className="text-emerald-400 font-bold font-mono">{formatPrice(order.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="text-white font-semibold">{order.payment_method}</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/"
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-xs font-semibold text-white shadow-md hover:opacity-90 transition-all flex items-center justify-center space-x-1.5"
              >
                <span>Continue Shopping</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {/* 2. FAILED STATE */}
        {order.status === 'failed' && (
          <div className="p-8 text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
              <XCircle className="h-10 w-10 animate-shake" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-white">Payment Failed</h2>
              <p className="text-slate-400 text-xs max-w-sm mx-auto">
                The payment simulation could not be completed. You can try reprocessing this transaction.
              </p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-5 text-left space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID:</span>
                <span className="font-mono text-white font-semibold">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Due:</span>
                <span className="text-rose-400 font-bold font-mono">{formatPrice(order.total_amount)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => handleSimulatePayment('paid')}
                className="flex-grow rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-xs font-semibold text-white hover:opacity-90 transition-all"
              >
                Retry (Simulate Pay)
              </button>
              <Link
                href="/"
                className="flex-grow rounded-xl bg-slate-800 border border-white/10 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-all flex items-center justify-center"
              >
                Back to Shop
              </Link>
            </div>
          </div>
        )}

        {/* 3. PENDING PAYMENT (Simulating Portal Interface) */}
        {order.status === 'pending' && (
          <div className="p-6 space-y-6">
            
            {/* Merchant info & amount */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="text-xs text-slate-500">Pay To:</h3>
                <p className="text-sm font-bold text-white uppercase tracking-wider">AuraCart Store</p>
              </div>
              <div className="text-right">
                <h3 className="text-xs text-slate-500">Amount Due:</h3>
                <p className="text-base font-extrabold text-indigo-400 font-mono">{formatPrice(order.total_amount)}</p>
              </div>
            </div>

            {/* Timer countdown banner */}
            <div className="flex items-center justify-between rounded-xl bg-indigo-500/5 border border-indigo-500/10 p-3.5 text-xs text-indigo-400">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 animate-pulse" />
                <span>Complete payment within:</span>
              </div>
              <span className="font-mono font-bold text-sm tracking-wider">{formatTimer(timeRemaining)}</span>
            </div>

            {/* Instruction Panel based on payment method */}
            {order.payment_method === 'QRIS' ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto max-w-[180px] aspect-square rounded-2xl bg-white p-3 shadow-lg border border-indigo-500/15 flex items-center justify-center relative">
                  {/* Mock QR Code Pattern using SVG */}
                  <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
                    <rect x="0" y="0" width="20" height="20" fill="currentColor" />
                    <rect x="5" y="5" width="10" height="10" fill="white" />
                    <rect x="80" y="0" width="20" height="20" fill="currentColor" />
                    <rect x="85" y="5" width="10" height="10" fill="white" />
                    <rect x="0" y="80" width="20" height="20" fill="currentColor" />
                    <rect x="5" y="85" width="10" height="10" fill="white" />
                    
                    {/* Random small blocks */}
                    <rect x="30" y="10" width="15" height="5" fill="currentColor" />
                    <rect x="40" y="30" width="20" height="10" fill="currentColor" />
                    <rect x="10" y="45" width="8" height="15" fill="currentColor" />
                    <rect x="60" y="55" width="25" height="10" fill="currentColor" />
                    <rect x="70" y="20" width="5" height="25" fill="currentColor" />
                    <rect x="30" y="65" width="15" height="15" fill="currentColor" />
                    <rect x="75" y="75" width="15" height="15" fill="currentColor" />
                    <rect x="50" y="80" width="10" height="5" fill="currentColor" />
                  </svg>
                  
                  {/* Glowing secure logo in the center */}
                  <div className="absolute inset-0 m-auto h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white border border-white">
                    <QrCode className="h-4 w-4" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">Scan QR Code</h4>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                    Use any digital payment app supporting QRIS (GoPay, OVO, Dana, LinkAja, or Mobile Banking) to scan.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 rounded-2xl bg-slate-950/50 border border-white/5 p-4 text-xs">
                <div className="flex items-center space-x-3.5 border-b border-white/5 pb-3">
                  <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-2 text-indigo-400">
                    <Building className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Transfer Virtual Account</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Permata Bank / BCA VA (Simulated)</p>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Virtual Account Number</span>
                    <div className="flex items-center justify-between bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 mt-1 font-mono text-sm text-indigo-400 font-bold">
                      <span>88308{orderId.replace(/[^0-9]/g, '').substring(0, 9) || '193859203'}</span>
                      <button
                        onClick={() => alert('Virtual Account Number copied to clipboard!')}
                        className="text-[10px] text-slate-400 hover:text-white uppercase font-sans tracking-wide transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 mt-3">
                    <h4 className="font-bold text-[10px] text-slate-300">Payment Instructions:</h4>
                    <ul className="list-decimal pl-4 space-y-1 text-[10px] text-slate-500">
                      <li>Log in to your Mobile Banking app or ATM.</li>
                      <li>Select **Transfer** &gt; **Virtual Account**.</li>
                      <li>Enter the Virtual Account number displayed above.</li>
                      <li>Review the transaction details and confirm.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Sandbox Simulation Actions */}
            <div className="border-t border-white/5 pt-5 space-y-4">
              <div className="text-center">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mb-2">Simulasi Sandbox Gateway</span>
                <p className="text-[10px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Gunakan tombol di bawah ini untuk mensimulasikan balasan status sukses/gagal dari sistem perbankan.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => handleSimulatePayment('failed')}
                  className="flex-1 rounded-xl border border-red-500/25 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 text-xs font-bold transition-all"
                >
                  Simulate Fail
                </button>
                
                <button
                  onClick={() => handleSimulatePayment('paid')}
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 text-xs font-bold shadow-md shadow-emerald-500/15 hover:opacity-95 active:scale-[0.98] transition-all"
                >
                  Simulate Success
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </main>
  );
}
