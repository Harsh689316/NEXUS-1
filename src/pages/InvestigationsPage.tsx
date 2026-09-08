import React, { useState } from 'react';
import { 
  FolderOpen, 
  Search, 
  Filter, 
  Users, 
  Calendar, 
  MapPin, 
  ArrowRight, 
  Share2, 
  ChevronRight, 
  ShieldAlert, 
  FileText,
  Clock,
  CheckCircle2,
  DollarSign,
  ArrowLeft
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { dataSourceService } from '../services/dataSourceService';
import { Case } from '../types';

interface InvestigationsPageProps {
  selectedCaseId?: string;
  onNavigate: (route: string, param?: string) => void;
}

export const InvestigationsPage: React.FC<InvestigationsPageProps> = ({
  selectedCaseId,
  onNavigate,
}) => {
  const { theme } = useTheme();
  const allCases = dataSourceService.getAllCases();
  const allPersons = dataSourceService.getAllPersons();

  const [activeCaseId, setActiveCaseId] = useState<string | null>(selectedCaseId || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filteredCases = allCases.filter((c) => {
    const matchesSearch = 
      !searchTerm.trim() ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.investigatingOfficer.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || c.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const activeCase = activeCaseId ? dataSourceService.getCaseById(activeCaseId) : null;

  return (
    <div id="nexus-investigations-page" className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      {!activeCase ? (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl lg:text-2xl font-black tracking-tight text-[var(--text-primary)]">
                Active Investigations & Dockets
              </h1>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#0b1b11]/10 dark:bg-white/10 text-[var(--text-primary)]">
                {allCases.length} Registered Cases
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Multi-agency investigative files, seized assets tracking, and suspect network correlation
            </p>
          </div>

          <button
            onClick={() => onNavigate('/network')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0b1b11] text-white hover:bg-[#10291a] dark:bg-[#0d2115] dark:text-[#D8E0E7] text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-[#37ff85]" />
            <span>Open Network Cross-Reference</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-main)' }}>
          <button
            onClick={() => setActiveCaseId(null)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Investigations</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[var(--text-muted)]">
              DOCKET REF: {activeCase.id}
            </span>
            <button
              onClick={() => onNavigate('/network', activeCase.associatedPersons[0])}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0b1b11] text-white dark:bg-[#0d2115] text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-[#37ff85]" />
              <span>Map Case Network</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 1: CASE DETAILS VIEW (if a case is selected) */}
      {activeCase ? (
        <div className="space-y-6">
          {/* Case Hero Banner */}
          <div 
            className="rounded-2xl border p-6 space-y-4"
            style={{
              backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
              borderColor: 'var(--border-main)',
            }}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#0b1b11]/10 dark:bg-white/10 text-[var(--text-primary)]">
                    {activeCase.id}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#37ff85]/15 text-[#37ff85] dark:text-[#37ff85]">
                    {activeCase.category}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    activeCase.status === 'Active' 
                      ? 'bg-[#37ff85]/15 text-[#37ff85] dark:text-[#37ff85]' 
                      : 'bg-[#37ff85]/15 text-[#37ff85] dark:text-[#37ff85]'
                  }`}>
                    {activeCase.status}
                  </span>
                </div>

                <h1 className="text-xl lg:text-2xl font-black tracking-tight text-[var(--text-primary)]">
                  {activeCase.title}
                </h1>
                <p className="text-xs text-[var(--text-secondary)]">
                  Lead Investigator: <span className="font-semibold text-[var(--text-primary)]">{activeCase.investigatingOfficer}</span> • Station: {activeCase.primaryJurisdiction}
                </p>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                  Estimated Financial Volume
                </div>
                <div className="text-lg font-black font-mono text-[var(--text-primary)]">
                  ₹{activeCase.financialVolumeINR ? (activeCase.financialVolumeINR / 10000000).toFixed(2) : '5.00'} Cr
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  Opened: {activeCase.openedDate}
                </div>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-[var(--text-secondary)] border-t pt-3" style={{ borderColor: 'var(--border-light)' }}>
              {activeCase.description}
            </p>
          </div>

          {/* 2-Column Grid: Linked Persons & Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Linked Persons */}
            <div 
              className="lg:col-span-2 rounded-2xl border p-5 space-y-4"
              style={{
                backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
                borderColor: 'var(--border-main)',
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    Linked Persons of Interest ({activeCase.associatedPersons.length})
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Entities implicated through electronic evidence or field intelligence
                  </p>
                </div>
              </div>

              <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
                {activeCase.associatedPersons.map((personId) => {
                  const personRecord = dataSourceService.getPersonById(personId);

                  return (
                    <div 
                      key={personId}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onNavigate('/person', personId)}
                            className="font-bold text-xs text-[var(--text-primary)] hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>{personRecord?.fullName || personId}</span>
                            {personRecord?.alias && (
                              <span className="text-[11px] text-[var(--text-muted)] font-normal">
                                ("{personRecord.alias}")
                              </span>
                            )}
                          </button>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">
                            {personId}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#76a886] dark:text-[#76a886] font-semibold">
                          Occupation / Dossier: {personRecord?.occupation || 'Investigation Subject'}
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)]">
                          {personRecord?.summary || 'Subject identified in investigative intelligence reports.'}
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between gap-2 shrink-0">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-[#37ff85]/15 text-[#37ff85] dark:text-[#37ff85]">
                          {personRecord?.status || 'Person of Interest'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onNavigate('/network', personId)}
                            className="p-1 rounded-md border hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-secondary)]"
                            title="View in Graph"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onNavigate('/person', personId)}
                            className="px-2 py-1 rounded-md bg-[#0b1b11] text-white dark:bg-[#0d2115] text-[10px] font-semibold cursor-pointer"
                          >
                            Dossier →
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 1 Col: Evidence & Milestones */}
            <div className="space-y-6">
              {/* Evidence Seizures */}
              <div 
                className="rounded-2xl border p-5 space-y-3"
                style={{
                  backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
                  borderColor: 'var(--border-main)',
                }}
              >
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Evidence Registry ({activeCase.evidenceCount || 4} Logged Items)
                </h3>
                <div className="space-y-2 text-xs">
                  {(activeCase.evidenceRecords || [
                    'Seized encrypted handset with burner SIM card',
                    'Cash courier receipt register (Zaveri Bazar clearing)',
                    'CCTV toll plaza passage stills (NH-48 Expressway)',
                    'Bank ledger statement records with high-frequency layering',
                  ]).map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border space-y-1" style={{ borderColor: 'var(--border-light)' }}>
                      <div className="font-semibold text-[var(--text-primary)]">{item}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">
                        Logged in Police Property Register • Ref #{activeCase.id}-EV{idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Case Milestones */}
              <div 
                className="rounded-2xl border p-5 space-y-3"
                style={{
                  backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
                  borderColor: 'var(--border-main)',
                }}
              >
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#76a886]" />
                  <span>Timeline Milestones</span>
                </h3>
                <div className="space-y-3 text-xs border-l-2 pl-3 ml-1" style={{ borderColor: 'var(--border-main)' }}>
                  {(activeCase.timeline || [
                    { date: activeCase.openedDate, event: 'FIR Registered', detail: 'Initial cognizable offense registered by investigating team.' },
                    { date: '2026-02-14', event: 'Asset Interception', detail: 'Courier handover intercepted with controlled cash tokens.' },
                    { date: '2026-03-01', event: 'CDR Correlation', detail: 'Cross-case cell site co-location established with key associates.' },
                  ]).map((event, idx) => (
                    <div key={idx} className="space-y-0.5 relative">
                      <div className="font-mono text-[10px] text-[var(--text-muted)] font-semibold">
                        {event.date}
                      </div>
                      <div className="font-semibold text-[var(--text-primary)]">
                        {event.event}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        {event.detail}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: CASES DIRECTORY / LIST */
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div 
            className="rounded-xl border p-4 space-y-3"
            style={{
              backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
              borderColor: 'var(--border-main)',
            }}
          >
            <div className="flex flex-col md:flex-row gap-3">
              <div 
                className="relative flex-1 flex items-center rounded-lg border"
                style={{
                  backgroundColor: theme === 'dark' ? 'var(--bg-main)' : 'var(--bg-card-elevated)',
                  borderColor: 'var(--border-main)',
                }}
              >
                <Search className="w-4 h-4 ml-3 text-[var(--text-secondary)] shrink-0" />
                <input
                  id="cases-search-input"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search cases by title, docket ID, officer or summary..."
                  className="w-full px-3 py-2 text-xs bg-transparent outline-none text-[var(--text-primary)]"
                />
              </div>

              <select
                id="cases-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border text-xs bg-transparent text-[var(--text-primary)] outline-none cursor-pointer"
                style={{ borderColor: 'var(--border-main)' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="Active" className="bg-[var(--bg-card)]">Active</option>
                <option value="Under Review" className="bg-[var(--bg-card)]">Under Review</option>
                <option value="Escalated to CID" className="bg-[var(--bg-card)]">Escalated to CID</option>
              </select>

              <select
                id="cases-category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border text-xs bg-transparent text-[var(--text-primary)] outline-none cursor-pointer"
                style={{ borderColor: 'var(--border-main)' }}
              >
                <option value="ALL">All Categories</option>
                <option value="Organized Financial Crime" className="bg-[var(--bg-card)]">Financial Crime</option>
                <option value="Narcotics Interception" className="bg-[var(--bg-card)]">Narcotics</option>
                <option value="Arms & Logistics" className="bg-[var(--bg-card)]">Arms & Logistics</option>
                <option value="Cyber & Financial Fraud" className="bg-[var(--bg-card)]">Cyber Fraud</option>
              </select>
            </div>
          </div>

          {/* Cases List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCases.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveCaseId(c.id)}
                className="rounded-xl border p-5 space-y-3 transition-all hover:shadow-md cursor-pointer hover:border-[var(--navy-primary)] flex flex-col justify-between"
                style={{
                  backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
                  borderColor: 'var(--border-main)',
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#0b1b11]/10 dark:bg-white/10 text-[var(--text-primary)]">
                        {c.id}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#37ff85]/15 text-[#37ff85] dark:text-[#37ff85]">
                        {c.category}
                      </span>
                    </div>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      c.status === 'Active' 
                        ? 'bg-[#37ff85]/15 text-[#37ff85] dark:text-[#37ff85]' 
                        : 'bg-[#37ff85]/15 text-[#37ff85] dark:text-[#37ff85]'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-[var(--text-primary)]">
                    {c.title}
                  </h3>

                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                </div>

                <div className="pt-3 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border-light)' }}>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    <span>{c.associatedPersons.length} Persons Linked</span> • <span>{c.investigatingOfficer}</span>
                  </div>

                  <span className="font-semibold text-[#76a886] dark:text-[#76a886] flex items-center gap-1">
                    <span>Open Case</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
