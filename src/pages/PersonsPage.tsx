import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  ArrowRight, 
  Share2, 
  Phone, 
  Mail, 
  MapPin, 
  Car, 
  FileText,
  Shield,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { dataSourceService } from '../services/dataSourceService';
import { Person } from '../types';

interface PersonsPageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const PersonsPage: React.FC<PersonsPageProps> = ({ onNavigate }) => {
  const { theme } = useTheme();
  const allPersons = dataSourceService.getAllPersons();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCity, setSelectedCity] = useState('ALL');

  // Unique groups & cities for filter dropdowns
  const groups = useMemo(() => {
    const set = new Set(allPersons.map((p) => p.networkGroup.split(':')[0]));
    return Array.from(set);
  }, [allPersons]);

  const cities = useMemo(() => {
    const set = new Set(allPersons.map((p) => p.primaryCity));
    return Array.from(set);
  }, [allPersons]);

  const filteredPersons = useMemo(() => {
    return allPersons.filter((p) => {
      const matchesSearch = 
        !searchTerm.trim() ||
        p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.occupation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phoneNumbers.some((ph) => ph.includes(searchTerm)) ||
        p.vehicles.some((v) => v.toLowerCase().includes(searchTerm.toLowerCase())) ||
        p.cases.some((c) => c.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesGroup = selectedGroup === 'ALL' || p.networkGroup.startsWith(selectedGroup);
      const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
      const matchesCity = selectedCity === 'ALL' || p.primaryCity === selectedCity;

      return matchesSearch && matchesGroup && matchesStatus && matchesCity;
    });
  }, [allPersons, searchTerm, selectedGroup, selectedStatus, selectedCity]);

  return (
    <div id="nexus-persons-page" className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl lg:text-2xl font-black tracking-tight text-[var(--text-primary)]">
              Persons of Interest Directory
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#0b1b11]/10 dark:bg-white/10 text-[var(--text-primary)]">
              Authorized Records
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Fictional law-enforcement dossier index with cross-case linkage and network clustering
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/network')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0b1b11] text-white hover:bg-[#10291a] dark:bg-[#0d2115] dark:text-[#D8E0E7] text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5 text-[#37ff85]" />
            <span>Open Global Relationship Graph</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div 
        className="rounded-xl border p-4 space-y-3 transition-colors"
        style={{
          backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
          borderColor: 'var(--border-main)',
        }}
      >
        <div className="flex flex-col md:flex-row gap-3">
          {/* Main search */}
          <div 
            className="relative flex-1 flex items-center rounded-lg border"
            style={{
              backgroundColor: theme === 'dark' ? 'var(--bg-main)' : 'var(--bg-card-elevated)',
              borderColor: 'var(--border-main)',
            }}
          >
            <Search className="w-4 h-4 ml-3 text-[var(--text-secondary)] shrink-0" />
            <input
              id="persons-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by name, alias, phone, vehicle, occupation or case ID..."
              className="w-full px-3 py-2 text-xs bg-transparent outline-none text-[var(--text-primary)]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mr-3 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Group Filter */}
          <select
            id="filter-network-group-select"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-3 py-2 rounded-lg border text-xs bg-transparent text-[var(--text-primary)] outline-none cursor-pointer"
            style={{ borderColor: 'var(--border-main)' }}
          >
            <option value="ALL">All Network Groups</option>
            {groups.map((g) => (
              <option key={g} value={g} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                {g}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            id="filter-status-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border text-xs bg-transparent text-[var(--text-primary)] outline-none cursor-pointer"
            style={{ borderColor: 'var(--border-main)' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="Person of Interest" className="bg-[var(--bg-card)]">Person of Interest</option>
            <option value="Subject" className="bg-[var(--bg-card)]">Subject</option>
            <option value="Associated Person" className="bg-[var(--bg-card)]">Associated Person</option>
            <option value="Reported Connection" className="bg-[var(--bg-card)]">Reported Connection</option>
          </select>

          {/* City Filter */}
          <select
            id="filter-city-select"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="px-3 py-2 rounded-lg border text-xs bg-transparent text-[var(--text-primary)] outline-none cursor-pointer"
            style={{ borderColor: 'var(--border-main)' }}
          >
            <option value="ALL">All Locations</option>
            {cities.map((city) => (
              <option key={city} value={city} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                {city}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1">
          <span>Showing {filteredPersons.length} of {allPersons.length} records</span>
          <span>Investigative Terminology: Presumption of innocence strictly observed in platform records</span>
        </div>
      </div>

      {/* Persons Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPersons.map((person) => {
          const isHighPriority = person.riskAssessment === 'Priority Attention' || person.riskAssessment === 'Cross-Case Linkage';

          return (
            <div
              key={person.id}
              className="rounded-xl border p-4 flex flex-col justify-between space-y-3 transition-all hover:shadow-md hover:border-[var(--navy-primary)] relative"
              style={{
                backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
                borderColor: 'var(--border-main)',
              }}
            >
              {/* Top Row: Avatar, ID, Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-[#0b1b11] text-[#2b5a3a] dark:bg-[#0d2115] dark:text-[#37ff85] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    {person.id.replace('PER-', '')}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[var(--text-primary)] leading-tight">
                      {person.fullName}
                    </h3>
                    <div className="text-xs text-[#76a886] dark:text-[#76a886] font-medium">
                      alias "{person.alias}"
                    </div>
                  </div>
                </div>

                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                  person.status === 'Subject'
                    ? 'bg-[#C62828]/15 text-[#C62828] dark:text-[#D86C6C]'
                    : person.status === 'Person of Interest'
                      ? 'bg-[#37ff85]/15 text-[#37ff85] dark:text-[#37ff85]'
                      : 'bg-[#76a886]/15 text-[#76a886] dark:text-[#76a886]'
                }`}>
                  {person.status}
                </span>
              </div>

              {/* Occupation & Network Group */}
              <div className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[var(--text-primary)]">{person.occupation}</span>
                  <span className="text-[11px] text-[var(--text-muted)]">{person.age} yrs • {person.gender}</span>
                </div>

                <div className="text-[11px] px-2 py-1 rounded bg-black/5 dark:bg-white/5 font-mono text-[var(--text-primary)] line-clamp-1">
                  {person.networkGroup}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-[#37ff85]" />
                  <span className="truncate">{person.primaryCity} • {person.knownLocations[0]}</span>
                </div>

                {person.vehicles.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] font-mono">
                    <Car className="w-3.5 h-3.5 shrink-0" />
                    <span>{person.vehicles[0]}</span>
                  </div>
                )}
              </div>

              {/* Associated Cases Chips */}
              <div className="pt-2 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--border-light)' }}>
                <div className="flex items-center gap-1 overflow-x-auto text-[10px]">
                  {person.cases.slice(0, 2).map((c) => (
                    <span 
                      key={c}
                      onClick={() => onNavigate('/cases', c)}
                      className="font-mono px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 hover:bg-black/10 text-[var(--text-secondary)] cursor-pointer"
                    >
                      {c}
                    </span>
                  ))}
                  {person.cases.length > 2 && (
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      +{person.cases.length - 2} more
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onNavigate('/network', person.id)}
                    className="p-1.5 rounded-lg border hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    style={{ borderColor: 'var(--border-light)' }}
                    title="View in Relationship Graph"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    id={`view-profile-btn-${person.id}`}
                    onClick={() => onNavigate('/person', person.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0b1b11] text-white hover:bg-[#10291a] dark:bg-[#0d2115] dark:text-[#D8E0E7] text-[11px] font-semibold cursor-pointer shadow-xs"
                  >
                    <span>Dossier</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
