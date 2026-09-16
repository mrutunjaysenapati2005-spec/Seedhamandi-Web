import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sprout, 
  ShoppingBag, 
  Truck, 
  Users, 
  Mail, 
  Phone, 
  Lock, 
  User as UserIcon, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  KeyRound,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { api } from '../services/api';

export const AuthModal: React.FC = () => {
  const { authModalState, closeAuthModal, login, loginWithOtp, quickSwitchRole } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(authModalState.mode);
  const [step, setStep] = useState<'FORM' | 'CHOOSE_VERIFICATION' | 'EMAIL_OTP' | 'SMS_OTP' | 'DONE'>('FORM');

  // Registration form
  const [role, setRole] = useState<UserRole>(authModalState.defaultRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [district, setDistrict] = useState('Pune');
  const [state, setState] = useState('Maharashtra');
  const [village, setVillage] = useState('');
  const [fpoName, setFpoName] = useState('');
  const [fpoFarmersCount, setFpoFarmersCount] = useState('45');
  const [vehicleType, setVehicleType] = useState('Pickup Truck (1.5T)');
  const [vehicleNumber, setVehicleNumber] = useState('MH 12 AB 1234');

  // OTP inputs
  const [emailOtp, setEmailOtp] = useState('');
  const [smsOtp, setSmsOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // Login form
  const [loginMode, setLoginMode] = useState<'PASSWORD' | 'OTP'>('PASSWORD');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtpCountdown, setLoginOtpCountdown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (loginOtpCountdown > 0) {
      timer = setTimeout(() => setLoginOtpCountdown(loginOtpCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [loginOtpCountdown]);

  if (!authModalState.isOpen) return null;

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedEmail && !trimmedPhone) {
      setError('Please provide at least one contact method: Mobile Number or Email (optional).');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        email: trimmedEmail,
        phone: trimmedPhone,
        role,
        password,
        district,
        state,
        village: village || undefined,
        fpoName: role === 'FPO_REP' ? fpoName : undefined,
        fpoFarmersCount: role === 'FPO_REP' ? Number(fpoFarmersCount) : undefined,
        vehicleType: role === 'LOGISTICS' ? vehicleType : undefined,
        vehicleNumber: role === 'LOGISTICS' ? vehicleNumber : undefined,
      };

      const res = await api.register(payload);
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      // If user gives both email and mobile, give them the choice
      if (trimmedEmail && trimmedPhone) {
        setStep('CHOOSE_VERIFICATION');
        setSuccess('Account created! Please choose where to receive your 6-digit verification OTP.');
        setLoading(false);
      } else if (trimmedEmail) {
        // User gave only email -> OTP directly to email
        try {
          const emailRes = await api.sendEmailOtp(trimmedEmail);
          setStep('EMAIL_OTP');
          setResendCountdown(30);
          setSuccess(emailRes.message || `OTP sent directly to ${trimmedEmail}. Enter the 6-digit code.`);
          if (emailRes.demoOtp) setDemoOtp(emailRes.demoOtp);
        } catch (err: any) {
          setError(err.message || 'Failed to send Email OTP');
        } finally {
          setLoading(false);
        }
      } else {
        // User gave only mobile -> OTP directly to mobile
        try {
          const smsRes = await api.sendSmsOtp(trimmedPhone);
          setStep('SMS_OTP');
          setResendCountdown(30);
          setSuccess(smsRes.message || `OTP sent directly to ${trimmedPhone}. Enter the 6-digit code.`);
          if (smsRes.demoOtp) setDemoOtp(smsRes.demoOtp);
        } catch (err: any) {
          setError(err.message || 'Failed to send SMS OTP');
        } finally {
          setLoading(false);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setLoading(false);
    }
  };

  const handleChooseEmail = async () => {
    setError(null);
    setLoading(true);
    try {
      const emailRes = await api.sendEmailOtp(email.trim());
      setStep('EMAIL_OTP');
      setResendCountdown(30);
      setSuccess(emailRes.message || 'Please enter the 6-digit OTP sent to your email.');
      if (emailRes.demoOtp) setDemoOtp(emailRes.demoOtp);
    } catch (err: any) {
      setError(err.message || 'Failed to send Email OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleChooseSms = async () => {
    setError(null);
    setLoading(true);
    try {
      const smsRes = await api.sendSmsOtp(phone.trim());
      setStep('SMS_OTP');
      setResendCountdown(30);
      setSuccess(smsRes.message || 'Please enter the 6-digit OTP sent to your mobile phone.');
      if (smsRes.demoOtp) setDemoOtp(smsRes.demoOtp);
    } catch (err: any) {
      setError(err.message || 'Failed to send SMS OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.verifyEmailOtp(email.trim(), emailOtp.trim());
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      setStep('DONE');
      setSuccess('Email verified! Your SeedhaMandi profile is active.');
      // Auto login with email or phone
      await login(email.trim() || phone.trim(), password);
      setTimeout(() => {
        closeAuthModal();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Email OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySmsOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.verifySmsOtp(phone.trim(), smsOtp.trim());
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      setStep('DONE');
      setSuccess('Mobile verified! Your SeedhaMandi profile is active.');
      // Auto login with phone or email
      await login(phone.trim() || email.trim(), password);
      setTimeout(() => {
        closeAuthModal();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'SMS OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendLoginOtp = async () => {
    setError(null);
    setSuccess(null);
    const trimmed = loginIdentifier.trim();
    if (!trimmed) {
      setError('Please enter your Email or Mobile Number to receive an OTP.');
      return;
    }
    setLoading(true);
    try {
      const isEmail = trimmed.includes('@');
      if (isEmail) {
        const res = await api.sendEmailOtp(trimmed);
        setSuccess(res.message || `OTP sent directly to ${trimmed}`);
        if (res.demoOtp) setDemoOtp(res.demoOtp);
      } else {
        const res = await api.sendSmsOtp(trimmed);
        setSuccess(res.message || `OTP sent directly to ${trimmed}`);
        if (res.demoOtp) setDemoOtp(res.demoOtp);
      }
      setLoginOtpSent(true);
      setLoginOtpCountdown(30);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = loginIdentifier.trim();
    if (!trimmed || !loginOtp.trim()) {
      setError('Please provide your identifier and 6-digit OTP code.');
      return;
    }
    setLoading(true);
    const res = await loginWithOtp(trimmed, loginOtp.trim());
    setLoading(false);
    if (res.success) {
      closeAuthModal();
    } else {
      setError(res.message || 'Invalid OTP code.');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(loginIdentifier, loginPassword);
    setLoading(false);

    if (res.success) {
      closeAuthModal();
    } else {
      setError(res.message || 'Invalid credentials.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-400 text-emerald-950 flex items-center justify-center font-black">
              <Sprout className="w-5 h-5 text-emerald-950" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight">
                {tab === 'login' ? 'Sign In to SeedhaMandi' : 'Create Verified Account'}
              </h3>
              <p className="text-xs text-emerald-200">
                Direct Agricultural Trading with 2-Factor OTP Security
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-stone-200 bg-stone-50">
          <button
            onClick={() => {
              setTab('login');
              setError(null);
              setSuccess(null);
              setLoginOtpSent(false);
              setLoginOtp('');
            }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition ${
              tab === 'login'
                ? 'bg-white text-emerald-800 border-b-2 border-emerald-700'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Registered Login
          </button>
          <button
            onClick={() => {
              setTab('register');
              setStep('FORM');
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition ${
              tab === 'register'
                ? 'bg-white text-emerald-800 border-b-2 border-emerald-700'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            New Registration & OTP
          </button>
        </div>

        <div className="p-6">
          {/* Status Banners */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* ======================= LOGIN TAB ======================= */}
          {tab === 'login' && (
            <div className="space-y-4">
              {/* Login Method Toggle: Password vs OTP */}
              <div className="flex bg-stone-100 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('PASSWORD');
                    setError(null);
                    setSuccess(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                    loginMode === 'PASSWORD'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Password Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('OTP');
                    setError(null);
                    setSuccess(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                    loginMode === 'OTP'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  OTP Sign In
                </button>
              </div>

              {loginMode === 'PASSWORD' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Email or Mobile Number
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={e => setLoginIdentifier(e.target.value)}
                        placeholder="e.g. 9823411201 or ramesh.farmer@seedhamandi.in"
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-md transition active:scale-98 flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                    <span>{loading ? 'Authenticating...' : 'Secure Sign In'}</span>
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Email or Mobile Number
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={e => setLoginIdentifier(e.target.value)}
                        placeholder="e.g. 9823411201 or ramesh.farmer@seedhamandi.in"
                        disabled={loginOtpSent}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-600 focus:bg-white disabled:opacity-60"
                      />
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      OTP will go directly to whichever option (Email or Mobile) you provide.
                    </p>
                  </div>

                  {!loginOtpSent ? (
                    <button
                      type="button"
                      onClick={() => handleSendLoginOtp()}
                      disabled={loading || !loginIdentifier.trim()}
                      className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-300" />
                      <span>{loading ? 'Sending OTP...' : 'Send OTP to Email / Mobile'}</span>
                    </button>
                  ) : (
                    <form onSubmit={handleVerifyLoginOtp} className="space-y-4 text-center">
                      {demoOtp && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-2 text-sm flex flex-col items-center">
                          <span className="font-bold text-amber-800 mb-1">Demo Mode Active</span>
                          <span className="text-amber-900">Your verification code is: <strong className="text-lg bg-amber-100 px-2 py-0.5 rounded">{demoOtp}</strong></span>
                          <button
                            type="button"
                            onClick={() => setLoginOtp(demoOtp)}
                            className="mt-2 px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-md font-semibold text-xs transition"
                          >
                            Auto-fill OTP
                          </button>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 text-left">
                          Enter 6-Digit Login OTP
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={loginOtp}
                          onChange={e => setLoginOtp(e.target.value)}
                          placeholder="Enter OTP"
                          className="w-48 mx-auto text-center tracking-widest text-2xl font-mono font-bold bg-stone-50 border-2 border-emerald-600 rounded-xl py-2 focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading || loginOtp.length < 6}
                        className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                      >
                        <span>{loading ? 'Verifying...' : 'Verify OTP & Sign In'}</span>
                      </button>

                      <div className="flex items-center justify-between text-xs text-stone-500 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setLoginOtpSent(false);
                            setLoginOtp('');
                          }}
                          className="text-stone-600 hover:text-stone-900 underline"
                        >
                          Change identifier
                        </button>
                        {loginOtpCountdown > 0 ? (
                          <span className="font-semibold">Resend OTP in {loginOtpCountdown}s</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendLoginOtp()}
                            className="text-emerald-700 font-bold hover:underline"
                          >
                            Resend OTP
                          </button>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Instant Demo Account Selector */}
              <div className="pt-4 border-t border-stone-200">
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 text-center">
                  Or Instant 1-Click Persona Sign-In:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      quickSwitchRole('CONSUMER');
                      closeAuthModal();
                    }}
                    className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-left transition text-xs"
                  >
                    <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" /> Ananya (Consumer)
                    </div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">Household Buyer</div>
                  </button>

                  <button
                    onClick={() => {
                      quickSwitchRole('FARMER');
                      closeAuthModal();
                    }}
                    className="p-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-left transition text-xs"
                  >
                    <div className="font-bold text-amber-900 flex items-center gap-1.5">
                      <Sprout className="w-3.5 h-3.5 text-amber-600" /> Ramesh Patel (Farmer)
                    </div>
                    <div className="text-[11px] text-amber-700 mt-0.5">Baramati, Pune</div>
                  </button>

                  <button
                    onClick={() => {
                      quickSwitchRole('FPO_REP');
                      closeAuthModal();
                    }}
                    className="p-2.5 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 text-left transition text-xs"
                  >
                    <div className="font-bold text-orange-900 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-orange-600" /> Sahyadri FPO
                    </div>
                    <div className="text-[11px] text-orange-700 mt-0.5">54 Village Farmers</div>
                  </button>

                  <button
                    onClick={() => {
                      quickSwitchRole('LOGISTICS');
                      closeAuthModal();
                    }}
                    className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-left transition text-xs"
                  >
                    <div className="font-bold text-blue-900 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-blue-600" /> KisanVahan Fleet
                    </div>
                    <div className="text-[11px] text-blue-700 mt-0.5">Refrigerated Transit</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================= REGISTER TAB ======================= */}
          {tab === 'register' && (
            <div>
              {step === 'FORM' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  {/* Role Selector Cards */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                      Select Your Role
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div
                        onClick={() => setRole('CONSUMER')}
                        className={`p-3 rounded-xl border cursor-pointer transition ${
                          role === 'CONSUMER'
                            ? 'border-emerald-600 bg-emerald-50 shadow-xs'
                            : 'border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs text-stone-800">
                          <ShoppingBag className="w-4 h-4 text-emerald-600" />
                          <span>Consumer / Buyer</span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1">Buy direct fresh produce</p>
                      </div>

                      <div
                        onClick={() => setRole('FARMER')}
                        className={`p-3 rounded-xl border cursor-pointer transition ${
                          role === 'FARMER'
                            ? 'border-amber-600 bg-amber-50 shadow-xs'
                            : 'border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs text-stone-800">
                          <Sprout className="w-4 h-4 text-amber-600" />
                          <span>Farmer (Direct)</span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1">Sell own harvest at 0% cut</p>
                      </div>

                      <div
                        onClick={() => setRole('FPO_REP')}
                        className={`p-3 rounded-xl border cursor-pointer transition ${
                          role === 'FPO_REP'
                            ? 'border-orange-600 bg-orange-50 shadow-xs'
                            : 'border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs text-stone-800">
                          <Users className="w-4 h-4 text-orange-600" />
                          <span>FPO Representative</span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1">List for village cluster</p>
                      </div>

                      <div
                        onClick={() => setRole('LOGISTICS')}
                        className={`p-3 rounded-xl border cursor-pointer transition ${
                          role === 'LOGISTICS'
                            ? 'border-blue-600 bg-blue-50 shadow-xs'
                            : 'border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs text-stone-800">
                          <Truck className="w-4 h-4 text-blue-600" />
                          <span>Logistics Partner</span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1">Cold chain farm delivery</p>
                      </div>
                    </div>
                  </div>

                  {/* Primary Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Ramesh Patel"
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Mobile Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+91 98234 11201"
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Email (optional)</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="ramesh@seedhamandi.in"
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Password</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Provide either Mobile Number or Email (optional). If both are given, you can choose where to receive OTP.
                  </p>

                  {/* Conditional Role Details */}
                  {role === 'FPO_REP' && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl space-y-2">
                      <div className="text-xs font-bold text-orange-900">FPO Organization Details:</div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          value={fpoName}
                          onChange={e => setFpoName(e.target.value)}
                          placeholder="FPO Name (e.g. Sahyadri Kisan Samriddhi)"
                          className="bg-white border border-orange-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                        <input
                          type="number"
                          required
                          value={fpoFarmersCount}
                          onChange={e => setFpoFarmersCount(e.target.value)}
                          placeholder="Farmer Members (e.g. 54)"
                          className="bg-white border border-orange-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {role === 'LOGISTICS' && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                      <div className="text-xs font-bold text-blue-900">Logistics Vehicle Information:</div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          value={vehicleType}
                          onChange={e => setVehicleType(e.target.value)}
                          placeholder="Vehicle Type (e.g. Tata 407 3.5T)"
                          className="bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                        <input
                          type="text"
                          required
                          value={vehicleNumber}
                          onChange={e => setVehicleNumber(e.target.value)}
                          placeholder="Reg. Number (e.g. MH 12 QX 4902)"
                          className="bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={district}
                      onChange={e => setDistrict(e.target.value)}
                      placeholder="District / City"
                      className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs"
                    />
                    <input
                      type="text"
                      value={state}
                      onChange={e => setState(e.target.value)}
                      placeholder="State (e.g. Maharashtra)"
                      className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Creating Account...' : 'Continue to OTP Verification'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* STEP 1.5: CHOOSE OTP METHOD */}
              {step === 'CHOOSE_VERIFICATION' && (
                <div className="space-y-4 text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-stone-900 text-base">Choose Verification Method</h4>
                    <p className="text-xs text-stone-500 mt-1">
                      Where would you like to receive your 6-digit OTP?
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <button
                      onClick={handleChooseEmail}
                      disabled={loading}
                      className="p-4 border-2 border-stone-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50 transition flex flex-col items-center gap-2"
                    >
                      <Mail className="w-6 h-6 text-emerald-700" />
                      <span className="font-bold text-stone-800 text-sm">Send to Email</span>
                      <span className="text-[11px] text-stone-500 truncate max-w-full">{email}</span>
                    </button>
                    <button
                      onClick={handleChooseSms}
                      disabled={loading}
                      className="p-4 border-2 border-stone-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50 transition flex flex-col items-center gap-2"
                    >
                      <Phone className="w-6 h-6 text-emerald-700" />
                      <span className="font-bold text-stone-800 text-sm">Send to Mobile</span>
                      <span className="text-[11px] text-stone-500 truncate max-w-full">{phone}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: EMAIL OTP */}
              {step === 'EMAIL_OTP' && (
                <form onSubmit={handleVerifyEmailOtp} className="space-y-4 text-center py-4">
                  {demoOtp && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-2 text-sm flex flex-col items-center">
                      <span className="font-bold text-amber-800 mb-1">Demo Mode Active</span>
                      <span className="text-amber-900">Your verification code is: <strong className="text-lg bg-amber-100 px-2 py-0.5 rounded">{demoOtp}</strong></span>
                      <button
                        type="button"
                        onClick={() => setEmailOtp(demoOtp)}
                        className="mt-2 px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-md font-semibold text-xs transition"
                      >
                        Auto-fill OTP
                      </button>
                    </div>
                  )}
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-stone-900 text-base">Verify Email</h4>
                    <p className="text-xs text-stone-500 mt-1">
                      Enter the 6-digit code sent to <span className="font-semibold text-stone-800">{email}</span>
                    </p>
                  </div>

                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={emailOtp}
                    onChange={e => setEmailOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-48 mx-auto text-center tracking-widest text-2xl font-mono font-bold bg-stone-50 border-2 border-emerald-600 rounded-xl py-2 focus:outline-none"
                  />

                  <button
                    type="submit"
                    disabled={loading || emailOtp.length < 6}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md transition"
                  >
                    {loading ? 'Verifying...' : 'Verify & Complete Account Activation'}
                  </button>
                  <div className="mt-4 text-xs font-semibold text-stone-500">
                    {resendCountdown > 0 ? (
                      <span>Resend OTP in {resendCountdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleChooseEmail}
                        className="text-emerald-700 hover:underline cursor-pointer"
                        disabled={loading}
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* STEP 3: SMS OTP */}
              {step === 'SMS_OTP' && (
                <form onSubmit={handleVerifySmsOtp} className="space-y-4 text-center py-4">
                  {demoOtp && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-2 text-sm flex flex-col items-center">
                      <span className="font-bold text-amber-800 mb-1">Demo Mode Active</span>
                      <span className="text-amber-900">Your verification code is: <strong className="text-lg bg-amber-100 px-2 py-0.5 rounded">{demoOtp}</strong></span>
                      <button
                        type="button"
                        onClick={() => setSmsOtp(demoOtp)}
                        className="mt-2 px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-md font-semibold text-xs transition"
                      >
                        Auto-fill OTP
                      </button>
                    </div>
                  )}
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-stone-900 text-base">Verify Mobile SMS</h4>
                    <p className="text-xs text-stone-500 mt-1">
                      Enter the 6-digit SMS code sent to <span className="font-semibold text-stone-800">{phone}</span>
                    </p>
                  </div>

                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={smsOtp}
                    onChange={e => setSmsOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-48 mx-auto text-center tracking-widest text-2xl font-mono font-bold bg-stone-50 border-2 border-emerald-600 rounded-xl py-2 focus:outline-none"
                  />

                  <button
                    type="submit"
                    disabled={loading || smsOtp.length < 6}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md transition"
                  >
                    {loading ? 'Verifying Mobile...' : 'Verify & Complete Account Activation'}
                  </button>
                  <div className="mt-4 text-xs font-semibold text-stone-500">
                    {resendCountdown > 0 ? (
                      <span>Resend OTP in {resendCountdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleChooseSms}
                        className="text-emerald-700 hover:underline cursor-pointer"
                        disabled={loading}
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </form>
              )}

              {step === 'DONE' && (
                <div className="text-center py-8 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="font-extrabold text-stone-900 text-lg">Account Activated!</h4>
                  <p className="text-xs text-stone-600">
                    Welcome to SeedhaMandi. Redirecting you to your workspace...
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
