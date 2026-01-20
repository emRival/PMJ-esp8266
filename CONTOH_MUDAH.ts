/*******************************************************************************
 * CONTOH MUDAH - Firebase untuk Anak-anak
 * 
 * Author: PMJ
 * 
 * Panduan step-by-step yang sangat mudah!
 *******************************************************************************/

// ============================================================================
// LANGKAH 1: ISI DATA WIFI DAN FIREBASE ANDA
// ============================================================================

const WIFI_NAMA = "NAMA_WIFI_ANDA"          // ← Ganti!
const WIFI_PASSWORD = "PASSWORD_WIFI_ANDA"  // ← Ganti!

const FIREBASE_API_KEY = "YOUR_API_KEY"                        // ← Ganti!
const FIREBASE_URL = "https://your-project.firebaseio.com"     // ← Ganti!
const FIREBASE_PROJECT = "your-project-id"                     // ← Ganti!

// ============================================================================
// LANGKAH 2: SETUP (Jalankan sekali saat micro:bit nyala)
// ============================================================================

// Nyalakan ESP8266
esp8266.init(SerialPin.P16, SerialPin.P15, BaudRate.BaudRate115200)

// Cek ESP8266
if (esp8266.isESP8266Initialized()) {
    basic.showIcon(IconNames.Happy)
} else {
    basic.showIcon(IconNames.Sad)
}

// Sambung ke WiFi
esp8266.connectWiFi(WIFI_NAMA, WIFI_PASSWORD)

// Cek WiFi
if (esp8266.isWifiConnected()) {
    basic.showIcon(IconNames.Yes)
} else {
    basic.showIcon(IconNames.No)
}

// Setup Firebase
esp8266.configureFirebase(FIREBASE_API_KEY, FIREBASE_URL, FIREBASE_PROJECT)

// Siap!
basic.showIcon(IconNames.Heart)
basic.clearScreen()

// ============================================================================
// LANGKAH 3: KIRIM DATA - Pilih salah satu cara di bawah
// ============================================================================

// CARA 1: Kirim SWITCH (Lampu ON/OFF) saat tombol A
input.onButtonPressed(Button.A, function () {
    // Baca pin digital (0 atau 1)
    let statusLampu = pins.digitalReadPin(DigitalPin.P1)

    // Kirim ke Firebase
    esp8266.firebaseSendSwitch("lampu", statusLampu)

    // Tampilkan
    if (esp8266.isFirebaseDataSent()) {
        if (statusLampu == 1) {
            basic.showIcon(IconNames.Heart)  // ON
        } else {
            basic.showIcon(IconNames.SmallHeart)  // OFF
        }
    }
})

// CARA 2: Kirim DIMMER (Kipas 0-1024) saat tombol B
input.onButtonPressed(Button.B, function () {
    // Baca pin analog (0-1024)
    let kecepatanKipas = pins.analogReadPin(AnalogPin.P0)

    // Kirim ke Firebase
    esp8266.firebaseSendDimmer("kipas", kecepatanKipas)

    // Tampilkan angka
    if (esp8266.isFirebaseDataSent()) {
        basic.showNumber(Math.round(kecepatanKipas / 100))
    }
})

// CARA 3: Kirim SENSOR (Suhu) saat tombol A+B
input.onButtonPressed(Button.AB, function () {
    // Baca sensor suhu
    let suhu = input.temperature()

    // Kirim ke Firebase
    esp8266.firebaseSendSensor("suhu", suhu, "C")

    // Tampilkan suhu
    if (esp8266.isFirebaseDataSent()) {
        basic.showNumber(suhu)
    }
})

// CARA 4: Auto kirim setiap 30 detik
basic.forever(function () {
    basic.pause(30000)  // 30 detik

    // Kirim suhu
    esp8266.firebaseSendSensor("suhu", input.temperature(), "C")

    basic.pause(1000)

    // Kirim cahaya
    esp8266.firebaseSendSensor("cahaya", input.lightLevel(), "lux")
})

// ============================================================================
// HASIL DI FIREBASE
// ============================================================================

/*
Data akan muncul di Firebase seperti ini:

/iot
  ├─ lampu
  │   ├─ tipe: "switch"
  │   └─ value: 1
  │
  ├─ kipas
  │   ├─ tipe: "dimmer"
  │   ├─ value: 512
  │   └─ batas_atas: 1024
  │
  └─ suhu
      ├─ tipe: "sensor"
      ├─ value: 25
      └─ satuan: "C"

TIPS MUDAH:
✅ Untuk ON/OFF → Pakai firebaseSendSwitch (0 atau 1)
✅ Untuk 0-1024 → Pakai firebaseSendDimmer
✅ Untuk sensor → Pakai firebaseSendSensor
*/
