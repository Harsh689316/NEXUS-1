import 'dotenv/config';
import { ensureFIRSchema, ensureInvestigationOpsSchema, ensureDemoData } from '../server/db.js';
await ensureFIRSchema(); await ensureInvestigationOpsSchema();
const result = await ensureDemoData();
console.log(JSON.stringify(result, null, 2));
process.exit(0);
