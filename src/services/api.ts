import { Product, Order, DemandInsightsData, User, BulkRfq, CropForecastResult, RouteOptimizationResult } from '../types';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('seedhamandi_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
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
    const res = await fetch('/api/notifications', {
      headers: getHeaders(),
    });
    return res.json();
  },

  async markNotificationRead(id: string) {
    const res = await fetch(`/api/notifications/${id}/read`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return res.json();
  },

  async getOrders(): Promise<{ orders: Order[] }> {
    const res = await fetch('/api/orders', {
      headers: getHeaders(),
    });
    return res.json();
  },

  async getOrderById(id: string): Promise<{ order: Order }> {
    const res = await fetch(`/api/orders/${id}`);
    return res.json();
  },

  async updateOrderStatus(id: string, status: string, note?: string, logisticsId?: string, vehicleNumber?: string) {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status, note, logisticsId, vehicleNumber }),
    });
    return res.json();
  },

  // Earnings
  async getFarmerEarnings() {
    const res = await fetch('/api/farmer/earnings', {
      headers: getHeaders(),
    });
    return res.json();
  },

  async getLogisticsEarnings() {
    const res = await fetch('/api/logistics/earnings', {
      headers: getHeaders(),
    });
    return res.json();
  },

  // AI SeedhaMitra
  async askAI(message: string): Promise<{ reply: string }> {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message }),
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
