import React from 'react';
import { useSociety } from '../../context/SocietyContext';
import {
  ShieldAlert,
  Clock,
  XCircle,
  FileText,
  PhoneCall,
  LogOut,
  Building2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

export const PendingAccessView: React.FC = () => {
  const {
    userName,
    userFlat,
    currentProfile,
    logout,
    setIsEmergencyOpen,
    isRejected,
  } = useSociety();

  const isPending = !isRejected;

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 space-y-8 animate-in fade-in duration-300">
      {/* Top Banner Notice */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border shadow-lg ${
          isRejected
            ? 'bg-red-50 border-red-200 text-red-950'
            : 'bg-amber-50 border-amber-200 text-amber-950'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          <div
            className={`p-3.5 rounded-2xl shrink-0 self-start ${
              isRejected ? 'bg-red-600 text-white' : 'bg-amber-500 text-white shadow-md'
            }`}
          >
            {isRejected ? (
              <XCircle className="w-8 h-8" />
            ) : (
              <Clock className="w-8 h-8 animate-pulse" />
            )}
          </div>

          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isRejected
                    ? 'bg-red-200 text-red-900 border border-red-300'
                    : 'bg-amber-200 text-amber-900 border border-amber-300'
                }`}
              >
                {isRejected ? 'Application Rejected' : 'Verification In Progress'}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Solitaire CHS · Unit {userFlat}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isRejected
                ? `Registration Rejected for Flat ${userFlat}`
                : `Account Pending Verification — Flat ${userFlat}`}
            </h1>

            <p className="text-sm leading-relaxed text-slate-700">
              {isRejected
                ? 'Your flat registration could not be verified by the Managing Committee. Please review the committee remarks below or visit the Estate Office with your original agreement.'
                : 'Welcome to Solitaire Cooperative Housing Society. Your resident account has been submitted and is currently awaiting verification by a Managing Committee (MC Member) or Society Administrator.'}
            </p>

            {/* If Rejected, show committee remarks */}
            {isRejected && currentProfile?.reviewRemarks && (
              <div className="p-4 bg-white/80 border border-red-300 rounded-2xl text-xs space-y-1 mt-3">
                <span className="font-bold text-red-900 block">Committee Decision & Remarks:</span>
                <p className="text-red-800 text-sm font-medium">{currentProfile.reviewRemarks}</p>
                {currentProfile.reviewedAt && (
                  <span className="text-[11px] text-red-600 block mt-1">
                    Decision Date: {currentProfile.reviewedAt}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Application Details + Security Policy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Submitted Application Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserCheck className="w-5 h-5 text-teal-700" />
            <h2 className="text-base font-bold text-slate-900">Your Registered Unit Profile</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400 font-medium">Flat / Unit Number</span>
              <span className="font-mono font-bold text-slate-900 text-sm bg-slate-100 px-2 py-0.5 rounded">
                {userFlat}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400 font-medium">Resident Name</span>
              <span className="font-semibold text-slate-900">{userName}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400 font-medium">Ownership Type</span>
              <span className="font-semibold text-slate-800">{currentProfile?.ownershipType || 'Resident'}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400 font-medium">Email Address</span>
              <span className="font-mono text-slate-700">{currentProfile?.email || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400 font-medium">Phone Number</span>
              <span className="font-mono text-slate-700">{currentProfile?.phone || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-400 font-medium">Application Date</span>
              <span className="font-mono text-slate-700">{currentProfile?.registeredDate || 'Today'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Security & Confidentiality Restriction */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Lock className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900">Confidentiality Gate Enforcement</h2>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Under Solitaire CHS Bye-Laws (Maharashtra Cooperative Societies Act 1960), unverified accounts are strictly restricted from viewing:
            </p>

            <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
              <li>Society Member Directory & Contact details</li>
              <li>Financial Accounts, Maintenance Dues & Audit Reports</li>
              <li>Vendor Quotations & Work Order payment ledgers</li>
              <li>Amenity Slot Bookings (Swimming Pool, Gym, Clubhouse)</li>
              <li>Internal Helpdesk tickets & Staff Inspection reports</li>
            </ul>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
            Once an authorized committee member reviews your documents and grants approval, all resident portal privileges unlock automatically.
          </div>
        </div>
      </div>

      {/* Verification Timeline Tracker */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-center">
          Resident Onboarding Workflow
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Step 1: Registration</span>
            </div>
            <p className="text-[11px] text-emerald-700">
              Form submitted with flat selection and single-member validation.
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border space-y-1 ${
              isRejected
                ? 'border-red-200 bg-red-50/50'
                : 'border-amber-300 bg-amber-50/60 ring-2 ring-amber-400/20'
            }`}
          >
            <div
              className={`flex items-center gap-2 font-bold text-xs ${
                isRejected ? 'text-red-800' : 'text-amber-900'
              }`}
            >
              {isRejected ? (
                <XCircle className="w-4 h-4 text-red-600" />
              ) : (
                <Clock className="w-4 h-4 text-amber-600 animate-spin" />
              )}
              <span>Step 2: MC Verification</span>
            </div>
            <p className={`text-[11px] ${isRejected ? 'text-red-700' : 'text-amber-800'}`}>
              {isRejected
                ? 'Committee reviewed application: Rejected.'
                : 'Managing Committee review of sale deed or lease agreement.'}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1 opacity-70">
            <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
              <Lock className="w-4 h-4 text-slate-400" />
              <span>Step 3: Portal Unlocked</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Full resident access to amenities, parking, and helpdesk.
            </p>
          </div>
        </div>
      </div>

      {/* Action Footer Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={() => setIsEmergencyOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <PhoneCall className="w-4 h-4 text-red-600" />
          <span>Security Gate Emergency Helpline</span>
        </button>

        <button
          onClick={logout}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out & Return to Public View</span>
        </button>
      </div>
    </div>
  );
};
