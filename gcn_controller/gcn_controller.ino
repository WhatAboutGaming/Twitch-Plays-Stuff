/*
  GameCube Controller for Arduino Mega2560 v1.0 by WhatAboutGaming
  Based on PS2 Version
  For use in the Twitch.TV stream TwitchTriesToPlay.
  https://www.twitch.tv/twitchtriestoplay
  https://github.com/WhatAboutGaming/Twitch-Plays-Stuff

  Reference:
  http://www.int03.co.uk/crema/hardware/gamecube/gc-control.html
  http://www.seas.upenn.edu/~gland/gamecube.html
  https://nintenduino.wordpress.com/documentation/controller-reference/
  https://nintenduino.files.wordpress.com/2013/12/untitled.png
  https://nintenduino.files.wordpress.com/2013/12/protocolv1-0.png
  https://github.com/NicoHood/Nintendo
  https://github.com/dekuNukem/gc3ds
*/

/*
  PINOUTS


  Protoboard Side|Arduino Side|Variable Name |GCN Controller Side
  13 LEFT        |2           |axisY         |Analog Axis Y
  14 LEFT        |3           |axisX         |Analog Axis X
  15 LEFT        |4           |axisCx        |Axis C X
  16 LEFT        |5           |axisCy        |Axis C Y
  6  LEFT        |6           |buttonDDown   |D-Down
  5  LEFT        |7           |buttonDLeft   |D-Left
  8  LEFT        |8           |axisLTrigger  |L Analog Trigger
  7  LEFT        |9           |buttonLTrigger|L Digital Trigger
  10 LEFT        |10          |buttonTurbo   |Turbo (Bootleg Controller Button)
  11 LEFT        |11          |buttonMode    |Mode (Bootleg Controller Button)
  12 LEFT        |12          |buttonStart   |Start
  4  RIGHT       |13          |axisRTrigger  |R Analog Trigger
  3  LEFT        |22          |buttonDUp     |D-Up
  4  LEFT        |23          |buttonDRight  |D-Right
  5  RIGHT       |24          |buttonB       |B
  3  RIGHT       |25          |buttonRTrigger|R Digital Trigger
  6  RIGHT       |26          |buttonY       |Y
  8  RIGHT       |27          |buttonX       |X
  7  RIGHT       |28          |buttonA       |A
  10 RIGHT       |29          |buttonZ       |Z
  9  RIGHT       |30          |buttonMacro   |Macro (Bootleg Controller Button)
  9  LEFT        |A0          |motorInput    |Motor
  11 RIGHT       |A1          |turboLed      |Turbo LED (Bootleg Controller Function)
  12 RIGHT       |A2          |macroLed      |Macro LED (Bootleg Controller Function)
*/

#define axisY 2
#define axisX 3
#define axisCx 4
#define axisCy 5
#define buttonDDown 6
#define buttonDLeft 7

#define axisLTrigger 8
#define buttonLTrigger 9
#define buttonTurbo 10
#define buttonMode 11
#define buttonStart 12
#define axisRTrigger 13

#define buttonDUp 22
#define buttonDRight 23
#define buttonB 24
#define buttonRTrigger 25
#define buttonY 26
#define buttonX 27

#define buttonA 28
#define buttonZ 29
#define buttonMacro 30

#define motorInput A0
#define turboLed A1
#define macroLed A2

#define vccPin A10 // For reading and checking if the controller is conencted or not

#define relayPin A11

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
unsigned long pingDelay = 1000;
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

unsigned long resetControllerDataDelay = 1000;
unsigned long previousResetControllerDataDelay = 0;

unsigned int leftMotorVal = 0;
unsigned int rightMotorVal = 0;
unsigned int analogLedVal = 0;

unsigned int vccReading = 0;

unsigned int vccLevel = 0;
unsigned int previousVccLevel = 0;
unsigned long vccLevelLow = 0;
unsigned long vccLevelHigh = 0;
unsigned long previousVccLevelHigh = 0;
unsigned long previousVccLevelLow = 0;

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

unsigned long readMotorsStatus = 0; // 0 = Read Both Low to High and High to Low changes, 1 = Disabled, 2 = Read Low to High changes, 3 = Read High to Low Changes. 0 Means it's enabled by default.
unsigned long autoResetControllerDataStatus = 0; // 0 = Automatic reset is enabled, 1 = Automatic reset is disabled
unsigned long resetBeforeInputStatus = 0; // 0 = Resetting before inputting is enabled, 1 = Resetting before inputting is disabled
unsigned long autoDisconnectOnPingTimeout = 0; // 0 = Arduino will disconnect in case of PING time out, that is, when the computer doesn't respond to the Arduino with PONG, 1 = Arduino won't close connection to the computer in case of PING timeout
unsigned long controllerPowerStatus = 0; // 0 = Controller is ON, 1 = Controller is OFF
unsigned long readMotorsAlongSendPing = 0; // 0 = Read motors and get Attention levels after sending Ping, 1 = Do not read motors and get Attention levels after sending Ping.
unsigned long sendInputOnce = 0; // 0 = Send only once, 1 = Send for every iteration of Loop

boolean sentInputOnce = false;
boolean sendInputOnlyOnce = false;

unsigned long resetCalled = 0;
unsigned long resetDone = 0;

unsigned long disconnectCalled = 0;
unsigned long disconnectDone = 0;

unsigned long baudRate = 2000000;

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
byte serial_rx_buffer_change_motors_status[12];
byte serial_rx_buffer_change_autoreset_controller_status[12];
byte serial_rx_buffer_toggle_before_input_reset[12];
byte serial_rx_buffer_toggle_disconnect_on_ping_timeout[12];
byte serial_rx_buffer_toggle_controller_pwr[12];
byte serial_rx_buffer_toggle_motors_after_ping[12];
byte serial_rx_buffer_toggle_send_input_back[12];
byte serial_rx_buffer_reset_gcn_controller[12];
unsigned long serial_rx_buffer_counter = 0;
unsigned long controller = 0;

//  The array below is an array of all buttons in the order the bytes have to be sent
unsigned int commandArray[] = {buttonStart, buttonY, buttonX, buttonB, buttonA, buttonLTrigger, buttonRTrigger, buttonZ, buttonDUp, buttonDDown, buttonDRight, buttonDLeft, axisLTrigger, axisRTrigger, buttonMacro, buttonTurbo, axisX, axisY, axisCx, axisCy, buttonMode};
unsigned int motorArray[] = {motorInput, turboLed, macroLed};

