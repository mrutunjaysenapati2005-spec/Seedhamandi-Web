import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db, UserDoc, ProductDoc, OrderDoc } from './server/db.js';
import { createJwtToken, verifyJwtToken, sendEmailOtp, sendSmsOtp, verifyOtp, hashString } from './server/auth.js';
import { askSeedhaMitra, generateCropForecast, optimizeRuralRoute } from './server/ai.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple Auth Middleware
function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }
  const token = authHeader.split(' ')[1];
  const decoded = verifyJwtToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
  req.user = decoded;
  next();
}

// Optional Auth Middleware
function optionalAuthMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyJwtToken(token);
    if (decoded) req.user = decoded;
  }
  next();
}

/* ========================================================================== */
/*                             API ROUTES                                     */
/* ========================================================================== */

// 1. Health & Database Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'SeedhaMandi',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: {
      connectedToMongo: db.isConnectedToMongo,
      statusMessage: db.mongoConnectionStatus,
      productsCount: db.products.length,
      usersCount: db.users.length,
      ordersCount: db.orders.length,
    },
    aiAgent: {
      name: 'SeedhaMitra',
      geminiConfigured: !!process.env.GEMINI_API_KEY,
    },
  });
});

app.get('/api/db/status', (req, res) => {
  res.json({
    mongoUriConfigured: !!process.env.MONGODB_URI,
    isConnectedToMongo: db.isConnectedToMongo,
    statusMessage: db.mongoConnectionStatus,
    stats: {
      users: db.users.length,
      products: db.products.length,
      orders: db.orders.length,
    },
  });
});

