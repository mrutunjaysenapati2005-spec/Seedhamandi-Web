import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  Scale, 
  Calendar, 
  ArrowUpRight, 
  Sprout, 
  AlertCircle, 
  BarChart3, 
  CheckCircle2,
  RefreshCw,
  Search,
  Zap,
  Info,
  Truck,
  Fuel,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  Plus,
  Trash2,
  Sliders,
  Award,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  DemandCrop, 
  DemandInsightsData, 
  CropForecastResult, 
  RouteOptimizationResult, 
  RouteStop,
  VehicleType 
} from '../types';

export const DemandIntelligencePage: React.FC = () => {
  const { openSeedhaMitra } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'forecasting' | 'routing' | 'transparency'>('forecasting');
  
  // General Insights Data
  const [data, setData] = useState<DemandInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // AI Forecast State
  const [selectedCrop, setSelectedCrop] = useState('Nashik Red Onions');
  const [selectedRegion, setSelectedRegion] = useState('Bhubaneswar / Odisha');
  const [cropForecast, setCropForecast] = useState<CropForecastResult | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  // Route Optimization State
  const [vehicleType, setVehicleType] = useState<VehicleType>('MINI_TRUCK');
  const [stops, setStops] = useState<RouteStop[]>([
    {
      id: 'stop_hub',
      name: 'Mancheswar Agro Cold Storage Hub',
      type: 'HUB',
      location: 'Mancheswar Industrial Estate, Bhubaneswar',
      coordinates: { lat: 20.316, lng: 85.864 },
      produce: 'Consolidated Fleet Depot',
      weightKg: 0,
      perishabilityScore: 1,
      contactPerson: 'Hub Dispatcher',
      contactPhone: '+91 94370 11001',
    },
    {
      id: 'stop_1',
      name: 'Khordha Valley Agro Farm',
      type: 'PICKUP',
      location: 'Khordha Farmgate Belt',
      coordinates: { lat: 20.182, lng: 85.617 },
      produce: 'Organic Plum Tomatoes',
      weightKg: 180,
      perishabilityScore: 9,
      contactPerson: 'Bikram Sahoo',
      contactPhone: '+91 98234 11201',
    },
    {
      id: 'stop_2',
      name: 'Pipili Farmers Cooperative',
      type: 'PICKUP',
      location: 'Pipili Toll Cluster, Puri Highway',
      coordinates: { lat: 20.115, lng: 85.832 },
      produce: 'Nashik Red Onions',
      weightKg: 400,
      perishabilityScore: 4,
      contactPerson: 'Sunil Jena',
      contactPhone: '+91 98234 11202',
    },
    {
      id: 'stop_3',
      name: 'Balianta Organic Vegetable Group',
      type: 'PICKUP',
      location: 'Balianta Riverbanks',
      coordinates: { lat: 20.245, lng: 85.889 },
      produce: 'Devgad Alphonso Mangoes',
      weightKg: 120,
      perishabilityScore: 10,
      contactPerson: 'Prafulla Das',
      contactPhone: '+91 98234 11204',
    },
    {
      id: 'stop_dest',
      name: 'Patia Urban Distribution Mandi',
      type: 'DELIVERY',
      location: 'DLF Cybercity Road, Patia, Bhubaneswar',
      coordinates: { lat: 20.358, lng: 85.818 },
      produce: 'Final Doorstep & B2B Distribution',
      weightKg: 700,
      perishabilityScore: 1,
      contactPerson: 'Terminal Manager',
      contactPhone: '+91 98610 88219',
    },
  ]);
  const [routeResult, setRouteResult] = useState<RouteOptimizationResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Transparency Calculator State
  const [calcQuantityKg, setCalcQuantityKg] = useState(100);
  const [calcBasePrice, setCalcBasePrice] = useState(25); // ₹/kg base

  useEffect(() => {
    loadInsights();
    handleGenerateForecast(selectedCrop, selectedRegion);
    handleOptimizeRoute();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const res = await api.getDemandInsights();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateForecast = async (crop: string, region: string) => {
    try {
      setForecastLoading(true);
      const res = await api.getCropForecast(crop, region);
      setCropForecast(res);
    } catch (err) {
      console.error('Forecast generation error:', err);
    } finally {
      setForecastLoading(false);
    }
  };

  const handleOptimizeRoute = async (selectedVehicle = vehicleType) => {
    try {
      setRouteLoading(true);
      const res = await api.optimizeRoute(stops, selectedVehicle);
      setRouteResult(res);
    } catch (err) {
      console.error('Route optimization error:', err);
    } finally {
      setRouteLoading(false);
    }
  };

  const cropsList = data?.highDemandCrops || [];
  const filtered = cropsList.filter(i => 
    i.crop.toLowerCase().includes(search.toLowerCase()) || 
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-8 text-stone-900 dark:text-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Main Header Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-800 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-400 text-emerald-950 text-xs font-black tracking-wider uppercase">
                AI Intelligence & Optimization Engine
              </span>
              <span className="text-xs text-emerald-200">
                Powered by Gemini AI & Real-Time Mandi Telemetry
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Predictive Demand Forecasting & AI Route Optimizer
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
              Equipping Indian farmers and logistics carriers with forward price intelligence, harvest scheduling, and fuel-saving multi-stop rural routing algorithms.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={openSeedhaMitra}
              className="px-4 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-black shadow-lg flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-emerald-950" />
              <span>Ask SeedhaMitra AI</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs between Forecasting, Route Optimizer, and Transparency Model */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-stone-900 p-2 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveSubTab('forecasting')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                activeSubTab === 'forecasting'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:text-stone-100 hover:bg-stone-100'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>AI Crop Demand & Price Forecast</span>
            </button>

            <button
              onClick={() => setActiveSubTab('routing')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                activeSubTab === 'routing'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:text-stone-100 hover:bg-stone-100'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>AI Multi-Stop Route Optimizer</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-400 text-stone-950 font-black">
                -28% Fuel
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('transparency')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                activeSubTab === 'transparency'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:text-stone-100 hover:bg-stone-100'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Value Chain Transparency Model</span>
            </button>
          </div>

          <span className="text-xs text-stone-500 dark:text-stone-400 hidden lg:inline px-3 font-medium">
            Smart India Hackathon Focus: High Farmer Realization & Waste Reduction
          </span>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: AI DEMAND FORECASTING ENGINE                                       */}
        {/* ========================================================================= */}
        {activeSubTab === 'forecasting' && (
          <div className="space-y-8">
            {/* Interactive Custom Crop Simulator Control Box */}
            <div className="bg-white dark:bg-stone-900 transition-colors rounded-3xl p-6 border border-stone-200 dark:border-stone-700 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <h2 className="text-lg font-black text-stone-900 dark:text-stone-100">
                      Live AI Agricultural Demand Simulator
                    </h2>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Select crop and regional consumption corridor to generate forward predictions using Gemini AI.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={selectedCrop}
                    onChange={e => {
                      setSelectedCrop(e.target.value);
                      handleGenerateForecast(e.target.value, selectedRegion);
                    }}
                    className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 dark:text-stone-200 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Nashik Red Onions">Nashik Red Onions</option>
                    <option value="Vine Ripe Plum Tomatoes">Vine Ripe Plum Tomatoes</option>
                    <option value="Devgad Alphonso Mangoes">Devgad Alphonso Mangoes</option>
                    <option value="Sharbati Wheat (Sehore)">Sharbati Wheat (Sehore)</option>
                    <option value="Sambalpuri Basmati Rice">Sambalpuri Basmati Rice</option>
                    <option value="Shimla Royal Delicious Apples">Shimla Royal Delicious Apples</option>
                    <option value="Organic Green Chillies">Organic Green Chillies</option>
                    <option value="Kandhamal Organic Turmeric">Kandhamal Organic Turmeric</option>
                  </select>

                  <select
                    value={selectedRegion}
                    onChange={e => {
                      setSelectedRegion(e.target.value);
                      handleGenerateForecast(selectedCrop, e.target.value);
                    }}
                    className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 dark:text-stone-200 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Bhubaneswar / Odisha Hub">Bhubaneswar / Odisha Hub</option>
                    <option value="Cuttack & Twin City Belt">Cuttack & Twin City Belt</option>
                    <option value="Western Odisha Mandis (Sambalpur)">Western Odisha Mandis (Sambalpur)</option>
                    <option value="National Metros (Kolkata / Hyderabad)">National Metros (Kolkata / Hyderabad)</option>
                  </select>

                  <button
                    disabled={forecastLoading}
                    onClick={() => handleGenerateForecast(selectedCrop, selectedRegion)}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${forecastLoading ? 'animate-spin' : ''}`} />
                    <span>{forecastLoading ? 'Analyzing...' : 'Run Forecast'}</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Forecast Results Showcase */}
              {cropForecast && (
                <div className="space-y-6">
                  {/* Top Key Indicator Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 space-y-1">
                      <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase">Demand Strength</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-stone-900 dark:text-stone-100">{cropForecast.demandIndex}/100</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                          {cropForecast.trend}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400">Peak buyer pull across retail & wholesale</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 space-y-1">
                      <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase">Fair Farmgate Rate</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-2xl font-black text-emerald-800">₹{cropForecast.seedhaMandiPrice}</span>
                        <span className="text-xs text-stone-400 line-through">₹{cropForecast.currentMandiPrice}</span>
                      </div>
                      <p className="text-[10px] text-emerald-700 font-bold">+{cropForecast.farmerMarginGainPct}% higher than APMC</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 space-y-1">
                      <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase">Projected Demand</span>
                      <span className="text-2xl font-black text-stone-900 dark:text-stone-100 block">{cropForecast.projectedDemandQuintals} Qtl</span>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400">Estimated 14-day absorption</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 space-y-1">
                      <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase">Perishability Risk</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-black px-2.5 py-1 rounded-lg ${
                          cropForecast.spoilageRisk === 'High (Perishable)' 
                            ? 'bg-rose-100 text-rose-900' 
                            : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {cropForecast.spoilageRisk}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400">Harvest: {cropForecast.harvestWindow}</p>
                    </div>
                  </div>

                  {/* 7-Day Predictive Trend Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-stone-600 dark:text-stone-300">
                        7-Day Forward Price Discovery Curve (Mandi vs SeedhaMandi)
                      </span>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400">AI Confidence: 92% Average</span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-stone-200 dark:border-stone-700">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-100/70 border-b border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-bold">
                          <tr>
                            <th className="py-2.5 px-4">Day</th>
                            <th className="py-2.5 px-4">Projected Mandi Arrival (Tons)</th>
                            <th className="py-2.5 px-4">APMC Middleman Price</th>
                            <th className="py-2.5 px-4">SeedhaMandi Direct Farmgate</th>
                            <th className="py-2.5 px-4">Direct Farmer Gain</th>
                            <th className="py-2.5 px-4">Model Confidence</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 bg-white dark:bg-stone-900">
                          {cropForecast.sevenDayForecast.map((dayItem, idx) => (
                            <tr key={idx} className="hover:bg-emerald-50/40 transition">
                              <td className="py-2.5 px-4 font-bold text-stone-900 dark:text-stone-100">{dayItem.day}</td>
                              <td className="py-2.5 px-4 text-stone-600 dark:text-stone-300">{dayItem.projectedArrivalsTons} Tons</td>
                              <td className="py-2.5 px-4 font-mono line-through text-stone-400">₹{dayItem.expectedMandiPrice}/kg</td>
                              <td className="py-2.5 px-4 font-mono font-black text-emerald-800 text-sm">
                                ₹{dayItem.directFairPrice}/kg
                              </td>
                              <td className="py-2.5 px-4 font-bold text-emerald-700">
                                +{Math.round(((dayItem.directFairPrice - dayItem.expectedMandiPrice) / dayItem.expectedMandiPrice) * 100)}%
                              </td>
                              <td className="py-2.5 px-4">
                                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  {dayItem.confidencePct}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* AI Harvest Advisory & Key Market Drivers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                        <Sprout className="w-4 h-4 text-emerald-700" />
                        <span>AI Harvest & Sowing Action Advisory</span>
                      </div>
                      <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
                        {cropForecast.recommendedAction}
                      </p>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                      <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
                        <Zap className="w-4 h-4 text-amber-700" />
                        <span>Key Market Catalysts & Price Drivers</span>
                      </div>
                      <ul className="text-xs text-stone-700 dark:text-stone-300 space-y-1 list-disc list-inside">
                        {cropForecast.keyDrivers.map((driver, idx) => (
                          <li key={idx} className="leading-snug">{driver}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* General Macro Disparity Callout */}
            {data?.priceDisparityAnalysis && (
              <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-stone-700 dark:text-stone-300">
                <div className="flex items-start gap-3">
                  <Zap className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-extrabold text-emerald-950 text-sm sm:text-base">
                      {data.priceDisparityAnalysis.headline}
                    </div>
                    <div className="text-stone-600 dark:text-stone-300 mt-1 max-w-3xl leading-relaxed">
                      {data.priceDisparityAnalysis.summary}
                    </div>
                  </div>
                </div>
                <span className="px-3.5 py-1.5 rounded-full bg-emerald-700 text-white font-black text-xs whitespace-nowrap self-start sm:self-auto shadow-xs">
                  Zero Broker Commission
                </span>
              </div>
            )}

            {/* High Demand Regional Crop Cards Grid */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-stone-900 dark:text-stone-100">
                    High Demand Mandi Crop Directory
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Real-time market discovery index across vegetable, fruit, grain, and spice crops.
                  </p>
                </div>

                <div className="relative max-w-xs w-full">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search crops or category..."
                    className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filtered.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-stone-900 transition-colors rounded-3xl border border-stone-200 dark:border-stone-700 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-base text-stone-900 dark:text-stone-100">{item.crop}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.demandIndex > 90
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          Demand: {item.demandIndex}/100
                        </span>
                      </div>

                      <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center justify-between">
                        <span>Category: <strong className="text-stone-800 dark:text-stone-200">{item.category}</strong></span>
                        <span className="font-bold text-emerald-700">{item.trend}</span>
                      </div>

                      {/* Price Comparison Box */}
                      <div className="p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-xl space-y-1.5 text-xs">
                        <div className="flex justify-between text-stone-600 dark:text-stone-300">
                          <span>APMC Mandi Avg:</span>
                          <span className="font-semibold text-stone-800 dark:text-stone-200 line-through">₹{item.avgMandiPrice}/kg</span>
                        </div>
                        <div className="flex justify-between text-emerald-800 font-bold">
                          <span>Direct Farmgate:</span>
                          <span className="text-sm text-emerald-900 font-extrabold">₹{item.recommendedDirectPrice}/kg</span>
                        </div>
                        <div className="pt-1 border-t border-stone-200 dark:border-stone-700 flex justify-between items-center text-[11px] text-amber-800 font-bold">
                          <span>Direct Farmer Realization:</span>
                          <span className="flex items-center gap-0.5 text-emerald-700 font-black">
                            <ArrowUpRight className="w-3.5 h-3.5" /> +{item.farmerBenefitPct}%
                          </span>
                        </div>
                      </div>

                      {/* Requirement & Advice */}
                      <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-300">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Projected Need: {item.projectedRequirement}</span>
                        </div>
                        <p className="text-[11px] text-stone-600 dark:text-stone-300 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 leading-relaxed">
                          <strong>Advisory:</strong> {item.harvestAdvice}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedCrop(item.crop);
                        handleGenerateForecast(item.crop, selectedRegion);
                        window.scrollTo({ top: 150, behavior: 'smooth' });
                      }}
                      className="w-full py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-emerald-100 hover:text-emerald-900 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Simulate AI Forecast</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: AI MULTI-STOP ROUTE OPTIMIZATION ENGINE                            */}
        {/* ========================================================================= */}
        {activeSubTab === 'routing' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-stone-900 transition-colors rounded-3xl p-6 sm:p-7 border border-stone-200 dark:border-stone-700 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-black text-stone-900 dark:text-stone-100">
                      AI Multi-Stop Rural Logistics Route Optimizer
                    </h2>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Sequences rural farmgate pickups and urban drops using perishability-first algorithms, eliminating deadhead miles and preserving cold-chain life.
                  </p>
                </div>

                {/* Vehicle Selection & Trigger */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-600 dark:text-stone-300">Assigned Fleet:</span>
                    <select
                      value={vehicleType}
                      onChange={e => {
                        const v = e.target.value as VehicleType;
                        setVehicleType(v);
                        handleOptimizeRoute(v);
                      }}
                      className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 dark:text-stone-200 focus:outline-none focus:border-emerald-600"
                    >
                      <option value="MINI_TRUCK">🚚 Mini Truck (Tata Ace Chota Hathi)</option>
                      <option value="TRACTOR">🚜 Tractor & Agro Trolley (Bulk Mandi)</option>
                      <option value="REEFER_VAN">❄️ Reefer Cold Van (4°C Controlled)</option>
                      <option value="BIKE_SCOOTY">🛵 Bike / Scooty (Rapid Consumer Bag)</option>
                    </select>
                  </div>

                  <button
                    disabled={routeLoading}
                    onClick={() => handleOptimizeRoute(vehicleType)}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${routeLoading ? 'animate-spin' : ''}`} />
                    <span>{routeLoading ? 'Optimizing...' : 'Run Route Optimizer'}</span>
                  </button>
                </div>
              </div>

              {/* Optimization Impact Metrics Strip */}
              {routeResult && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase">Distance Reduced</span>
                        <span className="p-1 rounded bg-emerald-200 text-emerald-950 text-[10px] font-black">
                          -{routeResult.distanceReductionPct}%
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-emerald-900">{routeResult.optimizedDistanceKm} km</span>
                        <span className="text-xs line-through text-stone-400">{routeResult.originalDistanceKm} km</span>
                      </div>
                      <p className="text-[10px] text-emerald-800 font-bold">Saved {routeResult.distanceSavedKm} km of rural transit</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase">Time Saved</span>
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-blue-900">{routeResult.optimizedDurationMins} min</span>
                        <span className="text-xs line-through text-stone-400">{routeResult.originalDurationMins} min</span>
                      </div>
                      <p className="text-[10px] text-blue-800 font-bold">-{routeResult.timeSavedMins} mins less transit exposure</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase">Fuel & Cost Saved</span>
                        <Fuel className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-amber-950">₹{routeResult.fuelCostSavedInr}</span>
                        <span className="text-xs text-amber-800">({routeResult.fuelSavedLiters} L Diesel)</span>
                      </div>
                      <p className="text-[10px] text-amber-800 font-bold">-{routeResult.co2SavedKg} kg CO₂ emissions prevented</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase">Freshness Guard</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-purple-950">{routeResult.freshnessScore}%</span>
                        <span className="text-[10px] font-bold bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded">
                          {routeResult.coldChainCompliance ? 'Cold-Chain OK' : 'Standard'}
                        </span>
                      </div>
                      <p className="text-[10px] text-purple-800 font-bold">Perishables loaded right before final hub run</p>
                    </div>
                  </div>

                  {/* Sequenced Waypoint Roadmap */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-wider text-stone-600 dark:text-stone-300">
                        AI-Sequenced Delivery Itinerary & Live GPS Stops
                      </h3>
                      <span className="text-xs text-stone-500 dark:text-stone-400">
                        Total Cargo: {routeResult.totalPayloadKg} kg • {routeResult.stopsCount} Waypoints
                      </span>
                    </div>

                    <div className="space-y-3">
                      {routeResult.orderedWaypoints.map(wp => (
                        <div
                          key={wp.seq}
                          className="p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:border-blue-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
                              #{wp.seq}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-stone-900 dark:text-stone-100 text-sm">{wp.stopName}</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                                  {wp.action}
                                </span>
                              </div>
                              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{wp.notes}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs shrink-0 self-end sm:self-auto">
                            <div className="text-right">
                              <span className="text-[11px] text-stone-400 block">Payload</span>
                              <span className="font-bold text-stone-800 dark:text-stone-200">{wp.weightKg} kg ({wp.produce})</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[11px] text-stone-400 block">ETA</span>
                              <span className="font-black text-blue-900">+{wp.etaMinutesFromStart} mins</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: VALUE CHAIN TRANSPARENCY MODEL & CALCULATOR                        */}
        {/* ========================================================================= */}
        {activeSubTab === 'transparency' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-stone-900 transition-colors rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-700 shadow-xs space-y-6">
              <div className="border-b border-stone-100 pb-4">
                <h2 className="text-xl font-black text-stone-900 dark:text-stone-100">
                  Value Chain Transparency Calculator
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-2xl">
                  Simulate direct farmgate procurement to mathematically demonstrate how SeedhaMandi solves the problem statement: better prices for farmers, lower prices for consumers, and reduced supply chain waste.
                </p>
              </div>

              {/* Slider Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-stone-50 dark:bg-stone-950 p-5 rounded-2xl border border-stone-200 dark:border-stone-700">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
                    <span>Produce Order Weight (Lot Size)</span>
                    <span className="text-emerald-800 font-extrabold">{calcQuantityKg} kg</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="1000"
                    step="20"
                    value={calcQuantityKg}
                    onChange={e => setCalcQuantityKg(Number(e.target.value))}
                    className="w-full accent-emerald-700"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400">
                    <span>20 kg (Consumer)</span>
                    <span>250 kg (Kirana/Restaurant)</span>
                    <span>1,000 kg (Wholesale Mandi)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
                    <span>Farmgate Fair Base Price</span>
                    <span className="text-emerald-800 font-extrabold">₹{calcBasePrice}/kg</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="120"
                    step="5"
                    value={calcBasePrice}
                    onChange={e => setCalcBasePrice(Number(e.target.value))}
                    className="w-full accent-emerald-700"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400">
                    <span>₹10/kg (Potatoes/Onions)</span>
                    <span>₹40/kg (Tomatoes/Wheat)</span>
                    <span>₹120/kg (Exotics/Pulses)</span>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Mathematical Comparison */}
              {(() => {
                // Traditional Model
                const traditionalFarmerRate = Math.round(calcBasePrice * 0.75); // ₹18 instead of ₹25
                const traditionalFarmerTotal = traditionalFarmerRate * calcQuantityKg;
                const villageAggregatorCut = Math.round(calcBasePrice * 0.12 * calcQuantityKg);
                const mandiArhatiyaCut = Math.round(calcBasePrice * 0.15 * calcQuantityKg);
                const wholesalerMarkup = Math.round(calcBasePrice * 0.20 * calcQuantityKg);
                const retailerMarkup = Math.round(calcBasePrice * 0.35 * calcQuantityKg);
                const foodPerishabilityLoss = Math.round(calcBasePrice * 0.15 * calcQuantityKg);
                const traditionalConsumerTotal = traditionalFarmerTotal + villageAggregatorCut + mandiArhatiyaCut + wholesalerMarkup + retailerMarkup + foodPerishabilityLoss;

                // SeedhaMandi Direct Model
                const seedhaFarmerRate = calcBasePrice; // ₹25 direct
                const seedhaFarmerTotal = seedhaFarmerRate * calcQuantityKg;
                const seedhaLogisticsFee = Math.round(calcBasePrice * 0.10 * calcQuantityKg);
                const seedhaEscrowPlatformFee = Math.round(calcBasePrice * 0.03 * calcQuantityKg);
                const seedhaConsumerTotal = seedhaFarmerTotal + seedhaLogisticsFee + seedhaEscrowPlatformFee;

                const farmerGainPct = Math.round(((seedhaFarmerTotal - traditionalFarmerTotal) / traditionalFarmerTotal) * 100);
                const consumerSavingsPct = Math.round(((traditionalConsumerTotal - seedhaConsumerTotal) / traditionalConsumerTotal) * 100);

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Traditional APMC Multi-Broker Chain */}
                    <div className="p-6 rounded-3xl border-2 border-rose-200 bg-rose-50/40 space-y-4">
                      <div className="flex items-center justify-between border-b border-rose-200 pb-3">
                        <div>
                          <span className="text-[11px] font-black uppercase text-rose-800 tracking-wider">Traditional APMC Model</span>
                          <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">4-Tier Intermediary Chain</h3>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-rose-200 text-rose-950 font-bold text-xs">
                          High Inefficiency
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 text-stone-700 dark:text-stone-300">
                          <span>Farmer Realization (Suppressed):</span>
                          <span className="font-bold text-stone-900 dark:text-stone-100">₹{traditionalFarmerTotal.toLocaleString()} (₹{traditionalFarmerRate}/kg)</span>
                        </div>
                        <div className="flex justify-between py-1 text-stone-600 dark:text-stone-300">
                          <span>Village Aggregator Loading Cut:</span>
                          <span className="font-semibold text-rose-800">+₹{villageAggregatorCut.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-1 text-stone-600 dark:text-stone-300">
                          <span>APMC Arhatiya Commission (2-3 tiers):</span>
                          <span className="font-semibold text-rose-800">+₹{mandiArhatiyaCut.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-1 text-stone-600 dark:text-stone-300">
                          <span>Wholesale Broker Markup:</span>
                          <span className="font-semibold text-rose-800">+₹{wholesalerMarkup.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-1 text-stone-600 dark:text-stone-300">
                          <span>Retail Supermarket / Kirana Markup:</span>
                          <span className="font-semibold text-rose-800">+₹{retailerMarkup.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-1 text-stone-600 dark:text-stone-300">
                          <span>Post-Harvest Perishability Spoilage (30%):</span>
                          <span className="font-semibold text-rose-800">+₹{foodPerishabilityLoss.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-rose-200 flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-200">Consumer / Buyer Pays:</span>
                        <span className="text-xl font-black text-rose-950">₹{traditionalConsumerTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* SeedhaMandi Direct Model */}
                    <div className="p-6 rounded-3xl border-2 border-emerald-300 bg-emerald-50/60 space-y-4">
                      <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                        <div>
                          <span className="text-[11px] font-black uppercase text-emerald-800 tracking-wider">SeedhaMandi Direct Model</span>
                          <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">Direct Farmgate + AI Logistics</h3>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-950 font-bold text-xs">
                          Smart India Hackathon
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 text-emerald-950 font-extrabold bg-emerald-100/70 px-2 py-1 rounded-lg">
                          <span>Farmer Direct Bank Realization:</span>
                          <span className="font-black text-emerald-900">₹{seedhaFarmerTotal.toLocaleString()} (₹{seedhaFarmerRate}/kg)</span>
                        </div>
                        <div className="flex justify-between py-1 text-stone-600 dark:text-stone-300">
                          <span>Village Aggregator Commission:</span>
                          <span className="font-bold text-emerald-800">₹0 (Eliminated)</span>
                        </div>
                        <div className="flex justify-between py-1 text-stone-600 dark:text-stone-300">
                          <span>APMC Broker Fees:</span>
                          <span className="font-bold text-emerald-800">₹0 (Eliminated)</span>
                        </div>
                        <div className="flex justify-between py-1 text-stone-600 dark:text-stone-300">
                          <span>Optimized Multimodal Logistics (Direct):</span>
                          <span className="font-semibold text-stone-900 dark:text-stone-100">+₹{seedhaLogisticsFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-1 text-stone-600 dark:text-stone-300">
                          <span>Escrow & Digital Quality Fee (3%):</span>
                          <span className="font-semibold text-stone-900 dark:text-stone-100">+₹{seedhaEscrowPlatformFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-1 text-stone-600 dark:text-stone-300">
                          <span>Transit Perishability Loss:</span>
                          <span className="font-bold text-emerald-800">Near Zero (AI Routing)</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-emerald-200 flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-200">Consumer / Buyer Pays:</span>
                        <span className="text-xl font-black text-emerald-950">₹{seedhaConsumerTotal.toLocaleString()}</span>
                      </div>

                      {/* Win-Win Metrics Callout */}
                      <div className="p-3 bg-emerald-100 rounded-2xl flex items-center justify-between text-xs font-black text-emerald-950">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span>Farmer Gains: +{farmerGainPct}% More</span>
                        </span>
                        <span>Consumer Saves: {consumerSavingsPct}%</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
