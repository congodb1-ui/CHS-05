import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useSociety } from '../../context/SocietyContext';
import { uploadToCHSStorage } from '../../lib/supabase';
import {
  ClipboardCheck,
  Users,
  CheckCircle2,
  AlertTriangle,
  Database,
  Download,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Send,
  Wrench,
  Search,
  Filter,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Lock,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Server,
  FileText,
  Upload,
  Camera,
  Image,
} from 'lucide-react';
import { AttendanceCode, StaffMember, InspectionItem } from '../../types';
import {
  fetchInspectionByDay,
  fetchAttendanceByDay,
  saveInspection,
  updateStaffAttendance,
  bulkMarkAttendance as bulkMarkAttendanceInDb,
  syncAllSupervisorDataToSupabase,
  testSupabaseOperationsConnection,
} from '../../services/supervisorService';

export const SupervisorInspectionView: React.FC = () => {
  const {
    inspections,
    selectedInspectionDay,
    setSelectedInspectionDay,
    syncInspectionReport,
    syncDayAttendance,
    updateInspectionItem,
    addInspectionItem,
    editInspectionItem,
    removeInspectionItem,
    submitInspection,
    verifyInspection,
    staffList,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    attendance,
    updateAttendance,
    bulkMarkAttendance,
    escalateChecklistToTicket,
    role,
    setRole,
    hasRole,
    societyDetails,
    activeSociety,
  } = useSociety();

  const [activeTab, setActiveTab] = useState<'checklist' | 'attendance'>('checklist');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [adminCommentInput, setAdminCommentInput] = useState('');
  const [escalatedMap, setEscalatedMap] = useState<Record<number, string>>({});
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // PDF Export and Photo Upload State
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [checklistPhotoUrl, setChecklistPhotoUrl] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [daySitePhotos, setDaySitePhotos] = useState<Record<number, string[]>>({});

  // Async Database Operations Loading States
  const [isFetchingDay, setIsFetchingDay] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [updatingStaffSrNo, setUpdatingStaffSrNo] = useState<number | null>(null);
  const [isBulkMarking, setIsBulkMarking] = useState<boolean>(false);
  const [isDbSyncing, setIsDbSyncing] = useState<boolean>(false);

  // Checklist Item Management State
  const [showChecklistModal, setShowChecklistModal] = useState<boolean>(false);
  const [editingChecklistItem, setEditingChecklistItem] = useState<InspectionItem | null>(null);
  const [checklistActivity, setChecklistActivity] = useState<string>('');
  const [checklistCategory, setChecklistCategory] = useState<string>('UTILITIES & INFRASTRUCTURE');
  const [checklistStatus, setChecklistStatus] = useState<string>('Working OK');
  const [checklistRemarks, setChecklistRemarks] = useState<string>('');
  const [applyChecklistToAllDays, setApplyChecklistToAllDays] = useState<boolean>(false);
  const [checklistItemToDelete, setChecklistItemToDelete] = useState<InspectionItem | null>(null);
  const [deleteItemFromAllDays, setDeleteItemFromAllDays] = useState<boolean>(false);

  // Staff Modal Management State
  const [showStaffModal, setShowStaffModal] = useState<boolean>(false);
  const [editingStaffSrNo, setEditingStaffSrNo] = useState<number | null>(null);
  const [staffName, setStaffName] = useState<string>('');
  const [staffTeam, setStaffTeam] = useState<string>('Security');
  const [staffRole, setStaffRole] = useState<string>('Security Guard');
  const [staffShift, setStaffShift] = useState<string>('General Shift (08:00 - 17:00)');
  const [staffStatus, setStaffStatus] = useState<'Active' | 'On Leave' | 'Reliever'>('Active');
  const [staffModalSuccess, setStaffModalSuccess] = useState<string | null>(null);

  // Staff Deletion Confirmation State
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);

  // Current calendar day constraint (Day of month, e.g. Oct 5)
  const currentCalendarDay = Math.min(new Date().getDate(), 31);

  // Get current day's report
  const currentReport = inspections.find((r) => r.day === selectedInspectionDay) || inspections[0];

  // Permanent verification lock
  const isChecklistLocked = Boolean(currentReport.isVerified);

  // Strict role segregation: Supervisors CANNOT sign off. Only Admin and MC can sign off.
  const canVerifyAdmin = (role === 'admin' || role === 'secretary' || role === 'mc_member' || hasRole('admin') || hasRole('secretary') || hasRole('mc_member')) && role !== 'supervisor';
  
  // Can edit only if not locked, and user is supervisor or admin
  const canEditInspection = (role === 'supervisor' || role === 'admin') && !isChecklistLocked;

  // Automatically fetch live checklist and attendance data from Supabase whenever selectedInspectionDay changes
  useEffect(() => {
    let isCancelled = false;

    async function loadDayData() {
      setIsFetchingDay(true);
      try {
        const [remoteReport, remoteAttendance] = await Promise.all([
          fetchInspectionByDay(selectedInspectionDay),
          fetchAttendanceByDay(selectedInspectionDay),
        ]);

        if (isCancelled) return;

        if (remoteReport) {
          syncInspectionReport(remoteReport);
        }
        if (remoteAttendance && Object.keys(remoteAttendance).length > 0) {
          syncDayAttendance(selectedInspectionDay, remoteAttendance);
        }
      } catch (err) {
        console.warn(`[SupervisorInspectionView] Error fetching day ${selectedInspectionDay} from Supabase:`, err);
      } finally {
        if (!isCancelled) {
          setIsFetchingDay(false);
        }
      }
    }

    loadDayData();

    return () => {
      isCancelled = true;
    };
  }, [selectedInspectionDay, syncInspectionReport, syncDayAttendance]);

  const filteredItems = currentReport.items.filter((item) => {
    if (categoryFilter === 'All') return true;
    return item.category === categoryFilter;
  });

  // Calculate statistics
  const totalItems = currentReport.items.length;
  const actionItems = currentReport.items.filter(
    (it) => it.status === 'Action Required' || it.status === 'Not Working' || it.status === 'Bulbs Blown / Replaced' || it.status === 'Blurry / Adjust Lens'
  );
  const okItems = currentReport.items.filter(
    (it) => it.status === 'Working OK' || it.status === 'Cleaned & Swept' || it.status.includes('Full') || it.status.includes('Adequate') || it.status === 'Collected On Time' || it.status === 'No Leakage (OK)'
  );

  const handleEscalate = (item: typeof currentReport.items[0]) => {
    const tktId = escalateChecklistToTicket(item.id, item.activity, item.remarks);
    setEscalatedMap((prev) => ({ ...prev, [item.id]: tktId }));
  };

  const openAddChecklistItem = () => {
    setEditingChecklistItem(null);
    setChecklistActivity('');
    setChecklistCategory(categoryFilter === 'All' ? 'UTILITIES & INFRASTRUCTURE' : (categoryFilter as any));
    setChecklistStatus('Working OK');
    setChecklistRemarks('');
    setApplyChecklistToAllDays(true);
    setShowChecklistModal(true);
  };

  const openEditChecklistItem = (item: InspectionItem) => {
    setEditingChecklistItem(item);
    setChecklistActivity(item.activity);
    setChecklistCategory(item.category);
    setChecklistStatus(item.status);
    setChecklistRemarks(item.remarks || '');
    setChecklistPhotoUrl(item.photoUrl || '');
    setApplyChecklistToAllDays(false);
    setShowChecklistModal(true);
  };

  const handlePhotoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const res = await uploadToCHSStorage(file, 'inspections');
      if (res.success && res.publicUrl) {
        setChecklistPhotoUrl(res.publicUrl);
        setSyncStatus(`✓ Site photo uploaded to CHS-Storage/inspections/ successfully!`);
        setTimeout(() => setSyncStatus(null), 4000);
      }
    } catch (err) {
      console.error('Failed to upload site photo:', err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleUploadDaySitePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const res = await uploadToCHSStorage(file, 'inspections');
      if (res.success && res.publicUrl) {
        setDaySitePhotos((prev) => ({
          ...prev,
          [selectedInspectionDay]: [...(prev[selectedInspectionDay] || []), res.publicUrl],
        }));
        setSyncStatus(`✓ Attached site photo to Day ${selectedInspectionDay} report!`);
        setTimeout(() => setSyncStatus(null), 4000);
      }
    } catch (err) {
      console.error('Failed to upload site photo:', err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleExportPdfReport = async () => {
    setIsGeneratingPdf(true);
    setSyncStatus('Generating formatted PDF report with html2canvas and jsPDF...');
    try {
      const reportElement = document.getElementById('printable-inspection-report');
      if (!reportElement) {
        throw new Error('Printable element not found');
      }

      // Temporarily reveal element for rendering
      reportElement.style.display = 'block';

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
      });

      reportElement.style.display = 'none';

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const filename = `${societyDetails.name.replace(/[^a-zA-Z0-9]/g, '_')}_Daily_Inspection_Day_${currentReport.day}_${currentReport.date.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      pdf.save(filename);

      // Upload copy to Supabase storage 'reports' folder
      const pdfBlob = pdf.output('blob');
      const uploadRes = await uploadToCHSStorage(pdfBlob, 'reports', filename);

      if (uploadRes.success) {
        setSyncStatus(`✓ PDF downloaded & uploaded copy saved to CHS-Storage/reports/ successfully!`);
      } else {
        setSyncStatus(`✓ PDF report downloaded to device successfully!`);
      }
      setTimeout(() => setSyncStatus(null), 6000);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setSyncStatus(`PDF generation error: ${err.message || 'Please retry'}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSaveChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checklistActivity.trim()) return;

    if (editingChecklistItem) {
      editInspectionItem(
        selectedInspectionDay,
        editingChecklistItem.id,
        {
          activity: checklistActivity.trim(),
          category: checklistCategory as any,
          status: checklistStatus,
          remarks: checklistRemarks,
          photoUrl: checklistPhotoUrl || undefined,
        },
        applyChecklistToAllDays
      );
      setSyncStatus(`✓ Modified checklist item #${editingChecklistItem.id}: "${checklistActivity.trim()}" (${applyChecklistToAllDays ? 'all 31 days' : `Day ${selectedInspectionDay}`})`);
    } else {
      addInspectionItem(
        selectedInspectionDay,
        {
          activity: checklistActivity.trim(),
          category: checklistCategory as any,
          status: checklistStatus,
          remarks: checklistRemarks,
          photoUrl: checklistPhotoUrl || undefined,
        },
        applyChecklistToAllDays
      );
      setSyncStatus(`✓ Added new checklist item: "${checklistActivity.trim()}" (${applyChecklistToAllDays ? 'all 31 days' : `Day ${selectedInspectionDay}`})`);
    }

    setShowChecklistModal(false);
    setEditingChecklistItem(null);
    setChecklistPhotoUrl('');
    setTimeout(() => setSyncStatus(null), 5000);
  };

  const confirmDeleteChecklistItem = () => {
    if (!checklistItemToDelete) return;
    removeInspectionItem(selectedInspectionDay, checklistItemToDelete.id, deleteItemFromAllDays);
    setSyncStatus(`✓ Removed checklist item #${checklistItemToDelete.id} (${deleteItemFromAllDays ? 'all 31 days' : `Day ${selectedInspectionDay}`})`);
    setChecklistItemToDelete(null);
    setTimeout(() => setSyncStatus(null), 5000);
  };

  const openEditStaffMember = (staff: StaffMember) => {
    setEditingStaffSrNo(staff.srNo);
    setStaffName(staff.name);
    setStaffTeam(staff.team);
    setStaffRole(staff.role);
    setStaffShift(staff.shift);
    setStaffStatus(staff.status as any);
    setStaffModalSuccess(null);
    setShowStaffModal(true);
  };

  const confirmDeleteStaffMember = () => {
    if (!staffToDelete) return;
    deleteStaffMember(staffToDelete.srNo);
    setSyncStatus(`✓ Removed staff member #${staffToDelete.srNo} (${staffToDelete.name}) from roster.`);
    setStaffToDelete(null);
    setTimeout(() => setSyncStatus(null), 5000);
  };

  // Persists item changes to state and Supabase operations schema
  const handleChecklistItemChange = async (itemId: number, newStatus: string, newRemarks?: string) => {
    updateInspectionItem(selectedInspectionDay, itemId, newStatus, newRemarks);
    try {
      const updatedItems = currentReport.items.map((it) =>
        it.id === itemId
          ? { ...it, status: newStatus, remarks: newRemarks !== undefined ? newRemarks : it.remarks }
          : it
      );
      await saveInspection({
        ...currentReport,
        items: updatedItems,
      });
    } catch (err) {
      console.warn('[SupervisorInspectionView] Error auto-syncing checklist item:', err);
    }
  };

  // Handles Supervisor submission to Estate Office & Supabase
  const handleSubmit = async () => {
    setIsSubmitting(true);
    const now = new Date();
    const timeStr = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 1. Update UI Context
    submitInspection(selectedInspectionDay);

    // 2. Persist to Supabase operations.supervisor_inspections
    try {
      const updatedReport = {
        ...currentReport,
        isSubmitted: true,
        submittedAt: timeStr,
      };
      const res = await saveInspection(updatedReport);
      if (res.success) {
        setSyncStatus(`✓ Day ${selectedInspectionDay} checklist submitted & synced to Supabase operations schema!`);
      } else {
        setSyncStatus(`⚠️ Submitted locally. Supabase note: ${res.error}`);
      }
    } catch (err: any) {
      console.warn('[SupervisorInspectionView] Error submitting checklist to Supabase:', err);
      setSyncStatus(`⚠️ Submitted locally (offline mode).`);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSyncStatus(null), 5000);
    }
  };

  // Handles Admin Verification & Signoff to Supabase
  const handleVerify = async () => {
    setIsVerifying(true);
    const adminName = 'Soleha Khan (Estate Admin)';
    const comment = adminCommentInput || 'Verified and verified on physical walkthrough.';
    const now = new Date();
    const timeStr = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 1. Update UI Context
    verifyInspection(selectedInspectionDay, adminName, comment);
    setAdminCommentInput('');

    // 2. Persist to Supabase operations.supervisor_inspections
    try {
      const updatedReport = {
        ...currentReport,
        isVerified: true,
        verifiedByAdmin: adminName,
        adminComments: comment,
        verifiedAt: timeStr,
      };
      const res = await saveInspection(updatedReport);
      if (res.success) {
        setSyncStatus(`✓ Day ${selectedInspectionDay} checklist verified & permanently locked in Supabase operations schema!`);
      } else {
        setSyncStatus(`⚠️ Verified locally. Supabase note: ${res.error}`);
      }
    } catch (err: any) {
      console.warn('[SupervisorInspectionView] Error verifying checklist in Supabase:', err);
      setSyncStatus(`⚠️ Verified locally (offline mode).`);
    } finally {
      setIsVerifying(false);
      setTimeout(() => setSyncStatus(null), 5000);
    }
  };

  // Handles individual staff attendance change
  const handleAttendanceChange = async (staffSrNo: number, code: AttendanceCode) => {
    setUpdatingStaffSrNo(staffSrNo);
    // Immediate UI update
    updateAttendance(staffSrNo, selectedInspectionDay, code);

    // Asynchronous Supabase persistence
    try {
      const res = await updateStaffAttendance(staffSrNo, selectedInspectionDay, code, 'Supervisor Parvez');
      if (!res.success) {
        console.warn(`[Supabase] Staff attendance sync warning:`, res.error);
      }
    } catch (err) {
      console.warn(`[Supabase] Staff attendance sync failed:`, err);
    } finally {
      setUpdatingStaffSrNo(null);
    }
  };

  // Handles bulk mark all present
  const handleBulkMarkPresent = async () => {
    setIsBulkMarking(true);
    // Immediate UI update
    bulkMarkAttendance(selectedInspectionDay, 'P');

    // Asynchronous Supabase persistence
    try {
      const staffSrNos = staffList.map((s) => s.srNo);
      const res = await bulkMarkAttendanceInDb(selectedInspectionDay, staffSrNos, 'P', 'Supervisor Parvez');
      if (res.success) {
        setSyncStatus(`✓ All ${staffList.length} staff marked Present in Supabase operations.staff_attendance!`);
      } else {
        setSyncStatus(`⚠️ Attendance updated locally. Supabase note: ${res.error}`);
      }
    } catch (err) {
      console.warn(`[Supabase] Bulk mark attendance failed:`, err);
      setSyncStatus(`⚠️ Attendance updated locally (offline mode).`);
    } finally {
      setIsBulkMarking(false);
      setTimeout(() => setSyncStatus(null), 4000);
    }
  };

  const exportCsv = () => {
    let csv = `Kool Homes Solitaire CHS - Daily Inspection Day ${selectedInspectionDay} (${currentReport.date})\n`;
    csv += `Sr No,Inspection Activity,Category,Status,Remarks\n`;
    currentReport.items.forEach((it) => {
      csv += `${it.id},"${it.activity}","${it.category}","${it.status}","${it.remarks.replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Solitaire_Inspection_Day_${selectedInspectionDay}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSupabaseDatabaseSync = async () => {
    setIsDbSyncing(true);
    setSyncStatus('Connecting and syncing all inspection & attendance records to Supabase PostgreSQL database...');
    try {
      const res = await syncAllSupervisorDataToSupabase(inspections, attendance, staffList);
      if (res.success) {
        setSyncStatus(`✓ Supabase DB Sync Complete: All 31 daily checklists, 23 staff records & attendance matrix stored in PostgreSQL!`);
      } else {
        setSyncStatus(`⚠️ Synced to local cache. Note: ${res.message}`);
      }
    } catch (err: any) {
      console.warn('[SupervisorInspectionView] Supabase sync exception:', err);
      setSyncStatus(`⚠️ Saved to local cache (offline fallback mode).`);
    } finally {
      setIsDbSyncing(false);
      setTimeout(() => setSyncStatus(null), 6000);
    }
  };

  // Attendance stats for selected day
  const dayAttendance = staffList.map((s) => ({
    ...s,
    code: attendance[s.srNo]?.[selectedInspectionDay] || '',
  }));
  const presentCount = dayAttendance.filter((a) => a.code === 'P').length;
  const absentCount = dayAttendance.filter((a) => a.code === 'A').length;
  const woCount = dayAttendance.filter((a) => a.code === 'WO').length;
  const hdCount = dayAttendance.filter((a) => a.code === 'HD').length;
  const lCount = dayAttendance.filter((a) => a.code === 'L').length;
  const attendancePercent = staffList.length > 0 ? Math.round(((presentCount + hdCount * 0.5) / (staffList.length - woCount || 1)) * 100) : 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Role Permission Guidance Banner */}
      {role === 'supervisor' && (
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs text-teal-900">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse"></span>
            <div>
              <strong className="font-bold">Facility Supervisor Walkthrough Mode (Parvez):</strong> You have direct live editing access. Tap statuses, enter defect observations, mark staff attendance, and click &ldquo;Submit to Estate Office&rdquo; when finished.
            </div>
          </div>
          <span className="font-mono text-[10px] bg-teal-200/60 px-2 py-0.5 rounded font-semibold text-teal-800">
            Write Permissions Active
          </span>
        </div>
      )}

      {role === 'member' && (
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between text-xs text-sky-900">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
            <div>
              <strong className="font-bold">Resident Member Transparency View:</strong> You are viewing live verified society walkthrough audits logged by Supervisor Parvez and verified by Estate Admin Soleha Khan. Editing is locked for members to maintain official integrity.
            </div>
          </div>
          <span className="font-mono text-[10px] bg-sky-200/60 px-2 py-0.5 rounded font-semibold text-sky-800">
            Read-Only Audit Mode
          </span>
        </div>
      )}

      {(role === 'secretary' || role === 'admin') && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between text-xs text-purple-900">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
            <div>
              <strong className="font-bold">Managing Committee (Secretary / Admin) Oversight Mode:</strong> Monitor real-time supervisor walkthrough logs, escalate open defects to AMC vendor work orders, and provide estate office administrative signoff.
            </div>
          </div>
          <span className="font-mono text-[10px] bg-purple-200/60 px-2 py-0.5 rounded font-semibold text-purple-800">
            Verification & Oversight Active
          </span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 block">
              KOOL HOMES SOLITAIRE CO-OP HOUSING SOCIETY LTD.
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Daily Inspection & Attendance Master System
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Live facility supervisor logs (Parvez), estate office admin verification (Soleha Khan), and Managing Committee monitoring for all 23 estate staff and 33 critical infrastructure points.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSupabaseDatabaseSync}
              disabled={isDbSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60 shadow-2xs"
              title="Save & sync all 31-day inspection reports and 23 staff attendance records to Supabase PostgreSQL database"
            >
              {isDbSyncing ? (
                <Loader2 className="w-3.5 h-3.5 text-teal-600 animate-spin" />
              ) : (
                <Database className="w-3.5 h-3.5 text-teal-600" />
              )}
              <span>{isDbSyncing ? 'Syncing to Supabase DB...' : 'Sync to Supabase DB'}</span>
            </button>
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleExportPdfReport}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-white" />
              )}
              <span>{isGeneratingPdf ? 'Generating PDF Report...' : 'Export PDF Report'}</span>
            </button>
          </div>
        </div>

        {/* Sync notification banner */}
        {syncStatus && (
          <div className="mt-4 p-3 bg-teal-50 border border-teal-200 text-teal-900 rounded-lg text-xs flex items-center justify-between animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-700 shrink-0" />
              <span className="font-semibold">{syncStatus}</span>
            </div>
            <span className="text-[11px] text-teal-700 font-semibold bg-white/80 px-2 py-0.5 rounded border border-teal-200">
              Supabase DB Active
            </span>
          </div>
        )}

        {/* Day Index Bar (Days 1 - 31 exactly as shown on PDF Page 1) */}
        <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              31-Day Daily Inspection Checklist Index:
            </span>
            <span className="text-slate-500 tabular-nums flex items-center gap-1.5">
              {isFetchingDay && <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600 inline" />}
              <span>Selected: <strong>Day {selectedInspectionDay} ({currentReport.date})</strong></span>
              {isFetchingDay && <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">Syncing with DB...</span>}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((dayNum) => {
              const hasReport = inspections.some((r) => r.day === dayNum);
              const isSelected = selectedInspectionDay === dayNum;
              const isFutureDay = dayNum > currentCalendarDay;
              return (
                <button
                  key={dayNum}
                  disabled={isFutureDay}
                  onClick={() => !isFutureDay && setSelectedInspectionDay(dayNum)}
                  title={isFutureDay ? `Day ${dayNum} locked: Future dates cannot be inspected ahead of time.` : undefined}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                    isFutureDay
                      ? 'bg-slate-50 text-slate-300 border border-dashed border-slate-200 cursor-not-allowed opacity-50'
                      : isSelected
                      ? 'bg-teal-700 text-white shadow-xs cursor-pointer'
                      : hasReport
                      ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 cursor-pointer'
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100 cursor-pointer'
                  }`}
                >
                  Day {dayNum} {isFutureDay ? '🔒' : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main 2 Navigation Tabs */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg max-w-lg">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'checklist'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            33-Point Daily Inspection ({totalItems})
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Staff Attendance ({staffList.length} Personnel)
          </button>
        </div>
      </div>

      {/* Tab 1: 33-Point Daily Inspection Checklist */}
      {activeTab === 'checklist' && (
        <div className="space-y-6">
          {/* Permanent Verification Lock Banner */}
          {isChecklistLocked && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl text-xs font-medium flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="p-1 bg-emerald-200 text-emerald-900 rounded-md">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold block">Checklist Verified & Permanently Locked (Read-Only)</span>
                  <span className="text-[11px] text-emerald-800">
                    Day {selectedInspectionDay} has been officially verified by {currentReport.verifiedByAdmin || 'Estate Office'}. Further modifications are blocked to preserve MCS Act statutory compliance.
                  </span>
                </div>
              </div>
              <span className="font-mono text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                AUDIT LOCKED
              </span>
            </div>
          )}

          {/* Quick Metrics Bar for Selected Day */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Inspected</span>
              <span className="text-xl font-bold text-slate-900 tabular-nums">33 Checkpoints</span>
              <span className="text-[11px] text-slate-500 block">4 Critical Categories</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Working / Cleaned</span>
              <span className="text-xl font-bold text-emerald-700 tabular-nums">{okItems.length} OK</span>
              <span className="text-[11px] text-emerald-600 block">Passed Standard</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Action Required / Flaws</span>
              <span className="text-xl font-bold text-red-600 tabular-nums">{actionItems.length} Issues</span>
              <span className="text-[11px] text-red-500 block">Requires Resolution</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Admin Signoff</span>
              <span className="text-base font-bold text-slate-900 block truncate">
                {currentReport.isVerified ? 'Verified by Soleha' : 'Pending Verification'}
              </span>
              <span className={`text-[11px] font-semibold ${currentReport.isVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
                {currentReport.isVerified ? 'Signed Off' : 'Review Required'}
              </span>
            </div>
          </div>

          {/* Category Filter Pills & Add Checklist Item Button */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                'All',
                'UTILITIES & INFRASTRUCTURE',
                'CLEANING & HYGIENE',
                'LIGHTS & SECURITY',
                'RENOVATION & MAINTENANCE',
              ].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'All' ? `All Checkpoints (${currentReport.items.length})` : cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openAddChecklistItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                title="Add a new custom checklist point to daily inspections"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Checklist Item</span>
              </button>
            </div>
          </div>

          {/* 33-Point Checklist Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">Sr.</th>
                    <th className="py-2.5 px-3">Inspection Category & Activity Details</th>
                    <th className="py-2.5 px-3 w-48">Status / Observation</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Comments / Remarks</th>
                    <th className="py-2.5 px-3 text-right">Committee Action</th>
                    <th className="py-2.5 px-3 text-center w-28">Admin Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => {
                    const isIssue =
                      item.status === 'Action Required' ||
                      item.status === 'Not Working' ||
                      item.status === 'Bulbs Blown / Replaced' ||
                      item.status === 'Blurry / Adjust Lens';
                    const escalatedTicket = escalatedMap[item.id];

                    return (
                      <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${isIssue ? 'bg-red-50/20' : ''}`}>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                          {item.id}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] font-bold text-teal-800 uppercase block tracking-wider">
                            {item.category}
                          </span>
                          <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                            {item.activity}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {canEditInspection ? (
                            /* Interactive status selector for Supervisor */
                            <select
                              value={item.status}
                              onChange={(e) => handleChecklistItemChange(item.id, e.target.value)}
                              className={`w-full text-xs p-1.5 rounded-lg border font-semibold ${
                                isIssue
                                  ? 'bg-red-50 border-red-300 text-red-800'
                                  : 'bg-emerald-50/80 border-emerald-300 text-emerald-800'
                              }`}
                            >
                              <option value="Working OK">Working OK</option>
                              <option value="Cleaned & Swept">Cleaned & Swept</option>
                              <option value="Full (100%)">Full (100%)</option>
                              <option value="Adequate (>75%)">Adequate (&gt;75%)</option>
                              <option value="Collected On Time">Collected On Time</option>
                              <option value="No Leakage (OK)">No Leakage (OK)</option>
                              <option value="Action Required">Action Required</option>
                              <option value="Not Working">Not Working</option>
                              <option value="Bulbs Blown / Replaced">Bulbs Blown / Replaced</option>
                              <option value="Blurry / Adjust Lens">Blurry / Adjust Lens</option>
                              <option value="No Violations">No Violations</option>
                            </select>
                          ) : (
                            /* Read-only status badge for Residents */
                            <span
                              className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold border ${
                                isIssue
                                  ? 'bg-red-50 border-red-200 text-red-700'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              }`}
                            >
                              {item.status}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {canEditInspection ? (
                            <input
                              type="text"
                              value={item.remarks}
                              placeholder="Add defect notes or observations..."
                              onChange={(e) => handleChecklistItemChange(item.id, item.status, e.target.value)}
                              className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-teal-600"
                            />
                          ) : (
                            <span className="text-xs text-slate-700">
                              {item.remarks ? (
                                <span className={isIssue ? 'font-medium text-red-800' : 'text-slate-800'}>
                                  {item.remarks}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">No defect observed</span>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {isIssue ? (
                            escalatedTicket ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                {escalatedTicket}
                              </span>
                            ) : (
                              <button
                                onClick={() => handleEscalate(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer shadow-xs"
                                title="Escalate directly to Society Helpdesk"
                              >
                                <Wrench className="w-3 h-3" />
                                <span>Create Ticket</span>
                              </button>
                            )
                          ) : (
                            <span className="text-slate-400 text-[11px]">Normal</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditChecklistItem(item)}
                              className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                              title="Modify Checklist Item (Title, Category, Status)"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setChecklistItemToDelete(item);
                                setDeleteItemFromAllDays(false);
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Checklist Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Attached Site Photos & Media Section */}
            <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-teal-700" />
                  <span className="font-bold text-slate-800 text-xs">
                    Site Photos & Evidence (Day {selectedInspectionDay})
                  </span>
                  <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 font-mono">
                    CHS-Storage/inspections/
                  </span>
                </div>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs transition-colors">
                  {isUploadingPhoto ? (
                    <Loader2 className="w-3.5 h-3.5 text-teal-700 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 text-teal-700" />
                  )}
                  <span>{isUploadingPhoto ? 'Uploading...' : 'Attach Local Site Photo (PNG/JPEG)'}</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={handleUploadDaySitePhoto}
                    disabled={isUploadingPhoto}
                    className="hidden"
                  />
                </label>
              </div>

              {daySitePhotos[selectedInspectionDay] && daySitePhotos[selectedInspectionDay].length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                  {daySitePhotos[selectedInspectionDay].map((url, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-300 aspect-video bg-slate-900 shadow-2xs">
                      <img src={url} alt={`Site evidence ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 bg-white/80 hover:bg-white text-slate-900 rounded text-[10px] font-bold"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  No site photos attached yet for Day {selectedInspectionDay}. Attach photos of utility pumps, electrical panels, or defect locations to include in the exported PDF report.
                </p>
              )}
            </div>

            {/* Supervisor & Admin Signoff Box (matching PDF Page 13) */}
            <div className="mt-6 pt-5 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Supervisor Sign */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                  Facility Supervisor Signoff
                </span>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Logged by: <strong>Parvez (Facility Supervisor)</strong></span>
                  <span className="tabular-nums text-slate-500">{currentReport.submittedAt || 'Pending final submit'}</span>
                </div>
                {!currentReport.isSubmitted && (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors cursor-pointer mt-2 flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting to Supabase Operations...</span>
                      </>
                    ) : (
                      <span>Submit Day {selectedInspectionDay} Checklist for Admin Verification</span>
                    )}
                  </button>
                )}
                {currentReport.isSubmitted && (
                  <div className="p-2 bg-teal-50 border border-teal-200 text-teal-800 rounded font-semibold text-center flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>Submitted to Estate Office on {currentReport.submittedAt}</span>
                  </div>
                )}
              </div>

              {/* Admin Signoff & Verification */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                  Managing Committee & Office Admin Verification
                </span>
                {currentReport.isVerified ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Checklist Verified & Permanently Locked</span>
                      </div>
                      <p className="text-[11px] text-emerald-700">
                        Signed off by <strong>{currentReport.verifiedByAdmin || 'Estate Admin (Soleha Khan)'}</strong> on {currentReport.verifiedAt}.
                      </p>
                      {currentReport.adminComments && (
                        <p className="text-[11px] italic text-slate-600 mt-1">
                          &ldquo;{currentReport.adminComments}&rdquo;
                        </p>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                      <Lock className="w-3 h-3" />
                      <span>Audit Lock Active: Checklist is permanently locked and cannot be edited.</span>
                    </div>
                  </div>
                ) : canVerifyAdmin ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      placeholder="Enter admin remarks / work orders given..."
                      value={adminCommentInput || currentReport.adminComments}
                      onChange={(e) => setAdminCommentInput(e.target.value)}
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-teal-700"
                    />
                    <button
                      onClick={handleVerify}
                      disabled={isVerifying}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors cursor-pointer text-xs flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
                          <span>Persisting Signoff to Supabase...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                          <span>Verify & Sign Off Day {selectedInspectionDay} Checklist</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-100 border border-slate-200 text-slate-500 rounded-lg text-xs text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5 font-semibold text-slate-700">
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Administrative Verification Restricted</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Only Managing Committee Members and Society Admins can verify and sign off daily walkthroughs. Supervisors cannot sign off their own inspections.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Monthly Staff Attendance Matrix */}
      {activeTab === 'attendance' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Staff & Vendor Attendance Matrix (Day {selectedInspectionDay})
              </h2>
              <p className="text-xs text-slate-500">
                Master attendance roster for {staffList.length} active estate personnel across Security, Housekeeping, STP/WTP, Electrician, Plumber, and Gardening.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setEditingStaffSrNo(null);
                  setStaffName('');
                  setStaffTeam('Security');
                  setStaffRole('Security Guard');
                  setStaffShift('Day Shift (08:00 - 20:00)');
                  setStaffStatus('Active');
                  setStaffModalSuccess(null);
                  setShowStaffModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-teal-400" />
                <span>Add On-Duty Staff</span>
              </button>

              {canEditInspection ? (
                <button
                  onClick={handleBulkMarkPresent}
                  disabled={isBulkMarking}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  {isBulkMarking && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />}
                  <span>{isBulkMarking ? 'Persisting to Database...' : 'Mark All Present (P)'}</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-500 font-medium">
                  Attendance entries verified by Estate Office
                </span>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Staff</span>
              <span className="text-lg font-bold text-slate-900 tabular-nums">{staffList.length} Personnel</span>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <span className="text-emerald-700 block text-[10px] uppercase font-semibold">Present (P)</span>
              <span className="text-lg font-bold text-emerald-800 tabular-nums">{presentCount} On Duty</span>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-red-700 block text-[10px] uppercase font-semibold">Absent (A)</span>
              <span className="text-lg font-bold text-red-800 tabular-nums">{absentCount} Absent</span>
            </div>
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg">
              <span className="text-sky-700 block text-[10px] uppercase font-semibold">Weekly Off (WO)</span>
              <span className="text-lg font-bold text-sky-800 tabular-nums">{woCount} Off</span>
            </div>
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
              <span className="text-teal-700 block text-[10px] uppercase font-semibold">Attendance %</span>
              <span className="text-lg font-bold text-teal-800 tabular-nums">{attendancePercent}%</span>
            </div>
          </div>

          {/* Attendance Legend as seen in PDF page 7 */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex flex-wrap items-center gap-3">
            <span className="font-bold text-slate-800">Attendance Codes:</span>
            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-semibold text-emerald-700">P = Present</span>
            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-semibold text-red-700">A = Absent</span>
            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-semibold text-blue-700">WO = Weekly Off</span>
            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-semibold text-amber-700">HD = Half Day (0.5)</span>
            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-semibold text-purple-700">L = Leave</span>
          </div>

          {/* Attendance Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">Sr.</th>
                  <th className="py-2.5 px-3">Staff / Vendor Name</th>
                  <th className="py-2.5 px-3">Team / Department</th>
                  <th className="py-2.5 px-3">Designation / Role</th>
                  <th className="py-2.5 px-3">Shift Timings</th>
                  <th className="py-2.5 px-3 text-center">Day {selectedInspectionDay} Status</th>
                  <th className="py-2.5 px-3 text-center w-28">Staff Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dayAttendance.map((staff) => (
                  <tr key={staff.srNo} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-600">
                      {staff.srNo}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{staff.name}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-medium text-slate-700">
                        {staff.team}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{staff.role}</td>
                    <td className="py-2.5 px-3 text-slate-500 tabular-nums">{staff.shift}</td>
                    <td className="py-2.5 px-3 text-center">
                      {canEditInspection ? (
                        <div className="inline-flex items-center gap-1">
                          {(['P', 'A', 'WO', 'HD', 'L'] as AttendanceCode[]).map((code) => {
                            const isCurrent = staff.code === code;
                            const isRowUpdating = updatingStaffSrNo === staff.srNo;
                            return (
                              <button
                                key={code}
                                disabled={isRowUpdating}
                                onClick={() => handleAttendanceChange(staff.srNo, code)}
                                className={`w-7 h-7 rounded text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center ${
                                  isCurrent
                                    ? code === 'P'
                                      ? 'bg-emerald-600 text-white'
                                      : code === 'A'
                                      ? 'bg-red-600 text-white'
                                      : code === 'WO'
                                      ? 'bg-blue-600 text-white'
                                      : code === 'HD'
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-purple-600 text-white'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                }`}
                              >
                                {isRowUpdating && isCurrent ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  code
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <span
                          className={`inline-block px-3 py-1 rounded text-xs font-bold ${
                            staff.code === 'P'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : staff.code === 'A'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : staff.code === 'WO'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : staff.code === 'HD'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : staff.code === 'L'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {staff.code === 'P'
                            ? 'Present (P)'
                            : staff.code === 'A'
                            ? 'Absent (A)'
                            : staff.code === 'WO'
                            ? 'Weekly Off (WO)'
                            : staff.code === 'HD'
                            ? 'Half Day (0.5)'
                            : staff.code === 'L'
                            ? 'Approved Leave (L)'
                            : 'Not Marked'}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditStaffMember(staff)}
                          className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                          title={`Modify name or designation for ${staff.name}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setStaffToDelete(staff)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title={`Remove ${staff.name} from staff roster`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STAFF DIRECTORY MANAGEMENT MODAL */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-slate-900 text-teal-400 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingStaffSrNo ? 'Update Staff Member Profile' : 'Add On-Duty Staff Member'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Master Estate Staff Roster · Active Team Personnel ({staffList.length} registered)
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowStaffModal(false);
                  setEditingStaffSrNo(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {staffModalSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{staffModalSuccess}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!staffName.trim()) return;

                if (editingStaffSrNo) {
                  updateStaffMember(editingStaffSrNo, {
                    name: staffName.trim(),
                    team: staffTeam,
                    role: staffRole.trim(),
                    shift: staffShift.trim(),
                    status: staffStatus,
                  });
                  setStaffModalSuccess(`Updated staff details for ${staffName.trim()}!`);
                } else {
                  addStaffMember({
                    name: staffName.trim(),
                    team: staffTeam,
                    role: staffRole.trim(),
                    shift: staffShift.trim(),
                    status: staffStatus,
                  });
                  setStaffModalSuccess(`Added ${staffName.trim()} to active staff directory!`);
                }

                setTimeout(() => {
                  setStaffModalSuccess(null);
                  setShowStaffModal(false);
                  setEditingStaffSrNo(null);
                  setStaffName('');
                }, 1000);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Staff / Personnel Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Shinde"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:bg-white focus:outline-teal-700"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Department / Team</label>
                  <select
                    value={staffTeam}
                    onChange={(e) => {
                      const tm = e.target.value;
                      setStaffTeam(tm);
                      if (tm === 'Security') setStaffRole('Security Guard');
                      else if (tm === 'Housekeeping') setStaffRole('Housekeeping Staff');
                      else if (tm === 'STP / Utilities') setStaffRole('STP / WTP Plant Operator');
                      else if (tm === 'Gardening') setStaffRole('Landscape Gardener');
                      else if (tm === 'Electrician') setStaffRole('Electrician Vendor');
                      else if (tm === 'Plumber') setStaffRole('Plumbing Vendor');
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:bg-white focus:outline-teal-700"
                  >
                    <option value="Security">Security</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="STP / Utilities">STP & WTP Utilities</option>
                    <option value="Gardening">Landscape & Gardening</option>
                    <option value="Electrician">Electrician</option>
                    <option value="Plumber">Plumber</option>
                    <option value="Office Admin">Office Admin</option>
                    <option value="Supervisor">Supervisor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Designation / Role</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Security Guard / Gate Lead"
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:bg-white focus:outline-teal-700"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Shift Timings</label>
                  <select
                    value={staffShift}
                    onChange={(e) => setStaffShift(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:bg-white focus:outline-teal-700"
                  >
                    <option value="Day Shift (07:30 - 16:30)">Day Shift (07:30 - 16:30)</option>
                    <option value="General Shift (08:00 - 17:00)">General Shift (08:00 - 17:00)</option>
                    <option value="General Shift (09:00 - 18:00)">General Shift (09:00 - 18:00)</option>
                    <option value="Day / Night Shift (12 hrs)">Day / Night Shift (12 hrs)</option>
                    <option value="Night Shift (20:00 - 08:00)">Night Shift (20:00 - 08:00)</option>
                    <option value="On-Call / Regular">On-Call / Regular</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">Operational Status</label>
                <select
                  value={staffStatus}
                  onChange={(e) => setStaffStatus(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:bg-white focus:outline-teal-700"
                >
                  <option value="Active">Active (On Regular Roster)</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Reliever">Reliever / Temporary Stand-in</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                {editingStaffSrNo && (
                  <button
                    type="button"
                    onClick={() => {
                      const staff = staffList.find((s) => s.srNo === editingStaffSrNo);
                      if (staff) {
                        setShowStaffModal(false);
                        setStaffToDelete(staff);
                      }
                    }}
                    className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                  >
                    Delete Staff Record
                  </button>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowStaffModal(false);
                      setEditingStaffSrNo(null);
                    }}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {editingStaffSrNo ? 'Save Changes' : 'Add to Staff Directory'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHECKLIST ITEM MANAGEMENT MODAL (ADD / MODIFY) */}
      {showChecklistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-700 text-white rounded-xl">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingChecklistItem ? `Modify Checklist Item #${editingChecklistItem.id}` : 'Add New Checklist Point'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Daily Facility Supervisor Walkthrough Standard · Kool Homes Solitaire CHS
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowChecklistModal(false);
                  setEditingChecklistItem(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChecklistItem} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Inspection Activity / Checkpoint Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swimming Pool Filtration & Chlorination Level Check"
                  value={checklistActivity}
                  onChange={(e) => setChecklistActivity(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:bg-white focus:outline-teal-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Category <span className="text-red-500">*</span></label>
                  <select
                    value={checklistCategory}
                    onChange={(e) => setChecklistCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:bg-white focus:outline-teal-700"
                  >
                    <option value="UTILITIES & INFRASTRUCTURE">UTILITIES & INFRASTRUCTURE</option>
                    <option value="CLEANING & HYGIENE">CLEANING & HYGIENE</option>
                    <option value="LIGHTS & SECURITY">LIGHTS & SECURITY</option>
                    <option value="RENOVATION & MAINTENANCE">RENOVATION & MAINTENANCE</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Status / Observation</label>
                  <select
                    value={checklistStatus}
                    onChange={(e) => setChecklistStatus(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:bg-white focus:outline-teal-700"
                  >
                    <option value="Working OK">Working OK</option>
                    <option value="Cleaned & Swept">Cleaned & Swept</option>
                    <option value="Full (100%)">Full (100%)</option>
                    <option value="Adequate (>75%)">Adequate (&gt;75%)</option>
                    <option value="Collected On Time">Collected On Time</option>
                    <option value="No Leakage (OK)">No Leakage (OK)</option>
                    <option value="Action Required">Action Required</option>
                    <option value="Not Working">Not Working</option>
                    <option value="Bulbs Blown / Replaced">Bulbs Blown / Replaced</option>
                    <option value="Blurry / Adjust Lens">Blurry / Adjust Lens</option>
                    <option value="No Violations">No Violations</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">Defect Remarks / Observations (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Pump running at 2.4 bar pressure. No leakage found."
                  value={checklistRemarks}
                  onChange={(e) => setChecklistRemarks(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:bg-white focus:outline-teal-700"
                />
              </div>

              {/* Direct PNG/JPEG Site Photo Upload */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="font-semibold text-slate-800 block text-xs">
                  Site Inspection Photo (Optional)
                </label>
                <div className="flex items-center gap-3">
                  {checklistPhotoUrl ? (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-300 shrink-0 shadow-2xs">
                      <img src={checklistPhotoUrl} alt="Inspection site photo" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setChecklistPhotoUrl('')}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 cursor-pointer"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : null}
                  <div className="flex-1 space-y-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer transition-colors shadow-2xs">
                      {isUploadingPhoto ? (
                        <Loader2 className="w-3.5 h-3.5 text-teal-700 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-teal-700" />
                      )}
                      <span>{isUploadingPhoto ? 'Uploading to CHS-Storage...' : 'Select Local Image (PNG/JPEG)'}</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={handlePhotoFileSelect}
                        disabled={isUploadingPhoto}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] text-slate-400 block">
                      Local device file upload directly to Supabase: CHS-Storage/inspections/
                    </span>
                  </div>
                </div>
              </div>

              {/* Template Scope Toggle */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 block text-xs">Scope of Application:</span>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={applyChecklistToAllDays}
                    onChange={(e) => setApplyChecklistToAllDays(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-700 focus:ring-teal-500"
                  />
                  <span>Apply changes to all 31 days (Daily Inspection Template)</span>
                </label>
                <p className="text-[11px] text-slate-500 pl-6">
                  {applyChecklistToAllDays
                    ? 'This checklist checkpoint will be added / updated across all 31 days of the month and persisted in Supabase.'
                    : `Only applies to Day ${selectedInspectionDay}. Other days will remain unchanged.`}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowChecklistModal(false);
                    setEditingChecklistItem(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {editingChecklistItem ? 'Save Checklist Changes' : 'Add to Inspection Checklist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHECKLIST ITEM DELETION CONFIRMATION MODAL */}
      {checklistItemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 my-auto">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 text-red-700 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Delete Checklist Checkpoint?</h3>
                <p className="text-xs text-slate-500">Item #{checklistItemToDelete.id}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <span className="font-semibold block text-slate-900">{checklistItemToDelete.activity}</span>
              <span className="text-[11px] text-slate-500 block uppercase font-bold">{checklistItemToDelete.category}</span>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-red-900">
                <input
                  type="checkbox"
                  checked={deleteItemFromAllDays}
                  onChange={(e) => setDeleteItemFromAllDays(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                />
                <span>Delete from all 31 days (Monthly template)</span>
              </label>
              <p className="text-[11px] text-red-700 pl-6">
                {deleteItemFromAllDays
                  ? 'This checkpoint will be removed from all 31 days permanently and synced to Supabase.'
                  : `Only removes this checkpoint from Day ${selectedInspectionDay}.`}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setChecklistItemToDelete(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteChecklistItem}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAFF DELETION CONFIRMATION MODAL */}
      {staffToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 my-auto">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 text-red-700 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Remove Staff Member?</h3>
                <p className="text-xs text-slate-500">Personnel #{staffToDelete.srNo}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to remove <strong>{staffToDelete.name}</strong> ({staffToDelete.role} - {staffToDelete.team}) from the active staff roster?
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              This record will be removed from the master roster and deleted from the Supabase staff database.
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setStaffToDelete(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteStaffMember}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Remove Staff Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN PRINTABLE CONTAINER FOR html2canvas & jsPDF REPORT EXPORT */}
      <div
        id="printable-inspection-report"
        style={{
          display: 'none',
          width: '800px',
          padding: '36px',
          backgroundColor: '#FFFFFF',
          color: '#0F172A',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ borderBottom: '3px solid #0F766E', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
              {societyDetails.name}
            </h1>
            <p style={{ fontSize: '11px', color: '#0F766E', fontWeight: '700', margin: '4px 0 0 0' }}>
              Registration: {societyDetails.societyRegNo} | MahaRERA: {societyDetails.reraRegNo || 'P52100008192'}
            </p>
            <p style={{ fontSize: '10px', color: '#64748B', margin: '2px 0 0 0' }}>
              {societyDetails.fullAddress}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'inline-block', backgroundColor: '#F0FDFA', color: '#0F766E', border: '1px solid #CCFBF1', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' }}>
              DAILY AUDIT INSPECTION REPORT
            </span>
            <p style={{ fontSize: '10px', color: '#64748B', margin: '6px 0 0 0' }}>
              Exported: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Audit Meta Grid */}
        <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px', marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '11px' }}>
          <div>
            <strong style={{ display: 'block', color: '#64748B', fontSize: '9px', textTransform: 'uppercase' }}>Inspection Day</strong>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>Day {currentReport.day} ({currentReport.date})</span>
          </div>
          <div>
            <strong style={{ display: 'block', color: '#64748B', fontSize: '9px', textTransform: 'uppercase' }}>Facility Supervisor</strong>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>{currentReport.supervisorName || 'Parvez (Facility Supervisor)'}</span>
          </div>
          <div>
            <strong style={{ display: 'block', color: '#64748B', fontSize: '9px', textTransform: 'uppercase' }}>Submission Status</strong>
            <span style={{ fontSize: '12px', fontWeight: '700', color: currentReport.isSubmitted ? '#0F766E' : '#D97706' }}>
              {currentReport.isSubmitted ? 'Submitted to Admin' : 'Daily Draft / In Progress'}
            </span>
          </div>
          <div>
            <strong style={{ display: 'block', color: '#64748B', fontSize: '9px', textTransform: 'uppercase' }}>Managing Committee Signoff</strong>
            <span style={{ fontSize: '12px', fontWeight: '700', color: currentReport.isVerified ? '#16A34A' : '#64748B' }}>
              {currentReport.isVerified ? `Verified: ${currentReport.verifiedByAdmin}` : 'Pending Verification'}
            </span>
          </div>
        </div>

        {/* Checklist Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>
              <th style={{ padding: '8px 6px', textAlign: 'center', width: '30px' }}>#</th>
              <th style={{ padding: '8px 8px', textAlign: 'left' }}>Inspection Activity / Checkpoint</th>
              <th style={{ padding: '8px 8px', textAlign: 'left', width: '140px' }}>Category</th>
              <th style={{ padding: '8px 8px', textAlign: 'left', width: '100px' }}>Status</th>
              <th style={{ padding: '8px 8px', textAlign: 'left', width: '180px' }}>Remarks / Defect Notes</th>
            </tr>
          </thead>
          <tbody>
            {(currentReport.items || []).map((item, idx) => {
              const isIssue =
                item.status === 'Action Required' ||
                item.status === 'Not Working' ||
                item.status === 'Bulbs Blown / Replaced' ||
                item.status === 'Blurry / Adjust Lens';
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                  <td style={{ padding: '6px', textAlign: 'center', fontWeight: 'bold', color: '#64748B' }}>{item.id}</td>
                  <td style={{ padding: '6px 8px', fontWeight: '600', color: '#0F172A' }}>{item.activity}</td>
                  <td style={{ padding: '6px 8px', color: '#0F766E', fontSize: '9px', fontWeight: '700' }}>{item.category}</td>
                  <td style={{ padding: '6px 8px', fontWeight: '700', color: isIssue ? '#DC2626' : '#16A34A' }}>
                    {item.status}
                  </td>
                  <td style={{ padding: '6px 8px', color: '#475569' }}>{item.remarks || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Attached Site Photos in PDF Report */}
        {daySitePhotos[selectedInspectionDay] && daySitePhotos[selectedInspectionDay].length > 0 && (
          <div style={{ marginTop: '16px', borderTop: '2px dashed #CBD5E1', paddingTop: '14px', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A', margin: '0 0 10px 0' }}>
              Attached Site Inspection Media & Photo Evidence (Day {selectedInspectionDay})
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {daySitePhotos[selectedInspectionDay].map((url, i) => (
                <div key={i} style={{ border: '1px solid #CBD5E1', borderRadius: '6px', overflow: 'hidden', width: '130px', height: '90px' }}>
                  <img src={url} alt={`Site evidence ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signatures & Disclaimers */}
        <div style={{ borderTop: '2px solid #CBD5E1', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748B' }}>
          <div>
            <p style={{ margin: 0, fontWeight: '700', color: '#0F172A' }}>Inspector: Parvez (Facility Supervisor)</p>
            <p style={{ margin: '2px 0 0 0' }}>Kool Homes Solitaire CHS Estate Operations Unit</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontWeight: '700', color: '#0F172A' }}>Signed: {currentReport.verifiedByAdmin || 'Managing Committee Office'}</p>
            <p style={{ margin: '2px 0 0 0' }}>Stored in Supabase CHS-Storage: reports/archive</p>
          </div>
        </div>
      </div>
    </div>
  );
};
