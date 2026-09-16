import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ShoppingBag, 
  Sprout, 
  MapPin, 
  Calendar, 
  Award, 
  CheckCircle2, 
  ArrowUpDown,
  Sparkles,
  ShieldCheck,
  X,
  Truck,
  Building,
  Plus,
  Send,
  Clock,
  Layers,
  Check,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { Product, ProductCategory, BulkRfq } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CropsAnalytics } from '../components/CropsAnalytics';

interface MarketplacePageProps {
  products: Product[];
  onAddToCart: (product: Product, quantity?: number) => void;
  onOpenCart: () => void;
}

export const MarketplacePage: React.FC<MarketplacePageProps> = ({
  products,
  onAddToCart,
  onOpenCart,
}) => {
  const { openSeedhaMitra, user, cart, cartCount, cartTotal, openCart } = useAuth();
  const [marketMode, setMarketMode] = useState<'retail' | 'bulk' | 'rfq'>('retail');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price_low' | 'price_high'>('featured');
  const [organicOnly, setOrganicOnly] = useState(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [justAddedProduct, setJustAddedProduct] = useState<{ product: Product; quantity: number } | null>(null);

  const handleProductAdd = (product: Product, quantity: number = 1) => {
    onAddToCart(product, quantity);
    setJustAddedProduct({ product, quantity });
    setTimeout(() => {
      setJustAddedProduct(prev => (prev?.product.id === product.id ? null : prev));
    }, 4500);
  };

  // Bulk RFQ State
  const [rfqs, setRfqs] = useState<BulkRfq[]>([]);
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [rfqCropName, setRfqCropName] = useState('Nashik Red Onions');
  const [rfqCategory, setRfqCategory] = useState<any>('Vegetables');
  const [rfqQuantity, setRfqQuantity] = useState('500');
  const [rfqUnit, setRfqUnit] = useState<'kg' | 'quintal'>('kg');
  const [rfqTargetPrice, setRfqTargetPrice] = useState('26');
  const [rfqLocation, setRfqLocation] = useState('Kalinga Star Grand Hotel, Janpath, Bhubaneswar');
  const [rfqOrganization, setRfqOrganization] = useState('Kalinga Star Grand Hotel & Convention');
  const [rfqDate, setRfqDate] = useState('2026-09-25');
  const [rfqSubmitting, setRfqSubmitting] = useState(false);
  const [rfqSuccessMsg, setRfqSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadRfqs();
  }, []);

  const loadRfqs = async () => {
    try {
      const res = await api.getRfqs();
      setRfqs(res.rfqs || []);
    } catch (err) {
      console.error('Failed to load RFQs:', err);
    }
  };

  const handleCreateRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setRfqSubmitting(true);
      const res = await api.createRfq({
        cropName: rfqCropName,
        category: rfqCategory,
        quantityRequired: Number(rfqQuantity),
        unit: rfqUnit,
        targetPricePerUnit: Number(rfqTargetPrice),
        deliveryLocation: rfqLocation,
        organization: rfqOrganization,
        requiredByDate: rfqDate,
      });

      setRfqSuccessMsg(`Bulk RFQ for ${rfqQuantity} ${rfqUnit} of ${rfqCropName} broadcasted to FPOs and Farmers!`);
      setIsRfqModalOpen(false);
      loadRfqs();
      setTimeout(() => setRfqSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Could not submit RFQ');
    } finally {
      setRfqSubmitting(false);
    }
  };

  const categories: string[] = [
    'All',
    'Vegetables',
    'Fruits',
    'Grains',
    'Pulses',
    'Spices',
    'Dairy',
    'Organic',
  ];

  // Filter products
  const filteredProducts = products.filter(p => {
    if (selectedCategory !== 'All' && p.category !== selectedCategory) {
      if (selectedCategory === 'Organic' && !p.organicCertified) return false;
      if (selectedCategory !== 'Organic') return false;
    }
    if (organicOnly && !p.organicCertified) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchLocation = p.location.toLowerCase().includes(q);
      const matchFarmer = p.farmerName.toLowerCase().includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      if (!matchName && !matchLocation && !matchFarmer && !matchCat) return false;
    }
    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price_low') return a.price - b.price;
    if (sortBy === 'price_high') return b.price - a.price;
    return 0;
  });

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-stone-200 dark:border-stone-700 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">Direct Agro Marketplace</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                {products.length} Lots Available
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Source farm-fresh produce direct from registered village growers and FPOs. Zero middleman markup.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openSeedhaMitra}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Ask AI for Seasonal Recommendations</span>
            </button>
            <button
              onClick={onOpenCart}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>View Cart</span>
            </button>
          </div>
        </div>

        {/* Market Mode Switcher (Retail Basket vs Bulk Wholesale vs RFQ Desk) */}
        <div className="bg-white dark:bg-stone-900 transition-colors p-2 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-2xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setMarketMode('retail')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                marketMode === 'retail'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:text-stone-100 hover:bg-stone-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Retail Fresh Basket (1 - 50 kg)</span>
            </button>

            <button
              onClick={() => setMarketMode('bulk')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                marketMode === 'bulk'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:text-stone-100 hover:bg-stone-100'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Wholesale Mandi Lots (≥100 kg to 5,000 kg)</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-400 text-stone-950 font-black">
                Bulk Rates
              </span>
            </button>

            <button
              onClick={() => setMarketMode('rfq')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                marketMode === 'rfq'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:text-stone-100 hover:bg-stone-100'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Institutional RFQ Desk ({rfqs.length} Live)</span>
            </button>
          </div>

          {marketMode === 'rfq' && (
            <button
              onClick={() => setIsRfqModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit New Bulk RFQ</span>
            </button>
          )}
        </div>

        {/* Success Banner */}
        {rfqSuccessMsg && (
          <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>{rfqSuccessMsg}</span>
          </div>
        )}

        {/* ===================================================================== */}
        {/* MODE: INSTITUTIONAL RFQ DESK                                          */}
        {/* ===================================================================== */}
        {marketMode === 'rfq' && (
          <div className="space-y-6">
            <div className="p-5 bg-gradient-to-r from-stone-900 to-emerald-950 text-white rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  B2B Institutional Procurement
                </span>
                <h2 className="text-xl font-black">Direct RFQ (Request for Quotation) Board</h2>
                <p className="text-xs text-stone-300 max-w-2xl">
                  Hotels, college mess canteens, corporate cafeterias, and food processors can post procurement tenders. FPOs and farmers match supply directly without APMC auction cartels.
                </p>
              </div>

              <button
                onClick={() => setIsRfqModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 shrink-0 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Post Bulk RFQ</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {rfqs.map(rfq => (
                <div
                  key={rfq.id}
                  className="bg-white dark:bg-stone-900 transition-colors rounded-3xl border border-stone-200 dark:border-stone-700 p-5 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                          {rfq.organization}
                        </span>
                        <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-base">{rfq.cropName}</h3>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${
                        rfq.status === 'MATCHED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {rfq.status}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-100 space-y-2 text-xs">
                      <div className="flex justify-between text-stone-600 dark:text-stone-300">
                        <span>Required Volume:</span>
                        <span className="font-extrabold text-stone-900 dark:text-stone-100">{rfq.quantityRequired.toLocaleString()} {rfq.unit}</span>
                      </div>
                      <div className="flex justify-between text-stone-600 dark:text-stone-300">
                        <span>Target Fair Price:</span>
                        <span className="font-extrabold text-emerald-800">₹{rfq.targetPricePerUnit}/{rfq.unit}</span>
                      </div>
                      <div className="flex justify-between text-stone-600 dark:text-stone-300">
                        <span>Delivery By:</span>
                        <span className="font-bold text-stone-800 dark:text-stone-200">{rfq.requiredByDate}</span>
                      </div>
                      <div className="flex justify-between text-stone-600 dark:text-stone-300">
                        <span>Logistics Fleet:</span>
                        <span className="font-bold text-blue-800">
                          {rfq.vehicleTypeRequired === 'TRACTOR' ? '🚜 Tractor / Agro Trolley' : '🚚 Mini Truck'}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-stone-500 dark:text-stone-400 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">{rfq.deliveryLocation}</span>
                      </div>
                      {rfq.matchedFarmerOrFpo && (
                        <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Supplied by: {rfq.matchedFarmerOrFpo}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {rfq.status === 'OPEN' ? (
                    <button
                      onClick={async () => {
                        try {
                          await api.matchRfq(rfq.id);
                          loadRfqs();
                          alert('You have matched this Bulk RFQ! Contract logged.');
                        } catch (err: any) {
                          alert(err.message);
                        }
                      }}
                      className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Fulfill This RFQ (Farmer / FPO)</span>
                    </button>
                  ) : (
                    <div className="w-full py-2 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs text-center border border-emerald-200">
                      Harvest Allocated & Contracted
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* MODE: RETAIL OR WHOLESALE MANDI LOTS                                 */}
        {/* ===================================================================== */}
        {marketMode !== 'rfq' && (
          <>
            {/* Search & Filters Control Bar */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Search Input */}
                <div className="md:col-span-6 relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search crops, varieties, farm locations, or farmer names..."
                    className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:border-emerald-600 shadow-xs"
                  />
                </div>

                {/* Sort Dropdown */}
                <div className="md:col-span-3">
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-stone-700 dark:text-stone-300 font-medium focus:outline-none focus:border-emerald-600 shadow-xs"
                  >
                    <option value="featured">Sort by: Featured & Freshness</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                  </select>
                </div>

                {/* Organic Toggle */}
                <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-2 bg-white dark:bg-stone-900 px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 shadow-xs">
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300">Certified Organic Only</span>
                  <button
                    type="button"
                    onClick={() => setOrganicOnly(!organicOnly)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      organicOnly ? 'bg-emerald-700' : 'bg-stone-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-stone-900 shadow-md ring-0 transition duration-200 ease-in-out ${
                        organicOnly ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Category Pills Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:bg-stone-800 border border-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Wholesale Mode Callout Banner */}
            {marketMode === 'bulk' && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-200 text-amber-950 shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-amber-950 block">
                      Wholesale Mandi Procurement Mode Active
                    </span>
                    <p className="text-amber-900/80">
                      Discounts applied for batch orders (100 kg to 2,000 kg). Directly assigned to Tractor & Tata Ace freight fleets.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsRfqModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold self-start sm:self-auto transition"
                >
                  Need Custom Lot? Post RFQ
                </button>
              </div>
            )}

            {/* Product Grid */}
            {sortedProducts.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700">
                <Sprout className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-stone-700 dark:text-stone-300">No produce matching your criteria</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Try resetting filters or category selections.</p>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSearchQuery('');
                    setOrganicOnly(false);
                  }}
                  className="mt-4 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <>
                <CropsAnalytics />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
                  {sortedProducts.map((product, index) => {
                    const isBulk = marketMode === 'bulk';
                  const displayPrice = isBulk ? Math.round(product.price * 0.88) : product.price;
                  const lotQty = isBulk ? 100 : 1;

                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
                      className="bg-white dark:bg-stone-900 transition-colors rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between group"
                    >
                      <div>
                        {/* Image Container */}
                        <div className="relative h-48 bg-stone-100 dark:bg-stone-800 overflow-hidden">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
                            {product.organicCertified && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                                <Award className="w-3 h-3" /> Organic
                              </span>
                            )}
                            {isBulk && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[10px] font-black uppercase">
                                Bulk Lot (100 kg)
                              </span>
                            )}
                          </div>

                          <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium">
                            {product.qualityGrade}
                          </span>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 space-y-2.5">
                          <div className="flex items-start justify-between gap-1">
                            <h3 
                              onClick={() => setSelectedProductDetail(product)}
                              className="font-bold text-stone-900 dark:text-stone-100 text-sm hover:text-emerald-700 cursor-pointer line-clamp-1"
                            >
                              {product.name}
                            </h3>
                          </div>

                          <div className="space-y-1 text-xs text-stone-500 dark:text-stone-400">
                            <div className="flex items-center gap-1">
                              <Sprout className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{product.farmerName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span className="truncate">{product.location}, {product.state}</span>
                            </div>
                          </div>

                          <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed">
                            {product.description}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Footer Price & Action */}
                      <div className="p-4 pt-3 border-t border-stone-100 flex items-center justify-between bg-stone-50/50">
                        <div>
                          <div className="text-base font-black text-emerald-900">
                            ₹{displayPrice}
                            <span className="text-xs font-normal text-stone-500 dark:text-stone-400">/{product.unit}</span>
                          </div>
                          {isBulk ? (
                            <div className="text-[10px] text-amber-800 font-bold">
                              ₹{(displayPrice * 100).toLocaleString()} / 100 kg lot
                            </div>
                          ) : (
                            product.mandiBenchmarkPrice && (
                              <div className="text-[10px] text-stone-400 line-through">
                                Mandi: ₹{product.mandiBenchmarkPrice}/{product.unit}
                              </div>
                            )
                          )}
                          {cart.some(i => i.product.id === product.id) && (
                            <div className="text-[10px] text-emerald-800 font-bold flex items-center gap-1 mt-0.5">
                              <Check className="w-3 h-3" />
                              <span>In Basket ({cart.find(i => i.product.id === product.id)?.quantity} {product.unit})</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {cart.some(i => i.product.id === product.id) && (
                            <button
                              type="button"
                              onClick={() => openCart('checkout')}
                              className="px-2.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs transition shadow-xs flex items-center gap-1 active:scale-95 cursor-pointer"
                              title="Place order for items in basket"
                            >
                              <span>Place Order</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleProductAdd(product, lotQty)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>{isBulk ? 'Add 100 kg' : 'Add'}</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ===================================================================== */}
      {/* SUBMIT BULK RFQ MODAL                                                 */}
      {/* ===================================================================== */}
      {isRfqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-700 overflow-hidden my-8">
            <div className="bg-emerald-900 text-white p-6 relative">
              <button
                onClick={() => setIsRfqModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[10px] font-black uppercase tracking-wider">
                Institutional Buyer
              </span>
              <h3 className="text-xl font-black mt-2">Broadcast Bulk Procurement RFQ</h3>
              <p className="text-xs text-emerald-200 mt-0.5">
                Direct quotation tender sent to regional FPOs and farm collectives.
              </p>
            </div>

            <form onSubmit={handleCreateRfq} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Organization / Buyer Name</label>
                <input
                  type="text"
                  required
                  value={rfqOrganization}
                  onChange={e => setRfqOrganization(e.target.value)}
                  placeholder="e.g. Kalinga Hotel & Convention / KIIT Hostel Mess"
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Crop / Variety</label>
                  <input
                    type="text"
                    required
                    value={rfqCropName}
                    onChange={e => setRfqCropName(e.target.value)}
                    placeholder="e.g. Nashik Red Onions"
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Category</label>
                  <select
                    value={rfqCategory}
                    onChange={e => setRfqCategory(e.target.value as any)}
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Grains">Grains</option>
                    <option value="Pulses">Pulses</option>
                    <option value="Spices">Spices</option>
                    <option value="Organic">Organic</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Required Quantity (kg)</label>
                  <input
                    type="number"
                    min="50"
                    step="10"
                    required
                    value={rfqQuantity}
                    onChange={e => setRfqQuantity(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Target Price (₹/kg)</label>
                  <input
                    type="number"
                    min="5"
                    step="1"
                    required
                    value={rfqTargetPrice}
                    onChange={e => setRfqTargetPrice(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Delivery Destination in Bhubaneswar</label>
                <input
                  type="text"
                  required
                  value={rfqLocation}
                  onChange={e => setRfqLocation(e.target.value)}
                  placeholder="e.g. Saheed Nagar Market / Patia Campus Depot"
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Required By Date</label>
                <input
                  type="date"
                  required
                  value={rfqDate}
                  onChange={e => setRfqDate(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <button
                type="submit"
                disabled={rfqSubmitting}
                className="w-full py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{rfqSubmitting ? 'Publishing RFQ...' : 'Publish Bulk RFQ to Farmers'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProductDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 transition-colors w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 overflow-hidden">
            <div className="relative h-56 bg-stone-100 dark:bg-stone-800">
              <img
                src={selectedProductDetail.image}
                alt={selectedProductDetail.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedProductDetail(null)}
                className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-white/95 text-xs font-bold text-emerald-900">
                {selectedProductDetail.qualityGrade}
              </span>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-black text-stone-900 dark:text-stone-100">{selectedProductDetail.name}</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Category: {selectedProductDetail.category} • Harvested: {selectedProductDetail.harvestDate}
                </p>
              </div>

              {/* Direct Farm Transparency Box */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Direct Farm Traceability Certificate</span>
                </div>
                <div className="text-stone-600 dark:text-stone-300">
                  • <strong>Grower:</strong> {selectedProductDetail.farmerName} ({selectedProductDetail.location}, {selectedProductDetail.state})
                </div>
                <div className="text-stone-600 dark:text-stone-300">
                  • <strong>Fair Farmgate Realization:</strong> 100% of ₹{selectedProductDetail.price}/{selectedProductDetail.unit} directly to farmer bank account.
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-2xl font-black text-emerald-900">
                  ₹{selectedProductDetail.price}
                  <span className="text-xs font-normal text-stone-500 dark:text-stone-400">/{selectedProductDetail.unit}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleProductAdd(selectedProductDetail);
                      setSelectedProductDetail(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-emerald-700 text-emerald-800 hover:bg-emerald-50 font-bold text-xs transition cursor-pointer"
                  >
                    Add to Basket
                  </button>
                  <button
                    onClick={() => {
                      onAddToCart(selectedProductDetail);
                      setSelectedProductDetail(null);
                      openCart('checkout');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs shadow-md transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <span>Place Order Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Consumer Place Order Bar when items are in cart */}
      {cart.length > 0 && (
        <div className="fixed bottom-5 inset-x-4 sm:inset-x-auto sm:right-6 z-40 max-w-lg bg-emerald-950/95 text-white p-3.5 rounded-2xl shadow-2xl border border-emerald-700 backdrop-blur-md flex items-center justify-between gap-4 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-800 text-amber-400 flex items-center justify-center font-bold shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <span>Farm Basket: {cartCount} items ({cart.reduce((s, i) => s + i.quantity, 0)} kg)</span>
              </div>
              <div className="text-[11px] text-emerald-300 font-mono">
                Total: <strong className="text-amber-300 font-bold">₹{cartTotal}</strong> • Direct farmgate dispatch
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openCart('checkout')}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span>Place Order</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Immediate 'Just Added' Notification Popover */}
      {justAddedProduct && (
        <div className="fixed top-20 right-6 z-50 bg-white dark:bg-stone-900 border-2 border-emerald-600 rounded-2xl shadow-xl p-3.5 max-w-sm animate-in slide-in-from-top-3">
          <div className="flex items-start gap-2.5">
            <img
              src={justAddedProduct.product.image}
              alt={justAddedProduct.product.name}
              className="w-11 h-11 rounded-lg object-cover border border-stone-200 dark:border-stone-700 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                  <Check className="w-3 h-3" /> Placed in Basket
                </span>
                <button
                  type="button"
                  onClick={() => setJustAddedProduct(null)}
                  className="text-stone-400 hover:text-stone-700 dark:text-stone-300 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
              <h5 className="font-bold text-xs text-stone-900 dark:text-stone-100 truncate mt-0.5">
                {justAddedProduct.product.name} ({justAddedProduct.quantity} {justAddedProduct.product.unit})
              </h5>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setJustAddedProduct(null);
                    openCart('checkout');
                  }}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <span>Place Order Now</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setJustAddedProduct(null)}
                  className="px-2.5 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
