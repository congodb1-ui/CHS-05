import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSociety } from '../../context/SocietyContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  Wrench,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Plus,
  Send,
  User,
  Phone,
  Building,
  Upload,
  MessageSquare,
  ChevronDown,
  Check,
  Briefcase,
  X,
} from 'lucide-react';
import { TowerId, ComplaintTicket } from '../../types';

export const HelpdeskView: React.FC = () => {
  const {
    complaints,
    addComplaint,
    updateComplaintStatus,
    role,
    userFlat,
    userName,
    currentMemberId,
    filterOnlyMyFilings,
    setFilterOnlyMyFilings,
    vendors,
    staffList,
    profiles,
  } = useSociety();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open' | 'In Progress' | 'Resolved'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [flatNo, setFlatNo] = useState(userFlat || 'A-402');
  const [tower, setTower] = useState<TowerId>('Tower A');
  const [residentName, setResidentName] = useState(userName || 'Rajesh Sharma');
  const [residentType, setResidentType] = useState<'Owner' | 'Tenant'>('Owner');
  const [phone, setPhone] = useState('+91 98201 44521');
  const [category, setCategory] = useState<ComplaintTicket['category']>('Plumbing');
  const [priority, setPriority] = useState<'Normal' | 'Urgent'>('Normal');
  const [description, setDescription] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

  // MC Management Modal state
  const [managingTicket, setManagingTicket] = useState<ComplaintTicket | null>(null);
  const [newStatus, setNewStatus] = useState<ComplaintTicket['status']>('In Progress');
  const [resolutionNote, setResolutionNote] = useState('');
  const [assignedVendor, setAssignedVendor] = useState('');

  // Hybrid Searchable/Creatable select state
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');
  const [supabaseVendors, setSupabaseVendors] = useState<Array<{ name: string; category?: string }>>([]);
  const vendorDropdownRef = useRef<HTMLDivElement>(null);

  const isAdminOrSecretary = role === 'secretary' || role === 'admin' || role === 'mc_member';

  // Load registered vendors from Supabase dynamically if configured
  useEffect(() => {
    async function fetchVendors() {
      if (!isSupabaseConfigured) return;
      try {
        const { data, error } = await supabase.from('vendors').select('name, category');
        if (!error && data && data.length > 0) {
          setSupabaseVendors(data);
        }
      } catch (err) {
        console.warn('Supabase vendors fetch error:', err);
      }
    }
    fetchVendors();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(e.target as Node)) {
        setVendorDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Combined list of registered vendors and in-house technicians
  const allKnownVendorsAndTechnicians = useMemo(() => {
    const list: Array<{ label: string; subLabel: string; type: 'Vendor' | 'Technician' }> = [];

    // From context vendors
    vendors.forEach((v) => {
      if (v.name && !list.some((item) => item.label.toLowerCase() === v.name.toLowerCase())) {
        list.push({
          label: v.name,
          subLabel: v.category || 'Registered Vendor',
          type: 'Vendor',
        });
      }
    });

    // From Supabase vendors table
    supabaseVendors.forEach((sv) => {
      if (sv.name && !list.some((item) => item.label.toLowerCase() === sv.name.toLowerCase())) {
        list.push({
          label: sv.name,
          subLabel: sv.category || 'Registered Vendor',
          type: 'Vendor',
        });
      }
    });

    // In-house technicians from staff directory
    staffList
      .filter((s) => s.team === 'Electrician' || s.team === 'Plumber' || s.team === 'Supervisor')
      .forEach((s) => {
        const title = `${s.name} (${s.role || s.team})`;
        if (!list.some((item) => item.label.toLowerCase() === title.toLowerCase())) {
          list.push({
            label: title,
            subLabel: `In-House ${s.team}`,
            type: 'Technician',
          });
        }
      });

    // Standard preset defaults
    const presets = [
      { label: 'Apex Plumbing Solutions', subLabel: 'Plumbing & Drainage AMC', type: 'Vendor' as const },
      { label: 'Otis Elevators 24x7 Helpline', subLabel: 'Elevator Maintenance', type: 'Vendor' as const },
      { label: 'AquaPure MBBR Water Technologies', subLabel: 'STP Plant Contractor', type: 'Vendor' as const },
      { label: 'Voltech DG & Power Services', subLabel: 'Generator Backup AMC', type: 'Vendor' as const },
      { label: 'Sunil Sharma (Senior Electrician)', subLabel: 'In-House Staff', type: 'Technician' as const },
      { label: 'Santosh Mane (Plumber)', subLabel: 'In-House Staff', type: 'Technician' as const },
      { label: 'Parvez Khan (Facility Supervisor)', subLabel: 'Estate Operations Desk', type: 'Technician' as const },
    ];

    presets.forEach((p) => {
      if (!list.some((item) => item.label.toLowerCase() === p.label.toLowerCase())) {
        list.push(p);
      }
    });

    return list;
  }, [vendors, staffList, supabaseVendors]);

  // Filtered vendor list based on search query
  const filteredVendorOptions = useMemo(() => {
    const q = vendorSearchQuery.trim().toLowerCase();
    if (!q) return allKnownVendorsAndTechnicians;
    return allKnownVendorsAndTechnicians.filter(
      (item) =>
        item.label.toLowerCase().includes(q) || item.subLabel.toLowerCase().includes(q)
    );
  }, [allKnownVendorsAndTechnicians, vendorSearchQuery]);

  const isExactVendorMatch = allKnownVendorsAndTechnicians.some(
    (item) => item.label.toLowerCase() === vendorSearchQuery.trim().toLowerCase()
  );

  const filteredTickets = complaints.filter((t) => {
    const matchesRLS =
      !filterOnlyMyFilings ||
      t.flatNo.toLowerCase().trim() === userFlat.toLowerCase().trim() ||
      t.residentName.toLowerCase().includes(userName.split(' ')[0].toLowerCase());

    const matchesSearch =
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.flatNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.residentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;

    return matchesRLS && matchesSearch && matchesStatus && matchesCategory;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = addComplaint({
      flatNo,
      tower,
      residentName,
      residentType,
      phone,
      category,
      priority,
      description,
    });
    setSubmittedTicketId(id);
    setShowForm(false);
    setDescription('');
    setPhotoName('');
  };

  const handleUpdateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingTicket) return;
    updateComplaintStatus(managingTicket.id, newStatus, resolutionNote, assignedVendor);
    setManagingTicket(null);
  };

  const openManageModal = (ticket: ComplaintTicket) => {
    setManagingTicket(ticket);
    setNewStatus(ticket.status);
    setResolutionNote(ticket.resolutionNotes || '');
    setAssignedVendor(ticket.assignedVendor || '');
    setVendorSearchQuery(ticket.assignedVendor || '');
    setVendorDropdownOpen(false);
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Resident Services & Facility Helpdesk
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Helpdesk, Maintenance & Service Tickets
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Log tickets for plumbing, elevators, STP flushing, electrical, or security issues. Real-time routing to estate technicians and Managing Committee oversight.
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setSubmittedTicketId(null);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{showForm ? 'Close Ticket Form' : 'Log New Complaint'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {submittedTicketId && (
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
            <div className="text-xs text-teal-900">
              <span className="font-bold">Ticket #{submittedTicketId} Registered Successfully!</span>
              <p className="text-teal-700">
                Assigned to Society Estate Technical Team. You can track updates and vendor assignments below.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSubmittedTicketId(null)}
            className="text-xs text-teal-800 hover:text-teal-950 font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Ticket Creation Form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Log a Society Service Request</h2>
              <p className="text-xs text-slate-500">Provide flat details and photo evidence for rapid resolution.</p>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Tower <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  value={tower}
                  onChange={(e) => setTower(e.target.value as TowerId)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:border-red-300 focus:outline-none"
                >
                  <option value="Tower A">Tower A</option>
                  <option value="Tower B">Tower B</option>
                  <option value="Tower C">Tower C</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Flat / Unit Number <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={flatNo}
                  onChange={(e) => setFlatNo(e.target.value)}
                  placeholder="e.g. A-402"
                  className="w-full p-2 border border-slate-300 focus:border-red-300 focus:outline-none rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Resident Name <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={residentName}
                  onChange={(e) => setResidentName(e.target.value)}
                  className="w-full p-2 border border-slate-300 focus:border-red-300 focus:outline-none rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Occupancy Status <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  value={residentType}
                  onChange={(e) => setResidentType(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:border-red-300 focus:outline-none"
                >
                  <option value="Owner">Owner Resident</option>
                  <option value="Tenant">Tenant</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Category <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:border-red-300 focus:outline-none"
                >
                  <option value="Plumbing">Plumbing & Shaft Drainage</option>
                  <option value="Lift / Elevator">Lift / Elevator Operational</option>
                  <option value="Water Supply">Water Supply / Flush Pressure</option>
                  <option value="Electrical">Electrical & Lighting</option>
                  <option value="STP & Drainage">STP Line Odor / Pressure</option>
                  <option value="Security & Access">Security & Gate Access</option>
                  <option value="Housekeeping">Housekeeping & Common Area</option>
                  <option value="Other">Other Civil Repair</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Priority <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:border-red-300 focus:outline-none"
                >
                  <option value="Normal">Normal (SLA: 24–48 Hours)</option>
                  <option value="Urgent">Urgent / Emergency (SLA: 2–4 Hours)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Contact Phone <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 border border-slate-300 focus:border-red-300 focus:outline-none rounded-lg tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Detailed Issue Description & Location <span className="text-red-500 font-bold">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the exact location, timing, and nature of the issue..."
                className="w-full p-2.5 border border-slate-300 focus:border-red-300 focus:outline-none rounded-lg"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-600">
                  <Upload className="w-3.5 h-3.5 text-teal-700" />
                  <span>{photoName || 'Attach Photo Evidence'} <span className="text-slate-400 font-normal">(Optional)</span></span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setPhotoName(e.target.files[0].name);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  Submit Ticket
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Ticket List and Filtering */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Live Service Tickets Ledger</h2>
            <p className="text-xs text-slate-500">
              Open tickets with automated SLA tracking and vendor response records.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            {/* RLS Personal Filter Toggle */}
            <button
              onClick={() => setFilterOnlyMyFilings(!filterOnlyMyFilings)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                filterOnlyMyFilings
                  ? 'bg-teal-50 text-teal-800 border-teal-200 shadow-2xs'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
              title="Dual-Layer Row Level Security (RLS) Filter"
            >
              <span className={`w-2 h-2 rounded-full ${filterOnlyMyFilings ? 'bg-teal-600' : 'bg-slate-400'}`}></span>
              <span>{filterOnlyMyFilings ? `My Unit (${userFlat}) Filings` : 'All Society Tickets'}</span>
            </button>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ticket #, flat, issue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:outline-teal-600 bg-slate-50 w-48"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs p-1.5 rounded-lg border border-slate-200 bg-slate-50 font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open Only</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs p-1.5 rounded-lg border border-slate-200 bg-slate-50 font-medium"
            >
              <option value="All">All Categories</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Lift / Elevator">Lift / Elevator</option>
              <option value="Water Supply">Water Supply</option>
              <option value="Electrical">Electrical</option>
            </select>
          </div>
        </div>

        {/* Tickets Grid / List */}
        <div className="divide-y divide-slate-100">
          {filteredTickets.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No complaint tickets match your search filters.
            </div>
          ) : (
            filteredTickets.map((t) => {
              const authorProfile = profiles.find(
                (p) => p.flatNo === t.flatNo || p.name.toLowerCase() === t.residentName.toLowerCase()
              );

              return (
                <div key={t.id} className="py-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {authorProfile?.avatarUrl ? (
                        <img
                          src={authorProfile.avatarUrl}
                          alt={t.residentName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center border border-teal-200 shrink-0 mt-0.5">
                          {t.residentName
                            ? t.residentName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                            : 'R'}
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-slate-900 text-xs">{t.id}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs font-semibold text-slate-800">
                            {t.tower} - {t.flatNo} ({t.residentName}, {t.residentType})
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                            {t.category}
                          </span>
                          {t.priority === 'Urgent' && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
                              Urgent
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed max-w-3xl pt-0.5">
                          {t.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:flex-col sm:items-end shrink-0">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${
                          t.status === 'Resolved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : t.status === 'In Progress'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {t.status}
                      </span>
                      <span className="text-[11px] text-slate-400 tabular-nums">{t.createdAt}</span>
                    </div>
                  </div>

                {/* Resolution Notes / Vendor Information */}
                {(t.assignedVendor || t.resolutionNotes) && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 text-slate-700">
                    {t.assignedVendor && (
                      <div className="flex items-center gap-2">
                        <Wrench className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                        <span className="text-slate-500">Assigned Vendor:</span>
                        <strong className="text-slate-900">{t.assignedVendor}</strong>
                      </div>
                    )}
                    {t.resolutionNotes && (
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-slate-500">Resolution Note: </span>
                          <span className="text-slate-800">{t.resolutionNotes}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* MC / Admin Action Trigger */}
                {(role === 'secretary' || role === 'admin') && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => openManageModal(t)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      Manage Status & Vendor &rarr;
                    </button>
                  </div>
                )}
              </div>
            );
          })
          )}
        </div>
      </div>

      {/* MC Ticket Resolution Modal */}
      {managingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-700 block">MC Committee Action</span>
                <h3 className="text-base font-bold text-slate-900">Manage Ticket #{managingTicket.id}</h3>
              </div>
              <button
                onClick={() => setManagingTicket(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateTicket} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Status Update</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              {/* Hybrid Searchable / Creatable Vendor & Technician Select */}
              <div className="relative" ref={vendorDropdownRef}>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-800 font-semibold">
                    Assigned Vendor / Technician
                  </label>
                  <span className="text-[10px] text-teal-700 font-medium">
                    Search registered or type custom
                  </span>
                </div>

                <div className="relative">
                  <div className="absolute left-3 top-2.5 text-slate-400">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={vendorSearchQuery}
                    onFocus={() => setVendorDropdownOpen(true)}
                    onChange={(e) => {
                      setVendorSearchQuery(e.target.value);
                      setAssignedVendor(e.target.value);
                      setVendorDropdownOpen(true);
                    }}
                    placeholder="Search vendor / technician or type custom name..."
                    className="w-full pl-9 pr-14 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-teal-700"
                  />
                  <div className="absolute right-2.5 top-2 flex items-center gap-1 text-slate-400">
                    {vendorSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setVendorSearchQuery('');
                          setAssignedVendor('');
                        }}
                        className="p-0.5 hover:text-slate-600 cursor-pointer"
                        title="Clear"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setVendorDropdownOpen(!vendorDropdownOpen)}
                      className="p-0.5 hover:text-slate-600 cursor-pointer"
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${
                          vendorDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Dropdown Menu */}
                {vendorDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl py-1 text-xs">
                    {/* Custom Entry Option */}
                    {vendorSearchQuery.trim() && !isExactVendorMatch && (
                      <button
                        type="button"
                        onClick={() => {
                          const customVal = vendorSearchQuery.trim();
                          setAssignedVendor(customVal);
                          setVendorSearchQuery(customVal);
                          setVendorDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-teal-50 text-teal-800 font-semibold flex items-center gap-2 border-b border-slate-100 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>Assign custom: &ldquo;{vendorSearchQuery.trim()}&rdquo;</span>
                      </button>
                    )}

                    {filteredVendorOptions.length === 0 && !vendorSearchQuery.trim() ? (
                      <div className="px-3 py-2 text-slate-400 text-center">No vendors available</div>
                    ) : (
                      filteredVendorOptions.map((item) => {
                        const isSelected = assignedVendor === item.label;
                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => {
                              setAssignedVendor(item.label);
                              setVendorSearchQuery(item.label);
                              setVendorDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected ? 'bg-teal-50/80 font-bold text-teal-900' : 'text-slate-800'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <span className="block truncate font-medium">{item.label}</span>
                              <span className="text-[10px] text-slate-400 block">{item.subLabel}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                  item.type === 'Vendor'
                                    ? 'bg-sky-100 text-sky-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {item.type}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-teal-700" />}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1 pt-1.5">
                  <span className="text-[10px] text-slate-400 font-medium">Quick:</span>
                  {[
                    'In-House Electrician (Sunil)',
                    'In-House Plumber (Santosh)',
                    'Otis Elevators 24x7 Helpline',
                    'AquaPure MBBR Water Technologies',
                    'Parvez Khan (Facility Supervisor)',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setAssignedVendor(preset);
                        setVendorSearchQuery(preset);
                        setVendorDropdownOpen(false);
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors cursor-pointer ${
                        assignedVendor === preset
                          ? 'bg-teal-100 text-teal-900 border-teal-300 font-bold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      {preset.split('(')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Resolution / Inspection Note</label>
                <textarea
                  rows={3}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Detail actions taken, parts replaced, or next scheduled follow-up..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setManagingTicket(null)}
                  className="px-3 py-1.5 text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-700 text-white rounded-lg font-semibold hover:bg-teal-800 transition-colors cursor-pointer"
                >
                  Save Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
