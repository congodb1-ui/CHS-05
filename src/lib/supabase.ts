import { createClient } from '@supabase/supabase-js';
import {
  MemberProfile,
  VehicleRecord,
  WorkOrder,
  VendorQuote,
  SocietyUnit,
  EmergencyContact,
  SupabaseEmergencyContactRow,
  SocietyGalleryItem,
  SupabaseGalleryRow,
  SupabaseMemberRow,
  SupabaseUnitRow,
  SupabaseProcurementOrderRow,
  SupabaseWorkOrderRow,
  SupabaseVehicleRow,
} from '../types';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  rawSupabaseUrl &&
    rawSupabaseAnonKey &&
    rawSupabaseUrl !== 'https://your-project.supabase.co' &&
    rawSupabaseAnonKey !== 'your-anon-key'
);

if (!isSupabaseConfigured) {
  console.warn(
    '[Solitaire CHS · Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables are missing or placeholders. Using mock/local fallback state. To connect live PostgreSQL and Auth, set these in your .env file.'
  );
}

// Fallback safe placeholder strings so createClient does not crash the app bundle when env vars are unset
const supabaseUrl = rawSupabaseUrl || 'https://placeholder-solitaire.supabase.co';
const supabaseAnonKey = rawSupabaseAnonKey || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Mapping helpers between Supabase snake_case tables and Solitaire Frontend camelCase models

export function mapMemberRowToProfile(row: Partial<SupabaseMemberRow>): MemberProfile {
  const profileRoles = Array.isArray((row as any).roles)
    ? (row as any).roles
    : (row.role ? [row.role] : ['resident']);

  return {
    id: row.id || `usr-${Date.now()}`,
    memberId: row.member_id || (row as any).memberId || `SOL-${row.flat_no || 'GEN'}`,
    email: row.email || '',
    name: row.name || 'Resident',
    avatarUrl: row.avatar_url || (row as any).avatarUrl || '',
    tower: (row.tower as any) || 'Tower A',
    flatNo: row.flat_no || (row as any).flatNo || 'A-101',
    role: (row.role as any) || 'resident',
    roles: profileRoles,
    ownershipType: (row.ownership_type as any) || (row as any).ownershipType || 'Owner',
    phone: row.phone || '',
    isApproved: row.is_approved ?? (row as any).isApproved ?? false,
    status: (row.status as any) || ((row.is_approved ?? (row as any).isApproved) ? 'Approved' : 'Pending Approval'),
    registeredDate: row.registered_date || (row as any).registeredDate || new Date().toISOString().split('T')[0],
    approvedOrRejectedBy: row.approved_or_rejected_by || (row as any).approvedOrRejectedBy,
    reviewedAt: row.reviewed_at || (row as any).reviewedAt,
    reviewRemarks: row.review_remarks || (row as any).reviewRemarks,
  };
}

export function mapProfileToMemberRow(profile: MemberProfile): SupabaseMemberRow {
  return {
    id: profile.id,
    member_id: profile.memberId,
    email: profile.email,
    name: profile.name,
    avatar_url: profile.avatarUrl || '',
    tower: profile.tower,
    flat_no: profile.flatNo,
    role: profile.role,
    roles: profile.roles || [profile.role],
    ownership_type: profile.ownershipType,
    phone: profile.phone,
    is_approved: profile.isApproved,
    status: profile.status,
    registered_date: profile.registeredDate,
    approved_or_rejected_by: profile.approvedOrRejectedBy,
    reviewed_at: profile.reviewedAt,
    review_remarks: profile.reviewRemarks,
  };
}

export function mapVehicleRowToRecord(row: Partial<SupabaseVehicleRow>): VehicleRecord {
  return {
    id: row.id || `VEH-${Date.now()}`,
    flatNo: row.flat_no || (row as any).flatNo || 'A-101',
    ownerName: row.owner_name || (row as any).ownerName || 'Resident',
    vehicleType: (row.vehicle_type as any) || (row as any).vehicleType || '4-Wheeler',
    makeModel: row.make_model || (row as any).makeModel || '',
    licensePlate: row.license_plate || (row as any).licensePlate || '',
    rfidTagId: row.rfid_tag_id || (row as any).rfidTagId || '',
    parkingStickerNo: row.parking_sticker_no || (row as any).parkingStickerNo || '',
    parkingSlotNo: row.parking_slot_no || (row as any).parkingSlotNo || '',
    isEv: row.is_ev ?? (row as any).isEv ?? false,
    registeredDate: row.registered_date || (row as any).registeredDate || new Date().toISOString().split('T')[0],
  };
}

