/*&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&#    &&&   
&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&#    &&&   
&&&                                                                                               &&#    &&&   
&&&    .&&&&&      .&&&&&      &&&&&&    &&&&&     .&&&&/     .&&&&&&          &&&&&&&&           &&#    &&&   
&&&     &&&&&&     &&&&&&&     &&&&&     &&&&&     .&&&&/   &&&&&&&           &&&&&&&&&&          &&#    &&&   
&&&      &&&&&(   &&&&&&&&#   &&&&&(     &&&&&     .&&&&/ &&&&&&             &&&&& /&&&&&         &&#    &&&   
&&&       &&&&&  /&&&&,&&&&  ,&&&&&      &&&&&     .&&&&&&&&&&&             &&&&&   &&&&&%        &&#    &&&   
&&&       %&&&&& &&&&  &&&&& &&&&&       &&&&&     .&&&&&&&&&&&&&          &&&&&%    &&&&&(       &&#    &&&   
&&&        &&&&&&&&&(   &&&&&&&&&.       &&&&&     .&&&&&   &&&&&&#       &&&&&&&&&&&&&&&&&.      &&#    &&&   
&&&         &&&&&&&&     &&&&&&&&        &&&&&     .&&&&/     &&&&&&     *&&&&&        &&&&&      &&#    &&&   
&&&          &&&&&&      /&&&&&&         &&&&&     .&&&&/       &&&&&&   &&&&&         #&&&&&     &&#    &&&   
&&&                                                                                                      &&&   
&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&   
&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&*/

/**
 * General information:   
 * This JavaScript-based payload formatter is a parser to decode data from bytes into
 * JSON Object. It can only parse payload from A2G devices. 
 * This parser follows the specification LoRaWAN® Payload Codec API Specification TS013-1.0.0.
 * 
 * 
 * SPDX-FileCopyrightText: Copyright (C) 2023 WIKA Alexander Wiegand SE & Co. KG   
 * SPDX-License-Identifier: MIT
 * 
 * SPDX-FileName: index.js
 * SPDX-PackageVersion: 2.0.0
 *  
*/

// ***********************************************************************************
// Public Decoding Section
// ***********************************************************************************

/**
 * 
 * ATTENTION: The parser for A2G devices doesn't require any manual configuration.
 * 
 */


/**
 * Decode uplink entry point
 * @typedef  {Object}    input          - An object provided by the IoT Flow framework
 * @property {number[]}  input.bytes    - Array of bytes represented as numbers as it has been sent from the device
 * @property {number}    input.fPort    - The Port Field on which the uplink has been sent
 * @property {Date}      input.recvTime - The uplink message time recorded by the LoRaWAN network server
 */

/**
 * Decoded uplink data
 * @typedef  {Object}               output     - An object to be returned to the IoT Flow framework
 * @property {Object.<string, *>}   data       - The open JavaScript object representing the decoded uplink payload when no errors occurred
 * @property {string[]}             [errors]   - A list of error messages while decoding the uplink payload
 * @property {string[]}             [warnings] - A list of warning messages that do not prevent the driver from decoding the uplink payload
 */

/**
 * @typedef {Object}  DecodedUplink  - An object that represents the decoded uplink payload
 */

/**
 * To decode the uplink data defined by LoRaWAN
 * @access public
 * @param   {input}     input - The object to decode
 * @returns {output}          - The decoded object
 */
function decodeUplink(input) {
    return decode(input);
}

/**
 * To decode from hex encoded string
 * @access public
 * @param   {number}    fPort             - The Port Field on which the uplink has been sent
 * @param   {string}    hexEncodedString  - A hex encoded string has been sent from the device
 * @returns {output}                      - The decoded object
 */
function decodeHexString(fPort, hexEncodedString) {
    /**
     * @type {input}
     */
    var input = {};
    input.bytes = convertHexStringToBytes(hexEncodedString);
    input.fPort = fPort;

    return decode(input);
}

/**
 * To decode from base64 string
 * @access public
 * @param   {number}    fPort                   - The Port Field on which the uplink has been sent
 * @param   {string}    base64EncodedString     - A base64 encoded string has been sent from the device
 * @returns {output}                            - The decoded object
 */
