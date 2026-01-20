// ============================================================================
// SIMPLE FIREBASE - Copy & Paste Langsung Bisa Pakai!
// ============================================================================

// STEP 1: GANTI DATA INI
const WIFI = "NAMA_WIFI_ANDA"
const PASS = "PASSWORD_WIFI"
const API = "YOUR_FIREBASE_API_KEY"
const URL = "https://your-project.firebaseio.com"
const PROJECT = "your-project-id"

// STEP 2: SETUP (Otomatis jalan saat micro:bit nyala)
esp8266.init(SerialPin.P16, SerialPin.P15, BaudRate.BaudRate115200)
esp8266.connectWiFi(WIFI, PASS)
esp8266.configureFirebase(API, URL, PROJECT)
esp8266.setFirebasePath("test")  // ← SET PATH SEKALI DI SINI!
basic.showIcon(IconNames.Heart)

// STEP 3: KIRIM DATA (Pilih salah satu)

// ============================================================================
// CONTOH 1: Kirim LAMPU ON/OFF saat tekan tombol A
// ============================================================================
input.onButtonPressed(Button.A, function () {
    // Baca pin P1 (0 atau 1)
    let lampu = pins.digitalReadPin(DigitalPin.P1)

    // Kirim ke Firebase (otomatis ke path "test")
    esp8266.firebaseSendSwitch("lampu", lampu)

    // Tampilkan
    if (lampu == 1) {
        basic.showIcon(IconNames.Heart)
    } else {
        basic.showIcon(IconNames.SmallHeart)
    }
})

// ============================================================================
// CONTOH 2: Kirim KIPAS 0-1024 saat tekan tombol B
// ============================================================================
input.onButtonPressed(Button.B, function () {
    // Baca pin analog P0 (0-1024)
    let kipas = pins.analogReadPin(AnalogPin.P0)

    // Kirim ke Firebase (otomatis ke path "test")
    esp8266.firebaseSendDimmer("kipas", kipas)

    // Tampilkan angka
    basic.showNumber(kipas)
})

// ============================================================================
// CONTOH 3: Kirim SUHU saat shake
// ============================================================================
input.onGesture(Gesture.Shake, function () {
    // Baca suhu
    let suhu = input.temperature()

    // Kirim ke Firebase (otomatis ke path "test")
    esp8266.firebaseSendSensor("suhu", suhu, "C")

    // Tampilkan suhu
    basic.showNumber(suhu)
})

// ============================================================================
// CONTOH 4: Auto kirim setiap 10 detik
// ============================================================================
basic.forever(function () {
    basic.pause(10000)  // 10 detik

    // Kirim suhu (otomatis ke path "test")
    esp8266.firebaseSendSensor("suhu", input.temperature(), "C")

    basic.pause(1000)

    // Kirim cahaya (otomatis ke path "test")
    esp8266.firebaseSendSensor("cahaya", input.lightLevel(), "lux")

    // Blink LED jika berhasil
    if (esp8266.isFirebaseDataSent()) {
        led.plot(4, 4)
        basic.pause(100)
        led.unplot(4, 4)
    }
})
