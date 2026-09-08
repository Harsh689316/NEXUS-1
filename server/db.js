import 'dotenv/config';
import crypto from 'node:crypto';
import { CCTNSAdapter } from './integrations/cctnsAdapter.js';
import { generateDemoDataset } from './demoData.js';
let pool=null, pgAvailable=false;
try { const {Pool}=await import('pg'); if(process.env.DATABASE_URL){pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==='true'?{rejectUnauthorized:false}:undefined,max:10,idleTimeoutMillis:30000});pgAvailable=true;} } catch {}
export const dbState=()=>({postgres:pgAvailable&&!!pool,cctns:new CCTNSAdapter().isConfigured()});
export async function ensureFIRSchema(){ if(!pool) return {configured:false}; const sql=`CREATE TABLE IF NOT EXISTS firs (id VARCHAR(64) PRIMARY KEY, fir_number VARCHAR(128) NOT NULL, source_system VARCHAR(32) NOT NULL DEFAULT 'CCTNS', police_station VARCHAR(128), district VARCHAR(128), state VARCHAR(128), incident_date DATE, sections TEXT[] DEFAULT '{}', narrative TEXT, complainant_name VARCHAR(256), payload_hash VARCHAR(128) NOT NULL, received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, ingested_by VARCHAR(32) REFERENCES officers(id), UNIQUE(source_system, fir_number)); CREATE INDEX IF NOT EXISTS idx_firs_number ON firs(fir_number); CREATE INDEX IF NOT EXISTS idx_firs_received_at ON firs(received_at DESC); CREATE INDEX IF NOT EXISTS idx_firs_hash ON firs(payload_hash);`; await pool.query(sql); return {configured:true}; }
export async function ensureInvestigationOpsSchema(){
  if(!pool) return {configured:false};
  await pool.query(`
    CREATE TABLE IF NOT EXISTS fir_ai_analysis (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      fir_id VARCHAR(64) NOT NULL REFERENCES firs(id) ON DELETE CASCADE,
      model VARCHAR(128) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'completed',
      summary TEXT NOT NULL,
      entities JSONB NOT NULL DEFAULT '[]'::jsonb,
      findings JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_by VARCHAR(32) REFERENCES officers(id),
      analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_fir_ai_fir_id ON fir_ai_analysis(fir_id);
    CREATE TABLE IF NOT EXISTS fir_entity_mentions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      fir_id VARCHAR(64) NOT NULL REFERENCES firs(id) ON DELETE CASCADE,
      entity_type VARCHAR(32) NOT NULL,
      entity_value VARCHAR(256) NOT NULL,
      normalized_value VARCHAR(256) NOT NULL,
      source_span TEXT,
      confidence INT CHECK (confidence >= 0 AND confidence <= 100),
      linked_person_id VARCHAR(32) REFERENCES persons(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_fir_entity_fir ON fir_entity_mentions(fir_id);
    CREATE TABLE IF NOT EXISTS investigation_audit_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type VARCHAR(128) NOT NULL,
      resource_type VARCHAR(64) NOT NULL,
      resource_id VARCHAR(128),
      actor_id VARCHAR(32) REFERENCES officers(id),
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_ops_audit_created ON investigation_audit_events(created_at DESC);
  `);
  return {configured:true};
}

