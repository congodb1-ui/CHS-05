import React, { useState, useMemo } from 'react';
import { useSociety } from '../../context/SocietyContext';
import {
  Users,
  ShieldCheck,
  UserCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Edit2,
  Lock,
  Building,
  Calendar,
  AlertTriangle,
  History,
  Check,
  Filter,
  Layers,
  Wrench,
  X,
} from 'lucide-react';
import { COMMITTEE_MEMBERS } from '../../data/initialData';
import { UserRole, ROLE_LABELS } from '../../types';

export const CommitteeView: React.FC = () => {
  const {
    role,
    profiles,
    approveMemberProfile,
    updateUserRole,
    deleteMemberProfile,
    auditLogs,
    amcs,
    complaints,
    bookings,
    tenants,
    adminUpdateTicket,
    adminUpdateBooking,
    adminUpdateTenantApp,
    userName,
  } = useSociety();

  const [activeTab, setActiveTab] = useState<'approvals' | 'roles' | 'audit' | 'overrides' | 'committee'>('approvals');
  const [regSubTab, setRegSubTab] = useState<'pending' | 'rejected'>('pending');
  const [memberSearch, setMemberSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);

  // Overrides modal state
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [ticketStatus, setTicketStatus] = useState<'Open' | 'In Progress' | 'Resolved'>('Open');
  const [ticketResolution, setTicketResolution] = useState('');

  const isAuthorized = role === 'mc_member' || role === 'admin' || role === 'secretary';

  // Pending user profiles
  const pendingProfiles = useMemo(() => {
    return profiles.filter(
      (p) => p.status === 'Pending Approval' || (!p.isApproved && p.status !== 'Rejected' && p.status !== 'Approved')
    );
  }, [profiles]);

  // Rejected user profiles
  const rejectedProfiles = useMemo(() => {
    return profiles.filter((p) => p.status === 'Rejected');
  }, [profiles]);

  // Approved profiles for role management
  const approvedProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const isAppr = p.isApproved && p.status !== 'Pending Approval';
      const matchesSearch =
        p.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        p.flatNo.toLowerCase().includes(memberSearch.toLowerCase()) ||
        p.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
        p.role.toLowerCase().includes(memberSearch.toLowerCase());
      return isAppr && matchesSearch;
    });
  }, [profiles, memberSearch]);

  // Filtered audit logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      return (
        log.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.flatNo.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.performedBy.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.details.toLowerCase().includes(auditSearch.toLowerCase())
      );
    });
  }, [auditLogs, auditSearch]);

  const handleApproveUser = (id: string, flatNo: string) => {
    approveMemberProfile(id, true, `Approved by ${userName} for Flat ${flatNo}.`);
  };

  const handleConfirmReject = () => {
    if (!rejectTargetId) return;
    approveMemberProfile(rejectTargetId, false, rejectRemarks || 'Application rejected by Managing Committee.');
    setRejectTargetId(null);
    setRejectRemarks('');
    setRegSubTab('rejected');
  };

  const handleRoleChange = (id: string, newRole: UserRole) => {
    updateUserRole(id, newRole);
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Executive Governance & Member Verification Gate</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Managing Committee & Admin Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Verification gatekeeper for new resident registrations, dynamic role assignment, approval audit trail, and database overrides.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingProfiles.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin" />
              <span>{pendingProfiles.length} Registration Requests Pending</span>
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 bg-white px-4 rounded-t-xl gap-2 pt-2">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'approvals'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Pending Registrations</span>
          {pendingProfiles.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
              {pendingProfiles.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'roles'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Member & Role Management ({approvedProfiles.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Approval Audit Trail ({auditLogs.length})</span>
        </button>

        {isAuthorized && (
          <button
            onClick={() => setActiveTab('overrides')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'overrides'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Admin Data Overrides
          </button>
        )}

        <button
          onClick={() => setActiveTab('committee')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'committee'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Office Bearers & AMC Register
        </button>
      </div>

      {/* TAB 1: PENDING REGISTRATIONS APPROVAL GATEKEEPER */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Member Registration Verification Gate</h3>
                <p className="text-xs text-slate-500">
                  Strictly 1 registered account permitted per flat. Only MC Members and Admins can approve or reject signups.
                </p>
              </div>

              {/* Subtab Toggle */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setRegSubTab('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    regSubTab === 'pending'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Awaiting Review</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                    {pendingProfiles.length}
                  </span>
                </button>
                <button
                  onClick={() => setRegSubTab('rejected')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    regSubTab === 'rejected'
                      ? 'bg-white text-red-700 shadow-xs'
                      : 'text-slate-600 hover:text-red-700'
                  }`}
                >
                  <span>Rejected Registrations</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-600 text-white">
                    {rejectedProfiles.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Subtab 1: Awaiting Review */}
            {regSubTab === 'pending' && (
              <>
                {pendingProfiles.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-sm font-bold text-slate-800">All Registration Requests Verified</p>
                    <p className="text-xs text-slate-500">There are no pending member applications awaiting committee review.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingProfiles.map((p) => (
                      <div
                        key={p.id}
                        className="p-5 rounded-2xl border border-amber-300 bg-amber-50/30 flex flex-col justify-between space-y-4 shadow-xs"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                                Flat {p.flatNo} ({p.tower})
                              </span>
                              <h4 className="text-base font-bold text-slate-900 mt-2">{p.name}</h4>
                              <p className="text-xs text-slate-600">{p.email} · {p.phone}</p>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              Pending Approval
                            </span>
                          </div>

                          <div className="pt-2 border-t border-amber-200/50 grid grid-cols-2 gap-2 text-xs text-slate-600">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-semibold">Ownership Type:</span>
                              <span className="font-bold text-slate-800">{p.ownershipType}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-semibold">Submitted Date:</span>
                              <span className="font-mono text-slate-700">{p.registeredDate}</span>
                            </div>
                          </div>

                          <div className="bg-white p-2.5 rounded-xl border border-amber-200/60 text-xs text-slate-600 leading-relaxed">
                            <span className="font-semibold text-amber-950 block">Single Flat Rule Check:</span>
                            Flat [{p.flatNo}] is verified unique. Awaiting identity and possession document review by committee.
                          </div>
                        </div>

                        <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
                          {isAuthorized ? (
                            <>
                              <button
                                onClick={() => setRejectTargetId(p.id)}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                              >
                                Reject Application
                              </button>
                              <button
                                onClick={() => handleApproveUser(p.id, p.flatNo)}
                                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs transition-colors"
                              >
                                Approve & Grant Resident Access
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              Login as MC Member or Admin to approve/reject
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Subtab 2: Rejected Registrations */}
            {regSubTab === 'rejected' && (
              <>
                {rejectedProfiles.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <p className="text-sm font-semibold text-slate-600">No Rejected Applications</p>
                    <p className="text-xs text-slate-400">Applications rejected with committee remarks will be listed here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rejectedProfiles.map((p) => (
                      <div
                        key={p.id}
                        className="p-5 rounded-2xl border border-red-200 bg-red-50/40 flex flex-col justify-between space-y-4 shadow-xs"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-mono font-bold text-xs bg-red-950 text-white px-2 py-0.5 rounded">
                                Flat {p.flatNo} ({p.tower})
                              </span>
                              <h4 className="text-base font-bold text-slate-900 mt-2">{p.name}</h4>
                              <p className="text-xs text-slate-600">{p.email} · {p.phone}</p>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-900 border border-red-200">
                              Rejected
                            </span>
                          </div>

                          <div className="pt-2 border-t border-red-200/50 space-y-1.5">
                            <span className="text-[10px] text-red-800 font-bold uppercase tracking-wider block">
                              Committee Rejection Reason:
                            </span>
                            <p className="text-xs text-red-950 bg-white p-2.5 rounded-xl border border-red-200 leading-relaxed font-medium">
                              {p.reviewRemarks || 'Application rejected by Managing Committee.'}
                            </p>
                            {p.reviewedAt && (
                              <span className="text-[10px] text-slate-500 block">
                                Decision logged on: {p.reviewedAt}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-red-200/60 flex items-center justify-between">
                          {isAuthorized ? (
                            <>
                              <button
                                onClick={() => deleteMemberProfile(p.id)}
                                className="px-3 py-1.5 text-slate-600 hover:text-red-700 hover:bg-red-100/50 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                              >
                                Delete Record
                              </button>
                              <button
                                onClick={() => handleApproveUser(p.id, p.flatNo)}
                                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs transition-colors"
                              >
                                Re-evaluate & Approve
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              Login as MC Member or Admin to modify
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MEMBER & ROLE MANAGEMENT */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Registered Society Members & Role Assignments</h3>
                <p className="text-xs text-slate-500">
                  Search approved flat members and dynamically update their authorization level.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, flat, or role..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Flat Number</th>
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">Ownership</th>
                    <th className="py-3 px-4">Current Role</th>
                    <th className="py-3 px-4 text-right">Modify Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {approvedProfiles.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {p.flatNo}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {p.name}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {p.email} · {p.phone}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded font-medium text-[11px] bg-slate-100 text-slate-700">
                          {p.ownershipType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            p.role === 'admin'
                              ? 'bg-slate-900 text-white'
                              : p.role === 'mc_member' || p.role === 'secretary'
                              ? 'bg-sky-100 text-sky-800'
                              : p.role === 'supervisor'
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {ROLE_LABELS[p.role] || p.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isAuthorized ? (
                          <select
                            value={p.role === 'member' ? 'resident' : p.role === 'secretary' ? 'mc_member' : p.role}
                            onChange={(e) => handleRoleChange(p.id, e.target.value as any)}
                            className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 cursor-pointer"
                          >
                            <option value="resident">Resident</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="mc_member">MC Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className="text-slate-400">Locked</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: APPROVAL AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Member Registration & Role Approval Audit Trail</h3>
                <p className="text-xs text-slate-500">
                  Immutable chronological log of all member registrations, approvals, rejections, and role changes.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search audit trail..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Flat Number</th>
                    <th className="py-3 px-4">Applicant / Member</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Performed By</th>
                    <th className="py-3 px-4">Audit Details & Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {log.flatNo}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {log.userName}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.action === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.action === 'Rejected'
                              ? 'bg-red-100 text-red-800'
                              : log.action === 'Role Changed'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {log.performedBy}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ADMIN DATA OVERRIDES */}
      {activeTab === 'overrides' && isAuthorized && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Administrator Data Editing Override</h3>
              <p className="text-xs text-slate-500">
                Superuser control to modify ticket resolutions, override amenity booking approvals, and clear tenant applications.
              </p>
            </div>

            {/* Helpdesk tickets quick override table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Open Service Complaints Override</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Ticket ID</th>
                      <th className="py-2.5 px-3">Flat #</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Admin Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {complaints.map((c) => (
                      <tr key={c.id}>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{c.id}</td>
                        <td className="py-2 px-3 font-bold">{c.flatNo}</td>
                        <td className="py-2 px-3">{c.category}</td>
                        <td className="py-2 px-3 max-w-[240px] truncate">{c.description}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {c.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {c.status !== 'Resolved' && (
                              <button
                                onClick={() => adminUpdateTicket(c.id, { status: 'Resolved', resolutionNotes: `Marked resolved by ${userName}` })}
                                className="px-2 py-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded text-[10px] font-bold cursor-pointer"
                              >
                                Resolve
                              </button>
                            )}
                            {c.status === 'Resolved' && (
                              <button
                                onClick={() => adminUpdateTicket(c.id, { status: 'In Progress' })}
                                className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-[10px] font-bold cursor-pointer"
                              >
                                Re-Open
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: OFFICE BEARERS & AMC CONTRACTS */}
      {activeTab === 'committee' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Elected Managing Committee Office Bearers (2024 - 2027)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {COMMITTEE_MEMBERS.map((m, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">{m.designation}</span>
                  <h4 className="text-sm font-bold text-slate-900">{m.name}</h4>
                  <p className="text-xs text-slate-500">Unit: {m.flat}</p>
                  <p className="text-xs text-slate-500 font-mono">{m.email}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Active AMC Statutory Service Contracts</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Service Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Vendor Partner</th>
                    <th className="py-2.5 px-3">Validity</th>
                    <th className="py-2.5 px-3 text-right">Annual Fee</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {amcs.map((a) => (
                    <tr key={a.id}>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{a.serviceName}</td>
                      <td className="py-2.5 px-3">{a.category}</td>
                      <td className="py-2.5 px-3">{a.vendorCompany}</td>
                      <td className="py-2.5 px-3">{a.startDate} to {a.expiryDate}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{a.annualFee.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REJECT APPLICATION */}
      {rejectTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-red-700 flex items-center gap-1.5">
              <XCircle className="w-5 h-5 text-red-600" />
              <span>Reject Member Registration</span>
            </h3>
            <p className="text-slate-600">
              Please enter the committee reason for rejection. This will be recorded in the official audit trail.
            </p>
            <textarea
              rows={3}
              required
              placeholder="e.g. Sale deed copy missing, or rent agreement expired. Please resubmit."
              value={rejectRemarks}
              onChange={(e) => setRejectRemarks(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRejectTargetId(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
