/*
  N64 Controller for Arduino Uno v1.0 by WhatAboutGamingLive https://www.twitch.tv/whataboutgaminglive/
  For use in the Twitch.TV stream TwitchTriesToPlay.
  https://www.twitch.tv/twitchtriestoplay
  https://github.com/WhatAboutGaming/Twitch-Plays-Stuff

  Reference:
  http://cnt.at-ninja.jp/n64_dpp/N64%20controller.htm
  http://svn.navi.cx/misc/trunk/wasabi/devices/cube64/notes/n64-observations
  http://www.acidmods.com/RDC/NINTENDO/N64/N64_Controller_200010_Top_CLEAN.jpg
  http://www.acidmods.com/RDC/NINTENDO/N64/N64_Controller_700010_Top.jpg
  http://slagcoin.com/joystick/pcb_diagrams/n64_diagram1.jpg
  https://i.imgur.com/ZMwTdwp.png
  https://dpedu.io/article/2015-03-11/nintendo-64-joystick-pinout-arduino
  https://www.youtube.com/watch?v=0QLZCfqUeg4
*/

/*
  PINOUTS


  Protoboard Side Arduino Side  N64 Controller Side
  1               2             A
  8               3             D-Right
  7               4             D-Left
  6               5             D-Down
  5               6             D-Up
  4               7             Start
  3               8             Z
  2               9             B
  9               10            L
  10              11            R
  11              12            C-Up
  12              13            C-Down
  13              A0            C-Left
  17              A1            Analog YQ
  16              A2            Analog XI
  18              A3            Analog YI
  15              A4            Analog XQ
  14              A5            C-Right
*/

#define buttonA 2
#define buttonDRight 3
#define buttonDLeft 4
#define buttonDDown 5
#define buttonDUp 6
#define buttonStart 7
#define buttonZ 8
#define buttonB 9
#define buttonL 10
#define buttonR 11
#define buttonCUp 12
#define buttonCDown 13
#define buttonCLeft A0
#define axisYq A1
#define axisXi A2
#define axisYi A3
#define axisXq A4
#define buttonCRight A5

unsigned int xAxisStepCounter = 0;
unsigned int yAxisStepCounter = 0;

unsigned int xAxisIndex = 0;
unsigned int yAxisIndex = 0;

unsigned int xAxisStepsToMove = 0;
unsigned int yAxisStepsToMove = 0;

unsigned int xAxisCurrentPosition = 127; // 127 is the center of the controller for both X and Y Axis, so it should be the standard position
unsigned int yAxisCurrentPosition = 127;

unsigned int xAxisPreviousPosition = 127;
unsigned int yAxisPreviousPosition = 127;

boolean axisYqActive = false;
boolean axisXqActive = false;
boolean axisYiActive = false;
boolean axisXiActive = false;

boolean isInputting = false;
boolean isInputtingDelayed = false;

unsigned int buttonArrayIndex = 0;

unsigned long inputDelay = 0;
unsigned long previousInputDelay = 0;
unsigned long currentMillis = 0;

unsigned long baudRate = 2000000;

byte serial_rx_buffer[12];
unsigned long controller = 0;

//  The array below is an array of all buttons in the order the bytes have to be sent
unsigned int xAxisPins[] = {axisXq, axisXi};
unsigned int yAxisPins[] = {axisYq, axisYi};
unsigned int commandArray[] = {buttonA, buttonB, buttonZ, buttonStart, buttonDUp, buttonDDown, buttonDLeft, buttonDRight, buttonL, buttonR, buttonCUp, buttonCDown, buttonCLeft, buttonCRight};
unsigned int buttonArray[] = {buttonA, buttonB, buttonZ, buttonStart, buttonDUp, buttonDDown, buttonDLeft, buttonDRight, buttonL, buttonR, buttonCUp, buttonCDown, buttonCLeft, buttonCRight};

