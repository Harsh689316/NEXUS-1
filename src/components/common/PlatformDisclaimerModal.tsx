import React from 'react';
import { Shield, X, AlertTriangle, Database, CheckCircle2, Lock, Cpu, Link2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface PlatformDisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlatformDisclaimerModal: React.FC<PlatformDisclaimerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div 
        id="platform-environment-disclaimer-modal"
        className="relative w-full max-w-xl rounded-xl border shadow-2xl overflow-hidden p-6 space-y-4"
        style={{
          backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
          borderColor: 'var(--border-main)',
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#37ff85]/15 text-[#37ff85] dark:text-[#37ff85] flex items-center justify-center border border-[#37ff85]/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[var(--text-primary)]">
                NEXUS platform architecture & Compliance Notice
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                AUTHORIZED INVESTIGATION PLATFORM
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs leading-relaxed text-[var(--text-primary)]">
          <div className="p-3 rounded-lg bg-[#2b5a3a]/15 dark:bg-[#2b5a3a]/10 border border-[#2b5a3a]/30 space-y-1">
            <div className="font-semibold text-[#37ff85] dark:text-[#37ff85] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Controlled Investigation Dataset</span>
            </div>
            <p className="text-[var(--text-secondary)]">
              All 50 persons, 15 cases, phone records, vehicle plates, bank transactions, and anonymous intelligence tips in this application are controlled records for the application environment. NEXUS does not claim or possess connectivity to live police registries, CCTNS, real biometric databases, or genuine CDR records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-lg border" style={{ borderColor: 'var(--border-light)' }}>
              <div className="font-semibold flex items-center gap-1.5 text-[var(--text-primary)] mb-1">
                <Lock className="w-3.5 h-3.5 text-[#76a886] dark:text-[#76a886]" />
                <span>Device Authentication</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Device authentication uses the configured authentication service and approved fallback methods.
              </p>
            </div>

            <div className="p-2.5 rounded-lg border" style={{ borderColor: 'var(--border-light)' }}>
              <div className="font-semibold flex items-center gap-1.5 text-[var(--text-primary)] mb-1">
                <Cpu className="w-3.5 h-3.5 text-[#0b1b11] dark:text-[#3B82F6]" />
                <span>Deterministic AI Reasoning</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                AI network findings and assistant answers are powered by deterministic graph analysis and correlation heuristics over the authorized investigation dataset, requiring no external paid API dependencies.
              </p>
            </div>

            <div className="p-2.5 rounded-lg border" style={{ borderColor: 'var(--border-light)' }}>
              <div className="font-semibold flex items-center gap-1.5 text-[var(--text-primary)] mb-1">
                <Database className="w-3.5 h-3.5 text-[#37ff85]" />
                <span>Relational PostgreSQL Ready</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                The architecture features a production DDL schema (`schema.sql`) and DataSourceService layer with immediate local data adapter fallback when external SQL servers are disconnected.
              </p>
            </div>

            <div className="p-2.5 rounded-lg border" style={{ borderColor: 'var(--border-light)' }}>
              <div className="font-semibold flex items-center gap-1.5 text-[var(--text-primary)] mb-1">
                <Link2 className="w-3.5 h-3.5 text-[#37ff85] dark:text-[#37ff85]" />
                <span>Tamper-Evident Hash Chain</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Investigation actions are cryptographically sealed into a sequential blockchain-inspired hash ledger with verification tools to demonstrate audit trail immutability.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#0b1b11] text-white dark:bg-[#0d2115] dark:text-[#D8E0E7] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Acknowledge & Proceed
          </button>
        </div>
      </div>
    </div>
  );
};
