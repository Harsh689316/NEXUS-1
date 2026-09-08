import { Person, Case, Relationship, Transaction, IntelligenceTip, AuditRecord, DataSourceStatus, AIFinding } from '../types';
import { 
  SEEDED_PERSONS, 
  SEEDED_CASES, 
  SEEDED_RELATIONSHIPS, 
  SEEDED_TRANSACTIONS, 
  SEEDED_TIPS, 
  SEEDED_AUDIT_TRAIL, 
  SEEDED_DATA_SOURCES 
} from '../data/seedData';
import { generateBlockHash } from '../utils/crypto';
import { Officer } from '../types';
import { canAccessPerson, canAccessCase, canAccessRelationship, canAccessTransaction, canAccessTip } from '../utils/accessControl';

class DataSourceService {
  private persons: Person[] = [...SEEDED_PERSONS];
  private cases: Case[] = [...SEEDED_CASES];
  private relationships: Relationship[] = [...SEEDED_RELATIONSHIPS];
  private transactions: Transaction[] = [...SEEDED_TRANSACTIONS];
  private tips: IntelligenceTip[] = [...SEEDED_TIPS];
  private auditTrail: AuditRecord[] = [...SEEDED_AUDIT_TRAIL];
  private dataSources: DataSourceStatus[] = [...SEEDED_DATA_SOURCES];
  private firs: any[] = [];
  private serverAuditTrail: AuditRecord[] = [];
  private currentOfficer: Officer | null = null;

  public setCurrentOfficer(officer: Officer | null) { this.currentOfficer = officer; }

