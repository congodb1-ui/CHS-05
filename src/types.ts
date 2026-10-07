export type UserRole =
  | 'public'
  | 'resident'
  | 'tenant'
  | 'supervisor'
  | 'mc_member'
  | 'admin'
  | 'secretary'
  // Legacy alias for full backward compatibility
  | 'member';

export const ROLE_LABELS: Record<string, string> = {
  public: 'Public (Unauthenticated)',
  resident: 'Resident (Owner)',
  tenant: 'Tenant',
  supervisor: 'Facility Supervisor',
  mc_member: 'MC Member',
  secretary: 'MC Secretary',
  admin: 'Society Admin',
  member: 'Resident',
};

export type TowerId = 'Tower A' | 'Tower B' | 'Tower C';

// Tower Specifications:
// Tower A: 6 Floors x 10 units = 60 Flats (A-101 to A-610)
// Tower B: 6 Floors x 10 units = 60 Flats (B-101 to B-610)
// Tower C: 8 Floors x 10 units = 80 Flats (C-101 to C-810)
// Total Society Units: 200 Flats
export const TOWER_UNIT_COUNTS: Record<TowerId, number> = {
  'Tower A': 60,
  'Tower B': 60,
  'Tower C': 80,
};
export const TOTAL_SOCIETY_UNITS = 200;

export const TOWER_A_FLATS: string[] = Array.from({ length: 6 }, (_, f) =>
  Array.from({ length: 10 }, (_, u) => `A-${(f + 1) * 100 + (u + 1)}`)
).flat();

export const TOWER_B_FLATS: string[] = Array.from({ length: 6 }, (_, f) =>
  Array.from({ length: 10 }, (_, u) => `B-${(f + 1) * 100 + (u + 1)}`)
).flat();

export const TOWER_C_FLATS: string[] = Array.from({ length: 8 }, (_, f) =>
  Array.from({ length: 10 }, (_, u) => `C-${(f + 1) * 100 + (u + 1)}`)
).flat();

// Predefined 200 society flats across Towers A (60), B (60), and C (80)
export const ALL_SOCIETY_FLATS: string[] = [
  ...TOWER_A_FLATS,
  ...TOWER_B_FLATS,
  ...TOWER_C_FLATS,
];

// Commercial Multi-Society Dynamic Building Schema
export interface BuildingConfig {
  id: string;
  name: string;          // e.g. 'Tower A', 'Tower B', 'Tower C', 'Wing D'
  shortCode: string;     // e.g. 'A', 'B', 'C', 'D'
  floors: number;        // e.g. 6, 6, 8
  flatsPerFloor: number; // e.g. 10, 10, 10
  totalFlats: number;    // e.g. 60, 60, 80
}

export function generateFlatsForBuildings(buildings: BuildingConfig[]): string[] {
  if (!buildings || buildings.length === 0) return ALL_SOCIETY_FLATS;
  const list: string[] = [];
  buildings.forEach((b) => {
    const code = b.shortCode || b.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'W';
    for (let f = 1; f <= b.floors; f++) {
      for (let u = 1; u <= b.flatsPerFloor; u++) {
        list.push(`${code}-${f * 100 + u}`);
      }
    }
  });
  return list;
}

// Helper to evaluate user roles array
export function getUserRoles(profile?: Partial<MemberProfile> | null, activeRole?: UserRole): string[] {
  const rolesSet = new Set<string>();
  if (activeRole && activeRole !== 'public') rolesSet.add(activeRole);
  if (profile?.role && profile.role !== 'public') rolesSet.add(profile.role);
  if (Array.isArray(profile?.roles)) {
    profile.roles.forEach((r) => {
      if (r) rolesSet.add(r);
    });
  }
  // Standardize aliases
  if (rolesSet.has('member')) rolesSet.add('resident');
  if (rolesSet.size === 0) rolesSet.add('public');
  return Array.from(rolesSet);
}

