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
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Order, AppNotification, VehicleType, RouteOptimizationResult } from '../types';
import { api } from '../services/api';
import { BhubaneswarMap } from '../components/BhubaneswarMap';
import { InteractiveLogisticsMap, MapDeliveryRequest } from '../components/InteractiveLogisticsMap';
import { VicinityDispatchToast, VicinityAlert, playVicinityChime } from '../components/VicinityDispatchToast';

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

export const LogisticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOtpInputs, setActiveOtpInputs] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ id: string; msg: string; type: 'success' | 'error' } | null>(null);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [logisticsTab, setLogisticsTab] = useState<'map_dispatches' | 'travelled_history'>('map_dispatches');

  // Vehicle Category Filter
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<'ALL' | VehicleType>('ALL');

  // AI Route Optimization Engine
  const [isOptimizingRoute, setIsOptimizingRoute] = useState(false);
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

  useEffect(() => {
    loadDeliveriesAndNotifications();
    const interval = setInterval(loadDeliveriesAndNotifications, 10000); // Polling for real-time dispatch updates
    return () => clearInterval(interval);
  }, []);

  const loadDeliveriesAndNotifications = async () => {
    try {
      setLoading(true);
      const [orderRes, notifRes] = await Promise.all([
        api.getOrders(),
        api.getNotifications(),
      ]);
      setOrders(orderRes.orders || []);
      setNotifications(notifRes.notifications || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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
      await api.updateOrderStatus(order.id, 'DELIVERED', 'Verified with buyer OTP. Delivery completed.');
      setFeedback({
        id: order.id,
        msg: `Trip completed! ₹${order.logisticsFee} freight payout instantly credited to your bank account.`,
        type: 'success',
      });
      await loadDeliveriesAndNotifications();
    } catch (err: any) {
      setFeedback({ id: order.id, msg: err.message || 'Verification failed', type: 'error' });
    }
  };

  const handleWithdrawPayout = () => {
    setPayoutSuccess(true);
    setTimeout(() => setPayoutSuccess(false), 4000);
  };

  const handleOptimizeBhubaneswarRoute = async () => {
    try {
      setIsOptimizingRoute(true);
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
          name: 'Khordha Valley Agro Collection Hub',
          type: 'PICKUP' as const,
          location: 'Khordha Farmgate Belt (NH-16)',
          coordinates: { lat: 20.182, lng: 85.617 },
          produce: 'Organic Plum Tomatoes',
          weightKg: 200,
          perishabilityScore: 9,
          contactPerson: 'Bikram Sahoo',
          contactPhone: '+91 98234 11201',
        },
        {
          id: 'stop_2',
          name: 'Pipili Vegetable Growers Mandi',
          type: 'PICKUP' as const,
          location: 'Pipili Toll Cluster, Puri Highway',
          coordinates: { lat: 20.115, lng: 85.832 },
          produce: 'Fresh Baby Spinach & Greens',
          weightKg: 250,
          perishabilityScore: 8,
          contactPerson: 'Sunil Jena',
          contactPhone: '+91 94371 88402',
        },
        {
          id: 'stop_3',
          name: 'Saheed Nagar Direct Farm Outlet',
          type: 'DELIVERY' as const,
          location: 'Saheed Nagar Market, Janpath',
          coordinates: { lat: 20.289, lng: 85.843 },
          produce: 'Retail Farm Crates',
          weightKg: 200,
          perishabilityScore: 5,
          contactPerson: 'Prabhat Mohanty',
          contactPhone: '+91 98111 22334',
        },
        {
          id: 'stop_4',
          name: 'Patia Infocity Cold Aggregation Center',
          type: 'DELIVERY' as const,
          location: 'DLF Cybercity, Patia',
          coordinates: { lat: 20.354, lng: 85.819 },
          produce: 'Direct Bulk Deliveries',
          weightKg: 250,
          perishabilityScore: 5,
          contactPerson: 'Rohan Verma',
          contactPhone: '+91 99370 44552',
        }
      ];
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
    <div className="min-h-screen bg-stone-50 py-8 text-stone-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Fleet Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-800/80 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
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
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-blue-700/60 flex items-center gap-1 text-xs">
              <span className="text-[11px] text-blue-200 font-bold px-2">Vehicle:</span>
              <button
                onClick={() => setActiveDriverVehicle({
                  type: 'MINI_TRUCK',
                  label: 'Mini Truck / Tata Ace',
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

            <button
              onClick={loadDeliveriesAndNotifications}
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
                    className="p-3 bg-white rounded-xl border border-amber-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-stone-900 block">{notif.title}</span>
                      <p className="text-stone-600 text-[11px] mt-0.5">{notif.message}</p>
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

        {/* Top Earnings & Sensor Telemetry Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Earnings Card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Total Freight Earnings
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-stone-900">
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
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Bhubaneswar Trips Completed
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-stone-900">{completedTrips}</div>
              <div className="text-xs text-stone-500 mt-1">
                Avg. Delivery Time: <strong className="text-stone-800">24 mins per drop</strong>
              </div>
            </div>
            <div className="text-[11px] text-blue-700 font-semibold">
              On-time delivery rating: 99.4%
            </div>
          </div>

          {/* In-Transit Freight Escrow */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
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
              <div className="text-xs text-stone-500 mt-1">
                Auto-releases upon customer OTP verification
              </div>
            </div>
            <div className="text-[11px] text-amber-700 font-bold">
              {assignedOrders.length} active dispatches assigned
            </div>
          </div>

          {/* Cold Chain Sensor Status */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Reefer Temperature
              </span>
              <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                <Thermometer className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-teal-700 flex items-baseline gap-1">
                4.2°C <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Optimal</span>
              </div>
              <div className="text-xs text-stone-500 mt-1">
                Active Reefer IoT Sensor (OD 02 AX 8840)
              </div>
            </div>
            <div className="text-[11px] text-teal-800 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Direct Telemetry Stream
            </div>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex border-b border-stone-200 overflow-x-auto">
          <button
            onClick={() => setLogisticsTab('map_dispatches')}
            className={`py-3 px-5 text-xs font-bold uppercase tracking-wider transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              logisticsTab === 'map_dispatches'
                ? 'border-blue-600 text-blue-900 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>Live Dispatches & GPS Map ({allAvailableOffers.length + assignedOrders.length})</span>
          </button>

          <button
            onClick={() => setLogisticsTab('travelled_history')}
            className={`py-3 px-5 text-xs font-bold uppercase tracking-wider transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              logisticsTab === 'travelled_history'
                ? 'border-blue-600 text-blue-900 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <History className="w-4 h-4 text-blue-600" />
            <span>Travelled History & Earnings (14 Completed Trips)</span>
          </button>
        </div>

        {logisticsTab === 'map_dispatches' && (
        <div className="space-y-8">
        {/* ========================================================================= */}
        {/* INTERACTIVE BHUBANESWAR MAP SECTION                                      */}
        {/* ========================================================================= */}
        <div id="bhubaneswar-gps-map" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span>Live Bhubaneswar Transit Map & Depots</span>
              </h2>
              <p className="text-xs text-stone-500">
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
            onAcceptRequest={(reqId) => {
              const found = allAvailableOffers.find(o => o.id === reqId);
              if (found) handleAcceptOffer(found);
            }}
            onRejectRequest={(reqId) => {
              const found = allAvailableOffers.find(o => o.id === reqId);
              if (found) handleRejectOffer(found);
            }}
          />

          {/* AI Multi-Stop Route & Fuel Optimizer */}
          <div className="bg-white rounded-3xl border border-blue-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-black text-stone-900 text-base">
                    Gemini AI Multi-Stop Route & Fuel Optimizer
                  </h3>
                  <p className="text-xs text-stone-500">
                    Calculates lowest-perishability stop sequence, NH-16 bypasses, road conditions, and fuel savings for {activeDriverVehicle.label}.
                  </p>
                </div>
              </div>

              <button
                onClick={handleOptimizeBhubaneswarRoute}
                disabled={isOptimizingRoute}
                className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-black shadow-md flex items-center gap-2 transition disabled:opacity-50 shrink-0 cursor-pointer"
              >
                <Sparkles className={`w-4 h-4 text-amber-300 ${isOptimizingRoute ? 'animate-spin' : ''}`} />
                <span>{isOptimizingRoute ? 'Calculating Optimal Waypoints...' : 'Run AI Route Optimization'}</span>
              </button>
            </div>

            {aiRoutePlan && (
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-4 animate-in fade-in">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-2xs">
                    <span className="text-[10px] text-stone-500 font-bold uppercase">Distance Saved</span>
                    <div className="text-lg font-black text-emerald-700">{aiRoutePlan.distanceSavedKm} km (-{aiRoutePlan.distanceReductionPct}%)</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-2xs">
                    <span className="text-[10px] text-stone-500 font-bold uppercase">Transit Time Saved</span>
                    <div className="text-lg font-black text-blue-700">{aiRoutePlan.timeSavedMins} mins</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-2xs">
                    <span className="text-[10px] text-stone-500 font-bold uppercase">Fuel Cost Saved</span>
                    <div className="text-lg font-black text-amber-800">₹{aiRoutePlan.fuelCostSavedInr} ({aiRoutePlan.fuelSavedLiters} L)</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-2xs">
                    <span className="text-[10px] text-stone-500 font-bold uppercase">Produce Freshness</span>
                    <div className="text-lg font-black text-emerald-800">{aiRoutePlan.freshnessScore}% Retained</div>
                  </div>
                </div>

                {/* Sequenced Waypoints */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-stone-800 block">AI Recommended Stop Sequence:</span>
                  <div className="space-y-2">
                    {aiRoutePlan.orderedWaypoints.map(w => (
                      <div key={w.seq} className="p-2.5 bg-white rounded-xl border border-blue-100 flex items-center justify-between gap-3 text-xs shadow-2xs">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-blue-700 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                            {w.seq}
                          </span>
                          <div>
                            <span className="font-bold text-stone-900">{w.stopName}</span>
                            <span className="text-[11px] text-stone-500 ml-2">({w.action} - {w.produce}, {w.weightKg} kg)</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-blue-800 font-bold text-[11px]">ETA: +{w.etaMinutesFromStart} min</span>
                          <span className="block text-[10px] text-stone-400 font-mono">{w.notes}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* NEARBY DELIVERY REQUESTS & VEHICLE FLEET FILTER (ACCEPT / REJECT)         */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-600" />
                <span>Nearby Delivery Requests (Accept or Reject)</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                  {filteredOffers.length} Available
                </span>
              </h2>
              <p className="text-xs text-stone-500">
                When consumers order produce, dispatch offers appear below for your vehicle fleet (Tractor, Mini Truck, Bike, or Reefer).
              </p>
            </div>

            {/* Vehicle Category Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 bg-stone-200/80 p-1.5 rounded-2xl text-xs">
              <button
                onClick={() => setSelectedVehicleFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  selectedVehicleFilter === 'ALL' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All Fleets ({allAvailableOffers.length})
              </button>

              <button
                onClick={() => setSelectedVehicleFilter('TRACTOR')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                  selectedVehicleFilter === 'TRACTOR' ? 'bg-amber-500 text-stone-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>🚜</span>
                <span>Tractor (Bulk)</span>
              </button>

              <button
                onClick={() => setSelectedVehicleFilter('MINI_TRUCK')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                  selectedVehicleFilter === 'MINI_TRUCK' ? 'bg-blue-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>🚚</span>
                <span>Mini Truck</span>
              </button>

              <button
                onClick={() => setSelectedVehicleFilter('BIKE_SCOOTY')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                  selectedVehicleFilter === 'BIKE_SCOOTY' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>🛵</span>
                <span>Bike / Scooty</span>
              </button>

              <button
                onClick={() => setSelectedVehicleFilter('REEFER_VAN')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                  selectedVehicleFilter === 'REEFER_VAN' ? 'bg-teal-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>❄️</span>
                <span>Reefer Cold</span>
              </button>
            </div>
          </div>

          {filteredOffers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="font-extrabold text-base text-stone-900">All Requests in this Fleet Category Assigned!</h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
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
                    className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
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

                          <h4 className="font-extrabold text-base text-stone-900 mt-1.5">
                            {req.produceName}
                          </h4>
                          <div className="text-xs text-stone-500 font-medium">
                            Weight / Cargo: <strong className="text-stone-800">{req.quantity}</strong>
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
                      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-xs">
                        <div className="flex items-start gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-1 shrink-0" />
                          <div>
                            <div className="text-[10px] text-stone-400 font-bold uppercase">Pickup Point:</div>
                            <div className="font-semibold text-stone-800">{req.pickupPoint}</div>
                            <div className="text-[11px] text-stone-500">Grower: {req.farmerName} ({req.farmerPhone})</div>
                          </div>
                        </div>

                        <div className="border-l-2 border-dashed border-stone-300 ml-1 pl-3 py-1 my-0.5 text-[11px] text-stone-500">
                          {req.distanceKm} km • ~{req.estMinutes} mins transit • Recommended: {conf.label}
                        </div>

                        <div className="flex items-start gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1 shrink-0" />
                          <div>
                            <div className="text-[10px] text-stone-400 font-bold uppercase">Destination Drop:</div>
                            <div className="font-semibold text-stone-800">{req.dropPoint}</div>
                          </div>
                        </div>
                      </div>

                      {/* Climate / Cargo Spec */}
                      <div className="flex items-center justify-between text-xs text-stone-600 px-1">
                        <span className="flex items-center gap-1 text-teal-800 font-semibold">
                          <Thermometer className="w-3.5 h-3.5 text-teal-600" />
                          <span>{req.tempRequired}</span>
                        </span>
                        <span className="text-[11px] text-stone-500 font-mono">
                          Customer OTP Verification
                        </span>
                      </div>
                    </div>

                    {/* Accept / Reject Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100">
                      <button
                        onClick={() => handleRejectOffer(req)}
                        className="py-2.5 rounded-xl border border-stone-300 hover:bg-rose-50 hover:border-rose-300 text-stone-700 hover:text-rose-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
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

        {/* ========================================================================= */}
        {/* ACTIVE CONSIGNMENTS & DOORSTEP OTP VERIFICATION                           */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-600" />
                <span>Active Assigned Consignments (En Route)</span>
              </h2>
              <p className="text-xs text-stone-500">
                Update status as you pick up from farm, enter transit, and input customer delivery OTP upon handover to claim freight payout.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {assignedOrders.map(order => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-stone-900 text-sm">
                          Order #{order.id}
                        </span>
                        {order.isBulkOrder && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-200 text-amber-900">
                            Bulk Mandi
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500">
                        Placed by: {order.consumerName} ({order.consumerPhone})
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-stone-400 font-bold uppercase block">
                      Freight Fee
                    </span>
                    <span className="text-lg font-black text-emerald-800">
                      ₹{order.logisticsFee}
                    </span>
                  </div>
                </div>

                {/* Items in Consignment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {order.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-stone-50 rounded-xl border border-stone-100 flex items-center gap-2.5 text-xs"
                    >
                      <img
                        src={it.image}
                        alt={it.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-stone-900 truncate">{it.name}</div>
                        <div className="text-[11px] text-stone-500">
                          {it.quantity} {it.unit} • Grower: {it.farmerName}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Status Advancement Controls */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500 font-medium">Trip Progress:</span>
                    {order.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-lg text-xs font-bold transition"
                      >
                        Mark at Farm / Loading Crates
                      </button>
                    )}
                    {order.status === 'PREPARING' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'PICKED_UP')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition"
                      >
                        Confirm Loaded & Depart Farm
                      </button>
                    )}
                    {order.status === 'PICKED_UP' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'IN_TRANSIT')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition"
                      >
                        Mark In Transit (Bhubaneswar Grid)
                      </button>
                    )}
                  </div>

                  {/* Customer OTP Verification Section */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-600 font-bold">Delivery OTP:</span>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="6-digit OTP"
                      value={activeOtpInputs[order.id] || ''}
                      onChange={e =>
                        setActiveOtpInputs(prev => ({
                          ...prev,
                          [order.id]: e.target.value,
                        }))
                      }
                      className="w-28 px-2 py-1 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono text-center tracking-widest font-bold focus:outline-none focus:border-emerald-600"
                    />
                    <button
                      onClick={() => handleVerifyDelivery(order)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-black transition active:scale-95 shadow-xs"
                    >
                      Complete & Release Freight
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    {/* TAB 2: TRAVELLED HISTORY WITH EARNINGS */}
    {logisticsTab === 'travelled_history' && (
      <div className="space-y-6 animate-in fade-in">
        {/* Metric Summary Cards */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Verified Carrier Waybills & Payouts</span>
                </span>
                <span className="text-xs text-stone-500 font-mono">100% Direct Driver Settlement</span>
              </div>
              <h3 className="text-lg font-black text-stone-900 mt-1">
                Travelled Delivery History & Freight Earnings
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
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

            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-[10px] text-stone-500 font-bold uppercase block">Avg. Freight Realized</span>
              <span className="text-2xl font-black text-stone-900 mt-0.5 block">₹26.1 / km</span>
              <span className="text-[10px] text-emerald-700 font-bold">+45% higher vs aggregator brokers</span>
            </div>

            <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200">
              <span className="text-[10px] text-amber-800 font-bold uppercase block">AI Route Fuel Savings</span>
              <span className="text-2xl font-black text-amber-950 mt-0.5 block">₹1,240</span>
              <span className="text-[10px] text-amber-800">14.8 L diesel saved via optimal path</span>
            </div>
          </div>
        </div>

        {/* Travelled Trips Table */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
            <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700 flex items-center gap-2">
              <History className="w-4 h-4 text-stone-500" />
              <span>Completed Travel Trips & Instant Disbursed Earnings</span>
            </h4>
            <span className="text-xs text-stone-500 font-medium">Auto-released via Consumer OTP Verification</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-100/75 text-stone-500 uppercase text-[10px] font-bold border-b border-stone-200">
                <tr>
                  <th className="p-3.5">Trip ID & Completed</th>
                  <th className="p-3.5">Origin & Destination</th>
                  <th className="p-3.5">Travelled Distance & Time</th>
                  <th className="p-3.5">Vehicle Used</th>
                  <th className="p-3.5">Consignment & Buyer</th>
                  <th className="p-3.5">Earnings Credited</th>
                  <th className="p-3.5">Settlement & e-Waybill</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {[
                  {
                    tripId: 'TRIP-7492',
                    orderRef: '#ord_1079',
                    date: 'Completed 2 days ago',
                    origin: 'Nashik Farmer Collection Hub, MH',
                    destination: 'HAL 2nd Stage, Indiranagar, Bengaluru',
                    distance: '18.4 km',
                    duration: '38 mins',
                    vehicle: 'Tata Ace Reefer (OD 02 AX 8840)',
                    produce: 'Nashik Red Onions (25 kg) + Sharbati Gehu (30 kg)',
                    buyer: 'Ananya Sharma',
                    otp: 'Verified (OTP 482910)',
                    earnings: '₹280',
                    rateKm: '₹15.2/km',
                    ref: 'IMPS-92018471',
                    status: 'Settled to Bank',
                  },
                  {
                    tripId: 'TRIP-7488',
                    orderRef: '#ord_1065',
                    date: 'Completed 7 days ago',
                    origin: 'Khordha Krishi Vikas Kendra, OD',
                    destination: 'Patia Infocity DLF Square, Bhubaneswar',
                    distance: '24.2 km',
                    duration: '46 mins',
                    vehicle: 'Tata Ace Reefer (OD 02 AX 8840)',
                    produce: 'Organic Tomatoes (10 kg) + Desi Chana (40 kg)',
                    buyer: 'Ananya Sharma',
                    otp: 'Verified (OTP 639102)',
                    earnings: '₹340',
                    rateKm: '₹14.0/km',
                    ref: 'IMPS-83910245',
                    status: 'Settled to Bank',
                  },
                  {
                    tripId: 'TRIP-7471',
                    orderRef: '#ord_bulk_910',
                    date: 'Completed 12 days ago',
                    origin: 'Mancheswar Agro Cold Hub, Bhubaneswar',
                    destination: 'Taj Vivanta Kitchens, Janpath, Bhubaneswar',
                    distance: '14.8 km',
                    duration: '31 mins',
                    vehicle: 'Mahindra Bolero Maxi (OD 02 BY 4410)',
                    produce: 'Export Quality Onions (450 kg Bulk Lot)',
                    buyer: 'Taj Vivanta Hospitality',
                    otp: 'Verified (OTP 720194)',
                    earnings: '₹680',
                    rateKm: '₹45.9/km',
                    ref: 'RTGS-01928472',
                    status: 'Settled to Bank',
                  },
                  {
                    tripId: 'TRIP-7455',
                    orderRef: '#ord_bulk_892',
                    date: 'Completed 18 days ago',
                    origin: 'Pipili Farm Cluster Aggregator, Puri',
                    destination: 'Puri Jagannath Bhojanalaya, Grand Road',
                    distance: '38.6 km',
                    duration: '58 mins',
                    vehicle: 'Tata Ace Reefer (OD 02 AX 8840)',
                    produce: 'Fresh Polyhouse Tomatoes (280 kg Crate Lot)',
                    buyer: 'Puri Jagannath Bhojanalaya',
                    otp: 'Verified (OTP 118492)',
                    earnings: '₹850',
                    rateKm: '₹22.0/km',
                    ref: 'IMPS-72910481',
                    status: 'Settled to Bank',
                  },
                  {
                    tripId: 'TRIP-7430',
                    orderRef: '#ord_bulk_870',
                    date: 'Completed 24 days ago',
                    origin: 'Sehore Krishi Mandi Hub, MP',
                    destination: 'Bengaluru Healthy Bakes Federation',
                    distance: '42.0 km',
                    duration: '1h 15m',
                    vehicle: 'Eicher 14-Foot Reefer (OD 02 CZ 9012)',
                    produce: 'Sharbati Gold Wheat (550 kg Grain Sacks)',
                    buyer: 'Bengaluru Healthy Bakes',
                    otp: 'Verified (OTP 982104)',
                    earnings: '₹1,450',
                    rateKm: '₹34.5/km',
                    ref: 'RTGS-98120412',
                    status: 'Settled to Bank',
                  },
                  {
                    tripId: 'TRIP-7412',
                    orderRef: '#ord_loc_512',
                    date: 'Completed 28 days ago',
                    origin: 'Saheed Nagar Farmer Mart, Bhubaneswar',
                    destination: 'Khandagiri Residential Colony, Bhubaneswar',
                    distance: '16.5 km',
                    duration: '35 mins',
                    vehicle: 'Tata Ace Reefer (OD 02 AX 8840)',
                    produce: 'Organic Desi Ghee & Pulses (85 kg)',
                    buyer: 'Dr. Debashis Mohanty',
                    otp: 'Verified (OTP 554192)',
                    earnings: '₹320',
                    rateKm: '₹19.3/km',
                    ref: 'IMPS-61029384',
                    status: 'Settled to Bank',
                  },
                ].map(trip => (
                  <tr key={trip.tripId} className="hover:bg-stone-50/80 transition">
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-stone-900">{trip.tripId}</div>
                      <div className="text-[10px] text-stone-500">{trip.date}</div>
                      <span className="text-[9px] text-stone-400 font-mono">Ref {trip.orderRef}</span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-stone-900 text-xs">{trip.destination}</div>
                      <div className="text-[10px] text-stone-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                        <span>From: {trip.origin}</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-blue-900 text-xs">{trip.distance}</div>
                      <div className="text-[10px] text-stone-500">{trip.duration}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-stone-800 text-[11px]">{trip.vehicle}</div>
                      <span className="text-[10px] text-emerald-700 font-semibold">Cold Chain Validated</span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-stone-900 text-xs">{trip.produce}</div>
                      <div className="text-[10px] text-stone-500">Buyer: {trip.buyer}</div>
                      <span className="text-[9px] text-emerald-700 font-mono font-semibold block mt-0.5">
                        {trip.otp}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-black text-emerald-800 text-sm block">{trip.earnings}</span>
                      <span className="text-[10px] text-emerald-700 font-semibold">100% Payout</span>
                      <span className="text-[9px] text-stone-400 block">{trip.rateKm}</span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-mono text-[10px] font-bold text-stone-700">{trip.ref}</div>
                      <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{trip.status}</span>
                      </div>
                      <button
                        onClick={() => alert(`e-Lorry Receipt for ${trip.tripId}\nConsignment: ${trip.produce}\nDistance: ${trip.distance}\nEarnings: ${trip.earnings}\nSettlement Ref: ${trip.ref}`)}
                        className="text-[10px] text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 mt-1 cursor-pointer"
                      >
                        <FileText className="w-3 h-3" />
                        <span>View e-LR</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}
  </div>
</div>
  );
};
