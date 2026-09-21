import React, { useState, useEffect } from 'react';
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
  Trophy,
  Moon,
  Sun
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { offlineSync } from '../services/offlineSync';
import { PWAInstallButton } from './PWAInstallButton';

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
  
  // PWA Offline Sync State
  const [syncStatus, setSyncStatus] = useState({
    isOnline: offlineSync.isEffectiveOnline(),
    isSimulatedOffline: offlineSync.isSimulationActive(),
    pendingCount: offlineSync.getPendingMutations().length
  });

  useEffect(() => {
    const unsub = offlineSync.subscribe((state) => {
      setSyncStatus({
        isOnline: state.isOnline,
        isSimulatedOffline: state.isSimulatedOffline,
        pendingCount: state.pendingCount
      });
    });
    return () => unsub();
  }, []);

  const handleToggleSimulation = () => {
    offlineSync.toggleSimulatedOffline();
  };

  // Dark Mode State with prefers-color-scheme auto-detection
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') return true;
      if (savedTheme === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setIsDark(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleDarkMode = () => setIsDark(!isDark);

  const roleLabels: Record<UserRole, { label: string; bg: string; text: string; icon: any }> = {
    CONSUMER: { label: 'Consumer / Buyer', bg: 'bg-emerald-100', text: 'text-emerald-800', icon: ShoppingBag },
    FARMER: { label: 'Farmer (Direct)', bg: 'bg-amber-100', text: 'text-amber-900', icon: Sprout },
    FPO_REP: { label: 'FPO Representative', bg: 'bg-orange-100', text: 'text-orange-900', icon: Users },
    LOGISTICS: { label: 'Logistics Partner', bg: 'bg-blue-100', text: 'text-blue-900', icon: Truck },
  };

  const currentRoleConfig = roleLabels[role] || roleLabels.CONSUMER;
  const RoleIcon = currentRoleConfig.icon;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-950/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
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

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            <button
              onClick={openSihModal}
              className="text-amber-300 hover:text-amber-200 text-xs font-bold underline flex items-center gap-1 mr-1"
            >
              <span>Solution Overview</span>
            </button>

            {/* Interactive "Simulate Offline / 2G Mode" Judge Demo Button */}
            <button
              onClick={handleToggleSimulation}
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border transition flex items-center gap-1 cursor-pointer ${
                syncStatus.isSimulatedOffline
                  ? 'bg-amber-400 text-stone-950 border-amber-300 hover:bg-amber-300'
                  : 'bg-emerald-950/70 text-emerald-200 border-emerald-500/30 hover:bg-emerald-800/80 hover:text-white'
              }`}
              title="Toggle simulated 2G/offline state for live judge demonstrations"
            >
              <span>📡 {syncStatus.isSimulatedOffline ? 'Simulating 2G (Restore Online)' : 'Test Offline / 2G'}</span>
            </button>

            {/* Live PWA Status Chip */}
            {syncStatus.isOnline ? (
              <div className="flex items-center gap-1.5 text-emerald-200 bg-emerald-950/70 px-2.5 py-0.5 rounded-full border border-emerald-500/30 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-emerald-300">
                  PWA Offline-Ready • Synced
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-200 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/40 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-[10px] font-mono font-bold text-amber-300">
                  Offline Mode • Local Cache Active
                </span>
              </div>
            )}
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
                <span className="text-2xl font-extrabold tracking-tight text-emerald-950 dark:text-emerald-100 transition-colors">Seedha<span className="text-emerald-600 dark:text-emerald-400">Mandi</span></span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 px-1.5 py-0.5 rounded transition-colors">Prototype</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium tracking-wide transition-colors">Direct from Farm, Straight to You</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('landing')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'landing'
                  ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30'
                  : 'text-stone-600 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-stone-50 dark:hover:bg-stone-800'
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
                  ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30'
                  : 'text-stone-600 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-stone-50 dark:hover:bg-stone-800'
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
                  ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30'
                  : 'text-stone-600 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-stone-50 dark:hover:bg-stone-800'
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
                  ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30'
                  : 'text-stone-600 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              Logistics (Bhubaneswar)
            </button>

            <button
              onClick={() => setActiveTab('demand_intel')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'demand_intel'
                  ? 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30'
                  : 'text-stone-600 dark:text-stone-300 hover:text-amber-800 dark:hover:text-amber-400 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span>AI Demand</span>
            </button>
          </nav>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-2.5">
            {/* PWA Install Button (One-click install on Android/Chrome, guided on iOS) */}
            <PWAInstallButton />

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
              className="relative min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center text-stone-700 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
              title="Shopping Cart"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute 1.5 1.5 bg-amber-500 text-stone-900 font-black text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Dark Mode Toggle - Guaranteed 44x44px Touch Target */}
            <button
              onClick={toggleDarkMode}
              className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-stone-700 dark:text-stone-300" />}
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
              className="lg:hidden min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-4 pt-2 pb-4 space-y-1.5 animate-in fade-in duration-150">
          <button
            onClick={() => {
              setActiveTab('landing');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
          >
            Home (Select Role)
          </button>
          <button
            onClick={() => {
              quickSwitchRole('CONSUMER');
              setActiveTab('marketplace');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
          >
            Consumer Market
          </button>
          <button
            onClick={() => {
              quickSwitchRole('FARMER');
              setActiveTab('farmer_dashboard');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
          >
            Farmer / FPO Hub
          </button>
          <button
            onClick={() => {
              quickSwitchRole('LOGISTICS');
              setActiveTab('logistics_dashboard');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
          >
            Logistics Fleet (Bhubaneswar)
          </button>
          <button
            onClick={() => {
              setActiveTab('demand_intel');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 cursor-pointer"
          >
            AI Demand Intel
          </button>
        </div>
      )}
    </header>
  );
};
