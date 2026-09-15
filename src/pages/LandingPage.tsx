import React, { useState } from 'react';
import { 
  Sprout, 
  ShoppingBag, 
  Truck, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  Zap, 
  HeartHandshake,
  BarChart3,
  BadgeCheck,
  Scale,
  MapPin,
  Lock,
  UserCheck,
  LogIn,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Product, UserRole } from '../types';

interface LandingPageProps {
  featuredProducts: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  featuredProducts,
  onSelectProduct,
  onAddToCart,
}) => {
  const { 
    setActiveTab, 
    quickSwitchRole, 
    openSeedhaMitra, 
    openAuthModal, 
    user, 
    role,
    cart,
    cartCount,
    cartTotal,
    openCart
  } = useAuth();

  const [hoveredRole, setHoveredRole] = useState<UserRole | null>(null);

  const handleSelectRoleAndNavigate = (targetRole: UserRole) => {
    quickSwitchRole(targetRole);
    if (targetRole === 'LOGISTICS') {
      setActiveTab('logistics_dashboard');
    } else if (targetRole === 'FARMER' || targetRole === 'FPO_REP') {
      setActiveTab('farmer_dashboard');
    } else {
      setActiveTab('marketplace');
    }
  };

  const handleRoleAuth = (targetRole: UserRole, mode: 'login' | 'register') => {
    quickSwitchRole(targetRole);
    openAuthModal(mode, targetRole);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* ========================================================================= */}
      {/* 1. PRIMARY ROLE SELECTION HERO (ARE YOU A FARMER / CONSUMER / LOGISTICS)   */}
      {/* ========================================================================= */}
      <section className="relative bg-gradient-to-b from-emerald-950 via-emerald-900 to-stone-900 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle decorative agricultural mesh */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="relative max-w-7xl mx-auto space-y-8">
          {/* Top Auth Bar for Home Tab: Login / Sign Up */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-emerald-700/60 shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  SeedhaMandi Secure 2-Factor Authentication
                </span>
                <p className="text-[11px] text-emerald-100">
                  {user 
                    ? `Logged in as: ${user.name} (${user.role})` 
                    : 'Email & SMS OTP verified access for all stakeholders'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {user ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (role === 'LOGISTICS') setActiveTab('logistics_dashboard');
                      else if (role === 'FARMER' || role === 'FPO_REP') setActiveTab('farmer_dashboard');
                      else setActiveTab('consumer_dashboard');
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-black transition flex items-center gap-1.5 shadow-sm"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Go to My Active Dashboard</span>
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => openAuthModal('login')}
                    className="px-4 py-2 rounded-xl bg-emerald-800/90 hover:bg-emerald-700 text-white text-xs font-bold border border-emerald-600 transition flex items-center gap-1.5 shadow-sm"
                  >
                    <LogIn className="w-3.5 h-3.5 text-amber-300" />
                    <span>Sign In</span>
                  </button>

                  <button
                    onClick={() => openAuthModal('register')}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-black transition flex items-center gap-1.5 shadow-md active:scale-95"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Sign Up with OTP</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Central Question Banner */}
          <div className="text-center space-y-3 max-w-3xl mx-auto pt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tailored Dedicated Experience</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Are you a <span className="text-amber-400">Farmer</span>, <span className="text-emerald-300">Consumer</span>, or <span className="text-blue-300">Logistics Partner</span>?
            </h1>

            <p className="text-sm sm:text-base text-emerald-100/90 max-w-2xl mx-auto leading-relaxed">
              Select your persona below. Choosing your role opens <strong>only that dedicated interface</strong> designed specifically for your daily workflow, telemetry, and transactions.
            </p>
          </div>

          {/* THE 3 PERSONA SELECTOR TILES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* 1. FARMER & FPO PORTAL CARD */}
            <div 
              onMouseEnter={() => setHoveredRole('FARMER')}
              onMouseLeave={() => setHoveredRole(null)}
              className="group bg-gradient-to-b from-stone-900/90 to-emerald-950/90 rounded-3xl p-6 sm:p-7 border-2 border-emerald-600/40 hover:border-amber-400 shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6 relative overflow-hidden hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-amber-400/20 text-amber-400 border border-amber-400/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sprout className="w-8 h-8" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider">
                    0% Broker Web
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl font-black text-white group-hover:text-amber-300 transition-colors">
                    I am a Farmer / FPO
                  </h2>
                  <p className="text-xs text-emerald-200/90 mt-1.5 leading-relaxed">
                    Sell harvest directly to buyers, catalog produce on behalf of village smallholders, track incoming orders, and withdraw instant Aadhaar DBT payouts.
                  </p>
                </div>

                {/* Specific feature bullet points */}
                <div className="space-y-2 pt-2 border-t border-emerald-800/60 text-xs text-stone-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>+31.4% higher earnings</strong> vs traditional APMC Mandi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>FPO tool to onboard farmers without smartphones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>SeedhaMitra AI harvest & price discovery</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => handleSelectRoleAndNavigate('FARMER')}
                  className="w-full py-3.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 active:scale-95"
                >
                  <Sprout className="w-4 h-4" />
                  <span>Enter Farmer Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center gap-4 text-[11px] text-emerald-200">
                  <button 
                    onClick={() => handleRoleAuth('FARMER', 'login')} 
                    className="hover:text-amber-300 underline font-medium"
                  >
                    Farmer Sign In
                  </button>
                  <span>•</span>
                  <button 
                    onClick={() => handleRoleAuth('FARMER', 'register')} 
                    className="hover:text-amber-300 underline font-medium"
                  >
                    Register with OTP
                  </button>
                </div>
              </div>
            </div>

            {/* 2. CONSUMER MARKETPLACE CARD */}
            <div 
              onMouseEnter={() => setHoveredRole('CONSUMER')}
              onMouseLeave={() => setHoveredRole(null)}
              className="group bg-gradient-to-b from-stone-900/90 to-teal-950/90 rounded-3xl p-6 sm:p-7 border-2 border-teal-600/40 hover:border-emerald-300 shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6 relative overflow-hidden hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-bold uppercase tracking-wider">
                    24h Fresh Harvest
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl font-black text-white group-hover:text-emerald-300 transition-colors">
                    I am a Consumer / Buyer
                  </h2>
                  <p className="text-xs text-teal-100/90 mt-1.5 leading-relaxed">
                    Source chemical-free vegetables, GI-tagged Alphonso mangoes, and Vedic A2 Ghee directly from verified rural growers with transparent pricing.
                  </p>
                </div>

                {/* Specific feature bullet points */}
                <div className="space-y-2 pt-2 border-t border-teal-800/60 text-xs text-stone-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>Direct farmer certificates & origin traceability</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>Doorstep Escrow inspection before paying</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>UPI QR, NetBanking, Cards, & Kisan Credit support</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => handleSelectRoleAndNavigate('CONSUMER')}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Enter Consumer Marketplace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center gap-4 text-[11px] text-teal-200">
                  <button 
                    onClick={() => handleRoleAuth('CONSUMER', 'login')} 
                    className="hover:text-emerald-300 underline font-medium"
                  >
                    Buyer Sign In
                  </button>
                  <span>•</span>
                  <button 
                    onClick={() => handleRoleAuth('CONSUMER', 'register')} 
                    className="hover:text-emerald-300 underline font-medium"
                  >
                    Register with OTP
                  </button>
                </div>
              </div>
            </div>

            {/* 3. LOGISTICS PARTNER (BHUBANESWAR FLEET) CARD */}
            <div 
              onMouseEnter={() => setHoveredRole('LOGISTICS')}
              onMouseLeave={() => setHoveredRole(null)}
              className="group bg-gradient-to-b from-stone-900/90 to-blue-950/90 rounded-3xl p-6 sm:p-7 border-2 border-blue-600/40 hover:border-blue-400 shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6 relative overflow-hidden hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-400/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Truck className="w-8 h-8" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold uppercase tracking-wider">
                    Bhubaneswar Live Map
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl font-black text-white group-hover:text-blue-300 transition-colors">
                    I am a Logistics Partner
                  </h2>
                  <p className="text-xs text-blue-100/90 mt-1.5 leading-relaxed">
                    Live Bhubaneswar GPS map, accept or reject nearby farm pickups, monitor active 4.2°C reefer telemetry, and earn instant freight payouts.
                  </p>
                </div>

                {/* Specific feature bullet points */}
                <div className="space-y-2 pt-2 border-t border-blue-800/60 text-xs text-stone-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <span><strong>Interactive Bhubaneswar Map</strong> (Mancheswar, Patia, Saheed Nagar)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <span><strong>Accept or Reject</strong> nearby farm delivery dispatches</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <span><strong>Total Freight Earnings</strong> & instant UPI withdrawal</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => handleSelectRoleAndNavigate('LOGISTICS')}
                  className="w-full py-3.5 px-4 rounded-xl bg-blue-500 hover:bg-blue-400 text-stone-950 font-black text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  <Truck className="w-4 h-4" />
                  <span>Enter Logistics Portal (Bhubaneswar)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center gap-4 text-[11px] text-blue-200">
                  <button 
                    onClick={() => handleRoleAuth('LOGISTICS', 'login')} 
                    className="hover:text-blue-300 underline font-medium"
                  >
                    Driver Sign In
                  </button>
                  <span>•</span>
                  <button 
                    onClick={() => handleRoleAuth('LOGISTICS', 'register')} 
                    className="hover:text-blue-300 underline font-medium"
                  >
                    Register Fleet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. THE DIRECT ADVANTAGE & COMPARATIVE ECONOMICS                            */}
      {/* ========================================================================= */}
      <section className="py-14 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                <Scale className="w-3.5 h-3.5" />
                <span>Transparent Mandi Margin Breakdown</span>
              </div>
              <h2 className="text-3xl font-black text-stone-900 tracking-tight">
                Where does your produce money actually go?
              </h2>
              <p className="text-stone-600 text-sm leading-relaxed">
                In the conventional Indian APMC mandi model, up to 4 intermediaries take cuts for cartage, loading, commission, and retail markups. SeedhaMandi replaces this web with a direct escrow contract and verified cold transit.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-1.5 text-xs">
                  <div className="font-extrabold text-rose-950 text-sm">Conventional APMC Mandi</div>
                  <div className="text-stone-600">Farmer gets only <strong>₹2,100 per 100kg</strong></div>
                  <p className="text-rose-800 text-[11px]">
                    4 middle tiers take ₹1,900 in handling fees and wholesale markups.
                  </p>
                </div>

                <div className="p-4 bg-emerald-50/80 border border-emerald-300 rounded-2xl space-y-1.5 text-xs">
                  <div className="font-extrabold text-emerald-950 text-sm">SeedhaMandi Direct Escrow</div>
                  <div className="text-stone-700">Farmer receives <strong>₹2,800 per 100kg</strong></div>
                  <p className="text-emerald-800 text-[11px] font-bold">
                    +31.4% net realization credited directly via Aadhaar Jan Dhan DBT.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-stone-900 text-white p-6 rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  SeedhaMitra AI Agent
                </span>
                <span className="text-[10px] bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  Active
                </span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                "Farmers can ask SeedhaMitra in Hindi or English for today's optimal mandi prices, post-harvest drying tips, and packaging advice to guarantee zero transit damage."
              </p>
              <button
                onClick={openSeedhaMitra}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Open SeedhaMitra Agricultural AI Advisor</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FEATURED HARVEST LOTS PREVIEW                                          */}
      {/* ========================================================================= */}
      <section className="py-14 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Direct Farmgate Availability
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-stone-900 mt-1">
                Fresh Harvest Direct from Verified Growers
              </h2>
              <p className="text-xs text-stone-500">
                Harvested within 24 hours • Shipped via refrigerated fleet • Escrow protected
              </p>
            </div>

            <button
              onClick={() => setActiveTab('marketplace')}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View All Harvest Lots in Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 4).map(product => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 overflow-hidden bg-stone-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2.5 left-2.5 bg-emerald-950/80 backdrop-blur-xs text-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      {product.category}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="font-extrabold text-stone-900 text-sm line-clamp-1">
                      {product.name}
                    </h3>

                    <div className="text-xs text-stone-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{product.location}, {product.state}</span>
                    </div>

                    <div className="pt-2 flex items-baseline justify-between border-t border-stone-100">
                      <div>
                        <span className="text-lg font-black text-emerald-900">
                          ₹{product.price}
                        </span>
                        <span className="text-[11px] text-stone-500 font-medium">
                          /{product.unit}
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400 line-through">
                        Mandi: ₹{product.mandiBenchmarkPrice}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 flex items-center gap-2">
                  <button
                    onClick={() => onAddToCart(product)}
                    className="flex-1 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{cart.some(i => i.product.id === product.id) ? 'Add More' : 'Add to Basket'}</span>
                  </button>
                  {cart.some(i => i.product.id === product.id) && (
                    <button
                      onClick={() => openCart('checkout')}
                      className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-black rounded-xl transition shadow-xs flex items-center gap-1 active:scale-95 cursor-pointer"
                      title="Place order now"
                    >
                      <span>Place Order</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Floating Bottom Place Order Bar when items are in cart */}
      {cart.length > 0 && (
        <div className="fixed bottom-5 inset-x-4 sm:inset-x-auto sm:right-6 z-40 max-w-lg bg-emerald-950/95 text-white p-3.5 rounded-2xl shadow-2xl border border-emerald-700 backdrop-blur-md flex items-center justify-between gap-4 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-800 text-amber-400 flex items-center justify-center font-bold shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <span>Farm Basket: {cartCount} items ({cart.reduce((s, i) => s + i.quantity, 0)} kg)</span>
              </div>
              <div className="text-[11px] text-emerald-300 font-mono">
                Total: <strong className="text-amber-300 font-bold">₹{cartTotal}</strong> • Direct farmgate dispatch
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openCart('checkout')}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span>Place Order</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