function decodeBase64String(fPort, base64EncodedString) {
    /**
     * @type {input}
     */
    var input = {};
    input.bytes = convertBase64StringToBytes(base64EncodedString);
    input.fPort = fPort;
    return decode(input);
}


// ***********************************************************************************
// Private Decoding Section
// ***********************************************************************************

/**
 * Generic Data Channel Values
 */
var DEVICE_NAME = "A2G";

var ERROR_VALUE = 0xffff;

var CHANNEL_MEASURAND_CONFIGURATION_DEFAULT_ORDER = ["pressure", "flow", "input_1", "input_2", "input_3", "input_4", "relay_status_1", "relay_status_2"];

/**
* @type {{[key: number]: string}} 
*/
var HARDWARE_ASSEMBLY_TYPE_NAME = { 0: "A2G HE0 Full Assembly", 1: "A2G HE1 1AO Assembly", 2: "A2G HE2 Modbus Assembly", 3: "A2G HE3 Modular Assembly", 128: "A2G LC1 LC1VAO", 129: "A2G LC2 CT", 130: "A2G LC3 BAT" };


/**
 * The padStart() method of String values pads this string with another string (multiple times, if needed) until the resulting string reaches the given length.
 * The function is reimplemented to support ES5.
 * @access private
 * @param   {number}     targetLength - The length of the returned string
 * @param   {string}     padString - The string to modify
 * @returns {string}          - The decoded object
 */
String.prototype.padStart = function (targetLength, padString) {

    var tempString = this.valueOf();

    for(var i = this.length; i < targetLength; ++i)
    {
        tempString = padString + tempString;
    }

    return tempString; 
 };

/**
 * To decode the uplink data
 * @access private
 * @param   {input}     input - The object to decode
 * @returns {output}          - The decoded object
 */
function decode(input) {
    // Define output object

    var output = createOutputObject();

    /* Select subfunction to decode message */
    switch (input.bytes[0]) {
        /* unused */
        default:
        case 0x00: // Message zero does not exist
        case 0x02: // Data message is not supported
        case 0x03: // Process alarm message is not supported
        case 0x06: // Configuration status message is not supported
        case 0x09: // Extended device identification is not supported

            // Error, not enough bytes            
            output = addErrorMessage(output, "Data message type " + input.bytes[0].toString(16).padStart(2, "0") + " not supported");
            break;

        /* Data message */
        case 0x01:
            /* Check if all bytes needed for decoding are there */
            if (input.bytes.length === 27 || input.bytes.length === 6) {
                // decode
                output = decodeDataMessage(input);
            }
            else {
                // Error, not enough bytes                
                output = addErrorMessage(output, "Data message 01 needs 6 or 27 bytes but got " + input.bytes.length);
            }
            break;

        /* Technical Alarm Message */
        case 0x04: 
            if(input.bytes.length === 3){
                output = decodeTechnicalAlarmMessage(input);
            }
            else {
                // Error, not enough bytes                
                output = addErrorMessage(output, "Alarm message 04 needs 3 bytes but got " + input.bytes.length);
            }
            break;

        /* Device alarm message */
        case 0x05:
            /* Check if all bytes needed for decoding are there */
            if (input.bytes.length == 4) {
                // decode
                output = decodeDeviceAlarmMessage(input);
            }
            else {
                // Error, not enough bytes                
                output = addErrorMessage(output, "Alarm message 05 needs 4 bytes but got " + input.bytes.length);
            }
            break


        /* Device identification */
        case 0x07:
            /* Check if all bytes needed for decoding are there */
            if (input.bytes.length == 38 || input.bytes.length == 33) {
                // decode
                output = decodeDeviceIdentification(input);
            }
            else {
                // Error, not enough bytes                
                output = addErrorMessage(output, "Identification message 07 needs 33 or 38 bytes, but got " + input.bytes.length);
            }
            break;

        /* Keep alive */
        case 0x08:
            /* Check if all bytes needed for decoding are there */
            if (input.bytes.length == 3) {
                // Decode
                output = decodeKeepAliveMessage(input);
            }
            else {
                // Error, not enough bytes                
                output = addErrorMessage(output, "Keep alive message 08 needs 3 bytes but got " + input.bytes.length);
            }
            break;
    }

    return output;
}