void setup()
{
  Serial.begin(baudRate);

  //  Define buttons and axis to neutral state on startup
  for (buttonArrayIndex = 0; buttonArrayIndex < (sizeof(buttonArray) / sizeof(unsigned int)); buttonArrayIndex++) {
    pinMode(buttonArray[buttonArrayIndex], OUTPUT);
    digitalWrite(buttonArray[buttonArrayIndex], LOW);
  }
  // Setup axis
  for (xAxisIndex = 0; xAxisIndex < (sizeof(xAxisPins) / sizeof(unsigned int)); xAxisIndex++) {
    pinMode(xAxisPins[xAxisIndex], OUTPUT);
    digitalWrite(xAxisPins[xAxisIndex], LOW);
  }
  for (yAxisIndex = 0; yAxisIndex < (sizeof(yAxisPins) / sizeof(unsigned int)); yAxisIndex++) {
    pinMode(yAxisPins[yAxisIndex], OUTPUT);
    digitalWrite(yAxisPins[yAxisIndex], LOW);
  }
  //  Prepare data to sent on startup as a way to tell the controller is in Neutral position
  //  That means, when all buttons and analog stick are reset to their Neutral positions
  serial_rx_buffer[0] = 0x01; //  Preamble
  serial_rx_buffer[1] = 0x00; //  A, B, Z, START, DUP, DDOWN, DLEFT, DRIGHT
  serial_rx_buffer[2] = 0x00; //  L, R, CUP, CDOWN, CLEFT, CRIGHT, N/A, N/A
  serial_rx_buffer[3] = 0x7F; //  Control Stick X Axis
  serial_rx_buffer[4] = 0x7F; //  Control Stick Y Axis
  serial_rx_buffer[5] = 0x00; //  N/A (All 8 bits)
  serial_rx_buffer[6] = 0x00; //  N/A (All 8 bits)
  serial_rx_buffer[7] = 0x00; //  N/A (All 8 bits)
  serial_rx_buffer[8] = 0x00; //  Unused
  serial_rx_buffer[9] = 0x00; //  Delay Byte 2
  serial_rx_buffer[10] = 0x00; // Delay Byte 1
  serial_rx_buffer[11] = 0x01; // Postamble
  resetController();
  //  And we are ready to go
}

void resetController()
{
  xAxisStepCounter = 0;
  yAxisStepCounter = 0;

  xAxisIndex = 0;
  yAxisIndex = 0;

  xAxisStepsToMove = 0;
  yAxisStepsToMove = 0;

  xAxisCurrentPosition = 127;
  yAxisCurrentPosition = 127;

  xAxisPreviousPosition = 127;
  yAxisPreviousPosition = 127;

  axisYqActive = false;
  axisXqActive = false;
  axisYiActive = false;
  axisXiActive = false;

  buttonArrayIndex = 0;

  //Press L+R+Start to tell the N64 to reset the controller data, which can be used to fix faulty analog stick readings
  delay(133);
  digitalWrite(buttonArray[8], HIGH);
  digitalWrite(buttonArray[9], HIGH);
  digitalWrite(buttonArray[3], HIGH);
  delay(133);
  digitalWrite(buttonArray[8], LOW);
  digitalWrite(buttonArray[9], LOW);
  digitalWrite(buttonArray[3], LOW);
  delay(133);

  for (buttonArrayIndex = 0; buttonArrayIndex < (sizeof(buttonArray) / sizeof(unsigned int)); buttonArrayIndex++) {
    digitalWrite(buttonArray[buttonArrayIndex], LOW);
  }
}

