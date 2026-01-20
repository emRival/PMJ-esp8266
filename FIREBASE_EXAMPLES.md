# Firebase Examples - PMJ ESP8266

Kumpulan contoh kode untuk menggunakan Firebase dengan ESP8266 di micro:bit.

## 📁 File Contoh

### 1. `example_firebase_simple.ts` - Untuk Pemula
Contoh paling sederhana untuk kirim data sensor ke Firebase.

**Fitur:**
- Setup WiFi dan Firebase
- Kirim data temperature & light saat tombol A ditekan
- Status indicator (✓ atau ✗)

**Cocok untuk:** Belajar dasar Firebase integration

---

### 2. `example_firebase_complete.ts` - Lengkap & Production-Ready
Contoh lengkap dengan berbagai fitur dan error handling.

**Fitur:**
- ✅ Setup dengan error handling lengkap
- ✅ 3 method kirim data (helper function, manual JSON, complex JSON)
- ✅ Multiple event handlers (Button A, B, A+B)
- ✅ Status monitoring dan auto-reconnect WiFi
- ✅ LED indicators
- ✅ Optional auto-send setiap 30 detik

**Cocok untuk:** Project production dan pembelajaran advanced

---

## 🚀 Cara Menggunakan

### Step 1: Pilih File Contoh
- **Pemula?** → Gunakan `example_firebase_simple.ts`
- **Advanced?** → Gunakan `example_firebase_complete.ts`

### Step 2: Edit Konfigurasi
Buka file dan ganti bagian ini dengan data Anda:

```typescript
// WiFi Configuration
const WIFI_SSID = "NAMA_WIFI_ANDA"          // ← Ganti ini
const WIFI_PASSWORD = "PASSWORD_WIFI_ANDA"  // ← Ganti ini

// Firebase Configuration
const FIREBASE_API_KEY = "YOUR_API_KEY"                        // ← Ganti ini
const FIREBASE_DATABASE_URL = "https://your-project.firebaseio.com"  // ← Ganti ini
const FIREBASE_PROJECT_ID = "your-project-id"                  // ← Ganti ini
```

### Step 3: Upload ke Micro:bit
1. Copy kode ke MakeCode editor
2. Download ke micro:bit
3. Pastikan ESP8266 terhubung dengan benar

### Step 4: Test
- **Simple:** Tekan tombol A untuk kirim data
- **Complete:** 
  - Tombol A = Kirim sensor data
  - Tombol B = Toggle lampu ON/OFF
  - Tombol A+B = Kirim data lengkap dengan timestamp

---

## 📊 Struktur Data di Firebase

### Simple Example
```json
{
  "sensors": {
    "microbit1": {
      "temperature": "25",
      "light": "128"
    }
  }
}
```

### Complete Example - Button A (Sensor Data)
```json
{
  "devices": {
    "microbit1": {
      "sensors": {
        "temp": "25",
        "light": "128"
      }
    }
  }
}
```

### Complete Example - Button B (Lampu Control)
```json
{
  "controls": {
    "lampu_teras": {
      "tipe": "saklar",
      "value": true,
      "device": "microbit1"
    }
  }
}
```

### Complete Example - Button A+B (Data Lengkap)
```json
{
  "logs": {
    "microbit1": {
      "device_id": "microbit1",
      "sensors": {
        "temperature": 25,
        "light": 128,
        "compass": 180
      },
      "status": {
        "lampu": true,
        "online": true
      },
      "timestamp": 123456
    }
  }
}
```

---

## 🔧 Hardware Setup

### Koneksi ESP8266 ke Micro:bit

```
Micro:bit          ESP8266
─────────          ───────
P16 (TX)    →      RX
P15 (RX)    ←      TX
GND         →      GND
3.3V        →      VCC
```

**Catatan:**
- ESP8266 butuh power stabil 3.3V
- Jika tidak stabil, gunakan power supply terpisah
- Pastikan GND terhubung

---

## 🎯 Tips & Troubleshooting

### ✅ Best Practices

1. **Setup sekali saja** - Jangan panggil `configureFirebase()` di dalam loop
2. **Error handling** - Selalu cek status dengan `isFirebaseDataSent()`
3. **WiFi monitoring** - Cek koneksi WiFi secara berkala
4. **Path naming** - Gunakan path yang jelas dan terstruktur
5. **Device ID** - Gunakan ID unik untuk setiap device

### ❌ Common Mistakes

```typescript
// ❌ SALAH - Configure di loop
basic.forever(function () {
    esp8266.configureFirebase(...)  // Jangan!
})

// ✅ BENAR - Configure sekali di awal
esp8266.configureFirebase(...)
basic.forever(function () {
    // Loop logic lainnya
})
```

```typescript
// ❌ SALAH - JSON tidak valid
let data = "\"key\": \"value\""  // Tidak lengkap!

// ✅ BENAR - JSON valid
let data = "{\"key\":\"value\"}"
```

### 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| ESP8266 tidak initialize | Cek koneksi TX/RX, cek power supply |
| WiFi tidak connect | Cek SSID dan password, cek jarak ke router |
| Data tidak terkirim | Cek Firebase API Key, cek database rules |
| LED tidak menyala | Cek apakah `isSystemReady = true` |

---

## 📚 Referensi

- **Main Documentation:** [README.md](README.md)
- **Firebase Console:** https://console.firebase.google.com
- **MakeCode Editor:** https://makecode.microbit.org
- **GitHub Repository:** https://github.com/emRival/PMJ-esp8266

---

## 💡 Ide Project

1. **Smart Home Controller**
   - Control lampu, kipas, AC via Firebase
   - Monitor temperature dan humidity
   - Dashboard web untuk monitoring

2. **Weather Station**
   - Kirim data sensor setiap 5 menit
   - Simpan historical data
   - Visualisasi dengan chart

3. **IoT Notification System**
   - Kirim alert saat sensor melewati threshold
   - Integrate dengan Telegram/Email
   - Real-time monitoring

4. **Multi-Device Network**
   - Beberapa micro:bit kirim data ke satu Firebase
   - Sinkronisasi status antar device
   - Central control dashboard

---

**Happy Coding! 🚀**

*Created by PMJ*
