/*******************************************************************************
 * STARTER TEMPLATE - Firebase IoT dengan Micro:bit
 * 
 * Author: PMJ
 * 
 * Template ini akan memandu Anda step-by-step untuk:
 * 1. Setup WiFi
 * 2. Setup Firebase
 * 3. Kirim data sensor ke Firebase
 * 
 * GANTI NILAI DI BAWAH INI DENGAN DATA ANDA!
 *******************************************************************************/

// ============================================================================
// STEP 1: KONFIGURASI WIFI
// Ganti dengan WiFi Anda
// ============================================================================

const WIFI_SSID = "NAMA_WIFI_ANDA"          // ← Ganti ini!
const WIFI_PASSWORD = "PASSWORD_WIFI_ANDA"  // ← Ganti ini!

// ============================================================================
// STEP 2: KONFIGURASI FIREBASE
// Dapatkan dari Firebase Console: https://console.firebase.google.com
// ============================================================================

const FIREBASE_API_KEY = "YOUR_API_KEY"                        // ← Ganti ini!
const FIREBASE_DATABASE_URL = "https://your-project.firebaseio.com"  // ← Ganti ini!
const FIREBASE_PROJECT_ID = "your-project-id"                  // ← Ganti ini!

// ============================================================================
// STEP 3: SETUP AWAL (Jalankan sekali saat micro:bit nyala)
// ============================================================================

// Initialize ESP8266 module
esp8266.init(SerialPin.P16, SerialPin.P15, BaudRate.BaudRate115200)

// Cek apakah ESP8266 berhasil diinisialisasi
if (esp8266.isESP8266Initialized()) {
    basic.showIcon(IconNames.Happy)
} else {
    basic.showIcon(IconNames.Sad)
    // Berhenti di sini jika ESP8266 gagal
    while (true) {
        basic.pause(1000)
    }
}

// Connect ke WiFi
basic.showString("WIFI")
esp8266.connectWiFi(WIFI_SSID, WIFI_PASSWORD)

// Cek koneksi WiFi
if (esp8266.isWifiConnected()) {
    basic.showIcon(IconNames.Yes)
} else {
    basic.showIcon(IconNames.No)
    // Berhenti di sini jika WiFi gagal
    while (true) {
        basic.pause(1000)
    }
}

// Configure Firebase
basic.showString("FB")
esp8266.configureFirebase(
    FIREBASE_API_KEY,
    FIREBASE_DATABASE_URL,
    FIREBASE_PROJECT_ID
)

// System ready!
basic.showIcon(IconNames.Heart)
basic.pause(1000)
basic.clearScreen()

// LED indicator: WiFi connected
led.plot(0, 0)

// ============================================================================
// STEP 4: KIRIM DATA KE FIREBASE
// Pilih salah satu cara di bawah ini
// ============================================================================

// CARA 1: Kirim saat tombol A ditekan
input.onButtonPressed(Button.A, function () {
    // Kirim data temperature sensor
    let temp = input.temperature()

    esp8266.sendSensor(
        "/iot",           // Path di Firebase
        "suhu",           // Nama device
        temp,             // Nilai sensor
        100,              // Batas atas (max)
        "C"               // Satuan
    )

    // Tampilkan status
    if (esp8266.isFirebaseDataSent()) {
        basic.showIcon(IconNames.Yes)
    } else {
        basic.showIcon(IconNames.No)
    }
})

// CARA 2: Kirim saat tombol B ditekan
input.onButtonPressed(Button.B, function () {
    // Kirim data light sensor
    let light = input.lightLevel()

    esp8266.sendSensor(
        "/iot",
        "cahaya",
        light,
        255,
        "lux"
    )

    if (esp8266.isFirebaseDataSent()) {
        basic.showNumber(light)
    }
})

// CARA 3: Kirim switch (lampu ON/OFF)
input.onButtonPressed(Button.AB, function () {
    // Baca status digital pin
    let lampuStatus = pins.digitalReadPin(DigitalPin.P1)

    esp8266.sendSwitch(
        "/iot",
        "lampu_taman",
        lampuStatus  // 0 = OFF, 1 = ON
    )

    if (esp8266.isFirebaseDataSent()) {
        if (lampuStatus == 1) {
            basic.showIcon(IconNames.Heart)
        } else {
            basic.showIcon(IconNames.SmallHeart)
        }
    }
})

// CARA 4: Auto-send setiap 30 detik
basic.forever(function () {
    basic.pause(30000)  // 30 seconds

    // Kirim temperature
    esp8266.sendSensor("/iot", "suhu", input.temperature(), 100, "C")

    basic.pause(1000)

    // Kirim light level
    esp8266.sendSensor("/iot", "cahaya", input.lightLevel(), 255, "lux")

    // LED indicator: data sent
    if (esp8266.isFirebaseDataSent()) {
        led.plot(4, 0)
        basic.pause(100)
        led.unplot(4, 0)
    }
})

// ============================================================================
// HASIL DI FIREBASE
// ============================================================================

/*
Data akan tersimpan di Firebase dengan struktur:

/iot
  ├─ suhu
  │   ├─ tipe: "sensor"
  │   ├─ value: 25
  │   ├─ batas_atas: 100
  │   └─ satuan: "C"
  │
  ├─ cahaya
  │   ├─ tipe: "sensor"
  │   ├─ value: 128
  │   ├─ batas_atas: 255
  │   └─ satuan: "lux"
  │
  └─ lampu_taman
      ├─ tipe: "switch"
      └─ value: 1

TIPS:
✅ Gunakan sendSensor() untuk sensor (temperature, light, dll)
✅ Gunakan sendSwitch() untuk ON/OFF (lampu, pompa, dll)
✅ Gunakan sendDimmer() untuk nilai 0-1024 (kipas, LED dimmer, dll)
✅ Semua data otomatis ter-update di Firebase Real-time!
*/
