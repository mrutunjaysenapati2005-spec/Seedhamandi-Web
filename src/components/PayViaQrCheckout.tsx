import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Sprout, 
  Truck, 
  CheckCircle2, 
  ArrowRight, 
  Smartphone, 
  Lock, 
  Sparkles,
  Zap,
  Info,
  Clock,
  Building,
  CreditCard,
  Layers,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DynamicUpiQr } from './DynamicUpiQr';
import { playUpiPaymentChime } from '../utils/upiSound';
import { PaymentMethod } from '../types';

interface PayViaQrCheckoutProps {
  totalAmount: number;
  itemsTotal: number;
  logisticsFee: number;
  wholesaleDiscount: number;
  farmerNames: string[];
  vehicleName: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  onPaymentComplete: (method: PaymentMethod, txnDetails?: any) => Promise<void>;
  onCancel?: () => void;
}

export const PayViaQrCheckout: React.FC<PayViaQrCheckoutProps> = ({
  totalAmount,
  itemsTotal,
  logisticsFee,
  wholesaleDiscount,
  farmerNames,
  vehicleName,
  shippingAddress,
  onPaymentComplete,
  onCancel,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('UPI');
  const [simState, setSimState] = useState<'IDLE' | 'SCANNING' | 'SPLITTING' | 'CONFIRMED'>('IDLE');
  const [upiVpa, setUpiVpa] = useState('ananya.buyer@okhdfcbank');
  const [txnId, setTxnId] = useState(() => 'SM_' + Math.floor(100000000 + Math.random() * 900000000));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const primaryFarmer = farmerNames[0] || 'Ramesh Patel';
  const savedBrokerCut = Math.round(itemsTotal * 0.30);

  const handleSimulateUpiPayment = async () => {
    setErrorMessage(null);
    setSimState('SCANNING');

    // Step 1: Scan & Handshake
    setTimeout(() => {
      setSimState('SPLITTING');

      // Step 2: Instant Dual-Split Settlement
      setTimeout(async () => {
        // Play authentic UPI Soundbox Melodic Chime!
        playUpiPaymentChime();

        // Confetti burst
        try {
          confetti({
            particleCount: 90,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch (e) {
          // ignore
        }

        setSimState('CONFIRMED');

        // Step 3: Trigger order creation on backend
        try {
          await onPaymentComplete('UPI', {
            txnId,
            farmerPayout: itemsTotal,
            logisticsPayout: logisticsFee,
          });
        } catch (err: any) {
          setErrorMessage(err.message || 'Payment processing failed. Please try again.');
          setSimState('IDLE');
        }
      }, 1500);
    }, 1200);
  };

  const handleOtherMethodPay = async (method: PaymentMethod) => {
    setSimState('SCANNING');
    setTimeout(async () => {
      playUpiPaymentChime();
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}

      setSimState('CONFIRMED');
      try {
        await onPaymentComplete(method, {
          txnId: 'REF_' + Date.now(),
          farmerPayout: itemsTotal,
          logisticsPayout: logisticsFee,
        });
      } catch (err: any) {
        setErrorMessage(err.message || 'Payment failed');
        setSimState('IDLE');
      }
    }, 1200);
  };

  return (
    <div className="space-y-4">
      {/* Simulation In-Progress Overlay/Card if active */}
      {simState === 'SCANNING' && (
        <div className="p-5 bg-emerald-950 text-white rounded-2xl shadow-xl border border-emerald-700 text-center space-y-3 animate-in fade-in">
          <div className="w-12 h-12 rounded-full bg-emerald-800 text-amber-300 flex items-center justify-center mx-auto animate-spin">
            <Zap className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-sm text-amber-300">
            Handshaking with BHIM UPI / NPCI Switch...
          </h4>
          <p className="text-xs text-emerald-200">
            Authorizing payment of <strong className="text-white">₹{totalAmount}</strong> and reserving SeedhaMandi Escrow contract.
          </p>
          <div className="w-full bg-emerald-900 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-400 h-full w-2/3 animate-pulse" />
          </div>
        </div>
      )}

      {simState === 'SPLITTING' && (
        <div className="p-5 bg-stone-900 text-white rounded-2xl shadow-xl border border-amber-500/50 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-xs">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>INSTANT DIRECT SPLIT SETTLEMENT IN PROGRESS</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-900/60 border border-emerald-500/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sprout className="w-4 h-4 text-emerald-400" />
                <span>Crediting Farmer {primaryFarmer}</span>
              </div>
              <span className="font-mono font-bold text-emerald-300">₹{itemsTotal}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-900/60 border border-blue-500/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-400" />
                <span>Crediting Bhubaneswar Logistics</span>
              </div>
              <span className="font-mono font-bold text-blue-300">₹{logisticsFee}</span>
            </div>
          </div>

          <p className="text-[11px] text-stone-400 text-center font-mono">
            Zero Brokerage Deductions (100% value transmitted)
          </p>
        </div>
      )}

      {simState === 'CONFIRMED' && (
        <div className="p-6 bg-emerald-50 border-2 border-emerald-500 rounded-2xl text-center space-y-3 animate-in zoom-in-95">
          <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-black text-stone-900 dark:text-stone-100 text-base">UPI Payment & Settlement Verified!</h4>
            <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
              Ref: <span className="font-mono font-bold text-emerald-800">{txnId}</span>
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-emerald-200 text-xs space-y-1 text-left">
            <div className="flex items-center justify-between text-stone-700 dark:text-stone-300">
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600 font-black" />
                <span>Instant Farmer Credit ({primaryFarmer}):</span>
              </span>
              <strong className="text-emerald-800 font-mono">₹{itemsTotal}</strong>
            </div>
            <div className="flex items-center justify-between text-stone-700 dark:text-stone-300">
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-blue-600 font-black" />
                <span>Instant Logistics Credit ({vehicleName.split(' ')[0]}):</span>
              </span>
              <strong className="text-blue-800 font-mono">₹{logisticsFee}</strong>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl font-medium">
          {errorMessage}
        </div>
      )}

      {/* Payment Options Selection Tabs */}
      {simState === 'IDLE' && (
        <div className="space-y-4">
          {/* Method Tabs */}
          <div>
            <label className="block text-[11px] font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
              Select Payment Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMethod('UPI')}
                className={`p-3 rounded-xl border-2 text-left transition relative cursor-pointer ${
                  selectedMethod === 'UPI'
                    ? 'border-emerald-600 bg-emerald-50/80 shadow-xs'
                    : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-700" />
                    <span>Pay via UPI QR</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-400 text-stone-950 font-black text-[9px] uppercase">
                    Instant
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">
                  GPay, PhonePe, Paytm, BHIM with zero middleman fee
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('ESCROW_COD')}
                className={`p-3 rounded-xl border-2 text-left transition relative cursor-pointer ${
                  selectedMethod === 'ESCROW_COD'
                    ? 'border-emerald-600 bg-emerald-50/80 shadow-xs'
                    : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Doorstep Escrow</span>
                  </span>
                  <span className="text-[10px] text-stone-400 font-medium">COD</span>
                </div>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">
                  Inspect produce at doorstep, then scan & pay
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('CARD')}
                className={`p-3 rounded-xl border-2 text-left transition relative cursor-pointer ${
                  selectedMethod === 'CARD'
                    ? 'border-emerald-600 bg-emerald-50/80 shadow-xs'
                    : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-stone-700 dark:text-stone-300" />
                    <span>Card / NetBanking</span>
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">
                  RuPay, Visa, Master, SBI, HDFC
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('KISAN_CREDIT')}
                className={`p-3 rounded-xl border-2 text-left transition relative cursor-pointer ${
                  selectedMethod === 'KISAN_CREDIT'
                    ? 'border-emerald-600 bg-emerald-50/80 shadow-xs'
                    : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Kisan Credit / DBT</span>
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">
                  NABARD subsidized mandi line
                </p>
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* PRIMARY 'PAY VIA QR' UPI VIEW                                  */}
          {/* ============================================================== */}
          {selectedMethod === 'UPI' && (
            <div className="space-y-4">
              {/* Instant Split Transparency Banner */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-900 to-stone-900 text-white rounded-2xl shadow-sm space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-extrabold text-amber-300">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Instant Direct Settlement Routing</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-200 bg-white/10 px-2 py-0.5 rounded-full">
                    Zero Commission
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <div className="text-[10px] text-emerald-200 font-medium">To Farmer ({primaryFarmer}):</div>
                    <div className="text-base font-black text-white mt-0.5">₹{itemsTotal}</div>
                    <div className="text-[9px] text-emerald-300">100% direct harvest payout</div>
                  </div>

                  <div className="p-2 bg-white/10 rounded-xl">
                    <div className="text-[10px] text-blue-200 font-medium">To Logistics Partner:</div>
                    <div className="text-base font-black text-white mt-0.5">₹{logisticsFee}</div>
                    <div className="text-[9px] text-blue-300">Direct Bhubaneswar transit</div>
                  </div>
                </div>

                <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[11px] text-emerald-200">
                  <span>Traditional Middleman Commission:</span>
                  <span className="line-through text-stone-400">₹{savedBrokerCut}</span>
                  <span className="font-bold text-amber-300">₹0 (100% Saved!)</span>
                </div>
              </div>

              {/* Dynamic QR Terminal */}
              <DynamicUpiQr
                amount={totalAmount}
                transactionRef={txnId}
                isScanning={simState === 'SCANNING'}
                onRefresh={() => setTxnId('SM_' + Math.floor(100000000 + Math.random() * 900000000))}
              />

              {/* UPI VPA Custom Entry (Optional) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                  Or Pay via UPI VPA Handle
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={upiVpa}
                    onChange={e => setUpiVpa(e.target.value)}
                    placeholder="e.g. mobile@upi or name@okhdfc"
                    className="flex-1 bg-white dark:bg-stone-900 border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-600 shadow-2xs"
                  />
                </div>
              </div>

              {/* Main Simulation CTA Button */}
              <button
                type="button"
                onClick={handleSimulateUpiPayment}
                className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-amber-300" />
                <span>Simulate UPI Scan & Pay (₹{totalAmount})</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-[11px] text-center text-stone-500 dark:text-stone-400 flex items-center justify-center gap-2">
                <span>🛡️ NPCI Switch</span>
                <span>•</span>
                <span>Instant Bank IMPS</span>
                <span>•</span>
                <span>Escrow Safe</span>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* ESCROW ON DELIVERY VIEW                                        */}
          {/* ============================================================== */}
          {selectedMethod === 'ESCROW_COD' && (
            <div className="space-y-3 p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs">
              <div className="flex items-start gap-2 text-emerald-950 font-bold">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <h5 className="font-extrabold text-sm">How SeedhaMandi Doorstep Escrow Operates:</h5>
                  <p className="text-[11px] text-stone-600 dark:text-stone-300 font-normal mt-0.5">
                    You only authorize release of funds after physical quality inspection.
                  </p>
                </div>
              </div>

              <ol className="list-decimal pl-5 space-y-1.5 text-stone-700 dark:text-stone-300 text-[11px]">
                <li>Farmer prepares and packs crates with SeedhaMandi digital seals.</li>
                <li>Driver arrives at your doorstep in Bhubaneswar corridor.</li>
                <li>You inspect the produce freshness and share your 6-digit Delivery OTP.</li>
                <li>You pay ₹{totalAmount} via Cash or Driver QR on delivery.</li>
              </ol>

              <button
                type="button"
                onClick={() => handleOtherMethodPay('ESCROW_COD')}
                className="w-full mt-3 py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-xs transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Place Order with Doorstep Escrow (₹{totalAmount})</span>
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* CARD / NETBANKING VIEW                                         */}
          {/* ============================================================== */}
          {(selectedMethod === 'CARD' || selectedMethod === 'NET_BANKING') && (
            <div className="space-y-3 p-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-2xl text-xs">
              <div className="space-y-2">
                <label className="block font-bold text-stone-700 dark:text-stone-300">Card Number</label>
                <input
                  type="text"
                  placeholder="4242 •••• •••• 4242"
                  className="w-full bg-white dark:bg-stone-900 border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="MM / YY"
                    className="bg-white dark:bg-stone-900 transition-colors border border-stone-300 rounded-xl px-3 py-2 text-xs"
                  />
                  <input
                    type="password"
                    placeholder="CVV"
                    className="bg-white dark:bg-stone-900 transition-colors border border-stone-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOtherMethodPay(selectedMethod)}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs transition shadow-xs cursor-pointer"
              >
                Pay ₹{totalAmount} via Card Escrow
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* KISAN CREDIT VIEW                                              */}
          {/* ============================================================== */}
          {selectedMethod === 'KISAN_CREDIT' && (
            <div className="space-y-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs">
              <div className="font-bold text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>NABARD Kisan Credit Card / DBT Agro Subsidized Line</span>
              </div>
              <p className="text-[11px] text-amber-900">
                Direct debit from subsidized agricultural accounts for bulk procurement, FPOs, and certified institutional canteens.
              </p>
              <button
                type="button"
                onClick={() => handleOtherMethodPay('KISAN_CREDIT')}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition shadow-xs cursor-pointer"
              >
                Authorize Kisan DBT Charge (₹{totalAmount})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
