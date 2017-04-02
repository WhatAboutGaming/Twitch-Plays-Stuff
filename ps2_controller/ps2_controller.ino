/*
  PS2 Controller for Arduino Mega2560 v1.1a by WhatAboutGaming
  For use in the Twitch.TV stream TwitchTriesToPlay.
  https://www.twitch.tv/twitchtriestoplay
  https://github.com/WhatAboutGaming/Twitch-Plays-Stuff

  Reference:
  https://gist.github.com/scanlime/5042071
  http://store.curiousinventor.com/guides/PS2/
  http://www.lynxmotion.com/images/files/ps2cmd01.txt
*/

//  Todo: Add command to send Neutral controller data and reset controller inputs
//  Send Neutral Controller data periodically (500ms, maybe?) when there's no input running

#define axisLx 2
#define axisLy 3
#define axisRy 4
#define axisRx 5
#define buttonDDown 6
#define buttonDLeft 7

#define buttonL1 8
#define buttonL2 9
#define buttonSelect 10
#define buttonAnalog 11
#define buttonStart 12
#define buttonR1 13

#define buttonDUp 22
#define buttonDRight 23
#define buttonSquare 24
#define buttonR2 25
#define buttonTriangle 26
#define buttonCircle 27

#define buttonCross 28
#define buttonR3 29
#define buttonL3 30

#define leftMotor A0
#define rightMotor A1
#define analogLed A2

#define attentionPin A3

boolean isInputting = false;
boolean isInputtingDelayed = false;
boolean sentPing = false;
boolean sentPong = false;
boolean isConnected = false;

unsigned long inputDelay = 0;
unsigned long previousInputDelay = 0;
unsigned long currentMillis = 0;

unsigned long pingTimeOut = 0;
unsigned long pongTimeOut = 0;
unsigned long pingTimeIn = 0;
unsigned long pongTimeIn = 0;
unsigned long pingDelay = 500;
unsigned long pongDelay = 1000;
unsigned long previousCalc = 0;
unsigned long calcDelay = 1000;
unsigned long previousPingDelay = 0;
unsigned long previousPongDelay = 0;
unsigned long lastPingIn = 0;
unsigned long lastPongIn = 0;
unsigned long lastPingOut = 0;
unsigned long lastPongOut = 0;
unsigned long calcPingTimestampIn = 0;
unsigned long calcPongTimestampIn = 0;
unsigned long calcPingTimestampOut = 0;
unsigned long calcPongTimestampOut = 0;

unsigned long resetControllerDataDelay = 500;
unsigned long previousResetControllerDataDelay = 0;

unsigned int leftMotorVal = 0;
unsigned int rightMotorVal = 0;
unsigned int analogLedVal = 0;

unsigned int attentionLevel = 0;
unsigned int previousAttentionLevel = 0;
unsigned long attentionLevelLow = 0;
unsigned long attentionLevelHigh = 0;
unsigned long previousAttentionLevelHigh = 0;
unsigned long previousAttentionLevelLow = 0;

unsigned int leftMotorLevel = 0;
unsigned int previousLeftMotorLevel = 0;
unsigned long leftMotorLevelLow = 0;
unsigned long leftMotorLevelHigh = 0;
unsigned long previousLeftMotorLevelHigh = 0;
unsigned long previousLeftMotorLevelLow = 0;

unsigned int rightMotorLevel = 0;
unsigned int previousRightMotorLevel = 0;
unsigned long rightMotorLevelLow = 0;
unsigned long rightMotorLevelHigh = 0;
unsigned long previousRightMotorLevelHigh = 0;
unsigned long previousRightMotorLevelLow = 0;

unsigned int analogLedLevel = 0;
unsigned int previousAnalogLedLevel = 0;
unsigned long analogLedLevelLow = 0;
unsigned long analogLedLevelHigh = 0;
unsigned long previousAnalogLedLevelHigh = 0;
unsigned long previousAnalogLedLevelLow = 0;

unsigned long resetCalled = 0;
unsigned long resetDone = 0;

unsigned long disconnectCalled = 0;
unsigned long disconnectDone = 0;

unsigned long baudRate = 115200;

byte serial_rx_buffer[12];
byte serial_rx_buffer_inverted[12];
byte serial_rx_buffer_controller[12];
byte serial_rx_buffer_ping_in[12];
byte serial_rx_buffer_ping_out[12];
byte serial_rx_buffer_pong_in[12];
byte serial_rx_buffer_pong_out[12];
byte serial_rx_buffer_motor[12];
byte serial_rx_buffer_reset[12];
byte serial_rx_buffer_disconnect[12];
byte serial_rx_buffer_inverted_controller[12];
byte serial_rx_buffer_invalid_command[12];
byte serial_rx_buffer_reset_controller[12];
unsigned long serial_rx_buffer_counter = 0;
unsigned long controller = 0;

//  The array below is an array of all buttons in the order the bytes have to be sent
unsigned int commandArray[] = {buttonSelect, buttonL3, buttonR3, buttonStart, buttonDUp, buttonDRight, buttonDDown, buttonDLeft, buttonL2, buttonR2, buttonL1, buttonR1, buttonTriangle, buttonCircle, buttonCross, buttonSquare, axisRx, axisRy, axisLx, axisLy, buttonAnalog};
unsigned int motorArray[] = {leftMotor, rightMotor, analogLed};

void setup() {
  currentMillis = millis();
  Serial.begin(baudRate);
  isConnected = false;
  disconnectCalled = currentMillis;
  serial_rx_buffer_disconnect[8] = (byte)((disconnectCalled & 0xFF));
  serial_rx_buffer_disconnect[7] = (byte)((disconnectCalled >> 8) & 0xFF);
  serial_rx_buffer_disconnect[6] = (byte)((disconnectCalled >> 16) & 0xFF);
  serial_rx_buffer_disconnect[5] = (byte)((disconnectCalled >> 24) & 0xFF);
  //Serial.println(disconnectCalled);
  //Serial.println("DISCONNECTING...");
  serial_rx_buffer_disconnect[0] = 0x0A;
  serial_rx_buffer_disconnect[11] = 0x0A;
  // Send Disconnect command to tell the computer to wait before sending any commands back to the Arduino
  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_disconnect); serial_rx_buffer_counter++) {
    Serial.write(serial_rx_buffer_disconnect[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
  }
  Serial.flush();
  //Serial.println("START OF SETUP");

  //  Define buttons and axis to neutral state on startup
  pinMode(axisLx, OUTPUT);
  pinMode(axisLy, OUTPUT);
  pinMode(axisRy, OUTPUT);
  pinMode(axisRx, OUTPUT);
  pinMode(buttonDDown, OUTPUT);
  pinMode(buttonDLeft, OUTPUT);

  pinMode(buttonL1, OUTPUT);
  pinMode(buttonL2, OUTPUT);
  pinMode(buttonSelect, OUTPUT);
  pinMode(buttonAnalog, OUTPUT);
  pinMode(buttonStart, OUTPUT);
  pinMode(buttonR1, OUTPUT);

  pinMode(buttonDUp, OUTPUT);
  pinMode(buttonDRight, OUTPUT);
  pinMode(buttonSquare, OUTPUT);
  pinMode(buttonR2, OUTPUT);
  pinMode(buttonTriangle, OUTPUT);
  pinMode(buttonCircle, OUTPUT);

  pinMode(buttonCross, OUTPUT);
  pinMode(buttonR3, OUTPUT);
  pinMode(buttonL3, OUTPUT);

  pinMode(leftMotor, INPUT);
  pinMode(rightMotor, INPUT);
  pinMode(analogLed, INPUT);

  digitalWrite(buttonSelect, HIGH);
  digitalWrite(buttonL3, HIGH);
  digitalWrite(buttonR3, HIGH);
  digitalWrite(buttonStart, HIGH);
  digitalWrite(buttonDUp, HIGH);
  digitalWrite(buttonDRight, HIGH);
  digitalWrite(buttonDDown, HIGH);
  digitalWrite(buttonDLeft, HIGH);

  digitalWrite(buttonL2, HIGH);
  digitalWrite(buttonR2, HIGH);
  digitalWrite(buttonL1, HIGH);
  digitalWrite(buttonR1, HIGH);
  digitalWrite(buttonTriangle, HIGH);
  digitalWrite(buttonCircle, HIGH);
  digitalWrite(buttonCross, HIGH);
  digitalWrite(buttonSquare, HIGH);

  analogWrite(axisRx, 128);
  analogWrite(axisRy, 128);
  analogWrite(axisLx, 128);
  analogWrite(axisLy, 128);

  digitalWrite(buttonAnalog, HIGH);

  //  Define Input pins for motors and analog LED
  pinMode(leftMotor, INPUT);
  pinMode(rightMotor, INPUT);
  pinMode(analogLed, INPUT);

  pinMode(attentionPin, INPUT);

  //  Prepare data to sent on startup as a way to tell the controller is in Neutral position
  //  That means, when all buttons and analog sticks are reset to their Neutral positions
  serial_rx_buffer_controller[0] = 0x01; //  Preamble
  serial_rx_buffer_controller[1] = 0x00; //  SELECT, L3, R3, START, DUP, DRIGHT, DDOWN, DLEFT
  serial_rx_buffer_controller[2] = 0x00; //  L2, R2, L1, R1, Triangle/Delta, Circle/O, Cross/X, Square
  serial_rx_buffer_controller[3] = 0x7F; //  RX
  serial_rx_buffer_controller[4] = 0x7F; //  RY
  serial_rx_buffer_controller[5] = 0x7F; //  LX
  serial_rx_buffer_controller[6] = 0x7F; //  LY
  serial_rx_buffer_controller[7] = 0x00; //  Analog button (Used to change between Digital and Analog modes in older games), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
  serial_rx_buffer_controller[8] = 0x00; //  Unused
  serial_rx_buffer_controller[9] = 0x00; //  Delay Byte 2
  serial_rx_buffer_controller[10] = 0x00; // Delay Byte 1
  serial_rx_buffer_controller[11] = 0x01; // Postamble

  resetCalled = currentMillis;
  serial_rx_buffer_reset[8] = (byte)((resetCalled & 0xFF));
  serial_rx_buffer_reset[7] = (byte)((resetCalled >> 8) & 0xFF);
  serial_rx_buffer_reset[6] = (byte)((resetCalled >> 16) & 0xFF);
  serial_rx_buffer_reset[5] = (byte)((resetCalled >> 24) & 0xFF);
  serial_rx_buffer_reset[0] = 0xA0;
  serial_rx_buffer_reset[11] = 0xA0;
  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_reset); serial_rx_buffer_counter++) {
    Serial.write(serial_rx_buffer_reset[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
  }
  Serial.flush();

  delay(2500); // Wait 2.5 seconds for the serial program on the computer to startup before sending any data

  resetDone = currentMillis;
  serial_rx_buffer_reset[0] = 0xA1;
  serial_rx_buffer_reset[11] = 0xA1;
  serial_rx_buffer_reset[8] = (byte)((resetDone & 0xFF));
  serial_rx_buffer_reset[7] = (byte)((resetDone >> 8) & 0xFF);
  serial_rx_buffer_reset[6] = (byte)((resetDone >> 16) & 0xFF);
  serial_rx_buffer_reset[5] = (byte)((resetDone >> 24) & 0xFF);
  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_reset); serial_rx_buffer_counter++) {
    Serial.write(serial_rx_buffer_reset[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
  }
  Serial.flush();

  serial_rx_buffer_disconnect[0] = 0x0B;
  serial_rx_buffer_disconnect[11] = 0x0B;
  isConnected = true;
  disconnectDone = currentMillis;
  serial_rx_buffer_disconnect[8] = (byte)((disconnectDone & 0xFF));
  serial_rx_buffer_disconnect[7] = (byte)((disconnectDone >> 8) & 0xFF);
  serial_rx_buffer_disconnect[6] = (byte)((disconnectDone >> 16) & 0xFF);
  serial_rx_buffer_disconnect[5] = (byte)((disconnectDone >> 24) & 0xFF);
  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_disconnect); serial_rx_buffer_counter++) {
    Serial.write(serial_rx_buffer_disconnect[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
  }
  Serial.flush();
  //  Count bytes and parse ASCII values to their respective commands, such as buttons and axis
  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer); serial_rx_buffer_counter++) {
    Serial.write(serial_rx_buffer_controller[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
    serial_rx_buffer_inverted_controller[serial_rx_buffer_counter] = (255 - serial_rx_buffer_controller[serial_rx_buffer_counter]); //  Invert 0 to 255 and vice versa to make it easier to determine which commands to enable or not, and their values
  }
  Serial.flush();
  //  Now we send PING to the computer as a way to tell we are connected and ready to receive and send data through the serial port
  //  This will be executed whenever the computer starts serial through the Processing Serial Library, which forces the Arduino to reset, due to DTR line (Data Terminal Ready)
  pingTimeOut = currentMillis;
  serial_rx_buffer_ping_out[8] = (byte)((pingTimeOut & 0xFF));
  serial_rx_buffer_ping_out[7] = (byte)((pingTimeOut >> 8) & 0xFF);
  serial_rx_buffer_ping_out[6] = (byte)((pingTimeOut >> 16) & 0xFF);
  serial_rx_buffer_ping_out[5] = (byte)((pingTimeOut >> 24) & 0xFF);
  sentPing = false;
  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_ping_out); serial_rx_buffer_counter++) {
    if (serial_rx_buffer_counter == 0) {
      Serial.write(0x03);
    }
    if ((serial_rx_buffer_counter == 1) || (serial_rx_buffer_counter == 2) || (serial_rx_buffer_counter == 3) || (serial_rx_buffer_counter == 4)) {
      Serial.write(0x00);
    }
    if ((serial_rx_buffer_counter == 5) || (serial_rx_buffer_counter == 6) || (serial_rx_buffer_counter == 7) || (serial_rx_buffer_counter == 8)) {
      Serial.write(serial_rx_buffer_ping_out[serial_rx_buffer_counter]);
    }
    if ((serial_rx_buffer_counter == 9) || (serial_rx_buffer_counter == 10)) {
      Serial.write(0x00);
    }
    if (serial_rx_buffer_counter == 11) {
      Serial.write(0x03);
    }
    sentPing = true;
  }
  sentPing = false;
  Serial.flush();
  sendPing();
  calculatePing();
  calculatePong();
  getAttention();
  readMotors();
  //Serial.println("END OF SETUP");
  //  And we are ready to go
}

