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
 * JSON Object. It can only parse payload from PGU+NETRIS3 devices. 
 * This parser follows the specification LoRaWAN® Payload Codec API Specification TS013-1.0.0.
 * 
 * 
 * SPDX-FileCopyrightText: Copyright (C) 2023 WIKA Alexander Wiegand SE & Co. KG   
 * SPDX-License-Identifier: MIT
 * 
 * SPDX-FileName: index.js
 * SPDX-PackageVersion: 2.4.0
 *  
*/

// ***********************************************************************************
// Public Decoding Section
// ***********************************************************************************

/**
 * ATTENTION: You must define the measurement ranges first, otherwise the script will not work.
 * The device configuration defines the measurement ranges for the supported measured variables of your used devices, e.g.
 * var PRESSURE_RANGE_START = 0;
 * var PRESSURE_RANGE_END = 10;
 * var DEVICE_TEMPERATURE_RANGE_START = -40;
 * var DEVICE_TEMPERATURE_RANGE_END = 60; 
 */

/**
 * The starting value of the pressure range.
 * @type {number}
 */
var PRESSURE_RANGE_START;

/**
 * The ending value of the pressure range.
 * @type {number}
 */
var PRESSURE_RANGE_END;

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
 * If you disable one of the channels, remove the disabled channel from the CHANNEL_MEASURAND_CONFIGURATION.
 * Channel order: "pressure", "device temperature"
 */

/**
 * An array of strings representing the available measurands for a channel.
 * @type {string[]}
 */
var CHANNEL_MEASURAND_CONFIGURATION = ["pressure", "device temperature"];

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
var DEVICE_NAME = "PGU+NETRIS3";

var GENERIC_DATA_CHANNEL_RANGE_START = 2500;
var GENERIC_DATA_CHANNEL_RANGE_END = 12500;
var ERROR_VALUE = 0xffff;

var CHANNEL_MEASURAND_CONFIGURATION_DEFAULT_ORDER = ["pressure", "device temperature"];
var ALARM_EVENT_NAMES_DICTIONARY = ['triggered', 'disappeared'];
var ALARM_CHANNEL_NAMES_DICTIONARY = ['pressure', 'device temperature'];
var PROCESS_ALARM_TYPE_NAMES_DICTIONARY = ['low threshold', 'high threshold', 'falling slope', 'rising slope', 'low threshold with delay', 'high threshold with delay'];

/// PGU+NETRIS3 alarm codes (No bitmask!):
/// Code    description     values 
/// 4       STAT_DEV        Sensor signalled an error. It’s defective
/// 3       MV_STAT         channel 3 Channel 3 measurement can’t be trusted
/// 2       MV_STAT         channel 2 Channel 2 measurement can’t be trusted
/// 1       MV_STAT         channel 1 Channel 1 measurement can’t be trusted
/// 0       MV_STAT         channel 0 Channel 0 measurement can’t be trusted
var TECHNICAL_ALARM_TYPE_NAMES_DICTIONARY = ['MV_STAT channel 0', 'MV_STAT channel 1', 'MV_STAT channel 2', 'MV_STAT channel 3', 'STAT_DEV'];

// Alarm status bit mask
/// Bitmask PGU+NETRIS3:
/// 15-9    RFU (device specific)
/// 8       UART ALARM 1: UranusRadio serial communication error
/// 7-3     RFU (TULIP generic)
/// 2       DUTY CYCLE ALARM 1: RF emission duty cycle exceeded
/// 1       TEMPERATURE ALARM 1: device temperature out of expected range
/// 0       LOW BATTERY 1: battery low condition
/**
 * @type {{[key: number]: string}} = { 1: "low battery", 2: "temperature alarm", 4: "duty cycle alarm", 256: "UART alarm" }
 */
