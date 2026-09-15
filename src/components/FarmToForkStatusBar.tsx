import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Truck, 
  MapPin, 
  ShieldCheck, 
  Sprout, 
  PackageCheck, 
  RefreshCw, 
  Navigation, 
  ThermometerSnowflake, 
  Phone, 
  ChevronRight, 
  Zap,
  Sparkles,
  AlertCircle,
  Radio
} from 'lucide-react';
import { Order, OrderStatus, VehicleType } from '../types';
import { api } from '../services/api';

interface FarmToForkStatusBarProps {
  order: Order | null;
  allOrders?: Order[];
  onSelectOrder?: (order: Order) => void;
  onOrderUpdated?: () => void;
}

export interface JourneyMilestone {
  id: number;
  key: string;
  title: string;
  subtitle: string;
  statusMatch: OrderStatus[];
  icon: React.ElementType;
}

export const JOURNEY_MILESTONES: JourneyMilestone[] = [
  {
    id: 1,
    key: 'ORDER_LOCKED',
    title: 'Farmgate Deal Locked',
    subtitle: '100% Escrow secured • Direct with farmer',
    statusMatch: ['PLACED'],
    icon: ShieldCheck,
  },
  {
    id: 2,
    key: 'HARVEST_PACKED',
    title: 'Harvest & Grading',
    subtitle: 'Field-picked fresh • Graded in aerated crates',
    statusMatch: ['CONFIRMED', 'PREPARING'],
    icon: Sprout,
  },
  {
    id: 3,
    key: 'RURAL_PICKUP',
    title: 'Farmgate Fleet Pickup',
    subtitle: 'Weighed & loaded onto rural transit fleet',
    statusMatch: ['PICKED_UP'],
    icon: PackageCheck,
  },
  {
    id: 4,
    key: 'ROAD_TRANSIT',
    title: 'Direct GPS Highway Transit',
    subtitle: 'Cold-chain protected • Real-time road tracking',
    statusMatch: ['IN_TRANSIT'],
    icon: Truck,
  },
  {
    id: 5,
    key: 'DOORSTEP_DELIVERED',
    title: 'Doorstep Delivered & DBT Released',
    subtitle: 'Inspected with OTP • Escrow released to farmer',
    statusMatch: ['DELIVERED'],
    icon: CheckCircle2,
  },
];

export function getJourneyStageIndex(status: OrderStatus): number {
  switch (status) {
    case 'PLACED':
      return 0;
    case 'CONFIRMED':
    case 'PREPARING':
      return 1;
    case 'PICKED_UP':
      return 2;
    case 'IN_TRANSIT':
      return 3;
    case 'DELIVERED':
      return 4;
    default:
      return 0;
  }
}

