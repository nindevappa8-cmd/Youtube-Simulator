/**
 * Security Rules Specification & Adversarial Verification Matrix
 * Documents the 12 Dirty Dozen payloads enforced by firestore.rules.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  targetPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expectedResult: 'PERMISSION_DENIED';
  enforcedByRule: string;
}

export const DIRTY_DOZEN_CASES: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Unauthenticated Profile Read',
    targetPath: 'users/userA',
    operation: 'get',
    expectedResult: 'PERMISSION_DENIED',
    enforcedByRule: 'isSignedIn() && request.auth.uid == userId',
  },
  {
    id: 2,
    name: 'Cross-User PII Read',
    targetPath: 'users/userA',
    operation: 'get',
    expectedResult: 'PERMISSION_DENIED',
    enforcedByRule: 'isOwner(userId)',
  },
  {
    id: 3,
    name: 'User Collection Enumeration',
    targetPath: 'users',
    operation: 'list',
    expectedResult: 'PERMISSION_DENIED',
    enforcedByRule: 'allow list: if false;',
  },
  {
    id: 4,
    name: 'Shadow Field Injection on Signup',
    targetPath: 'users/userA',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    enforcedByRule: 'data.keys().hasOnly([...])',
  },
  {
    id: 5,
    name: 'Inflated Starting Balance on Signup',
    targetPath: 'users/userA',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    enforcedByRule: 'isInitialUserState(incoming())',
  },
  {
    id: 6,
    name: 'Immutable UID / CreatedAt Tampering',
    targetPath: 'users/userA',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
    enforcedByRule: 'incoming().uid == existing().uid && incoming().createdAt == existing().createdAt',
  },
  {
    id: 7,
    name: 'Negative Balance Exploit',
    targetPath: 'users/userA',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
    enforcedByRule: 'data.balance is number && data.balance >= 0',
  },
  {
    id: 8,
    name: 'Client Clock Forgery',
    targetPath: 'users/userA',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
    enforcedByRule: 'incoming().updatedAt == request.time',
  },
  {
    id: 9,
    name: 'ID Poisoning Attack',
    targetPath: 'users/userA/videos/invalid!id',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    enforcedByRule: 'isValidId(videoId)',
  },
  {
    id: 10,
    name: 'Zero-View / Negative-View Video Injection',
    targetPath: 'users/userA/videos/vid1',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    enforcedByRule: 'data.views >= 1 && data.earnings >= 0',
  },
  {
    id: 11,
    name: 'Leaderboard Spoofing / PII Leak',
    targetPath: 'globalLeaderboard/userA',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
    enforcedByRule: 'isOwner(userId) && data.keys().hasOnly([...])',
  },
  {
    id: 12,
    name: 'Video Mutation Tampering',
    targetPath: 'users/userA/videos/vid1',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
    enforcedByRule: 'allow update: if false;',
  },
];
