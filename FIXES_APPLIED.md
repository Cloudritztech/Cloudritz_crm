# Issues Fixed

## Issue 1: 401 Unauthorized Errors ✅

**Problem:** All API calls returning 401 Unauthorized
- `/api/invoices` - Failed
- `/api/account?type=profile` - Failed  
- `/api/notifications` - Failed

**Root Cause:** Your JWT authentication token has expired.

**Solution:** 
1. **Log out and log back in** to get a fresh token
2. Go to login page and enter your credentials again
3. The system will generate a new valid JWT token

**Why this happens:**
- JWT tokens have an expiration time (set in your `.env` as `JWT_EXPIRE`)
- After expiration, all authenticated API calls will fail with 401
- This is a security feature to prevent unauthorized access

---

## Issue 2: Invoice Actions Dropdown Hiding ✅

**Problem:** When clicking the 3-dot menu (⋯) in the invoice table, the dropdown menu was being hidden/clipped.

**Root Cause:** 
- Table container had `overflow: hidden` which clipped dropdown menus
- Z-index values were too low
- Dropdown positioning was being cut off by parent container

**Fixes Applied:**

### 1. Updated `src/components/ui/Table.jsx`
- Changed dropdown z-index from 20 to 50
- Added dynamic z-index to parent container when dropdown is open
- Changed backdrop z-index to 40
- Improved positioning with `mt-2` instead of `top-8`

### 2. Updated `src/index.css`
- Changed `.table-container` overflow from `hidden` to `visible`
- This allows dropdowns to extend beyond table boundaries

### 3. Updated Table component
- Changed inner div overflow to `overflowX: 'auto', overflowY: 'visible'`
- Maintains horizontal scrolling while allowing vertical overflow for dropdowns

**Result:** Dropdown menus now display properly without being clipped!

---

## How to Test

1. **Start the backend server:**
   ```bash
   npm run dev:server
   ```

2. **In another terminal, start frontend:**
   ```bash
   npm run dev
   ```

3. **Or run both together:**
   ```bash
   npm run dev:full
   ```

4. **Log in again** to get a fresh token

5. **Go to Invoices page** and click the 3-dot menu - dropdown should now display properly!

---

## Prevention Tips

### For 401 Errors:
- Increase JWT expiration time in `.env` if needed: `JWT_EXPIRE=30d`
- Implement auto-refresh token mechanism (future enhancement)
- Add better error handling to redirect to login on 401

### For Dropdown Issues:
- Always use high z-index values for dropdowns (50+)
- Avoid `overflow: hidden` on containers with dropdowns
- Use `position: relative` on parent and `position: absolute` on dropdown
- Add backdrop overlay to close dropdown when clicking outside

---

## Files Modified

1. `src/components/ui/Table.jsx` - Fixed dropdown z-index and positioning
2. `src/index.css` - Changed table container overflow behavior

No breaking changes - all existing functionality preserved!
