// ============================================================================
// RESPONSIVE FIREBASE - Tidak Lag, Real-time!
// ============================================================================

// STEP 1: GANTI DATA INI
let WIFI = "Ubuntu"
let PASS = "ubuntuoke"
let API = "AIzaSyBeA_kpqQghfkmfM7y2v6I1nWAxFHIxFKg"
let URL = "https://wikwo-test-default-rtdb.firebaseio.com"
let PROJECT = "wikwo-test"

// STEP 2: SETUP
esp8266.init(SerialPin.P16, SerialPin.P15, BaudRate.BaudRate115200)
esp8266.connectWiFi(WIFI, PASS)
esp8266.configureFirebase(API, URL, PROJECT)
esp8266.setFirebasePath("test")
basic.showIcon(IconNames.Heart)

// Variable
let statusLampu = 0
let lastReadTime = 0
let lastSendTime = 0

// ============================================================================
// RESPONSIVE: Baca status hanya setiap 3 detik (tidak blocking!)
// ============================================================================
basic.forever(function () {
    let currentTime = input.runningTime()

    // Baca status lampu setiap 3 detik
    if (currentTime - lastReadTime >= 3000) {
        statusLampu = esp8266.readFirebaseNumber("lampu_teras")  // ← RETURN NUMBER!
        lastReadTime = currentTime

        // Kontrol lampu
        if (statusLampu == 1) {
            pins.digitalWritePin(DigitalPin.P8, 1)
            led.plot(0, 0)
        } else {
            pins.digitalWritePin(DigitalPin.P8, 0)
            led.unplot(0, 0)
        }
    }

    // Kirim sensor cahaya setiap 5 detik (terpisah!)
    if (currentTime - lastSendTime >= 5000) {
        let cahaya = pins.analogReadPin(AnalogPin.P0)
        esp8266.firebaseSendSensor("cahaya", cahaya, "lux")
        lastSendTime = currentTime
    }

    // Delay kecil agar tidak spam
    basic.pause(100)
})

// ============================================================================
// INSTANT: Kirim switch saat tombol A (langsung responsive!)
// ============================================================================
input.onButtonPressed(Button.A, function () {
    // Toggle lampu
    if (statusLampu == 1) {
        esp8266.firebaseSendSwitch("lampu_teras", 0)
        statusLampu = 0
        basic.showIcon(IconNames.SmallHeart)
    } else {
        esp8266.firebaseSendSwitch("lampu_teras", 1)
        statusLampu = 1
        basic.showIcon(IconNames.Heart)
    }
})

// ============================================================================
// INSTANT: Baca status saat tombol B (on-demand!)
// ============================================================================
input.onButtonPressed(Button.B, function () {
    statusLampu = esp8266.readFirebaseNumber("lampu_teras")
    basic.showNumber(statusLampu)
})

// ============================================================================
// KEUNGGULAN CODE INI:
// ============================================================================
/*
✅ TIDAK LAG:
   - Read dan Send dipisah dengan timer
   - Tidak blocking satu sama lain
   
✅ RESPONSIVE:
   - Button langsung kirim, tidak tunggu loop
   - Pakai input.runningTime() untuk timing
   
✅ RETURN NUMBER:
   - readFirebaseNumber() return angka (0 atau 1)
   - Bisa langsung compare: if (status == 1)
   - Bisa math operation: status + 1, status * 2, dll
   
✅ EFFICIENT:
   - Read setiap 3 detik
   - Send setiap 5 detik
   - Tidak spam request
*/