export function hasRole(
  profileOrRoles: Partial<MemberProfile> | string[] | null | undefined,
  targetRole: string,
  activeRole?: UserRole
): boolean {
  if (targetRole === 'public') return true;
  if (Array.isArray(profileOrRoles)) {
    if (profileOrRoles.includes(targetRole)) return true;
    if (targetRole === 'resident' && profileOrRoles.includes('member')) return true;
    return activeRole ? activeRole === targetRole : false;
  }
  const roles = getUserRoles(profileOrRoles, activeRole);
  if (roles.includes(targetRole)) return true;
  if (targetRole === 'resident' && roles.includes('member')) return true;
  return false;
}

export function hasAnyRole(
  profileOrRoles: Partial<MemberProfile> | string[] | null | undefined,
  targetRoles: string[],
  activeRole?: UserRole
): boolean {
  return targetRoles.some((tr) => hasRole(profileOrRoles, tr, activeRole));
}

// Supabase Units / Flats Schema Representation
export interface SocietyUnit {
  id: string;
  flatNo: string;
  flat_no?: string;
  tower: TowerId;
  floor: number;
  unitNumber: number;
  unit_number?: number;
  status: 'Occupied' | 'Vacant' | 'Owner' | 'Tenant';
  ownerName?: string;
  owner_name?: string;
  tenantName?: string;
  tenant_name?: string;
  contactPhone?: string;
  contact_phone?: string;
  createdAt?: string;
  created_at?: string;
}

// Emergency Contacts Dynamic Supabase Schema
export interface EmergencyContact {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  phone: string;
  displayOrder: number;
  createdAt?: string;
}

export interface SupabaseEmergencyContactRow {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  phone: string;
  display_order: number;
  created_at?: string;
}

// Society Photo Gallery Schema (Public vs Private Controls)
export interface SocietyGalleryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category?: string;
  visibility: 'Public' | 'Private';
  uploadedBy?: string;
  createdAt: string;
}

export interface SupabaseGalleryRow {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category?: string;
  visibility: 'Public' | 'Private' | string;
  uploaded_by?: string;
  created_at?: string;
}

// Supabase Database Row Types (exact table definitions for Supabase PostgreSQL)
export interface SupabaseMemberRow {
  id: string;
  member_id?: string;
  email: string;
  name: string;
  avatar_url?: string;
  avatarUrl?: string;
  tower: TowerId | string;
  flat_no: string;
  role: UserRole | string;
  roles?: string[];
  ownership_type: 'Owner' | 'Tenant' | string;
  phone: string;
  is_approved: boolean;
  status: 'Pending Approval' | 'Approved' | 'Rejected' | string;
  registered_date: string;
  approved_or_rejected_by?: string;
  reviewed_at?: string;
  review_remarks?: string;
  created_at?: string;
}

export interface SupabaseUnitRow {
  id: string;
  flat_no: string;
  tower: string;
  floor: number;
  unit_number: number;
  status: string;
  owner_name?: string;
  tenant_name?: string;
  contact_phone?: string;
  created_at?: string;
}

export interface SupabaseProcurementOrderRow {
  id: string;
  quote_number?: string;
  procurement_project_id: string;
  project_title: string;
  vendor_id: string;
  vendor_name: string;
  items?: QuoteLineItem[] | any;
  subtotal?: number;
  gst_percent?: number;
  tax_amount?: number;
  grand_total?: number;
  quoted_amount?: number;
  validity_date?: string;
  estimated_days?: number;
  warranty_months?: number;
  submitted_date?: string;
  scope_of_work?: string;
  pdf_proposal_url?: string;
  pdf_file_name?: string;
  status?: string;
  committee_notes?: string;
  created_at?: string;
}

export interface SupabaseWorkOrderRow {
  id: string;
  procurement_title: string;
  category: string;
  quote_id?: string;
  quote_number?: string;
  vendor_id: string;
  vendor_name: string;
  vendor_contact?: string;
  vendor_gst?: string;
  vendor_pan?: string;
  total_approved_amount: number;
  start_date: string;
  target_completion_date: string;
  progress_percent: number;
  scope_summary: string;
  payment_terms: string;
  approval_status: WorkOrderApprovalStatus | string;
  approving_user_id?: string;
  approved_at?: string;
  secretary_comments?: string;
  work_status: string;
  released_by: string;
  released_at: string;
  payments?: WorkOrderPayment[] | any;
  items?: QuoteLineItem[] | any;
  subtotal?: number;
  tax_amount?: number;
  created_at?: string;
}

