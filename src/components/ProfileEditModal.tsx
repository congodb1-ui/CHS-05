import React, { useState, useEffect } from 'react';
import { useSociety } from '../context/SocietyContext';
import {
  X,
  User,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Phone,
  Mail,
  Save,
} from 'lucide-react';
import { compressImageFile, validateImageFile } from '../lib/imageUtils';
import { uploadToCHSStorage } from '../lib/supabase';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose }) => {
  const { currentProfile, updateMemberProfile, setUserName } = useSociety();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentProfile) {
      setName(currentProfile.name || '');
      setPhone(currentProfile.phone || '');
      setAvatarUrl(currentProfile.avatarUrl || currentProfile.avatar_url || '');
    }
  }, [currentProfile, isOpen]);

  if (!isOpen || !currentProfile) return null;

  const [isDragging, setIsDragging] = useState(false);

  const processFile = async (file: File) => {
    const val = validateImageFile(file);
    if (!val.valid) {
      setErrorMsg(val.error || 'Please upload a valid image file.');
      return;
    }

    try {
      const storageRes = await uploadToCHSStorage(file, 'avatars');
      if (storageRes.success && storageRes.publicUrl) {
        setAvatarUrl(storageRes.publicUrl);
        setErrorMsg(null);
      } else {
        const compressed = await compressImageFile(file, { maxWidth: 600, maxHeight: 600, quality: 0.85 });
        setAvatarUrl(compressed);
        setErrorMsg(null);
      }
    } catch {
      setErrorMsg('Failed to process image file. Please try another image.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Full Name cannot be empty.');
      return;
    }

    try {
      updateMemberProfile(currentProfile.id, {
        name: name.trim(),
        phone: phone.trim(),
        avatarUrl: avatarUrl.trim(),
        avatar_url: avatarUrl.trim(),
      });
      setUserName(name.trim());
      setSuccessMsg('Resident profile photo and details updated successfully!');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Resident Profile Settings</h3>
              <p className="text-xs text-slate-500">
                {currentProfile.tower} · Unit {currentProfile.flatNo} ({currentProfile.memberId})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* MODULE 6: Profile Photo (Optional) */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-3.5 rounded-xl border transition-all space-y-3 ${
              isDragging
                ? 'bg-teal-50/80 border-teal-500 border-dashed ring-2 ring-teal-200'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 block text-xs">
                Profile Photo (Optional)
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Max 5MB (JPG, PNG, WebP, SVG)</span>
            </div>

            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-teal-600 shrink-0 shadow-xs">
                  <img
                    src={avatarUrl}
                    alt="Resident avatar preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                    title="Remove photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-slate-200 text-slate-500 font-bold text-sm flex items-center justify-center shrink-0 border border-slate-300">
                  {name ? name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                </div>
              )}

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded-lg text-xs font-semibold text-teal-900 cursor-pointer shadow-2xs transition-colors">
                    <Upload className="w-3.5 h-3.5 text-teal-700" />
                    <span>Choose Photo from Device (PNG/JPEG)</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 block">
                  Select a PNG or JPEG file from your laptop. Uploads directly to Supabase: CHS-Storage/avatars/
                </span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              Direct local upload. Displayed in member directories, ticket comments, and header badges.
            </p>
          </div>

          {/* Full Name */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-800 block">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium text-xs focus:bg-white focus:outline-teal-700"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-800 block">Contact Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium text-xs focus:bg-white focus:outline-teal-700"
              />
            </div>
          </div>

          {/* Readonly Details */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Flat Unit</span>
              <strong className="text-slate-800 font-mono text-xs">{currentProfile.flatNo}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tower Wing</span>
              <strong className="text-slate-800 text-xs">{currentProfile.tower}</strong>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