void loop() {
  currentMillis = millis();
  //  Get data from Serial Port
  //  Preamble/Postamble = 0x01 for Controller Input // Does the Arduino have to respond with a different Preamble/Postamble value when it receives a valid Controller Input Data?
  //  Preamble/Postamble = Send 0x02 to Arduino for Motors and Analog Status
  //  Preamble/Postamble = Arduino responds with 0x06 for Motors and Analog Status, when Preamble/Postamble = 0x02
  //  Preamble/Postamble = 0x07 for Motors and Analog Status, when Attention Pin is LOW
  //  Preamble/Postamble = 0x08 for Motors and Analog Status, when Attention Pin is HIGH

  //  Preamble/Postamble = 0x03 for PING for BOTH ways
  //  PING/PONG System where PING is sent from the Arduino and PONG is sent from the Computer:
  //  Where ">>" is incoming data and "<<" is outgoing data
  //  << PING 3000  // This is data sent from the Arduino
  //  >> PONG 3000  // This is data the Arduino received

  //  Preamble/Postamble = 0x04 for PING for BOTH ways
  //  PING/PONG System where PING is sent from the Arduino and PONG is sent from the Computer:
  //  Where ">>" is incoming data and "<<" is outgoing data
  //  << PING 3000  // This is data sent from the Arduino
  //  >> PONG 3000  // This is data the Arduino received

  //  Preamble/Postamble = 0x05 for PONG for BOTH ways
  //  NOTE: This is used for testing purposes!
  //  PING/PONG System where PING is sent from the Computer and PONG is sent from the Arduino:
  //  Where ">>" is incoming data and "<<" is outgoing data
  //  << PONG (0x04) 3000  // This is data sent from the Arduino
  //  >> PONG (0x05) 3000  // This is data the Arduino received

  //  NOTE: This is in no way supposed to represent actual communication, it's only a way to making visualizing data traffic more easily

  //  Preamble/Postamble = 0xA0 for Soft Reset the Arduino without resetting Variables
  //  Preamble/Postamble = 0xA1 for Command that tells the computer the Reset command 0xA0 was understood by the Arduino

  //  Preamble/Postamble = 0x09 for Disconnect
  //  Preamble/Postamble = 0x0A for Disconnect Understood
  //  Preamble/Postamble = 0x0B for Reconnect Successful
  //  Example:
  //  Arduino sends Disconnect to the computer in case of PING timeout (The Computer didn't respond with PONG in time)
  //  The computer then sends Disconnect Understood back to the Arduino, both close connections on their ends, then start connection again
  //  The Arduino then sends Reconnect Successful to tell the computer Connection is working as intended
  //  Or:
  //  Computer sends Disconnect to the Arduino in case of PING timeout (The Arduino didn't respond with PONG in time)
  //  The Arduino then sends Disconnect Understood back to the Computer, both close connections on their ends, then start connection again
  //  The Computer then sends Reconnect Successful to tell the Arduino Connection is working as intended

  //  Preamble/Postamble = 0x0C for Reset Controller Data
  //  This is used when the computer requests Arduino to reset Controller data, Arduino then responds back with a 0x01 Controller Data Command.

  //  Preamble/Postamble = 0x0D for Invalid Data
  //  When the computer or another host sends an invalid Preamble and Postamble comibination, the Arduino responds with 0x0D Preamble and Postamble bytes,
  //  and adds the Invalid Preamble and Postamble bytes to the 7th and 8th byte of the Invalid Command 0x0D Command.
  if (Serial.available() > 0) {

    controller = Serial.readBytes(serial_rx_buffer, sizeof(serial_rx_buffer)) && 0xFF;

    //  Set Start Byte (Preamble Byte) and End Byte (Postamble Byte)
    //  1 == 0x01
    if ((serial_rx_buffer[0] == 0x01) && (serial_rx_buffer[11] == 0x01)) {

      //  Count bytes and parse ASCII values to their respective commands, such as buttons and axis
      for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer); serial_rx_buffer_counter++) {
        Serial.write(serial_rx_buffer[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
        //  Invert 0 to 255 and vice versa to make it easier to determine which commands to enable or not, and their values
        serial_rx_buffer_inverted[serial_rx_buffer_counter] = (255 - serial_rx_buffer[serial_rx_buffer_counter]);
        serial_rx_buffer_controller[serial_rx_buffer_counter] = serial_rx_buffer[serial_rx_buffer_counter];
        serial_rx_buffer_inverted_controller[serial_rx_buffer_counter] = (255 - serial_rx_buffer_controller[serial_rx_buffer_counter]);
      }
      //Serial.print('\n');
      Serial.flush();
      // Make the button presses actually work
      isInputting = true;
      previousInputDelay = currentMillis;
    }
    //  Get Motors and Analog status
    else if ((serial_rx_buffer[0] == 0x02) && (serial_rx_buffer[11] == 0x02)) {
      for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer); serial_rx_buffer_counter++) {
        Serial.write(serial_rx_buffer[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
        serial_rx_buffer_motor[serial_rx_buffer_counter] = serial_rx_buffer[serial_rx_buffer_counter];
      }
      Serial.flush();
      readMotors();
    }
    //  Get PING/PONG status
    else if ((serial_rx_buffer[0] == 0x03) && (serial_rx_buffer[11] == 0x03)) {
      //  Get PING status
      for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_ping_in); serial_rx_buffer_counter++) {
        //  Pass Serial Buffer to Ping Input Buffer
        serial_rx_buffer_ping_in[serial_rx_buffer_counter] = serial_rx_buffer[serial_rx_buffer_counter];
      }
      getPing();
    }
    else if ((serial_rx_buffer[0] == 0x04) && (serial_rx_buffer[11] == 0x04)) {
      //  Get PONG status
      for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_pong_in); serial_rx_buffer_counter++) {
        //  Pass Serial Buffer to Pong Input Buffer
        serial_rx_buffer_pong_in[serial_rx_buffer_counter] = serial_rx_buffer[serial_rx_buffer_counter];
      }
      getPong();
    }
    else if ((serial_rx_buffer[0] == 0xA0) && (serial_rx_buffer[11] == 0xA0)) {
      // Reset Arduino without reseting Variables
      for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_reset); serial_rx_buffer_counter++) {
        //  Pass Serial Buffer to Reset Buffer
        serial_rx_buffer_reset[serial_rx_buffer_counter] = serial_rx_buffer[serial_rx_buffer_counter];
      }
      arduinoReset();
    }
    else if ((serial_rx_buffer[0] == 0x09) && (serial_rx_buffer[11] == 0x09)) {
      // Disconnect Arduino
      for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_disconnect); serial_rx_buffer_counter++) {
        //  Pass Serial Buffer to Reset Controller Buffer
        serial_rx_buffer_disconnect[serial_rx_buffer_counter] = serial_rx_buffer[serial_rx_buffer_counter];
      }
      arduinoDisconnect();
    }
    else if ((serial_rx_buffer[0] == 0x0C) && (serial_rx_buffer[11] == 0x0C)) {
      // Reset Controller Data
      for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_reset_controller); serial_rx_buffer_counter++) {
        //  Pass Serial Buffer to Reset Controller Data Buffer
        serial_rx_buffer_reset_controller[serial_rx_buffer_counter] = serial_rx_buffer[serial_rx_buffer_counter];
        Serial.write(serial_rx_buffer_reset_controller[serial_rx_buffer_counter]);
      }
      Serial.flush();
      manualResetControllerData();
    }
    //  Get Invalid Command
    else if ((((serial_rx_buffer[0] < 0x01) || (serial_rx_buffer[0] > 0x0C)) && ((serial_rx_buffer[11] < 0x01) || (serial_rx_buffer[11] > 0x0C))) && (((serial_rx_buffer[0] != 0xA0) && (serial_rx_buffer[0] != 0xA1)) && ((serial_rx_buffer[11] != 0xA0) && (serial_rx_buffer[11] != 0xA1)))) {
      for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_invalid_command); serial_rx_buffer_counter++) {
        //  Pass Serial Buffer to Reset Controller Data Buffer
        serial_rx_buffer_invalid_command[serial_rx_buffer_counter] = serial_rx_buffer[serial_rx_buffer_counter];
        Serial.write(serial_rx_buffer_invalid_command[serial_rx_buffer_counter]);
      }
      Serial.flush();
      getInvalidCommand();
    }
    //  Respond as invalid command when Preamble and Postamble are different
    else if (serial_rx_buffer[0] != serial_rx_buffer[11]) {
      for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_invalid_command); serial_rx_buffer_counter++) {
        //  Pass Serial Buffer to Reset Controller Data Buffer
        serial_rx_buffer_invalid_command[serial_rx_buffer_counter] = serial_rx_buffer[serial_rx_buffer_counter];
        Serial.write(serial_rx_buffer_invalid_command[serial_rx_buffer_counter]);
      }
      Serial.flush();
      getInvalidCommand();
    }
  }
  pressButtons();
  sendPing();
  calculatePing();
  calculatePong();
  getAttention();
  autoResetControllerData();
} // Close Loop Function

