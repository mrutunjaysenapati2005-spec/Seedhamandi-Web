import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShieldCheck, 
  Truck, 
  ShoppingBag, 
  ArrowRight,
  ArrowLeft,
  MapPin,
  CheckCircle2,
  Boxes,
  Zap,
  Tag,
  AlertCircle,
  Clock,
  Sparkles,
  KeyRound,
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PayViaQrCheckout } from './PayViaQrCheckout';
import { api } from '../services/api';
import { PaymentMethod, VehicleType, Order } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced?: (orderId: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onOrderPlaced,
}) => {
  const { 
    cart, 
    cartTotal, 
    removeFromCart, 
    updateCartQty, 
    clearCart, 
    user, 
    setActiveTab,
    cartDrawerStep,
    setCartDrawerStep 
  } = useAuth();

  const [currentStep, setCurrentStep] = useState<'basket' | 'checkout' | 'confirmed'>('basket');
  const [isBulkMode, setIsBulkMode] = useState(false);

  // Delivery address state (defaulting to Bhubaneswar agricultural corridor)
  const [street, setStreet] = useState('Plot 42, Infocity Road, Patia');
  const [city, setCity] = useState('Bhubaneswar');
  const [state, setState] = useState('Odisha');
  const [pincode, setPincode] = useState('751024');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  
  // Placed order receipt state
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initial step when opening
  useEffect(() => {
    if (isOpen) {
      if (cartDrawerStep === 'checkout' && cart.length > 0) {
        setCurrentStep('checkout');
      } else {
        setCurrentStep('basket');
      }
    }
  }, [isOpen, cartDrawerStep, cart.length]);

  if (!isOpen) return null;

  // Calculate total kilograms
  const totalWeightKg = cart.reduce((sum, item) => sum + item.quantity, 0);
  const isBulkActive = isBulkMode || totalWeightKg >= 100;

  // Wholesale bulk discount: 8% off farmgate items
  const wholesaleDiscount = isBulkActive ? Math.round(cartTotal * 0.08) : 0;
  const discountedItemsTotal = Math.max(0, cartTotal - wholesaleDiscount);

  // Determine required vehicle fleet
  let recommendedVehicle: { type: VehicleType; name: string; icon: string; fee: number; note: string } = {
    type: 'BIKE_SCOOTY',
    name: 'Bike / Scooty with Thermal Bag',
    icon: '🛵',
    fee: 70,
    note: 'Ideal for rapid express household baskets (<25 kg)',
  };

  if (isBulkActive || totalWeightKg >= 300) {
    recommendedVehicle = {
      type: 'TRACTOR',
      name: 'Tractor / Agro Trolley',
      icon: '🚜',
      fee: 420,
      note: 'Heavy bulk harvest haulage direct from rural farmgate (300 - 3,000 kg)',
    };
  } else if (totalWeightKg >= 30) {
    recommendedVehicle = {
      type: 'MINI_TRUCK',
      name: 'Mini Truck / Tata Ace (Chota Hathi)',
      icon: '🚚',
      fee: 180,
      note: 'Optimal for medium mandi distribution & community wholesale (30 - 300 kg)',
    };
  } else if (cart.some(i => i.product.category === 'Fruits' || i.product.category === 'Vegetables') && totalWeightKg >= 10) {
    recommendedVehicle = {
      type: 'REEFER_VAN',
      name: 'Reefer Cold Van (4°C Active Chilling)',
      icon: '❄️',
      fee: 240,
      note: 'Temperature-guaranteed transit preventing fruit degradation',
    };
  }

  const logisticsFee = cart.length > 0 ? recommendedVehicle.fee : 0;
  const grandTotal = discountedItemsTotal + logisticsFee;

  // Extract unique farmer names from cart
  const farmerNames = Array.from(new Set(cart.map(i => i.product.farmerName || 'Ramesh Patel')));

  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;
    setCurrentStep('checkout');
    setCartDrawerStep('checkout');
  };

  const handlePaymentSuccess = async (method: PaymentMethod, txnDetails?: any) => {
    try {
      setIsSubmitting(true);
      const orderPayload = {
        items: cart.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          unit: item.product.unit,
          farmerId: item.product.farmerId,
          farmerName: item.product.farmerName,
          image: item.product.image,
        })),
        shippingAddress: {
          street,
          city,
          state,
          pincode,
        },
        paymentMethod: method,
        isBulkOrder: isBulkActive,
        deliveryNotes,
      };

      const res = await api.createOrder(orderPayload);
      const createdOrder: Order = res.order;
      setPlacedOrder(createdOrder);
      clearCart();
      setCurrentStep('confirmed');

      if (onOrderPlaced && createdOrder) {
        onOrderPlaced(createdOrder.id);
      }
    } catch (err: any) {
      console.error('Failed to create order:', err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackOrderOnDashboard = () => {
    onClose();
    setActiveTab('consumer_dashboard');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-lg bg-white dark:bg-stone-900 shadow-2xl flex flex-col">
          {/* =============================================================== */}
          {/* DRAWER TOP HEADER                                               */}
          {/* =============================================================== */}
          <div className="p-4 bg-emerald-900 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              {currentStep === 'checkout' && (
                <button
                  type="button"
                  onClick={() => setCurrentStep('basket')}
                  className="p-1.5 -ml-1 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-lg transition"
                  title="Back to Basket"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}

              {currentStep === 'confirmed' ? (
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-emerald-950 flex items-center justify-center font-black">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-amber-300">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              )}

              <div>
                <h3 className="font-extrabold text-sm sm:text-base tracking-tight">
                  {currentStep === 'basket' && 'Your Direct Farm Basket'}
                  {currentStep === 'checkout' && 'Checkout & Instant Payment'}
                  {currentStep === 'confirmed' && 'Consignment Booked & Paid!'}
                </h3>
                <p className="text-[11px] text-emerald-200 flex items-center gap-1.5">
                  {currentStep === 'basket' && (
                    <>
                      <span>Total Load: <strong className="text-white">{totalWeightKg} kg</strong></span>
                      <span>•</span>
                      <span>{cart.length} {cart.length === 1 ? 'batch' : 'batches'}</span>
                    </>
                  )}
                  {currentStep === 'checkout' && (
                    <span className="text-amber-300 font-medium">
                      Zero-broker direct escrow settlement
                    </span>
                  )}
                  {currentStep === 'confirmed' && (
                    <span className="text-amber-300 font-medium">
                      Direct payouts issued to farmer & driver
                    </span>
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="px-4 py-2 bg-emerald-950/90 text-white flex items-center justify-between text-[11px] font-bold border-b border-emerald-800">
            <div className={`flex items-center gap-1.5 ${currentStep === 'basket' ? 'text-amber-300' : 'text-emerald-300'}`}>
              <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${currentStep === 'basket' ? 'bg-amber-400 text-emerald-950 font-black' : 'bg-emerald-800 text-white'}`}>
                1
              </span>
              <span>Farm Basket</span>
            </div>

            <div className="w-6 h-0.5 bg-emerald-800" />

            <div className={`flex items-center gap-1.5 ${currentStep === 'checkout' ? 'text-amber-300' : 'text-stone-400'}`}>
              <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${currentStep === 'checkout' ? 'bg-amber-400 text-emerald-950 font-black' : 'bg-emerald-800 text-white'}`}>
                2
              </span>
              <span>Pay via QR / Options</span>
            </div>

            <div className="w-6 h-0.5 bg-emerald-800" />

            <div className={`flex items-center gap-1.5 ${currentStep === 'confirmed' ? 'text-amber-300' : 'text-stone-400'}`}>
              <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${currentStep === 'confirmed' ? 'bg-amber-400 text-emerald-950 font-black' : 'bg-emerald-800 text-white'}`}>
                3
              </span>
              <span>Order Placed</span>
            </div>
          </div>

          {/* =============================================================== */}
          {/* STEP 1: BASKET VIEW                                             */}
          {/* =============================================================== */}
          {currentStep === 'basket' && (
            <>
              {/* Bulk Wholesale Mode Switch */}
              <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-amber-700" />
                  <div>
                    <span className="text-xs font-bold text-amber-950">Bulk / Wholesale Mandi Mode</span>
                    <p className="text-[10px] text-amber-800">8% discount on farm lots ≥50kg</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBulkMode(!isBulkMode)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                    isBulkActive 
                      ? 'bg-amber-600 text-white shadow-xs' 
                      : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-300'
                  }`}
                >
                  {isBulkActive ? 'Bulk Active (8% OFF)' : 'Enable Bulk'}
                </button>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-16 space-y-3 text-stone-500 dark:text-stone-400">
                    <ShoppingBag className="w-12 h-12 mx-auto text-stone-300" />
                    <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">Your basket is currently empty</p>
                    <p className="text-xs text-stone-400 max-w-xs mx-auto">
                      Explore fresh vegetables, seasonal GI fruits, and grains direct from verified Indian farmers.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        setActiveTab('marketplace');
                      }}
                      className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-800 transition"
                    >
                      Explore Farm Marketplace
                    </button>
                  </div>
                ) : (
                  <>
                    {cart.map(item => (
                      <div
                        key={item.product.id}
                        className="p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200/80 rounded-xl space-y-2.5"
                      >
                        <div className="flex gap-3">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-16 h-16 rounded-lg object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100 truncate">
                                {item.product.name}
                              </h4>
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.product.id)}
                                className="p-1 text-stone-400 hover:text-rose-600 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400">
                              {item.product.farmerName} • {item.product.location}
                            </p>
                            <div className="text-xs font-black text-emerald-800 mt-0.5">
                              ₹{item.product.price} / {item.product.unit}
                            </div>
                          </div>
                        </div>

                        {/* Quantity controls + Quick bulk increments */}
                        <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-2 py-0.5">
                              <button
                                type="button"
                                onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                                className="p-0.5 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:text-stone-100 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold w-12 text-center">{item.quantity} {item.product.unit}</span>
                              <button
                                type="button"
                                onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                                className="p-0.5 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:text-stone-100 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Quick Bulk Add Pill */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateCartQty(item.product.id, item.quantity + 25)}
                              className="px-2 py-0.5 text-[10px] font-bold bg-stone-200 hover:bg-amber-200 text-stone-800 dark:text-stone-200 rounded-md transition cursor-pointer"
                              title="Add 25 kg lot"
                            >
                              +25 kg
                            </button>
                            <button
                              type="button"
                              onClick={() => updateCartQty(item.product.id, item.quantity + 100)}
                              className="px-2 py-0.5 text-[10px] font-bold bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-md transition cursor-pointer"
                              title="Add 100 kg lot"
                            >
                              +100 kg
                            </button>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-bold text-stone-900 dark:text-stone-100 font-mono">
                              ₹{item.product.price * item.quantity}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Recommended Logistics Vehicle Fleet Card */}
                    <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-blue-950">
                        <span className="flex items-center gap-1.5">
                          <span className="text-base">{recommendedVehicle.icon}</span>
                          <span>Assigned Fleet: {recommendedVehicle.name}</span>
                        </span>
                        <span className="text-blue-700 font-extrabold font-mono">₹{logisticsFee}</span>
                      </div>
                      <p className="text-[11px] text-blue-800 leading-tight">
                        {recommendedVehicle.note}
                      </p>
                      <div className="text-[10px] text-blue-600 flex items-center gap-1 font-medium pt-0.5">
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span>Real-time dispatch broadcast to nearby Bhubaneswar drivers</span>
                      </div>
                    </div>

                    {/* Delivery Address Form */}
                    <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                        <MapPin className="w-4 h-4 text-emerald-700" />
                        <span>Doorstep Delivery Destination (Bhubaneswar Hub)</span>
                      </div>
                      <input
                        type="text"
                        value={street}
                        onChange={e => setStreet(e.target.value)}
                        placeholder="Street Address / Flat No."
                        className="w-full bg-white dark:bg-stone-900 border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-600"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={city}
                          onChange={e => setCity(e.target.value)}
                          placeholder="City"
                          className="bg-white dark:bg-stone-900 transition-colors border border-emerald-300 rounded-lg px-2 py-1 text-xs"
                        />
                        <input
                          type="text"
                          value={state}
                          onChange={e => setState(e.target.value)}
                          placeholder="State"
                          className="bg-white dark:bg-stone-900 transition-colors border border-emerald-300 rounded-lg px-2 py-1 text-xs"
                        />
                        <input
                          type="text"
                          value={pincode}
                          onChange={e => setPincode(e.target.value)}
                          placeholder="Pincode"
                          className="bg-white dark:bg-stone-900 transition-colors border border-emerald-300 rounded-lg px-2 py-1 text-xs font-mono"
                        />
                      </div>
                      <input
                        type="text"
                        value={deliveryNotes}
                        onChange={e => setDeliveryNotes(e.target.value)}
                        placeholder="Special delivery instructions (e.g. Call before arrival)"
                        className="w-full bg-white dark:bg-stone-900 border border-emerald-300 rounded-lg px-2.5 py-1 text-[11px] placeholder:text-stone-400"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Bottom Summary & Place Order Button */}
              {cart.length > 0 && (
                <div className="p-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-700 space-y-3">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-stone-600 dark:text-stone-300">
                      <span>Direct Farmgate Harvest Value:</span>
                      <span className="font-semibold text-stone-900 dark:text-stone-100 font-mono">₹{cartTotal}</span>
                    </div>

                    {wholesaleDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          <span>Wholesale Volume Discount (8%):</span>
                        </span>
                        <span className="font-mono">-₹{wholesaleDiscount}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-stone-600 dark:text-stone-300">
                      <span>Logistics Freight ({recommendedVehicle.name.split(' ')[0]}):</span>
                      <span className="font-semibold text-stone-900 dark:text-stone-100 font-mono">₹{logisticsFee}</span>
                    </div>
                    
                    <div className="flex justify-between text-emerald-800 font-black pt-1.5 border-t border-stone-200 dark:border-stone-700 text-sm">
                      <span>Total Payable:</span>
                      <span className="text-base font-mono">₹{grandTotal}</span>
                    </div>
                  </div>

                  {/* The requested Place Order action */}
                  <button
                    type="button"
                    onClick={handleProceedToCheckout}
                    className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                    <span>Place Order & Choose Payment (₹{grandTotal})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className="text-[11px] text-center text-stone-500 dark:text-stone-400">
                    Protected by SeedhaMandi Quality Inspection & Escrow Guarantee
                  </p>
                </div>
              )}
            </>
          )}

          {/* =============================================================== */}
          {/* STEP 2: CHECKOUT & PAYMENT OPTIONS SCREEN (WITH PAY VIA QR)      */}
          {/* =============================================================== */}
          {currentStep === 'checkout' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Destination & Order Summary Banner */}
              <div className="p-3 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-stone-700 dark:text-stone-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Delivery: {street}, {city}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep('basket')}
                    className="text-[10px] text-emerald-700 hover:underline font-bold"
                  >
                    Edit Address
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                  <span>{cart.length} Farm Batches ({totalWeightKg} kg)</span>
                  <span>Assigned: {recommendedVehicle.name.split(' ')[0]}</span>
                </div>
              </div>

              {/* Pay Via QR & Payment Options Module */}
              <PayViaQrCheckout
                totalAmount={grandTotal}
                itemsTotal={discountedItemsTotal}
                logisticsFee={logisticsFee}
                wholesaleDiscount={wholesaleDiscount}
                farmerNames={farmerNames}
                vehicleName={recommendedVehicle.name}
                shippingAddress={{ street, city, state, pincode }}
                onPaymentComplete={handlePaymentSuccess}
                onCancel={() => setCurrentStep('basket')}
              />
            </div>
          )}

          {/* =============================================================== */}
          {/* STEP 3: ORDER PLACED RECEIPT SCREEN                             */}
          {/* =============================================================== */}
          {currentStep === 'confirmed' && placedOrder && (
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="text-center space-y-2 py-2">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-stone-900 dark:text-stone-100">
                  Order #{placedOrder.id} Placed!
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 max-w-xs mx-auto">
                  Instant real-time dispatch alerts transmitted to farmer collective and Bhubaneswar fleet.
                </p>
              </div>

              {/* Delivery OTP Pass Card */}
              <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-center space-y-2 shadow-xs">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider">
                  <KeyRound className="w-4 h-4 text-amber-700" />
                  <span>Doorstep Inspection & Delivery OTP</span>
                </div>
                <div className="text-3xl font-mono font-black tracking-widest text-emerald-950 bg-white dark:bg-stone-900 py-2 rounded-xl border border-amber-200">
                  {placedOrder.deliveryOtp}
                </div>
                <p className="text-[11px] text-amber-800 leading-snug">
                  Share this 6-digit OTP with the driver <strong>only after physically inspecting fresh produce</strong> at your doorstep.
                </p>
              </div>

              {/* Real-time Settlement Receipts */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2.5 text-xs">
                <div className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span>Instant UPI Settlement Receipts:</span>
                </div>

                <div className="p-2.5 bg-white dark:bg-stone-900 rounded-xl border border-emerald-100 space-y-1">
                  <div className="flex justify-between items-center text-stone-800 dark:text-stone-200">
                    <span className="font-bold">🌾 Farmer Harvest Payout:</span>
                    <strong className="text-emerald-800 font-mono">₹{placedOrder.itemsTotal}</strong>
                  </div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400">
                    100% credited to {placedOrder.items[0]?.farmerName || 'Farmer'} (Zero broker cut)
                  </div>
                </div>

                <div className="p-2.5 bg-white dark:bg-stone-900 rounded-xl border border-emerald-100 space-y-1">
                  <div className="flex justify-between items-center text-stone-800 dark:text-stone-200">
                    <span className="font-bold">🚚 Logistics Partner Freight:</span>
                    <strong className="text-blue-800 font-mono">₹{placedOrder.logisticsFee}</strong>
                  </div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400">
                    Assigned: {recommendedVehicle.name} (Bhubaneswar Hub)
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleTrackOrderOnDashboard}
                  className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Truck className="w-4 h-4 text-amber-300" />
                  <span>Track Live Consignment on Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Done & Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
