// This project uses 4 8-bit shift register, such as 74HC595 or HCF4094, in cascading format
/*
  SNES Controller v1.0 for Arduino UNO by WhatAboutGaming
  For use in the Twitch.TV stream TwitchTriesToPlay.
  https://www.twitch.tv/twitchtriestoplay
  https://github.com/WhatAboutGaming/Twitch-Plays-Stuff

  Reference:
  https://github.com/marcosassis/gamepaduino/wiki/SNES-controller-interface
  https://www.repairfaq.org/REPAIR/F_SNES.html
*/

#define latchPin 2 // HCF4094/74HC595 Latch/Strobe Input
#define dataPin 3 // HCF4094/74HC595 Data Input
#define clockPin 4 // HCF4094/74HC595 Clock Input

#define buttonB 0 // Left 3
#define buttonY 1 // Left 4
#define buttonSelect 2 // Left 5
#define buttonStart 3 // Left 6

#define buttonUp 4 // Left 7
#define buttonDown 5 // Left 8
#define buttonLeft A0 // Left 9
#define buttonRight 7 // Left 10

#define buttonA 8 // Left 11
#define buttonX 9 // Left 12

#define buttonLHalf 10 // Left 13
#define buttonLFull 11 // Left 13
#define buttonRHalf 12 // Left 14
#define buttonRFull 13 // Left 14

bool defaultStatus[] = {LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW};
bool inputStatus[] =   {LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW};
unsigned int commandArray[] = {buttonB, buttonY, buttonSelect, buttonStart, buttonUp, buttonDown, buttonLeft, buttonRight, buttonA, buttonX, buttonLHalf, buttonLFull, buttonRHalf, buttonRFull, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31};

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

  pinMode(latchPin, OUTPUT);
  pinMode(dataPin, OUTPUT);
  pinMode(clockPin, OUTPUT);
  pinMode(buttonLeft, OUTPUT);

  digitalWrite(latchPin, LOW);
  for (int i = 31; i >= 0; i--)
  {
    digitalWrite(clockPin, LOW);
    digitalWrite(dataPin, !defaultStatus[i]);
    digitalWrite(buttonLeft, !defaultStatus[1]);
    digitalWrite(clockPin, HIGH);
  }
  digitalWrite(latchPin, HIGH);

  //  Reset everything
  serial_rx_buffer[0] = 0x00;
  serial_rx_buffer[1] = 0x00;
  serial_rx_buffer[2] = 0x00;
  serial_rx_buffer[3] = 0x00;
  serial_rx_buffer[4] = 0x00;
  serial_rx_buffer[5] = 0x00;
  serial_rx_buffer[6] = 0x00;
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
    //  B, Y, SELECT, START, UP, DOWN, LEFT, RIGHT
    inputStatus[4] =  (serial_rx_buffer[1] & B00000001); // B
    inputStatus[5] =  (serial_rx_buffer[1] & B00000010); // Y
    inputStatus[6] =  (serial_rx_buffer[1] & B00000100); // Select
    inputStatus[7] =  (serial_rx_buffer[1] & B00001000); // Start
    inputStatus[8] =  (serial_rx_buffer[1] & B00010000); // Up
    inputStatus[10] = (serial_rx_buffer[1] & B00100000); // Down
    inputStatus[1] =  (serial_rx_buffer[1] & B01000000); // Left
    inputStatus[0] =  (serial_rx_buffer[1] & B10000000); // Right

    //  Second 4 buttons, Buffer Array Element 2
    //  A, X, L, R, N/A, N/A, N/A, N/A
    inputStatus[24] =  (serial_rx_buffer[2] & B00000001); // A
    inputStatus[3] =   (serial_rx_buffer[2] & B00000010); // X

    // Because the L and R buttons are connected to a board where
    // it outputs pseudo-analog levels, we have to set 2 bits low
    // or high to be able to actually press the buttons
    inputStatus[20] = (serial_rx_buffer[2] & B00000100); // L
    inputStatus[21] = (serial_rx_buffer[2] & B00000100); // L
    inputStatus[22] = (serial_rx_buffer[2] & B00001000); // R
    inputStatus[23] = (serial_rx_buffer[2] & B00001000); // R

    digitalWrite(latchPin, LOW);
    for (int i = 31; i >= 0; i--)
    {
      digitalWrite(clockPin, LOW);
      digitalWrite(dataPin, !inputStatus[i]);
      digitalWrite(buttonLeft, !inputStatus[1]); // This is the Left Dpad button, which isn't on the shift registers, it's on the output A0
      digitalWrite(clockPin, HIGH);
    }
    digitalWrite(latchPin, HIGH);

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
          serial_rx_buffer[3] = 0x00;
          serial_rx_buffer[4] = 0x00;
          serial_rx_buffer[5] = 0x00;
          serial_rx_buffer[6] = 0x00;
          serial_rx_buffer[7] = 0x00;
          serial_rx_buffer[8] = 0x00;
          serial_rx_buffer[9] = 0x00;
          serial_rx_buffer[10] = 0x00;
          serial_rx_buffer[11] = 0x00;

          //  First 8 buttons, Buffer Array Element 1
          //  B, Y, SELECT, START, UP, DOWN, LEFT, RIGHT
          inputStatus[4] =  (serial_rx_buffer[1] & B00000001); // B
          inputStatus[5] =  (serial_rx_buffer[1] & B00000010); // Y
          inputStatus[6] =  (serial_rx_buffer[1] & B00000100); // Select
          inputStatus[7] =  (serial_rx_buffer[1] & B00001000); // Start
          inputStatus[8] =  (serial_rx_buffer[1] & B00010000); // Up
          inputStatus[10] = (serial_rx_buffer[1] & B00100000); // Down
          inputStatus[1] =  (serial_rx_buffer[1] & B01000000); // Left
          inputStatus[0] =  (serial_rx_buffer[1] & B10000000); // Right

          //  Second 8 buttons, Buffer Array Element 2
          //  A, X, L, R, N/A, N/A, N/A, N/A
          inputStatus[24] =  (serial_rx_buffer[2] & B00000001); // A
          inputStatus[3] =   (serial_rx_buffer[2] & B00000010); // X

          // Because the L and R buttons are connected to a board where
          // it outputs pseudo-analog levels, we have to set 2 bits low
          // or high to be able to actually press the
          inputStatus[20] = (serial_rx_buffer[2] & B00000100); // L
          inputStatus[21] = (serial_rx_buffer[2] & B00000100); // L
          inputStatus[22] = (serial_rx_buffer[2] & B00001000); // R
          inputStatus[23] = (serial_rx_buffer[2] & B00001000); // R

          digitalWrite(latchPin, LOW);
          for (int i = 31; i >= 0; i--)
          {
            digitalWrite(clockPin, LOW);
            digitalWrite(dataPin, !inputStatus[i]);
            digitalWrite(buttonLeft, !inputStatus[1]); // This is the Left Dpad button, which isn't on the shift registers, it's on the output A0
            digitalWrite(clockPin, HIGH);
          }
          digitalWrite(latchPin, HIGH);

          isInputtingDelayed = false;
          isInputting = false;
          previousInputDelay += inputDelay;
          inputDelay = 0;
        }
      }
    }
  }
}