  public async hydrateFromApi(token: string): Promise<boolean> {
    try {
      const response = await fetch('/api/data/all', { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) return false;
      const data = await response.json();
      if (Array.isArray(data.persons)) this.persons = data.persons;
      if (Array.isArray(data.cases)) this.cases = data.cases;
      if (Array.isArray(data.relationships)) this.relationships = data.relationships;
      if (Array.isArray(data.transactions)) this.transactions = data.transactions;
      if (Array.isArray(data.tips)) this.tips = data.tips;
      if (Array.isArray(data.firs)) this.firs = data.firs;
      if (Array.isArray(data.audit)) this.serverAuditTrail = data.audit;
      return true;
    } catch { return false; }
  }

  public async ingestCCTNSFIR(token: string, payload: Record<string, unknown>) {
    const response = await fetch('/api/cctns/firs', { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body:JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'CCTNS FIR ingestion failed.');
    await this.hydrateFromApi(token);
    return data;
  }

  public getFIRs(){ return this.firs; }
  public getServerAuditTrail(){ return this.serverAuditTrail; }
  public async getFIRAnalysis(token:string, firId:string){
    const r=await fetch(`/api/firs/${encodeURIComponent(firId)}/analysis`,{headers:{Authorization:`Bearer ${token}`}});
    const d=await r.json(); if(!r.ok) throw new Error(d.error||'FIR analysis unavailable.'); return d;
  }
  public async analyzeFIR(token:string, firId:string){
    const r=await fetch(`/api/firs/${encodeURIComponent(firId)}/analyze`,{method:'POST',headers:{Authorization:`Bearer ${token}`}});
    const d=await r.json(); if(!r.ok) throw new Error(d.error||'FIR analysis failed.'); await this.hydrateFromApi(token); return d;
  }
  public async fetchServerAudit(token:string){
    const r=await fetch('/api/audit',{headers:{Authorization:`Bearer ${token}`}});
    const d=await r.json(); if(!r.ok) throw new Error(d.error||'Audit service unavailable.'); this.serverAuditTrail=d.records||[]; return this.serverAuditTrail;
  }
  public async verifyServerAudit(token:string){
    const r=await fetch('/api/audit/verify',{headers:{Authorization:`Bearer ${token}`}});
    const d=await r.json(); if(!r.ok) throw new Error(d.error||'Audit verification unavailable.'); return d;
  }
  public getCurrentOfficer() { return this.currentOfficer; }
  private requireOfficer() { if (!this.currentOfficer) throw new Error('Authenticated officer context required.'); return this.currentOfficer; }

  // Persons
  public getAllPersons(): Person[] {
    const officer = this.currentOfficer;
    return officer ? this.persons.filter(p => canAccessPerson(officer, p)) : [];
  }

  public getPersonById(id: string): Person | undefined {
    return this.getAllPersons().find((p) => p.id.toLowerCase() === id.toLowerCase());
  }

  // Cases
  public getAllCases(): Case[] {
    const officer = this.currentOfficer;
    return officer ? this.cases.filter(c => canAccessCase(officer, c, this.persons)) : [];
  }

  public getCaseById(id: string): Case | undefined {
    return this.getAllCases().find((c) => c.id.toLowerCase() === id.toLowerCase());
  }

  // Relationships
  public getAllRelationships(): Relationship[] {
    const officer = this.currentOfficer;
    return officer ? this.relationships.filter(r => canAccessRelationship(officer, r, this.persons, this.cases)) : [];
  }

  public getRelationshipsForPerson(personId: string): Relationship[] {
    return this.getAllRelationships().filter(
      (r) => r.sourceId.toLowerCase() === personId.toLowerCase() || r.targetId.toLowerCase() === personId.toLowerCase()
    );
  }

  // Transactions
  public getAllTransactions(): Transaction[] {
    const officer = this.currentOfficer;
    return officer ? this.transactions.filter(t => canAccessTransaction(officer, t, this.persons)) : [];
  }

  public getTransactionsForPerson(personId: string): Transaction[] {
    return this.getAllTransactions().filter(
      (t) => t.senderId?.toLowerCase() === personId.toLowerCase() || t.receiverId?.toLowerCase() === personId.toLowerCase()
    );
  }

  // Tips
  public getAllTips(): IntelligenceTip[] {
    const officer = this.currentOfficer;
    return officer ? this.tips.filter(t => canAccessTip(officer, t, this.persons, this.cases)) : [];
  }

  public getTipById(id: string): IntelligenceTip | undefined {
    return this.getAllTips().find((t) => t.id.toLowerCase() === id.toLowerCase());
  }

  public updateTipStatus(tipId: string, status: IntelligenceTip['status'], officerName: string): boolean {
    const tip = this.getTipById(tipId);
    if (tip) {
      tip.status = status;
      this.logAuditAction(
        this.currentOfficer?.id || 'SYSTEM',
        officerName,
        'Updated Tip Status',
        `${tip.id} (${tip.category})`,
        `Status transitioned to ${status}`
      );
      return true;
    }
    return false;
  }

  public linkTipToEntity(tipId: string, type: 'person' | 'case', targetId: string, officerName: string): boolean {
    const tip = this.getTipById(tipId);
    if (!tip) return false;

    if (type === 'person' && !tip.linkedPersonIds.includes(targetId)) {
      tip.linkedPersonIds.push(targetId);
      tip.status = 'Linked';
    } else if (type === 'case' && !tip.linkedCaseIds.includes(targetId)) {
      tip.linkedCaseIds.push(targetId);
      tip.status = 'Linked';
    }

    this.logAuditAction(
      'SI-2087',
      officerName,
      `Linked Tip to ${type === 'person' ? 'Person' : 'Case'}`,
      `${tip.id} -> ${targetId}`,
      `Investigative correlation established between tip and active record`
    );
    return true;
  }

  // Audit Trail & Blockchain Integrity
  public getAuditTrail(): AuditRecord[] {
    if (!this.currentOfficer) return [];
    if (this.currentOfficer.accessScope === 'division') return this.auditTrail;
    return this.auditTrail.filter(a => a.officerId === this.currentOfficer?.id);
  }

  public logAuditAction(
    officerId: string,
    officerName: string,
    action: string,
    resource: string,
    details: string
  ): AuditRecord {
    const blockIndex = this.auditTrail.length + 1;
    const actionId = `ACTION-${10000 + blockIndex}`;
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' IST';
    const previousHash = this.auditTrail.length > 0 
      ? this.auditTrail[this.auditTrail.length - 1].currentHash 
      : '0x00000000000000000000000000000000GENESIS';

    const currentHash = generateBlockHash(blockIndex, actionId, officerId, timestamp, details, previousHash);

    const record: AuditRecord = {
      blockIndex,
      actionId,
      timestamp,
      officerId,
      officerName,
      action,
      resource,
      details,
      previousHash,
      currentHash,
    };

    this.auditTrail.push(record);
    return record;
  }

  public verifyChainIntegrity(): { isValid: boolean; brokenIndex?: number; message: string; verifiedCount: number } {
    let prev = '0x00000000000000000000000000000000GENESIS';
    
    for (let i = 0; i < this.auditTrail.length; i++) {
      const block = this.auditTrail[i];
      
      // Verify previous hash continuity
      if (block.previousHash !== prev) {
        return {
          isValid: false,
          brokenIndex: block.blockIndex,
          message: `Hash link breakage at Block #${block.blockIndex}. Previous hash mismatch.`,
          verifiedCount: i,
        };
      }

      // Verify block hash calculation
      const calculatedHash = generateBlockHash(
        block.blockIndex,
        block.actionId,
        block.officerId,
        block.timestamp,
        block.details,
        block.previousHash
      );

      if (block.isTampered || calculatedHash !== block.currentHash) {
        return {
          isValid: false,
          brokenIndex: block.blockIndex,
          message: `Tamper detected at Block #${block.blockIndex}! Computed hash (${calculatedHash.slice(0, 12)}...) differs from recorded block hash (${block.currentHash.slice(0, 12)}...).`,
          verifiedCount: i,
        };
      }

      prev = block.currentHash;
    }

    return {
      isValid: true,
      message: `Complete cryptographic integrity verified across all ${this.auditTrail.length} blocks in the audit hash chain. Zero tampering detected.`,
      verifiedCount: this.auditTrail.length,
    };
  }


  public resetAuditTampering(): void {
    this.auditTrail = SEEDED_AUDIT_TRAIL.map((b) => ({ ...b, isTampered: false }));
  }

  public resetAuditChain(): void {
    this.resetAuditTampering();
  }

  public verifyAuditIntegrity(): {
    verified: boolean;
    validCount: number;
    failedIndex: number | null;
    message: string;
  } {
    const result = this.verifyChainIntegrity();
    return {
      verified: result.isValid,
      validCount: result.verifiedCount,
      failedIndex: result.brokenIndex ?? null,
      message: result.message,
    };
  }

  // Data Sources
  public getDataSources(): DataSourceStatus[] {
    return this.currentOfficer ? this.dataSources : [];
  }

  // Global Multi-Entity Search
  public searchEntities(query: string): {
    persons: Person[];
    cases: Case[];
    tips: IntelligenceTip[];
    locations: string[];
    vehicles: string[];
  } {
    const q = query.trim().toLowerCase();
    if (!q) {
      return { persons: [], cases: [], tips: [], locations: [], vehicles: [] };
    }

    const matchedPersons = this.getAllPersons().filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.alias.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.primaryCity.toLowerCase().includes(q) ||
        p.occupation.toLowerCase().includes(q) ||
        p.phoneNumbers.some((ph) => ph.toLowerCase().includes(q)) ||
        p.emails.some((em) => em.toLowerCase().includes(q)) ||
        p.vehicles.some((v) => v.toLowerCase().includes(q)) ||
        p.networkGroup.toLowerCase().includes(q)
    );

    const matchedCases = this.getAllCases().filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.primaryJurisdiction.toLowerCase().includes(q)
    );

    const matchedTips = this.getAllTips().filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );

