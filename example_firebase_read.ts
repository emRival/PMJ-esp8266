/*******************************************************************************
 * CONTOH: Read Data dari Firebase
 * 
 * Menampilkan berbagai cara membaca data dari Firebase
 * Data structure di Firebase:
 * {
 *   "test": {
 *     "lampu_teras": {"tipe": "switch", "value": 1},
 *     "lampu_kamar": {"tipe": "switch", "value": 0},
 *     "suhu": {"tipe": "sensor", "value": 28, "satuan": "C"}
 *   }
 * }
 *******************************************************************************/

// ============================================================================
// SETUP
// ============================================================================

// Initialize ESP8266
esp8266.init(SerialPin.P16, SerialPin.P15, BaudRate.BaudRate115200)
basic.pause(1000)

// Connect WiFi
basic.showString("WIFI")
esp8266.connectWiFi("Ubuntu", "ubuntuoke")
basic.pause(3000)

if (esp8266.isWifiConnected()) {
    basic.showIcon(IconNames.Yes)
} else {
    basic.showIcon(IconNames.No)
    basic.showString("FAIL")
}

// Configure Firebase
basic.showString("FB")
esp8266.configureFirebase(
    "AIzaSyBeA_kpqQghfkmfM7y2v6I1nWAxFHIxFKg",
    "https://wikwo-test-default-rtdb.firebaseio.com",
    "wikwo-test"
)
esp8266.setFirebasePath("test")
basic.showIcon(IconNames.Heart)
basic.pause(1000)
basic.clearScreen()

// ============================================================================
// CONTOH 1: Read Switch (Button A)
// Baca status lampu_teras (0 atau 1)
// ============================================================================

input.onButtonPressed(Button.A, function () {
    basic.showString("A")

    // Baca sebagai NUMBER
    let lampStatus = esp8266.readFirebaseNumber("lampu_teras")

    // Tampilkan hasil pembacaan
    if (lampStatus == 1) {
        basic.showIcon(IconNames.Yes)
        basic.showString("ON")
    } else if (lampStatus == 0) {
        basic.showIcon(IconNames.No)
        basic.showString("OFF")
    } else {
        // lampStatus == 0 bisa juga berarti error/empty
        basic.showIcon(IconNames.Confused)
        basic.showString("ERR")
    }
})

// ============================================================================
// CONTOH 2: Read String (Button B)
// Baca status lampu_kamar sebagai STRING
// ============================================================================

input.onButtonPressed(Button.B, function () {
    basic.showString("B")

    // Baca sebagai STRING
    let lampValue = esp8266.readFirebaseValue("lampu_kamar")

    // Tampilkan hasil
    if (lampValue == "") {
        basic.showString("EMPTY")
    } else {
        basic.showString("V=")
        basic.showString(lampValue)
    }
})

// ============================================================================
// CONTOH 3: Read Sensor (Button A+B)
// Baca nilai suhu
// ============================================================================

input.onButtonPressed(Button.AB, function () {
    basic.showString("AB")

    // Baca suhu sebagai NUMBER
    let temperature = esp8266.readFirebaseNumber("suhu")

    // Tampilkan nilai
    basic.showNumber(temperature)
    basic.showString("C")
})

// ============================================================================
// CONTOH 4: Read Multiple Devices (Shake)
// Baca beberapa device sekaligus
// ============================================================================

input.onGesture(Gesture.Shake, function () {
    basic.showString("SHAKE")

    // Baca lampu teras
    let teras = esp8266.readFirebaseNumber("lampu_teras")
    basic.showString("T:")
    basic.showNumber(teras)
    basic.pause(500)

    // Baca lampu kamar
    let kamar = esp8266.readFirebaseNumber("lampu_kamar")
    basic.showString("K:")
    basic.showNumber(kamar)
    basic.pause(500)

    // Baca suhu
    let suhu = esp8266.readFirebaseNumber("suhu")
    basic.showString("S:")
    basic.showNumber(suhu)
})

// ============================================================================
// CONTOH 5: Conditional Read (Logo Up)
// Baca data, lalu lakukan aksi berdasarkan nilainya
// ============================================================================

input.onLogoEvent(TouchButtonEvent.Pressed, function () {
    basic.showString("LOGO")

    // Baca status lampu teras
    let status = esp8266.readFirebaseNumber("lampu_teras")

    // Jika lampu ON, tampilkan warning
    if (status == 1) {
        basic.showIcon(IconNames.Surprised)
        basic.showString("WARNING: LAMP IS ON!")

        // Mungkin nyalakan buzzer atau LED
        // pins.digitalWritePin(DigitalPin.P0, 1)
    } else {
        basic.showIcon(IconNames.Happy)
        basic.showString("LAMP OFF - OK")
    }
})

// ============================================================================
// CONTOH 6: Loop Read (Pin P0 Pressed)
// Baca data secara berkala
// ============================================================================

input.onPinPressed(TouchPin.P0, function () {
    basic.showString("LOOP")

    // Baca 5 kali dengan jeda 2 detik
    for (let i = 0; i < 5; i++) {
        let value = esp8266.readFirebaseNumber("lampu_teras")

        basic.showString("" + (i + 1))
        basic.showNumber(value)

        basic.pause(2000)
    }

    basic.showString("DONE")
})

// ============================================================================
// INSTRUKSI PENGGUNAAN
// ============================================================================
/*
TEKAN:
- Button A     = Read lampu_teras (NUMBER)
- Button B     = Read lampu_kamar (STRING)
- Button A+B   = Read suhu (NUMBER)
- Shake        = Read multiple devices
- Logo         = Conditional read
- Pin P0       = Loop read 5x

CATATAN PENTING:
1. readFirebaseNumber() mengembalikan 0 jika:
   - Data kosong/tidak ada
   - Terjadi error
   - Value memang 0
   
2. readFirebaseValue() mengembalikan "" (empty string) jika:
   - Data kosong/tidak ada
   - Terjadi error
   
3. Gunakan readFirebaseNumber() untuk:
   - Switch value (0/1)
   - Sensor value (angka)
   - Dimmer value (0-1024)
   
4. Gunakan readFirebaseValue() untuk:
   - Cek apakah data ada (jika "" berarti tidak ada)
   - Debug (tampilkan raw value)
   - String data

TROUBLESHOOTING:
- Jika selalu dapat 0 atau "":
  1. Cek WiFi connected (harus dapat icon Yes)
  2. Cek Firebase config benar
  3. Cek device name cocok dengan yang di Firebase
  4. Cek Firebase Rules allow read
  5. Coba write dulu, baru read
*/
