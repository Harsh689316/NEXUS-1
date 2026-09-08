import React, { useEffect, useState } from 'react';
import { 
  Settings, 
  Sun, 
  Moon, 
  ShieldCheck, 
  Lock, 
  RotateCcw, 
  Info, 
  User, 
  Key, 
  CheckCircle2,
  Terminal,
  Database,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { dataSourceService } from '../services/dataSourceService';

interface SettingsPageProps {
  onOpenDisclaimer: () => void;
}


const InvestigatorProvisioningPanel: React.FC = () => {
  const { officer } = useAuth();
  const [form,setForm]=useState({name:'',id:'',badgeNumber:'',department:'Crime Investigation Unit',station:'',jurisdictionCity:'Pune',jurisdictionArea:'',jurisdictionDivision:'Pune Division',password:''});
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  if(officer?.role!=='system_admin' && officer?.role!=='division_command') return null;
  const token=sessionStorage.getItem('nexus_auth_session')||'';
  const submit=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setMessage('');try{const r=await fetch('/api/admin/investigators',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(form)});const d=await r.json();if(!r.ok)throw new Error(d.error||'Provisioning failed.');setMessage(`Account created: ${d.officer.id}. Issue the credentials through your approved secure process; the investigator can sign in and then enroll a passkey.`);setForm({...form,name:'',id:'',badgeNumber:'',station:'',jurisdictionArea:'',password:''});}catch(e){setMessage(e instanceof Error?e.message:'Provisioning failed.');}finally{setBusy(false);}};
  return <div className="rounded-2xl border p-6 space-y-4" style={{backgroundColor:'var(--bg-card)',borderColor:'var(--border-main)'}}>
    <div className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-[#37ff85]"/><div><h2 className="text-sm font-bold uppercase tracking-wider">Investigator account provisioning</h2><p className="text-xs text-[var(--text-secondary)] mt-1">Admin-controlled onboarding. New investigators do not self-register into investigation data.</p></div></div>
    {message&&<div className="p-3 rounded-lg border text-xs">{message}</div>}
    <form onSubmit={submit} className="grid md:grid-cols-2 gap-3">
      {([['name','Full name'],['id','Officer ID (optional)'],['badgeNumber','Badge number'],['department','Department'],['station','Station'],['jurisdictionCity','Jurisdiction city'],['jurisdictionArea','Jurisdiction area'],['jurisdictionDivision','Jurisdiction division'],['password','Initial password']] as const).map(([k,l])=><label key={k} className="text-xs font-semibold text-[var(--text-secondary)]">{l}<input required={['name','badgeNumber','station','password'].includes(k)} type={k==='password'?'password':'text'} minLength={k==='password'?10:undefined} value={(form as any)[k]} onChange={e=>setForm({...form,[k]:e.target.value})} className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm font-normal"/></label>)}
      <div className="md:col-span-2 flex justify-end"><button disabled={busy} className="px-4 py-2 rounded-lg bg-[#37ff85] text-[#041008] text-xs font-black disabled:opacity-40">{busy?'Provisioning…':'Create investigator account'}</button></div>
    </form>
  </div>;
};

const RecoveryAdminPanel: React.FC = () => {
  const { officer } = useAuth();
  const [requests,setRequests]=useState<any[]>([]); const [message,setMessage]=useState(''); const [busy,setBusy]=useState<string|null>(null); const [issuedCode,setIssuedCode]=useState<{id:string;code:string}|null>(null);
  const token=sessionStorage.getItem('nexus_auth_session'); const API=(import.meta.env.VITE_API_ORIGIN || '/api').replace(/\/$/, '');
  const load=async()=>{ if(!token)return; const r=await fetch(`${API}/admin/recovery-requests`,{headers:{Authorization:`Bearer ${token}`}}); if(r.ok){const d=await r.json();setRequests(d.requests||[]);} };
  useEffect(()=>{ if(officer?.role!=='system_admin')return; load(); const t=window.setInterval(load,3000); return()=>clearInterval(t); },[officer?.role]);
  if(officer?.role!=='system_admin') return null;
  const act=async(id:string, action:'approve'|'deny')=>{setBusy(id);setMessage('');setIssuedCode(null);try{const r=await fetch(`${API}/admin/recovery-requests/${id}/${action}`,{method:'POST',headers:{Authorization:`Bearer ${token}`}});const d=await r.json();if(!r.ok)throw new Error(d.error||'Operation failed.');if(d.recoveryCode)setIssuedCode({id,code:d.recoveryCode});setMessage(action==='approve'?(d.delivery?.delivered?'One-time code delivered to the verified recovery email.':'Email delivery is not configured. Communicate the displayed one-time code only through an approved secure channel.'):'Recovery request denied.');await load();}catch(e){setMessage(e instanceof Error?e.message:'Operation failed.');}finally{setBusy(null);}};
  return <div className="rounded-2xl border p-6 space-y-4" style={{backgroundColor:'var(--bg-card)',borderColor:'var(--border-main)'}}>
    <div><h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">Authentication Recovery Authority</h2><p className="text-xs text-[var(--text-secondary)] mt-1">Approve remote, one-time recovery requests. This authority does not grant investigation-data access.</p></div>
    {message&&<div className="p-3 rounded-xl border border-[#37ff85]/30 bg-[#37ff85]/5 text-xs text-[#9ff0b8]">{message}</div>}
    {issuedCode&&<div className="p-4 rounded-xl border border-[#37ff85]/40 bg-[#07150c]"><div className="text-[10px] uppercase tracking-wider text-[#668171]">One-time code for request {issuedCode.id}</div><div className="mt-2 font-mono text-2xl tracking-[.25em] text-[#37ff85]">{issuedCode.code}</div><div className="mt-2 text-[10px] text-[#8aa093]">Only displayed because email delivery is not configured. It expires in 5 minutes and is single-use.</div></div>}
    {requests.length===0?<div className="p-5 rounded-xl border border-dashed text-xs text-[var(--text-secondary)] text-center">No pending recovery requests.</div>:<div className="space-y-3">{requests.map(r=><div key={r.id} className="p-4 rounded-xl border" style={{borderColor:'var(--border-main)'}}><div className="flex flex-wrap items-start gap-3"><div className="flex-1"><div className="font-bold text-sm text-[var(--text-primary)]">{r.officer?.name}</div><div className="text-[11px] text-[var(--text-secondary)]">{r.officer?.rank} • {r.officer?.id}</div><div className="mt-1 font-mono text-[10px] text-[#668171]">{r.id}</div></div><div className="text-[10px] text-[#668171]">Expires {new Date(r.expiresAt).toLocaleTimeString()}</div></div><div className="mt-3 flex gap-2"><button disabled={!!busy} onClick={()=>act(r.id,'approve')} className="px-3 py-2 rounded-lg bg-[#37ff85] text-[#041008] text-xs font-black">{busy===r.id?'PROCESSING…':'APPROVE & ISSUE CODE'}</button><button disabled={!!busy} onClick={()=>act(r.id,'deny')} className="px-3 py-2 rounded-lg border border-red-500/30 text-red-300 text-xs font-bold">DENY</button></div></div>)}</div>}
  </div>;
};

export const SettingsPage: React.FC<SettingsPageProps> = ({ onOpenDisclaimer }) => {
  const { officer, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleResetDemoData = () => {
    dataSourceService.resetAuditChain();
    window.location.reload();
  };

  return (
    <div id="nexus-settings-page" className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl lg:text-2xl font-black tracking-tight text-[var(--text-primary)]">
            System Preferences & Security Settings
          </h1>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#0b1b11]/10 dark:bg-white/10 text-[var(--text-primary)]">
            Configuration
          </span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Investigative console appearance, cryptographic audit settings, and officer session status
        </p>
      </div>

      <InvestigatorProvisioningPanel />
      <RecoveryAdminPanel />

      {/* Appearance Section */}
      <div 
        className="rounded-2xl border p-6 space-y-4"
        style={{
          backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
          borderColor: 'var(--border-main)',
        }}
      >
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Interface Appearance & Theme
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Switch between light tactical console and low-light operations theme
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              theme === 'light'
                ? 'border-[#0b1b11] bg-[#0b1b11]/5 font-bold'
                : 'hover:bg-black/5'
            }`}
            style={{ borderColor: theme === 'light' ? 'var(--navy-primary)' : 'var(--border-main)' }}
          >
            <div className="flex items-center gap-3">
              <Sun className="w-5 h-5 text-[#37ff85]" />
              <div>
                <div className="text-xs font-bold text-[var(--text-primary)]">Light Tactical Theme</div>
                <div className="text-[11px] text-[var(--text-secondary)]">High contrast for brightly-lit offices</div>
              </div>
            </div>
            {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-[#0b1b11]" />}
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-[#37ff85] bg-white/5 font-bold'
                : 'hover:bg-black/5'
            }`}
            style={{ borderColor: theme === 'dark' ? '#37ff85' : 'var(--border-main)' }}
          >
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-[#76a886]" />
              <div>
                <div className="text-xs font-bold text-[var(--text-primary)]">Dark Command Theme</div>
                <div className="text-[11px] text-[var(--text-secondary)]">Night operations, reduces eye fatigue</div>
              </div>
            </div>
            {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-[#37ff85]" />}
          </button>
        </div>
      </div>

      {/* Security & Officer Profile Section */}
      <div 
        className="rounded-2xl border p-6 space-y-4"
        style={{
          backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
          borderColor: 'var(--border-main)',
        }}
      >
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Active Officer Session Credentials
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Cryptographically authenticated session token and clearance level
          </p>
        </div>

        {officer && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl border space-y-1" style={{ borderColor: 'var(--border-light)' }}>
              <span className="text-[var(--text-muted)] text-[10px] uppercase font-bold">Officer Name</span>
              <div className="font-bold text-sm text-[var(--text-primary)]">{officer.name}</div>
              <div className="text-[11px] text-[var(--text-secondary)]">{officer.id} • {officer.badgeNumber}</div>
            </div>

            <div className="p-3.5 rounded-xl border space-y-1" style={{ borderColor: 'var(--border-light)' }}>
              <span className="text-[var(--text-muted)] text-[10px] uppercase font-bold">Role & Clearance</span>
              <div className="font-bold text-sm text-[#76a886] dark:text-[#76a886]">{officer.role}</div>
              <div className="text-[11px] font-mono text-[var(--text-secondary)]">Clearance: {officer.clearanceLevel}</div>
            </div>

            <div className="p-3.5 rounded-xl border space-y-1" style={{ borderColor: 'var(--border-light)' }}>
              <span className="text-[var(--text-muted)] text-[10px] uppercase font-bold">Department</span>
              <div className="font-semibold text-xs text-[var(--text-primary)]">{officer.department}</div>
              <div className="text-[11px] text-[var(--text-secondary)]">CID Headquarters, Police Bhavan</div>
            </div>

            <div className="p-3.5 rounded-xl border space-y-1" style={{ borderColor: 'var(--border-light)' }}>
              <span className="text-[var(--text-muted)] text-[10px] uppercase font-bold">MFA Verification</span>
              <div className="font-semibold text-xs text-[#37ff85] dark:text-[#37ff85]">Biometric Match Verified</div>
              <div className="text-[10px] font-mono text-[var(--text-muted)]">Token: server-issued-session-token</div>
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-[#C62828] text-white text-xs font-semibold hover:bg-[#B71C1C] transition-colors cursor-pointer"
          >
            Terminate Session & Logout
          </button>
        </div>
      </div>

      {/* System Administration */}
      <div 
        className="rounded-2xl border p-6 space-y-4"
        style={{
          backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
          borderColor: 'var(--border-main)',
        }}
      >
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
            System Maintenance & Data Reset
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Review platform compliance terms or restore initial application state
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenDisclaimer}
            className="px-3.5 py-2 rounded-lg border text-xs font-semibold text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            style={{ borderColor: 'var(--border-main)' }}
          >
            View platform architecture & Compliance Terms
          </button>

          <button
            onClick={handleResetDemoData}
            className="px-3.5 py-2 rounded-lg border text-xs font-semibold text-[#C62828] hover:bg-[#C62828]/10 transition-colors cursor-pointer flex items-center gap-1.5"
            style={{ borderColor: 'var(--border-main)' }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Initial Dataset State</span>
          </button>
        </div>
      </div>
    </div>
  );
};
