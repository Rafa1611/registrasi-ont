# 🔧 Fix: postMessage Error di Browser

## ❌ Error
```
Failed to execute 'postMessage' on 'Window': Request object could not be cloned
```

## ✅ Root Cause
File `index.html` mengandung **3 external scripts** dari Emergent platform yang menyebabkan konflik:
1. `emergent-main.js` - Emergent platform script
2. `debug-monitor.js` - Visual editor script
3. PostHog analytics - Session recording

Scripts ini **tidak dibutuhkan** untuk deployment production di server lokal.

## 🔧 Fix Applied

File sudah diperbaiki! Semua external scripts sudah dihapus.

---

## 🚀 Cara Update di Server Lokal Anda

### Step 1: Pull Latest Changes dari GitHub

```bash
cd ~/registrasi-ont

# Pull latest code
git pull origin main
```

### Step 2: Rebuild Frontend

```bash
cd ~/registrasi-ont/frontend

# Rebuild
yarn build
```

### Step 3: Restart Frontend Service

```bash
# Restart service
sudo systemctl restart rafa-hotspot-frontend

# Check status
sudo systemctl status rafa-hotspot-frontend
```

### Step 4: Clear Browser Cache

Di browser:
1. Tekan `Ctrl + Shift + Delete` (atau `Cmd + Shift + Delete` di Mac)
2. Pilih "Cached images and files"
3. Clear data

Atau lebih mudah: **Hard refresh** dengan `Ctrl + Shift + R`

### Step 5: Test Aplikasi

```bash
# Buka browser dengan URL yang sama
http://[IP-CONTAINER]:3000
```

Login dengan: `admin` / `admin123`

---

## 🔍 Manual Fix (Jika Git Pull Tidak Tersedia)

Jika Anda tidak bisa pull dari GitHub, edit manual:

```bash
cd ~/registrasi-ont/frontend/public
nano index.html
```

**Hapus 3 blok berikut:**

1. **Line ~26** - Hapus script emergent-main.js:
```html
<script src="https://assets.emergent.sh/scripts/emergent-main.js"></script>
```

2. **Line ~30-48** - Hapus seluruh blok script debug-monitor:
```html
<script>
    // Only load visual edit scripts when inside an iframe
    if (window.self !== window.top) {
        ...
    }
</script>
```

3. **Line ~64-179** - Hapus seluruh badge "Made with Emergent" dan PostHog script:
```html
<a id="emergent-badge" ...>...</a>
<script>
    !(function (t, e) {
        ...
    })(...);
    posthog.init(...);
</script>
```

Save file (`Ctrl+O`, `Enter`, `Ctrl+X`)

**Rebuild:**
```bash
cd ~/registrasi-ont/frontend
yarn build
sudo systemctl restart rafa-hotspot-frontend
```

---

## ✅ Verification

Setelah fix, error `postMessage` tidak akan muncul lagi.

Cek di browser console (`F12` → Console), seharusnya bersih tanpa error.

---

## 📋 What Was Removed

| Item | Purpose | Why Removed |
|------|---------|-------------|
| emergent-main.js | Emergent platform integration | Not needed for self-hosted |
| debug-monitor.js | Visual editor for Emergent UI | Development only |
| PostHog analytics | Session recording & analytics | Privacy & performance |
| Emergent badge | "Made with Emergent" badge | Branding |

---

## 🎯 Result

- ✅ No more postMessage errors
- ✅ Faster page load (no external scripts)
- ✅ Better privacy (no analytics tracking)
- ✅ Cleaner console logs
- ✅ Production-ready HTML

---

Error sudah fixed! Silakan update di server Anda.
