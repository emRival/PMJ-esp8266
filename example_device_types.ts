/*******************************************************************************
 * CONTOH: Device Types (Switch, Dimmer, Sensor)
 * 
 * Author: PMJ
 * 
 * Demonstrasi penggunaan fungsi-fungsi device type:
 * - Switch (ON/OFF)
 * - Dimmer (0-1024 dengan satuan)
 * - Sensor (read-only dengan satuan)
 * - Read value spesifik dari Firebase
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
// BUTTON A: Kirim SWITCH (Lampu ON/OFF)
// ============================================================================

input.onButtonPressed(Button.A, function () {
    // Baca status button
    let buttonPressed = pins.digitalReadPin(DigitalPin.P1)

    // Buat JSON untuk SWITCH
    let switchData = esp8266.createSwitchJSON(buttonPressed == 1)

    // Kirim ke Firebase dengan struktur:
    // /controls/lampu_teras = {"tipe":"switch","value":true}
    esp8266.sendDeviceData("/controls", "lampu_teras", switchData)

    if (esp8266.isFirebaseDataSent()) {
        if (buttonPressed == 1) {
            basic.showIcon(IconNames.Heart)  // ON
        } else {
            basic.showIcon(IconNames.SmallHeart)  // OFF
        }
    }
})

// ============================================================================
// BUTTON B: Kirim DIMMER (Kipas Angin dengan PWM)
// ============================================================================

input.onButtonPressed(Button.B, function () {
    // Baca analog value (0-1024)
    let fanSpeed = pins.analogReadPin(AnalogPin.P0)

    // Buat JSON untuk DIMMER dengan struktur lengkap
    let dimmerData = esp8266.createDimmerJSON(
        fanSpeed,    // value
        1024,        // batas_atas
        "%"          // satuan
    )

    // Kirim ke Firebase dengan struktur:
    // /controls/kipas_angin = {"tipe":"dimmer","value":512,"batas_atas":1024,"satuan":"%"}
    esp8266.sendDeviceData("/controls", "kipas_angin", dimmerData)

    if (esp8266.isFirebaseDataSent()) {
        basic.showNumber(Math.round(fanSpeed / 10.24))  // Show as percentage
    }
})

// ============================================================================
// BUTTON A+B: Kirim SENSOR (Temperature)
// ============================================================================

input.onButtonPressed(Button.AB, function () {
    // Baca temperature sensor
    let temp = input.temperature()

    // Buat JSON untuk SENSOR
    let sensorData = esp8266.createSensorJSON(
        temp,    // value
        "°C"     // satuan
    )

    // Kirim ke Firebase dengan struktur:
    // /sensors/suhu_ruangan = {"tipe":"sensor","value":25,"satuan":"°C"}
    esp8266.sendDeviceData("/sensors", "suhu_ruangan", sensorData)

    if (esp8266.isFirebaseDataSent()) {
        basic.showNumber(temp)
    }
})

// ============================================================================
// SHAKE: READ VALUE dari Firebase
// ============================================================================

input.onGesture(Gesture.Shake, function () {
    // Read VALUE saja dari kipas_angin
    // Akan baca dari: /controls/kipas_angin
    // Dan ambil field "value" saja
    let fanValue = esp8266.readFirebaseValue("/controls", "kipas_angin")

    if (fanValue != "") {
        // Tampilkan value yang dibaca
        let valueNum = parseInt(fanValue)
        basic.showNumber(Math.round(valueNum / 10.24))  // Show as percentage
    } else {
        basic.showIcon(IconNames.No)
    }
})

// ============================================================================
// CONTOH LENGKAP: Kirim Multiple Devices
// ============================================================================

basic.forever(function () {
    basic.pause(30000)  // Setiap 30 detik

    // 1. Kirim sensor temperature
    let temp = input.temperature()
    esp8266.sendDeviceData(
        "/sensors",
        "suhu_ruangan",
        esp8266.createSensorJSON(temp, "°C")
    )

    basic.pause(1000)

    // 2. Kirim sensor light
    let light = input.lightLevel()
    esp8266.sendDeviceData(
        "/sensors",
        "cahaya",
        esp8266.createSensorJSON(light, "lux")
    )

    basic.pause(1000)

    // 3. Kirim status switch
    let buttonState = pins.digitalReadPin(DigitalPin.P1)
    esp8266.sendDeviceData(
        "/controls",
        "saklar_utama",
        esp8266.createSwitchJSON(buttonState == 1)
    )
})

// ============================================================================
// STRUKTUR DATA DI FIREBASE
// ============================================================================

/*
Firebase Structure:

{
  "controls": {
    "lampu_teras": {
      "tipe": "switch",
      "value": true
    },
    "kipas_angin": {
      "tipe": "dimmer",
      "value": 512,
      "batas_atas": 1024,
      "satuan": "%"
    },
    "saklar_utama": {
      "tipe": "switch",
      "value": false
    }
  },
  "sensors": {
    "suhu_ruangan": {
      "tipe": "sensor",
      "value": 25,
      "satuan": "°C"
    },
    "cahaya": {
      "tipe": "sensor",
      "value": 128,
      "satuan": "lux"
    }
  }
}
*/
