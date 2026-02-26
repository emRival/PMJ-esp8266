/**
 * Support for Firebase Realtime Database.
 * FIXED VERSION - Improved HTTP parsing and error handling
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
     * Helper: Extract host from Firebase URL
     */
    function extractHost(url: string): string {
        let host = url
        if (host.includes("https://")) {
            host = host.substr(8)
        }
        if (host.includes("http://")) {
            host = host.substr(7)
        }
        if (host.charAt(host.length - 1) == "/") {
            host = host.substr(0, host.length - 1)
        }
        return host
    }

    /**
     * Helper: Clean path (remove leading slash)
     */
    function cleanPath(path: string): string {
        if (path.charAt(0) == "/") {
            return path.substr(1)
        }
        return path
    }

    /**
     * Helper: Extract JSON body from HTTP response
     */
    function extractJsonFromResponse(response: string): string {
        // Find +IPD marker
        let ipdIndex = response.indexOf("+IPD")
        if (ipdIndex == -1) return ""

        // Find colon after +IPD (marks start of HTTP response)
        let colonIndex = response.indexOf(":", ipdIndex)
        if (colonIndex == -1) return ""

        // Get everything after the colon
        let httpData = response.substr(colonIndex + 1)

        // Find HTTP body (after headers)
        // Look for double CRLF that separates headers from body
        let bodyStart = httpData.indexOf("\r\n\r\n")
        if (bodyStart != -1) {
            httpData = httpData.substr(bodyStart + 4)
        } else {
            // Alternative: find first { if no clear header separation
            let jsonStart = httpData.indexOf("{")
            if (jsonStart != -1) {
                httpData = httpData.substr(jsonStart)
            }
        }

        // Check if response is null
        if (httpData.includes("null")) return "null"

        // Find JSON object start
        let braceIndex = httpData.indexOf("{")
        if (braceIndex == -1) return ""

        return httpData.substr(braceIndex)
    }

    /**
     * Helper: Extract value from JSON string
     * Supports both nested objects and direct values
     */
    function extractValueFromJson(jsonData: string): string {
        if (jsonData == "" || jsonData == "null") return ""

        // Look for "value": field
        let valueIndex = jsonData.indexOf("\"value\"")
        if (valueIndex == -1) return ""

        // Find the colon after "value"
        let colonIndex = jsonData.indexOf(":", valueIndex)
        if (colonIndex == -1) return ""

        // Start after the colon
        let startIndex = colonIndex + 1
        let valueStr = jsonData.substr(startIndex)

        // Skip whitespace
        while (valueStr.length > 0 && (valueStr.charAt(0) == " " || valueStr.charAt(0) == "\t" || valueStr.charAt(0) == "\r" || valueStr.charAt(0) == "\n")) {
            valueStr = valueStr.substr(1)
        }

        if (valueStr.length == 0) return ""

        // Determine if value is string or number
        let firstChar = valueStr.charAt(0)
        let endIndex = 0

        if (firstChar == "\"") {
            // String value - find closing quote
            valueStr = valueStr.substr(1)
            endIndex = valueStr.indexOf("\"")
            if (endIndex == -1) endIndex = valueStr.length
            return valueStr.substr(0, endIndex)
        } else {
            // Number or boolean - find delimiter
            for (let i = 0; i < valueStr.length; i++) {
                let char = valueStr.charAt(i)
                if (char == "," || char == "}" || char == " " || char == "\r" || char == "\n" || char == "\t") {
                    endIndex = i
                    break
                }
            }
            if (endIndex == 0) endIndex = valueStr.length

            let result = valueStr.substr(0, endIndex)
            // Trim any remaining whitespace
            while (result.length > 0 && (result.charAt(result.length - 1) == " " || result.charAt(result.length - 1) == "\r" || result.charAt(result.length - 1) == "\n")) {
                result = result.substr(0, result.length - 1)
            }
            return result
        }
    }

    /**
     * Read device value from Firebase.
     * Returns the value as a number (integer).
     * Returns 0 if error or not found.
     * @param deviceName Name of device to read (e.g., "lampu_teras", "suhu").
     */
    //% subcategory="Firebase"
    //% weight=27
    //% blockGap=40
    //% blockId=esp8266_read_firebase_value
    //% block="Firebase read value of %deviceName"
    export function readFirebaseValue(deviceName: string): number {
        debugLog("FB-R", "Read: " + deviceName)
        let fbStartTime = input.runningTime()

        // Validate WiFi connection
        if (!isWifiConnected()) {
            debugLog("FB-R", "FAIL: WiFi not connected")
            return 0
        }

        // Validate Firebase configuration
        if (firebaseDatabaseURL == "" || firebaseApiKey == "") {
            debugLog("FB-R", "FAIL: Firebase not configured")
            return 0
        }

        // Build full path
        let fullPath = cleanPath(firebasePath + "/" + deviceName)
        let host = extractHost(firebaseDatabaseURL)
        debugLog("FB-R", "Path: /" + fullPath)

        // Connect to Firebase via SSL
        debugLog("FB-R", "SSL connecting...")
        if (!sendCommand("AT+CIPSTART=\"SSL\",\"" + host + "\",443", "OK", 2000)) {
            debugLog("FB-R", "FAIL: SSL connect")
            return 0
        }
        debugLog("FB-R", "SSL OK (" + (input.runningTime() - fbStartTime) + "ms)")

        // Build GET request
        let requestPath = "/" + fullPath + ".json?auth=" + firebaseApiKey
        let httpRequest = "GET " + requestPath + " HTTP/1.1\r\n"
        httpRequest += "Host: " + host + "\r\n"
        httpRequest += "Connection: close\r\n"
        httpRequest += "\r\n"

        // Send request
        if (!sendCommand("AT+CIPSEND=" + httpRequest.length, "OK")) {
            debugLog("FB-R", "FAIL: CIPSEND")
            sendCommand("AT+CIPCLOSE", "OK", 200)
            return 0
        }

        sendCommand(httpRequest, null, 50)
        debugLog("FB-R", "Request sent, waiting response...")

        // Wait for response with +IPD marker
        let response = getResponse("+IPD", 800)

        // Close connection
        sendCommand("AT+CIPCLOSE", "OK", 200)

        // Validate response
        if (response == "") {
            debugLog("FB-R", "FAIL: No response (" + (input.runningTime() - fbStartTime) + "ms)")
            return 0
        }
        debugLog("FB-R", "Response len=" + response.length)

        // Extract JSON from HTTP response
        let jsonData = extractJsonFromResponse(response)
        debugLog("FB-R", "JSON: " + jsonData.substr(0, 60))
        if (jsonData == "" || jsonData == "null") {
            debugLog("FB-R", "FAIL: Empty/null JSON")
            return 0
        }

        // Extract value field from JSON as STRING
        let valueStr = extractValueFromJson(jsonData)
        if (valueStr == "") {
            debugLog("FB-R", "FAIL: No value field")
            return 0
        }

        // Parse string to number
        let result = parseStringToNumber(valueStr)
        debugLog("FB-R", "OK: " + result + " (" + (input.runningTime() - fbStartTime) + "ms total)")
        return result
    }

    /**
     * Helper: Parse string to number
     */
    function parseStringToNumber(valueStr: string): number {
        // Parse string to number
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
     * Read device value from Firebase as NUMBER.
     * (Alias for readFirebaseValue - both return number now)
     * @param deviceName Name of device to read (e.g., "lampu_teras", "suhu").
     */
    //% subcategory="Firebase"
    //% weight=26
    //% blockGap=40
    //% blockId=esp8266_read_firebase_number
    //% block="Firebase read NUMBER of %deviceName"
    export function readFirebaseNumber(deviceName: string): number {
        return readFirebaseValue(deviceName)
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
        debugLog("FB-W", "Send: " + path + " data=" + jsonData.substr(0, 40))
        let fbStartTime = input.runningTime()

        // Validate WiFi connection
        if (!isWifiConnected()) {
            debugLog("FB-W", "FAIL: WiFi not connected")
            return
        }

        // Validate Firebase configuration
        if (firebaseDatabaseURL == "" || firebaseApiKey == "") {
            debugLog("FB-W", "FAIL: Firebase not configured")
            return
        }

        // Clean path and extract host
        path = cleanPath(path)
        let host = extractHost(firebaseDatabaseURL)

        // Connect to Firebase
        debugLog("FB-W", "SSL connecting...")
        if (!sendCommand("AT+CIPSTART=\"SSL\",\"" + host + "\",443", "OK", 2000)) {
            debugLog("FB-W", "FAIL: SSL connect")
            return
        }
        debugLog("FB-W", "SSL OK (" + (input.runningTime() - fbStartTime) + "ms)")

        // Build PATCH request (updates without overwriting)
        let requestPath = "/" + path + ".json?auth=" + firebaseApiKey
        let httpRequest = "PATCH " + requestPath + " HTTP/1.1\r\n"
        httpRequest += "Host: " + host + "\r\n"
        httpRequest += "Content-Type: application/json\r\n"
        httpRequest += "Content-Length: " + jsonData.length + "\r\n"
        httpRequest += "Connection: close\r\n"
        httpRequest += "\r\n"
        httpRequest += jsonData

        // Send request
        if (!sendCommand("AT+CIPSEND=" + httpRequest.length, "OK")) {
            debugLog("FB-W", "FAIL: CIPSEND")
            sendCommand("AT+CIPCLOSE", "OK", 200)
            return
        }

        sendCommand(httpRequest, null, 50)
        debugLog("FB-W", "Request sent, waiting SEND OK...")

        // Wait for SEND OK
        if (getResponse("SEND OK", 800) == "") {
            debugLog("FB-W", "FAIL: No SEND OK")
            sendCommand("AT+CIPCLOSE", "OK", 200)
            return
        }

        // Check response status
        debugLog("FB-W", "Waiting server response...")
        let response = getResponse("+IPD", 800)

        // Check if response contains 200 OK
        if (response != "" && response.includes("200")) {
            firebaseDataSent = true
            debugLog("FB-W", "OK: 200 (" + (input.runningTime() - fbStartTime) + "ms total)")
        } else {
            debugLog("FB-W", "FAIL: No 200 response (" + (input.runningTime() - fbStartTime) + "ms)")
        }

        // Close connection
        sendCommand("AT+CIPCLOSE", "OK", 200)
    }

    /**
     * Return true if last data sent successfully.
     */
    //% subcategory="Firebase"
    //% weight=24
    //% blockId=esp8266_is_firebase_data_sent
    //% block="Firebase data sent"
    export function isFirebaseDataSent(): boolean {
        return firebaseDataSent
    }

    /**
     * Send SWITCH data to Firebase.
     * @param deviceName Name of switch (e.g., "lampu_teras").
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