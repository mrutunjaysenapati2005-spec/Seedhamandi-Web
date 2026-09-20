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
  VolumeX,
  XCircle,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Product, Order, OrderStatus, AppNotification, BulkRfq } from '../types';
import { api } from '../services/api';
import { realtimeService } from '../services/realtime';
import { FarmerDemandInventoryD3Chart } from '../components/FarmerDemandInventoryD3Chart';
import { FarmersEarningChart } from '../components/FarmersEarningChart';
import { 
  FarmerLowStockBanner, 
  FarmerLowStockToast, 
  LowStockToastAlert, 
  playLowStockChime 
} from '../components/FarmerLowStockAlerts';
import {
  FarmerIncomingOrderModal,
  FarmerIncomingOrderToast,
  DemoPurchaseTriggerButton,
  playIncomingOrderChime,
} from '../components/FarmerIncomingOrderNotification';
import { LogisticsPartner } from '../types';

interface FarmerDashboardProps {
  products: Product[];
  onRefreshProducts: () => void;
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  products,
  onRefreshProducts,
}) => {
  const { user, role, openSeedhaMitra, escrowDisbursedDelta, completedDeliveryIds } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [rfqs, setRfqs] = useState<BulkRfq[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'demand_forecast' | 'orders' | 'sold_history' | 'payouts' | 'rfqs'>('inventory');

  // Interactive Customer Order Decision & Logistics Assignment State
  const [logisticsPartners, setLogisticsPartners] = useState<LogisticsPartner[]>([]);
  const [activeModalOrder, setActiveModalOrder] = useState<Order | null>(null);
  const [incomingOrderToast, setIncomingOrderToast] = useState<Order | null>(null);
  const [isSimulatingCustomerOrder, setIsSimulatingCustomerOrder] = useState(false);

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

  const loadFarmerOrdersAndNotifs = async (silent = false) => {
    try {
      if (!silent) setLoadingOrders(true);
      const [ordRes, notifRes, rfqRes, logRes] = await Promise.all([
        api.getOrders(),
        api.getNotifications(),
        api.getRfqs(),
        api.getLogisticsPartners(),
      ]);
      if (ordRes && Array.isArray(ordRes.orders)) setOrders(ordRes.orders);
      if (notifRes && Array.isArray(notifRes.notifications)) setNotifications(notifRes.notifications);
      if (rfqRes && Array.isArray(rfqRes.rfqs)) setRfqs(rfqRes.rfqs);
      if (logRes && Array.isArray(logRes.partners)) setLogisticsPartners(logRes.partners);
    } catch {
      // Gracefully handle transient network glitches during background sync
    } finally {
      if (!silent) setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadFarmerOrdersAndNotifs(false);

    // Real-time subscription for live orders and notifications
    const unsubscribe = realtimeService.subscribe((event) => {
      if (event.type === 'order:created' && event.data?.order) {
        const newOrder = event.data.order;
        setOrders(prev => {
          if (prev.some(o => o.id === newOrder.id)) return prev;
          return [newOrder, ...prev];
        });

        // Trigger interactive toast and audio alert for farmer
        setIncomingOrderToast(newOrder);
        if (soundEnabled) {
          playIncomingOrderChime();
        }
      } else if (event.type === 'order:status_change' && event.data?.order) {
        const updated = event.data.order;
        setOrders(prev => prev.map(o => (o.id === updated.id ? updated : o)));
        setActiveModalOrder(prev => (prev && prev.id === updated.id ? updated : prev));
      }
    });

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      loadFarmerOrdersAndNotifs(true);
    }, 8000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [soundEnabled]);

  const myProducts = products.filter(
    p => p.farmerId === (user?.id || 'usr_farmer_1') || p.farmerName.includes('Ramesh') || role === 'FPO_REP'
  );

  const totalDeliveredRevenue =
    orders
      .filter(o => o.status === 'DELIVERED' || completedDeliveryIds.includes(o.id))
      .reduce((sum, o) => sum + o.itemsTotal, 0) +
    (role === 'FPO_REP' ? 96500 : 38400) +
    escrowDisbursedDelta;

  const basePendingEscrow =
    orders
      .filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && !completedDeliveryIds.includes(o.id))
      .reduce((sum, o) => sum + o.itemsTotal, 0) + 7200;

  const pendingEscrow = Math.max(0, basePendingEscrow - escrowDisbursedDelta);

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

  const handleRejectOrder = async (orderId: string, reason: string) => {
    try {
      await api.updateOrderStatus(orderId, 'REJECTED_LOW_STOCK', reason, undefined, undefined, reason);
      setFeedback({
        type: 'success',
        msg: `Order #${orderId} rejected due to low stock. Escrow funds refunded to customer.`,
      });
      setIncomingOrderToast(prev => (prev?.id === orderId ? null : prev));
      await loadFarmerOrdersAndNotifs(true);
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.message || 'Failed to reject order' });
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await api.updateOrderStatus(orderId, 'CONFIRMED', 'Order accepted by Farmer. Ready for logistics dispatch.');
      setFeedback({
        type: 'success',
        msg: `Order #${orderId} accepted! Please assign a delivery partner.`,
      });
      setIncomingOrderToast(prev => (prev?.id === orderId ? null : prev));
      await loadFarmerOrdersAndNotifs(true);
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.message || 'Failed to accept order' });
    }
  };

  const handleAssignDeliveryPartner = async (orderId: string, partner: LogisticsPartner) => {
    try {
      await api.updateOrderStatus(
        orderId,
        'CONFIRMED',
        `Carrier ${partner.name} assigned for dispatch pickup.`,
        partner.id,
        partner.vehicleNumber
      );
      setFeedback({
        type: 'success',
        msg: `Delivery partner ${partner.name} assigned! Dispatch en route to farm gate.`,
      });
      await loadFarmerOrdersAndNotifs(true);
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.message || 'Failed to assign delivery partner' });
    }
  };

  const handlePackAndTransfer = async (orderId: string, partnerName: string, vehicleNumber: string) => {
    try {
      await api.updateOrderStatus(
        orderId,
        'PICKED_UP',
        `Harvest packed into crates and transferred to delivery carrier ${partnerName} (${vehicleNumber}). In transit.`
      );
      setFeedback({
        type: 'success',
        msg: `Order #${orderId} packed and handed over to ${partnerName}! Consignment is in transit.`,
      });
      await loadFarmerOrdersAndNotifs(true);
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.message || 'Failed to transfer order' });
    }
  };

  const handleTriggerDemoCustomerPurchase = async (preset?: {
    productId?: string;
    quantity?: number;
    customerName?: string;
    customerCity?: string;
  }) => {
    try {
      setIsSimulatingCustomerOrder(true);
      const res = await api.simulateCustomerOrder(preset);
      if (res && res.order) {
        setOrders(prev => [res.order, ...prev.filter(o => o.id !== res.order.id)]);
        setIncomingOrderToast(res.order);
        setActiveModalOrder(res.order);
        if (soundEnabled) {
          playIncomingOrderChime();
        }
        setFeedback({
          type: 'success',
          msg: `Demo order #${res.order.id} simulated! Customer ${res.order.consumerName} wants to buy ${res.order.items[0]?.quantity} ${res.order.items[0]?.unit} of ${res.order.items[0]?.name}.`,
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.message || 'Failed to simulate customer purchase' });
    } finally {
      setIsSimulatingCustomerOrder(false);
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
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-8 text-stone-900 dark:text-stone-100">
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

          <div className="flex flex-wrap items-center gap-3">
            <DemoPurchaseTriggerButton
              products={myProducts.length > 0 ? myProducts : products}
              onTriggerDemo={handleTriggerDemoCustomerPurchase}
              isSimulating={isSimulatingCustomerOrder}
            />

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

        {/* Real-time Floating Customer Incoming Order Toast */}
        {incomingOrderToast && (
          <div className="fixed bottom-4 left-4 right-4 sm:bottom-auto sm:top-20 sm:right-6 sm:left-auto z-50 max-w-md mx-auto sm:mx-0 animate-in slide-in-from-bottom-4 sm:slide-in-from-top-4 duration-300">
            <FarmerIncomingOrderToast
              order={incomingOrderToast}
              onOpenDetails={(ord) => {
                setActiveModalOrder(ord);
                setIncomingOrderToast(null);
              }}
              onQuickReject={(ord) => {
                handleRejectOrder(ord.id, 'Harvest stock is low and current batch is reserved.');
              }}
              onQuickAccept={(ord) => {
                setActiveModalOrder(ord);
                setIncomingOrderToast(null);
              }}
              onDismiss={() => setIncomingOrderToast(null)}
            />
          </div>
        )}

        {/* Full Step-by-Step Customer Order Decision & Logistics Assignment Modal */}
        {activeModalOrder && (
          <FarmerIncomingOrderModal
            order={activeModalOrder}
            product={products.find(p => p.id === activeModalOrder.items[0]?.productId)}
            availablePartners={logisticsPartners}
            onClose={() => setActiveModalOrder(null)}
            onRejectOrder={handleRejectOrder}
            onAcceptOrder={handleAcceptOrder}
            onAssignDeliveryPartner={handleAssignDeliveryPartner}
            onPackAndTransfer={handlePackAndTransfer}
          />
        )}

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
                    className={`p-3 bg-white dark:bg-stone-900 rounded-xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
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
                        <span className="font-bold text-stone-900 dark:text-stone-100 block">{notif.title}</span>
                      </div>
                      <p className="text-stone-600 dark:text-stone-300 text-[11px] mt-0.5">{notif.message}</p>
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
          <div className="bg-white dark:bg-stone-900 transition-colors p-5 rounded-2xl border border-stone-200/90 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Disbursed</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-stone-900 dark:text-stone-100">₹{totalDeliveredRevenue.toLocaleString()}</div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> +31.4% vs APMC Mandi rates
            </p>
          </div>

          <div className="bg-white dark:bg-stone-900 transition-colors p-5 rounded-2xl border border-stone-200/90 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Escrow Balance</span>
              <ShieldCheck className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-900">₹{pendingEscrow.toLocaleString()}</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-stone-500 dark:text-stone-400">Auto-releases upon delivery OTP</span>
              <button
                onClick={handleInstantPayout}
                disabled={withdrawing}
                className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
              >
                {withdrawing ? 'Transferring...' : 'Withdraw DBT'}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 transition-colors p-5 rounded-2xl border border-stone-200/90 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active Harvest Lots</span>
              <Package className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-stone-900 dark:text-stone-100">{myProducts.length} Lots</div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">Ready for direct urban dispatch</p>
          </div>

          <div className="bg-white dark:bg-stone-900 transition-colors p-5 rounded-2xl border border-stone-200/90 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Open Orders</span>
              <Clock className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-black text-stone-900 dark:text-stone-100">{orders.length} Orders</div>
            <p className="text-[11px] text-orange-700 font-semibold mt-1">
              {orders.filter(o => o.status === 'PLACED').length} need packing today
            </p>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 overflow-x-auto whitespace-nowrap scrollbar-none transition-colors -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-3 px-5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'inventory'
                ? 'border-emerald-700 text-emerald-900 dark:text-emerald-400 bg-white dark:bg-stone-900/50'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            My Produce Inventory ({myProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('demand_forecast')}
            className={`py-3 px-5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'demand_forecast'
                ? 'border-emerald-700 text-emerald-900 dark:text-emerald-400 bg-white dark:bg-stone-900/50'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
            <span>Demand Forecasting (D3.js)</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 font-black text-[9px]">
              AI Plan
            </span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'orders'
                ? 'border-emerald-700 text-emerald-900 dark:text-emerald-400 bg-white dark:bg-stone-900/50'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            Orders & Dispatches ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('sold_history')}
            className={`py-3 px-5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'sold_history'
                ? 'border-emerald-700 text-emerald-900 dark:text-emerald-400 bg-white dark:bg-stone-900/50'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
            <span>Sold Produce History</span>
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`py-3 px-5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'payouts'
                ? 'border-emerald-700 text-emerald-900 dark:text-emerald-400 bg-white dark:bg-stone-900/50'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            Escrow & DBT Settlements
          </button>
          <button
            onClick={() => setActiveTab('rfqs')}
            className={`py-3 px-5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'rfqs'
                ? 'border-emerald-700 text-emerald-900 dark:text-emerald-400 bg-white dark:bg-stone-900/50'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
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

            <div className="bg-white dark:bg-stone-900 transition-colors rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 dark:bg-stone-950">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-stone-700 dark:text-stone-300">
                    Live Farmgate Produce Inventory
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
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

              {/* Vertical Stacked Cards for Farmgate Produce Inventory */}
              <div className="p-4 sm:p-5 space-y-4">
                {myProducts.map(product => {
                  const itemThreshold = product.lowStockThreshold !== undefined ? product.lowStockThreshold : globalThreshold;
                  const isDepleted = product.quantity <= 0;
                  const isLowStock = product.quantity <= itemThreshold;
                  const stockPct = Math.min(100, Math.round((product.quantity / (itemThreshold * 2.5 || 100)) * 100));
                  const harvestDateFormatted = product.harvestDate || 'Harvested 2 days ago (Peak Freshness)';

                  return (
                    <div
                      key={product.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-xs ${
                        isDepleted
                          ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                          : isLowStock
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 ring-1 ring-amber-400/30'
                          : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-emerald-500/50'
                      }`}
                    >
                      {/* Top Header: Image, Variety, Grower & Price */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover shadow-xs shrink-0 border border-stone-200 dark:border-stone-700"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100 leading-tight">
                                {product.name}
                              </h3>
                              {product.isFpoListed && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300">
                                  FPO Aggregated
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                                {product.category}
                              </span>
                              {(product.name.toLowerCase().includes('strawberr') ||
                                product.name.toLowerCase().includes('tomato') ||
                                product.name.toLowerCase().includes('polyhouse') ||
                                product.category === 'FRUITS') && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-700 shadow-2xs">
                                  <span>❄️</span>
                                  <span>IoT Reefer Cold-Chain Assigned - 4.2°C Active</span>
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                              Grower: <strong className="text-stone-800 dark:text-stone-200">{product.actualFarmerName || product.farmerName}</strong> • {product.location}
                            </p>

                            <div className="flex items-center gap-1.5 mt-1 text-xs text-stone-600 dark:text-stone-300">
                              <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span className="font-medium text-[11px]">{harvestDateFormatted}</span>
                            </div>
                          </div>
                        </div>

                        {/* Price & Mandi Benchmark */}
                        <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-start pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-stone-800">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-stone-400 block sm:text-right">Farmgate Price</span>
                            <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                              ₹{product.price}
                              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">/{product.unit}</span>
                            </div>
                          </div>
                          {product.mandiBenchmarkPrice && (
                            <span className="text-[11px] text-stone-500 dark:text-stone-400">
                              Mandi ref: ₹{product.mandiBenchmarkPrice}/{product.unit}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stock Health Progress Bar */}
                      <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-800 dark:text-stone-200">
                              Available Lot Stock:
                            </span>
                            <span className={`font-black ${isDepleted ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {product.quantity} {product.unit}
                            </span>
                            <span className="text-[11px] text-stone-400">
                              (Threshold: ≤{itemThreshold} {product.unit})
                            </span>
                          </div>

                          <div>
                            {isDepleted ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-black text-[10px] flex items-center gap-1 shadow-2xs">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Depleted</span>
                              </span>
                            ) : isLowStock ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-black text-[10px] flex items-center gap-1 animate-pulse shadow-2xs">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                <span>Low Stock</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Healthy Stock</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar (emerald for healthy, amber for low stock) */}
                        <div className="w-full h-2.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
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

                      {/* Full-width 48px touch-target action button ("+ Restock Lot") */}
                      <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center gap-2">
                        <button
                          onClick={() => handleRestockProduct(product.id, product.unit === 'crates' ? 25 : 100)}
                          className="w-full min-h-[48px] h-12 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-black text-sm flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Restock Lot (+{product.unit === 'crates' ? '25 Crates' : '100 kg'})</span>
                        </button>

                        <button
                          onClick={() => handleSimulateStockDrain(product.id)}
                          className="w-full sm:w-auto min-h-[48px] h-12 px-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
                          title="Simulate rapid stock drain for hackathon demo"
                        >
                          <span>Simulate Drain</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
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
              <div className="bg-white dark:bg-stone-900 transition-colors rounded-2xl border border-stone-200 dark:border-stone-700 p-12 text-center text-stone-500 dark:text-stone-400 space-y-2">
                <Package className="w-12 h-12 mx-auto text-stone-300" />
                <p className="font-bold text-sm text-stone-800 dark:text-stone-200">No customer orders placed yet</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Orders placed by consumers will appear here in real time.</p>
              </div>
            ) : (
              orders.map(order => (
                <div
                  key={order.id}
                  className="bg-white dark:bg-stone-900 transition-colors rounded-2xl border border-stone-200 dark:border-stone-700 p-5 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-stone-800 dark:text-stone-200">#{order.id}</span>
                      <span className="text-xs text-stone-500 dark:text-stone-400">• {new Date(order.createdAt).toLocaleDateString()}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                        {order.status}
                      </span>
                      {order.isBulkOrder && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[10px] font-black flex items-center gap-1 shadow-xs">
                          <Boxes className="w-3 h-3" /> BULK MANDI ORDER
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-stone-600 dark:text-stone-300">
                      Destination: <span className="font-semibold text-stone-900 dark:text-stone-100">{order.shippingAddress.street}, {order.shippingAddress.city}</span>
                    </div>
                  </div>

                  {/* Logistics Carrier Assignment Status Banner */}
                  <div className="p-2.5 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-stone-50 dark:bg-stone-950 border border-stone-200/80">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 font-bold uppercase">Logistics Dispatch: </span>
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
                    <div className="flex items-center gap-2 text-[11px] text-stone-600 dark:text-stone-300">
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
                      <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Ordered Produce</div>
                      {order.items.map((it, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-2 bg-stone-50 dark:bg-stone-950 rounded-lg">
                          <span>{it.name} ({it.quantity} {it.unit})</span>
                          <span className="font-bold text-stone-900 dark:text-stone-100">₹{it.price * it.quantity}</span>
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
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {order.status === 'PLACED' && (
                          <>
                            <button
                              onClick={() => handleRejectOrder(order.id, 'Harvest lot inventory is low and current batch is reserved.')}
                              className="px-3 py-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                            >
                              <XCircle className="w-3.5 h-3.5 text-red-500" />
                              <span>Reject (Low Stock)</span>
                            </button>

                            <button
                              onClick={() => setActiveModalOrder(order)}
                              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Accept & Assign Partner</span>
                            </button>
                          </>
                        )}

                        {order.status === 'CONFIRMED' && !order.logisticsId && (
                          <button
                            onClick={() => setActiveModalOrder(order)}
                            className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Assign Delivery Partner</span>
                          </button>
                        )}

                        {order.status === 'CONFIRMED' && order.logisticsId && (
                          <button
                            onClick={() => setActiveModalOrder(order)}
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                          >
                            <Package className="w-3.5 h-3.5" />
                            <span>Pack & Transfer to Delivery Partner</span>
                          </button>
                        )}

                        {(order.status === 'PREPARING' || order.status === 'PACKED') && (
                          <button
                            onClick={() => setActiveModalOrder(order)}
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Pack & Transfer to Delivery Partner (Handover)</span>
                          </button>
                        )}

                        {order.status === 'PICKED_UP' && (
                          <div className="text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 px-3 py-1 rounded-lg flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                            <span>Handed over to {order.logisticsName || 'Delivery Partner'} ({order.vehicleNumber || 'OD 02 AX 8840'})</span>
                          </div>
                        )}

                        {order.status === 'IN_TRANSIT' && (
                          <div className="text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 px-3 py-1 rounded-lg flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                            <span>In Transit to Consumer • Live Tracked</span>
                          </div>
                        )}

                        {(order.status === 'REJECTED_LOW_STOCK' || order.status === 'CANCELLED') && (
                          <div className="text-xs font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 px-3 py-1 rounded-lg flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                            <span>Rejected: Low Stock (Escrow Refunded)</span>
                          </div>
                        )}

                        {order.status === 'DELIVERED' && (
                          <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-lg">
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
            <div className="bg-white dark:bg-stone-900 transition-colors rounded-2xl border border-stone-200 dark:border-stone-700 p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Fulfilled Direct Sales Ledger</span>
                    </span>
                    <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">100% Aadhaar DBT Settled</span>
                  </div>
                  <h3 className="text-lg font-black text-stone-900 dark:text-stone-100 mt-1">
                    Sold Harvest Consignments & Disbursed Earnings
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
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
                <div className="p-3.5 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-700">
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-bold uppercase block">Total Volume Sold</span>
                  <span className="text-xl font-black text-stone-900 dark:text-stone-100 mt-0.5 block">3,450 kg</span>
                  <span className="text-[10px] text-emerald-700 font-medium">Across 14 direct dispatches</span>
                </div>

                <div className="p-3.5 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-700">
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-bold uppercase block">Net Direct Revenue</span>
                  <span className="text-xl font-black text-emerald-800 mt-0.5 block">₹51,840</span>
                  <span className="text-[10px] text-emerald-700 font-medium">Credited to SBI A/C ••4102</span>
                </div>

                <div className="p-3.5 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-700">
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-bold uppercase block">Extra Profit vs Mandi</span>
                  <span className="text-xl font-black text-amber-900 mt-0.5 block">+₹13,290</span>
                  <span className="text-[10px] text-amber-700 font-bold">+34.5% higher farmgate realization</span>
                </div>

                <div className="p-3.5 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-700">
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-bold uppercase block">Payout Settlement Status</span>
                  <span className="text-xl font-black text-stone-900 dark:text-stone-100 mt-0.5 block">100% Cleared</span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400">Escrow released via IMPS</span>
                </div>
              </div>
            </div>

            {/* Delivered Produce & Direct Settlement Receipt Cards */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-wider text-stone-800 dark:text-stone-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Delivered Lots & Direct DBT Settlement Receipts</span>
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Individual lot receipts with customer OTP confirmation, net earnings, and instant bank disbursement hashes.
                  </p>
                </div>
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full self-start sm:self-auto">
                  100% Cleared Escrow Receipts
                </span>
              </div>

              {/* Responsive Vertical Settlement Receipt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    lotId: '#LOT-SLD-8941',
                    orderId: 'ord_1079',
                    date: 'Delivered 2 days ago',
                    name: 'Fresh Nashik Red Onions (Direct Farm Lot)',
                    qty: '25 kg Sack',
                    buyer: 'Ananya Sharma',
                    buyerType: 'Urban Consumer (HAL 2nd Stage)',
                    soldRate: '₹28/kg',
                    mandiRate: '₹20/kg',
                    payout: '₹700 Net Payout',
                    gain: '+₹200 (+40%)',
                    ref: '✓ DBT Credited to SBI (IMPS-92018471)',
                    status: 'Disbursed to Bank',
                  },
                  {
                    lotId: '#LOT-SLD-8938',
                    orderId: 'ord_1079',
                    date: 'Delivered 2 days ago',
                    name: 'Sehore Sharbati Gehu / Wheat',
                    qty: '30 kg Grain Bag',
                    buyer: 'Ananya Sharma',
                    buyerType: 'Urban Consumer (HAL 2nd Stage)',
                    soldRate: '₹44/kg',
                    mandiRate: '₹32/kg',
                    payout: '₹1,320 Net Payout',
                    gain: '+₹360 (+37.5%)',
                    ref: '✓ DBT Credited to SBI (IMPS-92018472)',
                    status: 'Disbursed to Bank',
                  },
                  {
                    lotId: '#LOT-SLD-8920',
                    orderId: 'ord_1065',
                    date: 'Delivered 7 days ago',
                    name: 'Desi Chana / Bengal Gram (Unpolished)',
                    qty: '40 kg Sacks',
                    buyer: 'Ananya Sharma',
                    buyerType: 'Urban Consumer (HAL 2nd Stage)',
                    soldRate: '₹78/kg',
                    mandiRate: '₹66/kg',
                    payout: '₹3,120 Net Payout',
                    gain: '+₹480 (+18.2%)',
                    ref: '✓ DBT Credited to SBI (IMPS-83910245)',
                    status: 'Disbursed to Bank',
                  },
                  {
                    lotId: '#LOT-SLD-8915',
                    orderId: 'ord_1065',
                    date: 'Delivered 7 days ago',
                    name: 'Organic Vine Ripe Tomatoes (Polyhouse)',
                    qty: '10 kg Crates',
                    buyer: 'Ananya Sharma',
                    buyerType: 'Urban Consumer (HAL 2nd Stage)',
                    soldRate: '₹32/kg',
                    mandiRate: '₹22/kg',
                    payout: '₹320 Net Payout',
                    gain: '+₹100 (+45.4%)',
                    ref: '✓ DBT Credited to SBI (IMPS-83910246)',
                    status: 'Disbursed to Bank',
                  },
                  {
                    lotId: '#LOT-SLD-8894',
                    orderId: 'ord_bulk_910',
                    date: 'Delivered 12 days ago',
                    name: 'Nashik Red Onions (Grade A Export Quality)',
                    qty: '450 kg Bulk Lot',
                    buyer: 'Taj Vivanta Kitchens',
                    buyerType: 'Commercial Hospitality Buyer',
                    soldRate: '₹31/kg',
                    mandiRate: '₹22/kg',
                    payout: '₹13,950 Net Payout',
                    gain: '+₹4,050 (+40.9%)',
                    ref: '✓ DBT Credited to SBI (RTGS-01928472)',
                    status: 'Disbursed to Bank',
                  },
                  {
                    lotId: '#LOT-SLD-8872',
                    orderId: 'ord_bulk_892',
                    date: 'Delivered 18 days ago',
                    name: 'Organic Vine Ripe Tomatoes',
                    qty: '280 kg Crate Sacks',
                    buyer: 'Puri Jagannath Bhojanalaya',
                    buyerType: 'Cooperative Institution',
                    soldRate: '₹29/kg',
                    mandiRate: '₹19/kg',
                    payout: '₹8,120 Net Payout',
                    gain: '+₹2,800 (+52.6%)',
                    ref: '✓ DBT Credited to SBI (IMPS-72910481)',
                    status: 'Disbursed to Bank',
                  },
                  {
                    lotId: '#LOT-SLD-8840',
                    orderId: 'ord_bulk_870',
                    date: 'Delivered 24 days ago',
                    name: 'Sehore Sharbati Gehu (Gold Grain Lot)',
                    qty: '550 kg Grain Sacks',
                    buyer: 'Bengaluru Healthy Bakes Federation',
                    buyerType: 'Artisan Bakery Network',
                    soldRate: '₹44/kg',
                    mandiRate: '₹33/kg',
                    payout: '₹24,200 Net Payout',
                    gain: '+₹6,050 (+33.3%)',
                    ref: '✓ DBT Credited to SBI (RTGS-98120412)',
                    status: 'Disbursed to Bank',
                  },
                ].map(row => (
                  <div
                    key={row.lotId}
                    className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs hover:border-emerald-600/50 dark:hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4"
                  >
                    {/* Header: Consignment ID + Date */}
                    <div className="flex items-start justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
                      <div>
                        <span className="font-mono font-black text-stone-900 dark:text-stone-100 text-sm tracking-tight">
                          {row.lotId}
                        </span>
                        <span className="text-[11px] text-stone-400 dark:text-stone-500 block mt-0.5">
                          {row.date}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black text-[11px] tracking-wide shrink-0">
                        {row.gain}
                      </span>
                    </div>

                    {/* Body: Produce Name, Weight, Buyer Info */}
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="font-extrabold text-stone-900 dark:text-stone-100 text-sm leading-snug">
                          {row.name}
                        </div>
                        <div className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5">
                          Weight: <strong className="text-stone-800 dark:text-stone-200">{row.qty}</strong>
                        </div>
                      </div>

                      <div className="p-3 bg-stone-50 dark:bg-stone-950/70 rounded-xl border border-stone-100 dark:border-stone-800 space-y-1">
                        <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                          Buyer
                        </div>
                        <div className="font-bold text-stone-900 dark:text-stone-100">
                          {row.buyer}
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400">
                          {row.buyerType}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-stone-500 dark:text-stone-400 font-medium">Realized Farmgate Rate:</span>
                        <div className="text-right">
                          <span className="font-bold text-stone-900 dark:text-stone-100">{row.soldRate}</span>
                          <span className="text-[10px] text-stone-400 line-through ml-1.5">Mandi: {row.mandiRate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer: Bold Green Payout + Direct DBT Credited Badge */}
                    <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-stone-500 dark:text-stone-400 font-bold uppercase">Net Settlement</span>
                        <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                          {row.payout}
                        </span>
                      </div>

                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="truncate">{row.ref}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PAYOUT SETTLEMENTS */}
        {activeTab === 'payouts' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-stone-900 transition-colors dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 dark:border-stone-800 p-6 shadow-sm flex flex-col justify-center transition-colors">
                <div className="text-stone-500 dark:text-stone-400 dark:text-stone-400 font-bold mb-2 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                  <span>Total Revenue</span>
                </div>
                <div className="text-3xl font-black text-stone-900 dark:text-stone-100 dark:text-white">₹{totalDeliveredRevenue.toLocaleString()}</div>
              </div>
              <div className="bg-white dark:bg-stone-900 transition-colors dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 dark:border-stone-800 p-6 shadow-sm flex flex-col justify-center transition-colors">
                <div className="text-stone-500 dark:text-stone-400 dark:text-stone-400 font-bold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                  <span>Orders Delivered</span>
                </div>
                <div className="text-3xl font-black text-stone-900 dark:text-stone-100 dark:text-white">{orders.filter(o => o.status === 'DELIVERED').length}</div>
              </div>
              <div className="bg-white dark:bg-stone-900 transition-colors dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 dark:border-stone-800 p-6 shadow-sm flex flex-col justify-center transition-colors">
                <div className="text-stone-500 dark:text-stone-400 dark:text-stone-400 font-bold mb-2 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-500" />
                  <span>Pending Shipments</span>
                </div>
                <div className="text-3xl font-black text-stone-900 dark:text-stone-100 dark:text-white">{orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length}</div>
              </div>
            </div>

            <FarmersEarningChart orders={orders} farmerId={user?.id || 'usr_farmer_1'} />
            
            <div className="bg-white dark:bg-stone-900 transition-colors dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 dark:border-stone-800 p-6 space-y-6 transition-colors">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 dark:border-stone-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 dark:text-stone-100">Bank Account & Direct Benefit Transfer (DBT)</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 dark:text-stone-400 mt-0.5">
                  Verified Aadhaar-seeded Account for 100% Broker-Free Settlement
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> KYC Verified
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 bg-stone-50 dark:bg-stone-950 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:border-stone-700 transition-colors">
                <div className="text-stone-500 dark:text-stone-400 dark:text-stone-400 font-bold mb-1">Bank Name:</div>
                <div className="font-semibold text-stone-900 dark:text-stone-100 dark:text-stone-200">State Bank of India (SBI)</div>
              </div>
              <div className="p-3.5 bg-stone-50 dark:bg-stone-950 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:border-stone-700 transition-colors">
                <div className="text-stone-500 dark:text-stone-400 dark:text-stone-400 font-bold mb-1">Account Number:</div>
                <div className="font-mono font-semibold text-stone-900 dark:text-stone-100 dark:text-stone-200">•••• •••• 4102</div>
              </div>
              <div className="p-3.5 bg-stone-50 dark:bg-stone-950 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:border-stone-700 transition-colors">
                <div className="text-stone-500 dark:text-stone-400 dark:text-stone-400 font-bold mb-1">IFSC Code / Branch:</div>
                <div className="font-mono font-semibold text-stone-900 dark:text-stone-100 dark:text-stone-200">SBIN0001248 (Baramati Agro Hub)</div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs space-y-1.5 text-stone-700 dark:text-stone-300 dark:text-stone-300 transition-colors">
              <div className="font-bold text-emerald-950 dark:text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-500" />
                <span>SeedhaMandi Escrow Safeguard</span>
              </div>
              <p className="leading-relaxed">
                Every rupee is securely escrowed by our RBI-compliant nodal banking partner. Once the urban consumer confirms delivery inspection via their 6-digit OTP, your payout is automatically credited via IMPS within 15 minutes.
              </p>
            </div>
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
                  className="bg-white dark:bg-stone-900 transition-colors rounded-3xl border border-stone-200 dark:border-stone-700 p-5 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                          {rfq.organization}
                        </span>
                        <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-base">{rfq.cropName}</h4>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase flex items-center gap-1 ${
                        rfq.status === 'MATCHED'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}>
                        {rfq.status === 'MATCHED' && <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                        <span>{rfq.status === 'MATCHED' ? 'Contract Awarded to You' : 'Open for Bids'}</span>
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 space-y-2 text-xs">
                      <div className="flex justify-between text-stone-600 dark:text-stone-300">
                        <span>Required Volume:</span>
                        <span className="font-black text-stone-900 dark:text-stone-100">{rfq.quantityRequired.toLocaleString()} {rfq.unit}</span>
                      </div>
                      <div className="flex justify-between text-stone-600 dark:text-stone-300">
                        <span>Offered Buying Price:</span>
                        <span className="font-black text-emerald-800 dark:text-emerald-400">₹{rfq.targetPricePerUnit}/{rfq.unit}</span>
                      </div>
                      <div className="flex justify-between text-stone-600 dark:text-stone-300">
                        <span>Gross Contract Value:</span>
                        <span className="font-black text-amber-900 dark:text-amber-400">
                          ₹{(rfq.quantityRequired * rfq.targetPricePerUnit).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between text-stone-600 dark:text-stone-300">
                        <span>Logistics Fleet:</span>
                        <span className="font-bold text-blue-800 dark:text-blue-400">
                          {rfq.vehicleTypeRequired === 'TRACTOR' ? '🚜 Tractor Trolley' : '🚚 Mini Truck'}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-stone-500 dark:text-stone-400">
                      Destination: <strong className="text-stone-800 dark:text-stone-200">{rfq.deliveryLocation}</strong>
                      {rfq.matchedFarmerOrFpo && (
                        <div className="text-emerald-700 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>FPO / Farmer: {rfq.matchedFarmerOrFpo}</span>
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
                    <div className="w-full py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs text-center border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Contract Awarded to You</span>
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
          <div className="bg-white dark:bg-stone-900 transition-colors w-full max-w-xl rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 overflow-hidden my-8">
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
                    className="w-full bg-white dark:bg-stone-900 border border-orange-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                  <p className="text-[11px] text-orange-800">
                    This lot will be listed under the FPO with transparent attribution to this village smallholder.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Produce Name & Variety</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Red Nashik Onions"
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600"
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
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Your Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Mandi Benchmark (₹)</label>
                  <input
                    type="number"
                    value={mandiPrice}
                    onChange={e => setMandiPrice(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-500 dark:text-stone-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Unit</label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 rounded-xl px-3 py-2 text-xs"
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
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Total Quantity</label>
                  <input
                    type="number"
                    required
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Min. Order Qty</label>
                  <input
                    type="number"
                    required
                    value={minOrderQty}
                    onChange={e => setMinOrderQty(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 rounded-xl px-3 py-2 text-xs"
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
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Quality Grade</label>
                <select
                  value={qualityGrade}
                  onChange={e => setQualityGrade(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="Grade A (Export Quality)">Grade A (Export Quality)</option>
                  <option value="Grade A (Super Table Grade)">Grade A (Super Table Grade)</option>
                  <option value="Grade B (Processing Grade)">Grade B (Processing Grade)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Harvest Notes / Details</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Harvested yesterday morning, sorted and packed in ventilated crates, zero chemical spraying in last 25 days."
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600"
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
                <label htmlFor="organicCheck" className="text-xs text-stone-700 dark:text-stone-300 font-semibold cursor-pointer">
                  Chemical-Free / Certified Organic Produce
                </label>
              </div>

              <div className="pt-3 border-t border-stone-200 dark:border-stone-700 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:text-stone-100"
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
