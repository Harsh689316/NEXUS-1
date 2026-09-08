import { Officer, Person, Case, Relationship, Transaction, IntelligenceTip } from '../types';

export type AccessScopeLevel = 'area' | 'city' | 'division';

const normalize = (value: string | undefined | null) => (value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export const getCity = (value: string | undefined) => {
  const v = normalize(value);
  if (v.includes('mumbai') || v.includes('panvel') || v.includes('navi mumbai') || v.includes('thane') || v.includes('dombivli') || v.includes('kalyan') || v.includes('vashi') || v.includes('kurla')) return 'mumbai';
  if (v.includes('nagpur')) return 'nagpur';
  if (v.includes('kolhapur')) return 'kolhapur';
  if (v.includes('nashik')) return 'nashik';
  if (v.includes('solapur')) return 'solapur';
  if (v.includes('aurangabad') || v.includes('chhatrapati sambhajinagar')) return 'chhatrapati sambhajinagar';
  if (v.includes('pune') || v.includes('shivajinagar') || v.includes('kothrud') || v.includes('hadapsar') || v.includes('kharadi') || v.includes('viman nagar') || v.includes('swargate') || v.includes('aundh') || v.includes('katraj') || v.includes('pimpri') || v.includes('hinjewadi') || v.includes('talegaon') || v.includes('chakan') || v.includes('loni kalbhor') || v.includes('purandar') || v.includes('saswad') || v.includes('shirwal')) return 'pune';
  return 'unknown';
};

export const getArea = (value: string | undefined) => {
  const raw = (value || '').split(',')[0].trim();
  return normalize(raw);
};

export const getDivision = (value: string | undefined) => {
  const city = getCity(value);
  if (city === 'pune' || city === 'solapur') return 'pune division';
  if (city === 'mumbai' || city === 'nashik') return 'mumbai division';
  if (city === 'nagpur' || city === 'chhatrapati sambhajinagar' || city === 'kolhapur') return 'maharashtra division';
  return 'maharashtra division';
};

const officerDivision = (o: Officer) => normalize(o.jurisdictionDivision || getDivision(o.station));

export function canAccessPerson(officer: Officer | null, person: Person): boolean {
  if (!officer || officer.role === 'system_admin') return false;
  if (person.clearanceRequired && clearanceRank(officer.clearanceLevel) < clearanceRank(person.clearanceRequired)) return false;
  if (officer.accessScope === 'division') return true;
  if (officer.accessScope === 'city') return normalize(officer.jurisdictionCity || getCity(officer.station)) === normalize(person.jurisdictionCity || getCity(person.primaryCity));
  return normalize(officer.jurisdictionArea || '') === normalize(person.jurisdictionArea || getArea(person.primaryCity));
}

export function canAccessCase(officer: Officer | null, c: Case, persons: Person[] = []): boolean {
  if (!officer || officer.role === 'system_admin') return false;
  if (c.clearanceRequired && clearanceRank(officer.clearanceLevel) < clearanceRank(c.clearanceRequired)) return false;
  const linked = c.associatedPersons.map(id => persons.find(p => p.id === id)).filter(Boolean) as Person[];
  if (officer.accessScope === 'division') return true;
  if (officer.accessScope === 'city') return normalize(officer.jurisdictionCity || getCity(officer.station)) === normalize(c.jurisdictionCity || getCity(c.primaryJurisdiction));
  if (normalize(officer.jurisdictionArea || '') === normalize(c.jurisdictionArea || getArea(c.primaryJurisdiction))) return true;
  return linked.some(p => canAccessPerson(officer, p));
}

export function canAccessTip(officer: Officer | null, tip: IntelligenceTip, persons: Person[], cases: Case[]): boolean {
  if (!officer || officer.role === 'system_admin') return false;
  const linkedPersons = tip.linkedPersonIds.map(id => persons.find(p => p.id === id)).filter(Boolean) as Person[];
  const linkedCases = tip.linkedCaseIds.map(id => cases.find(c => c.id === id)).filter(Boolean) as Case[];
  if (linkedPersons.some(p => canAccessPerson(officer, p)) || linkedCases.some(c => canAccessCase(officer, c, persons))) return true;
  if (officer.accessScope === 'division') return officerDivision(officer) === normalize(getDivision(tip.location));
  if (officer.accessScope === 'city') return normalize(officer.jurisdictionCity || getCity(officer.station)) === normalize(getCity(tip.location));
  return normalize(officer.jurisdictionArea || '') === normalize(getArea(tip.location));
}

export function canAccessRelationship(officer: Officer | null, rel: Relationship, persons: Person[], cases: Case[]): boolean {
  if (!officer || officer.role === 'system_admin') return false;
  const source = persons.find(p => p.id === rel.sourceId);
  const target = persons.find(p => p.id === rel.targetId);
  if (source && target) return canAccessPerson(officer, source) && canAccessPerson(officer, target);
  const linkedCase = cases.find(c => c.id === rel.sourceId || c.id === rel.targetId);
  return linkedCase ? canAccessCase(officer, linkedCase, persons) : false;
}

export function canAccessTransaction(officer: Officer | null, tx: Transaction, persons: Person[]): boolean {
  if (!officer || officer.role === 'system_admin') return false;
  const source = tx.senderId ? persons.find(p => p.id === tx.senderId) : undefined;
  const target = tx.receiverId ? persons.find(p => p.id === tx.receiverId) : undefined;
  if (source || target) return !!((source && canAccessPerson(officer, source)) || (target && canAccessPerson(officer, target)));
  if (officer.accessScope === 'division') return true;
  const city = getCity(`${tx.sender} ${tx.receiver}`);
  if (officer.accessScope === 'city') return normalize(officer.jurisdictionCity || '') === city;
  return normalize(officer.jurisdictionArea || '') !== '' && normalize(`${tx.sender} ${tx.receiver}`).includes(normalize(officer.jurisdictionArea));
}

export function clearanceRank(level: Officer['clearanceLevel']) {
  return level === 'L3_TOP_SECRET' ? 3 : level === 'L2_SECRET' ? 2 : 1;
}

export function scopeLabel(officer: Officer) {
  if (officer.role === 'system_admin') return 'System Administration • No Investigation Data';
  if (officer.accessScope === 'division') return `Division • ${officer.jurisdictionDivision}`;
  if (officer.accessScope === 'city') return `City • ${officer.jurisdictionCity}`;
  return `Area • ${officer.jurisdictionArea}`;
}
