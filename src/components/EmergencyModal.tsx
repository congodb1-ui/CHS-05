import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import {
  X,
  Phone,
  ShieldAlert,
  Edit2,
  Trash2,
  Plus,
  Save,
  RotateCcw,
  Settings,
  AlertCircle,
  Building2,
  Wrench,
  CheckCircle2,
} from 'lucide-react';
import { EmergencyContact } from '../types';

export const EmergencyModal: React.FC = () => {
  const {
    isEmergencyOpen,
    setIsEmergencyOpen,
    role,
    emergencyContacts,
    addEmergencyContact,
    updateEmergencyContact,
    deleteEmergencyContact,
  } = useSociety();

  const [isManaging, setIsManaging] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state for editing or adding
  const [formData, setFormData] = useState<{
    category: string;
    title: string;
    subtitle: string;
    phone: string;
    displayOrder: number;
  }>({
    category: 'Society Gate & Security',
    title: '',
    subtitle: '',
    phone: '',
    displayOrder: 10,
  });

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isEmergencyOpen) return null;

  const isAdminOrMC = role === 'admin' || role === 'mc_member' || role === 'secretary';

  // Group contacts by category
  const categoriesOrder = [
    'Priority Protocol',
    'Society Gate & Security',
    'Critical Utilities & Technical Breakdown',
    'Civic & Emergency Services',
  ];

  const groupedContacts = emergencyContacts.reduce((acc, contact) => {
    const cat = contact.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(contact);
    return acc;
  }, {} as Record<string, EmergencyContact[]>);

  // Sort contacts in each category by displayOrder
  Object.keys(groupedContacts).forEach((cat) => {
    groupedContacts[cat].sort((a, b) => a.displayOrder - b.displayOrder);
  });

  // Get sorted list of categories (known order first, then any custom categories)
  const sortedCategories = [
    ...categoriesOrder.filter((cat) => groupedContacts[cat]?.length > 0),
    ...Object.keys(groupedContacts).filter((cat) => !categoriesOrder.includes(cat)),
  ];

  const handleStartEdit = (contact: EmergencyContact) => {
    setEditingId(contact.id);
    setFormData({
      category: contact.category,
      title: contact.title,
      subtitle: contact.subtitle,
      phone: contact.phone,
      displayOrder: contact.displayOrder,
    });
    setShowAddForm(false);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (!formData.title.trim() || !formData.phone.trim()) {
      alert('Contact title and phone number are required.');
      return;
    }
    await updateEmergencyContact(editingId, {
      category: formData.category.trim(),
      title: formData.title.trim(),
      subtitle: formData.subtitle.trim(),
      phone: formData.phone.trim(),
      displayOrder: Number(formData.displayOrder) || 10,
    });
    setEditingId(null);
    setFeedbackMsg('Contact updated successfully');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.phone.trim()) {
      alert('Contact title and phone number are required.');
      return;
    }
    await addEmergencyContact({
      category: formData.category.trim(),
      title: formData.title.trim(),
      subtitle: formData.subtitle.trim(),
      phone: formData.phone.trim(),
      displayOrder: Number(formData.displayOrder) || 10,
    });
    setShowAddForm(false);
    setFormData({
      category: 'Society Gate & Security',
      title: '',
      subtitle: '',
      phone: '',
      displayOrder: emergencyContacts.length + 1,
    });
    setFeedbackMsg('New emergency contact added');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleDelete = async (contact: EmergencyContact) => {
    if (window.confirm(`Are you sure you want to delete emergency contact "${contact.title}"?`)) {
      await deleteEmergencyContact(contact.id);
      if (editingId === contact.id) setEditingId(null);
      setFeedbackMsg('Contact removed');
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600 rounded-xl text-white shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">24/7 Society Emergency Directory</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                  Live Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-300">Kool Homes Solitaire CHS Ltd. (Towers A, B & C)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdminOrMC && (
              <button
                type="button"
                onClick={() => {
                  setIsManaging(!isManaging);
                  setEditingId(null);
                  setShowAddForm(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  isManaging
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-xs'
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
                title="Toggle Admin CRUD controls for emergency contacts"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{isManaging ? 'Exit Management' : 'Manage Contacts'}</span>
              </button>
            )}

            <button
              onClick={() => setIsEmergencyOpen(false)}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback message banner */}
        {feedbackMsg && (
          <div className="px-6 py-2 bg-emerald-50 text-emerald-800 border-b border-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Admin Management Header Actions */}
          {isManaging && isAdminOrMC && (
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                    Emergency Directory Management Panel (Supabase Synced)
                  </h3>
                  <p className="text-[11px] text-amber-800">
                    Add new gate helplines, technician numbers, or edit existing emergency protocols.
                  </p>
                </div>
                {!showAddForm && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(true);
                      setEditingId(null);
                      setFormData({
                        category: 'Society Gate & Security',
                        title: '',
                        subtitle: '',
                        phone: '',
                        displayOrder: emergencyContacts.length + 1,
                      });
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Emergency Contact</span>
                  </button>
                )}
              </div>

              {/* Add New Contact Form */}
              {showAddForm && (
                <form
                  onSubmit={handleCreateContact}
                  className="bg-white p-4 rounded-xl border border-amber-300 shadow-sm space-y-3 animate-in fade-in duration-150"
                >
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-amber-600" />
                    <span>New Contact Details</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium"
                      >
                        <option value="Priority Protocol">Priority Protocol</option>
                        <option value="Society Gate & Security">Society Gate & Security</option>
                        <option value="Critical Utilities & Technical Breakdown">
                          Critical Utilities & Technical Breakdown
                        </option>
                        <option value="Civic & Emergency Services">Civic & Emergency Services</option>
                        <option value="Estate Administration & Management">
                          Estate Administration & Management
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Display Order (1 = Top)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.displayOrder}
                        onChange={(e) =>
                          setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 1 })
                        }
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Contact / Service Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Otis Lift Breakdown Helpdesk"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Phone Number (Click to Call) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. +91 20 2748 1101 or 1800 233 6847"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-semibold text-slate-700 block mb-1">
                        Subtitle / Operational Role / Instructions
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 24/7 Guard Station or Passenger Trap Rescue"
                        value={formData.subtitle}
                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      Save to Supabase
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Priority Protocol Banner (if present in contacts) */}
          {groupedContacts['Priority Protocol'] && groupedContacts['Priority Protocol'].length > 0 && (
            <div className="space-y-3">
              {groupedContacts['Priority Protocol'].map((proto) => (
                <div
                  key={proto.id}
                  className="p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-red-950"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold text-red-900 text-sm mb-0.5">
                        {proto.title}
                      </strong>
                      <p className="text-red-800 leading-relaxed">{proto.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <a
                      href={`tel:${proto.phone.replace(/[^0-9+]/g, '')}`}
                      className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{proto.phone}</span>
                    </a>

                    {isManaging && isAdminOrMC && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(proto)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg cursor-pointer"
                          title="Edit protocol"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(proto)}
                          className="p-1.5 text-red-600 hover:text-red-800 bg-white border border-slate-200 rounded-lg cursor-pointer"
                          title="Delete protocol"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Grouped Emergency Contacts */}
          {sortedCategories
            .filter((cat) => cat !== 'Priority Protocol')
            .map((category) => {
              const items = groupedContacts[category] || [];
              if (items.length === 0) return null;

              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {category}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {items.length} {items.length === 1 ? 'contact' : 'contacts'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {items.map((contact) => {
                      const isBeingEdited = editingId === contact.id;

                      if (isBeingEdited) {
                        return (
                          <div
                            key={contact.id}
                            className="sm:col-span-2 p-4 rounded-xl border border-teal-300 bg-teal-50/40 space-y-3 animate-in fade-in duration-100"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-teal-900">
                                Editing: {contact.title}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ID: {contact.id}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <label className="font-semibold text-slate-700 block mb-1">
                                  Title
                                </label>
                                <input
                                  type="text"
                                  value={formData.title}
                                  onChange={(e) =>
                                    setFormData({ ...formData, title: e.target.value })
                                  }
                                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                                />
                              </div>

                              <div>
                                <label className="font-semibold text-slate-700 block mb-1">
                                  Phone
                                </label>
                                <input
                                  type="text"
                                  value={formData.phone}
                                  onChange={(e) =>
                                    setFormData({ ...formData, phone: e.target.value })
                                  }
                                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                                />
                              </div>

                              <div>
                                <label className="font-semibold text-slate-700 block mb-1">
                                  Role / Subtitle
                                </label>
                                <input
                                  type="text"
                                  value={formData.subtitle}
                                  onChange={(e) =>
                                    setFormData({ ...formData, subtitle: e.target.value })
                                  }
                                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                                />
                              </div>

                              <div>
                                <label className="font-semibold text-slate-700 block mb-1">
                                  Category
                                </label>
                                <input
                                  type="text"
                                  value={formData.category}
                                  onChange={(e) =>
                                    setFormData({ ...formData, category: e.target.value })
                                  }
                                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-teal-200">
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveEdit}
                                className="px-3.5 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={contact.id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col justify-between group"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-bold text-slate-900 leading-snug">
                                {contact.title}
                              </h4>
                              {isManaging && isAdminOrMC && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(contact)}
                                    className="p-1 text-slate-400 hover:text-teal-700 rounded transition-colors cursor-pointer"
                                    title="Edit contact"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(contact)}
                                    className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                                    title="Delete contact"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 mb-3 leading-relaxed">
                              {contact.subtitle || 'Authorized emergency responder'}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                            <a
                              href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 group-hover:underline tabular-nums"
                              title={`Click to call ${contact.title}`}
                            >
                              <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-teal-700">
                                <Phone className="w-3 h-3" />
                              </div>
                              <span>{contact.phone}</span>
                            </a>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                              Click to Call
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Security Station: Tower A Basement Command Desk</span>
          </div>
          <button
            onClick={() => setIsEmergencyOpen(false)}
            className="px-4 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors font-semibold cursor-pointer self-end sm:self-auto"
          >
            Close Directory
          </button>
        </div>
      </div>
    </div>
  );
};
