import React from 'react';
import { useSociety } from '../context/SocietyContext';
import { Phone, Mail, MapPin, Building, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveTab, setIsEmergencyOpen } = useSociety();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: Society Identity */}
          <div className="space-y-3">
            <span className="text-base font-bold text-white tracking-tight block">
              Solitaire CHS Ltd.
            </span>
            <p className="text-slate-400 text-xs leading-relaxed">
              Cooperative Housing Society registered under MCS Act 1960.
              Reg. No. PNA/HSG/TC/12492/2018.
            </p>
            <div className="space-y-1.5 text-slate-400 text-[11px]">
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                <span>Kool Homes Solitaire, Kausar Baugh, NIBM, Pune, Maharashtra 411048</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Towers A, B (120 Units) & Tower C (80 Upcoming)</span>
              </div>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Community Services
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button
                  onClick={() => setActiveTab('helpdesk')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Log a Service Request / Complaint
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('amenities')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Amenity Reservation & Pool Timings
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('utilities')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Water Supply & In-House STP Logs
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('tenants')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Tenant Move-In NOC & Shifting Slot
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('committee')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Document Vault & Society Bye-Laws
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Emergency Contacts */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              24/7 Gate & Desk Help
            </h4>
            <div className="space-y-2 text-slate-400 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 block">Security Gate A (Main):</span>
                <a href="tel:+912027481101" className="text-teal-400 font-semibold hover:underline tabular-nums">
                  +91 20 2748 1101
                </a>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Otis Lift 24/7 Breakdown:</span>
                <span className="text-slate-300 font-mono">1800 233 6847</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Estate Manager Office:</span>
                <span className="text-slate-300 tabular-nums">+91 98900 12890</span>
              </div>
              <button
                onClick={() => setIsEmergencyOpen(true)}
                className="mt-1 text-red-400 hover:text-red-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Emergency Directory &rarr;</span>
              </button>
            </div>
          </div>

          {/* Col 4: Governance Disclaimer */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Governance & Compliance
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Maintained by the Managing Committee for resident convenience. All official notifications, audited accounts, and vendor AMC contracts comply with cooperative bylaws.
            </p>
            <div className="pt-2 text-[11px] text-slate-500">
              <span>Society Office Hours: Daily 10 AM – 1 PM, 5 PM – 8 PM</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Solitaire Cooperative Housing Society Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Powered by Solitaire Resident Management Framework</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