void setup() {
  //TCCR0B = (TCCR0B & 0xF8) | 0x02;
  TCCR3B = (TCCR2B & 0xF8) | 0x01;
  Serial.begin(baudRate);
  Serial.setTimeout(1000);
  for (unsigned int buttonArrayIndex = 0; buttonArrayIndex < (sizeof(commandArray) / sizeof(unsigned int)); buttonArrayIndex++)
  {
    pinMode(commandArray[buttonArrayIndex], OUTPUT);
    digitalWrite(commandArray[buttonArrayIndex], LOW);
    /*
      Serial.print("index=");
      Serial.print(buttonArrayIndex);
      Serial.print(",contents=");
      Serial.println(commandArray[buttonArrayIndex]);
    */
  }
  digitalWrite(axisLTrigger, HIGH);
  digitalWrite(axisRTrigger, HIGH);
  //delay(133);

  analogWrite(axisCx, 128);
  analogWrite(axisCy, 127);
  analogWrite(axisX, 128);
  analogWrite(axisY, 127);

  pinMode(motorInput, INPUT);
  pinMode(turboLed, INPUT);
  pinMode(macroLed, INPUT);

  pinMode(vccPin, INPUT);
  readMotors();
  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, HIGH);
  //delay(133);
  digitalWrite(axisLTrigger, LOW);
  digitalWrite(axisRTrigger, LOW);
  readMotors();

  serial_rx_buffer_toggle_controller_pwr[0] = 0x17;
  serial_rx_buffer_toggle_controller_pwr[1] = 0x00;
  serial_rx_buffer_toggle_controller_pwr[2] = 0x00;
  serial_rx_buffer_toggle_controller_pwr[3] = 0x00;
  serial_rx_buffer_toggle_controller_pwr[4] = 0x00;
  serial_rx_buffer_toggle_controller_pwr[5] = 0x00;
  serial_rx_buffer_toggle_controller_pwr[6] = 0x00;
  serial_rx_buffer_toggle_controller_pwr[7] = 0x00;
  serial_rx_buffer_toggle_controller_pwr[8] = 0x00;
  serial_rx_buffer_toggle_controller_pwr[9] = 0x00;
  serial_rx_buffer_toggle_controller_pwr[10] = 0x00;
  serial_rx_buffer_toggle_controller_pwr[11] = 0x17;

  serial_rx_buffer_toggle_motors_after_ping[0] = 0x19;
  serial_rx_buffer_toggle_motors_after_ping[1] = 0x00;
  serial_rx_buffer_toggle_motors_after_ping[2] = 0x00;
  serial_rx_buffer_toggle_motors_after_ping[3] = 0x00;
  serial_rx_buffer_toggle_motors_after_ping[4] = 0x00;
  serial_rx_buffer_toggle_motors_after_ping[5] = 0x00;
  serial_rx_buffer_toggle_motors_after_ping[6] = 0x00;
  serial_rx_buffer_toggle_motors_after_ping[7] = 0x00;
  serial_rx_buffer_toggle_motors_after_ping[8] = 0x00;
  serial_rx_buffer_toggle_motors_after_ping[9] = 0x00;
  serial_rx_buffer_toggle_motors_after_ping[10] = 0x00;
  serial_rx_buffer_toggle_motors_after_ping[11] = 0x19;

  serial_rx_buffer_toggle_send_input_back[0] = 0x1B;
  serial_rx_buffer_toggle_send_input_back[1] = 0x00;
  serial_rx_buffer_toggle_send_input_back[2] = 0x00;
  serial_rx_buffer_toggle_send_input_back[3] = 0x00;
  serial_rx_buffer_toggle_send_input_back[4] = 0x00;
  serial_rx_buffer_toggle_send_input_back[5] = 0x00;
  serial_rx_buffer_toggle_send_input_back[6] = 0x00;
  serial_rx_buffer_toggle_send_input_back[7] = 0x00;
  serial_rx_buffer_toggle_send_input_back[8] = 0x00;
  serial_rx_buffer_toggle_send_input_back[9] = 0x00;
  serial_rx_buffer_toggle_send_input_back[10] = 0x00;
  serial_rx_buffer_toggle_send_input_back[11] = 0x1B;

  serial_rx_buffer_reset_gcn_controller[0] = 0x1D;
  serial_rx_buffer_reset_gcn_controller[1] = 0x00;
  serial_rx_buffer_reset_gcn_controller[2] = 0x00;
  serial_rx_buffer_reset_gcn_controller[3] = 0x00;
  serial_rx_buffer_reset_gcn_controller[4] = 0x00;
  serial_rx_buffer_reset_gcn_controller[5] = 0x00;
  serial_rx_buffer_reset_gcn_controller[6] = 0x00;
  serial_rx_buffer_reset_gcn_controller[7] = 0x00;
  serial_rx_buffer_reset_gcn_controller[8] = 0x00;
  serial_rx_buffer_reset_gcn_controller[9] = 0x00;
  serial_rx_buffer_reset_gcn_controller[10] = 0x00;
  serial_rx_buffer_reset_gcn_controller[11] = 0x1D;

  inputDelay = 0;
  isInputtingDelayed = false;
  isInputting = false;

  currentMillis = millis();
  //Serial.begin(baudRate);
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

  //  Prepare data to sent on startup as a way to tell the controller is in Neutral position
  //  That means, when all buttons and analog sticks are reset to their Neutral positions
  serial_rx_buffer_controller[0] = 0x01; //  Preamble
  serial_rx_buffer_controller[1] = 0x00; //  Start, Y, X, B, A, Digital L Trigger, Digital R Trigger, Z
  serial_rx_buffer_controller[2] = 0x00; //  DUp, DDown, DRight, DDleft, Analog L Trigger (Working Digitally), Analog R Trigger (Working Digitally), Macro (Bootleg), Turbo (Bootleg)
  serial_rx_buffer_controller[3] = 0x7F; //  Analog X Axis
  serial_rx_buffer_controller[4] = 0x7F; //  Analog Y Axis
  serial_rx_buffer_controller[5] = 0x7F; //  C X Axis
  serial_rx_buffer_controller[6] = 0x7F; //  C Y Axis
  serial_rx_buffer_controller[7] = 0x00; //  Mode (Bootleg), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
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

  //delay(2500); // Wait 2.5 seconds for the serial program on the computer to startup before sending any data

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
    serial_rx_buffer_inverted_controller[serial_rx_buffer_counter] = ( serial_rx_buffer_controller[serial_rx_buffer_counter]); //  Invert 0 to 255 and vice versa to make it easier to determine which commands to enable or not, and their values
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
  readMotors();
  manualResetControllerData();
  toggleBeforeInputReset();
  toggleDisconnectOnPingTimeout();
  toggleControllerPower();
  toggleMotorsAfterPing();
  toggleSendInputBack();

  serial_rx_buffer_change_motors_status[0] = 0x0F;
  serial_rx_buffer_change_motors_status[1] = 0x00;
  serial_rx_buffer_change_motors_status[2] = 0x00;
  serial_rx_buffer_change_motors_status[3] = 0x00;
  serial_rx_buffer_change_motors_status[4] = 0x00;
  serial_rx_buffer_change_motors_status[5] = 0x00;
  serial_rx_buffer_change_motors_status[6] = 0x00;
  serial_rx_buffer_change_motors_status[7] = 0x00;
  serial_rx_buffer_change_motors_status[8] = 0x00;
  serial_rx_buffer_change_motors_status[9] = 0x00;
  serial_rx_buffer_change_motors_status[10] = 0x00;
  serial_rx_buffer_change_motors_status[11] = 0x0F;

  serial_rx_buffer_change_autoreset_controller_status[0] = 0x11;
  serial_rx_buffer_change_autoreset_controller_status[1] = 0x00;
  serial_rx_buffer_change_autoreset_controller_status[2] = 0x00;
  serial_rx_buffer_change_autoreset_controller_status[3] = 0x00;
  serial_rx_buffer_change_autoreset_controller_status[4] = 0x00;
  serial_rx_buffer_change_autoreset_controller_status[5] = 0x00;
  serial_rx_buffer_change_autoreset_controller_status[6] = 0x00;
  serial_rx_buffer_change_autoreset_controller_status[7] = 0x00;
  serial_rx_buffer_change_autoreset_controller_status[8] = 0x00;
  serial_rx_buffer_change_autoreset_controller_status[9] = 0x00;
  serial_rx_buffer_change_autoreset_controller_status[10] = 0x00;
  serial_rx_buffer_change_autoreset_controller_status[11] = 0x11;

  serial_rx_buffer_toggle_before_input_reset[0] = 0x13;
  serial_rx_buffer_toggle_before_input_reset[1] = 0x00;
  serial_rx_buffer_toggle_before_input_reset[2] = 0x00;
  serial_rx_buffer_toggle_before_input_reset[3] = 0x00;
  serial_rx_buffer_toggle_before_input_reset[4] = 0x00;
  serial_rx_buffer_toggle_before_input_reset[5] = 0x00;
  serial_rx_buffer_toggle_before_input_reset[6] = 0x00;
  serial_rx_buffer_toggle_before_input_reset[7] = 0x00;
  serial_rx_buffer_toggle_before_input_reset[8] = 0x00;
  serial_rx_buffer_toggle_before_input_reset[9] = 0x00;
  serial_rx_buffer_toggle_before_input_reset[10] = 0x00;
  serial_rx_buffer_toggle_before_input_reset[11] = 0x13;

  serial_rx_buffer_toggle_disconnect_on_ping_timeout[0] = 0x15;
  serial_rx_buffer_toggle_disconnect_on_ping_timeout[1] = 0x00;
  serial_rx_buffer_toggle_disconnect_on_ping_timeout[2] = 0x00;
  serial_rx_buffer_toggle_disconnect_on_ping_timeout[3] = 0x00;
  serial_rx_buffer_toggle_disconnect_on_ping_timeout[4] = 0x00;
  serial_rx_buffer_toggle_disconnect_on_ping_timeout[5] = 0x00;
  serial_rx_buffer_toggle_disconnect_on_ping_timeout[6] = 0x00;
  serial_rx_buffer_toggle_disconnect_on_ping_timeout[7] = 0x00;
  serial_rx_buffer_toggle_disconnect_on_ping_timeout[8] = 0x00;
  serial_rx_buffer_toggle_disconnect_on_ping_timeout[9] = 0x00;
  serial_rx_buffer_toggle_disconnect_on_ping_timeout[10] = 0x00;
  serial_rx_buffer_toggle_disconnect_on_ping_timeout[11] = 0x15;

  serial_rx_buffer_toggle_controller_pwr[0] = 0x17;
  serial_rx_buffer_toggle_controller_pwr[1] = 0x00;
  serial_rx_buffer_toggle_controller_pwr[2] = 0x00;
  serial_rx_buffer_toggle_controller_pwr[3] = 0x00;
  serial_rx_buffer_toggle_controller_pwr[4] = 0x00;
  serial_rx_buffer_toggle_controller_pwr[5] = 0x00;
  serial_rx_buffer_toggle_controller_pwr[6] = 0x00;
  serial_rx_buffer_toggle_controller_pwr[7] = 0x00;
  serial_rx_buffer_toggle_controller_pwr[8] = 0x00;
  serial_rx_buffer_toggle_controller_pwr[9] = 0x00;
  serial_rx_buffer_toggle_controller_pwr[10] = 0x00;
  serial_rx_buffer_toggle_controller_pwr[11] = 0x17;

  serial_rx_buffer_toggle_motors_after_ping[0] = 0x19;
  serial_rx_buffer_toggle_motors_after_ping[1] = 0x00;
  serial_rx_buffer_toggle_motors_after_ping[2] = 0x00;
  serial_rx_buffer_toggle_motors_after_ping[3] = 0x00;
  serial_rx_buffer_toggle_motors_after_ping[4] = 0x00;
  serial_rx_buffer_toggle_motors_after_ping[5] = 0x00;
  serial_rx_buffer_toggle_motors_after_ping[6] = 0x00;
  serial_rx_buffer_toggle_motors_after_ping[7] = 0x00;
  serial_rx_buffer_toggle_motors_after_ping[8] = 0x00;
  serial_rx_buffer_toggle_motors_after_ping[9] = 0x00;
  serial_rx_buffer_toggle_motors_after_ping[10] = 0x00;
  serial_rx_buffer_toggle_motors_after_ping[11] = 0x19;

  serial_rx_buffer_toggle_send_input_back[0] = 0x1B;
  serial_rx_buffer_toggle_send_input_back[1] = 0x00;
  serial_rx_buffer_toggle_send_input_back[2] = 0x00;
  serial_rx_buffer_toggle_send_input_back[3] = 0x00;
  serial_rx_buffer_toggle_send_input_back[4] = 0x00;
  serial_rx_buffer_toggle_send_input_back[5] = 0x00;
  serial_rx_buffer_toggle_send_input_back[6] = 0x00;
  serial_rx_buffer_toggle_send_input_back[7] = 0x00;
  serial_rx_buffer_toggle_send_input_back[8] = 0x00;
  serial_rx_buffer_toggle_send_input_back[9] = 0x00;
  serial_rx_buffer_toggle_send_input_back[10] = 0x00;
  serial_rx_buffer_toggle_send_input_back[11] = 0x1B;

  inputDelay = 0;
  isInputtingDelayed = false;
  isInputting = false;

  changeReadMotorsStatus();
  changeAutoResetControllerData();

  readMotors();

  //Serial.println("END OF SETUP");
  //  And we are ready to go

  readMotors();
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

  //  Preamble/Postamble = 0x0E for Change Motor Readings
  //  Arduino receives data to choose which motor changes to read (0 is disabled)

  //  Preamble/Postamble = 0x0F for Respond Back to Change Motor Readings
  //  Arduino sends data to tell the computer the change was succesful

  //  Preamble/Postamble = 0x10 for Disable or Enable autoResetControllerData()
  //  Arduino receives data to disable or enable Automatic Controller Reset Data (0 is disabled)

  //  Preamble/Postamble = 0x11 for Respond Back to autoResetControllerData()
  //  Arduino sends data to tell the computer the change was succesful

  //  Preamble/Postamble = 0x12 for Choose to toggle auto reset before inputting
  //  Arduino receives data to disable or enable Automatic Disconnection on PING timeout

  //  Preamble/Postamble = 0x13 for respond back to Choose to toggle auto reset before inputting
  //  Arduino sends data to tell the computer the change was succesful

  //  Preamble/Postamble = 0x14 for Disable or Enable Auto disconnect on PING timeout
  //  Arduino receives data to disable or enable Automatic Disconnection on PING timeout

  //  Preamble/Postamble = 0x15 for Respond Back to Auto disconnect on PING timeout
  //  Arduino sends data to tell the computer the change was succesful

  //  Preamble/Postamble = 0x16 for Toggle Relay Switch to turn controller ON or OFF
  //  Arduino receives data to turn controller ON or OFF

  //  Preamble/Postamble = 0x17 for Respond Back to Turning controller ON or OFF
  //  Arduino sends data to tell the computer the change was succesful

  //  Preamble/Postamble = 0x18 for Toggle Reading Motor status on or off after sending PING
  //  Arduino receives data to turn controller ReadMotors on or OFF after PING

  //  Preamble/Postamble = 0x19 for Respond Back to Toggle Reading Motor status on or off after sending PING
  //  Arduino sends data to tell the computer the change was succesful

  //  Preamble/Postamble = 0x1A for toggle Send Input Once or every iteration of Loop
  //  Arduino sends data to tell the computer the change was succesful

  //  Preamble/Postamble = 0x1B for respond back to Send Input Once or every iteration of Loop
  //  Arduino sends data to tell the computer the change was succesful

  //  Preamble/Postamble = 0x1C for Reset GameCube Controller Data
  //  Arduino sends data to tell the computer the change was succesful

  //  Preamble/Postamble = 0x1D for respond back to Reset GameCube Controller Data
  //  Arduino sends data to tell the computer the change was succesful
  if (Serial.available() > 0) {

    controller = Serial.readBytes(serial_rx_buffer, sizeof(serial_rx_buffer)) && 0xFF;

    //  Set Start Byte (Preamble Byte) and End Byte (Postamble Byte)
    //  1 == 0x01
    if ((serial_rx_buffer[0] == 0x01) && (serial_rx_buffer[11] == 0x01)) {

      if (resetBeforeInputStatus == 0) {
        manualResetControllerData();
        readMotors();
      }
      //  Count bytes and parse ASCII values to their respective commands, such as buttons and axis
      for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer); serial_rx_buffer_counter++) {
        Serial.write(serial_rx_buffer[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
        //  Invert 0 to 255 and vice versa to make it easier to determine which commands to enable or not, and their values
        //Serial.println("TEST 0");
        serial_rx_buffer_inverted[serial_rx_buffer_counter] = ( serial_rx_buffer[serial_rx_buffer_counter]);
        serial_rx_buffer_controller[serial_rx_buffer_counter] = serial_rx_buffer[serial_rx_buffer_counter];
        serial_rx_buffer_inverted_controller[serial_rx_buffer_counter] = ( serial_rx_buffer_controller[serial_rx_buffer_counter]);
      }

      if (sendInputOnce == 0)
      {
        sendInputOnlyOnce = true;
        sentInputOnce = false;
      }
      if (sendInputOnce != 0)
      {
        sendInputOnlyOnce = false;
        sentInputOnce = true;
      }

      //Serial.print('\n');
      Serial.flush();
      // Make the button presses actually work
      //sentInputOnce = false;
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
    else if ((serial_rx_buffer[0] == 0x0E) && (serial_rx_buffer[11] == 0x0E)) {
      // Change Values for reading motors (To send or not motor readings)
      for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_reset_controller); serial_rx_buffer_counter++) {
        //  Pass Serial Buffer to Change Motors Values Buffer
        serial_rx_buffer_change_motors_status[serial_rx_buffer_counter] = serial_rx_buffer[serial_rx_buffer_counter];
        Serial.write(serial_rx_buffer_change_motors_status[serial_rx_buffer_counter]);
      }
      Serial.flush();
      changeReadMotorsStatus();
    }
    else if ((serial_rx_buffer[0] == 0x10) && (serial_rx_buffer[11] == 0x10)) {
      // Choose to enable or disable Automatic Reset Controller Data
      for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_change_autoreset_controller_status); serial_rx_buffer_counter++) {
        //  Pass Serial Buffer to AutoResetControllerData Buffer
        serial_rx_buffer_change_autoreset_controller_status[serial_rx_buffer_counter] = serial_rx_buffer[serial_rx_buffer_counter];
        Serial.write(serial_rx_buffer_change_autoreset_controller_status[serial_rx_buffer_counter]);
      }
      Serial.flush();
      changeAutoResetControllerData();
    }
    else if ((serial_rx_buffer[0] == 0x12) && (serial_rx_buffer[11] == 0x12)) {
      // Choose to enable or disable Automatic Reset Controller Data
      for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_toggle_before_input_reset); serial_rx_buffer_counter++) {
        //  Pass Serial Buffer to toggleBeforeInout Buffer
        serial_rx_buffer_toggle_before_input_reset[serial_rx_buffer_counter] = serial_rx_buffer[serial_rx_buffer_counter];
        Serial.write(serial_rx_buffer_toggle_before_input_reset[serial_rx_buffer_counter]);
      }
      Serial.flush();
      toggleBeforeInputReset();
    }
    else if ((serial_rx_buffer[0] == 0x14) && (serial_rx_buffer[11] == 0x14)) {
      // Choose to enable or disable Disconnect on PingTimeout
      for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_toggle_disconnect_on_ping_timeout); serial_rx_buffer_counter++) {

        serial_rx_buffer_toggle_disconnect_on_ping_timeout[serial_rx_buffer_counter] = serial_rx_buffer[serial_rx_buffer_counter];
        Serial.write(serial_rx_buffer_toggle_disconnect_on_ping_timeout[serial_rx_buffer_counter]);
      }
      Serial.flush();
      toggleDisconnectOnPingTimeout();
    }
    else if ((serial_rx_buffer[0] == 0x16) && (serial_rx_buffer[11] == 0x16)) {
      // Choose to Turn the controller ON or OFF
      for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_toggle_controller_pwr); serial_rx_buffer_counter++) {

        serial_rx_buffer_toggle_controller_pwr[serial_rx_buffer_counter] = serial_rx_buffer[serial_rx_buffer_counter];
        Serial.write(serial_rx_buffer_toggle_controller_pwr[serial_rx_buffer_counter]);
      }
      Serial.flush();
      toggleControllerPower();
    }
    else if ((serial_rx_buffer[0] == 0x18) && (serial_rx_buffer[11] == 0x18)) {
      // Choose to get Motor Readings and Attention line levels after sending PING
      for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_toggle_controller_pwr); serial_rx_buffer_counter++) {

        serial_rx_buffer_toggle_motors_after_ping[serial_rx_buffer_counter] = serial_rx_buffer[serial_rx_buffer_counter];
        Serial.write(serial_rx_buffer_toggle_motors_after_ping[serial_rx_buffer_counter]);
      }
      Serial.flush();
      toggleMotorsAfterPing();
    }
    else if ((serial_rx_buffer[0] == 0x1A) && (serial_rx_buffer[11] == 0x1A)) {
      //Serial.print("sendInputOnce=");
      //Serial.println(sendInputOnce);
      // Choose to Send Input back only once or every iteration of Loop (While inputting)
      for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_toggle_send_input_back); serial_rx_buffer_counter++) {

        serial_rx_buffer_toggle_send_input_back[serial_rx_buffer_counter] = serial_rx_buffer[serial_rx_buffer_counter];
        Serial.write(serial_rx_buffer_toggle_send_input_back[serial_rx_buffer_counter]);
      }
      Serial.flush();
      toggleSendInputBack();
    }
    else if ((serial_rx_buffer[0] == 0x1C) && (serial_rx_buffer[11] == 0x1C)) {
      // Reset GCN Controller data (Hopefully this will never be used)
      for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_reset_gcn_controller); serial_rx_buffer_counter++) {

        serial_rx_buffer_reset_gcn_controller[serial_rx_buffer_counter] = serial_rx_buffer[serial_rx_buffer_counter];
        Serial.write(serial_rx_buffer_reset_gcn_controller[serial_rx_buffer_counter]);
      }
      Serial.flush();
      resetGCNController();
    }
    //  Get Invalid Command
    else if ((((serial_rx_buffer[0] < 0x01) || (serial_rx_buffer[0] > 0x1B)) && ((serial_rx_buffer[11] < 0x01) || (serial_rx_buffer[11] > 0x1B))) && (((serial_rx_buffer[0] != 0xA0) && (serial_rx_buffer[0] != 0xA1)) && ((serial_rx_buffer[11] != 0xA0) && (serial_rx_buffer[11] != 0xA1)))) {
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
  autoResetControllerData();
  //toggleControllerPower();
} // Close Loop Function

