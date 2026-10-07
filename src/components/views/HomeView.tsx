import React from 'react';
import { useSociety } from '../../context/SocietyContext';
import {
  Wrench,
  Calendar,
  ArrowRight,
  ClipboardCheck,
  Car,
  FolderOpen,
  Image as ImageIcon,
  Sliders,
  Settings,
  Building,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { PublicLandingView } from './PublicLandingView';
import { CommunityPollsSection } from '../polls/CommunityPollsSection';
import { CampusSiteMap } from '../campus/CampusSiteMap';
import heroImage from '../../assets/images/hero_solitaire_society_1790929946633.jpg';

export const HomeView: React.FC = () => {
  const {
    setActiveTab,
    setIsBookingModalOpen,
    setIsBookingModalOpen: _setBooking,
    setTargetAmenity,
    notices,
    role,
    isAuthenticated,
    isPendingApproval,
    userFlat,
    openLoginModal,
    openSocietySettingsModal,
    activeSociety,
    societyDetails,
  } = useSociety();

  // If unauthenticated visitor, display Public Landing Page
  if (!isAuthenticated) {
    return (
      <PublicLandingView
        onOpenLogin={() => openLoginModal('login')}
        onOpenRegister={() => openLoginModal('register')}
      />
    );
  }

  const buildings = activeSociety?.buildings || [
    { id: 'b1', name: 'Tower A', shortCode: 'A', floors: 6, flatsPerFloor: 10, totalFlats: 60 },
    { id: 'b2', name: 'Tower B', shortCode: 'B', floors: 6, flatsPerFloor: 10, totalFlats: 60 },
    { id: 'b3', name: 'Tower C', shortCode: 'C', floors: 8, flatsPerFloor: 10, totalFlats: 80 },
  ];

  const totalFlatsCount = buildings.reduce((a, b) => a + (b.totalFlats || (b.floors * b.flatsPerFloor)), 0);

  return (
    <div className="space-y-10 pb-16 animate-in fade-in duration-300">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-md">
        <div className="relative h-[400px] md:h-[460px] w-full overflow-hidden">
          <img
            src={heroImage}
            alt="Society Architecture"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center brightness-75 hover:scale-105 transition-transform duration-700 ease-out"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />

          {/* Hero Content Overlay */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 max-w-4xl text-white">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
                Registration No. {activeSociety?.societyRegNo || societyDetails?.societyRegNo}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-xs font-bold text-teal-300">
                {buildings.map((b) => `${b.name}: ${b.totalFlats || (b.floors * b.flatsPerFloor)}`).join(' · ')} ({totalFlatsCount} Flats)
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white text-balance leading-tight mb-2">
              {activeSociety?.name || societyDetails?.name || 'Solitaire CHS'}
            </h1>
            <p className="text-sm sm:text-base text-slate-200 max-w-2xl leading-relaxed mb-6 font-normal">
              {activeSociety?.commercialTagline || 'Ultra-Luxury Eco-Smart Residential Community'} · FastTag parking, supervisor daily 33-point inspections, digital maintenance, and community governance.
            </p>

            {/* Quick Action CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setActiveTab('inspection')}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Supervisor Checklist & PDF</span>
              </button>
              <button
                onClick={() => setActiveTab('maintenance')}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-xs text-white border border-white/20 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Wrench className="w-4 h-4 text-teal-300" />
                <span>Maintenance Ledger</span>
              </button>
              <button
                onClick={() => setActiveTab('parking')}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-xs text-white border border-white/20 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Car className="w-4 h-4 text-teal-300" />
                <span>Parking & FastTag</span>
              </button>
              <button
                onClick={() => setActiveTab('amenities')}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-xs text-white border border-white/20 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Calendar className="w-4 h-4" />
                <span>Amenities</span>
              </button>
              {(role === 'admin' || role === 'secretary' || role === 'mc_member') && (
                <button
                  onClick={openSocietySettingsModal}
                  className="px-4 py-2.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-400/30 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <Sliders className="w-4 h-4 text-teal-300" />
                  <span>Customize Society Software</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Society Overview & Towers Configuration */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Towers Configuration & Predefined Flat Distribution
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Building A (60 flats) · Building B (60 flats) · Building C (80 flats) — {totalFlatsCount} residential units bound by verified dual-occupancy bylaws.
            </p>
          </div>
          {(role === 'admin' || role === 'secretary' || role === 'mc_member') && (
            <button
              onClick={openSocietySettingsModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer border border-slate-200 transition-colors shrink-0"
            >
              <Settings className="w-3.5 h-3.5 text-teal-700" />
              <span>Modify Flats Scheme</span>
            </button>
          )}
        </div>

        {/* Interactive Vector Architectural Site Map with Real-time Occupancy Indicators */}
        <CampusSiteMap />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {buildings.map((bldg, idx) => {
            const flatsCount = bldg.totalFlats || (bldg.floors * bldg.flatsPerFloor);
            const tagColor = idx === 0 ? 'text-teal-700 bg-teal-50 border-teal-200' : idx === 1 ? 'text-indigo-700 bg-indigo-50 border-indigo-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200';
            return (
              <div key={bldg.id || idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:border-slate-300 transition-colors space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Wing {idx + 1}</span>
                    <h3 className="text-lg font-bold text-slate-900">{bldg.name}</h3>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-0.5 border rounded-lg ${tagColor}`}>
                    {flatsCount} Units ({bldg.shortCode}-101 to {bldg.shortCode}-{bldg.floors * 100 + bldg.flatsPerFloor})
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {flatsCount} Residential units across {bldg.floors} floors with {bldg.flatsPerFloor} units per floor. 2 & 3 BHK architectural layouts with dual passenger elevators, utility service shafts, and covered basement bays.
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>Occupancy: <strong className="text-slate-800">Verified</strong></span>
                  <span>Flats: <strong className="text-teal-800">{bldg.shortCode}-101 to {bldg.shortCode}-{bldg.floors * 100 + bldg.flatsPerFloor}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Community Polls & Society Voting with Live D3 Visualizations */}
      <CommunityPollsSection />

      {/* Official Bulletins */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Managing Committee Official Bulletins</h2>
            <p className="text-xs text-slate-500">Important dates, circulars, and community notices.</p>
          </div>
          <button
            onClick={() => setActiveTab('documents')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
          >
            All Circulars &rarr;
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {notices.map((notice) => (
            <div key={notice.id} className="py-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900 hover:text-teal-700 cursor-pointer">
                    {notice.title}
                  </span>
                  {notice.urgent && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                      Important
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">{notice.summary}</p>
              </div>
              <div className="text-xs text-slate-400 sm:text-right shrink-0">
                <span className="tabular-nums font-medium text-slate-600">{notice.date}</span>
                <span className="block text-[11px] text-slate-400 capitalize">{notice.category}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
