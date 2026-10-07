import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  UserRole,
  AmenityBooking,
  ComplaintTicket,
  TenantApplication,
  WaterTankerLog,
  TankCleaningRecord,
  DGRunLog,
  AMCContract,
  SocietyNotice,
  ParkingSlot,
  StaffMember,
  DailyInspectionReport,
  AttendanceCode,
  InspectionItem,
  MemberProfile,
  Vendor,
  VendorQuote,
  WorkOrder,
  WorkOrderPayment,
  VehicleRecord,
  VisitorParkingPass,
  SocietyDocument,
  ApprovalAuditEntry,
  CommunityPoll,
  SocietyProfileDetails,
  ROLE_LABELS,
  EmergencyContact,
  SocietyGalleryItem,
  MaintenanceLedgerEntry,
  getUserRoles,
  hasRole,
  hasAnyRole,
  BuildingConfig,
  SocietyCustomizationConfig,
  generateFlatsForBuildings,
  ALL_SOCIETY_FLATS,
} from '../types';
import {
  INITIAL_NOTICES,
  INITIAL_COMPLAINTS,
  INITIAL_BOOKINGS,
  INITIAL_TENANTS,
  INITIAL_TANKERS,
  INITIAL_TANK_CLEANING,
  INITIAL_DG_LOGS,
  INITIAL_AMCS,
  INITIAL_PARKING,
  MASTER_STAFF_DIRECTORY,
  INITIAL_INSPECTIONS,
  INITIAL_ATTENDANCE_MATRIX,
  DEFAULT_33_ACTIVITIES,
  DEFAULT_MANAGED_SOCIETIES,
  DEFAULT_SOCIETY_PROFILE,
  LOCAL_LOGIN_CREDENTIALS,
  OFFICIAL_LOCAL_USERS,
  INITIAL_PROFILES,
  INITIAL_VENDORS,
  INITIAL_VENDOR_QUOTES,
  INITIAL_WORK_ORDERS,
  INITIAL_VEHICLES,
  INITIAL_DOCUMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_VISITOR_PASSES,
  INITIAL_POLLS,
  INITIAL_EMERGENCY_CONTACTS,
  INITIAL_GALLERY_ITEMS,
  INITIAL_MAINTENANCE_LEDGER,
} from '../data/initialData';
import {
  supabase,
  isSupabaseConfigured,
  mapMemberRowToProfile,
  mapProfileToMemberRow,
  mapVehicleRowToRecord,
  mapRecordToVehicleRow,
  mapWorkOrderRowToModel,
  mapQuoteRowToModel,
  mapEmergencyContactRowToModel,
  mapEmergencyContactModelToRow,
  mapGalleryRowToModel,
  mapGalleryModelToRow,
  uploadToCHSStorage,
} from '../lib/supabase';
import {
  fetchStaffDirectory,
  saveStaffMemberToDb,
  deleteStaffMemberFromDb,
  saveInspection as saveInspectionToDb,
} from '../services/supervisorService';

interface SocietyContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isAuthenticated: boolean;
  isPendingApproval: boolean;
  isRejected: boolean;
  loginAsRole: (role: UserRole, profileId?: string) => void;
  logout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notices: SocietyNotice[];
  complaints: ComplaintTicket[];
  bookings: AmenityBooking[];
  tenants: TenantApplication[];
  tankers: WaterTankerLog[];
  tankCleanings: TankCleaningRecord[];
  dgLogs: DGRunLog[];
  amcs: AMCContract[];
  parkings: ParkingSlot[];
  staffList: StaffMember[];
  inspections: DailyInspectionReport[];
  attendance: Record<number, Record<number, AttendanceCode>>;
  selectedInspectionDay: number;
  setSelectedInspectionDay: (day: number) => void;
  syncInspectionReport: (report: DailyInspectionReport) => void;
  syncDayAttendance: (day: number, records: Record<number, AttendanceCode>) => void;
  updateInspectionItem: (day: number, itemId: number, status: string, remarks?: string, photoUrl?: string) => void;
  addInspectionSitePhoto: (day: number, photoUrl: string) => void;
  removeInspectionSitePhoto: (day: number, photoUrl: string) => void;
  setInspectionReportPdfUrl: (day: number, pdfUrl: string) => void;
  uploadFileToStorage: (
    file: File | Blob,
    folder: 'avatars' | 'inspections' | 'reports',
    customName?: string
  ) => Promise<{ success: boolean; publicUrl: string; error?: string }>;
  addInspectionItem: (
    day: number,
    itemData: { category: any; activity: string; status?: string; remarks?: string; photoUrl?: string },
    applyToAllDays?: boolean
  ) => void;
  editInspectionItem: (
    day: number,
    itemId: number,
    updates: { category?: any; activity?: string; status?: string; remarks?: string; photoUrl?: string },
    applyToAllDays?: boolean
  ) => void;
  removeInspectionItem: (day: number, itemId: number, applyToAllDays?: boolean) => void;
  submitInspection: (day: number) => void;
  verifyInspection: (day: number, verifiedByAdmin: string, adminComments: string) => void;
  updateAttendance: (staffSrNo: number, day: number, code: AttendanceCode) => void;
  bulkMarkAttendance: (day: number, code: AttendanceCode) => void;
  escalateChecklistToTicket: (itemId: number, activity: string, remarks: string) => string;
  addComplaint: (ticket: Omit<ComplaintTicket, 'id' | 'createdAt' | 'status'>) => string;
  updateComplaintStatus: (id: string, status: ComplaintTicket['status'], resolutionNotes?: string, assignedVendor?: string) => void;
  addBooking: (booking: Omit<AmenityBooking, 'id' | 'bookingDate' | 'status'>) => string;
  cancelBooking: (id: string) => void;
  addTenantApplication: (app: Omit<TenantApplication, 'id' | 'dateSubmitted' | 'policeVerificationStatus' | 'nocStatus'>) => string;
  updateTenantStatus: (id: string, nocStatus: TenantApplication['nocStatus'], policeStatus?: TenantApplication['policeVerificationStatus']) => void;
  addTankerLog: (tanker: Omit<WaterTankerLog, 'id' | 'status'>) => void;
  isEmergencyOpen: boolean;
  setIsEmergencyOpen: (open: boolean) => void;
  emergencyContacts: EmergencyContact[];
  fetchEmergencyContacts: () => Promise<void>;
  addEmergencyContact: (contact: Omit<EmergencyContact, 'id' | 'createdAt'>) => Promise<string>;
  updateEmergencyContact: (id: string, updates: Partial<EmergencyContact>) => Promise<void>;
  deleteEmergencyContact: (id: string) => Promise<void>;
  // Society Photo Gallery
  galleryItems: SocietyGalleryItem[];
  fetchGalleryItems: () => Promise<void>;
  addGalleryItem: (item: Omit<SocietyGalleryItem, 'id' | 'createdAt'>) => Promise<string>;
  updateGalleryItem: (id: string, updates: Partial<SocietyGalleryItem>) => Promise<void>;
  deleteGalleryItem: (id: string) => Promise<void>;
  isBookingModalOpen: boolean;
  setIsBookingModalOpen: (open: boolean) => void;
  isAiModalOpen: boolean;
  setIsAiModalOpen: (open: boolean) => void;
  initialAiPrompt: string;
  openAiWithPrompt: (prompt?: string) => void;
  targetAmenity: 'pool' | 'gym' | 'clubhouse' | 'play_area';
  setTargetAmenity: (amenity: 'pool' | 'gym' | 'clubhouse' | 'play_area') => void;
  userFlat: string;
  setUserFlat: (flat: string) => void;
  userName: string;
  setUserName: (name: string) => void;
  currentMemberId: string;
  // Profiles, Dual User Per Flat & Multi-Role Approval Engine
  profiles: MemberProfile[];
  currentProfile?: MemberProfile;
  currentUserRoles: string[];
  hasRole: (targetRole: string) => boolean;
  hasAnyRole: (targetRoles: string[]) => boolean;
  registerMember: (data: {
    name: string;
    email: string;
    phone: string;
    avatarUrl?: string;
    tower: 'Tower A' | 'Tower B' | 'Tower C';
    flatNo: string;
    ownershipType: 'Owner' | 'Tenant';
  }) => Promise<{ success: boolean; error?: string; memberId?: string }> | { success: boolean; error?: string; memberId?: string };
  addMemberProfile: (profile: Omit<MemberProfile, 'id' | 'memberId' | 'isApproved' | 'status' | 'registeredDate'>) => string;
  updateMemberProfile: (id: string, updates: Partial<MemberProfile>) => void;
  approveMemberProfile: (id: string, isApproved: boolean, remarks?: string) => void;
  updateUserRole: (id: string, newRole: UserRole, newRoles?: string[]) => void;
  updateUserRoles: (id: string, newRoles: string[]) => void;
  deleteMemberProfile: (id: string) => void;
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; message: string; error?: string }>;
  adminResetPassword: (userId: string, newPassword?: string) => Promise<{ success: boolean; message: string; error?: string }>;
  // Staff Operational Management
  addStaffMember: (staff: Omit<StaffMember, 'srNo'>) => void;
  updateStaffMember: (srNo: number, updates: Partial<StaffMember>) => void;
  deleteStaffMember: (srNo: number) => void;
  // Maintenance & Dues Tracker
  maintenanceRecords: MaintenanceLedgerEntry[];
  updateMaintenanceStatus: (id: string, status: 'Paid' | 'Unpaid' | 'Overdue', details?: Partial<MaintenanceLedgerEntry>) => void;
  recordMaintenancePayment: (flatNo: string, cycle: string, paymentData: { amount: number; mode: 'UPI' | 'NEFT / RTGS' | 'Cheque' | 'Cash'; utrNumber: string; receiptUrl?: string; notes?: string }) => void;
  sendMaintenanceReminder: (flatNos: string[], cycle: string, customMessage?: string) => { count: number; message: string };
  auditLogs: ApprovalAuditEntry[];
  // Vehicles & Parking
  vehicles: VehicleRecord[];
  visitorPasses: VisitorParkingPass[];
  addVehicle: (vehicle: Omit<VehicleRecord, 'id' | 'registeredDate'>) => string;
  updateVehicle: (id: string, vehicle: Partial<VehicleRecord>) => void;
  deleteVehicle: (id: string) => void;
  bulkImportVehicles: (records: Omit<VehicleRecord, 'id' | 'registeredDate'>[]) => number;
  issueVisitorPass: (pass: Omit<VisitorParkingPass, 'id' | 'status'>) => string;
  updateVisitorPassStatus: (id: string, status: VisitorParkingPass['status']) => void;
  // Documents
  documents: SocietyDocument[];
  addDocument: (doc: Omit<SocietyDocument, 'id' | 'uploadedAt'>) => string;
  deleteDocument: (id: string) => void;
  // Vendors, Quotes & Work Orders
  vendors: Vendor[];
  quotes: VendorQuote[];
  workOrders: WorkOrder[];
  onboardVendor: (vendor: Omit<Vendor, 'id' | 'rating' | 'registeredDate'>) => string;
  updateVendor: (id: string, updates: Partial<Vendor>) => void;
  deleteVendor: (id: string) => void;
  addVendorQuote: (quote: Omit<VendorQuote, 'id' | 'submittedDate' | 'status'>) => string;
  updateVendorQuote: (id: string, updates: Partial<VendorQuote>) => void;
  deleteVendorQuote: (id: string) => void;
  approveQuoteAndReleaseWorkOrder: (quoteId: string, startDate?: string, targetCompletionDate?: string, customTerms?: string[]) => string;
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void;
  deleteWorkOrder: (id: string) => void;
  approveWorkOrder: (workOrderId: string, secretaryComments: string) => void;
  requestWorkOrderChanges: (workOrderId: string, secretaryComments: string) => void;
  updateWorkOrderProgress: (workOrderId: string, progress: number, workStatus?: WorkOrder['workStatus']) => void;
  addWorkOrderPayment: (workOrderId: string, payment: Omit<WorkOrderPayment, 'id' | 'workOrderId'>) => string;
  defaultTermsAndConditions: string[];
  updateDefaultTermsAndConditions: (terms: string[]) => void;
  resetDefaultTermsAndConditions: () => void;
  // Admin Data Overrides
  adminUpdateTicket: (id: string, data: Partial<ComplaintTicket>) => void;
  adminUpdateBooking: (id: string, data: Partial<AmenityBooking>) => void;
  adminUpdateTenantApp: (id: string, data: Partial<TenantApplication>) => void;
  filterOnlyMyFilings: boolean;
  setFilterOnlyMyFilings: (filter: boolean) => void;
  // Community Polls & D3 Real-Time Voting Engine
  polls: CommunityPoll[];
  castVote: (pollId: string, optionId: string) => { success: boolean; message: string };
  createPoll: (poll: Omit<CommunityPoll, 'id' | 'totalVotes' | 'votedFlats' | 'userVotes'>) => string;
  closePoll: (pollId: string, resolutionSummary: string) => void;
  // Society Master Profile & Details
  societyDetails: SocietyProfileDetails;
  updateSocietyDetails: (updates: Partial<SocietyProfileDetails>) => void;
  isSocietySettingsModalOpen: boolean;
  setIsSocietySettingsModalOpen: (open: boolean) => void;
  openSocietySettingsModal: () => void;
  closeSocietySettingsModal: () => void;
  // Commercial Multi-Society Architecture
  managedSocieties: SocietyCustomizationConfig[];
  activeSociety: SocietyCustomizationConfig;
  activeFlats: string[];
  switchSociety: (societyId: string) => void;
  updateActiveSocietyConfig: (updates: Partial<SocietyCustomizationConfig>) => void;
  addManagedSociety: (newSoc: SocietyCustomizationConfig) => void;
  deleteManagedSociety: (societyId: string) => void;
  exportSocietyConfigJson: () => string;
  importSocietyConfigJson: (jsonStr: string) => boolean;
  currencySymbol: string;
  // Supabase Auth and Persistence additions
  supabaseUser: SupabaseUser | null;
  isSupabaseOnline: boolean;
  authLoading: boolean;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  loginModalTab: 'login' | 'register';
  setLoginModalTab: (tab: 'login' | 'register') => void;
  openLoginModal: (tab?: 'login' | 'register') => void;
  closeLoginModal: () => void;
  signInWithSupabase: (emailOrFlat: string, password?: string) => Promise<{ success: boolean; error?: string; role?: UserRole; isPending?: boolean }>;
  signUpWithSupabase: (params: {
    email: string;
    password: string;
    name: string;
    phone: string;
    avatarUrl?: string;
    tower: 'Tower A' | 'Tower B' | 'Tower C';
    flatNo: string;
    ownershipType: 'Owner' | 'Tenant';
  }) => Promise<{ success: boolean; error?: string; memberId?: string }>;
  signOutWithSupabase: () => Promise<void>;
}

