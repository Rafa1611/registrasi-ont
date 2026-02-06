# 📋 Output Command Registrasi ONT - Huawei OLT

Dokumen ini menjelaskan command CLI yang di-generate oleh sistem saat registrasi ONT (manual & otomatis).

---

## 📌 Scenario 1: Registrasi Manual - Single Service (Internet Only)

### Input dari User:
```
ONT ID           : 10
Serial Number    : 48575443E39049AE
Frame/Board/Port : 0/2/10
Line Profile     : 100
Service Profile  : 100
GEM Port         : 1
VLAN             : 41
Description      : Rama - Jl. Sudirman 45
```

### Command yang Di-generate:

#### ✅ Command 1: ONT Registration
```bash
ont add 0/2/10 10 sn-auth "48575443E39049AE" omci ont-lineprofile-id 100 ont-srvprofile-id 100 desc "Rama - Jl. Sudirman 45"
```

#### ✅ Command 2: Service Port Configuration (Internet)
```bash
service-port 1 vlan 41 gpon 0/2/10 ont 10 gemport 1 multi-service user-vlan 41 tag-transform translate
```

**Keterangan:**
- 1 ONT dengan 1 service (Internet saja)
- VLAN 41 untuk layanan Internet
- Service-port index dimulai dari 1 (auto-increment)

---

## 📌 Scenario 2: Registrasi Manual - Multi Service (Internet + IPTV + VoIP)

### Input dari User:
```
ONT ID           : 15
Serial Number    : 48575443AABBCCDD
Frame/Board/Port : 0/3/5
Line Profile     : 100
Service Profile  : 100
GEM Port         : 1,2,3
VLAN             : 41,42,50
Description      : Budi - Jl. Merdeka 123
```

### Command yang Di-generate:

#### ✅ Command 1: ONT Registration
```bash
ont add 0/3/5 15 sn-auth "48575443AABBCCDD" omci ont-lineprofile-id 100 ont-srvprofile-id 100 desc "Budi - Jl. Merdeka 123"
```

#### ✅ Command 2: Service Port - Internet (GEM 1, VLAN 41)
```bash
service-port 2 vlan 41 gpon 0/3/5 ont 15 gemport 1 multi-service user-vlan 41 tag-transform translate
```

#### ✅ Command 3: Service Port - IPTV (GEM 2, VLAN 42)
```bash
service-port 3 vlan 42 gpon 0/3/5 ont 15 gemport 2 multi-service user-vlan 42 tag-transform translate
```

#### ✅ Command 4: Service Port - VoIP (GEM 3, VLAN 50)
```bash
service-port 4 vlan 50 gpon 0/3/5 ont 15 gemport 3 multi-service user-vlan 50 tag-transform translate
```

**Keterangan:**
- 1 ONT dengan 3 service (Internet + IPTV + VoIP)
- GEM Port dan VLAN di-mapping 1-to-1:
  - GEM 1 → VLAN 41 (Internet)
  - GEM 2 → VLAN 42 (IPTV)
  - GEM 3 → VLAN 50 (VoIP)
- Service-port index auto-increment (2, 3, 4)

---

## 📌 Scenario 3: Registrasi Otomatis (dari Scan ONT)

### Data Auto-Detected dari OLT:
```
ONT ID           : (Auto-detected) 8
Serial Number    : (Auto-detected) HWTC86455236
Frame/Board/Port : (Auto-detected) 0/1/3
```

### Input dari User:
```
Description      : Ani - Customer Baru
```

### Data Default dari Configuration:
```
Line Profile     : 1
Service Profile  : 1
GEM Port         : 1
VLAN             : 41
```

### Command yang Di-generate:

#### ✅ Command 1: ONT Registration
```bash
ont add 0/1/3 8 sn-auth "HWTC86455236" omci ont-lineprofile-id 1 ont-srvprofile-id 1 desc "Ani - Customer Baru"
```

#### ✅ Command 2: Service Port Configuration
```bash
service-port 5 vlan 41 gpon 0/1/3 ont 8 gemport 1 multi-service user-vlan 41 tag-transform translate
```