    // Collect matched locations from all persons and cases
    const allLocations = new Set<string>();
    this.persons.forEach((p) => p.knownLocations.forEach((loc) => allLocations.add(loc)));
    this.cases.forEach((c) => c.associatedLocations.forEach((loc) => allLocations.add(loc)));
    const matchedLocations = Array.from(allLocations).filter((loc) => loc.toLowerCase().includes(q));

    // Collect matched vehicles
    const allVehicles = new Set<string>();
    this.persons.forEach((p) => p.vehicles.forEach((v) => allVehicles.add(v)));
    const matchedVehicles = Array.from(allVehicles).filter((v) => v.toLowerCase().includes(q));

    return {
      persons: matchedPersons,
      cases: matchedCases,
      tips: matchedTips,
      locations: matchedLocations,
      vehicles: matchedVehicles,
    };
  }

  // Deterministic AI Network Analysis Findings
  public getAIFindings(): AIFinding[] {
    const findings: AIFinding[] = [
      {
        id: 'AI-FINDING-001',
        title: 'Cross-Case Freight Diversion Hub Identified',
        findingType: 'Cross-Case Connector',
        description: 'Subject Rahul Sharma (PER-01) and Container Manager Amit Verma (PER-02) appear synchronously across CASE-1001 (Freight Hijacking) and CASE-1005 (ICD Seal Tampering). Telephony records indicate 18 calls immediately preceding 3 distinct freight diversion incidents.',
        confidence: 94,
        supportingRecords: ['CASE-1001', 'CASE-1005', 'REL-001', 'CDR-8819'],
        involvedEntities: [
          { id: 'PER-01', name: 'Rahul Sharma', type: 'person' },
          { id: 'PER-02', name: 'Amit Verma', type: 'person' },
          { id: 'CASE-1001', name: 'Operation Sahyadri', type: 'case' },
          { id: 'CASE-1005', name: 'Operation Iron Seal', type: 'case' },
        ],
        recommendedAction: 'Verify cross-jurisdiction manifest logs between Chakan Phase II and Talegaon ICD dry port.',
        reasoning: 'High graph centrality and temporal correlation of telephony links across two independently opened cases.'
      },
      {
        id: 'AI-FINDING-002',
        title: 'Hawala Clearing Conduit Connecting Coastal Cargo to Zaveri Bazaar',
        findingType: 'Hawala Layering',
        description: 'Transnational broker Hashim Lakhani (PER-50) serves as a bridging node linking coastal vessel operations (Tariq Mansoori, PER-13) directly to Zaveri Bazaar bullion operator Kantilal Zaveri (PER-23). Inward remittances mirror seized maritime cargo schedules.',
        confidence: 91,
        supportingRecords: ['CASE-1002', 'CASE-1003', 'CASE-1010', 'TXN-007', 'REL-040'],
        involvedEntities: [
          { id: 'PER-50', name: 'Hashim Lakhani', type: 'person' },
          { id: 'PER-13', name: 'Tariq Mansoori', type: 'person' },
          { id: 'PER-23', name: 'Kantilal Zaveri', type: 'person' },
          { id: 'CASE-1003', name: 'Operation Golden Ledger', type: 'case' },
        ],
        recommendedAction: 'Summon Angadia courier ledgers for Dhanji Street vault lane for cross-verification.',
        reasoning: 'Triangular financial flow detected: Marine barge offload -> Offshore FZE invoice -> Zaveri bullion token settlement.'
      },
      {
        id: 'AI-FINDING-003',
        title: 'Rapid ATM Extraction & SIM-Box Farm Association',
        findingType: 'Cluster Detection',
        description: 'Cyber Cell nodes Vikram Rajput (PER-31) and Arjun Sen (PER-32) share physical equipment co-location in Hinjewadi server suites with 500 fake-KYC SIM batches procured through Swargate franchise (PER-42). High velocity ATM extractions occur within 8 minutes of target crediting.',
        confidence: 89,
        supportingRecords: ['CASE-1004', 'CASE-1009', 'CASE-1014', 'TIP-1005', 'TXN-008'],
        involvedEntities: [
          { id: 'PER-31', name: 'Vikram Rajput', type: 'person' },
          { id: 'PER-32', name: 'Arjun Sen', type: 'person' },
          { id: 'PER-42', name: 'Kailash Suthar', type: 'person' },
          { id: 'CASE-1004', name: 'Operation Phantom SIM', type: 'case' },
        ],
        recommendedAction: 'Inspect Hinjewadi Phase 1 colocation rack lease and request ISP VoIP SIP trunk logs.',
        reasoning: 'Tight clustering coefficient (0.84) between telecom hardware vendor, server technician, and cash runner accounts.'
      },
      {
        id: 'AI-FINDING-004',
        title: 'Agricultural Land Acquisition Used for Layering Freight Proceeds',
        findingType: 'Hawala Layering',
        description: 'Agrarian trusts controlled by Bhavna Parekh (PER-26) in Baner received Rs 6.2 Crore structured remittances from accounts linked to transport contractor Dhananjay Bhosale (PER-38). Purchases concentrate along proposed Pune Ring Road corridor.',
        confidence: 86,
        supportingRecords: ['CASE-1011', 'CASE-1001', 'TXN-005', 'REL-046'],
        involvedEntities: [
          { id: 'PER-26', name: 'Bhavna Parekh', type: 'person' },
          { id: 'PER-38', name: 'Dhananjay Bhosale', type: 'person' },
          { id: 'PER-44', name: 'Sharad Deshpande', type: 'person' },
          { id: 'CASE-1011', name: 'Operation Cold Shell', type: 'case' },
        ],
        recommendedAction: 'Request certified copy of 14 agrarian trust deeds registered at Saswad Sub-Registrar.',
        reasoning: 'Circular flow of funds without underlying agricultural commercial output detected across multi-bank accounts.'
      }
    ];
    const allowedPersons = new Set(this.getAllPersons().map(p => p.id));
    const allowedCases = new Set(this.getAllCases().map(c => c.id));
    return findings.filter(f => f.involvedEntities.every(e => e.type === 'person' ? allowedPersons.has(e.id) : e.type === 'case' ? allowedCases.has(e.id) : true));
  }

  // Natural Language deterministic AI Investigation Assistant query solver
  public queryInvestigationAssistant(query: string): {
    answer: string;
    suggestedEntities?: { id: string; name: string; type: string }[];
    supportingCases?: string[];
  } {
    const q = query.toLowerCase().trim();
    const visiblePersons = this.getAllPersons();
    const visibleCases = this.getAllCases();
    const visibleIds = new Set(visiblePersons.map(p => p.id));
    const visibleFIRs = this.firs || [];
    const matchedFIRs = visibleFIRs.filter(f => `${f.firNumber||''} ${f.narrative||''} ${f.policeStation||''} ${f.sections||''}`.toLowerCase().includes(q));
    if (matchedFIRs.length) {
      const f = matchedFIRs[0];
      return {
        answer: `FIR ${f.firNumber} was ingested from ${f.sourceSystem || 'authorized source'} and is available for investigation. Its saved record includes ${Array.isArray(f.sections)?f.sections.join(', '):'section data'}, and the server-side NEXUS NLP pipeline can extract entity matches and correlation signals from the narrative. Open CCTNS Intake to inspect the persisted analysis.`,
        suggestedEntities: [{id:f.id,name:f.firNumber,type:'case'}],
        supportingCases: [f.id]
      };
    }

    if (q.includes('rahul sharma') || q.includes('per-01')) {
      const p = this.getPersonById('PER-01');
      if (!p) return { answer: 'That entity is outside your current authorization scope.' };
      const relatedRels = this.getRelationshipsForPerson('PER-01');
      const associateNames = relatedRels.map((r) => {
        const otherId = r.sourceId === 'PER-01' ? r.targetId : r.sourceId;
        const otherPerson = this.getPersonById(otherId);
        return otherPerson ? `${otherPerson.fullName} (${r.type})` : otherId;
      });

      return {
        answer: `Rahul Sharma (PER-01, alias "Pandit") is an identified Person of Interest in Operation Sahyadri (CASE-1001) and Operation Cross-Current (CASE-1013). Operates as a fleet logistics contractor in Pune with 8 direct network ties, most notably Amit Verma (Container Yard Manager), Sunil Jadhav (Heavy Transporter), and Dhananjay Bhosale (Transport Union Arbiter). Associated with vehicle MH-12-AB-1000 and frequent activity in Hadapsar Industrial Hub.`,
        suggestedEntities: [
          { id: 'PER-01', name: 'Rahul Sharma', type: 'person' },
          { id: 'PER-02', name: 'Amit Verma', type: 'person' },
          { id: 'PER-38', name: 'Dhananjay Bhosale', type: 'person' },
          { id: 'CASE-1001', name: 'CASE-1001', type: 'case' },
        ],
        supportingCases: ['CASE-1001', 'CASE-1013']
      };
    }

    if (q.includes('multiple cases') || q.includes('cross-case') || q.includes('cross case')) {
      const crossCasePersons = visiblePersons.filter((p) => p.cases.length >= 3);
      const namesList = crossCasePersons.map((p) => `• ${p.fullName} (${p.id}): Associated with ${p.cases.join(', ')}`).join('\n');

      return {
        answer: `Identified ${crossCasePersons.length} key persons with cross-case linkages across 3 or more distinct investigations:\n\n${namesList}\n\nThese subjects function as strategic operational bridges between logistics theft, coastal offloading, and financial hawala settlement channels.`,
        suggestedEntities: crossCasePersons.slice(0, 5).map((p) => ({ id: p.id, name: p.fullName, type: 'person' })),
        supportingCases: ['CASE-1001', 'CASE-1002', 'CASE-1003', 'CASE-1013']
      };
    }

    if (q.includes('connect case 1001 and case 1007') || (q.includes('1001') && q.includes('1007'))) {
      if (!(visibleCases.some(c => c.id === 'CASE-1001') && visibleCases.some(c => c.id === 'CASE-1007') && visibleIds.has('PER-38') && visibleIds.has('PER-23'))) return { answer: 'Those investigation records are outside your current authorization scope.' };
      return {
        answer: `Investigation data reveals that CASE-1001 (Freight Theft) and CASE-1007 (Bullion Settlement) are bridged through Dhananjay Bhosale (PER-38) and Kantilal Zaveri (PER-23). Illicit cash generated from hijacked freight consignments in Pune is relayed through Swargate Angadia couriers (Harish Shah, PER-25) into Laxmi Road gold melting channels to balance transnational ledgers.`,
        suggestedEntities: [
          { id: 'PER-38', name: 'Dhananjay Bhosale', type: 'person' },
          { id: 'PER-23', name: 'Kantilal Zaveri', type: 'person' },
          { id: 'PER-25', name: 'Harish Shah', type: 'person' },
          { id: 'CASE-1001', name: 'CASE-1001', type: 'case' },
          { id: 'CASE-1007', name: 'CASE-1007', type: 'case' },
        ],
        supportingCases: ['CASE-1001', 'CASE-1003', 'CASE-1007', 'CASE-1013']
      };
    }

    if (q.includes('hawala') || q.includes('financial') || q.includes('zaveri')) {
      if (!(visibleCases.some(c => c.id === 'CASE-1003') && visibleIds.has('PER-23'))) return { answer: 'Financial intelligence for that subject is outside your current authorization scope.' };
      return {
        answer: `Financial Hawala network analysis indicates Kantilal Zaveri (PER-23, alias "Shroff") operates as the central bullion clearing node in Kalbadevi, Mumbai. High-confidence financial linkages tie him to chartered accountant Pravin Mehta (PER-24), Angadia courier Harish Shah (PER-25), and international liaison Hashim Lakhani (PER-50) with over Rs 32 Crore estimated flow in CASE-1003.`,
        suggestedEntities: [
          { id: 'PER-23', name: 'Kantilal Zaveri', type: 'person' },
          { id: 'PER-24', name: 'Pravin Mehta', type: 'person' },
          { id: 'PER-25', name: 'Harish Shah', type: 'person' },
        ],
        supportingCases: ['CASE-1003', 'CASE-1007', 'CASE-1011']
      };
    }

    if (q.includes('location') || q.includes('pune') || q.includes('mumbai') || q.includes('hadapsar')) {
      const city = this.currentOfficer?.jurisdictionCity || 'authorized jurisdiction';
      const visibleAreas = Array.from(new Set(visiblePersons.map(p => p.jurisdictionArea || p.primaryCity))).slice(0, 8);
      return { answer: `Geographic correlation is limited to your ${this.currentOfficer?.accessScope || 'authorized'} scope (${city}). Visible operational areas: ${visibleAreas.join(', ')}.` };
    }

    // Default intelligent summary
    return {
      answer: `Analysis for "${query}": Scanned ${visiblePersons.length} authorized persons, ${visibleCases.length} authorized cases, ${this.getAllRelationships().length} authorized network edges, and ${this.getAllTips().length} authorized intelligence tips. The dataset contains 4 major clusters (Logistics Syndicate, Coastal Transit, Hawala Clearing, Cyber SIM Farm) interconnected by 13 cross-network bridge subjects. You can inspect any entity in the Network Analysis graph for deep structural path tracing.`,
      suggestedEntities: visiblePersons.slice(0, 4).map(p => ({ id:p.id, name:p.fullName, type:'person' })),
      supportingCases: visibleCases.slice(0, 4).map(c => c.id)
    };
  }
}

export const dataSourceService = new DataSourceService();
