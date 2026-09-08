import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Link2, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ShieldAlert, 
  X,
  Share2,
  FileText,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { dataSourceService } from '../services/dataSourceService';
import { IntelligenceTip } from '../types';

interface IntelligenceTipsPageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const IntelligenceTipsPage: React.FC<IntelligenceTipsPageProps> = ({ onNavigate }) => {
  const { theme } = useTheme();
  const [tips, setTips] = useState<IntelligenceTip[]>(dataSourceService.getAllTips());
  const [activeTab, setActiveTab] = useState<'ALL' | 'New' | 'Under Review' | 'Linked' | 'Resolved'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTip, setSelectedTip] = useState<IntelligenceTip | null>(null);

  const filteredTips = tips.filter((t) => {
    const matchesTab = activeTab === 'ALL' || t.status === activeTab;
    const matchesSearch = 
      !searchTerm.trim() ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleStatusChange = (tipId: string, newStatus: IntelligenceTip['status']) => {
    const updated = tips.map((t) => (t.id === tipId ? { ...t, status: newStatus } : t));
    setTips(updated);
    if (selectedTip?.id === tipId) {
      setSelectedTip({ ...selectedTip, status: newStatus });
    }
  };

  return (
    <div id="nexus-intelligence-tips-page" className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl lg:text-2xl font-black tracking-tight text-[var(--text-primary)]">
              Intelligence Tips & Informant Intake
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#0b1b11]/10 dark:bg-white/10 text-[var(--text-primary)]">
              {tips.length} Intake Records
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Anonymous citizen portals and encrypted informant leads awaiting operational corroboration
          </p>
        </div>

        {/* Ethical Warning Banner */}
        <div 
          className="p-3 rounded-xl border flex items-center gap-2.5 text-xs text-[var(--text-secondary)] max-w-md"
          style={{
            backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
            borderColor: 'var(--border-main)',
          }}
        >
          <AlertTriangle className="w-4 h-4 text-[#37ff85] shrink-0" />
          <span className="text-[11px] leading-tight">
            Unverified intelligence: Corroboration by sworn investigator required before warrant or enforcement action.
          </span>
        </div>
      </div>

      {/* Tabs & Search */}
      <div 
        className="rounded-xl border p-4 space-y-3"
        style={{
          backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
          borderColor: 'var(--border-main)',
        }}
      >
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto">
            {[
              { id: 'ALL', label: `All (${tips.length})` },
              { id: 'New', label: `New (${tips.filter((t) => t.status === 'New').length})` },
              { id: 'Under Review', label: `Under Review (${tips.filter((t) => t.status === 'Under Review').length})` },
              { id: 'Linked', label: `Linked (${tips.filter((t) => t.status === 'Linked').length})` },
              { id: 'Resolved', label: `Resolved (${tips.filter((t) => t.status === 'Resolved').length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#0b1b11] text-white dark:bg-[#0d2115] dark:text-[#D8E0E7]'
                    : 'text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div 
            className="relative flex items-center rounded-lg border w-full md:w-72"
            style={{
              backgroundColor: theme === 'dark' ? 'var(--bg-main)' : 'var(--bg-card-elevated)',
              borderColor: 'var(--border-main)',
            }}
          >
            <Search className="w-3.5 h-3.5 ml-3 text-[var(--text-secondary)] shrink-0" />
            <input
              id="tips-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tips..."
              className="w-full px-3 py-1.5 text-xs bg-transparent outline-none text-[var(--text-primary)]"
            />
          </div>
        </div>
      </div>

      {/* Tips Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTips.map((tip) => (
          <div
            key={tip.id}
            className="rounded-xl border p-5 flex flex-col justify-between space-y-3 hover:shadow-md transition-all relative"
            style={{
              backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
              borderColor: 'var(--border-main)',
            }}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[var(--text-primary)]">
                  {tip.id}
                </span>

                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  tip.status === 'New'
                    ? 'bg-[#C62828]/15 text-[#C62828] dark:text-[#D86C6C]'
                    : tip.status === 'Under Review'
                      ? 'bg-[#37ff85]/15 text-[#37ff85] dark:text-[#37ff85]'
                      : tip.status === 'Linked'
                        ? 'bg-[#37ff85]/15 text-[#37ff85] dark:text-[#37ff85]'
                        : 'bg-black/5 dark:bg-white/10 text-[var(--text-secondary)]'
                }`}>
                  {tip.status}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                <span>{tip.category}</span>
                <span className="text-[10px] text-[var(--text-muted)] font-normal">({tip.source})</span>
              </div>

              <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
                {tip.description}
              </p>

              <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] pt-1">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#37ff85]" />
                  <span>{tip.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{tip.submittedDate}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--border-light)' }}>
              <div className="text-[10px] font-mono text-[var(--text-muted)]">
                Credibility: {tip.credibilityScore}%
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedTip(tip)}
                  className="px-2.5 py-1 rounded-lg bg-[#0b1b11] text-white hover:bg-[#10291a] dark:bg-[#0d2115] dark:text-[#D8E0E7] text-xs font-semibold cursor-pointer"
                >
                  Examine
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tip Detail Inspection Modal (Section 19) */}
      {selectedTip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div 
            id="tip-detail-inspection-modal"
            className="w-full max-w-xl rounded-2xl border shadow-2xl p-6 space-y-5 overflow-hidden"
            style={{
              backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
              borderColor: 'var(--border-main)',
            }}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#0b1b11]/10 dark:bg-white/10 text-[var(--text-primary)]">
                    {selectedTip.id}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#37ff85]/15 text-[#37ff85] dark:text-[#37ff85]">
                    {selectedTip.category}
                  </span>
                </div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  Intelligence Tip Intake File
                </h2>
              </div>

              <button
                onClick={() => setSelectedTip(null)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl border space-y-2" style={{ borderColor: 'var(--border-light)' }}>
                <div className="font-bold text-[var(--text-primary)] text-xs">Tip Narrative</div>
                <p className="text-xs leading-relaxed text-[var(--text-secondary)] whitespace-pre-line">
                  {selectedTip.description}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded-lg border" style={{ borderColor: 'var(--border-light)' }}>
                  <span className="text-[10px] text-[var(--text-muted)] block">Reported Location</span>
                  <span className="font-semibold text-[var(--text-primary)]">{selectedTip.location}</span>
                </div>
                <div className="p-2 rounded-lg border" style={{ borderColor: 'var(--border-light)' }}>
                  <span className="text-[10px] text-[var(--text-muted)] block">Intake Channel</span>
                  <span className="font-semibold text-[var(--text-primary)]">{selectedTip.source}</span>
                </div>
                <div className="p-2 rounded-lg border" style={{ borderColor: 'var(--border-light)' }}>
                  <span className="text-[10px] text-[var(--text-muted)] block">Date Logged</span>
                  <span className="font-semibold text-[var(--text-primary)]">{selectedTip.submittedDate}</span>
                </div>
              </div>

              {/* Mentioned Entities */}
              {selectedTip.mentionedEntities && selectedTip.mentionedEntities.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Extracted Named Entities in Lead:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTip.mentionedEntities.map((ent) => (
                      <button
                        key={ent}
                        onClick={() => {
                          setSelectedTip(null);
                          onNavigate('/network', ent);
                        }}
                        className="px-2 py-1 rounded bg-[#76a886]/15 text-[#76a886] dark:text-[#76a886] font-mono text-[10px] font-semibold hover:opacity-80 cursor-pointer flex items-center gap-1"
                      >
                        <span>{ent}</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Update Actions */}
              <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border-light)' }}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Investigator Workflow Status:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleStatusChange(selectedTip.id, 'Under Review')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      selectedTip.status === 'Under Review'
                        ? 'bg-[#37ff85] text-white'
                        : 'border hover:bg-black/5 text-[var(--text-primary)]'
                    }`}
                    style={{ borderColor: 'var(--border-main)' }}
                  >
                    Mark Under Review
                  </button>

                  <button
                    onClick={() => handleStatusChange(selectedTip.id, 'Linked')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      selectedTip.status === 'Linked'
                        ? 'bg-[#37ff85] text-white'
                        : 'border hover:bg-black/5 text-[var(--text-primary)]'
                    }`}
                    style={{ borderColor: 'var(--border-main)' }}
                  >
                    Link to Case Docket
                  </button>

                  <button
                    onClick={() => handleStatusChange(selectedTip.id, 'Resolved')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      selectedTip.status === 'Resolved'
                        ? 'bg-[#76a886] text-white'
                        : 'border hover:bg-black/5 text-[var(--text-primary)]'
                    }`}
                    style={{ borderColor: 'var(--border-main)' }}
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
