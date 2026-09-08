import 'dotenv/config';
import { ensureFIRSchema, ensureInvestigationOpsSchema, health } from '../server/db.js';
const state=await health();
if(!state.postgres){ console.error(JSON.stringify({migrated:false,reason:'PostgreSQL not configured'},null,2)); process.exit(1); }
await ensureFIRSchema(); await ensureInvestigationOpsSchema();
console.log(JSON.stringify({migrated:true,message:'NEXUS FIR ingestion schema is up to date.'},null,2));
process.exit(0);
