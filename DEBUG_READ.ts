// ============================================================================
// DEBUG FIREBASE READ - Test apakah read berfungsi
// ============================================================================

// STEP 1: GANTI DATA INI
let WIFI = "Ubuntu"
let PASS = "ubuntuoke"
let API = "AIzaSyBeA_kpqQghfkmfM7y2v6I1nWAxFHIxFKg"
let URL = "https://wikwo-test-default-rtdb.firebaseio.com"
let PROJECT = "wikwo-test"

// STEP 2: SETUP
esp8266.init(SerialPin.P16, SerialPin.P15, BaudRate.BaudRate115200)
basic.pause(1000)

// Cek ESP8266
if (esp8266.isESP8266Initialized()) {
    basic.showIcon(IconNames.Happy)
} else {
    basic.showIcon(IconNames.Sad)
    basic.showString("ESP FAIL")
}

basic.pause(1000)

// Connect WiFi
basic.showString("WIFI")
esp8266.connectWiFi(WIFI, PASS)
basic.pause(3000)

// Cek WiFi
if (esp8266.isWifiConnected()) {
    basic.showIcon(IconNames.Yes)
} else {
    basic.showIcon(IconNames.No)
    basic.showString("WIFI FAIL")
}

basic.pause(1000)

// Configure Firebase
basic.showString("FB")
esp8266.configureFirebase(API, URL, PROJECT)
esp8266.setFirebasePath("test")
basic.showIcon(IconNames.Heart)
basic.pause(1000)
basic.clearScreen()

// ============================================================================
// TEST 1: Kirim data dulu (Button A)
// ============================================================================
input.onButtonPressed(Button.A, function () {
    basic.showString("SEND")

    // Kirim switch value = 1
    esp8266.firebaseSendSwitch("lampu_teras", 1)

    if (esp8266.isFirebaseDataSent()) {
        basic.showIcon(IconNames.Yes)
        basic.pause(500)
        basic.showString("OK")
    } else {
        basic.showIcon(IconNames.No)
        basic.showString("FAIL")
    }
})

// ============================================================================
// TEST 2: Baca data (Button B)
// ============================================================================
input.onButtonPressed(Button.B, function () {
    basic.showString("READ")

    // Baca value sebagai string
    let valueStr = esp8266.readFirebaseValue("lampu_teras")

    if (valueStr == "") {
        basic.showIcon(IconNames.No)
        basic.showString("EMPTY")
    } else {
        basic.showIcon(IconNames.Yes)
        basic.showString("V:" + valueStr)
    }

    basic.pause(1000)

    // Baca value sebagai number
    let valueNum = esp8266.readFirebaseNumber("lampu_teras")
    basic.showNumber(valueNum)
})

// ============================================================================
// TEST 3: Toggle lampu (Button A+B)
// ============================================================================
input.onButtonPressed(Button.AB, function () {
    basic.showString("TOGGLE")

    // Baca status saat ini
    let status = esp8266.readFirebaseNumber("lampu_teras")

    // Toggle
    if (status == 1) {
        esp8266.firebaseSendSwitch("lampu_teras", 0)
        basic.showIcon(IconNames.SmallHeart)
    } else {
        esp8266.firebaseSendSwitch("lampu_teras", 1)
        basic.showIcon(IconNames.Heart)
    }
})

// ============================================================================
// CARA DEBUG:
// ============================================================================
/*
1. Tekan Button A → Kirim data (value = 1)
   - Harus muncul "OK"
   - Cek di Firebase Console, harus ada data:
     /test/lampu_teras = {"tipe": "switch", "value": 1}

2. Tekan Button B → Baca data
   - Harus muncul "V:1" lalu angka "1"
   - Jika muncul "EMPTY" → read gagal!

3. Tekan A+B → Toggle
   - Harus toggle antara Heart dan SmallHeart

JIKA READ GAGAL:
- Pastikan data sudah ada di Firebase (test dengan Button A dulu)
- Pastikan path benar: /test/lampu_teras
- Pastikan struktur JSON benar: {"tipe":"switch","value":1}
- Cek Firebase Rules: allow read = true
*/
