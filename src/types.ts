export type Role = 'investigator' | 'senior_investigator' | 'division_command' | 'system_admin';

export type ClearanceLevel = 'L1_RESTRICTED' | 'L2_SECRET' | 'L3_TOP_SECRET';

export interface Officer {
  id: string; // e.g. "INS-1042"
  name: string;
  badgeNumber: string;
  role: Role;
  clearanceLevel: ClearanceLevel;
  department: string;
  station: string;
  rank: string;
  accessScope: 'area' | 'city' | 'division';
  jurisdictionArea?: string;
  jurisdictionCity?: string;
  jurisdictionDivision?: string;
  avatarInitials: string;
  activeSessionId?: string;
  lastLogin?: string;
}

export interface AuthSession {
  token: string;
  officer: Officer;
  expiresAt: number;
  sessionStartedAt: string;
  clearanceLevel: ClearanceLevel;
}

export type BiometricStatus = 'idle' | 'scanning' | 'analyzing' | 'matched' | 'failed';

export interface BiometricState {
  status: BiometricStatus;
  progress: number;
  confidenceScore: number;
  errorMessage?: string;
}

export type EntityType = 
  | 'person' 
  | 'phone' 
  | 'email' 
  | 'vehicle' 
  | 'location' 
  | 'case' 
  | 'organization' 
  | 'transaction';

export type PersonStatus = 
  | 'Person of Interest' 
  | 'Subject' 
  | 'Associated Person' 
  | 'Reported Connection' 
  | 'Background Monitor';

export type RiskReviewState = 
  | 'For Investigation Review' 
  | 'Priority Attention' 
  | 'Cross-Case Linkage' 
  | 'Under Routine Monitoring';

export interface CriminalHistoryItem {
  offenseType: string;
  year: number;
  jurisdiction: string;
  status: string;
  caseRef: string;
}

export interface Person {
  id: string; // "PER-01" to "PER-50"
  fullName: string;
  alias: string;
  age: number;
  dob: string;
  gender: string;
  occupation: string;
  status: PersonStatus;
  riskAssessment: RiskReviewState;
  phoneNumbers: string[];
  emails: string[];
  knownLocations: string[];
  primaryCity: string;
  jurisdictionArea?: string;
  jurisdictionCity?: string;
  jurisdictionDivision?: string;
  vehicles: string[];
  cases: string[];
  networkGroup: string; // Network A, B, C, D, or Bridge
  tags: string[];
  summary: string;
  criminalHistory: CriminalHistoryItem[];
  clearanceRequired: ClearanceLevel;
  profileCreated: string;
  lastActive: string;
}

export type RelationshipType = 
  | 'Known Associate' 
  | 'Communication' 
  | 'Shared Location' 
  | 'Shared Vehicle' 
  | 'Financial Link' 
  | 'Case Association' 
  | 'Organization Association' 
  | 'Reported Relationship'
  | 'Reported Connection';

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  sourceType: EntityType;
  targetType: EntityType;
  sourceName?: string;
  targetName?: string;
  type: RelationshipType;
  label: string;
  confidence: number; // 0 - 100
  verificationStatus: 'Verified' | 'Under Investigation' | 'Unverified Lead';
  supportingRecords: string[];
  firstObserved: string;
  notes: string;
}

export interface CaseMilestone {
  date: string;
  event: string;
  detail: string;
}

export interface Case {
  id: string; // "CASE-1001" to "CASE-1015"
  title: string;
  category: string;
  status: 'Active' | 'Under Investigation' | 'Court Pending' | 'Closed/Archived';
  openedDate: string;
  investigatingOfficer: string;
  officerBadge: string;
  description: string;
  primaryJurisdiction: string;
  jurisdictionArea?: string;
  jurisdictionCity?: string;
  jurisdictionDivision?: string;
  associatedPersons: string[]; // Person IDs
  associatedLocations: string[];
  evidenceCount: number;
  evidenceRecords?: string[];
  timeline?: CaseMilestone[];
  linkedTips: string[];
  clearanceRequired: ClearanceLevel;
  financialVolumeINR?: number;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  currency: string;
  sender: string;
  senderId?: string;
  receiver: string;
  receiverId?: string;
  category: string;
  flag: 'Normal' | 'Suspicious Frequency' | 'High Value Layering' | 'Circular Flow';
  bankReference: string;
  channel: string;
}

export interface IntelligenceTip {
  id: string; // "TIP-1001" etc.
  category: string;
  location: string;
  submittedDate: string;
  sourceType: 'Anonymous Web Portal' | 'Helpline Call' | 'Confidential Field Source' | 'Public Submission';
  description: string;
  status: 'New' | 'Under Review' | 'Linked' | 'Resolved';
  linkedPersonIds: string[];
  linkedCaseIds: string[];
  assignedOfficer: string;
  urgency: 'Low' | 'Medium' | 'High';
  verificationDisclaimer: string;
}

export interface AuditRecord {
  blockIndex: number;
  actionId: string;
  timestamp: string;
  officerId: string;
  officerName: string;
  action: string;
  resource: string;
  details: string;
  previousHash: string;
  currentHash: string;
  isTampered?: boolean;
}

export interface AIFinding {
  id: string;
  title: string;
  findingType: 'Cluster Detection' | 'Cross-Case Connector' | 'Communication Frequency' | 'Shared Mobility' | 'Hawala Layering';
  description: string;
  confidence: number;
  supportingRecords: string[];
  involvedEntities: { id: string; name: string; type: EntityType }[];
  recommendedAction: string;
  reasoning: string;
}

export interface NetworkGraphNode {
  id: string;
  name: string;
  type: EntityType;
  group?: string;
  riskLevel?: string;
  details?: Record<string, any>;
  degree?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface NetworkGraphLink {
  id: string;
  source: string | NetworkGraphNode;
  target: string | NetworkGraphNode;
  type: RelationshipType;
  label: string;
  confidence: number;
  verificationStatus: string;
}

export interface DataSourceStatus {
  id: string;
  name: string;
  type: string;
  status: 'Active' | 'Integration Ready' | 'Unavailable';
  recordsCount: number;
  latency: string;
  description: string;
  endpoint: string;
  lastSync: string;
  adapterClass: string;
}