/**
 * Decodes a data message 01, 02 into an object
 * @access private
 * @param {Object}      input           - An object provided by the IoT Flow framework
 * @param {number[]}    input.bytes     - Array of bytes represented as numbers as it has been sent from the device
 * @param {number}      input.fPort     - The Port Field on which the uplink has been sent
 * @param {Date}        input.recvTime  - The uplink message time recorded by the LoRaWAN network server
 * @returns {output}             - The decoded object
 */
function decodeDataMessage(input) {
    // Output
    var output = createOutputObject();

    // data message type
    output.data.messageType = input.bytes[0];

    // current configuration id
    output.data.configurationId = input.bytes[1];

    output.data.measurement = {};
    output.data.measurement.channels = [];
    var measurementData;

    if(input.bytes.length === 6){
        var pressureData = input.bytes[2].toString(16).padStart(2, "0") + input.bytes[3].toString(16).padStart(2, "0") + input.bytes[4].toString(16).padStart(2, "0") + input.bytes[5].toString(16).padStart(2, "0");
        pressureData = convertHexToFloatIEEE754(pressureData);
        pressureData = Number(pressureData.toFixed(4));
        output = addChannelData(output, pressureData, 0, CHANNEL_MEASURAND_CONFIGURATION_DEFAULT_ORDER[0]);
        if (output.errors) {
            // delete data from output
            output.data = {}
        }
        return output;
    }

    // channels 
    for (var byteIndex = 2, channelNumber = 0; byteIndex < input.bytes.length - 1; byteIndex += 4, channelNumber++) {
        measurementData = input.bytes[byteIndex].toString(16).padStart(2, "0") + input.bytes[byteIndex + 1].toString(16).padStart(2, "0") + input.bytes[byteIndex + 2].toString(16).padStart(2, "0") + input.bytes[byteIndex + 3].toString(16).padStart(2, "0")
        measurementData = convertHexToFloatIEEE754(measurementData);
        measurementData = Number(measurementData.toFixed(4));
        output = addChannelData(output, measurementData, channelNumber, CHANNEL_MEASURAND_CONFIGURATION_DEFAULT_ORDER[channelNumber]);
    }

    measurementData = input.bytes[26] & 0x01; // Bit Mask: 00000001
    output = addChannelData(output, measurementData, channelNumber, CHANNEL_MEASURAND_CONFIGURATION_DEFAULT_ORDER[channelNumber]);
    measurementData = (input.bytes[26] >> 1) & 0x01; // Bit Mask: 00000010
    output = addChannelData(output, measurementData, ++channelNumber, CHANNEL_MEASURAND_CONFIGURATION_DEFAULT_ORDER[channelNumber]);

    if (output.errors) {
        // delete data from output
        output.data = {}
    }

    return output;
}

/**
 * Decodes an alarm message 04 into an object
 * @access private
 * @param {Object}              input           - An object provided by the IoT Flow framework
 * @param {number[]}            input.bytes     - Array of bytes represented as numbers as it has been sent from the device
 * @param {number}              input.fPort     - The Port Field on which the uplink has been sent
 * @param {Date}                input.recvTime  - The uplink message time recorded by the LoRaWAN network server
 * @returns {output}                     - The decoded object
 */
