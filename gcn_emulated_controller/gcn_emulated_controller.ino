#include "Nintendo.h"

/*
  GCN Emulated Controller v1.0 for Arduino UNO/NANO by WhatAboutGaming
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

#define errorStatus 0
#define errorLatch 1
#define originStatus 2
#define buttonStart 3

#define buttonY 4
#define buttonX 5
#define buttonB 6
#define buttonA 7

#define high1Status 8
#define buttonL 9
#define buttonR 10
#define buttonZ 11

#define buttonUp 12
#define buttonDown 13
#define buttonLeft 14
#define buttonRight 15

#define xAxisAxis 16
#define yAxisAxis 17

#define cxAxisAxis 18
#define cyAxisAxis 19

#define lShoulderAxis 20
#define rShoulderAxis 21

#define gcDataPin 8
CGamecubeConsole GamecubeConsole(gcDataPin);
Gamecube_Data_t gcControllerData = defaultGamecubeData;

byte defaultStatus[] = {0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x80, 0x80, 0x7F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
byte inputStatus[] =   {0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x80, 0x80, 0x7F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
byte commandArray[] =  {errorStatus, errorLatch, originStatus, buttonStart, buttonY, buttonX, buttonB, buttonA, high1Status, buttonL, buttonR, buttonZ, buttonUp, buttonDown, buttonLeft, buttonRight, xAxisAxis, yAxisAxis, cxAxisAxis, cyAxisAxis, lShoulderAxis, rShoulderAxis, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31};

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

  //  Reset everything
  serial_rx_buffer[0] = 0x00;
  serial_rx_buffer[1] = 0x00;
  serial_rx_buffer[2] = 0x00;
  serial_rx_buffer[3] = 0x80;
  serial_rx_buffer[4] = 0x7F;
  serial_rx_buffer[5] = 0x80;
  serial_rx_buffer[6] = 0x7F;
  serial_rx_buffer[7] = 0x00;
  serial_rx_buffer[8] = 0x00;
  serial_rx_buffer[9] = 0x00;
  serial_rx_buffer[10] = 0x00;
  serial_rx_buffer[11] = 0x00;

  //  First 8 buttons, Buffer Array Element 1
  //  N/A, N/A, N/A, Start, Y, X, B, A
  inputStatus[0] = bool(serial_rx_buffer[1] & B00000001); // Error Status
  inputStatus[1] = bool(serial_rx_buffer[1] & B00000010); // Error Latch
  inputStatus[2] = bool(serial_rx_buffer[1] & B00000100); // Origin
  inputStatus[3] = bool(serial_rx_buffer[1] & B00001000); // Start
  inputStatus[4] = bool(serial_rx_buffer[1] & B00010000); // Y
  inputStatus[5] = bool(serial_rx_buffer[1] & B00100000); // X
  inputStatus[6] = bool(serial_rx_buffer[1] & B01000000); // B
  inputStatus[7] = bool(serial_rx_buffer[1] & B10000000); // A

  //  Second 8 buttons, Buffer Array Element 2
  //  N/A, L, R, Z, Up, Down, Right, Left
  inputStatus[8] = bool(serial_rx_buffer[2] & B00000001); // High 1 Status
  inputStatus[9] = bool(serial_rx_buffer[2] & B00000010); // L
  inputStatus[10] = bool(serial_rx_buffer[2] & B00000100); // R
  inputStatus[11] = bool(serial_rx_buffer[2] & B00001000); // Z
  inputStatus[12] = bool(serial_rx_buffer[2] & B00010000); // Up
  inputStatus[13] = bool(serial_rx_buffer[2] & B00100000); // Down
  inputStatus[14] = bool(serial_rx_buffer[2] & B01000000); // Right
  inputStatus[15] = bool(serial_rx_buffer[2] & B10000000); // Left

  //  6 Axis, Buffer Array Elements 3, 4, 5, 6, 7, 8
  //  X Axis, Y Axis, C X Axis, C Y Axis, L Analog Shoulder Axis, R Analog Shoulder Axis
  inputStatus[16] = serial_rx_buffer[3]; // X Axis
  inputStatus[17] = serial_rx_buffer[4]; // Y Axis
  inputStatus[18] = serial_rx_buffer[5]; // C X Axis
  inputStatus[19] = serial_rx_buffer[6]; // C Y Axis
  inputStatus[20] = serial_rx_buffer[7]; // L Analog Shoulder Axis
  inputStatus[21] = serial_rx_buffer[8]; // R Analog Shoulder Axis

  // Write data to GC here
  writeGC();
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
      isInputtingDelayed = false;
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
    //  N/A, N/A, N/A, Start, Y, X, B, A
    inputStatus[0] = bool(serial_rx_buffer[1] & B00000001); // Error Status
    inputStatus[1] = bool(serial_rx_buffer[1] & B00000010); // Error Latch
    inputStatus[2] = bool(serial_rx_buffer[1] & B00000100); // Origin
    inputStatus[3] = bool(serial_rx_buffer[1] & B00001000); // Start
    inputStatus[4] = bool(serial_rx_buffer[1] & B00010000); // Y
    inputStatus[5] = bool(serial_rx_buffer[1] & B00100000); // X
    inputStatus[6] = bool(serial_rx_buffer[1] & B01000000); // B
    inputStatus[7] = bool(serial_rx_buffer[1] & B10000000); // A

    //  Second 8 buttons, Buffer Array Element 2
    //  N/A, L, R, Z, Up, Down, Right, Left
    inputStatus[8] = bool(serial_rx_buffer[2] & B00000001); // High 1 Status
    inputStatus[9] = bool(serial_rx_buffer[2] & B00000010); // L
    inputStatus[10] = bool(serial_rx_buffer[2] & B00000100); // R
    inputStatus[11] = bool(serial_rx_buffer[2] & B00001000); // Z
    inputStatus[12] = bool(serial_rx_buffer[2] & B00010000); // Up
    inputStatus[13] = bool(serial_rx_buffer[2] & B00100000); // Down
    inputStatus[14] = bool(serial_rx_buffer[2] & B01000000); // Right
    inputStatus[15] = bool(serial_rx_buffer[2] & B10000000); // Left

    //  6 Axis, Buffer Array Elements 3, 4, 5, 6, 7, 8
    //  X Axis, Y Axis, C X Axis, C Y Axis, L Analog Shoulder Axis, R Analog Shoulder Axis
    inputStatus[16] = serial_rx_buffer[3]; // X Axis
    inputStatus[17] = serial_rx_buffer[4]; // Y Axis
    inputStatus[18] = serial_rx_buffer[5]; // C X Axis
    inputStatus[19] = serial_rx_buffer[6]; // C Y Axis
    inputStatus[20] = serial_rx_buffer[7]; // L Analog Shoulder Axis
    inputStatus[21] = serial_rx_buffer[8]; // R Analog Shoulder Axis

    // Write data to GC here
    writeGC();

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
          serial_rx_buffer[3] = 0x80;
          serial_rx_buffer[4] = 0x7F;
          serial_rx_buffer[5] = 0x80;
          serial_rx_buffer[6] = 0x7F;
          serial_rx_buffer[7] = 0x00;
          serial_rx_buffer[8] = 0x00;
          serial_rx_buffer[9] = 0x00;
          serial_rx_buffer[10] = 0x00;
          serial_rx_buffer[11] = 0x00;

          //  First 8 buttons, Buffer Array Element 1
          //  N/A, N/A, N/A, Start, Y, X, B, A
          inputStatus[0] = bool(serial_rx_buffer[1] & B00000001); // Error Status
          inputStatus[1] = bool(serial_rx_buffer[1] & B00000010); // Error Latch
          inputStatus[2] = bool(serial_rx_buffer[1] & B00000100); // Origin
          inputStatus[3] = bool(serial_rx_buffer[1] & B00001000); // Start
          inputStatus[4] = bool(serial_rx_buffer[1] & B00010000); // Y
          inputStatus[5] = bool(serial_rx_buffer[1] & B00100000); // X
          inputStatus[6] = bool(serial_rx_buffer[1] & B01000000); // B
          inputStatus[7] = bool(serial_rx_buffer[1] & B10000000); // A

          //  Second 8 buttons, Buffer Array Element 2
          //  N/A, L, R, Z, Up, Down, Right, Left
          inputStatus[8] = bool(serial_rx_buffer[2] & B00000001); // High 1 Status
          inputStatus[9] = bool(serial_rx_buffer[2] & B00000010); // L
          inputStatus[10] = bool(serial_rx_buffer[2] & B00000100); // R
          inputStatus[11] = bool(serial_rx_buffer[2] & B00001000); // Z
          inputStatus[12] = bool(serial_rx_buffer[2] & B00010000); // Up
          inputStatus[13] = bool(serial_rx_buffer[2] & B00100000); // Down
          inputStatus[14] = bool(serial_rx_buffer[2] & B01000000); // Right
          inputStatus[15] = bool(serial_rx_buffer[2] & B10000000); // Left

          //  6 Axis, Buffer Array Elements 3, 4, 5, 6, 7, 8
          //  X Axis, Y Axis, C X Axis, C Y Axis, L Analog Shoulder Axis, R Analog Shoulder Axis
          inputStatus[16] = serial_rx_buffer[3]; // X Axis
          inputStatus[17] = serial_rx_buffer[4]; // Y Axis
          inputStatus[18] = serial_rx_buffer[5]; // C X Axis
          inputStatus[19] = serial_rx_buffer[6]; // C Y Axis
          inputStatus[20] = serial_rx_buffer[7]; // L Analog Shoulder Axis
          inputStatus[21] = serial_rx_buffer[8]; // R Analog Shoulder Axis
          // Write data to GC here
          writeGC();

          isInputtingDelayed = false;
          isInputting = false;
          previousInputDelay += inputDelay;
          inputDelay = 0;
        }
      }
    }
  }
}

void writeGC() {
  Serial.println(currentMillis);
  //  N/A, N/A, N/A, Start, Y, X, B, A
  //gcControllerData.report.errstat = inputStatus[0]; // Error Status
  //gcControllerData.report.errlatch = inputStatus[1]; // Error Latch
  //gcControllerData.report.origin = inputStatus[2]; // Origin
  gcControllerData.report.start = inputStatus[3]; // Start
  gcControllerData.report.y = inputStatus[4]; // Y
  gcControllerData.report.x = inputStatus[5]; // X
  gcControllerData.report.b = inputStatus[6]; // B
  gcControllerData.report.a = inputStatus[7]; // A

  //  N/A, L, R, Z, Up, Down, Right, Left
  //gcControllerData.report.high1 = inputStatus[8]; // High 1 Status
  gcControllerData.report.l = inputStatus[9]; // L
  gcControllerData.report.r = inputStatus[10]; // R
  gcControllerData.report.z = inputStatus[11]; // Z
  gcControllerData.report.dup = inputStatus[12]; // Up
  gcControllerData.report.ddown = inputStatus[13]; // Down
  gcControllerData.report.dright = inputStatus[14]; // Right
  gcControllerData.report.dleft = inputStatus[15]; // Left

  //  X Axis, Y Axis, C X Axis, C Y Axis, L Analog Shoulder Axis, R Analog Shoulder Axis
  gcControllerData.report.xAxis = inputStatus[16]; // X Axis
  gcControllerData.report.yAxis = ~inputStatus[17]; // Y Axis
  gcControllerData.report.cxAxis = inputStatus[18]; // C X Axis
  gcControllerData.report.cyAxis = ~inputStatus[19]; // C Y Axis
  gcControllerData.report.left = inputStatus[20]; // L Analog Shoulder Axis
  gcControllerData.report.right = inputStatus[21]; // R Analog Shoulder Axis

  GamecubeConsole.write(gcControllerData);
}