export function getVehicleBadge(type?: VehicleType) {
  switch (type) {
    case 'TRACTOR':
      return { label: '🚜 Heavy Tractor Trolley', color: 'bg-amber-100 text-amber-900 border-amber-300' };
    case 'MINI_TRUCK':
      return { label: '🚚 Mini Truck (Tata Ace)', color: 'bg-blue-100 text-blue-900 border-blue-300' };
    case 'REEFER_VAN':
      return { label: '❄️ Cold-Chain Reefer (4°C)', color: 'bg-cyan-100 text-cyan-900 border-cyan-300' };
    case 'BIKE_SCOOTY':
      return { label: '🛵 Express 2-Wheeler', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
    default:
      return { label: '🚚 Agri Logistic Fleet', color: 'bg-stone-100 text-stone-800 border-stone-300' };
  }
}

export const FarmToForkStatusBar: React.FC<FarmToForkStatusBarProps> = ({
  order,
  allOrders = [],
  onSelectOrder,
  onOrderUpdated,
}) => {
  const [isRefreshingGps, setIsRefreshingGps] = useState(false);
  const [telemetryPingTime, setTelemetryPingTime] = useState<string>('Just now');
  const [gpsSimIndex, setGpsSimIndex] = useState(0);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Simulated GPS waypoints along rural-to-urban transit (e.g., Khordha / Baramati corridor)
  const waypoints = [
    { location: 'NH-16 Regional Arterial Corridor', kmRemaining: '5.2 km', etaMins: 22, speed: '44 km/h' },
    { location: 'Janpath Overpass • Saheed Nagar Outskirts', kmRemaining: '3.1 km', etaMins: 14, speed: '36 km/h' },
    { location: 'Outer Ring Road Distribution Node', kmRemaining: '1.4 km', etaMins: 6, speed: '28 km/h' },
    { location: 'Entering Destination Sector', kmRemaining: '400 m', etaMins: 2, speed: '18 km/h' },
  ];

  const currentWaypoint = waypoints[gpsSimIndex % waypoints.length];

  // Refresh GPS telemetry simulation
  const handleRefreshGps = () => {
    setIsRefreshingGps(true);
    setTimeout(() => {
      setGpsSimIndex(prev => prev + 1);
      setTelemetryPingTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setIsRefreshingGps(false);
      setActionMessage('GPS Telemetry synchronized. Carrier position updated in real-time.');
      setTimeout(() => setActionMessage(null), 3000);
    }, 600);
  };

  if (!order) {
    return null;
  }

  const currentStageIdx = getJourneyStageIndex(order.status);
  const progressPct = currentStageIdx === 0 ? 12 : currentStageIdx === 1 ? 35 : currentStageIdx === 2 ? 60 : currentStageIdx === 3 ? 82 : 100;
  const vehicleInfo = getVehicleBadge(order.vehicleTypeRequired);

  // Quick OTP verification helper
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredOtp.trim() !== order.deliveryOtp) {
      setActionMessage('Incorrect Delivery OTP. Please match the 6-digit code shown.');
      return;
    }

    setVerifyingOtp(true);
    try {
      await api.updateOrderStatus(
        order.id, 
        'DELIVERED', 
        'Direct doorstep delivery verified via consumer OTP. ₹' + order.itemsTotal + ' Escrow disbursed to Farmer.'
      );
      setActionMessage('Consignment verified! Full payout released directly to farmer account.');
      setShowOtpInput(false);
      setEnteredOtp('');
      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      setActionMessage('Verification failed: ' + err.message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Advance stage for demo simulation
  const handleAdvanceStage = async () => {
    const nextStatusMap: Record<OrderStatus, OrderStatus> = {
      'PLACED': 'CONFIRMED',
      'CONFIRMED': 'PICKED_UP',
      'PREPARING': 'PICKED_UP',
      'PICKED_UP': 'IN_TRANSIT',
      'IN_TRANSIT': 'DELIVERED',
      'DELIVERED': 'PLACED',
    };

    const nextStatus = nextStatusMap[order.status] || 'IN_TRANSIT';
    try {
      await api.updateOrderStatus(order.id, nextStatus, `Advanced to ${nextStatus} via farm-to-fork tracking simulator.`);
      setActionMessage(`Order progressed to: ${nextStatus}`);
      if (onOrderUpdated) onOrderUpdated();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-emerald-200/90 shadow-sm overflow-hidden space-y-0 animate-in fade-in duration-300">
      {/* Top Banner with Real-Time Pulse & Order Selector */}
      <div className="bg-gradient-to-r from-emerald-900 via-stone-900 to-emerald-950 text-white p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>Live Farm-To-Fork Stream</span>
              </span>

              <span className="px-2 py-0.5 rounded-md bg-stone-800/90 text-stone-200 text-[11px] font-mono font-bold">
                Order #{order.id}
              </span>

              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${vehicleInfo.color}`}>
                {vehicleInfo.label}
              </span>

              {order.isBulkOrder && (
                <span className="px-2 py-0.5 rounded-md bg-amber-400 text-stone-950 text-[10px] font-black uppercase">
                  📦 Bulk Mandi
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Farm-to-Fork Direct Delivery Journey</span>
            </h2>

            <p className="text-xs text-stone-300 max-w-2xl">
              Real-time progression tracking transparently linking the farm field harvest, rural logistics dispatch, and doorstep handover with 100% Escrow security.
            </p>
          </div>

          {/* Quick Stats & Refresh Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-stone-800/80 border border-stone-700/80 rounded-2xl p-3 text-right">
              <div className="text-[10px] uppercase font-bold text-stone-400">Estimated Arrival</div>
              <div className="text-sm font-black text-amber-400 flex items-center gap-1 justify-end">
                <Clock className="w-3.5 h-3.5" />
                <span>{order.status === 'DELIVERED' ? 'Delivered' : order.estimatedDeliveryTime || 'Today by 4:30 PM'}</span>
              </div>
            </div>

            <button
              onClick={handleRefreshGps}
              disabled={isRefreshingGps}
              className="p-2.5 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-stone-200 text-xs font-bold border border-stone-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Ping GPS telemetry"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-400 ${isRefreshingGps ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh GPS</span>
            </button>
          </div>
        </div>

        {/* Order Selector Tabs if multiple orders exist */}
        {allOrders.length > 1 && (
          <div className="mt-4 pt-4 border-t border-stone-800 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase shrink-0">Your Consignments:</span>
            {allOrders.map((o) => (
              <button
                key={o.id}
                onClick={() => onSelectOrder && onSelectOrder(o)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                  o.id === order.id
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-stone-800/90 text-stone-300 hover:bg-stone-700'
                }`}
              >
                <span>#{o.id}</span>
                <span className={`w-2 h-2 rounded-full ${o.status === 'DELIVERED' ? 'bg-emerald-300' : 'bg-amber-400'}`} />
                <span className="text-[10px] opacity-80 capitalize">{o.status.toLowerCase().replace('_', ' ')}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notification / Toast feedback banner */}
      {actionMessage && (
        <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-700 hover:text-emerald-900 text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/*                    THE REAL-TIME PROGRESSION STATUS BAR                   */}
      {/* ========================================================================= */}
      <div className="p-5 sm:p-8 bg-stone-50/50 space-y-6">
        {/* Progress Bar Label & Percentage */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800">
              Progression Pipeline
            </span>
            <div className="text-xs font-bold text-stone-600">
              Stage {currentStageIdx + 1} of 5: <span className="text-stone-900 font-extrabold">{JOURNEY_MILESTONES[currentStageIdx].title}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-black text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-lg border border-emerald-200">
              {progressPct}% Completed
            </span>
          </div>
        </div>

        {/* Multi-Stage Visual Stepper */}
        <div className="relative pt-2 pb-2">
          {/* Continuous Connecting Line Background */}
          <div className="absolute top-7 left-6 right-6 h-1.5 bg-stone-200 rounded-full -translate-y-1/2 z-0 hidden md:block" />

          {/* Active Filled Progress Line */}
          <div 
            className="absolute top-7 left-6 h-1.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-500 rounded-full -translate-y-1/2 z-0 transition-all duration-700 ease-out hidden md:block"
            style={{ width: `calc(${progressPct}% - 3rem)` }}
          />

          {/* Stepper Nodes */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-2 relative z-10">
            {JOURNEY_MILESTONES.map((milestone, idx) => {
              const IconComp = milestone.icon;
              const isCompleted = idx < currentStageIdx || order.status === 'DELIVERED';
              const isCurrent = idx === currentStageIdx && order.status !== 'DELIVERED';
              const isPending = idx > currentStageIdx && order.status !== 'DELIVERED';

              return (
                <div 
                  key={milestone.id}
                  className={`flex md:flex-col items-start md:items-center text-left md:text-center gap-3 md:gap-2 p-3 md:p-2 rounded-2xl transition-all duration-300 ${
                    isCurrent 
                      ? 'bg-white shadow-md border-2 border-emerald-500 md:scale-105' 
                      : isCompleted 
                      ? 'bg-emerald-50/70 border border-emerald-200/80 md:bg-transparent md:border-transparent' 
                      : 'opacity-70 border border-stone-200 md:border-transparent'
                  }`}
                >
                  {/* Node Circle */}
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-black text-sm transition-all duration-300 shadow-xs ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-emerald-200'
                        : isCurrent
                        ? 'bg-gradient-to-tr from-amber-500 to-emerald-600 text-white ring-4 ring-emerald-200 animate-pulse'
                        : 'bg-stone-200 text-stone-500'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-white stroke-[2.5]" />
                    ) : (
                      <IconComp className="w-5 h-5" />
                    )}
                  </div>

                  {/* Node Titles */}
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 md:justify-center">
                      <span className={`text-xs font-black leading-tight ${
                        isCompleted ? 'text-emerald-950' : isCurrent ? 'text-emerald-800' : 'text-stone-500'
                      }`}>
                        {milestone.title}
                      </span>
                      {isCurrent && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                      )}
                    </div>

                    <p className="text-[11px] text-stone-500 leading-snug line-clamp-2 md:line-clamp-3">
                      {milestone.subtitle}
                    </p>

                    {isCompleted && (
                      <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                        ✓ Milestone Cleared
                      </span>
                    )}

                    {isCurrent && (
                      <span className="inline-block text-[10px] font-black text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        ● Current Phase
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/*           TELEMETRY, LIVE ROAD POSITION & LOGISTICS DETAILS               */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
          {/* Card 1: Real-time Transit Telemetry */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>Live Route Telemetry</span>
              </span>
              <span className="text-[10px] font-mono text-stone-500">
                Ping: {telemetryPingTime}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-stone-600">
                <span className="text-[11px]">Current Waypoint:</span>
                <span className="font-bold text-stone-900 truncate max-w-[170px] text-right">
                  {order.status === 'DELIVERED' ? 'Arrived at Destination' : currentWaypoint.location}
                </span>
              </div>

              <div className="flex justify-between items-center text-stone-600">
                <span className="text-[11px]">Distance Remaining:</span>
                <span className="font-bold text-emerald-700">
                  {order.status === 'DELIVERED' ? '0.0 km' : currentWaypoint.kmRemaining}
                </span>
              </div>

              <div className="flex justify-between items-center text-stone-600">
                <span className="text-[11px]">Transit Speed:</span>
                <span className="font-bold text-stone-800">
                  {order.status === 'DELIVERED' ? '0 km/h (Parked)' : currentWaypoint.speed}
                </span>
              </div>

              <div className="flex justify-between items-center text-stone-600">
                <span className="text-[11px] flex items-center gap-1">
                  <ThermometerSnowflake className="w-3 h-3 text-cyan-600" />
                  <span>Cargo Chamber:</span>
                </span>
                <span className="font-bold text-cyan-800">
                  {order.vehicleTypeRequired === 'REEFER_VAN' ? '4.2°C (Optimal Freshness)' : 'Ambient Aerated Crates'}
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-stone-50 rounded-xl text-[11px] text-stone-600 flex items-start gap-2">
              <Navigation className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <span>
                {order.status === 'DELIVERED'
                  ? 'Delivery completed safely at doorstep. Full quality clearance approved.'
                  : 'Automated GPS telematics reporting from onboard device. Direct rural highway bypass enabled.'}
              </span>
            </div>
          </div>

          {/* Card 2: Farmgate Origin & Assigned Carrier Fleet */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Carrier & Farm Dispatch</span>
              </span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Zero Middlemen
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-stone-600">
                <span className="text-[11px]">Origin Grower:</span>
                <span className="font-bold text-stone-900">
                  {order.items[0]?.farmerName || 'Ramesh Patel (FPO Cluster)'}
                </span>
              </div>

              <div className="flex justify-between items-center text-stone-600">
                <span className="text-[11px]">Carrier Partner:</span>
                <span className="font-bold text-stone-800">
                  {order.logisticsName || 'KisanVahan Agro Logistics'}
                </span>
              </div>

              <div className="flex justify-between items-center text-stone-600">
                <span className="text-[11px]">Assigned Vehicle:</span>
                <span className="font-mono font-bold text-stone-900">
                  {order.vehicleNumber || 'MH 12 QX 4902'}
                </span>
              </div>

              <div className="flex justify-between items-center text-stone-600">
                <span className="text-[11px]">Destination:</span>
                <span className="font-bold text-stone-800 truncate max-w-[170px] text-right">
                  {order.shippingAddress.city}, {order.shippingAddress.state}
                </span>
              </div>
            </div>

            {/* Produce Summary */}
            <div className="pt-2 border-t border-stone-100 flex items-center gap-2 overflow-x-auto">
              {order.items.map((it, idx) => (
                <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-stone-50 rounded-lg text-[11px] shrink-0 border border-stone-100">
                  <img src={it.image} alt={it.name} className="w-5 h-5 rounded object-cover" />
                  <span className="font-bold text-stone-800">{it.name}</span>
                  <span className="text-stone-500 font-mono">({it.quantity} {it.unit})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Doorstep OTP & Escrow Security Release */}
          <div className="bg-gradient-to-br from-amber-50/70 to-emerald-50/50 rounded-2xl border border-amber-200/90 p-4 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Doorstep Security OTP</span>
              </span>
              <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                Escrow Protected
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-amber-300 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                  Delivery Security Code
                </span>
                <div className="text-2xl font-mono font-black text-amber-950 tracking-widest">
                  {order.deliveryOtp}
                </div>
              </div>
              <span className="text-[10px] text-stone-500 max-w-[130px] text-right leading-tight">
                Inspect crate quality before sharing with driver.
              </span>
            </div>

            {/* Actions for OTP verification or quick testing */}
            {order.status !== 'DELIVERED' ? (
              <div className="space-y-2">
                {!showOtpInput ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowOtpInput(true)}
                      className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm Quality & Release Payment</span>
                    </button>

                    <button
                      onClick={handleAdvanceStage}
                      className="py-2 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-[11px] font-bold transition border border-stone-200"
                      title="Progress stage for demo preview"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      <span className="hidden sm:inline ml-1">Advance Stage</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value)}
                        maxLength={6}
                        className="flex-1 px-3 py-1.5 text-xs font-mono font-bold bg-white border border-stone-300 rounded-xl focus:outline-emerald-600"
                      />
                      <button
                        type="submit"
                        disabled={verifyingOtp}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl disabled:opacity-50"
                      >
                        {verifyingOtp ? 'Releasing...' : 'Verify'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowOtpInput(false)}
                        className="px-2 py-1.5 text-stone-500 hover:text-stone-800 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-100/70 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Payment Released: ₹{order.itemsTotal} transferred directly to Farmer bank account.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================= */
/*               COMPACT INLINE MINI-BAR (FOR EACH ORDER CARD)               */
/* ========================================================================= */
export const FarmToForkMiniBar: React.FC<{ order: Order }> = ({ order }) => {
  const currentIdx = getJourneyStageIndex(order.status);
  const progressPct = currentIdx === 0 ? 12 : currentIdx === 1 ? 35 : currentIdx === 2 ? 60 : currentIdx === 3 ? 82 : 100;

  return (
    <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-200/80 space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
          <Truck className="w-3 h-3 text-emerald-700" />
          <span>Farm-to-Fork Journey Status</span>
        </span>
        <span className="font-bold text-[11px] text-stone-700">
          Stage {currentIdx + 1}/5: <strong className="text-emerald-900">{JOURNEY_MILESTONES[currentIdx].title}</strong>
        </span>
      </div>

      {/* Horizontal Mini Step Nodes */}
      <div className="grid grid-cols-5 gap-1.5 relative">
        {JOURNEY_MILESTONES.map((m, idx) => {
          const isPassed = idx < currentIdx || order.status === 'DELIVERED';
          const isCurrent = idx === currentIdx && order.status !== 'DELIVERED';

          return (
            <div key={m.id} className="space-y-1 text-center">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isPassed
                    ? 'bg-emerald-600'
                    : isCurrent
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-stone-200'
                }`}
              />
              <span
                className={`block text-[9px] truncate font-bold leading-none ${
                  isPassed
                    ? 'text-emerald-900 font-extrabold'
                    : isCurrent
                    ? 'text-amber-800 font-black'
                    : 'text-stone-400'
                }`}
              >
                {m.title.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Latest note from statusHistory */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <div className="text-[10px] text-stone-500 flex items-center justify-between pt-1 border-t border-stone-200/60">
          <span className="truncate max-w-[280px] sm:max-w-md">
            Latest: {order.statusHistory[order.statusHistory.length - 1].note}
          </span>
          <span className="text-stone-400 shrink-0">
            {new Date(order.statusHistory[order.statusHistory.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}
    </div>
  );
};
