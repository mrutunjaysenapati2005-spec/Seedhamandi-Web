import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Truck, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw,
  HeartHandshake,
  QrCode,
  PackageCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';
import { api } from '../services/api';
import { OrderTrackingModal } from '../components/OrderTrackingModal';
import { FarmToForkStatusBar, FarmToForkMiniBar } from '../components/FarmToForkStatusBar';
import { Radio, Eye, Layers, Search, Check, ExternalLink } from 'lucide-react';

const OrderTimeline = ({ status }: { status: string }) => {
  const steps = [
    { id: 'PLACED', label: 'Order Placed', icon: ShoppingBag },
    { id: 'PREPARING', label: 'Driver Assigned', icon: Truck },
    { id: 'IN_TRANSIT', label: 'Out for Delivery', icon: MapPin },
    { id: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 }
  ];

  let currentStepIndex = 0;
  if (['CONFIRMED', 'PREPARING'].includes(status)) currentStepIndex = 1;
  else if (['PICKED_UP', 'IN_TRANSIT'].includes(status)) currentStepIndex = 2;
  else if (status === 'DELIVERED') currentStepIndex = 3;

  return (
    <div className="w-full py-4 px-2 mb-2 hidden sm:block">
      <div className="flex items-center justify-between relative max-w-lg mx-auto">
        {/* Track Background */}
        <div className="absolute left-0 top-4 -translate-y-1/2 w-full h-1 bg-stone-200 dark:bg-stone-700 rounded-full" />
        
        {/* Track Progress */}
        <div 
          className="absolute left-0 top-4 -translate-y-1/2 h-1 bg-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        />
        
        {/* Steps */}
        {steps.map((step, idx) => {
          const isCompleted = idx <= currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          const Icon = step.icon;
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 w-16">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isCompleted 
                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                    : 'bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-600 text-stone-400 dark:text-stone-500'
                } ${isCurrent ? 'ring-4 ring-emerald-500/20' : ''}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className={`text-[10px] font-bold text-center leading-tight ${
                isCurrent ? 'text-emerald-700 dark:text-emerald-400' : 
                isCompleted ? 'text-stone-800 dark:text-stone-200' : 'text-stone-400 dark:text-stone-500'
              }`}>
                {step.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

export const ConsumerDashboard: React.FC = () => {
  const { user, setActiveTab, cart, cartCount, cartTotal, openCart } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<Order | null>(null);
  const [consumerTab, setConsumerTab] = useState<'ordered_items_history' | 'active_tracking'>('ordered_items_history');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DELIVERED' | 'IN_TRANSIT'>('ALL');

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getOrders();
      const fetchedOrders = res.orders || [];
      setOrders(fetchedOrders);

      // Select in-transit / active order by default, or fallback to first order
      const activeOne = fetchedOrders.find(o => o.status !== 'DELIVERED') || fetchedOrders[0] || null;
      setActiveTrackingOrder(prev => {
        if (prev) {
          const matched = fetchedOrders.find(o => o.id === prev.id);
          return matched || activeOne;
        }
        return activeOne;
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalDirectToFarmers = orders.reduce((sum, o) => sum + o.itemsTotal, 0);
  const estimatedSavings = Math.round(totalDirectToFarmers * 0.28);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-8 text-stone-900 dark:text-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Welcome Header */}
        <div className="bg-white dark:bg-stone-900 transition-colors rounded-2xl p-6 border border-stone-200/90 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                CONSCIOUS CONSUMER
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400">Member since Feb 2025</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">
              Welcome back, {user?.name || 'Ananya Sharma'}
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Track your farm-to-doorstep orders, view provenance certificates, and inspect deliveries.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('marketplace')}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Browse Farm Harvests</span>
            </button>
          </div>
        </div>

        {/* Pending Farm Basket Place Order Banner */}
        {cart.length > 0 && (
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-stone-950 text-white p-4 sm:p-5 rounded-2xl border-2 border-amber-400/80 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black shrink-0 shadow-md">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm sm:text-base text-white">
                    Farm Basket Ready: {cartCount} {cartCount === 1 ? 'Produce Batch' : 'Produce Batches'} ({cart.reduce((s, i) => s + i.quantity, 0)} kg)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-emerald-950 text-[10px] font-black uppercase">
                    Ready to Ship
                  </span>
                </div>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Direct harvest total: <strong className="text-amber-300 font-mono">₹{cartTotal}</strong> • Tap to choose payment method & pay via QR for instant farmer & logistics settlement.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => openCart('checkout')}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <span>Place Order & Pay via QR</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Impact Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-stone-900 transition-colors p-5 rounded-2xl border border-stone-200/90 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Direct to Farmers</span>
              <HeartHandshake className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-900">₹{totalDirectToFarmers.toLocaleString()}</div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">100% of harvest value paid directly to growers</p>
          </div>

          <div className="bg-white dark:bg-stone-900 transition-colors p-5 rounded-2xl border border-stone-200/90 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Intermediary Markup Saved</span>
              <ShieldCheck className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-900">₹{estimatedSavings.toLocaleString()}</div>
            <p className="text-[11px] text-amber-700 font-medium mt-1">Saved vs supermarket & retail prices</p>
          </div>

          <div className="bg-white dark:bg-stone-900 transition-colors p-5 rounded-2xl border border-stone-200/90 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Direct Consignments</span>
              <Truck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-stone-900 dark:text-stone-100">{orders.length} Deliveries</div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">Sourced from Maharashtra & MP growers</p>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex border-b border-stone-200 dark:border-stone-700 overflow-x-auto">
          <button
            onClick={() => setConsumerTab('ordered_items_history')}
            className={`py-3 px-5 text-xs font-bold uppercase tracking-wider transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              consumerTab === 'ordered_items_history'
                ? 'border-emerald-700 text-emerald-900 bg-white'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            <span>Ordered Items History ({orders.reduce((sum, o) => sum + o.items.length, 0)} Items)</span>
          </button>

          <button
            onClick={() => setConsumerTab('active_tracking')}
            className={`py-3 px-5 text-xs font-bold uppercase tracking-wider transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              consumerTab === 'active_tracking'
                ? 'border-emerald-700 text-emerald-900 bg-white'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800'
            }`}
          >
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>Active Deliveries & Consignments ({orders.length})</span>
          </button>
        </div>

        {/* TAB 1: ORDERED ITEMS HISTORY */}
        {consumerTab === 'ordered_items_history' && (
          <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="bg-white dark:bg-stone-900 transition-colors rounded-2xl border border-stone-200 dark:border-stone-700 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search ordered produce, farmer name, or order ID..."
                  value={itemSearchQuery}
                  onChange={e => setItemSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600 text-stone-800 dark:text-stone-200"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-bold">Status:</span>
                {(['ALL', 'DELIVERED', 'IN_TRANSIT'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      statusFilter === st
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-600'
                    }`}
                  >
                    {st === 'ALL' ? 'All Items' : st === 'DELIVERED' ? 'Delivered' : 'In Transit'}
                  </button>
                ))}
              </div>
            </div>

            {/* Ordered Items Grid */}
            {(() => {
              const flattenedItems = orders.flatMap(order =>
                order.items.map((item, itemIdx) => ({
                  ...item,
                  uniqueKey: `${order.id}-${item.productId}-${itemIdx}`,
                  orderId: order.id,
                  orderCreatedAt: order.createdAt,
                  orderStatus: order.status,
                  deliveryOtp: order.deliveryOtp,
                  logisticsName: order.logisticsName,
                  shippingAddress: order.shippingAddress,
                  rawOrder: order,
                }))
              );

              const filteredItems = flattenedItems.filter(item => {
                const matchesSearch =
                  item.name.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
                  item.farmerName.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
                  item.orderId.toLowerCase().includes(itemSearchQuery.toLowerCase());

                const matchesStatus =
                  statusFilter === 'ALL' ||
                  (statusFilter === 'DELIVERED' && item.orderStatus === 'DELIVERED') ||
                  (statusFilter === 'IN_TRANSIT' && item.orderStatus !== 'DELIVERED');

                return matchesSearch && matchesStatus;
              });

              if (filteredItems.length === 0) {
                return (
                  <div className="bg-white dark:bg-stone-900 transition-colors rounded-2xl border border-stone-200 dark:border-stone-700 p-12 text-center text-stone-500 dark:text-stone-400 space-y-3">
                    <ShoppingBag className="w-12 h-12 mx-auto text-stone-300" />
                    <p className="font-bold text-sm text-stone-800 dark:text-stone-200">No ordered items match your filter</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">Try clearing your search query or view all orders.</p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredItems.map(item => (
                    <div
                      key={item.uniqueKey}
                      className="bg-white dark:bg-stone-900 transition-colors rounded-2xl border border-stone-200 dark:border-stone-700 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 rounded-xl object-cover border border-stone-200 dark:border-stone-700 shrink-0"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-mono font-bold text-stone-500 dark:text-stone-400">
                              Order #{item.orderId}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                item.orderStatus === 'DELIVERED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {item.orderStatus === 'DELIVERED' ? 'Delivered & Verified' : item.orderStatus}
                            </span>
                          </div>

                          <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm truncate">{item.name}</h3>

                          <div className="text-xs text-stone-500 dark:text-stone-400">
                            Direct Grower: <strong className="text-stone-800 dark:text-stone-200">{item.farmerName}</strong>
                          </div>

                          <div className="flex items-center gap-3 pt-1 text-xs">
                            <span className="font-bold text-emerald-800 text-sm">
                              ₹{item.price * item.quantity}
                            </span>
                            <span className="text-stone-500 dark:text-stone-400 text-[11px]">
                              (₹{item.price}/{item.unit} • {item.quantity} {item.unit})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Origin and Delivery Verification Footer */}
                      <div className="p-3 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-700 text-xs space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                          <span>Purchased on: {new Date(item.orderCreatedAt).toLocaleDateString()}</span>
                          <span className="font-mono text-stone-700 dark:text-stone-300 font-bold">
                            OTP: {item.deliveryOtp}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-stone-600 dark:text-stone-300">
                            Carrier: <strong>{item.logisticsName || 'KisanVahan Logistics'}</strong>
                          </span>
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>100% Farmgate Direct</span>
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <button
                          onClick={() => setSelectedTrackingOrder(item.rawOrder)}
                          className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Transit Trail</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('marketplace')}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Buy Fresh Lot Again</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 2: ACTIVE CONSIGNMENTS & TRACKING */}
        {consumerTab === 'active_tracking' && (
        <div className="space-y-6">
        {/* Real-Time Farm-to-Fork Order Tracking Status Bar */}
        {orders.length > 0 && activeTrackingOrder && (
          <div id="farm-to-fork-tracker">
            <FarmToForkStatusBar
              order={activeTrackingOrder}
              allOrders={orders}
              onSelectOrder={(ord) => setActiveTrackingOrder(ord)}
              onOrderUpdated={loadOrders}
            />
          </div>
        )}

        {/* Orders Listing */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">Your Fresh Consignments</h2>
            <button
              onClick={loadOrders}
              className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:text-stone-200 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Status</span>
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 transition-colors rounded-2xl border border-stone-200 dark:border-stone-700 p-12 text-center text-stone-500 dark:text-stone-400 space-y-3">
              <ShoppingBag className="w-12 h-12 mx-auto text-stone-300" />
              <p className="font-bold text-sm text-stone-800 dark:text-stone-200">You haven't placed any direct orders yet</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                Explore the marketplace to discover unpolished pulses, fresh polyhouse tomatoes, and Devgad Alphonso mangoes.
              </p>
              <button
                onClick={() => setActiveTab('marketplace')}
                className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-800 transition"
              >
                Go to Marketplace
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div
                  key={order.id}
                  className="bg-white dark:bg-stone-900 transition-colors rounded-2xl border border-stone-200 dark:border-stone-700 p-5 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-stone-800 dark:text-stone-200">#{order.id}</span>
                      <span className="text-xs text-stone-500 dark:text-stone-400">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          order.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {order.status}
                      </span>
                      {order.isBulkOrder && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-400 text-stone-950">
                          📦 BULK MANDI
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-900">
                        {order.vehicleTypeRequired === 'TRACTOR' ? '🚜 Tractor Trolley' :
                         order.vehicleTypeRequired === 'MINI_TRUCK' ? '🚚 Mini Truck (Tata Ace)' :
                         order.vehicleTypeRequired === 'BIKE_SCOOTY' ? '🛵 Bike / Scooty' :
                         order.vehicleTypeRequired === 'REEFER_VAN' ? '❄️ Reefer Cold Van' : '🚚 Standard Fleet'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100">Total: ₹{order.totalAmount}</span>
                      <span className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded font-mono">
                        {order.paymentMethod}
                      </span>
                    </div>
                  </div>

                  <OrderTimeline status={order.status} />

                  {/* Produce Items */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="space-y-2">
                      {order.items.map((it, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 bg-stone-50 dark:bg-stone-950 rounded-xl">
                          <img src={it.image} alt={it.name} className="w-12 h-12 rounded-lg object-cover" />
                          <div className="flex-1 min-w-0 text-xs">
                            <div className="font-bold text-stone-900 dark:text-stone-100 truncate">{it.name}</div>
                            <div className="text-stone-500 dark:text-stone-400 text-[11px]">
                              Grower: {it.farmerName} • {it.quantity} {it.unit}
                            </div>
                          </div>
                          <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                            ₹{it.price * it.quantity}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Escrow & Tracking Box */}
                    <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 flex flex-col justify-between space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-700" />
                          <span>Delivery Security OTP</span>
                        </span>
                        <span className="text-base font-mono font-black text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-lg border border-amber-300">
                          {order.deliveryOtp}
                        </span>
                      </div>

                      <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                        Share this code with your carrier driver only after inspecting produce quality at doorstep.
                      </p>

                      <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs text-stone-600 dark:text-stone-300">
                          Carrier: <strong className="text-stone-800 dark:text-stone-200">{order.logisticsName || 'KisanVahan'}</strong>
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setActiveTrackingOrder(order);
                              document.getElementById('farm-to-fork-tracker')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                              activeTrackingOrder?.id === order.id
                                ? 'bg-emerald-800 text-white shadow-xs'
                                : 'bg-white dark:bg-stone-900 hover:bg-emerald-100/60 text-emerald-900 border border-emerald-300'
                            }`}
                          >
                            <Radio className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{activeTrackingOrder?.id === order.id ? 'Tracking on Bar' : 'View in Status Bar'}</span>
                          </button>

                          <button
                            onClick={() => setSelectedTrackingOrder(order)}
                            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Detailed Transit</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Farm-to-Fork Progression Mini Bar */}
                  <FarmToForkMiniBar order={order} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )}
  </div>

  {/* Tracking Modal */}
      <OrderTrackingModal
        order={selectedTrackingOrder}
        onClose={() => setSelectedTrackingOrder(null)}
        onOrderUpdated={() => {
          loadOrders();
          setSelectedTrackingOrder(null);
        }}
      />
    </div>
  );
};