void getInvalidCommand() {
  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_invalid_command); serial_rx_buffer_counter++) {
    //  Pass Serial Buffer to Reset Controller Data Buffer
    if ((serial_rx_buffer_counter == 0) || (serial_rx_buffer_counter == 11)) {
      //serial_rx_buffer_invalid_command[serial_rx_buffer_counter] = 0x0D;
      Serial.write(0x0D); // Preamble and Postamble to respond as Invalid Command
    }
    if ((serial_rx_buffer_counter >= 1) && (serial_rx_buffer_counter <= 6)) {
      //serial_rx_buffer_invalid_command[serial_rx_buffer_counter] = 0x00;
      Serial.write(0x00); // Reset these to 0
    }
    if (serial_rx_buffer_counter == 7) {
      //serial_rx_buffer_invalid_command[serial_rx_buffer_counter] = 0x00;
      Serial.write(serial_rx_buffer_invalid_command[0]); // Invalid Preamble Byte to Store
    }
    if (serial_rx_buffer_counter == 8) {
      //serial_rx_buffer_invalid_command[serial_rx_buffer_counter] = 0x00;
      Serial.write(serial_rx_buffer_invalid_command[11]); // Invalid Postamble Byte to Store
    }
    if ((serial_rx_buffer_counter == 9) || (serial_rx_buffer_counter == 10)) {
      //serial_rx_buffer_invalid_command[serial_rx_buffer_counter] = 0x0D;
      Serial.write(0x00); // Reset these to 0
    }
  }
  Serial.flush();
  //Serial.println("INVALID COMMAND");
  //Serial.flush();
}

