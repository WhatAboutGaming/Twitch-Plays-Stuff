// This project uses 4 8-bit shift register, such as 74HC595 or HCF4094, in cascading format
/*
  PS2 Controller for Arduino UNO by WhatAboutGaming
  For use in the Twitch.TV stream TwitchTriesToPlay.
  https://www.twitch.tv/twitchtriestoplay
  https://github.com/WhatAboutGaming/Twitch-Plays-Stuff

  Reference:
  https://gist.github.com/scanlime/5042071
  http://store.curiousinventor.com/guides/PS2/
  http://www.lynxmotion.com/images/files/ps2cmd01.txt
  http://procrastineering.blogspot.com/2010/12/simulated-ps2-controller-for.html
*/

#define latchPin 2 // HCF4094/74HC595 Latch/Strobe Input
#define dataPin 3 // HCF4094/74HC595 Data Input
#define clockPin 4 // HCF4094/74HC595 Clock Input

#define buttonSelect 0 // Left 10 
#define buttonL3 1 // Right 9
#define buttonR3 2 // Right 10
#define buttonStart 3 // Left 12

#define buttonDUp 4 // Left 3
#define buttonDRight 5 // Left 4
#define buttonDDown 6 // Left 6
#define buttonDLeft 7 // Left 5

#define buttonL2 8 // Left 7
#define buttonR2 9 // Right 4
#define buttonL1 10 // Left 8
#define buttonR1 11 // Right 3

#define buttonTriangle 12 // Right 6
#define buttonCircle 13 // Right 8
#define buttonCross 14 // Right 7
#define buttonSquare 15 // Right 5

#define axisRxHalf 16 // Left 14
#define axisRxFull 17 // Left 14

#define axisRyHalf 18 // Left 13
#define axisRyFull 19 // Left 13

#define axisLxHalf 20 // Left 15
#define axisLxFull 21 // Left 15

#define axisLyHalf 22 // Left 16
#define axisLyFull 23 // Left 16

#define buttonAnalog 24 // Left 11

#define leftMotor A0 // Left 9
#define rightMotor A1 // Right 11
#define analogLed A2 // Right 12

// Left 9 = Left Motor In = A0
// Right 11 = Right Motor In = A1
// Right 12 = Analog LED = A2
bool defaultStatus[] = {LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, HIGH, LOW, HIGH, LOW, HIGH, LOW, HIGH, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW};
bool inputStatus[] =   {LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, HIGH, LOW, HIGH, LOW, HIGH, LOW, HIGH, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW};
unsigned int commandArray[] = {buttonSelect, buttonL3, buttonR3, buttonStart, buttonDUp, buttonDRight, buttonDDown, buttonDLeft, buttonL2, buttonR2, buttonL1, buttonR1, buttonTriangle, buttonCircle, buttonCross, buttonSquare, axisRxHalf, axisRxFull, axisRyHalf, axisRyFull, axisLxHalf, axisLxFull, axisLyHalf, axisLyHalf, buttonAnalog, 25, 26, 27, 28, 29, 30, 31};
unsigned int motorArray[] = {leftMotor, rightMotor, analogLed}; // Big motor, Small Motor, Analog LED

boolean isInputting = false;
boolean isInputtingDelayed = false;

unsigned long inputDelay = 0;
unsigned long previousInputDelay = 0;
unsigned long currentMillis = 0;

unsigned long baudRate = 2000000;

byte serial_rx_buffer[12];
unsigned long controller = 0;

