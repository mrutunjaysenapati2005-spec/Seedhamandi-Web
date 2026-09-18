import { Product, Order, DemandInsightsData, User, BulkRfq, CropForecastResult, RouteOptimizationResult, LogisticsPartner, AppNotification } from '../types';

let cachedOrders: Order[] = [];
let cachedProducts: Product[] = [];

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('seedhamandi_token') || 'demo_token_CONSUMER';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function safeFetch<T>(
  url: string,
  options?: RequestInit,
  fallbackValue?: T,
  retries = 1
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        try {
          const json = JSON.parse(text);
          if (attempt === retries && fallbackValue !== undefined) {
            return fallbackValue;
          }
          return json as T;
        } catch {
          if (attempt === retries && fallbackValue !== undefined) {
            return fallbackValue;
          }
        }
      } else {
        const data = await res.json();
        return data as T;
      }
    } catch (err) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 400));
        continue;
      }
      if (fallbackValue !== undefined) {
        return fallbackValue;
      }
      throw err;
    }
  }
  return fallbackValue as T;
}

export const api = {
  // Auth & OTP
  async register(data: any) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async login(identifier: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    return res.json();
  },

  async loginWithOtp(identifier: string, otp: string) {
    const res = await fetch('/api/auth/login-with-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, otp }),
    });
    return res.json();
  },

  async sendEmailOtp(email: string) {
    const res = await fetch('/api/auth/send-email-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  async verifyEmailOtp(email: string, otp: string) {
    const res = await fetch('/api/auth/verify-email-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    return res.json();
  },

  async sendSmsOtp(phone: string) {
    const res = await fetch('/api/auth/send-sms-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    return res.json();
  },

  async verifySmsOtp(phone: string, otp: string) {
    const res = await fetch('/api/auth/verify-sms-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    });
    return res.json();
  },

  async getMe(): Promise<{ user: User } | { error: string }> {
    const res = await fetch('/api/auth/me', {
      headers: getHeaders(),
    });
    return res.json();
  },

  // Products
  async getProducts(params?: { category?: string; search?: string; farmerId?: string }): Promise<{ products: Product[] }> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.farmerId) query.set('farmerId', params.farmerId);

    const res = await fetch(`/api/products?${query.toString()}`);
    return res.json();
  },

  async getProductById(id: string): Promise<{ product: Product }> {
    const res = await fetch(`/api/products/${id}`);
    return res.json();
  },

  async createProduct(productData: Partial<Product>) {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(productData),
    });
    return res.json();
  },

  async updateProduct(id: string, productData: Partial<Product>) {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(productData),
    });
    return res.json();
  },

  async deleteProduct(id: string) {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },

  // Orders
  async createOrder(orderData: { items: any[]; shippingAddress: any; paymentMethod: string; isBulkOrder?: boolean; deliveryNotes?: string }) {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(orderData),
    });
    return res.json();
  },

  async acceptDelivery(orderId: string) {
    const res = await fetch(`/api/orders/${orderId}/accept-delivery`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return res.json();
  },

  async rejectDelivery(orderId: string) {
    const res = await fetch(`/api/orders/${orderId}/reject-delivery`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return res.json();
  },

  // Notifications
  async getNotifications() {
    return safeFetch<{ count: number; notifications: any[] }>(
      '/api/notifications',
      { headers: getHeaders() },
      { count: 0, notifications: [] }
    );
  },

  async markNotificationRead(id: string) {
    return safeFetch<{ message: string }>(
      `/api/notifications/${id}/read`,
      {
        method: 'POST',
        headers: getHeaders(),
      },
      { message: 'Marked' }
    );
  },

  async getOrders(): Promise<{ orders: Order[] }> {
    const data = await safeFetch<{ orders: Order[] }>(
      '/api/orders',
      { headers: getHeaders() },
      { orders: cachedOrders }
    );
    if (data && Array.isArray(data.orders) && data.orders.length > 0) {
      cachedOrders = data.orders;
    }
    return data || { orders: cachedOrders };
  },

  async getOrderById(id: string): Promise<{ order: Order } | { error: string }> {
    return safeFetch<{ order: Order } | { error: string }>(
      `/api/orders/${id}`,
      { headers: getHeaders() },
      { error: 'Order temporarily unavailable' }
    );
  },

  async updateOrderStatus(
    id: string,
    status: string,
    note?: string,
    logisticsId?: string,
    vehicleNumber?: string,
    rejectionReason?: string
  ) {
    return safeFetch<{ message: string; order?: Order }>(
      `/api/orders/${id}/status`,
      {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status, note, logisticsId, vehicleNumber, rejectionReason }),
      },
      { message: 'Status updated' }
    );
  },

  async getLogisticsPartners(): Promise<{ count: number; partners: LogisticsPartner[] }> {
    return safeFetch<{ count: number; partners: LogisticsPartner[] }>(
      '/api/logistics-partners',
      { headers: getHeaders() },
      {
        count: 3,
        partners: [
          {
            id: 'usr_logistics_1',
            name: 'KisanVahan Cold Logistics (Ravi Kumar)',
            phone: '+91 98990 77665',
            vehicleType: 'Refrigerated Cold Van (4°C Reefer)',
            vehicleNumber: 'MH 12 QX 4902',
            district: 'Pune / Baramati',
            rating: 4.9,
            completedTrips: 342,
            etaMinutes: 15,
            capacityKg: 1500,
            freightEstimate: 120,
            specialty: 'Perishable fruits, leafy vegetables & export lots',
          },
          {
            id: 'usr_logistics_2',
            name: 'Gramin Agro Cargo (Suresh Yadav)',
            phone: '+91 98220 54321',
            vehicleType: 'Tata Ace Mini Truck (1.5 Ton)',
            vehicleNumber: 'MH 14 TR 3109',
            district: 'Baramati Rural Hub',
            rating: 4.8,
            completedTrips: 218,
            etaMinutes: 10,
            capacityKg: 1200,
            freightEstimate: 100,
            specialty: 'Grain sacks, onion crates & root vegetables',
          },
          {
            id: 'usr_logistics_3',
            name: 'SpeedKisan Rural Express (Amit Deshmukh)',
            phone: '+91 98450 99887',
            vehicleType: 'Mahindra Bolero Agro Pickup (2 Ton)',
            vehicleNumber: 'MH 12 BK 9021',
            district: 'Pune Outer Ring',
            rating: 4.7,
            completedTrips: 189,
            etaMinutes: 25,
            capacityKg: 2000,
            freightEstimate: 140,
            specialty: 'Heavy bulk harvest & multi-village consolidation',
          },
        ],
      }
    );
  },

  async simulateCustomerOrder(payload?: {
    productId?: string;
    quantity?: number;
    customerName?: string;
    customerCity?: string;
  }): Promise<{ message: string; order: Order; notification: AppNotification }> {
    const res = await fetch('/api/orders/simulate-customer-order', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload || {}),
    });
    return res.json();
  },

  // Earnings
  async getFarmerEarnings() {
    return safeFetch(
      '/api/farmer/earnings',
      { headers: getHeaders() },
      { summary: { totalEarnings: 45600, totalOrders: 18 } }
    );
  },

  async getLogisticsEarnings() {
    return safeFetch(
      '/api/logistics/earnings',
      { headers: getHeaders() },
      { summary: { totalEarnings: 14200, totalDeliveries: 34 } }
    );
  },

  // AI SeedhaMitra
  async askAI(message: string, history?: Array<{ sender: 'user' | 'bot'; text: string }>): Promise<{ reply: string }> {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message, history }),
    });
    return res.json();
  },

  async getDemandInsights(): Promise<DemandInsightsData> {
    const res = await fetch('/api/ai/demand-insights');
    return res.json();
  },

  async getCropForecast(crop: string, region?: string): Promise<CropForecastResult> {
    const res = await fetch('/api/ai/forecast', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ crop, region }),
    });
    return res.json();
  },

  async optimizeRoute(stops: any[], vehicleType: string): Promise<RouteOptimizationResult> {
    const res = await fetch('/api/ai/optimize-route', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ stops, vehicleType }),
    });
    return res.json();
  },

  // Bulk RFQs (Request for Quotation)
  async getRfqs(status?: string): Promise<{ count: number; rfqs: BulkRfq[] }> {
    const url = status ? `/api/rfqs?status=${encodeURIComponent(status)}` : '/api/rfqs';
    const res = await fetch(url);
    return res.json();
  },

  async createRfq(data: any): Promise<{ message: string; rfq: BulkRfq }> {
    const res = await fetch('/api/rfqs', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async matchRfq(id: string): Promise<{ message: string; rfq: BulkRfq }> {
    const res = await fetch(`/api/rfqs/${id}/match`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return res.json();
  },

  // DB Status
  async getDbStatus() {
    const res = await fetch('/api/db/status');
    return res.json();
  },
};
