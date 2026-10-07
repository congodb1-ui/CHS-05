import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { Sparkles, MessageCircleQuestion, X, ChevronRight, BookOpen, Clock, Droplets, Wrench } from 'lucide-react';

export const AIFloatingWidget: React.FC = () => {
  const { openAiWithPrompt, role } = useSociety();
  const [showTooltip, setShowTooltip] = useState(false);

  const samplePrompts = [
    { label: 'Pool timings & rules', icon: Clock, prompt: 'What are the swimming pool timings and dress code rules?' },
    { label: 'Tenant shifting slots', icon: BookOpen, prompt: 'What are the allowed elevator shifting hours for tenants?' },
    { label: 'Water supply schedule', icon: Droplets, prompt: 'What are today\'s domestic water supply and STP timings?' },
    { label: 'Draft repair request', icon: Wrench, prompt: 'How do I draft an urgent maintenance request for my flat?' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Expanded Quick Questions Popover */}
      {showTooltip && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-4 w-72 mb-1 animate-in fade-in slide-in-from-bottom-3 duration-150 text-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span className="font-bold text-xs text-slate-900">Solitaire Society AI</span>
            </div>
            <button
              onClick={() => setShowTooltip(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-slate-500 my-2 leading-relaxed">
            Need answers about society bye-laws, domestic water, shifting hours, or NOC clearance?
          </p>

          <div className="space-y-1.5 pt-1">
            {samplePrompts.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setShowTooltip(false);
                    openAiWithPrompt(item.prompt);
                  }}
                  className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-teal-50 border border-slate-100 hover:border-teal-200 text-xs font-medium text-slate-700 hover:text-teal-900 transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-teal-600 group-hover:scale-110 transition-transform" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-teal-600" />
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              setShowTooltip(false);
              openAiWithPrompt();
            }}
            className="w-full mt-3 py-2 bg-slate-900 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>Open AI Assistant Chat</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowTooltip(!showTooltip)}
          className="bg-white/95 backdrop-blur-xs text-slate-700 hover:text-teal-800 border border-slate-200/90 shadow-md hover:shadow-lg px-3 py-2 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer group"
          title="Ask Solitaire Society AI Assistant"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-600"></span>
          </span>
          <Sparkles className="w-4 h-4 text-teal-600 group-hover:rotate-12 transition-transform" />
          <span className="text-slate-900 font-bold">Ask Society AI</span>
        </button>
      </div>
    </div>
  );
};