// 2. Authentication & OTP Routes
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, phone, role, password, village, district, state, fpoName, fpoFarmersCount, vehicleType, vehicleNumber } = req.body;

    const trimmedEmail = email ? String(email).trim().toLowerCase() : '';
    const trimmedPhone = phone ? String(phone).trim() : '';

    if (!name || (!trimmedEmail && !trimmedPhone) || !password || !role) {
      return res.status(400).json({ error: 'Name, role, password, and at least one contact method (email or mobile phone) are required.' });
    }

    if (trimmedEmail) {
      const existingEmail = db.getUserByEmail(trimmedEmail);
      if (existingEmail) {
        return res.status(400).json({ error: 'An account with this email already exists.' });
      }
    }

    if (trimmedPhone) {
      const existingPhone = db.getUserByPhone(trimmedPhone);
      if (existingPhone) {
        return res.status(400).json({ error: 'An account with this mobile phone already exists.' });
      }
    }

    const newUser: UserDoc = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      email: trimmedEmail,
      phone: trimmedPhone,
      role,
      passwordHash: hashString(password),
      isEmailVerified: false,
      isPhoneVerified: false,
      village,
      district,
      state,
      fpoName,
      fpoFarmersCount: fpoFarmersCount ? Number(fpoFarmersCount) : undefined,
      vehicleType,
      vehicleNumber,
      createdAt: new Date().toISOString(),
    };

    db.addUser(newUser);

    const token = createJwtToken(newUser);
    res.status(201).json({
      message: 'Registration initiated. Please verify your account.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        isEmailVerified: newUser.isEmailVerified,
        isPhoneVerified: newUser.isPhoneVerified,
      },
      token,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

app.post('/api/auth/send-email-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email address is required.' });
    const result = await sendEmailOtp(email);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/verify-email-otp', (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP code are required.' });

    const result = verifyOtp(email, 'EMAIL', otp);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    const user = db.getUserByEmail(email);
    if (user) {
      db.updateUser(user.id, { isEmailVerified: true });
    }

    res.json({ success: true, message: 'Email verified successfully!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/send-sms-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Mobile phone number is required.' });
    const result = await sendSmsOtp(phone);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/verify-sms-otp', (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: 'Mobile phone and OTP code are required.' });

    const result = verifyOtp(phone, 'SMS', otp);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    const user = db.getUserByPhone(phone);
    if (user) {
      db.updateUser(user.id, { isPhoneVerified: true });
    }

    res.json({ success: true, message: 'Mobile SMS OTP verified successfully!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { identifier, password } = req.body; // email or phone
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier (email or mobile) and password are required.' });
    }

    const user = identifier.includes('@')
      ? db.getUserByEmail(identifier)
      : db.getUserByPhone(identifier);

    if (!user) {
      return res.status(401).json({ error: 'No account found with this identifier.' });
    }

    // Match hashed password or initial demo passwords
    const hashed = hashString(password);
    if (user.passwordHash !== password && user.passwordHash !== hashed) {
      return res.status(401).json({ error: 'Invalid password. Please check and try again.' });
    }

    const token = createJwtToken(user);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        village: user.village,
        district: user.district,
        state: user.state,
        fpoName: user.fpoName,
        fpoFarmersCount: user.fpoFarmersCount,
        vehicleType: user.vehicleType,
        vehicleNumber: user.vehicleNumber,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login-with-otp', (req, res) => {
  try {
    const { identifier, otp } = req.body;
    if (!identifier || !otp) {
      return res.status(400).json({ error: 'Identifier (email or mobile) and OTP are required.' });
    }

    const trimmed = identifier.trim();
    const isEmail = trimmed.includes('@');
    const otpResult = verifyOtp(trimmed, isEmail ? 'EMAIL' : 'SMS', otp);

    if (!otpResult.success) {
      return res.status(400).json({ error: otpResult.message });
    }

    const user = isEmail ? db.getUserByEmail(trimmed) : db.getUserByPhone(trimmed);
    if (!user) {
      return res.status(404).json({ error: 'No account found with this ' + (isEmail ? 'email address' : 'mobile number') + '.' });
    }

    if (isEmail) {
      db.updateUser(user.id, { isEmailVerified: true });
    } else {
      db.updateUser(user.id, { isPhoneVerified: true });
    }

    const token = createJwtToken(user);
    res.json({
      message: 'Login successful via OTP',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        village: user.village,
        district: user.district,
        state: user.state,
        fpoName: user.fpoName,
        fpoFarmersCount: user.fpoFarmersCount,
        vehicleType: user.vehicleType,
        vehicleNumber: user.vehicleNumber,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authMiddleware, (req: any, res) => {
  const user = db.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User profile not found.' });

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      village: user.village,
      district: user.district,
      state: user.state,
      fpoName: user.fpoName,
      fpoFarmersCount: user.fpoFarmersCount,
      vehicleType: user.vehicleType,
      vehicleNumber: user.vehicleNumber,
      bankAccount: user.bankAccount,
    },
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// 3. Products & Marketplace Routes
app.get('/api/products', (req, res) => {
  const { category, search, farmerId, state } = req.query as any;
  const products = db.getProducts({ category, search, farmerId, state });
  res.json({
    count: products.length,
    products,
  });
});

app.get('/api/products/:id', (req, res) => {
  const product = db.getProductById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json({ product });
});

app.post('/api/products', authMiddleware, (req: any, res) => {
  try {
    const { name, category, quantity, unit, price, minOrderQty, location, state, harvestDate, qualityGrade, image, description, isFpoListed, fpoName, actualFarmerName, organicCertified } = req.body;

    if (!name || !category || !quantity || !price) {
      return res.status(400).json({ error: 'Name, category, quantity, and price are required.' });
    }

    const user = db.getUserById(req.user.id);

    const newProduct: ProductDoc = {
      id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      category,
      quantity: Number(quantity),
      unit: unit || 'kg',
      price: Number(price),
      mandiBenchmarkPrice: Math.round(Number(price) * 0.78), // benchmark representation
      minOrderQty: minOrderQty ? Number(minOrderQty) : 1,
      location: location || user?.district || 'Direct Farm',
      state: state || user?.state || 'Maharashtra',
      harvestDate: harvestDate || 'Today',
      qualityGrade: qualityGrade || 'Grade A Premium',
      image: image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
      description: description || 'Fresh farm harvest direct from grower.',
      availability: true,
      farmerId: req.user.id,
      farmerName: user?.name || 'Verified Farmer',
      farmerPhone: user?.phone || '+91 98000 00000',
      isFpoListed: !!isFpoListed || user?.role === 'FPO_REP',
      fpoName: fpoName || user?.fpoName,
      actualFarmerName: actualFarmerName,
      organicCertified: !!organicCertified,
      createdAt: new Date().toISOString(),
    };

    db.addProduct(newProduct);
    res.status(201).json({ message: 'Product listed successfully on SeedhaMandi.', product: newProduct });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', authMiddleware, (req: any, res) => {
  const product = db.getProductById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  const updated = db.updateProduct(req.params.id, req.body);
  res.json({ message: 'Product updated successfully', product: updated });
});

app.delete('/api/products/:id', authMiddleware, (req: any, res) => {
  const removed = db.deleteProduct(req.params.id);
  if (!removed) return res.status(404).json({ error: 'Product not found.' });
  res.json({ message: 'Product removed from marketplace', product: removed });
});

// 4. Orders & Payments Routes
app.post('/api/orders', authMiddleware, (req: any, res) => {
  try {
    const { items, shippingAddress, paymentMethod, isBulkOrder, deliveryNotes } = req.body;

    if (!items || !items.length || !shippingAddress) {
      return res.status(400).json({ error: 'Order items and delivery address are required.' });
    }

    const user = db.getUserById(req.user.id);
    let itemsTotal = 0;
    let totalWeight = 0;
    let hasPerishable = false;

    const populatedItems = items.map((it: any) => {
      const prod = db.getProductById(it.productId);
      const price = prod ? prod.price : it.price || 50;
      const subtotal = price * it.quantity;
      itemsTotal += subtotal;
      totalWeight += Number(it.quantity) || 1;

      if (prod && (prod.category === 'Fruits' || prod.category === 'Vegetables' || prod.category === 'Dairy')) {
        hasPerishable = true;
      }

      // Reduce stock
      if (prod && prod.quantity >= it.quantity) {
        const remainingQty = prod.quantity - it.quantity;
        db.updateProduct(prod.id, { quantity: remainingQty });

        const threshold = prod.lowStockThreshold !== undefined ? prod.lowStockThreshold : 40;
        if (remainingQty <= threshold) {
          db.addNotification({
            id: 'notif_low_' + Date.now() + '_' + prod.id,
            recipientRole: 'FARMER',
            recipientUserId: prod.farmerId,
            title: `⚠️ Low Stock Alert: ${prod.name}`,
            message: `Inventory for ${prod.name} has dropped to ${remainingQty} ${prod.unit} (below safety threshold of ${threshold} ${prod.unit}). Please restock or plan harvesting to prevent stockout!`,
            type: 'LOW_STOCK',
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        }
      }

      return {
        productId: it.productId,
        name: prod ? prod.name : it.name,
        price,
        quantity: it.quantity,
        unit: prod ? prod.unit : 'kg',
        farmerId: prod ? prod.farmerId : 'usr_farmer_1',
        farmerName: prod ? prod.farmerName : 'Ramesh Patel',
        image: prod ? prod.image : '',
      };
    });

    const isBulk = !!isBulkOrder || totalWeight >= 150;
    const bulkDiscount = isBulk ? Math.round(itemsTotal * 0.08) : 0; // 8% wholesale volume discount
    const finalItemsTotal = Math.max(0, itemsTotal - bulkDiscount);

    // Determine Required Vehicle Type
    let vehicleTypeRequired: 'BIKE_SCOOTY' | 'MINI_TRUCK' | 'TRACTOR' | 'REEFER_VAN' = 'BIKE_SCOOTY';
    let logisticsFee = 70;

    if (isBulk || totalWeight >= 450) {
      vehicleTypeRequired = 'TRACTOR'; // Tractor / Agro Trolley for rural heavy lots
      logisticsFee = 420;
    } else if (totalWeight >= 40) {
      vehicleTypeRequired = 'MINI_TRUCK'; // Tata Ace / Mahindra Bolero
      logisticsFee = 180;
    } else if (hasPerishable && totalWeight >= 12) {
      vehicleTypeRequired = 'REEFER_VAN'; // Temperature controlled 4°C
      logisticsFee = 240;
    } else {
      vehicleTypeRequired = 'BIKE_SCOOTY'; // Express delivery bag
      logisticsFee = 70;
    }

    const platformFee = 0; // 0% middleman broker cut
    const totalAmount = finalItemsTotal + logisticsFee + platformFee;
    const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const orderId = 'ord_' + Math.floor(1000 + Math.random() * 9000);

    const newOrder: OrderDoc = {
      id: orderId,
      consumerId: req.user.id,
      consumerName: user?.name || 'Valued Buyer',
      consumerPhone: user?.phone || '+91 98000 12345',
      shippingAddress,
      items: populatedItems,
      itemsTotal: finalItemsTotal,
      logisticsFee,
      platformFee,
      totalAmount,
      paymentMethod: paymentMethod || 'UPI',
      paymentStatus: paymentMethod === 'ESCROW_COD' ? 'ESCROW_LOCKED' : 'PAID',
      status: 'PLACED',
      deliveryOtp,
      vehicleTypeRequired,
      isBulkOrder: isBulk,
      orderType: isBulk ? 'BULK_WHOLESALE' : 'RETAIL',
      bulkDiscount,
      estimatedDeliveryTime: isBulk ? 'Within 36 Hours (Freight Trolley Transit)' : 'Within 24 Hours (Fresh Morning Dispatch)',
      statusHistory: [
        {
          status: 'PLACED',
          timestamp: new Date().toISOString(),
          note: `Order placed by buyer (${isBulk ? 'Bulk Wholesale' : 'Standard'}). Funds secured in SeedhaMandi Escrow.`,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    db.addOrder(newOrder);

    // 1. Send Real-time Notification to Farmer
    const farmerId = populatedItems[0]?.farmerId || 'usr_farmer_1';
    const itemsSummary = populatedItems.map((i: any) => `${i.quantity} ${i.unit} ${i.name}`).join(', ');
    db.addNotification({
      id: 'notif_' + Date.now() + '_farmer',
      recipientRole: 'FARMER',
      recipientUserId: farmerId,
      orderId: newOrder.id,
      title: isBulk ? '🚨 BULK WHOLESALE Order Received!' : '🌾 New Harvest Order Received!',
      message: `${user?.name || 'Customer'} placed an order for ${itemsSummary} (₹${finalItemsTotal}). Please confirm harvest availability and pack in crates.`,
      type: 'NEW_ORDER',
      vehicleTypeRequired,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    // 2. Send Real-time Notification to Logistics Partners
    const vehicleLabels: Record<string, string> = {
      BIKE_SCOOTY: 'Bike / Scooty Thermal Bag',
      MINI_TRUCK: 'Mini Truck / Tata Ace',
      TRACTOR: 'Tractor / Agro Trolley',
      REEFER_VAN: 'Refrigerated Cold Van (4°C)',
    };
    db.addNotification({
      id: 'notif_' + Date.now() + '_logistics',
      recipientRole: 'LOGISTICS',
      orderId: newOrder.id,
      title: `🚚 New Delivery Dispatch (${vehicleLabels[vehicleTypeRequired]})`,
      message: `Fresh consignment from farm to ${shippingAddress.city} (${totalWeight} kg). Freight payout: ₹${logisticsFee}. Accept or Reject.`,
      type: 'DISPATCH_OFFER',
      vehicleTypeRequired,
      isRead: false,
      createdAt: new Date().toISOString(),
      data: {
        orderId: newOrder.id,
        freightFee: logisticsFee,
        weight: totalWeight,
      },
    });

    res.status(201).json({
      message: 'Order confirmed and placed successfully.',
      order: newOrder,
      notificationsTriggered: true,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders', authMiddleware, (req: any, res) => {
  const role = req.user.role;
  let orders: OrderDoc[] = [];

  if (role === 'CONSUMER') {
    orders = db.getOrders({ consumerId: req.user.id });
  } else if (role === 'FARMER' || role === 'FPO_REP') {
    orders = db.getOrders({ farmerId: req.user.id });
  } else if (role === 'LOGISTICS') {
    // Return both assigned orders AND unassigned available orders ready for pickup
    orders = db.orders.filter(o => o.logisticsId === req.user.id || !o.logisticsId);
  } else {
    orders = db.orders;
  }

  res.json({ count: orders.length, orders });
});

// Accept Delivery Endpoint for Logistics
app.post('/api/orders/:id/accept-delivery', authMiddleware, (req: any, res) => {
  try {
    const order = db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const driver = db.getUserById(req.user.id);
    const updates: Partial<OrderDoc> = {
      logisticsId: req.user.id,
      logisticsName: driver?.name || 'KisanVahan Logistics',
      vehicleNumber: driver?.vehicleNumber || 'OD 02 AX 8840',
      status: 'CONFIRMED',
    };

    order.statusHistory.push({
      status: 'CONFIRMED',
      timestamp: new Date().toISOString(),
      note: `Delivery dispatch accepted by carrier ${updates.logisticsName} (${updates.vehicleNumber}).`,
    });

    const updated = db.updateOrder(req.params.id, updates);

    // Notify Farmer that carrier accepted
    const farmerId = order.items[0]?.farmerId;
    if (farmerId) {
      db.addNotification({
        id: 'notif_' + Date.now() + '_farmer_carrier',
        recipientRole: 'FARMER',
        recipientUserId: farmerId,
        orderId: order.id,
        title: '🚚 Carrier Assigned for Order #' + order.id,
        message: `${updates.logisticsName} has accepted pickup. Carrier will arrive with ${order.vehicleTypeRequired || 'vehicle'}.`,
        type: 'DELIVERY_ACCEPTED',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    // Notify Consumer
    db.addNotification({
      id: 'notif_' + Date.now() + '_consumer_carrier',
      recipientRole: 'CONSUMER',
      recipientUserId: order.consumerId,
      orderId: order.id,
      title: '📦 Order Confirmed & Dispatch Assigned',
      message: `Your order #${order.id} is being harvested. Carrier ${updates.logisticsName} will deliver to your doorstep.`,
      type: 'DELIVERY_ACCEPTED',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    res.json({ message: 'Delivery accepted successfully!', order: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reject Delivery Endpoint for Logistics
app.post('/api/orders/:id/reject-delivery', authMiddleware, (req: any, res) => {
  res.json({ message: 'Delivery passed. Offer routed to next available carrier.', orderId: req.params.id });
});

// Notifications Endpoints
app.get('/api/notifications', authMiddleware, (req: any, res) => {
  const notifs = db.getNotifications({
    recipientRole: req.user.role,
    recipientUserId: req.user.id,
  });
  res.json({ count: notifs.length, notifications: notifs });
});

app.post('/api/notifications/:id/read', authMiddleware, (req: any, res) => {
  const updated = db.markNotificationAsRead(req.params.id);
  res.json({ success: true, notification: updated });
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json({ order });
});

app.put('/api/orders/:id/status', authMiddleware, (req: any, res) => {
  const { status, note, logisticsId, vehicleNumber } = req.body;
  const order = db.getOrderById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  const history = [...order.statusHistory];
  history.push({
    status,
    timestamp: new Date().toISOString(),
    note: note || `Status updated to ${status}.`,
  });

  const updates: Partial<OrderDoc> = {
    status,
    statusHistory: history,
  };

  if (logisticsId) {
    const logUser = db.getUserById(logisticsId);
    updates.logisticsId = logisticsId;
    updates.logisticsName = logUser?.name || 'KisanVahan Logistics';
    updates.vehicleNumber = vehicleNumber || logUser?.vehicleNumber || 'MH 12 QX 4902';
  }

  if (status === 'DELIVERED') {
    updates.paymentStatus = 'RELEASED_TO_FARMER';
  }

  const updated = db.updateOrder(req.params.id, updates);
  res.json({ message: 'Order status updated successfully', order: updated });
});

// 5. Earnings & Payout APIs
app.get('/api/farmer/earnings', authMiddleware, (req: any, res) => {
  const farmerOrders = db.getOrders({ farmerId: req.user.id });
  let totalEarnings = 0;
  let pendingEscrow = 0;
  let completedOrders = 0;

  farmerOrders.forEach(ord => {
    const farmerPortion = ord.items
      .filter(i => i.farmerId === req.user.id)
      .reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (ord.status === 'DELIVERED') {
      totalEarnings += farmerPortion;
      completedOrders += 1;
    } else {
      pendingEscrow += farmerPortion;
    }
  });

  res.json({
    totalEarnings,
    pendingEscrow,
    completedOrders,
    totalOrders: farmerOrders.length,
    bankStatus: 'Verified (Aadhaar DBT Enabled)',
    instantPayoutEligible: totalEarnings > 0,
  });
});

app.get('/api/logistics/earnings', authMiddleware, (req: any, res) => {
  const deliveries = db.orders.filter(o => o.logisticsId === req.user.id);
  const totalEarned = deliveries
    .filter(o => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + o.logisticsFee, 0);
  const pendingDeliveries = deliveries.filter(o => o.status !== 'DELIVERED').length;

  res.json({
    totalEarned,
    pendingDeliveries,
    completedDeliveries: deliveries.filter(o => o.status === 'DELIVERED').length,
    activeTrips: deliveries.filter(o => o.status === 'IN_TRANSIT').length,
  });
});

// 6. AI Agent "SeedhaMitra" & Demand Intelligence
app.post('/api/ai/chat', optionalAuthMiddleware, async (req: any, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message cannot be empty.' });

    const userContext = req.user ? { role: req.user.role, name: req.user.name } : undefined;
    const reply = await askSeedhaMitra(message, userContext);
    res.json({ reply });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ai/demand-insights', (req, res) => {
  res.json({
    season: 'Rabi Harvest to Summer Transition',
    updatedAt: new Date().toISOString(),
    highDemandCrops: [
      {
        crop: 'Nashik Red Onions',
        category: 'Vegetables',
        demandIndex: 94,
        trend: 'UP (+18%)',
        avgMandiPrice: 22,
        recommendedDirectPrice: 28,
        farmerBenefitPct: 27,
        projectedRequirement: '15,000 kg across urban hubs',
        harvestAdvice: 'Solar-dry for 48 hours to minimize transit moisture weight loss.',
      },
      {
        crop: 'Vine Ripe Plum Tomatoes',
        category: 'Vegetables',
        demandIndex: 88,
        trend: 'UP (+14%)',
        avgMandiPrice: 24,
        recommendedDirectPrice: 32,
        farmerBenefitPct: 33,
        projectedRequirement: '8,500 kg',
        harvestAdvice: 'Pick at breaker stage (50% pink) for 4-day shelf life during logistics.',
      },
      {
        crop: 'Devgad Alphonso Mangoes',
        category: 'Fruits',
        demandIndex: 98,
        trend: 'PEAK (+42%)',
        avgMandiPrice: 650,
        recommendedDirectPrice: 850,
        farmerBenefitPct: 31,
        projectedRequirement: '2,200 crates',
        harvestAdvice: 'Pack in hay crates; direct consumer demand is at seasonal all-time high.',
      },
      {
        crop: 'Sharbati Wheat (Sehore)',
        category: 'Grains',
        demandIndex: 82,
        trend: 'STEADY (+8%)',
        avgMandiPrice: 36,
        recommendedDirectPrice: 44,
        farmerBenefitPct: 22,
        projectedRequirement: '45,000 kg',
        harvestAdvice: 'Maintain <11% moisture to prevent pest infestation in dry transit.',
      },
    ],
    priceDisparityAnalysis: {
      headline: 'Average 31.4% higher net earnings for farmers on SeedhaMandi',
      summary: 'Traditional APMC multi-broker chains shave 35-42% off the final retail price in loading fees, commissions, and transit losses. SeedhaMandi direct escrow routes these savings directly to farm bank accounts.',
    },
  });
});

// Dynamic AI Crop Demand & Price Forecast
app.post('/api/ai/forecast', async (req, res) => {
  try {
    const { crop, region } = req.body;
    if (!crop) return res.status(400).json({ error: 'Crop name is required for demand forecasting.' });
    const result = await generateCropForecast(crop, region || 'Bhubaneswar / Odisha');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// AI Multi-Stop Route Optimization
app.post('/api/ai/optimize-route', (req, res) => {
  try {
    const { stops, vehicleType } = req.body;
    const result = optimizeRuralRoute(stops, vehicleType || 'MINI_TRUCK');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Bulk Buyer RFQ (Request for Quotation) Endpoints
app.get('/api/rfqs', (req, res) => {
  const status = req.query.status as string | undefined;
  const list = db.getRfqs(status ? { status } : undefined);
  res.json({ count: list.length, rfqs: list });
});

app.post('/api/rfqs', authMiddleware, (req: any, res) => {
  try {
    const { cropName, category, quantityRequired, unit, targetPricePerUnit, deliveryLocation, requiredByDate, organization } = req.body;
    if (!cropName || !quantityRequired || !targetPricePerUnit) {
      return res.status(400).json({ error: 'Crop, quantity, and target price are required.' });
    }

    const newRfq = db.addRfq({
      id: 'rfq_' + Date.now(),
      buyerName: req.user.name || 'Commercial Buyer',
      organization: organization || 'Institutional Buyer',
      buyerPhone: req.user.phone || '+91 94370 00000',
      cropName,
      category: category || 'Vegetables',
      quantityRequired: Number(quantityRequired),
      unit: unit || 'kg',
      targetPricePerUnit: Number(targetPricePerUnit),
      deliveryLocation: deliveryLocation || 'Bhubaneswar Agro Terminal',
      requiredByDate: requiredByDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'OPEN',
      vehicleTypeRequired: Number(quantityRequired) >= 500 ? 'TRACTOR' : 'MINI_TRUCK',
      createdAt: new Date().toISOString(),
    });

    // Notify Farmers about new bulk RFQ
    db.addNotification({
      id: 'notif_' + Date.now() + '_bulk_rfq',
      recipientRole: 'FARMER',
      title: `📦 New Bulk Procurement Request: ${quantityRequired} ${unit} of ${cropName}`,
      message: `${newRfq.organization} is requesting ${quantityRequired} ${unit} at ₹${targetPricePerUnit}/${unit}. Review and match harvest supply!`,
      type: 'NEW_ORDER',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    res.json({ message: 'Bulk RFQ submitted successfully', rfq: newRfq });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/rfqs/:id/match', authMiddleware, (req: any, res) => {
  try {
    const rfq = db.getRfqById(req.params.id);
    if (!rfq) return res.status(404).json({ error: 'RFQ not found.' });

    const updated = db.updateRfq(req.params.id, {
      status: 'MATCHED',
      matchedFarmerOrFpo: `${req.user.name} (${req.user.village || 'Odisha Agro Cluster'})`,
    });

    res.json({ message: 'FPO / Farmer matched to Bulk RFQ', rfq: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ========================================================================== */
/*                             VITE MIDDLEWARE                                */
/* ========================================================================== */

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SeedhaMandi Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
