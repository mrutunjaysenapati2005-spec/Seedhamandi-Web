import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { SeedhaMitraModal } from './components/SeedhaMitraModal';
import { AuthModal } from './components/AuthModal';
import { CartDrawer } from './components/CartDrawer';
import { SihModal } from './components/SihModal';
import { LandingPage } from './pages/LandingPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { FarmerDashboard } from './pages/FarmerDashboard';
import { ConsumerDashboard } from './pages/ConsumerDashboard';
import { LogisticsDashboard } from './pages/LogisticsDashboard';
import { DemandIntelligencePage } from './pages/DemandIntelligencePage';
import { Product } from './types';
import { api } from './services/api';
import { CheckCircle2, Sprout, ArrowRight } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { LogisticsNotificationCenter } from './components/LogisticsNotificationCenter';
import { OfflineNotificationDrawer } from './components/OfflineNotificationDrawer';

const MainContent: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    addToCart, 
    isCartOpen, 
    closeCart, 
    openCart, 
    isSihModalOpen, 
    closeSihModal, 
    quickSwitchRole,
    escrowReleaseToast,
    clearEscrowReleaseToast
  } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastData, setToastData] = useState<{ message: string; showPlaceOrder?: boolean } | null>(null);

  useEffect(() => {
    if (escrowReleaseToast) {
      const timer = setTimeout(() => {
        clearEscrowReleaseToast();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [escrowReleaseToast, clearEscrowReleaseToast]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await api.getProducts();
      setProducts(res.products || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    addToCart(product, quantity);
    setToastData({
      message: `Added "${product.name}" (${quantity} ${product.unit}) to farm basket`,
      showPlaceOrder: true,
    });
    setTimeout(() => setToastData(null), 4000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 font-sans selection:bg-emerald-200 selection:text-emerald-950 transition-colors duration-200">
      {/* Navigation */}
      <Navbar onOpenCart={openCart} />

      {/* Main Viewport */}
      <main className="flex-1">
        {activeTab === 'landing' && (
          <LandingPage
            featuredProducts={products}
            onSelectProduct={product => {
              setActiveTab('marketplace');
            }}
            onAddToCart={handleAddToCart}
          />
        )}

        {activeTab === 'marketplace' && (
          <MarketplacePage
            products={products}
            onAddToCart={handleAddToCart}
            onOpenCart={openCart}
          />
        )}

        {activeTab === 'farmer_dashboard' && (
          <FarmerDashboard
            products={products}
            onRefreshProducts={loadProducts}
          />
        )}

        {activeTab === 'consumer_dashboard' && (
          <ConsumerDashboard />
        )}

        {activeTab === 'logistics_dashboard' && (
          <LogisticsDashboard />
        )}

        {activeTab === 'demand_intel' && (
          <DemandIntelligencePage />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Global Modals & Drawers */}
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
      <SeedhaMitraModal />
      <AuthModal />
      <SihModal
        isOpen={isSihModalOpen}
        onClose={closeSihModal}
        onNavigateToAi={() => setActiveTab('demand_intel')}
        onNavigateToLogistics={() => {
          quickSwitchRole('LOGISTICS');
          setActiveTab('logistics_dashboard');
        }}
        onNavigateToMarketplace={() => {
          quickSwitchRole('CONSUMER');
          setActiveTab('marketplace');
        }}
      />

      {/* Toast Notification with Place Order Option */}
      {toastData && (
        <div className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:right-6 sm:left-auto z-50 max-w-md mx-auto sm:mx-0 bg-emerald-950 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-700 text-xs font-bold flex items-center justify-between gap-3 animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastData.message}</span>
          </div>
          {toastData.showPlaceOrder && (
            <button
              type="button"
              onClick={() => {
                setToastData(null);
                openCart('checkout');
              }}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1 active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Place Order</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Escrow Released Toast Notification */}
      {escrowReleaseToast && (
        <div className="fixed bottom-4 left-4 right-4 sm:bottom-auto sm:top-20 sm:right-6 sm:left-auto z-50 max-w-md mx-auto sm:mx-0 bg-emerald-950 text-white px-5 py-3.5 rounded-2xl shadow-2xl border-2 border-emerald-500 text-sm font-bold flex items-center justify-between gap-3 animate-in slide-in-from-bottom-3 sm:slide-in-from-top-3 duration-300">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-emerald-300 text-[11px] uppercase tracking-wider font-extrabold">Instant Escrow Settlement</div>
            <div className="text-white text-sm font-black">{escrowReleaseToast.message}</div>
          </div>
          <button
            onClick={clearEscrowReleaseToast}
            className="ml-2 text-zinc-400 hover:text-white p-1 rounded-lg transition"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Low-Bandwidth & Offline Sync Drawer */}
      <OfflineNotificationDrawer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="bottom-right" reverseOrder={false} />
      <LogisticsNotificationCenter />
      <MainContent />
    </AuthProvider>
  );
}
