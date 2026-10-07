import React, { useState, useEffect } from 'react';
import { useSociety } from '../context/SocietyContext';
import {
  X,
  Settings,
  Building2,
  FileText,
  ShieldCheck,
  LifeBuoy,
  Bell,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Layers,
  Image,
  Upload,
  Download,
  Copy,
  Check,
  Globe,
  Sliders,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  CreditCard,
  Building,
  KeyRound,
} from 'lucide-react';
import { SocietyProfileDetails, BuildingConfig, SocietyCustomizationConfig } from '../types';
import { uploadToCHSStorage } from '../lib/supabase';
import layoutImg from '../assets/images/solitaire_layout_1791127831982.jpg';
import clubhouseImg from '../assets/images/solitaire_clubhouse_1791127802446.jpg';
import amenitiesImg from '../assets/images/solitaire_amenities_1791127816486.jpg';

export const AdminSettingsModal: React.FC = () => {
  const {
    societyDetails,
    updateSocietyDetails,
    isSocietySettingsModalOpen,
    closeSocietySettingsModal,
    defaultTermsAndConditions,
    updateDefaultTermsAndConditions,
    resetDefaultTermsAndConditions,
    role,
    managedSocieties,
    activeSociety,
    switchSociety,
    updateActiveSocietyConfig,
    addManagedSociety,
    deleteManagedSociety,
    exportSocietyConfigJson,
    importSocietyConfigJson,
    currencySymbol,
  } = useSociety();

  const [activeTab, setActiveTab] = useState<
    'portfolio' | 'towers' | 'identity' | 'financials' | 'modules' | 'procurement' | 'registration' | 'sla' | 'announcements'
  >('portfolio');

  const [formData, setFormData] = useState<SocietyProfileDetails>(societyDetails);
  const [termsList, setTermsList] = useState<string[]>(defaultTermsAndConditions);
  const [newTermInput, setNewTermInput] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Commercial buildings state
  const [buildingsState, setBuildingsState] = useState<BuildingConfig[]>(activeSociety?.buildings || []);

  // Commercial onboarding new society modal state
  const [showNewSocietyModal, setShowNewSocietyModal] = useState<boolean>(false);
  const [newSocietyName, setNewSocietyName] = useState('');
  const [newSocietyCity, setNewSocietyCity] = useState('');
  const [newSocietyState, setNewSocietyState] = useState('Maharashtra');
  const [newSocietyReg, setNewSocietyReg] = useState('');
  const [newSocietyTagline, setNewSocietyTagline] = useState('');
  const [newSocietyCurrency, setNewSocietyCurrency] = useState('₹');
  const [newSocietyMaintenance, setNewSocietyMaintenance] = useState(4500);

  // Logo upload state
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);

  // Import JSON input
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importError, setImportError] = useState('');

  useEffect(() => {
    setFormData(societyDetails);
  }, [societyDetails]);

  useEffect(() => {
    if (activeSociety?.buildings) {
      setBuildingsState(activeSociety.buildings);
    }
  }, [activeSociety]);

  useEffect(() => {
    setTermsList(defaultTermsAndConditions);
  }, [defaultTermsAndConditions]);

  if (!isSocietySettingsModalOpen) return null;

  // Authorization check - Admin or MC Member
  const isAuthorized = role === 'admin' || role === 'mc_member' || role === 'secretary';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSocietyDetails(formData);
    updateDefaultTermsAndConditions(termsList);
    // Also save buildings configuration to active society
    updateActiveSocietyConfig({
      name: formData.name,
      societyRegNo: formData.societyRegNo,
      reraRegNo: formData.reraRegNo,
      addressLine: formData.addressLine,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      fullAddress: formData.fullAddress,
      bankName: formData.bankName,
      bankAccountNo: formData.bankAccountNo,
      bankIFSC: formData.bankIFSC,
      maintenancePerSqFt: formData.maintenancePerSqFt,
      officialEmail: formData.officialEmail,
      securityGatePhone: formData.securityGatePhone,
      estateOfficePhone: formData.estateOfficePhone,
      buildings: buildingsState,
    });

    setSaveSuccessMsg('Global Society settings & building structure updated successfully!');
    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 4000);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const res = await uploadToCHSStorage(file, 'avatars');
      if (res.success && res.publicUrl) {
        setFormData({ ...formData, logoUrl: res.publicUrl });
        updateActiveSocietyConfig({ logoUrl: res.publicUrl });
        setSaveSuccessMsg('Society logo uploaded directly to CHS-Storage/avatars/!');
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error('Failed to upload logo:', err);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleAddTerm = () => {
    if (!newTermInput.trim()) return;
    setTermsList([...termsList, newTermInput.trim()]);
    setNewTermInput('');
  };

  const handleRemoveTerm = (index: number) => {
    setTermsList(termsList.filter((_, i) => i !== index));
  };

  const handleResetTerms = () => {
    resetDefaultTermsAndConditions();
    setTermsList(societyDetails.workOrderDefaults?.defaultTerms || []);
  };

  // Building architectural editing
  const handleUpdateBuilding = (id: string, updates: Partial<BuildingConfig>) => {
    setBuildingsState((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const updated = { ...b, ...updates };
        const floors = updates.floors ?? b.floors;
        const perFloor = updates.flatsPerFloor ?? b.flatsPerFloor;
        updated.totalFlats = floors * perFloor;
        return updated;
      })
    );
  };

  const handleAddBuilding = () => {
    const nextCode = String.fromCharCode(65 + buildingsState.length); // D, E, F...
    const newBldg: BuildingConfig = {
      id: `bldg-${Date.now()}`,
      name: `Tower ${nextCode}`,
      shortCode: nextCode,
      floors: 6,
      flatsPerFloor: 10,
      totalFlats: 60,
    };
    setBuildingsState([...buildingsState, newBldg]);
  };

  const handleRemoveBuilding = (id: string) => {
    if (buildingsState.length <= 1) return;
    setBuildingsState(buildingsState.filter((b) => b.id !== id));
  };

  // Total flats calculated from buildings
  const totalCalculatedFlats = buildingsState.reduce((acc, b) => acc + (b.totalFlats || b.floors * b.flatsPerFloor), 0);

  // Commercial onboarding of a new society
  const handleCreateNewSociety = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSocietyName.trim()) return;

    const newId = `soc-${Date.now()}`;
    const newSoc: SocietyCustomizationConfig = {
      id: newId,
      name: newSocietyName.trim(),
      commercialTagline: newSocietyTagline.trim() || 'Premier Residential Co-operative Housing Society',
      societyRegNo: newSocietyReg.trim() || `HSG/REG/${Date.now().toString().slice(-6)}/2026`,
      act: 'State Co-operative Societies Act',
      currencySymbol: newSocietyCurrency,
      currencyCode: newSocietyCurrency === '₹' ? 'INR' : 'USD',
      themeColor: 'teal',
      addressLine: `${newSocietyName.trim()} Campus`,
      subLocality: newSocietyCity || 'Main Avenue',
      city: newSocietyCity || 'City',
      state: newSocietyState || 'State',
      pincode: '400001',
      fullAddress: `${newSocietyName.trim()}, ${newSocietyCity || 'City'}, ${newSocietyState || 'State'}`,
      totalUnits: 200,
      securityGatePhone: '+91 22 2600 0001',
      estateOfficePhone: '+91 22 2600 0002',
      officialEmail: `admin@${newSocietyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.org`,
      bankName: 'HDFC Bank Ltd',
      bankAccountNo: '502000' + Math.floor(10000000 + Math.random() * 90000000),
      bankIFSC: 'HDFC0000123',
      bankUpiVpa: `${newSocietyName.toLowerCase().replace(/[^a-z0-9]/g, '')}@okhdfcbank`,
      maintenancePerFlatFixed: Number(newSocietyMaintenance) || 4500,
      maintenancePerSqFt: 3.5,
      maintenanceFormula: 'fixed_per_flat',
      dueDayOfMonth: 10,
      lateFeePercent: 12,
      buildings: [
        { id: `bldg-a-${newId}`, name: 'Tower A', shortCode: 'A', floors: 6, flatsPerFloor: 10, totalFlats: 60 },
        { id: `bldg-b-${newId}`, name: 'Tower B', shortCode: 'B', floors: 6, flatsPerFloor: 10, totalFlats: 60 },
        { id: `bldg-c-${newId}`, name: 'Tower C', shortCode: 'C', floors: 8, flatsPerFloor: 10, totalFlats: 80 },
      ],
      enabledModules: {
        maintenanceLedger: true,
        smartParking: true,
        visitorSecurity: true,
        supervisorInspection: true,
        amenitiesBooking: true,
        helpdeskTickets: true,
        residentRegistry: true,
        procurementWorkOrders: true,
        societyGallery: true,
        digitalDocuments: true,
        governancePolls: true,
      },
      planTier: 'Enterprise Commercial',
      status: 'active',
    };

    addManagedSociety(newSoc);
    setShowNewSocietyModal(false);
    setNewSocietyName('');
    setSaveSuccessMsg(`✓ Successfully onboarded new client society "${newSoc.name}"!`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const handleExportJson = () => {
    const jsonStr = exportSocietyConfigJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeSociety?.name.replace(/[^a-zA-Z0-9]/g, '_')}_Society_Config.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = () => {
    setImportError('');
    if (!importJsonText.trim()) return;
    const ok = importSocietyConfigJson(importJsonText.trim());
    if (ok) {
      setShowImportDialog(false);
      setImportJsonText('');
      setSaveSuccessMsg('✓ Society configuration imported successfully!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } else {
      setImportError('Invalid JSON format or missing required society name/id.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Society Management & Commercial SaaS Suite</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                  Commercial Enterprise Edition
                </span>
              </div>
              <p className="text-xs text-slate-400">
                White-label branding, tower & flat distribution, multi-tenant society onboarding, and financial rules.
              </p>
            </div>
          </div>
          <button
            onClick={closeSocietySettingsModal}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-2 border-b border-slate-200 bg-slate-50/90 overflow-x-auto text-xs font-semibold shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('portfolio')}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'portfolio' ? 'border-teal-700 text-teal-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Commercial Societies ({managedSocieties?.length || 1})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('towers')}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'towers' ? 'border-teal-700 text-teal-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Towers & Flats ({totalCalculatedFlats} Units)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('identity')}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'identity' ? 'border-teal-700 text-teal-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Branding & Logo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('financials')}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'financials' ? 'border-teal-700 text-teal-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Financials & UPI</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('modules')}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'modules' ? 'border-teal-700 text-teal-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Modules & Features</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('procurement')}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'procurement' ? 'border-teal-700 text-teal-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Work Orders</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('registration')}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'registration' ? 'border-teal-700 text-teal-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Flat Rules</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('announcements')}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'announcements' ? 'border-teal-700 text-teal-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Announcements</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs">
          {saveSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center justify-between animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold">{saveSuccessMsg}</span>
              </div>
              <span className="text-[11px] text-emerald-700">Synchronized across client portals</span>
            </div>
          )}

          {!isAuthorized && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>You are viewing society settings in read-only preview. Sign in as Admin or MC Member to apply live updates.</span>
            </div>
          )}

          {/* TAB 1: COMMERCIAL MULTI-SOCIETY PORTFOLIO */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Commercial Multi-Society Client Management</h3>
                    <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono text-[10px] font-bold border border-teal-500/30">
                      SaaS Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Manage multiple housing societies, co-operatives, or townships commercially under a single admin dashboard.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowNewSocietyModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Onboard New Society</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl text-xs cursor-pointer transition-colors"
                    title="Export Society Config JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowImportDialog(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl text-xs cursor-pointer transition-colors"
                    title="Import Society Config JSON"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import JSON</span>
                  </button>
                </div>
              </div>

              {/* Managed Societies Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(managedSocieties || []).map((soc) => {
                  const isCurrent = soc.id === activeSociety?.id;
                  const units = soc.buildings?.reduce((a, b) => a + (b.totalFlats || (b.floors * b.flatsPerFloor)), 0) || 200;
                  return (
                    <div
                      key={soc.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-teal-50/70 border-teal-300 shadow-md ring-2 ring-teal-600/30'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-sm">{soc.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-700 text-white font-bold uppercase">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-teal-800 font-semibold mt-0.5">{soc.commercialTagline}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-1">Reg: {soc.societyRegNo}</p>
                        </div>
                      </div>

                      <div className="my-3 pt-3 border-t border-slate-200/80 space-y-1 text-[11px]">
                        <div className="flex justify-between text-slate-600">
                          <span>Location:</span>
                          <span className="font-semibold text-slate-800">{soc.city}, {soc.state}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Buildings:</span>
                          <span className="font-mono font-bold text-slate-900">
                            {soc.buildings?.map((b) => `${b.shortCode || b.name[0]}: ${b.totalFlats || (b.floors * b.flatsPerFloor)}`).join(' · ')}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Total Units:</span>
                          <span className="font-mono font-bold text-teal-800">{units} Flats</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Maintenance Charge:</span>
                          <span className="font-mono font-bold text-slate-900">{soc.currencySymbol}{soc.maintenancePerFlatFixed}/month</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        {!isCurrent ? (
                          <button
                            type="button"
                            onClick={() => switchSociety(soc.id)}
                            className="flex-1 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold text-xs cursor-pointer transition-colors shadow-2xs"
                          >
                            Switch to this Society
                          </button>
                        ) : (
                          <span className="flex-1 py-1.5 text-center text-teal-800 font-bold text-xs bg-teal-100/80 rounded-lg border border-teal-200">
                            Currently Active
                          </span>
                        )}
                        {managedSocieties.length > 1 && (
                          <button
                            type="button"
                            onClick={() => deleteManagedSociety(soc.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 cursor-pointer"
                            title="Delete society"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: TOWERS & FLATS ARCHITECTURE */}
          {activeTab === 'towers' && (
            <div className="space-y-6">
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-teal-950 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-teal-700" />
                    <span>Dynamic Building & Wing Configuration</span>
                  </h3>
                  <p className="text-xs text-teal-800 mt-1">
                    Building A has <strong>60 flats</strong>, Building B has <strong>60 flats</strong>, and Building C has <strong>80 flats</strong> (Total <strong>{totalCalculatedFlats} flats</strong>). Modify buildings, floors, and units per floor to adapt to any society commercially.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddBuilding}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs shrink-0 cursor-pointer shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Tower / Wing</span>
                </button>
              </div>

              {/* Buildings Editor Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {buildingsState.map((bldg) => {
                  const flatsCount = bldg.totalFlats || bldg.floors * bldg.flatsPerFloor;
                  return (
                    <div key={bldg.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-teal-700" />
                          <span className="font-bold text-slate-900 text-sm">{bldg.name}</span>
                        </div>
                        <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {flatsCount} Flats
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1">Tower / Wing Name</label>
                          <input
                            type="text"
                            value={bldg.name}
                            onChange={(e) => handleUpdateBuilding(bldg.id, { name: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 block mb-1">Prefix / Code</label>
                            <input
                              type="text"
                              value={bldg.shortCode}
                              onChange={(e) => handleUpdateBuilding(bldg.id, { shortCode: e.target.value.toUpperCase() })}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-center"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 block mb-1">Total Floors</label>
                            <input
                              type="number"
                              min={1}
                              max={60}
                              value={bldg.floors}
                              onChange={(e) => handleUpdateBuilding(bldg.id, { floors: Number(e.target.value) || 1 })}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-center"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1">Units per Floor</label>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={bldg.flatsPerFloor}
                            onChange={(e) => handleUpdateBuilding(bldg.id, { flatsPerFloor: Number(e.target.value) || 1 })}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-center"
                          />
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600">
                          <span className="font-semibold block text-slate-800">Flat Numbering Range:</span>
                          <span className="font-mono text-teal-800 font-bold">
                            {bldg.shortCode}-101 ... {bldg.shortCode}-{bldg.floors * 100 + bldg.flatsPerFloor}
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            ({bldg.floors} floors x {bldg.flatsPerFloor} units = {flatsCount} flats)
                          </span>
                        </div>
                      </div>

                      {buildingsState.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBuilding(bldg.id)}
                          className="w-full py-1 text-red-600 hover:bg-red-50 rounded-lg text-[11px] font-semibold border border-red-200 cursor-pointer"
                        >
                          Remove Tower
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Live Flats Summary */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-teal-400">Total Society Capacity:</span>
                  <span className="font-mono font-extrabold text-lg text-white">
                    {totalCalculatedFlats} Units Across {buildingsState.length} Buildings
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-800/80 rounded-xl border border-slate-700/60 font-mono text-[10px]">
                  {buildingsState.flatMap((b) => {
                    const list: string[] = [];
                    for (let f = 1; f <= b.floors; f++) {
                      for (let u = 1; u <= b.flatsPerFloor; u++) {
                        list.push(`${b.shortCode}-${f * 100 + u}`);
                      }
                    }
                    return list;
                  }).slice(0, 70).map((f) => (
                    <span key={f} className="px-1.5 py-0.5 bg-slate-700/80 text-teal-200 rounded">
                      {f}
                    </span>
                  ))}
                  {totalCalculatedFlats > 70 && (
                    <span className="px-2 py-0.5 text-slate-400 italic">
                      + {totalCalculatedFlats - 70} more flats
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BRANDING & IDENTITY */}
          {activeTab === 'identity' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Society Registered Name <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-teal-700 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    MahaRERA Registration ID <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.reraRegNo || 'P52100008192'}
                    onChange={(e) => setFormData({ ...formData, reraRegNo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:outline-teal-700 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Co-op Society Registration No <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.societyRegNo}
                    onChange={(e) => setFormData({ ...formData, societyRegNo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:outline-teal-700 focus:bg-white"
                  />
                </div>
              </div>

              {/* Logo Direct File Upload */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="font-bold text-slate-800 block text-xs">
                  Official Society Emblem / Logo (PNG/JPEG)
                </label>
                <div className="flex items-center gap-4">
                  {formData.logoUrl ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-300 shrink-0 bg-white shadow-2xs">
                      <img src={formData.logoUrl} alt="Society Logo" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-500 shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded-lg text-xs font-semibold text-teal-900 cursor-pointer shadow-2xs transition-colors">
                      <Upload className="w-3.5 h-3.5 text-teal-700" />
                      <span>{isUploadingLogo ? 'Uploading to CHS-Storage...' : 'Select Local Image (PNG/JPEG)'}</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={handleLogoUpload}
                        disabled={isUploadingLogo}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] text-slate-400 block">
                      Saved directly to Supabase storage: CHS-Storage/avatars/
                    </span>
                  </div>
                </div>
              </div>

              {/* Address details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Street Address Line</label>
                  <input
                    type="text"
                    value={formData.addressLine}
                    onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                  />
                </div>
              </div>

              {/* Contact numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Estate Office Phone</label>
                  <input
                    type="text"
                    value={formData.estateOfficePhone}
                    onChange={(e) => setFormData({ ...formData, estateOfficePhone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Security Gate Intercom</label>
                  <input
                    type="text"
                    value={formData.securityGatePhone}
                    onChange={(e) => setFormData({ ...formData, securityGatePhone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Official Society Email</label>
                  <input
                    type="email"
                    value={formData.officialEmail}
                    onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FINANCIALS & BILLING */}
          {activeTab === 'financials' && (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                <span className="font-bold text-emerald-950 uppercase tracking-wider text-[11px] block">
                  Commercial Maintenance Formula & Payment Gateway
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Billing Currency</label>
                    <select
                      value={activeSociety?.currencySymbol || currencySymbol || '₹'}
                      onChange={(e) => updateActiveSocietyConfig({ currencySymbol: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold"
                    >
                      <option value="₹">₹ (Indian Rupee - INR)</option>
                      <option value="$">$ (US Dollar - USD)</option>
                      <option value="€">€ (Euro - EUR)</option>
                      <option value="AED">AED (UAE Dirham)</option>
                      <option value="£">£ (British Pound - GBP)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Fixed Flat Maintenance / Mo</label>
                    <input
                      type="number"
                      value={activeSociety?.maintenancePerFlatFixed || 4250}
                      onChange={(e) => updateActiveSocietyConfig({ maintenancePerFlatFixed: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Rate per Sq.Ft (Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.maintenancePerSqFt}
                      onChange={(e) => setFormData({ ...formData, maintenancePerSqFt: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Society Banking Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Society Bank Name</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Account Number</label>
                  <input
                    type="text"
                    value={formData.bankAccountNo}
                    onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={formData.bankIFSC}
                    onChange={(e) => setFormData({ ...formData, bankIFSC: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Official Society UPI VPA ID</label>
                <input
                  type="text"
                  placeholder="e.g. solitaire.chs@okhdfcbank"
                  value={activeSociety?.bankUpiVpa || 'solitaire.chs@okhdfcbank'}
                  onChange={(e) => updateActiveSocietyConfig({ bankUpiVpa: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Used for dynamic resident QR code payment generations in Maintenance View.
                </span>
              </div>
            </div>
          )}

          {/* TAB 5: MODULES & FEATURES */}
          {activeTab === 'modules' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-bold text-slate-800 text-xs block mb-1">Commercial Feature Modules Toggle</span>
                <p className="text-[11px] text-slate-500">
                  Enable or disable feature modules for this society to customize client subscriptions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'maintenanceLedger', label: 'Maintenance Ledger & Digital Receipts' },
                  { key: 'smartParking', label: 'Smart Parking & FASTag Vehicle Registry' },
                  { key: 'supervisorInspection', label: 'Daily Supervisor Walkthrough & PDF Audits' },
                  { key: 'amenitiesBooking', label: 'Clubhouse, Pool & Amenity Reservations' },
                  { key: 'helpdeskTickets', label: 'Resident Helpdesk & Service Tickets' },
                  { key: 'residentRegistry', label: 'Resident Member Directory & Dual-Role Verification' },
                  { key: 'procurementWorkOrders', label: 'Work Orders, Tenders & Vendor Disbursements' },
                  { key: 'digitalDocuments', label: 'Digital Document Vault & Bylaws' },
                  { key: 'governancePolls', label: 'AGM Governance Polls & Resolution Voting' },
                  { key: 'societyGallery', label: 'Society Infrastructure Gallery' },
                ].map((mod) => {
                  const isEnabled = activeSociety?.enabledModules?.[mod.key as keyof typeof activeSociety.enabledModules] ?? true;
                  return (
                    <div
                      key={mod.key}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <span className="font-semibold text-slate-800 text-xs">{mod.label}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (activeSociety?.enabledModules) {
                            updateActiveSocietyConfig({
                              enabledModules: {
                                ...activeSociety.enabledModules,
                                [mod.key]: !isEnabled,
                              },
                            });
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                          isEnabled
                            ? 'bg-teal-100 text-teal-800 border border-teal-300'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {isEnabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: WORK ORDERS & TERMS */}
          {activeTab === 'procurement' && (
            <div className="space-y-4">
              <span className="font-bold text-slate-800 block text-xs">Standard Work Order Terms & Conditions</span>
              <div className="space-y-2">
                {termsList.map((term, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <span className="font-mono font-bold text-teal-700 w-5 shrink-0">{idx + 1}.</span>
                    <span className="flex-1 text-slate-800">{term}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTerm(idx)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add new procurement term..."
                  value={newTermInput}
                  onChange={(e) => setNewTermInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddTerm}
                  className="px-4 py-2 bg-teal-700 text-white rounded-lg font-bold text-xs"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* TAB 7: REGISTRATION RULES */}
          {activeTab === 'registration' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.registrationRules?.enforceOneMemberPerFlat ?? true}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        registrationRules: {
                          ...formData.registrationRules,
                          enforceOneMemberPerFlat: e.target.checked,
                          autoApproveOwners: formData.registrationRules?.autoApproveOwners ?? false,
                          defaultTowers: formData.registrationRules?.defaultTowers ?? ['Tower A', 'Tower B', 'Tower C'],
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-teal-700"
                  />
                  <span className="font-bold text-slate-800 text-xs">
                    Enforce Dual-User Resident Limit per Flat (1 Verified Owner + 1 Verified Tenant)
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 8: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className="space-y-4">
              <div>
                <label className="font-semibold text-slate-800 block mb-1">Notice Banner Message</label>
                <input
                  type="text"
                  value={formData.announcementBanner?.message || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      announcementBanner: {
                        enabled: formData.announcementBanner?.enabled ?? true,
                        message: e.target.value,
                        type: formData.announcementBanner?.type ?? 'info',
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <span className="text-[11px] text-slate-500">
              Commercial configurations persist locally and synchronize across modules.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeSocietySettingsModal}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium cursor-pointer transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={!isAuthorized}
                className="px-5 py-2 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save All Global Settings</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* MODAL: ONBOARD NEW CLIENT SOCIETY */}
      {showNewSocietyModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Onboard New Society (Commercial Multi-Tenant)</h3>
              <button onClick={() => setShowNewSocietyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewSociety} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-800 block mb-1">Society Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Palms Residential Enclave"
                  value={newSocietyName}
                  onChange={(e) => setNewSocietyName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">Commercial Subtitle / Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. Ultra-Luxury Waterfront Community"
                  value={newSocietyTagline}
                  onChange={(e) => setNewSocietyTagline(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai, Pune, Bengaluru"
                    value={newSocietyCity}
                    onChange={(e) => setNewSocietyCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Registration No.</label>
                  <input
                    type="text"
                    placeholder="e.g. MH/MUM/HSG/2026"
                    value={newSocietyReg}
                    onChange={(e) => setNewSocietyReg(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Currency</label>
                  <select
                    value={newSocietyCurrency}
                    onChange={(e) => setNewSocietyCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="₹">₹ (INR)</option>
                    <option value="$">$ (USD)</option>
                    <option value="€">€ (EUR)</option>
                    <option value="AED">AED</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Maintenance Fee / Mo</label>
                  <input
                    type="number"
                    value={newSocietyMaintenance}
                    onChange={(e) => setNewSocietyMaintenance(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                Default configured with <strong>Towers A (60), B (60), and C (80) = 200 flats</strong>. Can be customized at any time.
              </p>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewSocietyModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Onboard Society
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMPORT SOCIETY JSON */}
      {showImportDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Import Society Configuration JSON</h3>
              <button onClick={() => setShowImportDialog(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Paste the exported society configuration JSON text below to load or migrate a commercial client society:
              </p>
              <textarea
                rows={8}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder="Paste JSON here..."
                className="w-full p-2.5 border border-slate-300 rounded-lg font-mono text-[11px] bg-slate-50 focus:bg-white"
              />
              {importError && (
                <p className="text-red-600 font-bold">{importError}</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportDialog(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImportJson}
                  className="px-5 py-2 bg-teal-700 text-white rounded-lg font-bold"
                >
                  Import Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
