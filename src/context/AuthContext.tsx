import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, CartItem, Product } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole;
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  cartDrawerStep: 'basket' | 'checkout';
  setCartDrawerStep: (step: 'basket' | 'checkout') => void;
  openCart: (step?: 'basket' | 'checkout') => void;
  closeCart: () => void;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  loginWithOtp: (identifier: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  quickSwitchRole: (role: UserRole) => void;
  openAuthModal: (mode?: 'login' | 'register', defaultRole?: UserRole) => void;
  closeAuthModal: () => void;
  authModalState: { isOpen: boolean; mode: 'login' | 'register'; defaultRole: UserRole };
  openSeedhaMitra: () => void;
  closeSeedhaMitra: () => void;
  isSeedhaMitraOpen: boolean;
  openSihModal: () => void;
  closeSihModal: () => void;
  isSihModalOpen: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default guest / seed users for zero-friction exploration
const demoProfiles: Record<UserRole, User> = {
  FARMER: {
    id: 'usr_farmer_1',
    name: 'Ramesh Patel',
    email: 'ramesh.farmer@seedhamandi.in',
    phone: '+91 98234 11201',
    role: 'FARMER',
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
  },
  FPO_REP: {
    id: 'usr_fpo_1',
    name: 'Sahyadri Kisan Samriddhi FPO',
    email: 'fpo.sahyadri@seedhamandi.in',
    phone: '+91 98765 43210',
    role: 'FPO_REP',
    isEmailVerified: true,
    isPhoneVerified: true,
    fpoName: 'Sahyadri Kisan Samriddhi FPO (54 Village Farmers)',
    fpoFarmersCount: 54,
    district: 'Nashik',
    state: 'Maharashtra',
  },
  CONSUMER: {
    id: 'usr_consumer_1',
    name: 'Ananya Sharma',
    email: 'ananya.buyer@seedhamandi.in',
    phone: '+91 98111 22334',
    role: 'CONSUMER',
    isEmailVerified: true,
    isPhoneVerified: true,
    village: 'Indiranagar',
    district: 'Bengaluru',
    state: 'Karnataka',
  },
  LOGISTICS: {
    id: 'usr_logistics_1',
    name: 'KisanVahan Logistics (Ravi Kumar)',
    email: 'ravi.logistics@seedhamandi.in',
    phone: '+91 98990 77665',
    role: 'LOGISTICS',
    isEmailVerified: true,
    isPhoneVerified: true,
    vehicleType: 'Refrigerated Tata 407 (3.5 Ton)',
    vehicleNumber: 'MH 12 QX 4902',
    district: 'Pune',
    state: 'Maharashtra',
  },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('seedhamandi_user');
    return saved ? JSON.parse(saved) : demoProfiles['CONSUMER'];
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('seedhamandi_token') || 'demo_token';
  });

  const [activeTab, setActiveTab] = useState<string>('landing');

  const [authModalState, setAuthModalState] = useState<{
    isOpen: boolean;
    mode: 'login' | 'register';
    defaultRole: UserRole;
  }>({
    isOpen: false,
    mode: 'login',
    defaultRole: 'CONSUMER',
  });

  const [isSeedhaMitraOpen, setIsSeedhaMitraOpen] = useState(false);
  const [isSihModalOpen, setIsSihModalOpen] = useState(false);

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('seedhamandi_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('seedhamandi_cart', JSON.stringify(cart));
  }, [cart]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartDrawerStep, setCartDrawerStep] = useState<'basket' | 'checkout'>('basket');

  const openCart = (step: 'basket' | 'checkout' = 'basket') => {
    setCartDrawerStep(step);
    setIsCartOpen(true);
  };
  const closeCart = () => {
    setIsCartOpen(false);
    setCartDrawerStep('basket');
  };

  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateCartQty = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const login = async (identifier: string, pass: string) => {
    try {
      const res = await api.login(identifier, pass);
      if (res.token && res.user) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('seedhamandi_token', res.token);
        localStorage.setItem('seedhamandi_user', JSON.stringify(res.user));
        return { success: true };
      }
      return { success: false, message: res.error || 'Login failed' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const loginWithOtp = async (identifier: string, otp: string) => {
    try {
      const res = await api.loginWithOtp(identifier, otp);
      if (res.token && res.user) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('seedhamandi_token', res.token);
        localStorage.setItem('seedhamandi_user', JSON.stringify(res.user));
        return { success: true };
      }
      return { success: false, message: res.error || 'OTP Login failed' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('seedhamandi_token');
    localStorage.removeItem('seedhamandi_user');
    setActiveTab('landing');
  };

  const quickSwitchRole = (newRole: UserRole) => {
    const profile = demoProfiles[newRole];
    setUser(profile);
    setToken('demo_token_' + newRole);
    localStorage.setItem('seedhamandi_user', JSON.stringify(profile));

    // Navigate to respective view
    if (newRole === 'FARMER' || newRole === 'FPO_REP') {
      setActiveTab('farmer_dashboard');
    } else if (newRole === 'LOGISTICS') {
      setActiveTab('logistics_dashboard');
    } else {
      setActiveTab('marketplace');
    }
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login', defaultRole: UserRole = 'CONSUMER') => {
    setAuthModalState({ isOpen: true, mode, defaultRole });
  };

  const closeAuthModal = () => {
    setAuthModalState(prev => ({ ...prev, isOpen: false }));
  };

  const openSeedhaMitra = () => setIsSeedhaMitraOpen(true);
  const closeSeedhaMitra = () => setIsSeedhaMitraOpen(false);

  const openSihModal = () => setIsSihModalOpen(true);
  const closeSihModal = () => setIsSihModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || 'CONSUMER',
        cart,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        isCartOpen,
        cartDrawerStep,
        setCartDrawerStep,
        openCart,
        closeCart,
        login,
        loginWithOtp,
        logout,
        quickSwitchRole,
        openAuthModal,
        closeAuthModal,
        authModalState,
        openSeedhaMitra,
        closeSeedhaMitra,
        isSeedhaMitraOpen,
        openSihModal,
        closeSihModal,
        isSihModalOpen,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
