/*******************************************************************************
 * CONTOH: Analog Pin & Read Firebase
 * 
 * Author: PMJ
 * 
 * Demonstrasi:
 * 1. Kirim data analog pin langsung (tanpa konversi string)
 * 2. Read data dari Firebase
 *******************************************************************************/

// ============================================================================
// SETUP
// ============================================================================

esp8266.init(SerialPin.P16, SerialPin.P15, BaudRate.BaudRate115200)
esp8266.connectWiFi("WIFI_SSID", "WIFI_PASSWORD")
esp8266.configureFirebase(
    "YOUR_API_KEY",
    "https://your-project.firebaseio.com",
    "your-project-id"
)

basic.showIcon(IconNames.Happy)

// ============================================================================
// BUTTON A: Kirim data ANALOG PIN (langsung number, tanpa konversi!)
// ============================================================================

input.onButtonPressed(Button.A, function () {
    // Baca analog pin - hasilnya NUMBER
    let sensorValue = pins.analogReadPin(AnalogPin.P0)

    // Kirim langsung tanpa konversi ke string!
    let data = esp8266.createFirebaseJSON(
        "suhu", sensorValue,  // ← NUMBER langsung!
        "status", "active"     // ← String juga bisa
    )

    esp8266.sendFirebaseData("/sensors/analog", data)

    if (esp8266.isFirebaseDataSent()) {
        basic.showNumber(sensorValue)
    } else {
        basic.showIcon(IconNames.No)
    }
})

// ============================================================================
// BUTTON B: Kirim DIGITAL PIN
// ============================================================================

input.onButtonPressed(Button.B, function () {
    // Baca digital pin - hasilnya NUMBER (0 atau 1)
    let buttonState = pins.digitalReadPin(DigitalPin.P1)

    // Kirim langsung!
    let data = esp8266.createFirebaseJSON(
        "button", buttonState,  // ← 0 atau 1 (number)
        "device", "microbit1"
    )

    esp8266.sendFirebaseData("/controls/button", data)

    if (esp8266.isFirebaseDataSent()) {
        basic.showIcon(IconNames.Yes)
    }
})

// ============================================================================
// BUTTON A+B: READ data dari Firebase
// ============================================================================

input.onButtonPressed(Button.AB, function () {
    // Read data dari Firebase
    let firebaseData = esp8266.readFirebaseData("/controls/lampu_teras")

    // Tampilkan data yang dibaca
    if (firebaseData != "") {
        basic.showString(firebaseData)

        // Parse JSON jika perlu
        // Contoh response: {"tipe":"saklar","value":true}
        if (firebaseData.includes("true")) {
            // Lampu ON
            basic.showIcon(IconNames.Heart)
        } else {
            // Lampu OFF
            basic.showIcon(IconNames.SmallHeart)
        }
    } else {
        basic.showIcon(IconNames.No)
    }
})

// ============================================================================
// CONTOH LENGKAP: Mix number dan string
// ============================================================================

basic.forever(function () {
    // Setiap 10 detik, kirim data lengkap
    basic.pause(10000)

    let temp = input.temperature()        // NUMBER
    let light = input.lightLevel()        // NUMBER  
    let compass = input.compassHeading()  // NUMBER

    // Semua number, tidak perlu konversi!
    let allData = esp8266.createFirebaseJSON(
        "temp", temp,
        "light", light,
        "compass", compass
    )

    esp8266.sendFirebaseData("/sensors/microbit1", allData)
})
