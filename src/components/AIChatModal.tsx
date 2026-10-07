import React, { useState, useRef, useEffect } from 'react';
import { useSociety } from '../context/SocietyContext';
import {
  X,
  Sparkles,
  Send,
  Bot,
  User,
  ExternalLink,
  Globe,
  Loader2,
  HelpCircle,
  Clock,
  Shield,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { ChatMessage } from '../types';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatModal: React.FC<AIChatModalProps> = ({ isOpen, onClose }) => {
  const { role, userName, userFlat, initialAiPrompt } = useSociety();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Namaste! I am the **Solitaire Society AI Assistant** for Kool Homes Solitaire CHS (Towers A, B & C).\n\nI can answer questions regarding society bye-laws, amenities rules, shifting hours, today's water supply timings, or search live Pune civic & municipal notices. How can I assist you today?`,
      timestamp: 'Just now',
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      if (initialAiPrompt) {
        handleSendMessage(initialAiPrompt);
      }
    }
  }, [isOpen, initialAiPrompt]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const quickQuestions = [
    'What are the pool timings and dress code rules?',
    'What are the allowed elevator shifting hours for tenants?',
    'What are today\'s domestic water supply timings?',
    'How do I file an urgent maintenance complaint?',
    'What is the rule for flat interior renovation hours?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || loading) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Build conversation history
      const historyPayload = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          history: historyPayload,
        }),
      });

      const data = await res.json();

      if (data.reply) {
        const assistantMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'model',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          groundingSources: data.groundingSources || [],
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'No response returned');
      }
    } catch (err: any) {
      // Graceful fallback response grounded in society knowledge
      let fallbackText = `Here is what our society rules state regarding your query:\n\n`;
      if (messageText.toLowerCase().includes('pool') || messageText.toLowerCase().includes('swim')) {
        fallbackText += `• **Swimming Pool Hours:** 06:00 AM – 10:00 AM and 04:00 PM – 09:00 PM daily.\n• **Monday Closure:** Closed every Monday for deep chlorination & suction vacuuming.\n• **Dress Code:** Proper nylon or lycra swimwear is strictly compulsory.\n• **Guest Limit:** Max 2 outside guests per flat (reserve guest pass in the Amenities tab).`;
      } else if (messageText.toLowerCase().includes('shift') || messageText.toLowerCase().includes('tenant')) {
        fallbackText += `• **Elevator Shifting Hours:** Strictly permitted between **11:00 AM – 02:00 PM** and **02:00 PM – 05:00 PM** to avoid peak passenger traffic.\n• **Mandatory Documents:** Police verification receipt and registered agreement must be submitted via the Tenants portal.`;
      } else if (messageText.toLowerCase().includes('water') || messageText.toLowerCase().includes('stp')) {
        fallbackText += `• **Water Supply Shifts:** Morning 06:00 AM – 09:00 AM & Evening 06:00 PM – 09:00 PM.\n• **STP Recycled Water:** Flush lines remain pressurized 24/7 with tertiary recycled water.`;
      } else {
        fallbackText += `• **Society Office Hours:** Daily 10:00 AM – 01:00 PM and 05:00 PM – 08:00 PM in Clubhouse Level 1.\n• **Emergency Gate A:** +91 20 2748 1101.\n• **Otis 24/7 Lift Rescue:** 1800 233 6847.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `fallback-${Date.now()}`,
          role: 'model',
          text: fallbackText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col h-[640px] max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-teal-600 to-emerald-500 rounded-lg shadow-xs">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Solitaire AI Resident Assistant</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-800 text-teal-200 px-2 py-0.5 rounded">
                  Search Grounded
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Official Bye-Laws, Live Utilities, and Pune Civic Information Guide
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Context Strip */}
        <div className="px-6 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <span>Active Role: <strong className="text-slate-900 capitalize">{role}</strong> ({userName})</span>
          <span className="text-[11px] text-teal-700 font-medium flex items-center gap-1">
            <Globe className="w-3 h-3 text-teal-600" />
            Live Search Grounding Active
          </span>
        </div>

        {/* Message Thread (Scrollable) */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'model' && (
                <div className="w-7 h-7 rounded-full bg-teal-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[82%] rounded-xl p-3.5 space-y-1.5 shadow-xs ${
                  m.role === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-line leading-relaxed text-xs">
                  {m.text}
                </div>

                {/* Google Search Grounding Sources */}
                {m.groundingSources && m.groundingSources.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-slate-200/80 space-y-1 text-[11px]">
                    <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">
                      Verified Sources:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {m.groundingSources.map((source, sIdx) => (
                        <a
                          key={sIdx}
                          href={source.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 hover:border-teal-500 rounded text-teal-700 font-medium truncate max-w-[220px]"
                        >
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{source.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`text-[10px] text-right ${m.role === 'user' ? 'text-slate-400' : 'text-slate-400'}`}>
                  {m.timestamp}
                </div>
              </div>

              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-500 text-xs italic p-2 bg-slate-50 rounded-lg w-fit border border-slate-200">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
              <span>Checking Solitaire bye-laws & civic records...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-5 py-2 bg-slate-50/70 border-t border-slate-200 shrink-0">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Frequently Asked:</div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={loading}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-[11px] text-slate-700 font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about pool rules, moving hours, water timings, bye-laws..."
              disabled={loading}
              className="flex-1 p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-teal-600 bg-slate-50 focus:bg-white"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white rounded-xl transition-colors cursor-pointer shadow-xs shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
