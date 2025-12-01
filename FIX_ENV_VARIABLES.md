# 🔧 Fix: Cloudinary Configuration Missing

## ❌ Error Message
```
Cloudinary configuration missing. Check your .env file.
```

## ✅ Solution

### Step 1: Verify .env File

Your `.env` file should have these lines:

```env
VITE_CLOUDINARY_CLOUD_NAME=diso5mtgn
VITE_CLOUDINARY_UPLOAD_PRESET=anvi-tiles
```

**Important:** 
- Variable names MUST start with `VITE_` for Vite to expose them to frontend
- No spaces around `=`
- No quotes needed

### Step 2: Restart Development Server

**CRITICAL:** Vite only loads environment variables on startup!

```bash
# Stop the current dev server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 3: Verify Variables Are Loaded

Open browser console and run:

```javascript
console.log('Cloud Name:', import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);
console.log('Upload Preset:', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
```

**Expected Output:**
```
Cloud Name: diso5mtgn
Upload Preset: anvi-tiles
```

**If you see `undefined`:**
- Server was not restarted after adding variables
- Variable names don't start with `VITE_`
- `.env` file is not in project root

### Step 4: Test Upload

1. Go to Business Profile page
2. Click "Click to upload logo"
3. Select an image
4. Should see "Uploading to Cloudinary..." message
5. Image preview should appear

---

## 🐛 Common Issues

### Issue 1: Variables Show as `undefined`

**Cause:** Server not restarted after adding variables

**Fix:**
```bash
# Kill all node processes
taskkill /F /IM node.exe

# Restart dev server
npm run dev
```

### Issue 2: Still Getting Error After Restart

**Cause:** `.env` file location or syntax error

**Fix:**
```bash
# Check .env file exists in root
dir .env

# Check file content
type .env
```

Should show:
```
VITE_CLOUDINARY_CLOUD_NAME=diso5mtgn
VITE_CLOUDINARY_UPLOAD_PRESET=anvi-tiles
```

### Issue 3: Works in Dev but Not in Production

**Cause:** Environment variables not set in Vercel

**Fix:**
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   - `VITE_CLOUDINARY_CLOUD_NAME` = `diso5mtgn`
   - `VITE_CLOUDINARY_UPLOAD_PRESET` = `anvi-tiles`
5. Redeploy

---

## 📝 Complete .env File

```env
VITE_API_URL=/api

# Cloudinary Configuration (Frontend)
VITE_CLOUDINARY_CLOUD_NAME=diso5mtgn
VITE_CLOUDINARY_UPLOAD_PRESET=anvi-tiles

# Backend Environment Variables
MONGODB_URI=mongodb+srv://singhaditya8052_db_user:Aditya8892@cluster0.h42azqe.mongodb.net/anvi_crm
JWT_SECRET=59582354854624850585425984862485
JWT_EXPIRE=7000d
NODE_ENV=development
```

---

## ✅ Verification Checklist

- [ ] `.env` file is in project root (same level as `package.json`)
- [ ] Variables start with `VITE_`
- [ ] No syntax errors in `.env` file
- [ ] Development server restarted after adding variables
- [ ] Browser console shows correct values
- [ ] Upload shows "Uploading to Cloudinary..." message
- [ ] Image preview appears after upload

---

## 🚀 Quick Fix Commands

```bash
# 1. Stop server
# Press Ctrl+C in terminal

# 2. Verify .env file
type .env

# 3. Restart server
npm run dev

# 4. Test in browser console
# Open DevTools (F12) → Console → Run:
console.log(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME)
```

---

## 🎯 Expected Behavior

**Before Upload:**
- File input shows "Click to upload logo"

**During Upload:**
- Shows "Uploading to Cloudinary..." with spinner
- Console shows: "📤 Uploading to Cloudinary..."

**After Upload:**
- Console shows: "✅ Upload successful: https://res.cloudinary.com/..."
- Image preview appears
- Toast notification: "Logo uploaded successfully!"

---

## 📞 Still Not Working?

1. **Check Cloudinary Dashboard:**
   - Go to https://cloudinary.com/console
   - Verify Cloud Name is `diso5mtgn`
   - Check Upload Preset `anvi-tiles` exists and is "Unsigned"

2. **Check Browser Console:**
   - Look for any CORS errors
   - Check network tab for failed requests
   - Verify environment variables are loaded

3. **Check File:**
   - File must be PNG, JPG, JPEG, or WebP
   - File must be under 5MB
   - File must be a valid image

---

**✅ After following these steps, your Cloudinary upload should work perfectly!**