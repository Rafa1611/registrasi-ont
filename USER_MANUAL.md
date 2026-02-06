# 📖 Panduan Pengguna - Huawei OLT Management System

## Daftar Isi
1. [Pengenalan](#pengenalan)
2. [Dashboard Utama](#dashboard-utama)
3. [Management Device](#management-device)
4. [Konfigurasi OLT](#konfigurasi-olt)
5. [Management ONT](#management-ont)
6. [Terminal Console](#terminal-console)
7. [Tips & Trik](#tips-dan-trik)
8. [FAQ](#faq)

## Pengenalan

Huawei OLT Management System adalah platform berbasis web untuk mengelola perangkat OLT Huawei dengan support GPON dan EPON. Sistem ini menyediakan interface yang user-friendly untuk:

- Mengelola multiple OLT devices
- Konfigurasi VLAN dan service flows
- Register dan monitor ONT devices
- Execute commands via terminal
- Import/export konfigurasi

## Dashboard Utama

### Halaman Utama
Ketika pertama kali membuka aplikasi, Anda akan melihat:

1. **Header Bar**: Judul aplikasi dan deskripsi sistem
2. **Statistics Cards**: 
   - Total Devices: Jumlah OLT yang terdaftar
   - Connected: Device yang sedang terhubung
   - Active ONTs: Jumlah ONT yang online
   - System Status: Status sistem secara keseluruhan

3. **Tab Navigation**:
   - Devices: Management OLT devices
   - Configuration: Konfigurasi parameters
   - ONT Management: Register dan kelola ONT
   - Terminal: Command line interface

## Management Device

### Menambah Device Baru

**Langkah-langkah:**

1. Klik tab **"Devices"**
2. Klik tombol **"Tambah Device"** di pojok kanan atas
3. Dialog form akan muncul, isi informasi berikut:

   **Field yang wajib diisi:**
   - **Nama Device**: Nama identifier untuk OLT (contoh: "OLT Cabang Jakarta")
   - **IP Address**: IP address OLT device (contoh: "10.11.104.2")
   - **Port**: Port telnet (default: 23)
   - **Username**: Username untuk login ke OLT
   - **Password**: Password untuk autentikasi
   
   **Field opsional:**
   - **Identifier**: Keterangan tambahan (contoh: "Base Station A")

4. Klik **"Tambah Device"**
5. Device akan muncul di list

### Connect ke OLT Device

**Untuk menghubungkan device:**

1. Cari device di list
2. Klik tombol **"Connect"** (icon Power dengan warna hijau)
3. Tunggu beberapa detik
4. Status akan berubah dari "Offline" menjadi "Connected"
5. Badge hijau dengan tanda centang akan muncul

**Indikator koneksi:**
- 🟢 **Connected**: Device terhubung dan siap digunakan
- ⚪ **Offline**: Device belum terhubung

### Edit Device

**Untuk mengubah informasi device:**

1. Cari device yang ingin diedit
2. Klik tombol **Edit** (icon pensil)
3. Update informasi yang diperlukan
4. Klik **"Update Device"**

### Hapus Device

**Untuk menghapus device:**

1. Cari device yang ingin dihapus
2. Klik tombol **Delete** (icon tempat sampah merah)
3. Konfirmasi penghapusan
4. Device dan semua data terkait (konfigurasi, ONT, logs) akan terhapus

⚠️ **Peringatan**: Penghapusan bersifat permanen dan tidak dapat di-undo!

## Konfigurasi OLT

### Tab Dasar (Basic)

Konfigurasi fundamental untuk OLT device.

**Parameter:**

1. **Frame**: Nomor frame (default: 0)
2. **Board**: Nomor board/slot (default: 1)
3. **Port**: Nomor port (default: 3)
4. **Service Board**: Board untuk service (format: 0/1)
5. **Start Number**: Nomor awal untuk ONT ID
6. **Registration Rule**: Format registration code
   - Format: `0-(B)-(P)-(O)`
   - (B) = Board, (P) = Port, (O) = ONT ID
   - Contoh hasil: `0-1-3-1`
7. **GEM Port**: Port gemport (comma-separated, contoh: "1,2,3")
8. **Period**: Interval dalam menit (default: 1.0)

### Tab VLAN

Konfigurasi VLAN untuk services.

**VLAN Types:**

1. **Service VLAN**:
   - **Outer VLAN**: VLAN tag untuk upstream (default: 41)
   - **Inner VLAN**: VLAN tag untuk ONT side (default: 41)

2. **VOD (Video on Demand) VLAN**:
   - **Outer VLAN**: VLAN untuk IPTV upstream (default: 42)
   - **Inner VLAN**: VLAN untuk ONT IPTV (default: 42)

3. **Multicast VLAN**: VLAN untuk multicast traffic (default: 69)

4. **Increment/Decrement Values**:
   - **Increment**: Nilai yang bertambah otomatis (default: 100)
   - **Decrement**: Nilai yang berkurang otomatis (default: 100)

### Tab Templates

Command templates untuk GPON dan EPON.

**GPON Templates:**

1. **Line Template**: ID template line profile
2. **Service Template**: ID template service profile
3. **Default Command**: Command untuk native VLAN configuration
   ```
   Contoh:
   ont port native-vlan 0/1/3 1 eth 1 vlan 41 priority 1
   ```

4. **Service Flow**: Command untuk service port
   ```
   Contoh:
   service-port vlan 41 gpon 0/1/3 ont 1 gemport 1 multi-service user-vlan 41
   ```

**EPON Templates:**

1. **Line Template**: ID template line profile EPON
2. **Service Template**: ID template service profile EPON
3. **Default Command**: EPON native VLAN command
4. **Service Flow**: EPON service port command

### Tab Advanced

Feature toggles dan BTV service.

**Switches:**

1. ✅ **Enable Logging**: Aktifkan sistem logging
2. ✅ **Auto Reconnect**: Reconnect otomatis jika koneksi putus
3. ✅ **Auto Registration**: ONT auto-register
4. ⬜ **Enable IPTV**: Aktifkan IPTV service
5. ✅ **Auto Migration**: Migrasi otomatis
6. ⬜ **Special System Support**: Support untuk sistem khusus

**BTV Service Command:**
Command untuk BTV/IPTV configuration:
```
btv
igmp user add smart-vlan 42
multicast-vlan 69
igmp multicast-vlan member smart-vlan 42
quit
```

### Menyimpan Konfigurasi

1. Setelah mengubah parameter di tab manapun
2. Klik tombol **"Simpan"** di pojok kanan atas
3. Notifikasi success akan muncul
4. Konfigurasi tersimpan di database

### Import/Export Config

**Export Konfigurasi:**

1. Klik tombol **"Export"**
2. File `config_{device_name}.ini` akan didownload
3. File berisi semua parameter dalam format INI

**Import Konfigurasi:**

1. Klik tombol **"Import"**
2. Pilih file config.ini dari komputer
3. System akan parse dan update konfigurasi
4. Konfirmasi akan muncul setelah sukses

**Format file .ini:**
```ini
[OLT]
ip_address=10.11.104.2
port=23
username=root
password=yourpassword

[Basic]
frame=0
board=1
port=3
...
```

## Management ONT

### Register ONT Baru

**Langkah-langkah:**

1. Klik tab **"ONT Management"**
2. Pastikan device sudah dipilih
3. Klik tombol **"Register ONT"**
4. Isi form dengan informasi:
   
   **Required Fields:**
   - **ONT ID**: ID unik untuk ONT (contoh: 1, 2, 3...)
   - **Serial Number**: Serial number ONT (contoh: "HWTC12345678")
   - **Frame**: Nomor frame
   - **Board**: Nomor board
   - **Port**: Nomor port
   - **VLAN**: VLAN ID untuk ONT

5. Klik **"Register ONT"**
6. ONT akan terdaftar dengan registration code otomatis

**Registration Code:**
System otomatis generate code berdasarkan rule yang dikonfigurasi.
- Contoh rule: `0-(B)-(P)-(O)`
- Jika Board=1, Port=3, ONT ID=1
- Hasil: `0-1-3-1`

### Melihat List ONT

Tabel ONT menampilkan:

| Column | Description |
|--------|-------------|
| ONT ID | ID unik ONT |
| Serial Number | Serial number device |
| Registration Code | Code yang digenerate system |
| Frame/Board/Port | Lokasi fisik ONT |
| VLAN | VLAN assignment |
| Status | Status ONT (registered/online/offline) |
| Actions | Tombol delete |

### Status ONT

- 🟡 **Registered**: ONT terdaftar tapi belum online
- 🟢 **Online**: ONT aktif dan terhubung
- 🔴 **Offline**: ONT tidak terhubung

### Hapus ONT

1. Cari ONT di tabel
2. Klik tombol **Delete** (icon tempat sampah merah)
3. Konfirmasi penghapusan
4. ONT akan dihapus dari database

## Terminal Console

### Menggunakan Terminal

**Akses Terminal:**

1. Klik tab **"Terminal"**
2. Pastikan device sudah **Connected**
3. Terminal akan menampilkan prompt hijau dengan informasi device

**Execute Command:**

1. Ketik command di input box (dengan prefix "$")
2. Tekan **Enter** atau klik tombol **"Send"**
3. Response akan muncul di terminal output
4. Status success/error akan ditampilkan

**Command History:**

- Tekan **↑ (Arrow Up)**: Command sebelumnya
- Tekan **↓ (Arrow Down)**: Command sesudahnya
- History tersimpan per session

### Quick Commands

Tombol shortcut untuk command yang sering digunakan:

1. **display ont info 0 all**: Info semua ONT
2. **display board 0**: Info board
3. **display version**: Versi OLT
4. **display current-configuration**: Config aktif
5. **display service-port**: List service ports

Klik tombol untuk auto-fill command di input.

### Terminal Output

**Format Output:**

```
[08:20:42] success
$ display board 0
SlotID  BoardName  Status          
----------------------------------------
0       H801SCUN   Normal          
1       H801GPBD   Normal          

_
```

**Color Coding:**
- 🟢 **Hijau**: Prompt dan cursor
- 🔵 **Biru**: Command yang diexecute
- ⚪ **Putih**: Response output
- 🟢 **Green Badge**: Success status
- 🔴 **Red Badge**: Error status

### Export Logs

**Cara export command logs:**

1. Klik tombol **"Export Logs"**
2. File `.txt` akan didownload
3. File berisi semua command dan response dengan timestamp

**Format log file:**
```
[06/02/2025, 08:20:42] SUCCESS
Command: display board 0
Response: SlotID  BoardName  Status...

---
```

### Clear Logs

**Menghapus semua logs:**

1. Klik tombol **"Clear Logs"**
2. Konfirmasi penghapusan
3. Terminal logs akan dikosongkan

⚠️ **Note**: Clear logs bersifat permanen per device

## Tips dan Trik

### 💡 Best Practices

1. **Sebelum Connect:**
   - Pastikan IP address dan credentials benar
   - Test koneksi network terlebih dahulu
   - Verify firewall tidak blocking port 23

2. **Saat Konfigurasi:**
   - Backup config sebelum perubahan besar
   - Export config secara berkala
   - Dokumentasikan perubahan

3. **Management ONT:**
   - Gunakan naming convention untuk serial number
   - Keep track ONT ID assignment
   - Regular monitoring status ONT

4. **Terminal Usage:**
   - Gunakan Quick Commands untuk efisiensi
   - Export logs sebelum clear
   - Use command history (↑↓) untuk re-run commands

### ⚡ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| ↑ | Previous command |
| ↓ | Next command |
| Enter | Execute command |
| Esc | Clear input (custom) |

### 🔍 Troubleshooting Quick Fixes

**Problem: Device tidak bisa connect**
- ✅ Check IP address benar
- ✅ Verify port 23 open
- ✅ Test credentials
- ✅ Check network connectivity

**Problem: Terminal tidak menampilkan response**
- ✅ Verify device status "Connected"
- ✅ Try reconnect device
- ✅ Check command syntax
- ✅ Review logs untuk errors

**Problem: Config import gagal**
- ✅ Check file format (.ini)
- ✅ Verify file encoding (UTF-8)
- ✅ Review INI structure
- ✅ Check for special characters

## FAQ

### Q: Berapa banyak device yang bisa dikelola?
**A:** Tidak ada limit hard-coded. System dapat mengelola multiple devices tergantung resource server.

### Q: Apakah password tersimpan encrypted?
**A:** Saat ini password tersimpan plain text. Untuk production, disarankan implementasi encryption.

### Q: Bagaimana cara backup database?
**A:** MongoDB database dapat dibackup dengan command:
```bash
mongodump --db olt_management --out /backup/directory
```

### Q: Apakah support OLT selain Huawei?
**A:** Saat ini system didesain untuk Huawei OLT. Support vendor lain dapat dikembangkan.

### Q: Bagaimana cara update aplikasi?
**A:** 
```bash
git pull origin main
sudo supervisorctl restart all
```

### Q: Apakah ada API documentation?
**A:** API endpoints terdokumentasi di README.md. Swagger/OpenAPI documentation dalam roadmap.

### Q: Bagaimana cara setup multi-user?
**A:** Multi-user authentication belum tersedia. Feature ini ada di roadmap v1.1.

### Q: Apakah bisa diakses dari mobile?
**A:** Interface responsive dan dapat diakses dari mobile browser. Native mobile app dalam roadmap v1.2.

### Q: Bagaimana cara monitoring performance?
**A:** Performance monitoring tools belum built-in. Dapat menggunakan external tools seperti Prometheus/Grafana.

### Q: Apakah support IPv6?
**A:** Saat ini support IPv4. IPv6 support dapat ditambahkan jika diperlukan.

---

## 📞 Support & Kontak

Jika Anda memiliki pertanyaan atau butuh bantuan:

1. **Technical Issues**: Create issue di repository
2. **Feature Requests**: Submit di GitHub Issues
3. **Documentation**: Refer to README.md
4. **Community**: Join discussion forum

## 📚 Resource Tambahan

- [Huawei OLT Command Reference](https://support.huawei.com/)
- [GPON Technology Overview](https://en.wikipedia.org/wiki/Passive_optical_network)
- [VLAN Configuration Guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3750/software/release/12-2_55_se/configuration/guide/scg3750/swvlan.html)

---

**Version:** 1.0.0  
**Last Updated:** Februari 2025  
**© 2025 Huawei OLT Management System**
