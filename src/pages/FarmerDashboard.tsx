import React, { useState, useEffect, useRef } from 'react';
import { 
  Sprout, 
  Plus, 
  DollarSign, 
  Package, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  TrendingUp, 
  Sparkles, 
  Users, 
  AlertCircle,
  Truck,
  ArrowUpRight,
  RefreshCw,
  Building,
  Eye,
  Trash2,
  Bell,
  Boxes,
  AlertTriangle,
  Sliders,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Product, Order, OrderStatus, AppNotification, BulkRfq } from '../types';
import { api } from '../services/api';
import { FarmerDemandInventoryD3Chart } from '../components/FarmerDemandInventoryD3Chart';
import { 
  FarmerLowStockBanner, 
  FarmerLowStockToast, 
  LowStockToastAlert, 
  playLowStockChime 
} from '../components/FarmerLowStockAlerts';

interface FarmerDashboardProps {
  products: Product[];
  onRefreshProducts: () => void;
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  products,
  onRefreshProducts,
}) => {
  const { user, role, openSeedhaMitra } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [rfqs, setRfqs] = useState<BulkRfq[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'demand_forecast' | 'orders' | 'sold_history' | 'payouts' | 'rfqs'>('inventory');

  // Real-time Low Stock Alert System State
  const [globalThreshold, setGlobalThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('seedha_farmer_stock_threshold');
    return saved ? Math.max(5, Number(saved)) : 50;
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('seedha_farmer_sound_enabled');
    return saved !== 'false';
  });
  const [lowStockToasts, setLowStockToasts] = useState<LowStockToastAlert[]>([]);
  const previousQuantitiesRef = useRef<Record<string, number>>({});
  const hasLoadedInitiallyRef = useRef<boolean>(false);

  // Add Product Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Vegetables');
  const [price, setPrice] = useState('35');
  const [mandiPrice, setMandiPrice] = useState('26');
  const [quantity, setQuantity] = useState('500');
  const [unit, setUnit] = useState('kg');
  const [minOrderQty, setMinOrderQty] = useState('5');
  const [lowStockThresholdInput, setLowStockThresholdInput] = useState('50');
  const [description, setDescription] = useState('');
  const [qualityGrade, setQualityGrade] = useState('Grade A (Export Quality)');
  const [organicCertified, setOrganicCertified] = useState(true);
  const [actualFarmerName, setActualFarmerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Bank Payout Withdrawal
  const [withdrawing, setWithdrawing] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  useEffect(() => {
    loadFarmerOrdersAndNotifs();
    const interval = setInterval(loadFarmerOrdersAndNotifs, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadFarmerOrdersAndNotifs = async () => {
    try {
      setLoadingOrders(true);
      const [ordRes, notifRes, rfqRes] = await Promise.all([
        api.getOrders(),
        api.getNotifications(),
        api.getRfqs(),
      ]);
      setOrders(ordRes.orders || []);
      setNotifications(notifRes.notifications || []);
      setRfqs(rfqRes.rfqs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const myProducts = products.filter(
    p => p.farmerId === (user?.id || 'usr_farmer_1') || p.farmerName.includes('Ramesh') || role === 'FPO_REP'
  );

  const totalDeliveredRevenue = orders
    .filter(o => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + o.itemsTotal, 0) + (role === 'FPO_REP' ? 96500 : 38400);

  const pendingEscrow = orders
    .filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.itemsTotal, 0) + 7200;

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const defaultImages: Record<string, string> = {
        Vegetables: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
        Fruits: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=600&q=80',
        Grains: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
        Pulses: 'https://images.unsplash.com/photo-1585996656722-1b8e967fb438?auto=format&fit=crop&w=600&q=80',
        Dairy: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
      };

      const payload = {
        name,
        category: category as any,
        price: Number(price),
        mandiBenchmarkPrice: Number(mandiPrice),
        quantity: Number(quantity),
        unit,
        minOrderQty: Number(minOrderQty),
        qualityGrade,
        organicCertified,
        description: description || `Freshly harvested ${name} grown with sustainable water and nutrient management.`,
        image: defaultImages[category] || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
        isFpoListed: role === 'FPO_REP' || !!actualFarmerName,
        actualFarmerName: actualFarmerName || undefined,
        lowStockThreshold: Number(lowStockThresholdInput) || globalThreshold,
      };

      await api.createProduct(payload);
      setFeedback({ type: 'success', msg: 'Harvest lot listed successfully on SeedhaMandi!' });
      setIsAddModalOpen(false);
      onRefreshProducts();
      // Reset
      setName('');
      setActualFarmerName('');
      setLowStockThresholdInput('50');
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.message || 'Failed to list product' });
    } finally {
      setSubmitting(false);
    }
  };

  // Low Stock Threshold Handlers
  const handleUpdateGlobalThreshold = (val: number) => {
    setGlobalThreshold(val);
    localStorage.setItem('seedha_farmer_stock_threshold', val.toString());
    setFeedback({
      type: 'success',
      msg: `Safety threshold updated to ${val} units across your farmgate lots. Real-time watchtower recalibrated!`,
    });
  };

  const handleUpdateProductThreshold = async (productId: string, threshold: number) => {
    try {
      await api.updateProduct(productId, { lowStockThreshold: threshold });
      onRefreshProducts();
      setFeedback({
        type: 'success',
        msg: `Safety threshold updated to ${threshold} units for this produce batch.`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        msg: err.message || 'Failed to update safety threshold',
      });
    }
  };

  const handleRestockProduct = async (productId: string, addQuantity: number) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    const newQty = prod.quantity + addQuantity;
    try {
      await api.updateProduct(productId, { quantity: newQty });
      onRefreshProducts();
      setFeedback({
        type: 'success',
        msg: `Restocked ${addQuantity} ${prod.unit} of ${prod.name}! New inventory: ${newQty} ${prod.unit}.`,
      });
      // Clear alert toast if stock now exceeds safety threshold
      const thresh = prod.lowStockThreshold !== undefined ? prod.lowStockThreshold : globalThreshold;
      if (newQty > thresh) {
        setLowStockToasts(prev => prev.filter(t => t.productId !== productId));
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        msg: err.message || 'Failed to restock product',
      });
    }
  };

  const handleSimulateStockDrain = async (productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    const thresh = prod.lowStockThreshold !== undefined ? prod.lowStockThreshold : globalThreshold;
    // Set quantity to slightly below threshold (e.g. 18 units)
    const simulatedQty = Math.max(2, Math.round(thresh * 0.35));
    try {
      await api.updateProduct(productId, { quantity: simulatedQty });
      onRefreshProducts();
      setFeedback({
        type: 'success',
        msg: `Simulated bulk order on ${prod.name}! Stock dropped from ${prod.quantity} to ${simulatedQty} ${prod.unit} (below threshold of ${thresh} ${prod.unit}).`,
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  // Real-Time Low Stock Detection & Toast Notification Trigger
  useEffect(() => {
    if (products.length === 0) return;

    myProducts.forEach(prod => {
      const thresh = prod.lowStockThreshold !== undefined ? prod.lowStockThreshold : globalThreshold;
      const prevQty = previousQuantitiesRef.current[prod.id];
      const currentQty = prod.quantity;

      // Check if stock is currently below or equal to threshold
      if (currentQty <= thresh) {
        // Trigger alert if it's a new breach or quantity dropped further
        const isFreshBreach = prevQty === undefined ? !hasLoadedInitiallyRef.current : (prevQty > thresh || currentQty < prevQty);

        if (isFreshBreach) {
          const newAlert: LowStockToastAlert = {
            id: 'toast_' + prod.id + '_' + Date.now(),
            productId: prod.id,
            productName: prod.name,
            quantity: currentQty,
            unit: prod.unit,
            threshold: thresh,
            image: prod.image,
          };

          setLowStockToasts(prev => {
            const filtered = prev.filter(t => t.productId !== prod.id);
            return [newAlert, ...filtered].slice(0, 3);
          });

          if (soundEnabled) {
            playLowStockChime();
          }

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`⚠️ SeedhaMandi Low Stock: ${prod.name}`, {
                body: `Available stock dropped to ${currentQty} ${prod.unit} (Safety threshold: ${thresh} ${prod.unit}). Harvest/restock required!`,
                icon: '/vite.svg',
              });
            } catch (e) {
              // ignore
            }
          }
        }
      } else {
        // Quantity is healthy, dismiss any toast for this product
        setLowStockToasts(prev => prev.filter(t => t.productId !== prod.id));
      }

      previousQuantitiesRef.current[prod.id] = currentQty;
    });

    hasLoadedInitiallyRef.current = true;
  }, [products, globalThreshold, soundEnabled]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus, `Updated by Farmer: ${newStatus}`);
      await loadFarmerOrdersAndNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleInstantPayout = () => {
    setWithdrawing(true);
    setTimeout(() => {
      setWithdrawing(false);
      setPayoutSuccess(true);
      setTimeout(() => setPayoutSuccess(false), 4000);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-stone-50 py-8 text-stone-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Workspace Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-950 text-white rounded-2xl p-6 shadow-md border border-emerald-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-emerald-950 text-[11px] font-black tracking-wide">
                {role === 'FPO_REP' ? 'FPO COOPERATIVE CONSOLE' : 'VERIFIED FARMER WORKSPACE'}
              </span>
              <span className="text-xs text-emerald-200">
                {user?.district || 'Baramati'}, {user?.state || 'Maharashtra'}
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              {role === 'FPO_REP'
                ? `${user?.fpoName || 'Sahyadri Kisan Samriddhi'} (FPO)`
                : `Welcome, ${user?.name || 'Ramesh Patel'}`}
            </h1>
            <p className="text-xs text-emerald-100 max-w-xl">
              {role === 'FPO_REP'
                ? 'Coordinating 54 registered smallholders without smartphones. Aggregating fresh lots and disbursing direct bank payouts.'
                : '100% direct agricultural realization. Zero mandi deductions or delayed credit.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openSeedhaMitra}
              className="px-4 py-2.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-amber-300 text-xs font-bold border border-emerald-600 flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Crop Advisory</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-black shadow-md flex items-center gap-1.5 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>List New Harvest Lot</span>
            </button>
          </div>
        </div>

        {/* Real-time Floating Low Stock Toast Alerts */}
        <FarmerLowStockToast
          alerts={lowStockToasts}
          onDismiss={(id) => setLowStockToasts(prev => prev.filter(t => t.id !== id))}
          onRestock={(productId, amount) => handleRestockProduct(productId, amount)}
        />

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-rose-100 text-rose-900 border border-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
            )}
            <span>{feedback.msg}</span>
          </div>
        )}

        {/* Live Incoming Order & Harvest Notifications Banner */}
        {notifications.filter(n => !n.isRead && n.recipientRole === 'FARMER').length > 0 && (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                <Bell className="w-4 h-4 text-amber-600 animate-bounce" />
                <span>Harvest & Inventory Alerts</span>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-200/70 px-2.5 py-0.5 rounded-full">
                {notifications.filter(n => !n.isRead && n.recipientRole === 'FARMER').length} Pending Alerts
              </span>
            </div>
            <div className="space-y-2">
              {notifications
                .filter(n => !n.isRead && n.recipientRole === 'FARMER')
                .slice(0, 3)
                .map(notif => (
                  <div
                    key={notif.id}
                    className={`p-3 bg-white rounded-xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                      notif.type === 'LOW_STOCK'
                        ? 'border-amber-400 bg-gradient-to-r from-amber-50/50 to-white'
                        : 'border-amber-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {notif.type === 'LOW_STOCK' && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock Alert
                          </span>
                        )}
                        <span className="font-bold text-stone-900 block">{notif.title}</span>
                      </div>
                      <p className="text-stone-600 text-[11px] mt-0.5">{notif.message}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {notif.type === 'LOW_STOCK' ? (
                        <button
                          onClick={() => {
                            api.markNotificationRead(notif.id);
                            setActiveTab('inventory');
                            loadFarmerOrdersAndNotifs();
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-2xs"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>View Lot & Restock</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            api.markNotificationRead(notif.id);
                            setActiveTab('orders');
                            loadFarmerOrdersAndNotifs();
                          }}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs transition cursor-pointer"
                        >
                          View Order & Pack Crates
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Payout Success Notice */}
        {payoutSuccess && (
          <div className="p-4 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <strong>Aadhaar DBT Payout Disbursed!</strong> ₹{pendingEscrow} has been transferred via IMPS to your linked Bank Account (A/C ending in 4102).
              </div>
            </div>
            <span className="font-mono font-bold text-emerald-800 text-[11px]">UTR #8291039821</span>
          </div>
        )}

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Disbursed</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-stone-900">₹{totalDeliveredRevenue.toLocaleString()}</div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> +31.4% vs APMC Mandi rates
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Escrow Balance</span>
              <ShieldCheck className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-900">₹{pendingEscrow.toLocaleString()}</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-stone-500">Auto-releases upon delivery OTP</span>
              <button
                onClick={handleInstantPayout}
                disabled={withdrawing}
                className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
              >
                {withdrawing ? 'Transferring...' : 'Withdraw DBT'}
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active Harvest Lots</span>
              <Package className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-stone-900">{myProducts.length} Lots</div>
            <p className="text-[11px] text-stone-500 mt-1">Ready for direct urban dispatch</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Open Orders</span>
              <Clock className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-black text-stone-900">{orders.length} Orders</div>
            <p className="text-[11px] text-orange-700 font-semibold mt-1">
              {orders.filter(o => o.status === 'PLACED').length} need packing today
            </p>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex border-b border-stone-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-3 px-5 text-xs font-bold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'border-emerald-700 text-emerald-900 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            My Produce Inventory ({myProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('demand_forecast')}
            className={`py-3 px-5 text-xs font-bold uppercase tracking-wider transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'demand_forecast'
                ? 'border-emerald-700 text-emerald-900 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Demand Forecasting (D3.js)</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[9px]">
              AI Plan
            </span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-5 text-xs font-bold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-emerald-700 text-emerald-900 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Orders & Dispatches ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('sold_history')}
            className={`py-3 px-5 text-xs font-bold uppercase tracking-wider transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'sold_history'
                ? 'border-emerald-700 text-emerald-900 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sold Produce History</span>
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`py-3 px-5 text-xs font-bold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
              activeTab === 'payouts'
                ? 'border-emerald-700 text-emerald-900 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Escrow & DBT Settlements
          </button>
          <button
            onClick={() => setActiveTab('rfqs')}
            className={`py-3 px-5 text-xs font-bold uppercase tracking-wider transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'rfqs'
                ? 'border-emerald-700 text-emerald-900 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>Bulk RFQs & B2B Tenders</span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-stone-950 font-black text-[10px]">
              {rfqs.length}
            </span>
          </button>
        </div>

        {/* TAB 1: INVENTORY TABLE */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Real-time Low Stock Alert System Banner & Control Center */}
            <FarmerLowStockBanner
              products={myProducts}
              globalThreshold={globalThreshold}
              onUpdateGlobalThreshold={handleUpdateGlobalThreshold}
              onUpdateProductThreshold={handleUpdateProductThreshold}
              onRestockProduct={handleRestockProduct}
              onSimulateStockDrain={handleSimulateStockDrain}
              soundEnabled={soundEnabled}
              onToggleSound={() => {
                setSoundEnabled(v => {
                  const next = !v;
                  localStorage.setItem('seedha_farmer_sound_enabled', next.toString());
                  return next;
                });
              }}
            />

            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-stone-700">
                    Live Farmgate Produce Inventory
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Continuous real-time safety threshold monitoring active across all listed harvest consignments.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Produce Batch</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-stone-100/75 text-stone-500 uppercase text-[10px] font-bold border-b border-stone-200">
                    <tr>
                      <th className="p-3.5">Produce & Variety</th>
                      <th className="p-3.5">Attributed Grower</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Farmgate Price</th>
                      <th className="p-3.5">Mandi Benchmark</th>
                      <th className="p-3.5">Available Stock & Threshold</th>
                      <th className="p-3.5">Stock Health Status</th>
                      <th className="p-3.5 text-right">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {myProducts.map(product => {
                      const itemThreshold = product.lowStockThreshold !== undefined ? product.lowStockThreshold : globalThreshold;
                      const isDepleted = product.quantity <= 0;
                      const isLowStock = product.quantity <= itemThreshold;
                      const stockPct = Math.min(100, Math.round((product.quantity / (itemThreshold * 2.5 || 100)) * 100));

                      return (
                        <tr 
                          key={product.id} 
                          className={`transition ${
                            isDepleted 
                              ? 'bg-rose-50/50 hover:bg-rose-50' 
                              : isLowStock 
                              ? 'bg-amber-50/40 hover:bg-amber-50/70' 
                              : 'hover:bg-stone-50/80'
                          }`}
                        >
                          <td className="p-3.5 flex items-center gap-3">
                            <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover shadow-2xs shrink-0" />
                            <div>
                              <div className="font-bold text-stone-900">{product.name}</div>
                              <div className="text-[10px] text-stone-500">{product.location}</div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="font-semibold text-stone-800">
                              {product.actualFarmerName || product.farmerName}
                            </span>
                            {product.isFpoListed && (
                              <span className="block text-[9px] text-orange-600 font-bold">FPO Aggregated</span>
                            )}
                          </td>
                          <td className="p-3.5 font-medium">{product.category}</td>
                          <td className="p-3.5 font-bold text-emerald-800">₹{product.price}/{product.unit}</td>
                          <td className="p-3.5 text-stone-500">
                            {product.mandiBenchmarkPrice ? `₹${product.mandiBenchmarkPrice}/${product.unit}` : '—'}
                          </td>

                          {/* Available Stock & Safety Threshold */}
                          <td className="p-3.5">
                            <div className="space-y-1 min-w-[130px]">
                              <div className="flex items-center justify-between font-bold text-xs">
                                <span className={isDepleted ? 'text-rose-700 font-black' : isLowStock ? 'text-amber-800 font-black' : 'text-stone-900'}>
                                  {product.quantity} {product.unit}
                                </span>
                                <span className="text-[10px] text-stone-400 font-normal">
                                  Alert: ≤{itemThreshold} {product.unit}
                                </span>
                              </div>
                              <div className="w-full h-2 bg-stone-200/80 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isDepleted
                                      ? 'bg-rose-600'
                                      : isLowStock
                                      ? 'bg-amber-500 animate-pulse'
                                      : 'bg-emerald-600'
                                  }`}
                                  style={{ width: `${Math.max(6, stockPct)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Stock Health Status */}
                          <td className="p-3.5">
                            {isDepleted ? (
                              <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white font-black text-[10px] flex items-center gap-1 w-fit shadow-2xs">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Depleted (0 {product.unit})</span>
                              </span>
                            ) : isLowStock ? (
                              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-950 border border-amber-300 font-black text-[10px] flex items-center gap-1.5 w-fit animate-pulse shadow-2xs">
                                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Low Stock Alert ({product.quantity} left)</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1.5 w-fit">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Healthy Stock</span>
                              </span>
                            )}
                          </td>

                          {/* Quick Actions */}
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleRestockProduct(product.id, product.unit === 'crates' ? 25 : 100)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] flex items-center gap-1 transition active:scale-95 shadow-2xs cursor-pointer"
                                title={`Restock +${product.unit === 'crates' ? '25 Crates' : '100 kg'}`}
                              >
                                <Plus className="w-3 h-3" />
                                <span>Restock (+{product.unit === 'crates' ? '25' : '100'})</span>
                              </button>

                              <button
                                onClick={() => handleSimulateStockDrain(product.id)}
                                className="px-2 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center gap-1 transition cursor-pointer"
                                title="Simulate rapid stock drain to trigger low-stock alert"
                              >
                                <span>Drain Test</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: DEMAND FORECASTING (D3.JS) */}
        {activeTab === 'demand_forecast' && (
          <FarmerDemandInventoryD3Chart products={products} />
        )}

        {/* TAB 2: ORDERS FULFILLMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500 space-y-2">
                <Package className="w-12 h-12 mx-auto text-stone-300" />
                <p className="font-bold text-sm text-stone-800">No customer orders placed yet</p>
                <p className="text-xs text-stone-500">Orders placed by consumers will appear here in real time.</p>
              </div>
            ) : (
              orders.map(order => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-stone-800">#{order.id}</span>
                      <span className="text-xs text-stone-500">• {new Date(order.createdAt).toLocaleDateString()}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                        {order.status}
                      </span>
                      {order.isBulkOrder && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[10px] font-black flex items-center gap-1 shadow-xs">
                          <Boxes className="w-3 h-3" /> BULK MANDI ORDER
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-stone-600">
                      Destination: <span className="font-semibold text-stone-900">{order.shippingAddress.street}, {order.shippingAddress.city}</span>
                    </div>
                  </div>

                  {/* Logistics Carrier Assignment Status Banner */}
                  <div className="p-2.5 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-stone-50 border border-stone-200/80">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <span className="text-[11px] text-stone-500 font-bold uppercase">Logistics Dispatch: </span>
                        {order.logisticsId ? (
                          <span className="font-bold text-blue-900">
                            Assigned to KisanVahan Logistics ({order.vehicleNumber || 'OD 02 AX 8840'})
                          </span>
                        ) : (
                          <span className="font-semibold text-amber-700">
                            Broadcasting offer to nearby Bhubaneswar drivers...
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-stone-600">
                      <span>Assigned Vehicle:</span>
                      <span className="font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                        {order.vehicleTypeRequired === 'TRACTOR' ? '🚜 Tractor / Agro Trolley' :
                         order.vehicleTypeRequired === 'MINI_TRUCK' ? '🚚 Mini Truck (Tata Ace)' :
                         order.vehicleTypeRequired === 'BIKE_SCOOTY' ? '🛵 Bike / Scooty' :
                         order.vehicleTypeRequired === 'REEFER_VAN' ? '❄️ Reefer Cold Van' : '🚚 Standard Truck'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Items */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Ordered Produce</div>
                      {order.items.map((it, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-2 bg-stone-50 rounded-lg">
                          <span>{it.name} ({it.quantity} {it.unit})</span>
                          <span className="font-bold text-stone-900">₹{it.price * it.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Escrow Value & Actions */}
                    <div className="flex flex-col justify-between p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-emerald-950 font-bold">Escrow Payout Value:</span>
                        <span className="text-lg font-black text-emerald-900">₹{order.itemsTotal}</span>
                      </div>

                      {/* Status Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {order.status === 'PLACED' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'CONFIRMED')}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold"
                          >
                            Confirm Produce Availability
                          </button>
                        )}
                        {order.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'PREPARING')}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold"
                          >
                            Mark Harvested & Packed in Crates
                          </button>
                        )}
                        {order.status === 'PREPARING' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'PICKED_UP')}
                            className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Handover to Logistics Carrier</span>
                          </button>
                        )}
                        {order.status === 'DELIVERED' && (
                          <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Payment Released to Bank Account</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: SOLD PRODUCE HISTORY */}
        {activeTab === 'sold_history' && (
          <div className="space-y-6">
            {/* Header & Impact Highlights */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Fulfilled Direct Sales Ledger</span>
                    </span>
                    <span className="text-xs text-stone-500 font-mono">100% Aadhaar DBT Settled</span>
                  </div>
                  <h3 className="text-lg font-black text-stone-900 mt-1">
                    Sold Harvest Consignments & Disbursed Earnings
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Complete immutable history of all crop lots sold directly to consumers and bulk institutions without APMC middlemen commissions.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Zero Middleman Cuts (0%)</span>
                  </span>
                </div>
              </div>

              {/* Realized Metric Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-500 font-bold uppercase block">Total Volume Sold</span>
                  <span className="text-xl font-black text-stone-900 mt-0.5 block">3,450 kg</span>
                  <span className="text-[10px] text-emerald-700 font-medium">Across 14 direct dispatches</span>
                </div>

                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-500 font-bold uppercase block">Net Direct Revenue</span>
                  <span className="text-xl font-black text-emerald-800 mt-0.5 block">₹51,840</span>
                  <span className="text-[10px] text-emerald-700 font-medium">Credited to SBI A/C ••4102</span>
                </div>

                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-500 font-bold uppercase block">Extra Profit vs Mandi</span>
                  <span className="text-xl font-black text-amber-900 mt-0.5 block">+₹13,290</span>
                  <span className="text-[10px] text-amber-700 font-bold">+34.5% higher farmgate realization</span>
                </div>

                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-500 font-bold uppercase block">Payout Settlement Status</span>
                  <span className="text-xl font-black text-stone-900 mt-0.5 block">100% Cleared</span>
                  <span className="text-[10px] text-stone-500">Escrow released via IMPS</span>
                </div>
              </div>
            </div>

            {/* Sold Items Table */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700">
                  Delivered Lots & Direct Payment Receipts
                </h4>
                <span className="text-xs text-stone-500 font-medium">Auto-synced with Consumer OTP confirmations</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-stone-100/75 text-stone-500 uppercase text-[10px] font-bold border-b border-stone-200">
                    <tr>
                      <th className="p-3.5">Consignment ID & Date</th>
                      <th className="p-3.5">Produce & Lot Size</th>
                      <th className="p-3.5">Direct Buyer</th>
                      <th className="p-3.5">Sold Rate vs Mandi</th>
                      <th className="p-3.5">Net Payout</th>
                      <th className="p-3.5">Margin Gain</th>
                      <th className="p-3.5">Disbursement Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {[
                      {
                        lotId: 'LOT-SLD-8941',
                        orderId: 'ord_1079',
                        date: 'Delivered 2 days ago',
                        name: 'Fresh Nashik Red Onions (Direct Farm Lot)',
                        qty: '25 kg Sack',
                        buyer: 'Ananya Sharma',
                        buyerType: 'Urban Consumer (HAL 2nd Stage)',
                        soldRate: '₹28/kg',
                        mandiRate: '₹20/kg',
                        payout: '₹700',
                        gain: '+₹200 (+40%)',
                        ref: 'IMPS-92018471',
                        status: 'Disbursed to Bank',
                      },
                      {
                        lotId: 'LOT-SLD-8938',
                        orderId: 'ord_1079',
                        date: 'Delivered 2 days ago',
                        name: 'Sehore Sharbati Gehu / Wheat',
                        qty: '30 kg Grain Bag',
                        buyer: 'Ananya Sharma',
                        buyerType: 'Urban Consumer (HAL 2nd Stage)',
                        soldRate: '₹44/kg',
                        mandiRate: '₹32/kg',
                        payout: '₹1,320',
                        gain: '+₹360 (+37.5%)',
                        ref: 'IMPS-92018472',
                        status: 'Disbursed to Bank',
                      },
                      {
                        lotId: 'LOT-SLD-8920',
                        orderId: 'ord_1065',
                        date: 'Delivered 7 days ago',
                        name: 'Desi Chana / Bengal Gram (Unpolished)',
                        qty: '40 kg Sacks',
                        buyer: 'Ananya Sharma',
                        buyerType: 'Urban Consumer (HAL 2nd Stage)',
                        soldRate: '₹78/kg',
                        mandiRate: '₹66/kg',
                        payout: '₹3,120',
                        gain: '+₹480 (+18.2%)',
                        ref: 'IMPS-83910245',
                        status: 'Disbursed to Bank',
                      },
                      {
                        lotId: 'LOT-SLD-8915',
                        orderId: 'ord_1065',
                        date: 'Delivered 7 days ago',
                        name: 'Organic Vine Ripe Tomatoes (Polyhouse)',
                        qty: '10 kg Crates',
                        buyer: 'Ananya Sharma',
                        buyerType: 'Urban Consumer (HAL 2nd Stage)',
                        soldRate: '₹32/kg',
                        mandiRate: '₹22/kg',
                        payout: '₹320',
                        gain: '+₹100 (+45.4%)',
                        ref: 'IMPS-83910246',
                        status: 'Disbursed to Bank',
                      },
                      {
                        lotId: 'LOT-SLD-8894',
                        orderId: 'ord_bulk_910',
                        date: 'Delivered 12 days ago',
                        name: 'Nashik Red Onions (Grade A Export Quality)',
                        qty: '450 kg Bulk Lot',
                        buyer: 'Taj Vivanta Kitchens',
                        buyerType: 'Commercial Hospitality Buyer',
                        soldRate: '₹31/kg',
                        mandiRate: '₹22/kg',
                        payout: '₹13,950',
                        gain: '+₹4,050 (+40.9%)',
                        ref: 'RTGS-01928472',
                        status: 'Disbursed to Bank',
                      },
                      {
                        lotId: 'LOT-SLD-8872',
                        orderId: 'ord_bulk_892',
                        date: 'Delivered 18 days ago',
                        name: 'Organic Vine Ripe Tomatoes',
                        qty: '280 kg Crate Sacks',
                        buyer: 'Puri Jagannath Bhojanalaya',
                        buyerType: 'Cooperative Institution',
                        soldRate: '₹29/kg',
                        mandiRate: '₹19/kg',
                        payout: '₹8,120',
                        gain: '+₹2,800 (+52.6%)',
                        ref: 'IMPS-72910481',
                        status: 'Disbursed to Bank',
                      },
                      {
                        lotId: 'LOT-SLD-8840',
                        orderId: 'ord_bulk_870',
                        date: 'Delivered 24 days ago',
                        name: 'Sehore Sharbati Gehu (Gold Grain Lot)',
                        qty: '550 kg Grain Sacks',
                        buyer: 'Bengaluru Healthy Bakes Federation',
                        buyerType: 'Artisan Bakery Network',
                        soldRate: '₹44/kg',
                        mandiRate: '₹33/kg',
                        payout: '₹24,200',
                        gain: '+₹6,050 (+33.3%)',
                        ref: 'RTGS-98120412',
                        status: 'Disbursed to Bank',
                      },
                    ].map(row => (
                      <tr key={row.lotId} className="hover:bg-stone-50/80 transition">
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-stone-900">{row.lotId}</div>
                          <div className="text-[10px] text-stone-500">{row.date}</div>
                          <span className="text-[9px] text-stone-400 font-mono">Ref #{row.orderId}</span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-stone-900">{row.name}</div>
                          <div className="text-[11px] text-stone-500 font-medium">Batch: {row.qty}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-stone-800">{row.buyer}</div>
                          <div className="text-[10px] text-stone-500">{row.buyerType}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-stone-900">{row.soldRate}</span>
                          <span className="block text-[10px] text-stone-400 line-through">
                            Mandi: {row.mandiRate}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-black text-emerald-800 text-sm">{row.payout}</span>
                          <span className="block text-[9px] text-emerald-600 font-semibold">100% Farmgate</span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                            {row.gain}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-mono text-[11px] font-bold text-stone-700">{row.ref}</div>
                          <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{row.status}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PAYOUT SETTLEMENTS */}
        {activeTab === 'payouts' && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Bank Account & Direct Benefit Transfer (DBT)</h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Verified Aadhaar-seeded Account for 100% Broker-Free Settlement
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> KYC Verified
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                <div className="text-stone-500 font-bold mb-1">Bank Name:</div>
                <div className="font-semibold text-stone-900">State Bank of India (SBI)</div>
              </div>
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                <div className="text-stone-500 font-bold mb-1">Account Number:</div>
                <div className="font-mono font-semibold text-stone-900">•••• •••• 4102</div>
              </div>
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                <div className="text-stone-500 font-bold mb-1">IFSC Code / Branch:</div>
                <div className="font-mono font-semibold text-stone-900">SBIN0001248 (Baramati Agro Hub)</div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1.5 text-stone-700">
              <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>SeedhaMandi Escrow Safeguard</span>
              </div>
              <p className="leading-relaxed">
                Every rupee is securely escrowed by our RBI-compliant nodal banking partner. Once the urban consumer confirms delivery inspection via their 6-digit OTP, your payout is automatically credited via IMPS within 15 minutes.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: BULK RFQs & B2B TENDERS */}
        {activeTab === 'rfqs' && (
          <div className="space-y-6">
            <div className="p-5 bg-gradient-to-r from-emerald-900 to-stone-900 text-white rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Direct Institutional Demand
                </span>
                <h3 className="text-xl font-black mt-1">Institutional Procurement Orders & RFQs</h3>
                <p className="text-xs text-stone-300 mt-1 max-w-2xl">
                  Hotels, college canteens, and bulk processors post guaranteed purchase commitments. Accept to lock in bulk sales at guaranteed farmgate prices with scheduled freight dispatch.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {rfqs.map(rfq => (
                <div
                  key={rfq.id}
                  className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                          {rfq.organization}
                        </span>
                        <h4 className="font-extrabold text-stone-900 text-base">{rfq.cropName}</h4>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${
                        rfq.status === 'MATCHED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {rfq.status}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 space-y-2 text-xs">
                      <div className="flex justify-between text-stone-600">
                        <span>Required Volume:</span>
                        <span className="font-black text-stone-900">{rfq.quantityRequired.toLocaleString()} {rfq.unit}</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>Offered Buying Price:</span>
                        <span className="font-black text-emerald-800">₹{rfq.targetPricePerUnit}/{rfq.unit}</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>Gross Contract Value:</span>
                        <span className="font-black text-amber-900">
                          ₹{(rfq.quantityRequired * rfq.targetPricePerUnit).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>Logistics Fleet:</span>
                        <span className="font-bold text-blue-800">
                          {rfq.vehicleTypeRequired === 'TRACTOR' ? '🚜 Tractor Trolley' : '🚚 Mini Truck'}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-stone-500">
                      Destination: <strong>{rfq.deliveryLocation}</strong>
                      {rfq.matchedFarmerOrFpo && (
                        <div className="text-emerald-700 font-bold mt-1">
                          Matched with: {rfq.matchedFarmerOrFpo}
                        </div>
                      )}
                    </div>
                  </div>

                  {rfq.status === 'OPEN' ? (
                    <button
                      onClick={async () => {
                        try {
                          await api.matchRfq(rfq.id);
                          loadFarmerOrdersAndNotifs();
                          setFeedback({
                            type: 'success',
                            msg: 'Harvest Contract Locked! Logistics dispatch notification sent to regional fleet.',
                          });
                        } catch (err: any) {
                          setFeedback({
                            type: 'error',
                            msg: err.message || 'Failed to match RFQ',
                          });
                        }
                      }}
                      className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept & Contract Harvest</span>
                    </button>
                  ) : (
                    <div className="w-full py-2 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs text-center border border-emerald-200">
                      Contract Locked
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Harvest Lot Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-8">
            <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sprout className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-base tracking-tight">List Fresh Harvest Lot</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-emerald-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
              {role === 'FPO_REP' && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl space-y-2">
                  <label className="block text-xs font-bold text-orange-950">
                    FPO Cooperative Attributed Farmer:
                  </label>
                  <input
                    type="text"
                    required
                    value={actualFarmerName}
                    onChange={e => setActualFarmerName(e.target.value)}
                    placeholder="Enter rural farmer's full name (e.g. Dnyaneshwar Shinde)"
                    className="w-full bg-white border border-orange-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                  <p className="text-[11px] text-orange-800">
                    This lot will be listed under the FPO with transparent attribution to this village smallholder.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Produce Name & Variety</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Red Nashik Onions"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Grains">Grains</option>
                    <option value="Pulses">Pulses</option>
                    <option value="Spices">Spices</option>
                    <option value="Dairy">Dairy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Your Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Mandi Benchmark (₹)</label>
                  <input
                    type="number"
                    value={mandiPrice}
                    onChange={e => setMandiPrice(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Unit</label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="kg">per kg</option>
                    <option value="crate">per crate (20kg)</option>
                    <option value="quintal">per quintal (100kg)</option>
                    <option value="box">per dozen box</option>
                    <option value="litre">per litre</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Total Quantity</label>
                  <input
                    type="number"
                    required
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Min. Order Qty</label>
                  <input
                    type="number"
                    required
                    value={minOrderQty}
                    onChange={e => setMinOrderQty(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">Low Stock Alert (≤)</label>
                  <input
                    type="number"
                    required
                    value={lowStockThresholdInput}
                    onChange={e => setLowStockThresholdInput(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-amber-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Quality Grade</label>
                <select
                  value={qualityGrade}
                  onChange={e => setQualityGrade(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="Grade A (Export Quality)">Grade A (Export Quality)</option>
                  <option value="Grade A (Super Table Grade)">Grade A (Super Table Grade)</option>
                  <option value="Grade B (Processing Grade)">Grade B (Processing Grade)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Harvest Notes / Details</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Harvested yesterday morning, sorted and packed in ventilated crates, zero chemical spraying in last 25 days."
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="organicCheck"
                  checked={organicCertified}
                  onChange={e => setOrganicCertified(e.target.checked)}
                  className="rounded text-emerald-700"
                />
                <label htmlFor="organicCheck" className="text-xs text-stone-700 font-semibold cursor-pointer">
                  Chemical-Free / Certified Organic Produce
                </label>
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  {submitting ? 'Publishing Lot...' : 'Publish to Live Marketplace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
