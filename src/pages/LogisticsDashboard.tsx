import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, 
  MapPin, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Thermometer, 
  ShieldCheck, 
  Navigation, 
  Phone,
  PackageCheck,
  AlertCircle,
  RefreshCw,
  XCircle,
  TrendingUp,
  CreditCard,
  Check,
  Building2,
  ArrowRight,
  Bell,
  Zap,
  Filter,
  Layers,
  Sparkles,
  History,
  FileText,
  AlertTriangle,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Order, AppNotification, VehicleType, RouteOptimizationResult } from '../types';
import { api } from '../services/api';
import { BhubaneswarMap } from '../components/BhubaneswarMap';
import { InteractiveLogisticsMap, MapDeliveryRequest } from '../components/InteractiveLogisticsMap';
import { VicinityDispatchToast, VicinityAlert, playVicinityChime } from '../components/VicinityDispatchToast';
import { realtimeService } from '../services/realtime';

export interface DispatchOffer {
  id: string;
  orderId?: string;
  produceName: string;
  quantity: string;
  pickupPoint: string;
  dropPoint: string;
  distanceKm: number;
  estMinutes: number;
  freightPayout: number;
  farmerName: string;
  farmerPhone: string;
  tempRequired: string;
  urgency: 'HIGH' | 'MEDIUM';
  vehicleType: VehicleType;
  isBulk?: boolean;
}

const SIMULATED_REQUESTS_POOL: Omit<DispatchOffer, 'id'>[] = [
  {
    produceName: 'Mahabaleshwar Fresh Strawberries (10 Cold Crates)',
    quantity: '10 Crates (150 kg)',
    pickupPoint: 'Mancheswar Cold Depot, Bhubaneswar',
    dropPoint: 'Saheed Nagar Fresh Market, Bhubaneswar',
    distanceKm: 8.6,
    estMinutes: 18,
    freightPayout: 230,
    farmerName: 'Kishore Kadam (Strawberry Federation)',
    farmerPhone: '+91 94370 44921',
    tempRequired: 'Reefer Cold 3°C - 5°C',
    urgency: 'HIGH',
    vehicleType: 'REEFER_VAN',
  },
  {
    produceName: 'Organic Polyhouse Cherry Tomatoes & Basil',
    quantity: '14 Crates (210 kg)',
    pickupPoint: 'Rasulgarh Agro Transit Depot',
    dropPoint: 'Patia KIIT Square Retail Co-op, Bhubaneswar',
    distanceKm: 11.2,
    estMinutes: 22,
    freightPayout: 280,
    farmerName: 'Sunita Pradhan (Khordha Organics)',
    farmerPhone: '+91 97761 00482',
    tempRequired: 'Active Refrigeration 6°C',
    urgency: 'HIGH',
    vehicleType: 'MINI_TRUCK',
  },
  {
    produceName: 'Sharbati Wheat & Unpolished Arhar Dal Sacks',
    quantity: '600 kg Farm Sacks',
    pickupPoint: 'Khordha Valley Agro Collection Hub',
    dropPoint: 'Khandagiri Wholesale Cluster, Bhubaneswar',
    distanceKm: 16.4,
    estMinutes: 32,
    freightPayout: 520,
    farmerName: 'Harish Choudhury (FPO Trustee)',
    farmerPhone: '+91 98612 88471',
    tempRequired: 'Ambient Dry (Ventilated)',
    urgency: 'MEDIUM',
    vehicleType: 'TRACTOR',
    isBulk: true,
  },
  {
    produceName: 'Pure Cold Pressed Sesame & Mustard Oil Cans',
    quantity: '20 Tins (300 Liters)',
    pickupPoint: 'Khandagiri Western Transit Depot',
    dropPoint: 'Nayapalli Institutional Mess Cluster',
    distanceKm: 7.5,
    estMinutes: 16,
    freightPayout: 210,
    farmerName: 'Mahanadi Agri Producers Co-op',
    farmerPhone: '+91 94380 91024',
    tempRequired: 'Dry Sealed Transit',
    urgency: 'MEDIUM',
    vehicleType: 'MINI_TRUCK',
  },
  {
    produceName: 'Fresh Exotic Mushrooms & Baby Corn (Fragile)',
    quantity: '6 Cold Insulated Boxes (45 kg)',
    pickupPoint: 'Mancheswar Cold Depot, Bhubaneswar',
    dropPoint: 'Mayfair Lagoon Kitchens, Jayadev Vihar',
    distanceKm: 9.8,
    estMinutes: 20,
    freightPayout: 260,
    farmerName: 'Dr. Alok Mohapatra (Spore Labs)',
    farmerPhone: '+91 98611 23091',
    tempRequired: 'Strict Reefer 2°C - 4°C',
    urgency: 'HIGH',
    vehicleType: 'REEFER_VAN',
  },
  {
    produceName: 'Desi Alphonso Mangoes (Farm Fresh Pick)',
    quantity: '12 Crates (240 kg)',
    pickupPoint: 'Rasulgarh Agro Transit Depot',
    dropPoint: 'Chandrasekharpur Housing Society',
    distanceKm: 10.4,
    estMinutes: 24,
    freightPayout: 310,
    farmerName: 'Bhubaneswar Agro Producers',
    farmerPhone: '+91 94372 66102',
    tempRequired: 'Ventilated Reefer 8°C',
    urgency: 'HIGH',
    vehicleType: 'MINI_TRUCK',
  },
];

// Mini SVG sparkline for 6-hour continuous history readings
const ReeferSparkline: React.FC<{ isBreached: boolean }> = ({ isBreached }) => {
  const points = isBreached 
    ? [4.1, 4.3, 4.2, 4.0, 6.8, 9.8] 
    : [4.1, 4.3, 4.2, 4.0, 4.2, 4.2];
  
  const min = 3.5;
  const max = 10.5;
  const width = 120;
  const height = 24;
  
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * (width - 8) + 4;
    const y = height - ((p - min) / (max - min)) * (height - 8) - 4;
    return { x, y, val: p };
  });

  const polylineStr = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');

  return (
    <div className="flex items-center gap-1.5">
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          points={polylineStr}
          fill="none"
          stroke={isBreached ? '#e11d48' : '#0d9488'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={i === coords.length - 1 ? 3 : 1.5}
            fill={isBreached && i >= 4 ? '#e11d48' : '#0d9488'}
            stroke="#ffffff"
            strokeWidth="1"
          />
        ))}
      </svg>
    </div>
  );
};