export function mapRecordToVehicleRow(rec: VehicleRecord): SupabaseVehicleRow {
  return {
    id: rec.id,
    flat_no: rec.flatNo,
    owner_name: rec.ownerName,
    vehicle_type: rec.vehicleType,
    make_model: rec.makeModel,
    license_plate: rec.licensePlate,
    rfid_tag_id: rec.rfidTagId,
    parking_sticker_no: rec.parkingStickerNo,
    parking_slot_no: rec.parkingSlotNo,
    is_ev: rec.isEv ?? false,
    registered_date: rec.registeredDate,
  };
}

export function mapWorkOrderRowToModel(row: Partial<SupabaseWorkOrderRow>): WorkOrder {
  return {
    id: row.id || `WO-${Date.now()}`,
    procurementTitle: row.procurement_title || (row as any).procurementTitle || 'Work Order',
    category: (row.category as any) || 'STP & Water',
    quoteId: row.quote_id || (row as any).quoteId,
    quoteNumber: row.quote_number || (row as any).quoteNumber,
    vendorId: row.vendor_id || (row as any).vendorId || 'VND-01',
    vendorName: row.vendor_name || (row as any).vendorName || 'Vendor',
    vendorContact: row.vendor_contact || (row as any).vendorContact || '',
    vendorGst: row.vendor_gst || (row as any).vendorGst || '',
    totalApprovedAmount: Number(row.total_approved_amount ?? (row as any).totalApprovedAmount ?? 0),
    startDate: row.start_date || (row as any).startDate || new Date().toISOString().split('T')[0],
    targetCompletionDate: row.target_completion_date || (row as any).targetCompletionDate || '',
    progressPercent: Number(row.progress_percent ?? (row as any).progressPercent ?? 0),
    scopeSummary: row.scope_summary || (row as any).scopeSummary || '',
    paymentTerms: row.payment_terms || (row as any).paymentTerms || '',
    approvalStatus: (row.approval_status as any) || (row as any).approvalStatus || 'Approved',
    workStatus: (row.work_status as any) || (row as any).workStatus || 'In Progress',
    releasedBy: row.released_by || (row as any).releasedBy || 'Managing Committee',
    releasedAt: row.released_at || (row as any).releasedAt || new Date().toISOString().split('T')[0],
    secretaryComments: row.secretary_comments || (row as any).secretaryComments,
    payments: Array.isArray(row.payments) ? row.payments : [],
    items: Array.isArray(row.items) ? row.items : [],
    subtotal: Number(row.subtotal ?? (row as any).subtotal ?? 0),
    taxAmount: Number(row.tax_amount ?? (row as any).taxAmount ?? 0),
  };
}

export function mapQuoteRowToModel(row: Partial<SupabaseProcurementOrderRow>): VendorQuote {
  const quotedAmount = Number(
    row.quoted_amount ??
      row.grand_total ??
      (row as any).quotedAmount ??
      (row as any).grandTotal ??
      0
  );
  return {
    id: row.id || `QT-${Date.now()}`,
    quoteNumber: row.quote_number || (row as any).quoteNumber,
    procurementProjectId: row.procurement_project_id || (row as any).procurementProjectId || 'PRJ-01',
    projectTitle: row.project_title || (row as any).projectTitle || 'Procurement',
    vendorId: row.vendor_id || (row as any).vendorId || 'VND-01',
    vendorName: row.vendor_name || (row as any).vendorName || 'Vendor',
    items: Array.isArray(row.items) ? row.items : [],
    subtotal: Number(row.subtotal ?? (row as any).subtotal ?? 0),
    gstPercent: Number(row.gst_percent ?? (row as any).gstPercent ?? 18),
    taxAmount: Number(row.tax_amount ?? (row as any).taxAmount ?? 0),
    grandTotal: quotedAmount,
    quotedAmount: quotedAmount,
    estimatedDays: Number(row.estimated_days ?? (row as any).estimatedDays ?? 14),
    warrantyMonths: Number(row.warranty_months ?? (row as any).warrantyMonths ?? 12),
    submittedDate: row.submitted_date || (row as any).submittedDate || new Date().toISOString().split('T')[0],
    scopeOfWork: row.scope_of_work || (row as any).scopeOfWork || '',
    status: (row.status as any) || 'Pending Review',
    committeeNotes: row.committee_notes || (row as any).committeeNotes,
  };
}

