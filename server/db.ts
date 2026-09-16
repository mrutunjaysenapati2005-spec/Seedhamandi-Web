import mongoose from 'mongoose';

// Types for DB entities
export interface UserDoc {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'FARMER' | 'CONSUMER' | 'LOGISTICS' | 'FPO_REP';
  passwordHash: string;
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
  createdAt: string;
}

export interface ProductDoc {
  id: string;
  name: string;
  category: 'Vegetables' | 'Fruits' | 'Grains' | 'Pulses' | 'Spices' | 'Dairy' | 'Organic';
  quantity: number;
  unit: 'kg' | 'quintal' | 'crates' | 'liters';
  price: number; // Price per unit in INR
  mandiBenchmarkPrice?: number; // Mandi benchmark for price comparison
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
  actualFarmerName?: string; // If listed by FPO on behalf of rural farmer
  organicCertified?: boolean;
  lowStockThreshold?: number;
  createdAt: string;
}

export interface OrderDoc {
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
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    unit: string;
    farmerId: string;
    farmerName: string;
    image: string;
  }>;
  itemsTotal: number;
  logisticsFee: number;
  platformFee: number;
  totalAmount: number;
  paymentMethod: 'UPI' | 'NET_BANKING' | 'CARD' | 'ESCROW_COD' | 'KISAN_CREDIT';
  paymentStatus: 'PAID' | 'ESCROW_LOCKED' | 'RELEASED_TO_FARMER';
  status: 'PLACED' | 'CONFIRMED' | 'PREPARING' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED';
  deliveryOtp: string;
  logisticsId?: string;
  logisticsName?: string;
  vehicleNumber?: string;
  vehicleTypeRequired?: 'BIKE_SCOOTY' | 'MINI_TRUCK' | 'TRACTOR' | 'REEFER_VAN';
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

export interface NotificationDoc {
  id: string;
  recipientRole: 'FARMER' | 'LOGISTICS' | 'CONSUMER' | 'ALL';
  recipientUserId?: string;
  orderId?: string;
  title: string;
  message: string;
  type: 'NEW_ORDER' | 'DISPATCH_OFFER' | 'DELIVERY_ACCEPTED' | 'ORDER_PACKED' | 'OUT_FOR_DELIVERY' | 'PAYOUT_RELEASED' | 'LOW_STOCK';
  vehicleTypeRequired?: 'BIKE_SCOOTY' | 'MINI_TRUCK' | 'TRACTOR' | 'REEFER_VAN';
  isRead: boolean;
  createdAt: string;
  data?: any;
}

export interface OtpDoc {
  id: string;
  identifier: string; // email or phone
  otpHash: string;
  plainOtpForPreview?: string; // Exposed only in dev/testing mode for zero-friction evaluation
  type: 'EMAIL' | 'SMS' | 'PASSWORD_RESET';
  expiresAt: number;
  verified: boolean;
  createdAt: number;
}

export interface RfqDoc {
  id: string;
  buyerName: string;
  organization: string;
  buyerPhone: string;
  cropName: string;
  category: 'Vegetables' | 'Fruits' | 'Grains' | 'Pulses' | 'Spices' | 'Dairy' | 'Organic';
  quantityRequired: number;
  unit: 'kg' | 'quintal' | 'crates';
  targetPricePerUnit: number;
  deliveryLocation: string;
  requiredByDate: string;
  status: 'OPEN' | 'MATCHED' | 'FULFILLED' | 'IN_TRANSIT';
  matchedFarmerOrFpo?: string;
  vehicleTypeRequired?: 'BIKE_SCOOTY' | 'MINI_TRUCK' | 'TRACTOR' | 'REEFER_VAN';
  createdAt: string;
}