**Keterangan:**
- Data Frame/Board/Port, ONT ID, Serial Number diambil dari hasil scan
- Line Profile, Service Profile, VLAN menggunakan nilai default dari konfigurasi
- User hanya perlu input Description (opsional)

---

## 📚 Penjelasan Command Parameter

### 🔹 Command: `ont add`

**Format:**
```bash
ont add [frame]/[board]/[port] [ont-id] sn-auth "[serial-number]" omci \
  ont-lineprofile-id [profile-id] ont-srvprofile-id [profile-id] desc "[description]"
```

**Parameter:**

| Parameter | Keterangan | Contoh |
|-----------|------------|--------|
| `frame/board/port` | Lokasi fisik PON port di OLT | `0/2/10` |
| `ont-id` | ID unik ONT dalam 1 PON port (0-127) | `10` |
| `sn-auth` | Serial number ONT (dari label sticker) | `48575443E39049AE` |
| `ont-lineprofile-id` | Line profile untuk bandwidth, DBA, QoS | `100` |
| `ont-srvprofile-id` | Service profile untuk service type | `100` |
| `desc` | Deskripsi customer (max 30 karakter, opsional) | `"Rama - Jl. Sudirman 45"` |

---

### 🔹 Command: `service-port`

**Format:**
```bash
service-port [index] vlan [vlan-id] gpon [frame]/[board]/[port] \
  ont [ont-id] gemport [gem-id] multi-service user-vlan [vlan-id] \
  tag-transform translate
```

**Parameter:**

| Parameter | Keterangan | Contoh |
|-----------|------------|--------|
| `index` | Service-port index (auto-increment) | `1` |
| `vlan` | Outer VLAN (S-VLAN, dari OLT ke core) | `41` |
| `frame/board/port` | Sama seperti di `ont add` | `0/2/10` |
| `ont` | Sama seperti `ont-id` | `10` |
| `gemport` | GEM Port untuk service ini | `1` |
| `user-vlan` | Inner VLAN (C-VLAN, dari ONT ke OLT) | `41` |
| `tag-transform` | Method VLAN tagging | `translate` |

---

## 🎯 Mapping GEM Port & VLAN

Setiap GEM Port harus dipasangkan dengan 1 VLAN **secara berurutan**:

### ✅ Benar:
```
GEM Port: 1,2,3
VLAN:     41,42,50

Hasil:
- GEM 1 → VLAN 41 (Internet)
- GEM 2 → VLAN 42 (IPTV)
- GEM 3 → VLAN 50 (VoIP)
```

### ❌ Salah:
```
GEM Port: 1,2,3
VLAN:     50,41,42

Hasil mapping tidak sesuai urutan yang diinginkan
```

---

## 💡 Tips

1. **Description (desc)**
   - Maksimal 30 karakter
   - Gunakan untuk identifikasi customer (nama, alamat, nomor kontrak)
   - Opsional, bisa dikosongkan

2. **Service-Port Index**
   - Sistem auto-generate secara berurutan
   - Tidak perlu input manual

3. **VLAN ID**
   - Range: 1-4094
   - Hindari VLAN 1 (default VLAN)
   - Koordinasi dengan tim network untuk alokasi VLAN

4. **Multi-Service**
   - Untuk Internet + IPTV, gunakan 2 GEM Port (1,2) dan 2 VLAN (41,42)
   - Untuk Internet + IPTV + VoIP, gunakan 3 GEM Port (1,2,3) dan 3 VLAN (41,42,50)

---

## 📞 Command Tambahan (Future)

Command lain yang akan di-generate di masa depan:

### 🔸 Hapus ONT
```bash
undo ont add [frame]/[board]/[port] [ont-id]
```

### 🔸 Hapus Service-Port
```bash
undo service-port [index]
```

### 🔸 Cek Status ONT
```bash
display ont info [ont-id] [frame]/[board]/[port]
```

### 🔸 Cek Optical Power
```bash
display ont optical-info [ont-id] [frame]/[board]/[port]
```

---

**Dokumentasi ini di-generate oleh Huawei OLT Management System v1.0.0**
