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
 * JSON Object. It can only parse payload from F98W6 devices. 
 * This parser follows the specification LoRaWAN® Payload Codec API Specification TS013-1.0.0.
 * 
 * 
 * SPDX-FileCopyrightText: Copyright (C) 2023 WIKA Alexander Wiegand SE & Co. KG   
 * SPDX-License-Identifier: MIT
 * 
 * SPDX-FileName: index.js
 * SPDX-PackageVersion: 2.1.0
 *  
*/

// ***********************************************************************************
// Public Decoding Section
// ***********************************************************************************

/**
 * ATTENTION: You must define the measurement ranges first, otherwise the script will not work.
 * The device configuration defines the measurement ranges for the supported measured variables of your used devices, e.g.
 * var FORCE_RANGE_START = 0;
 * var FORCE_RANGE_END = 10;
 * var DEVICE_TEMPERATURE_RANGE_START = -40;
 * var DEVICE_TEMPERATURE_RANGE_END = 60; 
 */

/**
 * The starting value of the strain range.
 * @type {number}
 */
var FORCE_RANGE_START;

/**
 * The ending value of the strain range.
 * @type {number}
 */
var FORCE_RANGE_END;

/**
 * The starting value of the device temperature range.
 * @type {number}
 */
var DEVICE_TEMPERATURE_RANGE_START;

/**
 * The ending value of the device temperature range.
 * @type {number}
 */
var DEVICE_TEMPERATURE_RANGE_END;


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
var DEVICE_NAME = "F98W6";

var GENERIC_DATA_CHANNEL_RANGE_START = 2500;
var GENERIC_DATA_CHANNEL_RANGE_END = 12500;
var ERROR_VALUE = 0xffff;

var CHANNEL_NAMES_DICTIONARY = ['strain', 'device temperature', 'battery voltage'];
var CHANNEL_MEASURAND_CONFIGURATION_DEFAULT_ORDER = ["strain", "device temperature"];
var ALARM_EVENT_NAMES_DICTIONARY = ['triggered', 'disappeared'];
var ALARM_CHANNEL_NAMES_DICTIONARY = ['strain', 'device temperature'];
var PROCESS_ALARM_TYPE_NAMES_DICTIONARY = ['low threshold', 'high threshold', 'falling slope', 'rising slope', 'low threshold with delay', 'high threshold with delay'];
var DEVICE_ALARM_CAUSE_OF_FAILURE_NAMES_DICTIONARY = ['generic', 'device dependent'];

/**
 * @type {{[key: number]: string}} = { 0: "low battery alarm", 4: "duty cycle alarm" }
 */
