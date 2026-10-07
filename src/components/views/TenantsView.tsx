import React, { useState } from 'react';
import { useSociety } from '../../context/SocietyContext';
import {
  KeyRound,
  FileCheck,
  Truck,
  Car,
  ShieldCheck,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  Search,
  Filter,
  AlertCircle,
  Download,
} from 'lucide-react';
import { ShiftModal } from '../ShiftModal';
import { TowerId } from '../../types';

export const TenantsView: React.FC = () => {
  const {
    tenants,
    updateTenantStatus,
    parkings,
    role,
    userFlat,
    filterOnlyMyFilings,
    setFilterOnlyMyFilings,
  } = useSociety();

  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'onboarding' | 'directory' | 'parking'>('onboarding');
  const [searchQuery, setSearchQuery] = useState('');
  const [towerFilter, setTowerFilter] = useState<'All' | TowerId>('All');

  // FastTag modal state
  const [showRfidModal, setShowRfidModal] = useState(false);
  const [rfidFlat, setRfidFlat] = useState('');
  const [rfidVehicleNum, setRfidVehicleNum] = useState('');
  const [rfidVehicleType, setRfidVehicleType] = useState('4 Wheeler (Car)');
  const [rfidSuccess, setRfidSuccess] = useState(false);

  const filteredTenants = tenants.filter((t) => {
    const matchesRLS =
      !filterOnlyMyFilings ||
      t.ownerFlat.toLowerCase().trim() === userFlat.toLowerCase().trim();

    const matchesSearch =
      t.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ownerFlat.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTower = towerFilter === 'All' || t.ownerTower === towerFilter;
    return matchesRLS && matchesSearch && matchesTower;
  });

  const handleRfidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRfidSuccess(true);
    setTimeout(() => {
      setRfidSuccess(false);
      setShowRfidModal(false);
      setRfidFlat('');
      setRfidVehicleNum('');
    }, 2000);
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Tenancy Governance & Access
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Tenant Management & Onboarding Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Standardized digital compliance for flat owners, incoming tenants, elevator shifting slot reservations, and vehicular parking stickers.
            </p>
          </div>
          <button
            onClick={() => setIsShiftModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Digital Move-In / NOC Request</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg max-w-md">
          <button
            onClick={() => setActiveTab('onboarding')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'onboarding'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Onboarding Workflow
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'directory'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tenant Verification Directory
          </button>
          <button
            onClick={() => setActiveTab('parking')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'parking'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Parking & RFID Passes
          </button>
        </div>
      </div>

      {/* Tab 1: Onboarding Workflow */}
      {activeTab === 'onboarding' && (
        <div className="space-y-8">
          {/* 3 Step Visual Card Flow */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">
              3-Step Flat Owner & Tenant Clearance Protocol
            </h2>
            <p className="text-xs text-slate-500">
              Adherence to Pune City Police Commissionerate directives and Solitaire CHS Bye-Law #43.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              {/* Step 1 */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                  01
                </div>
                <h3 className="text-base font-bold text-slate-900">Submit Tenant Details & Owner Undertaking</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Flat owner verifies zero maintenance arrears, registers primary tenant contacts, lease duration, and permanent address details.
                </p>
                <div className="text-[11px] text-teal-700 font-semibold pt-2 border-t border-slate-100 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Online Form via Portal</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                  02
                </div>
                <h3 className="text-base font-bold text-slate-900">Upload Police Verification PDF & Agreement</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Upload signed tenant verification receipt issued by local police station along with registered leave & license agreement copy.
                </p>
                <div className="text-[11px] text-teal-700 font-semibold pt-2 border-t border-slate-100 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Mandatory Statutory Document</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                  03
                </div>
                <h3 className="text-base font-bold text-slate-900">Reserve Service Elevator Shifting Slot</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Reserve dedicated Service Lift slot strictly between 11:00 AM – 04:00 PM to prevent passenger congestion during peak office hours.
                </p>
                <div className="text-[11px] text-teal-700 font-semibold pt-2 border-t border-slate-100 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Protective Lift Padding Fitted</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Banner */}
          <div className="p-6 bg-slate-900 rounded-xl text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-base font-bold">Ready to register a new tenant move-in?</h3>
              <p className="text-xs text-slate-300">
                Generate the official Society Move-In Gate Pass and reserve the freight lift instantly.
              </p>
            </div>
            <button
              onClick={() => setIsShiftModalOpen(true)}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              Start Move-In Application
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Tenant Verification Directory */}
      {activeTab === 'directory' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Tenant Verification & NOC Clearance Directory</h2>
              <p className="text-xs text-slate-500">
                Audited ledger of registered tenancy contracts and police verification certificates.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setFilterOnlyMyFilings(!filterOnlyMyFilings)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  filterOnlyMyFilings
                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
                title="Filter personal unit NOC requests vs all society records"
              >
                <span className={`w-2 h-2 rounded-full ${filterOnlyMyFilings ? 'bg-teal-600' : 'bg-slate-400'}`}></span>
                <span>{filterOnlyMyFilings ? `My Unit (${userFlat})` : 'All Society NOCs'}</span>
              </button>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search tenant or flat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:outline-teal-600 bg-slate-50 w-44"
                />
              </div>
              <select
                value={towerFilter}
                onChange={(e) => setTowerFilter(e.target.value as any)}
                className="text-xs p-1.5 rounded-lg border border-slate-200 bg-slate-50"
              >
                <option value="All">All Towers</option>
                <option value="Tower A">Tower A</option>
                <option value="Tower B">Tower B</option>
                <option value="Tower C">Tower C</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">App ID</th>
                  <th className="py-2.5 px-3">Unit / Flat</th>
                  <th className="py-2.5 px-3">Owner Details</th>
                  <th className="py-2.5 px-3">Tenant Profile</th>
                  <th className="py-2.5 px-3">Lease & Shifting</th>
                  <th className="py-2.5 px-3">Police Verification</th>
                  <th className="py-2.5 px-3">MC NOC Status</th>
                  {(role === 'secretary' || role === 'admin') && (
                    <th className="py-2.5 px-3 text-right">MC Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-slate-800">{t.id}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{t.ownerFlat}</span>
                      <span className="text-[11px] text-slate-500">{t.ownerTower}</span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">{t.ownerName}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{t.tenantName}</span>
                      <span className="text-[11px] text-slate-500">{t.tenantPhone}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 block tabular-nums">From {t.leaseStartDate}</span>
                      <span className="text-[11px] text-slate-500 truncate max-w-[140px] block">
                        Lift: {t.elevatorShiftSlot}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {t.policeVerificationStatus === 'Verified' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold">
                          <CheckCircle className="w-3 h-3" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-semibold">
                          <Clock className="w-3 h-3" />
                          <span>In Review</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {t.nocStatus === 'Approved' ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                          Approved
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                          Pending MC
                        </span>
                      )}
                    </td>
                    {(role === 'secretary' || role === 'admin') && (
                      <td className="py-3 px-3 text-right">
                        {t.nocStatus === 'Pending' ? (
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => updateTenantStatus(t.id, 'Approved', 'Verified')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold cursor-pointer"
                            >
                              Approve NOC
                            </button>
                            <button
                              onClick={() => updateTenantStatus(t.id, 'Rejected')}
                              className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-[10px] font-semibold cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Clearance Active</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Parking & RFID Passes */}
      {activeTab === 'parking' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Vehicle Parking Allocation & FastTag Directory</h2>
                <p className="text-xs text-slate-500">
                  Stilt, Basement 1 & Basement 2 designated parking bays mapped to apartment deeds.
                </p>
              </div>
              <button
                onClick={() => setShowRfidModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Car className="w-3.5 h-3.5" />
                <span>Apply for Vehicle RFID Sticker</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Parking Bays</span>
                <span className="text-lg font-bold text-slate-900 tabular-nums">180 Covered Bays</span>
                <span className="text-[11px] text-slate-500">Stilt & 2-tier Basement</span>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">RFID Boom Barrier</span>
                <span className="text-lg font-bold text-emerald-700">Gate A & Gate B Active</span>
                <span className="text-[11px] text-slate-500">Automatic FastTag recognition</span>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Allocated Demarcated Slots</span>
                <span className="text-lg font-bold text-slate-900 tabular-nums">200 Resident Bays</span>
                <span className="text-[11px] text-teal-700 font-medium">Stilt & 2-tier Basement</span>
              </div>
            </div>

            {/* Parking Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Slot Number</th>
                    <th className="py-2.5 px-3">Floor / Level</th>
                    <th className="py-2.5 px-3">Assigned Flat</th>
                    <th className="py-2.5 px-3">Tower</th>
                    <th className="py-2.5 px-3">Vehicle Class</th>
                    <th className="py-2.5 px-3">RFID Tag ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parkings.map((p) => (
                    <tr key={p.slotNo} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{p.slotNo}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">{p.level}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{p.flatAssigned}</td>
                      <td className="py-2.5 px-3 text-slate-600">{p.tower}</td>
                      <td className="py-2.5 px-3 text-slate-700">{p.vehicleType}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-teal-700">{p.rfidTagNo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RFID Sticker Request Modal */}
      {showRfidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Vehicle RFID Sticker Application</h3>
              <button
                onClick={() => setShowRfidModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {rfidSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center space-y-1 text-xs text-emerald-800">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-bold text-sm">RFID Pass Application Submitted</p>
                <p>Collect your encoded windshield tag from the Estate Office after 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleRfidSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Flat / Unit Number <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A-402"
                    value={rfidFlat}
                    onChange={(e) => setRfidFlat(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:border-red-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Vehicle License Plate No. <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH 12 AB 1234"
                    value={rfidVehicleNum}
                    onChange={(e) => setRfidVehicleNum(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono uppercase focus:border-red-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Vehicle Type <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    value={rfidVehicleType}
                    onChange={(e) => setRfidVehicleType(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:border-red-300 focus:outline-none"
                  >
                    <option value="4 Wheeler (Car)">4 Wheeler (Car / SUV)</option>
                    <option value="2 Wheeler (Bike)">2 Wheeler (Motorcycle / Scooter)</option>
                  </select>
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRfidModal(false)}
                    className="px-3 py-1.5 text-slate-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-teal-700 text-white rounded-lg font-semibold hover:bg-teal-800 transition-colors cursor-pointer"
                  >
                    Submit RFID Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Shift Modal */}
      <ShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
      />
    </div>
  );
};
