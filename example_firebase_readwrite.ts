/*******************************************************************************
 * EXAMPLE: Firebase Read & Write
 * 
 * This example shows how to:
 * 1. Read value from Firebase
 * 2. Write value to Firebase
 * 3. Toggle switch value
 * 
 * Data structure in Firebase:
 * {
 *   "test": {
 *     "lampu_teras": {
 *       "tipe": "switch",
 *       "value": 1
 *     }
 *   }
 * }
 *******************************************************************************/

// ============================================================================
// CONFIGURATION - Replace with your credentials
// ============================================================================

const WIFI_SSID = "Ubuntu"
const WIFI_PASSWORD = "ubuntuoke"
const FIREBASE_API_KEY = "AIzaSyBeA_kpqQghfkmfM7y2v6I1nWAxFHIxFKg"
const FIREBASE_URL = "https://wikwo-test-default-rtdb.firebaseio.com"
const FIREBASE_PROJECT = "wikwo-test"

// ============================================================================
// SETUP - Initialize ESP8266 and Firebase
// ============================================================================

// Initialize ESP8266
esp8266.init(SerialPin.P16, SerialPin.P15, BaudRate.BaudRate115200)
basic.pause(1000)

// Connect to WiFi
basic.showString("WIFI")
esp8266.connectWiFi(WIFI_SSID, WIFI_PASSWORD)
basic.pause(3000)

if (esp8266.isWifiConnected()) {
    basic.showIcon(IconNames.Yes)
} else {
    basic.showIcon(IconNames.No)
    basic.showString("FAIL")
}

// Configure Firebase
basic.showString("FB")
esp8266.configureFirebase(FIREBASE_API_KEY, FIREBASE_URL, FIREBASE_PROJECT)
esp8266.setFirebasePath("test")  // Set base path to "test"
basic.showIcon(IconNames.Heart)
basic.pause(1000)
basic.clearScreen()

// ============================================================================
// BUTTON A: Write to Firebase (Turn ON)
// ============================================================================

input.onButtonPressed(Button.A, function () {
    basic.showString("ON")

    // Send switch value=1 to Firebase
    // This will create/update: test/lampu_teras = {"tipe":"switch","value":1}
    esp8266.firebaseSendSwitch("lampu_teras", 1)

    basic.pause(1000)

    if (esp8266.isFirebaseDataSent()) {
        basic.showIcon(IconNames.Yes)
    } else {
        basic.showIcon(IconNames.No)
    }
})

// ============================================================================
// BUTTON B: Read from Firebase
// ============================================================================

input.onButtonPressed(Button.B, function () {
    basic.showString("READ")

    // Read value from Firebase as NUMBER
    // This reads from: test/lampu_teras and extracts the "value" field
    let lampStatus = esp8266.readFirebaseNumber("lampu_teras")

    // Display the value
    if (lampStatus == 0) {
        basic.showIcon(IconNames.No)
        basic.showString("OFF")
    } else if (lampStatus == 1) {
        basic.showIcon(IconNames.Yes)
        basic.showString("ON")
    } else {
        basic.showIcon(IconNames.Confused)
        basic.showString("ERR")
    }
})

// ============================================================================
// BUTTON A+B: Toggle (Read current value, then toggle it)
// ============================================================================

input.onButtonPressed(Button.AB, function () {
    basic.showString("TOGGLE")

    // Read current status
    let currentValue = esp8266.readFirebaseNumber("lampu_teras")

    // Toggle the value
    if (currentValue == 1) {
        // Turn OFF
        esp8266.firebaseSendSwitch("lampu_teras", 0)
        basic.showIcon(IconNames.No)
    } else {
        // Turn ON
        esp8266.firebaseSendSwitch("lampu_teras", 1)
        basic.showIcon(IconNames.Yes)
    }

    basic.pause(1000)

    if (esp8266.isFirebaseDataSent()) {
        basic.showString("OK")
    } else {
        basic.showString("FAIL")
    }
})

// ============================================================================
// INSTRUCTIONS
// ============================================================================
/*
HOW TO USE:
1. Replace WiFi credentials and Firebase config above
2. Upload to micro:bit
3. Test the buttons:
   - Press A = Turn lamp ON (write value=1 to Firebase)
   - Press B = Read lamp status from Firebase
   - Press A+B = Toggle lamp status

EXPECTED FIREBASE STRUCTURE:
{
  "test": {
    "lampu_teras": {
      "tipe": "switch",
      "value": 1
    }
  }
}

FUNCTIONS USED:
- esp8266.firebaseSendSwitch(deviceName, value)
  → Sends {"tipe":"switch","value":1or0} to Firebase
  
- esp8266.readFirebaseNumber(deviceName)
  → Reads the "value" field from Firebase and returns as number
  
- esp8266.readFirebaseValue(deviceName)
  → Reads the "value" field from Firebase and returns as string

TROUBLESHOOTING:
- If READ returns 0 but data exists in Firebase:
  1. Check WiFi connection (should show Yes icon)
  2. Check Firebase path is correct ("test")
  3. Verify device name matches ("lampu_teras")
  4. Check Firebase Rules allow reading
  
- If WRITE fails:
  1. Check Firebase API key is correct
  2. Check Firebase Rules allow writing
  3. Check internet connection
*/
