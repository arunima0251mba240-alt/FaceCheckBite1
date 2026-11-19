/**
 * Security Rules TDD Specification for Face Check Bite
 * Verifies the "Dirty Dozen" adversarial payloads against firestore.rules.
 */

export interface SecurityTestCase {
  id: string;
  description: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: { uid?: string; email?: string; email_verified?: boolean } | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED' | 'ALLOWED';
}

export const dirtyDozenTests: SecurityTestCase[] = [
  {
    id: 'dirty-01',
    description: 'Anonymous user attempts to list orders containing PII',
    collection: 'orders',
    operation: 'list',
    auth: null,
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'dirty-02',
    description: 'Anonymous user attempts to get a quiz_response document',
    collection: 'quiz_responses/resp_001',
    operation: 'get',
    auth: null,
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'dirty-03',
    description: 'Order create includes shadow field isVerifiedAdmin',
    collection: 'orders/ord_001',
    operation: 'create',
    auth: null,
    payload: { orderNumber: 'FCB-1001', isVerifiedAdmin: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'dirty-04',
    description: 'Quiz response submitted without consentAccepted == true',
    collection: 'quiz_responses/resp_002',
    operation: 'create',
    auth: null,
    payload: { responseId: 'resp_002', consentAccepted: false },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'dirty-05',
    description: 'Feedback submitted with client-forged timestamp',
    collection: 'feedback/fb_001',
    operation: 'create',
    auth: null,
    payload: { relevanceScore: 5, createdAt: '2020-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'dirty-06',
    description: 'ID poisoning with invalid characters in responseId',
    collection: 'quiz_responses/bad$id!',
    operation: 'create',
    auth: null,
    payload: { responseId: 'bad$id!' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'dirty-07',
    description: 'Unverified email spoofing admin email attempts to list orders',
    collection: 'orders',
    operation: 'list',
    auth: { uid: 'spoof-1', email: 'arunima.0251mba240@dgu.ac.in', email_verified: false },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'dirty-08',
    description: 'Non-admin authenticated user attempts to write into /admins',
    collection: 'admins/attacker_uid',
    operation: 'create',
    auth: { uid: 'attacker_uid', email: 'attacker@example.com', email_verified: true },
    payload: { email: 'attacker@example.com', role: 'admin' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'dirty-09',
    description: 'Non-admin user attempts to overwrite product pricing',
    collection: 'products/prod_1',
    operation: 'update',
    auth: { uid: 'user_1', email: 'user@example.com', email_verified: true },
    payload: { priceInr: 1 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'dirty-10',
    description: 'Non-admin user attempts to update order status to dispatched',
    collection: 'orders/ord_001',
    operation: 'update',
    auth: null,
    payload: { status: 'dispatched' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'dirty-11',
    description: 'Oversized concerns list (>10 items) rejected',
    collection: 'quiz_responses/resp_003',
    operation: 'create',
    auth: null,
    payload: { concerns: new Array(25).fill('acne') },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'dirty-12',
    description: 'Invalid feedback relevanceScore (99) rejected',
    collection: 'feedback/fb_002',
    operation: 'create',
    auth: null,
    payload: { relevanceScore: 99, wouldTry: 'Yes' },
    expected: 'PERMISSION_DENIED',
  },
];
