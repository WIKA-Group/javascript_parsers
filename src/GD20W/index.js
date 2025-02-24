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
 * JSON Object. It can only parse payload from GD-20-W devices.
 * This parser follows the specification LoRaWAN® Payload Codec API Specification TS013-1.0.0.
 *
 *
 * SPDX-FileCopyrightText: Copyright (C) 2024 WIKA Alexander Wiegand SE & Co. KG
 * SPDX-License-Identifier: MIT
 *
 * SPDX-FileName: index.js
 * SPDX-PackageVersion: 2.5.0
 *
 */
// ***********************************************************************************
// Public Decoding Section
// ***********************************************************************************
var CHANNEL0_RANGE_START = 4;
var CHANNEL0_RANGE_END = 20;
var CHANNEL1_RANGE_START = 4;
var CHANNEL1_RANGE_END = 20;
var CHANNEL2_RANGE_START = 4;
var CHANNEL2_RANGE_END = 20;
var CHANNEL3_RANGE_START = 4;
var CHANNEL3_RANGE_END = 20;
var CHANNEL4_RANGE_START = 4;
var CHANNEL4_RANGE_END = 20;
var CHANNEL5_RANGE_START = 4;
var CHANNEL5_RANGE_END = 20;
// ***********************************************************************************
// Public Decoding Section
// ***********************************************************************************
function decodeUplink(input) {
    return decode(input);
}
function decodeHexString(fPort, hexEncodedString) {
    // remove all spaces
    hexEncodedString = hexEncodedString.replace(/\s/g, '');
    var validResult = isValidHexString(hexEncodedString);
    if (!validResult.result) {
        return createErrorMessage([validResult.reason]);
    }
    var bytes = convertHexStringToBytes(hexEncodedString);
    // check if its OutputFailure
    if ('errors' in bytes) {
        return bytes;
    }
    return decode({ bytes: bytes, fPort: fPort, recvTime: new Date().toISOString() });
}
function decodeBase64String(fPort, base64EncodedString) {
    var bytes = convertBase64StringToBytes(base64EncodedString);
    return decode({ bytes: bytes, fPort: fPort, recvTime: new Date().toISOString() });
}
// ***********************************************************************************
// Private Decoding Section
// ***********************************************************************************
var DEVICE_NAME = 'GD-20-W';
var ALARM_EVENT_NAMES_DICTIONARY = ['triggered', 'disappeared'];
var PROCESS_ALARM_TYPE_NAMES_DICTIONARY = [
    'low threshold',
    'high threshold',
    'falling slope',
    'rising slope',
    'low threshold with delay',
    'high threshold with delay',
];
// no alarm is not here as it is note an alarm "cause"
// thus indices are shifted by "1" when reading from the dictionary
var SENSOR_TECHNICAL_ALARMS_DESCRIPTION_DICTIONARY = {
    0: 'modbus sensor communication error',
    1: 'internal pressure sensor signal above upper limit',
    3: 'internal temperature sensor signal below lower limit (< -40°C | -40°F)',
    4: 'internal temperature sensor signal above upper limit (> 80°C | 178°F)',
    5: 'communication error with internal pressure or temperature sensor',
    6: 'liquefaction of SF6 detected (internal sensor)',
    7: 'gas density above upper limit (based on the full scale of the density measuring range in bar abs. at 20°C | 68°F)',
    10: 'recurring modbus communication error',
};
var DEVICE_ALARMS_DICTIONARY = {
    0: 'low battery',
    2: 'duty cycle alarm',
    3: 'configuration error',
    8: 'device specific alarm',
    9: 'device specific alarm',
    10: 'device specific alarm',
    11: 'device specific alarm',
    12: 'device specific alarm',
    13: 'device specific alarm',
    14: 'device specific alarm',
    15: 'device specific alarm',
};
var CONFIGURATION_STATUS_NAMES_DICTIONARY = {
    0x02: 'configuration successful',
    0x03: 'configuration rejected',
    0x04: 'configuration discarded',
    0x06: 'command success',
    0x07: 'command failed',
};
var UNIT_DICTIONARY = {
    0x01: '°C', // degree Celsius
    0x02: '°F', // degree Fahrenheit
    0x03: 'K', // Kelvin
    0x07: 'bar', // Bar
    0x0a: 'Pa', // Pascal
    0x0c: 'kPa', // Kilopascal
    0x0d: 'MPa', // Megapascal
    0x0e: 'Psi', // Pound per square inch
    0x11: 'N/cm²', // Newton per square centimeter
    0x6e: 'kg/m³', // Kilogram per cubic metre
    0x73: 'g/l', // Gram per liter
};
var MEASURAND_DICTIONARY = {
    0x01: 'Temperature',
    0x03: 'Pressure gauge',
    0x04: 'Pressure absolute',
    0x17: 'Density',
    0x18: 'Density (gauge pressure at 20 °C)',
    0x19: 'Density (absolute pressure at 20 °C)',
};
function decode(input) {
    // Validate input
    var validationResult = validateInput(input);
    if ('errors' in validationResult) {
        return validationResult;
    }
    input = validationResult;
    var firstByte = input.bytes[0];
    switch (firstByte) {
        // Data message with no alarm ongoing
        case 0x01:
            return decodeDataMessage(input);
        // Data message with at least one alarm ongoing
        case 0x02:
            return decodeDataMessage(input);
        // Process alarm message
        case 0x03:
            return decodeProcessAlarmMessage(input);
        // Technical alarm message
        case 0x04:
            return decodeSensorTechnicalAlarmMessage(input);
        case 0x05:
            return decodeDeviceAlarmMessage(input);
        // Configuration status message
        case 0x06:
            return decodeConfigurationStatusMessage(input);
        // Radio unit identification message
        case 0x07:
            return decodeDeviceIdentificationMessage(input);
        // Keep alive message
        case 0x08:
            return decodeKeepAliveMessage(input);
        case 0x09:
            return decodedExtendedDeviceIdentificationMessage(input);
        // Unsupported message type
        default:
            return createErrorMessage(["Data message type ".concat(firstByte, " is not supported")]);
    }
}
/**
 * Validate the input object
 * @param input The input object to validate
 * @returns The validated input object or an error object
 */