void resetGCNController() {
  //  This is where the GameCube Controller is reset, by pressing X+Y+Start
  calculatePing();
  calculatePong();
  serial_rx_buffer_reset_gcn_controller[0] = 0x1D;
  serial_rx_buffer_reset_gcn_controller[11] = 0x1D;

  resetController();
  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_reset_gcn_controller); serial_rx_buffer_counter++) {
    //  Write back data as a way to tell the controller was successfully reset
    Serial.write(serial_rx_buffer_reset_gcn_controller[serial_rx_buffer_counter]);
  }
  calculatePing();
  calculatePong();
}

void resetController()
{
  //Press X+Y+Start to tell the GameCube to reset the controller data, which can be used to fix faulty analog stick readings
  unsigned long resetDelay = 66;
  delay(resetDelay);
  digitalWrite(commandArray[0], HIGH);
  digitalWrite(commandArray[1], HIGH);
  digitalWrite(commandArray[2], HIGH);
  delay(resetDelay);
  digitalWrite(axisLTrigger, HIGH);
  digitalWrite(axisRTrigger, HIGH);
  delay(resetDelay);
  digitalWrite(commandArray[0], LOW);
  digitalWrite(commandArray[1], LOW);
  digitalWrite(commandArray[2], LOW);
  delay(resetDelay);
  digitalWrite(axisLTrigger, LOW);
  digitalWrite(axisRTrigger, LOW);
  delay(resetDelay);

  digitalWrite(relayPin, LOW);
  delay(resetDelay);
  digitalWrite(axisLTrigger, HIGH);
  digitalWrite(axisRTrigger, HIGH);
  delay(resetDelay);
  digitalWrite(relayPin, HIGH);
  delay(resetDelay);
  digitalWrite(axisLTrigger, LOW);
  digitalWrite(axisRTrigger, LOW);


  for (unsigned int buttonArrayIndex = 0; buttonArrayIndex < (sizeof(commandArray) / sizeof(unsigned int)); buttonArrayIndex++) {
    digitalWrite(commandArray[buttonArrayIndex], LOW);
    //delay(133);
  }
}

void toggleSendInputBack() {
  //  This is where we choose to turn the PS2 controller ON or OFF, through a solid-state low-power relay
  //inputDelay = 0;
  //isInputtingDelayed = false;
  //isInputting = false;
  //autoResetControllerData();
  //manualResetControllerData();
  calculatePing();
  calculatePong();
  //Serial.print("sendInputOnce=");
  //Serial.println(sendInputOnce);
  //Serial.println("");
  //Serial.print("Changing from ");
  //Serial.print(autoDisconnectOnPingTimeout);
  //Serial.print(" to");
  //Serial.flush();
  sendInputOnce = serial_rx_buffer_toggle_send_input_back[8];
  serial_rx_buffer_toggle_send_input_back[0] = 0x1B;
  serial_rx_buffer_toggle_send_input_back[11] = 0x1B;

  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_toggle_send_input_back); serial_rx_buffer_counter++) {
    //  Write back data as a way to tell the Status changed correctly
    Serial.write(serial_rx_buffer_toggle_send_input_back[serial_rx_buffer_counter]);
  }
  //Serial.flush();
  //Serial.print(autoDisconnectOnPingTimeout);
  //Serial.println(" .");
  //Serial.flush();
  //autoResetControllerData();
  //manualResetControllerData();
  calculatePing();
  calculatePong();
  //Serial.print("sendInputOnce=");
  //Serial.println(sendInputOnce);
  //inputDelay = 0;
  //isInputtingDelayed = false;
  //isInputting = false;
}

void toggleMotorsAfterPing() {
  //  This is where we choose to wether read or not motor and LEDs
  //inputDelay = 0;
  //isInputtingDelayed = false;
  //isInputting = false;
  //autoResetControllerData();
  //manualResetControllerData();
  calculatePing();
  calculatePong();
  //Serial.println("");
  //Serial.print("Changing from ");
  //Serial.print(autoDisconnectOnPingTimeout);
  //Serial.print(" to");
  //Serial.flush();
  readMotorsAlongSendPing = serial_rx_buffer_toggle_motors_after_ping[8];
  serial_rx_buffer_toggle_motors_after_ping[0] = 0x19;
  serial_rx_buffer_toggle_motors_after_ping[11] = 0x19;

  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_toggle_motors_after_ping); serial_rx_buffer_counter++) {
    //  Write back data as a way to tell the Status changed correctly
    Serial.write(serial_rx_buffer_toggle_motors_after_ping[serial_rx_buffer_counter]);
  }
  //Serial.flush();
  //Serial.print(autoDisconnectOnPingTimeout);
  //Serial.println(" .");
  //Serial.flush();
  //autoResetControllerData();
  //manualResetControllerData();
  calculatePing();
  calculatePong();
  //inputDelay = 0;
  //isInputtingDelayed = false;
  //isInputting = false;
}

