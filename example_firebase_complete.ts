/*******************************************************************************
 * CONTOH LENGKAP: Firebase Integration dengan ESP8266
 * 
 * Author: PMJ
 * 
 * Fitur yang dicontohkan:
 * 1. Setup WiFi dan Firebase
 * 2. Kirim data sensor (temperature & light)
 * 3. Kirim status saklar (ON/OFF)
 * 4. Kirim data custom dengan timestamp
 * 5. Error handling dan status indicator
 *******************************************************************************/

// ============================================================================
// KONFIGURASI - GANTI DENGAN DATA ANDA!
// ============================================================================

const WIFI_SSID = "NAMA_WIFI_ANDA"
const WIFI_PASSWORD = "PASSWORD_WIFI_ANDA"

const FIREBASE_API_KEY = "firebase_api_key"
const FIREBASE_DATABASE_URL = "firebase_database_url"
const FIREBASE_PROJECT_ID = "firebase_project_id"

const DEVICE_ID = "microbit1" // ID unik untuk device ini

// ============================================================================
// VARIABEL GLOBAL
// ============================================================================

let isSystemReady = false
let lampuStatus = false

// ============================================================================
// FUNGSI HELPER
// ============================================================================

/**
 * Tampilkan status di LED matrix
 */
function showStatus(status: string) {
    basic.clearScreen()
    basic.showString(status)
    basic.pause(500)
}

/**
 * Kirim data ke Firebase dengan error handling
 */
function sendToFirebase(path: string, jsonData: string): boolean {
    esp8266.sendFirebaseData(path, jsonData)

    if (esp8266.isFirebaseDataSent()) {
        basic.showIcon(IconNames.Yes)
        basic.pause(500)
        return true
    } else {
        basic.showIcon(IconNames.No)
        basic.pause(500)
        return false
    }
}

// ============================================================================
// SETUP - Jalankan sekali saat micro:bit dinyalakan
// ============================================================================

showStatus("INIT")

// 1. Initialize ESP8266 module
esp8266.init(SerialPin.P16, SerialPin.P15, BaudRate.BaudRate115200)

if (!esp8266.isESP8266Initialized()) {
    showStatus("ESP FAIL")
    basic.showIcon(IconNames.Sad)
    // Berhenti di sini jika ESP8266 gagal
    while (true) {
        basic.pause(1000)
    }
}

showStatus("ESP OK")
basic.pause(500)

// 2. Connect ke WiFi
showStatus("WIFI")
esp8266.connectWiFi(WIFI_SSID, WIFI_PASSWORD)

if (!esp8266.isWifiConnected()) {
    showStatus("WIFI FAIL")
    basic.showIcon(IconNames.Sad)
    // Berhenti di sini jika WiFi gagal
    while (true) {
        basic.pause(1000)
    }
}

showStatus("WIFI OK")
basic.pause(500)

// 3. Configure Firebase
showStatus("FB")
esp8266.configureFirebase(
    FIREBASE_API_KEY,
    FIREBASE_DATABASE_URL,
    FIREBASE_PROJECT_ID
)

showStatus("FB OK")
basic.pause(500)

// 4. System ready!
isSystemReady = true
basic.showIcon(IconNames.Happy)
basic.pause(1000)
basic.clearScreen()

// Tampilkan indicator ready (LED pojok kiri atas)
led.plot(0, 0)

// ============================================================================
// EVENT HANDLERS - Tombol A, B, A+B
// ============================================================================

/**
 * BUTTON A: Kirim data sensor (temperature & light level)
 */
input.onButtonPressed(Button.A, function () {
    if (!isSystemReady) {
        basic.showIcon(IconNames.No)
        return
    }

    showStatus("A")

    // Baca sensor
    let temperature = input.temperature()
    let lightLevel = input.lightLevel()

    // Method 1: Gunakan helper function (MUDAH)
    let sensorData = esp8266.createFirebaseJSON(
        "temp", "" + temperature,
        "light", "" + lightLevel
    )

    // Kirim ke Firebase di path: /devices/microbit1/sensors
    let success = sendToFirebase("/devices/" + DEVICE_ID + "/sensors", sensorData)

    if (success) {
        // Tampilkan nilai temperature
        basic.showNumber(temperature)
    }
})

/**
 * BUTTON B: Toggle lampu (ON/OFF) dan kirim status
 */
input.onButtonPressed(Button.B, function () {
    if (!isSystemReady) {
        basic.showIcon(IconNames.No)
        return
    }

    showStatus("B")

    // Toggle status lampu
    lampuStatus = !lampuStatus

    // Method 2: Buat JSON manual (FLEKSIBEL)
    let lampuData = "{\"tipe\":\"saklar\",\"value\":" + (lampuStatus ? "true" : "false") + ",\"device\":\"" + DEVICE_ID + "\"}"

    // Kirim ke Firebase di path: /controls/lampu_teras
    let success = sendToFirebase("/controls/lampu_teras", lampuData)

    if (success) {
        // Tampilkan status lampu
        if (lampuStatus) {
            basic.showIcon(IconNames.Heart) // ON
        } else {
            basic.showIcon(IconNames.SmallHeart) // OFF
        }
    }
})

/**
 * BUTTON A+B: Kirim data lengkap dengan timestamp
 */
input.onButtonPressed(Button.AB, function () {
    if (!isSystemReady) {
        basic.showIcon(IconNames.No)
        return
    }

    showStatus("AB")

    // Baca semua sensor
    let temp = input.temperature()
    let light = input.lightLevel()
    let compass = input.compassHeading()

    // Method 3: JSON kompleks dengan banyak field
    let complexData = "{" +
        "\"device_id\":\"" + DEVICE_ID + "\"," +
        "\"sensors\":{" +
        "\"temperature\":" + temp + "," +
        "\"light\":" + light + "," +
        "\"compass\":" + compass +
        "}," +
        "\"status\":{" +
        "\"lampu\":" + (lampuStatus ? "true" : "false") + "," +
        "\"online\":true" +
        "}," +
        "\"timestamp\":" + input.runningTime() +
        "}"

    // Kirim ke Firebase di path: /logs/microbit1
    let success = sendToFirebase("/logs/" + DEVICE_ID, complexData)

    if (success) {
        basic.showIcon(IconNames.Yes)
    }
})

// ============================================================================
// MAIN LOOP - Monitoring dan auto-send
// ============================================================================

basic.forever(function () {
    if (!isSystemReady) {
        return
    }

    // Indicator WiFi connected (LED pojok kiri atas)
    if (esp8266.isWifiConnected()) {
        led.plot(0, 0)
    } else {
        led.unplot(0, 0)
        // Coba reconnect WiFi jika terputus
        esp8266.connectWiFi(WIFI_SSID, WIFI_PASSWORD)
    }

    // Pause 1 detik sebelum loop berikutnya
    basic.pause(1000)
})

// ============================================================================
// OPTIONAL: Auto-send data setiap 30 detik
// ============================================================================

// Uncomment jika mau auto-send data sensor setiap 30 detik
/*
loops.everyInterval(30000, function () {
    if (!isSystemReady) {
        return
    }
    
    let temp = input.temperature()
    let light = input.lightLevel()
    
    let autoData = esp8266.createFirebaseJSON(
        "temp", "" + temp,
        "light", "" + light
    )
    
    sendToFirebase("/auto/" + DEVICE_ID, autoData)
})
*/
