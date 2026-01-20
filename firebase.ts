/*******************************************************************************
 * Functions for Firebase Realtime Database
 *
 * Author: PMJ
 * Firebase integration added to ESP8266 extension
 * Original ESP8266 extension by: Cytron Technologies Sdn Bhd
 *******************************************************************************/

namespace esp8266 {
    // Firebase configuration variables
    let firebaseApiKey = ""
    let firebaseDatabaseURL = ""
    let firebaseProjectId = ""
    let firebasePath = "iot"  // Default path

    // Flag to indicate whether the data was sent to Firebase successfully.
    let firebaseDataSent = false



    /**
     * Return true if data is sent to Firebase successfully.
     */
    //% subcategory="Firebase"
    //% weight=30
    //% blockGap=8
    //% blockId=esp8266_is_firebase_data_sent
    //% block="Firebase data sent"
    export function isFirebaseDataSent(): boolean {
        return firebaseDataSent
    }



    /**
     * Configure Firebase connection.
     * Get these values from Firebase Console.
     * @param apiKey Firebase API Key.
     * @param databaseURL Firebase Database URL (e.g., https://project-id.firebaseio.com).
     * @param projectId Firebase Project ID.
     */
    //% subcategory="Firebase"
    //% weight=29
    //% blockGap=8
    //% blockId=esp8266_configure_firebase
    //% block="setup Firebase|API Key %apiKey|Database URL %databaseURL|Project ID %projectId"
    export function configureFirebase(apiKey: string, databaseURL: string, projectId: string) {
        firebaseApiKey = apiKey
        firebaseDatabaseURL = databaseURL
        firebaseProjectId = projectId
    }



    /**
     * Set Firebase path where all data will be sent.
     * Call this once at the beginning.
     * @param path Firebase path (e.g., "test", "iot", "devices").
     */
    //% subcategory="Firebase"
    //% weight=28
    //% blockGap=8
    //% blockId=esp8266_set_firebase_path
    //% block="set Firebase path %path"
    //% path.defl="iot"
    export function setFirebasePath(path: string) {
        firebasePath = path
    }



    /**
     * Read device value from Firebase.
     * Returns the value as a string.
     * @param deviceName Name of device to read (e.g., "lampu", "suhu").
     */
    //% subcategory="Firebase"
    //% weight=27
    //% blockGap=40
    //% blockId=esp8266_read_firebase_value
    //% block="Firebase read value of %deviceName"
    export function readFirebaseValue(deviceName: string): string {
        // Make sure WiFi is connected
        if (isWifiConnected() == false) return ""

        // Make sure Firebase is configured
        if (firebaseDatabaseURL == "" || firebaseApiKey == "") return ""

        // Build full path
        let fullPath = firebasePath + "/" + deviceName

        // Remove leading slash if present
        if (fullPath.charAt(0) == "/") {
            fullPath = fullPath.substr(1)
        }

        // Extract host from database URL
        let host = firebaseDatabaseURL
        if (host.includes("https://")) {
            host = host.substr(8)
        }
        if (host.includes("http://")) {
            host = host.substr(7)
        }
        if (host.charAt(host.length - 1) == "/") {
            host = host.substr(0, host.length - 1)
        }

        // Connect to Firebase
        if (sendCommand("AT+CIPSTART=\"SSL\",\"" + host + "\",443", "OK", 10000) == false) return ""

        // Construct GET request
        let requestPath = "/" + fullPath + ".json?auth=" + firebaseApiKey
        let httpRequest = "GET " + requestPath + " HTTP/1.1\r\n"
        httpRequest += "Host: " + host + "\r\n"
        httpRequest += "\r\n"

        // Send request
        sendCommand("AT+CIPSEND=" + httpRequest.length)
        sendCommand(httpRequest, null, 100)

        // Get response
        let response = getResponse("+IPD", 3000)
        sendCommand("AT+CIPCLOSE", "OK", 1000)

        if (response == "") return ""

        // Parse JSON to get "value" field
        let valueIndex = response.indexOf("\"value\":")
        if (valueIndex == -1) return ""

        // Find the value after "value":
        let startIndex = valueIndex + 8
        let valueStr = response.substr(startIndex)

        // Find end of value (comma, closing brace, or quote)
        let endIndex = 0
        let isString = valueStr.charAt(0) == "\""

        if (isString) {
            // String value - find closing quote
            valueStr = valueStr.substr(1)
            endIndex = valueStr.indexOf("\"")
        } else {
            // Number value - find comma or brace
            for (let i = 0; i < valueStr.length; i++) {
                let char = valueStr.charAt(i)
                if (char == "," || char == "}") {
                    endIndex = i
                    break
                }
            }
        }

        if (endIndex == 0) endIndex = valueStr.length

        return valueStr.substr(0, endIndex).trim()
    }



