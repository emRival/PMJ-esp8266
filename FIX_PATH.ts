// ============================================================================
// FIX: Test struktur data Firebase yang benar
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
// MASALAH DITEMUKAN:
// firebaseSendSwitch() mengirim JSON seperti ini:
// {"lampu_teras": {"tipe":"switch","value":1}}
// 
// Tapi saat read, kita cari di path: /test/lampu_teras
// Yang seharusnya return: {"tipe":"switch","value":1}
// 
// Tapi Firebase return "null" atau data kosong!
// ============================================================================

// TEST: Kirim dan baca dengan path yang SAMA
input.onButtonPressed(Button.A, function () {
    basic.showString("SEND")

    // Kirim ke /test dengan struktur:
    // {"lampu_teras": {"tipe":"switch","value":1}}
    esp8266.firebaseSendSwitch("lampu_teras", 1)

    basic.pause(1000)
    basic.showIcon(IconNames.Yes)
})

input.onButtonPressed(Button.B, function () {
    basic.showString("READ")

    // Coba baca SELURUH path /test (bukan /test/lampu_teras)
    let host = "wikwo-test-default-rtdb.firebaseio.com"
    let fullPath = "test"  // ← Baca seluruh /test

    // Connect
    esp8266.sendCommand("AT+CIPSTART=\"SSL\",\"" + host + "\",443", "OK", 10000)

    // GET request
    let requestPath = "/" + fullPath + ".json?auth=" + API
    let httpRequest = "GET " + requestPath + " HTTP/1.1\r\n"
    httpRequest += "Host: " + host + "\r\n"
    httpRequest += "\r\n"

    esp8266.sendCommand("AT+CIPSEND=" + httpRequest.length)
    esp8266.sendCommand(httpRequest, null, 100)

    basic.pause(1000)
    let response = esp8266.getResponse("", 3000)
    esp8266.sendCommand("AT+CIPCLOSE", "OK", 1000)

    // Cek response
    if (response == "") {
        basic.showString("EMPTY")
        return
    }

    // Cari JSON
    let jsonStart = response.indexOf("{")
    if (jsonStart == -1) {
        basic.showString("NO JSON")
        basic.showNumber(response.length)
        return
    }

    basic.showString("JSON OK")
    basic.showNumber(jsonStart)
    basic.pause(500)

    // Cari "lampu_teras"
    let deviceIndex = response.indexOf("\"lampu_teras\"")
    if (deviceIndex == -1) {
        basic.showString("NO DEV")
        return
    }

    basic.showString("DEV OK")
    basic.pause(500)

    // Cari "value" setelah "lampu_teras"
    let afterDevice = response.substr(deviceIndex)
    let valueIndex = afterDevice.indexOf("\"value\":")

    if (valueIndex == -1) {
        basic.showString("NO VAL")
        return
    }

    basic.showString("VAL OK")
    basic.pause(500)

    // Extract value
    let valueStr = afterDevice.substr(valueIndex + 8, 5)
    basic.showString("V=")
    basic.showString(valueStr)
})

// ============================================================================
// KESIMPULAN:
// Masalahnya adalah struktur path!
// 
// SEND: PATCH /test dengan {"lampu_teras": {...}}
// READ: GET /test/lampu_teras → return null karena struktur salah!
// 
// SOLUSI:
// Baca dari /test lalu parse untuk cari "lampu_teras" → "value"
// ============================================================================
