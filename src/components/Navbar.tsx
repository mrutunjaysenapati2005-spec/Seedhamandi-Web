import React, { useState } from 'react';
import { 
  Sprout, 
  ShoppingBag, 
  Sparkles, 
  Truck, 
  TrendingUp, 
  ShieldCheck, 
  User as UserIcon, 
  LogOut, 
  Database, 
  ChevronDown, 
  Menu, 
  X,
  Users,
  Trophy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface NavbarProps {
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCart }) => {
  const { 
    user, 
    role, 
    cartCount, 
    quickSwitchRole, 
    openAuthModal, 
    logout, 
    openSeedhaMitra, 
    openSihModal,
    activeTab, 
    setActiveTab 
  } = useAuth();

  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const roleLabels: Record<UserRole, { label: string; bg: string; text: string; icon: any }> = {
    CONSUMER: { label: 'Consumer / Buyer', bg: 'bg-emerald-100', text: 'text-emerald-800', icon: ShoppingBag },
    FARMER: { label: 'Farmer (Direct)', bg: 'bg-amber-100', text: 'text-amber-900', icon: Sprout },
    FPO_REP: { label: 'FPO Representative', bg: 'bg-orange-100', text: 'text-orange-900', icon: Users },
    LOGISTICS: { label: 'Logistics Partner', bg: 'bg-blue-100', text: 'text-blue-900', icon: Truck },
  };

  const currentRoleConfig = roleLabels[role] || roleLabels.CONSUMER;
  const RoleIcon = currentRoleConfig.icon;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      {/* Top Banner: Direct Farm Promise & System Telemetry */}
      <div className="bg-emerald-900 text-emerald-100 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={openSihModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[10px] font-black tracking-wider uppercase shadow-xs hover:bg-amber-300 transition"
            >
              <Trophy className="w-3 h-3 text-stone-950" />
              <span>SIH 2026 Prototype</span>
            </button>
            <span className="font-medium hidden sm:inline">100% Direct Farm-to-Consumer Digital Marketplace</span>
            <span className="hidden md:inline text-emerald-300">• Zero Middlemen • Multimodal Logistics • AI Forecasting</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={openSihModal}
              className="text-amber-300 hover:text-amber-200 text-xs font-bold underline flex items-center gap-1"
            >
              <span>Solution Overview</span>
            </button>

            <div className="flex items-center gap-1 text-emerald-200">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline text-emerald-300 font-mono text-[11px] font-semibold">Synced</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo */}
          <div 
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-extrabold tracking-tight text-emerald-950">Seedha<span className="text-emerald-600">Mandi</span></span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded">Prototype</span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium tracking-wide">Direct from Farm, Straight to You</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('landing')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'landing'
                  ? 'text-emerald-800 bg-emerald-50'
                  : 'text-stone-600 hover:text-emerald-700 hover:bg-stone-50'
              }`}
            >
              Home (Select Role)
            </button>

            <button
              onClick={() => {
                quickSwitchRole('CONSUMER');
                setActiveTab('marketplace');
              }}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'marketplace'
                  ? 'text-emerald-800 bg-emerald-50'
                  : 'text-stone-600 hover:text-emerald-700 hover:bg-stone-50'
              }`}
            >
              Consumer Market
            </button>

            <button
              onClick={() => {
                quickSwitchRole('FARMER');
                setActiveTab('farmer_dashboard');
              }}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'farmer_dashboard'
                  ? 'text-emerald-800 bg-emerald-50'
                  : 'text-stone-600 hover:text-emerald-700 hover:bg-stone-50'
              }`}
            >
              Farmer Hub
            </button>

            <button
              onClick={() => {
                quickSwitchRole('LOGISTICS');
                setActiveTab('logistics_dashboard');
              }}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'logistics_dashboard'
                  ? 'text-emerald-800 bg-emerald-50'
                  : 'text-stone-600 hover:text-emerald-700 hover:bg-stone-50'
              }`}
            >
              Logistics (Bhubaneswar)
            </button>

            <button
              onClick={() => setActiveTab('demand_intel')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'demand_intel'
                  ? 'text-amber-800 bg-amber-50'
                  : 'text-stone-600 hover:text-amber-800 hover:bg-stone-50'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span>AI Demand</span>
            </button>
          </nav>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-2.5">
            {/* AI Assistant SeedhaMitra Button */}
            <button
              onClick={openSeedhaMitra}
              className="relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-700/20 hover:shadow-lg hover:from-emerald-800 hover:to-teal-800 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="hidden sm:inline">Ask SeedhaMitra</span>
              <span className="sm:hidden">AI</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-300"></span>
              </span>
            </button>

            {/* Cart Button (Always visible) */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 text-stone-700 hover:text-emerald-700 hover:bg-stone-100 rounded-xl transition-colors"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-stone-900 font-black text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Quick Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold ${currentRoleConfig.bg} ${currentRoleConfig.text} hover:opacity-90 transition`}
              >
                <RoleIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline max-w-[120px] truncate">{currentRoleConfig.label}</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {isRoleMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setIsRoleMenuOpen(false)}
                >
                  <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-stone-600 font-bold border-b border-stone-100">
                    Switch Active Persona:
                  </div>
                  <button
                    onClick={() => {
                      quickSwitchRole('CONSUMER');
                      setIsRoleMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-stone-700 hover:bg-emerald-50 flex items-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4 text-emerald-600" />
                    <span>Consumer / Buyer</span>
                  </button>
                  <button
                    onClick={() => {
                      quickSwitchRole('FARMER');
                      setIsRoleMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-stone-700 hover:bg-amber-50 flex items-center gap-2"
                  >
                    <Sprout className="w-4 h-4 text-amber-600" />
                    <span>Farmer (Individual)</span>
                  </button>
                  <button
                    onClick={() => {
                      quickSwitchRole('FPO_REP');
                      setIsRoleMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-stone-700 hover:bg-orange-50 flex items-center gap-2"
                  >
                    <Users className="w-4 h-4 text-orange-600" />
                    <span>FPO Representative (54 Farmers)</span>
                  </button>
                  <button
                    onClick={() => {
                      quickSwitchRole('LOGISTICS');
                      setIsRoleMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-stone-700 hover:bg-blue-50 flex items-center gap-2"
                  >
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>Logistics Partner</span>
                  </button>
                </div>
              )}
            </div>

            {/* Auth / Account Controls */}
            {user ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    if (role === 'FARMER' || role === 'FPO_REP') setActiveTab('farmer_dashboard');
                    else if (role === 'LOGISTICS') setActiveTab('logistics_dashboard');
                    else setActiveTab('consumer_dashboard');
                  }}
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-800 hover:bg-stone-50"
                >
                  <UserIcon className="w-3.5 h-3.5 text-stone-500" />
                  <span className="max-w-[100px] truncate">{user.name}</span>
                </button>
                <button
                  onClick={logout}
                  className="p-2 text-stone-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-emerald-700"
                >
                  Log In
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-3 py-1.5 text-xs font-bold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 shadow-sm"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-stone-600 hover:text-stone-900 rounded-lg"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-stone-200 px-4 pt-2 pb-4 space-y-2 animate-in fade-in duration-150">
          <button
            onClick={() => {
              setActiveTab('landing');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-emerald-800 hover:bg-emerald-50"
          >
            Home (Select Role)
          </button>
          <button
            onClick={() => {
              quickSwitchRole('CONSUMER');
              setActiveTab('marketplace');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            Consumer Market
          </button>
          <button
            onClick={() => {
              quickSwitchRole('FARMER');
              setActiveTab('farmer_dashboard');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            Farmer / FPO Hub
          </button>
          <button
            onClick={() => {
              quickSwitchRole('LOGISTICS');
              setActiveTab('logistics_dashboard');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            Logistics Fleet (Bhubaneswar)
          </button>
          <button
            onClick={() => {
              setActiveTab('demand_intel');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-amber-800 bg-amber-50"
          >
            AI Demand Intel
          </button>
        </div>
      )}
    </header>
  );
};