var ALARM_STATUS_TYPE_NAMES_DICTIONARY = { 1: "low battery", 2: "temperature alarm", 4: "duty cycle alarm", 256: "UART alarm" };

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
            // Error, not enough bytes            
            output = addErrorMessage(output, "Data message type " + input.bytes[0].toString(16).padStart(2, "0") + " not supported");
            break;

        /* Data message */
        case 0x01:
        case 0x02:
            /* Check if all bytes needed for decoding are there */
            /* 4 is needed to let function to decode run earliest as possible */
            if (input.bytes.length >= 4 && input.bytes.length <= 11) {
                // decode
                output = decodeDataMessage(input);
            }
            else {
                // Error, not enough bytes                
                output = addErrorMessage(output, "Data message 01/02 needs at least 4 and maximum 11 bytes but got " + input.bytes.length);
            }
            break;

        /* Process alarm */
        case 0x03:
            /* Check if all bytes needed for decoding are there and all bytes for each alarm */
            if (input.bytes.length >= 6 && !((input.bytes.length - 3) % 3)) {
                // decode
                output = decodeProcessAlarm(input);
            }
            else {
                // Error, not enough bytes                
                output = addErrorMessage(output, "Process alarm 03 needs at least 6 bytes and got " + input.bytes.length + ". Also all bytes for each alarm needed");
            }
            break;

        /* Technical alarm */
        case 0x04:
            /* Check if all bytes needed for decoding are there and all bytes for each alarm */
            if (input.bytes.length >= 6 && !((input.bytes.length - 3) % 3)) {
                // decode
                output = decodeTechnicalAlarm(input);
            }
            else {
                // Error, not enough bytes                
                output = addErrorMessage(output, "Technical alarm 04 needs 6 bytes but got " + input.bytes.length);
            }
            break;

        /* Device alarm */
        case 0x05:
            /* Check if all bytes needed for decoding are there */
            if (input.bytes.length == 4) {
                // decode
                output = decodeDeviceAlarm(input);
            }
            else {
                // Error, not enough bytes                
                output = addErrorMessage(output, "Device alarm 05 needs at least 4 bytes got " + input.bytes.length);
            }
            break;

        /* Device identification */
        case 0x07:
            /* Check if at least 16 bytes and max 56 bytes needed for decoding are there */
            if (input.bytes.length >= 16 && input.bytes.length <= 56) {
                // decode
                output = decodeDeviceIdentification(input);
            }
            else {
                // Error, not enough bytes                
                output = addErrorMessage(output, "Identification message 07 needs at least 16 and maximum 56 bytes, but got " + input.bytes.length);
            }
            break;

        /* Keep alive */
        case 0x08:
            /* Check if all bytes needed for decoding are there */
            if (input.bytes.length == 10) {
                // Decode
                output = decodeKeepAliveMessage(input);
            }
            else {
                // Error, not enough bytes                
                output = addErrorMessage(output, "Keep alive message 08 needs 10 bytes but got " + input.bytes.length);
            }
            break;

        /* Extended device identification */
        case 0x09:
            /* without optional fields minimum length is 20 and maximum 42 bytes */
            if (input.bytes.length >= 20 && input.bytes.length <= 42) {
                output = decodeExtendedDeviceIdentification(input);
            }
            else {
                // Error, not enough bytes                
                output = addErrorMessage(output, "Extended device identification message 09 needs at least 20 and maximum 42 bytes but got " + input.bytes.length);
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
    var channelNumber = 0;

    // data message type
    output.data.messageType = input.bytes[0];

    // current configuration id
    output.data.configurationId = input.bytes[1];

    /* input.bytes[2] = reserved */

    if ((input.bytes.length - 3 - 2) < 0) {
        output = addWarningMessage(output, "Not enough data to decode channel (pressure). Payload must has a length of 2 bytes, input data length: " + input.bytes.length);
    }

    output.data.measurement = {};
    output.data.measurement .channels = [];
    var measurementData;

    // channel 0
    if (input.bytes.length >= 5 && CHANNEL_MEASURAND_CONFIGURATION[0] == CHANNEL_MEASURAND_CONFIGURATION_DEFAULT_ORDER[0]) {
        measurementData = input.bytes[3] << 8 | input.bytes[4];
        output = addChannelData(output, measurementData, channelNumber++, CHANNEL_MEASURAND_CONFIGURATION_DEFAULT_ORDER[0]);
    }

    if ((input.bytes.length - 3 - 2 - 2) < 0) {
        output = addWarningMessage(output, "Not enough data to decode channel (temperature). Payload must has a length of 4 bytes, input data length: " + input.bytes.length);
    }

    // Channel 1
    if (input.bytes.length >= 7 && (CHANNEL_MEASURAND_CONFIGURATION[0] == CHANNEL_MEASURAND_CONFIGURATION_DEFAULT_ORDER[1] || CHANNEL_MEASURAND_CONFIGURATION[1] == CHANNEL_MEASURAND_CONFIGURATION_DEFAULT_ORDER[1])) {
        measurementData = input.bytes[5] << 8 | input.bytes[6];
        output = addChannelData(output, measurementData, channelNumber++, CHANNEL_MEASURAND_CONFIGURATION_DEFAULT_ORDER[1]);
    }

    if (output.errors) {
        // delete data from output
        output.data = {}
    }

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

    for (var byteIndex = 3, alarmCounter = 0; byteIndex < input.bytes.length; byteIndex += 3, alarmCounter++) {
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
    var TECHNICAL_ALARM_TYPE_STAT_DEV = 4;

    // Output
    var output = createOutputObject();
    output.data.technicalAlarms = [];

    // data message type
    output.data.messageType = input.bytes[0];

    // current configuration id
    output.data.configurationId = input.bytes[1];

    // Reserved
    input.bytes[2];

    for (var byteIndex = 3, i = 0; byteIndex < input.bytes.length; byteIndex += 3, i++) {
        output.data.technicalAlarms[i] = {};
        output.data.technicalAlarms[i].alarmType = input.bytes[byteIndex];
        output.data.technicalAlarms[i].alarmTypeName = TECHNICAL_ALARM_TYPE_NAMES_DICTIONARY[output.data.technicalAlarms[i].alarmType];

        var causeOfFailure = input.bytes[byteIndex + 2];
        output.data.technicalAlarms[i].causeOfFailure = causeOfFailure;

        if (output.data.technicalAlarms[i].alarmType == TECHNICAL_ALARM_TYPE_STAT_DEV) {
            if (causeOfFailure & 0x1) {
                output.data.technicalAlarms[i].causeOfFailureName = "STAT_DEV_ERROR";
            }
            else if ((causeOfFailure & 0x2) >> 1) {
                output.data.technicalAlarms[i].causeOfFailureName = "STAT_DEV_WARNING";
            }
            else if ((causeOfFailure & 0x3) >> 2) {
                output.data.technicalAlarms[i].causeOfFailureName = "STAT_DEV_RESTARTED";
            }
        }
        else {
            if (causeOfFailure & 0x1) {
                output.data.technicalAlarms[i].causeOfFailureName = "MV_STAT_ERROR";
            }
            else if ((causeOfFailure & 0x2) >> 1) {
                output.data.technicalAlarms[i].causeOfFailureName = "MV_STAT_WARNING";
            }
        }
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

    // Create deviceAlarm
    output.data.deviceAlarm = {};

    // Alarm type / alarm status
    output.data.deviceAlarm.alarmStatus = (input.bytes[2] << 8) | input.bytes[3];

    // Go through each bit and check if set
    output.data.deviceAlarm.alarmStatusNames = [];
    for (var j = 0, i = 0; j < 15; j++) {
        // Check if bit is set
        if (output.data.deviceAlarm.alarmStatus & (1 << j)) {
            output.data.deviceAlarm.alarmStatusNames[i] = ALARM_STATUS_TYPE_NAMES_DICTIONARY[1 << j];
            i++;
        }
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
    output.data.deviceStatistic.numberOfMeasurements = (input.bytes[2] << 24) | (input.bytes[3] << 16) | (input.bytes[4] << 8) | input.bytes[5];

    // battery level in percent
    output.data.deviceStatistic.numberOfTransmissions = (input.bytes[6] << 24) | (input.bytes[7] << 16) | (input.bytes[8] << 8) | input.bytes[9];

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

    // Create channel props
    output.data.deviceInformation.channelConfigurations = Array.from({ length: 2 });

    // Product id raw
    output.data.deviceInformation.productId = input.bytes[2];

    // Product id resolved
    output.data.deviceInformation.productIdName = input.bytes[2] == 15 ? "NETRIS3" : input.bytes[2];


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

    // Sensor device type id
    output.data.deviceInformation.sensorDeviceTypeId = (input.bytes[4] << 8) | input.bytes[5];

    // Channel 0 is always there (pressure or temperature)
    output.data.deviceInformation.channelConfigurations[0] = {};
    output.data.deviceInformation.channelConfigurations[0].measurand = input.bytes[6];
    output.data.deviceInformation.channelConfigurations[0].measurandName = lppReturnMeasurandFromId(input.bytes[6]);

    var measurementRangeString = input.bytes[7].toString(16).padStart(2, "0") + input.bytes[8].toString(16).padStart(2, "0") + input.bytes[9].toString(16).padStart(2, "0") + input.bytes[10].toString(16).padStart(2, "0")
    output.data.deviceInformation.channelConfigurations[0].measurementRangeStart = convertHexToFloatIEEE754(measurementRangeString);
    output.data.deviceInformation.channelConfigurations[0].measurementRangeStart = Number(output.data.deviceInformation.channelConfigurations[0].measurementRangeStart.toFixed(6));

    measurementRangeString = input.bytes[11].toString(16).padStart(2, "0") + input.bytes[12].toString(16).padStart(2, "0") + input.bytes[13].toString(16).padStart(2, "0") + input.bytes[14].toString(16).padStart(2, "0");
    output.data.deviceInformation.channelConfigurations[0].measurementRangeEnd = convertHexToFloatIEEE754(measurementRangeString);
    output.data.deviceInformation.channelConfigurations[0].measurementRangeEnd = Number(output.data.deviceInformation.channelConfigurations[0].measurementRangeEnd.toFixed(6));

    output.data.deviceInformation.channelConfigurations[0].unit = input.bytes[15];
    output.data.deviceInformation.channelConfigurations[0].unitName = lppReturnUnitFromId(input.bytes[15]);


    // the next bytes could be optional, so check if they are there (temperature)
    if (input.bytes.length >= 25) {
        output.data.deviceInformation.channelConfigurations[1] = {};
        output.data.deviceInformation.channelConfigurations[1].measurand = input.bytes[16];
        output.data.deviceInformation.channelConfigurations[1].measurandName = lppReturnMeasurandFromId(input.bytes[16]);

        measurementRangeString = input.bytes[17].toString(16).padStart(2, "0") + input.bytes[18].toString(16).padStart(2, "0") + input.bytes[19].toString(16).padStart(2, "0") + input.bytes[20].toString(16).padStart(2, "0");
        output.data.deviceInformation.channelConfigurations[1].measurementRangeStart = convertHexToFloatIEEE754(measurementRangeString);
        output.data.deviceInformation.channelConfigurations[1].measurementRangeStart = Number(output.data.deviceInformation.channelConfigurations[1].measurementRangeStart.toFixed(6));

        measurementRangeString = input.bytes[21].toString(16).padStart(2, "0") + input.bytes[22].toString(16).padStart(2, "0") + input.bytes[23].toString(16).padStart(2, "0") + input.bytes[24].toString(16).padStart(2, "0")
        output.data.deviceInformation.channelConfigurations[1].measurementRangeEnd = convertHexToFloatIEEE754(measurementRangeString);
        output.data.deviceInformation.channelConfigurations[1].measurementRangeEnd = Number(output.data.deviceInformation.channelConfigurations[1].measurementRangeEnd.toFixed(6));

        output.data.deviceInformation.channelConfigurations[1].unit = input.bytes[25];
        output.data.deviceInformation.channelConfigurations[1].unitName = lppReturnUnitFromId(input.bytes[25]);
    }

    return output;
}

/**
 * Decodes a extended device identification message 09 into an object
 * @access private
 * @param {Object}              input           - An object provided by the IoT Flow framework
 * @param {number[]}            input.bytes     - Array of bytes represented as numbers as it has been sent from the device
 * @param {number}              input.fPort     - The Port Field on which the uplink has been sent
 * @param {Date}                input.recvTime  - The uplink message time recorded by the LoRaWAN network server
 * @returns {output}                     - The decoded object
 */
function decodeExtendedDeviceIdentification(input) {

    // Output
    var output = createOutputObject();

    // Data message type
    output.data.messageType = input.bytes[0];

    // Configuration id
    output.data.configurationId = input.bytes[1];

    output.data.extendedDeviceInformation = {};

    // Optional fields mask
    output.data.extendedDeviceInformation.optionalFieldsMask = input.bytes[2] & 0x0f;

    /* If optional field is there adjust position, if not skip it */
    var position = 3;

    /* Check if WIKA serial is present */
    if (input.bytes[2] & 0x01) {
        output.data.extendedDeviceInformation.wikaSensorSerialNumber = "";
        for (var i = position; i < (position + 12); i++) {
            if (input.bytes[i] == 0) {
                break;
            }

            output.data.extendedDeviceInformation.wikaSensorSerialNumber += String.fromCharCode(input.bytes[i]);
        }
        position += 12;
    }

    /* Check if Sensor LUID is present */
    if (input.bytes[2] & 0x02) {
        /* >>> converts from int to uint32 */
        output.data.extendedDeviceInformation.sensorLUID = (input.bytes[position] << 24 | input.bytes[position + 1] << 16 | input.bytes[position + 2] << 8 | input.bytes[position + 3]) >>> 0;
        position += 4;
    }

    /* Check if Sensor hardware revision is present */
    if (input.bytes[2] & 0x04) {
        /* >>> converts from int to uint32 */
        output.data.extendedDeviceInformation.sensorHardwareVersion = input.bytes[position].toString() + "." + input.bytes[position + 1].toString() + "." + input.bytes[position + 2].toString();
        position += 3;
    }

    // Device hardware version
    output.data.extendedDeviceInformation.deviceHardwareVersion = input.bytes[position].toString() + "." + input.bytes[position + 1].toString() + "." + input.bytes[position + 2].toString();
    position += 3;

    /* Check if Sensor firmware revision is present */
    if (input.bytes[2] & 0x08) {
        output.data.extendedDeviceInformation.sensorFirmwareVersion = input.bytes[position].toString() + "." + input.bytes[position + 1].toString() + "." + input.bytes[position + 2].toString();
        position += 3;
    }

    var digitSerialNumber = input.bytes[position] << 16 | input.bytes[position + 1] << 8 | input.bytes[position + 2] << 0;
    var letterSerialNumber = String.fromCharCode(input.bytes[position + 3]);
    output.data.extendedDeviceInformation.deviceSerialNumber = letterSerialNumber + "" + digitSerialNumber.toString().padStart(6, '0'); // 6-digit number, add leading zeros if needed
    position += 4;

    output.data.extendedDeviceInformation.deviceProductCode = String.fromCharCode(input.bytes[position], input.bytes[position + 1], input.bytes[position + 2], input.bytes[position + 3], input.bytes[position + 4], input.bytes[position + 5], input.bytes[position + 6]);
    position += 7;

    output.data.extendedDeviceInformation.deviceFirmwareVersion = input.bytes[position].toString() + "." + input.bytes[position + 1].toString() + "." + input.bytes[position + 2].toString();

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
    if (typeof PRESSURE_RANGE_START === 'undefined') {
        output = addErrorMessage(output, "The PRESSURE_RANGE_START was not set.");
    }

    if (typeof PRESSURE_RANGE_END === 'undefined') {
        output = addErrorMessage(output, "The PRESSURE_RANGE_END was not set.");
    }

    if (typeof DEVICE_TEMPERATURE_RANGE_START === 'undefined') {
        output = addErrorMessage(output, "The DEVICE_TEMPERATURE_RANGE_START was not set.");
    }

    if (typeof DEVICE_TEMPERATURE_RANGE_END === 'undefined') {
        output = addErrorMessage(output, "The DEVICE_TEMPERATURE_RANGE_END was not set.");
    }

    if (PRESSURE_RANGE_START >= PRESSURE_RANGE_END) {
        output = addErrorMessage(output, "The PRESSURE_RANGE_START must not be greater or equal to PRESSURE_RANGE_END, " + PRESSURE_RANGE_START + " >= " + PRESSURE_RANGE_END + ". ");
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
 * @param  {Number} pressureRangeStart   range start
 * @param  {Number} pressureRangeEnd     range end
 * @param  {Number} temperatureRangeStart   range start
 * @param  {Number} temperatureRangeEnd     range end
 */
function setMeasurementRanges(pressureRangeStart, pressureRangeEnd, temperatureRangeStart, temperatureRangeEnd) {
    PRESSURE_RANGE_START = pressureRangeStart;
    PRESSURE_RANGE_END = pressureRangeEnd;
    DEVICE_TEMPERATURE_RANGE_START = temperatureRangeStart;
    DEVICE_TEMPERATURE_RANGE_END = temperatureRangeEnd;
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
        measurement.value = getRealValueByChannelName(channelName, measurementValue);
        measurement.channelId = channelNumber;
        measurement.channelName = channelName
        output.data.measurement.channels.push(measurement);
    }

    return output;
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
 * Returns the real physical value of pressure based on measurement range
 * @param {Number} channelValue  
 * @access private
 */
function getCalculatedPressure(channelValue) {
    return getCalculatedValue(channelValue, PRESSURE_RANGE_START, PRESSURE_RANGE_END, GENERIC_DATA_CHANNEL_RANGE_START, GENERIC_DATA_CHANNEL_RANGE_END);
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
    if (channelName == CHANNEL_MEASURAND_CONFIGURATION_DEFAULT_ORDER[0])
    {
        return getCalculatedPressure(channelValue);
    }
    else if (channelName == CHANNEL_MEASURAND_CONFIGURATION_DEFAULT_ORDER[1])
    {
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
    if (channelNumber == 0) // pressure channel
    {
        if (alarmType == 3 || alarmType == 4) {
            return getSlopeValue(channelValue, PRESSURE_RANGE_START, PRESSURE_RANGE_END);
        }
        else {
            return getThresholdValue(channelValue, PRESSURE_RANGE_START, PRESSURE_RANGE_END);
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
 * Returns the real threshold value of pressure based on measurement range (measurend)
 * @param {Number} channelValue  
 * @param  {Number} measurementRangeStart   range start
 * @param  {Number} measurementRangeEnd     range end
 * @access private
 */
function getThresholdValue(channelValue, measurementRangeStart, measurementRangeEnd) {
    return getCalculatedValue(channelValue, measurementRangeStart, measurementRangeEnd, 2500, 12500);
}

/**
 * Returns the real physical value of pressure based on measurement range (measurend/minute)
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
        case 1:
            return "°C";
        case 2:
            return "°F";
        case 3:
            return "K";
        case 4:
            return "°R";
        case 7:
            return "bar";
        case 8:
            return "mbar";
        case 9:
            return "µbar";
        case 10:
            return "Pa";
        case 11:
            return "hPa";
        case 12:
            return "kPa";
        case 13:
            return "MPa";
        case 14:
            return "psi";
        case 15:
            return "lbf/ft²";
        case 16:
            return "kN/m²";
        case 17:
            return "N/cm²";
        case 18:
            return "atm";
        case 19:
            return "kg/cm²";
        case 20:
            return "kg/mm²";
        case 21:
            return "µmHg";
        case 22:
            return "mmHg";
        case 23:
            return "cmHg";
        case 24:
            return "inHg";
        case 25:
            return "mmH2O";
        case 26:
            return "mH2O";
        case 27:
            return "inH2O";
        case 28:
            return "ftH2O";
        case 45:
            return "N";
        case 46:
            return "daN";
        case 47:
            return "kN";
        case 48:
            return "MN";
        case 49:
            return "kp";
        case 50:
            return "lbf";
        case 51:
            return "ozf";
        case 52:
            return "dyn";
        case 55:
            return "kg";
        case 56:
            return "g";
        case 57:
            return "mg";
        case 58:
            return "lb";
        case 60:
            return "mm";
        case 61:
            return "cm";
        case 62:
            return "m";
        case 63:
            return "µm";
        case 64:
            return "ft";
        case 65:
            return "in";
        case 70:
            return "l";
        case 71:
            return "ml";
        case 72:
            return "m³";
        case 73:
            return "gal (UK)";
        case 74:
            return "gal (US)";
        case 75:
            return "ft³";
        case 76:
            return "in³";
        case 82:
            return "mΩ";
        case 83:
            return "Ω";
        case 84:
            return "[kΩ] kiloohm";
        case 86:
            return "μV";
        case 87:
            return "mV";
        case 88:
            return "V";
        case 90:
            return "mA";
        case 91:
            return "μA";
        case 93:
            return "[μF] microfarad";
        case 94:
            return "[nF] nanofarad";
        case 95:
            return "[pF] picofarad";
        case 97:
            return "[mH] millihenry";
        case 98:
            return "[μH] henry";
        case 100:
            return "[%] percent";
        case 101:
            return "[‰] per mille";
        case 102:
            return "[ppm]";
        case 105:
            return "[°] degree";
        case 106:
            return "[rad] radian";
        case 108:
            return "counts, counter value";
        case 110:
            return "[kg/m³]";
        case 111:
            return "[g/m³]";
        case 112:
            return "[mg/m³]";
        case 113:
            return "[μg/m³]";
        case 114:
            return "[kg/l]";
        case 115:
            return "[g/l]";
        case 116:
            return "[lb/ft³]";
        case 120:
            return "[l/min] litre per minute";
        case 121:
            return "[l/s] litre per second";
        case 122:
            return "[m³/h] cubic metre per hour (cbm/h)";
        case 123:
            return "[m³/s] cubic metre per second";
        case 124:
            return "[cfm] cubic feet per minute";
        case 140:
            return "[kg/s]";
        case 141:
            return "[kg/h]";
        case 160:
            return "[s]";
        case 161:
            return "[min]";
        case 162:
            return "[h] hour";
        case 163:
            return "[d] day";
        case 167:
            return "[Hz]";
        case 168:
            return "[kHz]";
        case 170:
            return "[m/s]";
        case 171:
            return "[cm/s]";
        case 172:
            return "[ft/min]";
        case 173:
            return "[ft/s]";
        case 180:
            return "[m/s²]";
        case 181:
            return "[ft/s²]";
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

