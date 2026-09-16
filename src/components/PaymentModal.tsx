import React, { useState } from 'react';
import { 
  X, 
  QrCode, 
  CreditCard, 
  Building, 
  ShieldCheck, 
  CheckCircle2, 
  Smartphone, 
  Lock, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PaymentMethod } from '../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  itemsTotal: number;
  logisticsFee: number;
  onPaymentSuccess: (method: PaymentMethod) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  itemsTotal,
  logisticsFee,
  onPaymentSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('UPI');
  const [upiId, setUpiId] = useState('buyer@okhdfcbank');
  const [processing, setProcessing] = useState(false);
  const [paid, setPaid] = useState(false);

  if (!isOpen) return null;

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setPaid(true);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore if not supported
      }
      setTimeout(() => {
        onPaymentSuccess(selectedMethod);
        onClose();
        setPaid(false);
      }, 1800);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 transition-colors w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black">
              <ShieldCheck className="w-6 h-6 text-emerald-950" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">SeedhaMandi Secure Checkout</h3>
              <p className="text-xs text-emerald-200">Zero Middleman Escrow Protection Guarantee</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {paid ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-xl">Payment Verified & Escrow Locked!</h4>
            <p className="text-xs text-stone-600 dark:text-stone-300 max-w-xs mx-auto">
              Your payment of <span className="font-bold text-stone-900 dark:text-stone-100">₹{totalAmount}</span> is safely secured. Funds will only release to the farmer upon verified doorstep delivery.
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Price Breakdown Banner */}
            <div className="p-3.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600 dark:text-stone-300">
                <span>Direct Farmer Harvest (100% to grower):</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100">₹{itemsTotal}</span>
              </div>
              <div className="flex justify-between text-stone-600 dark:text-stone-300">
                <span>Cold Chain Farm Logistics:</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100">₹{logisticsFee}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Middleman Broker Commission:</span>
                <span className="line-through text-stone-400">₹{Math.round(itemsTotal * 0.35)}</span>
                <span className="font-bold text-emerald-700">₹0 (Zero Fee)</span>
              </div>
              <div className="pt-2 border-t border-stone-200 dark:border-stone-700 flex justify-between items-center text-sm font-bold text-stone-900 dark:text-stone-100">
                <span>Total Payable:</span>
                <span className="text-lg text-emerald-800">₹{totalAmount}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                Choose Payment Method
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('UPI')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    selectedMethod === 'UPI'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                      : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-emerald-700 mb-1" />
                  <span className="text-xs">UPI / QR Code</span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-normal">GPay, PhonePe, Paytm</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('ESCROW_COD')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    selectedMethod === 'ESCROW_COD'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                      : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5 text-emerald-700 mb-1" />
                  <span className="text-xs">Escrow on Delivery</span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-normal">Inspect then Pay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('CARD')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    selectedMethod === 'CARD'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                      : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-emerald-700 mb-1" />
                  <span className="text-xs">Debit / Credit Card</span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-normal">Visa, RuPay, Master</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('NET_BANKING')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    selectedMethod === 'NET_BANKING'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                      : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <Building className="w-5 h-5 text-emerald-700 mb-1" />
                  <span className="text-xs">Net Banking</span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-normal">SBI, HDFC, ICICI, BoB</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('KISAN_CREDIT')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    selectedMethod === 'KISAN_CREDIT'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                      : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <Sparkles className="w-5 h-5 text-amber-600 mb-1" />
                  <span className="text-xs">Kisan Credit / DBT</span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-normal">NABARD Subsidized</span>
                </button>
              </div>
            </div>

            {/* Method Details Pane */}
            {selectedMethod === 'UPI' && (
              <div className="p-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-xl space-y-3 text-center">
                <div className="w-32 h-32 bg-white dark:bg-stone-900 border-2 border-emerald-600 rounded-xl mx-auto p-2 flex flex-col items-center justify-center shadow-xs">
                  {/* Visual QR Simulator */}
                  <QrCode className="w-24 h-24 text-stone-800 dark:text-stone-200" />
                  <span className="text-[9px] font-mono text-emerald-800 font-bold">BHIM UPI QR</span>
                </div>
                <div className="text-xs text-stone-600 dark:text-stone-300">
                  Scan with any UPI app to pay <span className="font-bold text-stone-900 dark:text-stone-100">₹{totalAmount}</span>
                </div>
                <div className="flex items-center gap-2 max-w-xs mx-auto">
                  <input
                    type="text"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    placeholder="Enter UPI VPA (e.g. user@okhdfc)"
                    className="flex-1 bg-white dark:bg-stone-900 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            )}

            {selectedMethod === 'ESCROW_COD' && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2">
                <div className="flex items-start gap-2 text-emerald-900 font-bold">
                  <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>How SeedhaMandi Doorstep Escrow Works:</span>
                </div>
                <p className="text-stone-600 dark:text-stone-300 leading-relaxed pl-6">
                  1. You inspect the fresh farm harvest crate when the driver arrives.
                  <br />
                  2. Driver requests your 6-digit delivery OTP.
                  <br />
                  3. You pay cash or scan driver's QR code only after you are 100% satisfied.
                </p>
              </div>
            )}

            {selectedMethod === 'CARD' && (
              <div className="p-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-xl space-y-2 text-xs">
                <input
                  type="text"
                  placeholder="Card Number (XXXX XXXX XXXX XXXX)"
                  className="w-full bg-white dark:bg-stone-900 border border-stone-300 rounded-lg px-3 py-2 text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="MM / YY"
                    className="bg-white dark:bg-stone-900 transition-colors border border-stone-300 rounded-lg px-3 py-2 text-xs"
                  />
                  <input
                    type="password"
                    placeholder="CVV"
                    className="bg-white dark:bg-stone-900 transition-colors border border-stone-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>
            )}

            {/* Pay Action Button */}
            <button
              onClick={handlePay}
              disabled={processing}
              className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-98"
            >
              <Lock className="w-4 h-4 text-amber-300" />
              <span>
                {processing ? 'Processing Secure Escrow...' : `Authorize & Confirm Payment (₹${totalAmount})`}
              </span>
              {!processing && <ArrowRight className="w-4 h-4" />}
            </button>

            <div className="flex items-center justify-center gap-4 text-[11px] text-stone-500 dark:text-stone-400">
              <span>256-bit TLS Encryption</span>
              <span>•</span>
              <span>NPCI / RBI Compliant</span>
              <span>•</span>
              <span>Instant Refund Protection</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