function decodeTechnicalAlarmMessage(input) {
    // Output
    var output = createOutputObject();

    // data message type
    output.data.messageType = input.bytes[0];

    // current configuration id
    output.data.configurationId = input.bytes[1];

    var alarmByte = input.bytes[2];

    output.data.technicalAlarms = {
        "TemperatureInput4SignalOverload": false,
        "TemperatureInput3SignalOverload": false,
        "VoltageInput2SignalOverload": false,
        "VoltageInput1SignalOverload": false,
        "ModbusCommunicationError": false,
        "AnalogOutput2SignalOverload": false,
        "AnalogOutput1SignalOverload": false,
        "PressureSignalOverload": false
    }

    if (alarmByte === 0x00){
        return output;
    }

    if(alarmByte & 0b0000_0001){
        output.data.technicalAlarms.PressureSignalOverload = true;
    }

    if(alarmByte & 0b0000_0010){
        output.data.technicalAlarms.AnalogOutput1SignalOverload = true;
    }

    if(alarmByte & 0b0000_0100){
        output.data.technicalAlarms.AnalogOutput2SignalOverload = true;
    }

    if(alarmByte & 0b0000_1000){
        output.data.technicalAlarms.ModbusCommunicationError = true;
    }

    if(alarmByte & 0b0001_0000){
        output.data.technicalAlarms.VoltageInput1SignalOverload = true;
    }

    if(alarmByte & 0b0010_0000){
        output.data.technicalAlarms.VoltageInput2SignalOverload = true;
    }

    if(alarmByte & 0b0100_0000){
        output.data.technicalAlarms.TemperatureInput3SignalOverload = true;
    }

    if(alarmByte & 0b1000_0000){
        output.data.technicalAlarms.TemperatureInput4SignalOverload = true;
    }

    return output;
}

/**
 * Decodes an alarm message 04 into an object
 * @access private
 * @param {Object}              input           - An object provided by the IoT Flow framework
 * @param {number[]}            input.bytes     - Array of bytes represented as numbers as it has been sent from the device
 * @param {number}              input.fPort     - The Port Field on which the uplink has been sent
 * @param {Date}                input.recvTime  - The uplink message time recorded by the LoRaWAN network server
 * @returns {output}                     - The decoded object
 */
function decodeDeviceAlarmMessage(input) {
    // Output
    var output = createOutputObject();

    // data message type
    output.data.messageType = input.bytes[0];

    // current configuration id
    output.data.configurationId = input.bytes[1];

    var alarmByte1 = input.bytes[2];
    var alarmByte2 = input.bytes[3];

    output.data.deviceAlarms = {
        "ADCConverterError": false,
        "PressureSensorNoResponseError": false,
        "PressureSensorTimeoutError": false,
        "FactoryOptionsWriteError": false,
        "FactoryOptionsDeleteError": false,
        "InvalidFactoryOptionsError": false,
        "UserSettingsInvalidError": false,
        "UserSettingsReadWriteError": false,
        "ZeroOffsetOverRangeError": false,
        "InvalidSignalSourceSpecifiedError": false,
        "AnalogOutput2OverTemperatureError": false,
        "AnalogOutput2LoadFaultError": false,
        "AnalogOutput2OverRangeError": false,
        "AnalogOutput1OverTemperatureError": false,
        "AnalogOutput1LoadFaultError": false,
        "AnalogOutput1OverRangeError": false
    }

    if (alarmByte1 === 0x00 && alarmByte2 === 0x00){
        return output;
    }

    if(alarmByte1 & 0b1000_0000){
        output.data.deviceAlarms.ADCConverterError = true;
    }

    if(alarmByte1 & 0b0100_0000){
        output.data.deviceAlarms.PressureSensorNoResponseError = true;
    }

    if(alarmByte1 & 0b0010_0000){
        output.data.deviceAlarms.PressureSensorTimeoutError = true;
    }

    if(alarmByte1 & 0b0001_0000){
        output.data.deviceAlarms.FactoryOptionsWriteError = true;
    }

    if(alarmByte1 & 0b0000_1000){
        output.data.deviceAlarms.FactoryOptionsDeleteError = true;
    }

    if(alarmByte1 & 0b0000_0100){
        output.data.deviceAlarms.InvalidFactoryOptionsError = true;
    }

    if(alarmByte1 & 0b0000_0010){
        output.data.deviceAlarms.UserSettingsInvalidError = true;
    }

    if(alarmByte1 & 0b0000_0001){
        output.data.deviceAlarms.UserSettingsReadWriteError = true;
    }

    if(alarmByte2 & 0b1000_0000){
        output.data.deviceAlarms.ZeroOffsetOverRangeError = true;
    }

    if(alarmByte2 & 0b0100_0000){
        output.data.deviceAlarms.InvalidSignalSourceSpecifiedError = true;
    }

    if(alarmByte2 & 0b0010_0000){
        output.data.deviceAlarms.AnalogOutput2OverTemperatureError = true;
    }

    if(alarmByte2 & 0b0001_0000){
        output.data.deviceAlarms.AnalogOutput2LoadFaultError = true;
    }

    if(alarmByte2 & 0b0000_1000){
        output.data.deviceAlarms.AnalogOutput2OverRangeError = true;
    }

    if(alarmByte2 & 0b0000_0100){
        output.data.deviceAlarms.AnalogOutput1OverTemperatureError = true;
    }

    if(alarmByte2 & 0b0000_0010){
        output.data.deviceAlarms.AnalogOutput1LoadFaultError = true;
    }

    if(alarmByte2 & 0b0000_0001){
        output.data.deviceAlarms.AnalogOutput1OverRangeError = true;
    }

    return output;
}