void arduinoDisconnect() {
  disconnectCalled = currentMillis;

  //  Before disconnecting, we need to reset all Command status, and tell the computer they were reset
  serial_rx_buffer_controller[0] = 0x01; //  Preamble
  serial_rx_buffer_controller[1] = 0x00; //  SELECT, L3, R3, START, DUP, DRIGHT, DDOWN, DLEFT
  serial_rx_buffer_controller[2] = 0x00; //  L2, R2, L1, R1, Triangle/Delta, Circle/O, Cross/X, Square
  serial_rx_buffer_controller[3] = 0x7F; //  RX
  serial_rx_buffer_controller[4] = 0x7F; //  RY
  serial_rx_buffer_controller[5] = 0x7F; //  LX
  serial_rx_buffer_controller[6] = 0x7F; //  LY
  serial_rx_buffer_controller[7] = 0x00; //  Analog button (Used to change between Digital and Analog modes in older games), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
  serial_rx_buffer_controller[8] = 0x00; //  Unused
  serial_rx_buffer_controller[9] = 0x00; //  Delay Byte 2
  serial_rx_buffer_controller[10] = 0x00; // Delay Byte 1
  serial_rx_buffer_controller[11] = 0x01; // Postamble

  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer); serial_rx_buffer_counter++) {
    Serial.write(serial_rx_buffer_controller[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
    serial_rx_buffer_inverted_controller[serial_rx_buffer_counter] = (255 - serial_rx_buffer_controller[serial_rx_buffer_counter]); //  Invert 0 to 255 and vice versa to make it easier to determine which commands to enable or not, and their values
  }

  //  First 8 buttons, Buffer Array Element 1
  //  SELECT, L3, R3, START, DUP, DRIGHT, DDOWN, DLEFT
  digitalWrite(commandArray[0], (serial_rx_buffer_inverted_controller[1] & B00000001));
  digitalWrite(commandArray[1], (serial_rx_buffer_inverted_controller[1] & B00000010));
  digitalWrite(commandArray[2], (serial_rx_buffer_inverted_controller[1] & B00000100));
  digitalWrite(commandArray[3], (serial_rx_buffer_inverted_controller[1] & B00001000));
  digitalWrite(commandArray[4], (serial_rx_buffer_inverted_controller[1] & B00010000));
  digitalWrite(commandArray[5], (serial_rx_buffer_inverted_controller[1] & B00100000));
  digitalWrite(commandArray[6], (serial_rx_buffer_inverted_controller[1] & B01000000));
  digitalWrite(commandArray[7], (serial_rx_buffer_inverted_controller[1] & B10000000));

  //  Second 8 buttons, Buffer Array Element 2
  //  L2, R2, L1, R1, Triangle/Delta, Circle/O, Cross/X, Square
  digitalWrite(commandArray[8], (serial_rx_buffer_inverted_controller[2] & B00000001));
  digitalWrite(commandArray[9], (serial_rx_buffer_inverted_controller[2] & B00000010));
  digitalWrite(commandArray[10], (serial_rx_buffer_inverted_controller[2] & B00000100));
  digitalWrite(commandArray[11], (serial_rx_buffer_inverted_controller[2] & B00001000));
  digitalWrite(commandArray[12], (serial_rx_buffer_inverted_controller[2] & B00010000));
  digitalWrite(commandArray[13], (serial_rx_buffer_inverted_controller[2] & B00100000));
  digitalWrite(commandArray[14], (serial_rx_buffer_inverted_controller[2] & B01000000));
  digitalWrite(commandArray[15], (serial_rx_buffer_inverted_controller[2] & B10000000));

  //  4 Axis, Buffer Array Elements 3, 4, 5, 6
  //  RX, RY, LX, LY
  analogWrite(commandArray[16], serial_rx_buffer_inverted_controller[3]);
  analogWrite(commandArray[17], serial_rx_buffer_inverted_controller[4]);
  analogWrite(commandArray[18], serial_rx_buffer_inverted_controller[5]);
  analogWrite(commandArray[19], serial_rx_buffer_inverted_controller[6]);

  //  Analog button (Used to change between Digital and Analog modes in older games), Buffer Array Element 7
  //  All other bits in this Buffer Array Element are unused
  digitalWrite(commandArray[20], (serial_rx_buffer_inverted_controller[7] & B00000001));

  //  Buffer Array Element 8 is unused in this code, but is existing in case changes are needed
  Serial.flush();

  //  Tell the computer the connection is about to be closed
  serial_rx_buffer_disconnect[8] = (byte)((disconnectCalled & 0xFF));
  serial_rx_buffer_disconnect[7] = (byte)((disconnectCalled >> 8) & 0xFF);
  serial_rx_buffer_disconnect[6] = (byte)((disconnectCalled >> 16) & 0xFF);
  serial_rx_buffer_disconnect[5] = (byte)((disconnectCalled >> 24) & 0xFF);
  //Serial.println(disconnectCalled);
  //Serial.println("DISCONNECTING...");
  serial_rx_buffer_disconnect[0] = 0x0A;
  serial_rx_buffer_disconnect[11] = 0x0A;
  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_disconnect); serial_rx_buffer_counter++) {
    Serial.write(serial_rx_buffer_disconnect[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
  }
  Serial.flush();
  Serial.end();
  isConnected = false;
  serial_rx_buffer_disconnect[8] = (byte)((disconnectDone & 0xFF));
  serial_rx_buffer_disconnect[7] = (byte)((disconnectDone >> 8) & 0xFF);
  serial_rx_buffer_disconnect[6] = (byte)((disconnectDone >> 16) & 0xFF);
  serial_rx_buffer_disconnect[5] = (byte)((disconnectDone >> 24) & 0xFF);
  delay(2500); // Wait 2.5 seconds before reconnecting
  //  Tell the computer the connection has began succesfully
  isConnected = true;
  disconnectDone = currentMillis;
  Serial.begin(baudRate);
  serial_rx_buffer_disconnect[0] = 0x0B;
  serial_rx_buffer_disconnect[11] = 0x0B;
  isConnected = true;
  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_disconnect); serial_rx_buffer_counter++) {
    Serial.write(serial_rx_buffer_disconnect[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
  }
  Serial.flush();

  //  Reset all Commands status just to make sure everything is working as intended
  serial_rx_buffer_controller[0] = 0x01; //  Preamble
  serial_rx_buffer_controller[1] = 0x00; //  SELECT, L3, R3, START, DUP, DRIGHT, DDOWN, DLEFT
  serial_rx_buffer_controller[2] = 0x00; //  L2, R2, L1, R1, Triangle/Delta, Circle/O, Cross/X, Square
  serial_rx_buffer_controller[3] = 0x7F; //  RX
  serial_rx_buffer_controller[4] = 0x7F; //  RY
  serial_rx_buffer_controller[5] = 0x7F; //  LX
  serial_rx_buffer_controller[6] = 0x7F; //  LY
  serial_rx_buffer_controller[7] = 0x00; //  Analog button (Used to change between Digital and Analog modes in older games), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
  serial_rx_buffer_controller[8] = 0x00; //  Unused
  serial_rx_buffer_controller[9] = 0x00; //  Delay Byte 2
  serial_rx_buffer_controller[10] = 0x00; // Delay Byte 1
  serial_rx_buffer_controller[11] = 0x01; // Postamble

  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer); serial_rx_buffer_counter++) {
    Serial.write(serial_rx_buffer_controller[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
    serial_rx_buffer_inverted_controller[serial_rx_buffer_counter] = (255 - serial_rx_buffer_controller[serial_rx_buffer_counter]); //  Invert 0 to 255 and vice versa to make it easier to determine which commands to enable or not, and their values
  }

  //  First 8 buttons, Buffer Array Element 1
  //  SELECT, L3, R3, START, DUP, DRIGHT, DDOWN, DLEFT
  digitalWrite(commandArray[0], (serial_rx_buffer_inverted_controller[1] & B00000001));
  digitalWrite(commandArray[1], (serial_rx_buffer_inverted_controller[1] & B00000010));
  digitalWrite(commandArray[2], (serial_rx_buffer_inverted_controller[1] & B00000100));
  digitalWrite(commandArray[3], (serial_rx_buffer_inverted_controller[1] & B00001000));
  digitalWrite(commandArray[4], (serial_rx_buffer_inverted_controller[1] & B00010000));
  digitalWrite(commandArray[5], (serial_rx_buffer_inverted_controller[1] & B00100000));
  digitalWrite(commandArray[6], (serial_rx_buffer_inverted_controller[1] & B01000000));
  digitalWrite(commandArray[7], (serial_rx_buffer_inverted_controller[1] & B10000000));

  //  Second 8 buttons, Buffer Array Element 2
  //  L2, R2, L1, R1, Triangle/Delta, Circle/O, Cross/X, Square
  digitalWrite(commandArray[8], (serial_rx_buffer_inverted_controller[2] & B00000001));
  digitalWrite(commandArray[9], (serial_rx_buffer_inverted_controller[2] & B00000010));
  digitalWrite(commandArray[10], (serial_rx_buffer_inverted_controller[2] & B00000100));
  digitalWrite(commandArray[11], (serial_rx_buffer_inverted_controller[2] & B00001000));
  digitalWrite(commandArray[12], (serial_rx_buffer_inverted_controller[2] & B00010000));
  digitalWrite(commandArray[13], (serial_rx_buffer_inverted_controller[2] & B00100000));
  digitalWrite(commandArray[14], (serial_rx_buffer_inverted_controller[2] & B01000000));
  digitalWrite(commandArray[15], (serial_rx_buffer_inverted_controller[2] & B10000000));

  //  4 Axis, Buffer Array Elements 3, 4, 5, 6
  //  RX, RY, LX, LY
  analogWrite(commandArray[16], serial_rx_buffer_inverted_controller[3]);
  analogWrite(commandArray[17], serial_rx_buffer_inverted_controller[4]);
  analogWrite(commandArray[18], serial_rx_buffer_inverted_controller[5]);
  analogWrite(commandArray[19], serial_rx_buffer_inverted_controller[6]);

  //  Analog button (Used to change between Digital and Analog modes in older games), Buffer Array Element 7
  //  All other bits in this Buffer Array Element are unused
  digitalWrite(commandArray[20], (serial_rx_buffer_inverted_controller[7] & B00000001));

  //  Buffer Array Element 8 is unused in this code, but is existing in case changes are needed
  Serial.flush();

  //Serial.println("RECONNECTED!");
  //Serial.println(disconnectDone);
}

void arduinoReset() {
  resetCalled = currentMillis;

  //  Before resetting, we need to reset all Command status, and tell the computer they were reset
  serial_rx_buffer_controller[0] = 0x01; //  Preamble
  serial_rx_buffer_controller[1] = 0x00; //  SELECT, L3, R3, START, DUP, DRIGHT, DDOWN, DLEFT
  serial_rx_buffer_controller[2] = 0x00; //  L2, R2, L1, R1, Triangle/Delta, Circle/O, Cross/X, Square
  serial_rx_buffer_controller[3] = 0x7F; //  RX
  serial_rx_buffer_controller[4] = 0x7F; //  RY
  serial_rx_buffer_controller[5] = 0x7F; //  LX
  serial_rx_buffer_controller[6] = 0x7F; //  LY
  serial_rx_buffer_controller[7] = 0x00; //  Analog button (Used to change between Digital and Analog modes in older games), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
  serial_rx_buffer_controller[8] = 0x00; //  Unused
  serial_rx_buffer_controller[9] = 0x00; //  Delay Byte 2
  serial_rx_buffer_controller[10] = 0x00; // Delay Byte 1
  serial_rx_buffer_controller[11] = 0x01; // Postamble

  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer); serial_rx_buffer_counter++) {
    Serial.write(serial_rx_buffer_controller[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
    serial_rx_buffer_inverted_controller[serial_rx_buffer_counter] = (255 - serial_rx_buffer_controller[serial_rx_buffer_counter]); //  Invert 0 to 255 and vice versa to make it easier to determine which commands to enable or not, and their values
  }

  //  First 8 buttons, Buffer Array Element 1
  //  SELECT, L3, R3, START, DUP, DRIGHT, DDOWN, DLEFT
  digitalWrite(commandArray[0], (serial_rx_buffer_inverted_controller[1] & B00000001));
  digitalWrite(commandArray[1], (serial_rx_buffer_inverted_controller[1] & B00000010));
  digitalWrite(commandArray[2], (serial_rx_buffer_inverted_controller[1] & B00000100));
  digitalWrite(commandArray[3], (serial_rx_buffer_inverted_controller[1] & B00001000));
  digitalWrite(commandArray[4], (serial_rx_buffer_inverted_controller[1] & B00010000));
  digitalWrite(commandArray[5], (serial_rx_buffer_inverted_controller[1] & B00100000));
  digitalWrite(commandArray[6], (serial_rx_buffer_inverted_controller[1] & B01000000));
  digitalWrite(commandArray[7], (serial_rx_buffer_inverted_controller[1] & B10000000));

  //  Second 8 buttons, Buffer Array Element 2
  //  L2, R2, L1, R1, Triangle/Delta, Circle/O, Cross/X, Square
  digitalWrite(commandArray[8], (serial_rx_buffer_inverted_controller[2] & B00000001));
  digitalWrite(commandArray[9], (serial_rx_buffer_inverted_controller[2] & B00000010));
  digitalWrite(commandArray[10], (serial_rx_buffer_inverted_controller[2] & B00000100));
  digitalWrite(commandArray[11], (serial_rx_buffer_inverted_controller[2] & B00001000));
  digitalWrite(commandArray[12], (serial_rx_buffer_inverted_controller[2] & B00010000));
  digitalWrite(commandArray[13], (serial_rx_buffer_inverted_controller[2] & B00100000));
  digitalWrite(commandArray[14], (serial_rx_buffer_inverted_controller[2] & B01000000));
  digitalWrite(commandArray[15], (serial_rx_buffer_inverted_controller[2] & B10000000));

  //  4 Axis, Buffer Array Elements 3, 4, 5, 6
  //  RX, RY, LX, LY
  analogWrite(commandArray[16], serial_rx_buffer_inverted_controller[3]);
  analogWrite(commandArray[17], serial_rx_buffer_inverted_controller[4]);
  analogWrite(commandArray[18], serial_rx_buffer_inverted_controller[5]);
  analogWrite(commandArray[19], serial_rx_buffer_inverted_controller[6]);

  //  Analog button (Used to change between Digital and Analog modes in older games), Buffer Array Element 7
  //  All other bits in this Buffer Array Element are unused
  digitalWrite(commandArray[20], (serial_rx_buffer_inverted_controller[7] & B00000001));

  //  Buffer Array Element 8 is unused in this code, but is existing in case changes are needed
  Serial.flush();

  //  Tell the computer the Arduino is about to be Reset
  serial_rx_buffer_reset[8] = (byte)((resetCalled & 0xFF));
  serial_rx_buffer_reset[7] = (byte)((resetCalled >> 8) & 0xFF);
  serial_rx_buffer_reset[6] = (byte)((resetCalled >> 16) & 0xFF);
  serial_rx_buffer_reset[5] = (byte)((resetCalled >> 24) & 0xFF);
  serial_rx_buffer_reset[0] = 0xA0;
  serial_rx_buffer_reset[11] = 0xA0;
  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_reset); serial_rx_buffer_counter++) {
    Serial.write(serial_rx_buffer_reset[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
  }
  Serial.flush();
  //  Tell the computer the connection is about to be closed
  disconnectCalled = currentMillis;
  serial_rx_buffer_disconnect[8] = (byte)((disconnectCalled & 0xFF));
  serial_rx_buffer_disconnect[7] = (byte)((disconnectCalled >> 8) & 0xFF);
  serial_rx_buffer_disconnect[6] = (byte)((disconnectCalled >> 16) & 0xFF);
  serial_rx_buffer_disconnect[5] = (byte)((disconnectCalled >> 24) & 0xFF);
  //Serial.println(disconnectCalled);
  //Serial.println("DISCONNECTING...");
  serial_rx_buffer_disconnect[0] = 0x0A;
  serial_rx_buffer_disconnect[11] = 0x0A;
  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_disconnect); serial_rx_buffer_counter++) {
    Serial.write(serial_rx_buffer_disconnect[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
  }
  Serial.flush();
  Serial.end();
  isConnected = false;
  disconnectDone = currentMillis;
  delay(2500); // Wait 2.5 seconds before resetting
  Serial.begin(baudRate);

  //  Tell the computer the connection has began succesfully
  serial_rx_buffer_disconnect[0] = 0x0B;
  serial_rx_buffer_disconnect[11] = 0x0B;
  serial_rx_buffer_disconnect[8] = (byte)((disconnectDone & 0xFF));
  serial_rx_buffer_disconnect[7] = (byte)((disconnectDone >> 8) & 0xFF);
  serial_rx_buffer_disconnect[6] = (byte)((disconnectDone >> 16) & 0xFF);
  serial_rx_buffer_disconnect[5] = (byte)((disconnectDone >> 24) & 0xFF);
  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_disconnect); serial_rx_buffer_counter++) {
    Serial.write(serial_rx_buffer_disconnect[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
  }
  Serial.flush();

  //  Reset all commands again just to make sure
  serial_rx_buffer_controller[0] = 0x01; //  Preamble
  serial_rx_buffer_controller[1] = 0x00; //  SELECT, L3, R3, START, DUP, DRIGHT, DDOWN, DLEFT
  serial_rx_buffer_controller[2] = 0x00; //  L2, R2, L1, R1, Triangle/Delta, Circle/O, Cross/X, Square
  serial_rx_buffer_controller[3] = 0x7F; //  RX
  serial_rx_buffer_controller[4] = 0x7F; //  RY
  serial_rx_buffer_controller[5] = 0x7F; //  LX
  serial_rx_buffer_controller[6] = 0x7F; //  LY
  serial_rx_buffer_controller[7] = 0x00; //  Analog button (Used to change between Digital and Analog modes in older games), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
  serial_rx_buffer_controller[8] = 0x00; //  Unused
  serial_rx_buffer_controller[9] = 0x00; //  Delay Byte 2
  serial_rx_buffer_controller[10] = 0x00; // Delay Byte 1
  serial_rx_buffer_controller[11] = 0x01; // Postamble

  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer); serial_rx_buffer_counter++) {
    Serial.write(serial_rx_buffer_controller[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
    serial_rx_buffer_inverted_controller[serial_rx_buffer_counter] = (255 - serial_rx_buffer_controller[serial_rx_buffer_counter]); //  Invert 0 to 255 and vice versa to make it easier to determine which commands to enable or not, and their values
  }

  //  First 8 buttons, Buffer Array Element 1
  //  SELECT, L3, R3, START, DUP, DRIGHT, DDOWN, DLEFT
  digitalWrite(commandArray[0], (serial_rx_buffer_inverted_controller[1] & B00000001));
  digitalWrite(commandArray[1], (serial_rx_buffer_inverted_controller[1] & B00000010));
  digitalWrite(commandArray[2], (serial_rx_buffer_inverted_controller[1] & B00000100));
  digitalWrite(commandArray[3], (serial_rx_buffer_inverted_controller[1] & B00001000));
  digitalWrite(commandArray[4], (serial_rx_buffer_inverted_controller[1] & B00010000));
  digitalWrite(commandArray[5], (serial_rx_buffer_inverted_controller[1] & B00100000));
  digitalWrite(commandArray[6], (serial_rx_buffer_inverted_controller[1] & B01000000));
  digitalWrite(commandArray[7], (serial_rx_buffer_inverted_controller[1] & B10000000));

  //  Second 8 buttons, Buffer Array Element 2
  //  L2, R2, L1, R1, Triangle/Delta, Circle/O, Cross/X, Square
  digitalWrite(commandArray[8], (serial_rx_buffer_inverted_controller[2] & B00000001));
  digitalWrite(commandArray[9], (serial_rx_buffer_inverted_controller[2] & B00000010));
  digitalWrite(commandArray[10], (serial_rx_buffer_inverted_controller[2] & B00000100));
  digitalWrite(commandArray[11], (serial_rx_buffer_inverted_controller[2] & B00001000));
  digitalWrite(commandArray[12], (serial_rx_buffer_inverted_controller[2] & B00010000));
  digitalWrite(commandArray[13], (serial_rx_buffer_inverted_controller[2] & B00100000));
  digitalWrite(commandArray[14], (serial_rx_buffer_inverted_controller[2] & B01000000));
  digitalWrite(commandArray[15], (serial_rx_buffer_inverted_controller[2] & B10000000));

  //  4 Axis, Buffer Array Elements 3, 4, 5, 6
  //  RX, RY, LX, LY
  analogWrite(commandArray[16], serial_rx_buffer_inverted_controller[3]);
  analogWrite(commandArray[17], serial_rx_buffer_inverted_controller[4]);
  analogWrite(commandArray[18], serial_rx_buffer_inverted_controller[5]);
  analogWrite(commandArray[19], serial_rx_buffer_inverted_controller[6]);

  //  Analog button (Used to change between Digital and Analog modes in older games), Buffer Array Element 7
  //  All other bits in this Buffer Array Element are unused
  digitalWrite(commandArray[20], (serial_rx_buffer_inverted_controller[7] & B00000001));

  //  Buffer Array Element 8 is unused in this code, but is existing in case changes are needed
  Serial.flush();

  //  Tell the computer the Arduino has been reset succesfully
  resetDone = currentMillis;
  serial_rx_buffer_reset[0] = 0xA1;
  serial_rx_buffer_reset[11] = 0xA1;
  serial_rx_buffer_reset[8] = (byte)((resetDone & 0xFF));
  serial_rx_buffer_reset[7] = (byte)((resetDone >> 8) & 0xFF);
  serial_rx_buffer_reset[6] = (byte)((resetDone >> 16) & 0xFF);
  serial_rx_buffer_reset[5] = (byte)((resetDone >> 24) & 0xFF);
  asm volatile ("  jmp 0"); // Reset the Arduino through ASM code
  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_reset); serial_rx_buffer_counter++) {
    Serial.write(serial_rx_buffer_reset[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
  }
  Serial.flush();
  //  From here on, the setup() function will be called again, the computer then proceeds to reset its variables just like an usual startup routine
}

void pressButtons() {
  if (isInputtingDelayed == false) {
    //  Define input delay (If Buffer Array Element 9 and 10 !=0)
    inputDelay = (unsigned long)serial_rx_buffer[9] << 8 | (unsigned long)serial_rx_buffer[10];
  }
  if (isInputting == true)
  {
    for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_controller); serial_rx_buffer_counter++) {
      Serial.write(serial_rx_buffer_controller[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
      //  Invert 0 to 255 and vice versa to make it easier to determine which commands to enable or not, and their values
      serial_rx_buffer_inverted_controller[serial_rx_buffer_counter] = (255 - serial_rx_buffer_controller[serial_rx_buffer_counter]);
    }
    //Serial.print('\n');
    Serial.flush();
    //  Press Button

    //  First 8 buttons, Buffer Array Element 1
    //  SELECT, L3, R3, START, DUP, DRIGHT, DDOWN, DLEFT
    digitalWrite(commandArray[0], (serial_rx_buffer_inverted_controller[1] & B00000001));
    digitalWrite(commandArray[1], (serial_rx_buffer_inverted_controller[1] & B00000010));
    digitalWrite(commandArray[2], (serial_rx_buffer_inverted_controller[1] & B00000100));
    digitalWrite(commandArray[3], (serial_rx_buffer_inverted_controller[1] & B00001000));
    digitalWrite(commandArray[4], (serial_rx_buffer_inverted_controller[1] & B00010000));
    digitalWrite(commandArray[5], (serial_rx_buffer_inverted_controller[1] & B00100000));
    digitalWrite(commandArray[6], (serial_rx_buffer_inverted_controller[1] & B01000000));
    digitalWrite(commandArray[7], (serial_rx_buffer_inverted_controller[1] & B10000000));

    //  Second 8 buttons, Buffer Array Element 2
    //  L2, R2, L1, R1, Triangle/Delta, Circle/O, Cross/X, Square
    digitalWrite(commandArray[8], (serial_rx_buffer_inverted_controller[2] & B00000001));
    digitalWrite(commandArray[9], (serial_rx_buffer_inverted_controller[2] & B00000010));
    digitalWrite(commandArray[10], (serial_rx_buffer_inverted_controller[2] & B00000100));
    digitalWrite(commandArray[11], (serial_rx_buffer_inverted_controller[2] & B00001000));
    digitalWrite(commandArray[12], (serial_rx_buffer_inverted_controller[2] & B00010000));
    digitalWrite(commandArray[13], (serial_rx_buffer_inverted_controller[2] & B00100000));
    digitalWrite(commandArray[14], (serial_rx_buffer_inverted_controller[2] & B01000000));
    digitalWrite(commandArray[15], (serial_rx_buffer_inverted_controller[2] & B10000000));

    //  4 Axis, Buffer Array Elements 3, 4, 5, 6
    //  RX, RY, LX, LY
    analogWrite(commandArray[16], serial_rx_buffer_inverted_controller[3]);
    analogWrite(commandArray[17], serial_rx_buffer_inverted_controller[4]);
    analogWrite(commandArray[18], serial_rx_buffer_inverted_controller[5]);
    analogWrite(commandArray[19], serial_rx_buffer_inverted_controller[6]);

    //  Analog button (Used to change between Digital and Analog modes in older games), Buffer Array Element 7
    //  All other bits in this Buffer Array Element are unused
    digitalWrite(commandArray[20], (serial_rx_buffer_inverted_controller[7] & B00000001));

    //  Buffer Array Element 8 is unused in this code, but is existing in case changes are needed

    //  Buffer Array Elements 9 and 10 are used to tell the Arduino how long commands are executed, on a delay ranging from 1-65535ms
    //if (serial_rx_buffer[9] != 0x00)
    //if (serial_rx_buffer[10] != 0x00)
    if (inputDelay != 0) {
      isInputtingDelayed = true;

      //  The block below executes Soft Delay for holding the buttons down
      if (isInputtingDelayed == true) {
        if (currentMillis - previousInputDelay >= inputDelay) {
          //  Now we need to stop the Soft Delay

          //  Depress Buttons (Only if Buffer Array Element 9 and 10 != 0x00)
          serial_rx_buffer_controller[1] = 0x00;
          serial_rx_buffer_controller[2] = 0x00;
          serial_rx_buffer_controller[3] = 0x7F;
          serial_rx_buffer_controller[4] = 0x7F;
          serial_rx_buffer_controller[5] = 0x7F;
          serial_rx_buffer_controller[6] = 0x7F;
          serial_rx_buffer_controller[7] = 0x00;
          serial_rx_buffer_controller[8] = 0x00;
          serial_rx_buffer_controller[9] = 0x00;
          serial_rx_buffer_controller[10] = 0x00;

          for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_controller); serial_rx_buffer_counter++) {
            Serial.write(serial_rx_buffer_controller[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
            //  Invert 0 to 255 and vice versa to make it easier to determine which commands to enable or not, and their values
            serial_rx_buffer_inverted_controller[serial_rx_buffer_counter] = (255 - serial_rx_buffer_controller[serial_rx_buffer_counter]);
          }

          //  First 8 buttons, Buffer Array Element 1
          //  SELECT, L3, R3, START, DUP, DRIGHT, DDOWN, DLEFT
          digitalWrite(commandArray[0], (serial_rx_buffer_inverted_controller[1] & B00000001));
          digitalWrite(commandArray[1], (serial_rx_buffer_inverted_controller[1] & B00000010));
          digitalWrite(commandArray[2], (serial_rx_buffer_inverted_controller[1] & B00000100));
          digitalWrite(commandArray[3], (serial_rx_buffer_inverted_controller[1] & B00001000));
          digitalWrite(commandArray[4], (serial_rx_buffer_inverted_controller[1] & B00010000));
          digitalWrite(commandArray[5], (serial_rx_buffer_inverted_controller[1] & B00100000));
          digitalWrite(commandArray[6], (serial_rx_buffer_inverted_controller[1] & B01000000));
          digitalWrite(commandArray[7], (serial_rx_buffer_inverted_controller[1] & B10000000));

          //  Second 8 buttons, Buffer Array Element 2
          //  L2, R2, L1, R1, Triangle/Delta, Circle/O, Cross/X, Square
          digitalWrite(commandArray[8], (serial_rx_buffer_inverted_controller[2] & B00000001));
          digitalWrite(commandArray[9], (serial_rx_buffer_inverted_controller[2] & B00000010));
          digitalWrite(commandArray[10], (serial_rx_buffer_inverted_controller[2] & B00000100));
          digitalWrite(commandArray[11], (serial_rx_buffer_inverted_controller[2] & B00001000));
          digitalWrite(commandArray[12], (serial_rx_buffer_inverted_controller[2] & B00010000));
          digitalWrite(commandArray[13], (serial_rx_buffer_inverted_controller[2] & B00100000));
          digitalWrite(commandArray[14], (serial_rx_buffer_inverted_controller[2] & B01000000));
          digitalWrite(commandArray[15], (serial_rx_buffer_inverted_controller[2] & B10000000));

          //  4 Axis, Buffer Array Elements 3, 4, 5, 6
          //  RX, RY, LX, LY
          analogWrite(commandArray[16], serial_rx_buffer_inverted_controller[3]);
          analogWrite(commandArray[17], serial_rx_buffer_inverted_controller[4]);
          analogWrite(commandArray[18], serial_rx_buffer_inverted_controller[5]);
          analogWrite(commandArray[19], serial_rx_buffer_inverted_controller[6]);

          //  Analog button (Used to change between Digital and Analog modes in older games), Buffer Array Element 7
          //  All other bits in this Buffer Array Element are unused
          digitalWrite(commandArray[20], (serial_rx_buffer_inverted_controller[7] & B00000001));

          //  Buffer Array Element 8 is unused in this code, but is existing in case changes are needed
          //Serial.print('\n');
          Serial.flush();

          isInputtingDelayed = false;
          isInputting = false;
          previousInputDelay += inputDelay;
          inputDelay = 0;
        }
      }
    }
  }
}

void getPing() {
  //  This function gets PING sent from the computer, then responds with PONG back to the computer
  pingTimeIn = (unsigned long)serial_rx_buffer_ping_in[5] << 24 | (unsigned long)serial_rx_buffer_ping_in[6] << 16 | (unsigned long)serial_rx_buffer_ping_in[7] << 8 | (unsigned long)serial_rx_buffer_ping_in[8];
  pongTimeOut = pingTimeIn;
  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer); serial_rx_buffer_counter++) {
    serial_rx_buffer_pong_out[serial_rx_buffer_counter] = serial_rx_buffer_ping_in[serial_rx_buffer_counter];
    if (serial_rx_buffer_counter == 0) {
      Serial.write(0x04);
    }
    if ((serial_rx_buffer_counter == 1) || (serial_rx_buffer_counter == 2) || (serial_rx_buffer_counter == 3) || (serial_rx_buffer_counter == 4)) {
      Serial.write(serial_rx_buffer_pong_out[serial_rx_buffer_counter]);
    }
    if ((serial_rx_buffer_counter == 5) || (serial_rx_buffer_counter == 6) || (serial_rx_buffer_counter == 7) || (serial_rx_buffer_counter == 8)) {
      Serial.write(serial_rx_buffer_pong_out[serial_rx_buffer_counter]);
    }
    if ((serial_rx_buffer_counter == 9) || (serial_rx_buffer_counter == 10)) {
      Serial.write(0x00);
    }
    if (serial_rx_buffer_counter == 11) {
      Serial.write(0x04);
    }
    //Serial.write(serial_rx_buffer[serial_rx_buffer_counter]); //  Write time back to computer
    sentPong = true;
  }
  //previousPingDelay = currentMillis;
  lastPingIn = currentMillis;
  lastPongOut = currentMillis;
  Serial.flush();
  /*
    Serial.print("PONG = ");
    Serial.println(currentMillis);
    Serial.flush();
    Serial.println("PING RECEIVED");
    Serial.println("");
    Serial.print("LAST PING TIME IN = ");
    Serial.println(lastPingIn);
    Serial.print("LAST PONG TIME IN = ");
    Serial.println(lastPongIn);
    Serial.print("LAST PING TIME OUT = ");
    Serial.println(lastPingOut);
    Serial.print("LAST PONG TIME OUT = ");
    Serial.println(lastPongOut);
    Serial.print("PING TIME OUT = ");
    Serial.println(pingTimeOut);
    Serial.print("PONG TIME OUT = ");
    Serial.println(pongTimeOut);
    Serial.print("PING TIME IN = ");
    Serial.println(pingTimeIn);
    Serial.print("PONG TIME IN= ");
    Serial.println(pongTimeIn);
    Serial.flush();
  */
  sentPong = false;
}

