/**
 * Test data for TULIP3 device identification message
 * This hex string represents a complete identification message with all required fields
 */
export const FullIdentificationHexString = [
  // Message header
  0x14, // Identification message type
  0x01, // Identification message subtype

  // Block start:
  // Register information
  0x00, // Register address high byte (0x0000)
  0x00 + 24, // Register address low byte + size (24 bytes total)

  // Device identification
  0x03, // Product ID: 3
  0x04, // Product sub ID: 4 (LoRaWAN class C)

  // Channel plan: EU868
  0x01, // Channel plan: EU868

  // Connected sensors: all 8 sensors connected
  0b00001111, // Connected sensors bitmask (all 8 sensors connected)

  // Firmware version (3.1.4)
  3, // Major version
  1, // Minor version
  4, // Patch version

  // Hardware version (2.5.1)
  2, // Major version
  5, // Minor version
  1, // Patch version

  // Production date (2024-03-15)
  24, // Year offset (2024)
  3, // Month (March)
  15, // Day

  // Serial number part 1: "WIKA0" (ASCII)
  0x57, // 'W'
  0x49, // 'I'
  0x4B, // 'K'
  0x41, // 'A'
  0x30, // '0'

  // Serial number part 2: "01ABC" (ASCII)
  0x30, // '0'
  0x31, // '1'
  0x41, // 'A'
  0x42, // 'B'
  0x43, // 'C'
  0x21, // '!'

  // Block 2 start: Sensor 1 Information
  // Register information
  0b00000111, // Register address high byte (0x003C)
  0b10000000 + 23, // Register address low byte + size (23 bytes total)

  // Device type
  0x00,
  0x01, // Device type: 0x0001

  // Existing channels: all 8 channels connected
  0b11111111, // Connected channels bitmask (all 8 channels connected)

  // Firmware version (2.1.0)
  2, // Major version
  1, // Minor version
  0, // Patch version

  // Hardware version (1.3.2)
  1, // Major version
  3, // Minor version
  2, // Patch version

  // Production date (2023-11-20)
  23, // Year offset (2023)
  11, // Month (November)
  20, // Day

  // Serial number part 1: "TEMP0" (ASCII)
  0x54, // 'T'
  0x45, // 'E'
  0x4D, // 'M'
  0x50, // 'P'
  0x30, // '0'

  // Serial number part 2: "1XYZ!" (ASCII)
  0x31, // '1'
  0x58, // 'X'
  0x59, // 'Y'
  0x5A, // 'Z'
  0x21, // '!'
  0x21, // '!'

  // Block 3 start: Sensor 1 Channel 1 Information
  0b00001111, // Register address high byte
  0b00000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  1, // Measurand: 1 (Temperature)

  // Unit
  1, // Unit: 1 (°C)

  // Min measurement range (4 byte)
  0xC2,
  0x20,
  0x00,
  0x00, // Min range: -40°C

  // Max measurement range (4 byte)
  0x42,
  0xC8,
  0x00,
  0x00, // Max range: 100°C

  // Min physical sensor limit (4 byte as float)
  0xC2,
  0x48,
  0x00,
  0x00, // Min limit: -50°C

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x42, // Byte 1: 125°C
  0xFA, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x00, // High byte
  0xC8, // Low byte: 200 * 0.001% = 0.2% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 0.5°C offset
  0x00, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 0.998 (slight gain adjustment)
  0x7F, // Byte 2
  0x7C, // Byte 3
  0xED, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  23, // Year offset from 2000 (2023)
  10, // Month (October)
  5, // Day

  // Block 4 start: Sensor 1 Channel 2 Information
  0b00010101, // Register address high byte
  0b01000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  3, // Measurand: 3 (Pressure gauge)

  // Unit
  7, // Unit: 7 (bar)

  // Min measurement range (4 byte)
  0x00,
  0x00,
  0x00,
  0x00, // Min range: 0 bar

  // Max measurement range (4 byte)
  0x41,
  0x20,
  0x00,
  0x00, // Max range: 10 bar

  // Min physical sensor limit (4 byte as float)
  0xBF,
  0x80,
  0x00,
  0x00, // Min limit: -1 bar

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x41, // Byte 1: 12 bar
  0x40, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x01, // High byte
  0x2C, // Low byte: 300 * 0.001% = 0.3% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x3C, // Byte 1: 0.01 bar offset
  0x23, // Byte 2
  0xD7, // Byte 3
  0x0A, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 1.002 (slight gain adjustment)
  0x80, // Byte 2
  0x41, // Byte 3
  0x89, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  24, // Year offset from 2000 (2024)
  2, // Month (February)
  28, // Day

  // Block 5 start: Sensor 1 Channel 3 Information
  0b00011011, // Register address high byte
  0b10000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  6, // Measurand: 6 (Flow vol.)

  // Unit
  120, // Unit: 120 (l/min)

  // Min measurement range (4 byte)
  0x00,
  0x00,
  0x00,
  0x00, // Min range: 0 l/min

  // Max measurement range (4 byte)
  0x42,
  0x48,
  0x00,
  0x00, // Max range: 50 l/min

  // Min physical sensor limit (4 byte as float)
  0x00,
  0x00,
  0x00,
  0x00, // Min limit: 0 l/min

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x42, // Byte 1: 60 l/min
  0x70, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x01, // High byte
  0xF4, // Low byte: 500 * 0.001% = 0.5% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x3C, // Byte 1: 0.02 l/min offset
  0xA3, // Byte 2
  0xD7, // Byte 3
  0x0A, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 0.997 (slight gain adjustment)
  0x7F, // Byte 2
  0x3B, // Byte 3
  0x64, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  24, // Year offset from 2000 (2024)
  6, // Month (June)
  17, // Day

  // Block 6 start: Sensor 1 Channel 4 Information
  0b00100001, // Register address high byte
  0b11000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  10, // Measurand: 10 (Level)

  // Unit
  62, // Unit: 62 (m)

  // Min measurement range (4 byte)
  0x00,
  0x00,
  0x00,
  0x00, // Min range: 0 m

  // Max measurement range (4 byte)
  0x40,
  0xA0,
  0x00,
  0x00, // Max range: 5 m

  // Min physical sensor limit (4 byte as float)
  0xBF,
  0x00,
  0x00,
  0x00, // Min limit: -0.5 m

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x40, // Byte 1: 6 m
  0xC0, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x00, // High byte
  0x96, // Low byte: 150 * 0.001% = 0.15% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x3B, // Byte 1: 0.005 m offset
  0xA3, // Byte 2
  0xD7, // Byte 3
  0x0A, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 1.001 (slight gain adjustment)
  0x80, // Byte 2
  0x20, // Byte 3
  0xC5, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  25, // Year offset from 2000 (2025)
  3, // Month (March)
  5, // Day

  // Block 7 start: Sensor 1 Channel 5 Information
  0b00101000, // Register address high byte
  0b00000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  14, // Measurand: 14 (Voltage)

  // Unit
  88, // Unit: 88 (V)

  // Min measurement range (4 byte)
  0x00,
  0x00,
  0x00,
  0x00, // Min range: 0 V

  // Max measurement range (4 byte)
  0x41,
  0xC8,
  0x00,
  0x00, // Max range: 25 V

  // Min physical sensor limit (4 byte as float)
  0xBF,
  0x80,
  0x00,
  0x00, // Min limit: -1 V

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x41, // Byte 1: 30 V
  0xF0, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x00, // High byte
  0x7D, // Low byte: 125 * 0.001% = 0.125% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x3C, // Byte 1: 0.01 V offset
  0x23, // Byte 2
  0xD7, // Byte 3
  0x0A, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 0.991 (slight gain adjustment)
  0x7D, // Byte 2
  0xB2, // Byte 3
  0x2D, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  24, // Year offset from 2000 (2024)
  9, // Month (September)
  18, // Day

  // Block 8 start: Sensor 1 Channel 6 Information
  0b00101110, // Register address high byte
  0b01000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  26, // Measurand: 26 (Humidity relative)

  // Unit
  100, // Unit: 100 (%)

  // Min measurement range (4 byte)
  0x00,
  0x00,
  0x00,
  0x00, // Min range: 0%

  // Max measurement range (4 byte)
  0x42,
  0xC8,
  0x00,
  0x00, // Max range: 100%

  // Min physical sensor limit (4 byte as float)
  0x00,
  0x00,
  0x00,
  0x00, // Min limit: 0%

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x42, // Byte 1: 100%
  0xC8, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x07, // High byte
  0xD0, // Low byte: 2000 * 0.001% = 2% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 0.5% offset
  0x00, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 1.003 (slight gain adjustment)
  0x80, // Byte 2
  0x62, // Byte 3
  0x4E, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  25, // Year offset from 2000 (2025)
  5, // Month (May)
  22, // Day

  // Block 9 start: Sensor 1 Channel 7 Information
  0b00110100, // Register address high byte
  0b10000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  15, // Measurand: 15 (Resistance)

  // Unit
  83, // Unit: 83 (Ω)

  // Min measurement range (4 byte)
  0x42,
  0x20,
  0x00,
  0x00, // Min range: 40 Ω

  // Max measurement range (4 byte)
  0x43,
  0x70,
  0x00,
  0x00, // Max range: 240 Ω

  // Min physical sensor limit (4 byte as float)
  0x41,
  0xF0,
  0x00,
  0x00, // Min limit: 30 Ω

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x43, // Byte 1: 280 Ω
  0x8C, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x01, // High byte
  0x5E, // Low byte: 350 * 0.001% = 0.35% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 0.8 Ω offset
  0x4C, // Byte 2
  0xCC, // Byte 3
  0xCD, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 0.9985 (slight gain adjustment)
  0x7F, // Byte 2
  0x9D, // Byte 3
  0xB2, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  24, // Year offset from 2000 (2024)
  10, // Month (October)
  3, // Day

  // Block 10 start: Sensor 1 Channel 8 Information
  0b00111010, // Register address high byte
  0b11000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  23, // Measurand: 23 (Density)

  // Unit
  110, // Unit: 110 (kg/m³)

  // Min measurement range (4 byte)
  0x43,
  0x7A,
  0x00,
  0x00, // Min range: 250 kg/m³

  // Max measurement range (4 byte)
  0x44,
  0x7A,
  0x00,
  0x00, // Max range: 1000 kg/m³

  // Min physical sensor limit (4 byte as float)
  0x43,
  0x48,
  0x00,
  0x00, // Min limit: 200 kg/m³

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x44, // Byte 1: 1200 kg/m³
  0x96, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x02, // High byte
  0x58, // Low byte: 600 * 0.001% = 0.6% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x40, // Byte 1: 2 kg/m³ offset
  0x00, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 1.008 (slight gain adjustment)
  0x81, // Byte 2
  0x06, // Byte 3
  0x24, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  25, // Year offset from 2000 (2025)
  4, // Month (April)
  12, // Day

  // Block 11 start: Sensor 2 Information
  0b01000001, // Register address high byte
  0b00000000 + 23, // Register address low byte + size (23 bytes total)

  // Device type
  0x00,
  0x01, // Device type: 0x0001

  // Existing channels: all 8 channels connected
  0b11111111, // Connected channels bitmask (all 8 channels connected)

  // Firmware version (1.8.3)
  1, // Major version
  8, // Minor version
  3, // Patch version

  // Hardware version (2.0.1)
  2, // Major version
  0, // Minor version
  1, // Patch version

  // Production date (2024-07-08)
  24, // Year offset (2024)
  7, // Month (July)
  8, // Day

  // Serial number part 1: "FREQ0" (ASCII)
  0x46, // 'F'
  0x52, // 'R'
  0x45, // 'E'
  0x51, // 'Q'
  0x30, // '0'

  // Serial number part 2: "2DEF!" (ASCII)
  0x32, // '2'
  0x44, // 'D'
  0x45, // 'E'
  0x46, // 'F'
  0x21, // '!'
  0x21, // '!'

  // Block 12 start: Sensor 2 Channel 1 Information
  0b01001000, // Register address high byte
  0b10000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  20, // Measurand: 20 (Frequency)

  // Unit
  167, // Unit: 167 (Hz)

  // Min measurement range (4 byte)
  0x00,
  0x00,
  0x00,
  0x00, // Min range: 0 Hz

  // Max measurement range (4 byte)
  0x42,
  0x7A,
  0x00,
  0x00, // Max range: 62.5 Hz

  // Min physical sensor limit (4 byte as float)
  0x00,
  0x00,
  0x00,
  0x00, // Min limit: 0 Hz

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x42, // Byte 1: 80 Hz
  0xA0, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x00, // High byte
  0x32, // Low byte: 50 * 0.001% = 0.05% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x3C, // Byte 1: 0.01 Hz offset
  0x23, // Byte 2
  0xD7, // Byte 3
  0x0A, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 1
  0x80, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  23, // Year offset from 2000 (2023)
  12, // Month (December)
  3, // Day

  // Block 13 start: Sensor 2 Channel 2 Information
  0b01001110, // Register address high byte
  0b11000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  13, // Measurand: 13 (Current)

  // Unit
  90, // Unit: 90 (mA)

  // Min measurement range (4 byte)
  0x40,
  0x80,
  0x00,
  0x00, // Min range: 4 mA

  // Max measurement range (4 byte)
  0x41,
  0xA0,
  0x00,
  0x00, // Max range: 20 mA

  // Min physical sensor limit (4 byte as float)
  0x00,
  0x00,
  0x00,
  0x00, // Min limit: 0 mA

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x41, // Byte 1: 24.0 mA
  0xC0, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x00, // High byte
  0x64, // Low byte: 100 * 0.001% = 0.1% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x40, // Byte 1: 2.5 mA offset
  0x20, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 1.0 (no gain adjustment)
  0x80, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  25, // Year offset from 2000 (2025)
  8, // Month (August)
  4, // Day

  // Block 14 start: Sensor 2 Channel 3 Information
  0b01010101, // Register address high byte
  0b00000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  13, // Measurand: 13 (Current)

  // Unit
  90, // Unit: 90 (mA)

  // Min measurement range (4 byte)
  0x40,
  0x80,
  0x00,
  0x00, // Min range: 4 mA

  // Max measurement range (4 byte)
  0x41,
  0xA0,
  0x00,
  0x00, // Max range: 20 mA

  // Min physical sensor limit (4 byte as float)
  0x00,
  0x00,
  0x00,
  0x00, // Min limit: 0 mA

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x41, // Byte 1: 24.0 mA
  0xC0, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x00, // High byte
  0x64, // Low byte: 100 * 0.001% = 0.1% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x40, // Byte 1: 2.5 mA offset
  0x20, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 1.0 (no gain adjustment)
  0x80, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  25, // Year offset from 2000 (2025)
  8, // Month (August)
  4, // Day

  // Block 15 start: Sensor 2 Channel 4 Information
  0b01011011, // Register address high byte
  0b01000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  13, // Measurand: 13 (Current)

  // Unit
  90, // Unit: 90 (mA)

  // Min measurement range (4 byte)
  0x40,
  0x80,
  0x00,
  0x00, // Min range: 4 mA

  // Max measurement range (4 byte)
  0x41,
  0xA0,
  0x00,
  0x00, // Max range: 20 mA

  // Min physical sensor limit (4 byte as float)
  0x00,
  0x00,
  0x00,
  0x00, // Min limit: 0 mA

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x41, // Byte 1: 24.0 mA
  0xC0, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x00, // High byte
  0x64, // Low byte: 100 * 0.001% = 0.1% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x40, // Byte 1: 2.5 mA offset
  0x20, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 1.0 (no gain adjustment)
  0x80, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  25, // Year offset from 2000 (2025)
  8, // Month (August)
  4, // Day

  // Block 16 start: Sensor 2 Channel 5 Information
  0b01100001, // Register address high byte
  0b10000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  13, // Measurand: 13 (Current)

  // Unit
  90, // Unit: 90 (mA)

  // Min measurement range (4 byte)
  0x40,
  0x80,
  0x00,
  0x00, // Min range: 4 mA

  // Max measurement range (4 byte)
  0x41,
  0xA0,
  0x00,
  0x00, // Max range: 20 mA

  // Min physical sensor limit (4 byte as float)
  0x00,
  0x00,
  0x00,
  0x00, // Min limit: 0 mA

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x41, // Byte 1: 24.0 mA
  0xC0, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x00, // High byte
  0x64, // Low byte: 100 * 0.001% = 0.1% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x40, // Byte 1: 2.5 mA offset
  0x20, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 1.0 (no gain adjustment)
  0x80, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  25, // Year offset from 2000 (2025)
  8, // Month (August)
  4, // Day

  // Block 17 start: Sensor 2 Channel 6 Information
  0b01100111, // Register address high byte
  0b11000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  13, // Measurand: 13 (Current)

  // Unit
  90, // Unit: 90 (mA)

  // Min measurement range (4 byte)
  0x40,
  0x80,
  0x00,
  0x00, // Min range: 4 mA

  // Max measurement range (4 byte)
  0x41,
  0xA0,
  0x00,
  0x00, // Max range: 20 mA

  // Min physical sensor limit (4 byte as float)
  0x00,
  0x00,
  0x00,
  0x00, // Min limit: 0 mA

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x41, // Byte 1: 24.0 mA
  0xC0, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x00, // High byte
  0x64, // Low byte: 100 * 0.001% = 0.1% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x40, // Byte 1: 2.5 mA offset
  0x20, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 1.0 (no gain adjustment)
  0x80, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  25, // Year offset from 2000 (2025)
  8, // Month (August)
  4, // Day

  // Block 18 start: Sensor 2 Channel 7 Information
  0b01101110, // Register address high byte
  0b00000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  13, // Measurand: 13 (Current)

  // Unit
  90, // Unit: 90 (mA)

  // Min measurement range (4 byte)
  0x40,
  0x80,
  0x00,
  0x00, // Min range: 4 mA

  // Max measurement range (4 byte)
  0x41,
  0xA0,
  0x00,
  0x00, // Max range: 20 mA

  // Min physical sensor limit (4 byte as float)
  0x00,
  0x00,
  0x00,
  0x00, // Min limit: 0 mA

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x41, // Byte 1: 24.0 mA
  0xC0, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x00, // High byte
  0x64, // Low byte: 100 * 0.001% = 0.1% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x40, // Byte 1: 2.5 mA offset
  0x20, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 1.0 (no gain adjustment)
  0x80, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  25, // Year offset from 2000 (2025)
  8, // Month (August)
  4, // Day

  // Block 19 start: Sensor 2 Channel 8 Information
  0b01110100, // Register address high byte
  0b01000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  13, // Measurand: 13 (Current)

  // Unit
  90, // Unit: 90 (mA)

  // Min measurement range (4 byte)
  0x40,
  0x80,
  0x00,
  0x00, // Min range: 4 mA

  // Max measurement range (4 byte)
  0x41,
  0xA0,
  0x00,
  0x00, // Max range: 20 mA

  // Min physical sensor limit (4 byte as float)
  0x00,
  0x00,
  0x00,
  0x00, // Min limit: 0 mA

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x41, // Byte 1: 24.0 mA
  0xC0, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x00, // High byte
  0x64, // Low byte: 100 * 0.001% = 0.1% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x40, // Byte 1: 2.5 mA offset
  0x20, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 1.0 (no gain adjustment)
  0x80, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  25, // Year offset from 2000 (2025)
  8, // Month (August)
  4, // Day

  // Block 20 start: Sensor 3 Information
  0b01111010, // Register address high byte
  0b10000000 + 23, // Register address low byte + size (23 bytes total)

  // Device type
  0x00,
  0x01, // Device type: 0x0001

  // Existing channels: all 8 channels connected
  0b11111111, // Connected channels bitmask (all 8 channels connected)

  // Firmware version (2.5.7)
  2, // Major version
  5, // Minor version
  7, // Patch version

  // Hardware version (1.4.0)
  1, // Major version
  4, // Minor version
  0, // Patch version

  // Production date (2024-01-12)
  24, // Year offset (2024)
  1, // Month (January)
  12, // Day

  // Serial number part 1: "SPEED" (ASCII)
  0x53, // 'S'
  0x50, // 'P'
  0x45, // 'E'
  0x45, // 'E'
  0x44, // 'D'

  // Serial number part 2: "3GHI!" (ASCII)
  0x33, // '3'
  0x47, // 'G'
  0x48, // 'H'
  0x49, // 'I'
  0x21, // '!'
  0x21, // '!'

  // Block 21 start: Sensor 3 Channel 1 Information
  0b10000010, // Register address high byte
  0b00000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  21, // Measurand: 21 (Speed)

  // Unit
  170, // Unit: 170 (m/s)

  // Min measurement range (4 byte)
  0x00,
  0x00,
  0x00,
  0x00, // Min range: 0 m/s

  // Max measurement range (4 byte)
  0x41,
  0xA0,
  0x00,
  0x00, // Max range: 20 m/s

  // Min physical sensor limit (4 byte as float)
  0xC0,
  0xA0,
  0x00,
  0x00, // Min limit: -5 m/s

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x41, // Byte 1: 25 m/s
  0xC8, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x01, // High byte
  0x90, // Low byte: 400 * 0.001% = 0.4% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x3C, // Byte 1: 0.02 m/s offset
  0xA3, // Byte 2
  0xD7, // Byte 3
  0x0A, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 0.997 (slight gain adjustment)
  0x7F, // Byte 2
  0x5C, // Byte 3
  0x29, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  24, // Year offset from 2000 (2024)
  5, // Month (May)
  9, // Day

  // Block 22 start: Sensor 3 Channel 2 Information
  0b10001000, // Register address high byte
  0b01000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  13, // Measurand: 13 (Current)

  // Unit
  90, // Unit: 90 (mA)

  // Min measurement range (4 byte)
  0x40,
  0x80,
  0x00,
  0x00, // Min range: 4 mA

  // Max measurement range (4 byte)
  0x41,
  0xA0,
  0x00,
  0x00, // Max range: 20 mA

  // Min physical sensor limit (4 byte as float)
  0x00,
  0x00,
  0x00,
  0x00, // Min limit: 0 mA

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x41, // Byte 1: 24.0 mA
  0xC0, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x00, // High byte
  0x64, // Low byte: 100 * 0.001% = 0.1% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x40, // Byte 1: 2.5 mA offset
  0x20, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 1.0 (no gain adjustment)
  0x80, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  25, // Year offset from 2000 (2025)
  8, // Month (August)
  4, // Day

  // Block 23 start: Sensor 3 Channel 3 Information
  0b10001110, // Register address high byte
  0b10000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  13, // Measurand: 13 (Current)

  // Unit
  90, // Unit: 90 (mA)

  // Min measurement range (4 byte)
  0x40,
  0x80,
  0x00,
  0x00, // Min range: 4 mA

  // Max measurement range (4 byte)
  0x41,
  0xA0,
  0x00,
  0x00, // Max range: 20 mA

  // Min physical sensor limit (4 byte as float)
  0x00,
  0x00,
  0x00,
  0x00, // Min limit: 0 mA

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x41, // Byte 1: 24.0 mA
  0xC0, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x00, // High byte
  0x64, // Low byte: 100 * 0.001% = 0.1% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x40, // Byte 1: 2.5 mA offset
  0x20, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 1.0 (no gain adjustment)
  0x80, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  25, // Year offset from 2000 (2025)
  8, // Month (August)
  4, // Day

  // Block 24 start: Sensor 3 Channel 4 Information
  0b10010100, // Register address high byte
  0b11000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  13, // Measurand: 13 (Current)

  // Unit
  90, // Unit: 90 (mA)

  // Min measurement range (4 byte)
  0x40,
  0x80,
  0x00,
  0x00, // Min range: 4 mA

  // Max measurement range (4 byte)
  0x41,
  0xA0,
  0x00,
  0x00, // Max range: 20 mA

  // Min physical sensor limit (4 byte as float)
  0x00,
  0x00,
  0x00,
  0x00, // Min limit: 0 mA

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x41, // Byte 1: 24.0 mA
  0xC0, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x00, // High byte
  0x64, // Low byte: 100 * 0.001% = 0.1% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x40, // Byte 1: 2.5 mA offset
  0x20, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 1.0 (no gain adjustment)
  0x80, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  25, // Year offset from 2000 (2025)
  8, // Month (August)
  4, // Day

  // Block 25 start: Sensor 3 Channel 5 Information
  0b10011011, // Register address high byte
  0b00000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  13, // Measurand: 13 (Current)

  // Unit
  90, // Unit: 90 (mA)

  // Min measurement range (4 byte)
  0x40,
  0x80,
  0x00,
  0x00, // Min range: 4 mA

  // Max measurement range (4 byte)
  0x41,
  0xA0,
  0x00,
  0x00, // Max range: 20 mA

  // Min physical sensor limit (4 byte as float)
  0x00,
  0x00,
  0x00,
  0x00, // Min limit: 0 mA

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x41, // Byte 1: 24.0 mA
  0xC0, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x00, // High byte
  0x64, // Low byte: 100 * 0.001% = 0.1% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x40, // Byte 1: 2.5 mA offset
  0x20, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 1.0 (no gain adjustment)
  0x80, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  25, // Year offset from 2000 (2025)
  8, // Month (August)
  4, // Day

  // Block 26 start: Sensor 3 Channel 6 Information
  0b10100001, // Register address high byte
  0b01000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  13, // Measurand: 13 (Current)

  // Unit
  90, // Unit: 90 (mA)

  // Min measurement range (4 byte)
  0x40,
  0x80,
  0x00,
  0x00, // Min range: 4 mA

  // Max measurement range (4 byte)
  0x41,
  0xA0,
  0x00,
  0x00, // Max range: 20 mA

  // Min physical sensor limit (4 byte as float)
  0x00,
  0x00,
  0x00,
  0x00, // Min limit: 0 mA

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x41, // Byte 1: 24.0 mA
  0xC0, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x00, // High byte
  0x64, // Low byte: 100 * 0.001% = 0.1% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x40, // Byte 1: 2.5 mA offset
  0x20, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 1.0 (no gain adjustment)
  0x80, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  25, // Year offset from 2000 (2025)
  8, // Month (August)
  4, // Day

  // Block 27 start: Sensor 3 Channel 7 Information
  0b10100111, // Register address high byte
  0b10000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  13, // Measurand: 13 (Current)

  // Unit
  90, // Unit: 90 (mA)

  // Min measurement range (4 byte)
  0x40,
  0x80,
  0x00,
  0x00, // Min range: 4 mA

  // Max measurement range (4 byte)
  0x41,
  0xA0,
  0x00,
  0x00, // Max range: 20 mA

  // Min physical sensor limit (4 byte as float)
  0x00,
  0x00,
  0x00,
  0x00, // Min limit: 0 mA

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x41, // Byte 1: 24.0 mA
  0xC0, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x00, // High byte
  0x64, // Low byte: 100 * 0.001% = 0.1% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x40, // Byte 1: 2.5 mA offset
  0x20, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 1.0 (no gain adjustment)
  0x80, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  25, // Year offset from 2000 (2025)
  8, // Month (August)
  4, // Day

  // Block 28 start: Sensor 3 Channel 8 Information
  0b10101101, // Register address high byte
  0b11000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  13, // Measurand: 13 (Current)

  // Unit
  90, // Unit: 90 (mA)

  // Min measurement range (4 byte)
  0x40,
  0x80,
  0x00,
  0x00, // Min range: 4 mA

  // Max measurement range (4 byte)
  0x41,
  0xA0,
  0x00,
  0x00, // Max range: 20 mA

  // Min physical sensor limit (4 byte as float)
  0x00,
  0x00,
  0x00,
  0x00, // Min limit: 0 mA

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x41, // Byte 1: 24.0 mA
  0xC0, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x00, // High byte
  0x64, // Low byte: 100 * 0.001% = 0.1% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x40, // Byte 1: 2.5 mA offset
  0x20, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 1.0 (no gain adjustment)
  0x80, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  25, // Year offset from 2000 (2025)
  8, // Month (August)
  4, // Day

  // Block 29 start: Sensor 4 Information
  0b10110100, // Register address high byte
  0b00000000 + 23, // Register address low byte + size (23 bytes total)

  // Device type
  0x00,
  0x01, // Device type: 0x0001

  // Existing channels: all 8 channels connected
  0b11111111, // Connected channels bitmask (all 8 channels connected)

  // Firmware version (3.0.2)
  3, // Major version
  0, // Minor version
  2, // Patch version

  // Hardware version (2.1.5)
  2, // Major version
  1, // Minor version
  5, // Patch version

  // Production date (2023-09-25)
  23, // Year offset (2023)
  9, // Month (September)
  25, // Day

  // Serial number part 1: "ANGLE" (ASCII)
  0x41, // 'A'
  0x4E, // 'N'
  0x47, // 'G'
  0x4C, // 'L'
  0x45, // 'E'

  // Serial number part 2: "4JKL!" (ASCII)
  0x34, // '4'
  0x4A, // 'J'
  0x4B, // 'K'
  0x4C, // 'L'
  0x21, // '!'
  0x21, // '!'

  // Block 30 start: Sensor 4 Channel 1 Information
  0b10111011, // Register address high byte
  0b10000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  28, // Measurand: 28 (Angle of rotation/inclination)

  // Unit
  105, // Unit: 105 (°)

  // Min measurement range (4 byte)
  0xC3,
  0x34,
  0x00,
  0x00, // Min range: -180°

  // Max measurement range (4 byte)
  0x43,
  0x34,
  0x00,
  0x00, // Max range: 180°

  // Min physical sensor limit (4 byte as float)
  0xC3,
  0x34,
  0x00,
  0x00, // Min limit: -180°

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x43, // Byte 1: 180°
  0x34, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x03, // High byte
  0xE8, // Low byte: 1000 * 0.001% = 1% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x3D, // Byte 1: 0.1° offset
  0xCC, // Byte 2
  0xCC, // Byte 3
  0xCD, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 1.005 (slight gain adjustment)
  0x80, // Byte 2
  0xA3, // Byte 3
  0xD7, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  23, // Year offset from 2000 (2023)
  8, // Month (August)
  11, // Day

  // Block 31 start: Sensor 4 Channel 2 Information
  0b11000001, // Register address high byte
  0b11000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  13, // Measurand: 13 (Current)

  // Unit
  90, // Unit: 90 (mA)

  // Min measurement range (4 byte)
  0x40,
  0x80,
  0x00,
  0x00, // Min range: 4 mA

  // Max measurement range (4 byte)
  0x41,
  0xA0,
  0x00,
  0x00, // Max range: 20 mA

  // Min physical sensor limit (4 byte as float)
  0x00,
  0x00,
  0x00,
  0x00, // Min limit: 0 mA

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x41, // Byte 1: 24.0 mA
  0xC0, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x00, // High byte
  0x64, // Low byte: 100 * 0.001% = 0.1% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x40, // Byte 1: 2.5 mA offset
  0x20, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 1.0 (no gain adjustment)
  0x80, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  25, // Year offset from 2000 (2025)
  8, // Month (August)
  4, // Day

  // Block 32 start: Sensor 4 Channel 3 Information
  0b11001000, // Register address high byte
  0b00000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  13, // Measurand: 13 (Current)

  // Unit
  90, // Unit: 90 (mA)

  // Min measurement range (4 byte)
  0x40,
  0x80,
  0x00,
  0x00, // Min range: 4 mA

  // Max measurement range (4 byte)
  0x41,
  0xA0,
  0x00,
  0x00, // Max range: 20 mA

  // Min physical sensor limit (4 byte as float)
  0x00,
  0x00,
  0x00,
  0x00, // Min limit: 0 mA

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x41, // Byte 1: 24.0 mA
  0xC0, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x00, // High byte
  0x64, // Low byte: 100 * 0.001% = 0.1% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x40, // Byte 1: 2.5 mA offset
  0x20, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 1.0 (no gain adjustment)
  0x80, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  25, // Year offset from 2000 (2025)
  8, // Month (August)
  4, // Day

  // Block 33 start: Sensor 4 Channel 4 Information
  0b11001110, // Register address high byte
  0b01000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  13, // Measurand: 13 (Current)

  // Unit
  90, // Unit: 90 (mA)

  // Min measurement range (4 byte)
  0x40,
  0x80,
  0x00,
  0x00, // Min range: 4 mA

  // Max measurement range (4 byte)
  0x41,
  0xA0,
  0x00,
  0x00, // Max range: 20 mA

  // Min physical sensor limit (4 byte as float)
  0x00,
  0x00,
  0x00,
  0x00, // Min limit: 0 mA

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x41, // Byte 1: 24.0 mA
  0xC0, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x00, // High byte
  0x64, // Low byte: 100 * 0.001% = 0.1% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x40, // Byte 1: 2.5 mA offset
  0x20, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 1.0 (no gain adjustment)
  0x80, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  25, // Year offset from 2000 (2025)
  8, // Month (August)
  4, // Day

  // Block 34 start: Sensor 4 Channel 5 Information
  0b11010100, // Register address high byte
  0b10000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  13, // Measurand: 13 (Current)

  // Unit
  90, // Unit: 90 (mA)

  // Min measurement range (4 byte)
  0x40,
  0x80,
  0x00,
  0x00, // Min range: 4 mA

  // Max measurement range (4 byte)
  0x41,
  0xA0,
  0x00,
  0x00, // Max range: 20 mA

  // Min physical sensor limit (4 byte as float)
  0x00,
  0x00,
  0x00,
  0x00, // Min limit: 0 mA

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x41, // Byte 1: 24.0 mA
  0xC0, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x00, // High byte
  0x64, // Low byte: 100 * 0.001% = 0.1% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x40, // Byte 1: 2.5 mA offset
  0x20, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 1.0 (no gain adjustment)
  0x80, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  25, // Year offset from 2000 (2025)
  8, // Month (August)
  4, // Day

  // Block 35 start: Sensor 4 Channel 6 Information
  0b11011010, // Register address high byte
  0b11000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  13, // Measurand: 13 (Current)

  // Unit
  90, // Unit: 90 (mA)

  // Min measurement range (4 byte)
  0x40,
  0x80,
  0x00,
  0x00, // Min range: 4 mA

  // Max measurement range (4 byte)
  0x41,
  0xA0,
  0x00,
  0x00, // Max range: 20 mA

  // Min physical sensor limit (4 byte as float)
  0x00,
  0x00,
  0x00,
  0x00, // Min limit: 0 mA

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x41, // Byte 1: 24.0 mA
  0xC0, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x00, // High byte
  0x64, // Low byte: 100 * 0.001% = 0.1% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x40, // Byte 1: 2.5 mA offset
  0x20, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 1.0 (no gain adjustment)
  0x80, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  25, // Year offset from 2000 (2025)
  8, // Month (August)
  4, // Day

  // Block 36 start: Sensor 4 Channel 7 Information
  0b11100001, // Register address high byte
  0b00000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  13, // Measurand: 13 (Current)

  // Unit
  90, // Unit: 90 (mA)

  // Min measurement range (4 byte)
  0x40,
  0x80,
  0x00,
  0x00, // Min range: 4 mA

  // Max measurement range (4 byte)
  0x41,
  0xA0,
  0x00,
  0x00, // Max range: 20 mA

  // Min physical sensor limit (4 byte as float)
  0x00,
  0x00,
  0x00,
  0x00, // Min limit: 0 mA

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x41, // Byte 1: 24.0 mA
  0xC0, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x00, // High byte
  0x64, // Low byte: 100 * 0.001% = 0.1% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x40, // Byte 1: 2.5 mA offset
  0x20, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 1.0 (no gain adjustment)
  0x80, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  25, // Year offset from 2000 (2025)
  8, // Month (August)
  4, // Day

  // Block 37 start: Sensor 4 Channel 8 Information
  0b11100111, // Register address high byte
  0b01000000 + 31, // Register address low byte + size (31 bytes total)

  // Measurand
  13, // Measurand: 13 (Current)

  // Unit
  90, // Unit: 90 (mA)

  // Min measurement range (4 byte)
  0x40,
  0x80,
  0x00,
  0x00, // Min range: 4 mA

  // Max measurement range (4 byte)
  0x41,
  0xA0,
  0x00,
  0x00, // Max range: 20 mA

  // Min physical sensor limit (4 byte as float)
  0x00,
  0x00,
  0x00,
  0x00, // Min limit: 0 mA

  // Max physical sensor limit (4 bytes as IEEE 754 float)
  0x41, // Byte 1: 24.0 mA
  0xC0, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Accuracy (2 bytes as uint16, multiplied by 0.001%)
  0x00, // High byte
  0x64, // Low byte: 100 * 0.001% = 0.1% accuracy

  // Offset calibration (4 bytes as IEEE 754 float)
  0x40, // Byte 1: 2.5 mA offset
  0x20, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Gain calibration (4 bytes as IEEE 754 float)
  0x3F, // Byte 1: 1.0 (no gain adjustment)
  0x80, // Byte 2
  0x00, // Byte 3
  0x00, // Byte 4

  // Calibration date (3 bytes: year offset, month, day)
  25, // Year offset from 2000 (2025)
  8, // Month (August)
  4, // Day
]
