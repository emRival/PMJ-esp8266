// ============================================================================
// DIAGNOSA: Cek kenapa Firebase return "null"
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

esp8266.connectWiFi(WIFI, PASS)
basic.pause(3000)

esp8266.configureFirebase(API, URL, PROJECT)
esp8266.setFirebasePath("test")
basic.showIcon(IconNames.Heart)
basic.pause(1000)
basic.clearScreen()

// ============================================================================
// KEMUNGKINAN MASALAH:
// 1. Firebase Rules tidak allow read
// 2. Data tidak tersimpan (SEND gagal)
// 3. Path salah
// ============================================================================

// TEST 1: Kirim data LANGSUNG tanpa wrapper (Button A)
input.onButtonPressed(Button.A, function () {
    basic.showString("SEND")

    let host = "wikwo-test-default-rtdb.firebaseio.com"

    // Connect
    esp8266.sendCommand("AT+CIPSTART=\"SSL\",\"" + host + "\",443", "OK", 10000)

    // Kirim LANGSUNG ke /test/lampu_teras (bukan /test)
    // Dengan value langsung (bukan wrapped)
    let jsonData = "{\"tipe\":\"switch\",\"value\":1}"
    let requestPath = "/test/lampu_teras.json?auth=" + API

    let httpRequest = "PUT " + requestPath + " HTTP/1.1\r\n"
    httpRequest += "Host: " + host + "\r\n"
    httpRequest += "Content-Type: application/json\r\n"
    httpRequest += "Content-Length: " + jsonData.length + "\r\n"
    httpRequest += "\r\n"
    httpRequest += jsonData

    esp8266.sendCommand("AT+CIPSEND=" + httpRequest.length)
    esp8266.sendCommand(httpRequest, null, 100)

    basic.pause(1000)
    let response = esp8266.getResponse("", 2000)
    esp8266.sendCommand("AT+CIPCLOSE", "OK", 1000)

    // Cek response
    if (response.includes("200")) {
        basic.showIcon(IconNames.Yes)
        basic.showString("OK")
    } else {
        basic.showIcon(IconNames.No)
        basic.showString("FAIL")
    }
})

// TEST 2: Baca data (Button B)
input.onButtonPressed(Button.B, function () {
    basic.showString("READ")

    let host = "wikwo-test-default-rtdb.firebaseio.com"

    // Connect
    esp8266.sendCommand("AT+CIPSTART=\"SSL\",\"" + host + "\",443", "OK", 10000)

    // Baca dari /test/lampu_teras
    let requestPath = "/test/lampu_teras.json?auth=" + API
    let httpRequest = "GET " + requestPath + " HTTP/1.1\r\n"
    httpRequest += "Host: " + host + "\r\n"
    httpRequest += "\r\n"

    esp8266.sendCommand("AT+CIPSEND=" + httpRequest.length)
    esp8266.sendCommand(httpRequest, null, 100)

    basic.pause(1000)
    let response = esp8266.getResponse("", 3000)
    esp8266.sendCommand("AT+CIPCLOSE", "OK", 1000)

    // Cek response
    basic.showString("LEN=")
    basic.showNumber(response.length)
    basic.pause(1000)

    // Cek HTTP status
    if (response.includes("200")) {
        basic.showString("200")
    } else if (response.includes("401")) {
        basic.showString("401 AUTH")  // Auth error
    } else if (response.includes("404")) {
        basic.showString("404 NOT")   // Not found
    } else {
        basic.showString("ERR")
    }

    basic.pause(1000)

    // Cari JSON
    let jsonStart = response.indexOf("{")
    if (jsonStart >= 0) {
        basic.showString("JSON")
        let jsonData = response.substr(jsonStart, 50)

        // Cari value
        let valueIndex = jsonData.indexOf("\"value\":")
        if (valueIndex >= 0) {
            let valueStr = jsonData.substr(valueIndex + 8, 3)
            basic.showString("V=")
            basic.showString(valueStr)
        } else {
            basic.showString("NO VAL")
        }
    } else {
        // Cek apakah "null"
        if (response.includes("null")) {
            basic.showString("NULL")
        } else {
            basic.showString("NO JSON")
        }
    }
})

// ============================================================================
// INSTRUKSI PENTING:
// ============================================================================
/*
1. Tekan Button A → Kirim data dengan PUT langsung
   - Harus tampil "OK" (HTTP 200)
   - Jika "FAIL" → cek Firebase Rules atau API key

2. Tekan Button B → Baca data
   - Jika tampil "401 AUTH" → Firebase Rules blokir atau API key salah
   - Jika tampil "404 NOT" → Data tidak ada
   - Jika tampil "NULL" → Data kosong
   - Jika tampil "200" lalu "JSON" → Berhasil!

3. CEK FIREBASE CONSOLE:
   https://console.firebase.google.com
   
   Pilih project "wikwo-test"
   Buka "Realtime Database"
   Cek apakah ada data di /test/lampu_teras
   
4. CEK FIREBASE RULES:
   Di Firebase Console → Realtime Database → Rules
   Harus ada:
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   
   Jika tidak, ganti dengan rules di atas dan publish!
*/