void getPong() {
  //  This function gets PONG sent from the computer, then stores it in an Unsigned Long Integer
  pongTimeIn = (unsigned long)serial_rx_buffer_pong_in[5] << 24 | (unsigned long)serial_rx_buffer_pong_in[6] << 16 | (unsigned long)serial_rx_buffer_pong_in[7] << 8 | (unsigned long)serial_rx_buffer_pong_in[8];
  //  Respond PONG with PONG for debugging purposes
  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_pong_in); serial_rx_buffer_counter++) {
    if (serial_rx_buffer_counter == 0) {
      Serial.write(0x05);
    }
    if ((serial_rx_buffer_counter == 1) || (serial_rx_buffer_counter == 2) || (serial_rx_buffer_counter == 3) || (serial_rx_buffer_counter == 4)) {
      Serial.write(serial_rx_buffer_pong_in[serial_rx_buffer_counter]);
    }
    if ((serial_rx_buffer_counter == 5) || (serial_rx_buffer_counter == 6) || (serial_rx_buffer_counter == 7) || (serial_rx_buffer_counter == 8)) {
      Serial.write(serial_rx_buffer_pong_in[serial_rx_buffer_counter]);
    }
    if ((serial_rx_buffer_counter == 9) || (serial_rx_buffer_counter == 10)) {
      Serial.write(0x00);
    }
    if (serial_rx_buffer_counter == 11) {
      Serial.write(0x05);
    }
  }
  /*
    for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_pong_in); serial_rx_buffer_counter++) {
    serial_rx_buffer_ping_out[serial_rx_buffer_counter] = serial_rx_buffer_pong_in[serial_rx_buffer_counter];
    if (serial_rx_buffer_counter == 0) {
      Serial.write(0x04);
    }
    if ((serial_rx_buffer_counter == 1) || (serial_rx_buffer_counter == 2) || (serial_rx_buffer_counter == 3) || (serial_rx_buffer_counter == 4)) {
      Serial.write(0x00);
    }
    if ((serial_rx_buffer_counter == 5) || (serial_rx_buffer_counter == 6) || (serial_rx_buffer_counter == 7) || (serial_rx_buffer_counter == 8)) {
      Serial.write(serial_rx_buffer_ping_out[serial_rx_buffer_counter]);
    }
    if ((serial_rx_buffer_counter == 9) || (serial_rx_buffer_counter == 10)) {
      Serial.write(0x00);
    }
    if (serial_rx_buffer_counter == 11) {
      Serial.write(0x04);
    }
    //Serial.write(serial_rx_buffer[serial_rx_buffer_counter]); //  Write time back to computer
    sentPong = true;
    }
  */
  previousPongDelay = currentMillis;
  lastPongIn = currentMillis;
  //Serial.flush();
  /*
    Serial.println("PONG RECEIVED");
    Serial.println("");
    Serial.print("CURRENT TIME = ");
    Serial.println(currentMillis);
    Serial.flush();
    Serial.print("LAST PING TIME IN = ");
    Serial.println(lastPingIn);
    Serial.print("LAST PONG TIME IN = ");
    Serial.println(lastPongIn);
    Serial.print("LAST PING TIME OUT = ");
    Serial.println(lastPingOut);
    Serial.print("LAST PONG TIME OUT = ");
    Serial.println(lastPongOut);
    Serial.print("PING TIME OUT = ");
    Serial.println(pingTimeOut);
    Serial.print("PONG TIME OUT = ");
    Serial.println(pongTimeOut);
    Serial.print("PING TIME IN = ");
    Serial.println(pingTimeIn);
    Serial.print("PONG TIME IN= ");
    Serial.println(pongTimeIn);
    Serial.flush();
  */
}

