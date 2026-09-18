import React, { useState } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  XCircle, 
  Truck, 
  Package, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  Sparkles,
  Phone,
  User,
  Boxes,
  ArrowRight,
  Send,
  X
} from 'lucide-react';
import { Order, Product, LogisticsPartner } from '../types';

export const playIncomingOrderChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Harmonic fanfare: C5 (523.25 Hz) -> E5 (659.25 Hz) -> G5 (783.99 Hz) -> C6 (1046.50 Hz)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.25);
    });
  } catch (err) {
    // Gracefully handle browser autoplay policy
  }
};

interface FarmerIncomingOrderModalProps {
  order: Order | null;
  product?: Product | null;
  availablePartners: LogisticsPartner[];
  onClose: () => void;
  onRejectOrder: (orderId: string, reason: string) => Promise<void>;
  onAcceptOrder: (orderId: string) => Promise<void>;
  onAssignDeliveryPartner: (orderId: string, partner: LogisticsPartner) => Promise<void>;
  onPackAndTransfer: (orderId: string, partnerName: string, vehicleNumber: string) => Promise<void>;
}

export const FarmerIncomingOrderModal: React.FC<FarmerIncomingOrderModalProps> = ({
  order,
  product,
  availablePartners,
  onClose,
  onRejectOrder,
  onAcceptOrder,
  onAssignDeliveryPartner,
  onPackAndTransfer,
}) => {
  if (!order) return null;

  const [step, setStep] = useState<'DECISION' | 'REJECT_REASON' | 'ASSIGN_LOGISTICS' | 'PACK_AND_TRANSFER' | 'COMPLETED'>(
    order.status === 'PLACED' 
      ? 'DECISION'
      : order.status === 'CONFIRMED' && !order.logisticsId
        ? 'ASSIGN_LOGISTICS'
        : order.status === 'CONFIRMED' || order.status === 'PREPARING' || order.status === 'PACKED'
          ? 'PACK_AND_TRANSFER'
          : 'COMPLETED'
  );

  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(
    availablePartners[0]?.id || 'usr_logistics_1'
  );
  const [rejectReason, setRejectReason] = useState<string>(
    'Harvest stock is low and currently reserved for registered local mandi lots.'
  );
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packChecklist, setPackChecklist] = useState({
    sorted: true,
    crates: true,
    sealed: true,
  });

  const orderedItem = order.items[0];
  const itemQty = orderedItem?.quantity || 1;
  const itemUnit = orderedItem?.unit || 'kg';
  const itemName = orderedItem?.name || 'Fresh Produce';
  const itemPrice = orderedItem?.price || 0;
  const itemTotal = orderedItem ? itemPrice * itemQty : order.itemsTotal;
  const cropImage = orderedItem?.image || product?.image || 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?auto=format&fit=crop&w=600&q=80';

  const currentStock = product?.quantity ?? 1200;
  const isStockCritical = currentStock <= itemQty;

  const handleConfirmReject = async () => {
    try {
      setIsSubmitting(true);
      const finalReason = customReason.trim() ? customReason.trim() : rejectReason;
      await onRejectOrder(order.id, finalReason);
      setStep('COMPLETED');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmAccept = async () => {
    try {
      setIsSubmitting(true);
      await onAcceptOrder(order.id);
      setStep('ASSIGN_LOGISTICS');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmLogistics = async () => {
    const partner = availablePartners.find(p => p.id === selectedPartnerId) || availablePartners[0];
    if (!partner) return;
    try {
      setIsSubmitting(true);
      await onAssignDeliveryPartner(order.id, partner);
      setStep('PACK_AND_TRANSFER');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmHandover = async () => {
    const partner = availablePartners.find(p => p.id === (order.logisticsId || selectedPartnerId)) || availablePartners[0];
    try {
      setIsSubmitting(true);
      await onPackAndTransfer(order.id, partner.name, partner.vehicleNumber);
      setStep('COMPLETED');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        id="farmer-incoming-order-modal"
        className="bg-white dark:bg-stone-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col my-auto transition-all"
      >
        {/* Modal Top Navigation / Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <Bell className="w-5 h-5 text-amber-300 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {step === 'DECISION' && 'Incoming Customer Crop Purchase'}
                  {step === 'REJECT_REASON' && 'Reject Order: Low Stock'}
                  {step === 'ASSIGN_LOGISTICS' && 'Assign Delivery Partner'}
                  {step === 'PACK_AND_TRANSFER' && 'Pack & Transfer to Delivery Partner'}
                  {step === 'COMPLETED' && 'Order Processed'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-emerald-950 text-[10px] font-black uppercase tracking-wider">
                  Live Dispatch
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 font-medium">
                Order #{order.id} • Customer: {order.consumerName || 'Buyer'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow Progression Stepper */}
        <div className="bg-stone-100 dark:bg-stone-800/60 px-5 py-2.5 border-b border-stone-200 dark:border-stone-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-medium">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              step === 'DECISION' || step === 'REJECT_REASON'
                ? 'bg-emerald-700 text-white' 
                : 'bg-emerald-200 text-emerald-800'
            }`}>
              1
            </span>
            <span className={step === 'DECISION' || step === 'REJECT_REASON' ? 'font-bold text-stone-900 dark:text-stone-100' : 'text-stone-500'}>
              Review & Decision
            </span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />

          <div className="flex items-center gap-2 font-medium">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              step === 'ASSIGN_LOGISTICS'
                ? 'bg-emerald-700 text-white' 
                : step === 'PACK_AND_TRANSFER' || step === 'COMPLETED'
                  ? 'bg-emerald-200 text-emerald-800'
                  : 'bg-stone-300 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
            }`}>
              2
            </span>
            <span className={step === 'ASSIGN_LOGISTICS' ? 'font-bold text-stone-900 dark:text-stone-100' : 'text-stone-500'}>
              Assign Partner
            </span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />

          <div className="flex items-center gap-2 font-medium">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              step === 'PACK_AND_TRANSFER' || step === 'COMPLETED'
                ? 'bg-emerald-700 text-white' 
                : 'bg-stone-300 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
            }`}>
              3
            </span>
            <span className={step === 'PACK_AND_TRANSFER' || step === 'COMPLETED' ? 'font-bold text-stone-900 dark:text-stone-100' : 'text-stone-500'}>
              Pack & Transfer
            </span>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 sm:p-6 space-y-5 flex-1 overflow-y-auto max-h-[70vh]">
          {/* STEP 1: DECISION (Accept or Reject due to Low Stock) */}
          {step === 'DECISION' && (
            <div className="space-y-5">
              {/* Product & Purchase Highlights Card */}
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-950/70 border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <img
                  src={cropImage}
                  alt={itemName}
                  className="w-20 h-20 rounded-xl object-cover border border-stone-200 dark:border-stone-700 shrink-0 shadow-xs"
                />
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                      Crop Request
                    </span>
                    <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                      Payment via UPI • Escrow Locked
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    {itemName}
                  </h4>
                  <div className="flex flex-wrap items-baseline gap-3 text-sm">
                    <span className="font-extrabold text-stone-900 dark:text-stone-100 text-lg">
                      {itemQty} {itemUnit}
                    </span>
                    <span className="text-xs text-stone-500">
                      @ ₹{itemPrice}/{itemUnit}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full ml-auto">
                      Escrow Payout: ₹{itemTotal}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer & Inventory Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-stone-700 dark:text-stone-300">
                    <User className="w-4 h-4 text-emerald-600" />
                    <span>Customer Details</span>
                  </div>
                  <p className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
                    {order.consumerName || 'Pooja Sharma'}
                  </p>
                  <p className="text-stone-500 dark:text-stone-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>{order.shippingAddress?.street}, {order.shippingAddress?.city}</span>
                  </p>
                  <p className="text-stone-500 dark:text-stone-400 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{order.consumerPhone || '+91 98111 44556'}</span>
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-stone-700 dark:text-stone-300">
                    <Boxes className="w-4 h-4 text-amber-600" />
                    <span>Your Farm Stock Status</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-stone-500">Available Lot:</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      {currentStock} {itemUnit}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-stone-500">Requested Amount:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      - {itemQty} {itemUnit}
                    </span>
                  </div>
                  <div className="pt-1 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between font-medium">
                    <span className="text-stone-600 dark:text-stone-300">Post-Order Stock:</span>
                    <span className={`font-bold ${currentStock - itemQty < 50 ? 'text-amber-600' : 'text-emerald-700'}`}>
                      {Math.max(0, currentStock - itemQty)} {itemUnit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Escrow Guarantee Notice */}
              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 flex items-center gap-3 text-xs text-emerald-900 dark:text-emerald-200">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <span className="font-bold">100% Escrow Protection Guaranteed: </span>
                  Customer payment of ₹{order.totalAmount} is already secured in SeedhaMandi Escrow. Funds release directly to your DBT bank account upon doorstep OTP delivery.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  id="farmer-reject-low-stock-btn"
                  onClick={() => setStep('REJECT_REASON')}
                  className="flex-1 py-3 px-4 rounded-xl border-2 border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-700 dark:text-red-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span>Reject Order (Low Stock)</span>
                </button>

                <button
                  type="button"
                  id="farmer-accept-order-btn"
                  disabled={isSubmitting}
                  onClick={handleConfirmAccept}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept Order ({itemQty} {itemUnit})</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 1.B: REJECT REASON MODAL / FORM */}
          {step === 'REJECT_REASON' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-800 dark:text-red-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Order Rejection Notice:</span>
                  <p className="mt-0.5">
                    Rejecting this order will release the customer's ₹{order.totalAmount} from escrow back to their payment method. Please select the low stock reason to update your catalog.
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <label className="font-bold text-stone-700 dark:text-stone-300 block">
                  Select Reason for Rejection:
                </label>
                {[
                  'Harvest stock is low and currently reserved for registered local mandi lots.',
                  'Insufficient available harvest yield due to sudden weather or pest damage.',
                  'Stock threshold breached: Lot quantity has fallen below minimum safety inventory.',
                  'Requested harvest batch is already fully committed to institutional buyer.',
                ].map((reason, idx) => (
                  <label
                    key={idx}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                      rejectReason === reason
                        ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 text-stone-900 dark:text-stone-100 font-semibold'
                        : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/40 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rejectReason"
                      checked={rejectReason === reason}
                      onChange={() => setRejectReason(reason)}
                      className="mt-0.5 text-red-600 focus:ring-red-500"
                    />
                    <span>{reason}</span>
                  </label>
                ))}

                <div className="pt-2">
                  <label className="text-[11px] font-bold text-stone-500 block mb-1">
                    Or write a custom farmer note (Optional):
                  </label>
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="e.g. Next fresh batch ready in 3 days; currently out of stock."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setStep('DECISION')}
                  className="px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100"
                >
                  Back
                </button>
                <button
                  type="button"
                  id="confirm-reject-order-btn"
                  disabled={isSubmitting}
                  onClick={handleConfirmReject}
                  className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                >
                  {isSubmitting ? 'Cancelling...' : 'Confirm Rejection & Refund Escrow'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ASSIGN DELIVERY PARTNER */}
          {step === 'ASSIGN_LOGISTICS' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-300 flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="font-bold">Order #{order.id} Accepted! </span>
                  Select a verified rural delivery partner to dispatch produce to {order.shippingAddress?.city}.
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Available Verified Logistics Partners ({availablePartners.length})
                </div>

                <div className="space-y-2.5">
                  {availablePartners.map((partner) => {
                    const isSelected = selectedPartnerId === partner.id;
                    return (
                      <div
                        key={partner.id}
                        onClick={() => setSelectedPartnerId(partner.id)}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-xs'
                            : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-900'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-emerald-600 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                          }`}>
                            <Truck className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                                {partner.name}
                              </h5>
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-black">
                                ★ {partner.rating}
                              </span>
                            </div>
                            <p className="text-xs text-stone-600 dark:text-stone-300 font-medium mt-0.5">
                              {partner.vehicleType} • <span className="font-mono">{partner.vehicleNumber}</span>
                            </p>
                            <p className="text-[11px] text-stone-500 mt-0.5">
                              {partner.specialty} • Hub: {partner.district}
                            </p>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between text-xs sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-100">
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>ETA: {partner.etaMinutes} mins</span>
                          </span>
                          <span className="text-stone-500 text-[11px]">
                            Freight: ₹{partner.freightEstimate} (Paid by buyer)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  id="confirm-assign-partner-btn"
                  disabled={isSubmitting}
                  onClick={handleConfirmLogistics}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Confirm Partner & Proceed to Packing</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PACK & TRANSFER TO DELIVERY PARTNER */}
          {step === 'PACK_AND_TRANSFER' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Package className="w-5 h-5 text-amber-700 shrink-0" />
                  <div>
                    <span className="font-bold">Partner Assigned: </span>
                    {order.logisticsName || 'KisanVahan Logistics (Ravi Kumar)'} ({order.vehicleNumber || 'MH 12 QX 4902'})
                    <div className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                      Carrier vehicle is en route to your farm gate for loading.
                    </div>
                  </div>
                </div>
                <span className="px-2 py-1 rounded bg-amber-200 text-amber-950 font-bold text-[10px]">
                  PICKUP READY
                </span>
              </div>

              {/* Handover Quality Checklist */}
              <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3 text-xs">
                <div className="font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider flex items-center justify-between">
                  <span>Pre-Handover Packing Verification</span>
                  <span className="text-emerald-700 font-bold text-[11px]">3 of 3 Verified</span>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={packChecklist.sorted}
                      onChange={(e) => setPackChecklist(prev => ({ ...prev, sorted: e.target.checked }))}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="text-stone-700 dark:text-stone-300">
                      Produce inspected and graded: <strong>{itemQty} {itemUnit} of {itemName}</strong>.
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={packChecklist.crates}
                      onChange={(e) => setPackChecklist(prev => ({ ...prev, crates: e.target.checked }))}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="text-stone-700 dark:text-stone-300">
                      Packed securely in ventilated food-grade farm crates / sacks.
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={packChecklist.sealed}
                      onChange={(e) => setPackChecklist(prev => ({ ...prev, sealed: e.target.checked }))}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="text-stone-700 dark:text-stone-300">
                      Affixed SeedhaMandi Dispatch Tag with Barcode & Handover PIN.
                    </span>
                  </label>
                </div>
              </div>

              {/* Delivery OTP Security Verification Card */}
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-emerald-950 dark:text-emerald-300 font-bold block text-sm">
                    Doorstep Delivery Security PIN (OTP)
                  </span>
                  <p className="text-emerald-800/80 dark:text-emerald-400 text-[11px] mt-0.5">
                    Customer provides this 6-digit PIN to carrier upon receiving produce to release Escrow payout.
                  </p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-white dark:bg-stone-900 border border-emerald-300 font-mono text-lg font-black text-emerald-900 dark:text-emerald-300 tracking-widest text-center shadow-xs">
                  {order.deliveryOtp || '741289'}
                </div>
              </div>

              {/* Handover Button */}
              <div className="pt-2">
                <button
                  type="button"
                  id="confirm-pack-transfer-btn"
                  disabled={isSubmitting || !packChecklist.sorted || !packChecklist.crates || !packChecklist.sealed}
                  onClick={handleConfirmHandover}
                  className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  <span>
                    {isSubmitting ? 'Transferring Custody...' : 'Pack & Transfer to Delivery Partner (Handover)'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: COMPLETED SUMMARY */}
          {step === 'COMPLETED' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  {order.status === 'REJECTED_LOW_STOCK' || order.status === 'CANCELLED'
                    ? 'Order Rejected Due to Low Stock'
                    : 'Consignment Handed Over to Delivery Partner!'}
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                  {order.status === 'REJECTED_LOW_STOCK' || order.status === 'CANCELLED'
                    ? `Order #${order.id} has been cancelled. Customer notified and ₹${order.totalAmount} escrow funds returned immediately.`
                    : `Your ${itemQty} ${itemUnit} lot has been loaded onto ${order.logisticsName || 'KisanVahan Logistics'} (${order.vehicleNumber || 'MH 12 QX 4902'}). Real-time GPS transit tracking is active.`}
                </p>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-xs uppercase tracking-wider shadow-sm hover:opacity-90 transition-opacity"
                >
                  Done & Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export interface IncomingOrderToastProps {
  order: Order;
  onOpenDetails: (order: Order) => void;
  onQuickReject: (order: Order) => void;
  onQuickAccept: (order: Order) => void;
  onDismiss: () => void;
}

export const FarmerIncomingOrderToast: React.FC<IncomingOrderToastProps> = ({
  order,
  onOpenDetails,
  onQuickReject,
  onQuickAccept,
  onDismiss,
}) => {
  const item = order.items[0];
  const qty = item?.quantity || 1;
  const unit = item?.unit || 'kg';
  const name = item?.name || 'Produce';
  const total = item ? item.price * qty : order.totalAmount;

  return (
    <div className="bg-white dark:bg-stone-900 border-2 border-emerald-600 dark:border-emerald-500 rounded-2xl shadow-2xl p-4 max-w-md w-full animate-in slide-in-from-top-4 duration-300 pointer-events-auto">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-300 dark:border-emerald-700 shadow-xs">
            <Bell className="w-5 h-5 text-emerald-600 animate-bounce" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                New Customer Order
              </span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                ₹{total} Escrow
              </span>
            </div>
            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug">
              {order.consumerName || 'Customer'} wants to buy {qty} {unit} of {name}
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-stone-400" />
              <span>{order.shippingAddress?.city || 'Bengaluru'} • Order #{order.id}</span>
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-stone-400 hover:text-stone-600 p-1 rounded-md"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => onQuickReject(order)}
          className="flex-1 py-2 px-2.5 rounded-lg border border-red-300 dark:border-red-900/60 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
        >
          <XCircle className="w-3.5 h-3.5 text-red-500" />
          <span>Reject (Low Stock)</span>
        </button>

        <button
          type="button"
          onClick={() => onQuickAccept(order)}
          className="flex-1 py-2 px-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 shadow-xs transition-colors"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Accept & Assign</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenDetails(order)}
          className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 text-[11px] font-bold"
          title="View Full Details"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export interface DemoPurchaseTriggerProps {
  products: Product[];
  onTriggerDemo: (preset?: {
    productId?: string;
    quantity?: number;
    customerName?: string;
    customerCity?: string;
  }) => Promise<void>;
  isSimulating: boolean;
}

export const DemoPurchaseTriggerButton: React.FC<DemoPurchaseTriggerProps> = ({
  products,
  onTriggerDemo,
  isSimulating,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const presets = [
    {
      title: 'Pooja Sharma • 50 kg Red Onions',
      subtitle: 'Indiranagar, Bengaluru • ₹1,400 Escrow',
      customerName: 'Pooja Sharma',
      customerCity: 'Indiranagar, Bengaluru',
      quantity: 50,
      cropKeyword: 'Onion',
    },
    {
      title: 'Rohan Mehra • 30 kg Vine Tomatoes',
      subtitle: 'Koramangala, Bengaluru • ₹960 Escrow',
      customerName: 'Rohan Mehra',
      customerCity: 'Koramangala, Bengaluru',
      quantity: 30,
      cropKeyword: 'Tomato',
    },
    {
      title: 'Hotel Green Leaf • 120 kg Potato (Bulk)',
      subtitle: 'MG Road, Bengaluru • ₹2,640 Escrow',
      customerName: 'Hotel Green Leaf (Procurement)',
      customerCity: 'MG Road, Bengaluru',
      quantity: 120,
      cropKeyword: 'Potato',
    },
  ];

  const handleSelectPreset = async (preset: typeof presets[0]) => {
    setIsOpen(false);
    const matchedProduct = products.find(p => p.name.toLowerCase().includes(preset.cropKeyword.toLowerCase())) || products[0];
    await onTriggerDemo({
      productId: matchedProduct?.id,
      quantity: preset.quantity,
      customerName: preset.customerName,
      customerCity: preset.customerCity,
    });
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        id="demo-simulate-purchase-trigger-btn"
        disabled={isSimulating}
        onClick={() => setIsOpen(!isOpen)}
        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-sm hover:shadow flex items-center gap-2 transition-all cursor-pointer border border-emerald-500/50"
      >
        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
        <span>{isSimulating ? 'Simulating Purchase...' : '⚡ Demo: Simulate Customer Purchase'}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-stone-900 rounded-xl shadow-2xl border border-stone-200 dark:border-stone-700 p-3 z-50 space-y-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h5 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                Simulate Customer Buy Request
              </h5>
              <p className="text-[10px] text-stone-500">
                Triggers notification & test fulfillment flow
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-stone-400 hover:text-stone-600 text-xs p-1"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1.5">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className="w-full text-left p-2.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-all text-xs"
              >
                <div className="font-bold text-stone-800 dark:text-stone-200">
                  {p.title}
                </div>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                  {p.subtitle}
                </div>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-stone-100 dark:border-stone-800 text-[10px] text-stone-400 text-center">
            Simulates a real customer buying crops from your inventory
          </div>
        </div>
      )}
    </div>
  );
};
