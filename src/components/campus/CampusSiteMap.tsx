import React, { useState, useMemo } from 'react';
import { useSociety } from '../../context/SocietyContext';
import {
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Home,
  Info,
  ArrowRight,
  Layers,
  MapPin,
  Sparkles,
  Droplets,
  Zap,
  ShieldAlert,
  Car,
  Compass,
  CornerDownRight,
  Navigation,
  TreePine,
  Waves,
  Dumbbell,
  SlidersHorizontal,
} from 'lucide-react';
import {
  TowerId,
  TOWER_UNIT_COUNTS,
  TOTAL_SOCIETY_UNITS,
  TOWER_A_FLATS,
  TOWER_B_FLATS,
  TOWER_C_FLATS,
} from '../../types';

interface TowerOccupancyStats {
  tower: TowerId;
  bldgLabel: string;
  wingNumber: number;
  floorsCount: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  approvedCount: number; // Verified residents
  pendingCount: number;
  ownersCount: number;
  tenantsCount: number;
  occupancyRate: number; // Formula: (Verified Residents in Tower / Total Flats in Tower) * 100
  statusBadge: {
    label: string;
    color: string;
    bg: string;
    border: string;
  };
}

export const CampusSiteMap: React.FC = () => {
  const { profiles, setActiveTab } = useSociety();

  const [selectedTower, setSelectedTower] = useState<TowerId>('Tower A');
  const [hoveredTower, setHoveredTower] = useState<TowerId | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'campus' | 'units'>('campus');

  // Compute live occupancy metrics for Towers A, B, and C strictly from resident database
  // Formula: Occupancy % = (Verified Residents in Tower / Total Flats in Tower) * 100
  const towerStats = useMemo<Record<TowerId, TowerOccupancyStats>>(() => {
    const calculateForTower = (
      tower: TowerId,
      bldgLabel: string,
      wingNumber: number,
      floorsCount: number
    ): TowerOccupancyStats => {
      const totalUnits = TOWER_UNIT_COUNTS[tower];

      // Find all profiles for this tower that are not rejected
      const towerProfiles = profiles.filter(
        (p) => p.tower === tower && p.status !== 'Rejected'
      );

      // Verified residents in tower
      const approvedCount = towerProfiles.filter((p) => p.isApproved).length;
      const pendingCount = towerProfiles.filter(
        (p) => !p.isApproved || p.status === 'Pending Approval'
      );
      const ownersCount = towerProfiles.filter((p) => p.ownershipType === 'Owner').length;
      const tenantsCount = towerProfiles.filter((p) => p.ownershipType === 'Tenant').length;

      // Unique occupied flats count
      const occupiedFlatNumbers = new Set(towerProfiles.map((p) => p.flatNo.toUpperCase()));
      const occupiedUnits = occupiedFlatNumbers.size;
      const vacantUnits = Math.max(0, totalUnits - occupiedUnits);

      // Occupancy % = (Verified Residents in Tower / Total Flats in Tower) * 100
      const occupancyRate = Math.min(100, Math.round((approvedCount / totalUnits) * 100));

      let statusBadge = {
        label: 'High Occupancy',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
      };

      if (occupancyRate < 35) {
        statusBadge = {
          label: 'Handover Active',
          color: 'text-amber-700',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
        };
      } else if (occupancyRate < 70) {
        statusBadge = {
          label: 'Moderate Occupancy',
          color: 'text-teal-700',
          bg: 'bg-teal-50',
          border: 'border-teal-200',
        };
      }

      return {
        tower,
        bldgLabel,
        wingNumber,
        floorsCount,
        totalUnits,
        occupiedUnits,
        vacantUnits,
        approvedCount,
        pendingCount: pendingCount.length,
        ownersCount,
        tenantsCount,
        occupancyRate,
        statusBadge,
      };
    };

    return {
      'Tower A': calculateForTower('Tower A', 'BLDG. A', 1, 6),
      'Tower B': calculateForTower('Tower B', 'BLDG. B', 2, 6),
      'Tower C': calculateForTower('Tower C', 'BLDG. C', 3, 8),
    };
  }, [profiles]);

  // Overall society summary across all 200 units
  const totalSocietyUnits = TOTAL_SOCIETY_UNITS; // 200 units
  const totalVerifiedResidents =
    towerStats['Tower A'].approvedCount +
    towerStats['Tower B'].approvedCount +
    towerStats['Tower C'].approvedCount;
  const overallOccupancyRate = Math.min(
    100,
    Math.round((totalVerifiedResidents / totalSocietyUnits) * 100)
  );

  // Selected tower stats
  const activeStats = towerStats[selectedTower];

  // Flat list for active selected tower matching the 6-floor architectural scheme
  const unitList = useMemo(() => {
    let flats: string[] = [];
    if (selectedTower === 'Tower A') flats = TOWER_A_FLATS;
    else if (selectedTower === 'Tower B') flats = TOWER_B_FLATS;
    else flats = TOWER_C_FLATS;

    return flats.map((flatNo) => {
      // Extract floor from flatNo (e.g. A-101 -> 1, A-612 -> 6)
      const numPart = parseInt(flatNo.split('-')[1] || '101', 10);
      const floor = Math.floor(numPart / 100);

      const profile = profiles.find(
        (p) => p.flatNo.toUpperCase() === flatNo.toUpperCase() && p.status !== 'Rejected'
      );

      return {
        flatNo,
        floor,
        isOccupied: Boolean(profile),
        isApproved: Boolean(profile?.isApproved),
        residentName: profile?.name,
        ownershipType: profile?.ownershipType,
        phone: profile?.phone,
      };
    });
  }, [selectedTower, profiles]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-slate-100">
      {/* Header Bar */}
      <div className="p-5 sm:p-7 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 text-[11px] font-bold border border-teal-500/20">
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            <span>Architectural Master Site Plan · 200 Units</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>Solitaire CHS Master Site Map & Tower Occupancy</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
            Architectural layout of Towers A, B, and C with live occupancy computed from verified residents in Supabase. Peripheral driveway, central pool complex, clubhouse, and utility services mapped to scale.
          </p>
        </div>

        {/* View Switcher & Global Occupancy Metric */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 bg-slate-800/80 rounded-xl border border-slate-700/80 text-right backdrop-blur-xs">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Society Live Occupancy
            </span>
            <div className="flex items-baseline gap-1.5 justify-end">
              <span className="text-lg font-black text-teal-400 font-mono">
                {overallOccupancyRate}%
              </span>
              <span className="text-xs text-slate-300 font-medium">
                ({totalVerifiedResidents} / {totalSocietyUnits} Flats)
              </span>
            </div>
          </div>

          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('campus')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'campus'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Architectural Site Map
            </button>
            <button
              type="button"
              onClick={() => setViewMode('units')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'units'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Unit Floor Matrix (6 Floors)
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left Column: Interactive Vector SVG Site Map (8 Cols) */}
        <div className="lg:col-span-8 p-4 sm:p-6 bg-[#090E17] border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between">
          <div className="relative w-full aspect-16/10 rounded-2xl overflow-hidden border border-slate-800 bg-[#0B1120] shadow-inner select-none">
            {/* SVG Architectural Canvas */}
            <svg
              viewBox="0 0 1000 620"
              className="w-full h-full"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }}
            >
              <defs>
                {/* Architectural Blueprint Grid Pattern */}
                <pattern id="archGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="#1E293B"
                    strokeWidth="0.8"
                    strokeDasharray="2 3"
                  />
                </pattern>

                <linearGradient id="poolGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="50%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>

                <linearGradient id="kidsPoolGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>

                <linearGradient id="towerAGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#115e59" />
                  <stop offset="100%" stopColor="#0f766e" />
                </linearGradient>

                <linearGradient id="towerBGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#312e81" />
                  <stop offset="100%" stopColor="#3730a3" />
                </linearGradient>

                <linearGradient id="towerCGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#064e3b" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>

                <linearGradient id="clubhouseGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>

                <linearGradient id="lawnGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#064e3b" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#047857" stopOpacity="0.15" />
                </linearGradient>

                <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#14b8a6" floodOpacity="0.4" />
                </filter>
                <filter id="towerGlowA" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#2dd4bf" floodOpacity="0.35" />
                </filter>
                <filter id="towerGlowB" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#818cf8" floodOpacity="0.35" />
                </filter>
                <filter id="towerGlowC" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#34d399" floodOpacity="0.35" />
                </filter>

                {/* Road arrow marker */}
                <marker
                  id="trafficArrow"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#38bdf8" />
                </marker>
              </defs>

              {/* Background with Grid */}
              <rect width="1000" height="620" fill="#0B1120" />
              <rect width="1000" height="620" fill="url(#archGrid)" />

              {/* Society Outer Boundary Fence */}
              <rect
                x="20"
                y="20"
                width="960"
                height="580"
                rx="24"
                fill="none"
                stroke="#334155"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <text x="35" y="42" fill="#64748B" fontSize="9" fontWeight="bold" letterSpacing="1">
                KOOL HOMES SOLITAIRE CHS · ARCHITECTURAL SITE MASTERPLAN · TOTAL 200 UNITS
              </text>

              {/* ======================================================== */}
              {/* PERIPHERAL INTERNAL DRIVEWAY & TRAFFIC FLOW */}
              {/* Surrounding peripheral road leading from Main Entry (left), */}
              {/* past Towers A and B, around Tower C, to RAMP DN (top-right) */}
              {/* ======================================================== */}
              {/* Outer driveway track (slate road surface) */}
              <path
                d="M 20 325 L 80 325 Q 90 325 90 360 L 90 575 Q 90 595 120 595 L 700 595 Q 730 595 750 580 L 880 500 Q 960 450 960 360 L 960 160 Q 960 80 890 80 L 830 80 Q 770 80 750 95 L 230 95 Q 210 95 210 120 L 210 325 Z"
                fill="none"
                stroke="#1E293B"
                strokeWidth="50"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 20 325 L 80 325 Q 90 325 90 360 L 90 575 Q 90 595 120 595 L 700 595 Q 730 595 750 580 L 880 500 Q 960 450 960 360 L 960 160 Q 960 80 890 80 L 830 80 Q 770 80 750 95 L 230 95 Q 210 95 210 120 L 210 325 Z"
                fill="none"
                stroke="#334155"
                strokeWidth="42"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Road center dashed line */}
              <path
                d="M 20 325 L 80 325 Q 90 325 90 360 L 90 575 Q 90 595 120 595 L 700 595 Q 730 595 750 580 L 880 500 Q 960 450 960 360 L 960 160 Q 960 80 890 80 L 830 80 Q 770 80 750 95 L 230 95 Q 210 95 210 120 L 210 325 Z"
                fill="none"
                stroke="#64748B"
                strokeWidth="1.5"
                strokeDasharray="6 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Road Traffic Directional Arrows */}
              {/* Arrow 1: Main entry inward */}
              <g transform="translate(60, 325)">
                <polygon points="0,-4 10,0 0,4 2,0" fill="#38bdf8" />
              </g>
              {/* Arrow 2: Past Tower A bottom */}
              <g transform="translate(240, 595)">
                <polygon points="-5,-4 5,0 -5,4 -3,0" fill="#38bdf8" />
              </g>
              {/* Arrow 3: Past Tower B bottom */}
              <g transform="translate(560, 595)">
                <polygon points="-5,-4 5,0 -5,4 -3,0" fill="#38bdf8" />
              </g>
              {/* Arrow 4: Rounding Tower C */}
              <g transform="translate(860, 515) rotate(-35)">
                <polygon points="-5,-4 5,0 -5,4 -3,0" fill="#38bdf8" />
              </g>
              {/* Arrow 5: Northward along east perimeter */}
              <g transform="translate(960, 320) rotate(-90)">
                <polygon points="-5,-4 5,0 -5,4 -3,0" fill="#38bdf8" />
              </g>
              {/* Arrow 6: Heading into RAMP DN */}
              <g transform="translate(920, 110) rotate(-135)">
                <polygon points="-5,-4 5,0 -5,4 -3,0" fill="#f59e0b" />
              </g>
              {/* Arrow 7: Top road returning left */}
              <g transform="translate(480, 95) rotate(180)">
                <polygon points="-5,-4 5,0 -5,4 -3,0" fill="#38bdf8" />
              </g>

              {/* ======================================================== */}
              {/* SERVICES AREA (TOP-LEFT BOUNDARY CORNER) */}
              {/* ======================================================== */}
              <g
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() =>
                  setHoveredZone(
                    'Services Area: 11kV Substation, MBBR STP/WTP (48k L/day), Twin 350 kVA DG Sets & Waste Segregation'
                  )
                }
                onMouseLeave={() => setHoveredZone(null)}
              >
                <rect
                  x="30"
                  y="30"
                  width="170"
                  height="100"
                  rx="12"
                  fill="#0F172A"
                  stroke="#475569"
                  strokeWidth="1.5"
                />
                <rect
                  x="35"
                  y="35"
                  width="160"
                  height="22"
                  rx="6"
                  fill="#1E293B"
                />
                <text
                  x="115"
                  y="50"
                  fill="#E2E8F0"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                  letterSpacing="0.5"
                >
                  ⚡ SERVICES AREA
                </text>

                {/* Substation Cell */}
                <rect x="36" y="62" width="46" height="60" rx="6" fill="#1E293B" stroke="#334155" />
                <text x="59" y="80" fill="#F59E0B" fontSize="8" fontWeight="bold" textAnchor="middle">
                  11 kV
                </text>
                <text x="59" y="93" fill="#94A3B8" fontSize="7" textAnchor="middle">
                  SUBSTATION
                </text>
                <text x="59" y="108" fill="#64748B" fontSize="6.5" textAnchor="middle">
                  TRANSFORMER
                </text>

                {/* STP / WTP Plant Cell */}
                <rect x="88" y="62" width="50" height="60" rx="6" fill="#1E293B" stroke="#0284c7" strokeWidth="0.8" />
                <text x="113" y="80" fill="#38BDF8" fontSize="8" fontWeight="bold" textAnchor="middle">
                  STP / WTP
                </text>
                <text x="113" y="93" fill="#94A3B8" fontSize="7" textAnchor="middle">
                  MBBR PLANT
                </text>
                <text x="113" y="108" fill="#0284C7" fontSize="6.5" textAnchor="middle">
                  48k L / DAY
                </text>

                {/* DG Backup Yard */}
                <rect x="144" y="62" width="50" height="60" rx="6" fill="#1E293B" stroke="#334155" />
                <text x="169" y="80" fill="#10B981" fontSize="8" fontWeight="bold" textAnchor="middle">
                  DG YARD
                </text>
                <text x="169" y="93" fill="#94A3B8" fontSize="7" textAnchor="middle">
                  TWIN 350kVA
                </text>
                <text x="169" y="108" fill="#64748B" fontSize="6.5" textAnchor="middle">
                  CUMMINS
                </text>
              </g>

              {/* ======================================================== */}
              {/* MAIN ENTRY / EXIT GATE (LEFT SIDE OF MAP) */}
              {/* Directional traffic arrows leading into & out of society */}
              {/* ======================================================== */}
              <g
                className="cursor-pointer"
                onMouseEnter={() =>
                  setHoveredZone(
                    'Main Entry & Exit Gate: FastTag RFID Ingress, ANPR Cameras, Security Cabin & Visitor Gate'
                  )
                }
                onMouseLeave={() => setHoveredZone(null)}
              >
                {/* Gate Base Platform */}
                <rect
                  x="15"
                  y="280"
                  width="65"
                  height="90"
                  rx="10"
                  fill="#0F172A"
                  stroke="#38BDF8"
                  strokeWidth="1.5"
                />
                <rect x="18" y="285" width="59" height="24" rx="6" fill="#0284C7" />
                <text
                  x="47"
                  y="300"
                  fill="#FFFFFF"
                  fontSize="8.5"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  MAIN GATE
                </text>

                {/* Security Cabin */}
                <rect x="22" y="315" width="50" height="48" rx="6" fill="#1E293B" stroke="#334155" />
                <text x="47" y="333" fill="#E2E8F0" fontSize="8" fontWeight="bold" textAnchor="middle">
                  SECURITY
                </text>
                <text x="47" y="347" fill="#94A3B8" fontSize="7" textAnchor="middle">
                  CABIN & ANPR
                </text>

                {/* Boom Barriers (Red-White striped lines) */}
                <line x1="80" y1="310" x2="80" y2="335" stroke="#EF4444" strokeWidth="3" strokeDasharray="5 3" />
                <line x1="80" y1="340" x2="80" y2="365" stroke="#38BDF8" strokeWidth="3" strokeDasharray="5 3" />

                {/* Traffic Lane Labels */}
                <text x="50" y="270" fill="#38BDF8" fontSize="8" fontWeight="bold">
                  ENTRY ➔
                </text>
                <text x="50" y="388" fill="#EF4444" fontSize="8" fontWeight="bold">
                  ⬅ EXIT
                </text>
              </g>

              {/* ======================================================== */}
              {/* ZONE 5: CLUBHOUSE / FACILITY BUILDING (LEFT SIDE) */}
              {/* Located adjacent to the Main Entry */}
              {/* ======================================================== */}
              <g
                className="cursor-pointer transition-all duration-300"
                onClick={() => setActiveTab('amenities')}
                onMouseEnter={() =>
                  setHoveredZone(
                    'Zone 5: Clubhouse & Facility Building · AC Gym, Banquet Hall, Indoor Squash & Table Tennis'
                  )
                }
                onMouseLeave={() => setHoveredZone(null)}
              >
                <rect
                  x="65"
                  y="145"
                  width="150"
                  height="120"
                  rx="14"
                  fill="#0F172A"
                  stroke="#0284C7"
                  strokeWidth="2"
                  filter="url(#neonGlow)"
                />
                <rect x="70" y="150" width="140" height="110" rx="10" fill="#1E293B" />

                {/* Clubhouse Skylight / Glass Roof */}
                <rect
                  x="85"
                  y="160"
                  width="110"
                  height="36"
                  rx="6"
                  fill="#0284C7"
                  fillOpacity="0.25"
                  stroke="#38BDF8"
                  strokeWidth="1"
                />
                <text
                  x="140"
                  y="178"
                  fill="#FFFFFF"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  CLUBHOUSE
                </text>
                <text
                  x="140"
                  y="190"
                  fill="#7DD3FC"
                  fontSize="8"
                  fontWeight="semibold"
                  textAnchor="middle"
                >
                  ZONE 5 · FACILITY
                </text>

                {/* Facility Details */}
                <rect x="78" y="206" width="60" height="44" rx="6" fill="#0F172A" />
                <text x="108" y="222" fill="#E2E8F0" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                  FITNESS GYM
                </text>
                <text x="108" y="238" fill="#94A3B8" fontSize="6.5" textAnchor="middle">
                  Cardio & Free Wts
                </text>

                <rect x="144" y="206" width="60" height="44" rx="6" fill="#0F172A" />
                <text x="174" y="222" fill="#E2E8F0" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                  BANQUET
                </text>
                <text x="174" y="238" fill="#94A3B8" fontSize="6.5" textAnchor="middle">
                  Capacity: 150
                </text>
              </g>

              {/* ======================================================== */}
              {/* CENTRAL PODIUM & AMENITY HUB (BETWEEN TOWERS & TOP ROAD) */}
              {/* ======================================================== */}
              {/* Landscaped Podium Base */}
              <rect
                x="235"
                y="130"
                width="535"
                height="265"
                rx="20"
                fill="url(#lawnGrad)"
                stroke="#059669"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />

              {/* Zone 11: Peripheral Jogging & Strolling Track encircling podium */}
              <rect
                x="242"
                y="137"
                width="521"
                height="251"
                rx="16"
                fill="none"
                stroke="#047857"
                strokeWidth="5"
                strokeOpacity="0.4"
              />
              <text x="500" y="382" fill="#6EE7B7" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                ZONE 11 · PERIPHERAL JOGGING & MORNING WALK TRACK (380M)
              </text>

              {/* ======================================================== */}
              {/* SWIMMING POOL COMPLEX (ZONES 2, 3, 4) - POSITIONED CENTRALLY */}
              {/* ======================================================== */}
              {/* Zone 4: Pool Deck & Sun Loungers */}
              <g
                className="cursor-pointer transition-transform hover:scale-[1.01]"
                onClick={() => setActiveTab('amenities')}
                onMouseEnter={() =>
                  setHoveredZone(
                    'Swimming Pool Complex (Zones 2, 3, 4): Semi-Olympic Lap Pool (25m), Kids Splash Pool & Timber Sun Deck'
                  )
                }
                onMouseLeave={() => setHoveredZone(null)}
              >
                <rect
                  x="255"
                  y="150"
                  width="190"
                  height="135"
                  rx="14"
                  fill="#0F172A"
                  stroke="#38BDF8"
                  strokeWidth="1.5"
                />
                <rect x="258" y="153" width="184" height="129" rx="12" fill="#1E293B" />
                <text x="350" y="167" fill="#7DD3FC" fontSize="8" fontWeight="bold" textAnchor="middle">
                  ZONE 4: TIMBER POOL DECK & CABANAS
                </text>

                {/* Zone 2: Main Semi-Olympic Swimming Pool */}
                <rect
                  x="266"
                  y="173"
                  width="125"
                  height="100"
                  rx="8"
                  fill="url(#poolGrad)"
                  stroke="#7DD3FC"
                  strokeWidth="1"
                />
                {/* Lane Float Dividers */}
                <line x1="266" y1="198" x2="391" y2="198" stroke="#FFFFFF" strokeWidth="0.8" strokeDasharray="6 4" strokeOpacity="0.8" />
                <line x1="266" y1="223" x2="391" y2="223" stroke="#FFFFFF" strokeWidth="0.8" strokeDasharray="6 4" strokeOpacity="0.8" />
                <line x1="266" y1="248" x2="391" y2="248" stroke="#FFFFFF" strokeWidth="0.8" strokeDasharray="6 4" strokeOpacity="0.8" />
                <text x="328" y="226" fill="#FFFFFF" fontSize="9.5" fontWeight="black" textAnchor="middle">
                  ZONE 2: MAIN POOL
                </text>
                <text x="328" y="238" fill="#E0F2FE" fontSize="7.5" fontWeight="semibold" textAnchor="middle">
                  25m Semi-Olympic · Cl 1.5 ppm
                </text>

                {/* Zone 3: Kids Wading Pool */}
                <rect
                  x="398"
                  y="180"
                  width="40"
                  height="85"
                  rx="8"
                  fill="url(#kidsPoolGrad)"
                  stroke="#A5F3FC"
                  strokeWidth="1"
                />
                <text x="418" y="215" fill="#083344" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                  ZONE 3
                </text>
                <text x="418" y="227" fill="#083344" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                  KIDS
                </text>
                <text x="418" y="239" fill="#083344" fontSize="6" textAnchor="middle">
                  SPLASH
                </text>
              </g>

              {/* ======================================================== */}
              {/* LANDSCAPED LAWNS & OPEN SPACES AROUND POOL DECK */}
              {/* (Zones 1, 6, 7, 8, 10, 12, 13) */}
              {/* ======================================================== */}
              {/* Zone 1: Entry Plaza & Water Fountain (near gate & clubhouse) */}
              <g
                className="cursor-pointer"
                onMouseEnter={() =>
                  setHoveredZone('Zone 1: Grand Entry Plaza, Water Cascade & Palm Court')
                }
                onMouseLeave={() => setHoveredZone(null)}
              >
                <rect x="255" y="300" width="75" height="65" rx="10" fill="#0F172A" stroke="#10B981" strokeWidth="1" />
                <circle cx="292" cy="328" r="16" fill="#065F46" stroke="#34D399" strokeWidth="1" />
                <circle cx="292" cy="328" r="6" fill="#6EE7B7" />
                <text x="292" y="355" fill="#A7F3D0" fontSize="7" fontWeight="bold" textAnchor="middle">
                  ZONE 1: PLAZA
                </text>
              </g>

              {/* Zone 12: Flower Pergola Walkway */}
              <g
                className="cursor-pointer"
                onMouseEnter={() =>
                  setHoveredZone('Zone 12: Flowering Bougainvillea Pergola & Shaded Reading Benches')
                }
                onMouseLeave={() => setHoveredZone(null)}
              >
                <rect x="340" y="300" width="105" height="65" rx="10" fill="#0F172A" stroke="#4ADE80" strokeWidth="1" />
                <line x1="345" y1="320" x2="440" y2="320" stroke="#86EFAC" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="345" y1="340" x2="440" y2="340" stroke="#86EFAC" strokeWidth="2" strokeDasharray="4 4" />
                <text x="392" y="315" fill="#BBF7D0" fontSize="7" fontWeight="bold" textAnchor="middle">
                  ZONE 12: PERGOLA
                </text>
                <text x="392" y="355" fill="#86EFAC" fontSize="6.5" textAnchor="middle">
                  Flower Arbor & Benches
                </text>
              </g>

              {/* Zone 6: Central Great Lawn & Amphitheatre */}
              <g
                className="cursor-pointer"
                onMouseEnter={() =>
                  setHoveredZone('Zone 6: Central Amphitheatre & Festive Multi-Purpose Great Lawn')
                }
                onMouseLeave={() => setHoveredZone(null)}
              >
                <rect x="460" y="150" width="155" height="90" rx="12" fill="#064E3B" stroke="#10B981" strokeWidth="1.5" />
                {/* Stepped seating arcs */}
                <path d="M 475 225 Q 537 175 600 225" fill="none" stroke="#34D399" strokeWidth="2" strokeOpacity="0.7" />
                <path d="M 485 230 Q 537 190 590 230" fill="none" stroke="#34D399" strokeWidth="2" strokeOpacity="0.7" />
                <text x="537" y="172" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">
                  ZONE 6: GREAT LAWN
                </text>
                <text x="537" y="185" fill="#A7F3D0" fontSize="7.5" textAnchor="middle">
                  Amphitheatre & Festivals
                </text>
              </g>

              {/* Zone 7: Children's Play Area & Sandbox */}
              <g
                className="cursor-pointer"
                onClick={() => setActiveTab('amenities')}
                onMouseEnter={() =>
                  setHoveredZone("Zone 7: Children's Play Park, Rubberized Turf, Swings & Slides")
                }
                onMouseLeave={() => setHoveredZone(null)}
              >
                <rect x="460" y="250" width="155" height="115" rx="12" fill="#0F172A" stroke="#F59E0B" strokeWidth="1.5" />
                <rect x="465" y="255" width="145" height="105" rx="8" fill="#78350F" fillOpacity="0.3" />
                <circle cx="500" cy="305" r="16" fill="#F59E0B" fillOpacity="0.25" stroke="#F59E0B" strokeWidth="1.5" />
                <circle cx="570" cy="305" r="16" fill="#10B981" fillOpacity="0.25" stroke="#10B981" strokeWidth="1.5" />
                <text x="537" y="275" fill="#FDE68A" fontSize="9" fontWeight="bold" textAnchor="middle">
                  ZONE 7: PLAY PARK
                </text>
                <text x="537" y="340" fill="#FCD34D" fontSize="7.5" textAnchor="middle">
                  Swings · Slides · Sandpit
                </text>
              </g>

              {/* Zone 8: Senior Citizens Seating Plaza */}
              <g
                className="cursor-pointer"
                onMouseEnter={() =>
                  setHoveredZone('Zone 8: Senior Citizens Pavilion, Champa Court & Gazebo')
                }
                onMouseLeave={() => setHoveredZone(null)}
              >
                <rect x="630" y="150" width="125" height="65" rx="10" fill="#0F172A" stroke="#60A5FA" strokeWidth="1" />
                <text x="692" y="172" fill="#BFDBFE" fontSize="8" fontWeight="bold" textAnchor="middle">
                  ZONE 8: SENIOR PLAZA
                </text>
                <text x="692" y="190" fill="#93C5FD" fontSize="7" textAnchor="middle">
                  Champa Court & Gazebo
                </text>
              </g>

              {/* Zone 10: Acupressure Walkway & Zen Garden */}
              <g
                className="cursor-pointer"
                onMouseEnter={() =>
                  setHoveredZone('Zone 10: Reflexology Acupressure Walkway & Zen Meditation Garden')
                }
                onMouseLeave={() => setHoveredZone(null)}
              >
                <rect x="630" y="225" width="125" height="65" rx="10" fill="#0F172A" stroke="#A78BFA" strokeWidth="1" />
                <path d="M 640 255 Q 692 235 745 255 Q 692 275 640 255 Z" fill="#4C1D95" stroke="#C4B5FD" strokeWidth="1" />
                <text x="692" y="243" fill="#DDD6FE" fontSize="8" fontWeight="bold" textAnchor="middle">
                  ZONE 10: REFLEXOLOGY
                </text>
                <text x="692" y="278" fill="#C4B5FD" fontSize="7" textAnchor="middle">
                  Pebble Path & Zen Garden
                </text>
              </g>

              {/* Zone 13: Half Basketball & Badminton Multicourt */}
              <g
                className="cursor-pointer"
                onClick={() => setActiveTab('amenities')}
                onMouseEnter={() =>
                  setHoveredZone('Zone 13: Half Basketball & Badminton Multi-Sport Hardcourt')
                }
                onMouseLeave={() => setHoveredZone(null)}
              >
                <rect x="630" y="300" width="125" height="65" rx="10" fill="#0F172A" stroke="#FB923C" strokeWidth="1" />
                <rect x="635" y="305" width="115" height="55" rx="6" fill="#7C2D12" fillOpacity="0.4" stroke="#F97316" strokeWidth="0.8" />
                <circle cx="692" cy="332" r="14" fill="none" stroke="#FDBA74" strokeWidth="1" />
                <line x1="692" y1="305" x2="692" y2="360" stroke="#FDBA74" strokeWidth="1" />
                <text x="692" y="322" fill="#FED7AA" fontSize="8" fontWeight="bold" textAnchor="middle">
                  ZONE 13: MULTICOURT
                </text>
                <text x="692" y="348" fill="#FDBA74" fontSize="6.5" textAnchor="middle">
                  Basketball & Badminton
                </text>
              </g>

              {/* ======================================================== */}
              {/* TOWER A (BLDG. A) - BOTTOM-LEFT POSITION */}
              {/* 6 Floors, Total ~67 Units, Otis Elevators */}
              {/* ======================================================== */}
              <g
                className="cursor-pointer transition-all duration-300"
                onClick={() => setSelectedTower('Tower A')}
                onMouseEnter={() => setHoveredTower('Tower A')}
                onMouseLeave={() => setHoveredTower(null)}
              >
                {/* Building Structure Base */}
                <rect
                  x="95"
                  y="420"
                  width="285"
                  height="150"
                  rx="16"
                  fill={selectedTower === 'Tower A' ? 'url(#towerAGrad)' : hoveredTower === 'Tower A' ? '#134e4a' : '#0F172A'}
                  stroke={selectedTower === 'Tower A' ? '#2DD4BF' : hoveredTower === 'Tower A' ? '#14B8A6' : '#334155'}
                  strokeWidth={selectedTower === 'Tower A' ? '3.5' : '1.5'}
                  filter={selectedTower === 'Tower A' ? 'url(#towerGlowA)' : undefined}
                />

                {/* 6 Floors Indicator Lines (matching 6-floor specification) */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <line
                    key={i}
                    x1="110"
                    y1={438 + i * 22}
                    x2="365"
                    y2={438 + i * 22}
                    stroke="#FFFFFF"
                    strokeWidth="0.8"
                    strokeOpacity={selectedTower === 'Tower A' ? 0.25 : 0.1}
                  />
                ))}

                {/* Elevator Core / Service Duct */}
                <rect x="215" y="430" width="45" height="35" rx="4" fill="#090E17" stroke="#2DD4BF" strokeWidth="0.8" />
                <text x="237" y="445" fill="#2DD4BF" fontSize="7" fontWeight="bold" textAnchor="middle">
                  OTIS
                </text>
                <text x="237" y="456" fill="#99F6E4" fontSize="6" textAnchor="middle">
                  ELEVATORS
                </text>

                {/* Building Labels */}
                <text x="160" y="475" fill="#FFFFFF" fontSize="16" fontWeight="black" textAnchor="middle" letterSpacing="0.5">
                  BLDG. A
                </text>
                <text x="160" y="493" fill="#99F6E4" fontSize="10.5" fontWeight="bold" textAnchor="middle">
                  TOWER A · 6 Floors (67 Units)
                </text>

                {/* Live Occupancy Badge on Tower */}
                <rect
                  x="110"
                  y="508"
                  width="135"
                  height="26"
                  rx="7"
                  fill={selectedTower === 'Tower A' ? '#FFFFFF' : '#0F766E'}
                  fillOpacity={selectedTower === 'Tower A' ? '0.95' : '0.8'}
                />
                <circle
                  cx="124"
                  cy="521"
                  r="4"
                  fill={towerStats['Tower A'].occupancyRate >= 70 ? '#10B981' : '#F59E0B'}
                />
                <text
                  x="180"
                  y="525"
                  fill={selectedTower === 'Tower A' ? '#0F172A' : '#FFFFFF'}
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {towerStats['Tower A'].occupancyRate}% OCCUPIED
                </text>

                <text x="180" y="555" fill="#94A3B8" fontSize="8.5" textAnchor="middle">
                  Verified: {towerStats['Tower A'].approvedCount} / 67 Flats · Bays P-A-101 to 130
                </text>
              </g>

              {/* ======================================================== */}
              {/* TOWER B (BLDG. B) - BOTTOM-CENTER/RIGHT POSITION */}
              {/* Horizontally aligned with Tower A, 6 Floors, Total ~67 Units */}
              {/* ======================================================== */}
              <g
                className="cursor-pointer transition-all duration-300"
                onClick={() => setSelectedTower('Tower B')}
                onMouseEnter={() => setHoveredTower('Tower B')}
                onMouseLeave={() => setHoveredTower(null)}
              >
                {/* Building Structure Base */}
                <rect
                  x="420"
                  y="420"
                  width="285"
                  height="150"
                  rx="16"
                  fill={selectedTower === 'Tower B' ? 'url(#towerBGrad)' : hoveredTower === 'Tower B' ? '#312E81' : '#0F172A'}
                  stroke={selectedTower === 'Tower B' ? '#818CF8' : hoveredTower === 'Tower B' ? '#6366F1' : '#334155'}
                  strokeWidth={selectedTower === 'Tower B' ? '3.5' : '1.5'}
                  filter={selectedTower === 'Tower B' ? 'url(#towerGlowB)' : undefined}
                />

                {/* 6 Floors Indicator Lines (matching 6-floor specification) */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <line
                    key={i}
                    x1="435"
                    y1={438 + i * 22}
                    x2="690"
                    y2={438 + i * 22}
                    stroke="#FFFFFF"
                    strokeWidth="0.8"
                    strokeOpacity={selectedTower === 'Tower B' ? 0.25 : 0.1}
                  />
                ))}

                {/* Service Stretcher Lift Core */}
                <rect x="540" y="430" width="45" height="35" rx="4" fill="#090E17" stroke="#818CF8" strokeWidth="0.8" />
                <text x="562" y="445" fill="#A5B4FC" fontSize="7" fontWeight="bold" textAnchor="middle">
                  STRETCHER
                </text>
                <text x="562" y="456" fill="#C7D2FE" fontSize="6" textAnchor="middle">
                  MED LIFT
                </text>

                {/* Building Labels */}
                <text x="485" y="475" fill="#FFFFFF" fontSize="16" fontWeight="black" textAnchor="middle" letterSpacing="0.5">
                  BLDG. B
                </text>
                <text x="485" y="493" fill="#C7D2FE" fontSize="10.5" fontWeight="bold" textAnchor="middle">
                  TOWER B · 6 Floors (67 Units)
                </text>

                {/* Live Occupancy Badge on Tower */}
                <rect
                  x="435"
                  y="508"
                  width="135"
                  height="26"
                  rx="7"
                  fill={selectedTower === 'Tower B' ? '#FFFFFF' : '#4338CA'}
                  fillOpacity={selectedTower === 'Tower B' ? '0.95' : '0.8'}
                />
                <circle
                  cx="449"
                  cy="521"
                  r="4"
                  fill={towerStats['Tower B'].occupancyRate >= 70 ? '#10B981' : '#F59E0B'}
                />
                <text
                  x="505"
                  y="525"
                  fill={selectedTower === 'Tower B' ? '#0F172A' : '#FFFFFF'}
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {towerStats['Tower B'].occupancyRate}% OCCUPIED
                </text>

                <text x="505" y="555" fill="#94A3B8" fontSize="8.5" textAnchor="middle">
                  Verified: {towerStats['Tower B'].approvedCount} / 67 Flats · Bays P-B-101 to 130
                </text>
              </g>

              {/* ======================================================== */}
              {/* TOWER C (BLDG. C) - RIGHT-HAND SIDE, ROTATED AT AN ANGLE */}
              {/* Rotated as per architectural drawing, 6 Floors, Total ~66 Units */}
              {/* ======================================================== */}
              <g
                className="cursor-pointer transition-all duration-300"
                onClick={() => setSelectedTower('Tower C')}
                onMouseEnter={() => setHoveredTower('Tower C')}
                onMouseLeave={() => setHoveredTower(null)}
                transform="rotate(-20 855 350)"
              >
                {/* Building Structure Base (Angled) */}
                <rect
                  x="770"
                  y="220"
                  width="170"
                  height="260"
                  rx="18"
                  fill={selectedTower === 'Tower C' ? 'url(#towerCGrad)' : hoveredTower === 'Tower C' ? '#064E3B' : '#0F172A'}
                  stroke={selectedTower === 'Tower C' ? '#34D399' : hoveredTower === 'Tower C' ? '#10B981' : '#334155'}
                  strokeWidth={selectedTower === 'Tower C' ? '3.5' : '1.5'}
                  filter={selectedTower === 'Tower C' ? 'url(#towerGlowC)' : undefined}
                />

                {/* 6 Floors Indicator Lines (matching 6-floor specification) */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <line
                    key={i}
                    x1="785"
                    y1={240 + i * 36}
                    x2="925"
                    y2={240 + i * 36}
                    stroke="#FFFFFF"
                    strokeWidth="0.8"
                    strokeOpacity={selectedTower === 'Tower C' ? 0.25 : 0.1}
                  />
                ))}

                {/* EV Charging & Lift Core */}
                <rect x="830" y="235" width="50" height="35" rx="4" fill="#090E17" stroke="#34D399" strokeWidth="0.8" />
                <text x="855" y="250" fill="#34D399" fontSize="7" fontWeight="bold" textAnchor="middle">
                  EV CHARGE
                </text>
                <text x="855" y="261" fill="#A7F3D0" fontSize="6" textAnchor="middle">
                  OTIS CORE
                </text>

                {/* Building Labels */}
                <text x="855" y="310" fill="#FFFFFF" fontSize="16" fontWeight="black" textAnchor="middle" letterSpacing="0.5">
                  BLDG. C
                </text>
                <text x="855" y="328" fill="#A7F3D0" fontSize="10.5" fontWeight="bold" textAnchor="middle">
                  TOWER C · 6 Floors
                </text>
                <text x="855" y="343" fill="#6EE7B7" fontSize="9" fontWeight="semibold" textAnchor="middle">
                  (66 Units)
                </text>

                {/* Live Occupancy Badge on Tower */}
                <rect
                  x="788"
                  y="370"
                  width="134"
                  height="26"
                  rx="7"
                  fill={selectedTower === 'Tower C' ? '#FFFFFF' : '#047857'}
                  fillOpacity={selectedTower === 'Tower C' ? '0.95' : '0.8'}
                />
                <circle
                  cx="802"
                  cy="383"
                  r="4"
                  fill={towerStats['Tower C'].occupancyRate >= 70 ? '#10B981' : '#F59E0B'}
                />
                <text
                  x="858"
                  y="387"
                  fill={selectedTower === 'Tower C' ? '#0F172A' : '#FFFFFF'}
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {towerStats['Tower C'].occupancyRate}% OCCUPIED
                </text>

                <text x="855" y="425" fill="#94A3B8" fontSize="8" textAnchor="middle">
                  Verified: {towerStats['Tower C'].approvedCount} / 66 Flats
                </text>
                <text x="855" y="445" fill="#CBD5E1" fontSize="7.5" textAnchor="middle">
                  Fire Refuge & Angled Wing
                </text>
              </g>

              {/* ======================================================== */}
              {/* RAMP DN (BASEMENT RAMP) - TOP-RIGHT CORNER */}
              {/* ======================================================== */}
              <g
                className="cursor-pointer"
                onMouseEnter={() =>
                  setHoveredZone(
                    'RAMP DN: Direct Vehicular Ingress Ramp to Multi-Level Basement Parking (B1 / B2) · Height Clearance 2.4m'
                  )
                }
                onMouseLeave={() => setHoveredZone(null)}
              >
                <rect
                  x="840"
                  y="35"
                  width="120"
                  height="65"
                  rx="10"
                  fill="#0F172A"
                  stroke="#F59E0B"
                  strokeWidth="1.5"
                />
                <rect x="844" y="39" width="112" height="57" rx="8" fill="#1E293B" />

                {/* Ramp downward slope stripe hatching */}
                <line x1="850" y1="50" x2="865" y2="85" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 3" />
                <line x1="865" y1="50" x2="880" y2="85" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 3" />
                <line x1="880" y1="50" x2="895" y2="85" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 3" />
                <line x1="895" y1="50" x2="910" y2="85" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 3" />

                <text x="925" y="57" fill="#FCD34D" fontSize="9" fontWeight="black" textAnchor="middle">
                  RAMP DN
                </text>
                <text x="925" y="70" fill="#E2E8F0" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                  BASEMENT B1/B2
                </text>
                <text x="925" y="82" fill="#94A3B8" fontSize="6.5" textAnchor="middle">
                  Height: 2.4m
                </text>
              </g>

              {/* Compass Rose */}
              <g transform="translate(945, 140)">
                <circle cx="0" cy="0" r="16" fill="#0F172A" stroke="#475569" strokeWidth="1.5" />
                <polygon points="0,-12 4,2 0,-1" fill="#EF4444" />
                <polygon points="0,12 4,-2 0,1" fill="#64748B" />
                <polygon points="0,-12 -4,2 0,-1" fill="#DC2626" />
                <polygon points="0,12 -4,-2 0,1" fill="#94A3B8" />
                <text x="0" y="-15" fill="#F8FAFC" fontSize="8" fontWeight="bold" textAnchor="middle">
                  N
                </text>
              </g>
            </svg>

            {/* Hover Tooltip / Status Floating Bar */}
            {hoveredZone && (
              <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 px-3 py-2 bg-slate-950/95 text-white text-xs font-semibold rounded-xl backdrop-blur-md shadow-2xl border border-teal-500/40 pointer-events-none flex items-center gap-2 animate-in fade-in duration-100">
                <Info className="w-4 h-4 text-teal-400 shrink-0" />
                <span className="truncate">{hoveredZone}</span>
              </div>
            )}
          </div>

          {/* Interactive Legend & Quick Switchers */}
          <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Select Tower:
              </span>
              {(['Tower A', 'Tower B', 'Tower C'] as TowerId[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTower(t)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer border ${
                    selectedTower === t
                      ? 'bg-teal-600 text-white border-teal-500 shadow-md ring-2 ring-teal-500/20'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {t} ({towerStats[t].bldgLabel})
                  <span className="ml-1.5 font-mono text-[10px] text-teal-300">
                    {towerStats[t].occupancyRate}%
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Verified Occupied</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span>Pending Verification</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                <span>Vacant</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Data Inspector & Floor Breakdown (4 Cols) */}
        <div className="lg:col-span-4 p-5 sm:p-6 flex flex-col justify-between space-y-5 bg-slate-900/90 text-slate-100">
          {/* Tower Details Header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block">
                  {activeStats.bldgLabel} (Wing {activeStats.wingNumber}) Inspector
                </span>
                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>{activeStats.tower}</span>
                  <span className="text-xs font-normal text-slate-400">({activeStats.floorsCount} Floors)</span>
                </h3>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${activeStats.statusBadge.bg} ${activeStats.statusBadge.color} ${activeStats.statusBadge.border}`}
              >
                {activeStats.statusBadge.label}
              </span>
            </div>

            {/* Dynamic Occupancy Formula & Level */}
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300">Live Tower Occupancy</span>
                <span className="text-white font-mono font-bold text-sm">
                  {activeStats.approvedCount} / {activeStats.totalUnits} Units ({activeStats.occupancyRate}%)
                </span>
              </div>
              <div className="w-full h-3 bg-slate-700/80 rounded-full overflow-hidden p-0.5 border border-slate-600">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    activeStats.occupancyRate >= 70
                      ? 'bg-emerald-500'
                      : activeStats.occupancyRate >= 40
                      ? 'bg-teal-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${activeStats.occupancyRate}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Computed: (Verified Residents in {activeStats.tower} / {activeStats.totalUnits} Flats) × 100
              </p>
            </div>

            {/* Detailed Metric Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/70">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Verified Occupants
                </span>
                <span className="text-xl font-black font-mono text-emerald-400">
                  {activeStats.approvedCount}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">MC Approved</span>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/70">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Awaiting Approval
                </span>
                <span className="text-xl font-black font-mono text-amber-400">
                  {activeStats.pendingCount}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Docs Pending</span>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/70">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Owner Residents
                </span>
                <span className="text-base font-black font-mono text-slate-200">
                  {activeStats.ownersCount}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Title Owners</span>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/70">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Registered Tenants
                </span>
                <span className="text-base font-black font-mono text-slate-200">
                  {activeStats.tenantsCount}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Police Verified</span>
              </div>
            </div>

            {/* Unit Floor Matrix View (6 Floors) */}
            {viewMode === 'units' && (
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
                  <span className="font-bold text-white">
                    {activeStats.tower} Floor Matrix (6 Floors · {activeStats.totalUnits} Flats)
                  </span>
                  <span className="text-[10px] text-teal-400 font-mono">11-12 Flats/Fl</span>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1 text-xs">
                  {Array.from({ length: 6 }, (_, f) => 6 - f).map((floor) => {
                    const floorUnits = unitList.filter((u) => u.floor === floor);
                    return (
                      <div
                        key={floor}
                        className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/70 hover:border-slate-600 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-[11px] font-bold text-teal-300">
                            Floor {floor} ({floorUnits.length} Flats)
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {floorUnits.filter((u) => u.isApproved).length} Verified
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {floorUnits.map((u) => (
                            <span
                              key={u.flatNo}
                              title={`${u.flatNo}: ${
                                u.isOccupied
                                  ? `${u.residentName} (${u.ownershipType || 'Member'}) - ${
                                      u.isApproved ? 'Verified' : 'Pending'
                                    }`
                                  : 'Vacant / Unregistered'
                              }`}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-default transition-transform hover:scale-110 ${
                                !u.isOccupied
                                  ? 'bg-slate-700/80 text-slate-400 border border-slate-600'
                                  : u.isApproved
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                                  : 'bg-amber-950 text-amber-300 border border-amber-600'
                              }`}
                            >
                              {u.flatNo.split('-')[1]}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Architectural Wing Specifications */}
            <div className="p-3 bg-slate-800/60 border border-slate-700/80 rounded-xl text-xs space-y-1 text-slate-300">
              <span className="font-bold text-white block">Wing Architectural Specifications:</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {selectedTower === 'Tower A' &&
                  '6 Floors · 67 Units (Floors 1-5: 11 flats, Floor 6: 12 flats) · Otis high-speed elevators · Bottom-left orientation · FastTag bays P-A-101 to P-A-130.'}
                {selectedTower === 'Tower B' &&
                  '6 Floors · 67 Units (Floors 1-5: 11 flats, Floor 6: 12 flats) · Medical stretcher elevator · Horizontally aligned with Tower A · FastTag bays P-B-101 to P-B-130.'}
                {selectedTower === 'Tower C' &&
                  '6 Floors · 66 Units (Floors 1-6: 11 flats) · Rotated angle orientation on right perimeter · EV fast charging bays · Fire refuge shaft integration.'}
              </p>
            </div>
          </div>

          {/* Action Link to Resident Registry */}
          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={() => setActiveTab('registry')}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg group"
            >
              <span>Explore {activeStats.tower} in Member Registry</span>
              <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
