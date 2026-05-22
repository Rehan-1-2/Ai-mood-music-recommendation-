# Security Specification - AI Mood Music Recommender

## 1. Data Invariants
- A `Favorite` cannot exist without a valid user ID.
- A `MoodEntry` (History) cannot exist without a valid user ID.
- Users can only read and write their own data.
- System-generated fields like `joinDate` and `email` in the user profile are immutable after creation.
- Points and level progress are validated to be positive.

## 2. The "Dirty Dozen" Payloads (Red Team Attack Vectors)
1. **Identity Spoofing**: Attempt to create a user profile with a different `userId`.
2. **PII Leak**: Attempt to read another user's email via a list query.
3. **Point Injection**: Attempt to set `points` to 999999 manually.
4. **ID Poisoning**: Use a 2KB string as a `favoriteId` or `historyId`.
5. **Orphaned Write**: Create a favorite for a user who hasn't registered a profile yet.
6. **Immutable Override**: Attempt to change `joinDate` in a user profile.
7. **Shadow Field**: Add `isAdmin: true` to a user profile update.
8. **Status Shortcut**: (N/A for this app, but relevant for state machines).
9. **Denial of Wallet**: Flood subcollections with thousands of entries in a single batch.
10. **Query Scrape**: Use `getDocs(collection(db, 'users'))` to find all emails.
11. **Timestamp Spoofing**: Send a client-side timestamp for `timestamp` instead of server time (though we use numeric seconds since epoch here for simplicity, we should harden).
12. **Type Poisoning**: Set `points` to a string instead of a number.

## 3. Test Runner Results
- [PASS] Identity Spoofing -> PERMISSION_DENIED
- [PASS] PII Leak -> PERMISSION_DENIED
- [PASS] Point Injection -> PERMISSION_DENIED
- [PASS] ID Poisoning -> PERMISSION_DENIED
- [PASS] Immutable Override -> PERMISSION_DENIED
- [PASS] Query Scrape -> PERMISSION_DENIED
