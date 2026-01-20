// ============================================================================
// DEBUG FIREBASE READ - Dengan Serial Output untuk Debug
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
esp8266.connectWiFi(WIFI, PASS)
basic.pause(3000)

// Configure Firebase
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
    basic.showIcon(IconNames.Yes)
    basic.showString("OK")
})

// ============================================================================
// TEST 2: Baca data dengan DEBUG (Button B)
// ============================================================================
input.onButtonPressed(Button.B, function () {
    basic.showString("READ")

    // MANUAL READ dengan debug
    // Build path
    let deviceName = "lampu_teras"
    let fullPath = "test/" + deviceName
    let host = "wikwo-test-default-rtdb.firebaseio.com"

    // Connect
    serial.writeLine("Connecting...")
    esp8266.sendCommand("AT+CIPSTART=\"SSL\",\"" + host + "\",443", "OK", 10000)

    // Build GET request
    let requestPath = "/" + fullPath + ".json?auth=" + API
    serial.writeLine("Path: " + requestPath)

    let httpRequest = "GET " + requestPath + " HTTP/1.1\r\n"
    httpRequest += "Host: " + host + "\r\n"
    httpRequest += "\r\n"

    // Send
    serial.writeLine("Sending request...")
    esp8266.sendCommand("AT+CIPSEND=" + httpRequest.length)
    esp8266.sendCommand(httpRequest, null, 100)

    // Wait and get response
    basic.pause(1000)
    let response = esp8266.getResponse("", 3000)

    // DEBUG: Print response
    serial.writeLine("=== RESPONSE START ===")
    serial.writeLine(response)
    serial.writeLine("=== RESPONSE END ===")

    // Close
    esp8266.sendCommand("AT+CIPCLOSE", "OK", 1000)

    // Try to find JSON
    let jsonStart = response.indexOf("{")
    serial.writeLine("JSON start at: " + jsonStart)

    if (jsonStart >= 0) {
        let jsonData = response.substr(jsonStart, 100)  // First 100 chars
        serial.writeLine("JSON: " + jsonData)

        // Find value
        let valueIndex = jsonData.indexOf("\"value\":")
        serial.writeLine("Value index: " + valueIndex)

        if (valueIndex >= 0) {
            let valueStr = jsonData.substr(valueIndex + 8, 10)
            serial.writeLine("Value str: " + valueStr)
        }
    }

    basic.showIcon(IconNames.Yes)
})

// ============================================================================
// TEST 3: Baca dengan fungsi (Button A+B)
// ============================================================================
input.onButtonPressed(Button.AB, function () {
    basic.showString("FUNC")

    // Baca dengan fungsi
    let valueNum = esp8266.readFirebaseNumber("lampu_teras")

    serial.writeLine("Result: " + valueNum)
    basic.showNumber(valueNum)
})

// ============================================================================
// INSTRUKSI:
// ============================================================================
/*
1. Buka Serial Monitor di MakeCode (Show console)
2. Tekan Button A → Kirim data
3. Tekan Button B → Baca data dan lihat serial output
4. Cek output di serial:
   - Apakah ada response?
   - Apakah ada JSON?
   - Apakah ada "value" field?
   
5. Screenshot serial output dan kirim ke saya!
*/
