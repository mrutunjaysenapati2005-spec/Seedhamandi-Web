import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  RotateCw, 
  Smartphone, 
  Copy, 
  Check, 
  ShieldCheck, 
  Sparkles,
  Zap
} from 'lucide-react';

interface DynamicUpiQrProps {
  amount: number;
  transactionRef: string;
  isScanning?: boolean;
  onRefresh?: () => void;
}

export const DynamicUpiQr: React.FC<DynamicUpiQrProps> = ({
  amount,
  transactionRef,
  isScanning = false,
  onRefresh,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(300); // 5 minutes
  const [copied, setCopied] = useState(false);
  const upiId = 'seedhamandi.direct@icici';
  const upiPayload = `upi://pay?pa=${upiId}&pn=SeedhaMandi%20Agro%20Direct&am=${amount}&cu=INR&tr=${transactionRef}&tn=Direct%20Farmgate%20Harvest%20Payout`;

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining(prev => (prev > 1 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopyUpi = () => {
    try {
      navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // fallback
    }
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      {/* QR Container Frame with NPCI / BHIM standard styling */}
      <div className="relative p-4 bg-white rounded-2xl border-2 border-emerald-600 shadow-md flex flex-col items-center">
        {/* Top BHIM UPI pill */}
        <div className="flex items-center justify-between w-full pb-2 mb-2 border-b border-stone-100 text-[11px]">
          <div className="flex items-center gap-1 font-black text-stone-800">
            <span className="text-emerald-700 font-extrabold tracking-tight">BHIM</span>
            <span className="px-1 py-0.2 bg-amber-400 text-emerald-950 rounded font-black text-[9px]">UPI</span>
            <span className="text-stone-400 font-normal">| BharatQR</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
            ₹{amount}
          </span>
        </div>

        {/* The QR Matrix Canvas/SVG */}
        <div className="relative w-48 h-48 bg-stone-50 rounded-xl p-2 flex items-center justify-center overflow-hidden border border-stone-200/80">
          {/* Custom crisp SVG Barcode Matrix with authentic corners & data cells */}
          <svg viewBox="0 0 160 160" className="w-full h-full">
            {/* Background */}
            <rect width="160" height="160" fill="#ffffff" rx="8" />

            {/* Top-Left Finder Pattern */}
            <rect x="10" y="10" width="38" height="38" fill="#064e3b" rx="4" />
            <rect x="16" y="16" width="26" height="26" fill="#ffffff" rx="2" />
            <rect x="22" y="22" width="14" height="14" fill="#047857" rx="2" />

            {/* Top-Right Finder Pattern */}
            <rect x="112" y="10" width="38" height="38" fill="#064e3b" rx="4" />
            <rect x="118" y="16" width="26" height="26" fill="#ffffff" rx="2" />
            <rect x="124" y="22" width="14" height="14" fill="#047857" rx="2" />

            {/* Bottom-Left Finder Pattern */}
            <rect x="10" y="112" width="38" height="38" fill="#064e3b" rx="4" />
            <rect x="16" y="118" width="26" height="26" fill="#ffffff" rx="2" />
            <rect x="22" y="124" width="14" height="14" fill="#047857" rx="2" />

            {/* Timing & Alignment Patterns */}
            <g fill="#0f172a">
              {/* Horizontal timing pattern */}
              <rect x="52" y="26" width="6" height="6" />
              <rect x="64" y="26" width="6" height="6" />
              <rect x="76" y="26" width="6" height="6" />
              <rect x="88" y="26" width="6" height="6" />
              <rect x="100" y="26" width="6" height="6" />

              {/* Vertical timing pattern */}
              <rect x="26" y="52" width="6" height="6" />
              <rect x="26" y="64" width="6" height="6" />
              <rect x="26" y="76" width="6" height="6" />
              <rect x="26" y="88" width="6" height="6" />
              <rect x="26" y="100" width="6" height="6" />

              {/* Alignment pattern near bottom right */}
              <rect x="104" y="104" width="22" height="22" fill="#064e3b" rx="3" />
              <rect x="108" y="108" width="14" height="14" fill="#ffffff" rx="1" />
              <rect x="112" y="112" width="6" height="6" fill="#047857" />

              {/* High-density decorative QR data blocks */}
              <rect x="54" y="12" width="5" height="5" />
              <rect x="66" y="12" width="5" height="5" />
              <rect x="78" y="12" width="5" height="5" />
              <rect x="92" y="12" width="5" height="5" />

              <rect x="52" y="38" width="5" height="5" />
              <rect x="62" y="44" width="5" height="5" />
              <rect x="74" y="38" width="5" height="5" />
              <rect x="86" y="44" width="5" height="5" />
              <rect x="98" y="38" width="5" height="5" />

              <rect x="12" y="54" width="5" height="5" />
              <rect x="38" y="54" width="5" height="5" />
              <rect x="54" y="54" width="5" height="5" />
              <rect x="66" y="54" width="5" height="5" />
              <rect x="80" y="54" width="5" height="5" />
              <rect x="94" y="54" width="5" height="5" />
              <rect x="112" y="54" width="5" height="5" />
              <rect x="126" y="54" width="5" height="5" />
              <rect x="140" y="54" width="5" height="5" />

              <rect x="12" y="70" width="5" height="5" />
              <rect x="38" y="70" width="5" height="5" />
              <rect x="54" y="70" width="5" height="5" />
              <rect x="66" y="70" width="5" height="5" />
              <rect x="90" y="70" width="5" height="5" />
              <rect x="104" y="70" width="5" height="5" />
              <rect x="118" y="70" width="5" height="5" />
              <rect x="136" y="70" width="5" height="5" />

              <rect x="12" y="86" width="5" height="5" />
              <rect x="38" y="86" width="5" height="5" />
              <rect x="54" y="86" width="5" height="5" />
              <rect x="72" y="86" width="5" height="5" />
              <rect x="88" y="86" width="5" height="5" />
              <rect x="102" y="86" width="5" height="5" />
              <rect x="120" y="86" width="5" height="5" />
              <rect x="138" y="86" width="5" height="5" />

              <rect x="52" y="102" width="5" height="5" />
              <rect x="68" y="102" width="5" height="5" />
              <rect x="84" y="102" width="5" height="5" />

              <rect x="54" y="118" width="5" height="5" />
              <rect x="70" y="118" width="5" height="5" />
              <rect x="86" y="118" width="5" height="5" />
              <rect x="136" y="118" width="5" height="5" />

              <rect x="54" y="134" width="5" height="5" />
              <rect x="68" y="134" width="5" height="5" />
              <rect x="82" y="134" width="5" height="5" />
              <rect x="96" y="134" width="5" height="5" />
              <rect x="136" y="134" width="5" height="5" />
              <rect x="144" y="134" width="5" height="5" />
            </g>

            {/* Central Badge: SeedhaMandi Direct Escrow Shield */}
            <rect x="62" y="62" width="36" height="36" rx="8" fill="#ffffff" stroke="#059669" strokeWidth="2.5" />
            <circle cx="80" cy="80" r="13" fill="#ecfdf5" />
            <text x="80" y="85" textAnchor="middle" fontSize="13" fontWeight="900" fill="#047857" fontFamily="sans-serif">₹</text>
          </svg>

          {/* Active Laser Scan Animation when simulating */}
          {isScanning && (
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-bounce duration-700" />
          )}
        </div>

        {/* Scan instruction */}
        <div className="mt-2 text-center">
          <p className="text-[11px] font-bold text-stone-800 flex items-center justify-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
            <span>Scan with any UPI Application</span>
          </p>
          <p className="text-[10px] text-stone-400 font-mono mt-0.5">
            Ref: {transactionRef}
          </p>
        </div>

        {/* UPI VPA Copy Pill */}
        <div className="mt-2 flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-[11px]">
          <span className="font-mono text-stone-700 select-all">{upiId}</span>
          <button
            onClick={handleCopyUpi}
            type="button"
            className="text-stone-400 hover:text-emerald-700 transition p-0.5"
            title="Copy UPI ID"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expiry and Refresh */}
        <div className="w-full mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-500">
          <span>Expires in: <strong className="text-amber-700 font-mono">{formatTime(secondsRemaining)}</strong></span>
          <button
            type="button"
            onClick={() => {
              setSecondsRemaining(300);
              if (onRefresh) onRefresh();
            }}
            className="flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-medium cursor-pointer"
          >
            <RotateCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Supported UPI Apps Row */}
      <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-stone-600">
        <span className="px-2 py-0.5 bg-stone-100 rounded border border-stone-200">GPay</span>
        <span className="px-2 py-0.5 bg-stone-100 rounded border border-stone-200">PhonePe</span>
        <span className="px-2 py-0.5 bg-stone-100 rounded border border-stone-200">Paytm</span>
        <span className="px-2 py-0.5 bg-stone-100 rounded border border-stone-200">BHIM</span>
        <span className="px-2 py-0.5 bg-stone-100 rounded border border-stone-200">CRED</span>
      </div>
    </div>
  );
};