void moveStick(unsigned int xAxisPosition, unsigned int yAxisPosition)
{
  // Y AXIS
  // Move stick down to specified position
  if (yAxisPosition >= yAxisCurrentPosition)
  {
    yAxisStepsToMove = yAxisPosition - yAxisCurrentPosition;
    for (yAxisStepCounter = 0; yAxisStepCounter < yAxisStepsToMove; yAxisStepCounter++)
    {
      if (axisYqActive == axisYiActive)
      {
        axisYiActive = !axisYiActive;
        digitalWrite(yAxisPins[1], axisYiActive ? HIGH : LOW);
      }
      else
      {
        axisYqActive = !axisYqActive;
        digitalWrite(yAxisPins[0], axisYqActive ? HIGH : LOW);
      }
    }
    yAxisCurrentPosition = yAxisPosition;
    yAxisPreviousPosition = yAxisStepCounter;
  }
  // Y AXIS
  // Move stick up to specified position
  if (yAxisPosition < yAxisCurrentPosition)
  {
    yAxisStepsToMove = yAxisCurrentPosition - yAxisPosition;
    for (yAxisStepCounter = 0; yAxisStepCounter < yAxisStepsToMove; yAxisStepCounter++)
    {
      if (axisYiActive == axisYqActive)
      {
        axisYqActive = !axisYqActive;
        digitalWrite(yAxisPins[0], axisYqActive ? LOW : HIGH);
      }
      else
      {
        axisYiActive = !axisYiActive;
        digitalWrite(yAxisPins[1], axisYiActive ? LOW : HIGH);
      }
    }
    yAxisCurrentPosition = yAxisPosition;
    yAxisPreviousPosition = yAxisStepCounter;
  }
  // X AXIS
  // Move stick right to specified position
  if (xAxisPosition >= xAxisCurrentPosition)
  {
    xAxisStepsToMove = xAxisPosition - xAxisCurrentPosition;
    for (xAxisStepCounter = 0; xAxisStepCounter < xAxisStepsToMove; xAxisStepCounter++)
    {
      if (axisXqActive == axisXiActive)
      {
        axisXiActive = !axisXiActive;
        digitalWrite(xAxisPins[1], axisXiActive ? HIGH : LOW);
      }
      else
      {
        axisXqActive = !axisXqActive;
        digitalWrite(xAxisPins[0], axisXqActive ? HIGH : LOW);
      }
    }
    xAxisCurrentPosition = xAxisPosition;
    xAxisPreviousPosition = xAxisStepCounter;
  }
  // X AXIS
  // Move stick left to specified position
  if (xAxisPosition < xAxisCurrentPosition)
  {
    xAxisStepsToMove = xAxisCurrentPosition - xAxisPosition;
    for (xAxisStepCounter = 0; xAxisStepCounter < xAxisStepsToMove; xAxisStepCounter++)
    {
      if (axisXiActive == axisXqActive)
      {
        axisXqActive = !axisXqActive;
        digitalWrite(xAxisPins[0], axisXqActive ? LOW : HIGH);
      }
      else
      {
        axisXiActive = !axisXiActive;
        digitalWrite(xAxisPins[1], axisXiActive ? LOW : HIGH);
      }
    }
    xAxisCurrentPosition = xAxisPosition;
    xAxisPreviousPosition = xAxisStepCounter;
  }
}

void loop()
{
  currentMillis = millis();
  if (Serial.available() > 0) {
    controller = Serial.readBytes(serial_rx_buffer, sizeof(serial_rx_buffer)) && 0xFF;

    //  Set Start Byte (Preamble Byte) and End Byte (Postamble Byte)
    //  1 == 0x01
    if ((serial_rx_buffer[0] == 0x01) && (serial_rx_buffer[11] == 0x01))
    {
      // Make the button presses actually work
      isInputting = true;
      previousInputDelay = currentMillis;
    }
  }
  pressButtons();
} // Close Loop Function