void sendPing() {
  //  This function sends PING to the computer 1 time per second, the computer then responds with PONG back to the Arduino, PONG is then processed in another function
  if (currentMillis - previousPingDelay >= pingDelay) {
    pingTimeOut = currentMillis;
    serial_rx_buffer_ping_out[8] = (byte)((pingTimeOut & 0xFF));
    serial_rx_buffer_ping_out[7] = (byte)((pingTimeOut >> 8) & 0xFF);
    serial_rx_buffer_ping_out[6] = (byte)((pingTimeOut >> 16) & 0xFF);
    serial_rx_buffer_ping_out[5] = (byte)((pingTimeOut >> 24) & 0xFF);
    for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_ping_out); serial_rx_buffer_counter++) {
      if (serial_rx_buffer_counter == 0) {
        Serial.write(0x03);
      }
      if ((serial_rx_buffer_counter == 1) || (serial_rx_buffer_counter == 2) || (serial_rx_buffer_counter == 3) || (serial_rx_buffer_counter == 4)) {
        Serial.write(0x00);
      }
      if ((serial_rx_buffer_counter == 5) || (serial_rx_buffer_counter == 6) || (serial_rx_buffer_counter == 7) || (serial_rx_buffer_counter == 8)) {
        Serial.write(serial_rx_buffer_ping_out[serial_rx_buffer_counter]);
      }
      if ((serial_rx_buffer_counter == 9) || (serial_rx_buffer_counter == 10)) {
        Serial.write(0x00);
      }
      if (serial_rx_buffer_counter == 11) {
        Serial.write(0x03);
      }
    }
    Serial.flush();
    //readMotors(); //  This is here for debugging reasons.
    sentPing = true;
    /*
      Serial.print("pongTimeByte5 = ");
      Serial.println(serial_rx_buffer[5]);
      Serial.print("pongTimeByte6 = ");
      Serial.println(serial_rx_buffer[6]);
      Serial.print("pongTimeByte7 = ");
      Serial.println(serial_rx_buffer[7]);
      Serial.print("pongTimeByte8 = ");
      Serial.println(serial_rx_buffer[8]);
    */
    /*
      Serial.println();
      Serial.print("PING = ");
      Serial.println(pongTime);
      Serial.flush();
      Serial.print("PING PREVIOUS = ");
      Serial.println(previousPingDelay);
      Serial.print("PONG PREVIOUS = ");
      Serial.println(previousPongDelay);
      Serial.flush();
      Serial.print("CURRENT PONG CALCULATED = ");
      Serial.println(calcPongTimestamp);
      Serial.flush();
      Serial.print("CURRENT PING CALCULATED = ");
      Serial.println(calcPingTimestamp);
      Serial.flush();
    */
    //readMotors();
    previousPingDelay += pingDelay;
  }
  sentPing = false;
}

void calculatePing() {
  //  Calculate delay since last PONG sent from the computer, If the computer doesn't respond with PONG in 10 seconds since the last PONG sent from the computer, connection is interrupted and the restarted
  calcPingTimestampIn = (currentMillis - previousPingDelay);
  if ((calcPongTimestampIn - calcPingTimestampIn >= 10000) && (calcPongTimestampIn - calcPingTimestampIn <= currentMillis)) {
    disconnectCalled = currentMillis;

    //  Before disconnecting, we need to reset all Command status, and tell the computer they were reset
    serial_rx_buffer_controller[0] = 0x01; //  Preamble
    serial_rx_buffer_controller[1] = 0x00; //  SELECT, L3, R3, START, DUP, DRIGHT, DDOWN, DLEFT
    serial_rx_buffer_controller[2] = 0x00; //  L2, R2, L1, R1, Triangle/Delta, Circle/O, Cross/X, Square
    serial_rx_buffer_controller[3] = 0x7F; //  RX
    serial_rx_buffer_controller[4] = 0x7F; //  RY
    serial_rx_buffer_controller[5] = 0x7F; //  LX
    serial_rx_buffer_controller[6] = 0x7F; //  LY
    serial_rx_buffer_controller[7] = 0x00; //  Analog button (Used to change between Digital and Analog modes in older games), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
    serial_rx_buffer_controller[8] = 0x00; //  Unused
    serial_rx_buffer_controller[9] = 0x00; //  Delay Byte 2
    serial_rx_buffer_controller[10] = 0x00; // Delay Byte 1
    serial_rx_buffer_controller[11] = 0x01; // Postamble

    for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer); serial_rx_buffer_counter++) {
      Serial.write(serial_rx_buffer_controller[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
      serial_rx_buffer_inverted_controller[serial_rx_buffer_counter] = (255 - serial_rx_buffer_controller[serial_rx_buffer_counter]); //  Invert 0 to 255 and vice versa to make it easier to determine which commands to enable or not, and their values
    }

    //  First 8 buttons, Buffer Array Element 1
    //  SELECT, L3, R3, START, DUP, DRIGHT, DDOWN, DLEFT
    digitalWrite(commandArray[0], (serial_rx_buffer_inverted_controller[1] & B00000001));
    digitalWrite(commandArray[1], (serial_rx_buffer_inverted_controller[1] & B00000010));
    digitalWrite(commandArray[2], (serial_rx_buffer_inverted_controller[1] & B00000100));
    digitalWrite(commandArray[3], (serial_rx_buffer_inverted_controller[1] & B00001000));
    digitalWrite(commandArray[4], (serial_rx_buffer_inverted_controller[1] & B00010000));
    digitalWrite(commandArray[5], (serial_rx_buffer_inverted_controller[1] & B00100000));
    digitalWrite(commandArray[6], (serial_rx_buffer_inverted_controller[1] & B01000000));
    digitalWrite(commandArray[7], (serial_rx_buffer_inverted_controller[1] & B10000000));

    //  Second 8 buttons, Buffer Array Element 2
    //  L2, R2, L1, R1, Triangle/Delta, Circle/O, Cross/X, Square
    digitalWrite(commandArray[8], (serial_rx_buffer_inverted_controller[2] & B00000001));
    digitalWrite(commandArray[9], (serial_rx_buffer_inverted_controller[2] & B00000010));
    digitalWrite(commandArray[10], (serial_rx_buffer_inverted_controller[2] & B00000100));
    digitalWrite(commandArray[11], (serial_rx_buffer_inverted_controller[2] & B00001000));
    digitalWrite(commandArray[12], (serial_rx_buffer_inverted_controller[2] & B00010000));
    digitalWrite(commandArray[13], (serial_rx_buffer_inverted_controller[2] & B00100000));
    digitalWrite(commandArray[14], (serial_rx_buffer_inverted_controller[2] & B01000000));
    digitalWrite(commandArray[15], (serial_rx_buffer_inverted_controller[2] & B10000000));

    //  4 Axis, Buffer Array Elements 3, 4, 5, 6
    //  RX, RY, LX, LY
    analogWrite(commandArray[16], serial_rx_buffer_inverted_controller[3]);
    analogWrite(commandArray[17], serial_rx_buffer_inverted_controller[4]);
    analogWrite(commandArray[18], serial_rx_buffer_inverted_controller[5]);
    analogWrite(commandArray[19], serial_rx_buffer_inverted_controller[6]);

    //  Analog button (Used to change between Digital and Analog modes in older games), Buffer Array Element 7
    //  All other bits in this Buffer Array Element are unused
    digitalWrite(commandArray[20], (serial_rx_buffer_inverted_controller[7] & B00000001));

    //  Buffer Array Element 8 is unused in this code, but is existing in case changes are needed
    Serial.flush();

    //  Tell the computer the connection is about to be closed
    serial_rx_buffer_disconnect[8] = (byte)((disconnectCalled & 0xFF));
    serial_rx_buffer_disconnect[7] = (byte)((disconnectCalled >> 8) & 0xFF);
    serial_rx_buffer_disconnect[6] = (byte)((disconnectCalled >> 16) & 0xFF);
    serial_rx_buffer_disconnect[5] = (byte)((disconnectCalled >> 24) & 0xFF);
    //Serial.println(disconnectCalled);
    //Serial.println("DISCONNECTING...");
    //Serial.print("DISCONNECTING PING = ");
    //Serial.println(calcPongTimestampIn);
    serial_rx_buffer_disconnect[0] = 0x09;
    serial_rx_buffer_disconnect[11] = 0x09;
    for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_disconnect); serial_rx_buffer_counter++) {
      Serial.write(serial_rx_buffer_disconnect[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
    }
    Serial.flush();
    //calcPongTimestamp = 0;
    previousPongDelay = currentMillis;
    //Serial.println("Closing connection");
    //Serial.println(calcPongTimestamp);
    Serial.end();
    isConnected = false;
    delay(2500); // Wait 2.5 seconds before starting connection
    //Serial.println("Sending shit after connection has closed");
    Serial.begin(baudRate);
    //Serial.println("Connection started");
    //  Tell the computer the connection has began succesfully
    serial_rx_buffer_disconnect[0] = 0x0B;
    serial_rx_buffer_disconnect[11] = 0x0B;
    serial_rx_buffer_disconnect[8] = (byte)((disconnectDone & 0xFF));
    serial_rx_buffer_disconnect[7] = (byte)((disconnectDone >> 8) & 0xFF);
    serial_rx_buffer_disconnect[6] = (byte)((disconnectDone >> 16) & 0xFF);
    serial_rx_buffer_disconnect[5] = (byte)((disconnectDone >> 24) & 0xFF);
    for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_disconnect); serial_rx_buffer_counter++) {
      Serial.write(serial_rx_buffer_disconnect[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
    }
    Serial.flush();

    //  Reset all Commands status just to make sure everything is working as intended
    serial_rx_buffer_controller[0] = 0x01; //  Preamble
    serial_rx_buffer_controller[1] = 0x00; //  SELECT, L3, R3, START, DUP, DRIGHT, DDOWN, DLEFT
    serial_rx_buffer_controller[2] = 0x00; //  L2, R2, L1, R1, Triangle/Delta, Circle/O, Cross/X, Square
    serial_rx_buffer_controller[3] = 0x7F; //  RX
    serial_rx_buffer_controller[4] = 0x7F; //  RY
    serial_rx_buffer_controller[5] = 0x7F; //  LX
    serial_rx_buffer_controller[6] = 0x7F; //  LY
    serial_rx_buffer_controller[7] = 0x00; //  Analog button (Used to change between Digital and Analog modes in older games), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
    serial_rx_buffer_controller[8] = 0x00; //  Unused
    serial_rx_buffer_controller[9] = 0x00; //  Delay Byte 2
    serial_rx_buffer_controller[10] = 0x00; // Delay Byte 1
    serial_rx_buffer_controller[11] = 0x01; // Postamble

    for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer); serial_rx_buffer_counter++) {
      Serial.write(serial_rx_buffer_controller[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
      serial_rx_buffer_inverted_controller[serial_rx_buffer_counter] = (255 - serial_rx_buffer_controller[serial_rx_buffer_counter]); //  Invert 0 to 255 and vice versa to make it easier to determine which commands to enable or not, and their values
    }

    //  First 8 buttons, Buffer Array Element 1
    //  SELECT, L3, R3, START, DUP, DRIGHT, DDOWN, DLEFT
    digitalWrite(commandArray[0], (serial_rx_buffer_inverted_controller[1] & B00000001));
    digitalWrite(commandArray[1], (serial_rx_buffer_inverted_controller[1] & B00000010));
    digitalWrite(commandArray[2], (serial_rx_buffer_inverted_controller[1] & B00000100));
    digitalWrite(commandArray[3], (serial_rx_buffer_inverted_controller[1] & B00001000));
    digitalWrite(commandArray[4], (serial_rx_buffer_inverted_controller[1] & B00010000));
    digitalWrite(commandArray[5], (serial_rx_buffer_inverted_controller[1] & B00100000));
    digitalWrite(commandArray[6], (serial_rx_buffer_inverted_controller[1] & B01000000));
    digitalWrite(commandArray[7], (serial_rx_buffer_inverted_controller[1] & B10000000));

    //  Second 8 buttons, Buffer Array Element 2
    //  L2, R2, L1, R1, Triangle/Delta, Circle/O, Cross/X, Square
    digitalWrite(commandArray[8], (serial_rx_buffer_inverted_controller[2] & B00000001));
    digitalWrite(commandArray[9], (serial_rx_buffer_inverted_controller[2] & B00000010));
    digitalWrite(commandArray[10], (serial_rx_buffer_inverted_controller[2] & B00000100));
    digitalWrite(commandArray[11], (serial_rx_buffer_inverted_controller[2] & B00001000));
    digitalWrite(commandArray[12], (serial_rx_buffer_inverted_controller[2] & B00010000));
    digitalWrite(commandArray[13], (serial_rx_buffer_inverted_controller[2] & B00100000));
    digitalWrite(commandArray[14], (serial_rx_buffer_inverted_controller[2] & B01000000));
    digitalWrite(commandArray[15], (serial_rx_buffer_inverted_controller[2] & B10000000));

    //  4 Axis, Buffer Array Elements 3, 4, 5, 6
    //  RX, RY, LX, LY
    analogWrite(commandArray[16], serial_rx_buffer_inverted_controller[3]);
    analogWrite(commandArray[17], serial_rx_buffer_inverted_controller[4]);
    analogWrite(commandArray[18], serial_rx_buffer_inverted_controller[5]);
    analogWrite(commandArray[19], serial_rx_buffer_inverted_controller[6]);

    //  Analog button (Used to change between Digital and Analog modes in older games), Buffer Array Element 7
    //  All other bits in this Buffer Array Element are unused
    digitalWrite(commandArray[20], (serial_rx_buffer_inverted_controller[7] & B00000001));

    //  Buffer Array Element 8 is unused in this code, but is existing in case changes are needed
    Serial.flush();

    isConnected = true;
    disconnectDone = currentMillis;
    //Serial.println("Sending shit after connection has began");
    //Serial.println("RECONNECTED!");
    //Serial.println(calcPongTimestampIn);
    //disconnectDone = currentMillis;
    //Serial.println(disconnectDone);
  }
  else if (calcPongTimestampIn - calcPingTimestampIn < 10000) {
    //Serial.println("PONG OK");
    //Serial.println(currentMillis);
  }
}

