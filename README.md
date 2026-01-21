# PMJ ESP8266 Extension for Microsoft MakeCode

This library provides the driver for ESP8266 WiFi Module with **Firebase Realtime Database** support.  
This extension is tested with Espressif ESP-AT Firmware v2.2.0.

**Modified by:** PMJ  
**Original Extension:** [Cytron Technologies - ESP8266 WiFi Grove Module](https://www.cytron.io/p-grv-wifi-8266)

![ESP8266 WiFi Grove Module](https://raw.githubusercontent.com/emRival/PMJ-esp8266/main/icon.png)

## Quick Start

See [EXAMPLE.ts](EXAMPLE.ts) for a comprehensive example demonstrating all features.

## Installation

1. Open your MakeCode project
2. Click on **Extensions** in the gearwheel menu
3. Search for `https://github.com/emRival/PMJ-esp8266`
4. Click on the extension to install

## Initialization

Initialize the ESP8266 module with UART pins and baudrate:

```blocks
esp8266.init(SerialPin.P16, SerialPin.P15, BaudRate.BaudRate115200)
```

Check if initialization is successful:

```blocks
if (esp8266.isESP8266Initialized()) {
    basic.showIcon(IconNames.Happy)
} else {
    basic.showIcon(IconNames.Sad)
}
```

## WiFi Connection

Connect to your WiFi router:

```blocks
esp8266.connectWiFi("YOUR_WIFI_SSID", "YOUR_WIFI_PASSWORD")
```

Verify connection status:

```blocks
if (esp8266.isWifiConnected()) {
    basic.showIcon(IconNames.Happy)
} else {
    basic.showIcon(IconNames.Sad)
}
```

## Firebase Realtime Database

### Configuration

Configure Firebase connection (get credentials from [Firebase Console](https://console.firebase.google.com)):

```blocks
esp8266.configureFirebase(
    "YOUR_FIREBASE_API_KEY",
    "https://your-project.firebaseio.com",
    "your-project-id"
)

// Set the path where data will be stored
esp8266.setFirebasePath("iot")
```

### Device Types

The extension supports three device types optimized for IoT applications:

#### 1. SWITCH (ON/OFF Devices)

Use for lights, relays, motors, etc.

```blocks
// Send SWITCH data (0 = OFF, 1 = ON)
esp8266.firebaseSendSwitch("lampu_teras", 1)

// Check if sent successfully
if (esp8266.isFirebaseDataSent()) {
    basic.showIcon(IconNames.Yes)
}
```

Firebase structure:
```json
{
  "iot": {
    "lampu_teras": {
      "tipe": "switch",
      "value": 1
    }
  }
}
```

#### 2. SENSOR (Measurement Devices)

Use for temperature, humidity, light sensors, etc.

```blocks
// Send SENSOR data with unit
let temperature = input.temperature()
esp8266.firebaseSendSensor("suhu", temperature, "C")

// Check status
if (esp8266.isFirebaseDataSent()) {
    basic.showIcon(IconNames.Yes)
}
```

Firebase structure:
```json
{
  "iot": {
    "suhu": {
      "tipe": "sensor",
      "value": 28,
      "satuan": "C"
    }
  }
}
```

#### 3. DIMMER (PWM/Variable Devices)

Use for fan speed, LED brightness, servo position (0-1024 range).

```blocks
// Send DIMMER data (0-1024)
esp8266.firebaseSendDimmer("kipas", 512)

// Check status
if (esp8266.isFirebaseDataSent()) {
    basic.showIcon(IconNames.Yes)
}
```

Firebase structure:
```json
{
  "iot": {
    "kipas": {
      "tipe": "dimmer",
      "value": 512,
      "batas_atas": 1024
    }
  }
}
```

### Reading from Firebase

Read device values from Firebase:

```blocks
// Read as NUMBER (returns 0 if error/empty)
let lampStatus = esp8266.readFirebaseNumber("lampu_teras")

if (lampStatus == 1) {
    basic.showString("ON")
} else {
    basic.showString("OFF")
}
```

Alternative reading method:

```blocks
// Also returns number
let value = esp8266.readFirebaseValue("lampu_teras")
basic.showNumber(value)
```

### Complete Firebase Example

```blocks
// Initialize ESP8266
esp8266.init(SerialPin.P16, SerialPin.P15, BaudRate.BaudRate115200)

// Connect WiFi
esp8266.connectWiFi("YOUR_WIFI_SSID", "YOUR_WIFI_PASSWORD")

// Configure Firebase
esp8266.configureFirebase(
    "YOUR_FIREBASE_API_KEY",
    "https://your-project.firebaseio.com",
    "your-project-id"
)
esp8266.setFirebasePath("iot")

// On Button A: Turn ON light
input.onButtonPressed(Button.A, function () {
    esp8266.firebaseSendSwitch("lampu_teras", 1)
    if (esp8266.isFirebaseDataSent()) {
        basic.showIcon(IconNames.Yes)
    }
})

// On Button B: Send temperature
input.onButtonPressed(Button.B, function () {
    let temp = input.temperature()
    esp8266.firebaseSendSensor("suhu", temp, "C")
    if (esp8266.isFirebaseDataSent()) {
        basic.showNumber(temp)
    }
})

// On Shake: Read light status
input.onGesture(Gesture.Shake, function () {
    let status = esp8266.readFirebaseNumber("lampu_teras")
    if (status == 1) {
        basic.showString("ON")
    } else {
        basic.showString("OFF")
    }
})
```

## Thingspeak

Upload data to Thingspeak (maximum once every 15 seconds):

```blocks
esp8266.uploadThingspeak("YOUR_WRITE_API_KEY", 0, 1, 2, 3, 4, 5, 6, 7)

if (esp8266.isThingspeakUploaded()) {
    basic.showIcon(IconNames.Happy)
}
```

## Blynk

Read from Blynk virtual pin:

```blocks
let value = esp8266.readBlynk("YOUR_BLYNK_TOKEN", "V0")
```

Write to Blynk virtual pin:

```blocks
esp8266.writeBlynk("YOUR_BLYNK_TOKEN", "V1", "100")
```

Check status:

```blocks
if (esp8266.isBlynkUpdated()) {
    basic.showIcon(IconNames.Happy)
}
```

## Internet Time (SNTP)

Initialize internet time with timezone offset:

```blocks
// Timezone +8 for Singapore/Malaysia/Philippines
esp8266.initInternetTime(8)

if (esp8266.isInternetTimeInitialized()) {
    basic.showIcon(IconNames.Yes)
}
```

Update and display current time:

```blocks
esp8266.updateInternetTime()

if (esp8266.isInternetTimeUpdated()) {
    let time = esp8266.getHour() + ":" + esp8266.getMinute() + ":" + esp8266.getSecond()
    basic.showString(time)
}
```

## Troubleshooting

### WiFi Connection Issues
- Verify SSID and password are correct
- Ensure ESP8266 module is properly powered (3.3V, sufficient current)
- Try different baudrate (9600 if 115200 doesn't work)

### Firebase Issues
- Double-check API key and database URL
- Verify Firebase Rules allow read/write access
- Ensure WiFi is connected before Firebase operations
- Allow 500ms delay between consecutive requests

### Read Returns 0 or Empty
- Verify device name matches exactly what's in Firebase
- Check Firebase Rules allow read access
- Make sure data exists in Firebase (write first, then read)
- Confirm WiFi connection is stable

## Example Code

For a complete working example, see [EXAMPLE.ts](EXAMPLE.ts) which demonstrates:
- WiFi initialization and connection
- Firebase configuration
- Sending SWITCH, SENSOR, and DIMMER data
- Reading values from Firebase
- Error handling and status checking

## License

MIT

## Supported Targets

* PXT/microbit

## Version History

- **v1.0.0** - First stable release with optimized Firebase support
  - Improved Firebase read/write reliability
  - Added device type helpers (Switch, Sensor, Dimmer)
  - Enhanced error handling
  - Comprehensive documentation
