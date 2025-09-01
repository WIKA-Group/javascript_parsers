export const FullConfigurationHexString = [
  0x15,
  0x01,

  // Block 1: CM configuration
  0x00, // Register address high byte (0x0000)
  0x00 + 21, // Register address low byte + size (21 bytes total)

  // Register information
  0x00,
  0x00,
  0x0E,
  0x10, // Measuring period alarm off (3600)

  0x00,
  0x00,
  0x1C,
  0x20, // Measuring period alarm on (7200)

  0x00,
  0x01, // Transmission rate alarm off (1)

  0x00,
  0x10, // Transmission rate alarm on (16)

  0x12,
  0x2A, // Over voltage threshold (4650mV)

  0x0B,
  0x54, // Under voltage threshold (2900mV)

  0x5F, // Over temperature CM chip (95°C)

  0xF6, // Under temperature CM chip (-10°C)

  0x78, // Downlink answer timeout (120 seconds)

  0xF0, // fetch additional downlink time interval (240 seconds)

  0x00, // Enabled BLE advertising (0x00 = disabled)

  // BLock 2: Sensor 1 configuration
  0b00000101, // Register address high byte (0x02A)
  0b01000000 + 6, // Register address low byte + size (6 bytes total)

  // Register information
  0b1111_1111, // Sampling channels (0xFF = all channels enabled)

  0x00,
  0x8F, // Boot time (0x008F = 143 seconds)

  0x00,
  0xDF, // Communication timeout (0x00DF = 223 seconds)

  125, // Communication retry count (125 retries) !!! ADDED

  // Block 3: Channel 1 of sensor 1 configuration (part 1 0x47 - 0x58 [excluding 0x59])
  0b00001000, // Register address high byte (0x047)
  0b11100000 + 18,

  // Register information
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)

  0b11111100, // enabled process alarms (all enabled)

  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)

  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)

  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)

  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)  // Block 4: Channel 1 of sensor 1 configuration (part 2 0x59 - 0x068)
  0b00001011,
  0b00100000 + 16, // Register address high byte (0x059 = 0x47 + 18 from part 1) + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)

  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)

  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)

  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)

  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 5: Channel 2 of sensor 1 configuration (part 1 0x81 - 0x92 [excluding 0x93])
  0b00010000, // Register address high byte (0x081)
  0b00100000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (reusing data from channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)
  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)
  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)
  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)

  // Block 6: Channel 2 of sensor 1 configuration (part 2 0x93 - 0xA2)
  0b00010010, // Register address high byte (0x093)
  0b01100000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 7: Channel 3 of sensor 1 configuration (part 1 0xBB - 0xCC [excluding 0xCD])
  0b00010111, // Register address high byte (0x0BB)
  0b01100000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (reusing data from channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)
  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)
  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)
  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)

  // Block 8: Channel 3 of sensor 1 configuration (part 2 0xCD - 0xDC)
  0b00011001, // Register address high byte (0x0CD)
  0b10100000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 9: Channel 4 of sensor 1 configuration (part 1 0xF5 - 0x106 [excluding 0x107])
  0b00011110, // Register address high byte (0x0F5)
  0b10100000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (reusing data from channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)

  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)

  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)

  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)

  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)

  // Block 10: Channel 4 of sensor 1 configuration (part 2 0x107 - 0x116)
  0b00100000, // Register address high byte (0x107)
  0b11100000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 11: Channel 5 of sensor 1 configuration (part 1 0x12F - 0x140 [excluding 0x141])
  0b00100101, // Register address high byte (0x12F)
  0b11100000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (reusing data from channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)
  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)
  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)
  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)

  // Block 12: Channel 5 of sensor 1 configuration (part 2 0x141 - 0x150)
  0b00101000, // Register address high byte (0x141)
  0b00100000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 13: Channel 6 of sensor 1 configuration (part 1 0x169 - 0x17A [excluding 0x17B])
  0b00101101, // Register address high byte (0x169)
  0b00100000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (reusing data from channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)
  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)
  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)
  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)

  // Block 14: Channel 6 of sensor 1 configuration (part 2 0x17B - 0x18A)
  0b00101111, // Register address high byte (0x17B)
  0b01100000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 15: Channel 7 of sensor 1 configuration (part 1 0x1A3 - 0x1B4 [excluding 0x1B5])
  0b00110100, // Register address high byte (0x1A3)
  0b01100000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (reusing data from channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)
  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)
  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)
  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)

  // Block 16: Channel 7 of sensor 1 configuration (part 2 0x1B5 - 0x1C4)
  0b00110110, // Register address high byte (0x1B5)
  0b10100000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 17: Channel 8 of sensor 1 configuration (part 1 0x1DD - 0x1EE [excluding 0x1EF])
  0b00111011, // Register address high byte (0x1DD)
  0b10100000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (reusing data from channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)
  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)
  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)
  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)

  // Block 18: Channel 8 of sensor 1 configuration (part 2 0x1EF - 0x1FE)
  0b00111101, // Register address high byte (0x1EF)
  0b11100000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)

  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)

  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)

  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)

  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 19: Sensor 2 configuration
  0b01000010, // Register address high byte (0x0217)
  0b11100000 + 6, // Register address low byte + size (6 bytes total)

  // Register information (sensor 2 - different boot time and timeout)
  0b1111_1111, // Sampling channels (0xFF = all channels enabled)
  0x00,
  0xB4, // Boot time (0x00B4 = 180 seconds - longer than sensor 1)
  0x01,
  0x2C, // Communication timeout (0x012C = 300 seconds - longer than sensor 1)
  150, // Communication retry count (150 retries - more than sensor 1)

  // Block 20: Channel 1 of sensor 2 configuration (part 1 0x234 - 0x245 [excluding 0x246])
  0b01000110, // Register address high byte (0x0234)
  0b10000000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (adjusted values for sensor 2 channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x50,
  0x00,
  0x00, // Process alarm dead band (13.0 - higher than sensor 1)
  0x40,
  0x00,
  0x00,
  0x00, // Low threshold alarm value (2.0 - higher than sensor 1)
  0x41,
  0x20,
  0x00,
  0x00, // High threshold alarm value (10.0 - higher than sensor 1)
  0x3E,
  0x99,
  0x99,
  0x9A, // Falling slope alarm (0.3/sec - higher than sensor 1)

  // Block 21: Channel 1 of sensor 2 configuration (part 2 0x246 - 0x255)
  0b01001000, // Register address high byte (0x0246)
  0b11000000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 22: Channel 2 of sensor 2 configuration (part 1 0x26E - 0x27F [excluding 0x280])
  0b01001101, // Register address high byte (0x026E)
  0b11000000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (reusing data from sensor 1 channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)
  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)
  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)
  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)

  // Block 23: Channel 2 of sensor 2 configuration (part 2 0x280 - 0x28F)
  0b01010000, // Register address high byte (0x0280)
  0b00000000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 24: Channel 3 of sensor 2 configuration (part 1 0x2A8 - 0x2B9 [excluding 0x2BA])
  0b01010101, // Register address high byte (0x02A8)
  0b00000000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (reusing data from sensor 1 channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)
  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)
  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)
  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)

  // Block 25: Channel 3 of sensor 2 configuration (part 2 0x2BA - 0x2C9)
  0b01010111, // Register address high byte (0x02BA)
  0b01000000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 26: Channel 4 of sensor 2 configuration (part 1 0x2E2 - 0x2F3 [excluding 0x2F4])
  0b01011100, // Register address high byte (0x02E2)
  0b01000000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (reusing data from sensor 1 channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)
  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)
  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)
  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)

  // Block 27: Channel 4 of sensor 2 configuration (part 2 0x2F4 - 0x303)
  0b01011110, // Register address high byte (0x02F4)
  0b10000000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 28: Channel 5 of sensor 2 configuration (part 1 0x31C - 0x32D [excluding 0x32E])
  0b01100011, // Register address high byte (0x031C)
  0b10000000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (reusing data from sensor 1 channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)
  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)
  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)
  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)

  // Block 29: Channel 5 of sensor 2 configuration (part 2 0x32E - 0x33D)
  0b01100101, // Register address high byte (0x032E)
  0b11000000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 30: Channel 6 of sensor 2 configuration (part 1 0x356 - 0x367 [excluding 0x368])
  0b01101010, // Register address high byte (0x0356)
  0b11000000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (reusing data from sensor 1 channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)
  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)
  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)
  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)

  // Block 31: Channel 6 of sensor 2 configuration (part 2 0x368 - 0x377)
  0b01101101, // Register address high byte (0x0368)
  0b00000000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 32: Channel 7 of sensor 2 configuration (part 1 0x390 - 0x3A1 [excluding 0x3A2])
  0b01110010, // Register address high byte (0x0390)
  0b00000000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (reusing data from sensor 1 channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)
  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)
  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)
  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)

  // Block 33: Channel 7 of sensor 2 configuration (part 2 0x3A2 - 0x3B1)
  0b01110100, // Register address high byte (0x03A2)
  0b01000000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 34: Channel 8 of sensor 2 configuration (part 1 0x3CA - 0x3DB [excluding 0x3DC])
  0b01111001, // Register address high byte (0x03CA)
  0b01000000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (reusing data from sensor 1 channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)
  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)
  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)
  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)

  // Block 35: Channel 8 of sensor 2 configuration (part 2 0x3DC - 0x3EB)
  0b01111011, // Register address high byte (0x03DC)
  0b10000000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 36: Sensor 3 configuration
  0b10000000, // Register address high byte (0x0404)
  0b10000000 + 6, // Register address low byte + size (6 bytes total)

  // Register information (adjusted values for sensor 3)
  0b1111_1111, // Sampling channels (0xFF = all channels enabled)
  0x00,
  0xC8, // Boot time (0x00C8 = 200 seconds - longer than others)
  0x01,
  0x90, // Communication timeout (0x0190 = 400 seconds - much longer)
  100, // Communication retry count (100 retries - moderate)

  // Block 37: Channel 1 of sensor 3 configuration (part 1 0x421 - 0x432 [excluding 0x433])
  0b10000100, // Register address high byte (0x0421)
  0b00100000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (reusing data from sensor 1 channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)
  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)
  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)
  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)

  // Block 38: Channel 1 of sensor 3 configuration (part 2 0x433 - 0x442)
  0b10000110, // Register address high byte (0x0433)
  0b01100000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 39: Channel 2 of sensor 3 configuration (part 1 0x45B - 0x46C [excluding 0x46D])
  0b10001011, // Register address high byte (0x045B)
  0b01100000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (reusing data from sensor 1 channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)
  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)
  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)
  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)

  // Block 40: Channel 2 of sensor 3 configuration (part 2 0x46D - 0x47C)
  0b10001101, // Register address high byte (0x046D)
  0b10100000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 41: Channel 3 of sensor 3 configuration (part 1 0x495 - 0x4A6 [excluding 0x4A7])
  0b10010010, // Register address high byte (0x0495)
  0b10100000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (custom values for sensor 3 channel 3)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x60,
  0x00,
  0x00, // Process alarm dead band (14.0 - even higher)
  0x3F,
  0x00,
  0x00,
  0x00, // Low threshold alarm value (0.5 - very low)
  0x41,
  0x40,
  0x00,
  0x00, // High threshold alarm value (12.0 - higher threshold)
  0x3E,
  0x19,
  0x99,
  0x9A, // Falling slope alarm (0.15/sec - slower)

  // Block 42: Channel 3 of sensor 3 configuration (part 2 0x4A7 - 0x4B6)
  0b10010100, // Register address high byte (0x04A7)
  0b11100000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 43: Channel 4 of sensor 3 configuration (part 1 0x4CF - 0x4E0 [excluding 0x4E1])
  0b10011001, // Register address high byte (0x04CF)
  0b11100000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (reusing data from sensor 1 channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)
  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)
  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)
  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)

  // Block 44: Channel 4 of sensor 3 configuration (part 2 0x4E1 - 0x4F0)
  0b10011100, // Register address high byte (0x04E1)
  0b00100000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 45: Channel 5 of sensor 3 configuration (part 1 0x509 - 0x51A [excluding 0x51B])
  0b10100001, // Register address high byte (0x0509)
  0b00100000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (reusing data from sensor 1 channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)
  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)
  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)
  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)

  // Block 46: Channel 5 of sensor 3 configuration (part 2 0x51B - 0x52A)
  0b10100011, // Register address high byte (0x051B)
  0b01100000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 47: Channel 6 of sensor 3 configuration (part 1 0x543 - 0x554 [excluding 0x555])
  0b10101000, // Register address high byte (0x0543)
  0b01100000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (reusing data from sensor 1 channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)
  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)
  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)
  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)

  // Block 48: Channel 6 of sensor 3 configuration (part 2 0x555 - 0x564)
  0b10101010, // Register address high byte (0x0555)
  0b10100000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 49: Channel 7 of sensor 3 configuration (part 1 0x57D - 0x58E [excluding 0x58F])
  0b10101111, // Register address high byte (0x057D)
  0b10100000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (reusing data from sensor 1 channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)
  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)
  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)
  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)

  // Block 50: Channel 7 of sensor 3 configuration (part 2 0x58F - 0x59E)
  0b10110001, // Register address high byte (0x058F)
  0b11100000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 51: Channel 8 of sensor 3 configuration (part 1 0x5B7 - 0x5C8 [excluding 0x5C9])
  0b10110110, // Register address high byte (0x05B7)
  0b11100000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (reusing data from sensor 1 channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)
  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)
  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)
  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)

  // Block 52: Channel 8 of sensor 3 configuration (part 2 0x5C9 - 0x5D8)
  0b10111001, // Register address high byte (0x05C9)
  0b00100000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 53: Sensor 4 configuration
  0b10111110, // Register address high byte (0x05F1)
  0b00100000 + 6, // Register address low byte + size (6 bytes total)

  // Register information (adjusted values for sensor 4)
  0b1111_1111, // Sampling channels (0xFF = all channels enabled)
  0x00,
  0x5A, // Boot time (0x005A = 90 seconds - fastest)
  0x00,
  0xAA, // Communication timeout (0x00AA = 170 seconds - shortest)
  200, // Communication retry count (200 retries - most aggressive)

  // Block 54: Channel 1 of sensor 4 configuration (part 1 0x60E - 0x61F [excluding 0x620])
  0b11000001, // Register address high byte (0x060E)
  0b11000000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (reusing data from sensor 1 channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)
  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)
  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)
  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)

  // Block 55: Channel 1 of sensor 4 configuration (part 2 0x620 - 0x62F)
  0b11000100, // Register address high byte (0x0620)
  0b00000000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 56: Channel 2 of sensor 4 configuration (part 1 0x648 - 0x659 [excluding 0x65A])
  0b11001001, // Register address high byte (0x0648)
  0b00000000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (reusing data from sensor 1 channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)
  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)
  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)
  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)

  // Block 57: Channel 2 of sensor 4 configuration (part 2 0x65A - 0x669)
  0b11001011, // Register address high byte (0x065A)
  0b01000000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 58: Channel 3 of sensor 4 configuration (part 1 0x682 - 0x693 [excluding 0x694])
  0b11010000, // Register address high byte (0x0682)
  0b01000000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (reusing data from sensor 1 channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)
  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)
  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)
  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)

  // Block 59: Channel 3 of sensor 4 configuration (part 2 0x694 - 0x6A3)
  0b11010010, // Register address high byte (0x0694)
  0b10000000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 60: Channel 4 of sensor 4 configuration (part 1 0x6BC - 0x6CD [excluding 0x6CE])
  0b11010111, // Register address high byte (0x06BC)
  0b10000000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (reusing data from sensor 1 channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)
  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)
  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)
  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)

  // Block 61: Channel 4 of sensor 4 configuration (part 2 0x6CE - 0x6DD)
  0b11011001, // Register address high byte (0x06CE)
  0b11000000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 62: Channel 5 of sensor 4 configuration (part 1 0x6F6 - 0x707 [excluding 0x708])
  0b11011110, // Register address high byte (0x06F6)
  0b11000000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (fast response config for sensor 4 channel 5)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x00,
  0x00,
  0x00, // Process alarm dead band (8.0 - tighter tolerance)
  0x40,
  0x40,
  0x00,
  0x00, // Low threshold alarm value (3.0 - higher minimum)
  0x40,
  0xE0,
  0x00,
  0x00, // High threshold alarm value (7.0 - lower maximum)
  0x3F,
  0x00,
  0x00,
  0x00, // Falling slope alarm (0.5/sec - very fast response)

  // Block 63: Channel 5 of sensor 4 configuration (part 2 0x708 - 0x717)
  0b11100001, // Register address high byte (0x0708)
  0b00000000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 64: Channel 6 of sensor 4 configuration (part 1 0x730 - 0x741 [excluding 0x742])
  0b11100110, // Register address high byte (0x0730)
  0b00000000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (reusing data from sensor 1 channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)
  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)
  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)
  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)

  // Block 65: Channel 6 of sensor 4 configuration (part 2 0x742 - 0x751)
  0b11101000, // Register address high byte (0x0742)
  0b01000000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 66: Channel 7 of sensor 4 configuration (part 1 0x76A - 0x77B [excluding 0x77C])
  0b11101101, // Register address high byte (0x076A)
  0b01000000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (reusing data from sensor 1 channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)
  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)
  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)
  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)

  // Block 67: Channel 7 of sensor 4 configuration (part 2 0x77C - 0x78B)
  0b11101111, // Register address high byte (0x077C)
  0b10000000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)

  // Block 68: Channel 8 of sensor 4 configuration (part 1 0x7A4 - 0x7B5 [excluding 0x7B6])
  0b11110100, // Register address high byte (0x07A4)
  0b10000000 + 18, // Register address low byte + size (18 bytes total)

  // Register information (reusing data from sensor 1 channel 1)
  0b00000001, // Protocol data type 0x03 = TULIP scale (2500 - 12500)
  0b11111100, // enabled process alarms (all enabled)
  0x41,
  0x40,
  0x00,
  0x00, // Process alarm dead band (12.0)
  0x3F,
  0x80,
  0x00,
  0x00, // Low threshold alarm value (1.0)
  0x41,
  0x10,
  0x00,
  0x00, // High threshold alarm value (9.0)
  0x3E,
  0x4C,
  0xCC,
  0xCC, // Falling slope alarm (0.2/sec)

  // Block 69: Channel 8 of sensor 4 configuration (part 2 0x7B6 - 0x7C5)
  0b11110110, // Register address high byte (0x07B6)
  0b11000000 + 16, // Register address low byte + size (16 bytes total)

  0x3E,
  0xB3,
  0x33,
  0x33, // Rising slope alarm (0.35/sec)
  0x3F,
  0xC0,
  0x00,
  0x00, // Low threshold alarm with delay value (1.5)
  0x01,
  0x0B, // Low threshold alarm with delay time (267 seconds)
  0x41,
  0x03,
  0xAE,
  0x14, // High threshold alarm with delay value (8.23)
  0x01,
  0x39, // High threshold alarm with delay time (313 seconds)
]
