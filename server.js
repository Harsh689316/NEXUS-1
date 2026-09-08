import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server';
import { getAllData, createFIR, health as dataHealth, ensureDemoData } from './server/db.js';
import { CCTNSAdapter } from './server/integrations/cctnsAdapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
const RP_ID = process.env.RP_ID || 'localhost';
const RP_NAME = 'NEXUS Investigation Intelligence Platform';
const DATA_DIR = path.join(__dirname, '.nexus-auth');
const PASSKEY_FILE = path.join(DATA_DIR, 'passkeys.json');
fs.mkdirSync(DATA_DIR, { recursive: true });

const OFFICERS = [
  {id:'NEXUS-ADMIN-01',name:'NEXUS Security Administrator',rank:'System Administrator',role:'system_admin',clearanceLevel:'L2_SECRET',department:'NEXUS Security Operations',station:'NEXUS Control Center',accessScope:'area',jurisdictionArea:'SYSTEM'},
  {id:'INS-1042',name:'Insp. Vikram Deshmukh',rank:'Inspector',role:'investigator',clearanceLevel:'L1_RESTRICTED',department:'Crime Branch Unit IV',station:'Shivajinagar Police Station, Pune',accessScope:'area',jurisdictionArea:'Shivajinagar',jurisdictionCity:'Pune',jurisdictionDivision:'Pune Division'},
  {id:'SI-2087',name:'SI Ananya Roy',rank:'Sub-Inspector',role:'senior_investigator',clearanceLevel:'L2_SECRET',department:'Special Organized Crime Cell',station:'Central Investigation HQ, Mumbai',accessScope:'city',jurisdictionCity:'Mumbai',jurisdictionDivision:'Mumbai Division'},
  {id:'ACP-4022',name:'ACP Arvind Rao',rank:'Assistant Commissioner of Police',role:'senior_investigator',clearanceLevel:'L2_SECRET',department:'Crime Branch',station:'Pune City Police Commissionerate',accessScope:'city',jurisdictionCity:'Pune',jurisdictionDivision:'Pune Division'},
  {id:'SP-5027',name:'SP Neha Kulkarni',rank:'Superintendent of Police',role:'senior_investigator',clearanceLevel:'L2_SECRET',department:'District Crime Branch',station:'Pune District Headquarters',accessScope:'city',jurisdictionCity:'Pune',jurisdictionDivision:'Pune Division'},
  {id:'DCP-6033',name:'DCP Sameer Patil',rank:'Deputy Commissioner of Police',role:'senior_investigator',clearanceLevel:'L2_SECRET',department:'Urban Crime Division',station:'Mumbai Police Headquarters',accessScope:'city',jurisdictionCity:'Mumbai',jurisdictionDivision:'Mumbai Division'},
  {id:'DIG-7044',name:'DIG Rohan Mehta, IPS',rank:'Deputy Inspector General of Police',role:'division_command',clearanceLevel:'L3_TOP_SECRET',department:'State Intelligence Directorate',station:'Maharashtra Police Headquarters',accessScope:'division',jurisdictionDivision:'Maharashtra Division'},
  {id:'IG-8055',name:'IG Kavita Menon, IPS',rank:'Inspector General of Police',role:'division_command',clearanceLevel:'L3_TOP_SECRET',department:'State Crime & Intelligence Wing',station:'Maharashtra Police Headquarters',accessScope:'division',jurisdictionDivision:'Maharashtra Division'},
  {id:'ADG-9066',name:'ADG Suresh Nair, IPS',rank:'Additional Director General of Police',role:'division_command',clearanceLevel:'L3_TOP_SECRET',department:'State Intelligence Directorate',station:'Maharashtra Police Headquarters',accessScope:'division',jurisdictionDivision:'Maharashtra Division'},
  {id:'DGP-1007',name:'DGP Priya Sharma, IPS',rank:'Director General of Police',role:'division_command',clearanceLevel:'L3_TOP_SECRET',department:'State Police Headquarters',station:'Maharashtra Police Headquarters',accessScope:'division',jurisdictionDivision:'Maharashtra Division'},
];