void calculatePong() {
  //  Caclulate if PONG is out of range, then do something
  calcPongTimestampIn = (currentMillis - previousPongDelay);
  //  Seriously, why did I make this function it serves no point, or I just forgot what it was supposed to be used for.(?)
}

void getAttention() {
  //  Get Attention Line levels, if it's low, then it's sending input, if it's high, it's not sending input to the PS2
  attentionLevel = digitalRead(attentionPin);
  if (attentionLevel !=  previousAttentionLevel)
  {
    if (attentionLevel == HIGH)
    {
      //Serial.println("HIGH");
      readMotors();
      previousAttentionLevelHigh = currentMillis;
      //Serial.println(previousAttentionLevelHigh);
      attentionLevelHigh++;
    }
    else if (attentionLevel == LOW)
    {
      //Serial.println("LOW");
      readMotors();
      previousAttentionLevelLow = currentMillis;
      //Serial.println(previousAttentionLevelLow);
      attentionLevelLow++;
    }
  }
  previousAttentionLevel = attentionLevel;
}

/*
  void doStuff() {
  pongTime = currentMillis;
  serial_rx_buffer[7] = (byte) pongTime;
  serial_rx_buffer[8] = (byte) pongTime >> 8;
  serial_rx_buffer[9] = (byte) pongTime >> 16;
  serial_rx_buffer[10] = (byte) pongTime >> 24;
  sentPing = false;
  if (currentMillis - previousPingDelay >= pingDelay) {
    //pongTime = (unsigned long)serial_rx_buffer[7] << 24 | (unsigned long)serial_rx_buffer[8] << 16 | (unsigned long)serial_rx_buffer[9] << 8 | (unsigned long)serial_rx_buffer[10];
    for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer); serial_rx_buffer_counter++) {
      if (serial_rx_buffer_counter == 0) {
        //Serial.write(0x04);
      }
      if ((serial_rx_buffer_counter == 1) || (serial_rx_buffer_counter == 2) || (serial_rx_buffer_counter == 3) || (serial_rx_buffer_counter == 4) || (serial_rx_buffer_counter == 5) || (serial_rx_buffer_counter == 6)) {
        //Serial.write(0x00);
      }
      if ((serial_rx_buffer_counter == 7) || (serial_rx_buffer_counter == 8) || (serial_rx_buffer_counter == 9) || (serial_rx_buffer_counter == 10)) {
        //Serial.write(serial_rx_buffer[serial_rx_buffer_counter]);
      }
      if (serial_rx_buffer_counter == 11) {
        //Serial.write(0x04);
      }
    }
    //Serial.flush();
    //Serial.println();
    Serial.print("PONG = ");
    Serial.println(pongTime);
    Serial.flush();
    sentPing = true;
    previousPingDelay += pingDelay;
  }
  }
*/

