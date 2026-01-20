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
     * @param apiKey Firebase API Key from project settings.
     * @param databaseURL Firebase Realtime Database URL (e.g., https://project-id.firebaseio.com).
     * @param projectId Firebase Project ID.
     */
    //% subcategory="Firebase"
    //% weight=29
    //% blockGap=8
    //% blockId=esp8266_configure_firebase
    //% block="configure Firebase|API Key %apiKey|Database URL %databaseURL|Project ID %projectId"
    export function configureFirebase(apiKey: string, databaseURL: string, projectId: string) {
        firebaseApiKey = apiKey
        firebaseDatabaseURL = databaseURL
        firebaseProjectId = projectId
    }



    /**
     * Send JSON data to Firebase Realtime Database.
     * @param path Database path where data will be stored (e.g., /sensors/temperature).
     * @param jsonData JSON string to send (e.g., {"temp":25,"humidity":60}).
     */
    //% subcategory="Firebase"
    //% weight=28
    //% blockGap=8
    //% blockId=esp8266_send_firebase_data
    //% block="send to Firebase|Path %path|JSON data %jsonData"
    export function sendFirebaseData(path: string, jsonData: string) {

        // Reset the send successful flag.
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
        // Format: https://project-id.firebaseio.com or https://project-id.region.firebasedatabase.app
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

        // Construct the HTTP request
        // PUT request to update data at path
        let requestPath = "/" + path + ".json?auth=" + firebaseApiKey
        let httpRequest = "PUT " + requestPath + " HTTP/1.1\r\n"
        httpRequest += "Host: " + host + "\r\n"
        httpRequest += "Content-Type: application/json\r\n"
        httpRequest += "Content-Length: " + jsonData.length + "\r\n"
        httpRequest += "\r\n"
        httpRequest += jsonData

        // Send the data.
        sendCommand("AT+CIPSEND=" + httpRequest.length)
        sendCommand(httpRequest, null, 100)

        // Return if "SEND OK" is not received.
        if (getResponse("SEND OK", 2000) == "") {
            // Close the connection and return.
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            return
        }

        // Check the response from Firebase.
        // Firebase returns HTTP 200 OK for successful requests
        let response = getResponse("HTTP/1.1", 2000)
        if (response == "" || !response.includes("200")) {
            // Close the connection and return.
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            return
        }

        // Close the connection.
        sendCommand("AT+CIPCLOSE", "OK", 1000)

        // Set the send successful flag and return.
        firebaseDataSent = true
        return
    }



    /**
     * Helper function to create JSON string from sensor values.
     * Supports both string and number values for flexibility.
     * @param key1 First key name.
     * @param value1 First value (string or number).
     * @param key2 Second key name (optional).
     * @param value2 Second value (optional, string or number).
     * @param key3 Third key name (optional).
     * @param value3 Third value (optional, string or number).
     */
    //% subcategory="Firebase"
    //% weight=27
    //% blockGap=8
    //% blockId=esp8266_create_firebase_json
    //% block="create JSON|%key1 = %value1||%key2 = %value2|%key3 = %value3"
    export function createFirebaseJSON(key1: string, value1: any,
        key2?: string, value2?: any,
        key3?: string, value3?: any): string {
        let json = "{"

        // Add first key-value pair
        // Check if value is number or string
        if (typeof value1 === "number") {
            json += "\"" + key1 + "\":" + value1
        } else {
            json += "\"" + key1 + "\":\"" + value1 + "\""
        }

        // Add second key-value pair if provided
        if (key2 && value2 !== undefined && value2 !== null) {
            if (typeof value2 === "number") {
                json += ",\"" + key2 + "\":" + value2
            } else {
                json += ",\"" + key2 + "\":\"" + value2 + "\""
            }
        }

        // Add third key-value pair if provided
        if (key3 && value3 !== undefined && value3 !== null) {
            if (typeof value3 === "number") {
                json += ",\"" + key3 + "\":" + value3
            } else {
                json += ",\"" + key3 + "\":\"" + value3 + "\""
            }
        }

        json += "}"
        return json
    }



    /**
     * Read data from Firebase Realtime Database.
     * Returns the value as string, or empty string if failed.
     * @param path Database path to read from (e.g., /sensors/temperature).
     */
    //% subcategory="Firebase"
    //% weight=26
    //% blockGap=8
    //% blockId=esp8266_read_firebase_data
    //% block="read from Firebase|Path %path"
    export function readFirebaseData(path: string): string {
        let result = ""

        // Make sure the WiFi is connected.
        if (isWifiConnected() == false) return result

        // Make sure Firebase is configured.
        if (firebaseDatabaseURL == "" || firebaseApiKey == "") return result

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
        if (sendCommand("AT+CIPSTART=\"SSL\",\"" + host + "\",443", "OK", 10000) == false) return result

        // Construct the HTTP GET request
        let requestPath = "/" + path + ".json?auth=" + firebaseApiKey
        let httpRequest = "GET " + requestPath + " HTTP/1.1\r\n"
        httpRequest += "Host: " + host + "\r\n"
        httpRequest += "\r\n"

        // Send the request
        sendCommand("AT+CIPSEND=" + httpRequest.length)
        sendCommand(httpRequest, null, 100)

        // Return if "SEND OK" is not received.
        if (getResponse("SEND OK", 2000) == "") {
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            return result
        }

        // Check the response from Firebase.
        let response = getResponse("HTTP/1.1", 2000)
        if (response == "" || !response.includes("200")) {
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            return result
        }

        // Read the response data
        // Firebase sends data after headers
        // Skip headers and get the JSON data
        let dataReceived = false
        let timestamp = input.runningTime()
        while (true) {
            // Timeout after 3 seconds
            if (input.runningTime() - timestamp > 3000) {
                break
            }

            let line = getResponse("", 200)
            if (line == "") {
                if (dataReceived) break
                continue
            }

            // Empty line indicates end of headers
            if (line.length < 3) {
                dataReceived = true
                continue
            }

            // If we're past headers, this is our data
            if (dataReceived) {
                result = line
                break
            }
        }

        // Close the connection.
        sendCommand("AT+CIPCLOSE", "OK", 1000)

        return result
    }
}
