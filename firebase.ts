/**
 * Support for Firebase Realtime Database.
 */
namespace esp8266 {
    let firebaseApiKey = ""
    let firebaseDatabaseURL = ""
    let firebaseProjectId = ""
    let firebasePath = "iot" // Default path
    let firebaseDataSent = false

    /**
     * Configure Firebase parameters.
     * @param apiKey API Key from Firebase Console.
     * @param databaseURL Database URL (e.g., https://your-project.firebaseio.com).
     * @param projectId Project ID (e.g., your-project).
     */
    //% subcategory="Firebase"
    //% weight=30
    //% blockGap=8
    //% blockId=esp8266_configure_firebase
    //% block="Firebase config|API Key %apiKey|URL %databaseURL|Project ID %projectId"
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

        // Wait for response - look for +IPD
        let response = getResponse("+IPD", 4000)
        sendCommand("AT+CIPCLOSE", "OK", 1000)

        if (response == "") return ""

        // Find formatted response: +IPD,length:DATA
        // Find colon after +IPD which marks start of data
        let ipdIndex = response.indexOf("+IPD")
        if (ipdIndex == -1) return ""

        let colonIndex = response.indexOf(":", ipdIndex)
        if (colonIndex == -1) return ""

        // Get the full HTTP response (headers + body)
        let httpResponse = response.substr(colonIndex + 1)

        // Find end of headers (double CRLF) to locate Body
        let bodyIndex = httpResponse.indexOf("\r\n\r\n")
        if (bodyIndex == -1) {
            // Fallback: try to find start of JSON directly if headers are malformed or not found as expected
            bodyIndex = httpResponse.indexOf("{")
            if (bodyIndex == -1) return ""
        } else {
            // Skip the \r\n\r\n (4 characters)
            bodyIndex += 4
        }

        let jsonData = httpResponse.substr(bodyIndex)

        // Ensure we are looking at the JSON object
        let jsonStart = jsonData.indexOf("{")
        if (jsonStart == -1) return ""
        jsonData = jsonData.substr(jsonStart)

        // Parse JSON to get "value" field
        // We look for "value":
        let valueIndex = jsonData.indexOf("\"value\":")
        if (valueIndex == -1) return ""

        // Find the value after "value":
        let startIndex = valueIndex + 8
        let valueStr = jsonData.substr(startIndex)

        // Skip whitespace
        while (valueStr.charAt(0) == " " || valueStr.charAt(0) == "\t") {
            valueStr = valueStr.substr(1)
        }

        // Find end of value
        let endIndex = 0
        let isString = valueStr.charAt(0) == "\""

        if (isString) {
            // String value - find closing quote
            valueStr = valueStr.substr(1)
            endIndex = valueStr.indexOf("\"")
            if (endIndex == -1) endIndex = valueStr.length
        } else {
            // Number value - find comma, brace, or whitespace
            for (let i = 0; i < valueStr.length; i++) {
                let char = valueStr.charAt(i)
                if (char == "," || char == "}" || char == " " || char == "\r" || char == "\n") {
                    endIndex = i
                    break
                }
            }
            if (endIndex == 0) endIndex = valueStr.length
        }

        return valueStr.substr(0, endIndex).trim()
    }



    /**
     * Read device value from Firebase as NUMBER.
     * Returns the value as a number (0 if error).
     * @param deviceName Name of device to read (e.g., "lampu", "suhu").
     */
    //% subcategory="Firebase"
    //% weight=26
    //% blockGap=40
    //% blockId=esp8266_read_firebase_number
    //% block="Firebase read NUMBER of %deviceName"
    export function readFirebaseNumber(deviceName: string): number {
        let valueStr = readFirebaseValue(deviceName)
        if (valueStr == "") return 0

        // Convert string to number
        let result = 0
        let isNegative = false
        let hasDecimal = false
        let decimalPlace = 0

        for (let i = 0; i < valueStr.length; i++) {
            let char = valueStr.charAt(i)

            if (char == "-" && i == 0) {
                isNegative = true
            } else if (char == ".") {
                hasDecimal = true
            } else if (char >= "0" && char <= "9") {
                let digit = char.charCodeAt(0) - 48  // ASCII '0' = 48

                if (hasDecimal) {
                    decimalPlace++
                    result = result + digit / Math.pow(10, decimalPlace)
                } else {
                    result = result * 10 + digit
                }
            }
        }

        return isNegative ? -result : result
    }



    /**
     * Send data to Firebase Realtime Database.
     * @param path Database path (e.g., /iot).
     * @param jsonData JSON data to send.
     */
    //% blockHidden=true
    //% blockId=esp8266_send_firebase_data
    export function sendFirebaseData(path: string, jsonData: string) {
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
        if (host.charAt(host.length - 1) == "/") {
            host = host.substr(0, host.length - 1)
        }

        // Connect to Firebase. Return if failed.
        if (sendCommand("AT+CIPSTART=\"SSL\",\"" + host + "\",443", "OK", 10000) == false) return

        // Construct the HTTP request
        // PATCH request to update only specific fields without overwriting others
        let requestPath = "/" + path + ".json?auth=" + firebaseApiKey
        let httpRequest = "PATCH " + requestPath + " HTTP/1.1\r\n"
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
    }

    /**
     * Return true if last data sent successfully.
     */
    //% subcategory="Firebase"
    //% blockId=esp8266_is_firebase_data_sent
    //% block="Firebase data sent"
    export function isFirebaseDataSent(): boolean {
        return firebaseDataSent
    }

    /**
     * Send SWITCH data to Firebase.
     * @param deviceName Name of switch (e.g., "lampu").
     * @param value Switch status (0 for OFF, 1 for ON).
     */
    //% subcategory="Firebase"
    //% weight=29
    //% blockGap=8
    //% blockId=esp8266_firebase_switch
    //% block="Firebase send SWITCH|name %deviceName|value %value"
    //% value.min=0 value.max=1
    export function firebaseSendSwitch(deviceName: string, value: number) {
        let val = value == 1 ? 1 : 0
        let json = "{\"" + deviceName + "\":{\"tipe\":\"switch\",\"value\":" + val + "}}"
        sendFirebaseData(firebasePath, json)
    }

    /**
     * Send DIMMER data to Firebase.
     * @param deviceName Name of dimmer (e.g., "kipas").
     * @param value Value (0-1024).
     */
    //% subcategory="Firebase"
    //% weight=26
    //% blockGap=8
    //% blockId=esp8266_firebase_dimmer
    //% block="Firebase send DIMMER|name %deviceName|value %value"
    //% value.min=0 value.max=1024
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
