import React from 'react';
import { 
  FolderOpen, 
  Users, 
  Share2, 
  HelpCircle, 
  ShieldCheck, 
  Link2, 
  ArrowUpRight, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Database, 
  Lock, 
  Sparkles, 
  TrendingUp,
  FileText,
  Building,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { dataSourceService } from '../services/dataSourceService';

interface DashboardPageProps {
  onNavigate: (route: string, param?: string) => void;
  onOpenAIAssistant: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenAIAssistant,
}) => {
  const { officer } = useAuth();
  const { theme } = useTheme();

  const cases = dataSourceService.getAllCases();
  const persons = dataSourceService.getAllPersons();
  const relationships = dataSourceService.getAllRelationships();
  const tips = dataSourceService.getAllTips();
  const auditRecords = dataSourceService.getAuditTrail();
  const aiFindings = dataSourceService.getAIFindings();

  const pendingTipsCount = tips.filter((t) => t.status === 'New' || t.status === 'Under Review').length;
  const crossCasePersonsCount = persons.filter((p) => p.cases.length >= 3).length;

  return (
    <div id="nexus-dashboard-page" className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Welcome Bar */}
      <div 
        className="rounded-2xl border p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors"
        style={{
          backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
          borderColor: 'var(--border-main)',
        }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-[#76a886] dark:text-[#76a886]">
              OPERATIONAL INTELLIGENCE DASHBOARD
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0b1b11]/10 dark:bg-white/10 text-[var(--text-secondary)] font-semibold">
              STATION CLEARANCE: {officer?.clearanceLevel || 'L2_SECRET'}
            </span>
          </div>
          <h1 className="text-xl lg:text-2xl font-black tracking-tight text-[var(--text-primary)]">
            Welcome, {officer?.name || 'Authorized Investigator'}
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            {officer?.department} • Active Session ID: {officer?.badgeNumber || 'MH-INV-2087'} • Secure In-Memory Ledger
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => onNavigate('/network')}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0b1b11] text-white hover:bg-[#10291a] dark:bg-[#0d2115] dark:text-[#D8E0E7] text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-[#37ff85]" />
            <span>Open Network Graph</span>
          </button>

          <button
            onClick={onOpenAIAssistant}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold text-[var(--text-primary)] transition-all cursor-pointer"
            style={{ borderColor: 'var(--border-main)' }}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#37ff85]" />
            <span>AI Reasoning</span>
          </button>
        </div>
      </div>

      {/* Primary 6 Top Statistics (Requirement Section 9) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
        {/* Active Investigations */}
        <div 
          onClick={() => onNavigate('/investigations')}
          className="p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer group"
          style={{
            backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
            borderColor: 'var(--border-main)',
          }}
        >
          <div className="flex items-center justify-between text-[var(--text-secondary)] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Cases</span>
            <FolderOpen className="w-4 h-4 text-[#0b1b11] dark:text-[#60A5FA] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">24</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">15 primary + 9 sub-leads</div>
        </div>

        {/* Persons of Interest */}
        <div 
          onClick={() => onNavigate('/persons')}
          className="p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer group"
          style={{
            backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
            borderColor: 'var(--border-main)',
          }}
        >
          <div className="flex items-center justify-between text-[var(--text-secondary)] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Persons of Interest</span>
            <Users className="w-4 h-4 text-[#76a886] dark:text-[#76a886] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">50</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">Authorized Cohort</div>
        </div>

        {/* Known Relationships */}
        <div 
          onClick={() => onNavigate('/network')}
          className="p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer group"
          style={{
            backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
            borderColor: 'var(--border-main)',
          }}
        >
          <div className="flex items-center justify-between text-[var(--text-secondary)] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Relationships</span>
            <Share2 className="w-4 h-4 text-[#37ff85] dark:text-[#37ff85] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">184</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">Verified & Under Review</div>
        </div>

        {/* Pending Intelligence Tips */}
        <div 
          onClick={() => onNavigate('/tips')}
          className="p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer group"
          style={{
            backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
            borderColor: 'var(--border-main)',
          }}
        >
          <div className="flex items-center justify-between text-[var(--text-secondary)] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Tips</span>
            <HelpCircle className="w-4 h-4 text-[#C62828] dark:text-[#D86C6C] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">12</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">{pendingTipsCount} pending review</div>
        </div>

        {/* Cross-Case Connections */}
        <div 
          onClick={() => onNavigate('/network')}
          className="p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer group"
          style={{
            backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
            borderColor: 'var(--border-main)',
          }}
        >
          <div className="flex items-center justify-between text-[var(--text-secondary)] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Cross-Case Links</span>
            <Link2 className="w-4 h-4 text-[#1565C0] dark:text-[#60A5FA] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">17</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">{crossCasePersonsCount} strategic bridge nodes</div>
        </div>

        {/* Verified Officers */}
        <div 
          onClick={() => onNavigate('/settings')}
          className="p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer group"
          style={{
            backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
            borderColor: 'var(--border-main)',
          }}
        >
          <div className="flex items-center justify-between text-[var(--text-secondary)] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Officers</span>
            <ShieldCheck className="w-4 h-4 text-[#37ff85] dark:text-[#37ff85] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">8</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">Multi-level clearance</div>
        </div>
      </div>

      {/* Middle Grid: Recent Investigations & AI Network Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Investigations */}
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
                Active Priority Investigations
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Multi-jurisdictional dockets currently under active intelligence correlation
              </p>
            </div>
            <button
              onClick={() => onNavigate('/cases')}
              className="text-xs font-semibold text-[#76a886] dark:text-[#76a886] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All 15 Cases</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {cases.slice(0, 4).map((c) => (
              <div
                key={c.id}
                onClick={() => onNavigate('/cases', c.id)}
                className="p-3.5 rounded-xl border transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                style={{ borderColor: 'var(--border-light)' }}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#0b1b11]/10 dark:bg-white/10 text-[var(--text-primary)]">
                      {c.id}
                    </span>
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      {c.title}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-1">
                    {c.description}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                    <span>Officer: {c.investigatingOfficer}</span>
                    <span>•</span>
                    <span>Jurisdiction: {c.primaryJurisdiction}</span>
                    <span>•</span>
                    <span>{c.associatedPersons.length} Linked Persons</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-end justify-between gap-2 shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    c.status === 'Active' 
                      ? 'bg-[#37ff85]/15 text-[#37ff85] dark:text-[#37ff85]' 
                      : 'bg-[#37ff85]/15 text-[#37ff85] dark:text-[#37ff85]'
                  }`}>
                    {c.status}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    Est. ₹{(c.financialVolumeINR ? c.financialVolumeINR / 10000000 : 5).toFixed(1)} Cr
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: AI Network Analysis Findings (Cautious AI reasoning) */}
        <div 
          className="rounded-2xl border p-5 space-y-4 flex flex-col justify-between"
          style={{
            backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
            borderColor: 'var(--border-main)',
          }}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#37ff85]" />
                <span>AI Network Insights</span>
              </h2>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#37ff85]/15 text-[#37ff85] dark:text-[#37ff85]">
                ANALYTICS ENGINE
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Deterministic graph clustering and suspicious anomaly identification
            </p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px]">
            {aiFindings.slice(0, 3).map((finding) => (
              <div 
                key={finding.id}
                className="p-3 rounded-xl border text-xs space-y-2"
                style={{
                  backgroundColor: theme === 'dark' ? 'var(--bg-card-elevated)' : 'var(--bg-card-elevated)',
                  borderColor: 'var(--border-light)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--text-primary)]">
                    {finding.title}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold bg-[#76a886]/20 text-[#76a886] dark:text-[#76a886]">
                    {finding.confidence}% Conf.
                  </span>
                </div>

                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  {finding.description}
                </p>

                <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: 'var(--border-light)' }}>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono">
                    Evidence: {finding.supportingRecords.join(', ')}
                  </div>
                  <button
                    onClick={() => onNavigate('/network')}
                    className="text-[10px] font-semibold text-[#76a886] dark:text-[#76a886] hover:underline cursor-pointer"
                  >
                    View in Graph →
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t text-[11px] text-[var(--text-muted)] flex items-center gap-1.5" style={{ borderColor: 'var(--border-light)' }}>
            <AlertTriangle className="w-3.5 h-3.5 text-[#37ff85] shrink-0" />
            <span>AI insights require manual verification by authorized case officer.</span>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Intelligence Tips & System Security Posture */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Intelligence Tips (2 Cols) */}
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
                Recent Intelligence Tips Intake
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Anonymous citizen tip intake flagged for investigator review
              </p>
            </div>
            <button
              onClick={() => onNavigate('/tips')}
              className="text-xs font-semibold text-[#76a886] dark:text-[#76a886] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All Tips</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {tips.slice(0, 3).map((tip) => (
              <div
                key={tip.id}
                className="p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                style={{
                  borderColor: 'var(--border-light)',
                  backgroundColor: theme === 'dark' ? 'var(--bg-card-elevated)' : 'var(--bg-card-elevated)',
                }}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[var(--text-primary)]">
                      {tip.id}
                    </span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {tip.category}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      ({tip.location})
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1">
                    {tip.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                    tip.status === 'Linked'
                      ? 'bg-[#37ff85]/15 text-[#37ff85] dark:text-[#37ff85]'
                      : tip.status === 'Under Review'
                        ? 'bg-[#37ff85]/15 text-[#37ff85] dark:text-[#37ff85]'
                        : 'bg-black/5 dark:bg-white/10 text-[var(--text-secondary)]'
                  }`}>
                    {tip.status}
                  </span>
                  <button
                    onClick={() => onNavigate('/tips')}
                    className="px-2.5 py-1 rounded bg-[#0b1b11] text-white dark:bg-[#0d2115] text-[10px] font-semibold hover:opacity-90 cursor-pointer"
                  >
                    Examine
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Security & Integrity Health (1 Col, Section 9) */}
        <div 
          className="rounded-2xl border p-5 space-y-4"
          style={{
            backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
            borderColor: 'var(--border-main)',
          }}
        >
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#37ff85] dark:text-[#37ff85]" />
              <span>System Security Posture</span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Operational compliance & cryptographic hash status
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded-lg border flex items-center justify-between" style={{ borderColor: 'var(--border-light)' }}>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#76a886] dark:text-[#76a886]" />
                <span className="font-medium text-[var(--text-primary)]">Authentication Status</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#37ff85]/15 text-[#37ff85] dark:text-[#37ff85]">
                MFA Verified
              </span>
            </div>

            <div className="p-2.5 rounded-lg border flex items-center justify-between" style={{ borderColor: 'var(--border-light)' }}>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#1565C0] dark:text-[#60A5FA]" />
                <span className="font-medium text-[var(--text-primary)]">Database Layer</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#1565C0]/15 text-[#1565C0] dark:text-[#60A5FA]">
                Demo Mode Active
              </span>
            </div>

            <div className="p-2.5 rounded-lg border flex items-center justify-between" style={{ borderColor: 'var(--border-light)' }}>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#37ff85] dark:text-[#37ff85]" />
                <span className="font-medium text-[var(--text-primary)]">Audit Logging</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#37ff85]/15 text-[#37ff85] dark:text-[#37ff85]">
                150+ Blocks
              </span>
            </div>

            <div className="p-2.5 rounded-lg border flex items-center justify-between" style={{ borderColor: 'var(--border-light)' }}>
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-[#37ff85] dark:text-[#37ff85]" />
                <span className="font-medium text-[var(--text-primary)]">Data Integrity Hash</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#37ff85]/15 text-[#37ff85] dark:text-[#37ff85]">
                VERIFIED (0 Breakage)
              </span>
            </div>
          </div>

          <div className="pt-2 border-t flex justify-end" style={{ borderColor: 'var(--border-light)' }}>
            <button
              onClick={() => onNavigate('/audit')}
              className="w-full py-2 rounded-lg border hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold text-[var(--text-primary)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              style={{ borderColor: 'var(--border-main)' }}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Inspect Audit Blockchain</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
