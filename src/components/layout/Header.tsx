import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Sun, 
  Moon, 
  Bell, 
  ShieldAlert, 
  Lock, 
  Clock, 
  User, 
  LogOut, 
  ChevronDown, 
  Menu, 
  X,
  FileText,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { dataSourceService } from '../../services/dataSourceService';
import { Person, Case, IntelligenceTip } from '../../types';

interface HeaderProps {
  onNavigate: (route: string, param?: string) => void;
  currentRoute: string;
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
  onOpenAIAssistant: () => void;
  onOpenDisclaimer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigate,
  currentRoute,
  onToggleMobileMenu,
  isMobileMenuOpen,
  onOpenAIAssistant,
  onOpenDisclaimer,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { officer, logout, sessionTimeRemaining } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    persons: Person[];
    cases: Case[];
    tips: IntelligenceTip[];
    locations: string[];
    vehicles: string[];
  }>({ persons: [], cases: [], tips: [], locations: [], vehicles: [] });

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const res = dataSourceService.searchEntities(searchQuery);
      setSearchResults(res);
    } else {
      setSearchResults({ persons: [], cases: [], tips: [], locations: [], vehicles: [] });
    }
  }, [searchQuery]);

  // Click outside listener for search popup
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalResults = 
    searchResults.persons.length + 
    searchResults.cases.length + 
    searchResults.tips.length + 
    searchResults.locations.length + 
    searchResults.vehicles.length;

  return (
    <header 
      id="nexus-app-header"
      className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 py-2.5 border-b transition-colors"
      style={{
        backgroundColor: theme === 'dark' ? 'var(--bg-header)' : '#FFFFFF',
        borderColor: theme === 'dark' ? 'var(--border-main)' : 'var(--border-main)',
      }}
    >
      {/* Left side: Mobile Toggle & Context Title */}
      <div className="flex items-center gap-3">
        <button
          id="mobile-menu-toggle-btn"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-card-elevated)] transition-colors"
          aria-label="Toggle Navigation"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-[var(--text-primary)]">
                NEXUS
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-[#76a886]/15 text-[#76a886] dark:bg-[#76a886]/20 dark:text-[#76a886] border border-[#76a886]/25">
                INTEL-SYS
              </span>
              <button
                onClick={onOpenDisclaimer}
                className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[#37ff85]/10 text-[#37ff85] dark:bg-[#37ff85]/20 dark:text-[#37ff85] border border-[#37ff85]/30 hover:bg-[#37ff85]/20 transition-colors cursor-pointer"
                title="View platform environment details"
              >
                AUTHORIZED INVESTIGATION PLATFORM
              </button>
            </div>
            <span className="text-[11px] text-[var(--text-secondary)]">
              Authorized Law Enforcement Intelligence Console
            </span>
          </div>
        </div>
      </div>

      {/* Center: Prominent Global Investigation Search */}
      <div ref={searchContainerRef} className="relative flex-1 max-w-xl mx-3 lg:mx-8">
        <div 
          className="relative flex items-center rounded-lg border transition-all"
          style={{
            backgroundColor: theme === 'dark' ? 'var(--bg-main)' : 'var(--bg-card-elevated)',
            borderColor: isSearchFocused ? 'var(--navy-primary)' : 'var(--border-main)',
            boxShadow: isSearchFocused ? '0 0 0 2px rgba(24,42,58,0.15)' : 'none',
          }}
        >
          <Search className="w-4 h-4 ml-3 text-[var(--text-secondary)] shrink-0" />
          <input
            id="global-investigation-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            placeholder="Search person, case, phone, vehicle, location or organization…"
            className="w-full px-3 py-1.5 text-sm bg-transparent outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mr-2.5 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-secondary)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="hidden md:inline-block text-[10px] font-mono px-1.5 py-0.5 mr-2 rounded bg-black/5 dark:bg-white/10 text-[var(--text-muted)]">
            50 Records
          </span>
        </div>

        {/* Search Results Dropdown */}
        {isSearchFocused && searchQuery.trim().length > 1 && (
          <div 
            id="search-results-dropdown"
            className="absolute left-0 right-0 top-full mt-1.5 rounded-lg border shadow-xl overflow-hidden z-50 max-h-[460px] overflow-y-auto"
            style={{
              backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
              borderColor: 'var(--border-main)',
            }}
          >
            <div className="px-3 py-2 border-b text-[11px] font-medium text-[var(--text-secondary)] flex justify-between items-center"
              style={{ borderColor: 'var(--border-light)' }}
            >
              <span>SEARCH MATCHES ({totalResults})</span>
              <span className="text-[10px]">Press entity to open record</span>
            </div>

            {totalResults === 0 ? (
              <div className="p-6 text-center text-sm text-[var(--text-secondary)]">
                No active investigation records found for "{searchQuery}".
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
                {/* Persons */}
                {searchResults.persons.length > 0 && (
                  <div className="p-2">
                    <div className="text-[10px] font-semibold text-[var(--text-secondary)] px-2 py-1 uppercase tracking-wider">
                      Persons of Interest ({searchResults.persons.length})
                    </div>
                    {searchResults.persons.slice(0, 5).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setIsSearchFocused(false);
                          setSearchQuery('');
                          onNavigate('/person', p.id);
                        }}
                        className="w-full text-left flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#0b1b11]/10 dark:bg-white/10 text-[#0b1b11] dark:text-[#D8E0E7] flex items-center justify-center text-[10px] font-bold">
                            {p.id.replace('PER-', '')}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-[var(--text-primary)]">
                              {p.fullName}
                            </span>
                            <span className="text-[11px] text-[var(--text-secondary)] ml-2">
                              ({p.alias}) • {p.occupation}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-[#37ff85]/15 text-[#37ff85] dark:text-[#37ff85]">
                          {p.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Cases */}
                {searchResults.cases.length > 0 && (
                  <div className="p-2">
                    <div className="text-[10px] font-semibold text-[var(--text-secondary)] px-2 py-1 uppercase tracking-wider">
                      Investigation Cases ({searchResults.cases.length})
                    </div>
                    {searchResults.cases.slice(0, 3).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setIsSearchFocused(false);
                          setSearchQuery('');
                          onNavigate('/cases', c.id);
                        }}
                        className="w-full text-left flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#76a886] dark:text-[#76a886]" />
                          <div>
                            <span className="text-xs font-semibold text-[var(--text-primary)]">
                              {c.id}: {c.title}
                            </span>
                            <div className="text-[10px] text-[var(--text-secondary)]">
                              {c.category} • {c.primaryJurisdiction}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                          {c.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Tips */}
                {searchResults.tips.length > 0 && (
                  <div className="p-2">
                    <div className="text-[10px] font-semibold text-[var(--text-secondary)] px-2 py-1 uppercase tracking-wider">
                      Intelligence Tips ({searchResults.tips.length})
                    </div>
                    {searchResults.tips.slice(0, 2).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setIsSearchFocused(false);
                          setSearchQuery('');
                          onNavigate('/tips');
                        }}
                        className="w-full text-left flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-[#37ff85]" />
                          <span className="text-xs text-[var(--text-primary)]">
                            {t.id}: {t.category} ({t.location})
                          </span>
                        </div>
                        <span className="text-[10px] text-[var(--text-secondary)]">
                          {t.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Locations / Vehicles */}
                {(searchResults.locations.length > 0 || searchResults.vehicles.length > 0) && (
                  <div className="p-2 text-xs text-[var(--text-secondary)] flex flex-wrap gap-1.5">
                    {searchResults.locations.slice(0, 4).map((loc) => (
                      <span key={loc} className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-[11px]">
                        📍 {loc}
                      </span>
                    ))}
                    {searchResults.vehicles.slice(0, 3).map((v) => (
                      <span key={v} className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-[11px] font-mono">
                        🚗 {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* AI Assistant Trigger Button */}
        <button
          id="open-ai-assistant-btn"
          onClick={onOpenAIAssistant}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#0b1b11] text-white hover:bg-[#10291a] dark:bg-[#0d2115] dark:hover:bg-[#12331f] dark:text-[#D8E0E7] border border-[#0b1b11]/20 transition-all cursor-pointer shadow-xs"
          title="Open AI Investigation Assistant"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#37ff85]" />
          <span className="hidden sm:inline">AI Assistant</span>
        </button>

        {/* Secure Session Pill */}
        {officer && (
          <div 
            id="secure-session-indicator"
            className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs"
            style={{
              backgroundColor: theme === 'dark' ? 'var(--bg-main)' : 'var(--bg-card-elevated)',
              borderColor: 'var(--border-main)',
            }}
          >
            <div className="w-2 h-2 rounded-full bg-[#37ff85] dark:bg-[#37ff85] animate-pulse" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-[var(--text-primary)]">
                  SECURE SESSION
                </span>
                <span className="text-[9px] px-1 rounded bg-[#0b1b11]/10 dark:bg-white/10 text-[var(--text-secondary)] font-mono">
                  {officer.clearanceLevel.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] font-mono">
                <Clock className="w-2.5 h-2.5" />
                <span>{formatTime(sessionTimeRemaining)} remaining</span>
              </div>
            </div>
          </div>
        )}

        {/* Theme Toggle Button (LIGHT / DARK) */}
        <button
          id="theme-toggle-btn"
          onClick={toggleTheme}
          className="p-2 rounded-lg border text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
          style={{
            backgroundColor: theme === 'dark' ? 'var(--bg-card-elevated)' : 'var(--bg-card)',
            borderColor: 'var(--border-main)',
          }}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#37ff85]" />
          ) : (
            <Moon className="w-4 h-4 text-[#0b1b11]" />
          )}
        </button>

        {/* Officer Profile & Dropdown */}
        {officer && (
          <div className="relative">
            <button
              id="officer-profile-menu-btn"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg border transition-all cursor-pointer"
              style={{
                backgroundColor: theme === 'dark' ? 'var(--bg-card-elevated)' : 'var(--bg-card)',
                borderColor: 'var(--border-main)',
              }}
            >
              <div className="w-7 h-7 rounded-full bg-[#0b1b11] text-white dark:bg-[#3B82F6] flex items-center justify-center text-xs font-bold">
                {officer.avatarInitials}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-[var(--text-primary)] leading-tight">
                  {officer.id}
                </span>
                <span className="text-[10px] text-[var(--text-secondary)] capitalize leading-tight">
                  {officer.role.replace('_', ' ')}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            </button>

            {isProfileMenuOpen && (
              <div
                id="officer-dropdown-panel"
                className="absolute right-0 top-full mt-1.5 w-60 rounded-lg border shadow-xl p-2 z-50 text-xs"
                style={{
                  backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
                  borderColor: 'var(--border-main)',
                }}
              >
                <div className="px-2 py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
                  <p className="font-semibold text-sm text-[var(--text-primary)]">{officer.name}</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">{officer.department}</p>
                  <p className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">Badge: {officer.badgeNumber}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-[#76a886]/20 text-[#76a886] dark:text-[#76a886]">
                      CLEARANCE {officer.clearanceLevel}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onNavigate('/settings');
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-primary)] flex items-center justify-between cursor-pointer"
                  >
                    <span>Security & Session Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onNavigate('/audit');
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-primary)] flex items-center justify-between cursor-pointer"
                  >
                    <span>Audit Hash Trail</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenDisclaimer();
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-primary)] flex items-center justify-between cursor-pointer"
                  >
                    <span>platform Environment Notice</span>
                  </button>
                </div>

                <div className="pt-1 border-t" style={{ borderColor: 'var(--border-light)' }}>
                  <button
                    id="header-logout-btn"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-2 py-1.5 rounded text-[#C62828] dark:text-[#D86C6C] hover:bg-[#C62828]/10 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Terminate Session / Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