// Initial Mock / Seed Data
const initialUsers: UserDoc[] = [
  {
    id: 'usr_farmer_1',
    name: 'Ramesh Patel',
    email: 'ramesh.farmer@seedhamandi.in',
    phone: '+91 98234 11201',
    role: 'FARMER',
    passwordHash: 'farmer123',
    isEmailVerified: true,
    isPhoneVerified: true,
    village: 'Baramati',
    district: 'Pune',
    state: 'Maharashtra',
    bankAccount: {
      accountNumber: 'XXXXXX4928',
      ifsc: 'SBIN0001824',
      holderName: 'Ramesh Baliram Patel',
      upiId: 'ramesh.farmer@oksbi',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_fpo_1',
    name: 'Sahyadri Kisan Samriddhi FPO',
    email: 'fpo.sahyadri@seedhamandi.in',
    phone: '+91 98765 43210',
    role: 'FPO_REP',
    passwordHash: 'fpo123',
    isEmailVerified: true,
    isPhoneVerified: true,
    fpoName: 'Sahyadri Kisan Samriddhi FPO (54 Village Farmers)',
    fpoFarmersCount: 54,
    district: 'Nashik',
    state: 'Maharashtra',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_consumer_1',
    name: 'Ananya Sharma',
    email: 'ananya.buyer@seedhamandi.in',
    phone: '+91 98111 22334',
    role: 'CONSUMER',
    passwordHash: 'consumer123',
    isEmailVerified: true,
    isPhoneVerified: true,
    village: 'Indiranagar',
    district: 'Bengaluru',
    state: 'Karnataka',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_logistics_1',
    name: 'KisanVahan Logistics (Ravi Kumar)',
    email: 'ravi.logistics@seedhamandi.in',
    phone: '+91 98990 77665',
    role: 'LOGISTICS',
    passwordHash: 'logistics123',
    isEmailVerified: true,
    isPhoneVerified: true,
    vehicleType: 'Refrigerated Tata 407 (3.5 Ton)',
    vehicleNumber: 'MH 12 QX 4902',
    district: 'Pune',
    state: 'Maharashtra',
    createdAt: new Date().toISOString(),
  },
];

const initialProducts: ProductDoc[] = [
  {
    id: 'prod_1',
    name: 'Fresh Nashik Red Onions (Direct Farm Lot)',
    category: 'Vegetables',
    quantity: 1200,
    unit: 'kg',
    price: 28,
    mandiBenchmarkPrice: 22,
    minOrderQty: 10,
    location: 'Dindori, Nashik',
    state: 'Maharashtra',
    harvestDate: 'Harvested yesterday',
    qualityGrade: 'Grade A Premium',
    image: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?auto=format&fit=crop&w=600&q=80',
    description: 'Directly harvested solar-cured red onions with tight skins and pungent aroma. No cold storage chemical inhibitors applied.',
    availability: true,
    farmerId: 'usr_farmer_1',
    farmerName: 'Ramesh Patel',
    farmerPhone: '+91 98234 11201',
    organicCertified: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_2',
    name: 'Devgad Alphonso Mangoes (GI Tagged)',
    category: 'Fruits',
    quantity: 450,
    unit: 'crates',
    price: 850,
    mandiBenchmarkPrice: 650,
    minOrderQty: 1,
    location: 'Devgad, Sindhudurg',
    state: 'Maharashtra',
    harvestDate: 'Fresh harvest (2 days ago)',
    qualityGrade: 'Grade A+ Export',
    image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80',
    description: 'Authentic GI-tagged Devgad Hapus tree-ripened with natural hay curing. Unmatched saffron pulp, rich fragrance, and sweet aroma.',
    availability: true,
    farmerId: 'usr_fpo_1',
    farmerName: 'Sahyadri Kisan Samriddhi FPO',
    farmerPhone: '+91 98765 43210',
    isFpoListed: true,
    fpoName: 'Sahyadri Kisan Samriddhi FPO',
    actualFarmerName: 'Santosh Sawant (Kokan Orchard)',
    organicCertified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_3',
    name: 'Sharbati Wheat (Sehore Golden Grain)',
    category: 'Grains',
    quantity: 3500,
    unit: 'kg',
    price: 44,
    mandiBenchmarkPrice: 36,
    minOrderQty: 25,
    location: 'Sehore, Bhopal',
    state: 'Madhya Pradesh',
    harvestDate: 'Current Rabi Season',
    qualityGrade: 'Grade A+ Export',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
    description: 'Certified heavy black soil Sharbati golden pearls. High gluten strength produces soft rotis that stay tender all day.',
    availability: true,
    farmerId: 'usr_fpo_1',
    farmerName: 'Sahyadri Kisan Samriddhi FPO',
    farmerPhone: '+91 98765 43210',
    isFpoListed: true,
    fpoName: 'Sahyadri Kisan Samriddhi FPO',
    actualFarmerName: 'Gopal Meena (Sehore Cluster)',
    organicCertified: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_4',
    name: 'Organic Vine Ripe Tomatoes (Polyhouse)',
    category: 'Vegetables',
    quantity: 800,
    unit: 'kg',
    price: 32,
    mandiBenchmarkPrice: 24,
    minOrderQty: 5,
    location: 'Baramati, Pune',
    state: 'Maharashtra',
    harvestDate: 'Harvested this morning',
    qualityGrade: 'Certified Organic',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
    description: 'Hydro-fertigation polyhouse plum red tomatoes. Rich lycopene content, firm pulp, ideal for cooking and fresh salads.',
    availability: true,
    farmerId: 'usr_farmer_1',
    farmerName: 'Ramesh Patel',
    farmerPhone: '+91 98234 11201',
    organicCertified: true,
    lowStockThreshold: 150,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_5',
    name: 'Mahabaleshwar Winter Strawberries (Farm Picked)',
    category: 'Fruits',
    quantity: 28,
    unit: 'crates',
    price: 320,
    mandiBenchmarkPrice: 260,
    minOrderQty: 2,
    location: 'Wai, Satara',
    state: 'Maharashtra',
    harvestDate: 'Harvested this dawn',
    qualityGrade: 'Grade A+ Export',
    image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80',
    description: 'Sweet, fragrant cold-pack strawberries picked directly from terraced red soil hills.',
    availability: true,
    farmerId: 'usr_farmer_1',
    farmerName: 'Ramesh Patel',
    farmerPhone: '+91 98234 11201',
    organicCertified: true,
    lowStockThreshold: 50,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_6',
    name: 'Wayanad Green Cardamom (8mm Bold)',
    category: 'Spices',
    quantity: 160,
    unit: 'kg',
    price: 2400,
    mandiBenchmarkPrice: 1950,
    minOrderQty: 1,
    location: 'Vythiri, Wayanad',
    state: 'Kerala',
    harvestDate: 'Sun-dried last week',
    qualityGrade: 'Grade A+ Export',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
    description: 'Hand-picked Extra Bold 8mm green cardamom pods from high-altitude shade-grown plantation in Western Ghats.',
    availability: true,
    farmerId: 'usr_fpo_1',
    farmerName: 'Sahyadri Kisan Samriddhi FPO',
    farmerPhone: '+91 98765 43210',
    isFpoListed: true,
    fpoName: 'Sahyadri Kisan Samriddhi FPO',
    actualFarmerName: 'Mathew Thomas (Wayanad Spice Coop)',
    organicCertified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_7',
    name: 'Desi Chana / Bengal Gram (Unpolished)',
    category: 'Pulses',
    quantity: 1800,
    unit: 'kg',
    price: 78,
    mandiBenchmarkPrice: 66,
    minOrderQty: 10,
    location: 'Gulbarga (Kalaburagi)',
    state: 'Karnataka',
    harvestDate: 'Dry harvested this month',
    qualityGrade: 'Farm Fresh Standard',
    image: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&q=80',
    description: 'Naturally sun-dried unpolished brown chickpeas. No chemical waxing, rich in dietary fiber and plant protein.',
    availability: true,
    farmerId: 'usr_farmer_1',
    farmerName: 'Ramesh Patel',
    farmerPhone: '+91 98234 11201',
    organicCertified: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_8',
    name: 'Himachal Royal Delicious Apples',
    category: 'Fruits',
    quantity: 950,
    unit: 'crates',
    price: 1350,
    mandiBenchmarkPrice: 1050,
    minOrderQty: 1,
    location: 'Kotgarh, Shimla',
    state: 'Himachal Pradesh',
    harvestDate: 'Mountain harvested',
    qualityGrade: 'Grade A Premium',
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80',
    description: 'Crisp, aromatic red apples grown at 7500 ft elevation with glacier water irrigation. Hand-graded for size and sweetness.',
    availability: true,
    farmerId: 'usr_fpo_1',
    farmerName: 'Sahyadri Kisan Samriddhi FPO',
    farmerPhone: '+91 98765 43210',
    isFpoListed: true,
    fpoName: 'Sahyadri Kisan Samriddhi FPO',
    actualFarmerName: 'Kunal Chauhan (Kotgarh Orchard)',
    organicCertified: false,
    createdAt: new Date().toISOString(),
  },

  ];

const initialOrders: OrderDoc[] = [
  {
    id: 'ord_1084',
    consumerId: 'usr_consumer_1',
    consumerName: 'Ananya Sharma',
    consumerPhone: '+91 98111 22334',
    shippingAddress: {
      street: '12th Main Road, 4th Cross, HAL 2nd Stage',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
    },
    items: [
      {
        productId: 'prod_1',
        name: 'Fresh Nashik Red Onions (Direct Farm Lot)',
        price: 28,
        quantity: 25,
        unit: 'kg',
        farmerId: 'usr_farmer_1',
        farmerName: 'Ramesh Patel',
        image: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?auto=format&fit=crop&w=600&q=80',
      },
      {
        productId: 'prod_4',
        name: 'Organic Vine Ripe Tomatoes (Polyhouse)',
        price: 32,
        quantity: 15,
        unit: 'kg',
        farmerId: 'usr_farmer_1',
        farmerName: 'Ramesh Patel',
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
      },
    ],
    itemsTotal: 1180,
    logisticsFee: 120,
    platformFee: 0,
    totalAmount: 1300,
    paymentMethod: 'UPI',
    paymentStatus: 'ESCROW_LOCKED',
    status: 'IN_TRANSIT',
    deliveryOtp: '741289',
    logisticsId: 'usr_logistics_1',
    logisticsName: 'KisanVahan Logistics (Ravi Kumar)',
    vehicleNumber: 'MH 12 QX 4902',
    estimatedDeliveryTime: 'Today by 4:30 PM',
    statusHistory: [
      {
        status: 'PLACED',
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        note: 'Order placed with payment held in Secure Escrow.',
      },
      {
        status: 'CONFIRMED',
        timestamp: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
        note: 'Farmer Ramesh Patel confirmed lot freshness and packing.',
      },
      {
        status: 'PICKED_UP',
        timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        note: 'Dispatched via KisanVahan cold logistics van MH 12 QX 4902.',
      },
      {
        status: 'IN_TRANSIT',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        note: 'Out for final delivery. Near Outer Ring Road Hub.',
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: 'ord_1079',
    consumerId: 'usr_consumer_1',
    consumerName: 'Ananya Sharma',
    consumerPhone: '+91 98111 22334',
    shippingAddress: {
      street: '12th Main Road, 4th Cross, HAL 2nd Stage',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
    },
    items: [
      {
        productId: 'prod_1',
        name: 'Fresh Nashik Red Onions (Direct Farm Lot)',
        price: 28,
        quantity: 25,
        unit: 'kg',
        farmerId: 'usr_farmer_1',
        farmerName: 'Ramesh Patel',
        image: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?auto=format&fit=crop&w=600&q=80',
      },
      {
        productId: 'prod_2',
        name: 'Sehore Sharbati Gehu / Wheat (Direct Farm Harvest)',
        price: 44,
        quantity: 30,
        unit: 'kg',
        farmerId: 'usr_farmer_1',
        farmerName: 'Ramesh Patel',
        image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
      },
    ],
    itemsTotal: 2020,
    logisticsFee: 160,
    platformFee: 0,
    totalAmount: 2180,
    paymentMethod: 'UPI',
    paymentStatus: 'RELEASED_TO_FARMER',
    status: 'DELIVERED',
    deliveryOtp: '482910',
    logisticsId: 'usr_logistics_1',
    logisticsName: 'KisanVahan Logistics (Ravi Kumar)',
    vehicleNumber: 'MH 12 QX 4902',
    estimatedDeliveryTime: 'Delivered 2 days ago',
    statusHistory: [
      {
        status: 'PLACED',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
        note: 'Order placed with payment held in Secure Escrow.',
      },
      {
        status: 'CONFIRMED',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        note: 'Farmer Ramesh Patel confirmed harvest availability.',
      },
      {
        status: 'PICKED_UP',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 44).toISOString(),
        note: 'Loaded onto KisanVahan cold logistics vehicle.',
      },
      {
        status: 'DELIVERED',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
        note: 'Doorstep delivered. Verified by Consumer with OTP 482910. Escrow released to Ramesh Patel.',
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
  },
  {
    id: 'ord_1072',
    consumerId: 'usr_consumer_1',
    consumerName: 'Ananya Sharma',
    consumerPhone: '+91 98111 22334',
    shippingAddress: {
      street: '12th Main Road, 4th Cross, HAL 2nd Stage',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
    },
    items: [
      {
        productId: 'prod_6',
        name: 'Wayanad Green Cardamom (8mm Bold)',
        price: 2400,
        quantity: 1,
        unit: 'kg',
        farmerId: 'usr_fpo_1',
        farmerName: 'Sahyadri Kisan Samriddhi FPO',
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
      },
      {
        productId: 'prod_8',
        name: 'Himachal Royal Delicious Apples',
        price: 1350,
        quantity: 2,
        unit: 'crates',
        farmerId: 'usr_fpo_1',
        farmerName: 'Sahyadri Kisan Samriddhi FPO',
        image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80',
      },
    ],
    itemsTotal: 5100,
    logisticsFee: 240,
    platformFee: 0,
    totalAmount: 5340,
    paymentMethod: 'UPI',
    paymentStatus: 'RELEASED_TO_FARMER',
    status: 'DELIVERED',
    deliveryOtp: '619283',
    logisticsId: 'usr_logistics_1',
    logisticsName: 'KisanVahan Logistics (Ravi Kumar)',
    vehicleNumber: 'MH 12 QX 4902',
    estimatedDeliveryTime: 'Delivered 4 days ago',
    statusHistory: [
      {
        status: 'PLACED',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 98).toISOString(),
        note: 'Order placed with payment held in Secure Escrow.',
      },
      {
        status: 'CONFIRMED',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
        note: 'FPO Sahyadri Kisan Samriddhi packed export grade boxes.',
      },
      {
        status: 'PICKED_UP',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 90).toISOString(),
        note: 'Reefer Van picked up fragrant spice & apple crates.',
      },
      {
        status: 'DELIVERED',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 85).toISOString(),
        note: 'Doorstep delivered. Verified by Consumer with OTP 619283. Escrow released to FPO account.',
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 98).toISOString(),
  },
  {
    id: 'ord_1065',
    consumerId: 'usr_consumer_1',
    consumerName: 'Ananya Sharma',
    consumerPhone: '+91 98111 22334',
    shippingAddress: {
      street: '12th Main Road, 4th Cross, HAL 2nd Stage',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
    },
    items: [
      {
        productId: 'prod_7',
        name: 'Desi Chana / Bengal Gram (Unpolished)',
        price: 78,
        quantity: 40,
        unit: 'kg',
        farmerId: 'usr_farmer_1',
        farmerName: 'Ramesh Patel',
        image: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&q=80',
      },
      {
        productId: 'prod_4',
        name: 'Organic Vine Ripe Tomatoes (Polyhouse)',
        price: 32,
        quantity: 10,
        unit: 'kg',
        farmerId: 'usr_farmer_1',
        farmerName: 'Ramesh Patel',
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
      },
    ],
    itemsTotal: 3440,
    logisticsFee: 190,
    platformFee: 0,
    totalAmount: 3630,
    paymentMethod: 'ESCROW_COD',
    paymentStatus: 'RELEASED_TO_FARMER',
    status: 'DELIVERED',
    deliveryOtp: '839102',
    logisticsId: 'usr_logistics_1',
    logisticsName: 'KisanVahan Logistics (Ravi Kumar)',
    vehicleNumber: 'MH 12 QX 4902',
    estimatedDeliveryTime: 'Delivered 7 days ago',
    statusHistory: [
      {
        status: 'PLACED',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 170).toISOString(),
        note: 'Order placed with COD Escrow Lock.',
      },
      {
        status: 'CONFIRMED',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 168).toISOString(),
        note: 'Harvest sacks packed.',
      },
      {
        status: 'DELIVERED',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 155).toISOString(),
        note: 'Doorstep delivered. Verified by Consumer with OTP 839102. Escrow disbursed.',
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 170).toISOString(),
  },
];

