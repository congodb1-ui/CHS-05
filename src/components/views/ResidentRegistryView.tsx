import React, { useState, useMemo } from 'react';
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
  AlertTriangle,
  History,
  Check,
  X,
  UserCheck,
  Layers,
  Edit2,
  Trash2,
  Upload,
} from 'lucide-react';
import { compressImageFile } from '../../lib/imageUtils';
import { uploadToCHSStorage } from '../../lib/supabase';
import { TowerId, UserRole, ROLE_LABELS, MemberProfile } from '../../types';

export const ResidentRegistryView: React.FC = () => {
  const {
    profiles,
    approveMemberProfile,
    updateUserRole,
    updateUserRoles,
    deleteMemberProfile,
    addMemberProfile,
    updateMemberProfile,
    adminResetPassword,
    resetPasswordForEmail,
    auditLogs,
    role,
    userFlat,
    currentMemberId,
    userName,
  } = useSociety();

  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'approvals' | 'roles' | 'audit'>('directory');
  const [approvalSubTab, setApprovalSubTab] = useState<'pending' | 'rejected'>('pending');

  // Admin Password Reset Modal State
  const [resetModalMember, setResetModalMember] = useState<MemberProfile | null>(null);
  const [tempPasswordInput, setTempPasswordInput] = useState<string>('Solitaire@2026');
  const [resetModalMsg, setResetModalMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resetLoading, setResetLoading] = useState<boolean>(false);

  // Admin Edit Member Modal State
  const [editingProfile, setEditingProfile] = useState<MemberProfile | null>(null);
  const [editForm, setEditForm] = useState<Partial<MemberProfile>>({});
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  // Directory Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTower, setSelectedTower] = useState<'All' | TowerId>('All');
  const [approvalFilter, setApprovalFilter] = useState<'All' | 'Approved' | 'Pending'>('All');

  // Approvals & Reject Modal State
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);

  // New Resident Registration Modal State
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newTower, setNewTower] = useState<TowerId>('Tower A');
  const [newFlat, setNewFlat] = useState('');
  const [newOwnership, setNewOwnership] = useState<'Owner' | 'Tenant'>('Owner');
  const [signupSuccessMsg, setSignupSuccessMsg] = useState<string | null>(null);
  const [signupErrorMsg, setSignupErrorMsg] = useState<string | null>(null);

  const isAdminOrSecretary = role === 'mc_member' || role === 'secretary' || role === 'admin';

  // Pending user profiles
  const pendingProfiles = useMemo(() => {
    return profiles.filter((p) => !p.isApproved && p.status !== 'Rejected');
  }, [profiles]);

  // Rejected user profiles
  const rejectedProfiles = useMemo(() => {
    return profiles.filter((p) => p.status === 'Rejected');
  }, [profiles]);

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
      (approvalFilter === 'Pending' && !p.isApproved && p.status !== 'Rejected');

    return matchesSearch && matchesTower && matchesApproval;
  });

  const handleConfirmReject = () => {
    if (!rejectTargetId) return;
    approveMemberProfile(rejectTargetId, false, rejectRemarks || 'Application rejected by Managing Committee.');
    setRejectTargetId(null);
    setRejectRemarks('');
    setApprovalSubTab('rejected');
  };

  const handleCreateNewMember = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupErrorMsg(null);
    setSignupSuccessMsg(null);

    const cleanFlat = newFlat.trim().toUpperCase();
    const existing = profiles.find((p) => p.flatNo.toUpperCase() === cleanFlat && p.status !== 'Rejected');
    if (existing) {
      setSignupErrorMsg(`Flat [${cleanFlat}] is already registered to ${existing.name}.`);
      return;
    }

    const memberId = addMemberProfile({
      name: newFullName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim(),
      tower: newTower,
      flatNo: cleanFlat,
      role: 'resident',
      ownershipType: newOwnership,
    });

    setSignupSuccessMsg(`Resident profile created for Flat [${cleanFlat}] (ID: ${memberId})!`);
    setNewFullName('');
    setNewEmail('');
    setNewPhone('');
    setNewFlat('');
    setTimeout(() => {
      setShowSignupModal(false);
      setSignupSuccessMsg(null);
    }, 2000);
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-200">
      {/* Executive Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold">
              <Building className="w-3.5 h-3.5 text-teal-600" />
              <span>Solitaire CHS Ltd. · Master Registry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Resident & Flat Registry
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              Centralized society census across Towers A & B. Enforces one verified member account per flat, governance verification, and role assignments.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isAdminOrSecretary && (
              <button
                onClick={() => setShowSignupModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Onboard Resident</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Registry Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-slate-500 text-[11px] block">Total Registered Units</span>
            <span className="text-lg font-black font-mono text-slate-900">
              {profiles.filter((p) => p.status !== 'Rejected').length}
              <span className="text-slate-400 font-normal text-xs"> / 120 Flats</span>
            </span>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/60">
            <span className="text-emerald-700 text-[11px] block">Verified & Approved</span>
            <span className="text-lg font-black font-mono text-emerald-900">
              {profiles.filter((p) => p.isApproved).length}
            </span>
          </div>
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60">
            <span className="text-amber-700 text-[11px] block">Awaiting Verification</span>
            <span className="text-lg font-black font-mono text-amber-900">
              {pendingProfiles.length}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-slate-500 text-[11px] block">Towers Configuration</span>
            <span className="text-xs font-bold text-slate-800 block mt-1">
              Tower A · Tower B · Tower C
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none gap-2">
        <button
          onClick={() => setActiveSubTab('directory')}
          className={`pb-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
            activeSubTab === 'directory'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Flats & Residents Directory</span>
          <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-mono">
            {filteredProfiles.length}
          </span>
        </button>

        {isAdminOrSecretary && (
          <>
            <button
              onClick={() => setActiveSubTab('approvals')}
              className={`pb-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
                activeSubTab === 'approvals'
                  ? 'border-teal-700 text-teal-800'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Membership Approvals</span>
              {pendingProfiles.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                  {pendingProfiles.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSubTab('roles')}
              className={`pb-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
                activeSubTab === 'roles'
                  ? 'border-teal-700 text-teal-800'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Role & Permissions</span>
            </button>

            <button
              onClick={() => setActiveSubTab('audit')}
              className={`pb-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
                activeSubTab === 'audit'
                  ? 'border-teal-700 text-teal-800'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Audit Trail</span>
              <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-mono">
                {auditLogs.length}
              </span>
            </button>
          </>
        )}
      </div>

      {/* SUB-TAB 1: FLATS & RESIDENTS DIRECTORY */}
      {activeSubTab === 'directory' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search flat (e.g. A-402), name, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-teal-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-500">Tower:</span>
                <select
                  value={selectedTower}
                  onChange={(e) => setSelectedTower(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                >
                  <option value="All">All Towers</option>
                  <option value="Tower A">Tower A</option>
                  <option value="Tower B">Tower B</option>
                  <option value="Tower C">Tower C</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-500">Verification:</span>
                <select
                  value={approvalFilter}
                  onChange={(e) => setApprovalFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                >
                  <option value="All">All Statuses</option>
                  <option value="Approved">Verified Only</option>
                  <option value="Pending">Pending Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Directory Table / Cards */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Flat Unit</th>
                    <th className="py-3 px-4">Resident Member</th>
                    <th className="py-3 px-4">Occupancy</th>
                    <th className="py-3 px-4">Role Badge</th>
                    <th className="py-3 px-4">Contact Handle</th>
                    <th className="py-3 px-4">Verification Status</th>
                    {isAdminOrSecretary && <th className="py-3 px-4 text-right">Admin Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={isAdminOrSecretary ? 7 : 6} className="py-8 text-center text-slate-500">
                        No residents or flats matched your query.
                      </td>
                    </tr>
                  ) : (
                    filteredProfiles.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                            {p.flatNo}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-sans mt-0.5">
                            {p.tower}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            {p.avatarUrl ? (
                              <img
                                src={p.avatarUrl}
                                alt={p.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center border border-teal-200 shrink-0">
                                {p.name ? p.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                              </div>
                            )}
                            <div>
                              <span className="block font-bold text-slate-900">{p.name}</span>
                              <span className="block text-[10px] font-mono text-slate-400">
                                {p.memberId}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              p.ownershipType === 'Owner'
                                ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                : 'bg-purple-50 text-purple-800 border border-purple-200'
                            }`}
                          >
                            {p.ownershipType}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800">
                            {ROLE_LABELS[p.role] || p.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {isAdminOrSecretary ? (
                            <div className="space-y-0.5">
                              <span className="block font-mono text-[11px]">{p.phone}</span>
                              <span className="block text-[10px] text-slate-400">{p.email}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">
                              Protected (Privacy Bylaws)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {p.status === 'Rejected' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3" />
                              Rejected
                            </span>
                          ) : p.isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3" />
                              Pending Approval
                            </span>
                          )}
                        </td>
                        {isAdminOrSecretary && (
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setResetModalMember(p);
                                  setTempPasswordInput('Solitaire@2026');
                                  setResetModalMsg(null);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                                title="Reset Password / Set Temp Password for Member"
                              >
                                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                                <span>Reset Pwd</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingProfile(p);
                                  setEditForm({ ...p });
                                  setEditSuccessMsg(null);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer"
                                title="Modify each field of this profile"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Modify</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete profile for ${p.name} (${p.flatNo})?`)) {
                                    deleteMemberProfile(p.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer rounded-lg hover:bg-red-50"
                                title="Delete Profile"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MEMBERSHIP APPROVALS GATEKEEPER */}
      {activeSubTab === 'approvals' && isAdminOrSecretary && (
        <div className="space-y-4">
          <div className="flex border-b border-slate-200 gap-2">
            <button
              onClick={() => setApprovalSubTab('pending')}
              className={`pb-2 px-3 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
                approvalSubTab === 'pending'
                  ? 'border-amber-600 text-amber-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Awaiting Verification ({pendingProfiles.length})
            </button>
            <button
              onClick={() => setApprovalSubTab('rejected')}
              className={`pb-2 px-3 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
                approvalSubTab === 'rejected'
                  ? 'border-red-600 text-red-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Rejected Registrations ({rejectedProfiles.length})
            </button>
          </div>

          {approvalSubTab === 'pending' && (
            <div className="space-y-3">
              {pendingProfiles.length === 0 ? (
                <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="font-bold text-slate-800">All Registration Requests Verified</p>
                  <p className="text-slate-500 mt-1">
                    No new flat signups are currently awaiting Managing Committee verification.
                  </p>
                </div>
              ) : (
                pendingProfiles.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 bg-white border border-amber-200/80 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          Unit {p.flatNo}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                        <span className="text-slate-400 text-[11px]">({p.ownershipType})</span>
                      </div>
                      <p className="text-slate-600">
                        Email: <span className="font-mono text-slate-800">{p.email}</span> · Phone:{' '}
                        <span className="font-mono text-slate-800">{p.phone}</span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Registered on {p.registeredDate} · Awaiting document verification against society index II.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setRejectTargetId(p.id);
                          setRejectRemarks('');
                        }}
                        className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => approveMemberProfile(p.id, true)}
                        className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                      >
                        Approve Access
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {approvalSubTab === 'rejected' && (
            <div className="space-y-3">
              {rejectedProfiles.length === 0 ? (
                <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                  <p>No rejected registration records found.</p>
                </div>
              ) : (
                rejectedProfiles.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 bg-white border border-red-200 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-900 border border-red-200">
                          Unit {p.flatNo}
                        </span>
                        <h4 className="font-bold text-slate-900">{p.name}</h4>
                        <span className="text-red-700 font-bold text-[10px]">REJECTED</span>
                      </div>
                      <p className="text-slate-600">
                        Remarks:{' '}
                        <span className="text-slate-800 font-medium">
                          {p.reviewRemarks || 'Application rejected by Managing Committee.'}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Reviewed at: {p.reviewedAt || 'N/A'} by {p.approvedOrRejectedBy || 'Admin'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => approveMemberProfile(p.id, true, 'Approved upon re-verification')}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                      >
                        Re-evaluate & Approve
                      </button>
                      <button
                        onClick={() => deleteMemberProfile(p.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: MULTI-ROLE ASSIGNMENT PANEL */}
      {activeSubTab === 'roles' && isAdminOrSecretary && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Admin Multi-Role Assignment Panel</h3>
              <p className="text-xs text-slate-500">
                Grant or revoke simultaneous privileges. Users can simultaneously hold multiple roles (e.g., Resident + MC Member + Secretary).
              </p>
            </div>
            <span className="text-[11px] font-mono text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg font-semibold">
              Array-Based Multi-Role Engine Active
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {profiles
              .filter((p) => p.isApproved)
              .map((p) => {
                const currentRoles = p.roles && p.roles.length > 0 ? p.roles : [p.role];
                const availableRoles: Array<{ key: string; label: string; color: string }> = [
                  { key: 'resident', label: 'Resident (Owner)', color: 'border-slate-300 text-slate-800' },
                  { key: 'tenant', label: 'Tenant', color: 'border-purple-300 text-purple-800' },
                  { key: 'mc_member', label: 'MC Member', color: 'border-teal-300 text-teal-800' },
                  { key: 'secretary', label: 'Secretary', color: 'border-amber-300 text-amber-800' },
                  { key: 'admin', label: 'Society Admin', color: 'border-rose-300 text-rose-800' },
                  { key: 'supervisor', label: 'Supervisor', color: 'border-blue-300 text-blue-800' },
                ];

                return (
                  <div key={p.id} className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="min-w-[220px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                        <span className="font-mono text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          [{p.flatNo}]
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block truncate">{p.email}</span>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {currentRoles.map((r) => (
                          <span
                            key={r}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {ROLE_LABELS[r] || r}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {availableRoles.map((r) => {
                        const isAssigned = currentRoles.includes(r.key);
                        return (
                          <button
                            key={r.key}
                            type="button"
                            onClick={() => {
                              let nextRoles: string[];
                              if (isAssigned) {
                                if (currentRoles.length === 1) {
                                  alert('A member must have at least one assigned role.');
                                  return;
                                }
                                nextRoles = currentRoles.filter((item) => item !== r.key);
                              } else {
                                nextRoles = [...currentRoles, r.key];
                              }
                              updateUserRoles(p.id, nextRoles);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border flex items-center gap-1 ${
                              isAssigned
                                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isAssigned ? 'bg-teal-400' : 'bg-slate-300'}`} />
                            <span>{r.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: AUDIT TRAIL */}
      {activeSubTab === 'audit' && isAdminOrSecretary && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Governance & Approval Audit Trail</h3>
            <p className="text-xs text-slate-500">
              Immutable chronological record of registrations, approvals, rejections, and role assignments.
            </p>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.length === 0 ? (
              <p className="text-slate-400 py-4">No audit entries logged yet.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{log.action}: {log.userName} (Flat {log.flatNo})</span>
                    <span className="text-[11px] font-mono text-slate-400">{log.timestamp}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{log.details}</p>
                  <span className="text-[10px] text-slate-400">
                    Executed by: {log.performedBy} ({log.performedByRole})
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {rejectTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Reject Application</h3>
              <button
                onClick={() => setRejectTargetId(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Please specify the rejection remarks. The applicant will be notified in their portal view.
            </p>
            <textarea
              rows={3}
              value={rejectRemarks}
              onChange={(e) => setRejectRemarks(e.target.value)}
              placeholder="e.g. Registered Index II does not match applicant name; please provide updated agreement..."
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setRejectTargetId(null)}
                className="px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboard Resident Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-teal-700" />
                <h3 className="font-bold text-sm text-slate-900">Onboard Flat Resident</h3>
              </div>
              <button
                onClick={() => setShowSignupModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {signupErrorMsg && (
              <div className="p-2.5 bg-red-50 text-red-700 rounded-lg border border-red-200">
                {signupErrorMsg}
              </div>
            )}
            {signupSuccessMsg && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                {signupSuccessMsg}
              </div>
            )}

            <form onSubmit={handleCreateNewMember} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tower</label>
                  <select
                    value={newTower}
                    onChange={(e) => setNewTower(e.target.value as TowerId)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="Tower A">Tower A</option>
                    <option value="Tower B">Tower B</option>
                    <option value="Tower C">Tower C</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Flat (e.g. A-402)</label>
                  <input
                    type="text"
                    required
                    placeholder="A-402"
                    value={newFlat}
                    onChange={(e) => setNewFlat(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Resident Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prakash Rao"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="prakash@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98220 00000"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Ownership Type</label>
                <select
                  value={newOwnership}
                  onChange={(e) => setNewOwnership(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="Owner">Flat Owner</option>
                  <option value="Tenant">Registered Tenant</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSignupModal(false)}
                  className="px-3 py-1.5 text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-700 text-white rounded-lg font-bold hover:bg-teal-800 cursor-pointer"
                >
                  Register Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Admin Modify Resident / Flat Profile Modal */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Modify Member Profile & Unit</h3>
                  <p className="text-[11px] text-slate-500">
                    Administrator full field editor for unit {editingProfile.flatNo}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingProfile(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editSuccessMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{editSuccessMsg}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingProfile) return;
                updateMemberProfile(editingProfile.id, {
                  ...editForm,
                  isApproved: editForm.status === 'Approved',
                });
                setEditSuccessMsg('Profile updated successfully in society registry!');
                setTimeout(() => {
                  setEditingProfile(null);
                  setEditSuccessMsg(null);
                }, 800);
              }}
              className="space-y-3.5 max-h-[72vh] overflow-y-auto pr-1"
            >
              {/* Full Name & Member ID */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Resident Full Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-teal-700 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Member ID Code</label>
                  <input
                    type="text"
                    required
                    value={editForm.memberId || ''}
                    onChange={(e) => setEditForm({ ...editForm, memberId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-teal-700 bg-white"
                  />
                </div>
              </div>

              {/* Tower & Flat No */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tower Location</label>
                  <select
                    value={editForm.tower || 'Tower A'}
                    onChange={(e) => setEditForm({ ...editForm, tower: e.target.value as TowerId })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-teal-700 bg-white"
                  >
                    <option value="Tower A">Tower A</option>
                    <option value="Tower B">Tower B</option>
                    <option value="Tower C">Tower C</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Flat Number</label>
                  <input
                    type="text"
                    required
                    value={editForm.flatNo || ''}
                    onChange={(e) => setEditForm({ ...editForm, flatNo: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-teal-700 bg-white"
                  />
                </div>
              </div>

              {/* Profile Photo (Optional) */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Profile Photo (Optional)
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    {editForm.avatarUrl ? (
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-teal-600 shrink-0">
                        <img
                          src={editForm.avatarUrl}
                          alt="Avatar Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, avatarUrl: '' })}
                          className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                          title="Remove photo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center border border-slate-300 shrink-0">
                        {editForm.name ? editForm.name.slice(0, 2).toUpperCase() : 'U'}
                      </div>
                    )}
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded-lg text-xs font-semibold text-teal-900 cursor-pointer shadow-2xs transition-colors shrink-0">
                      <Upload className="w-3.5 h-3.5 text-teal-700" />
                      <span>Choose Photo from Device (PNG/JPEG)</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const storageRes = await uploadToCHSStorage(file, 'avatars');
                              if (storageRes.success && storageRes.publicUrl) {
                                setEditForm({ ...editForm, avatarUrl: storageRes.publicUrl });
                              } else {
                                const compressed = await compressImageFile(file, { maxWidth: 600, maxHeight: 600, quality: 0.85 });
                                setEditForm({ ...editForm, avatarUrl: compressed });
                              }
                            } catch (err) {
                              console.warn('Failed to upload avatar photo:', err);
                            }
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                    {editForm.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, avatarUrl: '' })}
                        className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Uploads directly to Supabase Storage: CHS-Storage/avatars/
                  </span>
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Official Email Address</label>
                  <input
                    type="email"
                    required
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-teal-700 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-teal-700 bg-white"
                  />
                </div>
              </div>

              {/* Occupancy Type & Society Role */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Occupancy / Ownership</label>
                  <select
                    value={editForm.ownershipType || 'Owner'}
                    onChange={(e) => setEditForm({ ...editForm, ownershipType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-teal-700 bg-white"
                  >
                    <option value="Owner">Flat Owner</option>
                    <option value="Tenant">Registered Tenant</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Assigned Role</label>
                  <select
                    value={editForm.role || 'resident'}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-teal-700 bg-white"
                  >
                    <option value="resident">Resident Member</option>
                    <option value="supervisor">Facility Supervisor</option>
                    <option value="mc_member">Managing Committee</option>
                    <option value="admin">Estate Administrator</option>
                  </select>
                </div>
              </div>

              {/* Verification Status & Remarks */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Verification Status</label>
                  <select
                    value={editForm.status || 'Approved'}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setEditForm({
                        ...editForm,
                        status: val,
                        isApproved: val === 'Approved',
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-teal-700 bg-white"
                  >
                    <option value="Approved">Verified / Approved</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Internal Review Remarks</label>
                  <input
                    type="text"
                    value={editForm.reviewRemarks || ''}
                    onChange={(e) => setEditForm({ ...editForm, reviewRemarks: e.target.value })}
                    placeholder="e.g. Verified by MC on physical inspection"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-teal-700 bg-white"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setEditingProfile(null)}
                  className="px-3.5 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold cursor-pointer shadow-sm transition-all"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
