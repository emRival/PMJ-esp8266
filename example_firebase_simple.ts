/*******************************************************************************
 * CONTOH SEDERHANA: Firebase Integration
 * 
 * Author: PMJ
 * 
 * Contoh paling simple untuk kirim data sensor ke Firebase
 *******************************************************************************/

// ============================================================================
// SETUP - Ganti dengan data Anda!
// ============================================================================

// 1. Initialize ESP8266
esp8266.init(SerialPin.P16, SerialPin.P15, BaudRate.BaudRate115200)

// 2. Connect WiFi
esp8266.connectWiFi("NAMA_WIFI_ANDA", "PASSWORD_WIFI_ANDA")

// 3. Configure Firebase
esp8266.configureFirebase(
    "YOUR_API_KEY",
    "https://your-project.firebaseio.com",
    "your-project-id"
)

// Tampilkan ready
basic.showIcon(IconNames.Happy)

// ============================================================================
// KIRIM DATA SAAT TOMBOL A DITEKAN
// ============================================================================

input.onButtonPressed(Button.A, function () {
    // Baca sensor
    let temperature = input.temperature()
    let lightLevel = input.lightLevel()

    // Buat JSON
    let data = esp8266.createFirebaseJSON(
        "temperature", "" + temperature,
        "light", "" + lightLevel
    )

    // Kirim ke Firebase
    esp8266.sendFirebaseData("/sensors/microbit1", data)

    // Tampilkan status
    if (esp8266.isFirebaseDataSent()) {
        basic.showIcon(IconNames.Yes)  // Berhasil
    } else {
        basic.showIcon(IconNames.No)   // Gagal
    }
})
