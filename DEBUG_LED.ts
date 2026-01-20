// ============================================================================
// DEBUG FIREBASE READ - Tampilkan di LED (tanpa serial)
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
// TEST 1: Kirim data (Button A)
// ============================================================================
input.onButtonPressed(Button.A, function () {
    basic.showString("SEND")

    // Kirim switch value = 1
    esp8266.firebaseSendSwitch("lampu_teras", 1)

    basic.pause(500)

    // Cek apakah terkirim
    if (esp8266.isFirebaseDataSent()) {
        basic.showIcon(IconNames.Yes)
        basic.showString("OK")
    } else {
        basic.showIcon(IconNames.No)
        basic.showString("FAIL")
    }
})

// ============================================================================
// TEST 2: Baca data STEP BY STEP (Button B)
// ============================================================================
input.onButtonPressed(Button.B, function () {
    basic.showString("READ")
    basic.pause(500)

    // Step 1: Cek WiFi
    if (!esp8266.isWifiConnected()) {
        basic.showString("NO WIFI")
        return
    }
    basic.showString("1")  // WiFi OK
    basic.pause(300)

    // Step 2: Build path
    let deviceName = "lampu_teras"
    let fullPath = "test/" + deviceName
    let host = "wikwo-test-default-rtdb.firebaseio.com"

    basic.showString("2")  // Path OK
    basic.pause(300)

    // Step 3: Connect to Firebase
    let connected = esp8266.sendCommand("AT+CIPSTART=\"SSL\",\"" + host + "\",443", "OK", 10000)
    if (!connected) {
        basic.showString("NO CONN")
        return
    }
    basic.showString("3")  // Connected
    basic.pause(300)

    // Step 4: Send GET request
    let requestPath = "/" + fullPath + ".json?auth=" + API
    let httpRequest = "GET " + requestPath + " HTTP/1.1\r\n"
    httpRequest += "Host: " + host + "\r\n"
    httpRequest += "\r\n"

    esp8266.sendCommand("AT+CIPSEND=" + httpRequest.length)
    esp8266.sendCommand(httpRequest, null, 100)

    basic.showString("4")  // Request sent
    basic.pause(300)

    // Step 5: Get response
    basic.pause(1000)
    let response = esp8266.getResponse("", 3000)
    esp8266.sendCommand("AT+CIPCLOSE", "OK", 1000)

    if (response == "") {
        basic.showString("EMPTY")
        return
    }
    basic.showString("5")  // Got response
    basic.pause(300)

    // Step 6: Find JSON
    let jsonStart = response.indexOf("{")
    if (jsonStart == -1) {
        basic.showString("NO JSON")
        basic.showNumber(response.length)  // Show response length
        return
    }
    basic.showString("6")  // Found JSON
    basic.showNumber(jsonStart)  // Show JSON start position
    basic.pause(500)

    // Step 7: Extract JSON
    let jsonData = response.substr(jsonStart, 50)  // First 50 chars

    // Step 8: Find "value"
    let valueIndex = jsonData.indexOf("\"value\":")
    if (valueIndex == -1) {
        basic.showString("NO VAL")
        return
    }
    basic.showString("7")  // Found value
    basic.showNumber(valueIndex)
    basic.pause(500)

    // Step 9: Extract value
    let valueStr = jsonData.substr(valueIndex + 8, 5)

    // Show first character of value
    basic.showString("V=")
    basic.showString(valueStr)
})

// ============================================================================
// TEST 3: Gunakan fungsi readFirebaseNumber (Button A+B)
// ============================================================================
input.onButtonPressed(Button.AB, function () {
    basic.showString("FUNC")

    let result = esp8266.readFirebaseNumber("lampu_teras")

    if (result == 0) {
        basic.showIcon(IconNames.No)
    } else {
        basic.showIcon(IconNames.Yes)
    }

    basic.showNumber(result)
})

// ============================================================================
// INSTRUKSI:
// ============================================================================
/*
TEKAN BUTTON B dan catat di step mana berhenti:

1 = WiFi OK
2 = Path OK
3 = Connected to Firebase
4 = Request sent
5 = Got response
6 = Found JSON (akan tampilkan posisi)
7 = Found "value" field (akan tampilkan posisi)
V= = Value string (akan tampilkan value)

JIKA BERHENTI DI:
- "NO WIFI" → WiFi tidak connect
- "NO CONN" → Tidak bisa connect ke Firebase
- "EMPTY" → Response kosong
- "NO JSON" → Response tidak ada JSON (akan tampilkan panjang response)
- "NO VAL" → JSON tidak ada field "value"

Beritahu saya di step mana berhenti!
*/
