import React, { useState } from 'react';
import { useSociety } from '../../context/SocietyContext';
import {
  ShieldCheck,
  Building2,
  Lock,
  UserCheck,
  Bell,
  Clock,
  Waves,
  Dumbbell,
  Users,
  ChevronRight,
  PhoneCall,
  AlertTriangle,
  KeyRound,
  FileText,
  Car,
  Maximize2,
  Layers,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import heroImage from '../../assets/images/hero_solitaire_society_1790929946633.jpg';
import poolImage from '../../assets/images/amenity_swimming_pool_1790929965312.jpg';
import gymImage from '../../assets/images/amenity_modern_gym_1790929982674.jpg';
import layoutImg from '../../assets/images/solitaire_layout_1791127831982.jpg';
import clubhouseImg from '../../assets/images/solitaire_clubhouse_1791127802446.jpg';
import amenitiesImg from '../../assets/images/solitaire_amenities_1791127816486.jpg';

interface PublicLandingViewProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export const PublicLandingView: React.FC<PublicLandingViewProps> = ({ onOpenLogin, onOpenRegister }) => {
  const { notices, societyDetails } = useSociety();
  const [selectedPhoto, setSelectedPhoto] = useState<{ src: string; title: string; subtitle: string } | null>(null);

  return (
    <div className="space-y-12 pb-16 animate-in fade-in duration-300">
      {/* Lightbox Modal for Campus Images */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 bg-slate-950 flex items-center justify-between text-white border-b border-slate-800">
              <div>
                <h3 className="font-bold text-sm">{selectedPhoto.title}</h3>
                <p className="text-xs text-slate-400">{selectedPhoto.subtitle}</p>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="p-2 overflow-auto flex items-center justify-center bg-black/50">
              <img src={selectedPhoto.src} alt={selectedPhoto.title} className="max-h-[75vh] w-auto object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl">
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay">
          <img
            src={heroImage}
            alt="Solitaire Society"
            className="w-full h-full object-cover object-center"
          />
        </div>
        <div className="relative z-10 px-6 sm:px-12 py-16 sm:py-24 max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-xs">
            <Building2 className="w-3.5 h-3.5 text-teal-400" />
            <span>Kool Homes Solitaire CHS Ltd. · MahaRERA {societyDetails?.reraRegNo || 'P52100008192'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Official Community Portal & Resident Network
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            Welcome to Solitaire Cooperative Housing Society (Kool Homes Solitaire, Kausar Baugh, NIBM, Pune, Maharashtra 411048).
            Spanning {societyDetails?.landArea || '1.24 Acres'} with {societyDetails?.activeTowers?.length || 3} Towers, {societyDetails?.totalFloors || 6} Floors, and {societyDetails?.totalUnits || 200} Residential Units under Reg. No. {societyDetails?.societyRegNo || 'PNA/HSG/TC/12492/2018'}.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onOpenLogin}
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-teal-900/40 transition-all hover:scale-[1.02] cursor-pointer text-sm"
            >
              <KeyRound className="w-4 h-4" />
              <span>Resident & Staff Login</span>
            </button>
            <button
              onClick={onOpenRegister}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800/90 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 shadow-md transition-all hover:scale-[1.02] cursor-pointer text-sm"
            >
              <UserCheck className="w-4 h-4 text-teal-400" />
              <span>Register Your Flat</span>
            </button>
          </div>

          {/* Confidentiality Notice */}
          <div className="pt-4 flex items-start gap-2.5 text-xs text-slate-400 border-t border-slate-800/80">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-slate-200">Strict Confidentiality Gate:</strong> Member directories, financial balance sheets, vendor contracts, work orders, and helpdesk tickets are strictly protected and visible only to verified and approved residents.
            </span>
          </div>
        </div>
      </div>

      {/* Executive Security & Verification Gate Strip */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Secure Single-Primary-Member Verification Gate</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Access to Solitaire CHS registers, vendor procurement, and accounting is restricted strictly to authorized profiles in <code className="text-teal-700 font-mono font-semibold">public.members</code>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenLogin}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Sign In to Verified Account</span>
          </button>
          <button
            onClick={onOpenRegister}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <span>Register Flat Unit</span>
          </button>
        </div>
      </div>

      {/* Society Campus Architecture & Master Layout Showcase */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-700" />
              <h2 className="text-xl font-bold text-slate-900">Society Campus Architecture & Master Facilities</h2>
            </div>
            <p className="text-xs text-slate-500">
              Kool Homes Solitaire · Kausar Baugh, NIBM · 1.24 Acres · 3 Towers · 6 Floors · 200 Units · MahaRERA P52100008192
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">Click any image to inspect high-resolution blueprint</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Master Site Layout */}
          <div
            onClick={() =>
              setSelectedPhoto({
                src: layoutImg,
                title: 'Master Site Layout Plan — Kool Homes Solitaire CHS',
                subtitle: '1.24 Acres · Building A, Building B, Building C, Amphitheater Lawn, Swimming Pool & Clubhouse',
              })
            }
            className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-teal-400 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="h-52 relative overflow-hidden bg-slate-100">
              <img src={layoutImg} alt="Master Layout Plan" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-teal-400" />
                <span>Site Layout Blueprint</span>
              </div>
              <div className="absolute bottom-3 right-3 bg-white/90 text-slate-900 p-1.5 rounded-lg shadow-xs opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-3.5 h-3.5 text-slate-700" />
              </div>
            </div>
            <div className="p-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">Architectural Master Plan</span>
                <span className="text-teal-700 font-mono font-bold text-[11px]">1.24 Acres</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Site layout showing Buildings A, B & C, central swimming pool, amphitheater round lawn, security gates, and perimeter driveway.
              </p>
            </div>
          </div>

          {/* Card 2: Modern Clubhouse */}
          <div
            onClick={() =>
              setSelectedPhoto({
                src: clubhouseImg,
                title: 'Executive Clubhouse & Portico — Kool Homes Solitaire CHS',
                subtitle: 'Two-story community center with glass facade, multipurpose banquet, gymnasium, and terrace lawn',
              })
            }
            className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-teal-400 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="h-52 relative overflow-hidden bg-slate-100">
              <img src={clubhouseImg} alt="Club House" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Club House</span>
              </div>
              <div className="absolute bottom-3 right-3 bg-white/90 text-slate-900 p-1.5 rounded-lg shadow-xs opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-3.5 h-3.5 text-slate-700" />
              </div>
            </div>
            <div className="p-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">Clubhouse & Community Center</span>
                <span className="text-emerald-700 font-semibold text-[11px]">Active Facility</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Curved architectural facade with portico columns, glass reflection windows, indoor sports hall, and outdoor seating plaza.
              </p>
            </div>
          </div>

          {/* Card 3: Courtyard Amenities */}
          <div
            onClick={() =>
              setSelectedPhoto({
                src: amenitiesImg,
                title: 'Central Amphitheater Lawn & Courtyard — Kool Homes Solitaire CHS',
                subtitle: 'Residential towers overlooking the stepped amphitheater lawn, swimming pool deck, and landscaped gardens',
              })
            }
            className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-teal-400 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="h-52 relative overflow-hidden bg-slate-100">
              <img src={amenitiesImg} alt="Courtyard Amenities" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                <Waves className="w-3.5 h-3.5 text-teal-400" />
                <span>Courtyard & Pool</span>
              </div>
              <div className="absolute bottom-3 right-3 bg-white/90 text-slate-900 p-1.5 rounded-lg shadow-xs opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-3.5 h-3.5 text-slate-700" />
              </div>
            </div>
            <div className="p-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">Amphitheater & Pool Deck</span>
                <span className="text-teal-700 font-semibold text-[11px]">Towers A, B & C</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Central landscaped amphitheater with circular manicured lawn, pool deck cabanas, kids play area, and panoramic mountain views.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Public Notices Banner */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-700" />
            <h2 className="text-xl font-bold text-slate-900">Public Society Notices & Announcements</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Kool Homes Solitaire · Kausar Baugh, NIBM</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {notices.map((n) => (
            <div
              key={n.id}
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="font-semibold text-teal-700 uppercase tracking-wider">{n.category}</span>
                  <span className="text-slate-400 tabular-nums">{n.date}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 line-clamp-2">{n.title}</h3>
                <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">{n.summary}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Notice Board</span>
                <button
                  onClick={onOpenLogin}
                  className="text-teal-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Login to View</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Society Amenities Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Estate Amenities & Operations</h2>
            <p className="text-xs text-slate-500">Available to verified residents across Towers A, B & C</p>
          </div>
          <button
            onClick={onOpenLogin}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Book Slot via Portal &rarr;</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="h-44 relative overflow-hidden">
              <img src={poolImage} alt="Swimming Pool" className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3 bg-teal-900/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                <Waves className="w-3.5 h-3.5" />
                <span>Swimming Pool</span>
              </div>
            </div>
            <div className="p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Timings: 06:00 - 10:00 & 16:00 - 21:00</span>
                <span className="text-amber-600 font-semibold">Mon Closed</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Semi-Olympic swimming pool with ozonated filtration. Strict nylon/lycra swimwear is mandatory. Max 2 outside guests allowed per flat.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="h-44 relative overflow-hidden">
              <img src={gymImage} alt="Gymnasium" className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3 bg-teal-900/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                <Dumbbell className="w-3.5 h-3.5" />
                <span>Modern Fitness Gym</span>
              </div>
            </div>
            <div className="p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Timings: 05:00 - 22:00 Daily</span>
                <span className="text-emerald-600 font-semibold">Open 7 Days</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Full strength & cardio equipment, motorized treadmills, and cross-trainers. Clean indoor-only sports shoes and gym towels required.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="h-44 relative overflow-hidden">
              <img src={clubhouseImg} alt="Clubhouse Banquet" className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3 bg-teal-900/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>Clubhouse Banquet</span>
              </div>
            </div>
            <div className="p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Slot: 10:00 - 15:00 & 16:00 - 21:30</span>
                <span className="text-slate-600 font-semibold">₹5,000 Deposit</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Host birthdays, anniversaries, and family get-togethers. Music cut-off strictly at 22:00 PM per Pune Police bylaws.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 1 Flat 1 Member & Security Overview */}
      <div className="bg-teal-50/70 border border-teal-200/80 rounded-3xl p-8 space-y-6">
        <div className="max-w-3xl space-y-2">
          <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">Governance Standards</span>
          <h2 className="text-2xl font-bold text-slate-900">Single Member Per Flat Security & FastTag Access</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            To prevent unauthorized voting proxies and maintain accurate occupancy records, Solitaire CHS enforces a strict <strong>1 registered user account per flat</strong> constraint. All registered vehicles are tracked via RFID FastTag for seamless boom barrier entry.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-teal-100 shadow-xs space-y-2">
            <div className="p-2 bg-teal-100/60 text-teal-800 rounded-lg w-fit">
              <Building2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Predefined Flats (Towers A, B & C)</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              200 units across Towers A, B and upcoming Tower C in Kausar Baugh, NIBM. Zero duplicate accounts allowed.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-teal-100 shadow-xs space-y-2">
            <div className="p-2 bg-teal-100/60 text-teal-800 rounded-lg w-fit">
              <Car className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">FastTag / RFID Automated Gate</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Resident vehicles with verified society stickers & FastTags enter without manual guard logs.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-teal-100 shadow-xs space-y-2">
            <div className="p-2 bg-teal-100/60 text-teal-800 rounded-lg w-fit">
              <UserCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">MC Verification Gatekeeper</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every registration is scrutinized by Committee Members before unlocking member privileges.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