/**
 * Decodes a keep alive message 08 into an object
 * @access private
 * @param {Object}              input           - An object provided by the IoT Flow framework
 * @param {number[]}            input.bytes     - Array of bytes represented as numbers as it has been sent from the device
 * @param {number}              input.fPort     - The Port Field on which the uplink has been sent
 * @param {Date}                input.recvTime  - The uplink message time recorded by the LoRaWAN network server
 * @returns {output}                     - The decoded object
 */
function decodeKeepAliveMessage(input) {
    // Output
    var output = createOutputObject();

    // data message type
    output.data.messageType = input.bytes[0];

    // current configuration id
    output.data.configurationId = input.bytes[1];

    if (input.bytes[2] == 0x7F) {
        // Error, not enough bytes                
        output = addErrorMessage(output, "Keep Alive message 08: The device reports an error during the calculation of the battery capacity.");
        return output;
    }

    output.data.deviceStatistic = {};

    // Battery level event indicator
    output.data.deviceStatistic.batteryLevelNewEvent = (input.bytes[2] & 0x80) >> 7 ? true : false;

    // battery level in percent
    output.data.deviceStatistic.batteryLevelPercent = input.bytes[2] & 0x7F;

    return output;
}

/**
 * Decodes a device identification message 07 into an object
 * @access private
 * @param {Object}              input           - An object provided by the IoT Flow framework
 * @param {number[]}            input.bytes     - Array of bytes represented as numbers as it has been sent from the device
 * @param {number}              input.fPort     - The Port Field on which the uplink has been sent
 * @param {Date}                input.recvTime  - The uplink message time recorded by the LoRaWAN network server
 * @returns {output}                            - The decoded object
 */
