import crypto from 'node:crypto';
/** Authorized CCTNS/ICJS integration boundary. No public/bypass access is attempted. */
export class CCTNSAdapter {
  constructor({baseUrl=process.env.CCTNS_BASE_URL,apiKey=process.env.CCTNS_API_KEY}={}) { this.baseUrl=baseUrl; this.apiKey=apiKey; }
  isConfigured(){return Boolean(this.baseUrl&&this.apiKey);}
  normalizeFIR(input){ const raw=JSON.stringify(input); return {sourceSystem:'CCTNS',firNumber:String(input.firNumber||'').trim(),policeStation:String(input.policeStation||'').trim(),district:String(input.district||'').trim(),state:String(input.state||'Maharashtra').trim(),incidentDate:String(input.incidentDate||new Date().toISOString().slice(0,10)),sections:Array.isArray(input.sections)?input.sections:String(input.sections||'').split(',').map(s=>s.trim()).filter(Boolean),narrative:String(input.narrative||'').trim(),complainantName:String(input.complainantName||'').trim(),entities:Array.isArray(input.entities)?input.entities:[],receivedAt:new Date().toISOString(),payloadHash:crypto.createHash('sha256').update(raw).digest('hex')}; }
  async pullLatestFIRs(){ if(!this.isConfigured()) return {configured:false,records:[]}; const r=await fetch(`${this.baseUrl.replace(/\/$/,'')}/firs/latest`,{headers:{Authorization:`Bearer ${this.apiKey}`,Accept:'application/json'},signal:AbortSignal.timeout(8000)}); if(!r.ok) throw new Error(`CCTNS adapter returned HTTP ${r.status}`); return {configured:true,records:await r.json()}; }
}