const credentialEnvKey = (prefix, officerId) => `${prefix}_${officerId.replace(/[^A-Za-z0-9]/g, '_')}`;
const officerPassword = officerId => process.env[credentialEnvKey('NEXUS', officerId) + '_PASSWORD'] || '';
const officerRecoveryCode = officerId => process.env[credentialEnvKey('NEXUS', officerId) + '_RECOVERY_CODE'] || '';
const requiredCredentialKeys = OFFICERS.flatMap(o => [credentialEnvKey('NEXUS', o.id) + '_PASSWORD', credentialEnvKey('NEXUS', o.id) + '_RECOVERY_CODE']);
const missingCredentialKeys = requiredCredentialKeys.filter(key => !process.env[key]);
if (missingCredentialKeys.length) throw new Error(`Missing required NEXUS authentication environment variables: ${missingCredentialKeys.join(', ')}`);

const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const readStore = () => { try { return JSON.parse(fs.readFileSync(PASSKEY_FILE, 'utf8')); } catch { return {}; } };
const writeStore = store => fs.writeFileSync(PASSKEY_FILE, JSON.stringify(store, null, 2));
const passkeys = readStore();
const pending = new Map();
const sessions = new Map();
const recoveryRequests = new Map();
const recoveryAttempts = new Map();

const RECOVERY_TTL_MS = 5 * 60 * 1000;
const MAX_RECOVERY_ATTEMPTS = 5;
const recoveryHash = value => crypto.createHash('sha256').update(String(value)).digest('hex');
const randomRecoveryCode = () => crypto.randomInt(10000000, 100000000).toString();
const adminOfficer = id => officerById(id)?.role === 'system_admin';
const recoveryEmailFor = officerId => process.env[`RECOVERY_EMAIL_${officerId.replace(/[^A-Za-z0-9]/g,'_')}`] || '';

async function deliverRecoveryEmail(officer, code, requestId) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = recoveryEmailFor(officer.id);
  const from = process.env.RECOVERY_FROM_EMAIL || '';
  if (!apiKey || !to || !from) return { delivered:false, reason:'Email delivery is not configured.' };
  const response = await fetch('https://api.resend.com/emails', {
    method:'POST', headers:{ Authorization:`Bearer ${apiKey}`, 'Content-Type':'application/json' },
    body:JSON.stringify({ from, to:[to], subject:'NEXUS authentication recovery code', text:`NEXUS authentication recovery\n\nOfficer: ${officer.name} (${officer.id})\nOne-time authorization code: ${code}\nExpires in 5 minutes.\nRequest: ${requestId}\n\nIf you did not request this, contact NEXUS Security Operations immediately.` })
  });
  if (!response.ok) { const body=await response.text(); return { delivered:false, reason:`Email provider rejected the message (${response.status}). ${body.slice(0,180)}` }; }
  return { delivered:true, destination:to.replace(/^(.{2}).*(@.*)$/,'$1••••$2') };
}

const auditRecovery = event => {
  const file=path.join(DATA_DIR,'recovery-audit.jsonl');
  fs.appendFileSync(file, JSON.stringify({ timestamp:new Date().toISOString(), ...event })+'\n');
};

const publicOfficer = o => ({ id:o.id,name:o.name,rank:o.rank,role:o.role,clearanceLevel:o.clearanceLevel,department:o.department,station:o.station,accessScope:o.accessScope,jurisdictionArea:o.jurisdictionArea,jurisdictionCity:o.jurisdictionCity,jurisdictionDivision:o.jurisdictionDivision,avatarInitials:o.name.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase() });
const officerById = id => OFFICERS.find(o => o.id.toLowerCase() === String(id || '').trim().toLowerCase());
const session = (officer, method) => {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = Date.now() + 30 * 60 * 1000;
  sessions.set(token, { officerId: officer.id, expiresAt, method });
  return { token, expiresAt, officer: publicOfficer(officer), method };
};
const requirePending = (req,res) => {
  const state = pending.get(req.body?.officerId);
  if (!state || state.expiresAt < Date.now()) { res.status(400).json({ error:'Authentication challenge expired. Start again.' }); return null; }
  return state;
};

