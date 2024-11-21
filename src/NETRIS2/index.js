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
 * JSON Object. It can only parse payload from NETRIS2 devices.
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
 * ! These ranges are always 4 ma - 20 ma according to the NETRIS2 device specification. Changing these values will result in incorrect decoding.
 */
var CHANNEL1_RANGE_START = 4;
var CHANNEL1_RANGE_END = 20;
var CHANNEL2_RANGE_START = 4;
var CHANNEL2_RANGE_END = 20;
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
var DEVICE_NAME = 'NETRIS2';
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
// thus indices are shifted by "-1" when reading from the dictionary
var TECHNICAL_ALARM_CAUSE_OF_FAILURE_NAMES_DICTIONARY = [
    'no alarm',
    'open condition',
    'short condition',
    'saturated low',
    'saturated high',
    'ADC communication error',
];
var CONFIGURATION_STATUS_NAMES_DICTIONARY = {
    0x20: 'configuration successful',
    0x30: 'configuration rejected',
    0x60: 'command successful',
    0x70: 'command failed',
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
            return decodeTechnicalAlarmMessage(input);
        // Configuration status message
        case 0x06:
            return decodeConfigurationStatusMessage(input);
        // Radio unit identification message
        case 0x07:
            return decodeRadioUnitIdentificationMessage(input);
        // Keep alive message
        case 0x08:
            return decodeKeepAliveMessage(input);
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
    if (typeof input !== 'object') {
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
    var minLengthForData = 5;
    var maxLengthForData = 7;
    var warnings = [];
    var _a = [
        input.bytes.length >= minLengthForData,
        input.bytes.length >= maxLengthForData,
        input.bytes.length > maxLengthForData,
    ], hasChannel1 = _a[0], hasChannel2 = _a[1], overflows = _a[2];
    if (!hasChannel1) {
        return createErrorMessage([
            "Data message".concat(input.bytes[0] ? ' ' + input.bytes[0] : '', " must contain at least ").concat(minLengthForData, " bytes. Contains ").concat(input.bytes.length, " bytes."),
        ]);
    }
    if (!hasChannel2) {
        // valid that no channel 2 is present
        /* addWarningMessages(warnings, [
            `Data message must contain ${maxLengthForData} bytes to channel 2. Contains ${input.bytes.length} bytes.`,
        ]) */
    }
    if (overflows) {
        addWarningMessages(warnings, [
            "Data message contains more than ".concat(maxLengthForData, " bytes. Data might been decoded incorrectly. Contains ").concat(input.bytes.length, " bytes."),
        ]);
    }
    var messageType = input.bytes[0];
    var configurationId = input.bytes[1];
    var channelMask = input.bytes[2];
    var isChannelMaskValid = [0x00, 0x01, 0x02, 0x03].includes(channelMask);
    var _b = [channelMask & 0x01, channelMask & 0x02], channel1Valid = _b[0], channel2Valid = _b[1];
    if (!isChannelMaskValid) {
        return createErrorMessage([
            "Data message contains an invalid channel mask: ".concat(channelMask, ", expected 0x00, 0x01, 0x02 or 0x03"),
        ]);
    }
    var channelData = [];
    if (hasChannel1 && channel1Valid) {
        var measurementValue = (input.bytes[3] << 8) | input.bytes[4];
        channelData.push(createChannelData(0, measurementValue));
    }
    if (hasChannel2 && channel2Valid) {
        var measurementValue = (input.bytes[5] << 8) | input.bytes[6];
        channelData.push(createChannelData(1, measurementValue));
    }
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
    // bytes must have a length of 6, 9, 12, ... (3n + 6)
    if (input.bytes.length % 3 !== 0) {
        return createErrorMessage(["Process alarm message must contain a multiple of 3 bytes."]);
    }
    var messageType = input.bytes[0];
    var configurationId = input.bytes[1];
    // 3rd byte is reserved
    // get every alarm entry that is 3 bytes long but ignore the first 3 bytes
    var processAlarms = [];
    for (var i = 3; i < input.bytes.length; i += 3) {
        var alarmTypeByte = input.bytes[i];
        var processAlarmType = getProcessAlarmType(alarmTypeByte);
        if ('errors' in processAlarmType) {
            return processAlarmType;
        }
        var processAlarmRelatedValue = getProcessAlarmRelatedValue(input.bytes[i + 1], input.bytes[i + 2], processAlarmType.channelId, processAlarmType.alarmType);
        processAlarms.push({
            channelId: processAlarmType.channelId,
            channelName: "Electrical current",
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
function decodeTechnicalAlarmMessage(input) {
    var minLengthBytes = 4;
    var maxLengthBytes = 5;
    var warnings = [];
    if (input.bytes.length < minLengthBytes) {
        return createErrorMessage(["Technical alarm message must contain at least ".concat(minLengthBytes, " bytes")]);
    }
    if (input.bytes.length > maxLengthBytes) {
        addWarningMessages(warnings, [
            "Technical alarm message contains more than ".concat(maxLengthBytes, " bytes. Data might been decoded incorrectly. Contains ").concat(input.bytes.length, " bytes."),
        ]);
    }
    var messageType = input.bytes[0];
    var configurationId = input.bytes[1];
    var bitMask = input.bytes[2];
    if (![0x01, 0x02, 0x03].includes(bitMask)) {
        return createErrorMessage([
            "Technical alarm message contains an invalid bit mask: ".concat(bitMask, ", expected 0x01, 0x02 or 0x03"),
        ]);
    }
    var requiredBitMaskLength = bitMask === 0x03 ? 5 : 4;
    if (input.bytes.length < requiredBitMaskLength) {
        return createErrorMessage([
            "Technical alarm message with bit mask ".concat(bitMask, " must contain atleast ").concat(requiredBitMaskLength, " bytes. Contains ").concat(input.bytes.length, " bytes."),
        ]);
    }
    if (input.bytes.length > requiredBitMaskLength) {
        addWarningMessages(warnings, [
            "Technical alarm message with bit mask ".concat(bitMask, " contains more than ").concat(requiredBitMaskLength, " bytes. Data might been decoded incorrectly. Contains ").concat(input.bytes.length, " bytes."),
        ]);
    }
    var technicalAlarms = [];
    switch (bitMask) {
        case 0x01: {
            var technicalAlarm = getTechnicalAlarmCauseOfFailure(input.bytes[3]);
            if ('errors' in technicalAlarm) {
                return technicalAlarm;
            }
            technicalAlarms.push({
                channelId: 0,
                channelName: "Electrical current",
                event: technicalAlarm.sense,
                eventName: ALARM_EVENT_NAMES_DICTIONARY[technicalAlarm.sense],
                causeOfFailure: technicalAlarm.causeOfFailure,
                causeOfFailureName: TECHNICAL_ALARM_CAUSE_OF_FAILURE_NAMES_DICTIONARY[technicalAlarm.causeOfFailure],
            });
            break;
        }
        case 0x02: {
            var technicalAlarm = getTechnicalAlarmCauseOfFailure(input.bytes[3]);
            if ('errors' in technicalAlarm) {
                return technicalAlarm;
            }
            technicalAlarms.push({
                channelId: 1,
                channelName: "Electrical current",
                event: technicalAlarm.sense,
                eventName: ALARM_EVENT_NAMES_DICTIONARY[technicalAlarm.sense],
                causeOfFailure: technicalAlarm.causeOfFailure,
                causeOfFailureName: TECHNICAL_ALARM_CAUSE_OF_FAILURE_NAMES_DICTIONARY[technicalAlarm.causeOfFailure],
            });
            break;
        }
        case 0x03: {
            var technicalAlarm1 = getTechnicalAlarmCauseOfFailure(input.bytes[3]);
            if ('errors' in technicalAlarm1) {
                return technicalAlarm1;
            }
            var technicalAlarm2 = getTechnicalAlarmCauseOfFailure(input.bytes[4]);
            if ('errors' in technicalAlarm2) {
                return technicalAlarm2;
            }
            technicalAlarms.push({
                channelId: 0,
                channelName: "Electrical current",
                event: technicalAlarm1.sense,
                eventName: ALARM_EVENT_NAMES_DICTIONARY[technicalAlarm1.sense],
                causeOfFailure: technicalAlarm1.causeOfFailure,
                causeOfFailureName: TECHNICAL_ALARM_CAUSE_OF_FAILURE_NAMES_DICTIONARY[technicalAlarm1.causeOfFailure],
            }, {
                channelId: 1,
                channelName: "Electrical current",
                event: technicalAlarm2.sense,
                eventName: ALARM_EVENT_NAMES_DICTIONARY[technicalAlarm2.sense],
                causeOfFailure: technicalAlarm2.causeOfFailure,
                causeOfFailureName: TECHNICAL_ALARM_CAUSE_OF_FAILURE_NAMES_DICTIONARY[technicalAlarm2.causeOfFailure],
            });
            break;
        }
    }
    var res = {
        data: {
            messageType: messageType,
            configurationId: configurationId,
            technicalAlarms: technicalAlarms,
        },
    };
    if (warnings.length > 0) {
        res.warnings = warnings;
    }
    return res;
}
function decodeConfigurationStatusMessage(input) {
    var minLength = 3;
    var validStatuses = [0x20, 0x30, 0x60, 0x70];
    var warnings = [];
    if (input.bytes.length < minLength) {
        return createErrorMessage([
            "Configuration status message must contain at least ".concat(minLength, " bytes. Contains ").concat(input.bytes.length, " bytes."),
        ]);
    }
    if (input.bytes.length > minLength) {
        addWarningMessages(warnings, [
            "Configuration status message contains more than ".concat(minLength, " bytes. Data might been decoded incorrectly. Contains ").concat(input.bytes.length, " bytes."),
        ]);
    }
    var messageType = input.bytes[0];
    var transactionId = input.bytes[1];
    var status = input.bytes[2];
    if (!validStatuses.includes(status)) {
        return createErrorMessage(["Configuration status message contains an invalid status: ".concat(status)]);
    }
    var res = {
        data: {
            messageType: messageType,
            configurationStatus: {
                transactionId: transactionId,
                statusId: status,
                status: CONFIGURATION_STATUS_NAMES_DICTIONARY[status],
            },
        },
    };
    if (warnings.length > 0) {
        res.warnings = warnings;
    }
    return res;
}
function decodeRadioUnitIdentificationMessage(input) {
    var minLength = 24;
    var warnings = [];
    if (input.bytes.length < minLength) {
        return createErrorMessage([
            "Radio unit identification message must contain at least ".concat(minLength, " bytes. Contains ").concat(input.bytes.length, " bytes."),
        ]);
    }
    if (input.bytes.length > minLength) {
        addWarningMessages(warnings, [
            "Radio unit identification message contains more than ".concat(minLength, " bytes. Data might been decoded incorrectly. Contains ").concat(input.bytes.length, " bytes."),
        ]);
    }
    var messageType = input.bytes[0];
    var configurationId = input.bytes[1];
    var productId = input.bytes[2];
    if (productId !== 0x0e) {
        return createErrorMessage([
            "Radio unit identification message contains an invalid product ID: ".concat(productId, ", expected 0x0e (14)."),
        ]);
    }
    var productSubId = input.bytes[3];
    if (productSubId !== 0x00) {
        return createErrorMessage([
            "Radio unit identification message contains an invalid product sub ID: ".concat(productSubId, ", expected 0x00 (0)."),
        ]);
    }
    // get the semver version. major,minor are from same byte each 4 bit but patch is full next byte
    var radioUnitModemFirmwareVersion = "".concat(input.bytes[4] >> 4, ".").concat(input.bytes[4] & 0x0f, ".").concat(input.bytes[5]);
    var radioUnitModemHardwareVersion = "".concat(input.bytes[6] >> 4, ".").concat(input.bytes[6] & 0x0f, ".").concat(input.bytes[7]);
    var radioUnitFirmwareVersion = "".concat(input.bytes[8] >> 4, ".").concat(input.bytes[8] & 0x0f, ".").concat(input.bytes[9]);
    var radioUnitHardwareVersion = "".concat(input.bytes[10] >> 4, ".").concat(input.bytes[10] & 0x0f, ".").concat(input.bytes[11]);
    var checkSemVerVersionsErrors = checkSemVerVersions([
        radioUnitModemFirmwareVersion,
        radioUnitModemHardwareVersion,
        radioUnitFirmwareVersion,
        radioUnitHardwareVersion,
    ]);
    if (checkSemVerVersionsErrors) {
        addWarningMessages(warnings, checkSemVerVersionsErrors);
    }
    var serialNumberASCII = input.bytes
        // ! here not take the byte 24 as it is 0x00
        .slice(12, 23)
        .map(function (byte) { return String.fromCharCode(byte); })
        .join('');
    var res = {
        data: {
            messageType: messageType,
            configurationId: configurationId,
            radioUnitIdentification: {
                productId: productId,
                productSubId: productSubId,
                radioUnitModemFirmwareVersion: radioUnitModemFirmwareVersion,
                radioUnitModemHardwareVersion: radioUnitModemHardwareVersion,
                radioUnitFirmwareVersion: radioUnitFirmwareVersion,
                radioUnitHardwareVersion: radioUnitHardwareVersion,
                serialNumber: serialNumberASCII,
            },
        },
    };
    if (warnings.length > 0) {
        res.warnings = warnings;
    }
    return res;
}
function decodeKeepAliveMessage(input) {
    var minLength = 12;
    var warnings = [];
    if (input.bytes.length !== minLength) {
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
    // u32b integer index 2-5
    var numberOfMeasurements = (input.bytes[2] << 24) | (input.bytes[3] << 16) | (input.bytes[4] << 8) | input.bytes[5];
    var numberOfTransmissions = (input.bytes[6] << 24) | (input.bytes[7] << 16) | (input.bytes[8] << 8) | input.bytes[9];
    var batteryResetSinceLastKeepAlive = !!(input.bytes[10] & 128);
    var estimatedBatteryPercent = input.bytes[10] & 127;
    var batteryCalculationError = estimatedBatteryPercent === 0x7f;
    var radioUnitTemperatureLevel_C = input.bytes[11];
    var res = {
        data: {
            messageType: messageType,
            configurationId: configurationId,
            deviceStatistic: {
                numberOfMeasurements: numberOfMeasurements,
                numberOfTransmissions: numberOfTransmissions,
                batteryResetSinceLastKeepAlive: batteryResetSinceLastKeepAlive,
                estimatedBatteryPercent: estimatedBatteryPercent,
                batteryCalculationError: batteryCalculationError,
                radioUnitTemperatureLevel_C: radioUnitTemperatureLevel_C,
            },
        },
    };
    if (warnings.length > 0) {
        res.warnings = warnings;
    }
    return res;
}
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
function getTechnicalAlarmCauseOfFailure(byte) {
    var causeOfFailure = {
        // sense is bit 7
        sense: ((byte & 128) >> 7),
        // causeOfFailure is bit 6 to 4
        causeOfFailure: (byte & 7),
    };
    // validate causeOfFailure
    if (![0, 1, 2, 3, 4, 5].includes(causeOfFailure.causeOfFailure)) {
        return createErrorMessage(["Invalid causeOfFailure in technical alarm: ".concat(causeOfFailure.causeOfFailure)]);
    }
    return causeOfFailure;
}
function getProcessAlarmType(byte) {
    var alarmType = {
        // sense is bit 7
        sense: ((byte & 128) >> 7),
        // channelId is bit 6 to 3 as 0 (0b0000) or 1 (0b0001)
        channelId: ((byte & 120) >> 3),
        // alarmType is bit 2 to 0
        alarmType: (byte & 7),
    };
    // validate alarmType
    if (alarmType.channelId !== 0 && alarmType.channelId !== 1) {
        return createErrorMessage(["Invalid channelId in process alarm: ".concat(alarmType.channelId)]);
    }
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
        channelName: "Electrical current",
    };
}
function getMeasurementRanges(channelId) {
    switch (channelId) {
        case 0:
            return { start: CHANNEL1_RANGE_START, end: CHANNEL1_RANGE_END };
        case 1:
            return { start: CHANNEL2_RANGE_START, end: CHANNEL2_RANGE_END };
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
function isInteger(value) {
    return typeof value === 'number' && value === Math.floor(value);
}
// ***********************************************************************************
//          Export functions Section
// ***********************************************************************************
if (typeof exports !== 'undefined') {
    exports.decodeUplink = decodeUplink;
    exports.decodeHexString = decodeHexString;
    exports.decodeBase64String = decodeBase64String;
}
