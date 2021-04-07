// This project uses 4 8-bit shift register, such as 74HC595 or HCF4094, in cascading format
/*
  GCN Controller for Arduino UNO by WhatAboutGaming
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


  Protoboard Side|SR Bit      |Variable Name |GCN Controller Side
  13 LEFT        |22 and 23   |axisY         |Analog Axis Y // Done
  14 LEFT        |20 and 21   |axisX         |Analog Axis X // Done
  15 LEFT        |18 and 19   |axisCx        |Axis C X // Done
  16 LEFT        |16 and 17   |axisCy        |Axis C Y // Done
  6  LEFT        |7           |buttonDDown   |D-Down // Done
  5  LEFT        |6           |buttonDLeft   |D-Left // Done
  8  LEFT        |8           |axisLTrigger  |L Analog Trigger // Done
  7  LEFT        |10          |buttonLTrigger|L Digital Trigger // Done
  10 LEFT        |0           |buttonTurbo   |Turbo (Bootleg Controller Button) // Done
  11 LEFT        |24          |buttonMode    |Mode (Bootleg Controller Button) // Done
  12 LEFT        |3           |buttonStart   |Start // Done
  4  RIGHT       |9           |axisRTrigger  |R Analog Trigger // Done
  3  LEFT        |4           |buttonDUp     |D-Up // Done
  4  LEFT        |5           |buttonDRight  |D-Right // Done
  5  RIGHT       |15          |buttonB       |B // Done
  3  RIGHT       |11          |buttonRTrigger|R Digital Trigger // Done
  6  RIGHT       |12          |buttonY       |Y // Done
  8  RIGHT       |13          |buttonX       |X // Done
  7  RIGHT       |14          |buttonA       |A // Done
  10 RIGHT       |2           |buttonZ       |Z // Done
  9  RIGHT       |1           |buttonMacro   |Macro (Bootleg Controller Button) // Done
  9  LEFT        |A0 (Not SR) |motorInput    |Motor
  11 RIGHT       |A1 (Not SR) |turboLed      |Turbo LED (Bootleg Controller Function)
  12 RIGHT       |A2 (Not SR) |macroLed      |Macro LED (Bootleg Controller Function)
*/

#define latchPin 2 // HCF4094/74HC595 Latch/Strobe Input
#define dataPin 3 // HCF4094/74HC595 Data Input
#define clockPin 4 // HCF4094/74HC595 Clock Input

/*
  #define buttonLTrigger 0 // Left 7 // Bit
  #define buttonRTrigger 1 // Right 3 // Bit
  #define buttonZ 2 // Right 10 // Bit
  #define buttonStart 3 // Left 12 // Bit

  #define buttonY 4 // Right 6 // Bit
  #define buttonX 5 // Right 8 // Bit
  #define buttonB 6 // Right 5 // Bit
  #define buttonA 7 // Right 7 // Bit

  #define axisLTrigger 8 // Left 8 // Bit
  #define axisRTrigger 9 // Right 4 // Bit
  #define buttonMacro 10 // Right 9 // Bit
  #define buttonTurbo 11 // Left 10 // Bit

  #define buttonDUp 12 // Left 3 // Bit
  #define buttonDDown 13 // Left 6 // Bit
  #define buttonDRight 14 // Left 4 // Bit
  #define buttonDLeft 15 // Left 5 // Bit

  #define axisXHalf 16 // Left 14
  #define axisXFull 17 // Left 14 // Both are part of the same byte

  #define axisYHalf 18 // Left 13
  #define axisYFull 19 // Left 13 // Both are part of the same byte

  #define axisCxHalf 20 // left 15
  #define axisCxFull 21 // left 15 // Both are part of the same byte

  #define axisCyHalf 22 // Left 16
  #define axisCyFull 23 // Left 16 // Both are part of the same byte

  #define buttonMode 24 // Left 11 // Bit
*/
#define buttonTurbo 0 // Left 10 // Bit
#define buttonMacro 1 // Right 9 // Bit
#define buttonZ 2 // Right 10 // Bit
#define buttonStart 3 // Left 12 // Bit

#define buttonDUp 4 // Left 3 // Bit
#define buttonDRight 5 // Left 4 // Bit
#define buttonDLeft 6 // Left 5 // Bit
#define buttonDDown 7 // Left 6 // Bit

#define axisLTrigger 8 // Left 8 // Bit
#define axisRTrigger 9 // Right 4 // Bit
#define buttonLTrigger 10 // Left 7 // Bit
#define buttonRTrigger 11 // Right 3 // Bit

#define buttonY 12 // Right 6 // Bit
#define buttonX 13 // Right 8 // Bit
#define buttonA 14 // Right 7 // Bit
#define buttonB 15 // Right 5 // Bit

