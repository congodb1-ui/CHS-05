import React, { useState, useMemo, useRef } from 'react';
import { useSociety } from '../../context/SocietyContext';
import {
  Image as ImageIcon,
  Plus,
  Lock,
  Globe,
  Edit2,
  Trash2,
  X,
  Upload,
  CheckCircle2,
  Filter,
  Eye,
  Camera,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Check,
  FileImage,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { SocietyGalleryItem } from '../../types';
import {
  compressImageFile,
  validateImageFile,
  SOCIETY_PHOTO_PRESETS,
} from '../../lib/imageUtils';

export const SocietyGalleryView: React.FC = () => {
  const {
    role,
    galleryItems,
    addGalleryItem,
    updateGalleryItem,
    deleteGalleryItem,
    userName,
    hasRole,
  } = useSociety();

  const isAdminOrMC =
    role === 'admin' ||
    role === 'mc_member' ||
    role === 'secretary' ||
    hasRole('admin') ||
    hasRole('mc_member') ||
    hasRole('secretary');

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeLightboxItem, setActiveLightboxItem] = useState<SocietyGalleryItem | null>(null);

  // Modal States
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<SocietyGalleryItem | null>(null);

  // Form State for Upload & Modify
  const [inputMode, setInputMode] = useState<'upload' | 'url' | 'presets'>('upload');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('Amenities');
  const [visibility, setVisibility] = useState<'Public' | 'Private'>('Public');

  // Upload Processing States
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formFeedback, setFormFeedback] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Delete Confirmation Dialog State
  const [itemToDelete, setItemToDelete] = useState<SocietyGalleryItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available Categories
  const categories = ['All', 'Amenities', 'Architecture', 'Fitness', 'Utilities', 'Grounds', 'Campus Layout'];

  // Filter items based on user role and selected category
  const filteredItems = useMemo(() => {
    return galleryItems.filter((item) => {
      // Non-admins can only see Public photos
      if (!isAdminOrMC && item.visibility === 'Private') {
        return false;
      }
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [galleryItems, isAdminOrMC, selectedCategory]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setTitle('');
    setDescription('');
    setImageUrl('');
    setCategory('Amenities');
    setVisibility('Public');
    setInputMode('upload');
    setUploadError(null);
    setFormFeedback(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (item: SocietyGalleryItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description || '');
    setImageUrl(item.imageUrl);
    setCategory(item.category || 'Amenities');
    setVisibility(item.visibility);
    setInputMode(item.imageUrl.startsWith('data:') ? 'upload' : 'url');
    setUploadError(null);
    setFormFeedback(null);
    setShowModal(true);
  };

  const processFile = async (file: File) => {
    setUploadError(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file format.');
      return;
    }

    setIsProcessingFile(true);
    try {
      // Compress file down to optimized resolution (max 1400x1050 JPEG ~85-120KB)
      const compressedUrl = await compressImageFile(file, {
        maxWidth: 1400,
        maxHeight: 1050,
        quality: 0.85,
      });
      setImageUrl(compressedUrl);
      setFormFeedback(`✓ "${file.name}" compressed and ready to save.`);
    } catch (err: any) {
      setUploadError('Failed to read or optimize image file. Please try another photo.');
      console.error(err);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleImageFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
      if (!title.trim()) {
        const cleanName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]+/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        setTitle(cleanName);
      }
    }
    e.target.value = '';
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
      if (!title.trim()) {
        const cleanName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]+/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        setTitle(cleanName);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!title.trim()) {
      setUploadError('Photo title is required.');
      return;
    }
    if (!imageUrl.trim()) {
      setUploadError('Please choose or upload a photo before saving.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingItem) {
        await updateGalleryItem(editingItem.id, {
          title: title.trim(),
          description: description.trim(),
          imageUrl: imageUrl.trim(),
          category,
          visibility,
        });

        if (activeLightboxItem?.id === editingItem.id) {
          setActiveLightboxItem({
            ...activeLightboxItem,
            title: title.trim(),
            description: description.trim(),
            imageUrl: imageUrl.trim(),
            category,
            visibility,
          });
        }

        setFeedbackMsg(`✓ Photo "${title.trim()}" successfully updated!`);
      } else {
        await addGalleryItem({
          title: title.trim(),
          description: description.trim(),
          imageUrl: imageUrl.trim(),
          category,
          visibility,
          uploadedBy: userName || 'Estate Office',
        });
        setFeedbackMsg(`✓ New photo "${title.trim()}" added to society gallery!`);
      }

      setShowModal(false);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to save photo updates.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleVisibility = async (item: SocietyGalleryItem) => {
    const newVis = item.visibility === 'Public' ? 'Private' : 'Public';
    await updateGalleryItem(item.id, { visibility: newVis });
    if (activeLightboxItem?.id === item.id) {
      setActiveLightboxItem({ ...activeLightboxItem, visibility: newVis });
    }
    setFeedbackMsg(`Visibility changed to ${newVis} for "${item.title}"`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const targetTitle = itemToDelete.title;
    await deleteGalleryItem(itemToDelete.id);
    if (activeLightboxItem?.id === itemToDelete.id) {
      setActiveLightboxItem(null);
    }
    setItemToDelete(null);
    setFeedbackMsg(`✓ Deleted "${targetTitle}" from gallery.`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner & Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
            <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
            <span>Campus Visual Showcase & Facility Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Society Photo Gallery
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            High-definition photographs and facilities directory for Kool Homes Solitaire CHS Ltd.
            Upload campus photos, modify facility captions, or configure Public vs Private resident access.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>+ Upload / Add Photo</span>
          </button>
        </div>
      </div>

      {/* Global feedback banner */}
      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Category Filter Pills & Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium self-end sm:self-auto">
          <span>
            Showing <strong>{filteredItems.length}</strong> photos
          </span>
          {isAdminOrMC && (
            <span className="text-[11px] bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-md font-semibold">
              Admin & MC Full Access
            </span>
          )}
        </div>
      </div>

      {/* Gallery Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No photos in this category</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click &ldquo;+ Upload / Add Photo&rdquo; to add images and showcase Solitaire campus facilities.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
            >
              {/* Image Container with Badges */}
              <div
                className="relative aspect-16/10 overflow-hidden bg-slate-100 cursor-pointer"
                onClick={() => setActiveLightboxItem(item)}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Category Pill */}
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs shadow-xs">
                    <Layers className="w-3 h-3 text-teal-400" />
                    {item.category || 'Facility'}
                  </span>
                </div>

                {/* Visibility Badge */}
                <div className="absolute top-3 right-3">
                  {item.visibility === 'Public' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-600/90 text-white backdrop-blur-xs shadow-xs">
                      <Globe className="w-3 h-3" />
                      <span>Public</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-600/90 text-white backdrop-blur-xs shadow-xs">
                      <Lock className="w-3 h-3" />
                      <span>Private</span>
                    </span>
                  )}
                </div>

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-3 py-1.5 rounded-lg bg-white/95 text-slate-900 text-xs font-bold backdrop-blur-xs flex items-center gap-1.5 shadow-sm">
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Photo</span>
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h3
                    onClick={() => setActiveLightboxItem(item)}
                    className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition-colors cursor-pointer line-clamp-1"
                    title={item.title}
                  >
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.description || 'Community facility and grounds photograph.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{item.uploadedBy || 'Estate Office'}</span>
                  <span>{item.createdAt}</span>
                </div>

                {/* Photo Management & Modify Controls */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Visibility Switch Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleVisibility(item)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border ${
                      item.visibility === 'Public'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                    title="Toggle Visibility between Public and Private"
                  >
                    {item.visibility === 'Public' ? (
                      <>
                        <Globe className="w-3 h-3 text-emerald-600" />
                        <span>Public</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 text-amber-600" />
                        <span>Private</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 hover:text-teal-900 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                      title="Modify Photo details, title or replace image"
                    >
                      <Edit2 className="w-3 h-3 text-teal-700" />
                      <span>Modify</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setItemToDelete(item)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {activeLightboxItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveLightboxItem(null);
          }}
        >
          <div className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col my-auto animate-in zoom-in-95 duration-150 text-white">
            <div className="relative aspect-16/10 sm:aspect-16/9 bg-black flex items-center justify-center">
              <img
                src={activeLightboxItem.imageUrl}
                alt={activeLightboxItem.title}
                className="max-h-[75vh] w-full object-contain"
              />
              <button
                onClick={() => setActiveLightboxItem(null)}
                className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors cursor-pointer"
                title="Close Lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-slate-900 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {activeLightboxItem.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        activeLightboxItem.visibility === 'Public'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {activeLightboxItem.visibility} Access
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white">{activeLightboxItem.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const target = activeLightboxItem;
                      setActiveLightboxItem(null);
                      handleOpenEditModal(target);
                    }}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Modify Photo</span>
                  </button>
                  <button
                    onClick={() => handleToggleVisibility(activeLightboxItem)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    {activeLightboxItem.visibility === 'Public' ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Make Private</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Make Public</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {activeLightboxItem.description && (
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeLightboxItem.description}
                </p>
              )}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Uploaded by {activeLightboxItem.uploadedBy || 'Estate Office'}</span>
                <span>{activeLightboxItem.createdAt}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD & MODIFY MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="relative max-w-xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-600 rounded-lg text-white">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    {editingItem ? 'Modify Society Photo' : 'Upload New Society Photo'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Supports high-resolution camera uploads, automated web compression, and access controls
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error & Feedback messages */}
            {uploadError && (
              <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {formFeedback && (
              <div className="mx-6 mt-4 p-3 bg-teal-50 text-teal-800 rounded-xl border border-teal-200 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{formFeedback}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Photo Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Semi-Olympic Swimming Pool"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-medium focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-semibold focus:border-teal-600 focus:outline-none"
                  >
                    <option value="Amenities">Amenities</option>
                    <option value="Architecture">Architecture</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Grounds">Grounds</option>
                    <option value="Campus Layout">Campus Layout</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Visibility Control <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as 'Public' | 'Private')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-semibold focus:border-teal-600 focus:outline-none"
                  >
                    <option value="Public">Public (All Residents & Visitors)</option>
                    <option value="Private">Private (Admins & MC Only)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Description / Caption
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief description of the facility, operational timings, or features..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-medium focus:border-teal-600 focus:outline-none"
                />
              </div>

              {/* Photo Source Tabs: Upload File, Image URL, or Preset Picker */}
              <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 block text-xs">
                    Image Source <span className="text-red-500">*</span>
                  </label>

                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setInputMode('upload')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                        inputMode === 'upload'
                          ? 'bg-teal-700 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      File Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode('url')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                        inputMode === 'url'
                          ? 'bg-teal-700 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Web Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode('presets')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                        inputMode === 'presets'
                          ? 'bg-teal-700 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Presets
                    </button>
                  </div>
                </div>

                {/* MODE 1: File Upload & Drag-and-drop */}
                {inputMode === 'upload' && (
                  <div className="space-y-2">
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                        isDragging
                          ? 'border-teal-600 bg-teal-50/60'
                          : 'border-slate-300 hover:border-teal-600 bg-white'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileInput}
                        className="hidden"
                      />
                      <Upload className="w-6 h-6 text-teal-600 mb-2" />
                      <p className="font-bold text-slate-800">
                        {isProcessingFile ? 'Optimizing photo...' : imageUrl ? 'Click or drag to choose a replacement photo' : 'Click to choose image or drag & drop'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Accepts JPG, PNG, WebP (auto-compressed for rapid loading)
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="mt-3 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                      >
                        {imageUrl ? 'Browse New Photo' : 'Select Photo File'}
                      </button>
                    </div>
                  </div>
                )}

                {/* MODE 2: Web URL Input */}
                {inputMode === 'url' && (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      placeholder="Paste image web link (https://...)"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-medium focus:border-teal-600 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500">
                      You can paste any direct image URL from Unsplash or cloud storage.
                    </p>
                  </div>
                )}

                {/* MODE 3: Preset Society Photos */}
                {inputMode === 'presets' && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-600 font-medium">
                      Select a curated high-definition community preset:
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {SOCIETY_PHOTO_PRESETS.map((preset, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setImageUrl(preset.url);
                            if (!title) setTitle(preset.title);
                            if (!description) setDescription(preset.description);
                            setCategory(preset.category);
                          }}
                          className={`group relative aspect-16/10 rounded-lg overflow-hidden border cursor-pointer transition-all ${
                            imageUrl === preset.url
                              ? 'border-teal-600 ring-2 ring-teal-500'
                              : 'border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-black/70 p-1 text-[9px] text-white font-medium truncate">
                            {preset.title}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview Box */}
                {imageUrl && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-800">Selected Photo Preview:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-teal-700 hover:underline cursor-pointer font-medium"
                        >
                          Change Photo
                        </button>
                        <span>&middot;</span>
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="text-red-600 hover:underline cursor-pointer font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-300 bg-slate-950">
                      <img
                        src={imageUrl}
                        alt="Photo preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-medium cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingFile || isSaving}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white rounded-xl font-bold cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <span>Saving Photo...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingItem ? 'Save Photo Changes' : 'Upload to Gallery'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG (replaces window.confirm) */}
      {itemToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setItemToDelete(null);
          }}
        >
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 my-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Delete Photo from Gallery?</h3>
                <p className="text-xs text-slate-500">
                  This action removes the photo from the community showcase and database.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
              <img
                src={itemToDelete.imageUrl}
                alt={itemToDelete.title}
                className="w-14 h-12 rounded-lg object-cover shrink-0"
              />
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 truncate">{itemToDelete.title}</p>
                <p className="text-[11px] text-slate-500">{itemToDelete.category} · {itemToDelete.visibility}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm"
              >
                Yes, Delete Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
