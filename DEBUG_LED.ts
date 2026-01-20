// ============================================================================
// FIREBASE TEST - SIMPLIFIED VERSION
// ============================================================================

// STEP 1: CONFIG
let WIFI = "Ubuntu"
let PASS = "ubuntuoke"
let API = "AIzaSyBeA_kpqQghfkmfM7y2v6I1nWAxFHIxFKg"
let URL = "https://wikwo-test-default-rtdb.firebaseio.com"
let PROJECT = "wikwo-test"

// STEP 2: SETUP
esp8266.init(SerialPin.P16, SerialPin.P15, BaudRate.BaudRate115200)
basic.pause(1000)

// Connect WiFi
basic.showString("WIFI")
esp8266.connectWiFi(WIFI, PASS)
basic.pause(3000)

if (esp8266.isWifiConnected()) {
    basic.showIcon(IconNames.Yes)
} else {
    basic.showIcon(IconNames.No)
    basic.showString("FAIL")
}

// Configure Firebase
basic.showString("FB")
esp8266.configureFirebase(API, URL, PROJECT)
esp8266.setFirebasePath("test")
basic.showIcon(IconNames.Heart)
basic.pause(1000)
basic.clearScreen()

// ============================================================================
// TEST 1: SEND DATA (Button A)
// ============================================================================
input.onButtonPressed(Button.A, function () {
    basic.showString("SEND")

    // Send switch value = 1
    esp8266.firebaseSendSwitch("lampu_teras", 1)
    basic.pause(1000)

    if (esp8266.isFirebaseDataSent()) {
        basic.showIcon(IconNames.Yes)
    } else {
        basic.showIcon(IconNames.No)
    }
})

// ============================================================================
// TEST 2: READ VALUE AS STRING (Button B)
// ============================================================================
input.onButtonPressed(Button.B, function () {
    basic.showString("READ")
    basic.pause(500)

    let value = esp8266.readFirebaseValue("lampu_teras")

    if (value == "") {
        basic.showIcon(IconNames.No)
        basic.showString("FAIL")
    } else {
        basic.showIcon(IconNames.Yes)
        basic.showString("V=")
        basic.showString(value)
    }
})

// ============================================================================
// TEST 3: READ VALUE AS NUMBER (Button A+B)
// ============================================================================
input.onButtonPressed(Button.AB, function () {
    basic.showString("NUM")
    basic.pause(500)

    let value = esp8266.readFirebaseNumber("lampu_teras")

    basic.showNumber(value)

    if (value == 0) {
        basic.showIcon(IconNames.No)
    } else {
        basic.showIcon(IconNames.Yes)
    }
})

// ============================================================================
// INSTRUKSI PENGGUNAAN:
// ============================================================================
/*
TEKAN BUTTON:
- A = Kirim data (value=1) ke Firebase
- B = Baca value sebagai string
- A+B = Baca value sebagai number

JIKA GAGAL:
1. Cek koneksi WiFi (pastikan dapat ikon Yes setelah WIFI)
2. Cek Firebase config (pastikan dapat ikon Heart setelah FB)
3. Cek di Firebase Console apakah data terkirim
4. Pastikan struktur data di Firebase sesuai:
   {
     "test": {
       "lampu_teras": {
         "tipe": "switch",
         "value": 1
       }
     }
   }

PERUBAHAN UTAMA DARI CODE LAMA:
1. Parsing HTTP response lebih robust
2. Extract JSON body setelah HTTP headers
3. Extract value field dengan lebih akurat
4. Tambah Connection: close di HTTP request
5. Tambah pause sebelum baca response
6. Perbaiki extractValueFromJson untuk handle berbagai format
*/