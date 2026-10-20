# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Strict Ownership & PII Isolation (`/users/{userId}`)**:
   - Every user profile document at `/users/{userId}` contains PII (`email`, `phone`, `address`, `fullName`) and is strictly readable (`get`) and writable (`create`, `update`) ONLY by the authenticated owner whose `request.auth.uid == userId` and `request.auth.token.email_verified == true`.
   - Collection listing (`list`) and document deletion (`delete`) on `/users/{userId}` are strictly denied (`false`).
2. **Identity & Immutability**:
   - `incoming().uid` must strictly equal `request.auth.uid` and `userId`.
   - `uid`, `createdAt`, `joinedDate`, and `memberTier` are immutable on `update`.
3. **Temporal Integrity**:
   - On `create`: `incoming().createdAt == request.time` and `incoming().updatedAt == request.time`.
   - On `update`: `incoming().updatedAt == request.time` and `incoming().createdAt == existing().createdAt`.
4. **Anti-Update-Gap & Schema Enforcement**:
   - Every `create` and `update` must pass `isValidUserProfile(incoming())`, enforcing exact key allowlists (`hasAll` and `hasOnly`), string length bounds, regex patterns, and number bounds from `firebase-blueprint.json`.
5. **Payment Verification Subcollection (`/users/{userId}/paymentTransactions/{orderId}`)**:
   - Master Gate relational enforcement: Every read/write on `/users/{userId}/paymentTransactions/{orderId}` requires `isOwner(userId)` AND verifies parent ownership via `exists(/databases/$(database)/documents/users/$(userId))` and `get(/databases/$(database)/documents/users/$(userId)).data.uid == request.auth.uid`.
   - Mathematical Payment Integrity: `status == 'PAID'` is strictly rejected unless `transferredAmount >= expectedAmount && shortfallAmount == 0`. `status == 'UNDERPAID'` requires `transferredAmount > 0 && transferredAmount < expectedAmount && shortfallAmount == expectedAmount - transferredAmount`.
   - Terminal State Locking: Once `existing().status == 'PAID'`, all further updates are strictly denied.
   - Core Immutability: `orderId`, `uid`, `expectedAmount`, `bankCode`, `accountNumber`, and `createdAt` cannot be modified after creation.

## 2. The "Dirty Dozen" Payloads

1. **Unauthenticated Write**: `auth = null`, creating `/users/user_1` -> `PERMISSION_DENIED`.
2. **Unverified Email Write**: `auth = { uid: 'user_1', token: { email_verified: false } }`, creating `/users/user_1` -> `PERMISSION_DENIED`.
3. **Cross-User PII Read (PII Blanket Test)**: `auth = { uid: 'attacker_1', token: { email_verified: true } }`, reading `/users/victim_1` -> `PERMISSION_DENIED`.
4. **Identity Spoofing on Create**: `auth = { uid: 'user_1' }`, creating `/users/user_1` with `{ uid: 'admin_99' }` -> `PERMISSION_DENIED`.
5. **Shadow Field Injection on Create**: Creating `/users/user_1` with extra key `{ isAdmin: true }` -> `PERMISSION_DENIED`.
6. **Self-Assigned Privilege Escalation on Create**: Standard user creating `/users/user_1` with `{ memberTier: 'Diamond', novaPoints: 999999 }` -> `PERMISSION_DENIED`.
7. **Timestamp Forgery on Create**: Creating `/users/user_1` with past/future `createdAt` != `request.time` -> `PERMISSION_DENIED`.
8. **Shadow Field Injection on Update**: Updating `/users/user_1` with `{ role: 'superadmin' }` -> `PERMISSION_DENIED`.
9. **Tier Escalation on Update**: Updating `/users/user_1` changing `memberTier` from `'Bronze'` to `'Diamond'` -> `PERMISSION_DENIED`.
10. **Immutable `createdAt` Tampering on Update**: Updating `/users/user_1` with modified `createdAt` -> `PERMISSION_DENIED`.
11. **Value Poisoning on Update**: Updating `/users/user_1` with `fullName` of length 500 (exceeds maxLength 100) or invalid `phone` regex -> `PERMISSION_DENIED`.
12. **Insufficient Payment State Shortcutting (`status: 'PAID'` when `transferredAmount < expectedAmount`)**: Updating `/users/user_1/paymentTransactions/DH123456` with `{ status: 'PAID', transferredAmount: 4000, expectedAmount: 10000 }` -> `PERMISSION_DENIED`.
