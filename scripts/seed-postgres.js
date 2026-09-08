import 'dotenv/config';
import { ensureFIRSchema, ensureDemoData } from '../server/db.js';
await ensureFIRSchema();
const result = await ensureDemoData();
console.log(JSON.stringify(result, null, 2));
process.exit(0);