var ALARM_STATUS_TYPE_NAMES_DICTIONARY = { 0: "low battery alarm", 4: "duty cycle alarm" };

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
    output = checkMeasurementRanges(output);
    if (output.errors) {
        return output;
    }
    /* Select subfunction to decode message */
    switch (input.bytes[0]) {
        /* unused */
        default:
        case 0x00:
        case 0x06: // configuration status message is not supported
        case 0x09: // extended device identification message is not supported
            // Error, not enough bytes
            output = addErrorMessage(output, "Data message type " + input.bytes[0].toString(16).padStart(2, "0") + " not supported");
            break;

        /* Data message */
        case 0x01:
        case 0x02:
            /* Check if all bytes needed for decoding are there */
            if (input.bytes.length == 7) {
                // decode
                output = decodeDataMessage(input);
            }
            else {
                // Error, not enough bytes
                output = addErrorMessage(output, "Data message 01/02 needs 7 bytes but got " + input.bytes.length);
            }
            break;

        /* Process alarm */
        case 0x03:
            /* Check if all bytes needed for decoding are there and all bytes for each alarm */
            if (input.bytes.length >= 5 && !((input.bytes.length - 2) % 3)) {
                // decode
                output = decodeProcessAlarm(input);
            }
            else {
                // Error, not enough bytes
                output = addErrorMessage(output, "Process alarm 03 needs at least 5 bytes and got " + input.bytes.length + ". Also all bytes for each alarm needed");
            }
            break;

        /* Technical alarm */
        case 0x04:
            /* Check if all bytes needed for decoding are there and all bytes for each alarm */
            if (input.bytes.length == 3) {
                // decode
                output = decodeTechnicalAlarm(input);
            }
            else {
                // Error, not enough bytes
                output = addErrorMessage(output, "Technical alarm 04 needs 3 bytes but got " + input.bytes.length);
            }
            break;

        /* Device alarm */
        case 0x05:
            /* Check if all bytes needed for decoding are there */
            if (input.bytes.length >= 3 && input.bytes.length <= 4) {
                // decode
                output = decodeDeviceAlarm(input);
            }
            else {
                // Error, not enough bytes
                output = addErrorMessage(output, "Device alarm 05 needs at least 3 bytes and maximum 4 but got " + input.bytes.length);
            }
            break;

        /* Device identification */
        case 0x07:
            /* Check if all bytes needed for decoding are there */
            /* 8 bytes are minimum, if no sensor is detected. 38 bytes including sensor */
            if (input.bytes.length >= 8 && input.bytes.length <= 38) {
                // decode
                output = decodeDeviceIdentification(input);
            }
            else {
                // Error, not enough bytes
                output = addErrorMessage(output, "Identification message 07 needs at least 8 and maxium 38 bytes, but got " + input.bytes.length);
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

    // force - channel 0
    var force = {};
    force.channelId = 0;
    force.channelName = CHANNEL_NAMES_DICTIONARY[force.channelId];
    force.value = getRealValueByChannelName(force.channelName, input.bytes[3] << 8 | input.bytes[4]);
    output.data.measurement.channels.push(force);

    // temperature - channel 1
    var temperature = {};
    temperature.channelId = 1;
    temperature.channelName = CHANNEL_NAMES_DICTIONARY[temperature.channelId];
    temperature.value = getRealValueByChannelName(temperature.channelName, input.bytes[5] << 8 | input.bytes[6]);
    output.data.measurement.channels.push(temperature);

    // battery voltage - channel x
    var batteryVoltage = {};
    batteryVoltage.channelId = 2;
    batteryVoltage.channelName = CHANNEL_NAMES_DICTIONARY[batteryVoltage.channelId];
    // battery voltage in V as single not double
    batteryVoltage.value = (input.bytes[2] / 10);
    output.data.measurement.channels.push(batteryVoltage);

    return output;
}

/**
 * Decodes a process alarm 03 into an object
 * @access private
 * @param {Object}          input           - An object provided by the IoT Flow framework
 * @param {number[]}        input.bytes     - Array of bytes represented as numbers as it has been sent from the device
 * @param {number}          input.fPort     - The Port Field on which the uplink has been sent
 * @param {Date}            input.recvTime  - The uplink message time recorded by the LoRaWAN network server
 * @returns {output}                        - The decoded object
 */
function decodeProcessAlarm(input) {

    var output = createOutputObject();
    output.data.processAlarms = [];

    // data message type
    output.data.messageType = input.bytes[0];

    // current configuration id
    output.data.configurationId = input.bytes[1];

    // Reserved
    // input.bytes[2];

    for (var byteIndex = 2, alarmCounter = 0; byteIndex < input.bytes.length; byteIndex += 3, alarmCounter++) {
        output.data.processAlarms[alarmCounter] = {};

        // Alarm event 0 = triggered, 1 = disappeared
        output.data.processAlarms[alarmCounter].event = (input.bytes[byteIndex] & 0x80) >> 7;
        output.data.processAlarms[alarmCounter].eventName = ALARM_EVENT_NAMES_DICTIONARY[output.data.processAlarms[alarmCounter].event];

        // Alarm channel 
        output.data.processAlarms[alarmCounter].channelId = (input.bytes[byteIndex] & 0x78) >> 3;
        output.data.processAlarms[alarmCounter].channelName = ALARM_CHANNEL_NAMES_DICTIONARY[output.data.processAlarms[alarmCounter].channelId];

        output.data.processAlarms[alarmCounter].alarmType = (input.bytes[byteIndex] & 0x07);
        output.data.processAlarms[alarmCounter].alarmTypeName = PROCESS_ALARM_TYPE_NAMES_DICTIONARY[output.data.processAlarms[alarmCounter].alarmType];

        // Alarm value
        output.data.processAlarms[alarmCounter].value = getRealValueByChannelNumberAndAlarmType(output.data.processAlarms[alarmCounter].channelId,
            output.data.processAlarms[alarmCounter].alarmType,
            input.bytes[byteIndex + 1] << 8 | input.bytes[byteIndex + 2]);

        if (output.data.processAlarms[alarmCounter].value == ERROR_VALUE) {
            output = addWarningMessage(output, "Invalid data for " + output.data.processAlarms[alarmCounter].channelName + "channel");
        }
    }

    return output;
}

/**
 * Decodes a technical alarm 04 into an object
 * @access private
 * @param {Object}          input           - An object provided by the IoT Flow framework
 * @param {number[]}        input.bytes     - Array of bytes represented as numbers as it has been sent from the device
 * @param {number}          input.fPort     - The Port Field on which the uplink has been sent
 * @param {Date}            input.recvTime  - The uplink message time recorded by the LoRaWAN network server
 * @returns {output}                 - The decoded object
 */
function decodeTechnicalAlarm(input) {
    // Output
    var output = createOutputObject();
    output.data.technicalAlarms = [];

    // data message type
    output.data.messageType = input.bytes[0];

    // current configuration id
    output.data.configurationId = input.bytes[1];

    // Create array entry
    output.data.technicalAlarms[0] = {};

    // Alarm event 0 = triggered, 1 = disappeared
    output.data.technicalAlarms[0].event = (input.bytes[2] & 0x80) >> 7;
    output.data.technicalAlarms[0].eventName = ALARM_EVENT_NAMES_DICTIONARY[output.data.technicalAlarms[0].event];

    output.data.technicalAlarms[0].alarmType = (input.bytes[2] & 0x7f);

    if (output.data.technicalAlarms[0].alarmType & 1) {
        output.data.technicalAlarms[0].alarmTypeName = "Punctual sensor error";
    }
    else if (output.data.technicalAlarms[0].alarmType & 1 << 2) {
        output.data.technicalAlarms[0].alarmTypeName = "Permanent sensor error";
    }

    return output;
}

/**
 * Decodes a device alarm 05 into an object
 * @access private
 * @param {Object}              input           - An object provided by the IoT Flow framework
 * @param {number[]}            input.bytes     - Array of bytes represented as numbers as it has been sent from the device
 * @param {number}              input.fPort     - The Port Field on which the uplink has been sent
 * @param {Date}                input.recvTime  - The uplink message time recorded by the LoRaWAN network server
 * @returns {output}                     - The decoded object
 */
function decodeDeviceAlarm(input) {
    // Output
    var output = createOutputObject();

    // data message type
    output.data.messageType = input.bytes[0];

    // current configuration id
    output.data.configurationId = input.bytes[1];

    output.data.deviceAlarm = {};

    output.data.deviceAlarm.event = (input.bytes[2] & 0x80) >> 7;
    output.data.deviceAlarm.eventName = ALARM_EVENT_NAMES_DICTIONARY[output.data.deviceAlarm.event];

    output.data.deviceAlarm.causeOfFailure = (input.bytes[2] & 0x60) >> 6;
    output.data.deviceAlarm.causeOfFailureName = DEVICE_ALARM_CAUSE_OF_FAILURE_NAMES_DICTIONARY[output.data.deviceAlarm.causeOfFailure];

    output.data.deviceAlarm.alarmType = (input.bytes[2] & 0x1f);
    output.data.deviceAlarm.alarmTypeName = ALARM_STATUS_TYPE_NAMES_DICTIONARY[output.data.deviceAlarm.alarmType];

    switch (output.data.deviceAlarm.alarmType) {
        // low battery alarm has an value
        case 0:
            // Alarm value is a int8, use this ugly thing here, because JS can not cast directly to int8
            output.data.deviceAlarm.batteryValue = input.bytes[3] / 10.0;
            break;

        // All other don't have any alarm value
        case 4:
        default:
            break;
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

    output.data.deviceStatistic = {};
    // Battery level event indicator
    output.data.deviceStatistic.batteryLevelNewEvent = (input.bytes[2] & 0x80) >> 7 ? true : false;

    // battery level in percent
    output.data.deviceStatistic.batteryLevelPercent = input.bytes[2] & 0x7f;

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
    output.data.deviceInformation.productIdName = input.bytes[2] == 18 ? "F98W6" : input.bytes[2];

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

    // Wireless module firmware version
    output.data.deviceInformation.wirelessModuleFirmwareVersion = ((input.bytes[4] >> 4) & 0x0f).toString() + "." + (input.bytes[4] & 0x0f).toString() + "." + (input.bytes[5]).toString();

    // Wireless module hardware version
    output.data.deviceInformation.wirelessModuleHardwareVersion = ((input.bytes[6] >> 4) & 0x0f).toString() + "." + (input.bytes[6] & 0x0f).toString() + "." + (input.bytes[7]).toString();

    /* return function if no sensor data is available */
    if (input.bytes.length < 38) {
        output = addErrorMessage(output, "Device identification frame 07 has not all bytes included, received " + input.bytes.length + "/38 bytes");
        return output;
    }

    // Sensor serial number
    output.data.deviceInformation.serialNumber = "";
    for (var i = 8; i < 19; i++) {
        if (input.bytes[i] == 0) {
            break;
        }
        output.data.deviceInformation.serialNumber += String.fromCharCode(input.bytes[i]);
    }

    // Strain type
    switch (input.bytes[19]) {
        case 1:
            output.data.deviceInformation.strainType = "absolute";
            break;

        case 2:
            output.data.deviceInformation.strainType = "gauge / relative";
            break;

        default:
            output.data.deviceInformation.strainType = "unknown";
            break;
    }

    // Min range strain
    output.data.deviceInformation.measurementRangeStartStrain = convertHexToFloatIEEE754(input.bytes[20].toString(16).padStart(2, "0") + input.bytes[21].toString(16).padStart(2, "0") + input.bytes[22].toString(16).padStart(2, "0") + input.bytes[23].toString(16).padStart(2, "0"));
    output.data.deviceInformation.measurementRangeStartStrain = Number(output.data.deviceInformation.measurementRangeStartStrain.toFixed(6));

    // Max range strain
    output.data.deviceInformation.measurementRangeEndStrain = convertHexToFloatIEEE754(input.bytes[24].toString(16).padStart(2, "0") + input.bytes[25].toString(16).padStart(2, "0") + input.bytes[26].toString(16).padStart(2, "0") + input.bytes[27].toString(16).padStart(2, "0"));
    output.data.deviceInformation.measurementRangeEndStrain = Number(output.data.deviceInformation.measurementRangeEndStrain.toFixed(6));

    // Min range device temperature
    output.data.deviceInformation.measurementRangeStartDeviceTemperature = convertHexToFloatIEEE754(input.bytes[28].toString(16).padStart(2, "0") + input.bytes[29].toString(16).padStart(2, "0") + input.bytes[30].toString(16).padStart(2, "0") + input.bytes[31].toString(16).padStart(2, "0"));
    output.data.deviceInformation.measurementRangeStartDeviceTemperature = Number(output.data.deviceInformation.measurementRangeStartDeviceTemperature.toFixed(6));

    // Max range device temperature
    output.data.deviceInformation.measurementRangeEndDeviceTemperature = convertHexToFloatIEEE754(input.bytes[32].toString(16).padStart(2, "0") + input.bytes[33].toString(16).padStart(2, "0") + input.bytes[34].toString(16).padStart(2, "0") + input.bytes[35].toString(16).padStart(2, "0"));
    output.data.deviceInformation.measurementRangeEndDeviceTemperature = Number(output.data.deviceInformation.measurementRangeEndDeviceTemperature.toFixed(6));

    // Unit strain
    output.data.deviceInformation.strainUnit = input.bytes[36];
    output.data.deviceInformation.strainUnitName = returnPhysicalUnitFromId(input.bytes[36]);

    // Unit device temperature
    output.data.deviceInformation.deviceTemperatureUnit = input.bytes[37];
    output.data.deviceInformation.deviceTemperatureUnitName = returnPhysicalUnitFromId(input.bytes[37]);

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
 * Checks the user defined measurement ranges
 * @access private
 * @param  {output} output - Output object
 * @return {output}        - Returns if the ranges are correct defined
 */
function checkMeasurementRanges(output) {
    if (typeof FORCE_RANGE_START === 'undefined') {
        output = addErrorMessage(output, "The FORCE_RANGE_START was not set.");
    }

    if (typeof FORCE_RANGE_END === 'undefined') {
        output = addErrorMessage(output, "The FORCE_RANGE_END was not set.");
    }

    if (typeof DEVICE_TEMPERATURE_RANGE_START === 'undefined') {
        output = addErrorMessage(output, "The DEVICE_TEMPERATURE_RANGE_START was not set.");
    }

    if (typeof DEVICE_TEMPERATURE_RANGE_END === 'undefined') {
        output = addErrorMessage(output, "The DEVICE_TEMPERATURE_RANGE_END was not set.");
    }

    if (FORCE_RANGE_START >= FORCE_RANGE_END) {
        output = addErrorMessage(output, "The FORCE_RANGE_START must not be greater or equal to FORCE_RANGE_END, " + FORCE_RANGE_START + " >= " + FORCE_RANGE_END + ". ");
    }

    if (DEVICE_TEMPERATURE_RANGE_START >= DEVICE_TEMPERATURE_RANGE_END) {
        output = addErrorMessage(output, "The DEVICE_TEMPERATURE_RANGE_START must not be greater or equal to DEVICE_TEMPERATURE_RANGE_END, " + DEVICE_TEMPERATURE_RANGE_START + " >= " + DEVICE_TEMPERATURE_RANGE_END + ".");
    }

    return output;
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
 * Sets measurement ranges only for test purposes
 * @access protected
 * @param  {Number} strainRangeStart   range start
 * @param  {Number} strainRangeEnd     range end
 * @param  {Number} temperatureRangeStart   range start
 * @param  {Number} temperatureRangeEnd     range end
 */
function setMeasurementRanges(strainRangeStart, strainRangeEnd, temperatureRangeStart, temperatureRangeEnd) {
    FORCE_RANGE_START = strainRangeStart;
    FORCE_RANGE_END = strainRangeEnd;
    DEVICE_TEMPERATURE_RANGE_START = temperatureRangeStart;
    DEVICE_TEMPERATURE_RANGE_END = temperatureRangeEnd;
}

/**
 * Returns the real physical value of the channel value based on measurement range
 * @access private
 * @param  {Number} channelValue    channel value as integer 
 * @param  {Number} measurementRangeStart   range start
 * @param  {Number} measurementRangeEnd     range end
 * @param  {Number} measuringRangeStart   range start (MRS)
 * @param  {Number} measuringRangeEnd     range end (MRE)
 * @return {Number} Returns real physical value e.g. 10 °C
 */
function getCalculatedValue(channelValue, measurementRangeStart, measurementRangeEnd, measuringRangeStart, measuringRangeEnd) {
    var calculatedValue = (channelValue - measuringRangeStart) * ((measurementRangeEnd - measurementRangeStart) / (measuringRangeEnd - measuringRangeStart)) + measurementRangeStart;
    // round to the third number after the comma
    return Math.round(calculatedValue * 1000) / 1000;
}

/**
 * Returns the real physical value of strain based on measurement range
 * @param {Number} channelValue  
 * @access private
 */
function getCalculatedStrain(channelValue) {
    return getCalculatedValue(channelValue, FORCE_RANGE_START, FORCE_RANGE_END, GENERIC_DATA_CHANNEL_RANGE_START, GENERIC_DATA_CHANNEL_RANGE_END);
}

/**
 * Returns the real physical value of temperature based on measurement range
 * @param {Number} channelValue  
 * @access private
 */
function getCalculatedTemperature(channelValue) {
    return getCalculatedValue(channelValue, DEVICE_TEMPERATURE_RANGE_START, DEVICE_TEMPERATURE_RANGE_END, GENERIC_DATA_CHANNEL_RANGE_START, GENERIC_DATA_CHANNEL_RANGE_END);
}

/**
 * Returns the real physical value of the channel number based on measurement range
 * @param {string} channelName 
 * @param {Number} channelValue  
 * @access private
 */
function getRealValueByChannelName(channelName, channelValue) {
    if (channelName == CHANNEL_MEASURAND_CONFIGURATION_DEFAULT_ORDER[0]) {
        return getCalculatedStrain(channelValue);
    }
    else if (channelName == CHANNEL_MEASURAND_CONFIGURATION_DEFAULT_ORDER[1]) {
        return getCalculatedTemperature(channelValue);
    }

    return ERROR_VALUE;
}

/**
 * Returns the real physical value of the channel number based on measurement range
 * @param {Number} channelValue  
 * @param {Number} alarmType  
 * @param {Number} channelNumber  
 * @access private
 */
function getRealValueByChannelNumberAndAlarmType(channelNumber, alarmType, channelValue) {
    if (channelNumber == 0) // strain channel
    {
        if (alarmType == 3 || alarmType == 4) {
            return getSlopeValue(channelValue, FORCE_RANGE_START, FORCE_RANGE_END);
        }
        else {
            return getThresholdValue(channelValue, FORCE_RANGE_START, FORCE_RANGE_END);
        }
    }
    else if (channelNumber == 1) // temperature channel
    {
        if (alarmType == 3 || alarmType == 4) {
            return getSlopeValue(channelValue, DEVICE_TEMPERATURE_RANGE_START, DEVICE_TEMPERATURE_RANGE_END);
        }
        else {
            return getThresholdValue(channelValue, DEVICE_TEMPERATURE_RANGE_START, DEVICE_TEMPERATURE_RANGE_END);
        }
    }

    return ERROR_VALUE;
}

/**
 * Returns the real threshold value of strain based on measurement range (measurend)
 * @param {Number} channelValue  
 * @param  {Number} measurementRangeStart   range start
 * @param  {Number} measurementRangeEnd     range end
 * @access private
 */
function getThresholdValue(channelValue, measurementRangeStart, measurementRangeEnd) {
    return getCalculatedValue(channelValue, measurementRangeStart, measurementRangeEnd, 2500, 12500);
}

/**
 * Returns the real physical value of strain based on measurement range (measurend/minute)
 * @param {Number} channelValue  
 * @param  {Number} measurementRangeStart   range start
 * @param  {Number} measurementRangeEnd     range end
 * @access private
 */
function getSlopeValue(channelValue, measurementRangeStart, measurementRangeEnd) {
    return getCalculatedValue(channelValue, measurementRangeStart, measurementRangeEnd, 0, 10000);
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
 * Takes an id and returns it physical representation from look up list
 * @param  {Number} id    Identifier as integer 
 * @return {string}       Returns the printable name of a physical unit for F98W6 e.g.: 1 = "mBar"
 */
function returnPhysicalUnitFromId(id) {
    switch (id) {
        case 1:
            return "inH2O";
        case 2:
            return "inHg";
        case 3:
            return "ftH2O";
        case 4:
            return "mmH2O";
        case 5:
            return "mmHg";
        case 6:
            return "psi";
        case 7:
            return "bar";
        case 8:
            return "mbar";
        case 9:
            return "g/cm²";
        case 10:
            return "kg/cm²";
        case 11:
            return "Pa";
        case 12:
            return "kPa";
        case 13:
            return "Torr";
        case 14:
            return "at";
        case 29:
            return "strain / dehnung";
        case 45:
            return "N";
        case 47:
            return "KN";
        case 55:
            return "kg";
        case 56:
            return "g";
        case 145:
            return "inH2O (60 °F)";
        case 170:
            return "cmH2O (4 °C)";
        case 171:
            return "mH2O (4 °C)";
        case 172:
            return "cmHg";
        case 173:
            return "lb/ft²";
        case 174:
            return "hPa";
        case 175:
            return "psia";
        case 176:
            return "kg/m²";
        case 177:
            return "ftH2O (4 °C)";
        case 178:
            return "ftH2O (60 °F)";
        case 179:
            return "mHg";
        case 180:
            return "Mpsi";
        case 185:
            return "µeps";
        case 237:
            return "MPa";
        case 238:
            return "inH2O (4 °C)";
        case 239:
            return "mmH2O (4 °C)";
        case 32:
            return "°C";
        case 33:
            return "°F";
        default:
            return "Unknown";
    }
}

// ***********************************************************************************
//          Export functions Section
// ***********************************************************************************
if (typeof exports !== 'undefined') {
    exports.decodeUplink = decodeUplink;
    exports.setMeasurementRanges = setMeasurementRanges;
    exports.decodeHexString = decodeHexString;
    exports.decodeBase64String = decodeBase64String;
}
