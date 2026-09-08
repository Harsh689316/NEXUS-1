import React, { useEffect, useState } from 'react';
import { ShieldCheck, RefreshCw, AlertTriangle, CheckCircle2, Database } from 'lucide-react';
import { dataSourceService } from '../services/dataSourceService';

export const AuditTrailPage: React.FC = () => {
  const token=sessionStorage.getItem('nexus_auth_session')||'';
  const [records,setRecords]=useState<any[]>([]);
  const [verification,setVerification]=useState<any>(null);
  const [busy,setBusy]=useState(false);
  const load=async()=>{setBusy(true);try{setRecords(await dataSourceService.fetchServerAudit(token));setVerification(await dataSourceService.verifyServerAudit(token));}finally{setBusy(false);}};
  useEffect(()=>{load();},[]);
  return <div id="nexus-audit-trail-page" className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
    <div className="flex items-center justify-between"><div><h1 className="text-xl lg:text-2xl font-black">Audit Trail & Chain Integrity</h1><p className="text-xs text-[var(--text-secondary)] mt-1">Server-persisted operational events with a SHA-256 hash chain. This is an integrity ledger, not a public blockchain.</p></div><div className="flex gap-2"><button onClick={load} disabled={busy} className="px-3 py-2 rounded-lg border text-xs font-bold"><RefreshCw className={`w-3.5 h-3.5 inline mr-1 ${busy?'animate-spin':''}`}/>Refresh</button></div></div>
    {verification&&<div className={`p-4 rounded-xl border flex items-center gap-3 ${verification.verified?'border-[#37ff85]/30':'border-red-500/30'}`}>{verification.verified?<CheckCircle2 className="w-5 h-5 text-[#37ff85]"/>:<AlertTriangle className="w-5 h-5 text-red-400"/>}<div><div className="font-bold text-sm">{verification.verified?'Integrity verified':'Integrity check failed'}</div><div className="text-xs text-[var(--text-secondary)]">{verification.message}</div></div></div>}
    <div className="rounded-xl border bg-[var(--bg-card)] overflow-hidden"><div className="p-4 border-b flex items-center gap-2"><Database className="w-4 h-4"/><span className="font-bold text-sm">Persisted events</span><span className="text-[10px] text-[var(--text-muted)]">{records.length} visible records</span></div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b text-[10px] uppercase text-[var(--text-muted)]"><th className="p-3">Block</th><th className="p-3">Time</th><th className="p-3">Officer</th><th className="p-3">Action</th><th className="p-3">Resource</th><th className="p-3">Details</th><th className="p-3">Hash</th></tr></thead><tbody>{records.map(r=><tr key={r.actionId} className="border-b last:border-0"><td className="p-3 font-mono">{r.blockIndex}</td><td className="p-3 whitespace-nowrap">{new Date(r.timestamp).toLocaleString()}</td><td className="p-3">{r.officerId}<div className="text-[10px] text-[var(--text-muted)]">{r.officerName}</div></td><td className="p-3 font-semibold">{r.action}</td><td className="p-3 font-mono">{r.resource}</td><td className="p-3 max-w-md truncate" title={r.details}>{r.details}</td><td className="p-3 font-mono max-w-[180px] truncate" title={r.currentHash}>{r.currentHash}</td></tr>)}</tbody></table></div>{records.length===0&&<div className="p-8 text-center text-xs text-[var(--text-muted)]">No persisted audit events are visible for this investigator.</div>}</div>
  </div>;
};
