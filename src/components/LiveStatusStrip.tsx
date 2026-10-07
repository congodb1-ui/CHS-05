import React from 'react';
import { useSociety } from '../context/SocietyContext';
import { Droplets, Zap, Shield, Bell, ChevronRight, Activity, Building, FileText, CheckCircle2 } from 'lucide-react';

export const LiveStatusStrip: React.FC = () => {
  const { setActiveTab, activeSociety, societyDetails, inspections } = useSociety();

  const currentReport = inspections[0] || { day: 2, items: [] };
  const passedCount = currentReport.items ? currentReport.items.filter((i) => i.status.includes('OK') || i.status.includes('Cleaned') || i.status.includes('Full')).length : 31;
  const totalItems = currentReport.items?.length || 33;

  const buildings = activeSociety?.buildings || [
    { name: 'Tower A', totalFlats: 60 },
    { name: 'Tower B', totalFlats: 60 },
    { name: 'Tower C', totalFlats: 80 },
  ];
  const totalUnits = buildings.reduce((a, b) => a + (b.totalFlats || 60), 0);

  return (
    <div className="w-full bg-slate-900 text-white border-b border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
          {/* Status indicators */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            {/* Daily Supervisor Inspection Live Feed */}
            <button
              onClick={() => setActiveTab('inspection')}
              className="flex items-center gap-2 group text-left hover:text-teal-300 transition-colors cursor-pointer"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400"></span>
              </span>
              <span className="font-semibold text-slate-300 group-hover:text-teal-200">Supervisor Inspection:</span>
              <span className="text-teal-400 font-bold">Day {currentReport.day} ({passedCount}/{totalItems} OK)</span>
              <span className="text-[11px] text-teal-300/80 underline decoration-teal-500/50 hidden sm:inline">Export PDF</span>
            </button>

            {/* Towers & Units Breakdown */}
            <div className="hidden md:flex items-center gap-1.5 text-slate-300 border-l border-slate-800 pl-4">
              <Building className="w-3.5 h-3.5 text-teal-400" />
              <span className="font-mono text-slate-400">
                {buildings.map((b) => `${b.name}: ${b.totalFlats}`).join(' · ')}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 font-mono border border-teal-500/30">
                {totalUnits} Flats
              </span>
            </div>
          </div>

          {/* Society Notice Flash */}
          <div className="flex items-center gap-2 text-slate-300 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700/60 justify-between sm:justify-start">
            <div className="flex items-center gap-2 truncate">
              <Bell className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="font-medium text-slate-200 truncate">
                {societyDetails?.announcementBanner?.message || 'Notice: 14th AGM on Sunday 10:00 AM at Clubhouse'}
              </span>
            </div>
            <button
              onClick={() => setActiveTab('helpdesk')}
              className="text-teal-400 hover:text-teal-300 flex items-center shrink-0 font-medium ml-1 cursor-pointer"
            >
              <span>View</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
