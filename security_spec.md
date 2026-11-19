# Face Check Bite — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Default Deny**: All unmatched paths in Firestore are denied for both reads and writes.
2. **PII Isolation**: Visitor `quiz_responses` (containing allergies/profiles), `orders` (containing customer name, phone, address, city, pincode), `feedback`, and `analytics_events` are NEVER readable (`get`/`list`), updatable, or deletable by anonymous or non-admin users. Only `isAdmin()` can read or manage them.
3. **Consent Gate**: A `quiz_responses` document MUST have `consentAccepted == true`.
4. **Server Timestamp Integrity**: All `createdAt` fields MUST equal `request.time`.
5. **Bounded Sizes & Strict Keys**: Every document enforces exact `keys().hasAll(...) && keys().hasOnly(...)` and bounded string/list sizes to prevent shadow fields and resource exhaustion.
6. **Admin Verification**: `isAdmin()` requires `request.auth != null && request.auth.token.email_verified == true` and either the bootstrapped owner email (`arunima.0251mba240@dgu.ac.in`) or a verified record in `/admins/{uid}`.

## 2. The "Dirty Dozen" Attack Payloads
1. **Unauthenticated PII Scrape (`orders` list)**: Anonymous user attempts `list` on `/orders` -> `PERMISSION_DENIED`.
2. **Unauthenticated Quiz Scrape (`quiz_responses` get)**: Anonymous user attempts `get` on `/quiz_responses/resp_1` -> `PERMISSION_DENIED`.
3. **Shadow Field Injection on Order (`isPaid: true` / `role: 'admin'`)**: Visitor submits `/orders/ord_1` with an extra `isVerifiedAdmin: true` field -> `PERMISSION_DENIED`.
4. **Missing Consent on Quiz**: Visitor submits `/quiz_responses/resp_2` with `consentAccepted: false` -> `PERMISSION_DENIED`.
5. **Forged Timestamp on Feedback**: Visitor submits `/feedback/fb_1` with a client-supplied past timestamp instead of `serverTimestamp()` -> `PERMISSION_DENIED`.
6. **ID Poisoning**: Visitor attempts to create `/quiz_responses/` with a 300-char or invalid-char document ID -> `PERMISSION_DENIED`.
7. **Unverified Admin Email Spoof**: User with `email: "arunima.0251mba240@dgu.ac.in"` and `email_verified: false` attempts to read `/orders` -> `PERMISSION_DENIED`.
8. **Self-Assigned Admin**: Non-admin authenticated user attempts `create` on `/admins/{uid}` -> `PERMISSION_DENIED`.
9. **Catalogue Tampering**: Non-admin user attempts `create` or `update` on `/products/prod_1` -> `PERMISSION_DENIED`.
10. **Order Price/Status Tampering on Update**: Non-admin user attempts `update` on `/orders/ord_1` to change `totalInr` or `status` -> `PERMISSION_DENIED`.
11. **Oversized Array / Denial of Wallet**: Visitor submits `/quiz_responses/resp_3` with 25 items in `concerns` -> `PERMISSION_DENIED`.
12. **Invalid Enum Value**: Visitor submits `/feedback/fb_2` with `relevanceScore: 99` or `wouldTry: "Hacked"` -> `PERMISSION_DENIED`.
