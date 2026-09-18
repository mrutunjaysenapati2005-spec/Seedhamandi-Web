import React, { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../services/api';
import { realtimeService } from '../services/realtime';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';

export const LogisticsNotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const prevOrdersRef = useRef<Order[]>([]);
  const notifiedPlacedOrders = useRef<Set<string>>(new Set());
  const notifiedStatusSet = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      prevOrdersRef.current = [];
      return;
    }

    const getStatusMessage = (status: string) => {
      switch (status) {
        case 'CONFIRMED':
          return 'has been confirmed.';
        case 'PREPARING':
          return 'has been assigned a driver and is preparing for dispatch.';
        case 'PICKED_UP':
          return 'has been picked up by logistics.';
        case 'IN_TRANSIT':
          return 'is now Out for Delivery! 🚚';
        case 'DELIVERED':
          return 'has been delivered successfully! ✅';
        default:
          return `status updated to ${status}.`;
      }
    };

    const triggerToast = (order: Order, status: string, customMessage?: string) => {
      const key = `${order.id}_${status}`;
      if (notifiedStatusSet.current.has(key)) return;
      notifiedStatusSet.current.add(key);

      const isConsumer = user.id === order.consumerId;
      const title = isConsumer ? 'Your Order' : 'Order';
      const msg = customMessage || `${title} #${order.id.slice(-6)} ${getStatusMessage(status)}`;

      toast.success(msg, {
        duration: 5000,
        icon: status === 'IN_TRANSIT' ? '🚚' : status === 'DELIVERED' ? '✅' : '📦',
        style: {
          borderRadius: '10px',
          background: '#222',
          color: '#fff',
        },
      });
    };

    // 1. Real-time WebSocket / SSE event listener
    const unsubscribe = realtimeService.subscribe((event) => {
      if (event.type === 'order:status_change' && event.data?.order) {
        const order = event.data.order;
        const status = event.data.status || order.status;

        // Check if relevant to this user
        if (user.role === 'CONSUMER' && order.consumerId !== user.id) return;
        if ((user.role === 'FARMER' || user.role === 'FPO_REP') && order.items.every(i => i.farmerId !== user.id)) return;

        triggerToast(order, status, event.data.message);

        // Update local reference
        prevOrdersRef.current = prevOrdersRef.current.map(o => (o.id === order.id ? order : o));
        if (!prevOrdersRef.current.some(o => o.id === order.id)) {
          prevOrdersRef.current.push(order);
        }
      } else if (event.type === 'order:created' && event.data?.order) {
        const order = event.data.order;
        if (!prevOrdersRef.current.some(o => o.id === order.id)) {
          prevOrdersRef.current.push(order);
        }
      }
    });

    // 2. Adaptive Fallback Polling Mechanism:
    // Only queries the server API if real-time stream is disconnected or quiet
    const checkForUpdates = async () => {
      // Don't poll if browser is offline or tab is in background
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

      // If WebSocket / SSE stream is active and healthy, skip fallback poll
      const isLive = realtimeService.isConnected();
      const lastEventAge = Date.now() - realtimeService.getLastEventTime();
      if (isLive && lastEventAge < 15000 && prevOrdersRef.current.length > 0) {
        return;
      }

      try {
        const res = await api.getOrders();
        if (!res || !Array.isArray(res.orders)) return;
        const currentOrders = res.orders;

        // Seed initial orders without toast alerts
        if (prevOrdersRef.current.length === 0) {
          prevOrdersRef.current = currentOrders;
          currentOrders.forEach(o => {
            notifiedStatusSet.current.add(`${o.id}_${o.status}`);
          });
          return;
        }

        currentOrders.forEach(currentOrder => {
          const prevOrder = prevOrdersRef.current.find(o => o.id === currentOrder.id);
          if (prevOrder && prevOrder.status !== currentOrder.status) {
            triggerToast(currentOrder, currentOrder.status);
          } else if (!prevOrder) {
            // Newly detected order from server polling
            if (currentOrder.status !== 'PLACED') {
              triggerToast(currentOrder, currentOrder.status);
            }
          }
        });

        prevOrdersRef.current = currentOrders;
      } catch {
        // Gracefully ignore transient network hiccups during server reload or offline
      }
    };

    const interval = setInterval(checkForUpdates, 6000);
    checkForUpdates();

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [user]);

  return null;
};