#define axisCxHalf 18 // Left 14
#define axisCxFull 19 // Left 14 // Both are part of the same byte

#define axisCyHalf 16 // Left 13
#define axisCyFull 17 // Left 13 // Both are part of the same byte

#define axisXHalf 20 // left 15
#define axisXFull 21 // left 15 // Both are part of the same byte

#define axisYHalf 22 // Left 16
#define axisYFull 23 // Left 16 // Both are part of the same byte

#define buttonMode 24 // Left 11 // Bit
/*
  serial_rx_buffer[0] = 0x01; //  Preamble
  serial_rx_buffer[1] = 0x00; //  Digital L Trigger, Digital R Trigger, Z, Start, Y, X, B, A
  serial_rx_buffer[2] = 0x00; //  Analog L Trigger, Analog R Trigger, Macro (Bootleg), Turbo (Bootleg), DUp, DDown, DRight, DLeft
  serial_rx_buffer[3] = 0x7F; //  Analog X Axis
  serial_rx_buffer[4] = 0x7F; //  Analog Y Axis
  serial_rx_buffer[5] = 0x7F; //  C X Axis
  serial_rx_buffer[6] = 0x7F; //  C Y Axis
  serial_rx_buffer[7] = 0x00; //  Mode (Bootleg), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
  serial_rx_buffer[8] = 0x00; //  Unused
  serial_rx_buffer[9] = 0x00; //  Delay Byte 2
  serial_rx_buffer[10] = 0x00; // Delay Byte 1
  serial_rx_buffer[11] = 0x01; // Postamble
*/
/////////////////////////////////

#define motorInput A0 // Left 9
#define turboLed A1 // Right 11
#define macroLed A2 // Right 12

// Left 9 = Motor Input = A0
// Right 11 = Turbo LED = A1
// Right 12 = Macro LED = A2

