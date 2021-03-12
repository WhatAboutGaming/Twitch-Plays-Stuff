/*
  GameCube Controller for Arduino Mega2560 v2.0 by WhatAboutGaming
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

unsigned long inputDelay = 0;
unsigned long previousInputDelay = 0;
unsigned long currentMillis = 0;

unsigned long baudRate = 2000000;

byte serial_rx_buffer[12];
unsigned long controller = 0;

//  The array below is an array of all buttons in the order the bytes have to be sent
unsigned int commandArray[] = {buttonStart, buttonY, buttonX, buttonB, buttonA, buttonLTrigger, buttonRTrigger, buttonZ, buttonDUp, buttonDDown, buttonDRight, buttonDLeft, axisLTrigger, axisRTrigger, buttonMacro, buttonTurbo, axisX, axisY, axisCx, axisCy, buttonMode};
unsigned int motorArray[] = {motorInput, turboLed, macroLed};

void setup() {
  //TCCR0B = (TCCR0B & 0xF8) | 0x02;
  TCCR3B = (TCCR2B & 0xF8) | 0x01;
  Serial.begin(baudRate);
  for (unsigned int buttonArrayIndex = 0; buttonArrayIndex < (sizeof(commandArray) / sizeof(unsigned int)); buttonArrayIndex++)
  {
    pinMode(commandArray[buttonArrayIndex], OUTPUT);
    digitalWrite(commandArray[buttonArrayIndex], LOW);
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
  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, HIGH);
  //delay(133);
  digitalWrite(axisLTrigger, LOW);
  digitalWrite(axisRTrigger, LOW);

  //  Prepare data to sent on startup as a way to tell the controller is in Neutral position
  //  That means, when all buttons and analog sticks are reset to their Neutral positions
  serial_rx_buffer[0] = 0x01; //  Preamble
  serial_rx_buffer[1] = 0x00; //  Start, Y, X, B, A, Digital L Trigger, Digital R Trigger, Z
  serial_rx_buffer[2] = 0x00; //  DUp, DDown, DRight, DDleft, Analog L Trigger (Working Digitally), Analog R Trigger (Working Digitally), Macro (Bootleg), Turbo (Bootleg)
  serial_rx_buffer[3] = 0x7F; //  Analog X Axis
  serial_rx_buffer[4] = 0x7F; //  Analog Y Axis
  serial_rx_buffer[5] = 0x7F; //  C X Axis
  serial_rx_buffer[6] = 0x7F; //  C Y Axis
  serial_rx_buffer[7] = 0x00; //  Mode (Bootleg), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
  serial_rx_buffer[8] = 0x00; //  Unused
  serial_rx_buffer[9] = 0x00; //  Delay Byte 2
  serial_rx_buffer[10] = 0x00; // Delay Byte 1
  serial_rx_buffer[11] = 0x01; // Postamble
  resetController();
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
      isInputting = true;
      previousInputDelay = currentMillis;
    }
  }
  pressButtons();
} // Close Loop Function

void resetController()
{
  //Press X+Y+Start to tell the GameCube to reset the controller data, which can be used to fix faulty analog stick readings
  unsigned long resetDelay = 133;
  /*
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
  */
  delay(resetDelay);
  digitalWrite(commandArray[0], HIGH);
  digitalWrite(commandArray[1], HIGH);
  digitalWrite(commandArray[2], HIGH);
  delay(resetDelay);
  digitalWrite(commandArray[0], LOW);
  digitalWrite(commandArray[1], LOW);
  digitalWrite(commandArray[2], LOW);
  delay(resetDelay);
  
  for (unsigned int buttonArrayIndex = 0; buttonArrayIndex < (sizeof(commandArray) / sizeof(unsigned int)); buttonArrayIndex++) {
    digitalWrite(commandArray[buttonArrayIndex], LOW);
  }
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
    //  Start, Y, X, B, A, Digital L Trigger, Digital R Trigger, Z
    digitalWrite(commandArray[0], (serial_rx_buffer[1] & B00000001));
    digitalWrite(commandArray[1], (serial_rx_buffer[1] & B00000010));
    digitalWrite(commandArray[2], (serial_rx_buffer[1] & B00000100));
    digitalWrite(commandArray[3], (serial_rx_buffer[1] & B00001000));
    digitalWrite(commandArray[4], (serial_rx_buffer[1] & B00010000));
    digitalWrite(commandArray[5], (serial_rx_buffer[1] & B00100000));
    digitalWrite(commandArray[6], (serial_rx_buffer[1] & B01000000));
    digitalWrite(commandArray[7], (serial_rx_buffer[1] & B10000000));

    //  Second 8 buttons, Buffer Array Element 2
    //  DUp, DDown, DRight, DDleft, Analog L Trigger (Working Digitally), Analog R Trigger (Working Digitally), Macro (Bootleg), Turbo (Bootleg)
    digitalWrite(commandArray[8], (serial_rx_buffer[2] & B00000001));
    digitalWrite(commandArray[9], (serial_rx_buffer[2] & B00000010));
    digitalWrite(commandArray[10], (serial_rx_buffer[2] & B00000100));
    digitalWrite(commandArray[11], (serial_rx_buffer[2] & B00001000));
    digitalWrite(commandArray[12], ((255 - serial_rx_buffer[2]) & B00010000));
    digitalWrite(commandArray[13], ((255 - serial_rx_buffer[2]) & B00100000));
    digitalWrite(commandArray[14], (serial_rx_buffer[2] & B01000000));
    digitalWrite(commandArray[15], (serial_rx_buffer[2] & B10000000));

    //  4 Axis, Buffer Array Elements 3, 4, 5, 6
    //  Analog X Axis, Analog Y Axis, C X Axis, C Y Axis
    analogWrite(commandArray[16], (255 - serial_rx_buffer[3]));
    analogWrite(commandArray[17], serial_rx_buffer[4]);
    analogWrite(commandArray[18], (255 - serial_rx_buffer[5]));
    analogWrite(commandArray[19], serial_rx_buffer[6]);

    //  Mode Button, Buffer Array Element 7
    //  Mode (Bootleg), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
    digitalWrite(commandArray[20], (serial_rx_buffer[7] & B00000001));

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

          //  Reset everything
          serial_rx_buffer[0] = 0x00; //  Preamble
          serial_rx_buffer[1] = 0x00; //  Start, Y, X, B, A, Digital L Trigger, Digital R Trigger, Z
          serial_rx_buffer[2] = 0x00; //  DUp, DDown, DRight, DDleft, Analog L Trigger (Working Digitally), Analog R Trigger (Working Digitally), Macro (Bootleg), Turbo (Bootleg)
          serial_rx_buffer[3] = 0x7F; //  Analog X Axis
          serial_rx_buffer[4] = 0x7F; //  Analog Y Axis
          serial_rx_buffer[5] = 0x7F; //  C X Axis
          serial_rx_buffer[6] = 0x7F; //  C Y Axis
          serial_rx_buffer[7] = 0x00; //  Mode (Bootleg), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
          serial_rx_buffer[8] = 0x00; //  Unused
          serial_rx_buffer[9] = 0x00; //  Delay Byte 2
          serial_rx_buffer[10] = 0x00; // Delay Byte 1
          serial_rx_buffer[11] = 0x00; // Postamble

          //  First 8 buttons, Buffer Array Element 1
          //  Start, Y, X, B, A, Digital L Trigger, Digital R Trigger, Z
          digitalWrite(commandArray[0], (serial_rx_buffer[1] & B00000001));
          digitalWrite(commandArray[1], (serial_rx_buffer[1] & B00000010));
          digitalWrite(commandArray[2], (serial_rx_buffer[1] & B00000100));
          digitalWrite(commandArray[3], (serial_rx_buffer[1] & B00001000));
          digitalWrite(commandArray[4], (serial_rx_buffer[1] & B00010000));
          digitalWrite(commandArray[5], (serial_rx_buffer[1] & B00100000));
          digitalWrite(commandArray[6], (serial_rx_buffer[1] & B01000000));
          digitalWrite(commandArray[7], (serial_rx_buffer[1] & B10000000));

          //  Second 8 buttons, Buffer Array Element 2
          //  DUp, DDown, DRight, DDleft, Analog L Trigger (Working Digitally), Analog R Trigger (Working Digitally), Macro (Bootleg), Turbo (Bootleg)
          digitalWrite(commandArray[8], (serial_rx_buffer[2] & B00000001));
          digitalWrite(commandArray[9], (serial_rx_buffer[2] & B00000010));
          digitalWrite(commandArray[10], (serial_rx_buffer[2] & B00000100));
          digitalWrite(commandArray[11], (serial_rx_buffer[2] & B00001000));
          digitalWrite(commandArray[12], ((255 - serial_rx_buffer[2]) & B00010000));
          digitalWrite(commandArray[13], ((255 - serial_rx_buffer[2]) & B00100000));
          digitalWrite(commandArray[14], (serial_rx_buffer[2] & B01000000));
          digitalWrite(commandArray[15], (serial_rx_buffer[2] & B10000000));

          //  4 Axis, Buffer Array Elements 3, 4, 5, 6
          //  Analog X Axis, Analog Y Axis, C X Axis, C Y Axis
          analogWrite(commandArray[16], (255 - serial_rx_buffer[3]));
          analogWrite(commandArray[17], serial_rx_buffer[4]);
          analogWrite(commandArray[18], (255 - serial_rx_buffer[5]));
          analogWrite(commandArray[19], serial_rx_buffer[6]);

          //  Mode Button, Buffer Array Element 7
          //  Mode (Bootleg), Buffer Array Element 7  //  All other bits in this Buffer Array Element are unused
          digitalWrite(commandArray[20], (serial_rx_buffer[7] & B00000001));

          //  Buffer Array Element 8 is unused in this code, but is existing in case changes are needed
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
