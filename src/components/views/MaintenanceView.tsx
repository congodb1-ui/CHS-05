import React, { useState, useMemo } from 'react';
import { useSociety } from '../../context/SocietyContext';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Download,
  Send,
  Building2,
  Receipt,
  ArrowUpRight,
  ShieldCheck,
  FileText,
  Upload,
  X,
  Lock,
  User,
  ExternalLink,
  ChevronRight,
  DollarSign,
  PieChart,
} from 'lucide-react';
import { MaintenanceLedgerEntry, TowerId } from '../../types';

export const MaintenanceView: React.FC = () => {
  const {
    role,
    userFlat,
    userName,
    currentProfile,
    maintenanceRecords,
    updateMaintenanceStatus,
    recordMaintenancePayment,
    sendMaintenanceReminder,
    hasRole,
  } = useSociety();

  // Role checks
  const isSupervisor = role === 'supervisor';
  const isAdminOrMC = role === 'admin' || role === 'secretary' || role === 'mc_member' || hasRole('admin') || hasRole('secretary') || hasRole('mc_member');
  const isResidentOrTenant = role === 'resident' || role === 'tenant' || (!isAdminOrMC && !isSupervisor);

  // Filter & Search states (for Admin / MC)
  const [selectedCycle, setSelectedCycle] = useState<string>('October 2026');
  const [selectedTower, setSelectedTower] = useState<'All' | TowerId>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Unpaid' | 'Overdue'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Payment Modal state (Resident or Admin recording payment)
  const [paymentModalEntry, setPaymentModalEntry] = useState<MaintenanceLedgerEntry | null>(null);
  const [payAmount, setPayAmount] = useState<number>(4250);
  const [payMode, setPayMode] = useState<'UPI' | 'NEFT / RTGS' | 'Cheque' | 'Cash'>('UPI');
  const [payUtr, setPayUtr] = useState<string>('');
  const [payReceiptUrl, setPayReceiptUrl] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');
  const [payError, setPayError] = useState<string | null>(null);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);

  // Reminder feedback state
  const [reminderToast, setReminderToast] = useState<string | null>(null);

  // If Supervisor, hide completely as required by specification
  if (isSupervisor) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-3 max-w-lg mx-auto my-12 shadow-xs">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Access Restricted</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          The Financial Maintenance LEDGER and billing engine is strictly reserved for Resident flat owners, registered tenants, and the Managing Committee (Treasurer, Secretary & Admin).
        </p>
      </div>
    );
  }

  // Resident / Tenant personal records
  const personalRecords = useMemo(() => {
    const cleanFlat = (userFlat || currentProfile?.flatNo || '').toUpperCase().trim();
    return maintenanceRecords.filter((r) => r.flatNo.toUpperCase().trim() === cleanFlat);
  }, [maintenanceRecords, userFlat, currentProfile]);

  const activePersonalCurrent = personalRecords.find((r) => r.billingCycle === selectedCycle) || personalRecords[0];

  // Admin / MC filtered records across all 200 units
  const cycleRecords = useMemo(() => {
    return maintenanceRecords.filter((r) => r.billingCycle === selectedCycle);
  }, [maintenanceRecords, selectedCycle]);

  const filteredRecords = useMemo(() => {
    return cycleRecords.filter((rec) => {
      if (selectedTower !== 'All' && rec.tower !== selectedTower) return false;
      if (statusFilter !== 'All' && rec.paymentStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesFlat = rec.flatNo.toLowerCase().includes(q);
        const matchesName = rec.residentName.toLowerCase().includes(q);
        const matchesUtr = rec.utrNumber ? rec.utrNumber.toLowerCase().includes(q) : false;
        if (!matchesFlat && !matchesName && !matchesUtr) return false;
      }
      return true;
    });
  }, [cycleRecords, selectedTower, statusFilter, searchQuery]);

  // Financial KPIs for active cycle
  const totalDemand = useMemo(() => cycleRecords.reduce((sum, r) => sum + r.amountDue, 0), [cycleRecords]);
  const totalCollected = useMemo(() => cycleRecords.reduce((sum, r) => sum + (r.amountPaid || 0), 0), [cycleRecords]);
  const collectionRate = totalDemand > 0 ? Math.round((totalCollected / totalDemand) * 100) : 0;
  const overdueRecords = useMemo(() => cycleRecords.filter((r) => r.paymentStatus === 'Overdue'), [cycleRecords]);
  const unpaidRecords = useMemo(() => cycleRecords.filter((r) => r.paymentStatus === 'Unpaid'), [cycleRecords]);
  const totalOutstanding = useMemo(() => {
    return cycleRecords
      .filter((r) => r.paymentStatus !== 'Paid')
      .reduce((sum, r) => sum + (r.amountDue - (r.amountPaid || 0)), 0);
  }, [cycleRecords]);

  // Handlers
  const openPaymentModal = (record: MaintenanceLedgerEntry) => {
    setPaymentModalEntry(record);
    setPayAmount(record.amountDue - (record.amountPaid || 0));
    setPayMode('UPI');
    setPayUtr('');
    setPayReceiptUrl('');
    setPayNotes('');
    setPayError(null);
    setPaySuccess(null);
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setPayError('File size exceeds 5MB limit. Please upload a smaller file.');
        return;
      }
      const allowedExt = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedExt.includes(file.type)) {
        setPayError('Unsupported format. Please upload JPG, PNG, WEBP, or PDF.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPayReceiptUrl(reader.result as string);
        setPayError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalEntry) return;

    if (!payUtr.trim()) {
      setPayError('Please enter a valid Transaction Reference / UTR Number.');
      return;
    }

    recordMaintenancePayment(paymentModalEntry.flatNo, paymentModalEntry.billingCycle, {
      amount: Number(payAmount),
      mode: payMode,
      utrNumber: payUtr.trim(),
      receiptUrl: payReceiptUrl || undefined,
      notes: payNotes.trim() || undefined,
    });

    setPaySuccess(`Payment of ₹${Number(payAmount).toLocaleString('en-IN')} verified and logged!`);
    setTimeout(() => {
      setPaymentModalEntry(null);
      setPaySuccess(null);
    }, 1200);
  };

  const handleDispatchReminders = () => {
    const targetFlats = [...overdueRecords, ...unpaidRecords].map((r) => r.flatNo);
    if (targetFlats.length === 0) {
      setReminderToast('No overdue or unpaid flats found for this cycle!');
      setTimeout(() => setReminderToast(null), 3000);
      return;
    }
    const res = sendMaintenanceReminder(targetFlats, selectedCycle);
    setReminderToast(`Dispatched official dues recovery reminders to ${res.count} flats.`);
    setTimeout(() => setReminderToast(null), 4000);
  };

  const exportLedgerCsv = () => {
    let csv = `Solitaire CHS - Maintenance Ledger (${selectedCycle})\n`;
    csv += `Sr No,Flat No,Tower,Resident Name,Ownership,Amount Due (INR),Status,Amount Paid,Paid Date,Payment Mode,UTR Number,Receipt No\n`;
    cycleRecords.forEach((r, idx) => {
      csv += `${idx + 1},"${r.flatNo}","${r.tower}","${r.residentName}","${r.ownershipType}",${r.amountDue},"${r.paymentStatus}",${r.amountPaid || 0},"${r.paidDate || ''}","${r.paymentMode || ''}","${r.utrNumber || ''}","${r.receiptNumber || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Solitaire_Maintenance_Ledger_${selectedCycle.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>MCS Act 1960 Compliant Society Billing & Maintenance LEDGER</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Maintenance Dues & Society Financial Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete billing cycle records, monthly service charges, sinking fund collections, and digital payment receipts across all 200 society units.
          </p>
        </div>

        {/* Cycle Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {['October 2026', 'September 2026', 'August 2026'].map((cycle) => (
              <button
                key={cycle}
                onClick={() => setSelectedCycle(cycle)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  selectedCycle === cycle
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cycle}
              </button>
            ))}
          </div>

          {isAdminOrMC && (
            <>
              <button
                onClick={handleDispatchReminders}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                title="Send Payment Reminders to all Overdue / Unpaid Flats"
              >
                <Send className="w-3.5 h-3.5 text-amber-600" />
                <span>Dispatch Reminders</span>
              </button>
              <button
                onClick={exportLedgerCsv}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Ledger CSV</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Toast Alert */}
      {reminderToast && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center justify-between font-medium shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
            <span>{reminderToast}</span>
          </div>
          <button onClick={() => setReminderToast(null)} className="text-amber-500 hover:text-amber-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SECTION 1: RESIDENT / TENANT PERSONAL UNIT BILLING CARD */}
      {isResidentOrTenant && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                Personal Unit Ledger · {userFlat || currentProfile?.flatNo || 'A-402'}
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Monthly Maintenance Statement ({selectedCycle})
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  activePersonalCurrent?.paymentStatus === 'Paid'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : activePersonalCurrent?.paymentStatus === 'Overdue'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                ● Status: {activePersonalCurrent?.paymentStatus || 'Paid'}
              </span>
              {activePersonalCurrent?.paymentStatus !== 'Paid' && (
                <button
                  onClick={() => openPaymentModal(activePersonalCurrent)}
                  className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Pay Now / Submit UTR</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Billed Amount</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                ₹{(activePersonalCurrent?.amountDue || 4250).toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">Due Date: 10th of {selectedCycle.split(' ')[0]}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Amount Paid</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">
                ₹{(activePersonalCurrent?.amountPaid || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">
                {activePersonalCurrent?.paidDate ? `Settled on ${activePersonalCurrent.paidDate}` : 'Pending settlement'}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment Mode & UTR</span>
              <span className="text-sm font-bold text-slate-800 mt-1 block truncate">
                {activePersonalCurrent?.paymentMode || 'N/A'}
              </span>
              <span className="text-xs font-mono text-slate-500 truncate block">
                {activePersonalCurrent?.utrNumber ? `Ref: ${activePersonalCurrent.utrNumber}` : 'No transaction logged'}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Official Tax Receipt</span>
              {activePersonalCurrent?.paymentStatus === 'Paid' ? (
                <div className="mt-1">
                  <span className="text-xs font-mono font-bold text-emerald-800 block">
                    {activePersonalCurrent.receiptNumber || 'REC-OCT-2026-A402'}
                  </span>
                  <button
                    onClick={() => alert(`Receipt downloaded for Flat ${activePersonalCurrent.flatNo} (${selectedCycle}).`)}
                    className="text-xs text-teal-700 hover:text-teal-800 font-semibold inline-flex items-center gap-1 mt-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download PDF</span>
                  </button>
                </div>
              ) : (
                <span className="text-xs text-slate-400 mt-2 block italic">Available once payment is marked Paid</span>
              )}
            </div>
          </div>

          {/* Standard Society Tariff Breakdown */}
          <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100 text-xs space-y-2">
            <span className="font-bold text-teal-950 block">Approved Monthly Tariff Breakdown (Bye-Law No. 67):</span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-slate-600">
              <div>• Service Charges: ₹1,500</div>
              <div>• Sinking Fund: ₹750</div>
              <div>• Repair & Maintenance: ₹800</div>
              <div>• Lift Maintenance & AMC: ₹600</div>
              <div>• Common Utilities & STP: ₹600</div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: ADMIN & MC SOCIETY-WIDE 200 FLATS LEDGER */}
      {isAdminOrMC && (
        <div className="space-y-6">
          {/* Financial KPIs Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Monthly Demand</span>
              <span className="text-2xl font-black text-slate-900 tabular-nums mt-1 block">
                ₹{totalDemand.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-500 mt-1 block">200 Units across Towers A, B, C</span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Amount Collected</span>
              <span className="text-2xl font-black text-emerald-700 tabular-nums mt-1 block">
                ₹{totalCollected.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-emerald-700 font-semibold mt-1 block">
                {collectionRate}% Overall Collection Efficiency
              </span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Outstanding Balance</span>
              <span className="text-2xl font-black text-amber-700 tabular-nums mt-1 block">
                ₹{totalOutstanding.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-amber-700 font-medium mt-1 block">
                {unpaidRecords.length} Unpaid Units Pending Settlement
              </span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Overdue Defaulting Flats</span>
              <span className="text-2xl font-black text-red-600 tabular-nums mt-1 block">
                {overdueRecords.length} Units
              </span>
              <button
                onClick={() => setStatusFilter('Overdue')}
                className="text-xs text-red-600 hover:text-red-700 font-bold mt-1 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Filter Overdue List</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Search, Tower Tabs & Status Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700 mr-1">Tower:</span>
              {(['All', 'Tower A', 'Tower B', 'Tower C'] as const).map((tw) => (
                <button
                  key={tw}
                  onClick={() => setSelectedTower(tw)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    selectedTower === tw
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tw} {tw === 'Tower A' ? '(67)' : tw === 'Tower B' ? '(67)' : tw === 'Tower C' ? '(66)' : '(200)'}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700 mr-1">Status:</span>
              {(['All', 'Paid', 'Unpaid', 'Overdue'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    statusFilter === st
                      ? st === 'Paid'
                        ? 'bg-emerald-700 text-white'
                        : st === 'Overdue'
                        ? 'bg-red-700 text-white'
                        : 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}

              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search flat, name, UTR..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-teal-700"
                />
              </div>
            </div>
          </div>

          {/* Master 200 Flats Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">
                Society Units Directory ({filteredRecords.length} of {cycleRecords.length} Shown)
              </span>
              <span className="text-slate-500">
                Billing Cycle: <strong>{selectedCycle}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 font-bold">Unit / Flat</th>
                    <th className="py-3 px-3 font-bold">Tower</th>
                    <th className="py-3 px-4 font-bold">Resident Name & Type</th>
                    <th className="py-3 px-3 font-bold">Due Amount</th>
                    <th className="py-3 px-3 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold">Payment Details</th>
                    <th className="py-3 px-4 font-bold text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {filteredRecords.map((r) => {
                    const isPaid = r.paymentStatus === 'Paid';
                    const isOverdue = r.paymentStatus === 'Overdue';
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {r.flatNo}
                        </td>
                        <td className="py-3 px-3 text-slate-600">{r.tower}</td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-900 block truncate max-w-[200px]">
                            {r.residentName}
                          </span>
                          <span className={`text-[10px] font-semibold ${r.ownershipType === 'Tenant' ? 'text-purple-700' : 'text-slate-500'}`}>
                            {r.ownershipType}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          ₹{r.amountDue.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isPaid
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isOverdue
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {r.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {isPaid ? (
                            <div>
                              <span className="font-bold text-slate-800 block text-[11px]">
                                {r.paymentMode} · ₹{(r.amountPaid || r.amountDue).toLocaleString('en-IN')}
                              </span>
                              <span className="font-mono text-[10px] text-slate-500 block truncate max-w-[170px]">
                                UTR: {r.utrNumber || 'N/A'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Pending payment</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {!isPaid ? (
                            <button
                              onClick={() => openPaymentModal(r)}
                              className="px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded text-[11px] font-semibold cursor-pointer shadow-2xs"
                            >
                              Mark Paid / Log UTR
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                updateMaintenanceStatus(r.id, 'Unpaid', { amountPaid: 0, utrNumber: undefined });
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] font-medium cursor-pointer"
                              title="Revert to Unpaid status"
                            >
                              Revert Status
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT & RECEIPT LOGGING MODAL (Unified for Resident & Admin) */}
      {paymentModalEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Record Maintenance Payment</h3>
                  <p className="text-xs text-slate-500">
                    Unit {paymentModalEntry.flatNo} ({paymentModalEntry.tower}) · {paymentModalEntry.billingCycle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPaymentModalEntry(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {payError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{payError}</span>
              </div>
            )}

            {paySuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{paySuccess}</span>
              </div>
            )}

            <form onSubmit={handleRecordSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Amount Paid (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold focus:bg-white focus:outline-teal-700"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Payment Mode</label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:bg-white focus:outline-teal-700"
                  >
                    <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                    <option value="NEFT / RTGS">NEFT / RTGS Bank Transfer</option>
                    <option value="Cheque">Cheque Deposit</option>
                    <option value="Cash">Cash (Estate Office)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Transaction Reference / UTR Number / Cheque No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 427819827361 or HDFC0001829"
                  value={payUtr}
                  onChange={(e) => setPayUtr(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:bg-white focus:outline-teal-700"
                />
              </div>

              {/* MODULE 6: Proof of Payment Upload */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 block text-xs">
                  Upload Payment Screenshot / Deposit Slip (Optional)
                </label>
                <div className="flex items-center gap-3">
                  {payReceiptUrl ? (
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-teal-600 shrink-0">
                      <img src={payReceiptUrl} alt="Receipt preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPayReceiptUrl('')}
                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : null}
                  <div className="flex-1 space-y-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px] font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-teal-700" />
                      <span>Choose File (Max 5MB)</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={handleReceiptUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-slate-400">
                      Supported formats: JPG, PNG, WEBP, PDF up to 5MB.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">Administrative Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Paid via ICICI Bank netbanking, verified against bank statement."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:bg-white focus:outline-teal-700"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalEntry(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Confirm & Update Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