export function mapEmergencyContactRowToModel(row: Partial<SupabaseEmergencyContactRow>): EmergencyContact {
  return {
    id: row.id || `emg-${Date.now()}`,
    category: row.category || 'General Emergency',
    title: row.title || 'Emergency Contact',
    subtitle: row.subtitle || '',
    phone: row.phone || '',
    displayOrder: Number(row.display_order ?? 99),
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function mapEmergencyContactModelToRow(model: EmergencyContact): SupabaseEmergencyContactRow {
  return {
    id: model.id,
    category: model.category,
    title: model.title,
    subtitle: model.subtitle,
    phone: model.phone,
    display_order: model.displayOrder,
  };
}

export function mapGalleryRowToModel(row: Partial<SupabaseGalleryRow>): SocietyGalleryItem {
  return {
    id: row.id || `gal-${Date.now()}`,
    title: row.title || 'Society Image',
    description: row.description || '',
    imageUrl: row.image_url || '',
    category: row.category || 'Amenities',
    visibility: (row.visibility as any) === 'Private' ? 'Private' : 'Public',
    uploadedBy: row.uploaded_by || 'Estate Office',
    createdAt: row.created_at || new Date().toISOString().split('T')[0],
  };
}

export function mapGalleryModelToRow(model: SocietyGalleryItem): SupabaseGalleryRow {
  return {
    id: model.id,
    title: model.title,
    description: model.description,
    image_url: model.imageUrl,
    category: model.category || 'Amenities',
    visibility: model.visibility,
    uploaded_by: model.uploadedBy,
  };
}

export type StorageFolder = 'avatars' | 'inspections' | 'reports';

/**
 * Uploads local device files (PNG/JPEG/PDF) to Supabase Storage inside bucket 'CHS-Storage'
 * in the respective folder:
 *   - 'avatars': Profile / Avatar images
 *   - 'inspections': Inspection site photos
 *   - 'reports': Exported PDF reports
 *
 * Uses:
 *   supabase.storage.from('CHS-Storage').upload(`${folder}/${Date.now()}_${file.name}`, file)
 * Followed by obtaining the public URL via getPublicUrl().
 */
export async function uploadToCHSStorage(
  file: File | Blob,
  folder: StorageFolder,
  customName?: string
): Promise<{ success: boolean; publicUrl: string; error?: string }> {
  const fileName = customName || (file instanceof File ? file.name : `file_${Date.now()}`);
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${folder}/${Date.now()}_${sanitizedName}`;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.storage
        .from('CHS-Storage')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || (folder === 'reports' ? 'application/pdf' : 'image/jpeg'),
        });

      if (!error && data) {
        const { data: urlData } = supabase.storage
          .from('CHS-Storage')
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          return { success: true, publicUrl: urlData.publicUrl };
        }
      } else if (error) {
        console.warn(`[Supabase Storage CHS-Storage/${folder}] Upload failed:`, error.message);
      }
    } catch (err: any) {
      console.warn(`[Supabase Storage CHS-Storage/${folder}] Network exception:`, err);
    }
  }

  // Graceful browser fallback for offline/preview environments so application never crashes
  try {
    if (typeof URL !== 'undefined' && URL.createObjectURL) {
      const localUrl = URL.createObjectURL(file);
      return { success: true, publicUrl: localUrl };
    }
  } catch (err) {
    // fallback
  }

  return { success: false, publicUrl: '', error: 'Storage upload failed and local preview could not be generated.' };
}

export default supabase;