const mapPerson=r=>({id:r.id,fullName:r.full_name,alias:r.alias||'',age:r.age||0,dob:r.dob||'',gender:r.gender||'',occupation:r.occupation||'',status:r.status,riskAssessment:r.risk_assessment||'For Investigation Review',phoneNumbers:r.phone_numbers||[],emails:r.emails||[],knownLocations:r.known_locations||[],primaryCity:r.primary_city||'',jurisdictionArea:r.jurisdiction_area,jurisdictionCity:r.jurisdiction_city,jurisdictionDivision:r.jurisdiction_division,vehicles:r.vehicles||[],cases:r.cases||[],networkGroup:r.network_group||'Network A',tags:r.tags||[],summary:r.summary||'',criminalHistory:[],clearanceRequired:r.clearance_required,profileCreated:r.created_at,lastActive:r.updated_at});
const mapCase=r=>({id:r.id,title:r.title,category:r.category,status:r.status,openedDate:r.opened_date,investigatingOfficer:r.investigating_officer||'Unassigned',officerBadge:r.officer_badge||'',description:r.description||'',primaryJurisdiction:r.primary_jurisdiction||'',jurisdictionArea:r.jurisdiction_area,jurisdictionCity:r.jurisdiction_city,jurisdictionDivision:r.jurisdiction_division,associatedPersons:r.associated_persons||[],associatedLocations:r.associated_locations||[],evidenceCount:r.evidence_count||0,linkedTips:[],clearanceRequired:r.clearance_required,financialVolumeINR:Number(r.financial_volume_inr||0),cctnsFirNumber:r.cctns_fir_number,sourceSystem:r.source_system||'PostgreSQL'});
const mapRel=r=>({id:r.id,sourceId:r.source_id,targetId:r.target_id,sourceType:r.source_type,targetType:r.target_type,type:r.relationship_type,label:r.label||'',confidence:r.confidence||0,verificationStatus:r.verification_status||'Under Investigation',supportingRecords:[],firstObserved:r.first_observed||'',notes:r.notes||''});
const mapTxn=r=>({id:r.id,date:r.date,amount:Number(r.amount),currency:r.currency,sender:r.sender_name,senderId:r.sender_person_id,receiver:r.receiver_name,receiverId:r.receiver_person_id,category:r.category||'',flag:r.flag||'Normal',bankReference:r.bank_reference||'',channel:r.channel||''});
const officerIds=['INS-1042','SI-2087','ACP-4022','SP-5027','DCP-6033','DIG-7044'];
export async function ensureDemoData(){ if(!pool)return{seeded:false,reason:'PostgreSQL not configured'}; const d=generateDemoDataset(); await pool.query('BEGIN'); try { const demoOfficers=[['NEXUS-ADMIN-01','NEXUS Security Administrator','NEXUS-ADMIN-01','system_admin','L2_SECRET','NEXUS Security Operations','NEXUS Control Center'],['INS-1042','Insp. Vikram Deshmukh','MH-INV-1042','investigator','L1_RESTRICTED','Crime Branch Unit IV','Shivajinagar Police Station, Pune'],['SI-2087','SI Ananya Roy','MH-SI-2087','senior_investigator','L2_SECRET','Special Organized Crime Cell','Central Investigation HQ, Mumbai'],['ACP-4022','ACP Arvind Rao','MH-ACP-4022','senior_investigator','L2_SECRET','Crime Branch','Pune City Police Commissionerate'],['SP-5027','SP Neha Kulkarni','MH-SP-5027','senior_investigator','L2_SECRET','District Crime Branch','Pune District Headquarters'],['DCP-6033','DCP Sameer Patil','MH-DCP-6033','senior_investigator','L2_SECRET','Urban Crime Division','Mumbai Police Headquarters'],['DIG-7044','DIG Rohan Mehta, IPS','MH-DIG-7044','division_command','L3_TOP_SECRET','State Intelligence Directorate','Maharashtra Police Headquarters']]; for(const o of demoOfficers) await pool.query(`INSERT INTO officers(id,name,badge_number,role,clearance_level,department,station,password_hash) VALUES($1,$2,$3,$4::role_type,$5::clearance_level,$6,$7,$8) ON CONFLICT(id) DO NOTHING`,[...o,'DEMO_ONLY_DISABLED_PASSWORD']); for(const p of d.persons) await pool.query(`INSERT INTO persons(id,full_name,alias,age,dob,gender,occupation,status,risk_assessment,primary_city,network_group,summary,clearance_required) VALUES($1,$2,$3,$4,$5,$6,$7,$8::person_status,$9,$10,$11,$12,$13::clearance_level) ON CONFLICT(id) DO NOTHING`,[p.id,p.fullName,p.alias,p.age,p.dob,p.gender,p.occupation,p.status,p.riskAssessment,p.primaryCity,p.networkGroup,p.summary,p.clearanceRequired]); for(const c of d.cases){await pool.query(`INSERT INTO cases(id,title,category,status,opened_date,investigating_officer_id,description,primary_jurisdiction,clearance_required,financial_volume_inr) VALUES($1,$2,$3,$4::case_status,$5,$6,$7,$8,$9::clearance_level,$10) ON CONFLICT(id) DO NOTHING`,[c.id,c.title,c.category,c.status,c.openedDate,officerIds[d.cases.indexOf(c)%officerIds.length],c.description,c.primaryJurisdiction,c.clearanceRequired,c.financialVolumeINR]); for(const pid of c.associatedPersons) await pool.query(`INSERT INTO case_persons(case_id,person_id,role_in_case) VALUES($1,$2,'Subject') ON CONFLICT DO NOTHING`,[c.id,pid]);} for(const r of d.relationships) await pool.query(`INSERT INTO relationships(id,source_id,target_id,source_type,target_type,relationship_type,label,confidence,verification_status,notes,first_observed) VALUES($1,$2,$3,$4,$5,$6::relationship_type,$7,$8,$9,$10,$11) ON CONFLICT(id) DO NOTHING`,[r.id,r.sourceId,r.targetId,r.sourceType,r.targetType,r.relationshipType,r.label,r.confidence,r.verificationStatus,r.notes,r.firstObserved]); for(const t of d.transactions) await pool.query(`INSERT INTO transactions(id,date,amount,currency,sender_name,sender_person_id,receiver_name,receiver_person_id,category,flag,bank_reference,channel) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT(id) DO NOTHING`,[t.id,t.date,t.amount,t.currency,t.sender,t.senderId,t.receiver,t.receiverId,t.category,t.flag,t.bankReference,t.channel]); await pool.query('COMMIT'); return{seeded:true,persons:d.persons.length,cases:d.cases.length,relationships:d.relationships.length,transactions:d.transactions.length}; }catch(e){await pool.query('ROLLBACK');throw e;} }
export async function getAllData(){
  if(!pool) return generateDemoDataset();
  await ensureFIRSchema();
  await ensureInvestigationOpsSchema();
  const [p,c,r,t,f]=await Promise.all([
    pool.query(`SELECT p.*,ARRAY(SELECT pp.phone_number FROM person_phone_numbers pp WHERE pp.person_id=p.id) phone_numbers,ARRAY(SELECT pe.email FROM person_emails pe WHERE pe.person_id=p.id) emails,ARRAY(SELECT pv.vehicle_plate FROM person_vehicles pv WHERE pv.person_id=p.id) vehicles,ARRAY(SELECT cp.case_id FROM case_persons cp WHERE cp.person_id=p.id) cases,ARRAY[p.primary_city] known_locations FROM persons p ORDER BY p.id`),
    pool.query(`SELECT c.*,o.name investigating_officer,o.badge_number officer_badge,ARRAY(SELECT cp.person_id FROM case_persons cp WHERE cp.case_id=c.id) associated_persons,ARRAY[]::text[] associated_locations,0 evidence_count,CASE WHEN c.id LIKE 'CASE-CCTNS-%' THEN 'CCTNS' ELSE 'PostgreSQL' END source_system FROM cases c LEFT JOIN officers o ON o.id=c.investigating_officer_id ORDER BY c.id`),
    pool.query(`SELECT * FROM relationships ORDER BY id`),
    pool.query(`SELECT * FROM transactions ORDER BY id LIMIT 5000`),
    pool.query(`SELECT id,fir_number,source_system,police_station,district,state,incident_date,sections,narrative,complainant_name,payload_hash,received_at,ingested_by FROM firs ORDER BY received_at DESC`)
  ]);
  return {
    persons:p.rows.map(mapPerson),
    cases:c.rows.map(mapCase),
    relationships:r.rows.map(mapRel),
    transactions:t.rows.map(mapTxn),
    firs:f.rows.map(r=>({id:r.id,firNumber:r.fir_number,sourceSystem:r.source_system,policeStation:r.police_station,district:r.district,state:r.state,incidentDate:r.incident_date,sections:r.sections||[],narrative:r.narrative||'',complainantName:r.complainant_name||'',payloadHash:r.payload_hash,receivedAt:r.received_at,ingestedBy:r.ingested_by})),
    tips:[]
  };
}
export async function createFIR(input,officerId){
  const fir=new CCTNSAdapter().normalizeFIR(input);
  const caseId=`CASE-CCTNS-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  if(!pool) return {fir,caseId,persisted:false,message:'PostgreSQL unavailable; demo validation mode only.'};
  await ensureFIRSchema();
  await ensureInvestigationOpsSchema();
  if(!fir.firNumber) throw new Error('FIR number is required.');
  await pool.query('BEGIN');
  try {
    const existing=await pool.query(`SELECT id FROM firs WHERE source_system='CCTNS' AND fir_number=$1`,[fir.firNumber]);
    if(existing.rowCount){
      await pool.query('ROLLBACK');
      return {fir,caseId:existing.rows[0].id,persisted:true,duplicate:true,message:'FIR already exists in PostgreSQL.'};
    }
    await pool.query(`INSERT INTO firs(id,fir_number,source_system,police_station,district,state,incident_date,sections,narrative,complainant_name,payload_hash,received_at,ingested_by) VALUES($1,$2,'CCTNS',$3,$4,$5,$6,$7,$8,$9,$10,NOW(),$11)`,[caseId,fir.firNumber,fir.policeStation,fir.district,fir.state,fir.incidentDate,fir.sections,fir.narrative,fir.complainantName,fir.payloadHash,officerId]);
    await pool.query(`INSERT INTO cases(id,title,category,status,opened_date,investigating_officer_id,description,primary_jurisdiction,clearance_required) VALUES($1,$2,'CCTNS FIR','Active',$3,$4,$5,$6,'L1_RESTRICTED')`,[caseId,`CCTNS FIR ${fir.firNumber||caseId}`,fir.incidentDate,officerId,fir.narrative||'New FIR ingested from CCTNS.',`${fir.policeStation}, ${fir.district}`]);
    await writeAuditEvent({eventType:'FIR_INGESTED',resourceType:'FIR',resourceId:caseId,actorId:officerId,metadata:{firNumber:fir.firNumber,sourceSystem:'CCTNS',payloadHash:fir.payloadHash}});
    const analysis=await analyzeFIRInternal(caseId, fir, officerId);
    await pool.query('COMMIT');
    return {fir,caseId,persisted:true,rawHash:fir.payloadHash,analysis};
  } catch(e) { await pool.query('ROLLBACK'); throw e; }
}


const normalizeEntity = v => String(v || '').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

async function writeAuditEvent({eventType,resourceType,resourceId,actorId,metadata={}}){
  if(!pool) return null;
  await pool.query(`INSERT INTO investigation_audit_events(event_type,resource_type,resource_id,actor_id,metadata) VALUES($1,$2,$3,$4,$5::jsonb)`,[eventType,resourceType,resourceId,actorId,JSON.stringify(metadata)]);
  // Tamper-evident operational ledger. Advisory transaction lock prevents concurrent duplicate block indexes.
  await pool.query('SELECT pg_advisory_xact_lock(9147281)');
  const last=await pool.query('SELECT block_index,current_hash FROM audit_logs ORDER BY block_index DESC LIMIT 1');
  const blockIndex=Number(last.rows[0]?.block_index||0)+1;
  const actionId=`ACTION-${String(blockIndex).padStart(8,'0')}`;
  const previousHash=last.rows[0]?.current_hash || '0x00000000000000000000000000000000GENESIS';
  const officer=await pool.query('SELECT name FROM officers WHERE id=$1',[actorId]);
  const officerName=officer.rows[0]?.name || 'System';
  const details=JSON.stringify({eventType,resourceType,resourceId,metadata});
  const timestamp=new Date().toISOString();
  const currentHash=crypto.createHash('sha256').update(`${blockIndex}|${actionId}|${actorId}|${timestamp}|${details}|${previousHash}`).digest('hex');
  await pool.query(`INSERT INTO audit_logs(block_index,action_id,officer_id,officer_name,action,resource,details,previous_hash,current_hash,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[blockIndex,actionId,actorId,officerName,eventType,`${resourceType}:${resourceId||''}`,details,previousHash,currentHash,timestamp]);
  return {blockIndex,actionId,currentHash};
}

