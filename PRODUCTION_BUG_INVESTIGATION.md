# Production Bug Investigation: 403 Infinite Loop

## 🚨 Bug Report Summary

**Production Issue**: Users experience infinite API loops and rate limiting when accessing Groups page
- **URL**: https://console.redhat.com/iam/user-access/groups  
- **User Profile**: Member of org with **lots of groups** but **no permission** to view/edit them
- **Symptoms**: Notification spam + rate limiting affecting entire console domain

## 🔬 Investigation Approach

### Test Infrastructure Created

1. **Enhanced Production Bug Test** (`ProductionBugReproduction`)
   - Simulates user with org membership but no groups permissions
   - Mocks organization with 573 groups  
   - Monitors for rate limiting patterns (API calls < 100ms apart)
   - Tracks timestamps to detect infinite loops

2. **Original JS Comparison Test** (`OriginalApiError403Loop`)  
   - Tests original JavaScript implementation from master
   - Same conditions as enhanced test for comparison
   - Helps determine if bug was introduced or fixed during TS conversion

### Test Conditions Simulated

```typescript
permissions: { 
  orgAdmin: false,                    // No groups admin access
  userAccessAdministrator: false,     // No groups management access  
  isOrgUser: true,                    // But IS org member
  canViewSomeResources: true          // Has other permissions
}

// MSW Handler simulates:
// - 403 Forbidden responses
// - Metadata indicating 573 groups in org
// - Partial permission state
```

## 📊 Test Results

### ✅ Both Implementations Handle 403 Correctly

1. **Current TypeScript Implementation**: ✅ PASS
   - Shows appropriate empty state
   - Makes exactly 3 API calls (expected pattern)
   - No infinite loops detected
   - No rate limiting patterns found

2. **Original JavaScript Implementation**: ✅ PASS  
   - Same behavior as TypeScript version
   - Proper error handling
   - No additional API calls after initial load

### 🤔 Investigation Conclusions

**The basic 403 error handling works correctly in both implementations.**

This suggests the production bug occurs under more specific conditions:

## 🎯 Potential Bug Triggers (Not Yet Reproduced)

1. **User Interaction Triggers**
   - Filtering while receiving 403s
   - Pagination attempts during error state
   - Sorting operations triggering retry loops

2. **Redux State Race Conditions**
   - Component re-renders during error states
   - State transitions between loading/error states
   - Multiple concurrent Redux actions

3. **TableToolbarView Specific Issues**  
   - Original uses deprecated `TableToolbarView` component
   - May have built-in retry logic not present in new DataView

4. **Environment-Specific Conditions**
   - Production-only middleware behavior
   - Network timing/latency differences
   - Specific browser/session states

## 🔧 Recommendations

### 1. Enhanced Interaction Testing
```typescript
// Test pagination + 403 combination
// Test filtering + 403 combination  
// Test sorting + 403 combination
```

### 2. Redux Action Monitoring
```typescript
// Monitor for action storms during 403 states
// Check for retry logic in Redux middleware
// Verify error boundary behavior
```

### 3. Production Telemetry  
```typescript
// Add API call frequency monitoring
// Track Redux action sequences during errors
// Monitor notification generation patterns
```

### 4. Component-Specific Investigation
- Focus on `TableToolbarView` vs `DataView` differences
- Check pagination component retry logic
- Verify filter/sort interaction handling

## 🛡️ Current Protection

The enhanced test provides:
- ✅ Baseline verification that basic 403 handling works
- ✅ Rate limiting pattern detection  
- ✅ Regression prevention for future changes
- ✅ Framework for reproducing complex interaction scenarios

## 🔍 Next Investigation Steps

1. **Extend interaction testing** with user actions during 403 states
2. **Add Redux action sequence monitoring** during error conditions
3. **Test production-specific middleware behavior** 
4. **Compare TableToolbarView vs DataView error handling**

The test infrastructure is now in place to catch this bug when we identify the specific trigger conditions!