app.disable('x-powered-by');
app.use(express.json({ limit: '512kb' }));

const requireSession = (req,res) => {
  const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  const s=sessions.get(token);
  if(!s || s.expiresAt<Date.now()) { res.status(401).json({error:'Authenticated investigator session required.'}); return null; }
  const officer=officerById(s.officerId);
  if(!officer) { res.status(401).json({error:'Officer account unavailable.'}); return null; }
  return { ...s, officer };
};
const canSee = (officer, item) => {
  if (officer.role==='system_admin' || officer.accessScope==='division') return true;
  if (officer.accessScope==='city') return item.jurisdictionCity===officer.jurisdictionCity || item.jurisdictionDivision===officer.jurisdictionDivision;
  return item.jurisdictionArea===officer.jurisdictionArea && item.jurisdictionCity===officer.jurisdictionCity;
};
const filterDataForOfficer = (data, officer) => {
  const persons=data.persons.filter(p=>canSee(officer,p));
  const ids=new Set(persons.map(p=>p.id));
  const cases=data.cases.filter(c=>canSee(officer,c));
  const caseIds=new Set(cases.map(c=>c.id));
  const relationships=data.relationships.filter(r=>ids.has(r.sourceId)&&ids.has(r.targetId));
  const transactions=data.transactions.filter(t=>(!t.senderId||ids.has(t.senderId))&&(!t.receiverId||ids.has(t.receiverId)));
  return { ...data, persons, cases, relationships, transactions };
};

app.use((req,res,next) => { res.setHeader('Access-Control-Allow-Origin', FRONTEND_ORIGIN); res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization'); res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS'); if(req.method==='OPTIONS') return res.sendStatus(204); next(); });

app.get('/api/health', async (_req,res) => res.json({ status:'ok', service:'NEXUS Secure API', port:PORT, data:await dataHealth() }));
app.get('/api/config', (_req,res) => res.json({ frontendOrigin:FRONTEND_ORIGIN, apiOrigin:`http://localhost:${PORT}`, rpId:RP_ID, rpName:RP_NAME }));

app.post('/api/auth/password', async (req,res) => {
  const officer = officerById(req.body?.officerId);
  if (!officer || hash(String(req.body?.password || '')) !== hash(officerPassword(officer.id))) return res.status(401).json({ error:'Officer ID or password is incorrect.' });
  const userPasskeys = passkeys[officer.id] || [];
  const authOptions = await generateAuthenticationOptions({ rpID:RP_ID, allowCredentials:userPasskeys.map(k=>({ id:k.id, transports:k.transports })), userVerification:'preferred' });
  pending.set(officer.id, { officerId:officer.id, challenge:authOptions.challenge, authOptions, expiresAt:Date.now()+2*60*1000 });
  res.json({ officer:publicOfficer(officer), hasPasskey:userPasskeys.length>0, authenticationOptions:authOptions });
});

// Local development bootstrap for the isolated Security Administrator.
// Disable this path in production by setting NODE_ENV=production unless explicitly enabled.
app.post('/api/auth/admin/bootstrap', (req,res) => {
  const officer = officerById(req.body?.officerId);
  const enabled = process.env.NODE_ENV !== 'production' || process.env.ALLOW_LOCAL_ADMIN_BOOTSTRAP_RECOVERY === 'true';
  if (!enabled) return res.status(404).json({error:'Administrator bootstrap recovery is disabled.'});
  if (!officer || officer.role !== 'system_admin' || hash(String(req.body?.password || '')) !== hash(officerPassword(officer.id)) || String(req.body?.recoveryCode || '').trim() !== officerRecoveryCode(officer.id)) {
    return res.status(401).json({error:'Administrator credentials or recovery code are invalid.'});
  }
  auditRecovery({event:'ADMIN_BOOTSTRAP_RECOVERY_USED',officerId:officer.id});
  res.json({...session(officer,'Administrator Bootstrap Recovery')});
});