// Unified In-Memory Database with optional MongoDB Atlas sync
class DatabaseStore {
  public users: UserDoc[] = [...initialUsers];
  public products: ProductDoc[] = [...initialProducts];
  public orders: OrderDoc[] = [...initialOrders];
  public otps: OtpDoc[] = [];
  public notifications: NotificationDoc[] = [
    {
      id: 'notif_1',
      recipientRole: 'FARMER',
      recipientUserId: 'usr_farmer_1',
      orderId: 'ord_9102',
      title: 'New Harvest Order Received!',
      message: 'Ananya Sharma placed an order for Nashik Red Onions (10 kg). Please confirm harvest availability and crate packing.',
      type: 'NEW_ORDER',
      vehicleTypeRequired: 'BIKE_SCOOTY',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'notif_2',
      recipientRole: 'LOGISTICS',
      orderId: 'ord_9102',
      title: 'New Bhubaneswar Dispatch Offer: Mancheswar to Patia',
      message: 'Fresh consignment ready for pickup at Mancheswar Agro Depot. Recommended Vehicle: Bike / Scooty Thermal Bag. Freight: ₹80.',
      type: 'DISPATCH_OFFER',
      vehicleTypeRequired: 'BIKE_SCOOTY',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'notif_3',
      recipientRole: 'LOGISTICS',
      title: 'Bulk Farm Pickup Available (Tractor / Mini Truck)',
      message: 'Khordha Agro Cooperative has 600 kg Sharbati Wheat & Grains ready for transit to Saheed Nagar Depot. Freight: ₹480.',
      type: 'DISPATCH_OFFER',
      vehicleTypeRequired: 'TRACTOR',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ];
  public isConnectedToMongo = false;
  public mongoConnectionStatus = 'Running in Resilient In-Memory & Persisted Mode';

  constructor() {
    this.tryConnectMongo();
  }

  private async tryConnectMongo() {
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri && mongoUri.trim().length > 0) {
      try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
        this.isConnectedToMongo = true;
        this.mongoConnectionStatus = 'Connected to MongoDB Atlas';
        console.log('Successfully connected to MongoDB Atlas for SeedhaMandi!');
      } catch (err: any) {
        console.info('\n--- MONGODB ATLAS CONNECTION FALLBACK ---');
        console.info('Could not connect to MongoDB Atlas. Safely falling back to the embedded document store.');
        console.info('Reason:', err.message);
        if (err.message.includes('IP that isn\'t whitelisted') || err.message.includes('network')) {
          console.info('ACTION REQUIRED to connect to your live database:');
          console.info('1. Go to your MongoDB Atlas Dashboard -> Network Access');
          console.info('2. Click "Add IP Address" -> "ALLOW ACCESS FROM ANYWHERE" (0.0.0.0/0)');
          console.info('3. Confirm and wait 2-3 minutes.');
        }
        console.info('-----------------------------------------\n');
        this.mongoConnectionStatus = `Atlas unreachable (${err.message}). Using Resilient Document Store.`;
      }
    } else {
      this.mongoConnectionStatus = 'Active Resilient Document Engine (Set MONGODB_URI to bind external Atlas cluster)';
    }
  }

  // User methods
  getUserById(id: string) {
    return this.users.find(u => u.id === id);
  }

  getUserByEmail(email: string) {
    if (!email || !email.trim()) return undefined;
    return this.users.find(u => u.email && u.email.toLowerCase() === email.trim().toLowerCase());
  }

  getUserByPhone(phone: string) {
    if (!phone || !phone.trim()) return undefined;
    const clean = phone.replace(/\D/g, '').slice(-10);
    return this.users.find(u => {
      if (!u.phone || !u.phone.trim()) return false;
      const uClean = u.phone.replace(/\D/g, '').slice(-10);
      return (clean && uClean === clean) || u.phone.trim() === phone.trim();
    });
  }

  addUser(user: UserDoc) {
    this.users.unshift(user);
    return user;
  }

  updateUser(id: string, updates: Partial<UserDoc>) {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.users[idx] = { ...this.users[idx], ...updates };
      return this.users[idx];
    }
    return null;
  }

  // Product methods
  getProducts(filters?: { category?: string; search?: string; farmerId?: string; state?: string }) {
    let list = [...this.products];
    if (filters?.category && filters.category !== 'All') {
      list = list.filter(p => p.category.toLowerCase() === filters.category?.toLowerCase());
    }
    if (filters?.farmerId) {
      list = list.filter(p => p.farmerId === filters.farmerId);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.farmerName.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    return list;
  }

  getProductById(id: string) {
    return this.products.find(p => p.id === id);
  }

  addProduct(product: ProductDoc) {
    this.products.unshift(product);
    return product;
  }

  updateProduct(id: string, updates: Partial<ProductDoc>) {
    const idx = this.products.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.products[idx] = { ...this.products[idx], ...updates };
      return this.products[idx];
    }
    return null;
  }

  deleteProduct(id: string) {
    const idx = this.products.findIndex(p => p.id === id);
    if (idx !== -1) {
      const removed = this.products.splice(idx, 1);
      return removed[0];
    }
    return null;
  }

  // Order methods
  getOrders(filter?: { consumerId?: string; farmerId?: string; logisticsId?: string }) {
    let list = [...this.orders];
    if (filter?.consumerId) {
      list = list.filter(o => o.consumerId === filter.consumerId);
    }
    if (filter?.farmerId) {
      list = list.filter(o => o.items.some(item => item.farmerId === filter.farmerId));
    }
    if (filter?.logisticsId) {
      list = list.filter(o => o.logisticsId === filter.logisticsId || !o.logisticsId);
    }
    return list;
  }

  getOrderById(id: string) {
    return this.orders.find(o => o.id === id);
  }

  addOrder(order: OrderDoc) {
    this.orders.unshift(order);
    return order;
  }

  updateOrder(id: string, updates: Partial<OrderDoc>) {
    const idx = this.orders.findIndex(o => o.id === id);
    if (idx !== -1) {
      this.orders[idx] = { ...this.orders[idx], ...updates };
      return this.orders[idx];
    }
    return null;
  }

  // OTP methods
  saveOtp(otp: OtpDoc) {
    // Invalidate prior OTPs for same identifier
    this.otps = this.otps.filter(o => o.identifier !== otp.identifier || o.type !== otp.type);
    this.otps.push(otp);
  }

  getValidOtp(identifier: string, type: 'EMAIL' | 'SMS' | 'PASSWORD_RESET') {
    const now = Date.now();
    return this.otps.find(o => o.identifier === identifier && o.type === type && o.expiresAt > now && !o.verified);
  }

  markOtpVerified(id: string) {
    const o = this.otps.find(item => item.id === id);
    if (o) o.verified = true;
  }

  // Notification methods
  getNotifications(filter?: { recipientRole?: string; recipientUserId?: string }) {
    let list = [...this.notifications];
    if (filter?.recipientRole) {
      list = list.filter(n => n.recipientRole === filter.recipientRole || n.recipientRole === 'ALL');
    }
    if (filter?.recipientUserId) {
      list = list.filter(n => !n.recipientUserId || n.recipientUserId === filter.recipientUserId);
    }
    return list;
  }

  addNotification(notif: NotificationDoc) {
    this.notifications.unshift(notif);
    return notif;
  }

  markNotificationAsRead(id: string) {
    const n = this.notifications.find(item => item.id === id);
    if (n) n.isRead = true;
    return n;
  }

  // Bulk RFQ Methods
  public rfqs: RfqDoc[] = [
    {
      id: 'rfq_1',
      buyerName: 'Chef Sanjeev Panda',
      organization: 'Kalinga Star Grand Hotel & Convention',
      buyerPhone: '+91 94370 22891',
      cropName: 'Nashik Red Onions',
      category: 'Vegetables',
      quantityRequired: 500,
      unit: 'kg',
      targetPricePerUnit: 26,
      deliveryLocation: 'Janpath, Ashok Nagar, Bhubaneswar',
      requiredByDate: '2026-09-22',
      status: 'OPEN',
      vehicleTypeRequired: 'MINI_TRUCK',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'rfq_2',
      buyerName: 'Purchase Director Mohanty',
      organization: 'KIIT University Mega Hostels & Messes',
      buyerPhone: '+91 99371 44502',
      cropName: 'Sharbati Wheat (Sehore)',
      category: 'Grains',
      quantityRequired: 2000,
      unit: 'kg',
      targetPricePerUnit: 42,
      deliveryLocation: 'Campus 6 Central Mess, Patia, Bhubaneswar',
      requiredByDate: '2026-09-28',
      status: 'OPEN',
      vehicleTypeRequired: 'TRACTOR',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'rfq_3',
      buyerName: 'Priyanka Das',
      organization: 'Utkal Organics Retail Chain',
      buyerPhone: '+91 98610 88219',
      cropName: 'Vine Ripe Plum Tomatoes',
      category: 'Vegetables',
      quantityRequired: 350,
      unit: 'kg',
      targetPricePerUnit: 29,
      deliveryLocation: 'Saheed Nagar Daily Market, Bhubaneswar',
      requiredByDate: '2026-09-20',
      status: 'MATCHED',
      matchedFarmerOrFpo: 'Ramesh Patel (Baramati Agro)',
      vehicleTypeRequired: 'MINI_TRUCK',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

  getRfqs(filter?: { status?: string }) {
    let list = [...this.rfqs];
    if (filter?.status) {
      list = list.filter(r => r.status === filter.status);
    }
    return list;
  }

  getRfqById(id: string) {
    return this.rfqs.find(r => r.id === id);
  }

  addRfq(rfq: RfqDoc) {
    this.rfqs.unshift(rfq);
    return rfq;
  }

  updateRfq(id: string, updates: Partial<RfqDoc>) {
    const idx = this.rfqs.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.rfqs[idx] = { ...this.rfqs[idx], ...updates };
      return this.rfqs[idx];
    }
    return null;
  }
}

export const db = new DatabaseStore();