// Prominent Action Banner for AI Multi-Stop Route Optimizer
const DualAiRouteOptimizerBanner: React.FC<{
  onOptimize: () => void;
  isOptimizing: boolean;
  statusText?: string;
  activeVehicleLabel: string;
}> = ({ onOptimize, isOptimizing, statusText, activeVehicleLabel }) => {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-950 text-white rounded-3xl border border-blue-500/40 p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg ring-2 ring-white/20">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-white text-base sm:text-lg tracking-tight">
                Dual AI Engine: Multi-Stop Perishability & Route Optimizer
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                SIH Logistics Core
              </span>
            </div>
            <p className="text-xs text-blue-200/85 max-w-2xl leading-relaxed">
              Dynamically evaluates road congestion, NH-16 bypasses, and biological shelf-life degradation to prioritize high-perishability cold-chain cargo (Strawberries/Tomatoes) first before dry bulk.
            </p>
          </div>
        </div>

        <button
          onClick={onOptimize}
          disabled={isOptimizing}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-xs font-black shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-60 shrink-0 cursor-pointer active:scale-95 border border-white/20"
        >
          <Sparkles className={`w-4 h-4 text-amber-300 ${isOptimizing ? 'animate-spin' : ''}`} />
          <span>{isOptimizing ? 'Evaluating 7 Waypoints...' : '⚡ Run AI Route Optimization'}</span>
        </button>
      </div>

      {isOptimizing && (
        <div className="p-3.5 rounded-xl bg-blue-950/90 border border-blue-400/40 flex items-center gap-3 animate-pulse">
          <div className="w-5 h-5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin shrink-0" />
          <span className="text-xs font-mono font-bold text-amber-300">
            {statusText || 'Evaluating road conditions, traffic, and crop shelf-life across 7 waypoints...'}
          </span>
        </div>
      )}

      {/* Real-time Route Savings & Handover Security Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-white/10 text-center">
        <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
          <span className="text-[10px] text-blue-200 font-bold uppercase block">Total Route Distance</span>
          <div className="text-base font-black text-white mt-0.5">63.6 km</div>
          <span className="text-[10px] text-emerald-400 font-semibold">5.4 km bypass savings</span>
        </div>
        <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
          <span className="text-[10px] text-blue-200 font-bold uppercase block">Estimated Trip Time</span>
          <div className="text-base font-black text-blue-300 mt-0.5">131 mins</div>
          <span className="text-[10px] text-slate-300">Traffic-optimized</span>
        </div>
        <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
          <span className="text-[10px] text-blue-200 font-bold uppercase block">Fuel Saved</span>
          <div className="text-base font-black text-amber-300 mt-0.5">₹62 Saved</div>
          <span className="text-[10px] text-slate-300">Via multi-stop clustering</span>
        </div>
        <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
          <span className="text-[10px] text-blue-200 font-bold uppercase block">Consignment Handover</span>
          <div className="text-base font-black text-emerald-400 mt-0.5">OTP Secured</div>
          <span className="text-[10px] text-slate-300">6-digit Customer PIN</span>
        </div>
      </div>
    </div>
  );
};

export const LogisticsDashboard: React.FC = () => {
  const { user, recordOtpDeliveryCompletion, completedDeliveryIds } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOtpInputs, setActiveOtpInputs] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ id: string; msg: string; type: 'success' | 'error' } | null>(null);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [logisticsTab, setLogisticsTab] = useState<'map_dispatches' | 'travelled_history'>('map_dispatches');

  // 3-Tab Segmented Controller: Map & Radar, Active Sequence (Timeline), Nearby Dispatches
  const [logisticsSegment, setLogisticsSegment] = useState<'map_radar' | 'active_sequence' | 'nearby_dispatches' | 'travelled_history'>('map_radar');

  // Interactive Reefer Temperature IoT State
  const [reeferTemp, setReeferTemp] = useState<number>(4.2);
  const [isReeferBreach, setIsReeferBreach] = useState(false);
  const [showBreachBanner, setShowBreachBanner] = useState(false);

  // Synthesized audible warning alarm for Cold Chain breach
  const playAlertTone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    } catch (e) {
      console.warn('Audio tone error:', e);
    }
  };

  const restoreCooling = () => {
    setReeferTemp(4.2);
    setIsReeferBreach(false);
    setShowBreachBanner(false);
  };

  const toggleReeferTemp = () => {
    if (isReeferBreach) {
      restoreCooling();
    } else {
      setReeferTemp(9.8);
      setIsReeferBreach(true);
      setShowBreachBanner(true);
      playAlertTone();
    }
  };

  // Vehicle Category Filter
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<'ALL' | VehicleType>('ALL');

  // AI Route Optimization Engine
  const [isOptimizingRoute, setIsOptimizingRoute] = useState(false);
  const [optimizingStatusText, setOptimizingStatusText] = useState<string>('Evaluating road conditions, traffic, and crop shelf-life across 7 waypoints...');
  const [aiRoutePlan, setAiRoutePlan] = useState<RouteOptimizationResult | null>(null);

  // Driver's Registered Vehicle Switcher
  const [activeDriverVehicle, setActiveDriverVehicle] = useState<{
    type: VehicleType;
    label: string;
    plate: string;
    capacity: string;
  }>({
    type: 'MINI_TRUCK',
    label: 'Mini Truck / Tata Ace (Chota Hathi)',
    plate: 'OD 02 AX 8840',
    capacity: '1.2 Tons Capacity',
  });

  // Initial load for AI Perishability Route Plan
  useEffect(() => {
    api.optimizeRoute([], activeDriverVehicle.type)
      .then(plan => setAiRoutePlan(plan))
      .catch(err => console.warn('Failed to prefetch AI route plan:', err));
  }, [activeDriverVehicle.type]);

  // Default seed requests in Bhubaneswar
  const [localDispatchOffers, setLocalDispatchOffers] = useState<DispatchOffer[]>([
    {
      id: 'req_bhub_1',
      produceName: 'Devgad Alphonso Mangoes (8 Crates - Fragile)',
      quantity: '8 Crates (160 kg)',
      pickupPoint: 'Mancheswar Cold Depot, Bhubaneswar',
      dropPoint: 'Patia Infocity DLF Square, Bhubaneswar',
      distanceKm: 12.8,
      estMinutes: 26,
      freightPayout: 240,
      farmerName: 'Dnyaneshwar Shinde (Sahyadri FPO)',
      farmerPhone: '+91 94370 12845',
      tempRequired: 'Reefer Cold 4°C - 8°C',
      urgency: 'HIGH',
      vehicleType: 'REEFER_VAN',
    },
    {
      id: 'req_bhub_2',
      produceName: 'Nashik Red Onions & Desi Chana (Bulk Lot)',
      quantity: '550 kg Wholesale Farm Sacks',
      pickupPoint: 'Khordha Valley Agro Collection Hub',
      dropPoint: 'Saheed Nagar Organic Cooperative, Bhubaneswar',
      distanceKm: 18.5,
      estMinutes: 34,
      freightPayout: 460,
      farmerName: 'Ramesh Patel (Direct Farm)',
      farmerPhone: '+91 98610 99221',
      tempRequired: 'Ambient Dry (Ventilated)',
      urgency: 'MEDIUM',
      vehicleType: 'TRACTOR',
      isBulk: true,
    },
    {
      id: 'req_bhub_3',
      produceName: 'Vine Ripe Plum Tomatoes & Baby Spinach',
      quantity: '12 Crates (240 kg)',
      pickupPoint: 'Rasulgarh Agro Transit Depot',
      dropPoint: 'Jayadev Vihar - Nayapalli Cluster',
      distanceKm: 9.4,
      estMinutes: 20,
      freightPayout: 190,
      farmerName: 'Savitri Bai (Baramati Organics)',
      farmerPhone: '+91 97760 33412',
      tempRequired: 'Active Refrigeration 4.2°C',
      urgency: 'HIGH',
      vehicleType: 'MINI_TRUCK',
    },
    {
      id: 'req_bhub_4',
      produceName: 'Pure Cold-Pressed Mustard Oil & Desi Makhana',
      quantity: '12 Liters & 5 kg Farm Packs',
      pickupPoint: 'Khandagiri Western Transit Depot',
      dropPoint: 'Chandrasekharpur Housing Colony',
      distanceKm: 6.2,
      estMinutes: 15,
      freightPayout: 85,
      farmerName: 'Kisan Vikas Bio Agro Trust',
      farmerPhone: '+91 94371 88776',
      tempRequired: 'Insulated Thermal Bag',
      urgency: 'MEDIUM',
      vehicleType: 'BIKE_SCOOTY',
    },
  ]);

  const [acceptedRequestsCount, setAcceptedRequestsCount] = useState(0);

  // Real-time Push Notification & Simulated Toast Alerts
  const [vicinityAlerts, setVicinityAlerts] = useState<VicinityAlert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [autoRadar, setAutoRadar] = useState<boolean>(true);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const [isFallbackPolling, setIsFallbackPolling] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const previousPlacedOrderIdsRef = useRef<Set<string>>(new Set());
  const nextSimIndexRef = useRef<number>(0);

  const triggerVicinityAlert = (offer: DispatchOffer, distanceKm?: number) => {
    const alertId = 'alert_' + offer.id + '_' + Date.now();
    const alertDist = distanceKm ?? +(1.1 + Math.random() * 2.5).toFixed(1);

    const newAlert: VicinityAlert = {
      id: alertId,
      offer,
      distanceFromDriverKm: alertDist,
      createdAt: Date.now(),
      expiresInSeconds: 16,
    };

    setVicinityAlerts(prev => [newAlert, ...prev.filter(a => a.offer.id !== offer.id).slice(0, 1)]);

    if (soundEnabled) {
      playVicinityChime();
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('SeedhaMandi: Dispatch in Vicinity!', {
          body: `${offer.produceName} (${alertDist} km away) • Net Freight ₹${offer.freightPayout}`,
          icon: '/vite.svg',
        });
      } catch (e) {
        // ignore
      }
    }
  };

  const triggerRandomSimulatedDispatch = () => {
    const poolItem = SIMULATED_REQUESTS_POOL[nextSimIndexRef.current % SIMULATED_REQUESTS_POOL.length];
    nextSimIndexRef.current += 1;
    const newOfferId = 'vicinity_live_' + Date.now().toString().slice(-6);

    const newOffer: DispatchOffer = {
      ...poolItem,
      id: newOfferId,
    };

    setLocalDispatchOffers(prev => [newOffer, ...prev]);
    const dist = +(0.9 + Math.random() * 2.8).toFixed(1);
    triggerVicinityAlert(newOffer, dist);
  };

  // Initial greeting toast after 2.5s to demonstrate the real-time push notification system
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localDispatchOffers.length > 0 && vicinityAlerts.length === 0) {
        triggerVicinityAlert(localDispatchOffers[0], 1.4);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Recurring Simulated Radar alerts every 32 seconds if autoRadar is active
  useEffect(() => {
    if (!autoRadar) return;
    const interval = setInterval(() => {
      triggerRandomSimulatedDispatch();
    }, 32000);
    return () => clearInterval(interval);
  }, [autoRadar, soundEnabled]);

  // Listen to new orders coming from buyers
  useEffect(() => {
    const newPlaced = orders.filter(o => o.status === 'PLACED' && !o.logisticsId);
    newPlaced.forEach(o => {
      if (!previousPlacedOrderIdsRef.current.has(o.id)) {
        previousPlacedOrderIdsRef.current.add(o.id);
        const firstItem = o.items[0];
        const totalWeight = o.items.reduce((s, i) => s + i.quantity, 0);
        const isBulk = o.isBulkOrder || totalWeight >= 200;
        const offer: DispatchOffer = {
          id: 'ord_offer_' + o.id,
          orderId: o.id,
          produceName: o.items.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', '),
          quantity: `${totalWeight} kg ${isBulk ? 'Bulk Wholesale' : 'Standard'}`,
          pickupPoint: 'Mancheswar Central Agro Depot, Bhubaneswar',
          dropPoint: `${o.shippingAddress.street}, ${o.shippingAddress.city}`,
          distanceKm: 14.2,
          estMinutes: 28,
          freightPayout: o.logisticsFee || (isBulk ? 420 : 180),
          farmerName: firstItem?.farmerName || 'Ramesh Patel',
          farmerPhone: '+91 98000 55441',
          tempRequired: isBulk ? 'Heavy Agro Transit' : 'Standard Transit',
          urgency: 'HIGH',
          vehicleType: o.vehicleTypeRequired || (isBulk ? 'TRACTOR' : 'MINI_TRUCK'),
          isBulk,
        };
        triggerVicinityAlert(offer, 1.8);
      }
    });
  }, [orders, soundEnabled]);

  const handleViewOnMap = (offer: DispatchOffer) => {
    setLogisticsTab('map_dispatches');
    setTimeout(() => {
      const el = document.getElementById('bhubaneswar-gps-map');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const loadDeliveriesAndNotifications = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [orderRes, notifRes] = await Promise.all([
        api.getOrders(),
        api.getNotifications(),
      ]);
      setOrders(orderRes.orders || []);
      setNotifications(notifRes.notifications || []);
      setLastSyncTime(new Date());
    } catch (e) {
      // Quietly handle transient network interruptions
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    loadDeliveriesAndNotifications();

    // 1. Subscribe to real-time WebSocket / SSE broadcast events
    const unsubscribe = realtimeService.subscribe((event) => {
      setIsWsConnected(true);
      setIsFallbackPolling(false);
      setLastSyncTime(new Date());

      if (event.type === 'order:created' && event.data?.order) {
        const newOrder = event.data.order;
        setOrders((prev) => {
          if (prev.some((o) => o.id === newOrder.id)) return prev;
          return [newOrder, ...prev];
        });
      } else if (event.type === 'order:status_change' && event.data?.order) {
        const updated = event.data.order;
        setOrders((prev) =>
          prev.map((o) => (o.id === updated.id ? updated : o))
        );
      } else if (event.type === 'order:updated' && event.data?.order) {
        const updated = event.data.order;
        setOrders((prev) =>
          prev.map((o) => (o.id === updated.id ? updated : o))
        );
      }
    });

    // 2. Fallback Polling Mechanism:
    // Periodically checks order status from the server API if WebSocket/event notifications are not received
    const FALLBACK_THRESHOLD_MS = 6000;
    const pollingInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;

      const connected = realtimeService.isConnected();
      const lastEventAge = Date.now() - realtimeService.getLastEventTime();

      if (!connected || lastEventAge > FALLBACK_THRESHOLD_MS) {
        // Fallback polling active: periodically sync order status with server API
        setIsFallbackPolling(true);
        loadDeliveriesAndNotifications(true);
      } else {
        setIsFallbackPolling(false);
        setIsWsConnected(true);
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(pollingInterval);
    };
  }, []);

  // Turn newly placed backend orders without carrier into dispatch offers!
  const backendUnassignedOffers: DispatchOffer[] = orders
    .filter(o => o.status === 'PLACED' && !o.logisticsId)
    .map(o => {
      const firstItem = o.items[0];
      const totalWeight = o.items.reduce((s, i) => s + i.quantity, 0);
      const isBulk = o.isBulkOrder || totalWeight >= 200;
      return {
        id: 'ord_offer_' + o.id,
        orderId: o.id,
        produceName: o.items.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', '),
        quantity: `${totalWeight} kg ${isBulk ? 'Bulk Wholesale' : 'Standard'}`,
        pickupPoint: 'Mancheswar Central Agro Depot, Bhubaneswar',
        dropPoint: `${o.shippingAddress.street}, ${o.shippingAddress.city}`,
        distanceKm: 14.2,
        estMinutes: 28,
        freightPayout: o.logisticsFee || (isBulk ? 420 : 180),
        farmerName: firstItem?.farmerName || 'Ramesh Patel',
        farmerPhone: '+91 98000 55441',
        tempRequired: isBulk ? 'Heavy Agro Transit' : 'Standard Transit',
        urgency: 'HIGH',
        vehicleType: o.vehicleTypeRequired || (isBulk ? 'TRACTOR' : 'MINI_TRUCK'),
        isBulk,
      };
    });

  // Combined active available offers
  const allAvailableOffers = [...backendUnassignedOffers, ...localDispatchOffers];

  // Pre-mapped geospatial coordinates for known hubs and dropoff sectors in Odisha
  const locationCoordsMap: Record<string, { lat: number; lng: number }> = {
    'Mancheswar Cold Depot, Bhubaneswar': { lat: 20.316, lng: 85.864 },
    'Mancheswar Central Agro Depot, Bhubaneswar': { lat: 20.316, lng: 85.864 },
    'Patia Infocity DLF Square, Bhubaneswar': { lat: 20.354, lng: 85.819 },
    'Khordha Valley Agro Collection Hub': { lat: 20.182, lng: 85.617 },
    'Saheed Nagar Organic Cooperative, Bhubaneswar': { lat: 20.289, lng: 85.843 },
    'Rasulgarh Agro Transit Depot': { lat: 20.298, lng: 85.867 },
    'Jayadev Vihar - Nayapalli Cluster': { lat: 20.301, lng: 85.816 },
    'Khandagiri Western Transit Depot': { lat: 20.262, lng: 85.783 },
    'Chandrasekharpur Housing Colony': { lat: 20.328, lng: 85.823 },
  };

  const getCoordsForPoint = (name: string, isPickup: boolean): { lat: number; lng: number } => {
    if (locationCoordsMap[name]) return locationCoordsMap[name];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash << 5) - hash + name.charCodeAt(i);
    const latOffset = ((Math.abs(hash) % 80) / 1000) * (isPickup ? -1 : 1);
    const lngOffset = ((Math.abs(hash >> 3) % 80) / 1000) * (isPickup ? -1 : 1);
    return {
      lat: 20.29 + latOffset,
      lng: 85.82 + lngOffset,
    };
  };

  const mapDeliveryRequests: MapDeliveryRequest[] = allAvailableOffers.map(offer => ({
    id: offer.id,
    orderId: offer.orderId,
    produceName: offer.produceName,
    quantity: offer.quantity,
    pickupPoint: offer.pickupPoint,
    pickupCoords: getCoordsForPoint(offer.pickupPoint, true),
    dropPoint: offer.dropPoint,
    dropCoords: getCoordsForPoint(offer.dropPoint, false),
    distanceKm: offer.distanceKm,
    estMinutes: offer.estMinutes,
    freightPayout: offer.freightPayout,
    farmerName: offer.farmerName,
    farmerPhone: offer.farmerPhone,
    tempRequired: offer.tempRequired,
    urgency: offer.urgency,
    vehicleType: offer.vehicleType,
    isBulk: offer.isBulk,
    status: 'PENDING',
  }));

  // Filtered by selected vehicle category
  const filteredOffers = allAvailableOffers.filter(offer => {
    if (selectedVehicleFilter === 'ALL') return true;
    return offer.vehicleType === selectedVehicleFilter;
  });

  const handleAcceptOffer = async (offer: DispatchOffer) => {
    if (offer.orderId) {
      try {
        await api.acceptDelivery(offer.orderId);
        setFeedback({
          id: 'dispatch_action',
          msg: `Delivery for Order #${offer.orderId} Accepted! Route locked to ${offer.dropPoint}. Farmer & Buyer notified.`,
          type: 'success',
        });
        await loadDeliveriesAndNotifications();
        return;
      } catch (err: any) {
        console.error(err);
      }
    }

    // Local offer accept
    setLocalDispatchOffers(prev => prev.filter(r => r.id !== offer.id));
    setAcceptedRequestsCount(c => c + 1);
    setFeedback({
      id: 'dispatch_action',
      msg: `Delivery Accepted! Assigned to vehicle ${activeDriverVehicle.plate}. Route to ${offer.dropPoint} locked into GPS.`,
      type: 'success',
    });
  };

  const handleRejectOffer = async (offer: DispatchOffer) => {
    if (offer.orderId) {
      try {
        await api.rejectDelivery(offer.orderId);
      } catch (e) {
        console.error(e);
      }
    }
    setLocalDispatchOffers(prev => prev.filter(r => r.id !== offer.id));
    setFeedback({
      id: 'dispatch_action',
      msg: `Dispatch passed. Offer automatically routed to the next nearby fleet driver in Bhubaneswar.`,
      type: 'error',
    });
  };

  const handleUpdateStatus = async (orderId: string, status: any) => {
    try {
      await api.updateOrderStatus(orderId, status, `Carrier updated status to ${status}`);
      await loadDeliveriesAndNotifications();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleVerifyDelivery = async (order: Order) => {
    const entered = activeOtpInputs[order.id] || '';
    if (entered.trim() !== order.deliveryOtp) {
      setFeedback({ id: order.id, msg: 'Invalid Customer OTP! Please check with recipient.', type: 'error' });
      return;
    }

    try {
      const consignmentValue = order.totalAmount || 1180;
      const freightFee = order.logisticsFee || 120;
      const farmerName = order.items[0]?.farmerName || 'Ramesh Patel';
      recordOtpDeliveryCompletion(consignmentValue, order.id, freightFee, farmerName);
      await api.updateOrderStatus(order.id, 'DELIVERED', 'Verified with buyer OTP. Consignment escrow disbursed to farmer.');
      setFeedback({
        id: order.id,
        msg: `Delivery verified via OTP. Escrow released! ₹${freightFee} freight payout instantly credited.`,
        type: 'success',
      });
      await loadDeliveriesAndNotifications();
    } catch (err: any) {
      setFeedback({ id: order.id, msg: err.message || 'Verification failed', type: 'error' });
    }
  };

  const handleSimulatedOtpAndDeliver = async (order: Order) => {
    try {
      const consignmentValue = order.totalAmount || 1180;
      const freightFee = order.logisticsFee || 120;
      const farmerName = order.items[0]?.farmerName || 'Ramesh Patel';
      recordOtpDeliveryCompletion(consignmentValue, order.id, freightFee, farmerName);
      await api.updateOrderStatus(order.id, 'DELIVERED', 'Verified with buyer OTP. Consignment escrow disbursed to farmer.');
      setFeedback({
        id: order.id,
        msg: `Delivery verified via OTP. Escrow released! ₹${freightFee} freight payout instantly credited.`,
        type: 'success',
      });
      await loadDeliveriesAndNotifications();
    } catch (err: any) {
      const consignmentValue = order.totalAmount || 1180;
      const freightFee = order.logisticsFee || 120;
      const farmerName = order.items[0]?.farmerName || 'Ramesh Patel';
      recordOtpDeliveryCompletion(consignmentValue, order.id, freightFee, farmerName);
      setFeedback({
        id: order.id,
        msg: `Delivery verified via OTP. Escrow released! ₹${freightFee} freight payout instantly credited.`,
        type: 'success',
      });
    }
  };

  const handleWithdrawPayout = () => {
    setPayoutSuccess(true);
    setTimeout(() => setPayoutSuccess(false), 4000);
  };

  const handleOptimizeBhubaneswarRoute = async () => {
    try {
      setIsOptimizingRoute(true);
      setOptimizingStatusText('Evaluating road conditions, traffic, and crop shelf-life across 7 waypoints...');
      
      const stops = [
        {
          id: 'hub_start',
          name: 'Mancheswar Central Storage Depot',
          type: 'HUB' as const,
          location: 'Mancheswar Industrial Estate, Bhubaneswar',
          coordinates: { lat: 20.316, lng: 85.864 },
          produce: 'Consolidated Fleet Depot',
          weightKg: 0,
          perishabilityScore: 1,
          contactPerson: 'Hub Dispatcher',
          contactPhone: '+91 94370 11001',
        },
        {
          id: 'stop_1',
          name: 'Nuagaon Strawberry Polyhouse',
          type: 'PICKUP' as const,
          location: 'Nuagaon Agro Cluster (Khordha Belt)',
          coordinates: { lat: 20.178, lng: 85.620 },
          produce: 'Fresh Strawberries (Cold-Chain Reefer)',
          weightKg: 180,
          perishabilityScore: 10,
          contactPerson: 'Kailash Sahu',
          contactPhone: '+91 98234 11201',
        },
        {
          id: 'stop_2',
          name: 'Khordha Valley Vine Tomato Belt',
          type: 'PICKUP' as const,
          location: 'Khordha Farmgate Belt (NH-16)',
          coordinates: { lat: 20.185, lng: 85.632 },
          produce: 'Vine Ripe Tomatoes (Reefer 6°C)',
          weightKg: 240,
          perishabilityScore: 9,
          contactPerson: 'Bikram Sahoo',
          contactPhone: '+91 94371 88402',
        },
        {
          id: 'stop_3',
          name: 'Saheed Nagar Cold Retail Hub',
          type: 'DELIVERY' as const,
          location: 'Saheed Nagar Cold Mandi, Janpath',
          coordinates: { lat: 20.289, lng: 85.843 },
          produce: 'Direct Drop: Strawberries & Tomatoes',
          weightKg: 420,
          perishabilityScore: 9,
          contactPerson: 'Prabhat Mohanty',
          contactPhone: '+91 98111 22334',
        },
        {
          id: 'stop_4',
          name: 'Pipili Agro Aggregation Hub',
          type: 'PICKUP' as const,
          location: 'Pipili Toll Cluster, Puri Highway',
          coordinates: { lat: 20.115, lng: 85.832 },
          produce: 'Fresh Nashik Red Onions',
          weightKg: 500,
          perishabilityScore: 5,
          contactPerson: 'Sunil Jena',
          contactPhone: '+91 94371 66201',
        },
        {
          id: 'stop_5',
          name: 'Khandagiri FPO Grain Terminal',
          type: 'PICKUP' as const,
          location: 'Khandagiri Western Transit Hub',
          coordinates: { lat: 20.258, lng: 85.782 },
          produce: 'Sharbati Wheat Sacks (Ambient Dry)',
          weightKg: 800,
          perishabilityScore: 1,
          contactPerson: 'Harish Choudhury',
          contactPhone: '+91 98612 88471',
        },
        {
          id: 'stop_6',
          name: 'Patia Infocity Master Retail Co-op',
          type: 'DELIVERY' as const,
          location: 'DLF Cybercity, Patia',
          coordinates: { lat: 20.354, lng: 85.819 },
          produce: 'Final Drop: Onions & Grain Consignments',
          weightKg: 1300,
          perishabilityScore: 2,
          contactPerson: 'Rohan Verma',
          contactPhone: '+91 99370 44552',
        }
      ];

      // Simulate calculations over the 7 waypoints
      await new Promise(r => setTimeout(r, 1200));
      const res = await api.optimizeRoute(stops, activeDriverVehicle.type);
      setAiRoutePlan(res);
    } catch (err: any) {
      console.error('Failed to run AI route optimizer:', err);
    } finally {
      setIsOptimizingRoute(false);
    }
  };

  // Metrics
  const assignedOrders = orders.filter(o => o.logisticsId === (user?.id || 'usr_logistics_1') || o.status === 'CONFIRMED' || o.status === 'IN_TRANSIT');
  const completedTrips = orders.filter(o => o.status === 'DELIVERED').length + 18 + acceptedRequestsCount;
  const totalLogisticsEarnings = completedTrips * 135 + 4200;
  const pendingTripEarnings = assignedOrders.filter(o => o.status !== 'DELIVERED').length * 160 + filteredOffers.length * 60;

  // Vehicle type meta
  const vehicleConfig = {
    TRACTOR: { label: 'Tractor / Agro Trolley', icon: '🚜', badge: 'bg-amber-100 text-amber-900 border-amber-300' },
    MINI_TRUCK: { label: 'Mini Truck / Tata Ace', icon: '🚚', badge: 'bg-blue-100 text-blue-900 border-blue-300' },
    BIKE_SCOOTY: { label: 'Bike / Scooty Express', icon: '🛵', badge: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    REEFER_VAN: { label: 'Reefer Cold Van (4°C)', icon: '❄️', badge: 'bg-teal-100 text-teal-900 border-teal-300' },
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-8 pt-6 sm:pt-8 text-stone-900 dark:text-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Fleet Header */}
        <div className="mt-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-800/80 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-500 text-white text-[11px] font-black tracking-wide">
                BHUBANESWAR FLEET DISPATCH PORTAL
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Real-Time Dispatches
              </span>
              <span className="text-xs text-blue-200">Odisha Agro Transit Grid (NH-16)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
              <span>{activeDriverVehicle.label}</span>
              <span className="text-base text-amber-300 font-mono">({activeDriverVehicle.plate})</span>
            </h1>
            <p className="text-xs sm:text-sm text-blue-200 max-w-2xl leading-relaxed">
              When consumers place orders, dispatches arrive here instantly for your vehicle category. Accept or reject delivery jobs, navigate live Bhubaneswar routes, and verify customer OTP for direct bank settlement.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Quick Vehicle Switcher */}
            <div className="bg-white dark:bg-stone-900 transition-colors/10 backdrop-blur-md rounded-2xl p-2 border border-blue-700/60 flex items-center gap-1 text-xs">
              <span className="text-[11px] text-blue-200 font-bold px-2">Vehicle:</span>
              <button
                onClick={() => setActiveDriverVehicle({
                  type: 'MINI_TRUCK',
                  label: 'Mini Truck / Tata Ace (Chota Hathi)',
                  plate: 'OD 02 AX 8840',
                  capacity: '1.2 Tons',
                })}
                className={`px-2.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                  activeDriverVehicle.type === 'MINI_TRUCK' ? 'bg-blue-500 text-white' : 'text-blue-100 hover:bg-white/10'
                }`}
              >
                <span>🚚</span>
                <span>Mini Truck</span>
              </button>
              <button
                onClick={() => setActiveDriverVehicle({
                  type: 'TRACTOR',
                  label: 'Tractor / Agro Trolley',
                  plate: 'OD 02 TR 9912',
                  capacity: '3.5 Tons (Bulk Mandi)',
                })}
                className={`px-2.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                  activeDriverVehicle.type === 'TRACTOR' ? 'bg-amber-500 text-emerald-950' : 'text-blue-100 hover:bg-white/10'
                }`}
              >
                <span>🚜</span>
                <span>Tractor</span>
              </button>
              <button
                onClick={() => setActiveDriverVehicle({
                  type: 'BIKE_SCOOTY',
                  label: 'Bike / Scooty Express',
                  plate: 'OD 02 BK 4018',
                  capacity: '35 kg Basket',
                })}
                className={`px-2.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                  activeDriverVehicle.type === 'BIKE_SCOOTY' ? 'bg-emerald-500 text-stone-950' : 'text-blue-100 hover:bg-white/10'
                }`}
              >
                <span>🛵</span>
                <span>Bike</span>
              </button>
            </div>

            {/* Sync & Real-time Stream Indicator */}
            <div
              className={`px-3 py-2 rounded-2xl border text-xs font-semibold flex items-center gap-2 backdrop-blur-md transition-all ${
                isFallbackPolling
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isFallbackPolling ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-ping'
                }`}
              />
              <div className="flex flex-col text-[11px] leading-tight">
                <span className="font-bold">
                  {isFallbackPolling ? 'Fallback Polling' : 'WebSocket Live'}
                </span>
                <span className="text-[9px] opacity-75">
                  {isFallbackPolling ? 'Auto-syncing server' : 'Connected to stream'}
                </span>
              </div>
            </div>

            <button
              onClick={() => loadDeliveriesAndNotifications(false)}
              className="px-4 py-3 rounded-2xl bg-blue-800/80 hover:bg-blue-700 text-white text-xs font-bold border border-blue-600 flex items-center justify-center gap-2 transition active:scale-95 shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Real-time Vicinity Push Notification System & Toast Alerts */}
        <VicinityDispatchToast
          alerts={vicinityAlerts}
          onAccept={(offer) => {
            handleAcceptOffer(offer);
            setVicinityAlerts(prev => prev.filter(a => a.offer.id !== offer.id));
          }}
          onDismiss={(alertId) => {
            setVicinityAlerts(prev => prev.filter(a => a.id !== alertId));
          }}
          onViewOnMap={(offer) => {
            handleViewOnMap(offer);
          }}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(v => !v)}
          autoRadar={autoRadar}
          onToggleAutoRadar={() => setAutoRadar(v => !v)}
          onTriggerTestAlert={triggerRandomSimulatedDispatch}
        />

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-950 text-emerald-100 border border-emerald-800'
                : 'bg-rose-950 text-rose-100 border border-rose-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span>{feedback.msg}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-stone-300 hover:text-white px-2 py-0.5 text-sm"
            >
              ✕
            </button>
          </div>
        )}

        {/* Payout Success Alert */}
        {payoutSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-900 text-emerald-100 border border-emerald-700 text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in">
            <Check className="w-5 h-5 text-amber-400" />
            <span>Success! ₹{totalLogisticsEarnings.toLocaleString('en-IN')} transferred directly to your registered UPI / Bank account (Ref: IMPS-{Date.now().toString().slice(-8)}).</span>
          </div>
        )}

        {/* Real-time Notifications Banner if any unread dispatch notifications exist */}
        {notifications.filter(n => !n.isRead && n.recipientRole === 'LOGISTICS').length > 0 && (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
              <Bell className="w-4 h-4 text-amber-600 animate-bounce" />
              <span>Live Dispatch Notifications (New Orders Placed by Buyers)</span>
            </div>
            <div className="space-y-2">
              {notifications
                .filter(n => !n.isRead && n.recipientRole === 'LOGISTICS')
                .slice(0, 2)
                .map(notif => (
                  <div
                    key={notif.id}
                    className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-amber-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-stone-900 dark:text-stone-100 block">{notif.title}</span>
                      <p className="text-stone-600 dark:text-stone-300 text-[11px] mt-0.5">{notif.message}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          api.markNotificationRead(notif.id);
                          loadDeliveriesAndNotifications();
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs"
                      >
                        Review Offer
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Audible Warning Banner for Reefer Cold Chain Breach */}
        {showBreachBanner && (
          <div className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:right-6 sm:left-auto z-50 max-w-md mx-auto p-4 rounded-2xl bg-rose-600 text-white shadow-2xl border border-rose-700 animate-in slide-in-from-bottom duration-300 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 animate-pulse">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-black text-sm flex items-center gap-2">
                  <span>CRITICAL: Reefer Thermal Breach &gt; 8.0°C ({reeferTemp}°C)</span>
                  <span className="bg-white text-rose-700 text-[10px] font-black px-2 py-0.5 rounded uppercase">Urgent</span>
                </div>
                <p className="text-xs text-rose-100 mt-1 leading-relaxed">
                  ⚠️ Cold-Chain Alert: Strawberry lot at spoilage risk. Route Engine automatically prioritizes immediate drop at Saheed Nagar Cold Hub.
                </p>
              </div>
              <button
                onClick={() => setShowBreachBanner(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white transition cursor-pointer"
                title="Dismiss Alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-500/50">
              <button
                onClick={restoreCooling}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white text-rose-800 hover:bg-rose-50 font-bold text-xs transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Restore Cooling (4.2°C Optimal)</span>
              </button>
            </div>
          </div>
        )}

        {/* Top Earnings & Sensor Telemetry Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Earnings Card */}
          <div className="bg-white dark:bg-stone-900 transition-colors rounded-2xl border border-stone-200 dark:border-stone-700 p-5 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Total Freight Earnings
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-stone-900 dark:text-stone-100">
                ₹{totalLogisticsEarnings.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1 mt-1">
                <TrendingUp className="w-3.5 h-3.5" /> Direct Bank Settled • 0% Broker Cut
              </div>
            </div>
            <button
              onClick={handleWithdrawPayout}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Instant Payout Withdrawal</span>
            </button>
          </div>

          {/* Trips Completed */}
          <div className="bg-white dark:bg-stone-900 transition-colors rounded-2xl border border-stone-200 dark:border-stone-700 p-5 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Bhubaneswar Trips Completed
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-stone-900 dark:text-stone-100">{completedTrips}</div>
              <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Avg. Delivery Time: <strong className="text-stone-800 dark:text-stone-200">24 mins per drop</strong>
              </div>
            </div>
            <div className="text-[11px] text-blue-700 font-semibold">
              On-time delivery rating: 99.4%
            </div>
          </div>

          {/* In-Transit Freight Escrow */}
          <div className="bg-white dark:bg-stone-900 transition-colors rounded-2xl border border-stone-200 dark:border-stone-700 p-5 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                In-Transit Freight Escrow
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-amber-900">
                ₹{pendingTripEarnings.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Auto-releases upon customer OTP verification
              </div>
            </div>
            <div className="text-[11px] text-amber-700 font-bold">
              {assignedOrders.length} active dispatches assigned
            </div>
          </div>

          {/* Interactive Cold Chain Reefer Sensor Status */}
          <div
            className={`transition-all rounded-2xl border p-5 shadow-xs flex flex-col justify-between space-y-3 select-none ${
              isReeferBreach
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-700 ring-2 ring-rose-500/40'
                : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Reefer Temperature
                </span>
                <button
                  type="button"
                  onClick={toggleReeferTemp}
                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold transition cursor-pointer border ${
                    isReeferBreach
                      ? 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700'
                      : 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 hover:bg-teal-100'
                  }`}
                >
                  Tap to Test Sensor Alert
                </button>
              </div>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  isReeferBreach ? 'bg-rose-600 text-white animate-bounce' : 'bg-teal-100 text-teal-700'
                }`}
              >
                <Thermometer className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-3xl font-black flex items-baseline gap-2 flex-wrap">
                <span className={isReeferBreach ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-teal-700 dark:text-teal-400'}>
                  {reeferTemp}°C
                </span>
                {isReeferBreach ? (
                  <span className="text-xs font-black text-white bg-rose-600 px-2.5 py-0.5 rounded-full animate-pulse flex items-center gap-1 shadow-xs">
                    <AlertTriangle className="w-3 h-3" />
                    <span>CRITICAL: Reefer Thermal Breach &gt; 8.0°C</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                    <span>Optimal • Green Glow Dot</span>
                  </span>
                )}
              </div>

              {/* Sparkline for 6-Hour Continuous History */}
              <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-stone-400">6h History:</span>
                  <ReeferSparkline isBreached={isReeferBreach} />
                </div>
                <span className="text-[10px] font-mono text-stone-400">
                  {isReeferBreach ? 'Spike: 9.8°C' : '4.1°C - 4.3°C'}
                </span>
              </div>

              <div className="text-xs text-stone-500 dark:text-stone-400 mt-2 font-medium">
                Active Reefer IoT Sensor (OD 02 AX 8840) • Protocol: MQTT / HTTPS
              </div>
            </div>

            {/* Sub-metrics */}
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-600 dark:text-stone-300 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1">
                <span className="font-bold text-stone-700 dark:text-stone-200">Humidity:</span>
                <span>85% RH</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-stone-700 dark:text-stone-200">Sensor Battery:</span>
                <span className="text-emerald-600 font-bold">94%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-stone-700 dark:text-stone-200">GPS Lock:</span>
                <span className="text-blue-600 font-bold">High Precision</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Tab Segmented Controller for Clean Mobile Ergonomics */}
        <div className="bg-stone-200/80 dark:bg-stone-800 p-1.5 rounded-2xl flex flex-col sm:flex-row gap-1.5 shadow-inner">
          <button
            onClick={() => setLogisticsSegment('map_radar')}
            className={`flex-1 min-h-[48px] py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
              logisticsSegment === 'map_radar'
                ? 'bg-white dark:bg-stone-900 text-blue-900 dark:text-blue-300 shadow-xs ring-1 ring-stone-900/5'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Map & Radar</span>
          </button>

          <button
            onClick={() => setLogisticsSegment('active_sequence')}
            className={`flex-1 min-h-[48px] py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
              logisticsSegment === 'active_sequence'
                ? 'bg-white dark:bg-stone-900 text-blue-900 dark:text-blue-300 shadow-xs ring-1 ring-stone-900/5'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Navigation className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Active Sequence (Timeline)</span>
            {assignedOrders.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                {assignedOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setLogisticsSegment('nearby_dispatches')}
            className={`flex-1 min-h-[48px] py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
              logisticsSegment === 'nearby_dispatches'
                ? 'bg-white dark:bg-stone-900 text-blue-900 dark:text-blue-300 shadow-xs ring-1 ring-stone-900/5'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Truck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Nearby Dispatches</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300 text-[10px] font-black shrink-0">
              {filteredOffers.length}
            </span>
          </button>

          <button
            onClick={() => setLogisticsSegment('travelled_history')}
            className={`flex-1 min-h-[48px] py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
              logisticsSegment === 'travelled_history'
                ? 'bg-white dark:bg-stone-900 text-blue-900 dark:text-blue-300 shadow-xs ring-1 ring-stone-900/5'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <History className="w-4 h-4 text-stone-500 shrink-0" />
            <span>Carrier Waybills (14)</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SEGMENT 1: MAP & RADAR                                                    */}
        {/* ========================================================================= */}
        {logisticsSegment === 'map_radar' && (
          <div className="space-y-6 pt-4 animate-in fade-in duration-200">
            {/* Dual AI Engine Banner in Map & Radar */}
            <DualAiRouteOptimizerBanner
              onOptimize={handleOptimizeBhubaneswarRoute}
              isOptimizing={isOptimizingRoute}
              statusText={optimizingStatusText}
              activeVehicleLabel={activeDriverVehicle.label}
            />

            <div id="bhubaneswar-gps-map" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <span>Live Bhubaneswar Transit Map & Depots</span>
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Interactive Odisha GPS Grid: Mancheswar Agro Depot, Patia Infocity, Saheed Nagar, Khandagiri, and Khordha Farm Supply Belt.
                  </p>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full self-start sm:self-auto">
                  Active Zone: Bhubaneswar Urban + Khordha Periphery
                </span>
              </div>

              {/* Live Dynamic Delivery Requests & Geolocation Routing Map */}
              <InteractiveLogisticsMap
                requests={mapDeliveryRequests}
                driverVehicleType={activeDriverVehicle.type}
                driverVehiclePlate={activeDriverVehicle.plate}
                aiRoutePlan={aiRoutePlan}
                onAcceptRequest={(reqId) => {
                  const found = allAvailableOffers.find(o => o.id === reqId);
                  if (found) handleAcceptOffer(found);
                }}
                onRejectRequest={(reqId) => {
                  const found = allAvailableOffers.find(o => o.id === reqId);
                  if (found) handleRejectOffer(found);
                }}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SEGMENT 2: ACTIVE SEQUENCE (TIMELINE) & OTP VERIFICATION                   */}
        {/* ========================================================================= */}
        {logisticsSegment === 'active_sequence' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Dual AI Route Optimizer Banner */}
            <DualAiRouteOptimizerBanner
              onOptimize={handleOptimizeBhubaneswarRoute}
              isOptimizing={isOptimizingRoute}
              statusText={optimizingStatusText}
              activeVehicleLabel={activeDriverVehicle.label}
            />

            {/* Perishability-First AI Waypoint Sequence */}
            <div className="bg-white dark:bg-stone-900 transition-colors rounded-3xl border border-stone-200 dark:border-stone-700 p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-4">
                <div>
                  <h3 className="font-black text-stone-900 dark:text-stone-100 text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <span>Perishability-First AI Waypoint Sequence</span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Stops ordered automatically by biological decay index, cold-chain reefer compliance, and traffic congestion bypasses.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    Tier 1: High Spoilage
                  </span>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Tier 2: Moderate
                  </span>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Tier 3: Ambient Bulk
                  </span>
                </div>
              </div>

              {/* Waypoints List */}
              <div className="space-y-3">
                {(aiRoutePlan?.orderedWaypoints || [
                  {
                    seq: 1,
                    stopName: 'Nuagaon Strawberry Polyhouse',
                    action: 'PICKUP',
                    produce: 'Fresh Strawberries (Cold-Chain Reefer)',
                    weightKg: 180,
                    etaMinutesFromStart: 25,
                    notes: 'Tier 1 Perishability: Pre-cooled Reefer 4°C active',
                    perishabilityScore: 10,
                  },
                  {
                    seq: 2,
                    stopName: 'Khordha Valley Vine Tomato Belt',
                    action: 'PICKUP',
                    produce: 'Vine Ripe Tomatoes',
                    weightKg: 240,
                    etaMinutesFromStart: 45,
                    notes: 'Tier 1 Perishability: High shelf-life decay index',
                    perishabilityScore: 9,
                  },
                  {
                    seq: 3,
                    stopName: 'Saheed Nagar Cold Retail Hub',
                    action: 'DELIVERY',
                    produce: 'Strawberries & Vine Tomatoes',
                    weightKg: 420,
                    etaMinutesFromStart: 68,
                    notes: 'Priority Expedited Drop: 0% shelf-life spoilage achieved',
                    perishabilityScore: 9,
                  },
                  {
                    seq: 4,
                    stopName: 'Pipili Agro Aggregation Hub',
                    action: 'PICKUP',
                    produce: 'Fresh Nashik Red Onions & Greens',
                    weightKg: 500,
                    etaMinutesFromStart: 88,
                    notes: 'Tier 2 Perishability: Standard ventilated transit',
                    perishabilityScore: 5,
                  },
                  {
                    seq: 5,
                    stopName: 'Khandagiri FPO Grain Terminal',
                    action: 'PICKUP',
                    produce: 'Sharbati Wheat Sacks (Ambient Dry)',
                    weightKg: 800,
                    etaMinutesFromStart: 105,
                    notes: 'Tier 3 Bulk: Zero spoilage risk in dry hold',
                    perishabilityScore: 1,
                  },
                  {
                    seq: 6,
                    stopName: 'Patia Infocity Master Retail Co-op',
                    action: 'DELIVERY',
                    produce: 'Onions & Grain Consignments',
                    weightKg: 1300,
                    etaMinutesFromStart: 131,
                    notes: 'Final Drop: OTP Handover verified at buyer dock',
                    perishabilityScore: 2,
                  }
                ]).map((stop: any, idx: number) => {
                  const pScore = stop.perishabilityScore ?? (10 - idx * 2);
                  const isHigh = pScore >= 8;
                  const isMed = pScore >= 4 && pScore < 8;

                  return (
                    <div
                      key={stop.seq || idx}
                      className={`p-4 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isHigh
                          ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                          : isMed
                          ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                          : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                            isHigh
                              ? 'bg-rose-600 text-white'
                              : isMed
                              ? 'bg-amber-600 text-white'
                              : 'bg-stone-700 text-white'
                          }`}
                        >
                          {stop.seq}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-stone-900 dark:text-stone-100 text-sm">
                              {stop.stopName}
                            </span>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                                stop.action === 'PICKUP'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                              }`}
                            >
                              {stop.action}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isHigh
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                                  : isMed
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                                  : 'bg-stone-200 text-stone-800 dark:bg-stone-700 dark:text-stone-300'
                              }`}
                            >
                              Perishability Score: {pScore}/10
                            </span>
                          </div>

                          <div className="text-xs text-stone-600 dark:text-stone-300 flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-stone-900 dark:text-stone-100">
                              {stop.produce}
                            </span>
                            <span>•</span>
                            <span>{stop.weightKg} kg payload</span>
                            <span>•</span>
                            <span className="text-stone-500 dark:text-stone-400 font-mono text-[11px]">
                              {stop.notes}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-auto shrink-0 flex-wrap">
                        <div className="text-right">
                          <div className="text-xs font-bold text-blue-700 dark:text-blue-300">
                            ETA: +{stop.etaMinutesFromStart} mins
                          </div>
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                            Saved ~{Math.round((stop.etaMinutesFromStart || 15) * 0.15)} mins transit
                          </div>
                        </div>
                        <div className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>OTP Secured</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Waypoint Sequence Summary */}
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>All stops optimized for zero thermal breaches and maximum fuel efficiency.</span>
                </span>
                <span className="font-mono text-[11px] text-stone-400">
                  Consignment Handover: Secured via 6-digit Customer OTP verification
                </span>
              </div>
            </div>

            {/* Active Consignments & Doorstep OTP Verification */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-blue-600" />
                    <span>Active Assigned Consignments (En Route)</span>
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Update status as you pick up from farm, enter transit, and input customer delivery OTP upon handover to claim freight payout.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {assignedOrders.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700">
                    <PackageCheck className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                    <h4 className="font-bold text-stone-800 dark:text-stone-200 text-sm">No Active Consignments in Route</h4>
                    <p className="text-xs text-stone-500 mt-1">Accept dispatches from "Nearby Dispatches" tab or the map to begin your delivery trip.</p>
                  </div>
                ) : (
                  assignedOrders.map(order => {
                    const isDelivered = order.status === 'DELIVERED' || completedDeliveryIds.includes(order.id);
                    return (
                      <div
                        key={order.id}
                        className="bg-white dark:bg-stone-900 transition-colors rounded-2xl border border-stone-200 dark:border-stone-700 p-5 shadow-xs space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 flex items-center justify-center font-black">
                              <Truck className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-stone-900 dark:text-stone-100 text-sm">
                                  Order #{order.id}
                                </span>
                                {order.isBulkOrder && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-200 dark:bg-amber-950 text-amber-900 dark:text-amber-300">
                                    Bulk Mandi
                                  </span>
                                )}
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  isDelivered
                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                    : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                                }`}>
                                  {isDelivered ? 'DELIVERED' : order.status}
                                </span>
                              </div>
                              <p className="text-xs text-stone-500 dark:text-stone-400">
                                Placed by: {order.consumerName} ({order.consumerPhone})
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs text-stone-400 font-bold uppercase block">
                              Freight Fee
                            </span>
                            <span className="text-lg font-black text-emerald-800 dark:text-emerald-400">
                              ₹{order.logisticsFee || 120}
                            </span>
                          </div>
                        </div>

                        {/* Items in Consignment */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {order.items.map((it, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-100 dark:border-stone-800 flex items-center gap-2.5 text-xs"
                            >
                              <img
                                src={it.image}
                                alt={it.name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-stone-900 dark:text-stone-100 truncate">{it.name}</div>
                                <div className="text-[11px] text-stone-500 dark:text-stone-400">
                                  {it.quantity} {it.unit} • Grower: {it.farmerName || 'Ramesh Patel'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Status Aware Footer */}
                        {isDelivered ? (
                          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>Consignment Delivered & OTP Verified • ₹{order.logisticsFee || 120} Freight Disbursed</span>
                            </div>
                            <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-1 rounded-lg self-start sm:self-auto font-semibold">
                              Crop Escrow Credited to Farmer
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-3 pt-2 border-t border-stone-100 dark:border-stone-800">
                            {/* Trip Advancement Progress */}
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Trip Step:</span>
                                {order.status === 'CONFIRMED' && (
                                  <button
                                    onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                                    className="min-h-[44px] px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-xl text-xs font-bold transition cursor-pointer"
                                  >
                                    Mark at Farm / Loading Crates
                                  </button>
                                )}
                                {order.status === 'PREPARING' && (
                                  <button
                                    onClick={() => handleUpdateStatus(order.id, 'PICKED_UP')}
                                    className="min-h-[44px] px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                                  >
                                    Confirm Loaded & Depart Farm
                                  </button>
                                )}
                                {order.status === 'PICKED_UP' && (
                                  <button
                                    onClick={() => handleUpdateStatus(order.id, 'IN_TRANSIT')}
                                    className="min-h-[44px] px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                                  >
                                    Mark In Transit (Bhubaneswar Grid)
                                  </button>
                                )}
                                {order.status === 'IN_TRANSIT' && (
                                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-lg">
                                    En Route to Buyer
                                  </span>
                                )}
                              </div>

                              <div className="text-xs text-stone-500">
                                Consumer OTP: <span className="font-mono font-bold text-stone-800 dark:text-stone-200">{order.deliveryOtp}</span>
                              </div>
                            </div>

                            {/* Unified OTP Handover Section */}
                            <div className="p-3 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-stone-700 dark:text-stone-300 font-bold whitespace-nowrap">Buyer OTP:</span>
                                <input
                                  type="text"
                                  maxLength={6}
                                  placeholder={order.deliveryOtp || '6-digit OTP'}
                                  value={activeOtpInputs[order.id] || ''}
                                  onChange={e =>
                                    setActiveOtpInputs(prev => ({
                                      ...prev,
                                      [order.id]: e.target.value,
                                    }))
                                  }
                                  className="w-32 min-h-[44px] px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl text-xs font-mono text-center tracking-widest font-bold focus:outline-none focus:border-emerald-600"
                                />
                                <button
                                  type="button"
                                  onClick={() => setActiveOtpInputs(prev => ({ ...prev, [order.id]: order.deliveryOtp }))}
                                  className="text-[11px] font-bold text-blue-700 dark:text-blue-400 underline hover:text-blue-900 cursor-pointer"
                                >
                                  Auto-fill OTP
                                </button>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleVerifyDelivery(order)}
                                  className="flex-1 sm:flex-initial min-h-[44px] px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black transition active:scale-95 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-4 h-4 text-amber-300" />
                                  <span>Complete & Release Freight</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SEGMENT 3: NEARBY DISPATCHES                                              */}
        {/* ========================================================================= */}
        {logisticsSegment === 'nearby_dispatches' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-600" />
                <span>Nearby Delivery Requests (Accept or Reject)</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                  {filteredOffers.length} Available
                </span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                When consumers order produce, dispatch offers appear below for your vehicle fleet (Tractor, Mini Truck, Bike, or Reefer).
              </p>
            </div>

            {/* Vehicle Category Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 bg-stone-200/80 p-1.5 rounded-2xl text-xs">
              <button
                onClick={() => setSelectedVehicleFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  selectedVehicleFilter === 'ALL' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs' : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                }`}
              >
                All Fleets ({allAvailableOffers.length})
              </button>

              <button
                onClick={() => setSelectedVehicleFilter('TRACTOR')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                  selectedVehicleFilter === 'TRACTOR' ? 'bg-amber-500 text-stone-950 shadow-xs' : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                }`}
              >
                <span>🚜</span>
                <span>Tractor (Bulk)</span>
              </button>

              <button
                onClick={() => setSelectedVehicleFilter('MINI_TRUCK')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                  selectedVehicleFilter === 'MINI_TRUCK' ? 'bg-blue-600 text-white shadow-xs' : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                }`}
              >
                <span>🚚</span>
                <span>Mini Truck</span>
              </button>

              <button
                onClick={() => setSelectedVehicleFilter('BIKE_SCOOTY')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                  selectedVehicleFilter === 'BIKE_SCOOTY' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                }`}
              >
                <span>🛵</span>
                <span>Bike / Scooty</span>
              </button>

              <button
                onClick={() => setSelectedVehicleFilter('REEFER_VAN')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                  selectedVehicleFilter === 'REEFER_VAN' ? 'bg-teal-600 text-white shadow-xs' : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                }`}
              >
                <span>❄️</span>
                <span>Reefer Cold</span>
              </button>
            </div>
          </div>

          {filteredOffers.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 transition-colors rounded-2xl border border-stone-200 dark:border-stone-700 p-8 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">All Requests in this Fleet Category Assigned!</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                No pending dispatches right now for {selectedVehicleFilter === 'ALL' ? 'any vehicle' : selectedVehicleFilter}. When consumers checkout or farmers pack crates, new requests appear instantly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredOffers.map(req => {
                const conf = vehicleConfig[req.vehicleType] || vehicleConfig.MINI_TRUCK;
                return (
                  <div
                    key={req.id}
                    className="bg-white dark:bg-stone-900 transition-colors rounded-2xl border border-stone-200 dark:border-stone-700 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Header with Vehicle Type Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${conf.badge}`}>
                              {conf.icon} {conf.label}
                            </span>
                            {req.isBulk && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-400 text-emerald-950">
                                📦 BULK LOT
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                              {req.urgency} PRIORITY
                            </span>
                          </div>

                          <h4 className="font-extrabold text-base text-stone-900 dark:text-stone-100 mt-1.5">
                            {req.produceName}
                          </h4>
                          <div className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                            Weight / Cargo: <strong className="text-stone-800 dark:text-stone-200">{req.quantity}</strong>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xl font-black text-emerald-800">
                            ₹{req.freightPayout}
                          </div>
                          <div className="text-[10px] text-stone-400 font-bold uppercase">
                            Driver Freight
                          </div>
                        </div>
                      </div>

                      {/* Route Info Box */}
                      <div className="p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-xl space-y-2 text-xs">
                        <div className="flex items-start gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-1 shrink-0" />
                          <div>
                            <div className="text-[10px] text-stone-400 font-bold uppercase">Pickup Point:</div>
                            <div className="font-semibold text-stone-800 dark:text-stone-200">{req.pickupPoint}</div>
                            <div className="text-[11px] text-stone-500 dark:text-stone-400">Grower: {req.farmerName} ({req.farmerPhone})</div>
                          </div>
                        </div>

                        <div className="border-l-2 border-dashed border-stone-300 ml-1 pl-3 py-1 my-0.5 text-[11px] text-stone-500 dark:text-stone-400">
                          {req.distanceKm} km • ~{req.estMinutes} mins transit • Recommended: {conf.label}
                        </div>

                        <div className="flex items-start gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1 shrink-0" />
                          <div>
                            <div className="text-[10px] text-stone-400 font-bold uppercase">Destination Drop:</div>
                            <div className="font-semibold text-stone-800 dark:text-stone-200">{req.dropPoint}</div>
                          </div>
                        </div>
                      </div>

                      {/* Climate / Cargo Spec */}
                      <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-300 px-1">
                        <span className="flex items-center gap-1 text-teal-800 font-semibold">
                          <Thermometer className="w-3.5 h-3.5 text-teal-600" />
                          <span>{req.tempRequired}</span>
                        </span>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                          Customer OTP Verification
                        </span>
                      </div>
                    </div>

                    {/* Accept / Reject Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100">
                      <button
                        onClick={() => handleRejectOffer(req)}
                        className="py-2.5 rounded-xl border border-stone-300 hover:bg-rose-50 hover:border-rose-300 text-stone-700 dark:text-stone-300 hover:text-rose-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject / Pass</span>
                      </button>

                      <button
                        onClick={() => handleAcceptOffer(req)}
                        className="py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4 text-amber-300" />
                        <span>Accept Delivery</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    )}

    {/* ========================================================================= */}
    {/* SEGMENT 4: TRAVELLED HISTORY WITH EARNINGS                                */}
    {/* ========================================================================= */}
    {(logisticsSegment === 'travelled_history' || logisticsTab === 'travelled_history') && (
      <div className="space-y-6 animate-in fade-in">
        {/* Metric Summary Cards */}
        <div className="bg-white dark:bg-stone-900 transition-colors rounded-2xl border border-stone-200 dark:border-stone-700 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Verified Carrier Waybills & Payouts</span>
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">100% Direct Driver Settlement</span>
              </div>
              <h3 className="text-lg font-black text-stone-900 dark:text-stone-100 mt-1">
                Travelled Delivery History & Freight Earnings
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Complete trip logs with GPS odometer readings, verified transit times, buyer OTP signatures, and direct bank earnings.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Zero Broker Commission (100% Yours)</span>
              </span>
            </div>
          </div>

          {/* Key Lifetime Travelled Totals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200">
              <span className="text-[10px] text-blue-700 font-bold uppercase block">Total Distance Travelled</span>
              <span className="text-2xl font-black text-blue-900 mt-0.5 block">284.6 km</span>
              <span className="text-[10px] text-blue-700 font-medium">Across 14 completed dispatches</span>
            </div>

            <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
              <span className="text-[10px] text-emerald-700 font-bold uppercase block">Total Freight Earnings</span>
              <span className="text-2xl font-black text-emerald-900 mt-0.5 block">₹7,420</span>
              <span className="text-[10px] text-emerald-700 font-medium">Credited to Registered Bank Account</span>
            </div>

            <div className="p-3.5 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-700">
              <span className="text-[10px] text-stone-500 dark:text-stone-400 font-bold uppercase block">Avg. Freight Realized</span>
              <span className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-0.5 block">₹26.1 / km</span>
              <span className="text-[10px] text-emerald-700 font-bold">+45% higher vs aggregator brokers</span>
            </div>

            <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200">
              <span className="text-[10px] text-amber-800 font-bold uppercase block">AI Route Fuel Savings</span>
              <span className="text-2xl font-black text-amber-950 mt-0.5 block">₹1,240</span>
              <span className="text-[10px] text-amber-800">14.8 L diesel saved via optimal path</span>
            </div>
          </div>
        </div>

        {/* Travelled Trips Mobile & Desktop Card Stack */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-stone-800 dark:text-stone-200 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              <span>Carrier Waybills & Completed Trips (14)</span>
            </h4>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Auto-released via Consumer OTP Verification</span>
          </div>

          {/* Completed Trip Invoice Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                tripId: '#TRIP-7492',
                orderRef: '#ord_1079',
                date: 'Completed 2 days ago',
                origin: 'Nashik Farmer Collection Hub, MH',
                destination: 'HAL 2nd Stage, Indiranagar, Bengaluru',
                distance: '19.4 km',
                duration: '35 mins',
                vehicle: 'Tata Ace Reefer',
                cargo: '25 kg Onions',
                buyer: 'Ananya Sharma',
                otp: 'Verified (OTP 482910)',
                payout: '₹280 Net Freight',
                rateKm: '₹15.2/km',
                ref: '✓ Credited to SBI (IMPS-92018471)',
                status: 'Settled to Bank',
              },
              {
                tripId: '#TRIP-7488',
                orderRef: '#ord_1065',
                date: 'Completed 7 days ago',
                origin: 'Khordha Krishi Vikas Kendra, OD',
                destination: 'Patia Infocity DLF Square, Bhubaneswar',
                distance: '24.2 km',
                duration: '46 mins',
                vehicle: 'Tata Ace Reefer',
                cargo: '10 kg Tomatoes + 40 kg Chana',
                buyer: 'Ananya Sharma',
                otp: 'Verified (OTP 639102)',
                payout: '₹340 Net Freight',
                rateKm: '₹14.0/km',
                ref: '✓ Credited to SBI (IMPS-83910245)',
                status: 'Settled to Bank',
              },
              {
                tripId: '#TRIP-7471',
                orderRef: '#ord_bulk_910',
                date: 'Completed 12 days ago',
                origin: 'Mancheswar Agro Cold Hub, Bhubaneswar',
                destination: 'Taj Vivanta Kitchens, Janpath, Bhubaneswar',
                distance: '14.8 km',
                duration: '31 mins',
                vehicle: 'Mahindra Bolero Maxi',
                cargo: '450 kg Export Onions',
                buyer: 'Taj Vivanta Hospitality',
                otp: 'Verified (OTP 720194)',
                payout: '₹680 Net Freight',
                rateKm: '₹45.9/km',
                ref: '✓ Credited to SBI (RTGS-01928472)',
                status: 'Settled to Bank',
              },
              {
                tripId: '#TRIP-7455',
                orderRef: '#ord_bulk_892',
                date: 'Completed 18 days ago',
                origin: 'Pipili Farm Cluster Aggregator, Puri',
                destination: 'Puri Jagannath Bhojanalaya, Grand Road',
                distance: '38.6 km',
                duration: '58 mins',
                vehicle: 'Tata Ace Reefer',
                cargo: '280 kg Fresh Tomatoes',
                buyer: 'Puri Jagannath Bhojanalaya',
                otp: 'Verified (OTP 118492)',
                payout: '₹850 Net Freight',
                rateKm: '₹22.0/km',
                ref: '✓ Credited to SBI (IMPS-72910481)',
                status: 'Settled to Bank',
              },
              {
                tripId: '#TRIP-7430',
                orderRef: '#ord_bulk_870',
                date: 'Completed 24 days ago',
                origin: 'Sehore Krishi Mandi Hub, MP',
                destination: 'Bengaluru Healthy Bakes Federation',
                distance: '42.0 km',
                duration: '1h 15m',
                vehicle: 'Eicher 14-Foot Reefer',
                cargo: '550 kg Sharbati Wheat',
                buyer: 'Bengaluru Healthy Bakes',
                otp: 'Verified (OTP 982104)',
                payout: '₹1,450 Net Freight',
                rateKm: '₹34.5/km',
                ref: '✓ Credited to SBI (RTGS-98120412)',
                status: 'Settled to Bank',
              },
              {
                tripId: '#TRIP-7412',
                orderRef: '#ord_loc_512',
                date: 'Completed 28 days ago',
                origin: 'Saheed Nagar Farmer Mart, Bhubaneswar',
                destination: 'Khandagiri Residential Colony, Bhubaneswar',
                distance: '16.5 km',
                duration: '35 mins',
                vehicle: 'Tata Ace Reefer',
                cargo: '85 kg Desi Ghee & Pulses',
                buyer: 'Dr. Debashis Mohanty',
                otp: 'Verified (OTP 554192)',
                payout: '₹320 Net Freight',
                rateKm: '₹19.3/km',
                ref: '✓ Credited to SBI (IMPS-61029384)',
                status: 'Settled to Bank',
              },
            ].map(trip => (
              <div
                key={trip.tripId}
                className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs hover:border-blue-500/50 transition-all flex flex-col justify-between space-y-4"
              >
                {/* Header: Trip ID + Completed timestamp */}
                <div className="flex items-start justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
                  <div>
                    <span className="font-mono font-black text-stone-900 dark:text-stone-100 text-sm tracking-tight">
                      {trip.tripId}
                    </span>
                    <span className="text-[11px] text-stone-400 dark:text-stone-500 block mt-0.5">
                      {trip.date} • Ref {trip.orderRef}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-black text-[10px] tracking-wide shrink-0">
                    {trip.distance} ({trip.duration})
                  </span>
                </div>

                {/* Route: Origin -> Destination Badges */}
                <div className="p-3 bg-stone-50 dark:bg-stone-950/70 rounded-xl border border-stone-100 dark:border-stone-800 space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] text-stone-400 font-bold uppercase block">Origin Hub</span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200">{trip.origin}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] text-stone-400 font-bold uppercase block">Drop Location</span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200">{trip.destination}</span>
                    </div>
                  </div>
                </div>

                {/* Cargo & Vehicle Spec */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-stone-600 dark:text-stone-300">
                    <span>Vehicle:</span>
                    <strong className="text-stone-900 dark:text-stone-100">{trip.vehicle}</strong>
                  </div>
                  <div className="flex items-center justify-between text-stone-600 dark:text-stone-300">
                    <span>Cargo Carried:</span>
                    <strong className="text-stone-900 dark:text-stone-100">{trip.cargo}</strong>
                  </div>
                  <div className="flex items-center justify-between text-stone-600 dark:text-stone-300">
                    <span>Recipient:</span>
                    <span className="text-stone-700 dark:text-stone-300 font-medium">{trip.buyer} ({trip.otp})</span>
                  </div>

                  {/* Cold-Chain Integrity Verified Trust Seal */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-[10px] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>✓ Cold-Chain Integrity Verified: Maintained &lt; 5°C throughout transit</span>
                  </div>
                </div>

                {/* Payout & Settlement Info */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-500 dark:text-stone-400 font-bold uppercase">Disbursed Payout</span>
                    <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                      {trip.payout}
                    </span>
                  </div>

                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate">{trip.ref}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
  </div>
</div>
  );
};
