import React, { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';

export const LogisticsNotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const prevOrdersRef = useRef<Order[]>([]);
  const notifiedPlacedOrders = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      prevOrdersRef.current = [];
      return;
    }

    const checkForUpdates = async () => {
      try {
        const res = await api.getOrders();
        const currentOrders = res.orders || [];

        // Check for new orders that are PLACED to simulate driver assignment
        currentOrders.forEach(currentOrder => {
          if (currentOrder.status === 'PLACED' && !notifiedPlacedOrders.current.has(currentOrder.id)) {
            // New order placed!
            notifiedPlacedOrders.current.add(currentOrder.id);
            
            // Wait 5 seconds after placing order to simulate driver assignment
            setTimeout(async () => {
              try {
                await api.updateOrderStatus(currentOrder.id, 'PREPARING', 'Driver Assigned');
              } catch (e) {
                console.error(e);
              }
            }, 5000);

            // Wait 15 seconds to simulate Out for Delivery
            setTimeout(async () => {
              try {
                await api.updateOrderStatus(currentOrder.id, 'IN_TRANSIT', 'Out for Delivery');
              } catch (e) {
                console.error(e);
              }
            }, 15000);
          }
        });

        if (prevOrdersRef.current.length > 0) {
          currentOrders.forEach(currentOrder => {
            const prevOrder = prevOrdersRef.current.find(o => o.id === currentOrder.id);
            if (prevOrder && prevOrder.status !== currentOrder.status) {
              // Generate simple toast message based on logistics update
              const getStatusMessage = (status: string) => {
                switch(status) {
                  case 'CONFIRMED': return 'has been confirmed.';
                  case 'PREPARING': return 'has been assigned a driver and is preparing for dispatch.';
                  case 'PICKED_UP': return 'has been picked up by logistics.';
                  case 'IN_TRANSIT': return 'is now Out for Delivery! 🚚';
                  case 'DELIVERED': return 'has been delivered successfully!';
                  default: return `status updated to ${status}.`;
                }
              };
              
              const isConsumer = user.id === currentOrder.consumerId;
              const title = isConsumer ? 'Your Order' : 'Order';
              
              toast.success(`${title} #${currentOrder.id.slice(-6)} ${getStatusMessage(currentOrder.status)}`, {
                duration: 5000,
                icon: currentOrder.status === 'IN_TRANSIT' ? '🚚' : currentOrder.status === 'DELIVERED' ? '✅' : '📦',
                style: {
                  borderRadius: '10px',
                  background: '#333',
                  color: '#fff',
                },
              });
            }
          });
        }
        prevOrdersRef.current = currentOrders;
      } catch (err) {
        console.error('Error polling orders for notifications', err);
      }
    };

    const interval = setInterval(checkForUpdates, 3000);
    checkForUpdates();

    return () => clearInterval(interval);
  }, [user]);

  return null;
};
