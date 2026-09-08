import React, { useEffect, useState } from 'react';
import { DatabaseZap, ShieldCheck, RefreshCw, UploadCloud, CheckCircle2, AlertTriangle, BrainCircuit, Network, FileCheck2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dataSourceService } from '../services/dataSourceService';

export const CCTNSIngestionPage: React.FC = () => {
  const { hasClearance } = useAuth();
  const token = sessionStorage.getItem('nexus_auth_session') || '';
  const [status,setStatus]=useState<any>(null), [firs,setFirs]=useState<any[]>([]);
  const [busy,setBusy]=useState(false), [message,setMessage]=useState('');
  const [analysis,setAnalysis]=useState<any>(null), [selectedFIR,setSelectedFIR]=useState<any>(null);
  const [form,setForm]=useState({firNumber:'',policeStation:'',district:'Pune',state:'Maharashtra',incidentDate:new Date().toISOString().slice(0,10),sections:'',complainantName:'',narrative:''});

  const load=async()=>{
    const headers={Authorization:`Bearer ${token}`};
    const [sr,dr]=await Promise.all([fetch('/api/cctns/status',{headers}),fetch('/api/data/all',{headers})]);
    if(sr.ok)setStatus(await sr.json());
    if(dr.ok){const d=await dr.json();setFirs(Array.isArray(d.firs)?d.firs:[]);}
  };
  useEffect(()=>{load();},[]);

  const inspectAnalysis=async(fir:any)=>{
    setSelectedFIR(fir); setAnalysis(null); setMessage('');
    try{setAnalysis(await dataSourceService.getFIRAnalysis(token,fir.id));}
    catch{try{setAnalysis(await dataSourceService.analyzeFIR(token,fir.id));}catch(e){setMessage(e instanceof Error?e.message:'FIR analysis failed.');}}
  };

  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();setBusy(true);setMessage('');setAnalysis(null);
    try{
      const result=await dataSourceService.ingestCCTNSFIR(token,{...form,sections:form.sections.split(',').map(s=>s.trim()).filter(Boolean)});
      setMessage(`${result.duplicate?'FIR already existed':'FIR ingested'} • Case ${result.caseId} • PostgreSQL persistence, AI/NLP analysis, graph correlation and audit event completed.`);
      setForm({...form,firNumber:'',narrative:''});await load();
      if(result.analysis){setAnalysis(result.analysis);setSelectedFIR((await fetch('/api/data/all',{headers}).then(r=>r.json())).firs?.find((x:any)=>x.id===result.caseId));}
    }catch(err){setMessage(err instanceof Error?err.message:'FIR ingestion failed.');}
    finally{setBusy(false);}
  };
  const sync=async()=>{setBusy(true);setMessage('');try{const r=await fetch('/api/cctns/sync',{method:'POST',headers:{Authorization:`Bearer ${token}`}});const d=await r.json();if(!r.ok)throw new Error(d.error);setMessage(`Authorized CCTNS sync completed: ${Array.isArray(d.records)?d.records.length:0} records.`);await load();}catch(e){setMessage(e instanceof Error?e.message:'CCTNS sync failed.');}finally{setBusy(false);}};

  return <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
    <div className="flex items-center justify-between gap-4"><div><div className="flex items-center gap-2"><DatabaseZap className="w-5 h-5 text-[#37ff85]"/><h1 className="text-xl lg:text-2xl font-black text-[var(--text-primary)]">CCTNS / e-FIR Intelligence Pipeline</h1></div><p className="text-xs text-[var(--text-secondary)] mt-1">Ingestion → PostgreSQL → local NLP → graph correlation → tamper-evident audit. Demo records are synthetic.</p></div><button onClick={sync} disabled={busy||!status?.configured} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0b1b11] text-white text-xs font-semibold disabled:opacity-40"><RefreshCw className={`w-3.5 h-3.5 ${busy?'animate-spin':''}`}/> Sync latest</button></div>
    <div className="grid md:grid-cols-4 gap-3">
      {[['Connector',status?.configured?'Authorized connector':'Demo compatibility mode'],['Persistence','PostgreSQL FIR + Case'],['AI','NEXUS Local NLP v1'],['Audit','Persisted SHA-256 chain']].map(([a,b])=><div key={a} className="p-4 rounded-xl border bg-[var(--bg-card)]"><div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">{a}</div><div className="font-bold text-sm mt-1">{b}</div></div>)}
    </div>
    {message&&<div className="p-3 rounded-xl border text-xs flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#37ff85]"/>{message}</div>}
    <form onSubmit={submit} className="p-5 rounded-xl border bg-[var(--bg-card)] space-y-4"><div className="flex items-center gap-2"><UploadCloud className="w-4 h-4"/><h2 className="font-bold text-sm">Ingest authorized FIR</h2></div><div className="grid md:grid-cols-2 gap-3">{[['firNumber','FIR number'],['policeStation','Police station'],['district','District'],['state','State'],['incidentDate','Incident date'],['sections','Sections (comma separated)'],['complainantName','Complainant name']].map(([key,label])=><label key={key} className="text-xs font-semibold text-[var(--text-secondary)]">{label}<input value={(form as any)[key]} onChange={e=>setForm({...form,[key]:e.target.value})} className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm font-normal" required={key==='firNumber'||key==='policeStation'}/></label>)}</div><label className="text-xs font-semibold text-[var(--text-secondary)]">FIR narrative<textarea value={form.narrative} onChange={e=>setForm({...form,narrative:e.target.value})} required className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm font-normal min-h-32" placeholder="Paste an authorized FIR narrative or normalized CCTNS payload…"/></label><div className="flex items-center justify-between gap-3"><div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> AI output is a correlation aid, not a determination of guilt.</div><button disabled={busy||!hasClearance('L1_RESTRICTED')} className="px-4 py-2 rounded-lg bg-[#0b1b11] text-white text-xs font-bold disabled:opacity-40">{busy?'Processing…':'Ingest & Analyze FIR'}</button></div></form>

    {analysis&&<section className="p-5 rounded-xl border bg-[var(--bg-card)] space-y-4"><div className="flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-[#37ff85]"/><div><h2 className="font-bold text-sm">AI/NLP Analysis</h2><p className="text-[10px] text-[var(--text-muted)]">{analysis.model} • {selectedFIR?.firNumber||'FIR'} • human review required</p></div></div><p className="text-sm text-[var(--text-secondary)]">{analysis.summary}</p><div className="grid md:grid-cols-2 gap-3"><div className="p-3 rounded-lg border"><div className="flex items-center gap-2 font-bold text-xs"><FileCheck2 className="w-4 h-4"/> Entity matches</div>{(analysis.entities||[]).length===0?<div className="text-xs mt-2 text-[var(--text-muted)]">No existing synthetic person match detected.</div>:<div className="mt-2 space-y-1">{analysis.entities.map((e:any)=><div key={e.personId} className="text-xs flex justify-between"><span>{e.value} ({e.personId})</span><span className="font-mono">{e.confidence}%</span></div>)}</div>}</div><div className="p-3 rounded-lg border"><div className="flex items-center gap-2 font-bold text-xs"><Network className="w-4 h-4"/> Correlation signals</div>{(analysis.findings||[]).map((f:any)=><div key={f.type} className="mt-2"><div className="text-xs font-semibold">{f.title}</div><div className="text-[11px] text-[var(--text-secondary)]">{f.description}</div></div>)}</div></div></section>}

    <section className="p-5 rounded-xl border bg-[var(--bg-card)] space-y-3"><div className="flex items-center justify-between"><div><h2 className="font-bold text-sm">Recently ingested FIRs</h2><p className="text-[10px] text-[var(--text-muted)]">Persisted records. Selecting one loads its saved analysis.</p></div><span className="text-xs font-bold">{firs.length}</span></div>{firs.length===0?<div className="text-xs text-[var(--text-muted)]">No FIR records found.</div>:<div className="space-y-2">{firs.slice(0,20).map(f=><button onClick={()=>inspectAnalysis(f)} key={f.id} className="w-full text-left p-3 rounded-lg border text-xs grid md:grid-cols-5 gap-2 hover:bg-black/5 dark:hover:bg-white/5"><div><div className="text-[10px] text-[var(--text-muted)]">FIR</div><div className="font-bold">{f.firNumber}</div></div><div><div className="text-[10px] text-[var(--text-muted)]">Station</div><div>{f.policeStation||'—'}</div></div><div><div className="text-[10px] text-[var(--text-muted)]">Incident</div><div>{String(f.incidentDate||'').slice(0,10)||'—'}</div></div><div><div className="text-[10px] text-[var(--text-muted)]">Hash</div><div className="font-mono truncate">{f.payloadHash||'—'}</div></div><div className="flex items-center gap-1 font-bold text-[#37ff85]"><BrainCircuit className="w-3.5 h-3.5"/> Analyze / view</div></button>)}</div>}</section>
  </div>;
};
