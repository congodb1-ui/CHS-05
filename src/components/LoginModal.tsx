import React, { useState, useEffect } from 'react';
import { useSociety } from '../context/SocietyContext';
import {
  X,
  ShieldCheck,
  Building,
  KeyRound,
  CheckCircle2,
  Lock,
  AlertTriangle,
  ArrowRight,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  Building2,
  User,
  Phone,
  Camera,
  Upload,
} from 'lucide-react';
import { ALL_SOCIETY_FLATS } from '../types';
import { compressImageFile } from '../lib/imageUtils';
import { uploadToCHSStorage } from '../lib/supabase';

export const LoginModal: React.FC = () => {
  const {
    isLoginModalOpen,
    closeLoginModal,
    loginModalTab,
    setLoginModalTab,
    signInWithSupabase,
    signUpWithSupabase,
    setActiveTab,
    isSupabaseOnline,
    profiles,
    resetPasswordForEmail,
  } = useSociety();

  // Active form tab
  const [activeTab, setActiveTabMode] = useState<'login' | 'register'>('login');

  // Forgot Password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');

  // Sign In Form State - Clean manual input, no demo autofills
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regPhone, setRegPhone] = useState('');
  const [regTower, setRegTower] = useState<'Tower A' | 'Tower B' | 'Tower C'>('Tower A');
  const [regFlat, setRegFlat] = useState('A-101');
  const [regOwnership, setRegOwnership] = useState<'Owner' | 'Tenant'>('Owner');
  const [regAvatarUrl, setRegAvatarUrl] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Sync with context prop when opened
  useEffect(() => {
    if (loginModalTab) {
      setActiveTabMode(loginModalTab);
    }
    setLoginError('');
    setRegError('');
    setRegSuccess('');
  }, [loginModalTab, isLoginModalOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLoginModalOpen) {
        closeLoginModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoginModalOpen, closeLoginModal]);

  if (!isLoginModalOpen) return null;

  // Predefined flats strictly filtered by selected tower (Tower A, Tower B, or Tower C)
  const availableFlatsForTower = ALL_SOCIETY_FLATS.filter((f) => {
    if (regTower === 'Tower A') return f.startsWith('A-');
    if (regTower === 'Tower B') return f.startsWith('B-');
    return f.startsWith('C-');
  });

  // Check if flat is already registered for this specific ownership type (Dual-User: 1 Owner + 1 Tenant)
  const isFlatOccupiedForType = (flatNo: string, type: 'Owner' | 'Tenant') => {
    return profiles.some(
      (p) => p.flatNo.toUpperCase() === flatNo.toUpperCase() && p.ownershipType === type && p.status !== 'Rejected'
    );
  };

  const getFlatOccupancyLabel = (flatNo: string) => {
    const hasOwner = isFlatOccupiedForType(flatNo, 'Owner');
    const hasTenant = isFlatOccupiedForType(flatNo, 'Tenant');
    if (hasOwner && hasTenant) return '(Fully Registered: Owner + Tenant)';
    if (hasOwner) return '(Owner Registered · Tenant Slot Open)';
    if (hasTenant) return '(Tenant Registered · Owner Slot Open)';
    return '(Available)';
  };

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await signInWithSupabase(loginIdentifier.trim(), loginPassword);

      if (!res.success) {
        setLoginError(res.error || 'Invalid credentials. Please verify your registered email or flat number.');
      } else {
        if (res.isPending) {
          setActiveTab('home');
        } else if (res.role === 'admin' || res.role === 'mc_member' || res.role === 'secretary') {
          setActiveTab('registry');
        } else {
          setActiveTab('home');
        }
        closeLoginModal();
      }
    } catch (err: any) {
      setLoginError(err.message || 'An unexpected error occurred during authentication.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const storageRes = await uploadToCHSStorage(file, 'avatars');
        if (storageRes.success && storageRes.publicUrl) {
          setRegAvatarUrl(storageRes.publicUrl);
        } else {
          const compressed = await compressImageFile(file, { maxWidth: 600, maxHeight: 600, quality: 0.85 });
          setRegAvatarUrl(compressed);
        }
      } catch (err) {
        console.warn('Failed to upload avatar to CHS-Storage:', err);
      }
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters in length.');
      return;
    }

    setRegLoading(true);

    try {
      const res = await signUpWithSupabase({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        phone: regPhone.trim(),
        avatarUrl: regAvatarUrl.trim(),
        tower: regTower,
        flatNo: regFlat,
        ownershipType: regOwnership,
      });

      if (!res.success) {
        setRegError(res.error || 'Registration failed.');
      } else {
        setRegSuccess(
          `Registration submitted for Flat [${regFlat}]! Your account has been registered with "Pending Approval" status. Solitaire CHS Managing Committee will verify ownership documents before unlocking full resident modules.`
        );
        setRegName('');
        setRegEmail('');
        setRegPassword('');
        setRegPhone('');
        setRegAvatarUrl('');
      }
    } catch (err: any) {
      setRegError(err.message || 'Registration failed. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeLoginModal();
      }}
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-600 rounded-xl shadow-xs text-white">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Solitaire CHS Portal
                </h2>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] text-emerald-300 font-medium">
                  {isSupabaseOnline ? 'Supabase Authentication Active' : 'Authorized Secure Access'}
                </span>
                <span className="text-slate-500 text-[10px]">· SSL 256-bit</span>
              </div>
            </div>
          </div>
          <button
            onClick={closeLoginModal}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close authentication modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTabMode('login');
              setLoginModalTab('login');
              setLoginError('');
              setRegError('');
              setRegSuccess('');
            }}
            className={`flex-1 py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-all text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'border-teal-700 text-teal-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${activeTab === 'login' ? 'text-teal-700' : 'text-slate-400'}`} />
            <span>Authorized Portal Login</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTabMode('register');
              setLoginModalTab('register');
              setLoginError('');
              setRegError('');
              setRegSuccess('');
            }}
            className={`flex-1 py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-all text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'register'
                ? 'border-teal-700 text-teal-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Building2 className={`w-3.5 h-3.5 ${activeTab === 'register' ? 'text-teal-700' : 'text-slate-400'}`} />
            <span>New Flat Registration</span>
          </button>
        </div>

        {/* Scrollable Form Content Body */}
        <div className="overflow-y-auto max-h-[calc(88vh-130px)] p-6 text-xs">
          {/* TAB 1: AUTHORIZED PORTAL LOGIN (Clean Production Version) */}
          {activeTab === 'login' && (
            <div className="space-y-4">
              <div className="text-slate-600 pb-1">
                <span className="font-medium text-slate-600">
                  Enter your registered society email address, flat number (e.g. A-402, B-601, C-302), or member ID to sign in.
                </span>
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-start gap-2.5 font-medium animate-in fade-in duration-150">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-800">{loginError}</p>
                    <p className="text-[11px] text-red-600 mt-0.5">
                      Ensure your email or flat number is registered and your password is typed correctly.
                    </p>
                  </div>
                </div>
              )}

              {showForgotPassword ? (
                <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-teal-700" />
                      <span className="font-bold text-slate-900 text-xs">Self-Service Password Recovery</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-600">
                    Enter your registered personal email address. We will verify your account and trigger an official password recovery link via Supabase Auth.
                  </p>

                  {forgotError && (
                    <div className="p-2.5 bg-red-50 text-red-700 rounded-lg border border-red-200 text-xs font-medium flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-600" />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  {forgotSuccess && (
                    <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                      <span>{forgotSuccess}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800 block text-xs">Registered Personal Email</label>
                    <input
                      type="email"
                      required
                      placeholder="resident@gmail.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-teal-700"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={forgotLoading || !forgotEmail.trim()}
                      onClick={async () => {
                        setForgotLoading(true);
                        setForgotError('');
                        setForgotSuccess('');
                        const res = await resetPasswordForEmail(forgotEmail.trim());
                        setForgotLoading(false);
                        if (res.success) {
                          setForgotSuccess(res.message);
                        } else {
                          setForgotError(res.message || 'Failed to trigger reset email.');
                        }
                      }}
                      className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:bg-teal-400"
                    >
                      {forgotLoading ? 'Sending Link...' : 'Send Recovery Email'}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Identifier Input */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block text-xs">
                      Registered Email Address / Flat Number / Member ID
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. resident@example.com or A-402"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-teal-700 focus:border-teal-700 text-xs font-medium transition-colors shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-slate-800 block text-xs">Account Password</label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setForgotEmail(loginIdentifier.includes('@') ? loginIdentifier : '');
                          setForgotError('');
                          setForgotSuccess('');
                        }}
                        className="text-[11px] font-semibold text-teal-700 hover:text-teal-800 hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter account password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-teal-700 focus:border-teal-700 text-xs font-medium transition-colors shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        aria-label="Toggle password visibility"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember session */}
                  <div className="flex items-center justify-between pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-teal-700 focus:ring-teal-700 w-3.5 h-3.5"
                      />
                      <span>Remember session on this device</span>
                    </label>
                  </div>

                  {/* Sign In Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 disabled:bg-teal-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all text-xs"
                    >
                      {loginLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying Credentials...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign In to Portal</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Security Disclaimer Box - Clean padding below Sign In action */}
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-slate-500 text-[11px] leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  Portal access is restricted to verified residents of Kool Homes Solitaire CHS. If you haven't registered your flat yet, switch to the <strong>New Flat Registration</strong> tab above.
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: NEW FLAT RESIDENT REGISTRATION */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-950 flex items-start gap-2.5 leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Strict Single-Primary-Member Policy:</strong>
                  <span>Solitaire CHS bylaws permit exactly 1 verified primary account per flat across Tower A, Tower B, and Tower C.</span>
                </div>
              </div>

              {regError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-start gap-2.5 font-medium animate-in fade-in duration-150">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccess && (
                <div className="p-3.5 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-start gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    <span>{regSuccess}</span>
                  </div>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTabMode('login');
                        setLoginModalTab('login');
                      }}
                      className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-800 transition-colors cursor-pointer"
                    >
                      Proceed to Portal Login &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* Tower & Flat Selector - Standardized to Tower A, Tower B, Tower C */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Select Tower <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    value={regTower}
                    onChange={(e) => {
                      const tower = e.target.value as 'Tower A' | 'Tower B' | 'Tower C';
                      setRegTower(tower);
                      setRegFlat(tower === 'Tower A' ? 'A-101' : tower === 'Tower B' ? 'B-101' : 'C-101');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:border-teal-600 focus:outline-none text-xs"
                  >
                    <option value="Tower A">Tower A</option>
                    <option value="Tower B">Tower B</option>
                    <option value="Tower C">Tower C</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Predefined Flat Number <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    value={regFlat}
                    onChange={(e) => setRegFlat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:border-teal-600 focus:outline-none text-xs"
                  >
                    {availableFlatsForTower.map((flat) => {
                      const occupiedForThisRole = isFlatOccupiedForType(flat, regOwnership);
                      const statusLabel = getFlatOccupancyLabel(flat);
                      return (
                        <option key={flat} value={flat} disabled={occupiedForThisRole}>
                          {flat} {statusLabel}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Resident Full Name & Ownership */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Full Resident Name <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Anand Kulkarni"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:border-teal-600 focus:outline-none text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Occupancy / Ownership <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    value={regOwnership}
                    onChange={(e) => setRegOwnership(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:border-teal-600 focus:outline-none text-xs"
                  >
                    <option value="Owner">Flat Owner</option>
                    <option value="Tenant">Registered Tenant</option>
                  </select>
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Email Address <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="resident@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:border-teal-600 focus:outline-none text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Mobile Phone Number <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98220 00000"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:border-teal-600 focus:outline-none text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* MODULE 6: Profile Photo (Optional) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="font-semibold text-slate-800 block text-xs">
                  Profile Photo (Optional)
                </label>
                <div className="flex items-center gap-3">
                  {regAvatarUrl ? (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-teal-600 shrink-0">
                      <img
                        src={regAvatarUrl}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setRegAvatarUrl('')}
                        className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                        title="Remove photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 border border-slate-300">
                      <Camera className="w-5 h-5 text-slate-400" />
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg text-xs font-semibold text-teal-900 cursor-pointer shadow-2xs transition-colors">
                        <Upload className="w-3.5 h-3.5 text-teal-700" />
                        <span>Upload Photo from Device (PNG/JPEG)</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />
                      </label>
                      {regAvatarUrl && (
                        <button
                          type="button"
                          onClick={() => setRegAvatarUrl('')}
                          className="text-[11px] text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      Local upload saved to Supabase: CHS-Storage/avatars/
                    </span>
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Create Account Password <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-8 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:border-teal-600 focus:outline-none text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500">
                  Awaiting MC verification before full module access.
                </span>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={closeLoginModal}
                    className="px-3.5 py-2 border border-slate-300 text-slate-700 rounded-xl font-medium cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={regLoading}
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:bg-teal-400 text-white rounded-xl font-bold cursor-pointer shadow-sm flex items-center gap-2 transition-all"
                  >
                    {regLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Unit...</span>
                      </>
                    ) : (
                      <span>Register Residential Unit</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
