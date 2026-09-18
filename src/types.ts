export type UserRole = 'FARMER' | 'CONSUMER' | 'LOGISTICS' | 'FPO_REP';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  village?: string;
  district?: string;
  state?: string;
  fpoName?: string;
  fpoFarmersCount?: number;
  vehicleType?: string;
  vehicleNumber?: string;
  bankAccount?: {
    accountNumber: string;
    ifsc: string;
    holderName: string;
    upiId?: string;
  };
}

export type ProductCategory =
  | 'Vegetables'
  | 'Fruits'
  | 'Grains'
  | 'Pulses'
  | 'Spices'
  | 'Dairy'
  | 'Organic';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  quantity: number;
  unit: 'kg' | 'quintal' | 'crates' | 'liters';
  price: number;
  mandiBenchmarkPrice?: number;
  minOrderQty: number;
  location: string;
  state: string;
  harvestDate: string;
  qualityGrade: 'Grade A+ Export' | 'Grade A Premium' | 'Certified Organic' | 'Farm Fresh Standard';
  image: string;
  description: string;
  availability: boolean;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  isFpoListed?: boolean;
  fpoName?: string;
  actualFarmerName?: string;
  organicCertified?: boolean;
  lowStockThreshold?: number;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  farmerId: string;
  farmerName: string;
  image: string;
}

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'PACKED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'REJECTED_LOW_STOCK'
  | 'CANCELLED';

export type PaymentMethod =
  | 'UPI'
  | 'NET_BANKING'
  | 'CARD'
  | 'ESCROW_COD'
  | 'KISAN_CREDIT';

export type VehicleType = 'BIKE_SCOOTY' | 'MINI_TRUCK' | 'TRACTOR' | 'REEFER_VAN';

export interface AppNotification {
  id: string;
  recipientRole: 'FARMER' | 'LOGISTICS' | 'CONSUMER' | 'ALL';
  recipientUserId?: string;
  orderId?: string;
  title: string;
  message: string;
  type: 'NEW_ORDER' | 'DISPATCH_OFFER' | 'DELIVERY_ACCEPTED' | 'ORDER_PACKED' | 'OUT_FOR_DELIVERY' | 'PAYOUT_RELEASED' | 'LOW_STOCK' | 'ORDER_REJECTED' | 'ORDER_ACCEPTED';
  vehicleTypeRequired?: VehicleType;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

export interface LogisticsPartner {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  district: string;
  rating: number;
  completedTrips: number;
  etaMinutes: number;
  capacityKg: number;
  freightEstimate: number;
  specialty: string;
}

export interface Order {
  id: string;
  consumerId: string;
  consumerName: string;
  consumerPhone: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: OrderItem[];
  itemsTotal: number;
  logisticsFee: number;
  platformFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'PAID' | 'ESCROW_LOCKED' | 'RELEASED_TO_FARMER';
  status: OrderStatus;
  deliveryOtp: string;
  logisticsId?: string;
  logisticsName?: string;
  vehicleNumber?: string;
  vehicleTypeRequired?: VehicleType;
  isBulkOrder?: boolean;
  orderType?: 'RETAIL' | 'BULK_WHOLESALE';
  bulkDiscount?: number;
  estimatedDeliveryTime: string;
  statusHistory: Array<{
    status: string;
    timestamp: string;
    note: string;
  }>;
  createdAt: string;
}

export interface DemandCrop {
  crop: string;
  category: string;
  demandIndex: number;
  trend: string;
  avgMandiPrice: number;
  recommendedDirectPrice: number;
  farmerBenefitPct: number;
  projectedRequirement: string;
  harvestAdvice: string;
}

export type DemandInsight = DemandCrop;

export interface DemandInsightsData {
  season: string;
  updatedAt: string;
  highDemandCrops: DemandCrop[];
  priceDisparityAnalysis: {
    headline: string;
    summary: string;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export interface BulkRfq {
  id: string;
  buyerName: string;
  organization: string; // e.g. "Kalinga Star Caterers", "Bhubaneswar Hotel Association"
  buyerPhone: string;
  cropName: string;
  category: ProductCategory;
  quantityRequired: number;
  unit: 'kg' | 'quintal' | 'crates';
  targetPricePerUnit: number;
  deliveryLocation: string;
  requiredByDate: string;
  status: 'OPEN' | 'MATCHED' | 'FULFILLED' | 'IN_TRANSIT';
  matchedFarmerOrFpo?: string;
  vehicleTypeRequired?: VehicleType;
  createdAt: string;
}

export interface DayForecast {
  day: string;
  projectedArrivalsTons: number;
  expectedMandiPrice: number;
  directFairPrice: number;
  confidencePct: number;
}

export interface CropForecastResult {
  crop: string;
  region: string;
  demandIndex: number;
  trend: string;
  currentMandiPrice: number;
  seedhaMandiPrice: number;
  farmerMarginGainPct: number;
  projectedDemandQuintals: number;
  harvestWindow: string;
  spoilageRisk: 'Low' | 'Medium' | 'High (Perishable)';
  recommendedAction: string;
  keyDrivers: string[];
  sevenDayForecast: DayForecast[];
}

export interface RouteStop {
  id: string;
  name: string;
  type: 'PICKUP' | 'HUB' | 'DELIVERY';
  location: string;
  coordinates: { lat: number; lng: number };
  produce: string;
  weightKg: number;
  perishabilityScore: number; // 1-10 (10 = highly perishable like berries/tomatoes)
  contactPerson: string;
  contactPhone: string;
}

export interface RouteOptimizationResult {
  vehicleType: VehicleType;
  stopsCount: number;
  totalPayloadKg: number;
  originalDistanceKm: number;
  optimizedDistanceKm: number;
  distanceSavedKm: number;
  distanceReductionPct: number;
  originalDurationMins: number;
  optimizedDurationMins: number;
  timeSavedMins: number;
  fuelSavedLiters: number;
  fuelCostSavedInr: number;
  co2SavedKg: number;
  freshnessScore: number; // 0-100
  coldChainCompliance: boolean;
  orderedWaypoints: Array<{
    seq: number;
    stopId: string;
    stopName: string;
    action: string;
    produce: string;
    weightKg: number;
    etaMinutesFromStart: number;
    notes: string;
  }>;
}