void toggleControllerPower() {
  //  This is where we choose to turn the PS2 controller ON or OFF, through a solid-state low-power relay
  //inputDelay = 0;
  //isInputtingDelayed = false;
  //isInputting = false;
  //autoResetControllerData();
  //manualResetControllerData();
  calculatePing();
  calculatePong();
  //Serial.println("");
  //Serial.print("Changing from ");
  //Serial.print(autoDisconnectOnPingTimeout);
  //Serial.print(" to");
  //Serial.flush();
  controllerPowerStatus = serial_rx_buffer_toggle_controller_pwr[8];
  serial_rx_buffer_toggle_controller_pwr[0] = 0x17;
  serial_rx_buffer_toggle_controller_pwr[11] = 0x17;

  if (controllerPowerStatus == 0)
  {
    digitalWrite(relayPin, HIGH);
    //Serial.print("controllerPowerStatus HIGH = ");
    //Serial.println(controllerPowerStatus);
  }

  if (controllerPowerStatus != 0)
  {
    digitalWrite(relayPin, LOW);
    //Serial.print("controllerPowerStatus LOW = ");
    //Serial.println(controllerPowerStatus);
  }

  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_toggle_controller_pwr); serial_rx_buffer_counter++) {
    //  Write back data as a way to tell the Status changed correctly
    Serial.write(serial_rx_buffer_toggle_controller_pwr[serial_rx_buffer_counter]);
  }
  Serial.flush();
  //Serial.print(autoDisconnectOnPingTimeout);
  //Serial.println(" .");
  //Serial.flush();
  //autoResetControllerData();
  //manualResetControllerData();
  calculatePing();
  calculatePong();
  //inputDelay = 0;
  //isInputtingDelayed = false;
  //isInputting = false;
}

void toggleBeforeInputReset() {
  //  This is where we choose whether or not the Arduino resets the controller data before executing an input
  //inputDelay = 0;
  //isInputtingDelayed = false;
  //isInputting = false;
  autoResetControllerData();
  manualResetControllerData();
  //Serial.println("");
  //Serial.print("Changing from ");
  //Serial.print(resetBeforeInputStatus);
  //Serial.print(" to");
  resetBeforeInputStatus = serial_rx_buffer_toggle_before_input_reset[8];
  serial_rx_buffer_toggle_before_input_reset[0] = 0x13;
  serial_rx_buffer_toggle_before_input_reset[11] = 0x13;

  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_toggle_before_input_reset); serial_rx_buffer_counter++) {
    //  Write back data as a way to tell the Status changed correctly
    Serial.write(serial_rx_buffer_toggle_before_input_reset[serial_rx_buffer_counter]);
  }
  //Serial.flush();
  //Serial.print(resetBeforeInputStatus);
  //Serial.println(" .");
  //Serial.flush();
  autoResetControllerData();
  manualResetControllerData();
  //inputDelay = 0;
  //isInputtingDelayed = false;
  //isInputting = false;
}

void toggleDisconnectOnPingTimeout() {
  //  This is where we choose whether or not the Arduino resets the controller data before executing an input
  //inputDelay = 0;
  //isInputtingDelayed = false;
  //isInputting = false;
  //autoResetControllerData();
  //manualResetControllerData();
  calculatePing();
  calculatePong();
  //Serial.println("");
  //Serial.print("Changing from ");
  //Serial.print(autoDisconnectOnPingTimeout);
  //Serial.print(" to");
  //Serial.flush();
  autoDisconnectOnPingTimeout = serial_rx_buffer_toggle_disconnect_on_ping_timeout[8];
  serial_rx_buffer_toggle_disconnect_on_ping_timeout[0] = 0x15;
  serial_rx_buffer_toggle_disconnect_on_ping_timeout[11] = 0x15;

  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_toggle_disconnect_on_ping_timeout); serial_rx_buffer_counter++) {
    //  Write back data as a way to tell the Status changed correctly
    Serial.write(serial_rx_buffer_toggle_disconnect_on_ping_timeout[serial_rx_buffer_counter]);
  }
  Serial.flush();
  //Serial.print(autoDisconnectOnPingTimeout);
  //Serial.println(" .");
  //Serial.flush();
  //autoResetControllerData();
  //manualResetControllerData();
  calculatePing();
  calculatePong();
  //inputDelay = 0;
  //isInputtingDelayed = false;
  //isInputting = false;
}

void changeAutoResetControllerData() {
  inputDelay = 0;
  isInputtingDelayed = false;
  isInputting = false;
  autoResetControllerData();
  manualResetControllerData();
  //Serial.println("");
  //Serial.print("Changing from ");
  //Serial.print(autoResetControllerDataStatus);
  //Serial.print(" to");
  autoResetControllerDataStatus = serial_rx_buffer_change_autoreset_controller_status[8];
  serial_rx_buffer_change_autoreset_controller_status[0] = 0x11;
  serial_rx_buffer_change_autoreset_controller_status[11] = 0x11;

  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_change_autoreset_controller_status); serial_rx_buffer_counter++) {
    //  Write back data as a way to tell the Status changed correctly
    Serial.write(serial_rx_buffer_change_autoreset_controller_status[serial_rx_buffer_counter]);
  }
  Serial.flush();
  //Serial.print(autoResetControllerDataStatus);
  //Serial.println(" .");
  //Serial.flush();
  autoResetControllerData();
  manualResetControllerData();
  inputDelay = 0;
  isInputtingDelayed = false;
  isInputting = false;
}

