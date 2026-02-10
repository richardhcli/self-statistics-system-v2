## features-debug -  Migration History

### February 1, 2026 - Fixed Getter Method Violations

**Problem:** Debug utilities were calling non-existent getter methods:
```typescript
useJournalStore.getState().getEntries()  // ❌ Caused TypeError
```

**Root Cause:** Stores had getter methods in actions object, violating the Separated Selector Facade Pattern.

**Solution:** Removed all getter methods from stores. Updated all serialization APIs to access data properties directly:
```typescript
useJournalStore.getState().entries  // ✅ Direct access
```

**Files Fixed:**
- `src/stores/journal/api/journal.ts`
- `src/stores/player-statistics/api/stats.ts`
- `src/stores/user-information/index.ts`
- `src/stores/user-integrations/index.ts`
- `src/stores/ai-config/index.ts`

**Stores Updated:**
- All stores now have only data and actions properties
- No getter methods exist anywhere
- Serialization uses direct property access

