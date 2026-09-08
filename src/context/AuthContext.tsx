import React, { createContext, useContext, useEffect, useState } from 'react';
import { browserSupportsWebAuthn, startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { Officer, Role, ClearanceLevel, BiometricState } from '../types';
import { dataSourceService } from '../services/dataSourceService';

interface AuthContextType {
  officer: Officer | null;
  isAuthenticated: boolean;
  clearanceLevel: ClearanceLevel | null;
  role: Role | null;
  biometricStepPending: boolean;
  pendingOfficer: Officer | null;
  biometricState: BiometricState;
  hasWebAuthn: boolean;
  hasPasskey: boolean;
  loginStep1: (officerId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  startBiometricVerification: () => Promise<void>;
  startRecoveryAuthentication: (recoveryCode: string) => Promise<void>;
  requestRecovery: () => Promise<{requestId:string; expiresAt:number}>;
  administratorBootstrap: (recoveryCode: string) => Promise<void>;
  recoveryRequestId: string | null;
  recoveryRequestStatus: string | null;
  registerPasskey: (recoveryCode: string) => Promise<void>;
  resetBiometric: () => void;
  logout: () => void;
  hasClearance: (required: ClearanceLevel) => boolean;
  hasRole: (requiredRole: Role) => boolean;
  sessionTimeRemaining: number;
}

const API = (import.meta.env.VITE_API_ORIGIN || '/api').replace(/\/$/, '');
const SESSION_KEY = 'nexus_auth_session';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toError = (e: unknown) => e instanceof Error ? e.message : 'Authentication request failed.';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [officer, setOfficer] = useState<Officer | null>(null);
  const [pendingOfficer, setPendingOfficer] = useState<Officer | null>(null);
  const [biometricStepPending, setBiometricStepPending] = useState(false);
  const [hasPasskey, setHasPasskey] = useState(false);
  const [pendingPassword, setPendingPassword] = useState('');
  const [recoveryRequestId, setRecoveryRequestId] = useState<string | null>(null);
  const [recoveryRequestStatus, setRecoveryRequestStatus] = useState<string | null>(null);
  const [hasWebAuthn, setHasWebAuthn] = useState(false);
  const [biometricState, setBiometricState] = useState<BiometricState>({ status:'idle', progress:0, confidenceScore:0 });
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(1800);

  useEffect(() => { setHasWebAuthn(browserSupportsWebAuthn()); }, []);

  useEffect(() => {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) return;
    fetch(`${API}/auth/session`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Session expired.')))
      .then(async data => { await dataSourceService.hydrateFromApi(token); setOfficer(data.officer); dataSourceService.setCurrentOfficer(data.officer); setSessionTimeRemaining(Math.max(1, Math.floor((data.expiresAt-Date.now())/1000))); })
      .catch(() => { sessionStorage.removeItem(SESSION_KEY); dataSourceService.setCurrentOfficer(null); });
  }, []);

  useEffect(() => {
    if (!officer) return;
    const timer = window.setInterval(() => setSessionTimeRemaining(v => {
      if (v <= 1) { logout(); return 1800; }
      return v-1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [officer]);

  const completeSession = async (data: any) => {
    sessionStorage.setItem(SESSION_KEY, data.token);
    await dataSourceService.hydrateFromApi(data.token);
    setOfficer(data.officer); dataSourceService.setCurrentOfficer(data.officer);
    setPendingOfficer(null); setBiometricStepPending(false); setSessionTimeRemaining(Math.max(1, Math.floor((data.expiresAt-Date.now())/1000)));
    setBiometricState({ status:'matched', progress:100, confidenceScore:100 });
  };

  const loginStep1 = async (officerId: string, password: string) => {
    try {
      const r = await fetch(`${API}/auth/password`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({officerId,password}) });
      const data = await r.json(); if (!r.ok) return {success:false,error:data.error};
      setPendingOfficer(data.officer); setPendingPassword(password); setHasPasskey(data.hasPasskey); setBiometricStepPending(true); setBiometricState({status:'idle',progress:0,confidenceScore:0});
      return {success:true};
    } catch { return {success:false,error:'Authentication service unavailable. Start the NEXUS API on port 4000.'}; }
  };

  const startBiometricVerification = async () => {
    if (!pendingOfficer) throw new Error('No authenticated officer context.');
    if (!hasWebAuthn) throw new Error('This browser or device does not support WebAuthn. Use the secure recovery method below.');
    if (!hasPasskey) throw new Error('No passkey is registered for this officer. Register this device first using the recovery code.');
    setBiometricState({status:'scanning',progress:30,confidenceScore:0});
    try {
      const r = await fetch(`${API}/auth/password`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({officerId:pendingOfficer.id,password:pendingPassword}) });
      if (!r.ok) throw new Error('Authentication challenge could not be renewed.');
      const options = await r.json();
      setBiometricState({status:'analyzing',progress:65,confidenceScore:0});
      const credential = await startAuthentication({ optionsJSON: options.authenticationOptions });
      const verify = await fetch(`${API}/auth/verify-passkey`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({officerId:pendingOfficer.id,credential})});
      const data = await verify.json(); if(!verify.ok) throw new Error(data.error || 'Passkey verification failed.');
      await completeSession(data);
    } catch (e) { setBiometricState({status:'failed',progress:100,confidenceScore:0,errorMessage:toError(e)}); }
  };

  const requestRecovery = async () => {
    if (!pendingOfficer) throw new Error('No pending officer.');
    const r=await fetch(`${API}/auth/recovery/request`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({officerId:pendingOfficer.id})});
    const data=await r.json(); if(!r.ok) throw new Error(data.error || 'Could not create recovery request.');
    setRecoveryRequestId(data.requestId); setRecoveryRequestStatus(data.status);
    return {requestId:data.requestId,expiresAt:data.expiresAt};
  };

  const administratorBootstrap = async (recoveryCode: string) => {
    if (!pendingOfficer || pendingOfficer.role !== 'system_admin') throw new Error('Administrator bootstrap recovery is only available to the isolated Security Administrator.');
    const r=await fetch(`${API}/auth/admin/bootstrap`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({officerId:pendingOfficer.id,password:pendingPassword,recoveryCode})});
    const data=await r.json(); if(!r.ok) throw new Error(data.error || 'Administrator recovery failed.'); await completeSession(data);
  };

  const startRecoveryAuthentication = async (recoveryCode: string) => {
    if (!pendingOfficer) throw new Error('No pending officer.');
    if (!recoveryRequestId) throw new Error('Request a recovery code first.');
    const r=await fetch(`${API}/auth/recovery/one-time`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({officerId:pendingOfficer.id,requestId:recoveryRequestId,recoveryCode})});
    const data=await r.json(); if(!r.ok) throw new Error(data.error || 'Recovery verification failed.'); await completeSession(data);
  };

  const registerPasskey = async (recoveryCode: string) => {
    if (!pendingOfficer) throw new Error('No pending officer.');
    if (!hasWebAuthn) throw new Error('This device does not support WebAuthn. Use recovery authentication to continue.');
    if (!recoveryRequestId) throw new Error('Request administrator approval before registering this device.');
    const rec=await fetch(`${API}/auth/recovery/one-time`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({officerId:pendingOfficer.id,requestId:recoveryRequestId,recoveryCode})});
    if(!rec.ok) { const d=await rec.json(); throw new Error(d.error || 'Recovery verification failed.'); }
    const sessionData=await rec.json();
    const opt=await fetch(`${API}/auth/register-passkey/options`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({officerId:pendingOfficer.id})});
    const options=await opt.json(); if(!opt.ok) throw new Error(options.error);
    const credential=await startRegistration({optionsJSON:options});
    const verify=await fetch(`${API}/auth/register-passkey/verify`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({officerId:pendingOfficer.id,credential})});
    const result=await verify.json(); if(!verify.ok) throw new Error(result.error || 'Passkey registration failed.');
    setHasPasskey(true);
    await completeSession(sessionData);
  };

  const resetBiometric = () => setBiometricState({status:'idle',progress:0,confidenceScore:0,errorMessage:undefined});
  const logout = () => { setRecoveryRequestId(null); setRecoveryRequestStatus(null); const token=sessionStorage.getItem(SESSION_KEY); if(token) fetch(`${API}/auth/logout`,{method:'POST',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{}); sessionStorage.removeItem(SESSION_KEY); setPendingPassword(''); setOfficer(null); dataSourceService.setCurrentOfficer(null); setPendingOfficer(null); setBiometricStepPending(false); };
  const hasClearance=(required:ClearanceLevel)=>{ if(!officer)return false; const n=(x:ClearanceLevel)=>x==='L3_TOP_SECRET'?3:x==='L2_SECRET'?2:1; return n(officer.clearanceLevel)>=n(required); };
  const hasRole=(requiredRole:Role)=>{
    if(!officer) return false;
    if(officer.role === 'system_admin') return requiredRole === 'system_admin';
    if(requiredRole === 'system_admin') return false;
    if(officer.role === 'division_command') return true;
    if(requiredRole === 'investigator') return true;
    return officer.role === requiredRole;
  };

  return <AuthContext.Provider value={{officer,isAuthenticated:!!officer,clearanceLevel:officer?.clearanceLevel||null,role:officer?.role||null,biometricStepPending,pendingOfficer,biometricState,hasWebAuthn,hasPasskey,loginStep1,startBiometricVerification,startRecoveryAuthentication,requestRecovery,recoveryRequestId,recoveryRequestStatus,administratorBootstrap,registerPasskey,resetBiometric,logout,hasClearance,hasRole,sessionTimeRemaining}}>{children}</AuthContext.Provider>;
};
export const useAuth=()=>{const c=useContext(AuthContext);if(!c)throw new Error('useAuth must be used within AuthProvider');return c;};
