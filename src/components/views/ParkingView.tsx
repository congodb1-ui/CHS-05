import React, { useState, useMemo } from 'react';
import { useSociety } from '../../context/SocietyContext';
import {
  VehicleRecord,
  VisitorParkingPass,
  ALL_SOCIETY_FLATS,
} from '../../types';
import {
  Car,
  Search,
  Plus,
  Download,
  Upload,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Filter,
  Trash2,
  Edit2,
  AlertCircle,
  FileSpreadsheet,
  QrCode,
  Tag,
  MapPin,
  X,
  Radio,
} from 'lucide-react';

export const ParkingView: React.FC = () => {
  const {
    vehicles,
    visitorPasses,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    bulkImportVehicles,
    issueVisitorPass,
    updateVisitorPassStatus,
    role,
    userFlat,
    userName,
    isPendingApproval,
  } = useSociety();

  const [activeSubTab, setActiveSubTab] = useState<'grid' | 'vehicles' | 'visitors' | 'allocation'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [towerFilter, setTowerFilter] = useState<'All' | 'Tower A' | 'Tower B'>('All');

  // Modals state
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showIssuePassModal, setShowIssuePassModal] = useState(false);
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvError, setCsvError] = useState('');
  const [csvSuccess, setCsvSuccess] = useState('');

  // Admin Edit Vehicle Modal state
  const [editingVehicle, setEditingVehicle] = useState<VehicleRecord | null>(null);
  const [vehicleEditForm, setVehicleEditForm] = useState<Partial<VehicleRecord>>({});

  // Selected slot for detail modal or assignment
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // New Vehicle form state
  const [newFlat, setNewFlat] = useState(ALL_SOCIETY_FLATS[0]);
  const [newOwner, setNewOwner] = useState(userName || '');
  const [newType, setNewType] = useState<VehicleRecord['vehicleType']>('4-Wheeler');
  const [newMake, setNewMake] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newRfid, setNewRfid] = useState('');
  const [newSticker, setNewSticker] = useState('');
  const [newSlot, setNewSlot] = useState('P-A-101');

  // New Visitor Pass form state
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestPlate, setGuestPlate] = useState('');
  const [guestVehicleType, setGuestVehicleType] = useState<'Car' | 'Bike'>('Car');
  const [hostFlat, setHostFlat] = useState(userFlat || 'A-402');
  const [hostName, setHostName] = useState(userName || 'Resident');
  const [assignedVisitorSlot, setAssignedVisitorSlot] = useState('P-VIS-01');
  const [passDuration, setPassDuration] = useState('4 hours');

  // Allocation form state
  const [allocFlat, setAllocFlat] = useState(ALL_SOCIETY_FLATS[0]);
  const [allocResidentName, setAllocResidentName] = useState('');
  const [allocSlotNo, setAllocSlotNo] = useState('P-A-101');

  // Generate Slots Grid Data
  // Tower A slots: P-A-101 to P-A-130
  // Tower B slots: P-B-101 to P-B-130
  // Visitor slots: P-VIS-01 to P-VIS-10
  const allGridSlots = useMemo(() => {
    const slots = [];
    // Tower A
    for (let i = 101; i <= 130; i++) {
      slots.push({
        slotNo: `P-A-${i}`,
        tower: 'Tower A',
      });
    }
    // Tower B
    for (let i = 101; i <= 130; i++) {
      slots.push({
        slotNo: `P-B-${i}`,
        tower: 'Tower B',
      });
    }
    return slots;
  }, []);

  const visitorSlots = ['P-VIS-01', 'P-VIS-02', 'P-VIS-03', 'P-VIS-04', 'P-VIS-05', 'P-VIS-06', 'P-VIS-07', 'P-VIS-08', 'P-VIS-09', 'P-VIS-10'];

  // Map vehicles to slots
  const slotOccupancyMap = useMemo(() => {
    const map = new Map<string, VehicleRecord>();
    vehicles.forEach((v) => {
      if (v.parkingSlotNo) {
        map.set(v.parkingSlotNo.trim().toUpperCase(), v);
      }
    });
    return map;
  }, [vehicles]);

  // Map active visitor passes to slots
  const visitorOccupancyMap = useMemo(() => {
    const map = new Map<string, VisitorParkingPass>();
    visitorPasses
      .filter((p) => p.status === 'Active')
      .forEach((p) => {
        if (p.assignedSlot) {
          map.set(p.assignedSlot.trim().toUpperCase(), p);
        }
      });
    return map;
  }, [visitorPasses]);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesSearch =
        v.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.flatNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.parkingSlotNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.rfidTagId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        typeFilter === 'All' ||
        (typeFilter === '4-Wheeler' && v.vehicleType.includes('4-Wheeler')) ||
        (typeFilter === '2-Wheeler' && v.vehicleType.includes('2-Wheeler'));

      const matchesTower =
        towerFilter === 'All' ||
        (towerFilter === 'Tower A' && v.flatNo.startsWith('A-')) ||
        (towerFilter === 'Tower B' && v.flatNo.startsWith('B-'));

      return matchesSearch && matchesType && matchesTower;
    });
  }, [vehicles, searchQuery, typeFilter, towerFilter]);

  // Quick stats
  const totalAllocated = vehicles.length;
  const rfidIssuedCount = vehicles.filter((v) => Boolean(v.rfidTagId)).length;
  const activeVisitors = visitorPasses.filter((vp) => vp.status === 'Active').length;

  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate.trim()) return;

    addVehicle({
      flatNo: newFlat,
      ownerName: newOwner || 'Resident',
      vehicleType: newType,
      makeModel: newMake || 'Standard Sedan/Hatchback',
      licensePlate: newPlate.toUpperCase(),
      rfidTagId: newRfid || `FASTAG-${newFlat.replace('-', '')}-${Date.now().toString().slice(-4)}`,
      parkingStickerNo: newSticker || `SOL-STK-${Date.now().toString().slice(-4)}`,
      parkingSlotNo: newSlot.toUpperCase(),
    });

    setShowAddVehicleModal(false);
    setNewMake('');
    setNewPlate('');
    setNewRfid('');
    setNewSticker('');
  };

  const handleIssuePass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestPlate.trim()) return;

    const now = new Date();
    const entryTime = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const validUntil = new Date(now.getTime() + 4 * 3600 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    issueVisitorPass({
      passNumber: `VIS-${Date.now().toString().slice(-4)}`,
      guestName,
      guestPhone: guestPhone || '+91 98000 00000',
      vehicleNumber: guestPlate.toUpperCase(),
      vehicleType: guestVehicleType,
      hostFlat,
      hostName,
      assignedSlot: assignedVisitorSlot,
      entryTime,
      validUntil: `${entryTime.split(' ')[0]} ${validUntil} (${passDuration})`,
    });

    setShowIssuePassModal(false);
    setGuestName('');
    setGuestPhone('');
    setGuestPlate('');
  };

  // CSV Export
  const handleExportCsv = () => {
    const headers = ['Flat Number', 'Owner/Tenant Name', 'Vehicle Type', 'Make & Model', 'License Plate', 'RFID Tag ID', 'Parking Sticker #', 'Allocated Slot #', 'Registered Date'];
    const rows = vehicles.map((v) => [
      `"${v.flatNo}"`,
      `"${v.ownerName}"`,
      `"${v.vehicleType}"`,
      `"${v.makeModel}"`,
      `"${v.licensePlate}"`,
      `"${v.rfidTagId}"`,
      `"${v.parkingStickerNo}"`,
      `"${v.parkingSlotNo}"`,
      `"${v.registeredDate}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `solitaire_society_vehicles_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import
  const handleImportCsv = () => {
    setCsvError('');
    setCsvSuccess('');

    if (!csvText.trim()) {
      setCsvError('Please paste valid CSV contents.');
      return;
    }

    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        setCsvError('CSV must contain a header line and at least one data row.');
        return;
      }

      const importedList: Omit<VehicleRecord, 'id' | 'registeredDate'>[] = [];

      // skip header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',').map((c) => c.replace(/^["']|["']$/g, '').trim());

        if (cols.length >= 5) {
          const flat = cols[0] || 'A-101';
          const owner = cols[1] || 'Resident';
          const typeStr = cols[2] || '4-Wheeler';
          const make = cols[3] || 'Vehicle';
          const plate = cols[4] || 'MH 12 AB 0000';
          const rfid = cols[5] || `FASTAG-${flat.replace('-', '')}`;
          const sticker = cols[6] || `SOL-STK-${i}`;
          const slot = cols[7] || `P-A-${100 + i}`;

          importedList.push({
            flatNo: flat,
            ownerName: owner,
            vehicleType: typeStr as any,
            makeModel: make,
            licensePlate: plate.toUpperCase(),
            rfidTagId: rfid,
            parkingStickerNo: sticker,
            parkingSlotNo: slot,
          });
        }
      }

      if (importedList.length === 0) {
        setCsvError('No valid rows parsed. Expected format: Flat,Owner,Type,Make,Plate,RFID,Sticker,Slot');
        return;
      }

      const count = bulkImportVehicles(importedList);
      setCsvSuccess(`Successfully imported ${count} vehicles into the society database!`);
      setCsvText('');
      setTimeout(() => setShowCsvImportModal(false), 1500);
    } catch (err: any) {
      setCsvError('Failed to parse CSV: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Header with Title and Quick Stats */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 mb-2">
            <Radio className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
            <span>FastTag RFID Automated Gate Barrier Synchronized</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Vehicle Registration & Parking Logistics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Flat-linked vehicle registry, visual slot allocation grid (Towers A & B), and real-time visitor FastTag passes.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            title="Download complete vehicle & parking registry as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>

          {(role === 'admin' || role === 'mc_member') && (
            <button
              onClick={() => setShowCsvImportModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer"
              title="Bulk import vehicles via CSV upload"
            >
              <Upload className="w-3.5 h-3.5 text-teal-700" />
              <span>Bulk CSV Import</span>
            </button>
          )}

          <button
            onClick={() => setShowIssuePassModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>Issue Visitor Pass</span>
          </button>

          <button
            onClick={() => setShowAddVehicleModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Vehicle</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Registered Vehicles</span>
          <span className="text-2xl font-black text-slate-900 tabular-nums">{totalAllocated}</span>
          <span className="text-[11px] text-teal-700 block mt-0.5">Across Towers A & B</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">FastTag RFID Active</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span className="text-2xl font-black text-teal-800 tabular-nums">{rfidIssuedCount}</span>
          </div>
          <span className="text-[11px] text-teal-700 block">Boom Barrier Encoded</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Visitor Passes</span>
          <span className="text-2xl font-black text-amber-600 tabular-nums">{activeVisitors} / 10</span>
          <span className="text-[11px] text-slate-500 block">Visitor Bays Occupied</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Predefined Flats</span>
          <span className="text-2xl font-black text-indigo-700 tabular-nums">200</span>
          <span className="text-[11px] text-slate-500 block">Towers A (60) · B (60) · C (80)</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center border-b border-slate-200 bg-white px-4 rounded-t-xl gap-2 pt-2">
        <button
          onClick={() => setActiveSubTab('grid')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'grid'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Visual Parking Slots Grid
        </button>
        <button
          onClick={() => setActiveSubTab('vehicles')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'vehicles'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Resident Vehicle Registry ({vehicles.length})
        </button>
        <button
          onClick={() => setActiveSubTab('visitors')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'visitors'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Visitor Parking Tracker ({activeVisitors} Active)
        </button>
        {(role === 'admin' || role === 'mc_member') && (
          <button
            onClick={() => setActiveSubTab('allocation')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeSubTab === 'allocation'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Reserved Spot Allocator
          </button>
        )}
      </div>

      {/* TAB 1: VISUAL SLOTS GRID */}
      {activeSubTab === 'grid' && (
        <div className="space-y-6">
          {/* Controls & Legend */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs">
              <span className="font-semibold text-slate-700">Grid Legend:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-emerald-500 inline-block"></span>
                <span className="text-slate-600">Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-slate-800 inline-block"></span>
                <span className="text-slate-600">Occupied (Resident)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-amber-500 inline-block"></span>
                <span className="text-slate-600">Visitor Occupied</span>
              </div>
            </div>

            {/* Quick Tower Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Filter Tower:</span>
              <button
                onClick={() => setTowerFilter('All')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                  towerFilter === 'All' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTowerFilter('Tower A')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                  towerFilter === 'Tower A' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Tower A
              </button>
              <button
                onClick={() => setTowerFilter('Tower B')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                  towerFilter === 'Tower B' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Tower B
              </button>
            </div>
          </div>

          {/* Tower A Grid */}
          {(towerFilter === 'All' || towerFilter === 'Tower A') && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                  <span>Tower A - Stilt & Basement 1 Parking Bays (P-A-101 to P-A-130)</span>
                </h3>
                <span className="text-xs text-slate-400">30 Dedicated Bays</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-2.5 pt-2">
                {allGridSlots
                  .filter((s) => s.tower === 'Tower A')
                  .map((slot) => {
                    const vehicle = slotOccupancyMap.get(slot.slotNo);
                    const isOccupied = Boolean(vehicle);
                    return (
                      <button
                        key={slot.slotNo}
                        onClick={() => setSelectedSlot(slot.slotNo)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[72px] relative group ${
                          isOccupied
                            ? 'bg-slate-900 text-white border-slate-800'
                            : 'bg-emerald-500/10 text-emerald-900 border-emerald-300 hover:bg-emerald-500/20'
                        }`}
                        title={
                          isOccupied
                            ? `${slot.slotNo}: Flat ${vehicle?.flatNo} (${vehicle?.licensePlate})`
                            : `${slot.slotNo}: Available`
                        }
                      >
                        <span className="text-[11px] font-bold font-mono">{slot.slotNo}</span>
                        {isOccupied ? (
                          <div className="mt-1 flex flex-col items-center">
                            <span className="text-[10px] font-bold text-teal-300 bg-slate-800 px-1.5 py-0.2 rounded truncate max-w-[64px]">
                              {vehicle?.flatNo}
                            </span>
                            <span className="text-[9px] text-slate-300 truncate max-w-[64px] font-mono mt-0.5">
                              {vehicle?.licensePlate.slice(-4)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-emerald-700 font-semibold mt-1">Available</span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Tower B Grid */}
          {(towerFilter === 'All' || towerFilter === 'Tower B') && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                  <span>Tower B - Stilt & Basement 1 Parking Bays (P-B-101 to P-B-130)</span>
                </h3>
                <span className="text-xs text-slate-400">30 Dedicated Bays</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-2.5 pt-2">
                {allGridSlots
                  .filter((s) => s.tower === 'Tower B')
                  .map((slot) => {
                    const vehicle = slotOccupancyMap.get(slot.slotNo);
                    const isOccupied = Boolean(vehicle);
                    return (
                      <button
                        key={slot.slotNo}
                        onClick={() => setSelectedSlot(slot.slotNo)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[72px] relative group ${
                          isOccupied
                            ? 'bg-slate-900 text-white border-slate-800'
                            : 'bg-emerald-500/10 text-emerald-900 border-emerald-300 hover:bg-emerald-500/20'
                        }`}
                        title={
                          isOccupied
                            ? `${slot.slotNo}: Flat ${vehicle?.flatNo} (${vehicle?.licensePlate})`
                            : `${slot.slotNo}: Available`
                        }
                      >
                        <span className="text-[11px] font-bold font-mono">{slot.slotNo}</span>
                        {isOccupied ? (
                          <div className="mt-1 flex flex-col items-center">
                            <span className="text-[10px] font-bold text-indigo-300 bg-slate-800 px-1.5 py-0.2 rounded truncate max-w-[64px]">
                              {vehicle?.flatNo}
                            </span>
                            <span className="text-[9px] text-slate-300 truncate max-w-[64px] font-mono mt-0.5">
                              {vehicle?.licensePlate.slice(-4)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-emerald-700 font-semibold mt-1">Available</span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Visitor Reserved Bays Strip */}
          <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-200/70 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-amber-200/50 pb-2">
              <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>Visitor Parking Bays (P-VIS-01 to P-VIS-10)</span>
              </h3>
              <span className="text-xs text-amber-800 font-medium">Max 4 Hours Pass Duration</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2.5 pt-1">
              {visitorSlots.map((vSlot) => {
                const pass = visitorOccupancyMap.get(vSlot);
                const isOccupied = Boolean(pass);
                return (
                  <div
                    key={vSlot}
                    className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center min-h-[68px] ${
                      isOccupied
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : 'bg-white text-slate-700 border-amber-200'
                    }`}
                  >
                    <span className="text-[11px] font-bold font-mono">{vSlot}</span>
                    {isOccupied ? (
                      <div className="mt-0.5 text-center">
                        <span className="text-[10px] font-bold block truncate max-w-[60px]">{pass?.guestName}</span>
                        <span className="text-[9px] opacity-90 truncate max-w-[60px] block font-mono">
                          {pass?.vehicleNumber}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-medium mt-1">Available</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RESIDENT VEHICLE REGISTRY TABLE */}
      {activeSubTab === 'vehicles' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search plate, flat, owner, slot, or FastTag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
              >
                <option value="All">All Vehicle Types</option>
                <option value="4-Wheeler">4-Wheelers Only</option>
                <option value="2-Wheeler">2-Wheelers Only</option>
              </select>

              <select
                value={towerFilter}
                onChange={(e) => setTowerFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
              >
                <option value="All">All Towers</option>
                <option value="Tower A">Tower A</option>
                <option value="Tower B">Tower B</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Flat #</th>
                    <th className="py-3 px-4">Owner / Tenant</th>
                    <th className="py-3 px-4">Type & Make</th>
                    <th className="py-3 px-4">License Plate</th>
                    <th className="py-3 px-4">RFID / FastTag ID</th>
                    <th className="py-3 px-4">Sticker #</th>
                    <th className="py-3 px-4">Allocated Bay</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVehicles.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No vehicle records match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredVehicles.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                          {v.flatNo}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {v.ownerName}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <Car className="w-3.5 h-3.5 text-teal-700" />
                            <div>
                              <span className="font-semibold text-slate-900 block">{v.vehicleType}</span>
                              <span className="text-[10px] text-slate-400 block">{v.makeModel}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {v.licensePlate}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {v.rfidTagId}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {v.parkingStickerNo}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-slate-100 text-slate-800 border border-slate-300">
                            {v.parkingSlotNo}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {(role === 'admin' || role === 'mc_member') && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingVehicle(v);
                                    setVehicleEditForm({ ...v });
                                  }}
                                  className="text-teal-700 hover:text-teal-900 p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-teal-50"
                                  title="Modify vehicle details"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => deleteVehicle(v.id)}
                                  className="text-red-500 hover:text-red-700 p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-red-50"
                                  title="Remove vehicle record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VISITOR PARKING TRACKER */}
      {activeSubTab === 'visitors' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Real-Time Visitor FastTag Passes</h3>
                <p className="text-xs text-slate-500">Bays P-VIS-01 through P-VIS-10 with automatic security gate logging.</p>
              </div>
              <button
                onClick={() => setShowIssuePassModal(true)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Issue Visitor Pass</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              {visitorPasses.map((vp) => (
                <div
                  key={vp.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                    vp.status === 'Active'
                      ? 'border-amber-300 bg-amber-50/30'
                      : 'border-slate-200 bg-slate-50/60 opacity-80'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                          {vp.passNumber}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{vp.guestName}</h4>
                        <p className="text-xs text-slate-500">{vp.guestPhone}</p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          vp.status === 'Active'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {vp.status}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Vehicle Number:</span>
                        <span className="font-mono font-bold text-slate-800">{vp.vehicleNumber}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Assigned Bay:</span>
                        <span className="font-mono font-bold text-amber-800">{vp.assignedSlot}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Host Unit:</span>
                        <span className="font-bold text-slate-800">Flat {vp.hostFlat}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Valid Until:</span>
                        <span className="text-slate-600 font-medium text-[11px] truncate block">{vp.validUntil}</span>
                      </div>
                    </div>
                  </div>

                  {vp.status === 'Active' && (
                    <div className="pt-2 border-t border-amber-100/60 flex items-center justify-end">
                      <button
                        onClick={() => updateVisitorPassStatus(vp.id, 'Exited')}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded cursor-pointer"
                      >
                        Mark Exited
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RESERVED SPOT ALLOCATION INTERFACE */}
      {activeSubTab === 'allocation' && (role === 'admin' || role === 'mc_member') && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Reserved Spot Allocation Engine</h3>
            <p className="text-xs text-slate-500">
              Assign or re-allocate dedicated stilt / basement bays to incoming tenants and verified flat owners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Allocate Reserved Bay</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Predefined Flat (Towers A, B & C)</label>
                  <select
                    value={allocFlat}
                    onChange={(e) => setAllocFlat(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    {ALL_SOCIETY_FLATS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Resident / Tenant Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kulkarni"
                    value={allocResidentName}
                    onChange={(e) => setAllocResidentName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Target Bay Number</label>
                  <select
                    value={allocSlotNo}
                    onChange={(e) => setAllocSlotNo(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800"
                  >
                    {allGridSlots.map((s) => (
                      <option key={s.slotNo} value={s.slotNo}>
                        {s.slotNo} ({s.tower}) {slotOccupancyMap.has(s.slotNo) ? '· Currently Occupied' : '· AVAILABLE'}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => {
                    if (!allocResidentName.trim()) return;
                    addVehicle({
                      flatNo: allocFlat,
                      ownerName: allocResidentName,
                      vehicleType: '4-Wheeler',
                      makeModel: 'Resident Reserved Vehicle',
                      licensePlate: 'MH 12 TEMP ' + allocFlat.replace('-', ''),
                      rfidTagId: `FASTAG-${allocFlat.replace('-', '')}-RES`,
                      parkingStickerNo: `SOL-STK-${allocFlat.replace('-', '')}`,
                      parkingSlotNo: allocSlotNo,
                    });
                    setAllocResidentName('');
                    alert(`Slot ${allocSlotNo} successfully allocated to Flat ${allocFlat}!`);
                  }}
                  className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Confirm Slot Assignment
                </button>
              </div>
            </div>

            <div className="p-5 bg-teal-50/60 rounded-xl border border-teal-200/80 space-y-3 text-xs text-slate-700">
              <h4 className="font-bold text-teal-900">Allocation Rules & Bye-Laws</h4>
              <ul className="space-y-2 list-disc pl-4 text-slate-600 leading-relaxed">
                <li>Each registered flat is entitled to 1 covered 4-Wheeler slot and 1 2-Wheeler bay per society allotment schedule.</li>
                <li>Tenants must provide police verification receipt and Owner NOC prior to bay activation.</li>
                <li>Demarcated bays (P-A-101..130 & P-B-101..130) are numbered and linked to the automated RFID boom barriers at Gates 1 & 2.</li>
                <li>Visitor parking is strictly restricted to outside guests with an active 4-hour pass. Overnight resident parking in visitor slots incurs ₹500 penalty.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD VEHICLE */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold">Register Flat Vehicle & FastTag</h3>
              </div>
              <button onClick={() => setShowAddVehicleModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Predefined Flat <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    value={newFlat}
                    onChange={(e) => setNewFlat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:border-red-300 focus:outline-none"
                  >
                    {ALL_SOCIETY_FLATS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Owner / Resident Name <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    placeholder="Resident Name"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Vehicle Type <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:border-red-300 focus:outline-none"
                  >
                    <option value="4-Wheeler">4-Wheeler (Car / SUV)</option>
                    <option value="2-Wheeler">2-Wheeler (Motorcycle / Scooter)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    License Plate Number <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH 12 AB 1234"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-200 rounded-lg font-mono font-bold text-slate-900 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Make & Model <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hyundai Creta (White)"
                    value={newMake}
                    onChange={(e) => setNewMake(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Allocated Slot # <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    value={newSlot}
                    onChange={(e) => setNewSlot(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:border-red-300 focus:outline-none"
                  >
                    {allGridSlots.map((s) => (
                      <option key={s.slotNo} value={s.slotNo}>
                        {s.slotNo} {slotOccupancyMap.has(s.slotNo) ? '(Occupied)' : '(Available)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    RFID / FASTag Tag ID <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FASTAG-A402-01"
                    value={newRfid}
                    onChange={(e) => setNewRfid(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Society Windshield Sticker # <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SOL-STK-0102"
                    value={newSticker}
                    onChange={(e) => setNewSticker(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                >
                  Register Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ISSUE VISITOR PASS */}
      {showIssuePassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-amber-600 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-white" />
                <h3 className="text-base font-bold">Issue Visitor Parking FastTag Pass</h3>
              </div>
              <button onClick={() => setShowIssuePassModal(false)} className="text-amber-100 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssuePass} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Guest Full Name <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Deshpande"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-red-300 focus:outline-none rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Guest Mobile Phone <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98220 00000"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-red-300 focus:outline-none rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Vehicle License Plate <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="MH 12 XX 0000"
                    value={guestPlate}
                    onChange={(e) => setGuestPlate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-200 rounded-lg font-mono font-bold text-slate-900 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Host Flat <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    value={hostFlat}
                    onChange={(e) => setHostFlat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:border-red-300 focus:outline-none"
                  >
                    {ALL_SOCIETY_FLATS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Assigned Visitor Bay <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    value={assignedVisitorSlot}
                    onChange={(e) => setAssignedVisitorSlot(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-amber-800 focus:border-red-300 focus:outline-none"
                  >
                    {visitorSlots.map((s) => (
                      <option key={s} value={s}>
                        {s} {visitorOccupancyMap.has(s) ? '(Occupied)' : '(Available)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Pass Duration <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  value={passDuration}
                  onChange={(e) => setPassDuration(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:border-red-300 focus:outline-none"
                >
                  <option value="2 hours">2 hours</option>
                  <option value="4 hours">4 hours (Standard max limit)</option>
                  <option value="8 hours">8 hours (Day Guest)</option>
                  <option value="24 hours">24 hours (Overnight Guest - MC notified)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowIssuePassModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                >
                  Issue Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CSV BULK IMPORT */}
      {showCsvImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold">Bulk CSV Vehicle Import</h3>
              </div>
              <button onClick={() => setShowCsvImportModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Paste CSV rows with headers to bulk upload existing vehicle records for the entire society.
                Expected column sequence:
                <br />
                <code className="text-teal-700 font-mono text-[11px] bg-slate-100 p-1 rounded mt-1 block">
                  Flat Number,Owner Name,Vehicle Type,Make & Model,License Plate,RFID Tag,Sticker,Slot
                </code>
              </p>

              {csvError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{csvError}</span>
                </div>
              )}

              {csvSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{csvSuccess}</span>
                </div>
              )}

              <textarea
                rows={8}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={`Flat Number,Owner Name,Vehicle Type,Make & Model,License Plate,RFID Tag,Sticker,Slot
A-501,Mandar Kulkarni,4-Wheeler,Honda City,MH 12 MN 5501,FASTAG-A501-4W,SOL-STK-0501,P-A-115
B-602,Neha Joshi,4-Wheeler,Tata Tiago,MH 12 NJ 0602,FASTAG-B602-4W,SOL-STK-0602,P-B-118`}
                className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
              />

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCsvText(`Flat Number,Owner Name,Vehicle Type,Make & Model,License Plate,RFID Tag,Sticker,Slot
A-501,Mandar Kulkarni,4-Wheeler,Honda City,MH 12 MN 5501,FASTAG-A501-4W,SOL-STK-0501,P-A-115
B-602,Neha Joshi,4-Wheeler,Tata Tiago,MH 12 NJ 0602,FASTAG-B602-4W,SOL-STK-0602,P-B-118
A-703,Anil Chitnis,4-Wheeler,Hyundai Verna,MH 12 AC 0703,FASTAG-A703-4W,SOL-STK-0703,P-A-120`);
                  }}
                  className="text-teal-700 font-semibold hover:underline cursor-pointer"
                >
                  Load Sample CSV
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCsvImportModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleImportCsv}
                    className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                  >
                    Process & Import
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Admin Modify Vehicle Record Modal */}
      {editingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Modify Vehicle Record</h3>
                  <p className="text-[11px] text-slate-500">
                    Administrator field editor for vehicle {editingVehicle.licensePlate}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingVehicle(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingVehicle) return;
                updateVehicle(editingVehicle.id, vehicleEditForm);
                setEditingVehicle(null);
              }}
              className="space-y-3 max-h-[70vh] overflow-y-auto pr-1"
            >
              {/* Owner & Flat */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Owner / Resident Name</label>
                  <input
                    type="text"
                    required
                    value={vehicleEditForm.ownerName || ''}
                    onChange={(e) => setVehicleEditForm({ ...vehicleEditForm, ownerName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-teal-700 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Assigned Flat Number</label>
                  <select
                    value={vehicleEditForm.flatNo || ALL_SOCIETY_FLATS[0]}
                    onChange={(e) => setVehicleEditForm({ ...vehicleEditForm, flatNo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-teal-700 bg-white"
                  >
                    {ALL_SOCIETY_FLATS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vehicle Type & Make/Model */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Vehicle Classification <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    value={vehicleEditForm.vehicleType || '4-Wheeler'}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setVehicleEditForm({
                        ...vehicleEditForm,
                        vehicleType: val,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:border-red-300 focus:outline-none bg-white"
                  >
                    <option value="4-Wheeler">4-Wheeler (Car / SUV)</option>
                    <option value="2-Wheeler">2-Wheeler (Motorcycle / Scooter)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Make & Model <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={vehicleEditForm.makeModel || ''}
                    onChange={(e) => setVehicleEditForm({ ...vehicleEditForm, makeModel: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 focus:border-red-300 focus:outline-none rounded-lg text-slate-900 font-medium bg-white"
                  />
                </div>
              </div>

              {/* License Plate & RFID */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    License Plate No. <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={vehicleEditForm.licensePlate || ''}
                    onChange={(e) => setVehicleEditForm({ ...vehicleEditForm, licensePlate: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-200 rounded-lg font-mono font-bold uppercase text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    RFID FastTag ID <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={vehicleEditForm.rfidTagId || ''}
                    onChange={(e) => setVehicleEditForm({ ...vehicleEditForm, rfidTagId: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold uppercase text-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* Slot No & Sticker No */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Allocated Parking Slot <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={vehicleEditForm.parkingSlotNo || ''}
                    onChange={(e) => setVehicleEditForm({ ...vehicleEditForm, parkingSlotNo: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 focus:border-red-300 focus:outline-none rounded-lg font-mono font-bold text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Parking Sticker Number <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={vehicleEditForm.parkingStickerNo || ''}
                    onChange={(e) => setVehicleEditForm({ ...vehicleEditForm, parkingStickerNo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
                  className="px-3.5 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold cursor-pointer shadow-sm transition-all"
                >
                  Save Vehicle Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
