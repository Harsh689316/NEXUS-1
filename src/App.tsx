import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { AIAssistantModal } from './components/common/AIAssistantModal';
import { PlatformDisclaimerModal } from './components/common/PlatformDisclaimerModal';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PersonsPage } from './pages/PersonsPage';
import { PersonProfilePage } from './pages/PersonProfilePage';
import { NetworkAnalysisPage } from './pages/NetworkAnalysisPage';
import { InvestigationsPage } from './pages/InvestigationsPage';
import { IntelligenceTipsPage } from './pages/IntelligenceTipsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { DataSourcesPage } from './pages/DataSourcesPage';
import { CCTNSIngestionPage } from './pages/CCTNSIngestionPage';
import { SettingsPage } from './pages/SettingsPage';

const MainApplication: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();

  // Navigation State
  const [currentRoute, setCurrentRoute] = useState<string>('/dashboard');
  const [routeParam, setRouteParam] = useState<string | undefined>(undefined);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);

  // Handle navigation
  const handleNavigate = (route: string, param?: string) => {
    setCurrentRoute(route);
    setRouteParam(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If not authenticated, display the 2-step Login & Device Authentication page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div 
      className="min-h-screen flex flex-col font-sans transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Header Bar */}
      <Header
        currentRoute={currentRoute}
        onNavigate={(route, id) => handleNavigate(route, id)}
        onToggleMobileMenu={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isMobileMenuOpen={isMobileSidebarOpen}
        onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
        onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Sidebar */}
        <Sidebar
          currentRoute={currentRoute}
          onNavigate={(route) => handleNavigate(route)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
        />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto relative">
          {currentRoute === '/dashboard' && (
            <DashboardPage
              onNavigate={(route, param) => handleNavigate(route, param)}
              onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
            />
          )}

          {currentRoute === '/persons' && (
            <PersonsPage
              onNavigate={(route, param) => handleNavigate(route, param)}
            />
          )}

          {currentRoute === '/person' && (
            <PersonProfilePage
              personId={routeParam || 'PER-01'}
              onNavigate={(route, param) => handleNavigate(route, param)}
              onBack={() => handleNavigate('/persons')}
            />
          )}

          {currentRoute === '/network' && (
            <NetworkAnalysisPage
              initialPersonId={routeParam}
              onNavigate={(route, param) => handleNavigate(route, param)}
            />
          )}

          {(currentRoute === '/investigations' || currentRoute === '/cases') && (
            <InvestigationsPage
              selectedCaseId={routeParam}
              onNavigate={(route, param) => handleNavigate(route, param)}
            />
          )}

          {currentRoute === '/tips' && (
            <IntelligenceTipsPage
              onNavigate={(route, param) => handleNavigate(route, param)}
            />
          )}

          {currentRoute === '/analytics' && (
            <AnalyticsPage />
          )}

          {currentRoute === '/audit' && (
            <AuditTrailPage />
          )}

          {currentRoute === '/data-sources' && (
            <DataSourcesPage />
          )}

          {currentRoute === '/cctns-ingestion' && (
            <CCTNSIngestionPage />
          )}

          {currentRoute === '/settings' && (
            <SettingsPage
              onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <AIAssistantModal
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        onNavigateEntity={(route, id) => handleNavigate(route, id)}
      />

      <PlatformDisclaimerModal
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApplication />
      </AuthProvider>
    </ThemeProvider>
  );
}
