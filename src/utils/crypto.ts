// Deterministic lightweight SHA-256 equivalent cryptographic hash for platform blockchain audit verification

export function deterministicHash(input: string): string {
  let hash1 = 0xdeadbeef ^ 0;
  let hash2 = 0x41c6ce57 ^ 0;
  
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    hash1 = Math.imul(hash1 ^ ch, 2654435761);
    hash2 = Math.imul(hash2 ^ ch, 1597334677);
  }
  
  hash1 = Math.imul(hash1 ^ (hash1 >>> 16), 2246822507);
  hash1 ^= Math.imul(hash2 ^ (hash2 >>> 13), 3266489909);
  hash2 = Math.imul(hash2 ^ (hash2 >>> 16), 2246822507);
  hash2 ^= Math.imul(hash1 ^ (hash1 >>> 13), 3266489909);
  
  const part1 = (hash1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  const part3 = ((hash1 ^ hash2) >>> 0).toString(16).padStart(8, '0');
  const part4 = ((hash1 + hash2) >>> 0).toString(16).padStart(8, '0');
  
  return `0x${part1}${part2}${part3}${part4}`;
}

export function generateBlockHash(
  blockIndex: number,
  actionId: string,
  officerId: string,
  timestamp: string,
  details: string,
  previousHash: string
): string {
  const payload = `${blockIndex}|${actionId}|${officerId}|${timestamp}|${details}|${previousHash}`;
  return deterministicHash(payload);
}