function localFIRAnalysis(fir, persons){
  const text=[fir.narrative,fir.complainantName,(fir.sections||[]).join(' '),fir.policeStation,fir.district,fir.state].filter(Boolean).join(' ');
  const norm=normalizeEntity(text);
  const entities=[];
  for(const p of persons){
    const candidates=[p.full_name,p.alias].filter(Boolean);
    for(const candidate of candidates){
      const c=normalizeEntity(candidate);
      if(c && c.length>=4 && norm.includes(c)){
        entities.push({type:'person',value:p.full_name,personId:p.id,confidence:95,reason:'Name or alias matched in FIR narrative.'});
        break;
      }
    }
  }
  const uniqueEntities=[...new Map(entities.map(e=>[e.personId,e])).values()];
  const findings=[];
  const sections=(fir.sections||[]).map(String).filter(Boolean);
  if(uniqueEntities.length>=2) findings.push({
    type:'multi-entity-correlation',
    title:'Multiple known entities mentioned',
    description:`The FIR narrative contains ${uniqueEntities.length} existing synthetic entity matches. This is a correlation signal requiring investigator verification, not a finding of guilt.`,
    confidence:72
  });
  if(sections.length) findings.push({
    type:'section-context',
    title:'Statutory section context extracted',
    description:`Detected sections: ${sections.join(', ')}.`,
    confidence:100
  });
  if(/\b(phone|mobile|call|number|contact)\b/i.test(text)) findings.push({type:'telecom-signal',title:'Telecom-related language detected',description:'Narrative contains telecom/contact terminology; review authorized CDR sources if separately available.',confidence:68});
  if(/\b(account|bank|payment|transfer|transaction|cash|upi|wallet)\b/i.test(text)) findings.push({type:'financial-signal',title:'Financial terminology detected',description:'Narrative contains financial terminology; review authorized financial records if separately available.',confidence:68});
  if(/\b(vehicle|car|truck|van|registration|plate|mh-\d{2}\b)/i.test(text)) findings.push({type:'mobility-signal',title:'Vehicle/mobility terminology detected',description:'Narrative contains mobility identifiers; compare only with authorized vehicle records.',confidence:66});
  const summary=`Local NEXUS NLP reviewed the FIR narrative and extracted ${uniqueEntities.length} existing person match${uniqueEntities.length===1?'':'es'} plus ${findings.length} contextual signal${findings.length===1?'':'s'}. Results are investigative leads for human review.`;
  return {model:'NEXUS Local NLP v1',status:'completed',summary,entities:uniqueEntities,findings};
}