void changeReadMotorsStatus() {
  readMotors();
  //Serial.println("");
  //Serial.print("Changing from ");
  //Serial.print(readMotorsStatus);
  //Serial.print(" to");
  readMotorsStatus = serial_rx_buffer_change_motors_status[8];
  serial_rx_buffer_change_motors_status[0] = 0x0F;
  serial_rx_buffer_change_motors_status[11] = 0x0F;

  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_reset_controller); serial_rx_buffer_counter++) {
    //  Write back data as a way to tell the Status changed correctly
    Serial.write(serial_rx_buffer_change_motors_status[serial_rx_buffer_counter]);
  }
  Serial.flush();
  //Serial.print(readMotorsStatus);
  //Serial.println(" .");
  //Serial.flush();
  readMotors();
}

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
  serial_rx_buffer_controller[1] = 0x00; //  Start, Y, X, B, A, Digital L Trigger, Digital R Trigger, Z
  serial_rx_buffer_controller[2] = 0x00; //  DUp, DDown, DRight, DDleft, Analog L Trigger (Working Digitally), Analog R Trigger (Working Digitally), Macro (Bootleg), Turbo (Bootleg)
  serial_rx_buffer_controller[3] = 0x7F; //  Analog X Axis
  serial_rx_buffer_controller[4] = 0x7F; //  Analog Y Axis
  serial_rx_buffer_controller[5] = 0x7F; //  C X Axis
  serial_rx_buffer_controller[6] = 0x7F; //  C Y Axis
  serial_rx_buffer_controller[7] = 0x00; //  Mode (Bootleg), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
  serial_rx_buffer_controller[8] = 0x00; //  Unused
  serial_rx_buffer_controller[9] = 0x00; //  Delay Byte 2
  serial_rx_buffer_controller[10] = 0x00; // Delay Byte 1
  serial_rx_buffer_controller[11] = 0x01; // Postamble

  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer); serial_rx_buffer_counter++) {
    Serial.write(serial_rx_buffer_controller[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
    serial_rx_buffer_inverted_controller[serial_rx_buffer_counter] = ( serial_rx_buffer_controller[serial_rx_buffer_counter]); //  Invert 0 to 255 and vice versa to make it easier to determine which commands to enable or not, and their values
  }

  //  First 8 buttons, Buffer Array Element 1
  //  Start, Y, X, B, A, Digital L Trigger, Digital R Trigger, Z
  digitalWrite(commandArray[0], (serial_rx_buffer_inverted_controller[1] & B00000001));
  digitalWrite(commandArray[1], (serial_rx_buffer_inverted_controller[1] & B00000010));
  digitalWrite(commandArray[2], (serial_rx_buffer_inverted_controller[1] & B00000100));
  digitalWrite(commandArray[3], (serial_rx_buffer_inverted_controller[1] & B00001000));
  digitalWrite(commandArray[4], (serial_rx_buffer_inverted_controller[1] & B00010000));
  digitalWrite(commandArray[5], (serial_rx_buffer_inverted_controller[1] & B00100000));
  digitalWrite(commandArray[6], (serial_rx_buffer_inverted_controller[1] & B01000000));
  digitalWrite(commandArray[7], (serial_rx_buffer_inverted_controller[1] & B10000000));

  //  Second 8 buttons, Buffer Array Element 2
  //  DUp, DDown, DRight, DDleft, Analog L Trigger (Working Digitally), Analog R Trigger (Working Digitally), Macro (Bootleg), Turbo (Bootleg)
  digitalWrite(commandArray[8], (serial_rx_buffer_inverted_controller[2] & B00000001));
  digitalWrite(commandArray[9], (serial_rx_buffer_inverted_controller[2] & B00000010));
  digitalWrite(commandArray[10], (serial_rx_buffer_inverted_controller[2] & B00000100));
  digitalWrite(commandArray[11], (serial_rx_buffer_inverted_controller[2] & B00001000));
  digitalWrite(commandArray[12], ((255 - serial_rx_buffer_inverted_controller[2]) & B00010000));
  digitalWrite(commandArray[13], ((255 - serial_rx_buffer_inverted_controller[2]) & B00100000));
  digitalWrite(commandArray[14], (serial_rx_buffer_inverted_controller[2] & B01000000));
  digitalWrite(commandArray[15], (serial_rx_buffer_inverted_controller[2] & B10000000));

  //  4 Axis, Buffer Array Elements 3, 4, 5, 6
  //  Analog X Axis, Analog Y Axis, C X Axis, C Y Axis
  analogWrite(commandArray[16], (255 - serial_rx_buffer_inverted_controller[3]));
  analogWrite(commandArray[17], serial_rx_buffer_inverted_controller[4]);
  analogWrite(commandArray[18], (255 - serial_rx_buffer_inverted_controller[5]));
  analogWrite(commandArray[19], serial_rx_buffer_inverted_controller[6]);

  //  Mode Button, Buffer Array Element 7
  //  Mode (Bootleg), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
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
  //delay(2500); // Wait 2.5 seconds before reconnecting
  //  Tell the computer the connection has began succesfully
  isConnected = true;
  disconnectDone = currentMillis;
  Serial.begin(baudRate);
  Serial.setTimeout(1000);
  serial_rx_buffer_disconnect[0] = 0x0B;
  serial_rx_buffer_disconnect[11] = 0x0B;
  isConnected = true;
  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_disconnect); serial_rx_buffer_counter++) {
    Serial.write(serial_rx_buffer_disconnect[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
  }
  Serial.flush();

  //  Reset all Commands status just to make sure everything is working as intended
  serial_rx_buffer_controller[0] = 0x01; //  Preamble
  serial_rx_buffer_controller[1] = 0x00; //  Start, Y, X, B, A, Digital L Trigger, Digital R Trigger, Z
  serial_rx_buffer_controller[2] = 0x00; //  DUp, DDown, DRight, DDleft, Analog L Trigger (Working Digitally), Analog R Trigger (Working Digitally), Macro (Bootleg), Turbo (Bootleg)
  serial_rx_buffer_controller[3] = 0x7F; //  Analog X Axis
  serial_rx_buffer_controller[4] = 0x7F; //  Analog Y Axis
  serial_rx_buffer_controller[5] = 0x7F; //  C X Axis
  serial_rx_buffer_controller[6] = 0x7F; //  C Y Axis
  serial_rx_buffer_controller[7] = 0x00; //  Mode (Bootleg), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
  serial_rx_buffer_controller[8] = 0x00; //  Unused
  serial_rx_buffer_controller[9] = 0x00; //  Delay Byte 2
  serial_rx_buffer_controller[10] = 0x00; // Delay Byte 1
  serial_rx_buffer_controller[11] = 0x01; // Postamble

  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer); serial_rx_buffer_counter++) {
    Serial.write(serial_rx_buffer_controller[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
    serial_rx_buffer_inverted_controller[serial_rx_buffer_counter] = ( serial_rx_buffer_controller[serial_rx_buffer_counter]); //  Invert 0 to 255 and vice versa to make it easier to determine which commands to enable or not, and their values
  }

  //  First 8 buttons, Buffer Array Element 1
  //  Start, Y, X, B, A, Digital L Trigger, Digital R Trigger, Z
  digitalWrite(commandArray[0], (serial_rx_buffer_inverted_controller[1] & B00000001));
  digitalWrite(commandArray[1], (serial_rx_buffer_inverted_controller[1] & B00000010));
  digitalWrite(commandArray[2], (serial_rx_buffer_inverted_controller[1] & B00000100));
  digitalWrite(commandArray[3], (serial_rx_buffer_inverted_controller[1] & B00001000));
  digitalWrite(commandArray[4], (serial_rx_buffer_inverted_controller[1] & B00010000));
  digitalWrite(commandArray[5], (serial_rx_buffer_inverted_controller[1] & B00100000));
  digitalWrite(commandArray[6], (serial_rx_buffer_inverted_controller[1] & B01000000));
  digitalWrite(commandArray[7], (serial_rx_buffer_inverted_controller[1] & B10000000));

  //  Second 8 buttons, Buffer Array Element 2
  //  DUp, DDown, DRight, DDleft, Analog L Trigger (Working Digitally), Analog R Trigger (Working Digitally), Macro (Bootleg), Turbo (Bootleg)
  digitalWrite(commandArray[8], (serial_rx_buffer_inverted_controller[2] & B00000001));
  digitalWrite(commandArray[9], (serial_rx_buffer_inverted_controller[2] & B00000010));
  digitalWrite(commandArray[10], (serial_rx_buffer_inverted_controller[2] & B00000100));
  digitalWrite(commandArray[11], (serial_rx_buffer_inverted_controller[2] & B00001000));
  digitalWrite(commandArray[12], ((255 - serial_rx_buffer_inverted_controller[2]) & B00010000));
  digitalWrite(commandArray[13], ((255 - serial_rx_buffer_inverted_controller[2]) & B00100000));
  digitalWrite(commandArray[14], (serial_rx_buffer_inverted_controller[2] & B01000000));
  digitalWrite(commandArray[15], (serial_rx_buffer_inverted_controller[2] & B10000000));

  //  4 Axis, Buffer Array Elements 3, 4, 5, 6
  //  Analog X Axis, Analog Y Axis, C X Axis, C Y Axis
  analogWrite(commandArray[16], (255 - serial_rx_buffer_inverted_controller[3]));
  analogWrite(commandArray[17], serial_rx_buffer_inverted_controller[4]);
  analogWrite(commandArray[18], (255 - serial_rx_buffer_inverted_controller[5]));
  analogWrite(commandArray[19], serial_rx_buffer_inverted_controller[6]);

  //  Mode Button, Buffer Array Element 7
  //  Mode (Bootleg), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
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
  serial_rx_buffer_controller[1] = 0x00; //  Start, Y, X, B, A, Digital L Trigger, Digital R Trigger, Z
  serial_rx_buffer_controller[2] = 0x00; //  DUp, DDown, DRight, DDleft, Analog L Trigger (Working Digitally), Analog R Trigger (Working Digitally), Macro (Bootleg), Turbo (Bootleg)
  serial_rx_buffer_controller[3] = 0x7F; //  Analog X Axis
  serial_rx_buffer_controller[4] = 0x7F; //  Analog Y Axis
  serial_rx_buffer_controller[5] = 0x7F; //  C X Axis
  serial_rx_buffer_controller[6] = 0x7F; //  C Y Axis
  serial_rx_buffer_controller[7] = 0x00; //  Mode (Bootleg), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
  serial_rx_buffer_controller[8] = 0x00; //  Unused
  serial_rx_buffer_controller[9] = 0x00; //  Delay Byte 2
  serial_rx_buffer_controller[10] = 0x00; // Delay Byte 1
  serial_rx_buffer_controller[11] = 0x01; // Postamble

  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer); serial_rx_buffer_counter++) {
    Serial.write(serial_rx_buffer_controller[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
    serial_rx_buffer_inverted_controller[serial_rx_buffer_counter] = ( serial_rx_buffer_controller[serial_rx_buffer_counter]); //  Invert 0 to 255 and vice versa to make it easier to determine which commands to enable or not, and their values
  }

  //  First 8 buttons, Buffer Array Element 1
  //  Start, Y, X, B, A, Digital L Trigger, Digital R Trigger, Z
  digitalWrite(commandArray[0], (serial_rx_buffer_inverted_controller[1] & B00000001));
  digitalWrite(commandArray[1], (serial_rx_buffer_inverted_controller[1] & B00000010));
  digitalWrite(commandArray[2], (serial_rx_buffer_inverted_controller[1] & B00000100));
  digitalWrite(commandArray[3], (serial_rx_buffer_inverted_controller[1] & B00001000));
  digitalWrite(commandArray[4], (serial_rx_buffer_inverted_controller[1] & B00010000));
  digitalWrite(commandArray[5], (serial_rx_buffer_inverted_controller[1] & B00100000));
  digitalWrite(commandArray[6], (serial_rx_buffer_inverted_controller[1] & B01000000));
  digitalWrite(commandArray[7], (serial_rx_buffer_inverted_controller[1] & B10000000));

  //  Second 8 buttons, Buffer Array Element 2
  //  DUp, DDown, DRight, DDleft, Analog L Trigger (Working Digitally), Analog R Trigger (Working Digitally), Macro (Bootleg), Turbo (Bootleg)
  digitalWrite(commandArray[8], (serial_rx_buffer_inverted_controller[2] & B00000001));
  digitalWrite(commandArray[9], (serial_rx_buffer_inverted_controller[2] & B00000010));
  digitalWrite(commandArray[10], (serial_rx_buffer_inverted_controller[2] & B00000100));
  digitalWrite(commandArray[11], (serial_rx_buffer_inverted_controller[2] & B00001000));
  digitalWrite(commandArray[12], ((255 - serial_rx_buffer_inverted_controller[2]) & B00010000));
  digitalWrite(commandArray[13], ((255 - serial_rx_buffer_inverted_controller[2]) & B00100000));
  digitalWrite(commandArray[14], (serial_rx_buffer_inverted_controller[2] & B01000000));
  digitalWrite(commandArray[15], (serial_rx_buffer_inverted_controller[2] & B10000000));

  //  4 Axis, Buffer Array Elements 3, 4, 5, 6
  //  Analog X Axis, Analog Y Axis, C X Axis, C Y Axis
  analogWrite(commandArray[16], (255 - serial_rx_buffer_inverted_controller[3]));
  analogWrite(commandArray[17], serial_rx_buffer_inverted_controller[4]);
  analogWrite(commandArray[18], (255 - serial_rx_buffer_inverted_controller[5]));
  analogWrite(commandArray[19], serial_rx_buffer_inverted_controller[6]);

  //  Mode Button, Buffer Array Element 7
  //  Mode (Bootleg), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
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
  //delay(2500); // Wait 2.5 seconds before resetting
  Serial.begin(baudRate);
  Serial.setTimeout(1000);

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
  serial_rx_buffer_controller[1] = 0x00; //  Start, Y, X, B, A, Digital L Trigger, Digital R Trigger, Z
  serial_rx_buffer_controller[2] = 0x00; //  DUp, DDown, DRight, DDleft, Analog L Trigger (Working Digitally), Analog R Trigger (Working Digitally), Macro (Bootleg), Turbo (Bootleg)
  serial_rx_buffer_controller[3] = 0x7F; //  Analog X Axis
  serial_rx_buffer_controller[4] = 0x7F; //  Analog Y Axis
  serial_rx_buffer_controller[5] = 0x7F; //  C X Axis
  serial_rx_buffer_controller[6] = 0x7F; //  C Y Axis
  serial_rx_buffer_controller[7] = 0x00; //  Mode (Bootleg), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
  serial_rx_buffer_controller[8] = 0x00; //  Unused
  serial_rx_buffer_controller[9] = 0x00; //  Delay Byte 2
  serial_rx_buffer_controller[10] = 0x00; // Delay Byte 1
  serial_rx_buffer_controller[11] = 0x01; // Postamble

  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer); serial_rx_buffer_counter++) {
    Serial.write(serial_rx_buffer_controller[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
    serial_rx_buffer_inverted_controller[serial_rx_buffer_counter] = ( serial_rx_buffer_controller[serial_rx_buffer_counter]); //  Invert 0 to 255 and vice versa to make it easier to determine which commands to enable or not, and their values
  }

  //  First 8 buttons, Buffer Array Element 1
  //  Start, Y, X, B, A, Digital L Trigger, Digital R Trigger, Z
  digitalWrite(commandArray[0], (serial_rx_buffer_inverted_controller[1] & B00000001));
  digitalWrite(commandArray[1], (serial_rx_buffer_inverted_controller[1] & B00000010));
  digitalWrite(commandArray[2], (serial_rx_buffer_inverted_controller[1] & B00000100));
  digitalWrite(commandArray[3], (serial_rx_buffer_inverted_controller[1] & B00001000));
  digitalWrite(commandArray[4], (serial_rx_buffer_inverted_controller[1] & B00010000));
  digitalWrite(commandArray[5], (serial_rx_buffer_inverted_controller[1] & B00100000));
  digitalWrite(commandArray[6], (serial_rx_buffer_inverted_controller[1] & B01000000));
  digitalWrite(commandArray[7], (serial_rx_buffer_inverted_controller[1] & B10000000));

  //  Second 8 buttons, Buffer Array Element 2
  //  DUp, DDown, DRight, DDleft, Analog L Trigger (Working Digitally), Analog R Trigger (Working Digitally), Macro (Bootleg), Turbo (Bootleg)
  digitalWrite(commandArray[8], (serial_rx_buffer_inverted_controller[2] & B00000001));
  digitalWrite(commandArray[9], (serial_rx_buffer_inverted_controller[2] & B00000010));
  digitalWrite(commandArray[10], (serial_rx_buffer_inverted_controller[2] & B00000100));
  digitalWrite(commandArray[11], (serial_rx_buffer_inverted_controller[2] & B00001000));
  digitalWrite(commandArray[12], ((255 - serial_rx_buffer_inverted_controller[2]) & B00010000));
  digitalWrite(commandArray[13], ((255 - serial_rx_buffer_inverted_controller[2]) & B00100000));
  digitalWrite(commandArray[14], (serial_rx_buffer_inverted_controller[2] & B01000000));
  digitalWrite(commandArray[15], (serial_rx_buffer_inverted_controller[2] & B10000000));

  //  4 Axis, Buffer Array Elements 3, 4, 5, 6
  //  Analog X Axis, Analog Y Axis, C X Axis, C Y Axis
  analogWrite(commandArray[16], (255 - serial_rx_buffer_inverted_controller[3]));
  analogWrite(commandArray[17], serial_rx_buffer_inverted_controller[4]);
  analogWrite(commandArray[18], (255 - serial_rx_buffer_inverted_controller[5]));
  analogWrite(commandArray[19], serial_rx_buffer_inverted_controller[6]);

  //  Mode Button, Buffer Array Element 7
  //  Mode (Bootleg), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
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
    if (sendInputOnlyOnce == true)
    {
      if (sentInputOnce == false)
      {
        for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_controller); serial_rx_buffer_counter++) {
          Serial.write(serial_rx_buffer_controller[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
          //  Invert 0 to 255 and vice versa to make it easier to determine which commands to enable or not, and their values
          serial_rx_buffer_inverted_controller[serial_rx_buffer_counter] = ( serial_rx_buffer_controller[serial_rx_buffer_counter]);
          sentInputOnce = true;
          //Serial.println("TEST 1A");
        }
      }
    }

    if (sendInputOnlyOnce == false)
    {
      if (sentInputOnce == true)
      {
        for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_controller); serial_rx_buffer_counter++) {
          Serial.write(serial_rx_buffer_controller[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
          //  Invert 0 to 255 and vice versa to make it easier to determine which commands to enable or not, and their values
          serial_rx_buffer_inverted_controller[serial_rx_buffer_counter] = ( serial_rx_buffer_controller[serial_rx_buffer_counter]);
          //sentInputOnce = true;
          //Serial.println("TEST 1B");
        }
      }
    }
    //Serial.print('\n');
    Serial.flush();
    //  Press Button

    //  First 8 buttons, Buffer Array Element 1
    //  Start, Y, X, B, A, Digital L Trigger, Digital R Trigger, Z
    digitalWrite(commandArray[0], (serial_rx_buffer_inverted_controller[1] & B00000001));
    digitalWrite(commandArray[1], (serial_rx_buffer_inverted_controller[1] & B00000010));
    digitalWrite(commandArray[2], (serial_rx_buffer_inverted_controller[1] & B00000100));
    digitalWrite(commandArray[3], (serial_rx_buffer_inverted_controller[1] & B00001000));
    digitalWrite(commandArray[4], (serial_rx_buffer_inverted_controller[1] & B00010000));
    digitalWrite(commandArray[5], (serial_rx_buffer_inverted_controller[1] & B00100000));
    digitalWrite(commandArray[6], (serial_rx_buffer_inverted_controller[1] & B01000000));
    digitalWrite(commandArray[7], (serial_rx_buffer_inverted_controller[1] & B10000000));

    //  Second 8 buttons, Buffer Array Element 2
    //  DUp, DDown, DRight, DDleft, Analog L Trigger (Working Digitally), Analog R Trigger (Working Digitally), Macro (Bootleg), Turbo (Bootleg)
    digitalWrite(commandArray[8], (serial_rx_buffer_inverted_controller[2] & B00000001));
    digitalWrite(commandArray[9], (serial_rx_buffer_inverted_controller[2] & B00000010));
    digitalWrite(commandArray[10], (serial_rx_buffer_inverted_controller[2] & B00000100));
    digitalWrite(commandArray[11], (serial_rx_buffer_inverted_controller[2] & B00001000));
    digitalWrite(commandArray[12], ((255 - serial_rx_buffer_inverted_controller[2]) & B00010000));
    digitalWrite(commandArray[13], ((255 - serial_rx_buffer_inverted_controller[2]) & B00100000));
    digitalWrite(commandArray[14], (serial_rx_buffer_inverted_controller[2] & B01000000));
    digitalWrite(commandArray[15], (serial_rx_buffer_inverted_controller[2] & B10000000));

    //  4 Axis, Buffer Array Elements 3, 4, 5, 6
    //  Analog X Axis, Analog Y Axis, C X Axis, C Y Axis
    analogWrite(commandArray[16], (255 - serial_rx_buffer_inverted_controller[3]));
    analogWrite(commandArray[17], serial_rx_buffer_inverted_controller[4]);
    analogWrite(commandArray[18], (255 - serial_rx_buffer_inverted_controller[5]));
    analogWrite(commandArray[19], serial_rx_buffer_inverted_controller[6]);

    //  Mode Button, Buffer Array Element 7
    //  Mode (Bootleg), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
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
          //serial_rx_buffer_controller[0] = 0x00; //  Preamble
          serial_rx_buffer_controller[1] = 0x00; //  Start, Y, X, B, A, Digital L Trigger, Digital R Trigger, Z
          serial_rx_buffer_controller[2] = 0x00; //  DUp, DDown, DRight, DDleft, Analog L Trigger (Working Digitally), Analog R Trigger (Working Digitally), Macro (Bootleg), Turbo (Bootleg)
          serial_rx_buffer_controller[3] = 0x7F; //  Analog X Axis
          serial_rx_buffer_controller[4] = 0x7F; //  Analog Y Axis
          serial_rx_buffer_controller[5] = 0x7F; //  C X Axis
          serial_rx_buffer_controller[6] = 0x7F; //  C Y Axis
          serial_rx_buffer_controller[7] = 0x00; //  Mode (Bootleg), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
          serial_rx_buffer_controller[8] = 0x00; //  Unused
          //serial_rx_buffer_controller[9] = 0x00; //  Delay Byte 2
          //serial_rx_buffer_controller[10] = 0x00; // Delay Byte 1
          //serial_rx_buffer_controller[11] = 0x00; // Postamble

          for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_controller); serial_rx_buffer_counter++) {
            Serial.write(serial_rx_buffer_controller[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
            //  Invert 0 to 255 and vice versa to make it easier to determine which commands to enable or not, and their values
            serial_rx_buffer_inverted_controller[serial_rx_buffer_counter] = ( serial_rx_buffer_controller[serial_rx_buffer_counter]);
            //Serial.println("TEST 2");
          }

          //  Reset delay to 0
          serial_rx_buffer_controller[0] = 0x00; //  Preamble
          serial_rx_buffer_controller[1] = 0x00; //  Start, Y, X, B, A, Digital L Trigger, Digital R Trigger, Z
          serial_rx_buffer_controller[2] = 0x00; //  DUp, DDown, DRight, DDleft, Analog L Trigger (Working Digitally), Analog R Trigger (Working Digitally), Macro (Bootleg), Turbo (Bootleg)
          serial_rx_buffer_controller[3] = 0x7F; //  Analog X Axis
          serial_rx_buffer_controller[4] = 0x7F; //  Analog Y Axis
          serial_rx_buffer_controller[5] = 0x7F; //  C X Axis
          serial_rx_buffer_controller[6] = 0x7F; //  C Y Axis
          serial_rx_buffer_controller[7] = 0x00; //  Mode (Bootleg), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
          serial_rx_buffer_controller[8] = 0x00; //  Unused
          serial_rx_buffer_controller[9] = 0x00; //  Delay Byte 2
          serial_rx_buffer_controller[10] = 0x00; // Delay Byte 1
          serial_rx_buffer_controller[11] = 0x00; // Postamble

          for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_controller); serial_rx_buffer_counter++) {
            Serial.write(serial_rx_buffer_controller[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
            //  Invert 0 to 255 and vice versa to make it easier to determine which commands to enable or not, and their values
            serial_rx_buffer_inverted_controller[serial_rx_buffer_counter] = ( serial_rx_buffer_controller[serial_rx_buffer_counter]);
            //Serial.println("TEST 3");
          }

          //  First 8 buttons, Buffer Array Element 1
          //  Start, Y, X, B, A, Digital L Trigger, Digital R Trigger, Z
          digitalWrite(commandArray[0], (serial_rx_buffer_inverted_controller[1] & B00000001));
          digitalWrite(commandArray[1], (serial_rx_buffer_inverted_controller[1] & B00000010));
          digitalWrite(commandArray[2], (serial_rx_buffer_inverted_controller[1] & B00000100));
          digitalWrite(commandArray[3], (serial_rx_buffer_inverted_controller[1] & B00001000));
          digitalWrite(commandArray[4], (serial_rx_buffer_inverted_controller[1] & B00010000));
          digitalWrite(commandArray[5], (serial_rx_buffer_inverted_controller[1] & B00100000));
          digitalWrite(commandArray[6], (serial_rx_buffer_inverted_controller[1] & B01000000));
          digitalWrite(commandArray[7], (serial_rx_buffer_inverted_controller[1] & B10000000));

          //  Second 8 buttons, Buffer Array Element 2
          //  DUp, DDown, DRight, DDleft, Analog L Trigger (Working Digitally), Analog R Trigger (Working Digitally), Macro (Bootleg), Turbo (Bootleg)
          digitalWrite(commandArray[8], (serial_rx_buffer_inverted_controller[2] & B00000001));
          digitalWrite(commandArray[9], (serial_rx_buffer_inverted_controller[2] & B00000010));
          digitalWrite(commandArray[10], (serial_rx_buffer_inverted_controller[2] & B00000100));
          digitalWrite(commandArray[11], (serial_rx_buffer_inverted_controller[2] & B00001000));
          digitalWrite(commandArray[12], ((255 - serial_rx_buffer_inverted_controller[2]) & B00010000));
          digitalWrite(commandArray[13], ((255 - serial_rx_buffer_inverted_controller[2]) & B00100000));
          digitalWrite(commandArray[14], (serial_rx_buffer_inverted_controller[2] & B01000000));
          digitalWrite(commandArray[15], (serial_rx_buffer_inverted_controller[2] & B10000000));

          //  4 Axis, Buffer Array Elements 3, 4, 5, 6
          //  Analog X Axis, Analog Y Axis, C X Axis, C Y Axis
          analogWrite(commandArray[16], (255 - serial_rx_buffer_inverted_controller[3]));
          analogWrite(commandArray[17], serial_rx_buffer_inverted_controller[4]);
          analogWrite(commandArray[18], (255 - serial_rx_buffer_inverted_controller[5]));
          analogWrite(commandArray[19], serial_rx_buffer_inverted_controller[6]);

          //  Mode Button, Buffer Array Element 7
          //  Mode (Bootleg), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
          digitalWrite(commandArray[20], (serial_rx_buffer_inverted_controller[7] & B00000001));

          //  Buffer Array Element 8 is unused in this code, but is existing in case changes are needed
          //Serial.print('\n');
          Serial.flush();

          if (resetBeforeInputStatus == 0) {
            manualResetControllerData();
            readMotors();
          }

          isInputtingDelayed = false;
          isInputting = false;
          //sentInputOnce = true;
          previousInputDelay += inputDelay;
          inputDelay = 0;
        }
      }
    }
  }
}

