import React from 'react';
import { Sprout, ShieldCheck, Truck, HeartHandshake, PhoneCall, Mail, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Footer: React.FC = () => {
  const { setActiveTab, quickSwitchRole } = useAuth();

  return (
    <footer className="bg-emerald-950 text-stone-300 border-t border-emerald-900/60 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-emerald-900/50">
          {/* Col 1 & 2: Brand and Impact */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                <Sprout className="w-6 h-6 text-amber-300" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                Seedha<span className="text-emerald-400">Mandi</span>
              </span>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed max-w-md">
              India's first direct agricultural supply network connecting rural growers, FPO cooperatives, and conscious consumers. By removing multiple tiers of exploitative intermediaries, farmers earn up to 33% more while households enjoy harvest-fresh produce at fair prices.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/80 text-emerald-300 text-xs font-semibold border border-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> 100% Escrow Protection
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/80 text-emerald-300 text-xs font-semibold border border-emerald-800">
                <Truck className="w-3.5 h-3.5 text-emerald-400" /> Rural Cold Transit
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/80 text-emerald-300 text-xs font-semibold border border-emerald-800">
                <HeartHandshake className="w-3.5 h-3.5 text-amber-400" /> FPO Inclusive Model
              </span>
            </div>
          </div>

          {/* Col 3: Quick Navigation */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => setActiveTab('marketplace')} className="hover:text-emerald-400 transition">
                  Browse Fresh Marketplace
                </button>
              </li>
              <li>
                <button onClick={() => { quickSwitchRole('FARMER'); setActiveTab('farmer_dashboard'); }} className="hover:text-emerald-400 transition">
                  Farmer / FPO Selling
                </button>
              </li>
              <li>
                <button onClick={() => { quickSwitchRole('LOGISTICS'); setActiveTab('logistics_dashboard'); }} className="hover:text-emerald-400 transition">
                  Logistics Partner Portal
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('demand_intel')} className="hover:text-amber-400 transition">
                  AI Demand Intelligence
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Categories */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Farm Produce</h4>
            <ul className="space-y-2.5 text-sm">
              <li className="text-stone-400 hover:text-emerald-400 cursor-pointer" onClick={() => setActiveTab('marketplace')}>Farm Fresh Vegetables</li>
              <li className="text-stone-400 hover:text-emerald-400 cursor-pointer" onClick={() => setActiveTab('marketplace')}>GI-Tagged Fruits & Mangoes</li>
              <li className="text-stone-400 hover:text-emerald-400 cursor-pointer" onClick={() => setActiveTab('marketplace')}>Direct Sehore Grains & Wheat</li>
              <li className="text-stone-400 hover:text-emerald-400 cursor-pointer" onClick={() => setActiveTab('marketplace')}>Unpolished Pulses & Desi Chana</li>
              <li className="text-stone-400 hover:text-emerald-400 cursor-pointer" onClick={() => setActiveTab('marketplace')}>Cold-Pressed Kachi Ghani Mustard Oil</li>
            </ul>
          </div>

          {/* Col 5: Contact & Grievance */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Support & Trust</h4>
            <ul className="space-y-3 text-sm text-stone-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Krishi Bhawan Agri-Tech Hub, Pune & Bengaluru</span>
              </li>
              <li className="flex items-center gap-2.5">
                <PhoneCall className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Kisan Helpline: 1800-SEEDHA-MANDI</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>support@seedhamandi.in</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <p>© {new Date().getFullYear()} SeedhaMandi Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Direct Farm Trade Act Compliant</span>
            <span>Zero Brokerage Policy</span>
            <span>Aadhaar DBT Integrated</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