void manualResetControllerData()
{
  //  This function resets controller data when requested by the computer. Can be used for example when something goes wrong on the computer's end.
  serial_rx_buffer_controller[0] = 0x01; //  Preamble
  serial_rx_buffer_controller[1] = 0x00; //  SELECT, L3, R3, START, DUP, DRIGHT, DDOWN, DLEFT
  serial_rx_buffer_controller[2] = 0x00; //  L2, R2, L1, R1, Triangle/Delta, Circle/O, Cross/X, Square
  serial_rx_buffer_controller[3] = 0x7F; //  RX
  serial_rx_buffer_controller[4] = 0x7F; //  RY
  serial_rx_buffer_controller[5] = 0x7F; //  LX
  serial_rx_buffer_controller[6] = 0x7F; //  LY
  serial_rx_buffer_controller[7] = 0x00; //  Analog button (Used to change between Digital and Analog modes in older games), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
  serial_rx_buffer_controller[8] = 0x00; //  Unused
  serial_rx_buffer_controller[9] = 0x00; //  Delay Byte 2
  serial_rx_buffer_controller[10] = 0x00; // Delay Byte 1
  serial_rx_buffer_controller[11] = 0x01; // Postamble

  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer); serial_rx_buffer_counter++) {
    Serial.write(serial_rx_buffer_controller[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
    serial_rx_buffer_inverted_controller[serial_rx_buffer_counter] = (255 - serial_rx_buffer_controller[serial_rx_buffer_counter]); //  Invert 0 to 255 and vice versa to make it easier to determine which commands to enable or not, and their values
  }

  //  First 8 buttons, Buffer Array Element 1
  //  SELECT, L3, R3, START, DUP, DRIGHT, DDOWN, DLEFT
  digitalWrite(commandArray[0], (serial_rx_buffer_inverted_controller[1] & B00000001));
  digitalWrite(commandArray[1], (serial_rx_buffer_inverted_controller[1] & B00000010));
  digitalWrite(commandArray[2], (serial_rx_buffer_inverted_controller[1] & B00000100));
  digitalWrite(commandArray[3], (serial_rx_buffer_inverted_controller[1] & B00001000));
  digitalWrite(commandArray[4], (serial_rx_buffer_inverted_controller[1] & B00010000));
  digitalWrite(commandArray[5], (serial_rx_buffer_inverted_controller[1] & B00100000));
  digitalWrite(commandArray[6], (serial_rx_buffer_inverted_controller[1] & B01000000));
  digitalWrite(commandArray[7], (serial_rx_buffer_inverted_controller[1] & B10000000));

  //  Second 8 buttons, Buffer Array Element 2
  //  L2, R2, L1, R1, Triangle/Delta, Circle/O, Cross/X, Square
  digitalWrite(commandArray[8], (serial_rx_buffer_inverted_controller[2] & B00000001));
  digitalWrite(commandArray[9], (serial_rx_buffer_inverted_controller[2] & B00000010));
  digitalWrite(commandArray[10], (serial_rx_buffer_inverted_controller[2] & B00000100));
  digitalWrite(commandArray[11], (serial_rx_buffer_inverted_controller[2] & B00001000));
  digitalWrite(commandArray[12], (serial_rx_buffer_inverted_controller[2] & B00010000));
  digitalWrite(commandArray[13], (serial_rx_buffer_inverted_controller[2] & B00100000));
  digitalWrite(commandArray[14], (serial_rx_buffer_inverted_controller[2] & B01000000));
  digitalWrite(commandArray[15], (serial_rx_buffer_inverted_controller[2] & B10000000));

  //  4 Axis, Buffer Array Elements 3, 4, 5, 6
  //  RX, RY, LX, LY
  analogWrite(commandArray[16], serial_rx_buffer_inverted_controller[3]);
  analogWrite(commandArray[17], serial_rx_buffer_inverted_controller[4]);
  analogWrite(commandArray[18], serial_rx_buffer_inverted_controller[5]);
  analogWrite(commandArray[19], serial_rx_buffer_inverted_controller[6]);

  //  Analog button (Used to change between Digital and Analog modes in older games), Buffer Array Element 7
  //  All other bits in this Buffer Array Element are unused
  digitalWrite(commandArray[20], (serial_rx_buffer_inverted_controller[7] & B00000001));

  //  Buffer Array Element 8 is unused in this code, but is existing in case changes are needed
  Serial.flush();
}

void autoResetControllerData()
{
  //  This function resets controller data when every 500ms, but only when there's no Input being executed.
  if (currentMillis - previousResetControllerDataDelay >= resetControllerDataDelay) {
    if (isInputting == false) {
      //  This function resets contreoller data when requested by the computer. Can be used for example when something goes wrong on the computer's end.
      serial_rx_buffer_controller[0] = 0x01; //  Preamble
      serial_rx_buffer_controller[1] = 0x00; //  SELECT, L3, R3, START, DUP, DRIGHT, DDOWN, DLEFT
      serial_rx_buffer_controller[2] = 0x00; //  L2, R2, L1, R1, Triangle/Delta, Circle/O, Cross/X, Square
      serial_rx_buffer_controller[3] = 0x7F; //  RX
      serial_rx_buffer_controller[4] = 0x7F; //  RY
      serial_rx_buffer_controller[5] = 0x7F; //  LX
      serial_rx_buffer_controller[6] = 0x7F; //  LY
      serial_rx_buffer_controller[7] = 0x00; //  Analog button (Used to change between Digital and Analog modes in older games), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
      serial_rx_buffer_controller[8] = 0x00; //  Unused
      serial_rx_buffer_controller[9] = 0x00; //  Delay Byte 2
      serial_rx_buffer_controller[10] = 0x00; // Delay Byte 1
      serial_rx_buffer_controller[11] = 0x01; // Postamble

      for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer); serial_rx_buffer_counter++) {
        Serial.write(serial_rx_buffer_controller[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
        serial_rx_buffer_inverted_controller[serial_rx_buffer_counter] = (255 - serial_rx_buffer_controller[serial_rx_buffer_counter]); //  Invert 0 to 255 and vice versa to make it easier to determine which commands to enable or not, and their values
      }

      //  First 8 buttons, Buffer Array Element 1
      //  SELECT, L3, R3, START, DUP, DRIGHT, DDOWN, DLEFT
      digitalWrite(commandArray[0], (serial_rx_buffer_inverted_controller[1] & B00000001));
      digitalWrite(commandArray[1], (serial_rx_buffer_inverted_controller[1] & B00000010));
      digitalWrite(commandArray[2], (serial_rx_buffer_inverted_controller[1] & B00000100));
      digitalWrite(commandArray[3], (serial_rx_buffer_inverted_controller[1] & B00001000));
      digitalWrite(commandArray[4], (serial_rx_buffer_inverted_controller[1] & B00010000));
      digitalWrite(commandArray[5], (serial_rx_buffer_inverted_controller[1] & B00100000));
      digitalWrite(commandArray[6], (serial_rx_buffer_inverted_controller[1] & B01000000));
      digitalWrite(commandArray[7], (serial_rx_buffer_inverted_controller[1] & B10000000));

      //  Second 8 buttons, Buffer Array Element 2
      //  L2, R2, L1, R1, Triangle/Delta, Circle/O, Cross/X, Square
      digitalWrite(commandArray[8], (serial_rx_buffer_inverted_controller[2] & B00000001));
      digitalWrite(commandArray[9], (serial_rx_buffer_inverted_controller[2] & B00000010));
      digitalWrite(commandArray[10], (serial_rx_buffer_inverted_controller[2] & B00000100));
      digitalWrite(commandArray[11], (serial_rx_buffer_inverted_controller[2] & B00001000));
      digitalWrite(commandArray[12], (serial_rx_buffer_inverted_controller[2] & B00010000));
      digitalWrite(commandArray[13], (serial_rx_buffer_inverted_controller[2] & B00100000));
      digitalWrite(commandArray[14], (serial_rx_buffer_inverted_controller[2] & B01000000));
      digitalWrite(commandArray[15], (serial_rx_buffer_inverted_controller[2] & B10000000));

      //  4 Axis, Buffer Array Elements 3, 4, 5, 6
      //  RX, RY, LX, LY
      analogWrite(commandArray[16], serial_rx_buffer_inverted_controller[3]);
      analogWrite(commandArray[17], serial_rx_buffer_inverted_controller[4]);
      analogWrite(commandArray[18], serial_rx_buffer_inverted_controller[5]);
      analogWrite(commandArray[19], serial_rx_buffer_inverted_controller[6]);

      //  Analog button (Used to change between Digital and Analog modes in older games), Buffer Array Element 7
      //  All other bits in this Buffer Array Element are unused
      digitalWrite(commandArray[20], (serial_rx_buffer_inverted_controller[7] & B00000001));

      //  Buffer Array Element 8 is unused in this code, but is existing in case changes are needed
      Serial.flush();
    }
    previousResetControllerDataDelay += resetControllerDataDelay;
  }
}

void readMotors() {
  if ((serial_rx_buffer_motor[0] == 0x02) && (serial_rx_buffer_motor[11] == 0x02))
  {
    // Observed value is ~39 when On , 0 when Off (Reading analog instead of digital, so I can get a threshold of the reading)
    // ~15 when floating (Controller isn't plugged in to PlayStation or PlayStation2)
    //leftMotorVal = (digitalRead(motorArray[0])); // This is the SMALL MOTOR
    leftMotorVal = (analogRead(motorArray[0]));
    //  map() is used to convert min and max values to desired values, in this case, I need to convert 1023 to 255
    leftMotorVal = map(leftMotorVal, 0, 1023, 0, 255);

    // Observed value is ~39 when On , 0 when Off
    // ~15 when floating (Controller isn't plugged in to PlayStation or PlayStation2)
    rightMotorVal = (analogRead(motorArray[1]));
    //rightMotorVal = (digitalRead(motorArray[1])); // This is the BIG MOTOR
    rightMotorVal = map(rightMotorVal, 0, 1023, 0, 255);

    // Observed value ~108 when HIGH (LED is OFF), ~84 when LOW (LED is ON)
    // ~20 when floating (Controller isn't plugged in to PlayStation or PlayStation2)
    analogLedVal = (analogRead(motorArray[2]));
    //analogLedVal = (digitalRead(motorArray[2])); // If analogLedVal = High, Analog is OFF, else if analogLedVal = Low, Analog is ON
    analogLedVal = map(analogLedVal, 0, 1023, 0, 255);
    serial_rx_buffer_motor[6] = leftMotorVal;
    serial_rx_buffer_motor[7] = rightMotorVal;
    serial_rx_buffer_motor[8] = analogLedVal;
    //Serial.print('\n');
    for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_motor); serial_rx_buffer_counter++) {
      if (serial_rx_buffer_counter == 0) {
        Serial.write(0x06);
      }
      if ((serial_rx_buffer_counter == 1) || (serial_rx_buffer_counter == 2) || (serial_rx_buffer_counter == 3) || (serial_rx_buffer_counter == 4) || (serial_rx_buffer_counter == 5)) {
        Serial.write(0x00);
      }
      if ((serial_rx_buffer_counter == 6) || (serial_rx_buffer_counter == 7) || (serial_rx_buffer_counter == 8)) {
        Serial.write(serial_rx_buffer_motor[serial_rx_buffer_counter]);
      }
      if ((serial_rx_buffer_counter == 9) || (serial_rx_buffer_counter == 10)) {
        Serial.write(0x00);
      }
      if (serial_rx_buffer_counter == 11) {
        Serial.write(0x06);
      }
      serial_rx_buffer_motor[serial_rx_buffer_counter] = 0x00;
    }
    Serial.flush();
    /*
      Serial.print("leftMotorVal = ");
      Serial.print(leftMotorVal);
      Serial.print(" rightMotorVal = ");
      Serial.print(rightMotorVal);
      Serial.print(" analogLedVal = ");
      Serial.println(analogLedVal);
      Serial.flush();
    */
  }
  if (attentionLevel == HIGH)
  {
    // Observed value is ~39 when On , 0 when Off (Reading analog instead of digital, so I can get a threshold of the reading)
    // ~15 when floating (Controller isn't plugged in to PlayStation or PlayStation2)
    //leftMotorVal = (digitalRead(motorArray[0]));
    leftMotorVal = (analogRead(motorArray[0]));
    //  map() is used to convert min and max values to desired values, in this case, I need to convert 1023 to 255
    leftMotorVal = map(leftMotorVal, 0, 1023, 0, 255);

    // Observed value is ~39 when On , 0 when Off
    // ~15 when floating (Controller isn't plugged in to PlayStation or PlayStation2)
    rightMotorVal = (analogRead(motorArray[1]));
    //rightMotorVal = (digitalRead(motorArray[1]));
    rightMotorVal = map(rightMotorVal, 0, 1023, 0, 255);

    // Observed value ~108 when HIGH (LED is OFF), ~84 when LOW (LED is ON)
    // ~20 when floating (Controller isn't plugged in to PlayStation or PlayStation2)
    analogLedVal = (analogRead(motorArray[2]));
    //analogLedVal = (digitalRead(motorArray[2]));
    analogLedVal = map(analogLedVal, 0, 1023, 0, 255);
    serial_rx_buffer_motor[6] = leftMotorVal;
    serial_rx_buffer_motor[7] = rightMotorVal;
    serial_rx_buffer_motor[8] = analogLedVal;
    //Serial.print('\n');
    for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_motor); serial_rx_buffer_counter++) {
      if (serial_rx_buffer_counter == 0) {
        Serial.write(0x08);
      }
      if ((serial_rx_buffer_counter == 1) || (serial_rx_buffer_counter == 2) || (serial_rx_buffer_counter == 3) || (serial_rx_buffer_counter == 4) || (serial_rx_buffer_counter == 5)) {
        Serial.write(0x00);
      }
      if ((serial_rx_buffer_counter == 6) || (serial_rx_buffer_counter == 7) || (serial_rx_buffer_counter == 8)) {
        Serial.write(serial_rx_buffer_motor[serial_rx_buffer_counter]);
      }
      if ((serial_rx_buffer_counter == 9) || (serial_rx_buffer_counter == 10)) {
        Serial.write(0x00);
      }
      if (serial_rx_buffer_counter == 11) {
        Serial.write(0x08);
      }
    }
    Serial.flush();
    /*
      Serial.print("leftMotorVal = ");
      Serial.print(leftMotorVal);
      Serial.print(" rightMotorVal = ");
      Serial.print(rightMotorVal);
      Serial.print(" analogLedVal = ");
      Serial.println(analogLedVal);
      Serial.flush();
    */
  }
  else if (attentionLevel == LOW)
  {
    // Observed value is ~39 when On , 0 when Off (Reading analog instead of digital, so I can get a threshold of the reading)
    // ~15 when floating (Controller isn't plugged in to PlayStation or PlayStation2)
    //leftMotorVal = (digitalRead(motorArray[0]));
    leftMotorVal = (analogRead(motorArray[0]));
    //  map() is used to convert min and max values to desired values, in this case, I need to convert 1023 to 255
    leftMotorVal = map(leftMotorVal, 0, 1023, 0, 255);

    // Observed value is ~39 when On , 0 when Off
    // ~15 when floating (Controller isn't plugged in to PlayStation or PlayStation2)
    rightMotorVal = (analogRead(motorArray[1]));
    //rightMotorVal = (digitalRead(motorArray[1]));
    rightMotorVal = map(rightMotorVal, 0, 1023, 0, 255);

    // Observed value ~108 when HIGH (LED is OFF), ~84 when LOW (LED is ON)
    // ~20 when floating (Controller isn't plugged in to PlayStation or PlayStation2)
    analogLedVal = (analogRead(motorArray[2]));
    //analogLedVal = (digitalRead(motorArray[2]));
    analogLedVal = map(analogLedVal, 0, 1023, 0, 255);
    serial_rx_buffer_motor[6] = leftMotorVal;
    serial_rx_buffer_motor[7] = rightMotorVal;
    serial_rx_buffer_motor[8] = analogLedVal;
    //Serial.print('\n');
    for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_motor); serial_rx_buffer_counter++) {
      if (serial_rx_buffer_counter == 0) {
        Serial.write(0x07);
      }
      if ((serial_rx_buffer_counter == 1) || (serial_rx_buffer_counter == 2) || (serial_rx_buffer_counter == 3) || (serial_rx_buffer_counter == 4) || (serial_rx_buffer_counter == 5)) {
        Serial.write(0x00);
      }
      if ((serial_rx_buffer_counter == 6) || (serial_rx_buffer_counter == 7) || (serial_rx_buffer_counter == 8)) {
        Serial.write(serial_rx_buffer_motor[serial_rx_buffer_counter]);
      }
      if ((serial_rx_buffer_counter == 9) || (serial_rx_buffer_counter == 10)) {
        Serial.write(0x00);
      }
      if (serial_rx_buffer_counter == 11) {
        Serial.write(0x07);
      }
    }
    Serial.flush();
    /*
      Serial.print("leftMotorVal = ");
      Serial.print(leftMotorVal);
      Serial.print(" rightMotorVal = ");
      Serial.print(rightMotorVal);
      Serial.print(" analogLedVal = ");
      Serial.println(analogLedVal);
      Serial.flush();
    */
  }
}