function decodeDeviceIdentification(input) {
    // Output
    var output = createOutputObject();

    // Data message type    
    output.data.messageType = input.bytes[0];

    // Configuration id
    output.data.configurationId = input.bytes[1];

    output.data.deviceInformation = {};

    // Product id raw
    output.data.deviceInformation.productId = input.bytes[2];

    // Product id resolved
    output.data.deviceInformation.productIdName = input.bytes[2] == 13 ? "A2G" : input.bytes[2];


    // Product sub id
    output.data.deviceInformation.productSubId = input.bytes[3];

    // Product sub id resolved
    switch (input.bytes[3]) {
        case 0:
            output.data.deviceInformation.productSubIdName = "LoRaWAN";
            break;

        case 1:
            output.data.deviceInformation.productSubIdName = "MIOTY";
            break;

        default:
            output.data.deviceInformation.productSubIdName = "Unknown";
            break;
    }

    // Sensor module firmware revision
    output.data.deviceInformation.sensorFirmwareVersion = (input.bytes[4] >> 4).toString(10) + "." + ((input.bytes[4] & 0x0F).toString(10)) + "." + ((input.bytes[5]).toString(10));

    // Sensor module hardware revision
    output.data.deviceInformation.sensorHardwareVersion = input.bytes[6].toString(10);

    output.data.deviceInformation.hardwareAssemblyTypeId = input.bytes[7];

    output.data.deviceInformation.hardwareAssemblyTypeName = HARDWARE_ASSEMBLY_TYPE_NAME[output.data.deviceInformation.hardwareAssemblyTypeId];

    // Serial number
    output.data.deviceInformation.serialNumber = "";
    for (var i = 8; i < 24; i++) {
        if (input.bytes[i] == 0) break;
        output.data.deviceInformation.serialNumber += String.fromCharCode(input.bytes[i]);
    }

    output.data.deviceInformation.channelConfigurations = [];
    // Channel 0 - Pressure
    output.data.deviceInformation.channelConfigurations[0] = {};
    output.data.deviceInformation.channelConfigurations[0].measurand = 3;
    output.data.deviceInformation.channelConfigurations[0].measurandName = lppReturnMeasurandFromId(output.data.deviceInformation.channelConfigurations[0].measurand);

    var measurementRangeString = input.bytes[24].toString(16).padStart(2, "0") + input.bytes[25].toString(16).padStart(2, "0") + input.bytes[26].toString(16).padStart(2, "0") + input.bytes[27].toString(16).padStart(2, "0")
    output.data.deviceInformation.channelConfigurations[0].measurementRangeStart = convertHexToFloatIEEE754(measurementRangeString);
    output.data.deviceInformation.channelConfigurations[0].measurementRangeStart = Number(output.data.deviceInformation.channelConfigurations[0].measurementRangeStart.toFixed(1));

    measurementRangeString = input.bytes[28].toString(16).padStart(2, "0") + input.bytes[29].toString(16).padStart(2, "0") + input.bytes[30].toString(16).padStart(2, "0") + input.bytes[31].toString(16).padStart(2, "0");
    output.data.deviceInformation.channelConfigurations[0].measurementRangeEnd = convertHexToFloatIEEE754(measurementRangeString);
    output.data.deviceInformation.channelConfigurations[0].measurementRangeEnd = Number(output.data.deviceInformation.channelConfigurations[0].measurementRangeEnd.toFixed(1));

    output.data.deviceInformation.channelConfigurations[0].unit = input.bytes[32];
    output.data.deviceInformation.channelConfigurations[0].unitName = lppReturnUnitFromId(output.data.deviceInformation.channelConfigurations[0].unit);

    // if it is a low power uplink version, return the output
    if(input.bytes.length === 33){
        return output;
    }


    // Channel 1 - Flow
    output.data.deviceInformation.channelConfigurations[1] = {};
    output.data.deviceInformation.channelConfigurations[1].measurand = 6;
    output.data.deviceInformation.channelConfigurations[1].measurandName = lppReturnMeasurandFromId(output.data.deviceInformation.channelConfigurations[1].measurand);

    output.data.deviceInformation.channelConfigurations[1].unit = input.bytes[33];
    output.data.deviceInformation.channelConfigurations[1].unitName = lppReturnUnitFromId(output.data.deviceInformation.channelConfigurations[1].unit);


    // Channel 2 - Input 1 
    output.data.deviceInformation.channelConfigurations[2] = {};
    output.data.deviceInformation.channelConfigurations[2].measurand = 70;
    output.data.deviceInformation.channelConfigurations[2].measurandName = lppReturnMeasurandFromId(output.data.deviceInformation.channelConfigurations[2].measurand);

    output.data.deviceInformation.channelConfigurations[2].unit = input.bytes[34];
    output.data.deviceInformation.channelConfigurations[2].unitName = lppReturnUnitFromId(output.data.deviceInformation.channelConfigurations[2].unit);

    // Channel 3 - Input 2 
    output.data.deviceInformation.channelConfigurations[3] = {};
    output.data.deviceInformation.channelConfigurations[3].measurand = 71;
    output.data.deviceInformation.channelConfigurations[3].measurandName = lppReturnMeasurandFromId(output.data.deviceInformation.channelConfigurations[3].measurand);

    output.data.deviceInformation.channelConfigurations[3].unit = input.bytes[35];
    output.data.deviceInformation.channelConfigurations[3].unitName = lppReturnUnitFromId(output.data.deviceInformation.channelConfigurations[3].unit);

    // Channel 4 - Input 3 
    output.data.deviceInformation.channelConfigurations[4] = {};
    output.data.deviceInformation.channelConfigurations[4].measurand = 72;
    output.data.deviceInformation.channelConfigurations[4].measurandName = lppReturnMeasurandFromId(output.data.deviceInformation.channelConfigurations[4].measurand);

    output.data.deviceInformation.channelConfigurations[4].unit = input.bytes[36];
    output.data.deviceInformation.channelConfigurations[4].unitName = lppReturnUnitFromId(output.data.deviceInformation.channelConfigurations[4].unit);

    // Channel 5 - Input 4 
    output.data.deviceInformation.channelConfigurations[5] = {};
    output.data.deviceInformation.channelConfigurations[5].measurand = 73;
    output.data.deviceInformation.channelConfigurations[5].measurandName = lppReturnMeasurandFromId(output.data.deviceInformation.channelConfigurations[5].measurand);

    output.data.deviceInformation.channelConfigurations[5].unit = input.bytes[37];
    output.data.deviceInformation.channelConfigurations[5].unitName = lppReturnUnitFromId(output.data.deviceInformation.channelConfigurations[5].unit);


    return output;
}

