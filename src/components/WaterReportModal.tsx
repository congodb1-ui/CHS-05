import React from 'react';
import { X, Droplets, CheckCircle, FileCheck, Download, ShieldCheck } from 'lucide-react';
import { TankCleaningRecord } from '../types';

interface WaterReportModalProps {
  record: TankCleaningRecord | null;
  onClose: () => void;
}

export const WaterReportModal: React.FC<WaterReportModalProps> = ({ record, onClose }) => {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Certificate Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-600 rounded-lg">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Water Quality & Hygiene Certification</h2>
              <p className="text-xs text-slate-300">Certified Laboratory Potability Compliance Report</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Body */}
        <div className="p-6 space-y-6 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
          {/* Certificate metadata strip */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Certificate ID</span>
              <span className="font-bold text-slate-900 font-mono">{record.certificateId}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Inspection Date</span>
              <span className="font-semibold text-slate-900 tabular-nums">{record.lastCleaned}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Next Scheduled</span>
              <span className="font-semibold text-slate-900 tabular-nums">{record.nextScheduled}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Testing Agency</span>
              <span className="font-semibold text-slate-900">{record.contractor}</span>
            </div>
          </div>

          {/* Tank Info */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Sample Location & Reservoir Details
            </h3>
            <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Reservoir:</span>
                <span className="font-semibold text-slate-900">{record.tankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Capacity:</span>
                <span className="font-semibold tabular-nums">{record.capacityLiters.toLocaleString()} Liters</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tower / Section:</span>
                <span className="font-semibold">{record.tower}</span>
              </div>
            </div>
          </div>

          {/* Test Parameters Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Physiochemical & Microbiological Test Results (IS 10500:2012)
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                  <tr>
                    <th className="py-2 px-3">Test Parameter</th>
                    <th className="py-2 px-3">Measured Value</th>
                    <th className="py-2 px-3">Acceptable Limit</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2 px-3 font-medium">Total Dissolved Solids (TDS)</td>
                    <td className="py-2 px-3 font-semibold tabular-nums text-slate-900">{record.tdsReading} ppm</td>
                    <td className="py-2 px-3 text-slate-500">&lt; 500 ppm</td>
                    <td className="py-2 px-3 text-emerald-700 font-semibold">Optimal</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium">Potential of Hydrogen (pH)</td>
                    <td className="py-2 px-3 font-semibold tabular-nums text-slate-900">{record.phValue}</td>
                    <td className="py-2 px-3 text-slate-500">6.5 – 8.5</td>
                    <td className="py-2 px-3 text-emerald-700 font-semibold">Compliant</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium">Residual Free Chlorine</td>
                    <td className="py-2 px-3 font-semibold tabular-nums text-slate-900">0.25 mg/L</td>
                    <td className="py-2 px-3 text-slate-500">0.2 – 0.5 mg/L</td>
                    <td className="py-2 px-3 text-emerald-700 font-semibold">Sterilized</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium">Coliform / E. Coli Bacteria</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">Nil / 100 mL</td>
                    <td className="py-2 px-3 text-slate-500">0 CFU / 100 mL</td>
                    <td className="py-2 px-3 text-emerald-700 font-semibold">Passed (Zero)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium">Turbidity (NTU)</td>
                    <td className="py-2 px-3 font-semibold tabular-nums text-slate-900">0.8 NTU</td>
                    <td className="py-2 px-3 text-slate-500">&lt; 1.0 NTU</td>
                    <td className="py-2 px-3 text-emerald-700 font-semibold">Crystal Clear</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Compliance Stamp */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-emerald-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">Potable Water Standards Satisfied</p>
                <p className="text-[11px] text-emerald-700">
                  Water is declared safe for domestic drinking and cooking purposes across all designated supply lines.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-mono">Issued by: AquaPure Hygiene Labs (NABL Accredited)</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => alert(`Simulated Download: ${record.certificateId}.pdf is saved to your downloads.`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
