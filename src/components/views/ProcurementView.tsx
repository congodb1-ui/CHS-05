import React, { useState, useMemo, useEffect } from 'react';
import { useSociety } from '../../context/SocietyContext';
import {
  WorkOrder,
  VendorQuote,
  Vendor,
  PaymentStage,
  QuoteLineItem,
} from '../../types';
import {
  Briefcase,
  FileCheck,
  DollarSign,
  TrendingUp,
  Percent,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Lock,
  ChevronRight,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  Wrench,
  Download,
  Filter,
  Search,
  X,
  FileText,
  CreditCard,
  Building,
  Check,
  MessageSquare,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
  RotateCcw,
} from 'lucide-react';

export const ProcurementView: React.FC = () => {
  const {
    role,
    setActiveTab: setGlobalActiveTab,
    workOrders,
    quotes,
    vendors,
    onboardVendor,
    updateVendor,
    addVendorQuote,
    updateVendorQuote,
    approveQuoteAndReleaseWorkOrder,
    approveWorkOrder,
    updateWorkOrder,
    requestWorkOrderChanges,
    updateWorkOrderProgress,
    addWorkOrderPayment,
    userName,
    currentMemberId,
    currentProfile,
    currentUserRoles,
    hasRole,
  } = useSociety();

  const isAdminOrMC = role === 'admin' || role === 'mc_member' || role === 'secretary' || hasRole('admin') || hasRole('mc_member') || hasRole('secretary');
  const isSecretary = role === 'secretary' || (currentUserRoles && currentUserRoles.includes('secretary')) || hasRole('secretary');

  // Access Gate Enforcement: Redirect standard residents away from Procurement
  useEffect(() => {
    if (!isAdminOrMC) {
      setGlobalActiveTab('home');
    }
  }, [isAdminOrMC, setGlobalActiveTab]);

  if (!isAdminOrMC) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4 bg-white border border-red-200 rounded-2xl shadow-sm my-12 animate-in fade-in duration-150">
        <div className="w-14 h-14 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Procurement Access Restricted</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Society vendor directories, quotation comparisons, financial tenders, and Work Orders are confidential and restricted strictly to authorized Society Administrators and Managing Committee members.
        </p>
        <div className="pt-2">
          <button
            onClick={() => setGlobalActiveTab('home')}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'summary' | 'work_orders' | 'quotes' | 'vendors'>('summary');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showOnboardVendorModal, setShowOnboardVendorModal] = useState(false);
  const [showMultiItemQuoteModal, setShowMultiItemQuoteModal] = useState(false);
  const [showSecretaryApprovalModal, setShowSecretaryApprovalModal] = useState<WorkOrder | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null); // workOrderId
  const [showReleaseModal, setShowReleaseModal] = useState<VendorQuote | null>(null);
  const [secretaryComments, setSecretaryComments] = useState('');
  const [approvalError, setApprovalError] = useState('');

  // Edit Modals state (CRUD for Vendors, Quotes, Work Orders)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [editingQuote, setEditingQuote] = useState<VendorQuote | null>(null);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);

  // Edit Work Order Form State
  const [editWoTitle, setEditWoTitle] = useState('');
  const [editWoScope, setEditWoScope] = useState('');
  const [editWoAmount, setEditWoAmount] = useState<number>(0);
  const [editWoStartDate, setEditWoStartDate] = useState('');
  const [editWoTargetDate, setEditWoTargetDate] = useState('');
  const [editWoWorkStatus, setEditWoWorkStatus] = useState<WorkOrder['workStatus']>('In Progress');
  const [editWoPriority, setEditWoPriority] = useState<'Normal' | 'Urgent' | 'Critical'>('Normal');
  const [editWoProgress, setEditWoProgress] = useState<number>(0);
  const [editWoSuccessMsg, setEditWoSuccessMsg] = useState<string | null>(null);

  // Standard terms list & editor state
  const DEFAULT_WO_TERMS = useMemo(
    () => [
      '1. Work must strictly comply with Maharashtra Co-operative Societies Act 1960 and local municipal norms.',
      '2. Contractor assumes full liability for worker safety, ESI, PF, and comprehensive accident insurance on site.',
      '3. 5% retention money will be withheld for a 60-day defect liability period post final inspection sign-off.',
      '4. Permitted site working hours are 09:00 AM to 06:00 PM on weekdays and Saturdays. Heavy drilling prohibited on Sundays.',
      '5. Daily cleanup, debris removal from service shafts/lobbies, and society green area protection is strictly mandatory.',
    ],
    []
  );
  const [woTermsList, setWoTermsList] = useState<string[]>(DEFAULT_WO_TERMS);
  const [newClauseInput, setNewClauseInput] = useState('');

  // Vendor Onboarding Form State
  const [vendorName, setVendorName] = useState('');
  const [vendorCategory, setVendorCategory] = useState<Vendor['category']>('STP & Water');
  const [vendorContact, setVendorContact] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorGst, setVendorGst] = useState('');
  const [vendorPan, setVendorPan] = useState('');
  const [vendorBankName, setVendorBankName] = useState('');
  const [vendorBankAcc, setVendorBankAcc] = useState('');
  const [vendorIfsc, setVendorIfsc] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');
  const [vendorDocUrl, setVendorDocUrl] = useState('');

  // Multi-Item Quote Form State
  const [quoteProjectTitle, setQuoteProjectTitle] = useState('Elevator Governor & Safety Sensor Overhaul');
  const [quoteVendorId, setQuoteVendorId] = useState(vendors[0]?.id || '');
  const [quoteNumber, setQuoteNumber] = useState(`Q-SOL-${Date.now().toString().slice(-4)}`);
  const [quoteValidity, setQuoteValidity] = useState(
    new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [quoteGstPercent, setQuoteGstPercent] = useState<number>(18);
  const [quotePdfUrl, setQuotePdfUrl] = useState('');
  const [quoteDays, setQuoteDays] = useState<number>(10);
  const [quoteWarranty, setQuoteWarranty] = useState<number>(12);
  const [quoteScope, setQuoteScope] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');

  // Dynamic Line Items State
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([
    { id: '1', description: 'Supply & replacement of primary safety sensor kit', quantity: 2, unitPrice: 25000, lineTotal: 50000 },
    { id: '2', description: 'Governor rope recalibration & statutory safety test', quantity: 1, unitPrice: 15000, lineTotal: 15000 },
  ]);

  // Calculate dynamic line items subtotal, GST, and grand total
  const calculatedSubtotal = useMemo(() => {
    return lineItems.reduce((acc, item) => acc + item.lineTotal, 0);
  }, [lineItems]);

  const calculatedTax = useMemo(() => {
    return Math.round((calculatedSubtotal * quoteGstPercent) / 100);
  }, [calculatedSubtotal, quoteGstPercent]);

  const calculatedGrandTotal = useMemo(() => {
    return calculatedSubtotal + calculatedTax;
  }, [calculatedSubtotal, calculatedTax]);

  // Payment Form State
  const [paymentType, setPaymentType] = useState<PaymentStage>('Milestone 1');
  const [paymentAmount, setPaymentAmount] = useState<number>(25000);
  const [paymentMode, setPaymentMode] = useState<'NEFT / RTGS' | 'Cheque' | 'Society Bank Portal'>('NEFT / RTGS');
  const [paymentUtr, setPaymentUtr] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Work Order Release Form State
  const [woStartDate, setWoStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [woTargetDate, setWoTargetDate] = useState(
    new Date(Date.now() + 21 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );

  const isAuthorized = role === 'mc_member' || role === 'admin' || role === 'secretary';

  // Overall Financial Calculations
  const totalCommittedAmount = (workOrders || []).reduce((sum, wo) => sum + (Number(wo?.totalApprovedAmount) || 0), 0);
  const totalDisbursedAmount = (workOrders || []).reduce((sum, wo) => {
    const pList = Array.isArray(wo?.payments) ? wo.payments : [];
    return sum + pList.reduce((pSum, p) => pSum + (Number(p?.amountPaid) || 0), 0);
  }, 0);
  const totalBalanceDue = Math.max(0, totalCommittedAmount - totalDisbursedAmount);

  // Line item change handlers
  const handleItemChange = (index: number, field: keyof QuoteLineItem, value: any) => {
    const updated = [...lineItems];
    const item = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(value) || 0 : item.quantity;
      const p = field === 'unitPrice' ? Number(value) || 0 : item.unitPrice;
      item.lineTotal = q * p;
    }
    updated[index] = item;
    setLineItems(updated);
  };

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: String(Date.now()),
        description: '',
        quantity: 1,
        unitPrice: 0,
        lineTotal: 0,
      },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // Vendor Onboarding submit
  const handleOnboardVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) return;

    onboardVendor({
      name: vendorName,
      category: vendorCategory,
      contactPerson: vendorContact,
      phone: vendorPhone,
      email: vendorEmail,
      gstNumber: vendorGst || '27AAACL0000A1Z1',
      panNumber: vendorPan || 'AAACL0000A',
      bankName: vendorBankName,
      bankAccountNumber: vendorBankAcc,
      ifscCode: vendorIfsc,
      registeredAddress: vendorAddress,
      complianceDocUrl: vendorDocUrl,
    });

    setShowOnboardVendorModal(false);
    setVendorName('');
    setVendorContact('');
    setVendorPhone('');
    setVendorEmail('');
    setVendorGst('');
    setVendorPan('');
    setVendorBankName('');
    setVendorBankAcc('');
    setVendorIfsc('');
    setVendorAddress('');
    setVendorDocUrl('');
  };

  // Multi-Item Quote submit
  const handleCreateMultiItemQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const vendorObj = vendors.find((v) => v.id === quoteVendorId) || vendors[0] || { id: 'VND-01', name: 'Vendor' };

    addVendorQuote({
      procurementProjectId: `PRJ-${Date.now().toString().slice(-4)}`,
      projectTitle: quoteProjectTitle,
      vendorId: quoteVendorId || vendorObj.id,
      vendorName: vendorObj?.name || 'Selected Vendor',
      quoteNumber,
      validityDate: quoteValidity,
      items: lineItems,
      subtotal: calculatedSubtotal,
      gstPercent: quoteGstPercent,
      taxAmount: calculatedTax,
      grandTotal: calculatedGrandTotal,
      quotedAmount: calculatedGrandTotal,
      estimatedDays: Number(quoteDays) || 10,
      warrantyMonths: Number(quoteWarranty) || 12,
      scopeOfWork: quoteScope || `Scope defined per ${lineItems.length} quoted items.`,
      pdfProposalUrl: quotePdfUrl,
      committeeNotes: quoteNotes,
    });

    setShowMultiItemQuoteModal(false);
  };

  // Confirm Release of Work Order
  const handleConfirmReleaseWO = () => {
    if (!showReleaseModal) return;
    approveQuoteAndReleaseWorkOrder(showReleaseModal.id, woStartDate, woTargetDate);
    setShowReleaseModal(null);
    setActiveTab('work_orders');
  };

  // Secretary Approval Action (Restricted strictly to MC Secretary role)
  const handleSecretaryApprove = () => {
    if (!showSecretaryApprovalModal) return;
    if (!isSecretary) {
      setApprovalError('Unauthorized: Only the MC Secretary has legal authority under MCS Act 1960 to approve Work Orders. Society Admins cannot bypass.');
      return;
    }
    if (!secretaryComments.trim()) {
      setApprovalError('Secretary Comments are mandatory before issuing approval.');
      return;
    }
    approveWorkOrder(showSecretaryApprovalModal.id, secretaryComments);
    setShowSecretaryApprovalModal(null);
    setSecretaryComments('');
    setApprovalError('');
  };

  const handleSecretaryRequestChanges = () => {
    if (!showSecretaryApprovalModal) return;
    if (!isSecretary) {
      setApprovalError('Unauthorized: Only the MC Secretary has authority to request revisions.');
      return;
    }
    if (!secretaryComments.trim()) {
      setApprovalError('Please detail the requested changes in Secretary Comments.');
      return;
    }
    requestWorkOrderChanges(showSecretaryApprovalModal.id, secretaryComments);
    setShowSecretaryApprovalModal(null);
    setSecretaryComments('');
    setApprovalError('');
  };

  // Work Order Edit & Terms Handlers
  const handleSaveWorkOrderEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkOrder) return;
    if (!editWoTitle.trim()) {
      alert('Work Order title is required.');
      return;
    }
    const updatedAmt = Number(editWoAmount) || editingWorkOrder.totalApprovedAmount || editingWorkOrder.agreedAmount || 0;
    updateWorkOrder(editingWorkOrder.id, {
      procurementTitle: editWoTitle.trim(),
      title: editWoTitle.trim(),
      scopeSummary: editWoScope.trim(),
      scopeOfWork: editWoScope.trim(),
      totalApprovedAmount: updatedAmt,
      agreedAmount: updatedAmt,
      startDate: editWoStartDate,
      targetCompletionDate: editWoTargetDate,
      progressPercent: Number(editWoProgress),
      workStatus: editWoWorkStatus,
      priority: editWoPriority,
      termsAndConditions: woTermsList,
    });
    setEditWoSuccessMsg('Work Order & Terms updated successfully!');
    setTimeout(() => {
      setEditWoSuccessMsg(null);
      setEditingWorkOrder(null);
    }, 900);
  };

  const handleAddWoTerm = () => {
    if (!newClauseInput.trim()) return;
    setWoTermsList([...woTermsList, `${woTermsList.length + 1}. ${newClauseInput.trim()}`]);
    setNewClauseInput('');
  };

  const handleRemoveWoTerm = (index: number) => {
    setWoTermsList(woTermsList.filter((_, i) => i !== index));
  };

  const handleResetWoTerms = () => {
    setWoTermsList([...DEFAULT_WO_TERMS]);
  };

  // Record Payment
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPaymentModal) return;

    addWorkOrderPayment(showPaymentModal, {
      paymentDate: new Date().toISOString().split('T')[0],
      paymentType,
      amountPaid: Number(paymentAmount),
      paymentMode,
      referenceUtr: paymentUtr || `HDFC${Date.now().toString().slice(-8)}`,
      approvedBy: userName || 'Treasurer (MC)',
      notes: paymentNotes,
    });

    setShowPaymentModal(null);
    setPaymentAmount(25000);
    setPaymentUtr('');
    setPaymentNotes('');
  };

  // Filtered lists
  const filteredWorkOrders = useMemo(() => {
    return (workOrders || []).filter((wo) => {
      if (!wo) return false;
      const matchesCategory = selectedCategory === 'All' || wo.category === selectedCategory;
      const q = (searchQuery || '').toLowerCase();
      const matchesSearch =
        (wo.id || '').toLowerCase().includes(q) ||
        (wo.procurementTitle || '').toLowerCase().includes(q) ||
        (wo.vendorName || '').toLowerCase().includes(q) ||
        (wo.quoteNumber ? wo.quoteNumber.toLowerCase().includes(q) : false);
      return matchesCategory && matchesSearch;
    });
  }, [workOrders, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>MCS Act 1960 Compliant Procurement & Dual Sign-Off Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Vendor Procurement & Work Order Approval Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            End-to-end estate CAPEX & OPEX contracts, multi-item quotation evaluation, secretary approvals, and milestone ledgers.
          </p>
        </div>

        {isAuthorized && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowOnboardVendorModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              <Building className="w-3.5 h-3.5 text-slate-700" />
              <span>Onboard Vendor</span>
            </button>
            <button
              onClick={() => setShowMultiItemQuoteModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Enter Multi-Item Quote</span>
            </button>
          </div>
        )}
      </div>

      {/* Financial KPIs Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Approved Work Orders</span>
          <span className="text-2xl font-black text-slate-900 tabular-nums mt-1 block">
            ₹{totalCommittedAmount.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">{workOrders.length} Major Engineering & AMC Projects</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Disbursed Installments</span>
          <span className="text-2xl font-black text-emerald-700 tabular-nums mt-1 block">
            ₹{totalDisbursedAmount.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-emerald-700 font-medium mt-1 block">
            {totalCommittedAmount > 0 ? Math.round((totalDisbursedAmount / totalCommittedAmount) * 100) : 0}% Paid Against Milestones
          </span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Balance Committed Payable</span>
          <span className="text-2xl font-black text-amber-700 tabular-nums mt-1 block">
            ₹{totalBalanceDue.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">Retained Until Work Sign-Off & Inspection</span>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center border-b border-slate-200 bg-white px-4 rounded-t-xl gap-2 pt-2">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'summary'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Procurement & Financial Summary Table
        </button>
        <button
          onClick={() => setActiveTab('work_orders')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'work_orders'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Active Work Orders & Secretary Approval ({workOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('quotes')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'quotes'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Multi-Item Quotation Comparison ({quotes.length})
        </button>
        <button
          onClick={() => setActiveTab('vendors')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'vendors'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Onboarded Vendor Directory ({vendors.length})
        </button>
      </div>

      {/* SUB-TAB 1: LIVE FINANCIAL & PROCUREMENT SUMMARY DASHBOARD */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Live Work Order Approval & Financial Summary</h3>
                <p className="text-xs text-slate-500">
                  Comprehensive audit trail of work orders, approved amounts, balance due, and Secretary approvals.
                </p>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by WO #, vendor, or project..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3">WO Number</th>
                    <th className="py-3 px-3">Vendor Name</th>
                    <th className="py-3 px-3">Project Title</th>
                    <th className="py-3 px-3 text-right">Grand Total</th>
                    <th className="py-3 px-3 text-right">Amount Paid</th>
                    <th className="py-3 px-3 text-right">Balance Due</th>
                    <th className="py-3 px-3">Approval Status</th>
                    <th className="py-3 px-3">Progress</th>
                    <th className="py-3 px-3">Payment Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredWorkOrders.map((wo) => {
                    const pList = Array.isArray(wo.payments) ? wo.payments : [];
                    const paid = pList.reduce((sum, p) => sum + (Number(p?.amountPaid) || 0), 0);
                    const totalAmt = Number(wo.totalApprovedAmount) || 0;
                    const bal = Math.max(0, totalAmt - paid);
                    const paymentStatus =
                      paid >= totalAmt && totalAmt > 0
                        ? 'Fully Paid'
                        : paid > 0
                        ? 'Partially Paid'
                        : 'Unpaid';
                    const apprStatus = (wo.approvalStatus || 'Pending_Secretary_Approval').replace(/_/g, ' ');

                    return (
                      <tr key={wo.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {wo.id}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {wo.vendorName}
                        </td>
                        <td className="py-3 px-3 max-w-[200px]">
                          <span className="font-medium text-slate-800 block truncate">{wo.procurementTitle}</span>
                          <span className="text-[10px] text-slate-400 block">{wo.category}</span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          ₹{totalAmt.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-700">
                          ₹{paid.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-amber-700">
                          ₹{bal.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              wo.approvalStatus === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : wo.approvalStatus === 'Changes_Requested'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {apprStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-teal-600 rounded-full"
                                style={{ width: `${wo.progressPercent}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px] font-bold text-slate-700">
                              {wo.progressPercent}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              paymentStatus === 'Fully Paid'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : paymentStatus === 'Partially Paid'
                                ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isAuthorized && wo.approvalStatus !== 'Approved' && (
                              role === 'secretary' ? (
                                <button
                                  onClick={() => setShowSecretaryApprovalModal(wo)}
                                  className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-bold cursor-pointer"
                                  title="Review and approve as MC Secretary"
                                >
                                  Secretary Action
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="px-2 py-1 bg-slate-200 text-slate-400 rounded text-[10px] font-bold cursor-not-allowed border border-slate-300"
                                  title="Secretary approval is restricted exclusively to MC Secretary role (Disabled for Admin)"
                                >
                                  Secretary Action
                                </button>
                              )
                            )}

                            {isAuthorized && wo.approvalStatus === 'Approved' && bal > 0 && (
                              <button
                                onClick={() => {
                                  setShowPaymentModal(wo.id);
                                  setPaymentAmount(Math.min(50000, bal));
                                }}
                                className="px-2 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                + Pay
                              </button>
                            )}
                          </div>
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

      {/* SUB-TAB 2: ACTIVE WORK ORDERS DETAIL & SECRETARY APPROVAL */}
      {activeTab === 'work_orders' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredWorkOrders.map((wo) => {
              const pList = Array.isArray(wo.payments) ? wo.payments : [];
              const paid = pList.reduce((sum, p) => sum + (Number(p?.amountPaid) || 0), 0);
              const totalAmt = Number(wo.totalApprovedAmount) || 0;
              const bal = Math.max(0, totalAmt - paid);
              const apprStatus = (wo.approvalStatus || 'Pending_Secretary_Approval').replace(/_/g, ' ');

              return (
                <div
                  key={wo.id}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                          {wo.id}
                        </span>
                        <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {wo.category}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            wo.approvalStatus === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : wo.approvalStatus === 'Changes_Requested'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          Approval: {apprStatus}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{wo.procurementTitle}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Vendor: <strong>{wo.vendorName}</strong> ({wo.vendorContact}) · GST: <span className="font-mono">{wo.vendorGst}</span>
                      </p>
                    </div>

                    <div className="text-right sm:shrink-0">
                      <span className="text-[11px] text-slate-400 block">Total Approved (incl. GST)</span>
                      <span className="text-xl font-black font-mono text-slate-900">
                        ₹{totalAmt.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <strong>Work Scope:</strong> {wo.scopeSummary}
                  </p>

                  {/* Secretary Comments / Remarks banner */}
                  {wo.secretaryComments && (
                    <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-950 block">Secretary Comments:</span>
                        <span className="text-amber-900">{wo.secretaryComments}</span>
                        {wo.approvedAt && (
                          <span className="text-[10px] text-amber-700 block mt-0.5 font-mono">
                            Signed off at: {wo.approvedAt} by {wo.approvingUserId}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Payment Terms & Timelines */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Payment Terms:</span>
                      <span className="font-medium text-slate-800">{wo.paymentTerms}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Execution Timeline:</span>
                      <span className="text-slate-800">{wo.startDate} to {wo.targetCompletionDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Released By:</span>
                      <span className="text-slate-800">{wo.releasedBy} ({wo.releasedAt})</span>
                    </div>
                  </div>

                  {/* Installments Table */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">Payment Installments Ledger ({pList.length})</span>
                      <span className="text-slate-500">
                        Paid: <strong className="text-emerald-700 font-mono">₹{paid.toLocaleString('en-IN')}</strong> · Balance: <strong className="text-amber-700 font-mono">₹{bal.toLocaleString('en-IN')}</strong>
                      </span>
                    </div>

                    {pList.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No payments logged yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {pList.map((p) => (
                          <div
                            key={p.id}
                            className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{p.paymentType}</span>
                              <span className="text-slate-400">·</span>
                              <span className="font-mono text-slate-500">UTR: {p.referenceUtr}</span>
                              <span className="text-slate-400">·</span>
                              <span className="text-slate-600">{p.paymentMode}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] text-slate-400">{p.paymentDate}</span>
                              <span className="font-bold font-mono text-emerald-700">₹{p.amountPaid.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Update Progress:</span>
                      {[25, 50, 75, 100].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => updateWorkOrderProgress(wo.id, pct)}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                            wo.progressPercent >= pct
                              ? 'bg-teal-700 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      {isAuthorized && (
                        <button
                          onClick={() => {
                            setEditingWorkOrder(wo);
                            setEditWoTitle(wo.procurementTitle || wo.title || '');
                            setEditWoScope(wo.scopeSummary || wo.scopeOfWork || '');
                            setEditWoAmount(wo.totalApprovedAmount || wo.agreedAmount || 0);
                            setEditWoStartDate(wo.startDate);
                            setEditWoTargetDate(wo.targetCompletionDate);
                            setEditWoWorkStatus(wo.workStatus);
                            setEditWoPriority(wo.priority || 'Normal');
                            setEditWoProgress(wo.progressPercent);
                            setWoTermsList(
                              wo.termsAndConditions && wo.termsAndConditions.length > 0
                                ? [...wo.termsAndConditions]
                                : [...DEFAULT_WO_TERMS]
                            );
                            setNewClauseInput('');
                            setEditWoSuccessMsg(null);
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer flex items-center gap-1 transition-colors"
                          title="Modify Work Order & Customizable Terms"
                        >
                          <Edit2 className="w-3 h-3 text-slate-600" />
                          <span>Edit WO & Terms</span>
                        </button>
                      )}

                      {isAuthorized && wo.approvalStatus !== 'Approved' && (
                        isSecretary ? (
                          <button
                            onClick={() => setShowSecretaryApprovalModal(wo)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs flex items-center gap-1.5"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Secretary Approval & Signature</span>
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-3 py-1.5 bg-slate-200 text-slate-400 rounded-lg text-xs font-semibold cursor-not-allowed shadow-none border border-slate-300 flex items-center gap-1.5"
                            title="Secretary Approval & Signature is restricted strictly to the Secretary role (Admins cannot bypass this restriction)"
                          >
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Secretary Approval & Signature</span>
                          </button>
                        )
                      )}

                      {isAuthorized && wo.approvalStatus === 'Approved' && bal > 0 && (
                        <button
                          onClick={() => {
                            setShowPaymentModal(wo.id);
                            setPaymentAmount(Math.min(50000, bal));
                          }}
                          className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
                        >
                          Record Payment Log
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: MULTI-ITEM QUOTATIONS COMPARISON */}
      {activeTab === 'quotes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quotes.map((q) => (
              <div
                key={q.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200 font-bold">
                          {q.quoteNumber || q.id}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            q.status === 'Selected'
                              ? 'bg-emerald-100 text-emerald-800'
                              : q.status === 'Rejected'
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {q.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{q.projectTitle}</h4>
                      <p className="text-xs font-semibold text-teal-800 mt-0.5">{q.vendorName}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Quoted Grand Total</span>
                      <span className="text-lg font-black font-mono text-slate-900">
                        ₹{(q.quotedAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Line items snippet if available */}
                  {q.items && q.items.length > 0 && (
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Line Items Breakdown ({q.items.length}):
                      </span>
                      {q.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] text-slate-600">
                          <span className="truncate max-w-[200px]">
                            {it.quantity}x {it.description}
                          </span>
                          <span className="font-mono font-semibold text-slate-800">₹{it.lineTotal.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                      <div className="pt-1 border-t border-slate-200 flex justify-between text-[11px] font-bold text-slate-800">
                        <span>Subtotal (Net): ₹{q.subtotal?.toLocaleString('en-IN')}</span>
                        <span>GST ({q.gstPercent || 18}%): ₹{q.taxAmount?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {q.scopeOfWork}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>Warranty: <strong>{q.warrantyMonths} Months</strong></span>
                    <span>Lead Time: <strong>{q.estimatedDays} Days</strong></span>
                  </div>

                  {q.committeeNotes && (
                    <p className="text-[11px] text-slate-500 italic bg-amber-50/50 p-2 rounded border border-amber-100">
                      Committee: {q.committeeNotes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">Date: {q.submittedDate}</span>
                  <div className="flex items-center gap-2">
                    {isAuthorized && (
                      <button
                        onClick={() => setEditingQuote(q)}
                        className="p-1 px-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer flex items-center gap-1 transition-colors"
                        title="Edit Quotation Details"
                      >
                        <Edit2 className="w-3 h-3 text-slate-600" />
                        <span>Edit Quote</span>
                      </button>
                    )}
                    {isAuthorized && q.status === 'Pending Review' && (
                      <button
                        onClick={() => setShowReleaseModal(q)}
                        className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                      >
                        Convert to Work Order &rarr;
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: ONBOARDED VENDOR DIRECTORY */}
      {activeTab === 'vendors' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map((vnd) => (
              <div
                key={vnd.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase tracking-wider block mb-1">
                        {vnd.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{vnd.name}</h4>
                      <p className="text-xs text-slate-500">{vnd.contactPerson}</p>
                    </div>
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      ★ {vnd.rating}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                    <p>Phone: <strong className="text-slate-800">{vnd.phone}</strong></p>
                    <p>Email: <strong className="text-slate-800">{vnd.email}</strong></p>
                    <p>GSTIN: <span className="font-mono text-slate-800">{vnd.gstNumber}</span></p>
                    {vnd.panNumber && <p>PAN: <span className="font-mono text-slate-800">{vnd.panNumber}</span></p>}
                    {vnd.bankName && <p>Bank: <span className="text-slate-700">{vnd.bankName}</span></p>}
                    {vnd.registeredAddress && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">Address: {vnd.registeredAddress}</p>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono">ID: {vnd.id}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 font-semibold">{vnd.contractStatus || 'Verified Vendor'}</span>
                    {isAuthorized && (
                      <button
                        onClick={() => setEditingVendor(vnd)}
                        className="px-2 py-0.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded cursor-pointer flex items-center gap-1 transition-colors"
                        title="Edit Vendor Profile"
                      >
                        <Edit2 className="w-3 h-3 text-slate-600" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: ONBOARD VENDOR */}
      {showOnboardVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold">Onboard New Society Vendor</h3>
              </div>
              <button onClick={() => setShowOnboardVendorModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOnboardVendor} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Company / Enterprise Name <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Security Solutions Pvt Ltd"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-red-300 focus:outline-none rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Category <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    value={vendorCategory}
                    onChange={(e) => setVendorCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-red-300 focus:outline-none rounded-lg text-slate-900"
                  >
                    <option value="STP & Water">STP & Water</option>
                    <option value="Elevators / Lifts">Elevators / Lifts</option>
                    <option value="Electrical & DG">Electrical & DG</option>
                    <option value="Civil Works & Painting">Civil Works & Painting</option>
                    <option value="Fire & Safety">Fire & Safety</option>
                    <option value="Security Systems">Security Systems</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Plumbing">Plumbing</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Contact Person <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mr. Anil Deshmukh"
                    value={vendorContact}
                    onChange={(e) => setVendorContact(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-red-300 focus:outline-none rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Mobile Phone <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98220 00000"
                    value={vendorPhone}
                    onChange={(e) => setVendorPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-red-300 focus:outline-none rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Email Address <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="contracts@vendor.com"
                    value={vendorEmail}
                    onChange={(e) => setVendorEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-red-300 focus:outline-none rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    GSTIN Number <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="27AAACL1234A1Z5"
                    value={vendorGst}
                    onChange={(e) => setVendorGst(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-red-300 focus:outline-none rounded-lg font-mono uppercase text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    PAN Number <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="AAACL1234A"
                    value={vendorPan}
                    onChange={(e) => setVendorPan(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono uppercase text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Bank Name & Branch <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="HDFC Bank, Kausar Baugh, NIBM"
                    value={vendorBankName}
                    onChange={(e) => setVendorBankName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Account Number <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="50200012345678"
                    value={vendorBankAcc}
                    onChange={(e) => setVendorBankAcc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    IFSC Code <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="HDFC0000241"
                    value={vendorIfsc}
                    onChange={(e) => setVendorIfsc(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono uppercase text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Registered Business Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Plot 18, Commercial Plaza, Kausar Baugh, NIBM, Pune - 411048"
                  value={vendorAddress}
                  onChange={(e) => setVendorAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Compliance Document URL / Upload Link <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="https://docs.cleanaqua.co.in/gst-certificate.pdf"
                  value={vendorDocUrl}
                  onChange={(e) => setVendorDocUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOnboardVendorModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                >
                  Save & Onboard Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ENTER MULTI-ITEM QUOTE */}
      {showMultiItemQuoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold">Enter Multi-Item Vendor Quotation</h3>
              </div>
              <button onClick={() => setShowMultiItemQuoteModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMultiItemQuote} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Project / Tender Title <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={quoteProjectTitle}
                    onChange={(e) => setQuoteProjectTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-red-300 focus:outline-none rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Vendor Selection <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    value={quoteVendorId}
                    onChange={(e) => setQuoteVendorId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-red-300 focus:outline-none rounded-lg text-slate-900 font-semibold"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Quote Number <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={quoteNumber}
                    onChange={(e) => setQuoteNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-red-300 focus:outline-none rounded-lg font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Validity Date <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={quoteValidity}
                    onChange={(e) => setQuoteValidity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-red-300 focus:outline-none rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Tax Rate (GST %) <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="28"
                    value={quoteGstPercent}
                    onChange={(e) => setQuoteGstPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-red-300 focus:outline-none rounded-lg font-mono text-slate-900"
                  />
                </div>
              </div>

              {/* DYNAMIC LINE ITEMS TABLE */}
              <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Quotation Line Items</span>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {lineItems.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <input
                          type="text"
                          required
                          placeholder="Item Description..."
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono text-center"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          placeholder="Unit ₹"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono text-right"
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-800 text-[11px] truncate">
                          ₹{item.lineTotal.toLocaleString('en-IN')}
                        </span>
                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(index)}
                            className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal & Grand Total Display */}
                <div className="pt-2 border-t border-slate-200 text-right space-y-1 text-xs">
                  <div className="text-slate-600">
                    Subtotal (Excl. Tax): <strong className="font-mono text-slate-900">₹{calculatedSubtotal.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="text-slate-600">
                    GST ({quoteGstPercent}%): <strong className="font-mono text-slate-900">₹{calculatedTax.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="text-sm font-bold text-teal-800 pt-1 border-t border-slate-200">
                    Grand Total (Incl. GST): <span className="font-mono">₹{calculatedGrandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Warranty Period (Months)</label>
                  <input
                    type="number"
                    value={quoteWarranty}
                    onChange={(e) => setQuoteWarranty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Execution Days (Lead Time)</label>
                  <input
                    type="number"
                    value={quoteDays}
                    onChange={(e) => setQuoteDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Scope of Work Summary</label>
                <textarea
                  rows={2}
                  value={quoteScope}
                  onChange={(e) => setQuoteScope(e.target.value)}
                  placeholder="Detailed breakdown of OEM spares, testing protocols, and labor warranties..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">PDF Proposal Document Link</label>
                <input
                  type="text"
                  placeholder="https://vendor.com/proposals/solitaire-chs-quote-2026.pdf"
                  value={quotePdfUrl}
                  onChange={(e) => setQuotePdfUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMultiItemQuoteModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                >
                  Save Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SECRETARY / MC WORK ORDER APPROVAL ACTION */}
      {showSecretaryApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-amber-600 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-white" />
                <h3 className="text-base font-bold">Secretary / MC Approval Sign-Off</h3>
              </div>
              <button onClick={() => setShowSecretaryApprovalModal(null)} className="text-amber-100 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200/80 space-y-1.5">
                <span className="font-mono font-bold text-amber-950 text-xs">{showSecretaryApprovalModal.id}</span>
                <h4 className="text-sm font-bold text-amber-950">{showSecretaryApprovalModal.procurementTitle}</h4>
                <p className="text-amber-800">
                  Vendor: <strong>{showSecretaryApprovalModal.vendorName}</strong> · Grand Total: <strong className="font-mono">₹{showSecretaryApprovalModal.totalApprovedAmount.toLocaleString('en-IN')}</strong>
                </p>
                <p className="text-amber-900 text-[11px] pt-1 border-t border-amber-200/50">
                  Payment Terms: {showSecretaryApprovalModal.paymentTerms}
                </p>
              </div>

              {role !== 'secretary' && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 flex items-start gap-2 animate-in fade-in duration-150">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Secretary Sign-Off Restricted</p>
                    <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                      Formal Work Order approval and revision authority is restricted strictly to the <strong>MC Secretary</strong> role. You are currently logged in with role <strong>"{role}"</strong>, so approval action buttons are disabled.
                    </p>
                  </div>
                </div>
              )}

              {approvalError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{approvalError}</span>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Secretary Comments <span className="text-red-500">* (Mandatory for Audit Trail)</span>
                </label>
                <textarea
                  rows={4}
                  required
                  disabled={role !== 'secretary'}
                  placeholder="Enter committee resolution reference, audit justification, or specific revisions required by the vendor..."
                  value={secretaryComments}
                  onChange={(e) => setSecretaryComments(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-teal-600 disabled:opacity-60"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  disabled={role !== 'secretary'}
                  onClick={handleSecretaryRequestChanges}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-red-800 rounded-lg font-semibold cursor-pointer transition-colors"
                >
                  Request Changes
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSecretaryApprovalModal(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={role !== 'secretary'}
                    onClick={handleSecretaryApprove}
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-lg font-bold cursor-pointer shadow-xs transition-colors"
                  >
                    Approve Work Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CONVERT QUOTE TO WORK ORDER */}
      {showReleaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold">Draft Work Order from Selected Quote</h3>
              </div>
              <button onClick={() => setShowReleaseModal(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <h4 className="font-bold text-slate-900">{showReleaseModal.projectTitle}</h4>
                <p className="text-slate-600">Vendor: <strong>{showReleaseModal.vendorName}</strong></p>
                <p className="text-teal-800 font-mono font-bold text-sm">
                  Grand Total: ₹{showReleaseModal.quotedAmount.toLocaleString('en-IN')}
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Start Date</label>
                <input
                  type="date"
                  value={woStartDate}
                  onChange={(e) => setWoStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Completion Date</label>
                <input
                  type="date"
                  value={woTargetDate}
                  onChange={(e) => setWoTargetDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReleaseModal(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReleaseWO}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                >
                  Generate Work Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD PAYMENT LOG */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold">Record Work Order Payment Installment</h3>
              </div>
              <button onClick={() => setShowPaymentModal(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Payment Stage</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                >
                  <option value="Advance">Mobilization Advance</option>
                  <option value="Milestone 1">Milestone 1 (Material Delivery)</option>
                  <option value="Milestone 2">Milestone 2 (50% Completion)</option>
                  <option value="Final Settlement">Final Settlement (Inspection Sign-Off)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Amount Paid (₹)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="NEFT / RTGS">NEFT / RTGS</option>
                    <option value="Society Bank Portal">Society Bank Portal</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Bank Transaction UTR #</label>
                  <input
                    type="text"
                    required
                    placeholder="HDFC0000241N..."
                    value={paymentUtr}
                    onChange={(e) => setPaymentUtr(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Disbursement Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Material delivery verified on site by Facility Supervisor and Treasurer signoff."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                >
                  Confirm & Disburse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: EDIT WORK ORDER & TERMS */}
      {editingWorkOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="text-base font-bold">Edit Work Order & Governance Terms</h3>
                  <span className="text-[11px] text-teal-300 font-mono">{editingWorkOrder.id}</span>
                </div>
              </div>
              <button
                onClick={() => setEditingWorkOrder(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWorkOrderEdit} className="p-6 space-y-4 text-xs">
              {editWoSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{editWoSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="font-semibold text-slate-700 block mb-1">
                    Work Order Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editWoTitle}
                    onChange={(e) => setEditWoTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="font-semibold text-slate-700 block mb-1">Total Approved Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editWoAmount}
                    onChange={(e) => setEditWoAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Scope of Work Summary</label>
                <textarea
                  rows={2}
                  value={editWoScope}
                  onChange={(e) => setEditWoScope(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editWoStartDate}
                    onChange={(e) => setEditWoStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Date</label>
                  <input
                    type="date"
                    value={editWoTargetDate}
                    onChange={(e) => setEditWoTargetDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Work Status</label>
                  <select
                    value={editWoWorkStatus}
                    onChange={(e) => setEditWoWorkStatus(e.target.value as any)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Inspection Stage">Inspection Stage</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Progress ({editWoProgress}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={editWoProgress}
                    onChange={(e) => setEditWoProgress(Number(e.target.value))}
                    className="w-full mt-2 accent-teal-700 cursor-pointer"
                  />
                </div>
              </div>

              {/* Customizable Terms & Governance Clauses */}
              <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">Customizable Governance Terms & Clauses</span>
                    <span className="text-[10px] text-slate-500">Legal, safety, penalty, and MCS Act compliance terms</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetWoTerms}
                    className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {woTermsList.map((term, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-white rounded-lg border border-slate-200 flex items-start justify-between gap-2 text-xs"
                    >
                      <span className="text-slate-700 leading-relaxed">{term}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveWoTerm(idx)}
                        className="text-slate-400 hover:text-red-500 shrink-0 p-0.5 cursor-pointer"
                        title="Remove Clause"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <input
                    type="text"
                    placeholder="Add custom clause (e.g. 10% daily penalty for delayed milestone)..."
                    value={newClauseInput}
                    onChange={(e) => setNewClauseInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddWoTerm();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddWoTerm}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg font-semibold cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingWorkOrder(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                >
                  Save Work Order & Terms
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