export interface SupabaseVehicleRow {
  id: string;
  flat_no: string;
  owner_name: string;
  vehicle_type: string;
  make_model: string;
  license_plate: string;
  rfid_tag_id: string;
  parking_sticker_no: string;
  parking_slot_no: string;
  is_ev: boolean;
  registered_date: string;
  created_at?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  groundingSources?: Array<{ title: string; uri: string }>;
}

export interface StaffMember {
  srNo: number;
  name: string;
  team: 'Supervisor' | 'Office Admin' | 'Security' | 'Housekeeping' | 'Electrician' | 'Plumber' | string;
  role: string;
  shift: string;
  status: 'Active' | 'Inactive' | 'On Leave' | 'Reliever';
  phone?: string;
}

export type AttendanceCode = 'P' | 'A' | 'L' | 'HD' | 'WO' | '';

export interface InspectionItem {
  id: number;
  category: 'UTILITIES & INFRASTRUCTURE' | 'CLEANING & HYGIENE' | 'LIGHTS & SECURITY' | 'RENOVATION & MAINTENANCE';
  activity: string;
  status: string;
  remarks: string;
  photoUrl?: string;
}

export interface DailyInspectionReport {
  day: number;
  date: string;
  items: InspectionItem[];
  supervisorName: string;
  verifiedByAdmin: string;
  adminComments: string;
  isSubmitted: boolean;
  isVerified: boolean;
  submittedAt?: string;
  verifiedAt?: string;
  sitePhotos?: string[];
  pdfReportUrl?: string;
}

export interface AmenityBooking {
  id: string;
  amenityId: 'pool' | 'gym' | 'clubhouse' | 'play_area';
  amenityName: string;
  residentName: string;
  flatNo: string;
  tower: TowerId;
  date: string;
  timeSlot: string;
  guestsCount: number;
  status: 'Confirmed' | 'Pending Review' | 'Cancelled';
  bookingDate: string;
  purpose?: string;
}

export interface ComplaintTicket {
  id: string;
  flatNo: string;
  tower: TowerId;
  residentName: string;
  residentType: 'Owner' | 'Tenant';
  phone: string;
  category: 'Plumbing' | 'Electrical' | 'Lift / Elevator' | 'STP & Drainage' | 'Water Supply' | 'Security & Access' | 'Housekeeping' | 'Other';
  priority: 'Low' | 'Normal' | 'Urgent' | 'Critical Emergency';
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  createdAt: string;
  resolutionNotes?: string;
  assignedVendor?: string;
  estimatedCost?: number;
}

export interface TenantApplication {
  id: string;
  ownerName: string;
  ownerFlat: string;
  ownerTower: TowerId;
  tenantName: string;
  tenantPhone: string;
  tenantEmail: string;
  leaseStartDate: string;
  leaseDurationMonths: number;
  familyMembersCount: number;
  elevatorShiftSlot: string;
  policeVerificationDoc: string;
  policeVerificationStatus: 'Verified' | 'Pending Review' | 'Not Submitted';
  nocStatus: 'Approved' | 'Pending' | 'Rejected';
  dateSubmitted: string;
  vehicleCount: number;
}

export interface WaterTankerLog {
  id: string;
  date: string;
  time: string;
  vendor: string;
  capacityLiters: number;
  cost: number;
  source: 'Municipal Line Shortfall' | 'Borewell Assist' | 'Scheduled Buffer';
  receivedByGuard: string;
  status: 'Verified' | 'Pending Verification';
}

export interface TankCleaningRecord {
  id: string;
  tankName: string;
  type: 'Overhead Tank' | 'Underground Sump' | 'STP Treated Tank';
  tower: string;
  capacityLiters: number;
  lastCleaned: string;
  nextScheduled: string;
  contractor: string;
  tdsReading: number;
  phValue: number;
  bacteriologicalTest: 'Safe / Compliant' | 'Follow-up Needed';
  certificateId: string;
}

export interface DGRunLog {
  id: string;
  date: string;
  outageCause: string;
  durationMinutes: number;
  dieselConsumedLiters: number;
  fuelLevelAfterPercent: number;
  loggedBy: string;
}

