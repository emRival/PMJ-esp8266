/*******************************************************************************
 * CONTOH: Multi-Device JSON (Kirim Semua Sekaligus)
 * 
 * Author: PMJ
 * 
 * Demonstrasi kirim multiple devices dalam satu JSON ke Firebase
 * Lebih efisien daripada kirim satu-satu!
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
// BUTTON A: Kirim SEMUA DEVICE SEKALIGUS
// ============================================================================

input.onButtonPressed(Button.A, function () {
    // 1. Start building JSON
    let allDevices = esp8266.startMultiDeviceJSON()

    // 2. Add Switch (lampu taman)
    allDevices = esp8266.addSwitchToMultiJSON(
        allDevices,
        "lampu_taman",
        pins.digitalReadPin(DigitalPin.P1) == 1
    )

    // 3. Add Dimmer (Kipas)
    allDevices = esp8266.addDimmerToMultiJSON(
        allDevices,
        "Kipas",
        pins.analogReadPin(AnalogPin.P0),
        1024
    )

    // 4. Add Sensor (suhu)
    allDevices = esp8266.addSensorToMultiJSON(
        allDevices,
        "suhu",
        input.temperature(),
        100,
        "C"
    )

    // 5. Finish building JSON
    allDevices = esp8266.finishMultiDeviceJSON(allDevices)

    // 6. Kirim ke Firebase di path /iot
    esp8266.sendFirebaseData("/iot", allDevices)

    if (esp8266.isFirebaseDataSent()) {
        basic.showIcon(IconNames.Yes)
    } else {
        basic.showIcon(IconNames.No)
    }
})

// ============================================================================
// BUTTON B: Kirim dengan lebih banyak sensor
// ============================================================================

input.onButtonPressed(Button.B, function () {
    // Build JSON dengan semua sensor
    let json = esp8266.startMultiDeviceJSON()

    // Switch devices
    json = esp8266.addSwitchToMultiJSON(json, "lampu_taman", true)
    json = esp8266.addSwitchToMultiJSON(json, "lampu_teras", false)
    json = esp8266.addSwitchToMultiJSON(json, "pompa_air", true)

    // Dimmer devices
    json = esp8266.addDimmerToMultiJSON(json, "Kipas", 512, 1024)
    json = esp8266.addDimmerToMultiJSON(json, "lampu_dimmer", 768, 1024)

    // Sensor devices
    json = esp8266.addSensorToMultiJSON(json, "suhu", input.temperature(), 100, "C")
    json = esp8266.addSensorToMultiJSON(json, "cahaya", input.lightLevel(), 255, "lux")
    json = esp8266.addSensorToMultiJSON(json, "kompas", input.compassHeading(), 360, "deg")

    // Finish and send
    json = esp8266.finishMultiDeviceJSON(json)
    esp8266.sendFirebaseData("/iot", json)

    if (esp8266.isFirebaseDataSent()) {
        basic.showNumber(8)  // 8 devices sent!
    }
})

// ============================================================================
// AUTO-UPDATE: Kirim semua device setiap 30 detik
// ============================================================================

basic.forever(function () {
    basic.pause(30000)  // 30 seconds

    // Build complete device list
    let devices = esp8266.startMultiDeviceJSON()

    // Add all devices
    devices = esp8266.addSwitchToMultiJSON(
        devices,
        "lampu_taman",
        pins.digitalReadPin(DigitalPin.P1) == 1
    )

    devices = esp8266.addDimmerToMultiJSON(
        devices,
        "Kipas",
        pins.analogReadPin(AnalogPin.P0),
        1024
    )

    devices = esp8266.addSensorToMultiJSON(
        devices,
        "suhu",
        input.temperature(),
        100,
        "C"
    )

    devices = esp8266.finishMultiDeviceJSON(devices)

    // Send to Firebase
    esp8266.sendFirebaseData("/iot", devices)

    // Show indicator
    if (esp8266.isFirebaseDataSent()) {
        led.plot(4, 0)  // Success indicator
        basic.pause(100)
        led.unplot(4, 0)
    }
})

// ============================================================================
// HASIL DI FIREBASE
// ============================================================================

/*
Struktur data di Firebase path /iot:

{
  "lampu_taman": {
    "tipe": "switch",
    "value": 1
  },
  "Kipas": {
    "tipe": "dimmer",
    "batas_atas": 1024,
    "value": 254
  },
  "suhu": {
    "tipe": "sensor",
    "batas_atas": 100,
    "value": 43,
    "satuan": "C"
  }
}

KEUNTUNGAN:
✅ Hanya 1x HTTP request (lebih cepat!)
✅ Semua data update bersamaan (atomic)
✅ Hemat bandwidth dan battery
✅ Lebih efisien untuk banyak device
*/
