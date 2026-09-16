import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  Truck, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  ArrowRight,
  PackageCheck,
  AlertCircle
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { api } from '../services/api';

interface OrderTrackingModalProps {
  order: Order | null;
  onClose: () => void;
  onOrderUpdated?: () => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  order,
  onClose,
  onOrderUpdated,
}) => {
  const [enteredOtp, setEnteredOtp] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!order) return null;

  const stages: Array<{ key: OrderStatus; label: string; desc: string }> = [
    { key: 'PLACED', label: 'Order Placed', desc: 'Escrow payment locked safely' },
    { key: 'CONFIRMED', label: 'Farmer Confirmed', desc: 'Lot verified for freshness' },
    { key: 'PREPARING', label: 'Harvested & Packed', desc: 'Graded into ventilated crates' },
    { key: 'PICKED_UP', label: 'Logistics Picked Up', desc: 'Loaded into cold transit van' },
    { key: 'IN_TRANSIT', label: 'In Transit to Hub', desc: 'Real-time GPS monitored' },
    { key: 'DELIVERED', label: 'Delivered & Escrow Released', desc: '100% farm payout disbursed' },
  ];

  const currentStageIndex = stages.findIndex(s => s.key === order.status);

  const handleVerifyDeliveryOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredOtp.trim() !== order.deliveryOtp) {
      setError('Incorrect Delivery OTP. Please verify with the buyer/driver.');
      return;
    }

    setUpdating(true);
    setError(null);
    try {
      await api.updateOrderStatus(order.id, 'DELIVERED', 'Delivered verified with customer OTP. Escrow released to Farmer.');
      setSuccess('Order marked DELIVERED! Payment of ₹' + order.itemsTotal + ' has been instantly released to the Farmer.');
      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 transition-colors w-full max-w-xl rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base tracking-tight">Track Order #{order.id}</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-800 text-amber-300 text-[10px] font-bold">
                {order.status}
              </span>
            </div>
            <p className="text-xs text-emerald-200 mt-0.5">
              Direct Farmgate Route • Escrow Guaranteed
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Secure Delivery OTP Pill */}
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-sm">
                OTP
              </div>
              <div>
                <div className="text-xs font-bold text-amber-950">Doorstep Delivery Security Code</div>
                <div className="text-[11px] text-amber-800">Share this code with the driver upon inspection:</div>
              </div>
            </div>
            <span className="text-xl font-mono font-black text-amber-900 tracking-wider bg-white dark:bg-stone-900 px-3 py-1 rounded-lg border border-amber-200 shadow-xs">
              {order.deliveryOtp}
            </span>
          </div>

          {/* 6-Stage Visual Timeline */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Live Delivery Milestones</h4>
            <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
              {stages.map((stage, idx) => {
                const isCompleted = idx <= currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                return (
                  <div key={stage.key} className="relative flex items-start gap-3">
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-stone-200 text-stone-500'
                      } ${isCurrent ? 'ring-4 ring-emerald-100 scale-110' : ''}`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${isCompleted ? 'text-stone-900' : 'text-stone-400'}`}>
                        {stage.label}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">{stage.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Logistics & Transit Details */}
          <div className="p-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-xl space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 pb-2">
              <span className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-700" /> Carrier Partner:
              </span>
              <span className="text-stone-600 dark:text-stone-300">{order.logisticsName || 'KisanVahan Cold Transit'}</span>
            </div>
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 pb-2">
              <span className="font-bold text-stone-800 dark:text-stone-200">Assigned Vehicle:</span>
              <span className="font-mono text-stone-700 dark:text-stone-300">{order.vehicleNumber || 'MH 12 QX 4902 (Refrigerated)'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-800 dark:text-stone-200">Destination:</span>
              <span className="text-stone-600 dark:text-stone-300 truncate max-w-[220px]">
                {order.shippingAddress.city}, {order.shippingAddress.state} ({order.shippingAddress.pincode})
              </span>
            </div>
          </div>

          {/* Items in this Order */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Produce in this Consignment</h4>
            <div className="space-y-2">
              {order.items.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs">
                  <div className="flex items-center gap-3">
                    <img src={it.image} alt={it.name} className="w-10 h-10 rounded-lg object-cover" />
                    <div>
                      <div className="font-bold text-stone-900 dark:text-stone-100">{it.name}</div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">Farmer: {it.farmerName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-stone-900 dark:text-stone-100">{it.quantity} {it.unit}</div>
                    <div className="text-stone-600 dark:text-stone-300">₹{it.price * it.quantity}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Hand-off Simulator (Driver / Buyer can test OTP confirmation) */}
          {order.status !== 'DELIVERED' && (
            <form onSubmit={handleVerifyDeliveryOtp} className="pt-2 border-t border-stone-200 dark:border-stone-700 space-y-3">
              <div className="text-xs font-bold text-stone-700 dark:text-stone-300">Simulate Doorstep Hand-off Verification:</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={enteredOtp}
                  onChange={e => setEnteredOtp(e.target.value)}
                  placeholder={`Enter OTP (${order.deliveryOtp})`}
                  className="flex-1 bg-stone-50 dark:bg-stone-950 border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-emerald-600"
                />
                <button
                  type="submit"
                  disabled={updating || enteredOtp.length < 6}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-sm transition"
                >
                  {updating ? 'Verifying...' : 'Confirm Delivery & Release Escrow'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
