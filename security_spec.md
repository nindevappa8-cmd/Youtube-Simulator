# Security Specification — YouTube Studio

## 1. Data Invariants
1. A user document `/users/{userId}` can only be read, created, updated, or deleted by the authenticated user whose `request.auth.uid == userId`.
2. Initial account creation MUST initialize `balance == 5000`, `totalEarned == 0`, `totalSpent == 0`, `lifetimeVideoEarnings == 0`, `subscribers == 0`, `totalViews == 0`, `totalVideos == 0`, `rank == "Zero"`, `tier == "No Tier"`, and empty inventory lists.
3. All `uid` and `displayId` fields and `createdAt` timestamps are immutable after document creation.
4. No user can read or list another user's `/users/{otherId}` document (PII email isolation).
5. `/globalLeaderboard/{userId}` contains zero PII (`email` is forbidden) and can only be written by the owner `request.auth.uid == userId` with a matching `/users/{userId}` profile.
6. Every video document `/users/{userId}/videos/{videoId}` requires a parent `/users/{userId}` document, `views >= 1`, `earnings >= 0`, `subscribersGained == floor(views / 10)` or valid integer, and is immutable once created (cannot be edited to inflate views/earnings).
7. Every economic balance or inventory mutation MUST accompany a valid `updatedAt == request.time` timestamp and non-negative numeric bounds.

## 2. Dirty Dozen Adversarial Payloads
1. **Unauthenticated Profile Read**: Anonymous or signed-out request reading `/users/userA`. Expected: `PERMISSION_DENIED`.
2. **Cross-User PII Read**: Signed-in `userB` calling `get(/users/userA)`. Expected: `PERMISSION_DENIED`.
3. **User Collection Enumeration**: Signed-in `userB` calling `list(/users)`. Expected: `PERMISSION_DENIED`.
4. **Shadow Field Injection on Signup**: `userA` creating `/users/userA` with extra field `isAdmin: true`. Expected: `PERMISSION_DENIED`.
5. **Inflated Starting Balance on Signup**: `userA` creating `/users/userA` with `balance: 999999` or `totalEarned: 1000000`. Expected: `PERMISSION_DENIED`.
6. **Immutable UID / CreatedAt Tampering**: `userA` updating `uid` or `createdAt` on `/users/userA`. Expected: `PERMISSION_DENIED`.
7. **Negative Balance Exploit**: `userA` updating `balance: -100`. Expected: `PERMISSION_DENIED`.
8. **Client Clock Forgery**: `userA` setting `updatedAt` to a custom past/future Date instead of `request.time`. Expected: `PERMISSION_DENIED`.
9. **ID Poisoning Attack**: `userA` writing `/users/userA/videos/<200-char-invalid-id!@#>` containing invalid characters or oversized ID. Expected: `PERMISSION_DENIED`.
10. **Zero-View / Negative-View Video Injection**: `userA` creating a video with `views: 0` or `earnings: -50`. Expected: `PERMISSION_DENIED`.
11. **Leaderboard Spoofing**: `userB` writing `/globalLeaderboard/userA` or injecting `email` PII into `/globalLeaderboard/userB`. Expected: `PERMISSION_DENIED`.
12. **Video Mutation Tampering**: `userA` updating an already-uploaded `/users/userA/videos/vid1` to increase `views`. Expected: `PERMISSION_DENIED`.