async function analyzeFIRInternal(firId, fir, officerId){
  const personsResult=await pool.query(`SELECT id,full_name,alias FROM persons`);
  const analysis=localFIRAnalysis(fir, personsResult.rows);
  await pool.query(`DELETE FROM fir_ai_analysis WHERE fir_id=$1`,[firId]);
  await pool.query(`DELETE FROM fir_entity_mentions WHERE fir_id=$1`,[firId]);
  await pool.query(`INSERT INTO fir_ai_analysis(fir_id,model,status,summary,entities,findings,created_by) VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7)`,
    [firId,analysis.model,analysis.status,analysis.summary,JSON.stringify(analysis.entities),JSON.stringify(analysis.findings),officerId]);
  for(const e of analysis.entities){
    await pool.query(`INSERT INTO fir_entity_mentions(fir_id,entity_type,entity_value,normalized_value,source_span,confidence,linked_person_id) VALUES($1,$2,$3,$4,$5,$6,$7)`,
      [firId,e.type,e.value,normalizeEntity(e.value),e.reason,e.confidence,e.personId]);
  }
  // Turn verified-by-matching entity mentions into visible case/graph correlations.
  for(const e of analysis.entities){
    await pool.query(`INSERT INTO case_persons(case_id,person_id,role_in_case) VALUES($1,$2,'Mentioned Entity') ON CONFLICT DO NOTHING`,[firId,e.personId]);
  }
  if(analysis.entities.length>=2){
    for(let i=0;i<analysis.entities.length;i++) for(let j=i+1;j<analysis.entities.length;j++){
      const a=analysis.entities[i], b=analysis.entities[j];
      const rid=`REL-FIR-${crypto.createHash('sha1').update(`${firId}|${a.personId}|${b.personId}`).digest('hex').slice(0,16).toUpperCase()}`;
      await pool.query(`INSERT INTO relationships(id,source_id,target_id,source_type,target_type,relationship_type,label,confidence,verification_status,notes,first_observed)
        VALUES($1,$2,$3,'person','person','Reported Relationship',$4,$5,'AI Suggested - Human Review Required',$6,$7)
        ON CONFLICT(id) DO UPDATE SET confidence=EXCLUDED.confidence,notes=EXCLUDED.notes`,
        [rid,a.personId,b.personId,`Co-mentioned in FIR ${fir.firNumber}`,55,`AI-generated co-mention signal from FIR ${fir.firNumber}; not evidence of wrongdoing.`,fir.incidentDate]);
    }
  }
  await writeAuditEvent({eventType:'FIR_AI_ANALYZED',resourceType:'FIR',resourceId:firId,actorId:officerId,metadata:{model:analysis.model,entityCount:analysis.entities.length,findingCount:analysis.findings.length}});
  return analysis;
}