// ***********************************************************************************
//          Additional Functions Section
// ***********************************************************************************
/**
 * Converts a hex string number to float number follows the IEEE 754 standard and it's ES5 compatible
 * @access private
 * @param  {string} hexString   - Float as string "3.141"
 * @return {number}             - returns a float
 * @see https://gist.github.com/Jozo132/2c0fae763f5dc6635a6714bb741d152f 2022 by Jozo132 
 */
function convertHexToFloatIEEE754(hexString) {
    var int = parseInt(hexString, 16);
    if (int > 0 || int < 0) {
        var sign = (int >>> 31) ? -1 : 1;
        var exp = (int >>> 23 & 0xff) - 127;
        var mantissa = ((int & 0x7fffff) + 0x800000).toString(2);
        var float32 = 0
        for (var i = 0; i < mantissa.length; i += 1) { float32 += parseInt(mantissa[i]) ? Math.pow(2, exp) : 0; exp-- }
        return float32 * sign;
    } else return 0
}

/**
 * Adds warning to output object
 * @param {output} output
 * @param {string} warningMessage
 * @access private 
 */
function addWarningMessage(output, warningMessage) {
    // use only functional supported by ECMA-262 5th edition. The nullish assign and .at are not supported. output.warnings ??= [];
    output.warnings = output.warnings || [];
    output.warnings.push(DEVICE_NAME + " (JS): " + warningMessage);
    return output;
}

/**
 * Adds private to output object
 * @param {output} output
 * @param {string} errorMessage
 * @access private 
 */
function addErrorMessage(output, errorMessage) {
    output.errors = output.errors || [];
    output.errors.push(DEVICE_NAME + " (JS): " + errorMessage);
    return output;
}

/**
 * Creates an empty output object
 * @returns {output}        - Returns an output object
 * @access private
 */
function createOutputObject() {
    return {
        data: {},
    }
}

/**
 * Adds channel data to the channels
 * @access protected
 * @param  {output} output   output object 
 * @param {number} measurementValue   raw data 
 * @param {number} channelNumber   number of the channel
 * @param {string} channelName   name of the channel
 * @returns {output}        - Returns an output object
 */
function addChannelData(output, measurementValue, channelNumber, channelName) {

    // If channel has an error
    if (measurementValue == ERROR_VALUE) {
        output = addErrorMessage(output, "Invalid data for channel - " + channelName + " : 0xffff, 65535");
    }
    else {
        var measurement = {};

        measurement.value = measurementValue
        measurement.channelId = channelNumber;
        measurement.channelName = channelName
        output.data.measurement.channels.push(measurement);
    }

    return output;
}

/**
 * To convert a hex encoded string to a integer array
 * @param {string} hexEncodedString
 * @access private
 */
function convertHexStringToBytes(hexEncodedString) {
    if (hexEncodedString.startsWith("0x")) {
        hexEncodedString = hexEncodedString.slice(2);
    }

    // remove spaces
    hexEncodedString = hexEncodedString.replace(/\s/g, '');

    var bytes = [];

    // convert byte to byte (2 characters are 1 byte)
    for (var i = 0; i < hexEncodedString.length; i += 2) {
        // extract 2 characters
        var hex = hexEncodedString.substr(i, 2);

        // convert hex pair to integer
        var intValue = parseInt(hex, 16);

        bytes.push(intValue);
    }

    return bytes;
}

