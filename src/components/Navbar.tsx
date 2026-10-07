import React, { useState, useRef, useEffect } from 'react';
import { useSociety } from '../context/SocietyContext';
import {
  PhoneCall,
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  LogOut,
  LogIn,
  UserPlus,
  LayoutDashboard,
  LifeBuoy,
  Users,
  Car,
  Briefcase,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building,
  Image as GalleryIcon,
  User,
  Camera,
  ClipboardCheck,
  Receipt,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    role,
    logout,
    isAuthenticated,
    isPendingApproval,
    isRejected,
    activeTab,
    setActiveTab,
    setIsEmergencyOpen,
    userName,
    userFlat,
    currentProfile,
    openLoginModal,
    openSocietySettingsModal,
    societyDetails,
    managedSocieties,
    activeSociety,
    switchSociety,
  } = useSociety();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [societyDropdownOpen, setSocietyDropdownOpen] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const isAdminOrMC = role === 'admin' || role === 'mc_member' || role === 'secretary';

  // Core Navigation Tabs with Role Enforcement
  const productionNavTabs = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard, publicAllowed: true, adminOnly: false },
    { id: 'maintenance', label: 'Maintenance & Dues', icon: Receipt, publicAllowed: false, adminOnly: false, hideForSupervisor: true },
    { id: 'inspection', label: 'Supervisor Operations', icon: ClipboardCheck, publicAllowed: false, adminOnly: false },
    { id: 'helpdesk', label: 'Helpline & Tickets', icon: LifeBuoy, publicAllowed: false, adminOnly: false },
    { id: 'registry', label: 'Resident & Flat Registry', icon: Users, publicAllowed: false, adminOnly: false },
    { id: 'vehicles', label: 'Vehicles', icon: Car, publicAllowed: false, adminOnly: false },
    { id: 'gallery', label: 'Society Gallery', icon: GalleryIcon, publicAllowed: true, adminOnly: false },
    { id: 'procurement', label: 'Procurement & Vendors', icon: Briefcase, publicAllowed: false, adminOnly: true },
  ];

  // Restrict internal society pages for unauthenticated visitors or pending resident accounts, and restrict procurement to Admin/MC
  const visibleTabs = productionNavTabs.filter((tab) => {
    if (tab.hideForSupervisor && role === 'supervisor') {
      return false;
    }
    if (tab.adminOnly && !isAdminOrMC) {
      return false;
    }
    if (role === 'tenant' && (tab.id === 'procurement' || tab.id === 'inspection')) {
      return false;
    }
    if (!isAuthenticated || isPendingApproval || isRejected) {
      return tab.publicAllowed;
    }
    return true;
  });

  const checkScrollability = () => {
    const el = scrollContainerRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 10);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, [visibleTabs]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const getDisplayRoleBadge = () => {
    switch (role) {
      case 'resident':
      case 'member':
        if (isRejected) return 'Registration Rejected';
        return isPendingApproval ? 'Pending Approval' : `Resident (${userFlat})`;
      case 'tenant':
        if (isRejected) return 'Registration Rejected';
        return isPendingApproval ? 'Pending Approval' : `Tenant (${userFlat})`;
      case 'supervisor':
        return 'Facility Supervisor';
      case 'secretary':
        return 'MC Secretary';
      case 'mc_member':
        return 'MC Member';
      case 'admin':
        return 'Society Admin';
      case 'public':
      default:
        return 'Public Visitor';
    }
  };

  // Helper to determine active state including legacy aliases
  const isTabActive = (tabId: string) => {
    if (activeTab === tabId) return true;
    if (tabId === 'inspection' && (activeTab === 'supervisor' || activeTab === 'checklist')) return true;
    if (tabId === 'registry' && (activeTab === 'committee' || activeTab === 'directory')) return true;
    if (tabId === 'vehicles' && activeTab === 'parking') return true;
    if (tabId === 'procurement' && activeTab === 'vendors') return true;
    if (tabId === 'maintenance' && activeTab === 'dues') return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Global Community Announcement Banner */}
      {societyDetails?.announcementBanner?.enabled && societyDetails?.announcementBanner?.message && (
        <div
          className={`px-4 py-1.5 text-xs text-center font-medium flex items-center justify-center gap-2 border-b ${
            societyDetails.announcementBanner.type === 'alert'
              ? 'bg-red-600 text-white border-red-700'
              : societyDetails.announcementBanner.type === 'warning'
              ? 'bg-amber-500 text-slate-950 border-amber-600 font-semibold'
              : 'bg-teal-900 text-teal-100 border-teal-950'
          }`}
        >
          <span className="font-bold uppercase tracking-wider text-[10px] bg-black/20 px-1.5 py-0.5 rounded">
            Notice
          </span>
          <span className="truncate">{societyDetails.announcementBanner.message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* ZONE 1: BRAND LOGO & COMMERCIAL MULTI-SOCIETY SWITCHER */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('home')}
              className="text-left group cursor-pointer focus:outline-hidden"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-800 flex items-center justify-center text-white shadow-xs group-hover:bg-teal-700 transition-colors">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors leading-none block truncate max-w-[150px] sm:max-w-[200px]">
                      {activeSociety?.name || societyDetails?.name || 'Solitaire CHS'}
                    </span>
                    <span className="hidden sm:inline-block text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200">
                      SaaS
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 block mt-0.5">
                    {activeSociety?.city || societyDetails?.city || 'Pune'} · {activeSociety?.buildings?.reduce((a, b) => a + (b.totalFlats || (b.floors * b.flatsPerFloor)), 0) || 200} Units (A: 60 · B: 60 · C: 80)
                  </span>
                </div>
              </div>
            </button>

            {/* Commercial Multi-Society Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setSocietyDropdownOpen(!societyDropdownOpen)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                title="Switch Society (Commercial Multi-Society SaaS)"
              >
                <span className="text-[11px] hidden md:inline">Societies</span>
                <span className="text-[10px] bg-slate-900 text-white font-mono font-bold px-1.5 py-0.2 rounded-full">
                  {managedSocieties?.length || 1}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {societyDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
                  <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/90 flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-slate-900 text-[11px] uppercase tracking-wider">
                        Commercial Multi-Society SaaS Hub
                      </p>
                      <p className="text-[10px] text-teal-700 font-semibold">
                        Multi-Tenant Commercial Portfolio
                      </p>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                      Enterprise Tier
                    </span>
                  </div>

                  <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
                    {(managedSocieties || []).map((soc) => {
                      const isSelected = soc.id === activeSociety?.id;
                      const units = soc.buildings?.reduce((a, b) => a + (b.totalFlats || (b.floors * b.flatsPerFloor)), 0) || 200;
                      return (
                        <button
                          key={soc.id}
                          onClick={() => {
                            switchSociety(soc.id);
                            setSocietyDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer border flex items-start justify-between gap-2 ${
                            isSelected
                              ? 'bg-teal-50/80 border-teal-200 text-teal-950 font-bold shadow-2xs'
                              : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-800'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs truncate max-w-[190px]">{soc.name}</span>
                              {isSelected && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-600 text-white font-bold">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {soc.city}, {soc.state} · <span className="font-mono font-semibold">{units} Flats</span>
                            </p>
                            <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                              {soc.buildings?.map((b) => `${b.name}: ${b.totalFlats || (b.floors * b.flatsPerFloor)}`).join(' · ')}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-2 border-t border-slate-100 bg-slate-50/60 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSocietyDropdownOpen(false);
                        openSocietySettingsModal();
                      }}
                      className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Customize Society & Flats</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ZONE 2: CENTER-ALIGNED NAVIGATION TABS WITH HORIZONTAL SCROLL CONTROLS */}
          <div className="hidden lg:flex flex-1 items-center justify-center min-w-0 px-2 max-w-3xl">
            <div className="relative flex items-center w-full max-w-2xl justify-center">
              {/* Left scroll chevron */}
              {canScrollLeft && (
                <button
                  type="button"
                  onClick={() => handleScroll('left')}
                  className="absolute -left-3 z-10 p-1 rounded-full bg-white border border-slate-200 shadow-md text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer"
                  aria-label="Scroll navigation tabs left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              {/* Scrollable Tabs Wrapper */}
              <nav
                ref={scrollContainerRef}
                onScroll={checkScrollability}
                className="flex items-center gap-1.5 p-1 bg-slate-100/90 border border-slate-200/70 rounded-xl overflow-x-auto scrollbar-none scroll-smooth mx-auto max-w-full"
              >
                {visibleTabs.map((tab) => {
                  const active = isTabActive(tab.id);
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        active
                          ? 'bg-white text-teal-800 shadow-xs border border-slate-200/60'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${active ? 'text-teal-700' : 'text-slate-400'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Right scroll chevron */}
              {canScrollRight && (
                <button
                  type="button"
                  onClick={() => handleScroll('right')}
                  className="absolute -right-3 z-10 p-1 rounded-full bg-white border border-slate-200 shadow-md text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer"
                  aria-label="Scroll navigation tabs right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* ZONE 3: ACTIONS & AUTH (NO ASK AI) */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Gate Emergency Hotline */}
            <button
              onClick={() => setIsEmergencyOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/80 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
              title="24/7 Security Gates Hotline"
            >
              <PhoneCall className="w-3.5 h-3.5 text-red-600" />
              <span>Gate Help</span>
            </button>

            {/* Unauthenticated View */}
            {!isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openLoginModal('login')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </button>
                <button
                  onClick={() => openLoginModal('register')}
                  className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-teal-700" />
                  <span>Register Flat</span>
                </button>
              </div>
            ) : (
              /* Authenticated User Menu */
              <div className="flex items-center gap-2">
                {(role === 'admin' || role === 'mc_member' || role === 'secretary') && (
                  <button
                    onClick={openSocietySettingsModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-teal-900 bg-slate-100 hover:bg-teal-50 border border-slate-300 hover:border-teal-400 rounded-lg transition-all cursor-pointer shadow-2xs"
                    title="Open Society Global Administration & Settings"
                  >
                    <Settings className="w-3.5 h-3.5 text-teal-700" />
                    <span className="hidden sm:inline">Admin Settings</span>
                  </button>
                )}

                <div className="relative">
                  <button
                    onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer border ${
                      isPendingApproval
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : 'text-slate-800 bg-slate-100/90 hover:bg-slate-200 border-slate-300/80'
                    }`}
                    aria-expanded={roleMenuOpen}
                  >
                    {currentProfile?.avatarUrl ? (
                      <img
                        src={currentProfile.avatarUrl}
                        alt={userName}
                        className="w-5 h-5 rounded-full object-cover border border-teal-600 shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-teal-700 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {userName ? userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                      </div>
                    )}
                    <span className="font-bold">{getDisplayRoleBadge()}</span>
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                  </button>

                  {roleMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
                      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/80 flex items-center gap-3">
                        {currentProfile?.avatarUrl ? (
                          <img
                            src={currentProfile.avatarUrl}
                            alt={userName}
                            className="w-10 h-10 rounded-full object-cover border-2 border-teal-600 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {userName ? userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{userName}</p>
                          <p className="text-[11px] text-slate-500 font-mono">Unit: {userFlat}</p>
                          {isPendingApproval && (
                            <p className="text-[10px] font-bold text-amber-700 mt-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block">
                              Pending Committee Approval
                            </p>
                          )}
                        </div>
                      </div>

                      {(role === 'admin' || role === 'mc_member' || role === 'secretary') && (
                        <div className="px-3 pt-1">
                          <button
                            onClick={() => {
                              setRoleMenuOpen(false);
                              openSocietySettingsModal();
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:text-teal-900 hover:bg-teal-50 rounded-lg cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <Settings className="w-3.5 h-3.5 text-teal-700" />
                              <span>Global Admin Settings</span>
                            </span>
                            <span className="text-[10px] text-teal-600 font-bold">Configure</span>
                          </button>
                        </div>
                      )}

                      <div className="px-3 pt-2 border-t border-slate-100 mt-1">
                        <button
                          onClick={() => {
                            setRoleMenuOpen(false);
                            logout();
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Sign Out</span>
                          </span>
                          <span className="text-[10px] text-slate-400">Exit Session</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 focus:outline-hidden cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-200 space-y-1 animate-in fade-in duration-150">
            {visibleTabs.map((tab) => {
              const active = isTabActive(tab.id);
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2.5 ${
                    active
                      ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-teal-700' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            <div className="pt-2 mt-2 border-t border-slate-100 space-y-1">
              {!isAuthenticated ? (
                <>
                  <button
                    onClick={() => {
                      openLoginModal('login');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 rounded-lg text-xs font-bold text-teal-800 bg-teal-50 cursor-pointer"
                  >
                    Resident Login
                  </button>
                  <button
                    onClick={() => {
                      openLoginModal('register');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 cursor-pointer"
                  >
                    Register Flat
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 rounded-lg text-xs font-semibold text-red-600 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out to Public View</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
