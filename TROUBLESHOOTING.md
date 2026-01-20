# Troubleshooting: "Property 'sendSwitch' does not exist"

Jika Anda mendapatkan error `Property 'sendSwitch' does not exist on type 'typeof esp8266'`, ini biasanya terjadi karena:

## ✅ Solusi:

### 1. **Reload Extension di MakeCode**
   - Buka MakeCode editor
   - Hapus extension PMJ ESP8266
   - Tambahkan lagi: `https://github.com/emRival/PMJ-esp8266`
   - Tunggu sampai selesai loading

### 2. **Clear Browser Cache**
   - Tekan `Ctrl+Shift+R` (Windows/Linux)
   - Tekan `Cmd+Shift+R` (Mac)
   - Atau clear cache manual di browser settings

### 3. **Verifikasi Fungsi Ada**
   Cek di kategori **Firebase** di block editor, harus ada:
   - ✅ `send Switch to Firebase`
   - ✅ `send Dimmer to Firebase`
   - ✅ `send Sensor to Firebase`

### 4. **Gunakan Versi Terbaru**
   Pastikan menggunakan commit terbaru:
   ```
   Commit: 380349a
   ```

## 📝 Contoh Penggunaan yang Benar:

```typescript
// ✅ BENAR
esp8266.sendSwitch("/iot", "lampu", 1)
esp8266.sendDimmer("/iot", "kipas", 512, 1024)
esp8266.sendSensor("/iot", "suhu", 25, 100, "C")

// ❌ SALAH (fungsi lama yang sudah deprecated)
esp8266.addSwitchToMultiJSON(...)  // Jangan pakai ini
```

## 🔍 Jika Masih Error:

1. **Check file `firebase.ts`** - Pastikan ada fungsi:
   - `export function sendSwitch(...)`
   - `export function sendDimmer(...)`
   - `export function sendSensor(...)`

2. **Check `pxt.json`** - Pastikan `firebase.ts` ada di array `files`

3. **Restart MakeCode** - Tutup tab dan buka lagi

## 💡 Alternative: Gunakan STARTER_TEMPLATE.ts

Jika masih ada masalah, copy code dari `STARTER_TEMPLATE.ts` yang sudah terbukti working!

---

**Last Updated:** 2026-01-20  
**Commit:** 380349a