export interface AMCContract {
  id: string;
  serviceName: string;
  category: 'Lifts' | 'STP Chemical' | 'DG Backup' | 'Swimming Pool' | 'Fire Safety' | 'Security Systems';
  vendorCompany: string;
  contactPerson: string;
  phone: string;
  startDate: string;
  expiryDate: string;
  annualFee: number;
  status: 'Active' | 'Expiring Soon' | 'In Renewal';
  frequency: string;
}

export interface SocietyNotice {
  id: string;
  title: string;
  date: string;
  category: 'General' | 'Maintenance' | 'Water' | 'Governance';
  summary: string;
  isPinned: boolean;
  urgent: boolean;
}

export interface ParkingSlot {
  slotNo: string;
  tower: TowerId;
  level: 'Stilt' | 'Basement 1' | 'Basement 2';
  flatAssigned: string;
  vehicleType: '4 Wheeler (Car)' | '2 Wheeler (Bike)' | 'EV (4 Wheeler)' | 'EV (2 Wheeler)';
  vehicleNumber?: string;
  vehicleModel?: string;
  isEv?: boolean;
  rfidTagNo: string;
  status: 'Allocated' | 'Available' | 'Visitor / Guest';
  allocatedDate?: string;
  ownerName?: string;
}

export interface VehicleRecord {
  id: string;
  flatNo: string; // Dropdown selector from predefined list (A-101 to B-1504)
  flat_no?: string;
  ownerName: string;
  owner_name?: string;
  vehicleType: '4-Wheeler' | '2-Wheeler' | string;
  vehicle_type?: string;
  makeModel: string;
  make_model?: string;
  licensePlate: string;
  license_plate?: string;
  rfidTagId: string;
  rfid_tag_id?: string;
  parkingStickerNo: string;
  parking_sticker_no?: string;
  parkingSlotNo: string;
  parking_slot_no?: string;
  isEv?: boolean;
  is_ev?: boolean;
  registeredDate: string;
  registered_date?: string;
}

export interface VisitorParkingPass {
  id: string;
  passNumber: string;
  guestName: string;
  guestPhone: string;
  vehicleNumber: string;
  vehicleType: 'Car' | 'Bike';
  hostFlat: string;
  hostName: string;
  assignedSlot: string;
  entryTime: string;
  validUntil: string;
  status: 'Active' | 'Exited' | 'Expired';
}

export interface MemberProfile {
  id: string;
  memberId: string; // e.g. SOL-A-402
  member_id?: string;
  email: string;
  name: string;
  avatarUrl?: string;
  avatar_url?: string;
  tower: TowerId;
  flatNo: string;
  flat_no?: string;
  role: UserRole;
  roles?: string[]; // Multi-role support, e.g. ['resident', 'mc_member', 'secretary']
  ownershipType: 'Owner' | 'Tenant';
  ownership_type?: 'Owner' | 'Tenant' | string;
  phone: string;
  isApproved: boolean; // default false
  is_approved?: boolean;
  status: 'Pending Approval' | 'Approved' | 'Rejected';
  registeredDate: string;
  registered_date?: string;
  approvedOrRejectedBy?: string;
  approved_or_rejected_by?: string;
  reviewedAt?: string;
  reviewed_at?: string;
  reviewRemarks?: string;
  review_remarks?: string;
  parkingSlot?: string;
  twoWheelerSlot?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  temporaryPassword?: string;
}

// Maintenance & Dues Schema
export interface MaintenanceLedgerEntry {
  id: string;
  month: string; // e.g. "October 2026"
  billingCycle: string; // "2026-10"
  flatNo: string;
  tower: TowerId;
  floor: number;
  residentName: string;
  ownershipType: 'Owner' | 'Tenant';
  amountDue: number; // e.g. 4250
  amountPaid: number;
  status: 'Paid' | 'Unpaid' | 'Overdue';
  paymentStatus?: 'Paid' | 'Unpaid' | 'Overdue';
  dueDate: string;
  paidDate?: string;
  paymentMode?: 'UPI' | 'NEFT / RTGS' | 'Cheque' | 'Cash';
  utrNumber?: string;
  receiptNumber?: string;
  receiptUrl?: string;
  lateFee?: number;
  breakdown?: {
    maintenance: number;
    sinkingFund: number;
    waterCharges: number;
    gstAmount: number;
  };
  notes?: string;
}

