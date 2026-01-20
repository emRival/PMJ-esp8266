// ============================================================================
// CONTOH BENAR - Baca Status Lampu dari Firebase
// ============================================================================

// STEP 1: GANTI DATA INI
let WIFI = "Ubuntu"
let PASS = "ubuntuoke"
let API = "AIzaSyBeA_kpqQghfkmfM7y2v6I1nWAxFHIxFKg"
let URL = "https://wikwo-test-default-rtdb.firebaseio.com"
let PROJECT = "wikwo-test"

// STEP 2: SETUP (Otomatis jalan saat micro:bit nyala)
esp8266.init(SerialPin.P16, SerialPin.P15, BaudRate.BaudRate115200)
esp8266.connectWiFi(WIFI, PASS)
esp8266.configureFirebase(API, URL, PROJECT)
esp8266.setFirebasePath("test")
basic.showIcon(IconNames.Heart)

// Variable untuk status lampu
let statusLampu = ""

// ============================================================================
// CARA 1: Baca status lampu saat tombol A ditekan
// ============================================================================
input.onButtonPressed(Button.A, function () {
    // Baca status dari Firebase
    statusLampu = esp8266.readFirebaseValue("lampu_teras")

    // Tampilkan status
    basic.showString("L:" + statusLampu)

    // Kontrol pin berdasarkan status
    if (statusLampu == "1") {
        pins.digitalWritePin(DigitalPin.P8, 1)  // Nyalakan lampu
        basic.showIcon(IconNames.Heart)
    } else if (statusLampu == "0") {
        pins.digitalWritePin(DigitalPin.P8, 0)  // Matikan lampu
        basic.showIcon(IconNames.SmallHeart)
    } else {
        basic.showIcon(IconNames.No)  // Error
    }
})

// ============================================================================
// CARA 2: Kirim status lampu saat tombol B ditekan
// ============================================================================
input.onButtonPressed(Button.B, function () {
    // Toggle lampu
    if (statusLampu == "1") {
        esp8266.firebaseSendSwitch("lampu_teras", 0)
        statusLampu = "0"
    } else {
        esp8266.firebaseSendSwitch("lampu_teras", 1)
        statusLampu = "1"
    }

    basic.showString("Send:" + statusLampu)
})

// ============================================================================
// CARA 3: Auto-check status setiap 5 detik (RECOMMENDED)
// ============================================================================
basic.forever(function () {
    // Delay 5 detik (PENTING!)
    basic.pause(5000)

    // Baca status lampu dari Firebase
    statusLampu = esp8266.readFirebaseValue("lampu_teras")

    // Kontrol lampu berdasarkan status
    if (statusLampu == "1") {
        pins.digitalWritePin(DigitalPin.P8, 1)
        led.plot(0, 0)  // Indicator ON
    } else if (statusLampu == "0") {
        pins.digitalWritePin(DigitalPin.P8, 0)
        led.unplot(0, 0)  // Indicator OFF
    }

    // Kirim sensor cahaya setiap 5 detik juga
    basic.pause(1000)
    esp8266.firebaseSendSensor("cahaya", pins.analogReadPin(AnalogPin.P0), "lux")
})

// ============================================================================
// TIPS DEBUGGING:
// ============================================================================
/*
1. Pastikan WiFi connect (lihat icon di micro:bit)
2. Pastikan Firebase sudah configured
3. Cek data di Firebase Console:
   https://console.firebase.google.com
   
4. Struktur data harus seperti ini:
   /test
     ├─ lampu_teras
     │   ├─ tipe: "switch"
     │   └─ value: 0 atau 1
     └─ cahaya
         ├─ tipe: "sensor"
         ├─ value: 512
         └─ satuan: "lux"

5. Jangan gunakan parseFloat() - tidak ada di MakeCode!
   Gunakan string comparison: if (status == "1")
   
6. Tambah delay di loop forever (minimal 3-5 detik)
   Jangan spam request ke Firebase!
*/
