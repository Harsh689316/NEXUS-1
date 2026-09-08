import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Share2, 
  Phone, 
  Mail, 
  MapPin, 
  Car, 
  FileText, 
  ShieldAlert, 
  CreditCard, 
  Building, 
  UserCheck, 
  AlertTriangle,
  Sparkles,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { dataSourceService } from '../services/dataSourceService';

interface PersonProfilePageProps {
  personId: string;
  onNavigate: (route: string, param?: string) => void;
  onBack: () => void;
}

export const PersonProfilePage: React.FC<PersonProfilePageProps> = ({
  personId,
  onNavigate,
  onBack,
}) => {
  const { theme } = useTheme();
  const person = dataSourceService.getPersonById(personId);
  if (!person) {
    return <div className="p-8 max-w-3xl mx-auto"><div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center"><div className="text-lg font-black text-[var(--text-primary)]">Record unavailable</div><p className="mt-2 text-sm text-[var(--text-secondary)]">This record is outside your current clearance or jurisdiction scope.</p><button onClick={onBack} className="mt-5 px-4 py-2 rounded-lg bg-[#37ff85] text-[#041008] text-xs font-black">Return to directory</button></div></div>;
  }
  const relationships = dataSourceService.getRelationshipsForPerson(person.id);
  const transactions = dataSourceService.getTransactionsForPerson(person.id);
  const allCases = dataSourceService.getAllCases();
  const personCases = allCases.filter((c) => person.cases.includes(c.id));

  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'locations' | 'transactions' | 'cases' | 'history'>('overview');

  return (
    <div id="nexus-person-profile-page" className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b" style={{ borderColor: 'var(--border-main)' }}>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Persons Directory</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[var(--text-muted)]">
            RECORD ID: {person.id}
          </span>
          <button
            id="view-person-network-btn"
            onClick={() => onNavigate('/network', person.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0b1b11] text-white hover:bg-[#10291a] dark:bg-[#0d2115] dark:text-[#D8E0E7] text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-[#37ff85]" />
            <span>View Network Graph</span>
          </button>
        </div>
      </div>

      {/* Hero Dossier Banner */}
      <div 
        className="rounded-2xl border p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-colors shadow-xs"
        style={{
          backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
          borderColor: 'var(--border-main)',
        }}
      >
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#0b1b11] text-[#2b5a3a] dark:bg-[#121B24] dark:text-[#37ff85] border-2 border-[#2b5a3a]/40 flex items-center justify-center font-black text-xl shrink-0 shadow-md">
            {person.id.replace('PER-', '')}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
                {person.fullName}
              </h1>
              <span className="text-sm font-semibold text-[#76a886] dark:text-[#76a886]">
                (Alias: "{person.alias}")
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-[#37ff85]/15 text-[#37ff85] dark:text-[#37ff85]">
                {person.status}
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] font-medium">
              {person.occupation} • Age: {person.age} • DOB: {person.dob} • Primary City: {person.primaryCity}
            </p>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[var(--text-secondary)]">
                Review Status: {person.riskAssessment}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#76a886]/20 text-[#76a886] dark:text-[#76a886]">
                Clearance: {person.clearanceRequired}
              </span>
            </div>
          </div>
        </div>

        <div className="flex md:flex-col items-end justify-between gap-2 shrink-0 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0" style={{ borderColor: 'var(--border-light)' }}>
          <div className="text-right">
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
              Syndicate Cluster
            </div>
            <div className="text-xs font-bold text-[var(--text-primary)] font-mono">
              {person.networkGroup.split(':')[0]}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
              Linked Cases
            </div>
            <div className="text-xs font-bold text-[#37ff85] dark:text-[#37ff85] font-mono">
              {person.cases.length} Investigations
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div 
        className="flex items-center gap-1 border-b overflow-x-auto text-xs"
        style={{ borderColor: 'var(--border-main)' }}
      >
        {[
          { id: 'overview', label: 'Dossier Overview' },
          { id: 'contacts', label: `Contacts & Communications (${person.phoneNumbers.length})` },
          { id: 'locations', label: `Locations & Mobility (${person.knownLocations.length})` },
          { id: 'transactions', label: `Financial Transactions (${transactions.length})` },
          { id: 'cases', label: `Linked Cases (${personCases.length})` },
          { id: 'history', label: 'Investigation History' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 font-semibold transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'border-[#0b1b11] text-[var(--text-primary)] dark:border-[#37ff85] dark:text-[#D8E0E7]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Summary & Associated Persons */}
          <div className="lg:col-span-2 space-y-6">
            {/* Investigative Summary */}
            <div 
              className="rounded-xl border p-5 space-y-3"
              style={{
                backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
                borderColor: 'var(--border-main)',
              }}
            >
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Intelligence Summary
              </h2>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                {person.summary}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {person.tags.map((tag) => (
                  <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-[var(--text-secondary)]">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Associated Persons Table (Section 11) */}
            <div 
              className="rounded-xl border p-5 space-y-4"
              style={{
                backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
                borderColor: 'var(--border-main)',
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    Associated Entities & Relationship Links ({relationships.length})
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Direct 1st-degree relational edges verified in investigative graph
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('/network', person.id)}
                  className="text-xs font-semibold text-[#76a886] dark:text-[#76a886] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Graph View</span>
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
                {relationships.map((rel) => {
                  const otherId = rel.sourceId === person.id ? rel.targetId : rel.sourceId;
                  const otherPerson = dataSourceService.getPersonById(otherId);

                  return (
                    <div 
                      key={rel.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onNavigate('/person', otherId)}
                            className="font-bold text-xs text-[var(--text-primary)] hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>{otherPerson?.fullName || otherId}</span>
                            <span className="text-[10px] text-[var(--text-muted)]">({otherPerson?.alias || otherId})</span>
                          </button>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0b1b11]/10 dark:bg-white/10 font-medium">
                            {rel.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)]">
                          {rel.notes}
                        </p>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono">
                          Evidence: {rel.supportingRecords.join(', ')} • First Observed: {rel.firstObserved}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between gap-1 shrink-0">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#76a886]/20 text-[#76a886] dark:text-[#76a886]">
                          {rel.confidence}% Confidence
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {rel.verificationStatus}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right 1 Col: Quick Metadata Cards */}
          <div className="space-y-6">
            {/* Quick Dossier Stats */}
            <div 
              className="rounded-xl border p-4 space-y-3"
              style={{
                backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
                borderColor: 'var(--border-main)',
              }}
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Dossier Metadata
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border-light)' }}>
                  <span className="text-[var(--text-secondary)]">Primary Jurisdiction</span>
                  <span className="font-semibold text-[var(--text-primary)]">{person.primaryCity} Police</span>
                </div>
                <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border-light)' }}>
                  <span className="text-[var(--text-secondary)]">Profile Created</span>
                  <span className="font-mono text-[var(--text-primary)]">{person.profileCreated}</span>
                </div>
                <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border-light)' }}>
                  <span className="text-[var(--text-secondary)]">Last Observed Active</span>
                  <span className="font-mono text-[var(--text-primary)]">{person.lastActive}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[var(--text-secondary)]">Audit Ledger Hash</span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)] truncate max-w-[120px]">
                    0x7f88...b912
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Vehicles Card */}
            <div 
              className="rounded-xl border p-4 space-y-3"
              style={{
                backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
                borderColor: 'var(--border-main)',
              }}
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-[#37ff85]" />
                <span>Associated Vehicles</span>
              </h3>
              {person.vehicles.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">No registered vehicle ownership logged.</p>
              ) : (
                <div className="space-y-2">
                  {person.vehicles.map((v) => (
                    <div key={v} className="p-2.5 rounded-lg border text-xs space-y-1" style={{ borderColor: 'var(--border-light)' }}>
                      <div className="font-mono font-bold text-xs text-[var(--text-primary)]">{v}</div>
                      <div className="text-[10px] text-[var(--text-secondary)]">
                        Association: Verified highway transit sightings along Expressway corridor
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ethical Notice */}
            <div 
              className="p-3 rounded-lg bg-[#2b5a3a]/15 dark:bg-[#2b5a3a]/10 border text-[11px] text-[var(--text-secondary)] space-y-1"
              style={{ borderColor: 'var(--border-light)' }}
            >
              <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
                <AlertTriangle className="w-3.5 h-3.5 text-[#37ff85]" />
                <span>Legal & Ethical Safeguard</span>
              </div>
              <p>
                Status as "Person of Interest" signifies potential relevance to active inquiries and does not constitute formal indictment or judgment of guilt.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Contacts & Communications */}
      {activeTab === 'contacts' && (
        <div 
          className="rounded-xl border p-6 space-y-6"
          style={{
            backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
            borderColor: 'var(--border-main)',
          }}
        >
          <div className="space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Telecommunication & Electronic Contacts
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Fictional CDR telephone numbers and associated secure communication channels
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {person.phoneNumbers.map((ph, idx) => (
              <div key={ph} className="p-4 rounded-xl border text-xs space-y-2" style={{ borderColor: 'var(--border-light)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#76a886] dark:text-[#76a886]" />
                    <span className="font-mono font-bold text-sm text-[var(--text-primary)]">{ph}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono">
                    Line #{idx + 1}
                  </span>
                </div>
                <div className="text-[11px] text-[var(--text-secondary)]">
                  Carrier: Telecom Circle • Tower Co-location: {person.primaryCity} Hub
                </div>
              </div>
            ))}

            {person.emails.map((em) => (
              <div key={em} className="p-4 rounded-xl border text-xs space-y-2" style={{ borderColor: 'var(--border-light)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#1565C0] dark:text-[#60A5FA]" />
                    <span className="font-mono text-xs text-[var(--text-primary)] truncate">{em}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono">
                    Verified Email
                  </span>
                </div>
                <div className="text-[11px] text-[var(--text-secondary)]">
                  Registered domain: nexus-investigation.test (Controlled investigation environment)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Locations */}
      {activeTab === 'locations' && (
        <div 
          className="rounded-xl border p-6 space-y-4"
          style={{
            backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
            borderColor: 'var(--border-main)',
          }}
        >
          <div className="space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Geographic Locations & Frequent Presences
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Documented visit history, warehousing yards, and residential terminals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {person.knownLocations.map((loc, idx) => (
              <div key={loc} className="p-4 rounded-xl border text-xs space-y-2" style={{ borderColor: 'var(--border-light)' }}>
                <div className="flex items-center gap-2 text-[#37ff85]">
                  <MapPin className="w-4 h-4" />
                  <span className="font-bold text-xs text-[var(--text-primary)]">{loc}</span>
                </div>
                <div className="text-[11px] text-[var(--text-secondary)]">
                  Logged during field surveillance & toll checkpoint logs.
                </div>
                <div className="text-[10px] font-mono text-[var(--text-muted)]">
                  Confidence: 90% (Cross-verified in 2 cases)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Transactions */}
      {activeTab === 'transactions' && (
        <div 
          className="rounded-xl border p-6 space-y-4"
          style={{
            backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
            borderColor: 'var(--border-main)',
          }}
        >
          <div className="space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Financial Transaction Ledger Records
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Fictional banking and courier transfer entries flagged for hawala/layering analysis
            </p>
          </div>

          {transactions.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] py-4">No direct banking transactions recorded for this subject in investigation ledger.</p>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
              {transactions.map((tx) => (
                <div key={tx.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs">{tx.id}</span>
                      <span className="font-semibold text-[var(--text-primary)]">{tx.category}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono">
                        {tx.channel}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">
                      {tx.sender} → {tx.receiver}
                    </div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)]">
                      Ref: {tx.bankReference} • Date: {tx.date}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold font-mono text-sm text-[var(--text-primary)]">
                      ₹{tx.amount.toLocaleString('en-IN')}
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      tx.flag === 'Normal'
                        ? 'bg-[#37ff85]/15 text-[#37ff85] dark:text-[#37ff85]'
                        : 'bg-[#C62828]/15 text-[#C62828] dark:text-[#D86C6C]'
                    }`}>
                      {tx.flag}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Linked Cases */}
      {activeTab === 'cases' && (
        <div 
          className="rounded-xl border p-6 space-y-4"
          style={{
            backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
            borderColor: 'var(--border-main)',
          }}
        >
          <div className="space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Active Investigation Dockets
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Cases where this subject appears as a Person of Interest or Associated Entity
            </p>
          </div>

          <div className="space-y-3">
            {personCases.map((c) => (
              <div 
                key={c.id} 
                onClick={() => onNavigate('/cases', c.id)}
                className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                style={{ borderColor: 'var(--border-light)' }}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-[#0b1b11]/10 dark:bg-white/10 text-[var(--text-primary)]">
                      {c.id}
                    </span>
                    <span className="font-bold text-xs text-[var(--text-primary)]">
                      {c.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    {c.description}
                  </p>
                  <div className="text-[10px] text-[var(--text-muted)]">
                    Officer: {c.investigatingOfficer} • Opened: {c.openedDate}
                  </div>
                </div>

                <div className="flex sm:flex-col items-end justify-between gap-2 shrink-0">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#37ff85]/15 text-[#37ff85] dark:text-[#37ff85]">
                    {c.status}
                  </span>
                  <span className="text-[11px] font-semibold text-[#76a886] dark:text-[#76a886]">
                    View Case Dossier →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Criminal/Investigation History */}
      {activeTab === 'history' && (
        <div 
          className="rounded-xl border p-6 space-y-4"
          style={{
            backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
            borderColor: 'var(--border-main)',
          }}
        >
          <div className="space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Historical Fictional Records
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Archived historical notices, prior bails, and inquiries
            </p>
          </div>

          {person.criminalHistory.length === 0 ? (
            <div className="p-4 rounded-xl border text-xs text-[var(--text-muted)]" style={{ borderColor: 'var(--border-light)' }}>
              No previous formal charges or convictions in archived state repositories.
            </div>
          ) : (
            <div className="space-y-3">
              {person.criminalHistory.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border text-xs space-y-1" style={{ borderColor: 'var(--border-light)' }}>
                  <div className="flex items-center justify-between font-semibold text-[var(--text-primary)]">
                    <span>{item.offenseType}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/10">
                      {item.year}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    Jurisdiction: {item.jurisdiction} • Ref: {item.caseRef}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)]">
                    Status: {item.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