void setup()
{
  Serial.begin(baudRate);

  pinMode(leftMotor, INPUT_PULLUP);
  pinMode(rightMotor, INPUT_PULLUP);
  pinMode(analogLed, INPUT_PULLUP);

  pinMode(latchPin, OUTPUT);
  pinMode(dataPin, OUTPUT);
  pinMode(clockPin, OUTPUT);

  digitalWrite(latchPin, LOW);
  for (int i = 31; i >= 0; i--)
  {
    digitalWrite(clockPin, LOW);
    digitalWrite(dataPin, defaultStatus[i]);
    digitalWrite(clockPin, HIGH);
  }
  digitalWrite(latchPin, HIGH);

  //  Reset everything
  serial_rx_buffer[0] = 0x00;
  serial_rx_buffer[1] = 0x00;
  serial_rx_buffer[2] = 0x00;
  serial_rx_buffer[3] = 0x7F;
  serial_rx_buffer[4] = 0x7F;
  serial_rx_buffer[5] = 0x7F;
  serial_rx_buffer[6] = 0x7F;
  serial_rx_buffer[7] = 0x00;
  serial_rx_buffer[8] = 0x00;
  serial_rx_buffer[9] = 0x00;
  serial_rx_buffer[10] = 0x00;
  serial_rx_buffer[11] = 0x00;
}
void loop()
{
  currentMillis = millis();
  if (Serial.available() > 0)
  {
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
}

void pressButtons()
{
  if (isInputtingDelayed == false)
  {
    //  Define input delay (If Buffer Array Element 9 and 10 !=0)
    inputDelay = (unsigned long)serial_rx_buffer[9] << 8 | (unsigned long)serial_rx_buffer[10];
  }
  if (isInputting == true)
  {
    //  Press Button

    //  First 8 buttons, Buffer Array Element 1
    //  SELECT, L3, R3, START, DUP, DRIGHT, DDOWN, DLEFT
    inputStatus[0] = (serial_rx_buffer[1] & B00000001);
    inputStatus[1] = (serial_rx_buffer[1] & B00000010);
    inputStatus[2] = (serial_rx_buffer[1] & B00000100);
    inputStatus[3] = (serial_rx_buffer[1] & B00001000);
    inputStatus[4] = (serial_rx_buffer[1] & B00010000);
    inputStatus[5] = (serial_rx_buffer[1] & B00100000);
    inputStatus[6] = (serial_rx_buffer[1] & B01000000);
    inputStatus[7] = (serial_rx_buffer[1] & B10000000);

    //  Second 8 buttons, Buffer Array Element 2
    //  L2, R2, L1, R1, Triangle/Delta, Circle/O, Cross/X, Square
    inputStatus[8] = (serial_rx_buffer[2] & B00000001);
    inputStatus[9] = (serial_rx_buffer[2] & B00000010);
    inputStatus[10] = (serial_rx_buffer[2] & B00000100);
    inputStatus[11] = (serial_rx_buffer[2] & B00001000);
    inputStatus[12] = (serial_rx_buffer[2] & B00010000);
    inputStatus[13] = (serial_rx_buffer[2] & B00100000);
    inputStatus[14] = (serial_rx_buffer[2] & B01000000);
    inputStatus[15] = (serial_rx_buffer[2] & B10000000);

    //  4 Axis, Buffer Array Elements 3, 4, 5, 6
    //  RX, RY, LX, LY

    //RX STICK
    if (serial_rx_buffer[3] > 127)
    {
      // Push RX Stick to Right
      inputStatus[16] = HIGH;
      inputStatus[17] = HIGH;
    }

    if (serial_rx_buffer[3] < 127)
    {
      // Push RX Stick to Left
      inputStatus[16] = LOW;
      inputStatus[17] = LOW;
    }

    if (serial_rx_buffer[3] == 127)
    {
      // Keep RX Stick Centered
      inputStatus[16] = HIGH;
      inputStatus[17] = LOW;
    }

    //RY STICK
    if (serial_rx_buffer[4] > 127)
    {
      // Push RY Stick to Up
      inputStatus[18] = HIGH;
      inputStatus[19] = HIGH;
    }

    if (serial_rx_buffer[4] < 127)
    {
      // Push RY Stick to Down
      inputStatus[18] = LOW;
      inputStatus[19] = LOW;
    }

    if (serial_rx_buffer[4] == 127)
    {
      // Keep RY Stick Centered
      inputStatus[18] = HIGH;
      inputStatus[19] = LOW;
    }

    //LX STICK
    if (serial_rx_buffer[5] > 127)
    {
      // Push LX Stick to Right
      inputStatus[20] = HIGH;
      inputStatus[21] = HIGH;
    }

    if (serial_rx_buffer[5] < 127)
    {
      // Push LX Stick to Left
      inputStatus[20] = LOW;
      inputStatus[21] = LOW;
    }

    if (serial_rx_buffer[5] == 127)
    {
      // Keep LX Stick Centered
      inputStatus[20] = HIGH;
      inputStatus[21] = LOW;
    }

    //LY STICK
    if (serial_rx_buffer[6] > 127)
    {
      // Push LY Stick to Down
      inputStatus[22] = HIGH;
      inputStatus[23] = HIGH;
    }

    if (serial_rx_buffer[6] < 127)
    {
      // Push LY Stick to Up
      inputStatus[22] = LOW;
      inputStatus[23] = LOW;
    }

    if (serial_rx_buffer[6] == 127)
    {
      // Keep LY Stick Centered
      inputStatus[22] = HIGH;
      inputStatus[23] = LOW;
    }

    //  Analog button (Used to change between Digital and Analog modes in older games), Buffer Array Element 7
    //  All other bits in this Buffer Array Element are unused
    inputStatus[24] = (serial_rx_buffer[7] & B00000001);

    digitalWrite(latchPin, LOW);
    for (int i = 31; i >= 0; i--)
    {
      digitalWrite(clockPin, LOW);
      digitalWrite(dataPin, inputStatus[i]);
      digitalWrite(clockPin, HIGH);
    }
    digitalWrite(latchPin, HIGH);

    //  Buffer Array Element 8 is unused in this code, but is existing in case changes are needed

    //  Buffer Array Elements 9 and 10 are used to tell the Arduino how long commands are executed, on a delay ranging from 1-65535ms
    if (inputDelay != 0)
    {
      isInputtingDelayed = true;
      //  The block below executes Soft Delay for holding the buttons down
      if (isInputtingDelayed == true)
      {
        if (currentMillis - previousInputDelay >= inputDelay)
        {
          //  Now we need to stop the Soft Delay

          //  Reset everything
          serial_rx_buffer[0] = 0x00;
          serial_rx_buffer[1] = 0x00;
          serial_rx_buffer[2] = 0x00;
          serial_rx_buffer[3] = 0x7F;
          serial_rx_buffer[4] = 0x7F;
          serial_rx_buffer[5] = 0x7F;
          serial_rx_buffer[6] = 0x7F;
          serial_rx_buffer[7] = 0x00;
          serial_rx_buffer[8] = 0x00;
          serial_rx_buffer[9] = 0x00;
          serial_rx_buffer[10] = 0x00;
          serial_rx_buffer[11] = 0x00;

          //  First 8 buttons, Buffer Array Element 1
          //  SELECT, L3, R3, START, DUP, DRIGHT, DDOWN, DLEFT
          inputStatus[0] = (serial_rx_buffer[1] & B00000001);
          inputStatus[1] = (serial_rx_buffer[1] & B00000010);
          inputStatus[2] = (serial_rx_buffer[1] & B00000100);
          inputStatus[3] = (serial_rx_buffer[1] & B00001000);
          inputStatus[4] = (serial_rx_buffer[1] & B00010000);
          inputStatus[5] = (serial_rx_buffer[1] & B00100000);
          inputStatus[6] = (serial_rx_buffer[1] & B01000000);
          inputStatus[7] = (serial_rx_buffer[1] & B10000000);

          //  Second 8 buttons, Buffer Array Element 2
          //  L2, R2, L1, R1, Triangle/Delta, Circle/O, Cross/X, Square
          inputStatus[8] = (serial_rx_buffer[2] & B00000001);
          inputStatus[9] = (serial_rx_buffer[2] & B00000010);
          inputStatus[10] = (serial_rx_buffer[2] & B00000100);
          inputStatus[11] = (serial_rx_buffer[2] & B00001000);
          inputStatus[12] = (serial_rx_buffer[2] & B00010000);
          inputStatus[13] = (serial_rx_buffer[2] & B00100000);
          inputStatus[14] = (serial_rx_buffer[2] & B01000000);
          inputStatus[15] = (serial_rx_buffer[2] & B10000000);

          //  4 Axis, Buffer Array Elements 3, 4, 5, 6
          //  RX, RY, LX, LY

          //RX STICK
          if (serial_rx_buffer[3] > 127)
          {
            // Push RX Stick to Right
            inputStatus[16] = HIGH;
            inputStatus[17] = HIGH;
          }

          if (serial_rx_buffer[3] < 127)
          {
            // Push RX Stick to Left
            inputStatus[16] = LOW;
            inputStatus[17] = LOW;
          }

          if (serial_rx_buffer[3] == 127)
          {
            // Keep RX Stick Centered
            inputStatus[16] = HIGH;
            inputStatus[17] = LOW;
          }

          //RY STICK
          if (serial_rx_buffer[4] > 127)
          {
            // Push RY Stick to Up
            inputStatus[18] = HIGH;
            inputStatus[19] = HIGH;
          }

          if (serial_rx_buffer[4] < 127)
          {
            // Push RY Stick to Down
            inputStatus[18] = LOW;
            inputStatus[19] = LOW;
          }

          if (serial_rx_buffer[4] == 127)
          {
            // Keep RY Stick Centered
            inputStatus[18] = HIGH;
            inputStatus[19] = LOW;
          }

          //LX STICK
          if (serial_rx_buffer[5] > 127)
          {
            // Push LX Stick to Right
            inputStatus[20] = HIGH;
            inputStatus[21] = HIGH;
          }

          if (serial_rx_buffer[5] < 127)
          {
            // Push LX Stick to Left
            inputStatus[20] = LOW;
            inputStatus[21] = LOW;
          }

          if (serial_rx_buffer[5] == 127)
          {
            // Keep LX Stick Centered
            inputStatus[20] = HIGH;
            inputStatus[21] = LOW;
          }

          //LY STICK
          if (serial_rx_buffer[6] > 127)
          {
            // Push LY Stick to Down
            inputStatus[22] = HIGH;
            inputStatus[23] = HIGH;
          }

          if (serial_rx_buffer[6] < 127)
          {
            // Push LY Stick to Up
            inputStatus[22] = LOW;
            inputStatus[23] = LOW;
          }

          if (serial_rx_buffer[6] == 127)
          {
            // Keep LY Stick Centered
            inputStatus[22] = HIGH;
            inputStatus[23] = LOW;
          }

          //  Analog button (Used to change between Digital and Analog modes in older games), Buffer Array Element 7
          //  All other bits in this Buffer Array Element are unused
          inputStatus[24] = (serial_rx_buffer[7] & B00000001);

          digitalWrite(latchPin, LOW);
          for (int i = 31; i >= 0; i--)
          {
            digitalWrite(clockPin, LOW);
            digitalWrite(dataPin, inputStatus[i]);
            digitalWrite(clockPin, HIGH);
          }
          digitalWrite(latchPin, HIGH);

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
