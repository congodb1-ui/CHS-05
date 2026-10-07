import React, { useState } from 'react';
import { useSociety } from '../../context/SocietyContext';
import {
  Users,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  UserPlus,
  Lock,
  Eye,
  EyeOff,
  Building,
  KeyRound,
  FileCheck,
  AlertCircle,
  XCircle,
  Mail,
  Phone,
} from 'lucide-react';
import { TowerId } from '../../types';

export const DirectoryView: React.FC = () => {
  const {
    profiles,
    approveMemberProfile,
    addMemberProfile,
    role,
    userFlat,
    currentMemberId,
    userName,
  } = useSociety();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTower, setSelectedTower] = useState<'All' | TowerId>('All');
  const [approvalFilter, setApprovalFilter] = useState<'All' | 'Approved' | 'Pending'>('All');
  const [showSignupModal, setShowSignupModal] = useState(false);

  // New Signup Form
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newTower, setNewTower] = useState<TowerId>('Tower A');
  const [newFlat, setNewFlat] = useState('');
  const [newOwnership, setNewOwnership] = useState<'Owner' | 'Tenant'>('Owner');
  const [signupSuccessMsg, setSignupSuccessMsg] = useState<string | null>(null);

  const isAdminOrSecretary = role === 'secretary' || role === 'admin';

  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.memberId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.flatNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTower = selectedTower === 'All' || p.tower === selectedTower;
    const matchesApproval =
      approvalFilter === 'All' ||
      (approvalFilter === 'Approved' && p.isApproved) ||
      (approvalFilter === 'Pending' && !p.isApproved);

    return matchesSearch && matchesTower && matchesApproval;
  });

  const pendingCount = profiles.filter((p) => !p.isApproved).length;

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFlat = newFlat.trim().toUpperCase();
    const genId = addMemberProfile({
      name: newFullName,
      email: newEmail,
      phone: newPhone,
      tower: newTower,
      flatNo: cleanFlat,
      role: 'member',
      ownershipType: newOwnership,
    });

    setSignupSuccessMsg(
      `Registration submitted! Your Member ID is ${genId}. Your account is created with is_approved=FALSE and is currently in the Managing Committee approval queue.`
    );

    setTimeout(() => {
      setSignupSuccessMsg(null);
      setShowSignupModal(false);
      setNewFullName('');
      setNewEmail('');
      setNewPhone('');
      setNewFlat('');
    }, 3500);
  };

  // Helper to mask phone and email for non-admin viewers (Row Level Security & Privacy)
  const maskPhone = (phoneStr: string) => {
    if (isAdminOrSecretary) return phoneStr;
    if (phoneStr.length < 6) return '••••••••';
    return phoneStr.slice(0, 6) + ' •••••';
  };

  const maskEmail = (emailStr: string) => {
    if (isAdminOrSecretary) return emailStr;
    const parts = emailStr.split('@');
    if (parts.length < 2) return '••••••@••••';
    const namePart = parts[0];
    const maskedName = namePart.length > 2 ? `${namePart.slice(0, 2)}••••••` : '••••';
    return `${maskedName}@${parts[1]}`;
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                KOOL HOMES SOLITAIRE CO-OP HOUSING SOCIETY LTD.
              </span>
              <span className="text-[10px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded">
                RLS Protected Community Directory
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Community Member Directory & Access Control
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Dual-layer data visibility: Non-confidential details (Name, Tower, Flat #, Role Badge) are visible to approved members, while private contact info is masked under Row Level Security.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowSignupModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register New Member</span>
            </button>
          </div>
        </div>

        {/* Visibility Strip Notice */}
        <div className="mt-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-700">
            {isAdminOrSecretary ? (
              <>
                <Eye className="w-4 h-4 text-teal-700 shrink-0" />
                <span>
                  <strong>Admin Privacy View Active:</strong> As Secretary/Admin, you have complete unmasked access to member phone numbers, email handles, and approval queues.
                </span>
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 text-slate-500 shrink-0" />
                <span>
                  <strong>Resident Member Privacy Active:</strong> Contact numbers and emails are masked under Society Privacy Bylaws. Only public flat assignments & role badges are shown.
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono bg-white px-2 py-1 rounded border border-slate-200 text-slate-700">
              Your Member ID: <strong>{currentMemberId}</strong>
            </span>
          </div>
        </div>

        {/* Pending Approval Alert for Admin/Secretary */}
        {isAdminOrSecretary && pendingCount > 0 && (
          <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Action Required:</strong> {pendingCount} new resident account signup(s) are awaiting Managing Committee verification (is_approved = FALSE).
              </span>
            </div>
            <button
              onClick={() => setApprovalFilter('Pending')}
              className="font-bold underline text-amber-900 hover:text-amber-800 cursor-pointer"
            >
              Review Pending Signups &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Name, Flat (e.g. A-402), or Member ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-teal-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(['All', 'Tower A', 'Tower B', 'Tower C'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTower(t)}
                className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  selectedTower === t
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(['All', 'Approved', 'Pending'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setApprovalFilter(st)}
                className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  approvalFilter === st
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="py-3 px-4">Member ID</th>
                <th className="py-3 px-4">Resident Name</th>
                <th className="py-3 px-4">Tower & Flat</th>
                <th className="py-3 px-4">Tenancy Type</th>
                <th className="py-3 px-4">Role Badge</th>
                <th className="py-3 px-4">Contact (RLS Masked)</th>
                <th className="py-3 px-4">Approval Status</th>
                {isAdminOrSecretary && <th className="py-3 px-4 text-right">Committee Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-500">
                    No member profiles found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-800">
                      {member.memberId}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 font-bold text-[11px] flex items-center justify-center border border-teal-200 shrink-0">
                            {member.name ? member.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                          </div>
                        )}
                        <span>{member.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{member.flatNo}</span>
                      <span className="text-[11px] text-slate-500 block">{member.tower}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          member.ownershipType === 'Owner'
                            ? 'bg-slate-100 text-slate-800'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {member.ownershipType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          member.role === 'admin'
                            ? 'bg-slate-900 text-white'
                            : member.role === 'secretary'
                            ? 'bg-purple-100 text-purple-900'
                            : member.role === 'supervisor'
                            ? 'bg-teal-100 text-teal-900'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      <div className="flex flex-col">
                        <span>{maskPhone(member.phone)}</span>
                        <span className="text-slate-400">{maskEmail(member.email)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {member.isApproved ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approved</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                          <Clock className="w-3 h-3" />
                          <span>Pending MC Approval</span>
                        </span>
                      )}
                    </td>
                    {isAdminOrSecretary && (
                      <td className="py-3 px-4 text-right">
                        {!member.isApproved ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => approveMemberProfile(member.id, true)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => approveMemberProfile(member.id, false)}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[11px] font-semibold cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Active Clearance</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Register New Member (Approval Flow) */}
      {showSignupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-700 block">Supabase Auth & Profiles</span>
                <h3 className="text-base font-bold text-slate-900">Resident Member Registration</h3>
              </div>
              <button
                onClick={() => setShowSignupModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {signupSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs leading-relaxed space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Account Registered Successfully</span>
                </div>
                <p>{signupSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSignupSubmit} className="space-y-3 text-xs">
                <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-lg text-teal-900 text-[11px] leading-relaxed">
                  <strong>Admin Approval Workflow:</strong> Upon submission, your unique Member ID (e.g. <code>SOL-A-302</code>) is provisioned with <code>is_approved = FALSE</code> until verified by Estate Office or Secretary.
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ananya Deshmukh"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Select Tower</label>
                    <select
                      value={newTower}
                      onChange={(e) => setNewTower(e.target.value as TowerId)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                    >
                      <option value="Tower A">Tower A</option>
                      <option value="Tower B">Tower B</option>
                      <option value="Tower C">Tower C</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Flat / Unit Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. A-302"
                      value={newFlat}
                      onChange={(e) => setNewFlat(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Email Handle</label>
                    <input
                      type="email"
                      required
                      placeholder="ananya@gmail.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98555 77123"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Residency Status</label>
                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="ownership"
                        checked={newOwnership === 'Owner'}
                        onChange={() => setNewOwnership('Owner')}
                      />
                      <span>Flat Owner</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="ownership"
                        checked={newOwnership === 'Tenant'}
                        onChange={() => setNewOwnership('Tenant')}
                      />
                      <span>Registered Tenant</span>
                    </label>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSignupModal(false)}
                    className="px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold cursor-pointer"
                  >
                    Register Member &rarr;
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
