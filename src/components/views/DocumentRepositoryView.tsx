import React, { useState, useMemo } from 'react';
import { useSociety } from '../../context/SocietyContext';
import { SocietyDocument } from '../../types';
import {
  FileText,
  Search,
  Upload,
  Download,
  Filter,
  ShieldCheck,
  Lock,
  Calendar,
  FileCheck2,
  Trash2,
  Tag,
  AlertCircle,
  Plus,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export const DocumentRepositoryView: React.FC = () => {
  const { documents, addDocument, deleteDocument, role, userName } = useSociety();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // New document form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SocietyDocument['category']>('Bye-Laws & Governance');
  const [docNumber, setDocNumber] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isRestricted, setIsRestricted] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('1.5 MB');

  const categories = [
    'All',
    'Bye-Laws & Governance',
    'Meeting Minutes (AGM/MC)',
    'Audit Reports & Financials',
    'AMC Agreements',
    'Circulars & Notices',
  ];

  const isAuthorizedToUpload = role === 'mc_member' || role === 'admin' || role === 'supervisor';

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // If document is restricted to MC and user is resident, hide it
      if (doc.isRestrictedToMC && (role === 'resident' || role === 'public' || role === 'supervisor')) {
        return false;
      }

      const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
      const matchesSearch =
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.documentNumber && doc.documentNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        doc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [documents, selectedCategory, searchQuery, role]);

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    addDocument({
      title,
      category,
      documentNumber: docNumber || `DOC-${Date.now().toString().slice(-4)}`,
      fileSize: fileSize || '1.8 MB',
      uploadedBy: userName || 'Managing Committee',
      fileUrl: fileUrl || `https://solitaire-chs.org/docs/${encodeURIComponent(title.toLowerCase().replace(/\s+/g, '_'))}.pdf`,
      isRestrictedToMC: isRestricted,
      tags: tags.length ? tags : ['General', 'Solitaire CHS'],
      description,
    });

    setShowUploadModal(false);
    setTitle('');
    setDocNumber('');
    setDescription('');
    setTagsInput('');
    setFileUrl('');
    setFileName('');
  };

  const handleSimulateDownload = (doc: SocietyDocument) => {
    // Simulated PDF download
    const element = document.createElement('a');
    const file = new Blob(
      [
        `KOOL HOMES SOLITAIRE CO-OPERATIVE HOUSING SOCIETY LTD.\n` +
          `Document: ${doc.title}\n` +
          `Doc Number: ${doc.documentNumber || 'N/A'}\n` +
          `Category: ${doc.category}\n` +
          `Uploaded On: ${doc.uploadedAt}\n` +
          `Uploaded By: ${doc.uploadedBy}\n\n` +
          `Summary:\n${doc.description || 'Verified society official record under MCS Act 1960.'}\n\n` +
          `[Digital Society Seal - Kool Homes Solitaire CHS Ltd. Kausar Baugh, NIBM, Pune - 411048]`,
      ],
      { type: 'text/plain' }
    );
    element.href = URL.createObjectURL(file);
    element.download = `${doc.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 mb-2">
            <FileCheck2 className="w-3.5 h-3.5 text-teal-600" />
            <span>MCS Act 1960 Statutory Compliance Archive</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Centralized Document Repository
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered Society Bye-Laws, AGM Minutes, Chartered Accountant Audit Reports, and AMC agreements.
          </p>
        </div>

        {isAuthorizedToUpload && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload New Document</span>
          </button>
        )}
      </div>

      {/* Category Pills & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, resolution number, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filteredDocuments.length}</strong> official documents
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-teal-700 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocuments.length === 0 ? (
          <div className="col-span-2 bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
            <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No documents found</p>
            <p className="text-xs text-slate-500 mt-1">Try refining your search filter or category selection.</p>
          </div>
        ) : (
          filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-teal-50 text-teal-700 shrink-0">
                      <FileText className="w-5 h-5" />
                    </span>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 inline-block mb-1">
                        {doc.category}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{doc.title}</h3>
                    </div>
                  </div>

                  {doc.isRestrictedToMC && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                      <Lock className="w-3 h-3" />
                      <span>MC Confidential</span>
                    </span>
                  )}
                </div>

                {doc.description && (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {doc.description}
                  </p>
                )}

                {/* Metadata Strip */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                  {doc.documentNumber && (
                    <span className="font-mono text-slate-700">Doc: {doc.documentNumber}</span>
                  )}
                  <span>Size: {doc.fileSize}</span>
                  <span>Uploaded: {doc.uploadedAt}</span>
                  <span>By: {doc.uploadedBy}</span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {doc.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleSimulateDownload(doc)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </button>

                {(role === 'admin' || role === 'mc_member') && (
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: UPLOAD NEW DOCUMENT */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold">Upload Authorized Society Document</h3>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 14th AGM Audit & Financial Ledger Report"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="Bye-Laws & Governance">Bye-Laws & Governance</option>
                    <option value="Meeting Minutes (AGM/MC)">Meeting Minutes (AGM/MC)</option>
                    <option value="Audit Reports & Financials">Audit Reports & Financials</option>
                    <option value="AMC Agreements">AMC Agreements</option>
                    <option value="Circulars & Notices">Circulars & Notices</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Document / Resolution Number</label>
                  <input
                    type="text"
                    placeholder="e.g. RES-2026-AGM-04"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">File Upload / Link</label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50">
                  <input
                    type="file"
                    id="docFileUpload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFileName(file.name);
                        setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
                        setFileUrl(`https://solitaire-chs.org/uploads/${file.name}`);
                      }
                    }}
                    className="hidden"
                  />
                  <label htmlFor="docFileUpload" className="cursor-pointer block space-y-1">
                    <FileSpreadsheet className="w-6 h-6 mx-auto text-teal-600" />
                    <span className="font-semibold text-teal-700 block">
                      {fileName ? fileName : 'Click to select PDF or document from device'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Supports PDF, DOCX, XLSX (up to 25 MB)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Summary / Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief synopsis of the document contents, legal citations, or committee sign-off notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="Audit, Financials, FY26, Balance Sheet"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="restrictedCheckbox"
                  checked={isRestricted}
                  onChange={(e) => setIsRestricted(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="restrictedCheckbox" className="text-xs text-slate-700 font-medium">
                  Restrict access to Managing Committee and Admin only (Hide from general residents)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                >
                  Confirm Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