export interface ApprovalAuditEntry {
  id: string;
  userId: string;
  userName: string;
  flatNo: string;
  action: 'Approved' | 'Rejected' | 'Role Changed' | 'Registration Requested' | 'Profile Modified';
  performedBy: string;
  performedByRole: string;
  timestamp: string;
  details: string;
}

export interface SocietyDocument {
  id: string;
  title: string;
  category: 'Bye-Laws & Governance' | 'Meeting Minutes (AGM/MC)' | 'Audit Reports & Financials' | 'AMC Agreements' | 'Circulars & Notices';
  documentNumber?: string;
  fileSize: string;
  uploadedAt: string;
  uploadedBy: string;
  fileUrl: string;
  isRestrictedToMC: boolean;
  tags: string[];
  description?: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: 'STP & Water' | 'Elevators / Lifts' | 'Electrical & DG' | 'Civil Works & Painting' | 'Fire & Safety' | 'Security Systems' | 'Housekeeping' | 'Plumbing' | 'Electrical';
  contactPerson: string;
  phone: string;
  email: string;
  gstNumber: string;
  panNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  registeredAddress?: string;
  complianceDocUrl?: string;
  rating: number;
  registeredDate?: string;
  contractStatus?: 'Active' | 'Under Review' | 'Blacklisted' | 'Inactive';
  rateCards?: string;
  notes?: string;
}

export interface QuoteLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface VendorQuote {
  id: string;
  quoteNumber?: string;
  procurementProjectId: string;
  projectTitle: string;
  vendorId: string;
  vendorName: string;
  items?: QuoteLineItem[];
  subtotal?: number;
  gstPercent?: number; // e.g. 18
  taxAmount?: number;
  grandTotal?: number;
  quotedAmount: number; // alias for backwards compatibility
  validityDate?: string;
  estimatedDays: number;
  warrantyMonths: number;
  submittedDate: string;
  scopeOfWork: string;
  pdfProposalUrl?: string;
  pdfFileName?: string;
  status: 'Pending Review' | 'Selected' | 'Rejected';
  committeeNotes?: string;
  termsAndConditions?: string[];
  attachedTerms?: string;
}

export type PaymentStage = 'Advance' | 'Milestone 1' | 'Milestone 2' | 'Final Settlement';
export type PaymentStatus = 'Unpaid' | 'Partially Paid' | 'Fully Paid';
export type WorkOrderApprovalStatus =
  | 'Draft'
  | 'Pending_Secretary_Approval'
  | 'Approved'
  | 'Changes_Requested'
  | 'Issued_To_Vendor';

export interface WorkOrderPayment {
  id: string;
  workOrderId: string;
  paymentDate: string;
  paymentType: PaymentStage;
  amountPaid: number;
  paymentMode: 'NEFT / RTGS' | 'Cheque' | 'Society Bank Portal';
  referenceUtr: string;
  approvedBy: string;
  notes?: string;
}

export interface WorkOrder {
  id: string; // e.g. WO-2026-001
  procurementTitle: string;
  category: 'STP & Water' | 'Lifts / Elevators' | 'Electrical & DG' | 'Civil Works' | 'Security & CCTV' | 'Fire Safety' | 'Housekeeping';
  quoteId?: string;
  quoteNumber?: string;
  vendorId: string;
  vendorName: string;
  vendorContact: string;
  vendorGst: string;
  vendorPan?: string;
  bankDetails?: {
    bankName?: string;
    accountNumber: string;
    ifscCode: string;
  };
  items?: QuoteLineItem[];
  subtotal?: number;
  gstPercent?: number;
  taxAmount?: number;
  totalApprovedAmount: number; // Grand total including GST
  startDate: string;
  targetCompletionDate: string;
  progressPercent: number; // 0 to 100
  scopeSummary: string;
  paymentTerms: string;
  approvalStatus: WorkOrderApprovalStatus;
  approvingUserId?: string;
  approvedAt?: string;
  secretaryComments?: string;
  workStatus: 'Scheduled' | 'In Progress' | 'Inspection Stage' | 'Completed' | 'On Hold';
  releasedBy: string;
  releasedAt: string;
  payments: WorkOrderPayment[];
  title?: string;
  scopeOfWork?: string;
  agreedAmount?: number;
  priority?: 'Normal' | 'Urgent' | 'Critical';
  termsAndConditions?: string[];
  warrantyMonths?: number;
  penaltyClause?: string;
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
  color?: string;
}

