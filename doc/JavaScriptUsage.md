# JavaScript Parser Usage
This article describes how to use the JavaScript parser in a network server with Node-RED support.

1. You will need the Dev EUI, App EUI and App Key for your device. These can be found on the Quick Start Guide card that came with the device.
   - Device Extended Unique Identifier (Dev EUI) is a 16-character alphanumeric string. 
   - Application Extended Unique Identifier (App EUI or JoinEUI) is a 16-character alphanumeric string. 
   - Application Key (App Key) is an alphanumeric string of 32 characters. The App Key is a secret and should never be shared.\
   ![Quick-Start-Guide-Card](https://github.com/WIKA-Group/javascript_parsers/assets/150794150/481f101f-63b2-4a60-8a12-cc21d1cd7df2)
2. You will need to know the measuring range of the device. The measuring ranges can be found on the model label of your sensor and in the sensor data sheet.
3. You have downloaded the correct parser for your device. In this example we using TRU+NETRIS3.
4. Open the network server section of your gateway and navigate to the Device Registration page.
5. Register your device by entering your Dev EUI and App Key. The App Key is optional depending on the network server you used.
6. Open the Node-RED and create a new flow with
    - LoRa Input node,
    - Device Filter node,
    - Function node,
    - some Debug nodes.\
    ![Node-Red-Flow](https://github.com/WIKA-Group/javascript_parsers/assets/150794150/1f7b29cc-29a0-4ff4-9acc-c12b40d84ecc)
7. Set the Dev EUI on Device Filter node.
8. Open the index.js file and add the measuring ranges ot the top of the parser file (index.js).
    ```JavaScript
    /**
     * The starting value of the temperature range.
    * @type {number}
    */
    var TEMPERATURE_RANGE_START = -200;

    /**
    * The ending value of the temperature range.
    * @type {number}
    */
    var TEMPERATURE_RANGE_END = 850;
    ```
9. Add the following lines to the end of the script.
    ```JavaScript
    msg.payload = decodeBase64String(1, msg.payload);
    return msg;
    ```
    The function you need to call depends on the network server you are using or the use case you have.
10. Copy and Paste the content of the index.js file into the Function node.
11. Save and deploy your Node-RED flow.
12. Active your device.\
    ![Node-Red-Flow-Output](https://github.com/WIKA-Group/javascript_parsers/assets/150794150/b3307325-610f-48e0-9413-20eae2a10129)
13. Done.