bool defaultStatus[] =        {HIGH,        HIGH,        HIGH,    HIGH,        HIGH,      HIGH,         HIGH,        HIGH,        LOW,          LOW,          HIGH,           HIGH,           HIGH,    HIGH,    HIGH,    HIGH,    HIGH,       LOW,        HIGH,       LOW,        HIGH,      LOW,       HIGH,      LOW,       HIGH,       HIGH, HIGH, HIGH, HIGH, HIGH, HIGH, HIGH};
bool inputStatus[] =          {HIGH,        HIGH,        HIGH,    HIGH,        HIGH,      HIGH,         HIGH,        HIGH,        LOW,          LOW,          HIGH,           HIGH,           HIGH,    HIGH,    HIGH,    HIGH,    HIGH,       LOW,        HIGH,       LOW,        HIGH,      LOW,       HIGH,      LOW,       HIGH,       HIGH, HIGH, HIGH, HIGH, HIGH, HIGH, HIGH};
//unsigned int commandArray[] = {buttonLTrigger, buttonRTrigger, buttonZ, buttonStart, buttonY, buttonX, buttonB, buttonA, axisLTrigger, axisRTrigger, buttonMacro, buttonTurbo, buttonDUp, buttonDDown, buttonDRight, buttonDLeft, axisXHalf, axisXFull, axisYHalf, axisYFull, axisCxHalf, axisCxFull, axisCyHalf, axisCyHalf, buttonMode, 25, 26, 27, 28, 29, 30, 31};
unsigned int commandArray[] = {buttonTurbo, buttonMacro, buttonZ, buttonStart, buttonDUp, buttonDRight, buttonDLeft, buttonDDown, axisLTrigger, axisRTrigger, buttonLTrigger, buttonRTrigger, buttonY, buttonX, buttonA, buttonB, axisCyHalf, axisCyFull, axisCxHalf, axisCxFull, axisXHalf, axisXFull, axisYHalf, axisYHalf, buttonMode, 25, 26, 27, 28, 29, 30, 31};
unsigned int motorArray[] = {motorInput, turboLed, macroLed}; // Motor, Turbo LED, Macro LED

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

  pinMode(motorInput, INPUT);
  pinMode(turboLed, INPUT);
  pinMode(macroLed, INPUT);

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

  // Press the buttons X, Y and Start for 2 seconds to reset the controller,
  // this is a built in controller feature to make it easier to reset analog sticks and
  // triggers without having to unplug the controller, thanks Nintendo, this feature is very useful!
  inputStatus[buttonX] = LOW;
  inputStatus[buttonY] = LOW;
  inputStatus[buttonStart] = LOW;

  digitalWrite(latchPin, LOW);
  for (int i = 31; i >= 0; i--)
  {
    digitalWrite(clockPin, LOW);
    digitalWrite(dataPin, inputStatus[i]);
    digitalWrite(clockPin, HIGH);
  }
  digitalWrite(latchPin, HIGH);

  delay(2000);

  // Now we release the buttons X, Y and Start after 2 seconds have passed
  inputStatus[buttonX] = HIGH;
  inputStatus[buttonY] = HIGH;
  inputStatus[buttonStart] = HIGH;

  digitalWrite(latchPin, LOW);
  for (int i = 31; i >= 0; i--)
  {
    digitalWrite(clockPin, LOW);
    digitalWrite(dataPin, inputStatus[i]);
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
    //  Digital L Trigger, Digital R Trigger, Z, Start, Y, X, B, A
    inputStatus[buttonLTrigger] = !(serial_rx_buffer[1] & B00000001);
    inputStatus[buttonRTrigger] = !(serial_rx_buffer[1] & B00000010);
    inputStatus[buttonZ] = !(serial_rx_buffer[1] & B00000100);
    inputStatus[buttonStart] = !(serial_rx_buffer[1] & B00001000);
    inputStatus[buttonY] = !(serial_rx_buffer[1] & B00010000);
    inputStatus[buttonX] = !(serial_rx_buffer[1] & B00100000);
    inputStatus[buttonB] = !(serial_rx_buffer[1] & B01000000);
    inputStatus[buttonA] = !(serial_rx_buffer[1] & B10000000);

    //  Second 8 buttons, Buffer Array Element 2
    //  Analog L Trigger, Analog R Trigger, Macro (Bootleg), Turbo (Bootleg), DUp, DDown, DRight, DLeft
    //  Analog R and L Triggers have to be inverted (invert the logic level)
    inputStatus[axisLTrigger] = (serial_rx_buffer[2] & B00000001);
    inputStatus[axisRTrigger] = (serial_rx_buffer[2] & B00000010);
    inputStatus[buttonMacro] = !(serial_rx_buffer[2] & B00000100);
    inputStatus[buttonTurbo] = !(serial_rx_buffer[2] & B00001000);
    inputStatus[buttonDUp] = !(serial_rx_buffer[2] & B00010000);
    inputStatus[buttonDDown] = !(serial_rx_buffer[2] & B00100000);
    inputStatus[buttonDRight] = !(serial_rx_buffer[2] & B01000000);
    inputStatus[buttonDLeft] = !(serial_rx_buffer[2] & B10000000);

    //  4 Axis, Buffer Array Elements 3, 4, 5, 6
    //  X, Y, CX, CY

    //X STICK
    if (serial_rx_buffer[3] > 127)
    {
      // Push X Stick to Right
      inputStatus[axisXHalf] = HIGH;
      inputStatus[axisXFull] = HIGH;
    }

    if (serial_rx_buffer[3] < 127)
    {
      // Push X Stick to Left
      inputStatus[axisXHalf] = LOW;
      inputStatus[axisXFull] = LOW;
    }

    if (serial_rx_buffer[3] == 127)
    {
      // Keep X Stick Centered
      inputStatus[axisXHalf] = HIGH;
      inputStatus[axisXFull] = LOW;
    }

    //Y STICK
    if (serial_rx_buffer[4] > 127)
    {
      // Push Y Stick to Up
      inputStatus[axisYHalf] = LOW;
      inputStatus[axisYFull] = LOW;
    }

    if (serial_rx_buffer[4] < 127)
    {
      // Push Y Stick to Down
      inputStatus[axisYHalf] = HIGH;
      inputStatus[axisYFull] = HIGH;
    }

    if (serial_rx_buffer[4] == 127)
    {
      // Keep Y Stick Centered
      inputStatus[axisYHalf] = HIGH;
      inputStatus[axisYFull] = LOW;
    }

    //CX STICK
    if (serial_rx_buffer[5] > 127)
    {
      // Push CX Stick to Right
      inputStatus[axisCxHalf] = HIGH;
      inputStatus[axisCxFull] = HIGH;
    }

    if (serial_rx_buffer[5] < 127)
    {
      // Push CX Stick to Left
      inputStatus[axisCxHalf] = LOW;
      inputStatus[axisCxFull] = LOW;
    }

    if (serial_rx_buffer[5] == 127)
    {
      // Keep CX Stick Centered
      inputStatus[axisCxHalf] = HIGH;
      inputStatus[axisCxFull] = LOW;
    }

    //CY STICK
    if (serial_rx_buffer[6] > 127)
    {
      // Push CY Stick to Down
      inputStatus[axisCyHalf] = LOW;
      inputStatus[axisCyFull] = LOW;
    }

    if (serial_rx_buffer[6] < 127)
    {
      // Push CY Stick to Up
      inputStatus[axisCyHalf] = HIGH;
      inputStatus[axisCyFull] = HIGH;
    }

    if (serial_rx_buffer[6] == 127)
    {
      // Keep CY Stick Centered
      inputStatus[axisCyHalf] = HIGH;
      inputStatus[axisCyFull] = LOW;
    }

    //  Mode (Bootleg), Buffer Array Element 7
    //  All other bits in this Buffer Array Element are unused
    inputStatus[buttonMode] = !(serial_rx_buffer[7] & B00000001);

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
          //  Digital L Trigger, Digital R Trigger, Z, Start, Y, X, B, A
          inputStatus[buttonLTrigger] = !(serial_rx_buffer[1] & B00000001);
          inputStatus[buttonRTrigger] = !(serial_rx_buffer[1] & B00000010);
          inputStatus[buttonZ] = !(serial_rx_buffer[1] & B00000100);
          inputStatus[buttonStart] = !(serial_rx_buffer[1] & B00001000);
          inputStatus[buttonY] = !(serial_rx_buffer[1] & B00010000);
          inputStatus[buttonX] = !(serial_rx_buffer[1] & B00100000);
          inputStatus[buttonB] = !(serial_rx_buffer[1] & B01000000);
          inputStatus[buttonA] = !(serial_rx_buffer[1] & B10000000);

          //  Second 8 buttons, Buffer Array Element 2
          //  Analog L Trigger, Analog R Trigger, Macro (Bootleg), Turbo (Bootleg), DUp, DDown, DRight, DLeft
          //  Analog R and L Triggers have to be inverted (invert the logic level)
          inputStatus[axisLTrigger] = (serial_rx_buffer[2] & B00000001);
          inputStatus[axisRTrigger] = (serial_rx_buffer[2] & B00000010);
          inputStatus[buttonMacro] = !(serial_rx_buffer[2] & B00000100);
          inputStatus[buttonTurbo] = !(serial_rx_buffer[2] & B00001000);
          inputStatus[buttonDUp] = !(serial_rx_buffer[2] & B00010000);
          inputStatus[buttonDDown] = !(serial_rx_buffer[2] & B00100000);
          inputStatus[buttonDRight] = !(serial_rx_buffer[2] & B01000000);
          inputStatus[buttonDLeft] = !(serial_rx_buffer[2] & B10000000);

          //  4 Axis, Buffer Array Elements 3, 4, 5, 6
          //  X, Y, CX, CY

          //X STICK
          if (serial_rx_buffer[3] > 127)
          {
            // Push X Stick to Right
            inputStatus[axisXHalf] = HIGH;
            inputStatus[axisXFull] = HIGH;
          }

          if (serial_rx_buffer[3] < 127)
          {
            // Push X Stick to Left
            inputStatus[axisXHalf] = LOW;
            inputStatus[axisXFull] = LOW;
          }

          if (serial_rx_buffer[3] == 127)
          {
            // Keep X Stick Centered
            inputStatus[axisXHalf] = HIGH;
            inputStatus[axisXFull] = LOW;
          }

          //Y STICK
          if (serial_rx_buffer[4] > 127)
          {
            // Push Y Stick to Up
            inputStatus[axisYHalf] = LOW;
            inputStatus[axisYFull] = LOW;
          }

          if (serial_rx_buffer[4] < 127)
          {
            // Push Y Stick to Down
            inputStatus[axisYHalf] = HIGH;
            inputStatus[axisYFull] = HIGH;
          }

          if (serial_rx_buffer[4] == 127)
          {
            // Keep Y Stick Centered
            inputStatus[axisYHalf] = HIGH;
            inputStatus[axisYFull] = LOW;
          }

          //CX STICK
          if (serial_rx_buffer[5] > 127)
          {
            // Push CX Stick to Right
            inputStatus[axisCxHalf] = HIGH;
            inputStatus[axisCxFull] = HIGH;
          }

          if (serial_rx_buffer[5] < 127)
          {
            // Push CX Stick to Left
            inputStatus[axisCxHalf] = LOW;
            inputStatus[axisCxFull] = LOW;
          }

          if (serial_rx_buffer[5] == 127)
          {
            // Keep CX Stick Centered
            inputStatus[axisCxHalf] = HIGH;
            inputStatus[axisCxFull] = LOW;
          }

          //CY STICK
          if (serial_rx_buffer[6] > 127)
          {
            // Push CY Stick to Down
            inputStatus[axisCyHalf] = LOW;
            inputStatus[axisCyFull] = LOW;
          }

          if (serial_rx_buffer[6] < 127)
          {
            // Push CY Stick to Up
            inputStatus[axisCyHalf] = HIGH;
            inputStatus[axisCyFull] = HIGH;
          }

          if (serial_rx_buffer[6] == 127)
          {
            // Keep CY Stick Centered
            inputStatus[axisCyHalf] = HIGH;
            inputStatus[axisCyFull] = LOW;
          }

          //  Mode (Bootleg), Buffer Array Element 7
          //  All other bits in this Buffer Array Element are unused
          inputStatus[buttonMode] = !(serial_rx_buffer[7] & B00000001);

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