/**
 * To convert a base64 encoded string to a integer array
 * @param {string} base64EncodedString
 * @access private
 */
function convertBase64StringToBytes(base64EncodedString) {
    var bytes = [];

    // convert base64 to string
    var decodedBytes = Buffer.from(base64EncodedString, 'base64')

    // convert byte to byte (2 characters are 1 byte)
    for (var i = 0; i < decodedBytes.length; i++) {
        // convert byte to integer
        var intValue = decodedBytes[i];

        bytes.push(intValue);
    }

    return bytes;
}

/**
 * Returns the printable name of a measurand for a LPP supporting devices e.g.: 1 = "Temperature"
 * @access private
 * @param  {Number} id    Identifier as integer 
 * @return {string}       Returns a string e.g.: "Temperature"
 */
function lppReturnMeasurandFromId(id) {
    switch (id) {
        case 1:
            return "Temperature";
        case 2:
            return "Temperature difference";
        case 3:
            return "Pressure (gauge)";
        case 4:
            return "Pressure (absolute)";
        case 5:
            return "Pressure (differential)";
        case 6:
            return "Flow (vol.)";
        case 7:
            return "Flow (mass)";
        case 8:
            return "Force";
        case 9:
            return "Mass";
        case 10:
            return "Level";
        case 11:
            return "Length";
        case 12:
            return "Volume";
        case 13:
            return "Current";
        case 14:
            return "Voltage";
        case 15:
            return "Resistance";
        case 16:
            return "Capacitance";
        case 17:
            return "Inductance";
        case 18:
            return "Relative";
        case 19:
            return "Time";
        case 20:
            return "Frequency";
        case 21:
            return "Speed";
        case 22:
            return "Acceleration";
        case 23:
            return "Density";
        case 24:
            return "Density (gauge pressure at 20 °C)";
        case 25:
            return "Density (absolute pressure at 20 °C)";
        case 26:
            return "Humidity (relative)";
        case 27:
            return "Humidity (absolute)";
        case 28:
            return "Angle of rotation / inclination";
        case 60:
        case 61:
        case 62:
            return "Device specific";
        case 70:
            return "Input 1";
        case 71:
            return "Input 2";
        case 72:
            return "Input 3";
        case 73:
            return "Input 4";
        case 75:
            return "Relay Status 1";
        case 76:
            return "Relay Status 2";

        default:
            return "Unknown";
    }
}

/**
 * Returns the printable name of a physical unit for LPP supporting devices e.g.: 1 = "°C"
 * @access private
 * @param  {Number} id    Identifier as integer 
 * @return {string}       Returns a string e.g.: "°C"
 */
function lppReturnUnitFromId(id) {
    switch (id) {
        case 0:
            return "None";
        case 1:
            return "Pa";
        case 2:
            return "kPa";
        case 3:
            return "mbar";
        case 4:
            return "mmWC";
        case 5:
            return "inWC";

        case 10:
            return "[m³/s] cubic metre per second";
        case 11:
            return "[m³/h] cubic metre per hour (cbm/h)";

        case 12:
            return "[l/s] litre per second";
        case 13:
            return "[cfm] cubic feet per minute";
        case 14:
            return "[m/s]";
        case 15:
            return "[ft/min]";

        case 20:
            return "% rH";
        case 21:
            return "[g/m³]";
        case 22:
            return "[g/ft³]";
        case 23:
            return "[kJ/kg]";
        case 24:
            return "[BTU/lb]";

        case 30:
            return "normalized";
        case 31:
            return "ppm";
        case 32:
            return "[%] percent";

        case 40:
            return "°C";
        case 41:
            return "°F";

        case 45:
            return "V";

        case 46:
            return "bin";

        default:
            return "Unknown";
    }
}

// ***********************************************************************************
//          Export functions Section
// ***********************************************************************************
if (typeof exports !== 'undefined') {
    exports.decodeUplink = decodeUplink;
    exports.decodeHexString = decodeHexString;
    exports.decodeBase64String = decodeBase64String;
}
