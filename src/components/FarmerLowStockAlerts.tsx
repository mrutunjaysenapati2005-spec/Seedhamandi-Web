import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Package, 
  ArrowUpRight, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Plus, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  TrendingDown, 
  Flame, 
  Sparkles,
  Zap,
  Info,
  Calendar
} from 'lucide-react';
import { Product } from '../types';

// Web Audio API soft acoustic low-stock alert chime
export const playLowStockChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // First tone: 493.88 Hz (B4)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(493.88, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.2, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Second tone: 659.25 Hz (E5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.14);
    gain2.gain.setValueAtTime(0.001, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.25, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.6);
  } catch (err) {
    // Gracefully handle browser restrictions
  }
};

export interface LowStockItem {
  product: Product;
  currentStock: number;
  threshold: number;
  percentage: number;
  unit: string;
  isDepleted: boolean;
  isCritical: boolean;
}

interface FarmerLowStockProps {
  products: Product[];
  globalThreshold: number;
  onUpdateGlobalThreshold: (val: number) => void;
  onUpdateProductThreshold: (productId: string, threshold: number) => Promise<void>;
  onRestockProduct: (productId: string, addQuantity: number) => Promise<void>;
  onSimulateStockDrain?: (productId: string) => Promise<void>;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const FarmerLowStockBanner: React.FC<FarmerLowStockProps> = ({
  products,
  globalThreshold,
  onUpdateGlobalThreshold,
  onUpdateProductThreshold,
  onRestockProduct,
  onSimulateStockDrain,
  soundEnabled,
  onToggleSound,
}) => {
  const [selectedProductForThreshold, setSelectedProductForThreshold] = useState<Product | null>(null);
  const [newThresholdInput, setNewThresholdInput] = useState<string>('50');
  const [isUpdatingThreshold, setIsUpdatingThreshold] = useState(false);
  const [restockingId, setRestockingId] = useState<string | null>(null);
  const [showThresholdSettings, setShowThresholdSettings] = useState(false);
  const [tempGlobalThreshold, setTempGlobalThreshold] = useState<string>(globalThreshold.toString());

  // Calculate items currently below their set threshold
  const lowStockItems: LowStockItem[] = products.map(prod => {
    const threshold = prod.lowStockThreshold !== undefined ? prod.lowStockThreshold : globalThreshold;
    const currentStock = prod.quantity;
    const percentage = threshold > 0 ? Math.min(100, Math.round((currentStock / threshold) * 100)) : 100;
    return {
      product: prod,
      currentStock,
      threshold,
      percentage,
      unit: prod.unit,
      isDepleted: currentStock <= 0,
      isCritical: currentStock > 0 && percentage <= 35,
    };
  }).filter(item => item.currentStock <= item.threshold);

  const handleOpenThresholdModal = (prod: Product) => {
    setSelectedProductForThreshold(prod);
    const existing = prod.lowStockThreshold !== undefined ? prod.lowStockThreshold : globalThreshold;
    setNewThresholdInput(existing.toString());
  };

  const handleSaveProductThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForThreshold) return;
    const val = Number(newThresholdInput);
    if (isNaN(val) || val < 1) return;

