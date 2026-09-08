import React from 'react';
import { 
  LayoutDashboard, 
  Search, 
  Users, 
  Share2, 
  FileText, 
  BarChart3, 
  ShieldCheck, 
  Database, 
  Settings, 
  LogOut, 
  Sun, 
  Moon,
  FolderOpen,
  HelpCircle,
  Sparkles,
  Shield,
  Layers,
  DatabaseZap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenAIAssistant: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  isMobileOpen,
  onCloseMobile,
  onOpenAIAssistant,
}) => {
  const { officer, logout, hasClearance } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    {
      id: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      id: '/investigations',
      label: 'Investigations',
      icon: FolderOpen,
      badge: '15 Cases',
    },
    {
      id: '/persons',
      label: 'Persons of Interest',
      icon: Users,
      badge: '50',
    },
    {
      id: '/network',
      label: 'Network Analysis',
      icon: Share2,
      badge: 'Hero Graph',
      isHero: true,
    },
    {
      id: '/tips',
      label: 'Intelligence Tips',
      icon: HelpCircle,
      badge: '12 New',
    },
    {
      id: '/cases',
      label: 'Cases & Dockets',
      icon: FileText,
      badge: undefined,
    },
    {
      id: '/analytics',
      label: 'Analytics',
      icon: BarChart3,
      badge: undefined,
    },
    {
      id: '/audit',
      label: 'Audit Trail',
      icon: ShieldCheck,
      badge: 'Hash Chain',
    },
    {
      id: '/cctns-ingestion',
      label: 'CCTNS / e-FIR Intake',
      icon: DatabaseZap,
      badge: 'Live Intake',
    },
    {
      id: '/data-sources',
      label: 'Data Sources',
      icon: Database,
      badge: 'PERN + CCTNS',
    },
    {
      id: '/settings',
      label: 'Settings',
      icon: Settings,
      badge: undefined,
    },
  ];

  const handleNav = (route: string) => {
    onNavigate(route);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="nexus-main-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 flex flex-col border-r transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          backgroundColor: theme === 'dark' ? 'var(--bg-sidebar)' : 'var(--bg-sidebar)',
          borderColor: 'var(--border-main)',
        }}
      >
        {/* Brand Header */}
        <div 
          className="p-4 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border-main)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0b1b11] text-[#2b5a3a] dark:bg-[#121B24] dark:text-[#37ff85] border border-[#2b5a3a]/40 flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-wider text-[var(--text-primary)]">
                  NEXUS
                </span>
                <span className="text-[10px] font-mono px-1 py-0.2 rounded font-bold bg-[#0b1b11]/10 text-[#0b1b11] dark:bg-white/10 dark:text-[#D8E0E7]">
                  v2.4
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] font-medium leading-tight">
                Criminal Network Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* AI Quick Query Callout */}
        <div className="p-3">
          <button
            onClick={() => {
              onOpenAIAssistant();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold bg-[#0b1b11] text-white dark:bg-[#0d2115] dark:text-[#D8E0E7] border border-[#0b1b11]/20 hover:opacity-90 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#37ff85]" />
              <span>AI Assistant</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/20 font-mono">
              Ask AI
            </span>
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-2 py-1">
            Investigation Modules
          </div>

          {navItems.map((item) => {
            const isActive = currentRoute === item.id || (item.id !== '/dashboard' && currentRoute.startsWith(item.id));
            const IconComponent = item.icon;

            return (
              <button
                key={item.id}
                id={`sidebar-link-${item.id.replace('/', '')}`}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#0b1b11] text-white dark:bg-[#18232E] dark:text-[#D8E0E7] shadow-xs'
                    : 'text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <IconComponent 
                    className={`w-4 h-4 ${
                      isActive 
                        ? 'text-[#37ff85]' 
                        : item.isHero 
                          ? 'text-[#37ff85] dark:text-[#37ff85]' 
                          : 'text-[var(--text-secondary)]'
                    }`} 
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.isHero
                          ? 'bg-[#37ff85]/15 text-[#37ff85] dark:text-[#37ff85] font-bold'
                          : 'bg-black/5 dark:bg-white/10 text-[var(--text-secondary)]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Officer Profile & Controls */}
        <div 
          className="p-3 border-t mt-auto space-y-2"
          style={{ borderColor: 'var(--border-main)' }}
        >
          {officer && (
            <div 
              className="p-2.5 rounded-lg border text-xs"
              style={{
                backgroundColor: theme === 'dark' ? 'var(--bg-card)' : 'var(--bg-card)',
                borderColor: 'var(--border-light)',
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#0b1b11] text-white dark:bg-[#3B82F6] flex items-center justify-center text-[10px] font-bold">
                    {officer.avatarInitials}
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--text-primary)] text-xs truncate max-w-[120px]">
                      {officer.name.split(' ')[1] || officer.name}
                    </div>
                    <div className="text-[10px] font-mono text-[var(--text-secondary)]">
                      {officer.id}
                    </div>
                  </div>
                </div>

                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-[#76a886]/20 text-[#76a886] dark:text-[#76a886]">
                  {officer.clearanceLevel.split('_')[0]}
                </span>
              </div>

              <div className="text-[10px] text-[var(--text-muted)] truncate">
                {officer.department}
              </div>
            </div>
          )}

          {/* Theme Switcher & Logout */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              style={{ borderColor: 'var(--border-main)' }}
              title="Switch Color Theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-[#37ff85]" /> : <Moon className="w-3.5 h-3.5 text-[#0b1b11]" />}
              <span className="text-[11px] font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <button
              id="sidebar-logout-btn"
              onClick={logout}
              className="p-1.5 rounded-lg border text-[#C62828] dark:text-[#D86C6C] hover:bg-[#C62828]/10 transition-colors cursor-pointer"
              style={{ borderColor: 'var(--border-main)' }}
              title="Logout session"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