export async function analyzeFIR(firId, officerId){
  if(!pool) throw new Error('PostgreSQL is not configured.');
  await ensureFIRSchema(); await ensureInvestigationOpsSchema();
  const result=await pool.query(`SELECT id,fir_number,source_system,police_station,district,state,incident_date,sections,narrative,complainant_name,payload_hash,received_at,ingested_by FROM firs WHERE id=$1`,[firId]);
  if(!result.rowCount) throw new Error('FIR not found.');
  return analyzeFIRInternal(firId,{
    firNumber:result.rows[0].fir_number,sourceSystem:result.rows[0].source_system,policeStation:result.rows[0].police_station,
    district:result.rows[0].district,state:result.rows[0].state,incidentDate:result.rows[0].incident_date,sections:result.rows[0].sections||[],
    narrative:result.rows[0].narrative||'',complainantName:result.rows[0].complainant_name||'',payloadHash:result.rows[0].payload_hash
  },officerId);
}

export async function getAuditLogs(){
  if(!pool) return [];
  await ensureInvestigationOpsSchema();
  const r=await pool.query(`SELECT block_index,action_id,officer_id,officer_name,action,resource,details,previous_hash,current_hash,created_at FROM audit_logs ORDER BY block_index DESC LIMIT 1000`);
  return r.rows.map(x=>({blockIndex:Number(x.block_index),actionId:x.action_id,officerId:x.officer_id,officerName:x.officer_name,action:x.action,resource:x.resource,details:x.details||'',previousHash:x.previous_hash,currentHash:x.current_hash,timestamp:x.created_at}));
}