void pressButtons() {
  if (isInputtingDelayed == false) {
    //  Define input delay (If Buffer Array Element 9 and 10 !=0)
    inputDelay = (unsigned long)serial_rx_buffer[9] << 8 | (unsigned long)serial_rx_buffer[10];
  }
  if (isInputting == true)
  {
    //  Press Button

    //  First 8 buttons, Buffer Array Element 1
    //  A, B, Z, START, DUP, DDOWN, DLEFT, DRIGHT
    digitalWrite(commandArray[0], (serial_rx_buffer[1] & B00000001)); // A
    digitalWrite(commandArray[1], (serial_rx_buffer[1] & B00000010)); // B
    digitalWrite(commandArray[2], (serial_rx_buffer[1] & B00000100)); // Z
    digitalWrite(commandArray[3], (serial_rx_buffer[1] & B00001000)); // START
    digitalWrite(commandArray[4], (serial_rx_buffer[1] & B00010000)); // DUP
    digitalWrite(commandArray[5], (serial_rx_buffer[1] & B00100000)); // DDOWN
    digitalWrite(commandArray[6], (serial_rx_buffer[1] & B01000000)); // DLEFT
    digitalWrite(commandArray[7], (serial_rx_buffer[1] & B10000000)); // DRIGHT

    //  Second 8 buttons, Buffer Array Element 2
    //  L, R, CUP, CDOWN, CLEFT, CRIGHT, N/A, N/A
    digitalWrite(commandArray[8], (serial_rx_buffer[2] & B00000001)); // L
    digitalWrite(commandArray[9], (serial_rx_buffer[2] & B00000010)); // R
    digitalWrite(commandArray[10], (serial_rx_buffer[2] & B00000100)); // CUP
    digitalWrite(commandArray[11], (serial_rx_buffer[2] & B00001000)); // CDOWN
    digitalWrite(commandArray[12], (serial_rx_buffer[2] & B00010000)); // CLEFT
    digitalWrite(commandArray[13], (serial_rx_buffer[2] & B00100000)); // CRIGHT

    //  2 Axis, Buffer Array Elements 3, 4
    //  Stick X axis, Stick Y Axis
    moveStick(serial_rx_buffer[3], serial_rx_buffer[4]);

    //  Buffer Array Elements 9 and 10 are used to tell the Arduino how long commands are executed, on a delay ranging from 1-65535ms
    if (inputDelay != 0) {
      isInputtingDelayed = true;

      //  The block below executes Soft Delay for holding the buttons down
      if (isInputtingDelayed == true) {
        if (currentMillis - previousInputDelay >= inputDelay) {
          //  Now we need to stop the Soft Delay

          //  Reset everything
          serial_rx_buffer[1] = 0x00; //  A, B, Z, START, DUP, DDOWN, DLEFT, DRIGHT
          serial_rx_buffer[2] = 0x00; //  L, R, CUP, CDOWN, CLEFT, CRIGHT, N/A, N/A
          serial_rx_buffer[3] = 0x7F; //  Control Stick X Axis
          serial_rx_buffer[4] = 0x7F; //  Control Stick Y Axis
          serial_rx_buffer[5] = 0x00; //  N/A (All 8 bits)
          serial_rx_buffer[6] = 0x00; //  N/A (All 8 bits)
          serial_rx_buffer[7] = 0x00; //  N/A (All 8 bits)
          serial_rx_buffer[8] = 0x00; //  Unused
          serial_rx_buffer[9] = 0x00; //  Delay Byte 2
          serial_rx_buffer[10] = 0x00; // Delay Byte 1

          //  First 8 buttons, Buffer Array Element 1
          //  A, B, Z, START, DUP, DDOWN, DLEFT, DRIGHT
          digitalWrite(commandArray[0], (serial_rx_buffer[1] & B00000001)); // A
          digitalWrite(commandArray[1], (serial_rx_buffer[1] & B00000010)); // B
          digitalWrite(commandArray[2], (serial_rx_buffer[1] & B00000100)); // Z
          digitalWrite(commandArray[3], (serial_rx_buffer[1] & B00001000)); // START
          digitalWrite(commandArray[4], (serial_rx_buffer[1] & B00010000)); // DUP
          digitalWrite(commandArray[5], (serial_rx_buffer[1] & B00100000)); // DDOWN
          digitalWrite(commandArray[6], (serial_rx_buffer[1] & B01000000)); // DLEFT
          digitalWrite(commandArray[7], (serial_rx_buffer[1] & B10000000)); // DRIGHT

          //  Second 8 buttons, Buffer Array Element 2
          //  L, R, CUP, CDOWN, CLEFT, CRIGHT, N/A, N/A
          digitalWrite(commandArray[8], (serial_rx_buffer[2] & B00000001)); // L
          digitalWrite(commandArray[9], (serial_rx_buffer[2] & B00000010)); // R
          digitalWrite(commandArray[10], (serial_rx_buffer[2] & B00000100)); // CUP
          digitalWrite(commandArray[11], (serial_rx_buffer[2] & B00001000)); // CDOWN
          digitalWrite(commandArray[12], (serial_rx_buffer[2] & B00010000)); // CLEFT
          digitalWrite(commandArray[13], (serial_rx_buffer[2] & B00100000)); // CRIGHT

          //  2 Axis, Buffer Array Elements 3, 4
          //  Stick X axis, Stick Y Axis
          moveStick(serial_rx_buffer[3], serial_rx_buffer[4]);

          //  Buffer Array Element 8 is unused in this code, but is existing in case changes are needed
          isInputtingDelayed = false;
          isInputting = false;
          previousInputDelay += inputDelay;
          inputDelay = 0;
        }
      }
    }
  }
}