void getPing() {
  readMotors();
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
  sentPong = false;
  readMotors();
}

void getPong() {
  readMotors();
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
  Serial.flush();
  readMotors();
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
    if (readMotorsAlongSendPing == 0)
    {
      readMotors();
    }
    //readMotors();
    previousPingDelay += pingDelay;
  }
  sentPing = false;
}

void calculatePing() {
  //  Calculate delay since last PONG sent from the computer, If the computer doesn't respond with PONG in 10 seconds since the last PONG sent from the computer, connection is interrupted and the restarted
  calcPingTimestampIn = (currentMillis - previousPingDelay);
  if (autoDisconnectOnPingTimeout == 0) {
    if ((calcPongTimestampIn - calcPingTimestampIn >= 10000) && (calcPongTimestampIn - calcPingTimestampIn <= currentMillis)) {
      disconnectCalled = currentMillis;

      //  Before disconnecting, we need to reset all Command status, and tell the computer they were reset
      serial_rx_buffer_controller[0] = 0x01; //  Preamble
      serial_rx_buffer_controller[1] = 0x00; //  Start, Y, X, B, A, Digital L Trigger, Digital R Trigger, Z
      serial_rx_buffer_controller[2] = 0x00; //  DUp, DDown, DRight, DDleft, Analog L Trigger (Working Digitally), Analog R Trigger (Working Digitally), Macro (Bootleg), Turbo (Bootleg)
      serial_rx_buffer_controller[3] = 0x7F; //  Analog X Axis
      serial_rx_buffer_controller[4] = 0x7F; //  Analog Y Axis
      serial_rx_buffer_controller[5] = 0x7F; //  C X Axis
      serial_rx_buffer_controller[6] = 0x7F; //  C Y Axis
      serial_rx_buffer_controller[7] = 0x00; //  Mode (Bootleg), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
      serial_rx_buffer_controller[8] = 0x00; //  Unused
      serial_rx_buffer_controller[9] = 0x00; //  Delay Byte 2
      serial_rx_buffer_controller[10] = 0x00; // Delay Byte 1
      serial_rx_buffer_controller[11] = 0x01; // Postamble

      for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer); serial_rx_buffer_counter++) {
        Serial.write(serial_rx_buffer_controller[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
        serial_rx_buffer_inverted_controller[serial_rx_buffer_counter] = ( serial_rx_buffer_controller[serial_rx_buffer_counter]); //  Invert 0 to 255 and vice versa to make it easier to determine which commands to enable or not, and their values
      }

      //  First 8 buttons, Buffer Array Element 1
      //  Start, Y, X, B, A, Digital L Trigger, Digital R Trigger, Z
      digitalWrite(commandArray[0], (serial_rx_buffer_inverted_controller[1] & B00000001));
      digitalWrite(commandArray[1], (serial_rx_buffer_inverted_controller[1] & B00000010));
      digitalWrite(commandArray[2], (serial_rx_buffer_inverted_controller[1] & B00000100));
      digitalWrite(commandArray[3], (serial_rx_buffer_inverted_controller[1] & B00001000));
      digitalWrite(commandArray[4], (serial_rx_buffer_inverted_controller[1] & B00010000));
      digitalWrite(commandArray[5], (serial_rx_buffer_inverted_controller[1] & B00100000));
      digitalWrite(commandArray[6], (serial_rx_buffer_inverted_controller[1] & B01000000));
      digitalWrite(commandArray[7], (serial_rx_buffer_inverted_controller[1] & B10000000));

      //  Second 8 buttons, Buffer Array Element 2
      //  DUp, DDown, DRight, DDleft, Analog L Trigger (Working Digitally), Analog R Trigger (Working Digitally), Macro (Bootleg), Turbo (Bootleg)
      digitalWrite(commandArray[8], (serial_rx_buffer_inverted_controller[2] & B00000001));
      digitalWrite(commandArray[9], (serial_rx_buffer_inverted_controller[2] & B00000010));
      digitalWrite(commandArray[10], (serial_rx_buffer_inverted_controller[2] & B00000100));
      digitalWrite(commandArray[11], (serial_rx_buffer_inverted_controller[2] & B00001000));
      digitalWrite(commandArray[12], ((255 - serial_rx_buffer_inverted_controller[2]) & B00010000));
      digitalWrite(commandArray[13], ((255 - serial_rx_buffer_inverted_controller[2]) & B00100000));
      digitalWrite(commandArray[14], (serial_rx_buffer_inverted_controller[2] & B01000000));
      digitalWrite(commandArray[15], (serial_rx_buffer_inverted_controller[2] & B10000000));

      //  4 Axis, Buffer Array Elements 3, 4, 5, 6
      //  Analog X Axis, Analog Y Axis, C X Axis, C Y Axis
      analogWrite(commandArray[16], (255 - serial_rx_buffer_inverted_controller[3]));
      analogWrite(commandArray[17], serial_rx_buffer_inverted_controller[4]);
      analogWrite(commandArray[18], (255 - serial_rx_buffer_inverted_controller[5]));
      analogWrite(commandArray[19], serial_rx_buffer_inverted_controller[6]);

      //  Mode Button, Buffer Array Element 7
      //  Mode (Bootleg), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
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
      //delay(2500); // Wait 2.5 seconds before starting connection
      //Serial.println("Sending shit after connection has closed");
      Serial.begin(baudRate);
      Serial.setTimeout(1000);
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
      serial_rx_buffer_controller[1] = 0x00; //  Start, Y, X, B, A, Digital L Trigger, Digital R Trigger, Z
      serial_rx_buffer_controller[2] = 0x00; //  DUp, DDown, DRight, DDleft, Analog L Trigger (Working Digitally), Analog R Trigger (Working Digitally), Macro (Bootleg), Turbo (Bootleg)
      serial_rx_buffer_controller[3] = 0x7F; //  Analog X Axis
      serial_rx_buffer_controller[4] = 0x7F; //  Analog Y Axis
      serial_rx_buffer_controller[5] = 0x7F; //  C X Axis
      serial_rx_buffer_controller[6] = 0x7F; //  C Y Axis
      serial_rx_buffer_controller[7] = 0x00; //  Mode (Bootleg), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
      serial_rx_buffer_controller[8] = 0x00; //  Unused
      serial_rx_buffer_controller[9] = 0x00; //  Delay Byte 2
      serial_rx_buffer_controller[10] = 0x00; // Delay Byte 1
      serial_rx_buffer_controller[11] = 0x01; // Postamble

      for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer); serial_rx_buffer_counter++) {
        Serial.write(serial_rx_buffer_controller[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
        serial_rx_buffer_inverted_controller[serial_rx_buffer_counter] = ( serial_rx_buffer_controller[serial_rx_buffer_counter]); //  Invert 0 to 255 and vice versa to make it easier to determine which commands to enable or not, and their values
      }

      //  First 8 buttons, Buffer Array Element 1
      //  Start, Y, X, B, A, Digital L Trigger, Digital R Trigger, Z
      digitalWrite(commandArray[0], (serial_rx_buffer_inverted_controller[1] & B00000001));
      digitalWrite(commandArray[1], (serial_rx_buffer_inverted_controller[1] & B00000010));
      digitalWrite(commandArray[2], (serial_rx_buffer_inverted_controller[1] & B00000100));
      digitalWrite(commandArray[3], (serial_rx_buffer_inverted_controller[1] & B00001000));
      digitalWrite(commandArray[4], (serial_rx_buffer_inverted_controller[1] & B00010000));
      digitalWrite(commandArray[5], (serial_rx_buffer_inverted_controller[1] & B00100000));
      digitalWrite(commandArray[6], (serial_rx_buffer_inverted_controller[1] & B01000000));
      digitalWrite(commandArray[7], (serial_rx_buffer_inverted_controller[1] & B10000000));

      //  Second 8 buttons, Buffer Array Element 2
      //  DUp, DDown, DRight, DDleft, Analog L Trigger (Working Digitally), Analog R Trigger (Working Digitally), Macro (Bootleg), Turbo (Bootleg)
      digitalWrite(commandArray[8], (serial_rx_buffer_inverted_controller[2] & B00000001));
      digitalWrite(commandArray[9], (serial_rx_buffer_inverted_controller[2] & B00000010));
      digitalWrite(commandArray[10], (serial_rx_buffer_inverted_controller[2] & B00000100));
      digitalWrite(commandArray[11], (serial_rx_buffer_inverted_controller[2] & B00001000));
      digitalWrite(commandArray[12], ((255 - serial_rx_buffer_inverted_controller[2]) & B00010000));
      digitalWrite(commandArray[13], ((255 - serial_rx_buffer_inverted_controller[2]) & B00100000));
      digitalWrite(commandArray[14], (serial_rx_buffer_inverted_controller[2] & B01000000));
      digitalWrite(commandArray[15], (serial_rx_buffer_inverted_controller[2] & B10000000));

      //  4 Axis, Buffer Array Elements 3, 4, 5, 6
      //  Analog X Axis, Analog Y Axis, C X Axis, C Y Axis
      analogWrite(commandArray[16], (255 - serial_rx_buffer_inverted_controller[3]));
      analogWrite(commandArray[17], serial_rx_buffer_inverted_controller[4]);
      analogWrite(commandArray[18], (255 - serial_rx_buffer_inverted_controller[5]));
      analogWrite(commandArray[19], serial_rx_buffer_inverted_controller[6]);

      //  Mode Button, Buffer Array Element 7
      //  Mode (Bootleg), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
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

void manualResetControllerData()
{
  //  This function resets controller data when requested by the computer. Can be used for example when something goes wrong on the computer's end.
  inputDelay = 0;
  isInputtingDelayed = false;
  isInputting = false;
  serial_rx_buffer_controller[0] = 0x01; //  Preamble
  serial_rx_buffer_controller[1] = 0x00; //  Start, Y, X, B, A, Digital L Trigger, Digital R Trigger, Z
  serial_rx_buffer_controller[2] = 0x00; //  DUp, DDown, DRight, DDleft, Analog L Trigger (Working Digitally), Analog R Trigger (Working Digitally), Macro (Bootleg), Turbo (Bootleg)
  serial_rx_buffer_controller[3] = 0x7F; //  Analog X Axis
  serial_rx_buffer_controller[4] = 0x7F; //  Analog Y Axis
  serial_rx_buffer_controller[5] = 0x7F; //  C X Axis
  serial_rx_buffer_controller[6] = 0x7F; //  C Y Axis
  serial_rx_buffer_controller[7] = 0x00; //  Mode (Bootleg), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
  serial_rx_buffer_controller[8] = 0x00; //  Unused
  serial_rx_buffer_controller[9] = 0x00; //  Delay Byte 2
  serial_rx_buffer_controller[10] = 0x00; // Delay Byte 1
  serial_rx_buffer_controller[11] = 0x01; // Postamble

  for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer); serial_rx_buffer_counter++) {
    Serial.write(serial_rx_buffer_controller[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
    serial_rx_buffer_inverted_controller[serial_rx_buffer_counter] = ( serial_rx_buffer_controller[serial_rx_buffer_counter]); //  Invert 0 to 255 and vice versa to make it easier to determine which commands to enable or not, and their values
  }

  //  First 8 buttons, Buffer Array Element 1
  //  Start, Y, X, B, A, Digital L Trigger, Digital R Trigger, Z
  digitalWrite(commandArray[0], (serial_rx_buffer_inverted_controller[1] & B00000001));
  digitalWrite(commandArray[1], (serial_rx_buffer_inverted_controller[1] & B00000010));
  digitalWrite(commandArray[2], (serial_rx_buffer_inverted_controller[1] & B00000100));
  digitalWrite(commandArray[3], (serial_rx_buffer_inverted_controller[1] & B00001000));
  digitalWrite(commandArray[4], (serial_rx_buffer_inverted_controller[1] & B00010000));
  digitalWrite(commandArray[5], (serial_rx_buffer_inverted_controller[1] & B00100000));
  digitalWrite(commandArray[6], (serial_rx_buffer_inverted_controller[1] & B01000000));
  digitalWrite(commandArray[7], (serial_rx_buffer_inverted_controller[1] & B10000000));

  //  Second 8 buttons, Buffer Array Element 2
  //  DUp, DDown, DRight, DDleft, Analog L Trigger (Working Digitally), Analog R Trigger (Working Digitally), Macro (Bootleg), Turbo (Bootleg)
  digitalWrite(commandArray[8], (serial_rx_buffer_inverted_controller[2] & B00000001));
  digitalWrite(commandArray[9], (serial_rx_buffer_inverted_controller[2] & B00000010));
  digitalWrite(commandArray[10], (serial_rx_buffer_inverted_controller[2] & B00000100));
  digitalWrite(commandArray[11], (serial_rx_buffer_inverted_controller[2] & B00001000));
  digitalWrite(commandArray[12], ((255 - serial_rx_buffer_inverted_controller[2]) & B00010000));
  digitalWrite(commandArray[13], ((255 - serial_rx_buffer_inverted_controller[2]) & B00100000));
  digitalWrite(commandArray[14], (serial_rx_buffer_inverted_controller[2] & B01000000));
  digitalWrite(commandArray[15], (serial_rx_buffer_inverted_controller[2] & B10000000));

  //  4 Axis, Buffer Array Elements 3, 4, 5, 6
  //  Analog X Axis, Analog Y Axis, C X Axis, C Y Axis
  analogWrite(commandArray[16], (255 - serial_rx_buffer_inverted_controller[3]));
  analogWrite(commandArray[17], serial_rx_buffer_inverted_controller[4]);
  analogWrite(commandArray[18], (255 - serial_rx_buffer_inverted_controller[5]));
  analogWrite(commandArray[19], serial_rx_buffer_inverted_controller[6]);

  //  Mode Button, Buffer Array Element 7
  //  Mode (Bootleg), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
  digitalWrite(commandArray[20], (serial_rx_buffer_inverted_controller[7] & B00000001));

  //  Buffer Array Element 8 is unused in this code, but is existing in case changes are needed
  Serial.flush();
  inputDelay = 0;
  isInputtingDelayed = false;
  isInputting = false;
}

void autoResetControllerData()
{
  //  This function resets controller data when every 500ms, but only when there's no Input being executed.
  if (currentMillis - previousResetControllerDataDelay >= resetControllerDataDelay) {
    if (isInputting == false) {
      //  This function resets contreoller data when requested by the computer. Can be used for example when something goes wrong on the computer's end.
      inputDelay = 0;
      isInputtingDelayed = false;
      isInputting = false;
      serial_rx_buffer_controller[0] = 0x01; //  Preamble
      serial_rx_buffer_controller[1] = 0x00; //  Start, Y, X, B, A, Digital L Trigger, Digital R Trigger, Z
      serial_rx_buffer_controller[2] = 0x00; //  DUp, DDown, DRight, DDleft, Analog L Trigger (Working Digitally), Analog R Trigger (Working Digitally), Macro (Bootleg), Turbo (Bootleg)
      serial_rx_buffer_controller[3] = 0x7F; //  Analog X Axis
      serial_rx_buffer_controller[4] = 0x7F; //  Analog Y Axis
      serial_rx_buffer_controller[5] = 0x7F; //  C X Axis
      serial_rx_buffer_controller[6] = 0x7F; //  C Y Axis
      serial_rx_buffer_controller[7] = 0x00; //  Mode (Bootleg), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
      serial_rx_buffer_controller[8] = 0x00; //  Unused
      serial_rx_buffer_controller[9] = 0x00; //  Delay Byte 2
      serial_rx_buffer_controller[10] = 0x00; // Delay Byte 1
      serial_rx_buffer_controller[11] = 0x01; // Postamble

      for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer); serial_rx_buffer_counter++) {
        if (autoResetControllerDataStatus == 0) {
          Serial.write(serial_rx_buffer_controller[serial_rx_buffer_counter]); //  This line writes the serial data back to the computer as a way to check if the Arduino isn't interpreting wrong values
        }
        serial_rx_buffer_inverted_controller[serial_rx_buffer_counter] = ( serial_rx_buffer_controller[serial_rx_buffer_counter]); //  Invert 0 to 255 and vice versa to make it easier to determine which commands to enable or not, and their values
      }

      //  First 8 buttons, Buffer Array Element 1
      //  Start, Y, X, B, A, Digital L Trigger, Digital R Trigger, Z
      digitalWrite(commandArray[0], (serial_rx_buffer_inverted_controller[1] & B00000001));
      digitalWrite(commandArray[1], (serial_rx_buffer_inverted_controller[1] & B00000010));
      digitalWrite(commandArray[2], (serial_rx_buffer_inverted_controller[1] & B00000100));
      digitalWrite(commandArray[3], (serial_rx_buffer_inverted_controller[1] & B00001000));
      digitalWrite(commandArray[4], (serial_rx_buffer_inverted_controller[1] & B00010000));
      digitalWrite(commandArray[5], (serial_rx_buffer_inverted_controller[1] & B00100000));
      digitalWrite(commandArray[6], (serial_rx_buffer_inverted_controller[1] & B01000000));
      digitalWrite(commandArray[7], (serial_rx_buffer_inverted_controller[1] & B10000000));

      //  Second 8 buttons, Buffer Array Element 2
      //  DUp, DDown, DRight, DDleft, Analog L Trigger (Working Digitally), Analog R Trigger (Working Digitally), Macro (Bootleg), Turbo (Bootleg)
      digitalWrite(commandArray[8], (serial_rx_buffer_inverted_controller[2] & B00000001));
      digitalWrite(commandArray[9], (serial_rx_buffer_inverted_controller[2] & B00000010));
      digitalWrite(commandArray[10], (serial_rx_buffer_inverted_controller[2] & B00000100));
      digitalWrite(commandArray[11], (serial_rx_buffer_inverted_controller[2] & B00001000));
      digitalWrite(commandArray[12], ((255 - serial_rx_buffer_inverted_controller[2]) & B00010000));
      digitalWrite(commandArray[13], ((255 - serial_rx_buffer_inverted_controller[2]) & B00100000));
      digitalWrite(commandArray[14], (serial_rx_buffer_inverted_controller[2] & B01000000));
      digitalWrite(commandArray[15], (serial_rx_buffer_inverted_controller[2] & B10000000));

      //  4 Axis, Buffer Array Elements 3, 4, 5, 6
      //  Analog X Axis, Analog Y Axis, C X Axis, C Y Axis
      analogWrite(commandArray[16], (255 - serial_rx_buffer_inverted_controller[3]));
      analogWrite(commandArray[17], serial_rx_buffer_inverted_controller[4]);
      analogWrite(commandArray[18], (255 - serial_rx_buffer_inverted_controller[5]));
      analogWrite(commandArray[19], serial_rx_buffer_inverted_controller[6]);

      //  Mode Button, Buffer Array Element 7
      //  Mode (Bootleg), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
      digitalWrite(commandArray[20], (serial_rx_buffer_inverted_controller[7] & B00000001));

      //  Buffer Array Element 8 is unused in this code, but is existing in case changes are needed
      if (autoResetControllerDataStatus == 0) {
        Serial.flush();
      }
      inputDelay = 0;
      isInputtingDelayed = false;
      isInputting = false;
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

    vccReading = (analogRead(vccPin));
    //  ~25 when floating (Unplugged from the PlayStation or PlayStation 2)
    //  ~64 when turned off through the Low-Power Solid-State relay
    //  ~196 when turned on through the Low-Power Solid-State relay and plugged in to the PS2
    vccReading = map(vccReading, 0, 1023, 0, 255);

    serial_rx_buffer_motor[5] = vccReading;
    serial_rx_buffer_motor[6] = leftMotorVal;
    serial_rx_buffer_motor[7] = rightMotorVal;
    serial_rx_buffer_motor[8] = analogLedVal;
    //Serial.print('\n');
    for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_motor); serial_rx_buffer_counter++) {
      if (serial_rx_buffer_counter == 0) {
        Serial.write(0x06);
      }
      if ((serial_rx_buffer_counter == 1) || (serial_rx_buffer_counter == 2) || (serial_rx_buffer_counter == 3) || (serial_rx_buffer_counter == 4)) {
        Serial.write(0x00);
      }
      if ((serial_rx_buffer_counter == 5) || (serial_rx_buffer_counter == 6) || (serial_rx_buffer_counter == 7) || (serial_rx_buffer_counter == 8)) {
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
  }
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

    vccReading = (analogRead(vccPin));
    //  ~25 when floating (Unplugged from the PlayStation or PlayStation 2)
    //  ~64 when turned off through the Low-Power Solid-State relay
    //  ~196 when turned on through the Low-Power Solid-State relay and plugged in to the PS2
    vccReading = map(vccReading, 0, 1023, 0, 255);

    serial_rx_buffer_motor[5] = vccReading;
    serial_rx_buffer_motor[6] = leftMotorVal;
    serial_rx_buffer_motor[7] = rightMotorVal;
    serial_rx_buffer_motor[8] = analogLedVal;
    //Serial.print('\n');
    for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_motor); serial_rx_buffer_counter++) {
      if (serial_rx_buffer_counter == 0) {
        Serial.write(0x08);
      }
      if ((serial_rx_buffer_counter == 1) || (serial_rx_buffer_counter == 2) || (serial_rx_buffer_counter == 3) || (serial_rx_buffer_counter == 4)) {
        Serial.write(0x00);
      }
      if ((serial_rx_buffer_counter == 5) || (serial_rx_buffer_counter == 6) || (serial_rx_buffer_counter == 7) || (serial_rx_buffer_counter == 8)) {
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
  }
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

    vccReading = (analogRead(vccPin));
    //  ~25 when floating (Unplugged from the PlayStation or PlayStation 2)
    //  ~64 when turned off through the Low-Power Solid-State relay
    //  ~196 when turned on through the Low-Power Solid-State relay and plugged in to the PS2
    vccReading = map(vccReading, 0, 1023, 0, 255);

    serial_rx_buffer_motor[5] = vccReading;
    serial_rx_buffer_motor[6] = leftMotorVal;
    serial_rx_buffer_motor[7] = rightMotorVal;
    serial_rx_buffer_motor[8] = analogLedVal;
    //Serial.print('\n');
    for (serial_rx_buffer_counter = 0; serial_rx_buffer_counter < sizeof(serial_rx_buffer_motor); serial_rx_buffer_counter++) {
      if (serial_rx_buffer_counter == 0) {
        Serial.write(0x07);
      }
      if ((serial_rx_buffer_counter == 1) || (serial_rx_buffer_counter == 2) || (serial_rx_buffer_counter == 3) || (serial_rx_buffer_counter == 4)) {
        Serial.write(0x00);
      }
      if ((serial_rx_buffer_counter == 5) || (serial_rx_buffer_counter == 6) || (serial_rx_buffer_counter == 7) || (serial_rx_buffer_counter == 8)) {
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
  }
}
