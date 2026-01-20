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
     * This is a convenience function to help users create JSON data.
     * @param key1 First key name.
     * @param value1 First value.
     * @param key2 Second key name (optional).
     * @param value2 Second value (optional).
     * @param key3 Third key name (optional).
     * @param value3 Third value (optional).
     */
    //% subcategory="Firebase"
    //% weight=27
    //% blockGap=8
    //% blockId=esp8266_create_firebase_json
    //% block="create JSON|%key1 = %value1||%key2 = %value2|%key3 = %value3"
    export function createFirebaseJSON(key1: string, value1: string,
        key2: string = "", value2: string = "",
        key3: string = "", value3: string = ""): string {
        let json = "{"

        // Add first key-value pair
        json += "\"" + key1 + "\":\"" + value1 + "\""

        // Add second key-value pair if provided
        if (key2 != "" && value2 != "") {
            json += ",\"" + key2 + "\":\"" + value2 + "\""
        }

        // Add third key-value pair if provided
        if (key3 != "" && value3 != "") {
            json += ",\"" + key3 + "\":\"" + value3 + "\""
        }

        json += "}"
        return json
    }
}
