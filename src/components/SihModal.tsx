import React from 'react';
import { 
  X, 
  Trophy, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight, 
  Truck, 
  Users, 
  Sparkles, 
  Scale, 
  ShieldCheck, 
  BarChart3, 
  Leaf, 
  MapPin,
  Cpu,
  Layers,
  ArrowUpRight,
  Clock,
  Fuel
} from 'lucide-react';

interface SihModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToAi: () => void;
  onNavigateToLogistics: () => void;
  onNavigateToMarketplace: () => void;
}

export const SihModal: React.FC<SihModalProps> = ({
  isOpen,
  onClose,
  onNavigateToAi,
  onNavigateToLogistics,
  onNavigateToMarketplace,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white p-6 sm:p-7 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-amber-400 text-stone-950 text-xs font-black tracking-wider uppercase flex items-center gap-1.5 shadow-xs">
              <Trophy className="w-3.5 h-3.5 text-stone-950" />
              Smart India Hackathon (SIH) Prototype
            </span>
            <span className="text-xs text-emerald-200 font-semibold hidden sm:inline">
              Track: Agriculture, FoodTech & Rural Logistics
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Direct Farm-to-Fork Digital Mandi with AI Logistics & Demand Forecasting
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-2xl leading-relaxed">
            Eliminating exploitative APMC intermediary layers through direct farmgate transactions, multimodal logistics matching, and predictive AI.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-6 overflow-y-auto">
          {/* 3 Core Benefits Showcase (As requested in Problem Statement) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-500">
              Target Impact & Core Benefits
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Benefit 1 */}
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-amber-200 text-amber-950">
                    <TrendingUp className="w-5 h-5" />
                  </span>
                  <span className="text-xs font-black text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-full">
                    +25% to +42% Gain
                  </span>
                </div>
                <h4 className="font-extrabold text-stone-900 text-sm">Better Prices for Farmers</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Bypasses 4 tiers of village aggregators & commission brokers. Direct escrow payout released to Jan Dhan / DBT accounts upon OTP confirmation.
                </p>
              </div>

              {/* Benefit 2 */}
              <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-emerald-200 text-emerald-950">
                    <Scale className="w-5 h-5" />
                  </span>
                  <span className="text-xs font-black text-emerald-900 bg-emerald-200/70 px-2 py-0.5 rounded-full">
                    18% - 28% Savings
                  </span>
                </div>
                <h4 className="font-extrabold text-stone-900 text-sm">Lower Prices for Consumers & Bulk Buyers</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Direct harvest purchase without broker markups. High volume wholesale pricing for hotels, caterers, and food processing institutions.
                </p>
              </div>

              {/* Benefit 3 */}
              <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-blue-200 text-blue-950">
                    <Truck className="w-5 h-5" />
                  </span>
                  <span className="text-xs font-black text-blue-900 bg-blue-200/70 px-2 py-0.5 rounded-full">
                    -65% Waste & -28% Fuel
                  </span>
                </div>
                <h4 className="font-extrabold text-stone-900 text-sm">Reduced Supply Chain Inefficiencies</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Multimodal fleet matching (Tractor, Tata Ace, Reefer Van, Scooty). Multi-stop AI route optimization prevents perishability loss and deadhead miles.
                </p>
              </div>
            </div>
          </div>

          {/* Solution Architecture Matrix */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-500">
              Comprehensive Solution Architecture
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>1. Direct Marketplace (B2C & B2B Bulk)</span>
                </div>
                <ul className="text-xs text-stone-600 space-y-1.5 list-disc list-inside">
                  <li>Individual retail basket + Bulk Mandi Procurement (≥50kg to 5,000kg).</li>
                  <li>Institutional Buyer RFQ (Request for Quotation) engine with FPO matching.</li>
                  <li>FPO Representative proxy listing for smartphone-free smallholders.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50 space-y-2">
                <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span>2. Multimodal Logistics Support</span>
                </div>
                <ul className="text-xs text-stone-600 space-y-1.5 list-disc list-inside">
                  <li>Automatic vehicle dispatch: 🚜 Tractor, 🚚 Tata Ace, 🛵 Scooty, ❄️ Reefer.</li>
                  <li>Bhubaneswar live corridor map with real-time accept/reject carrier bidding.</li>
                  <li>Tamper-proof 6-digit delivery OTP releasing escrow directly to the farmer.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>3. AI Demand Forecasting Engine</span>
                </div>
                <ul className="text-xs text-stone-600 space-y-1.5 list-disc list-inside">
                  <li>Gemini AI analyzes regional mandi arrivals & retail price surges.</li>
                  <li>Predictive 7-day crop price curves & optimal harvest timing windows.</li>
                  <li>Multilingual voice/text chat advisor in English, Hindi & Odia.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50 space-y-2">
                <div className="flex items-center gap-2 text-purple-800 font-bold text-sm">
                  <Fuel className="w-4 h-4 text-purple-600" />
                  <span>4. AI Multi-Stop Route Optimization</span>
                </div>
                <ul className="text-xs text-stone-600 space-y-1.5 list-disc list-inside">
                  <li>Multi-point rural farm pickup sequencing to urban wholesale depot.</li>
                  <li>Perishability-first loading algorithm protects fragile tomatoes & mangoes.</li>
                  <li>Calculates exact distance saved (km), diesel fuel cut (Liters), & CO2 saved.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Demo Navigation Links */}
          <div className="p-4 rounded-2xl bg-emerald-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs text-emerald-300 font-bold uppercase">Explore Prototype Modules</span>
              <p className="text-sm font-extrabold text-white">Test all capabilities built for the hackathon jury</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onNavigateToAi();
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Forecast & Route Engine</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  onNavigateToLogistics();
                }}
                className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Truck className="w-4 h-4" />
                <span>Logistics Fleet Grid</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  onNavigateToMarketplace();
                }}
                className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <span>Bulk & Retail Market</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