export interface CommunityPoll {
  id: string;
  title: string;
  description: string;
  category: 'Infrastructure & Utilities' | 'Amenities & Energy' | 'Society Rules & Security' | 'Finance & Common Dues' | 'Green Living';
  options: PollOption[];
  totalVotes: number;
  quorumTarget: number; // e.g. 60 flats required for resolution (50% of 120 flats)
  startDate: string;
  endDate: string;
  status: 'Active' | 'Concluded';
  createdByRole: string;
  votedFlats: string[]; // List of flat numbers that have cast a vote
  userVotes?: Record<string, string>; // flatNo -> optionId mapping
  resolutionSummary?: string;
}

export interface SocietyProfileDetails {
  name: string;
  societyRegNo: string;
  reraRegNo?: string;
  act: string;
  addressLine: string;
  landmark: string;
  subLocality: string;
  city: string;
  state: string;
  pincode: string;
  fullAddress: string;
  totalUnits: number;
  activeTowers: string[];
  totalFloors?: number;
  landArea?: string;
  logoUrl?: string;
  supportHelplinePhone?: string;
  securityGatePhone: string;
  estateOfficePhone: string;
  officialEmail: string;
  agmDateNotice?: string;
  bankName: string;
  bankAccountNo: string;
  bankIFSC: string;
  maintenancePerSqFt: number;
  workOrderDefaults?: {
    defaultTerms: string[];
    defaultGstPercent: number;
    approvalThresholdAmount: number;
  };
  registrationRules?: {
    enforceOneMemberPerFlat: boolean;
    autoApproveOwners: boolean;
    defaultTowers: string[];
  };
  slaSettings?: {
    ticketStatuses: string[];
    priorityLevels: string[];
    defaultTechnicianRole: string;
  };
  announcementBanner?: {
    enabled: boolean;
    message: string;
    type: 'info' | 'warning' | 'alert';
  };
}

export type SocietyThemeColor = 'teal' | 'indigo' | 'emerald' | 'blue' | 'slate' | 'amber';

export interface SocietyCustomizationConfig {
  id: string;
  name: string;
  commercialTagline: string;
  societyRegNo: string;
  reraRegNo?: string;
  act: string;
  currencySymbol: string; // '₹', '$', '€', 'AED', '£'
  currencyCode: string;   // 'INR', 'USD', 'EUR', 'AED'
  themeColor: SocietyThemeColor;
  addressLine: string;
  landmark?: string;
  subLocality: string;
  city: string;
  state: string;
  pincode: string;
  fullAddress: string;
  totalUnits: number;
  logoUrl?: string;
  supportHelplinePhone?: string;
  securityGatePhone: string;
  estateOfficePhone: string;
  officialEmail: string;
  bankName: string;
  bankAccountNo: string;
  bankIFSC: string;
  bankUpiVpa?: string;
  maintenancePerFlatFixed: number;
  maintenancePerSqFt: number;
  maintenanceFormula: 'fixed_per_flat' | 'per_sqft' | 'hybrid';
  dueDayOfMonth: number;
  lateFeePercent: number;
  buildings: BuildingConfig[];
  enabledModules: {
    maintenanceLedger: boolean;
    smartParking: boolean;
    visitorSecurity: boolean;
    supervisorInspection: boolean;
    amenitiesBooking: boolean;
    helpdeskTickets: boolean;
    residentRegistry: boolean;
    procurementWorkOrders: boolean;
    societyGallery: boolean;
    digitalDocuments: boolean;
    governancePolls: boolean;
  };
  planTier: 'Enterprise Commercial' | 'Multi-Society Pro' | 'Community Standard';
  saasLicenseKey?: string;
  status: 'active' | 'trial' | 'maintenance';
}


