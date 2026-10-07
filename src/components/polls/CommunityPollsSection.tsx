import React, { useState, useMemo } from 'react';
import { useSociety } from '../../context/SocietyContext';
import { CommunityPoll } from '../../types';
import { PollD3Chart } from './PollD3Chart';
import {
  Vote,
  Plus,
  CheckCircle2,
  Clock,
  Award,
  Users,
  AlertCircle,
  FileCheck,
  ChevronRight,
  Sparkles,
  Lock,
  Building,
  Check,
  BarChart3,
  X,
} from 'lucide-react';

export const CommunityPollsSection: React.FC = () => {
  const {
    polls,
    castVote,
    createPoll,
    closePoll,
    role,
    userFlat,
    userName,
    isAuthenticated,
  } = useSociety();

  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'concluded' | 'my_voted'>('active');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState<CommunityPoll | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ pollId: string; text: string } | null>(null);

  // Create Poll Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<CommunityPoll['category']>('Infrastructure & Utilities');
  const [newQuorum, setNewQuorum] = useState<number>(60);
  const [newDays, setNewDays] = useState<number>(14);
  const [newOption1, setNewOption1] = useState('Option A (Full Society Implementation)');
  const [newOption2, setNewOption2] = useState('Option B (Alternative / Cost Sharing)');
  const [newOption3, setNewOption3] = useState('Option C (Defer / Re-evaluate next AGM)');

  const isAuthorizedToManage = role === 'mc_member' || role === 'admin' || role === 'secretary';

  // Overall Statistics
  const totalVotesCastAll = useMemo(() => {
    return polls.reduce((acc, p) => acc + p.totalVotes, 0);
  }, [polls]);

  const activePollsCount = useMemo(() => {
    return polls.filter((p) => p.status === 'Active').length;
  }, [polls]);

  // Filtered polls
  const filteredPolls = useMemo(() => {
    return polls.filter((p) => {
      // Category filter
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;

      // Status / tab filter
      if (activeFilter === 'active') return p.status === 'Active';
      if (activeFilter === 'concluded') return p.status === 'Concluded';
      if (activeFilter === 'my_voted') {
        return p.votedFlats.includes(userFlat);
      }
      return true;
    });
  }, [polls, activeFilter, selectedCategory, userFlat]);

  const handleVote = (pollId: string, optionId: string) => {
    const res = castVote(pollId, optionId);
    setFeedbackMessage({ pollId, text: res.message });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  const handleCreatePollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newOption1.trim() || !newOption2.trim()) return;

    const today = new Date().toISOString().split('T')[0];
    const end = new Date(Date.now() + newDays * 24 * 3600 * 1000).toISOString().split('T')[0];

    const options = [
      { id: 'opt-1', label: newOption1.trim(), votes: 0, color: '#0d9488' },
      { id: 'opt-2', label: newOption2.trim(), votes: 0, color: '#0284c7' },
    ];

    if (newOption3.trim()) {
      options.push({ id: 'opt-3', label: newOption3.trim(), votes: 0, color: '#8b5cf6' });
    }

    createPoll({
      title: newTitle.trim(),
      description: newDesc.trim() || 'Society resolution matter submitted for resident voting.',
      category: newCategory,
      quorumTarget: Number(newQuorum) || 60,
      startDate: today,
      endDate: end,
      status: 'Active',
      createdByRole: role === 'admin' ? 'Society Administrator' : 'Managing Committee Member',
      options,
    });

    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
    setActiveFilter('active');
  };

  const handleConfirmResolution = () => {
    if (!showResolveModal || !resolutionText.trim()) return;
    closePoll(showResolveModal.id, resolutionText.trim());
    setShowResolveModal(null);
    setResolutionText('');
  };

  return (
    <section className="space-y-6 pt-4">
      {/* Section Header Strip */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 mb-2">
            <Vote className="w-3.5 h-3.5 text-teal-600" />
            <span>MCS Act 1960 Democratic Society Governance · 1 Vote Per Flat</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Community Polls & Resident Voting
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Vote on essential estate resolutions, amenity upgrades, energy projects, and compound rules.
            Live D3 visual analytics calculate quorum progress in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAuthorizedToManage && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Society Poll</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Society Polls
            </span>
            <span className="text-2xl font-black text-slate-900 tabular-nums mt-1 block">
              {activePollsCount} Resolutions
            </span>
            <span className="text-xs text-teal-700 font-medium mt-1 block">
              Open for Unit {userFlat} Voting
            </span>
          </div>
          <div className="p-3 bg-teal-50 text-teal-700 rounded-2xl">
            <Vote className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Community Votes Cast
            </span>
            <span className="text-2xl font-black text-emerald-700 tabular-nums mt-1 block">
              {totalVotesCastAll} Verified Votes
            </span>
            <span className="text-xs text-slate-500 mt-1 block">
              Across Towers A & B (120 units)
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Statutory Quorum Benchmark
            </span>
            <span className="text-2xl font-black text-amber-700 tabular-nums mt-1 block">
              60 Flats (50%)
            </span>
            <span className="text-xs text-slate-500 mt-1 block">
              Required for AGM & MC Resolution
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Category Selector */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveFilter('active')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeFilter === 'active'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Active Polls ({polls.filter((p) => p.status === 'Active').length})
          </button>
          <button
            onClick={() => setActiveFilter('my_voted')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeFilter === 'my_voted'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            My Flat's Votes ({polls.filter((p) => p.votedFlats.includes(userFlat)).length})
          </button>
          <button
            onClick={() => setActiveFilter('concluded')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeFilter === 'concluded'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Concluded ({polls.filter((p) => p.status === 'Concluded').length})
          </button>
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Polls ({polls.length})
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium hidden sm:inline">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
          >
            <option value="All">All Categories</option>
            <option value="Infrastructure & Utilities">Infrastructure & Utilities</option>
            <option value="Amenities & Energy">Amenities & Energy</option>
            <option value="Society Rules & Security">Society Rules & Security</option>
            <option value="Green Living">Green Living</option>
            <option value="Finance & Common Dues">Finance & Common Dues</option>
          </select>
        </div>
      </div>

      {/* Polls Cards Grid */}
      {filteredPolls.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
          <BarChart3 className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Polls Found</h3>
          <p className="text-xs text-slate-400">
            There are currently no community polls matching your selected filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPolls.map((poll) => {
            const hasVoted = poll.votedFlats.includes(userFlat);
            const userVotedOptionId = poll.userVotes ? poll.userVotes[userFlat] : undefined;
            const isConcluded = poll.status === 'Concluded';

            return (
              <div
                key={poll.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Poll Card Header */}
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                          {poll.id}
                        </span>
                        <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {poll.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isConcluded
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isConcluded ? 'Concluded' : 'Active Voting'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-snug pt-1">
                        {poll.title}
                      </h3>
                    </div>

                    {/* Deadline or End Status */}
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block font-medium">Voting Closes</span>
                      <span className="text-xs font-mono font-bold text-slate-800">
                        {poll.endDate}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {poll.description}
                  </p>

                  {/* Concluded Resolution Banner */}
                  {isConcluded && poll.resolutionSummary && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                        <FileCheck className="w-4 h-4 text-emerald-700" />
                        <span>Official Resolution Adopted</span>
                      </div>
                      <p className="text-emerald-800 leading-relaxed font-medium">
                        {poll.resolutionSummary}
                      </p>
                    </div>
                  )}

                  {/* Feedback Toast */}
                  {feedbackMessage && feedbackMessage.pollId === poll.id && (
                    <div className="p-3 bg-teal-50 border border-teal-200 text-teal-900 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-1">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>{feedbackMessage.text}</span>
                    </div>
                  )}

                  {/* Voting Options Interactive Form */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      {isConcluded
                        ? 'Final Resident Vote Breakdown:'
                        : hasVoted
                        ? 'Your Vote is Recorded (Click any option to update):'
                        : 'Cast Your Flat’s Vote:'}
                    </span>

                    <div className="space-y-2">
                      {poll.options.map((opt) => {
                        const isOptionVoted = opt.id === userVotedOptionId;

                        return (
                          <button
                            key={opt.id}
                            disabled={isConcluded}
                            onClick={() => handleVote(poll.id, opt.id)}
                            className={`w-full text-left p-3 rounded-2xl text-xs transition-all flex items-center justify-between gap-3 cursor-pointer ${
                              isOptionVoted
                                ? 'bg-teal-50/80 border-2 border-teal-600 text-teal-950 font-semibold shadow-xs'
                                : isConcluded
                                ? 'bg-slate-50/50 border border-slate-200 text-slate-700 cursor-not-allowed opacity-90'
                                : 'bg-slate-50 hover:bg-white hover:border-slate-300 border border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                  isOptionVoted
                                    ? 'border-teal-700 bg-teal-700 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isOptionVoted && <Check className="w-2.5 h-2.5 stroke-3" />}
                              </div>
                              <span className="leading-snug">{opt.label}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                              <span className="font-bold text-slate-900">{opt.votes}</span>
                              <span className="text-slate-400">
                                ({poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0}%)
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Real-Time D3 Visualizer Canvas */}
                  <div className="pt-2">
                    <PollD3Chart poll={poll} userVotedOptionId={userVotedOptionId} />
                  </div>
                </div>

                {/* Poll Card Footer */}
                <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span>Initiated by: <strong>{poll.createdByRole}</strong></span>
                  </div>

                  {/* Admin Conclude Poll Action */}
                  {isAuthorizedToManage && !isConcluded && (
                    <button
                      onClick={() => {
                        setShowResolveModal(poll);
                        const winner = [...poll.options].sort((a, b) => b.votes - a.votes)[0];
                        setResolutionText(
                          `Resolution Passed: "${winner?.label || 'Majority decision'}" approved by majority vote with ${winner?.votes || 0} votes (${Math.round(((winner?.votes || 0) / Math.max(1, poll.totalVotes)) * 100)}%).`
                        );
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer"
                    >
                      Conclude Poll & Sign-Off
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: CREATE NEW SOCIETY POLL (FOR MC / ADMIN) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Vote className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold">Propose New Society Resolution Poll</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePollSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Resolution Subject / Matter Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CCTV Camera Installation in Tower A & B Fire Stairwells"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Category <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-1 focus:ring-teal-700"
                  >
                    <option value="Infrastructure & Utilities">Infrastructure & Utilities</option>
                    <option value="Amenities & Energy">Amenities & Energy</option>
                    <option value="Society Rules & Security">Society Rules & Security</option>
                    <option value="Green Living">Green Living</option>
                    <option value="Finance & Common Dues">Finance & Common Dues</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Quorum Target (Flats)</label>
                  <input
                    type="number"
                    min="10"
                    max="120"
                    value={newQuorum}
                    onChange={(e) => setNewQuorum(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Background Context / Summary</label>
                <textarea
                  rows={2}
                  placeholder="Explain why this resolution is being put to vote, anticipated costs, or statutory reasons..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              {/* Voting Options */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="font-bold text-slate-800 block">
                  Voting Ballot Options (2 to 3 Options)
                </label>

                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Option 1</label>
                  <input
                    type="text"
                    required
                    value={newOption1}
                    onChange={(e) => setNewOption1(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Option 2</label>
                  <input
                    type="text"
                    required
                    value={newOption2}
                    onChange={(e) => setNewOption2(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Option 3 (Optional)</label>
                  <input
                    type="text"
                    value={newOption3}
                    onChange={(e) => setNewOption3(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Voting Duration (Days)</label>
                <input
                  type="number"
                  min="3"
                  max="45"
                  value={newDays}
                  onChange={(e) => setNewDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Publish Community Poll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESOLUTION CONCLUSION & SIGN-OFF */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold">Conclude Poll & Record Resolution</h3>
              </div>
              <button
                onClick={() => setShowResolveModal(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="font-mono text-[10px] font-bold text-slate-500">{showResolveModal.id}</span>
                <h4 className="text-sm font-bold text-slate-900">{showResolveModal.title}</h4>
                <p className="text-slate-600">
                  Total Votes Cast: <strong>{showResolveModal.totalVotes}</strong> · Quorum: <strong>{showResolveModal.quorumTarget}</strong>
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Official Committee Resolution Note
                </label>
                <textarea
                  rows={3}
                  required
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResolution}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Adopt & Conclude Poll
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