    /**
     * Send data to Firebase Realtime Database.
     * @param path Database path (e.g., /iot).
     * @param jsonData JSON data to send.
     */
    //% subcategory="Firebase"
    //% weight=28
    //% blockGap=8
    //% blockId=esp8266_send_firebase_data
    //% block="send to Firebase|path %path|data %jsonData"
    //% advanced=true
    export function sendFirebaseData(path: string, jsonData: string) {
        // Reset the flag.
        firebaseDataSent = false

        // Make sure the WiFi is connected.
        if (isWifiConnected() == false) return

        // Make sure Firebase is configured.
        if (firebaseDatabaseURL == "" || firebaseApiKey == "") return

        // Remove leading slash if present
        if (path.charAt(0) == "/") {
            path = path.substr(1)
        }

        // Extract host from database URL
        let host = firebaseDatabaseURL
        if (host.includes("https://")) {
            host = host.substr(8)
        }
        if (host.includes("http://")) {
            host = host.substr(7)
        }
        // Remove trailing slash if present
        if (host.charAt(host.length - 1) == "/") {
            host = host.substr(0, host.length - 1)
        }

        // Connect to Firebase. Return if failed.
        if (sendCommand("AT+CIPSTART=\"SSL\",\"" + host + "\",443", "OK", 10000) == false) return

        // Construct the HTTP PUT request
        let requestPath = "/" + path + ".json?auth=" + firebaseApiKey
        let httpRequest = "PUT " + requestPath + " HTTP/1.1\r\n"
        httpRequest += "Host: " + host + "\r\n"
        httpRequest += "Content-Type: application/json\r\n"
        httpRequest += "Content-Length: " + jsonData.length + "\r\n"
        httpRequest += "\r\n"
        httpRequest += jsonData

        // Send the request
        sendCommand("AT+CIPSEND=" + httpRequest.length)
        sendCommand(httpRequest, null, 100)

        // Return if "SEND OK" is not received.
        if (getResponse("SEND OK", 2000) == "") {
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            return
        }

        // Check the response from Firebase.
        let response = getResponse("HTTP/1.1", 2000)
        if (response == "" || !response.includes("200")) {
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            return
        }

        // Close the connection.
        sendCommand("AT+CIPCLOSE", "OK", 1000)

        firebaseDataSent = true
        return
    }



    /**
     * Send SWITCH (ON/OFF) to Firebase.
     * Perfect for: lights, fans, pumps, etc.
     * @param deviceName Name of device (e.g., "lampu").
     * @param value 0 = OFF, 1 = ON.
     */
    //% subcategory="Firebase"
    //% weight=27
    //% blockGap=8
    //% blockId=esp8266_firebase_switch
    //% block="Firebase send SWITCH|name %deviceName|value %value"
    //% value.min=0 value.max=1
    //% value.defl=0
    export function firebaseSendSwitch(deviceName: string, value: number) {
        let json = "{\"" + deviceName + "\":{\"tipe\":\"switch\",\"value\":" + value + "}}"
        sendFirebaseData(firebasePath, json)
    }



    /**
     * Send DIMMER (0-1024) to Firebase.
     * Perfect for: fan speed, LED brightness, motor speed, etc.
     * @param deviceName Name of device (e.g., "kipas").
     * @param value Value from 0 to 1024.
     */
    //% subcategory="Firebase"
    //% weight=26
    //% blockGap=8
    //% blockId=esp8266_firebase_dimmer
    //% block="Firebase send DIMMER|name %deviceName|value %value"
    //% value.min=0 value.max=1024
    //% value.defl=512
    export function firebaseSendDimmer(deviceName: string, value: number) {
        let json = "{\"" + deviceName + "\":{\"tipe\":\"dimmer\",\"value\":" + value + ",\"batas_atas\":1024}}"
        sendFirebaseData(firebasePath, json)
    }



    /**
     * Send SENSOR reading to Firebase.
     * Perfect for: temperature, light, humidity, etc.
     * @param deviceName Name of sensor (e.g., "suhu").
     * @param value Sensor reading.
     * @param unit Unit of measurement (e.g., "C", "%", "lux").
     */
    //% subcategory="Firebase"
    //% weight=25
    //% blockGap=40
    //% blockId=esp8266_firebase_sensor
    //% block="Firebase send SENSOR|name %deviceName|value %value|unit %unit"
    //% value.defl=0
    //% unit.defl="C"
    export function firebaseSendSensor(deviceName: string, value: number, unit: string) {
        let json = "{\"" + deviceName + "\":{\"tipe\":\"sensor\",\"value\":" + value + ",\"satuan\":\"" + unit + "\"}}"
        sendFirebaseData(firebasePath, json)
    }
}
