import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart as PieIcon, 
  ShieldAlert, 
  Layers, 
  Activity,
  FileText,
  MapPin
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const AnalyticsPage: React.FC = () => {
  const { theme } = useTheme();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Data sets
  const casesOverTime = [
    { month: 'Oct 2023', activeCases: 4, newTips: 8 },
    { month: 'Nov 2023', activeCases: 7, newTips: 12 },
    { month: 'Dec 2023', activeCases: 9, newTips: 15 },
    { month: 'Jan 2024', activeCases: 11, newTips: 18 },
    { month: 'Feb 2024', activeCases: 13, newTips: 21 },
    { month: 'Mar 2024', activeCases: 15, newTips: 24 },
  ];

  const casesByCategory = [
    { name: 'Hawala & Financial', count: 6, volumeCr: 24.5, color: '#37ff85' },
    { name: 'Narcotics Supply', count: 4, volumeCr: 12.0, color: '#76a886' },
    { name: 'Arms & Weapons', count: 3, volumeCr: 6.8, color: '#1565C0' },
    { name: 'Cyber & Extortion', count: 2, volumeCr: 4.2, color: '#7B1FA2' },
  ];

  const clusterDistribution = [
    { group: 'Net A (Hawala)', nodes: 15, edges: 24 },
    { group: 'Net B (Narcotics)', nodes: 12, edges: 18 },
    { group: 'Net C (Arms)', nodes: 11, edges: 16 },
    { group: 'Net D (Cyber)', nodes: 7, edges: 10 },
    { group: 'Bridge Connectors', nodes: 5, edges: 12 },
  ];

  const tipStatusData = [
    { name: 'New Leads', value: 4, color: '#C62828', percent: 33 },
    { name: 'Under Review', value: 4, color: '#37ff85', percent: 33 },
    { name: 'Linked to Cases', value: 3, color: '#37ff85', percent: 25 },
    { name: 'Resolved', value: 1, color: '#76a886', percent: 9 },
  ];

  const maxExposure = Math.max(...casesByCategory.map((c) => c.volumeCr));
  const maxNodes = Math.max(...clusterDistribution.map((c) => c.nodes));

  return (
    <div id="nexus-analytics-page" className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl lg:text-2xl font-black tracking-tight text-[var(--text-primary)]">
              Intelligence Analytics & Syndicate Topology
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#0b1b11]/10 dark:bg-white/10 text-[var(--text-primary)]">
              Real-Time Metrics
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Aggregate distributions across financial exposure, cluster topological densities, and informant intake velocity
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div 
            className="px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold text-[var(--text-secondary)]"
            style={{
              backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
              borderColor: 'var(--border-main)',
            }}
          >
            Total Financial Exposure: ₹47.5 Cr
          </div>
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          className="rounded-xl border p-4 space-y-1"
          style={{
            backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
            borderColor: 'var(--border-main)',
          }}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Active Dockets</span>
          <div className="text-2xl font-black text-[var(--text-primary)]">15</div>
          <span className="text-[11px] text-[#37ff85] dark:text-[#37ff85] font-semibold">+3 opened this quarter</span>
        </div>

        <div 
          className="rounded-xl border p-4 space-y-1"
          style={{
            backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
            borderColor: 'var(--border-main)',
          }}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Mapped Entities</span>
          <div className="text-2xl font-black text-[var(--text-primary)]">50</div>
          <span className="text-[11px] text-[#37ff85] dark:text-[#37ff85] font-semibold">184 relational edges</span>
        </div>

        <div 
          className="rounded-xl border p-4 space-y-1"
          style={{
            backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
            borderColor: 'var(--border-main)',
          }}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Cluster Networks</span>
          <div className="text-2xl font-black text-[var(--text-primary)]">4 + Bridge</div>
          <span className="text-[11px] text-[#76a886] dark:text-[#76a886] font-semibold">Cross-syndicate brokers identified</span>
        </div>

        <div 
          className="rounded-xl border p-4 space-y-1"
          style={{
            backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
            borderColor: 'var(--border-main)',
          }}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Informant Leads</span>
          <div className="text-2xl font-black text-[var(--text-primary)]">12</div>
          <span className="text-[11px] text-[#C62828] dark:text-[#D86C6C] font-semibold">4 requiring verification</span>
        </div>
      </div>

      {/* Primary Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual 1: Financial Exposure by Syndicate Category (Interactive SVG Bar Chart) */}
        <div 
          className="rounded-2xl border p-5 space-y-4"
          style={{
            backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
            borderColor: 'var(--border-main)',
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-[#37ff85]" />
              <span>Financial Exposure by Crime Category</span>
            </h2>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">₹ Crores</span>
          </div>

          <div className="space-y-3.5 pt-2">
            {casesByCategory.map((cat) => {
              const widthPct = Math.round((cat.volumeCr / maxExposure) * 100);
              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[var(--text-primary)]">{cat.name}</span>
                    <span className="font-mono text-[#37ff85] dark:text-[#37ff85]">
                      ₹{cat.volumeCr.toFixed(1)} Cr ({cat.count} cases)
                    </span>
                  </div>
                  <div className="h-3 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${widthPct}%`,
                        backgroundColor: cat.color 
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Visual 2: Informant Lead Status Breakdown (Interactive Donut & Stats) */}
        <div 
          className="rounded-2xl border p-5 space-y-4"
          style={{
            backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
            borderColor: 'var(--border-main)',
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-[#76a886]" />
              <span>Intelligence Tip Disposition</span>
            </h2>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">12 Leads Total</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
            {/* SVG Donut Visual */}
            <div className="flex items-center justify-center relative">
              <svg viewBox="0 0 160 160" className="w-36 h-36">
                <circle cx="80" cy="80" r="55" fill="transparent" stroke={theme === 'dark' ? '#2F4356' : '#E2E8F0'} strokeWidth="18" />
                {/* 4 Segments */}
                <circle
                  cx="80" cy="80" r="55" fill="transparent"
                  stroke="#C62828" strokeWidth="18"
                  strokeDasharray="114 345" strokeDashoffset="0"
                />
                <circle
                  cx="80" cy="80" r="55" fill="transparent"
                  stroke="#37ff85" strokeWidth="18"
                  strokeDasharray="114 345" strokeDashoffset="-114"
                />
                <circle
                  cx="80" cy="80" r="55" fill="transparent"
                  stroke="#37ff85" strokeWidth="18"
                  strokeDasharray="86 345" strokeDashoffset="-228"
                />
                <circle
                  cx="80" cy="80" r="55" fill="transparent"
                  stroke="#76a886" strokeWidth="18"
                  strokeDasharray="31 345" strokeDashoffset="-314"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-black text-[var(--text-primary)]">12</span>
                <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Leads</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2 text-xs">
              {tipStatusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-1.5 rounded-lg border" style={{ borderColor: 'var(--border-light)' }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[var(--text-primary)] font-medium">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-[var(--text-secondary)]">
                    {item.value} ({item.percent}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Visual 3: Topological Cluster Density */}
        <div 
          className="rounded-2xl border p-5 space-y-4"
          style={{
            backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
            borderColor: 'var(--border-main)',
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#1565C0]" />
              <span>Syndicate Cluster Entity Density</span>
            </h2>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">Nodes vs Edges</span>
          </div>

          <div className="space-y-3 pt-2">
            {clusterDistribution.map((item) => (
              <div key={item.group} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[var(--text-primary)]">{item.group}</span>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-[#76a886] dark:text-[#76a886] font-semibold">{item.nodes} Persons</span>
                    <span className="text-[#37ff85] dark:text-[#37ff85] font-semibold">{item.edges} Connections</span>
                  </div>
                </div>

                <div className="flex h-2.5 gap-1 rounded-full overflow-hidden bg-black/5 dark:bg-white/10">
                  <div 
                    className="h-full bg-[#76a886] rounded-full" 
                    style={{ width: `${(item.nodes / 20) * 50}%` }} 
                    title={`${item.nodes} Nodes`}
                  />
                  <div 
                    className="h-full bg-[#37ff85] rounded-full" 
                    style={{ width: `${(item.edges / 30) * 50}%` }} 
                    title={`${item.edges} Edges`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visual 4: 6-Month Investigative Trajectory (SVG Timeline Area) */}
        <div 
          className="rounded-2xl border p-5 space-y-4"
          style={{
            backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
            borderColor: 'var(--border-main)',
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#37ff85]" />
              <span>Investigative Caseload Trajectory</span>
            </h2>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">Monthly Progression</span>
          </div>

          <div className="h-44 w-full flex flex-col justify-end pt-2">
            <div className="flex items-end justify-between h-32 w-full gap-2 border-b" style={{ borderColor: 'var(--border-main)' }}>
              {casesOverTime.map((pt) => {
                const caseHeight = (pt.activeCases / 16) * 100;
                const tipHeight = (pt.newTips / 26) * 100;

                return (
                  <div key={pt.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                    {/* Tooltip on hover */}
                    <div className="hidden group-hover:block absolute -top-8 px-2 py-1 rounded bg-[#0b1b11] text-white text-[9px] font-mono whitespace-nowrap z-10">
                      {pt.activeCases} Cases • {pt.newTips} Tips
                    </div>

                    <div className="w-full flex justify-center items-end gap-1 h-full">
                      <div 
                        className="w-2.5 sm:w-4 rounded-t-sm bg-[#37ff85] transition-all"
                        style={{ height: `${caseHeight}%` }}
                        title={`${pt.activeCases} Cases`}
                      />
                      <div 
                        className="w-2.5 sm:w-4 rounded-t-sm bg-[#76a886] transition-all"
                        style={{ height: `${tipHeight}%` }}
                        title={`${pt.newTips} Tips`}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-[var(--text-muted)] truncate w-full text-center">
                      {pt.month.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-6 pt-3 text-[11px] font-medium text-[var(--text-secondary)]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#37ff85]" />
                <span>Active Dockets</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#76a886]" />
                <span>Informant Leads Intake</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
