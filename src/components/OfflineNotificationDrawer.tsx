import React, { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, AlertTriangle, Layers, CloudUpload } from 'lucide-react';
import { offlineSync, OfflineMutation } from '../services/offlineSync';

export const OfflineNotificationDrawer: React.FC = () => {
  const [syncState, setSyncState] = useState({
    isOnline: offlineSync.isEffectiveOnline(),
    isSimulatedOffline: offlineSync.isSimulationActive(),
    pendingCount: offlineSync.getPendingMutations().length,
    lastSyncResult: null as string | null
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = offlineSync.subscribe((state) => {
      setSyncState(state);
      if (state.lastSyncResult) {
        setToastMessage(state.lastSyncResult);
        const timer = setTimeout(() => setToastMessage(null), 5000);
        return () => clearTimeout(timer);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const result = await offlineSync.syncPendingMutations();
      setToastMessage(result.message);
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleOffline = () => {
    offlineSync.toggleSimulatedOffline();
  };

  // 1. Success Sync Toast (Restored connection)
  if (toastMessage && syncState.isOnline) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] sm:w-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-900/95 text-white shadow-xl border border-emerald-500/40 backdrop-blur-md">
          <div className="w-8 h-8 rounded-xl bg-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-amber-300" />
          </div>
          <div className="text-xs font-medium pr-2">
            {toastMessage}
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-300 hover:text-white text-xs font-bold shrink-0 ml-auto cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  // 2. Offline Mode Bottom Banner
  if (!syncState.isOnline) {
    return (
      <div className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:max-w-2xl sm:w-full z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
        <div className="bg-stone-900/95 dark:bg-stone-950/95 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-2xl shadow-2xl border border-amber-500/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
              <WifiOff className="w-4 h-4 animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-amber-300 text-xs tracking-wide flex items-center gap-1.5">
                  <span>📡 Low-Bandwidth Offline Mode Active</span>
                  {syncState.isSimulatedOffline && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200 border border-amber-500/40">
                      Simulated 2G
                    </span>
                  )}
                </span>
                {syncState.pendingCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/40 flex items-center gap-1">
                    <CloudUpload className="w-3 h-3 text-blue-300" />
                    <span>{syncState.pendingCount} action{syncState.pendingCount > 1 ? 's' : ''} queued locally</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-300 leading-tight">
                Product catalog & saved consignments loaded from local embedded DB. New orders & actions will auto-sync upon reconnection.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {syncState.isSimulatedOffline && (
              <button
                onClick={handleToggleOffline}
                className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition cursor-pointer"
                title="Disable offline simulation"
              >
                Go Online
              </button>
            )}

            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-extrabold shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Re-sync Now'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