export async function verifyAuditLogs(){
  const rows=await getAuditLogs(); const ordered=[...rows].sort((a,b)=>a.blockIndex-b.blockIndex);
  let prev='0x00000000000000000000000000000000GENESIS';
  for(let i=0;i<ordered.length;i++){
    const b=ordered[i];
    if(b.previousHash!==prev) return {verified:false,validCount:i,failedIndex:b.blockIndex,message:'Audit chain previous-hash mismatch.'};
    const calculated=crypto.createHash('sha256').update(`${b.blockIndex}|${b.actionId}|${b.officerId}|${b.timestamp}|${b.details}|${b.previousHash}`).digest('hex');
    if(calculated!==b.currentHash) return {verified:false,validCount:i,failedIndex:b.blockIndex,message:'Audit chain hash mismatch.'};
    prev=b.currentHash;
  }
  return {verified:true,validCount:ordered.length,failedIndex:null,message:`Verified ${ordered.length} persisted audit blocks.`};
}

export async function getFIRAnalysis(firId){
  if(!pool) return null;
  await ensureInvestigationOpsSchema();
  const r=await pool.query(`SELECT id,fir_id,model,status,summary,entities,findings,created_by,analyzed_at FROM fir_ai_analysis WHERE fir_id=$1 ORDER BY analyzed_at DESC LIMIT 1`,[firId]);
  return r.rows[0]||null;
}

export async function health(){return{...dbState(),timestamp:new Date().toISOString()};}
