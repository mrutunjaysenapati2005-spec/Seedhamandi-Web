import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  MapPin, 
  Clock, 
  DollarSign, 
  Check, 
  X, 
  Radio, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Truck, 
  Navigation,
  ArrowRight,
  ShieldCheck,
  Flame
} from 'lucide-react';
import { DispatchOffer } from '../pages/LogisticsDashboard';

export interface VicinityAlert {
  id: string;
  offer: DispatchOffer;
  distanceFromDriverKm: number;
  createdAt: number;
  expiresInSeconds: number;
}

interface VicinityDispatchToastProps {
  alerts: VicinityAlert[];
  onAccept: (offer: DispatchOffer) => void;
  onDismiss: (alertId: string) => void;
  onViewOnMap: (offer: DispatchOffer) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  autoRadar: boolean;
  onToggleAutoRadar: () => void;
  onTriggerTestAlert: () => void;
}

// Crisp dual-tone audio chime using Web Audio API
export const playVicinityChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Pulse 1: Attention frequency
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.18);

    // Pulse 2: Rising chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.12); // B5
    gain2.gain.setValueAtTime(0.2, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.38);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.4);
  } catch (err) {
    // Gracefully handle browser autoplay restriction
  }
};

export const VicinityDispatchToast: React.FC<VicinityDispatchToastProps> = ({
  alerts,
  onAccept,
  onDismiss,
  onViewOnMap,
  soundEnabled,
  onToggleSound,
  autoRadar,
  onToggleAutoRadar,
  onTriggerTestAlert,
}) => {
  // Live seconds countdown for visual progress bar
  const [secondsMap, setSecondsMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (alerts.length === 0) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const updated: Record<string, number> = {};

      alerts.forEach(alert => {
        const elapsed = Math.floor((now - alert.createdAt) / 1000);
        const remaining = Math.max(0, alert.expiresInSeconds - elapsed);
        updated[alert.id] = remaining;

        if (remaining <= 0) {
          onDismiss(alert.id);
        }
      });

      setSecondsMap(updated);
    }, 500);

    return () => clearInterval(timer);
  }, [alerts, onDismiss]);

  return (
    <>
      {/* Top Floating Toast Notification Stack (Bottom drawer on mobile, top-right on desktop) */}
      <div 
        id="vicinity-toast-container" 
        className="fixed bottom-4 left-4 right-4 sm:bottom-auto sm:top-20 sm:right-6 sm:left-auto z-50 max-w-md mx-auto sm:mx-0 flex flex-col gap-3 w-full sm:w-[440px] pointer-events-none select-none"
      >
        {alerts.map(alert => {
          const remaining = secondsMap[alert.id] ?? alert.expiresInSeconds;
          const progressPercent = (remaining / alert.expiresInSeconds) * 100;
          const offer = alert.offer;

          return (
            <div
              key={alert.id}
              id={`vicinity-alert-${alert.id}`}
              className="pointer-events-auto bg-stone-900/95 text-white rounded-2xl shadow-2xl border-2 border-emerald-500/80 backdrop-blur-md overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-4 sm:slide-in-from-top-4 fade-in"
            >
              {/* Pulsing Header Banner */}
              <div className="bg-gradient-to-r from-emerald-950 via-stone-900 to-emerald-950 px-4 py-2.5 flex items-center justify-between border-b border-emerald-500/30">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>New Nearby Dispatch Request</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {alert.distanceFromDriverKm} km away
                  </span>
                  <button
                    onClick={() => onDismiss(alert.id)}
                    className="text-stone-300 hover:text-white bg-stone-800/80 hover:bg-stone-700/80 p-1.5 rounded-lg border border-stone-700/60 transition cursor-pointer flex items-center justify-center shrink-0"
                    title="Dismiss alert (✕)"
                    aria-label="Close dispatch alert"
                  >
                    <X className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* Main Content Body */}
              <div className="p-4 space-y-3">
                {/* Produce & Quantity */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>Immediate Farmgate Pickup</span>
                    </div>
                    <h4 className="font-extrabold text-sm text-white truncate mt-0.5">
                      {offer.produceName}
                    </h4>
                    <p className="text-xs text-stone-300 font-medium">
                      Load: <strong className="text-white">{offer.quantity}</strong> • Farmer: {offer.farmerName}
                    </p>
                  </div>

                  {/* Guaranteed Net Payout */}
                  <div className="text-right shrink-0 bg-emerald-900/40 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                    <span className="text-[10px] text-emerald-300 uppercase font-bold block">Net Freight</span>
                    <span className="text-lg font-black text-emerald-400">₹{offer.freightPayout}</span>
                    <span className="text-[9px] text-emerald-200/80 font-medium block">0% Broker Cut</span>
                  </div>
                </div>

                {/* Route Points */}
                <div className="bg-stone-800/80 p-2.5 rounded-xl text-xs space-y-1.5 border border-stone-700/60 font-sans">
                  <div className="flex items-center gap-2 text-stone-300">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></div>
                    <span className="text-[11px] text-stone-400">Pickup:</span>
                    <span className="font-semibold text-white truncate">{offer.pickupPoint}</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-300">
                    <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0"></div>
                    <span className="text-[11px] text-stone-400">Dropoff:</span>
                    <span className="font-semibold text-white truncate">{offer.dropPoint}</span>
                  </div>
                </div>

                {/* Micro Stats */}
                <div className="flex items-center justify-between text-[11px] text-stone-400 pt-0.5">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-stone-400" />
                    <span>{offer.distanceKm} km route ({offer.estMinutes} mins)</span>
                  </span>
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Auto-passes in {remaining}s</span>
                  </span>
                </div>

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      onViewOnMap(offer);
                    }}
                    className="py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-stone-600 cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5 text-blue-400" />
                    <span>View on Map</span>
                  </button>

                  <button
                    onClick={() => {
                      onAccept(offer);
                      onDismiss(alert.id);
                    }}
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs font-black transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/40 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Accept & Lock</span>
                  </button>
                </div>
              </div>

              {/* Progress Countdown Bar */}
              <div className="w-full bg-stone-800 h-1">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Radar Control Bar (Stationary in Dashboard) */}
      <div 
        id="vicinity-radar-control-panel" 
        className="bg-gradient-to-r from-stone-900 via-blue-950 to-stone-900 rounded-2xl p-4 sm:p-5 border border-blue-800/40 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-blue-900/60 border border-blue-500/40 text-blue-300">
            <Radio className={`w-6 h-6 ${autoRadar ? 'animate-pulse text-emerald-400' : 'text-stone-400'}`} />
            {autoRadar && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white tracking-wide">
                Smart Fleet Vicinity Radar
              </h3>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                autoRadar 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-stone-800 text-stone-400 border border-stone-700'
              }`}>
                {autoRadar ? 'Radar Active (5 km GPS Scan)' : 'Radar Paused'}
              </span>
            </div>
            <p className="text-xs text-stone-300 mt-0.5">
              Listening for instant farmgate orders within 5 km of Bhubaneswar hubs. Toast notifications appear in real-time.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-800/60'
                : 'bg-stone-800 text-stone-400 border border-stone-700 hover:text-stone-200'
            }`}
            title="Toggle dispatch chime sound"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-stone-400" />}
            <span>{soundEnabled ? 'Chime ON' : 'Chime Muted'}</span>
          </button>

          {/* Auto Radar Toggle */}
          <button
            onClick={onToggleAutoRadar}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              autoRadar
                ? 'bg-blue-800/80 text-blue-100 border border-blue-500/50 hover:bg-blue-700'
                : 'bg-stone-800 text-stone-300 border border-stone-700 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-blue-300" />
            <span>{autoRadar ? 'Auto-Scan ON' : 'Resume Scan'}</span>
          </button>

          {/* Test Alert Simulator Button */}
          <button
            onClick={onTriggerTestAlert}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-emerald-950 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Test Vicinity Alert (+)</span>
          </button>
        </div>
      </div>
    </>
  );
};