app.post('/api/auth/verify-passkey', async (req,res) => {
  const state = requirePending(req,res); if (!state) return;
  const officer = officerById(state.officerId); const stored = (passkeys[officer.id] || []).find(k => k.id === req.body?.credential?.id || k.id === req.body?.id);
  if (!stored) return res.status(401).json({ error:'This passkey is not registered for the officer.' });
  try {
    const verification = await verifyAuthenticationResponse({ response:req.body.credential, expectedChallenge:state.challenge, expectedOrigin:FRONTEND_ORIGIN, expectedRPID:RP_ID, credential:{ id:stored.id, publicKey:Buffer.from(stored.publicKey,'base64'), counter:stored.counter, transports:stored.transports } });
    if (!verification.verified) return res.status(401).json({ error:'Passkey verification failed.' });
    stored.counter = verification.authenticationInfo.newCounter;
    writeStore(passkeys); pending.delete(officer.id);
    res.json({ ...session(officer,'WebAuthn / Passkey') });
  } catch (e) { res.status(401).json({ error:e instanceof Error ? e.message : 'Passkey verification failed.' }); }
});

app.post('/api/auth/recovery/request', async (req,res) => {
  const officer = officerById(req.body?.officerId);
  const authState = pending.get(officer?.id);
  if (!officer || !authState || authState.expiresAt < Date.now()) return res.status(401).json({ error:'Password verification is required before requesting recovery.' });
  const existing = [...recoveryRequests.values()].find(x => x.officerId === officer.id && x.status === 'PENDING' && x.expiresAt > Date.now());
  if (existing) return res.json({ requestId:existing.id, status:'PENDING', expiresAt:existing.expiresAt, delivery:existing.delivery || { delivered:false } });
  const id = `REC-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  const request = { id, officerId:officer.id, status:'PENDING', createdAt:Date.now(), expiresAt:Date.now()+RECOVERY_TTL_MS, attempts:0, codeHash:null, delivery:null };
  recoveryRequests.set(id, request);
  auditRecovery({ event:'RECOVERY_REQUESTED', requestId:id, officerId:officer.id });
  res.json({ requestId:id, status:'PENDING', expiresAt:request.expiresAt });
});

app.get('/api/admin/recovery-requests', (req,res) => {
  const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  const s=sessions.get(token); if(!s || s.expiresAt<Date.now() || !adminOfficer(s.officerId)) return res.status(403).json({error:'System administrator authorization required.'});
  const items=[...recoveryRequests.values()].filter(x=>x.status==='PENDING' && x.expiresAt>Date.now()).map(x=>({ ...x, officer:publicOfficer(officerById(x.officerId)), codeHash:undefined }));
  res.json({ requests:items });
});

app.post('/api/admin/recovery-requests/:id/approve', async (req,res) => {
  const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  const s=sessions.get(token); if(!s || s.expiresAt<Date.now() || !adminOfficer(s.officerId)) return res.status(403).json({error:'System administrator authorization required.'});
  const request=recoveryRequests.get(req.params.id); if(!request || request.status!=='PENDING' || request.expiresAt<Date.now()) return res.status(400).json({error:'Recovery request is unavailable or expired.'});
  const officer=officerById(request.officerId); const code=randomRecoveryCode();
  request.status='APPROVED'; request.approvedAt=Date.now(); request.approvedBy=s.officerId; request.expiresAt=Date.now()+RECOVERY_TTL_MS; request.codeHash=recoveryHash(code); request.attempts=0;
  const delivery=await deliverRecoveryEmail(officer,code,request.id); request.delivery=delivery; recoveryRequests.set(request.id,request);
  auditRecovery({ event:'RECOVERY_APPROVED', requestId:request.id, officerId:officer.id, approvedBy:s.officerId, delivered:delivery.delivered });
  // In an unconfigured local deployment, return the code to the administrator so it can be communicated through an approved secure channel.
  res.json({ ok:true, requestId:request.id, expiresAt:request.expiresAt, delivery, recoveryCode:delivery.delivered ? undefined : code });
});

app.post('/api/admin/recovery-requests/:id/deny', (req,res) => {
  const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  const s=sessions.get(token); if(!s || s.expiresAt<Date.now() || !adminOfficer(s.officerId)) return res.status(403).json({error:'System administrator authorization required.'});
  const request=recoveryRequests.get(req.params.id); if(!request || request.status!=='PENDING') return res.status(400).json({error:'Recovery request is unavailable.'});
  request.status='DENIED'; request.deniedAt=Date.now(); request.deniedBy=s.officerId; recoveryRequests.set(request.id,request);
  auditRecovery({ event:'RECOVERY_DENIED', requestId:request.id, officerId:request.officerId, deniedBy:s.officerId });
  res.json({ok:true});
});

app.get('/api/auth/recovery-status/:id', (req,res) => {
  const request=recoveryRequests.get(req.params.id); if(!request) return res.status(404).json({error:'Recovery request not found.'});
  if (request.status==='PENDING' && request.expiresAt<Date.now()) { request.status='EXPIRED'; recoveryRequests.set(request.id,request); }
  res.json({ requestId:request.id, status:request.status, expiresAt:request.expiresAt, delivery:request.delivery || undefined });
});

app.post('/api/auth/recovery/one-time', (req,res) => {
  const request=recoveryRequests.get(req.body?.requestId); const officer=officerById(req.body?.officerId);
  if (!request || !officer || request.officerId!==officer.id || request.status!=='APPROVED' || request.expiresAt<Date.now()) return res.status(401).json({error:'Recovery request is invalid or expired.'});
  const attempts=recoveryAttempts.get(request.id) || 0;
  if (attempts >= MAX_RECOVERY_ATTEMPTS) return res.status(429).json({error:'Recovery request is locked after too many failed attempts.'});
  if (recoveryHash(String(req.body?.recoveryCode||'').trim()) !== request.codeHash) {
    recoveryAttempts.set(request.id,attempts+1); request.attempts=attempts+1; recoveryRequests.set(request.id,request); auditRecovery({event:'RECOVERY_CODE_FAILED',requestId:request.id,officerId:officer.id,attempt:attempts+1});
    return res.status(401).json({error:`Invalid recovery code. ${Math.max(0,MAX_RECOVERY_ATTEMPTS-(attempts+1))} attempts remaining.`});
  }
  request.status='USED'; request.usedAt=Date.now(); recoveryRequests.set(request.id,request); recoveryAttempts.delete(request.id); auditRecovery({event:'RECOVERY_CODE_USED',requestId:request.id,officerId:officer.id});
  pending.delete(officer.id); res.json({ ...session(officer,'One-Time Recovery Authorization') });
});

app.post('/api/auth/register-passkey/options', async (req,res) => {
  const officer = officerById(req.body?.officerId); if (!officer) return res.status(404).json({ error:'Officer not found.' });
  const userPasskeys = passkeys[officer.id] || [];
  const options = await generateRegistrationOptions({ rpName:RP_NAME, rpID:RP_ID, userName:officer.id, userDisplayName:officer.name, userID:new TextEncoder().encode(officer.id), attestationType:'none', authenticatorSelection:{ residentKey:'preferred', userVerification:'preferred' }, excludeCredentials:userPasskeys.map(k=>({ id:k.id, transports:k.transports })), supportedAlgorithmIDs:[-7,-257] });
  pending.set(`reg:${officer.id}`, { officerId:officer.id, challenge:options.challenge, expiresAt:Date.now()+2*60*1000 });
  res.json(options);
});

app.post('/api/auth/register-passkey/verify', async (req,res) => {
  const officer = officerById(req.body?.officerId); const state = pending.get(`reg:${officer?.id}`); if (!officer || !state || state.expiresAt<Date.now()) return res.status(400).json({ error:'Registration challenge expired.' });
  try {
    const verification = await verifyRegistrationResponse({ response:req.body.credential, expectedChallenge:state.challenge, expectedOrigin:FRONTEND_ORIGIN, expectedRPID:RP_ID });
    if (!verification.verified || !verification.registrationInfo) return res.status(400).json({ error:'Passkey registration could not be verified.' });
    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
    passkeys[officer.id] ||= [];
    passkeys[officer.id].push({ id:credential.id, publicKey:Buffer.from(credential.publicKey).toString('base64'), counter:credential.counter, transports:credential.transports || [], deviceType:credentialDeviceType, backedUp:credentialBackedUp, createdAt:new Date().toISOString() });
    writeStore(passkeys); pending.delete(`reg:${officer.id}`);
    res.json({ verified:true });
  } catch (e) { res.status(400).json({ error:e instanceof Error ? e.message : 'Passkey registration failed.' }); }
});

app.get('/api/auth/session', (req,res) => {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i,''); const s=sessions.get(token);
  if (!s || s.expiresAt<Date.now()) return res.status(401).json({ error:'Session expired.' });
  const officer=officerById(s.officerId); if(!officer) return res.status(401).json({error:'Officer account unavailable.'});
  res.json({ ...s, officer:publicOfficer(officer) });
});
app.post('/api/auth/logout',(req,res)=>{ const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,''); sessions.delete(token); res.json({ok:true}); });


app.get('/api/data/all', async (req,res) => {
  const auth=requireSession(req,res); if(!auth) return;
  try { const data=await getAllData(); res.json(filterDataForOfficer(data,auth.officer)); }
  catch(e){ res.status(503).json({error:'PostgreSQL data service unavailable.',detail:process.env.NODE_ENV==='development'?String(e.message):undefined}); }
});

app.get('/api/cctns/status', (req,res) => { const auth=requireSession(req,res); if(!auth) return; const adapter=new CCTNSAdapter(); res.json({configured:adapter.isConfigured(),source:'CCTNS/ICJS adapter',mode:adapter.isConfigured()?'live-authorized-connector':'demo-compatibility-mode'}); });

app.post('/api/cctns/firs', async (req,res) => {
  const auth=requireSession(req,res); if(!auth) return;
  const fir=req.body||{};
  if(!fir.firNumber || !fir.policeStation || !fir.narrative) return res.status(400).json({error:'firNumber, policeStation and narrative are required.'});
  try { const result=await createFIR(fir,auth.officer.id); res.status(result.persisted?201:202).json(result); }
  catch(e){ res.status(500).json({error:'FIR ingestion failed.',detail:process.env.NODE_ENV==='development'?String(e.message):undefined}); }
});

app.post('/api/cctns/sync', async (req,res) => {
  const auth=requireSession(req,res); if(!auth) return;
  const adapter=new CCTNSAdapter();
  if(!adapter.isConfigured()) return res.status(503).json({error:'Authorized CCTNS connector is not configured. Set CCTNS_BASE_URL and CCTNS_API_KEY in the protected server environment.'});
  try { const result=await adapter.pullLatestFIRs(); res.json(result); } catch(e){ res.status(502).json({error:'CCTNS sync failed.',detail:process.env.NODE_ENV==='development'?String(e.message):undefined}); }
});

app.use((_req,res)=>res.status(404).json({ error:'API endpoint not found' }));
app.listen(Number(process.env.PORT||PORT),'0.0.0.0',async()=>{ console.log(`NEXUS API listening on port ${process.env.PORT||PORT}`); try { const seeded=await ensureDemoData(); console.log('PostgreSQL demo dataset:',seeded); } catch(e) { console.error('PostgreSQL seed skipped:',e.message); } });
