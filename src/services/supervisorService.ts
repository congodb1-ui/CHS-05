import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DailyInspectionReport, AttendanceCode, InspectionItem, StaffMember } from '../types';

/**
 * Operations Schema Row Definitions for Supabase PostgreSQL
 */
export interface SupabaseSupervisorInspectionRow {
  id?: string;
  day: number;
  date?: string;
  items: InspectionItem[];
  supervisor_name?: string;
  verified_by_admin?: string;
  admin_comments?: string;
  is_submitted?: boolean;
  is_verified?: boolean;
  submitted_at?: string | null;
  verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseStaffAttendanceRow {
  id?: string;
  staff_sr_no: number;
  day: number;
  attendance_code: AttendanceCode;
  marked_by?: string;
  marked_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseStaffMemberRow {
  id?: string;
  sr_no: number;
  name: string;
  team: string;
  role: string;
  shift: string;
  status: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Resilient schema query helper.
 * Tries the custom 'operations' schema first, and if unavailable or unconfigured,
 * seamlessly falls back to the standard 'public' schema in Supabase.
 */
async function executeTableQuery<T>(
  tableName: string,
  queryBuilder: (client: any) => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  // 1. Attempt operations schema
  try {
    const opClient = supabase.schema('operations');
    const res = await queryBuilder(opClient.from(tableName));
    if (!res.error) {
      return res;
    }
    // If error indicates schema/relation does not exist, fall through to public schema
    const msg = (res.error?.message || '').toLowerCase();
    if (msg.includes('schema') || msg.includes('relation') || msg.includes('does not exist') || msg.includes('not found')) {
      // Fallback
    } else {
      return res;
    }
  } catch (err) {
    // Continue to public schema fallback
  }

  // 2. Fallback to public schema
  try {
    const res = await queryBuilder(supabase.from(tableName));
    return res;
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Returns a Supabase client configured for the 'operations' schema
 */
export function getOperationsClient() {
  return supabase.schema('operations');
}

/**
 * Verifies Supabase connection status specifically for supervisor and attendance data
 */
export async function testSupabaseOperationsConnection(): Promise<{
  connected: boolean;
  message: string;
  details?: any;
}> {
  if (!isSupabaseConfigured) {
    return {
      connected: false,
      message: 'Supabase URL or Anon Key not provided. Local in-memory/localStorage storage is currently active.',
    };
  }

  try {
    // Test fetch
    const { error } = await executeTableQuery('supervisor_inspections', (q) =>
      q.select('day').limit(1)
    );

    if (error) {
      return {
        connected: false,
        message: `Connected to Supabase project, but supervisor_inspections table returned: ${error.message}`,
        details: error,
      };
    }

    return {
      connected: true,
      message: 'Successfully connected to Supabase Database (PostgreSQL). Real-time persistence is operational.',
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Connection test error: ${err?.message || 'Unknown network error'}`,
      details: err,
    };
  }
}

/**
 * Fetches the daily 33-point inspection checklist and verification status
 * for a specific day from supervisor_inspections
 */
export async function fetchInspectionByDay(day: number): Promise<DailyInspectionReport | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const { data, error } = await executeTableQuery<any>('supervisor_inspections', (q) =>
      q.select('*').eq('day', day).maybeSingle()
    );

    if (error) {
      console.warn(`[Supabase Operations] Error fetching inspection for day ${day}:`, error);
      return null;
    }

    if (!data) {
      return null;
    }

    const report: DailyInspectionReport = {
      day: data.day,
      date: data.date || new Date().toISOString().split('T')[0],
      items: Array.isArray(data.items) ? data.items : [],
      supervisorName: data.supervisor_name || 'Parvez (Facility Supervisor)',
      verifiedByAdmin: data.verified_by_admin || '',
      adminComments: data.admin_comments || '',
      isSubmitted: Boolean(data.is_submitted),
      isVerified: Boolean(data.is_verified),
      submittedAt: data.submitted_at || undefined,
      verifiedAt: data.verified_at || undefined,
    };

    return report;
  } catch (err: any) {
    console.warn(`[Supabase Operations] Exception fetching inspection for day ${day}:`, err);
    return null;
  }
}

/**
 * Fetches all supervisor inspection records from Supabase
 */
export async function fetchAllInspections(): Promise<DailyInspectionReport[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data, error } = await executeTableQuery<any[]>('supervisor_inspections', (q) =>
      q.select('*').order('day', { ascending: true })
    );

    if (error || !data || !Array.isArray(data)) {
      return [];
    }

    return data.map((d) => ({
      day: d.day,
      date: d.date || new Date().toISOString().split('T')[0],
      items: Array.isArray(d.items) ? d.items : [],
      supervisorName: d.supervisor_name || 'Parvez (Facility Supervisor)',
      verifiedByAdmin: d.verified_by_admin || '',
      adminComments: d.admin_comments || '',
      isSubmitted: Boolean(d.is_submitted),
      isVerified: Boolean(d.is_verified),
      submittedAt: d.submitted_at || undefined,
      verifiedAt: d.verified_at || undefined,
    }));
  } catch (err) {
    console.warn('[Supabase Operations] Exception fetching all inspections:', err);
    return [];
  }
}

/**
 * Upserts daily inspection report (items JSON, submission, and admin verification status)
 * into Supabase database (supervisor_inspections)
 */
export async function saveInspection(
  report: DailyInspectionReport
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    const payload = {
      day: report.day,
      date: report.date,
      items: report.items,
      supervisor_name: report.supervisorName,
      verified_by_admin: report.verifiedByAdmin || '',
      admin_comments: report.adminComments || '',
      is_submitted: report.isSubmitted,
      is_verified: report.isVerified,
      submitted_at: report.submittedAt || null,
      verified_at: report.verifiedAt || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await executeTableQuery('supervisor_inspections', (q) =>
      q.upsert(payload, { onConflict: 'day' }).select()
    );

    if (error) {
      console.warn(`[Supabase Operations] Error saving inspection for day ${report.day}:`, error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.warn(`[Supabase Operations] Exception saving inspection for day ${report.day}:`, err);
    return { success: false, error: err?.message || 'Failed to save inspection to Supabase' };
  }
}

/**
 * Fetches all attendance records for a specific day from staff_attendance
 */
export async function fetchAttendanceByDay(day: number): Promise<Record<number, AttendanceCode>> {
  if (!isSupabaseConfigured) {
    return {};
  }

  try {
    const { data, error } = await executeTableQuery<any[]>('staff_attendance', (q) =>
      q.select('staff_sr_no, attendance_code').eq('day', day)
    );

    if (error) {
      console.warn(`[Supabase Operations] Error fetching attendance for day ${day}:`, error);
      return {};
    }

    const attendanceMap: Record<number, AttendanceCode> = {};
    if (data && Array.isArray(data)) {
      data.forEach((row: any) => {
        if (typeof row.staff_sr_no === 'number') {
          attendanceMap[row.staff_sr_no] = row.attendance_code as AttendanceCode;
        }
      });
    }

    return attendanceMap;
  } catch (err: any) {
    console.warn(`[Supabase Operations] Exception fetching attendance for day ${day}:`, err);
    return {};
  }
}

/**
 * Fetches entire monthly staff attendance matrix from Supabase staff_attendance
 */
export async function fetchAllAttendance(): Promise<Record<number, Record<number, AttendanceCode>>> {
  if (!isSupabaseConfigured) {
    return {};
  }

  try {
    const { data, error } = await executeTableQuery<any[]>('staff_attendance', (q) =>
      q.select('staff_sr_no, day, attendance_code')
    );

    if (error || !data || !Array.isArray(data)) {
      return {};
    }

    const matrix: Record<number, Record<number, AttendanceCode>> = {};
    data.forEach((row) => {
      if (typeof row.staff_sr_no === 'number' && typeof row.day === 'number') {
        if (!matrix[row.staff_sr_no]) {
          matrix[row.staff_sr_no] = {};
        }
        matrix[row.staff_sr_no][row.day] = row.attendance_code as AttendanceCode;
      }
    });

    return matrix;
  } catch (err) {
    console.warn('[Supabase Operations] Exception fetching full attendance matrix:', err);
    return {};
  }
}

/**
 * Upserts a single staff member's attendance record in staff_attendance
 */
export async function updateStaffAttendance(
  staffSrNo: number,
  day: number,
  code: AttendanceCode,
  markedBy?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    const payload = {
      staff_sr_no: staffSrNo,
      day,
      attendance_code: code,
      marked_by: markedBy || 'Supervisor Parvez',
      marked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await executeTableQuery('staff_attendance', (q) =>
      q.upsert(payload, { onConflict: 'staff_sr_no,day' })
    );

    if (error) {
      console.warn(`[Supabase Operations] Error updating attendance for staff #${staffSrNo} day ${day}:`, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.warn(`[Supabase Operations] Exception updating attendance for staff #${staffSrNo} day ${day}:`, err);
    return { success: false, error: err?.message || 'Failed to update attendance' };
  }
}

/**
 * Bulk upserts attendance records for multiple staff members for a specific day
 */
export async function bulkMarkAttendance(
  day: number,
  staffSrNos: number[],
  code: AttendanceCode,
  markedBy?: string
): Promise<{ success: boolean; error?: string; count?: number }> {
  if (!isSupabaseConfigured) {
    return { success: true, count: staffSrNos.length };
  }

  try {
    const now = new Date().toISOString();
    const rows = staffSrNos.map((srNo) => ({
      staff_sr_no: srNo,
      day,
      attendance_code: code,
      marked_by: markedBy || 'Supervisor Parvez',
      marked_at: now,
      updated_at: now,
    }));

    const { error } = await executeTableQuery('staff_attendance', (q) =>
      q.upsert(rows, { onConflict: 'staff_sr_no,day' })
    );

    if (error) {
      console.warn(`[Supabase Operations] Error bulk updating attendance for day ${day}:`, error);
      return { success: false, error: error.message };
    }

    return { success: true, count: staffSrNos.length };
  } catch (err: any) {
    console.warn(`[Supabase Operations] Exception bulk updating attendance for day ${day}:`, err);
    return { success: false, error: err?.message || 'Failed to bulk update attendance' };
  }
}

/**
 * Fetches staff roster from Supabase staff_members table
 */
export async function fetchStaffDirectory(): Promise<StaffMember[] | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const { data, error } = await executeTableQuery<any[]>('staff_members', (q) =>
      q.select('*').order('sr_no', { ascending: true })
    );

    if (error || !data || data.length === 0) {
      return null;
    }

    return data.map((d) => ({
      srNo: d.sr_no,
      name: d.name,
      team: d.team,
      role: d.role,
      shift: d.shift,
      status: d.status,
      phone: d.phone,
    }));
  } catch (err) {
    console.warn('[Supabase Operations] Error fetching staff directory:', err);
    return null;
  }
}

/**
 * Upserts a staff member in Supabase
 */
export async function saveStaffMemberToDb(staff: StaffMember): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    const payload = {
      sr_no: staff.srNo,
      name: staff.name,
      team: staff.team,
      role: staff.role,
      shift: staff.shift,
      status: staff.status,
      phone: staff.phone || '',
      updated_at: new Date().toISOString(),
    };

    const { error } = await executeTableQuery('staff_members', (q) =>
      q.upsert(payload, { onConflict: 'sr_no' })
    );

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * Deletes a staff member from Supabase
 */
export async function deleteStaffMemberFromDb(srNo: number): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    const { error } = await executeTableQuery('staff_members', (q) =>
      q.delete().eq('sr_no', srNo)
    );

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * Pushes all current in-memory inspection reports and attendance matrix into Supabase
 */
export async function syncAllSupervisorDataToSupabase(
  reports: DailyInspectionReport[],
  attendanceMatrix: Record<number, Record<number, AttendanceCode>>,
  staffList: StaffMember[]
): Promise<{ success: boolean; message: string; details?: any }> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      message: 'Supabase credentials missing. Storing in local storage.',
    };
  }

  try {
    let reportsSynced = 0;
    let attendanceSynced = 0;
    let staffSynced = 0;

    // 1. Sync inspection reports
    for (const report of reports) {
      const res = await saveInspection(report);
      if (res.success) reportsSynced++;
    }

    // 2. Sync staff roster
    for (const staff of staffList) {
      const res = await saveStaffMemberToDb(staff);
      if (res.success) staffSynced++;
    }

    // 3. Sync attendance matrix
    const attendanceRows: any[] = [];
    const now = new Date().toISOString();
    Object.entries(attendanceMatrix).forEach(([srNoStr, daysMap]) => {
      const staffSrNo = Number(srNoStr);
      Object.entries(daysMap).forEach(([dayStr, code]) => {
        const day = Number(dayStr);
        if (code) {
          attendanceRows.push({
            staff_sr_no: staffSrNo,
            day,
            attendance_code: code,
            marked_by: 'Supervisor Parvez',
            marked_at: now,
            updated_at: now,
          });
        }
      });
    });

    if (attendanceRows.length > 0) {
      // Chunk in blocks of 100 for optimal Postgres performance
      for (let i = 0; i < attendanceRows.length; i += 100) {
        const chunk = attendanceRows.slice(i, i + 100);
        const { error } = await executeTableQuery('staff_attendance', (q) =>
          q.upsert(chunk, { onConflict: 'staff_sr_no,day' })
        );
        if (!error) {
          attendanceSynced += chunk.length;
        }
      }
    }

    return {
      success: true,
      message: `Synced to Supabase: ${reportsSynced} inspection reports, ${attendanceSynced} attendance records, and ${staffSynced} staff members!`,
      details: { reportsSynced, attendanceSynced, staffSynced },
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Sync failed: ${err?.message || 'Network exception'}`,
      details: err,
    };
  }
}