function validateInput(input) {
    if (input === null || input === undefined) {
        return createErrorMessage(['Input is missing']);
    }
    if (typeof input !== 'object' || Array.isArray(input)) {
        return createErrorMessage(["'input' must be an object"]);
    }
    var castInput = input;
    if (!Array.isArray(castInput.bytes)) {
        return createErrorMessage(['input.bytes must be an array']);
    }
    if (!castInput.bytes.every(function (byte) { return isInteger(byte) && byte >= 0 && byte <= 255; })) {
        return createErrorMessage(["'input.bytes' must be an array of integers between 0 and 255"]);
    }
    if (typeof castInput.fPort !== 'number') {
        return createErrorMessage(["'input.fPort' must be a number"]);
    }
    // Left out for now as it is not used in the decoding
    /*
    if (typeof castInput.recvTime !== 'string') {
        return createErrorMessage(["'input.recvTime' must be an ISO 8601 datetime string"])
    } */
    return {
        bytes: castInput.bytes,
        fPort: castInput.fPort,
        recvTime: castInput.recvTime,
    };
}
function decodeDataMessage(input) {
    var minLengthForData = 2;
    if (input.bytes.length < minLengthForData) {
        return createErrorMessage(["Data message must contain at least ".concat(minLengthForData + 3, " bytes")]);
    }
    var invalidLength = (input.bytes.length - 2) % 3 !== 0;
    var warnings = [];
    if (invalidLength) {
        addWarningMessages(warnings, [
            "Data message contains an invalid number of bytes. Bytes must have a length of 2 + 3n (n = 1, 2, 3,...). Data might been decoded incorrectly. Contains ".concat(input.bytes.length, " bytes."),
        ]);
    }
    var messageType = input.bytes[0];
    var configurationId = input.bytes[1];
    var rawChannelData = input.bytes.slice(2);
    var splitChannelData = [];
    for (var i = 0; i < rawChannelData.length; i += 3) {
        if (i + 2 < rawChannelData.length) {
            splitChannelData.push(rawChannelData.slice(i, i + 3));
        }
    }
    var channelData = splitChannelData.map(function (channel) {
        return createChannelData(channel[0], (channel[1] << 8) | channel[2]);
    });
    var res = {
        data: {
            messageType: messageType,
            configurationId: configurationId,
            measurements: {
                channels: channelData,
            },
        },
    };
    if (warnings.length > 0) {
        res.warnings = warnings;
    }
    return res;
}
function decodeProcessAlarmMessage(input) {
    var minLengthBytes = 6;
    if (input.bytes.length < minLengthBytes) {
        return createErrorMessage([
            "Process alarm message must contain at least ".concat(minLengthBytes, " bytes. Contains ").concat(input.bytes.length, " bytes."),
        ]);
    }
    // bytes must have a length of 6, 10, 14, ... (4n + 6)
    if ((input.bytes.length - 2) % 4 !== 0) {
        return createErrorMessage(["Process alarm message must contain 4n + 6 bytes, contains ".concat(input.bytes.length, ".")]);
    }
    var messageType = input.bytes[0];
    var configurationId = input.bytes[1];
    // 3rd byte is reserved
    // get every alarm entry that is 4 bytes long but ignore the first 2 bytes
    var processAlarms = [];
    for (var i = 2; i < input.bytes.length; i += 4) {
        var sensor_or_channelId = input.bytes[i];
        var alarmType = input.bytes[i + 1];
        var alarmValue1 = input.bytes[i + 2];
        var alarmValue2 = input.bytes[i + 3];
        var processAlarmType = getProcessAlarmType(alarmType);
        if ('errors' in processAlarmType) {
            return processAlarmType;
        }
        var processAlarmRelatedValue = getProcessAlarmRelatedValue(alarmValue1, alarmValue2, sensor_or_channelId, processAlarmType.alarmType);
        processAlarms.push({
            channelId: sensor_or_channelId,
            alarmType: processAlarmType.alarmType,
            alarmTypeName: PROCESS_ALARM_TYPE_NAMES_DICTIONARY[processAlarmType.alarmType],
            event: processAlarmType.sense,
            eventName: ALARM_EVENT_NAMES_DICTIONARY[processAlarmType.sense],
            value: processAlarmRelatedValue,
        });
    }
    return {
        data: {
            messageType: messageType,
            configurationId: configurationId,
            processAlarms: processAlarms,
        },
    };
}
function decodeSensorTechnicalAlarmMessage(input) {
    var maxLengthBytes = 5;
    var warnings = [];
    if (input.bytes.length > maxLengthBytes) {
        addWarningMessages(warnings, [
            "Sensor technical alarm message contains more than ".concat(maxLengthBytes, " bytes. Data might have been decoded incorrectly. Contains ").concat(input.bytes.length, " bytes."),
        ]);
    }
    var messageType = input.bytes[0];
    var configurationId = input.bytes[1];
    var sensorId = input.bytes[2];
    var alarmBitMap = (input.bytes[3] << 8) | input.bytes[4];
    var validBits = [0, 1, 3, 4, 5, 6, 7, 10];
    var alarms = [];
    var invalidBitsSet = [];
    for (var bit = 0; bit < 16; bit++) {
        if ((alarmBitMap & (1 << bit)) !== 0) {
            if (validBits.includes(bit)) {
                alarms.push(bit);
            }
            else {
                invalidBitsSet.push(bit);
            }
        }
    }
    if (invalidBitsSet.length > 0) {
        addWarningMessages(warnings, [
            "Sensor technical alarm message contains invalid alarm bits: ".concat(invalidBitsSet.join(', '), ". Only bits 0, 1, 3, 4, 5, 6, 7, 10 are valid."),
        ]);
    }
    var res = {
        data: {
            messageType: messageType,
            configurationId: configurationId,
            sensorTechnicalAlarms: alarms.map(function (alarm) { return ({
                channelId: sensorId,
                alarmType: alarm,
                alarmDescription: SENSOR_TECHNICAL_ALARMS_DESCRIPTION_DICTIONARY[alarm],
            }); }),
        },
    };
    if (warnings.length > 0) {
        res.warnings = warnings;
    }
    return res;
}
function decodeDeviceAlarmMessage(input) {
    var maxLengthBytes = 4;
    if (input.bytes.length < maxLengthBytes) {
        return createErrorMessage([
            "Device alarm message must contain ".concat(maxLengthBytes, " bytes. Contains ").concat(input.bytes.length, " bytes."),
        ]);
    }
    var warnings = [];
    if (input.bytes.length > maxLengthBytes) {
        addWarningMessages(warnings, [
            "Device alarm message contains more than ".concat(maxLengthBytes, " bytes. Data might have been decoded incorrectly. Contains ").concat(input.bytes.length, " bytes."),
        ]);
    }
    var messageType = input.bytes[0];
    var configId = input.bytes[1];
    var alarmBitMap = (input.bytes[2] << 8) | input.bytes[3];
    var validBits = [0, 2, 3, 8, 9, 10, 11, 12, 13, 14, 15];
    var alarms = [];
    var invalidBitsSet = [];
    for (var bit = 0; bit < 16; bit++) {
        if ((alarmBitMap & (1 << bit)) !== 0) {
            if (validBits.includes(bit)) {
                alarms.push(bit);
            }
            else {
                invalidBitsSet.push(bit);
            }
        }
    }
    if (invalidBitsSet.length > 0) {
        addWarningMessages(warnings, [
            "Sensor technical alarm message contains invalid alarm bits: ".concat(invalidBitsSet.join(', '), ". Only bits 0, 2, 3, 8, 9, 10, 11, 12, 13, 14, 15 are valid."),
        ]);
    }
    var res = {
        data: {
            messageType: messageType,
            configurationId: configId,
            deviceAlarms: alarms.map(function (alarm) { return ({
                alarmType: alarm,
                alarmDescription: DEVICE_ALARMS_DICTIONARY[alarm],
            }); }),
        },
    };
    if (warnings.length > 0) {
        res.warnings = warnings;
    }
    return res;
}
function decodeConfigurationStatusMessage(input) {
    var warnings = [];
    var messageType = input.bytes[0];
    var transactionId = input.bytes[1];
    var validStatuses = Object.keys(CONFIGURATION_STATUS_NAMES_DICTIONARY).map(function (key) { return parseInt(key); });
    // status are only the last 4 bit but put them into the first 4 bit of a number
    var status = input.bytes[2] >> 4;
    if (!validStatuses.includes(status)) {
        return createErrorMessage(["Configuration status message contains an invalid status: ".concat(status)]);
    }
    var commandType = input.bytes[3];
    // check if commandType is valid (0x04 or >=0x40)
    if (commandType !== 0x04 && commandType < 0x40) {
        return createErrorMessage(["Configuration status message contains an invalid command type: ".concat(commandType)]);
    }
    var command = commandType === 0x04 ? 'mainConfig' : 'channelConfig';
    if (command === 'mainConfig') {
        var mainConfigLength = 17;
        if (input.bytes.length < mainConfigLength) {
            return createErrorMessage([
                "Configuration status message contains an invalid length for main configuration: ".concat(input.bytes.length),
            ]);
        }
        if (input.bytes.length > mainConfigLength) {
            addWarningMessages(warnings, [
                "Configuration status message for main configuration contains more than ".concat(mainConfigLength, " bytes. Data might have been decoded incorrectly. Contains ").concat(input.bytes.length, " bytes."),
            ]);
        }
    }
    if (command === 'channelConfig') {
        var channelConfigLength = 8;
        var channelConfigMaxLength = 16;
        if (input.bytes.length < channelConfigLength) {
            return createErrorMessage([
                "Configuration status message contains an invalid length for channel configuration: ".concat(input.bytes.length),
            ]);
        }
        if (input.bytes.length > channelConfigMaxLength) {
            addWarningMessages(warnings, [
                "Configuration status message for channel configuration contains more than ".concat(channelConfigMaxLength, " bytes. Data might have been decoded incorrectly. Contains ").concat(input.bytes.length, " bytes."),
            ]);
        }
    }
    var config = command === 'mainConfig' ? getMainConfigurationData(input) : getChannelConfigurationData(input);
    var configStatus = command === 'mainConfig'
        ? {
            status: status,
            statusDescription: CONFIGURATION_STATUS_NAMES_DICTIONARY[status],
            commandType: commandType,
            mainConfiguration: config.data,
        }
        : {
            status: status,
            statusDescription: CONFIGURATION_STATUS_NAMES_DICTIONARY[status],
            commandType: commandType,
            channelConfiguration: config.data,
        };
    var res = {
        data: {
            messageType: messageType,
            configurationId: transactionId,
            configurationStatus: configStatus,
        },
    };
    if (warnings.length > 0) {
        res.warnings = res.warnings ? res.warnings.concat(warnings) : warnings;
    }
    return res;
}
function decodeDeviceIdentificationMessage(input) {
    var minLength = 39;
    var warnings = [];
    if (input.bytes.length < minLength) {
        return createErrorMessage([
            "Device identification message must contain at least ".concat(minLength, " bytes. Contains ").concat(input.bytes.length, " bytes."),
        ]);
    }
    if (input.bytes.length > minLength) {
        addWarningMessages(warnings, [
            "Device identification message contains more than ".concat(minLength, " bytes. Data might been decoded incorrectly. Contains ").concat(input.bytes.length, " bytes."),
        ]);
    }
    var messageType = input.bytes[0];
    var configurationId = input.bytes[1];
    var productId = input.bytes[2];
    if (productId !== 0x15) {
        return createErrorMessage([
            "Device identification message contains an invalid product ID: ".concat(productId, ", expected 0x15 (21)."),
        ]);
    }
    var productSubId = input.bytes[3];
    if (productSubId !== 0x40) {
        return createErrorMessage([
            "Device identification message contains an invalid product sub ID: ".concat(productSubId, ", expected 0x00 (0)."),
        ]);
    }
    // get the semver version. major,minor are from same byte each 4 bit but patch is full next byte
    var wirelessModuleFirmwareVersion = "".concat(input.bytes[4] >> 4, ".").concat(input.bytes[4] & 0x0f, ".").concat(input.bytes[5]);
    var wirelessModuleHardwareVersion = "".concat(input.bytes[6] >> 4, ".").concat(input.bytes[6] & 0x0f, ".").concat(input.bytes[7]);
    var checkSemVerErrors = checkSemVerVersions([wirelessModuleFirmwareVersion, wirelessModuleHardwareVersion]);
    if (checkSemVerErrors) {
        addWarningMessages(warnings, checkSemVerErrors);
    }
    var SF6 = input.bytes[31];
    var N2 = input.bytes[32];
    var CF4 = input.bytes[33];
    var O2 = input.bytes[34];
    var C02 = input.bytes[35];
    var Novec4710 = input.bytes[36];
    var He = input.bytes[37];
    var Ar = input.bytes[38];
    var serialNumberASCII = input.bytes
        // ! here not take the byte 24 as it is 0x00
        .slice(8, 18)
        .map(function (byte) { return String.fromCharCode(byte); })
        .join('');
    var res = {
        data: {
            messageType: messageType,
            configurationId: configurationId,
            deviceIdentification: {
                productId: productId,
                productSubId: productSubId,
                wirelessModuleFirmwareVersion: wirelessModuleFirmwareVersion,
                wirelessModuleHardwareVersion: wirelessModuleHardwareVersion,
                serialNumber: serialNumberASCII,
                channels: {
                    channel0: {
                        measurand: MEASURAND_DICTIONARY[input.bytes[19]],
                        unit: UNIT_DICTIONARY[input.bytes[20]],
                    },
                    channel1: {
                        measurand: MEASURAND_DICTIONARY[input.bytes[21]],
                        unit: UNIT_DICTIONARY[input.bytes[22]],
                    },
                    channel2: {
                        measurand: MEASURAND_DICTIONARY[input.bytes[23]],
                        unit: UNIT_DICTIONARY[input.bytes[24]],
                    },
                    channel3: {
                        measurand: MEASURAND_DICTIONARY[input.bytes[25]],
                        unit: UNIT_DICTIONARY[input.bytes[26]],
                    },
                    channel4: {
                        measurand: MEASURAND_DICTIONARY[input.bytes[27]],
                        unit: UNIT_DICTIONARY[input.bytes[28]],
                    },
                    channel5: {
                        measurand: MEASURAND_DICTIONARY[input.bytes[29]],
                        unit: UNIT_DICTIONARY[input.bytes[30]],
                    },
                },
                gasMixtures: {
                    Ar: Ar,
                    CF4: CF4,
                    He: He,
                    N2: N2,
                    Novec4710: Novec4710,
                    O2: O2,
                    SF6: SF6,
                    C02: C02,
                },
            },
        },
    };
    if (warnings.length > 0) {
        res.warnings = warnings;
    }
    return res;
}
function decodeKeepAliveMessage(input) {
    var minLength = 3;
    var warnings = [];
    if (input.bytes.length < minLength) {
        return createErrorMessage([
            "Keep alive message must contain at least ".concat(minLength, " bytes. Contains ").concat(input.bytes.length, " bytes."),
        ]);
    }
    if (input.bytes.length > minLength) {
        addWarningMessages(warnings, [
            "Keep alive message contains more than ".concat(minLength, " bytes. Data might been decoded incorrectly. Contains ").concat(input.bytes.length, " bytes."),
        ]);
    }
    var messageType = input.bytes[0];
    var configurationId = input.bytes[1];
    var indicatorByte = input.bytes[2];
    var newBatteryEvent = (indicatorByte & 128) === 0x80;
    var batteryError = (indicatorByte & 127) === 0x7f;
    var batteryPresent = (indicatorByte & 255) !== 0x00;
    var batteryEstimation = indicatorByte & 127;
    // TODO: doc seems to be wrong here for number of transmissions and measurements
    var res = {
        data: {
            messageType: messageType,
            configurationId: configurationId,
            batteryLevelIndicator: {
                batteryLevelPercent: batteryEstimation,
                batteryLevelCalculationError: batteryError,
                batteryPresent: batteryPresent,
                restartedSinceLastKeepAlive: newBatteryEvent,
            },
        },
    };
    if (warnings.length > 0) {
        res.warnings = warnings;
    }
    return res;
}
function decodedExtendedDeviceIdentificationMessage(input) {
    var minLength = 50;
    var warnings = [];
    if (input.bytes.length < minLength) {
        return createErrorMessage([
            "Extended device identification message must contain at least ".concat(minLength, " bytes. Contains ").concat(input.bytes.length, " bytes."),
        ]);
    }
    if (input.bytes.length > minLength) {
        addWarningMessages(warnings, [
            "Extended device identification message contains more than ".concat(minLength, " bytes. Data might been decoded incorrectly. Contains ").concat(input.bytes.length, " bytes."),
        ]);
    }
    var messageType = input.bytes[0];
    var configurationId = input.bytes[1];
    var channel0MinRange = getFloat32FromBytes(input.bytes, 2);
    var channel0MaxRange = getFloat32FromBytes(input.bytes, 6);
    var channel1MinRange = getFloat32FromBytes(input.bytes, 10);
    var channel1MaxRange = getFloat32FromBytes(input.bytes, 14);
    var channel2MinRange = getFloat32FromBytes(input.bytes, 18);
    var channel2MaxRange = getFloat32FromBytes(input.bytes, 22);
    var channel3MinRange = getFloat32FromBytes(input.bytes, 26);
    var channel3MaxRange = getFloat32FromBytes(input.bytes, 30);
    var channel4MinRange = getFloat32FromBytes(input.bytes, 34);
    var channel4MaxRange = getFloat32FromBytes(input.bytes, 38);
    var channel5MinRange = getFloat32FromBytes(input.bytes, 42);
    var channel5MaxRange = getFloat32FromBytes(input.bytes, 46);
    var res = {
        data: {
            messageType: messageType,
            configurationId: configurationId,
            channelRanges: {
                channel0: {
                    min: channel0MinRange,
                    max: channel0MaxRange,
                },
                channel1: {
                    min: channel1MinRange,
                    max: channel1MaxRange,
                },
                channel2: {
                    min: channel2MinRange,
                    max: channel2MaxRange,
                },
                channel3: {
                    min: channel3MinRange,
                    max: channel3MaxRange,
                },
                channel4: {
                    min: channel4MinRange,
                    max: channel4MaxRange,
                },
                channel5: {
                    min: channel5MinRange,
                    max: channel5MaxRange,
                },
            },
        },
    };
    if (warnings.length > 0) {
        res.warnings = warnings;
    }
    return res;
}
// #############################UTILS#######################################
function checkSemVerVersions(semVers) {
    var warnings = [];
    for (var _i = 0, semVers_1 = semVers; _i < semVers_1.length; _i++) {
        var semVer = semVers_1[_i];
        var parts = semVer.split('.');
        if (parts.length !== 3) {
            throw new Error("Invalid semantic version format: ".concat(semVer));
        }
        var majorStr = parts[0], minorStr = parts[1], patchStr = parts[2];
        var major = parseInt(majorStr);
        var minor = parseInt(minorStr);
        var patch = parseInt(patchStr);
        // Check if the parsed int, when converted back to a string, matches the original string
        // This ensures the part was a valid integer
        if (major.toString() !== majorStr || minor.toString() !== minorStr || patch.toString() !== patchStr) {
            throw new Error("Semantic version contains non-integer value: ".concat(semVer));
        }
        if (major < 0 || major > 16) {
            warnings.push("Major version ".concat(major, " is out of range for semver ").concat(semVer));
        }
        if (minor < 0 || minor > 16) {
            warnings.push("Minor version ".concat(minor, " is out of range for semver ").concat(semVer));
        }
        if (patch < 0 || patch > 255) {
            warnings.push("Patch version ".concat(patch, " is out of range for semver ").concat(semVer));
        }
    }
    return warnings.length > 0 ? warnings : null;
}
function getProcessAlarmType(byte) {
    var alarmType = {
        // sense is bit 7
        sense: ((byte & 128) >> 7),
        // alarmType is bit 2 to 0
        alarmType: (byte & 7),
    };
    if (![0, 1, 2, 3, 4, 5].includes(alarmType.alarmType)) {
        return createErrorMessage(["Invalid alarmType in process alarm: ".concat(alarmType.alarmType)]);
    }
    return alarmType;
}
function getProcessAlarmRelatedValue(byte1, byte2, channelId, alarmType) {
    var value = (byte1 << 8) | byte2;
    switch (alarmType) {
        case 2:
        case 3:
            return getRealSlopeValue(value, channelId);
        case 0:
        case 1:
        case 4:
        case 5:
            return getRealMeasurementValue(value, channelId);
    }
}
function isValidHexString(hexEncodedString) {
    if (hexEncodedString.startsWith('0x')) {
        hexEncodedString = hexEncodedString.slice(2);
    }
    if (hexEncodedString.length % 2 !== 0) {
        return {
            result: false,
            reason: 'Hex string length must be even.',
        };
    }
    for (var i = 0; i < hexEncodedString.length; i++) {
        if (!isValidHexCharacter(hexEncodedString[i])) {
            return {
                result: false,
                reason: "Invalid hex character found: '".concat(hexEncodedString[i], "' at position ").concat(i, "."),
            };
        }
    }
    return {
        result: true,
    };
}
function isValidHexCharacter(char) {
    if (char.length !== 1) {
        return false;
    }
    return '0123456789abcdefABCDEF'.includes(char);
}
function createErrorMessage(newErrors) {
    return {
        errors: newErrors.map(function (error) { return "".concat(DEVICE_NAME, " (JS): ").concat(error); }),
    };
}
function addWarningMessages(existingWarnings, newWarnings) {
    newWarnings.forEach(function (warning) {
        existingWarnings.push(DEVICE_NAME + ' (JS): ' + warning);
    });
}
function createChannelData(channelId, value) {
    return {
        channelId: channelId,
        value: getRealMeasurementValue(value, channelId),
    };
}
function getMeasurementRanges(channelId) {
    switch (channelId) {
        case 0:
            return { start: CHANNEL0_RANGE_START, end: CHANNEL0_RANGE_END };
        case 1:
            return { start: CHANNEL1_RANGE_START, end: CHANNEL1_RANGE_END };
        case 2:
            return { start: CHANNEL2_RANGE_START, end: CHANNEL2_RANGE_END };
        case 3:
            return { start: CHANNEL3_RANGE_START, end: CHANNEL3_RANGE_END };
        case 4:
            return { start: CHANNEL4_RANGE_START, end: CHANNEL4_RANGE_END };
        case 5:
            return { start: CHANNEL5_RANGE_START, end: CHANNEL5_RANGE_END };
    }
}
function getRealMeasurementValue(value, channelId) {
    var _a = getMeasurementRanges(channelId), start = _a.start, end = _a.end;
    var span = end - start;
    var realVal = ((value - 2500) / 10000) * span + start;
    var roundedVal = Math.round(realVal * 1000) / 1000;
    return roundedVal;
}
function getRealSlopeValue(value, channelId) {
    var _a = getMeasurementRanges(channelId), start = _a.start, end = _a.end;
    var span = end - start;
    var realVal = (value / 10000) * span;
    var roundedVal = Math.round(realVal * 1000) / 1000;
    return roundedVal;
}
function getMainConfigurationData(input) {
    var warnings = [];
    // byte 4-7
    var acquisitionTimeAlarmsOffValue = (input.bytes[4] << 24) | (input.bytes[5] << 16) | (input.bytes[6] << 8) | input.bytes[7];
    // byte 8-9
    var publicationTimeFactorAlarmsOffValue = (input.bytes[8] << 8) | input.bytes[9];
    // byte 10-13
    var acquisitionTimeAlarmsOnValue = (input.bytes[10] << 24) | (input.bytes[11] << 16) | (input.bytes[12] << 8) | input.bytes[13];
    // byte 14-15
    var publicationTimeFactorAlarmsOnValue = (input.bytes[14] << 8) | input.bytes[15];
    // byte 16 unused
    if (acquisitionTimeAlarmsOffValue !== 0 &&
        acquisitionTimeAlarmsOffValue % publicationTimeFactorAlarmsOffValue !== 0) {
        addWarningMessages(warnings, [
            'Acquisition time alarms off must be a multiple of publication time factor alarms off',
        ]);
    }
    if (acquisitionTimeAlarmsOnValue !== 0 && acquisitionTimeAlarmsOnValue % publicationTimeFactorAlarmsOnValue !== 0) {
        addWarningMessages(warnings, [
            'Acquisition time alarms on must be a multiple of publication time factor alarms on',
        ]);
    }
    var res = {
        data: {
            acquisitionTimeAlarmsOff: acquisitionTimeAlarmsOffValue === 0 ? 'unauthorized' : acquisitionTimeAlarmsOffValue,
            publicationTimeFactorAlarmsOff: publicationTimeFactorAlarmsOffValue === 0 ? 'unauthorized' : publicationTimeFactorAlarmsOffValue,
            acquisitionTimeAlarmsOn: acquisitionTimeAlarmsOnValue === 0 ? 'unauthorized' : acquisitionTimeAlarmsOnValue,
            publicationTimeFactorAlarmsOn: publicationTimeFactorAlarmsOnValue === 0 ? 'unauthorized' : publicationTimeFactorAlarmsOnValue,
        },
    };
    if (warnings.length > 0) {
        res.warnings = warnings;
    }
    return res;
}
function getChannelConfigurationData(input) {
    var warnings = [];
    // byte 4
    var sensorOrChannelId = input.bytes[4];
    // valid ids here are 0 - 5
    if (![0, 1, 2, 3, 4, 5].includes(sensorOrChannelId)) {
        addWarningMessages(warnings, ['Invalid sensor or channel id']);
    }
    // byte 5-6
    var deadBandValue = (input.bytes[5] << 8) | input.bytes[6];
    // byte 7 is alarmBitMap
    var alarmBitMap = input.bytes[7];
    // if bit 0 or 1 is set add warning as those are reserved
    if (alarmBitMap & 3) {
        addWarningMessages(warnings, ['Reserved alarm flags 0 and/or 1 are set']);
    }
    var alarms = {
        isAlarm1Enabled: !!(alarmBitMap & 128),
        isAlarm2Enabled: !!(alarmBitMap & 64),
        isAlarm3Enabled: !!(alarmBitMap & 32),
        isAlarm4Enabled: !!(alarmBitMap & 16),
        isAlarm5Enabled: !!(alarmBitMap & 8),
        isAlarm6Enabled: !!(alarmBitMap & 4),
    };
    // the values are now in the 8th bit onward but only for the enabled alarms (e.g. 3 2-byte pairs for alarm1, alarm3, and alarm4)
    var alarmValues = [];
    for (var i = 8; i < input.bytes.length; i += 2) {
        alarmValues.push((input.bytes[i] << 8) | input.bytes[i + 1]);
    }
    var data = {
        sensorOrChannelId: sensorOrChannelId,
        deadBand: deadBandValue,
    };
    var alarmIndex = 0;
    if (alarms.isAlarm1Enabled) {
        data.alarm1Threshold = alarmValues[alarmIndex++];
    }
    if (alarms.isAlarm2Enabled) {
        data.alarm2Threshold = alarmValues[alarmIndex++];
    }
    if (alarms.isAlarm3Enabled) {
        data.alarm3Slope = alarmValues[alarmIndex++];
    }
    if (alarms.isAlarm4Enabled) {
        data.alarm4Slope = alarmValues[alarmIndex++];
    }
    if (alarms.isAlarm5Enabled) {
        data.alarm5Threshold = alarmValues[alarmIndex++];
        data.alarm5Period = alarmValues[alarmIndex++];
    }
    if (alarms.isAlarm6Enabled) {
        data.alarm6Threshold = alarmValues[alarmIndex++];
        data.alarm6Period = alarmValues[alarmIndex++];
    }
    var result = {
        data: data,
    };
    if (warnings.length > 0) {
        result.warnings = warnings;
    }
    return result;
}
function convertHexStringToBytes(hexEncodedString) {
    if (hexEncodedString.startsWith('0x')) {
        hexEncodedString = hexEncodedString.slice(2);
    }
    // Remove spaces
    hexEncodedString = hexEncodedString.replace(' ', '');
    var bytes = [];
    for (var i = 0; i < hexEncodedString.length; i += 2) {
        var char1 = hexEncodedString[i];
        var char2 = hexEncodedString[i + 1];
        if (!isValidHexCharacter(char1) || !isValidHexCharacter(char2)) {
            return createErrorMessage(["Invalid hex character: ".concat(char1).concat(char2, " at position ").concat(i).concat(i + 1)]);
        }
        var byte = parseInt(char1 + char2, 16);
        bytes.push(byte);
    }
    return bytes;
}
function convertBase64StringToBytes(base64EncodedString) {
    var decodedBytes = Buffer.from(base64EncodedString, 'base64');
    var bytes = [];
    decodedBytes.forEach(function (byte) { return bytes.push(byte); });
    return bytes;
}
function getFloat32FromBytes(bytes, startIndex) {
    var b0 = bytes[startIndex];
    var b1 = bytes[startIndex + 1];
    var b2 = bytes[startIndex + 2];
    var b3 = bytes[startIndex + 3];
    var sign = b0 & 0x80 ? -1 : 1;
    var exponent = ((b0 & 0x7f) << 1) | (b1 >> 7);
    var mantissa = ((b1 & 0x7f) << 16) | (b2 << 8) | b3;
    if (exponent === 0) {
        return sign * mantissa * Math.pow(2, -126 - 23);
    }
    else if (exponent === 0xff) {
        return mantissa ? NaN : sign * Infinity;
    }
    else {
        return sign * (1 + mantissa * Math.pow(2, -23)) * Math.pow(2, exponent - 127);
    }
}
function isInteger(value) {
    return typeof value === 'number' && value === Math.floor(value);
}
function setMeasurementRanges(ranges) {
    if (ranges.length > 0) {
        CHANNEL0_RANGE_START = ranges[0].start;
        CHANNEL0_RANGE_END = ranges[0].end;
    }
    if (ranges.length > 1) {
        CHANNEL1_RANGE_START = ranges[1].start;
        CHANNEL1_RANGE_END = ranges[1].end;
    }
    if (ranges.length > 2) {
        CHANNEL2_RANGE_START = ranges[2].start;
        CHANNEL2_RANGE_END = ranges[2].end;
    }
    if (ranges.length > 3) {
        CHANNEL3_RANGE_START = ranges[3].start;
        CHANNEL3_RANGE_END = ranges[3].end;
    }
    if (ranges.length > 4) {
        CHANNEL4_RANGE_START = ranges[4].start;
        CHANNEL4_RANGE_END = ranges[4].end;
    }
    if (ranges.length > 5) {
        CHANNEL5_RANGE_START = ranges[5].start;
        CHANNEL5_RANGE_END = ranges[5].end;
    }
}
// ***********************************************************************************
//          Export functions Section
// ***********************************************************************************
if (typeof exports !== 'undefined') {
    exports.decodeUplink = decodeUplink;
    exports.decodeHexString = decodeHexString;
    exports.decodeBase64String = decodeBase64String;
    // for testing
    exports.setMeasurementRanges = setMeasurementRanges;
}