const SocietyContext = createContext<SocietyContextType | undefined>(undefined);

export const SocietyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Supabase Auth and Network Status state
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isSupabaseOnline, setIsSupabaseOnline] = useState<boolean>(isSupabaseConfigured);

  // Profiles state with localStorage cache and guaranteed official local users fallback
  const [profiles, setProfiles] = useState<MemberProfile[]>(() => {
    let list: MemberProfile[] = [];
    try {
      const saved = localStorage.getItem('solitaire_profiles_v6') || localStorage.getItem('solitaire_profiles_v4');
      if (saved) list = JSON.parse(saved);
      else list = INITIAL_PROFILES;
    } catch {
      list = INITIAL_PROFILES;
    }

    // Always guarantee that OFFICIAL_LOCAL_USERS exist with latest verified credentials
    const merged = [...OFFICIAL_LOCAL_USERS];
    list.forEach((p) => {
      const isOfficial = merged.some(
        (m) =>
          m.id === p.id ||
          m.email.toLowerCase().trim() === (p.email || '').toLowerCase().trim() ||
          m.flatNo.toUpperCase().trim() === (p.flatNo || '').toUpperCase().trim()
      );
      if (!isOfficial) {
        merged.push(p);
      }
    });
    return merged;
  });

  useEffect(() => {
    localStorage.setItem('solitaire_profiles_v6', JSON.stringify(profiles));
  }, [profiles]);

  // Society Master Profile & Settings state (fully editable by Admin / Secretary)
  const [societyDetails, setSocietyDetails] = useState<SocietyProfileDetails>(() => {
    try {
      const saved = localStorage.getItem('solitaire_society_details_v5');
      if (saved) return { ...DEFAULT_SOCIETY_PROFILE, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SOCIETY_PROFILE;
  });

  useEffect(() => {
    localStorage.setItem('solitaire_society_details_v5', JSON.stringify(societyDetails));
  }, [societyDetails]);

  const [isSocietySettingsModalOpen, setIsSocietySettingsModalOpen] = useState<boolean>(false);

  const openSocietySettingsModal = useCallback(() => {
    setIsSocietySettingsModalOpen(true);
  }, []);

  const closeSocietySettingsModal = useCallback(() => {
    setIsSocietySettingsModalOpen(false);
  }, []);

  const updateSocietyDetails = useCallback((updates: Partial<SocietyProfileDetails>) => {
    setSocietyDetails((prev) => {
      const updated = { ...prev, ...updates };
      const line = updates.addressLine ?? prev.addressLine;
      const landmark = updates.landmark ?? prev.landmark;
      const city = updates.city ?? prev.city;
      const state = updates.state ?? prev.state;
      const pincode = updates.pincode ?? prev.pincode;
      updated.fullAddress = `${line}, ${city}, ${state} ${pincode}${landmark ? ` (${landmark})` : ''}`;
      return updated;
    });

    const today = new Date().toISOString().split('T')[0];
    const timeStr = `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const auditEntry: ApprovalAuditEntry = {
      id: `AUD-${Date.now()}`,
      userId: 'usr-003',
      userName: 'Estate Administrator',
      flatNo: 'A-602',
      action: 'Role Changed',
      performedBy: 'Estate Administrator',
      performedByRole: 'admin',
      timestamp: timeStr,
      details: `Society master profile fields modified: ${Object.keys(updates).join(', ')}`,
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
  }, []);

  // Commercial Multi-Society SaaS Suite State
  const [managedSocieties, setManagedSocieties] = useState<SocietyCustomizationConfig[]>(() => {
    try {
      const saved = localStorage.getItem('solitaire_managed_societies_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_MANAGED_SOCIETIES;
  });

  const [activeSocietyId, setActiveSocietyId] = useState<string>(() => {
    return localStorage.getItem('solitaire_active_society_id') || 'soc-solitaire';
  });

  useEffect(() => {
    localStorage.setItem('solitaire_managed_societies_v2', JSON.stringify(managedSocieties));
  }, [managedSocieties]);

  useEffect(() => {
    localStorage.setItem('solitaire_active_society_id', activeSocietyId);
  }, [activeSocietyId]);

  const activeSociety = useMemo(() => {
    return managedSocieties.find((s) => s.id === activeSocietyId) || managedSocieties[0] || DEFAULT_MANAGED_SOCIETIES[0];
  }, [managedSocieties, activeSocietyId]);

  const activeFlats = useMemo(() => {
    return generateFlatsForBuildings(activeSociety.buildings);
  }, [activeSociety.buildings]);

  const currencySymbol = activeSociety.currencySymbol || '₹';

  const switchSociety = useCallback((societyId: string) => {
    const target = managedSocieties.find((s) => s.id === societyId);
    if (!target) return;
    setActiveSocietyId(societyId);
    setSocietyDetails((prev) => ({
      ...prev,
      name: target.name,
      societyRegNo: target.societyRegNo,
      reraRegNo: target.reraRegNo || prev.reraRegNo,
      act: target.act,
      addressLine: target.addressLine,
      landmark: target.landmark || prev.landmark,
      subLocality: target.subLocality,
      city: target.city,
      state: target.state,
      pincode: target.pincode,
      fullAddress: target.fullAddress,
      totalUnits: target.totalUnits,
      activeTowers: target.buildings.map((b) => b.name),
      bankName: target.bankName,
      bankAccountNo: target.bankAccountNo,
      bankIFSC: target.bankIFSC,
      maintenancePerSqFt: target.maintenancePerSqFt,
      officialEmail: target.officialEmail,
      securityGatePhone: target.securityGatePhone,
      estateOfficePhone: target.estateOfficePhone,
      logoUrl: target.logoUrl || prev.logoUrl,
    }));
  }, [managedSocieties]);

  const updateActiveSocietyConfig = useCallback((updates: Partial<SocietyCustomizationConfig>) => {
    setManagedSocieties((prev) =>
      prev.map((soc) => {
        if (soc.id !== activeSocietyId) return soc;
        const updated = { ...soc, ...updates };
        if (updates.buildings) {
          updated.totalUnits = updates.buildings.reduce(
            (acc, b) => acc + (b.totalFlats || b.floors * b.flatsPerFloor),
            0
          );
        }
        return updated;
      })
    );
    setSocietyDetails((prev) => ({
      ...prev,
      name: updates.name ?? prev.name,
      societyRegNo: updates.societyRegNo ?? prev.societyRegNo,
      reraRegNo: updates.reraRegNo ?? prev.reraRegNo,
      act: updates.act ?? prev.act,
      addressLine: updates.addressLine ?? prev.addressLine,
      city: updates.city ?? prev.city,
      state: updates.state ?? prev.state,
      pincode: updates.pincode ?? prev.pincode,
      fullAddress: updates.fullAddress ?? prev.fullAddress,
      bankName: updates.bankName ?? prev.bankName,
      bankAccountNo: updates.bankAccountNo ?? prev.bankAccountNo,
      bankIFSC: updates.bankIFSC ?? prev.bankIFSC,
      maintenancePerSqFt: updates.maintenancePerSqFt ?? prev.maintenancePerSqFt,
      officialEmail: updates.officialEmail ?? prev.officialEmail,
      securityGatePhone: updates.securityGatePhone ?? prev.securityGatePhone,
      estateOfficePhone: updates.estateOfficePhone ?? prev.estateOfficePhone,
      logoUrl: updates.logoUrl ?? prev.logoUrl,
    }));
  }, [activeSocietyId]);

  const addManagedSociety = useCallback((newSoc: SocietyCustomizationConfig) => {
    setManagedSocieties((prev) => [...prev, newSoc]);
    setActiveSocietyId(newSoc.id);
  }, []);

  const deleteManagedSociety = useCallback((societyId: string) => {
    setManagedSocieties((prev) => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter((s) => s.id !== societyId);
      if (activeSocietyId === societyId) {
        setActiveSocietyId(filtered[0].id);
      }
      return filtered;
    });
  }, [activeSocietyId]);

  const exportSocietyConfigJson = useCallback((): string => {
    return JSON.stringify(activeSociety, null, 2);
  }, [activeSociety]);

  const importSocietyConfigJson = useCallback((jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.name || !parsed.id) return false;
      setManagedSocieties((prev) => {
        const existingIdx = prev.findIndex((s) => s.id === parsed.id);
        if (existingIdx >= 0) {
          const clone = [...prev];
          clone[existingIdx] = parsed;
          return clone;
        }
        return [...prev, parsed];
      });
      setActiveSocietyId(parsed.id);
      return true;
    } catch {
      return false;
    }
  }, [activeSociety]);

  // Current session & active profile ID
  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    return localStorage.getItem('solitaire_active_profile_id') || 'usr-001';
  });

  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem('solitaire_role');
    if (saved === 'resident' || saved === 'supervisor' || saved === 'mc_member' || saved === 'admin' || saved === 'secretary' || saved === 'tenant') {
      return saved as UserRole;
    }
    if (saved === 'member') return 'resident';
    return 'public';
  });

  const currentProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];

  const isAuthenticated = role !== 'public';
  const isRejected = Boolean(currentProfile && currentProfile.status === 'Rejected' && (role === 'resident' || role === 'tenant'));
  const isPendingApproval = Boolean(
    currentProfile &&
      (currentProfile.status === 'Pending Approval' || (!currentProfile.isApproved && currentProfile.status !== 'Rejected')) &&
      (role === 'resident' || role === 'tenant')
  );

  const currentUserRoles = getUserRoles(currentProfile, role);

  const checkHasRole = useCallback((targetRole: string) => {
    return hasRole(currentProfile, targetRole, role);
  }, [currentProfile, role]);

  const checkHasAnyRole = useCallback((targetRoles: string[]) => {
    return hasAnyRole(currentProfile, targetRoles, role);
  }, [currentProfile, role]);

  const [activeTab, setActiveTabState] = useState<string>('home');
  const [isEmergencyOpen, setIsEmergencyOpen] = useState<boolean>(false);

  // Dynamic Emergency Contacts State (with localStorage cache & Supabase sync)
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(() => {
    try {
      const saved = localStorage.getItem('solitaire_emergency_contacts_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_EMERGENCY_CONTACTS;
  });

  // Society Photo Gallery State (Public vs Private)
  const [galleryItems, setGalleryItems] = useState<SocietyGalleryItem[]>(() => {
    try {
      const saved = localStorage.getItem('solitaire_gallery_items_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_GALLERY_ITEMS;
  });
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [initialAiPrompt, setInitialAiPrompt] = useState<string>('');
  const [targetAmenity, setTargetAmenity] = useState<'pool' | 'gym' | 'clubhouse' | 'play_area'>('pool');

  // Centralized Portal Login & Registration Modal State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginModalTab, setLoginModalTab] = useState<'login' | 'register'>('login');

  const openLoginModal = useCallback((tab: 'login' | 'register' = 'login') => {
    setLoginModalTab(tab);
    setIsLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
  }, []);

  const [userFlat, setUserFlat] = useState<string>(() => currentProfile?.flatNo || 'A-402');
  const [userName, setUserName] = useState<string>(() => currentProfile?.name || 'Resident Member');
  const [currentMemberId, setCurrentMemberId] = useState<string>(() => currentProfile?.memberId || 'SOL-A-402');

  const [filterOnlyMyFilings, setFilterOnlyMyFilings] = useState<boolean>(true);

  // Sync user info when profile or role changes
  const loginAsRole = useCallback((newRole: UserRole, profileId?: string) => {
    const normalizedRole: UserRole = newRole === 'member' ? 'resident' : newRole;

    setRoleState(normalizedRole);
    localStorage.setItem('solitaire_role', normalizedRole);

    if (normalizedRole === 'public') {
      setUserFlat('Public Visitor');
      setUserName('Visitor / Guest');
      setCurrentMemberId('SOL-PUBLIC');
      setActiveTabState('home');
      return;
    }

    let targetProfile = profileId
      ? profiles.find((p) => p.id === profileId) || OFFICIAL_LOCAL_USERS.find((p) => p.id === profileId)
      : undefined;

    if (!targetProfile) {
      if (normalizedRole === 'secretary') {
        targetProfile = profiles.find((p) => p.role === 'secretary' || p.roles?.includes('secretary')) ||
          OFFICIAL_LOCAL_USERS.find((p) => p.role === 'secretary' || p.roles?.includes('secretary'));
      } else if (normalizedRole === 'tenant') {
        targetProfile = profiles.find((p) => p.role === 'tenant' || p.ownershipType === 'Tenant') ||
          OFFICIAL_LOCAL_USERS.find((p) => p.role === 'tenant');
      } else if (normalizedRole === 'resident') {
        targetProfile = profiles.find((p) => (p.role === 'resident' || p.role === 'member') && p.ownershipType === 'Owner') ||
          OFFICIAL_LOCAL_USERS.find((p) => p.role === 'resident');
      } else if (normalizedRole === 'supervisor') {
        targetProfile = OFFICIAL_LOCAL_USERS.find((p) => p.role === 'supervisor') ||
          profiles.find((p) => p.role === 'supervisor');
      } else if (normalizedRole === 'mc_member') {
        targetProfile = OFFICIAL_LOCAL_USERS.find((p) => p.role === 'mc_member') ||
          profiles.find((p) => p.role === 'mc_member' || p.roles?.includes('mc_member'));
      } else if (normalizedRole === 'admin') {
        targetProfile = OFFICIAL_LOCAL_USERS.find((p) => p.role === 'admin') ||
          profiles.find((p) => p.role === 'admin');
      }
    }

    if (targetProfile) {
      setActiveProfileId(targetProfile.id);
      localStorage.setItem('solitaire_active_profile_id', targetProfile.id);
      setUserFlat(targetProfile.flatNo);
      setUserName(targetProfile.name);
      setCurrentMemberId(targetProfile.memberId);
    } else {
      if (normalizedRole === 'secretary') {
        setUserFlat('B-801');
        setUserName('Pooja Hegde-Patil (Secretary)');
        setCurrentMemberId('SOL-B-801');
      } else if (normalizedRole === 'tenant') {
        setUserFlat('A-402');
        setUserName('Amit Varma (Tenant)');
        setCurrentMemberId('SOL-A-402-T');
      } else if (normalizedRole === 'resident') {
        setUserFlat('A-402');
        setUserName('Rajesh Sharma');
        setCurrentMemberId('SOL-A-402');
      } else if (normalizedRole === 'supervisor') {
        setUserFlat('A-101');
        setUserName('Facility Supervisor (Parvez Khan)');
        setCurrentMemberId('SOL-SUP-01');
      } else if (normalizedRole === 'mc_member') {
        setUserFlat('B-801');
        setUserName('MC Member');
        setCurrentMemberId('SOL-B-801');
      } else if (normalizedRole === 'admin') {
        setUserFlat('A-1202');
        setUserName('Estate Administrator');
        setCurrentMemberId('SOL-ADM-01');
      }
    }
  }, [profiles]);

  const logout = useCallback(() => {
    if (isSupabaseConfigured) {
      supabase.auth.signOut().catch((err) => console.warn('Supabase signOut error:', err));
    }
    setSupabaseUser(null);
    setRoleState('public');
    localStorage.setItem('solitaire_role', 'public');
    setUserFlat('Public Visitor');
    setUserName('Visitor / Guest');
    setCurrentMemberId('SOL-PUBLIC');
    setActiveTabState('home');
  }, []);

  const setRole = (newRole: UserRole) => {
    loginAsRole(newRole);
  };

  // Vehicles state with localStorage fallback
  const [vehicles, setVehicles] = useState<VehicleRecord[]>(() => {
    const saved = localStorage.getItem('solitaire_vehicles');
    return saved ? JSON.parse(saved) : INITIAL_VEHICLES;
  });

  useEffect(() => {
    localStorage.setItem('solitaire_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  // Visitor passes state with localStorage
  const [visitorPasses, setVisitorPasses] = useState<VisitorParkingPass[]>(() => {
    const saved = localStorage.getItem('solitaire_visitor_passes');
    return saved ? JSON.parse(saved) : INITIAL_VISITOR_PASSES;
  });

  useEffect(() => {
    localStorage.setItem('solitaire_visitor_passes', JSON.stringify(visitorPasses));
  }, [visitorPasses]);

  // Documents state with localStorage
  const [documents, setDocuments] = useState<SocietyDocument[]>(() => {
    const saved = localStorage.getItem('solitaire_documents');
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
  });

  useEffect(() => {
    localStorage.setItem('solitaire_documents', JSON.stringify(documents));
  }, [documents]);

  // Approval Audit Trail state with localStorage
  const [auditLogs, setAuditLogs] = useState<ApprovalAuditEntry[]>(() => {
    const saved = localStorage.getItem('solitaire_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  useEffect(() => {
    localStorage.setItem('solitaire_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Vendors & Quotes
  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const saved = localStorage.getItem('solitaire_vendors');
    return saved ? JSON.parse(saved) : INITIAL_VENDORS;
  });

  useEffect(() => {
    localStorage.setItem('solitaire_vendors', JSON.stringify(vendors));
  }, [vendors]);

  const [quotes, setQuotes] = useState<VendorQuote[]>(() => {
    const saved = localStorage.getItem('solitaire_quotes');
    return saved ? JSON.parse(saved) : INITIAL_VENDOR_QUOTES;
  });

  useEffect(() => {
    localStorage.setItem('solitaire_quotes', JSON.stringify(quotes));
  }, [quotes]);

  // Work Orders & Payment Ledger
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => {
    const saved = localStorage.getItem('solitaire_work_orders');
    if (!saved) return INITIAL_WORK_ORDERS;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((wo: any) => ({
          ...wo,
          payments: Array.isArray(wo.payments) ? wo.payments : [],
          approvalStatus: wo.approvalStatus || 'Approved',
          totalApprovedAmount: Number(wo.totalApprovedAmount || wo.approvedAmount || 0),
          progressPercent: Number(wo.progressPercent || 0),
          vendorName: wo.vendorName || 'Vendor',
          procurementTitle: wo.procurementTitle || 'Procurement Project',
          category: wo.category || 'General',
          subtotal: Number(wo.subtotal || 0),
          taxAmount: Number(wo.taxAmount || 0),
        }));
      }
      return INITIAL_WORK_ORDERS;
    } catch {
      return INITIAL_WORK_ORDERS;
    }
  });

  useEffect(() => {
    localStorage.setItem('solitaire_work_orders', JSON.stringify(workOrders));
  }, [workOrders]);

  // Default Terms & Conditions for Work Orders
  const [defaultTermsAndConditions, setDefaultTermsAndConditions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('solitaire_wo_terms');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SOCIETY_PROFILE.workOrderDefaults?.defaultTerms || [
      'Vendor must adhere to statutory safety norms & labor compliance during site execution.',
      'All materials supplied must conform to society specifications with minimum 12-month manufacturer warranty.',
      'Work must be executed strictly between 09:00 AM to 06:00 PM on weekdays to avoid resident disturbance.',
      'Defect Liability Period (DLP) of 12 months applies with 10% retention until final sign-off.',
      'Disputes subject to Pune District Co-operative Court jurisdiction under MCS Act 1960.',
    ];
  });

  const updateDefaultTermsAndConditions = (terms: string[]) => {
    setDefaultTermsAndConditions(terms);
    localStorage.setItem('solitaire_wo_terms', JSON.stringify(terms));
  };

  const resetDefaultTermsAndConditions = () => {
    const original = DEFAULT_SOCIETY_PROFILE.workOrderDefaults?.defaultTerms || [];
    setDefaultTermsAndConditions(original);
    localStorage.setItem('solitaire_wo_terms', JSON.stringify(original));
  };

  // Community Polls State with localStorage
  const [polls, setPolls] = useState<CommunityPoll[]>(() => {
    const saved = localStorage.getItem('solitaire_polls');
    if (!saved) return INITIAL_POLLS;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_POLLS;
    } catch {
      return INITIAL_POLLS;
    }
  });

  useEffect(() => {
    localStorage.setItem('solitaire_polls', JSON.stringify(polls));
  }, [polls]);

  const openAiWithPrompt = (prompt?: string) => {
    if (prompt) setInitialAiPrompt(prompt);
    setIsAiModalOpen(true);
  };

  const [selectedInspectionDay, setSelectedInspectionDay] = useState<number>(2);
  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    try {
      const saved = localStorage.getItem('solitaire_staff_list_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return MASTER_STAFF_DIRECTORY;
  });

  useEffect(() => {
    localStorage.setItem('solitaire_staff_list_v2', JSON.stringify(staffList));
  }, [staffList]);

  const addStaffMember = useCallback((staff: Omit<StaffMember, 'srNo'>) => {
    setStaffList((prev) => {
      const maxSr = prev.reduce((acc, curr) => Math.max(acc, curr.srNo), 0);
      const newStaff: StaffMember = { ...staff, srNo: maxSr + 1 };
      saveStaffMemberToDb(newStaff).catch((err) =>
        console.warn('[Supabase Operations] Error saving new staff to DB:', err)
      );
      return [...prev, newStaff];
    });
  }, []);

  const updateStaffMember = useCallback((srNo: number, updates: Partial<StaffMember>) => {
    setStaffList((prev) => {
      const updatedList = prev.map((s) => (s.srNo === srNo ? { ...s, ...updates } : s));
      const target = updatedList.find((s) => s.srNo === srNo);
      if (target) {
        saveStaffMemberToDb(target).catch((err) =>
          console.warn('[Supabase Operations] Error updating staff in DB:', err)
        );
      }
      return updatedList;
    });
  }, []);

  const deleteStaffMember = useCallback((srNo: number) => {
    setStaffList((prev) => prev.filter((s) => s.srNo !== srNo));
    deleteStaffMemberFromDb(srNo).catch((err) =>
      console.warn('[Supabase Operations] Error deleting staff from DB:', err)
    );
  }, []);

  // Maintenance & Dues state with localStorage
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceLedgerEntry[]>(() => {
    try {
      const saved = localStorage.getItem('solitaire_maintenance_ledger_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_MAINTENANCE_LEDGER;
  });

  useEffect(() => {
    localStorage.setItem('solitaire_maintenance_ledger_v2', JSON.stringify(maintenanceRecords));
  }, [maintenanceRecords]);

  const updateMaintenanceStatus = useCallback((id: string, status: 'Paid' | 'Unpaid' | 'Overdue', details?: Partial<MaintenanceLedgerEntry>) => {
    setMaintenanceRecords((prev) =>
      prev.map((rec) => (rec.id === id ? { ...rec, paymentStatus: status, ...details } : rec))
    );
  }, []);

  const recordMaintenancePayment = useCallback((
    flatNo: string,
    cycle: string,
    paymentData: { amount: number; mode: 'UPI' | 'NEFT / RTGS' | 'Cheque' | 'Cash'; utrNumber: string; receiptUrl?: string; notes?: string }
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const recId = `REC-${Date.now().toString().slice(-6)}`;
    setMaintenanceRecords((prev) => {
      const existing = prev.find((r) => r.flatNo.toUpperCase() === flatNo.toUpperCase() && r.billingCycle === cycle);
      if (existing) {
        return prev.map((r) =>
          r.id === existing.id
            ? {
                ...r,
                paymentStatus: 'Paid' as const,
                amountPaid: (r.amountPaid || 0) + paymentData.amount,
                paidDate: today,
                paymentMode: paymentData.mode,
                utrNumber: paymentData.utrNumber,
                receiptNumber: recId,
                receiptUrl: paymentData.receiptUrl,
                notes: paymentData.notes ? `${r.notes ? r.notes + ' | ' : ''}${paymentData.notes}` : r.notes,
              }
            : r
        );
      }
      return prev;
    });

    const auditEntry: ApprovalAuditEntry = {
      id: `AUD-${Date.now()}`,
      userId: activeProfileId,
      userName: userName,
      flatNo: flatNo,
      action: 'Profile Modified',
      performedBy: userName,
      performedByRole: role,
      timestamp: `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      details: `Maintenance payment of ₹${paymentData.amount.toLocaleString('en-IN')} recorded for ${flatNo} (${cycle}) via ${paymentData.mode} [UTR: ${paymentData.utrNumber}].`,
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
  }, [activeProfileId, userName, role]);

  const sendMaintenanceReminder = useCallback((flatNos: string[], cycle: string, customMessage?: string) => {
    const count = flatNos.length;
    const today = new Date().toISOString().split('T')[0];
    const auditEntry: ApprovalAuditEntry = {
      id: `AUD-${Date.now()}`,
      userId: activeProfileId,
      userName: userName,
      flatNo: 'Common Estate',
      action: 'Profile Modified',
      performedBy: userName,
      performedByRole: role,
      timestamp: `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      details: `Payment reminder issued to ${count} flat(s) for cycle ${cycle}: ${customMessage || 'Standard dues reminder dispatch.'}`,
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
    return { count, message: `Dispatched payment reminders to ${count} resident(s) for ${cycle}.` };
  }, [activeProfileId, userName, role]);

  const [inspections, setInspections] = useState<DailyInspectionReport[]>(() => {
    const saved = localStorage.getItem('solitaire_inspections');
    return saved ? JSON.parse(saved) : INITIAL_INSPECTIONS;
  });

  const [attendance, setAttendance] = useState<Record<number, Record<number, AttendanceCode>>>(() => {
    const saved = localStorage.getItem('solitaire_attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE_MATRIX;
  });

  useEffect(() => {
    localStorage.setItem('solitaire_inspections', JSON.stringify(inspections));
  }, [inspections]);

  useEffect(() => {
    localStorage.setItem('solitaire_attendance', JSON.stringify(attendance));
  }, [attendance]);

  const [notices] = useState<SocietyNotice[]>(INITIAL_NOTICES);

  const [complaints, setComplaints] = useState<ComplaintTicket[]>(() => {
    const saved = localStorage.getItem('solitaire_complaints');
    return saved ? JSON.parse(saved) : INITIAL_COMPLAINTS;
  });

  const [bookings, setBookings] = useState<AmenityBooking[]>(() => {
    const saved = localStorage.getItem('solitaire_bookings');
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
  });

  const [tenants, setTenants] = useState<TenantApplication[]>(() => {
    const saved = localStorage.getItem('solitaire_tenants');
    return saved ? JSON.parse(saved) : INITIAL_TENANTS;
  });

  const [tankers, setTankers] = useState<WaterTankerLog[]>(() => {
    const saved = localStorage.getItem('solitaire_tankers');
    return saved ? JSON.parse(saved) : INITIAL_TANKERS;
  });

  const [tankCleanings] = useState<TankCleaningRecord[]>(INITIAL_TANK_CLEANING);
  const [dgLogs] = useState<DGRunLog[]>(INITIAL_DG_LOGS);
  const [amcs] = useState<AMCContract[]>(INITIAL_AMCS);
  const [parkings] = useState<ParkingSlot[]>(INITIAL_PARKING);

  useEffect(() => {
    localStorage.setItem('solitaire_complaints', JSON.stringify(complaints));
  }, [complaints]);

  useEffect(() => {
    localStorage.setItem('solitaire_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('solitaire_tenants', JSON.stringify(tenants));
  }, [tenants]);

  useEffect(() => {
    localStorage.setItem('solitaire_tankers', JSON.stringify(tankers));
  }, [tankers]);

  // =========================================================================
  // SUPABASE DATA FETCHING & REAL-TIME REPLICATION
  // =========================================================================

  const fetchMembersFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase.from('members').select('*');
      if (!error && data && data.length > 0) {
        const mapped = data.map(mapMemberRowToProfile);
        setProfiles(mapped);
      }
    } catch (err) {
      console.warn('[Supabase] Failed to fetch members table:', err);
    }
  }, []);

  const fetchVehiclesFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase.from('vehicles').select('*');
      if (!error && data && data.length > 0) {
        const mapped = data.map(mapVehicleRowToRecord);
        setVehicles(mapped);
      }
    } catch (err) {
      console.warn('[Supabase] Failed to fetch vehicles table:', err);
    }
  }, []);

  const fetchWorkOrdersFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase.from('work_orders').select('*');
      if (!error && data && data.length > 0) {
        const mapped = data.map(mapWorkOrderRowToModel);
        setWorkOrders(mapped);
      }
    } catch (err) {
      console.warn('[Supabase] Failed to fetch work_orders table:', err);
    }
  }, []);

  const fetchProcurementFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase.from('procurement_orders').select('*');
      if (!error && data && data.length > 0) {
        const mapped = data.map(mapQuoteRowToModel);
        setQuotes(mapped);
      }
    } catch (err) {
      console.warn('[Supabase] Failed to fetch procurement_orders table:', err);
    }
  }, []);

  const fetchEmergencyContacts = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .order('display_order', { ascending: true });
      if (!error && data && data.length > 0) {
        const mapped = data.map(mapEmergencyContactRowToModel);
        setEmergencyContacts(mapped);
        localStorage.setItem('solitaire_emergency_contacts_v1', JSON.stringify(mapped));
      }
    } catch (err) {
      console.warn('[Supabase] Failed to fetch emergency_contacts table:', err);
    }
  }, []);

  const fetchGalleryItems = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('society_gallery')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const mapped = data.map(mapGalleryRowToModel);
        setGalleryItems(mapped);
        localStorage.setItem('solitaire_gallery_items_v1', JSON.stringify(mapped));
      }
    } catch (err) {
      console.warn('[Supabase] Failed to fetch society_gallery table:', err);
    }
  }, []);

  const addEmergencyContact = async (contact: Omit<EmergencyContact, 'id' | 'createdAt'>): Promise<string> => {
    const newId = `emg-${Date.now()}`;
    const newContact: EmergencyContact = {
      ...contact,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setEmergencyContacts((prev) => {
      const updated = [...prev, newContact].sort((a, b) => a.displayOrder - b.displayOrder);
      localStorage.setItem('solitaire_emergency_contacts_v1', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('emergency_contacts').insert([mapEmergencyContactModelToRow(newContact)]);
      } catch (err) {
        console.warn('[Supabase] Error inserting emergency contact:', err);
      }
    }
    return newId;
  };

  const updateEmergencyContact = async (id: string, updates: Partial<EmergencyContact>) => {
    setEmergencyContacts((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, ...updates } : c)).sort((a, b) => a.displayOrder - b.displayOrder);
      localStorage.setItem('solitaire_emergency_contacts_v1', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        const dbUpdates: any = {};
        if (updates.category !== undefined) dbUpdates.category = updates.category;
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.subtitle !== undefined) dbUpdates.subtitle = updates.subtitle;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.displayOrder !== undefined) dbUpdates.display_order = updates.displayOrder;
        await supabase.from('emergency_contacts').update(dbUpdates).eq('id', id);
      } catch (err) {
        console.warn('[Supabase] Error updating emergency contact:', err);
      }
    }
  };

  const deleteEmergencyContact = async (id: string) => {
    setEmergencyContacts((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      localStorage.setItem('solitaire_emergency_contacts_v1', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('emergency_contacts').delete().eq('id', id);
      } catch (err) {
        console.warn('[Supabase] Error deleting emergency contact:', err);
      }
    }
  };

  const addGalleryItem = async (item: Omit<SocietyGalleryItem, 'id' | 'createdAt'>): Promise<string> => {
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `gal-${Date.now()}`;
    const newItem: SocietyGalleryItem = {
      ...item,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setGalleryItems((prev) => {
      const updated = [newItem, ...prev];
      try {
        localStorage.setItem('solitaire_gallery_items_v1', JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage quota warning for gallery items:', err);
      }
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        const row = mapGalleryModelToRow(newItem);
        const { error } = await supabase.from('society_gallery').insert([row]);
        if (error) {
          console.warn('[Supabase] Inserting gallery item with custom id failed, trying without explicit id:', error);
          const { id, ...rowWithoutId } = row;
          await supabase.from('society_gallery').insert([rowWithoutId]);
        }
      } catch (err) {
        console.warn('[Supabase] Error inserting gallery item:', err);
      }
    }
    return newId;
  };

  const updateGalleryItem = async (id: string, updates: Partial<SocietyGalleryItem>) => {
    setGalleryItems((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
      try {
        localStorage.setItem('solitaire_gallery_items_v1', JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage quota warning for gallery items:', err);
      }
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        const dbUpdates: any = {};
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
        if (updates.category !== undefined) dbUpdates.category = updates.category;
        if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility;
        
        const { error } = await supabase.from('society_gallery').update(dbUpdates).eq('id', id);
        if (error) {
          console.warn('[Supabase] Error updating gallery item:', error);
        }
      } catch (err) {
        console.warn('[Supabase] Error updating gallery item:', err);
      }
    }
  };

  const deleteGalleryItem = async (id: string) => {
    setGalleryItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem('solitaire_gallery_items_v1', JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage quota warning for gallery items:', err);
      }
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('society_gallery').delete().eq('id', id);
        if (error) {
          console.warn('[Supabase] Error deleting gallery item:', error);
        }
      } catch (err) {
        console.warn('[Supabase] Error deleting gallery item:', err);
      }
    }
  };

  // Initial load from Supabase tables
  useEffect(() => {
    if (isSupabaseConfigured) {
      fetchMembersFromSupabase();
      fetchVehiclesFromSupabase();
      fetchWorkOrdersFromSupabase();
      fetchProcurementFromSupabase();
      fetchEmergencyContacts();
      fetchGalleryItems();
      fetchStaffDirectory().then((staff) => {
        if (staff && staff.length > 0) setStaffList(staff);
      });
    }
  }, [
    fetchMembersFromSupabase,
    fetchVehiclesFromSupabase,
    fetchWorkOrdersFromSupabase,
    fetchProcurementFromSupabase,
    fetchEmergencyContacts,
    fetchGalleryItems,
  ]);

  // Real-time table listeners
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    try {
      const channel = supabase
        .channel('solitaire-portal-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => {
          fetchMembersFromSupabase();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => {
          fetchVehiclesFromSupabase();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'work_orders' }, () => {
          fetchWorkOrdersFromSupabase();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'procurement_orders' }, () => {
          fetchProcurementFromSupabase();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_contacts' }, () => {
          fetchEmergencyContacts();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'society_gallery' }, () => {
          fetchGalleryItems();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('[Supabase] Realtime subscription error:', err);
    }
  }, [
    fetchMembersFromSupabase,
    fetchVehiclesFromSupabase,
    fetchWorkOrdersFromSupabase,
    fetchProcurementFromSupabase,
    fetchEmergencyContacts,
    fetchGalleryItems,
  ]);

  // =========================================================================
  // SUPABASE AUTH STATE LISTENERS (onAuthStateChange & getUser)
  // =========================================================================

  const syncProfileForAuthUser = useCallback(
    (authUser: SupabaseUser | null, allProfiles: MemberProfile[]) => {
      if (!authUser) {
        // If not logged in via Supabase and no active role in localStorage, remain public
        const currentSavedRole = localStorage.getItem('solitaire_role');
        if (!currentSavedRole || currentSavedRole === 'public') {
          setRoleState('public');
          setUserFlat('Public Visitor');
          setUserName('Visitor / Guest');
          setCurrentMemberId('SOL-PUBLIC');
        }
        return;
      }

      setSupabaseUser(authUser);
      const userEmail = (authUser.email || '').toLowerCase().trim();
      const userMeta = authUser.user_metadata || {};

      // Match profile by email or user ID or metadata flat
      let matchedProfile = allProfiles.find(
        (p) => p.email.toLowerCase().trim() === userEmail || p.id === authUser.id
      );

      if (!matchedProfile && userMeta.flat_no) {
        matchedProfile = allProfiles.find(
          (p) => p.flatNo.toUpperCase().trim() === String(userMeta.flat_no).toUpperCase().trim()
        );
      }

      if (matchedProfile) {
        setActiveProfileId(matchedProfile.id);
        localStorage.setItem('solitaire_active_profile_id', matchedProfile.id);
        setUserFlat(matchedProfile.flatNo);
        setUserName(matchedProfile.name);
        setCurrentMemberId(matchedProfile.memberId);

        // LOCK UNAPPROVED USERS IN PENDING STATE
        if (!matchedProfile.isApproved || matchedProfile.status === 'Pending Approval') {
          setRoleState('resident');
          localStorage.setItem('solitaire_role', 'resident');
        } else if (matchedProfile.status === 'Rejected') {
          setRoleState('resident');
          localStorage.setItem('solitaire_role', 'resident');
        } else {
          // Approved user gets their full society role (resident, supervisor, mc_member, admin)
          setRoleState(matchedProfile.role);
          localStorage.setItem('solitaire_role', matchedProfile.role);
        }
      } else {
        // User authenticated with Supabase but has not registered a flat profile yet
        // Lock them in pending registration/verification
        setRoleState('resident');
        localStorage.setItem('solitaire_role', 'resident');
        setUserFlat(userMeta.flat_no || 'Unassigned Flat');
        setUserName(userMeta.name || authUser.email?.split('@')[0] || 'New Resident');
        setCurrentMemberId(`SOL-NEW-${authUser.id.slice(0, 6)}`);
      }
    },
    []
  );

  useEffect(() => {
    let isMounted = true;

    async function checkInitialSession() {
      setAuthLoading(true);
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.auth.getUser();
          if (!error && data?.user && isMounted) {
            syncProfileForAuthUser(data.user, profiles);
          }
        } catch (err) {
          console.warn('[Supabase] Initial auth session check error:', err);
        }
      }
      if (isMounted) setAuthLoading(false);
    }

    checkInitialSession();

    // Supabase onAuthStateChange listener
    let subscription: { unsubscribe: () => void } | null = null;
    if (isSupabaseConfigured) {
      try {
        const { data } = supabase.auth.onAuthStateChange((event, session) => {
          if (!isMounted) return;
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
            syncProfileForAuthUser(session?.user || null, profiles);
          } else if (event === 'SIGNED_OUT') {
            setSupabaseUser(null);
            setRoleState('public');
            localStorage.setItem('solitaire_role', 'public');
            setUserFlat('Public Visitor');
            setUserName('Visitor / Guest');
            setCurrentMemberId('SOL-PUBLIC');
            setActiveTabState('home');
          }
        });
        subscription = data.subscription;
      } catch (err) {
        console.warn('[Supabase] onAuthStateChange setup error:', err);
      }
    }

    return () => {
      isMounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [profiles, syncProfileForAuthUser]);

  // =========================================================================
  // SINGLE MEMBER PER FLAT CONSTRAINT & REGISTRATION ENGINE
  // =========================================================================

  const registerMember = async (data: {
    name: string;
    email: string;
    phone: string;
    avatarUrl?: string;
    tower: 'Tower A' | 'Tower B' | 'Tower C';
    flatNo: string;
    ownershipType: 'Owner' | 'Tenant';
  }): Promise<{ success: boolean; error?: string; memberId?: string }> => {
    const cleanFlat = data.flatNo.trim().toUpperCase();
    const cleanEmail = (data.email || '').trim().toLowerCase();

    // Module 2: Validate Personal Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return {
        success: false,
        error: 'Please provide a valid personal email address (e.g. resident@gmail.com).',
      };
    }

    // Module 1: Enforce Dual-User Flat Limit (1 Owner + 1 Tenant max per flat)
    const existingForFlat = profiles.filter(
      (p) => p.flatNo.trim().toUpperCase() === cleanFlat && p.status !== 'Rejected'
    );

    const existingOwner = existingForFlat.find((p) => p.ownershipType === 'Owner');
    const existingTenant = existingForFlat.find((p) => p.ownershipType === 'Tenant');

    if (existingForFlat.length >= 2) {
      return {
        success: false,
        error: `Flat [${cleanFlat}] has already reached the maximum limit of 2 registered profiles (1 Owner: ${existingOwner?.name || 'Registered'} + 1 Tenant: ${existingTenant?.name || 'Registered'}).`,
      };
    }

    if (data.ownershipType === 'Owner' && existingOwner) {
      return {
        success: false,
        error: `Flat [${cleanFlat}] already has a registered Owner profile (${existingOwner.name}). Each flat is limited to 1 Owner profile.`,
      };
    }

    if (data.ownershipType === 'Tenant' && existingTenant) {
      return {
        success: false,
        error: `Flat [${cleanFlat}] already has a registered Tenant profile (${existingTenant.name}). Each flat is limited to 1 Tenant profile.`,
      };
    }

    // Check Supabase if live
    if (isSupabaseConfigured) {
      try {
        const { data: dbMembers, error: dbError } = await supabase
          .from('members')
          .select('id, name, flat_no, ownership_type, status')
          .ilike('flat_no', cleanFlat)
          .neq('status', 'Rejected');

        if (!dbError && dbMembers && dbMembers.length > 0) {
          const dbOwner = dbMembers.find((m: any) => m.ownership_type === 'Owner');
          const dbTenant = dbMembers.find((m: any) => m.ownership_type === 'Tenant');

          if (dbMembers.length >= 2) {
            return {
              success: false,
              error: `Flat [${cleanFlat}] has already reached the maximum limit of 2 registered profiles in Solitaire CHS.`,
            };
          }
          if (data.ownershipType === 'Owner' && dbOwner) {
            return {
              success: false,
              error: `Flat [${cleanFlat}] already has a registered Owner (${dbOwner.name}).`,
            };
          }
          if (data.ownershipType === 'Tenant' && dbTenant) {
            return {
              success: false,
              error: `Flat [${cleanFlat}] already has a registered Tenant (${dbTenant.name}).`,
            };
          }
        }
      } catch (err) {
        console.warn('[Supabase] Failed checking member constraint in DB, checking local state:', err);
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const towerInitial = data.tower.replace('Tower ', '');
    const cleanNum = cleanFlat.replace(/[^a-zA-Z0-9]/g, '');
    const genMemberId = `SOL-${towerInitial}-${cleanNum}${data.ownershipType === 'Tenant' ? '-T' : ''}`;
    const newId = `usr-${Date.now()}`;

    const assignedRole: UserRole = data.ownershipType === 'Tenant' ? 'tenant' : 'resident';

    const newProfile: MemberProfile = {
      id: newId,
      memberId: genMemberId,
      name: data.name,
      email: cleanEmail,
      phone: data.phone,
      avatarUrl: data.avatarUrl || '',
      tower: data.tower,
      flatNo: cleanFlat,
      role: assignedRole,
      roles: [assignedRole],
      ownershipType: data.ownershipType,
      isApproved: false, // Default to FALSE - requires MC/Admin approval!
      status: 'Pending Approval',
      registeredDate: today,
    };

    setProfiles((prev) => [newProfile, ...prev]);

    // Insert into Supabase if configured
    if (isSupabaseConfigured) {
      try {
        await supabase.from('members').insert([mapProfileToMemberRow(newProfile)]);
      } catch (err) {
        console.warn('[Supabase] Error inserting new member:', err);
      }
    }

    // Record in Audit Trail
    const auditEntry: ApprovalAuditEntry = {
      id: `AUD-${Date.now()}`,
      userId: newId,
      userName: data.name,
      flatNo: cleanFlat,
      action: 'Registration Requested',
      performedBy: 'Self Registration',
      performedByRole: 'public',
      timestamp: `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      details: `New registration submitted for Flat [${cleanFlat}] as ${data.ownershipType} (${assignedRole}). Awaiting MC Member / Admin verification.`,
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    return { success: true, memberId: genMemberId };
  };

  const addMemberProfile = (data: Omit<MemberProfile, 'id' | 'memberId' | 'isApproved' | 'status' | 'registeredDate'>): string => {
    registerMember({
      name: data.name,
      email: data.email,
      phone: data.phone,
      tower: data.tower,
      flatNo: data.flatNo,
      ownershipType: data.ownershipType,
    });
    return `SOL-${data.tower.replace('Tower ', '')}-${data.flatNo.replace(/[^a-zA-Z0-9]/g, '')}`;
  };

  // =========================================================================
  // SUPABASE AUTH ACTIONS (signInWithSupabase, signUpWithSupabase, signOutWithSupabase)
  // =========================================================================

  const signInWithSupabase = async (
    emailOrFlat: string,
    password?: string
  ): Promise<{ success: boolean; error?: string; role?: UserRole; isPending?: boolean }> => {
    setAuthLoading(true);
    const cleanInput = (emailOrFlat || '').trim().toLowerCase();
    const cleanFlatInput = cleanInput.replace(/[^a-z0-9]/g, '');

    // 1. Direct role shortcuts / official local credentials check
    if (cleanInput === 'admin@solitaire-chs.org' || cleanInput === 'admin' || cleanFlatInput === 'a1202' || cleanInput === 'sol-adm-01') {
      const adminUser = OFFICIAL_LOCAL_USERS[0];
      loginAsRole('admin', adminUser.id);
      setAuthLoading(false);
      return { success: true, role: 'admin', isPending: false };
    }
    if (cleanInput === 'secretary@solitaire-chs.org' || cleanInput === 'secretary' || cleanFlatInput === 'b801' || cleanInput === 'sol-b-801' || cleanInput === 'mc') {
      const secUser = OFFICIAL_LOCAL_USERS[1];
      loginAsRole('mc_member', secUser.id);
      setAuthLoading(false);
      return { success: true, role: 'mc_member', isPending: false };
    }
    if (cleanInput === 'supervisor@solitaire-chs.org' || cleanInput === 'supervisor' || cleanFlatInput === 'a101' || cleanInput === 'sol-sup-01') {
      const supUser = OFFICIAL_LOCAL_USERS[2];
      loginAsRole('supervisor', supUser.id);
      setAuthLoading(false);
      return { success: true, role: 'supervisor', isPending: false };
    }
    if (cleanInput === 'rajesh.sharma@solitaire-chs.org' || cleanInput === 'resident' || cleanFlatInput === 'a402' || cleanInput === 'sol-a-402') {
      const resUser = OFFICIAL_LOCAL_USERS[3];
      loginAsRole('resident', resUser.id);
      setAuthLoading(false);
      return { success: true, role: 'resident', isPending: false };
    }

    // 2. Supabase Cloud Auth attempt if live configured
    if (isSupabaseConfigured && cleanInput.includes('@')) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanInput,
          password: password || 'Solitaire@2026',
        });

        if (!error && data?.user) {
          syncProfileForAuthUser(data.user, profiles);
          const userEmail = data.user.email?.toLowerCase().trim();
          const matched = profiles.find((p) => p.email.toLowerCase().trim() === userEmail);
          const pending = !matched || !matched.isApproved || matched.status === 'Pending Approval';
          setAuthLoading(false);
          return {
            success: true,
            role: matched ? matched.role : 'resident',
            isPending: pending,
          };
        }
      } catch (err: any) {
        console.warn('[Supabase] Auth attempt error, falling back to local registry:', err);
      }
    }

    // 3. Search both current profiles and official local users
    const allKnownProfiles = [...OFFICIAL_LOCAL_USERS, ...profiles];
    const matchedProfile = allKnownProfiles.find((p) => {
      const pEmail = (p.email || '').toLowerCase().trim();
      const pFlat = (p.flatNo || '').toLowerCase().trim();
      const pCleanFlat = pFlat.replace(/[^a-z0-9]/g, '');
      const pMemberId = (p.memberId || '').toLowerCase().trim();
      const pCleanMemberId = pMemberId.replace(/[^a-z0-9]/g, '');
      const pRole = (p.role || '').toLowerCase().trim();

      if (pEmail === cleanInput) return true;
      if (pFlat === cleanInput || pCleanFlat === cleanFlatInput) return true;
      if (pMemberId === cleanInput || pCleanMemberId === cleanFlatInput) return true;
      if (cleanInput === 'admin' && pRole === 'admin') return true;
      if ((cleanInput === 'secretary' || cleanInput === 'mc') && (pRole === 'mc_member' || pRole === 'secretary')) return true;
      if (cleanInput === 'supervisor' && pRole === 'supervisor') return true;
      if (cleanInput === 'resident' && pRole === 'resident') return true;
      return false;
    });

    if (!matchedProfile) {
      setAuthLoading(false);
      return {
        success: false,
        error: `No registered account found matching "${emailOrFlat}". Please select an authorized account below or enter a registered flat number.`,
      };
    }

    loginAsRole(matchedProfile.role, matchedProfile.id);
    setAuthLoading(false);
    return {
      success: true,
      role: matchedProfile.role,
      isPending: !matchedProfile.isApproved || matchedProfile.status === 'Pending Approval',
    };
  };

  const updateMemberProfile = (id: string, updates: Partial<MemberProfile>) => {
    const target = profiles.find((p) => p.id === id) || OFFICIAL_LOCAL_USERS.find((p) => p.id === id);
    if (!target) return;

    const today = new Date().toISOString().split('T')[0];
    const timeStr = `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );

    if (isSupabaseConfigured) {
      supabase
        .from('members')
        .update(updates)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('[Supabase] Update member error:', error);
        });
    }

    const auditEntry: ApprovalAuditEntry = {
      id: `AUD-${Date.now()}`,
      userId: id,
      userName: updates.name || target.name,
      flatNo: updates.flatNo || target.flatNo,
      action: 'Profile Modified',
      performedBy: userName,
      performedByRole: role,
      timestamp: timeStr,
      details: `Admin modified profile fields: ${Object.keys(updates).join(', ')}`,
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  const signUpWithSupabase = async (params: {
    email: string;
    password: string;
    name: string;
    phone: string;
    avatarUrl?: string;
    tower: 'Tower A' | 'Tower B' | 'Tower C';
    flatNo: string;
    ownershipType: 'Owner' | 'Tenant';
  }): Promise<{ success: boolean; error?: string; memberId?: string }> => {
    setAuthLoading(true);

    // 1. One-member-per-flat validation check
    const regCheck = await registerMember({
      name: params.name,
      email: params.email,
      phone: params.phone,
      avatarUrl: params.avatarUrl,
      tower: params.tower,
      flatNo: params.flatNo,
      ownershipType: params.ownershipType,
    });

    if (!regCheck.success) {
      setAuthLoading(false);
      return regCheck;
    }

    // 2. Create user in Supabase Auth if configured
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: params.email.trim(),
          password: params.password,
          options: {
            data: {
              name: params.name,
              phone: params.phone,
              avatar_url: params.avatarUrl || '',
              tower: params.tower,
              flat_no: params.flatNo.trim().toUpperCase(),
              ownership_type: params.ownershipType,
            },
          },
        });

        if (error) {
          setAuthLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          setSupabaseUser(data.user);
        }
      } catch (err: any) {
        console.warn('[Supabase] Auth signUp warning:', err);
      }
    }

    // Set active session in pending verification state
    const cleanFlat = params.flatNo.trim().toUpperCase();
    const createdProfile = profiles.find((p) => p.flatNo.toUpperCase() === cleanFlat);
    if (createdProfile) {
      setActiveProfileId(createdProfile.id);
      localStorage.setItem('solitaire_active_profile_id', createdProfile.id);
    }
    setRoleState('resident');
    localStorage.setItem('solitaire_role', 'resident');
    setUserFlat(cleanFlat);
    setUserName(params.name);
    setCurrentMemberId(regCheck.memberId || 'SOL-PENDING');

    setAuthLoading(false);
    return regCheck;
  };

  const signOutWithSupabase = async () => {
    logout();
  };

  // MC/ADMIN APPROVAL & REJECTION ENGINE
  const approveMemberProfile = (id: string, isApproved: boolean, remarks?: string) => {
    const target = profiles.find((p) => p.id === id);
    if (!target) return;

    const today = new Date().toISOString().split('T')[0];
    const timeStr = `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const newStatus = isApproved ? 'Approved' : 'Rejected';

    setProfiles((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              isApproved,
              status: newStatus,
              approvedOrRejectedBy: userName,
              reviewedAt: timeStr,
              reviewRemarks: remarks || (isApproved ? 'Approved by Committee' : 'Application rejected'),
            }
          : p
      )
    );

    // Sync to Supabase if configured
    if (isSupabaseConfigured) {
      supabase
        .from('members')
        .update({
          is_approved: isApproved,
          status: newStatus,
          approved_or_rejected_by: userName,
          reviewed_at: timeStr,
          review_remarks: remarks || (isApproved ? 'Approved by Committee' : 'Application rejected'),
        })
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('[Supabase] Update member status error:', error);
        });
    }

    // Append to searchable audit log
    const auditEntry: ApprovalAuditEntry = {
      id: `AUD-${Date.now()}`,
      userId: id,
      userName: target.name,
      flatNo: target.flatNo,
      action: isApproved ? 'Approved' : 'Rejected',
      performedBy: userName,
      performedByRole: role,
      timestamp: timeStr,
      details: remarks || (isApproved ? `Registration approved with Resident access for ${target.flatNo}.` : `Registration rejected for ${target.flatNo}.`),
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  const updateUserRole = (id: string, newRole: UserRole) => {
    const target = profiles.find((p) => p.id === id);
    if (!target) return;

    const today = new Date().toISOString().split('T')[0];
    const timeStr = `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, role: newRole } : p))
    );

    if (isSupabaseConfigured) {
      supabase
        .from('members')
        .update({ role: newRole })
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('[Supabase] Update role error:', error);
        });
    }

    const auditEntry: ApprovalAuditEntry = {
      id: `AUD-${Date.now()}`,
      userId: id,
      userName: target.name,
      flatNo: target.flatNo,
      action: 'Role Changed',
      performedBy: userName,
      performedByRole: role,
      timestamp: timeStr,
      details: `Role updated from ${ROLE_LABELS[target.role] || target.role} to ${ROLE_LABELS[newRole] || newRole}.`,
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  const updateUserRoles = (id: string, newRoles: string[]) => {
    const target = profiles.find((p) => p.id === id);
    if (!target) return;

    const primaryRole = (newRoles[0] as UserRole) || 'resident';
    const today = new Date().toISOString().split('T')[0];
    const timeStr = `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, roles: newRoles, role: primaryRole } : p))
    );

    if (isSupabaseConfigured) {
      supabase
        .from('members')
        .update({ role: primaryRole, roles: newRoles })
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('[Supabase] Update user roles error:', error);
        });
    }

    const auditEntry: ApprovalAuditEntry = {
      id: `AUD-${Date.now()}`,
      userId: id,
      userName: target.name,
      flatNo: target.flatNo,
      action: 'Role Changed',
      performedBy: userName,
      performedByRole: role,
      timestamp: timeStr,
      details: `Multi-role assignment updated for ${target.name}: [${newRoles.join(', ')}]`,
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  const resetPasswordForEmail = async (email: string): Promise<{ success: boolean; message: string; error?: string }> => {
    const targetEmail = (email || '').trim().toLowerCase();
    if (!targetEmail) return { success: false, message: 'Please enter a valid email address.' };

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
          redirectTo: window.location.origin,
        });
        if (error) {
          return { success: false, message: error.message, error: error.message };
        }
        return { success: true, message: `Password reset instructions sent to ${targetEmail}. Please check your inbox.` };
      } catch (err: any) {
        return { success: false, message: err.message || 'Failed to trigger reset email.', error: err.message };
      }
    }

    // Offline / Local verification
    const exists = profiles.some((p) => (p.email || '').toLowerCase().trim() === targetEmail) ||
      OFFICIAL_LOCAL_USERS.some((p) => p.email.toLowerCase().trim() === targetEmail);
    if (!exists) {
      return { success: false, message: `No registered resident account found with email: ${targetEmail}` };
    }
    return {
      success: true,
      message: `Password reset instructions dispatched to ${targetEmail}. Default temporary recovery key: Solitaire@2026.`,
    };
  };

  const adminResetPassword = async (userId: string, newPassword?: string): Promise<{ success: boolean; message: string; error?: string }> => {
    const target = profiles.find((p) => p.id === userId) || OFFICIAL_LOCAL_USERS.find((p) => p.id === userId);
    if (!target) return { success: false, message: 'User profile not found.' };

    const pwd = newPassword || 'Solitaire@2026';
    const today = new Date().toISOString().split('T')[0];
    const timeStr = `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setProfiles((prev) =>
      prev.map((p) => (p.id === userId ? { ...p, tempPassword: pwd } : p))
    );

    const auditEntry: ApprovalAuditEntry = {
      id: `AUD-${Date.now()}`,
      userId: target.id,
      userName: target.name,
      flatNo: target.flatNo,
      action: 'Profile Modified',
      performedBy: userName,
      performedByRole: role,
      timestamp: timeStr,
      details: `Admin/Secretary reset credentials for ${target.name} (${target.flatNo}). Temporary password assigned.`,
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    if (isSupabaseConfigured && target.email) {
      try {
        await supabase.auth.resetPasswordForEmail(target.email);
      } catch {}
    }

    return { success: true, message: `Password reset successfully for ${target.name}. Temporary password set to: ${pwd}` };
  };

  const deleteMemberProfile = (id: string) => {
    const target = profiles.find((p) => p.id === id);
    if (!target) return;

    setProfiles((prev) => prev.filter((p) => p.id !== id));

    if (isSupabaseConfigured) {
      supabase
        .from('members')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('[Supabase] Delete member error:', error);
        });
    }

    const today = new Date().toISOString().split('T')[0];
    const timeStr = `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const auditEntry: ApprovalAuditEntry = {
      id: `AUD-${Date.now()}`,
      userId: id,
      userName: target.name,
      flatNo: target.flatNo,
      action: 'Rejected',
      performedBy: userName,
      performedByRole: role,
      timestamp: timeStr,
      details: `Application record removed from database for Flat [${target.flatNo}].`,
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  // VEHICLE LOGISTICS & PARKING SPOT TRACKER
  const addVehicle = (vehicle: Omit<VehicleRecord, 'id' | 'registeredDate'>): string => {
    const newId = `VEH-${Date.now().toString().slice(-4)}`;
    const today = new Date().toISOString().split('T')[0];
    const newRecord: VehicleRecord = {
      ...vehicle,
      id: newId,
      registeredDate: today,
    };
    setVehicles((prev) => [newRecord, ...prev]);

    if (isSupabaseConfigured) {
      supabase
        .from('vehicles')
        .insert([mapRecordToVehicleRow(newRecord)])
        .then(({ error }) => {
          if (error) console.warn('[Supabase] Insert vehicle error:', error);
        });
    }

    return newId;
  };

  const updateVehicle = (id: string, updatedFields: Partial<VehicleRecord>) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updatedFields } : v))
    );

    if (isSupabaseConfigured) {
      supabase
        .from('vehicles')
        .update(updatedFields)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('[Supabase] Update vehicle error:', error);
        });
    }
  };

  const deleteVehicle = (id: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id));

    if (isSupabaseConfigured) {
      supabase
        .from('vehicles')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('[Supabase] Delete vehicle error:', error);
        });
    }
  };

  const bulkImportVehicles = (records: Omit<VehicleRecord, 'id' | 'registeredDate'>[]): number => {
    const today = new Date().toISOString().split('T')[0];
    const newRecords: VehicleRecord[] = records.map((r, i) => ({
      ...r,
      id: `VEH-CSV-${Date.now().toString().slice(-4)}-${i + 1}`,
      registeredDate: today,
    }));
    setVehicles((prev) => [...newRecords, ...prev]);

    if (isSupabaseConfigured) {
      supabase
        .from('vehicles')
        .insert(newRecords.map(mapRecordToVehicleRow))
        .then(({ error }) => {
          if (error) console.warn('[Supabase] Bulk import vehicles error:', error);
        });
    }

    return newRecords.length;
  };

  const issueVisitorPass = (pass: Omit<VisitorParkingPass, 'id' | 'status'>): string => {
    const newId = `VP-${Date.now().toString().slice(-4)}`;
    const newPass: VisitorParkingPass = {
      ...pass,
      id: newId,
      status: 'Active',
    };
    setVisitorPasses((prev) => [newPass, ...prev]);
    return newId;
  };

  const updateVisitorPassStatus = (id: string, status: VisitorParkingPass['status']) => {
    setVisitorPasses((prev) =>
      prev.map((vp) => (vp.id === id ? { ...vp, status } : vp))
    );
  };

  // DOCUMENT REPOSITORY ENGINE
  const addDocument = (doc: Omit<SocietyDocument, 'id' | 'uploadedAt'>): string => {
    const newId = `DOC-${Date.now().toString().slice(-4)}`;
    const today = new Date().toISOString().split('T')[0];
    const newDoc: SocietyDocument = {
      ...doc,
      id: newId,
      uploadedAt: today,
    };
    setDocuments((prev) => [newDoc, ...prev]);
    return newId;
  };

  const deleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  // VENDOR ONBOARDING & MULTI-ITEM PROCUREMENT
  const onboardVendor = (vendor: Omit<Vendor, 'id' | 'rating' | 'registeredDate'>): string => {
    const newId = `VND-${Date.now().toString().slice(-3)}`;
    const today = new Date().toISOString().split('T')[0];
    const newVendor: Vendor = {
      ...vendor,
      id: newId,
      rating: 4.8,
      registeredDate: today,
    };
    setVendors((prev) => [newVendor, ...prev]);
    return newId;
  };

  const updateVendor = (id: string, updates: Partial<Vendor>) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
    );
    if (isSupabaseConfigured) {
      supabase
        .from('vendors')
        .update(updates)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('[Supabase] Update vendor error:', error);
        });
    }
  };

  const deleteVendor = (id: string) => {
    setVendors((prev) => prev.filter((v) => v.id !== id));
    if (isSupabaseConfigured) {
      supabase
        .from('vendors')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('[Supabase] Delete vendor error:', error);
        });
    }
  };

  const addVendorQuote = (quote: Omit<VendorQuote, 'id' | 'submittedDate' | 'status'>): string => {
    const today = new Date().toISOString().split('T')[0];
    const newQuoteId = `QTE-${Date.now().toString().slice(-4)}`;
    const quoteNum = quote.quoteNumber || `Q-${Date.now().toString().slice(-4)}`;

    const items = quote.items || [];
    const subtotal = quote.subtotal || items.reduce((sum, item) => sum + item.lineTotal, 0);
    const gstPercent = quote.gstPercent !== undefined ? quote.gstPercent : 18;
    const taxAmount = quote.taxAmount !== undefined ? quote.taxAmount : Math.round((subtotal * gstPercent) / 100);
    const grandTotal = quote.grandTotal !== undefined ? quote.grandTotal : subtotal + taxAmount;

    const newQuote: VendorQuote = {
      ...quote,
      id: newQuoteId,
      quoteNumber: quoteNum,
      subtotal,
      gstPercent,
      taxAmount,
      grandTotal,
      quotedAmount: grandTotal,
      submittedDate: today,
      status: 'Pending Review',
      termsAndConditions: quote.termsAndConditions || defaultTermsAndConditions,
    };
    setQuotes((prev) => [newQuote, ...prev]);

    if (isSupabaseConfigured) {
      supabase
        .from('procurement_orders')
        .insert([
          {
            id: newQuoteId,
            quote_number: quoteNum,
            procurement_project_id: quote.procurementProjectId,
            project_title: quote.projectTitle,
            vendor_id: quote.vendorId,
            vendor_name: quote.vendorName,
            items: quote.items || [],
            subtotal,
            gst_percent: gstPercent,
            tax_amount: taxAmount,
            grand_total: grandTotal,
            quoted_amount: grandTotal,
            estimated_days: quote.estimatedDays,
            warranty_months: quote.warrantyMonths,
            submitted_date: today,
            scope_of_work: quote.scopeOfWork,
            status: 'Pending Review',
          },
        ])
        .then(({ error }) => {
          if (error) console.warn('[Supabase] Insert quote error:', error);
        });
    }

    return newQuoteId;
  };

  const updateVendorQuote = (id: string, updates: Partial<VendorQuote>) => {
    setQuotes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
    if (isSupabaseConfigured) {
      supabase
        .from('procurement_orders')
        .update(updates)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('[Supabase] Update quote error:', error);
        });
    }
  };

  const deleteVendorQuote = (id: string) => {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
    if (isSupabaseConfigured) {
      supabase
        .from('procurement_orders')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('[Supabase] Delete quote error:', error);
        });
    }
  };

  const approveQuoteAndReleaseWorkOrder = (
    quoteId: string,
    startDate?: string,
    targetCompletionDate?: string,
    customTerms?: string[]
  ): string => {
    const selectedQuote = quotes.find((q) => q.id === quoteId);
    if (!selectedQuote) return '';

    // Mark quote Selected, reject others for same project
    setQuotes((prev) =>
      prev.map((q) => {
        if (q.id === quoteId) return { ...q, status: 'Selected' as const };
        if (q.procurementProjectId === selectedQuote.procurementProjectId) return { ...q, status: 'Rejected' as const };
        return q;
      })
    );

    const today = new Date().toISOString().split('T')[0];
    const target = targetCompletionDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const newWoId = `WO-2026-${String(workOrders.length + 1).padStart(3, '0')}`;
    const vendorInfo = vendors.find((v) => v.id === selectedQuote.vendorId);

    let cat: WorkOrder['category'] = 'Civil Works';
    const lower = selectedQuote.projectTitle.toLowerCase();
    if (lower.includes('stp') || lower.includes('water')) cat = 'STP & Water';
    else if (lower.includes('lift') || lower.includes('elevator')) cat = 'Lifts / Elevators';
    else if (lower.includes('solar') || lower.includes('dg') || lower.includes('led') || lower.includes('electrical')) cat = 'Electrical & DG';
    else if (lower.includes('security') || lower.includes('cctv')) cat = 'Security & CCTV';

    const grandTotal = selectedQuote.grandTotal || selectedQuote.quotedAmount;
    const subtotal = selectedQuote.subtotal || Math.round(grandTotal / 1.18);
    const tax = selectedQuote.taxAmount || grandTotal - subtotal;

    const newWO: WorkOrder = {
      id: newWoId,
      procurementTitle: selectedQuote.projectTitle,
      category: cat,
      quoteId: selectedQuote.id,
      quoteNumber: selectedQuote.quoteNumber,
      vendorId: selectedQuote.vendorId,
      vendorName: selectedQuote.vendorName,
      vendorContact: vendorInfo?.phone || '+91 98220 00000',
      vendorGst: vendorInfo?.gstNumber || '27AAACL0000A1Z1',
      vendorPan: vendorInfo?.panNumber,
      bankDetails: vendorInfo?.bankAccountNumber
        ? {
            bankName: vendorInfo.bankName,
            accountNumber: vendorInfo.bankAccountNumber,
            ifscCode: vendorInfo.ifscCode || '',
          }
        : undefined,
      items: selectedQuote.items,
      subtotal,
      gstPercent: selectedQuote.gstPercent || 18,
      taxAmount: tax,
      totalApprovedAmount: grandTotal,
      startDate: startDate || today,
      targetCompletionDate: target,
      progressPercent: 0,
      scopeSummary: selectedQuote.scopeOfWork,
      paymentTerms: '30% Advance, 40% Milestone 1, 30% Final Settlement',
      approvalStatus: 'Pending_Secretary_Approval',
      workStatus: 'Scheduled',
      releasedBy: userName || 'MC Member',
      releasedAt: today,
      payments: [],
      termsAndConditions: customTerms || selectedQuote.termsAndConditions || defaultTermsAndConditions,
      warrantyMonths: selectedQuote.warrantyMonths || 12,
    };

    setWorkOrders((prev) => [newWO, ...prev]);

    if (isSupabaseConfigured) {
      supabase
        .from('work_orders')
        .insert([
          {
            id: newWoId,
            procurement_title: newWO.procurementTitle,
            category: newWO.category,
            quote_id: newWO.quoteId,
            quote_number: newWO.quoteNumber,
            vendor_id: newWO.vendorId,
            vendor_name: newWO.vendorName,
            vendor_contact: newWO.vendorContact,
            vendor_gst: newWO.vendorGst,
            total_approved_amount: newWO.totalApprovedAmount,
            start_date: newWO.startDate,
            target_completion_date: newWO.targetCompletionDate,
            progress_percent: 0,
            scope_summary: newWO.scopeSummary,
            payment_terms: newWO.paymentTerms,
            approval_status: 'Pending_Secretary_Approval',
            work_status: 'Scheduled',
            released_by: newWO.releasedBy,
            released_at: newWO.releasedAt,
            payments: [],
          },
        ])
        .then(({ error }) => {
          if (error) console.warn('[Supabase] Insert work order error:', error);
        });
    }

    return newWoId;
  };

  const updateWorkOrder = (id: string, updates: Partial<WorkOrder>) => {
    setWorkOrders((prev) =>
      prev.map((wo) => (wo.id === id ? { ...wo, ...updates } : wo))
    );
    if (isSupabaseConfigured) {
      const dbPayload: Record<string, any> = {};
      if (updates.procurementTitle !== undefined) dbPayload.procurement_title = updates.procurementTitle;
      if (updates.category !== undefined) dbPayload.category = updates.category;
      if (updates.totalApprovedAmount !== undefined) dbPayload.total_approved_amount = updates.totalApprovedAmount;
      if (updates.startDate !== undefined) dbPayload.start_date = updates.startDate;
      if (updates.targetCompletionDate !== undefined) dbPayload.target_completion_date = updates.targetCompletionDate;
      if (updates.progressPercent !== undefined) dbPayload.progress_percent = updates.progressPercent;
      if (updates.scopeSummary !== undefined) dbPayload.scope_summary = updates.scopeSummary;
      if (updates.paymentTerms !== undefined) dbPayload.payment_terms = updates.paymentTerms;
      if (updates.approvalStatus !== undefined) dbPayload.approval_status = updates.approvalStatus;
      if (updates.workStatus !== undefined) dbPayload.work_status = updates.workStatus;
      if (updates.termsAndConditions !== undefined) dbPayload.terms_and_conditions = updates.termsAndConditions;
      if (updates.vendorName !== undefined) dbPayload.vendor_name = updates.vendorName;
      if (updates.vendorContact !== undefined) dbPayload.vendor_contact = updates.vendorContact;
      if (updates.vendorGst !== undefined) dbPayload.vendor_gst = updates.vendorGst;
      if (updates.warrantyMonths !== undefined) dbPayload.warranty_months = updates.warrantyMonths;
      if (updates.subtotal !== undefined) dbPayload.subtotal = updates.subtotal;
      if (updates.taxAmount !== undefined) dbPayload.tax_amount = updates.taxAmount;
      if (updates.secretaryComments !== undefined) dbPayload.secretary_comments = updates.secretaryComments;
      if (updates.payments !== undefined) dbPayload.payments = updates.payments;

      supabase
        .from('work_orders')
        .update(Object.keys(dbPayload).length > 0 ? dbPayload : updates)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('[Supabase] Update work order error:', error);
        });
    }
  };

  const deleteWorkOrder = (id: string) => {
    setWorkOrders((prev) => prev.filter((wo) => wo.id !== id));
    if (isSupabaseConfigured) {
      supabase
        .from('work_orders')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('[Supabase] Delete work order error:', error);
        });
    }
  };

  const approveWorkOrder = (workOrderId: string, secretaryComments: string) => {
    const today = new Date().toISOString().split('T')[0];
    const timeStr = `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setWorkOrders((prev) =>
      prev.map((wo) =>
        wo.id === workOrderId
          ? {
              ...wo,
              approvalStatus: 'Approved',
              workStatus: 'In Progress',
              approvingUserId: `${currentMemberId} (${userName})`,
              approvedAt: timeStr,
              secretaryComments,
            }
          : wo
      )
    );

    if (isSupabaseConfigured) {
      supabase
        .from('work_orders')
        .update({
          approval_status: 'Approved',
          work_status: 'In Progress',
          approving_user_id: `${currentMemberId} (${userName})`,
          approved_at: timeStr,
          secretary_comments: secretaryComments,
        })
        .eq('id', workOrderId)
        .then(({ error }) => {
          if (error) console.warn('[Supabase] Approve work order error:', error);
        });
    }
  };

  const requestWorkOrderChanges = (workOrderId: string, secretaryComments: string) => {
    const today = new Date().toISOString().split('T')[0];
    const timeStr = `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setWorkOrders((prev) =>
      prev.map((wo) =>
        wo.id === workOrderId
          ? {
              ...wo,
              approvalStatus: 'Changes_Requested',
              approvingUserId: `${currentMemberId} (${userName})`,
              approvedAt: timeStr,
              secretaryComments,
            }
          : wo
      )
    );

    if (isSupabaseConfigured) {
      supabase
        .from('work_orders')
        .update({
          approval_status: 'Changes_Requested',
          approving_user_id: `${currentMemberId} (${userName})`,
          approved_at: timeStr,
          secretary_comments: secretaryComments,
        })
        .eq('id', workOrderId)
        .then(({ error }) => {
          if (error) console.warn('[Supabase] Request WO changes error:', error);
        });
    }
  };

  const updateWorkOrderProgress = (workOrderId: string, progress: number, workStatus?: WorkOrder['workStatus']) => {
    setWorkOrders((prev) =>
      prev.map((wo) => {
        if (wo.id === workOrderId) {
          const clamped = Math.min(100, Math.max(0, progress));
          const status = workStatus || (clamped >= 100 ? 'Completed' : clamped > 0 ? 'In Progress' : wo.workStatus);
          return {
            ...wo,
            progressPercent: clamped,
            workStatus: status,
          };
        }
        return wo;
      })
    );

    if (isSupabaseConfigured) {
      const clamped = Math.min(100, Math.max(0, progress));
      supabase
        .from('work_orders')
        .update({
          progress_percent: clamped,
          work_status: workStatus || (clamped >= 100 ? 'Completed' : 'In Progress'),
        })
        .eq('id', workOrderId)
        .then(({ error }) => {
          if (error) console.warn('[Supabase] Update progress error:', error);
        });
    }
  };

  const addWorkOrderPayment = (
    workOrderId: string,
    payment: Omit<WorkOrderPayment, 'id' | 'workOrderId'>
  ): string => {
    const payId = `PAY-${Date.now().toString().slice(-4)}`;
    const newPayment: WorkOrderPayment = {
      ...payment,
      id: payId,
      workOrderId,
    };

    setWorkOrders((prev) =>
      prev.map((wo) => {
        if (wo.id === workOrderId) {
          return {
            ...wo,
            payments: [...wo.payments, newPayment],
          };
        }
        return wo;
      })
    );

    return payId;
  };

  // COMMUNITY POLLS & REAL-TIME VOTING ENGINE
  const castVote = (pollId: string, optionId: string): { success: boolean; message: string } => {
    if (!isAuthenticated) {
      return { success: false, message: 'Authentication required to vote.' };
    }
    if (isPendingApproval || isRejected) {
      return { success: false, message: 'Your account is under verification. Only verified residents can vote.' };
    }

    const flatKey = userFlat || 'Unknown-Flat';
    const target = polls.find((p) => p.id === pollId);
    if (!target) {
      return { success: false, message: 'Poll not found.' };
    }
    if (target.status === 'Concluded') {
      return { success: false, message: 'This society poll is already concluded.' };
    }

    const previousOptionId = target.userVotes ? target.userVotes[flatKey] : undefined;

    setPolls((prev) =>
      prev.map((poll) => {
        if (poll.id !== pollId) return poll;

        const options = poll.options.map((opt) => ({ ...opt }));
        let deltaTotal = 0;

        if (previousOptionId === optionId) {
          return poll;
        }

        if (previousOptionId) {
          const oldIdx = options.findIndex((o) => o.id === previousOptionId);
          if (oldIdx !== -1) {
            options[oldIdx].votes = Math.max(0, options[oldIdx].votes - 1);
          }
        } else {
          deltaTotal = 1;
        }

        const newIdx = options.findIndex((o) => o.id === optionId);
        if (newIdx !== -1) {
          options[newIdx].votes += 1;
        }

        const votedFlats = poll.votedFlats.includes(flatKey)
          ? poll.votedFlats
          : [...poll.votedFlats, flatKey];

        const userVotes = {
          ...(poll.userVotes || {}),
          [flatKey]: optionId,
        };

        return {
          ...poll,
          options,
          totalVotes: poll.totalVotes + deltaTotal,
          votedFlats,
          userVotes,
        };
      })
    );

    return { success: true, message: `Vote recorded for Flat [${flatKey}]!` };
  };

  const createPoll = (pollData: Omit<CommunityPoll, 'id' | 'totalVotes' | 'votedFlats' | 'userVotes'>): string => {
    const newId = `POLL-${Date.now().toString().slice(-4)}`;
    const newPoll: CommunityPoll = {
      ...pollData,
      id: newId,
      totalVotes: 0,
      votedFlats: [],
      userVotes: {},
      options: pollData.options.map((opt, i) => ({
        ...opt,
        id: opt.id || `opt-${newId}-${i + 1}`,
        votes: 0,
        color: opt.color || ['#0d9488', '#0284c7', '#8b5cf6', '#f59e0b', '#ec4899'][i % 5],
      })),
    };
    setPolls((prev) => [newPoll, ...prev]);
    return newId;
  };

  const closePoll = (pollId: string, resolutionSummary: string) => {
    setPolls((prev) =>
      prev.map((p) =>
        p.id === pollId
          ? { ...p, status: 'Concluded', resolutionSummary }
          : p
      )
    );
  };

  // ADMIN OVERRIDE CONTROLS
  const adminUpdateTicket = (id: string, data: Partial<ComplaintTicket>) => {
    setComplaints((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
  };

  const adminUpdateBooking = (id: string, data: Partial<AmenityBooking>) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)));
  };

  const adminUpdateTenantApp = (id: string, data: Partial<TenantApplication>) => {
    setTenants((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
  };

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addComplaint = (ticketData: Omit<ComplaintTicket, 'id' | 'createdAt' | 'status'>): string => {
    const randomId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newTicket: ComplaintTicket = {
      ...ticketData,
      id: randomId,
      createdAt: formattedDate,
      status: 'Open',
    };
    setComplaints((prev) => [newTicket, ...prev]);
    return randomId;
  };

  const updateComplaintStatus = (
    id: string,
    status: ComplaintTicket['status'],
    resolutionNotes?: string,
    assignedVendor?: string
  ) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status,
              ...(resolutionNotes ? { resolutionNotes } : {}),
              ...(assignedVendor ? { assignedVendor } : {}),
            }
          : c
      )
    );
  };

  const addBooking = (bookingData: Omit<AmenityBooking, 'id' | 'bookingDate' | 'status'>): string => {
    const bookingId = `BKG-${Math.floor(100 + Math.random() * 900)}`;
    const today = new Date().toISOString().split('T')[0];
    const newBooking: AmenityBooking = {
      ...bookingData,
      id: bookingId,
      bookingDate: today,
      status: 'Confirmed',
    };
    setBookings((prev) => [newBooking, ...prev]);
    return bookingId;
  };

  const cancelBooking = (id: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'Cancelled' } : b))
    );
  };

  const addTenantApplication = (
    appData: Omit<TenantApplication, 'id' | 'dateSubmitted' | 'policeVerificationStatus' | 'nocStatus'>
  ): string => {
    const appId = `TAPP-${Math.floor(100 + Math.random() * 900)}`;
    const today = new Date().toISOString().split('T')[0];
    const newApp: TenantApplication = {
      ...appData,
      id: appId,
      dateSubmitted: today,
      policeVerificationStatus: 'Pending Review',
      nocStatus: 'Pending',
    };
    setTenants((prev) => [newApp, ...prev]);
    return appId;
  };

  const updateTenantStatus = (
    id: string,
    nocStatus: TenantApplication['nocStatus'],
    policeStatus?: TenantApplication['policeVerificationStatus']
  ) => {
    setTenants((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              nocStatus,
              ...(policeStatus ? { policeVerificationStatus: policeStatus } : {}),
            }
          : t
      )
    );
  };

  const addTankerLog = (tankerData: Omit<WaterTankerLog, 'id' | 'status'>) => {
    const newTanker: WaterTankerLog = {
      ...tankerData,
      id: `TNK-${Math.floor(100 + Math.random() * 900)}`,
      status: 'Verified',
    };
    setTankers((prev) => [newTanker, ...prev]);
  };

  const updateInspectionItem = (
    day: number,
    itemId: number,
    status: string,
    remarks?: string,
    photoUrl?: string
  ) => {
    setInspections((prev) => {
      const existing = prev.find((rep) => rep.day === day);
      if (existing) {
        return prev.map((rep) =>
          rep.day === day
            ? {
                ...rep,
                items: rep.items.map((it) =>
                  it.id === itemId
                    ? {
                        ...it,
                        status,
                        ...(remarks !== undefined ? { remarks } : {}),
                        ...(photoUrl !== undefined ? { photoUrl } : {}),
                      }
                    : it
                ),
              }
            : rep
        );
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        const newReport: DailyInspectionReport = {
          day,
          date: todayStr,
          supervisorName: 'Supervisor Desk',
          verifiedByAdmin: '',
          adminComments: '',
          isSubmitted: false,
          isVerified: false,
          items: DEFAULT_33_ACTIVITIES.map((act) => ({
            id: act.id,
            category: act.category,
            activity: act.activity,
            status: act.id === itemId ? status : act.defaultStatus,
            remarks: act.id === itemId && remarks ? remarks : '',
            photoUrl: act.id === itemId && photoUrl ? photoUrl : undefined,
          })),
        };
        return [...prev, newReport];
      }
    });
  };

  const addInspectionSitePhoto = useCallback((day: number, photoUrl: string) => {
    setInspections((prev) =>
      prev.map((rep) => {
        if (rep.day === day) {
          const currentPhotos = rep.sitePhotos || [];
          return {
            ...rep,
            sitePhotos: currentPhotos.includes(photoUrl) ? currentPhotos : [...currentPhotos, photoUrl],
          };
        }
        return rep;
      })
    );
  }, []);

  const removeInspectionSitePhoto = useCallback((day: number, photoUrl: string) => {
    setInspections((prev) =>
      prev.map((rep) => {
        if (rep.day === day) {
          return {
            ...rep,
            sitePhotos: (rep.sitePhotos || []).filter((p) => p !== photoUrl),
          };
        }
        return rep;
      })
    );
  }, []);

  const setInspectionReportPdfUrl = useCallback((day: number, pdfUrl: string) => {
    setInspections((prev) =>
      prev.map((rep) => (rep.day === day ? { ...rep, pdfReportUrl: pdfUrl } : rep))
    );
  }, []);

  const uploadFileToStorage = useCallback(
    async (
      file: File | Blob,
      folder: 'avatars' | 'inspections' | 'reports',
      customName?: string
    ) => {
      return uploadToCHSStorage(file, folder, customName);
    },
    []
  );

  const addInspectionItem = (
    day: number,
    itemData: { category: any; activity: string; status?: string; remarks?: string; photoUrl?: string },
    applyToAllDays: boolean = false
  ) => {
    setInspections((prev) => {
      let maxId = 0;
      prev.forEach((r) => {
        r.items.forEach((it) => {
          if (it.id > maxId) maxId = it.id;
        });
      });
      const newItemId = maxId + 1;
      const newItem: InspectionItem = {
        id: newItemId,
        category: itemData.category || 'UTILITIES & INFRASTRUCTURE',
        activity: itemData.activity.trim(),
        status: itemData.status || 'Working OK',
        remarks: itemData.remarks || '',
        photoUrl: itemData.photoUrl,
      };

      const updated = applyToAllDays
        ? prev.map((r) => {
            const nextReport = { ...r, items: [...r.items, { ...newItem }] };
            saveInspectionToDb(nextReport).catch(() => {});
            return nextReport;
          })
        : prev.map((r) => {
            if (r.day === day) {
              const nextReport = { ...r, items: [...r.items, newItem] };
              saveInspectionToDb(nextReport).catch(() => {});
              return nextReport;
            }
            return r;
          });
      return updated;
    });
  };

  const editInspectionItem = (
    day: number,
    itemId: number,
    updates: { category?: any; activity?: string; status?: string; remarks?: string; photoUrl?: string },
    applyToAllDays: boolean = false
  ) => {
    setInspections((prev) => {
      const updated = applyToAllDays
        ? prev.map((r) => {
            const nextReport = {
              ...r,
              items: r.items.map((it) => (it.id === itemId ? { ...it, ...updates } : it)),
            };
            saveInspectionToDb(nextReport).catch(() => {});
            return nextReport;
          })
        : prev.map((r) => {
            if (r.day === day) {
              const nextReport = {
                ...r,
                items: r.items.map((it) => (it.id === itemId ? { ...it, ...updates } : it)),
              };
              saveInspectionToDb(nextReport).catch(() => {});
              return nextReport;
            }
            return r;
          });
      return updated;
    });
  };

  const removeInspectionItem = (
    day: number,
    itemId: number,
    applyToAllDays: boolean = false
  ) => {
    setInspections((prev) => {
      const updated = applyToAllDays
        ? prev.map((r) => {
            const nextReport = {
              ...r,
              items: r.items.filter((it) => it.id !== itemId),
            };
            saveInspectionToDb(nextReport).catch(() => {});
            return nextReport;
          })
        : prev.map((r) => {
            if (r.day === day) {
              const nextReport = {
                ...r,
                items: r.items.filter((it) => it.id !== itemId),
              };
              saveInspectionToDb(nextReport).catch(() => {});
              return nextReport;
            }
            return r;
          });
      return updated;
    });
  };

  const syncInspectionReport = useCallback((report: DailyInspectionReport) => {
    setInspections((prev) => {
      const exists = prev.some((r) => r.day === report.day);
      if (exists) {
        return prev.map((r) => (r.day === report.day ? { ...r, ...report } : r));
      }
      return [...prev, report];
    });
  }, []);

  const syncDayAttendance = useCallback((day: number, records: Record<number, AttendanceCode>) => {
    setAttendance((prev) => {
      const next = { ...prev };
      Object.entries(records).forEach(([srNoStr, code]) => {
        const srNo = Number(srNoStr);
        next[srNo] = {
          ...(next[srNo] || {}),
          [day]: code,
        };
      });
      return next;
    });
  }, []);

  const submitInspection = (day: number) => {
    const now = new Date();
    const timeStr = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setInspections((prev) =>
      prev.map((rep) =>
        rep.day === day
          ? {
              ...rep,
              isSubmitted: true,
              submittedAt: timeStr,
            }
          : rep
      )
    );
  };

  const verifyInspection = (day: number, verifiedByAdmin: string, adminComments: string) => {
    const now = new Date();
    const timeStr = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setInspections((prev) =>
      prev.map((rep) =>
        rep.day === day
          ? {
              ...rep,
              isVerified: true,
              verifiedByAdmin: verifiedByAdmin || userName,
              adminComments: adminComments || 'Inspected and verified by Estate Admin.',
              verifiedAt: timeStr,
            }
          : rep
      )
    );
  };

  const updateAttendance = (staffSrNo: number, day: number, code: AttendanceCode) => {
    setAttendance((prev) => ({
      ...prev,
      [staffSrNo]: {
        ...(prev[staffSrNo] || {}),
        [day]: code,
      },
    }));
  };

  const bulkMarkAttendance = (day: number, code: AttendanceCode) => {
    setAttendance((prev) => {
      const next: Record<number, Record<number, AttendanceCode>> = { ...prev };
      staffList.forEach((staff) => {
        next[staff.srNo] = {
          ...(next[staff.srNo] || {}),
          [day]: code,
        };
      });
      return next;
    });
  };

  const escalateChecklistToTicket = (itemId: number, activity: string, remarks: string): string => {
    let cat: ComplaintTicket['category'] = 'Other';
    if (activity.toLowerCase().includes('water') || activity.toLowerCase().includes('oht') || activity.toLowerCase().includes('leakage')) {
      cat = 'Water Supply';
    } else if (activity.toLowerCase().includes('pump') || activity.toLowerCase().includes('drainage') || activity.toLowerCase().includes('shaft')) {
      cat = 'Plumbing';
    } else if (activity.toLowerCase().includes('light') || activity.toLowerCase().includes('dg') || activity.toLowerCase().includes('electrical')) {
      cat = 'Electrical';
    } else if (activity.toLowerCase().includes('cctv') || activity.toLowerCase().includes('security') || activity.toLowerCase().includes('boom barrier')) {
      cat = 'Security & Access';
    } else if (activity.toLowerCase().includes('cleaning') || activity.toLowerCase().includes('garbage') || activity.toLowerCase().includes('sweeping')) {
      cat = 'Housekeeping';
    }

    const ticketId = addComplaint({
      flatNo: 'Common Estate',
      tower: 'Tower A',
      residentName: 'Facility Supervisor',
      residentType: 'Owner',
      phone: '+91 98220 54101',
      category: cat,
      priority: 'Urgent',
      description: `[Supervisor Daily Inspection Item #${itemId}] ${activity}: ${remarks || 'Defect flagged during daily walkthrough.'}`,
      assignedVendor: 'Estate Technical Team',
    });

    return ticketId;
  };

  return (
    <SocietyContext.Provider
      value={{
        role,
        setRole,
        isAuthenticated,
        isPendingApproval,
        isRejected,
        loginAsRole,
        logout,
        activeTab,
        setActiveTab,
        notices,
        complaints,
        bookings,
        tenants,
        tankers,
        tankCleanings,
        dgLogs,
        amcs,
        parkings,
        staffList,
        inspections,
        attendance,
        selectedInspectionDay,
        setSelectedInspectionDay,
        syncInspectionReport,
        syncDayAttendance,
        updateInspectionItem,
        addInspectionSitePhoto,
        removeInspectionSitePhoto,
        setInspectionReportPdfUrl,
        uploadFileToStorage,
        addInspectionItem,
        editInspectionItem,
        removeInspectionItem,
        submitInspection,
        verifyInspection,
        updateAttendance,
        bulkMarkAttendance,
        escalateChecklistToTicket,
        addComplaint,
        updateComplaintStatus,
        addBooking,
        cancelBooking,
        addTenantApplication,
        updateTenantStatus,
        addTankerLog,
        isEmergencyOpen,
        setIsEmergencyOpen,
        emergencyContacts,
        fetchEmergencyContacts,
        addEmergencyContact,
        updateEmergencyContact,
        deleteEmergencyContact,
        galleryItems,
        fetchGalleryItems,
        addGalleryItem,
        updateGalleryItem,
        deleteGalleryItem,
        isBookingModalOpen,
        setIsBookingModalOpen,
        isAiModalOpen,
        setIsAiModalOpen,
        isLoginModalOpen,
        setIsLoginModalOpen,
        loginModalTab,
        setLoginModalTab,
        openLoginModal,
        closeLoginModal,
        initialAiPrompt,
        openAiWithPrompt,
        targetAmenity,
        setTargetAmenity,
        userFlat,
        setUserFlat,
        userName,
        setUserName,
        currentMemberId,
        profiles,
        currentProfile,
        currentUserRoles,
        hasRole: checkHasRole,
        hasAnyRole: checkHasAnyRole,
        registerMember,
        addMemberProfile,
        updateMemberProfile,
        approveMemberProfile,
        updateUserRole,
        updateUserRoles,
        deleteMemberProfile,
        resetPasswordForEmail,
        adminResetPassword,
        addStaffMember,
        updateStaffMember,
        deleteStaffMember,
        maintenanceRecords,
        updateMaintenanceStatus,
        recordMaintenancePayment,
        sendMaintenanceReminder,
        auditLogs,
        vehicles,
        visitorPasses,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        bulkImportVehicles,
        issueVisitorPass,
        updateVisitorPassStatus,
        documents,
        addDocument,
        deleteDocument,
        vendors,
        quotes,
        workOrders,
        onboardVendor,
        updateVendor,
        deleteVendor,
        addVendorQuote,
        updateVendorQuote,
        deleteVendorQuote,
        approveQuoteAndReleaseWorkOrder,
        updateWorkOrder,
        deleteWorkOrder,
        approveWorkOrder,
        requestWorkOrderChanges,
        updateWorkOrderProgress,
        addWorkOrderPayment,
        defaultTermsAndConditions,
        updateDefaultTermsAndConditions,
        resetDefaultTermsAndConditions,
        adminUpdateTicket,
        adminUpdateBooking,
        adminUpdateTenantApp,
        filterOnlyMyFilings,
        setFilterOnlyMyFilings,
        polls,
        castVote,
        createPoll,
        closePoll,
        societyDetails,
        updateSocietyDetails,
        isSocietySettingsModalOpen,
        setIsSocietySettingsModalOpen,
        openSocietySettingsModal,
        closeSocietySettingsModal,
        managedSocieties,
        activeSociety,
        activeFlats,
        switchSociety,
        updateActiveSocietyConfig,
        addManagedSociety,
        deleteManagedSociety,
        exportSocietyConfigJson,
        importSocietyConfigJson,
        currencySymbol,
        supabaseUser,
        isSupabaseOnline,
        authLoading,
        signInWithSupabase,
        signUpWithSupabase,
        signOutWithSupabase,
      }}
    >
      {children}
    </SocietyContext.Provider>
  );
};

export const useSociety = () => {
  const context = useContext(SocietyContext);
  if (!context) {
    throw new Error('useSociety must be used within a SocietyProvider');
  }
  return context;
};