    setIsUpdatingThreshold(true);
    try {
      await onUpdateProductThreshold(selectedProductForThreshold.id, val);
      setSelectedProductForThreshold(null);
    } finally {
      setIsUpdatingThreshold(false);
    }
  };

  const handleQuickRestock = async (productId: string, amount: number) => {
    setRestockingId(productId);
    try {
      await onRestockProduct(productId, amount);
    } finally {
      setRestockingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Alert Banner / Control Center */}
      <div className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm ${
        lowStockItems.length > 0
          ? 'bg-amber-50/90 border-amber-300'
          : 'bg-emerald-50/80 border-emerald-200'
      }`}>
        <div className="p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                lowStockItems.length > 0
                  ? 'bg-amber-500 text-white animate-pulse'
                  : 'bg-emerald-600 text-white'
              }`}>
                {lowStockItems.length > 0 ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`text-base font-black tracking-tight ${
                    lowStockItems.length > 0 ? 'text-amber-950' : 'text-emerald-950'
                  }`}>
                    {lowStockItems.length > 0 
                      ? `Real-Time Low Stock Watchtower: ${lowStockItems.length} Produce Batch${lowStockItems.length > 1 ? 'es' : ''} Below Threshold!`
                      : 'Real-Time Inventory Status: All Crop Lots Healthy'}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    lowStockItems.length > 0
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {lowStockItems.length > 0 ? 'Immediate Action Needed' : 'Inventory Balanced'}
                  </span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 max-w-2xl leading-relaxed">
                  {lowStockItems.length > 0 
                    ? `SeedhaMandi detects when farmgate harvest quantities breach your safety threshold (Current Default: ${globalThreshold} units). Replenish or adjust safety buffer to prevent unfulfilled consumer and B2B bulk orders.`
                    : `Active monitoring running. When consumer purchases drain stock below your safety threshold (${globalThreshold} units), an instant alert will fire.`}
                </p>
              </div>
            </div>

            {/* Quick Actions & Preferences */}
            <div className="flex items-center flex-wrap gap-2 self-start md:self-auto">
              <button
                onClick={onToggleSound}
                className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition ${
                  soundEnabled
                    ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border-stone-300 hover:bg-stone-200'
                }`}
                title={soundEnabled ? 'Alert chime active' : 'Alert chime muted'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-700" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{soundEnabled ? 'Chime ON' : 'Chime Muted'}</span>
              </button>

              <button
                onClick={() => setShowThresholdSettings(v => !v)}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-stone-900 hover:bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-bold border border-stone-300 flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
                <span>Configure Threshold ({globalThreshold})</span>
              </button>

              {onSimulateStockDrain && products.length > 0 && (
                <button
                  onClick={() => {
                    // Pick a product with healthy stock and simulate a big order that pushes it into low stock
                    const candidate = products.find(p => p.quantity > (p.lowStockThreshold || globalThreshold)) || products[0];
                    if (candidate) onSimulateStockDrain(candidate.id);
                  }}
                  className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                  title="Simulate consumer purchase that drains stock below safety threshold"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-200" />
                  <span>Simulate Stock Drain</span>
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Global Threshold Config Panel */}
          {showThresholdSettings && (
            <div className="mt-4 pt-4 border-t border-amber-200/80 grid grid-cols-1 md:grid-cols-3 gap-3 bg-white/70 p-4 rounded-xl">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Global Safety Threshold (Default for all lots)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    max="1000"
                    value={tempGlobalThreshold}
                    onChange={(e) => setTempGlobalThreshold(e.target.value)}
                    className="w-28 px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-300 rounded-lg text-xs font-bold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <span className="text-xs text-stone-500 dark:text-stone-400">units/kg</span>
                  <button
                    onClick={() => {
                      const v = Number(tempGlobalThreshold);
                      if (v > 0) {
                        onUpdateGlobalThreshold(v);
                        setShowThresholdSettings(false);
                      }
                    }}
                    className="px-3 py-1.5 bg-emerald-800 text-white rounded-lg text-xs font-bold hover:bg-emerald-900 transition"
                  >
                    Apply
                  </button>
                </div>
              </div>
              <div className="md:col-span-2 text-xs text-stone-500 dark:text-stone-400 flex items-center">
                <Info className="w-4 h-4 text-amber-600 mr-2 shrink-0" />
                <span>
                  Tip: You can also configure crop-specific thresholds (e.g. 20 crates for strawberries, 150 kg for onions) directly in the inventory table below using the <strong>Threshold</strong> gear icon.
                </span>
              </div>
            </div>
          )}

          {/* Cards for Low Stock Items */}
          {lowStockItems.length > 0 && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockItems.map(item => {
                const prod = item.product;
                const isRestocking = restockingId === prod.id;

                return (
                  <div
                    key={prod.id}
                    className={`p-3.5 rounded-xl border bg-white dark:bg-stone-900 shadow-xs transition space-y-3 ${
                      item.isDepleted 
                        ? 'border-rose-400 ring-2 ring-rose-300/50' 
                        : item.isCritical 
                        ? 'border-amber-400 ring-2 ring-amber-300/40' 
                        : 'border-amber-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-12 h-12 rounded-lg object-cover border border-stone-200 dark:border-stone-700 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-extrabold text-xs text-stone-900 dark:text-stone-100 truncate" title={prod.name}>
                            {prod.name}
                          </h4>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${
                            item.isDepleted
                              ? 'bg-rose-600 text-white'
                              : item.isCritical
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {item.isDepleted ? 'Stock Depleted' : item.isCritical ? 'Critical Low' : 'Low Stock'}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                          {prod.category} • {prod.qualityGrade.split(' ')[0]} • ₹{prod.price}/{prod.unit}
                        </p>
                      </div>
                    </div>

                    {/* Stock vs Threshold Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className={item.isDepleted ? 'text-rose-700' : 'text-amber-800'}>
                          {prod.quantity} {prod.unit} remaining
                        </span>
                        <span className="text-stone-500 dark:text-stone-400 text-[10px]">
                          Threshold: {item.threshold} {prod.unit}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            item.isDepleted
                              ? 'bg-rose-600 w-full'
                              : item.isCritical
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.max(6, item.percentage)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400 pt-0.5">
                        <span>Buffer: {item.percentage}%</span>
                        <span className="text-orange-700 font-semibold">
                          ~{Math.max(1, Math.round(item.currentStock / 12))} hours supply left
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        onClick={() => handleQuickRestock(prod.id, prod.unit === 'crates' ? 25 : 100)}
                        disabled={isRestocking}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs"
                      >
                        {isRestocking ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                        <span>Quick Restock (+{prod.unit === 'crates' ? '25 Crates' : '100 kg'})</span>
                      </button>

                      <button
                        onClick={() => handleOpenThresholdModal(prod)}
                        className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:text-stone-100 hover:bg-stone-50 dark:bg-stone-950 transition cursor-pointer"
                        title="Configure custom threshold for this produce"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Edit Produce Safety Threshold */}
      {selectedProductForThreshold && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 transition-colors rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-700 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-sm text-stone-900 dark:text-stone-100">Configure Safety Stock Threshold</h3>
              </div>
              <button
                onClick={() => setSelectedProductForThreshold(null)}
                className="p-1 text-stone-400 hover:text-stone-700 dark:text-stone-300 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-700">
              <img
                src={selectedProductForThreshold.image}
                alt={selectedProductForThreshold.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                  {selectedProductForThreshold.name}
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Current Stock: <strong>{selectedProductForThreshold.quantity} {selectedProductForThreshold.unit}</strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProductThreshold} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Trigger Low Stock Alert When Quantity Reaches Below:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    required
                    value={newThresholdInput}
                    onChange={(e) => setNewThresholdInput(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 dark:text-stone-100 focus:bg-white dark:bg-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="e.g. 50"
                  />
                  <span className="text-xs font-bold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700">
                    {selectedProductForThreshold.unit}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                  When consumer or B2B bulk orders reduce remaining volume below this number, SeedhaMandi will immediately fire an acoustic and push alert.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                  Quick Recommended Presets:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {[20, 50, 100, 200].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewThresholdInput(preset.toString())}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                        newThresholdInput === preset.toString()
                          ? 'bg-amber-100 text-amber-900 border-amber-400'
                          : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {preset} {selectedProductForThreshold.unit}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setSelectedProductForThreshold(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:bg-stone-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingThreshold}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black shadow-md transition disabled:opacity-50"
                >
                  {isUpdatingThreshold ? 'Saving Threshold...' : 'Save Alert Threshold'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Floating Real-Time Toast Alert for Low Stock
export interface LowStockToastAlert {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  threshold: number;
  image: string;
}

export const FarmerLowStockToast: React.FC<{
  alerts: LowStockToastAlert[];
  onDismiss: (id: string) => void;
  onRestock: (productId: string, amount: number) => void;
}> = ({ alerts, onDismiss, onRestock }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {alerts.map(alert => (
        <div
          key={alert.id}
          className="pointer-events-auto bg-gradient-to-br from-amber-900 via-stone-900 to-amber-950 text-white p-4 rounded-2xl shadow-2xl border-2 border-amber-400 animate-in slide-in-from-top-4 fade-in duration-300 space-y-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 animate-bounce">
                <AlertTriangle className="w-4 h-4 font-black" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                  Real-Time Low Stock Warning!
                </span>
                <h4 className="text-xs font-black text-white truncate max-w-[200px]">
                  {alert.productName}
                </h4>
              </div>
            </div>
            <button
              onClick={() => onDismiss(alert.id)}
              className="text-stone-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 bg-black/40 p-2.5 rounded-xl border border-white/10">
            <img
              src={alert.image}
              alt={alert.productName}
              className="w-10 h-10 rounded-lg object-cover shrink-0"
            />
            <div className="text-[11px] leading-tight flex-1">
              <div className="text-amber-200 font-bold">
                Remaining: <span className="text-white font-black">{alert.quantity} {alert.unit}</span>
              </div>
              <div className="text-stone-400 text-[10px] mt-0.5">
                Below safety threshold of {alert.threshold} {alert.unit}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onRestock(alert.productId, alert.unit === 'crates' ? 30 : 100);
                onDismiss(alert.id);
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Instant Restock (+{alert.unit === 'crates' ? '30' : '100'})</span>
            </button>
            <button
              onClick={() => onDismiss(alert.id)}
              className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 text-xs font-bold transition"
            >
              Acknowledge
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
