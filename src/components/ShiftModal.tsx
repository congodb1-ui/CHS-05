import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { X, Truck, Upload, CheckCircle2, AlertTriangle, FileText, ArrowRight } from 'lucide-react';
import { TowerId } from '../types';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({ isOpen, onClose }) => {
  const { addTenantApplication, userFlat } = useSociety();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [ownerName, setOwnerName] = useState('');
  const [ownerTower, setOwnerTower] = useState<TowerId>('Tower A');
  const [ownerFlat, setOwnerFlat] = useState(userFlat || 'A-402');
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [leaseStartDate, setLeaseStartDate] = useState('');
  const [leaseDurationMonths, setLeaseDurationMonths] = useState(11);
  const [familyMembersCount, setFamilyMembersCount] = useState(2);
  const [elevatorShiftSlot, setElevatorShiftSlot] = useState('Slot 1: 11:00 AM – 02:00 PM (Afternoon)');
  const [policeDocName, setPoliceDocName] = useState('');
  const [vehicleCount, setVehicleCount] = useState(1);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPoliceDocName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = addTenantApplication({
      ownerName: ownerName.trim() || 'Flat Owner',
      ownerFlat: ownerFlat.trim() || 'A-402',
      ownerTower,
      tenantName: tenantName.trim() || 'Prospective Tenant',
      tenantPhone: tenantPhone.trim() || '+91 98000 00000',
      tenantEmail: tenantEmail.trim() || 'tenant@example.com',
      leaseStartDate: leaseStartDate || new Date().toISOString().split('T')[0],
      leaseDurationMonths: Number(leaseDurationMonths) || 11,
      familyMembersCount: Number(familyMembersCount) || 2,
      elevatorShiftSlot,
      policeVerificationDoc: policeDocName || 'Police_Ack_Form_Signed.pdf',
      vehicleCount: Number(vehicleCount) || 1,
    });
    setApplicationId(newId);
  };

  const handleResetAndClose = () => {
    setApplicationId(null);
    setStep(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-600 rounded-lg">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Tenant Onboarding & Move-In NOC</h2>
              <p className="text-xs text-slate-300">Solitaire CHS Managing Committee Clearance</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {applicationId ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto border border-teal-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
                Application Registered
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">Application #{applicationId}</h3>
              <p className="text-sm text-slate-600 mt-1">
                Tenant NOC request for <strong>{tenantName}</strong> ({ownerTower} - {ownerFlat}) has been queued for MC Secretary review.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-700 text-left space-y-2 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500">Reserved Shifting Slot:</span>
                <span className="font-semibold text-slate-900">{elevatorShiftSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Police Verification:</span>
                <span className="font-semibold text-amber-700">Uploaded for Verification</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Shifting Elevator Notice:</span>
                <span className="font-semibold text-teal-700">Service Lift 1 Reserved</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Please collect the shifting gate pass from the Society Estate Office on the morning of shifting.
            </p>

            <div className="pt-2">
              <button
                onClick={handleResetAndClose}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Return to Portal
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Steps indicator */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`font-semibold cursor-pointer ${step === 1 ? 'text-teal-700' : 'text-slate-400'}`}
              >
                1. Unit & Owner
              </button>
              <span className="text-slate-300">/</span>
              <button
                type="button"
                onClick={() => setStep(2)}
                className={`font-semibold cursor-pointer ${step === 2 ? 'text-teal-700' : 'text-slate-400'}`}
              >
                2. Tenant Profile
              </button>
              <span className="text-slate-300">/</span>
              <button
                type="button"
                onClick={() => setStep(3)}
                className={`font-semibold cursor-pointer ${step === 3 ? 'text-teal-700' : 'text-slate-400'}`}
              >
                3. Shifting & Police NOC
              </button>
            </div>

            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Tower</label>
                    <select
                      value={ownerTower}
                      onChange={(e) => setOwnerTower(e.target.value as TowerId)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Tower A">Tower A (Active)</option>
                      <option value="Tower B">Tower B (Active)</option>
                      <option value="Tower C">Tower C (Handover)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Flat / Unit Number</label>
                    <input
                      type="text"
                      required
                      value={ownerFlat}
                      onChange={(e) => setOwnerFlat(e.target.value)}
                      placeholder="e.g. A-402"
                      className="w-full text-xs p-2 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Registered Owner Name</label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Full name as per society share certificate"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                  <span>
                    Owner must have zero maintenance dues pending to obtain tenant move-in clearance.
                  </span>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <span>Next: Tenant Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Tenant Primary Name</label>
                  <input
                    type="text"
                    required
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    placeholder="Full legal name of primary leaseholder"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Mobile Phone</label>
                    <input
                      type="tel"
                      required
                      value={tenantPhone}
                      onChange={(e) => setTenantPhone(e.target.value)}
                      placeholder="+91 98000 00000"
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={tenantEmail}
                      onChange={(e) => setTenantEmail(e.target.value)}
                      placeholder="tenant@domain.com"
                      className="w-full text-xs p-2 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Lease Start</label>
                    <input
                      type="date"
                      required
                      value={leaseStartDate}
                      onChange={(e) => setLeaseStartDate(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Duration (Months)</label>
                    <input
                      type="number"
                      min="6"
                      max="36"
                      value={leaseDurationMonths}
                      onChange={(e) => setLeaseDurationMonths(parseInt(e.target.value) || 11)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Family Members</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={familyMembersCount}
                      onChange={(e) => setFamilyMembersCount(parseInt(e.target.value) || 2)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 tabular-nums"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <span>Next: Elevator & Police NOC</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Reserve Elevator Shifting Slot (Non-Peak Hours)
                  </label>
                  <select
                    value={elevatorShiftSlot}
                    onChange={(e) => setElevatorShiftSlot(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Slot 1: 11:00 AM – 02:00 PM (Afternoon)">
                      Slot 1: 11:00 AM – 02:00 PM (Permitted Non-Peak)
                    </option>
                    <option value="Slot 2: 02:00 PM – 05:00 PM (Late Afternoon)">
                      Slot 2: 02:00 PM – 05:00 PM (Permitted Non-Peak)
                    </option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    *Shifting strictly banned during morning (08:00–10:00 AM) and evening (06:00–08:30 PM) resident rush hours.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Vehicles to be Registered
                    </label>
                    <select
                      value={vehicleCount}
                      onChange={(e) => setVehicleCount(parseInt(e.target.value) || 1)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value={1}>1 Vehicle (Car / Bike)</option>
                      <option value={2}>2 Vehicles (1 Car + 1 Bike)</option>
                      <option value={0}>No Vehicle</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Police Verification Receipt
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="police-upload"
                      />
                      <label
                        htmlFor="police-upload"
                        className="w-full text-xs p-2 border border-dashed border-slate-300 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-50 text-slate-600 truncate"
                      >
                        <Upload className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                        <span className="truncate">
                          {policeDocName || 'Upload Challan / PDF'}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                  <p className="font-semibold text-slate-800 mb-0.5">Society Bye-Law Undertaking:</p>
                  <p>
                    I hereby confirm adherence to Society Bye-Laws regarding vehicle parking, waste segregation, and lift safety during furniture shifting.
                  </p>
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    Submit Move-In Clearance Request
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
