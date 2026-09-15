import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  Truck, 
  Layers, 
  Compass, 
  ZoomIn, 
  ZoomOut, 
  ShieldCheck, 
  Thermometer, 
  Clock, 
  CheckCircle2,
  Info
} from 'lucide-react';

export interface DeliveryPoint {
  id: string;
  name: string;
  type: 'depot' | 'pickup' | 'dropoff';
  area: string;
  x: number; // percentage in SVG coordinate space
  y: number;
  ordersCount: number;
  contact: string;
  address: string;
}

interface BhubaneswarMapProps {
  activeRouteId?: string | null;
  onSelectPoint?: (point: DeliveryPoint) => void;
}

export const BhubaneswarMap: React.FC<BhubaneswarMapProps> = ({
  activeRouteId,
  onSelectPoint,
}) => {
  const [zoom, setZoom] = useState(1);
  const [selectedPoint, setSelectedPoint] = useState<DeliveryPoint | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'depot' | 'dropoff'>('all');

  const deliveryPoints: DeliveryPoint[] = [
    {
      id: 'pt_mancheswar',
      name: 'Mancheswar Cold Storage & Agro Depot',
      type: 'depot',
      area: 'Mancheswar Industrial Estate, Bhubaneswar',
      x: 62,
      y: 35,
      ordersCount: 8,
      contact: '+91 94370 88201',
      address: 'Plot 42, Sector A, Mancheswar, Bhubaneswar, Odisha 751010',
    },
    {
      id: 'pt_patia',
      name: 'Patia Infocity Hub & Residential Drop',
      type: 'dropoff',
      area: 'Patia / KIIT Square, Bhubaneswar',
      x: 58,
      y: 18,
      ordersCount: 14,
      contact: '+91 98610 22345',
      address: 'DLF Cybercity Road, Patia, Bhubaneswar, Odisha 751024',
    },
    {
      id: 'pt_saheed',
      name: 'Saheed Nagar Organic Distribution Point',
      type: 'dropoff',
      area: 'Saheed Nagar, Bhubaneswar',
      x: 52,
      y: 48,
      ordersCount: 9,
      contact: '+91 94371 44556',
      address: 'Near BMC Bhawani Mall, Saheed Nagar, Bhubaneswar, Odisha 751007',
    },
    {
      id: 'pt_jayadev',
      name: 'Jayadev Vihar - Nayapalli Household Cluster',
      type: 'dropoff',
      area: 'Jayadev Vihar / IRC Village',
      x: 42,
      y: 36,
      ordersCount: 11,
      contact: '+91 97760 11920',
      address: 'Biju Patnaik College Road, Jayadev Vihar, Bhubaneswar 751013',
    },
    {
      id: 'pt_khandagiri',
      name: 'Khandagiri - Baramunda Western Transit Hub',
      type: 'depot',
      area: 'Khandagiri / Baramunda ISBT',
      x: 28,
      y: 54,
      ordersCount: 6,
      contact: '+91 94372 99881',
      address: 'NH-16 Highway Hub, Khandagiri, Bhubaneswar, Odisha 751030',
    },
    {
      id: 'pt_rasulgarh',
      name: 'Rasulgarh Cuttack-Road Express Junction',
      type: 'pickup',
      area: 'Rasulgarh Square',
      x: 74,
      y: 46,
      ordersCount: 7,
      contact: '+91 98611 77332',
      address: 'Near Rasulgarh Flyover, Cuttack Road, Bhubaneswar 751010',
    },
    {
      id: 'pt_khordha',
      name: 'Khordha Valley Agro Collection Center',
      type: 'pickup',
      area: 'Khordha District Border Farm Belt',
      x: 18,
      y: 78,
      ordersCount: 16,
      contact: '+91 94373 55112',
      address: 'Village Gurujang Agro Cooperative, Khordha, Odisha 752055',
    },
  ];

  const filteredPoints = deliveryPoints.filter(p => {
    if (filterType === 'depot') return p.type === 'depot' || p.type === 'pickup';
    if (filterType === 'dropoff') return p.type === 'dropoff';
    return true;
  });

  const handlePointClick = (pt: DeliveryPoint) => {
    setSelectedPoint(pt);
    if (onSelectPoint) onSelectPoint(pt);
  };

  return (
    <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative text-white">
      {/* Map Control Bar */}
      <div className="p-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-10 relative">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center">
            <Navigation className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black tracking-tight text-white">
                Bhubaneswar Smart Agro Logistics Grid
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                GPS Live • Odisha Zone
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              NH-16 Corridor • Mancheswar Depot • Patia • Saheed Nagar • Khordha Belt
            </p>
          </div>
        </div>

        {/* Filters & Zoom */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                filterType === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Hubs
            </button>
            <button
              onClick={() => setFilterType('depot')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                filterType === 'depot' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Farm Depots
            </button>
            <button
              onClick={() => setFilterType('dropoff')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                filterType === 'dropoff' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Drops
            </button>
          </div>

          <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 p-1">
            <button
              onClick={() => setZoom(z => Math.min(z + 0.2, 1.6))}
              className="p-1.5 text-slate-300 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(z - 0.2, 0.8))}
              className="p-1.5 text-slate-300 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative h-[420px] w-full bg-[#0a1120] overflow-hidden select-none">
        {/* Subtle grid pattern representing urban layout */}
        <div 
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />

        <div 
          className="w-full h-full relative transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
        >
          {/* Stylized Bhubaneswar Highway Roads & Kuakhai/Daya River Streams */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Kuakhai River on East side */}
            <path
              d="M 85 0 Q 82 30 88 60 T 92 100"
              fill="none"
              stroke="#0284c7"
              strokeWidth="1.8"
              strokeOpacity="0.4"
            />
            {/* NH-16 Main Highway (Kolkata-Chennai corridor through Bhubaneswar) */}
            <path
              d="M 15 95 L 35 60 L 52 48 L 74 46 L 95 10"
              fill="none"
              stroke="#1e3a8a"
              strokeWidth="3.5"
              strokeOpacity="0.7"
            />
            <path
              d="M 15 95 L 35 60 L 52 48 L 74 46 L 95 10"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="0.8"
              strokeDasharray="2, 2"
              strokeOpacity="0.8"
            />

            {/* Nandankanan Road to Patia Infocity */}
            <path
              d="M 42 36 L 58 18 L 65 0"
              fill="none"
              stroke="#1e293b"
              strokeWidth="2.5"
            />
            <path
              d="M 42 36 L 58 18 L 65 0"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="0.7"
              strokeDasharray="1.5, 2"
              strokeOpacity="0.6"
            />

            {/* Mancheswar Industrial Radial to Rasulgarh */}
            <path
              d="M 62 35 L 74 46"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.5"
              strokeDasharray="2, 1"
              strokeOpacity="0.8"
            />

            {/* Active Cold Chain Dispatch Route (Khordha -> Khandagiri -> Saheed Nagar -> Patia) */}
            <path
              d="M 18 78 Q 28 54 52 48 T 58 18"
              fill="none"
              stroke="#10b981"
              strokeWidth="2.2"
              strokeDasharray="3, 3"
              className="animate-pulse"
            />
          </svg>

          {/* Markers */}
          {filteredPoints.map(pt => {
            const isSelected = selectedPoint?.id === pt.id;
            return (
              <div
                key={pt.id}
                onClick={() => handlePointClick(pt)}
                style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
              >
                <div className="relative">
                  {/* Ripple pulse for depots */}
                  {pt.type === 'depot' && (
                    <div className="absolute -inset-2 bg-blue-500/20 rounded-full animate-ping pointer-events-none" />
                  )}
                  {pt.type === 'pickup' && (
                    <div className="absolute -inset-2 bg-amber-500/20 rounded-full animate-ping pointer-events-none" />
                  )}

                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-125 border-2 ${
                      isSelected
                        ? 'bg-amber-400 border-white text-slate-950 ring-4 ring-amber-400/40'
                        : pt.type === 'depot'
                        ? 'bg-blue-600 border-blue-400 text-white'
                        : pt.type === 'pickup'
                        ? 'bg-emerald-600 border-emerald-400 text-white'
                        : 'bg-indigo-600 border-indigo-400 text-white'
                    }`}
                  >
                    {pt.type === 'depot' ? (
                      <Layers className="w-4 h-4" />
                    ) : pt.type === 'pickup' ? (
                      <Truck className="w-4 h-4" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                  </div>

                  {/* Marker Area Label Tag */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-9 bg-slate-900/90 text-slate-200 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded shadow-md whitespace-nowrap pointer-events-none">
                    {pt.name.split(' ')[0]} ({pt.ordersCount} lots)
                  </div>
                </div>
              </div>
            );
          })}

          {/* Live Delivery Van Tracker (Simulated Moving Vehicle in Bhubaneswar) */}
          <div
            style={{ left: '46%', top: '42%' }}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
          >
            <div className="relative flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500 border-2 border-white text-slate-950 flex items-center justify-center shadow-2xl animate-bounce">
                <Truck className="w-5 h-5 text-slate-950" />
              </div>
              <div className="bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg whitespace-nowrap flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Your Van (MH 12 QX 4902) • En route Patia</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Hub Detail Card Overlay */}
        {selectedPoint && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-3.5 shadow-2xl z-40 text-xs space-y-2 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                  {selectedPoint.type === 'depot' ? 'Primary Regional Depot' : selectedPoint.type === 'pickup' ? 'Farm Collection Gate' : 'Urban Dropoff Zone'}
                </span>
                <h4 className="font-extrabold text-sm text-white">{selectedPoint.name}</h4>
              </div>
              <button
                onClick={() => setSelectedPoint(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-slate-300">{selectedPoint.address}</p>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
              <span className="text-slate-400">Active Consignments: <strong className="text-white">{selectedPoint.ordersCount}</strong></span>
              <span className="text-blue-400 font-semibold">{selectedPoint.contact}</span>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs border border-slate-800 px-3 py-2 rounded-xl text-[10px] space-y-1 z-30 pointer-events-none hidden sm:block">
          <div className="font-bold text-slate-300 uppercase tracking-wider mb-1">Odisha Agro Fleet Map</div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            <span>Mancheswar / Baramunda Cold Depot</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Khordha Farm Collection Gate</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
            <span>Patia / Saheed Nagar Consumer Drops</span>
          </div>
        </div>
      </div>
    </div>
  );
};
