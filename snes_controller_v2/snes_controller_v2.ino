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

#define startingMacroIndex 0x40
#define endingMacroIndex 0x80

unsigned int macroIndex = 0;
unsigned int currentMacroIndexRunning = 0;
unsigned int macroInputsToRun = 0;
unsigned int loopMacro = 0; //0 = Don't loop, 1 = loop
unsigned int timesToLoop = 0; //0 = Loop indefinitely, >0 = loop n times
unsigned int loopCounter = 0;

bool defaultStatus[] = {LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW};
bool inputStatus[] =   {LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW};
unsigned int commandArray[] = {buttonB, buttonY, buttonSelect, buttonStart, buttonUp, buttonDown, buttonLeft, buttonRight, buttonA, buttonX, buttonLHalf, buttonLFull, buttonRHalf, buttonRFull, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31};

boolean isInputting = false;
boolean isInputtingDelayed = false;

boolean didInputChange = false;

unsigned long inputDelay = 0;
unsigned long previousInputDelay = 0;
unsigned long currentMillis = 0;

unsigned long baudRate = 2000000;

byte serial_rx_buffer[12];
byte current_macro_input[12];
byte old_macro_input[12];
byte macro_buffer[64][12];
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

  current_macro_input[0] = 0x00;
  current_macro_input[1] = 0x00;
  current_macro_input[2] = 0x00;
  current_macro_input[3] = 0x00;
  current_macro_input[4] = 0x00;
  current_macro_input[5] = 0x00;
  current_macro_input[6] = 0x00;
  current_macro_input[7] = 0x00;
  current_macro_input[8] = 0x00;
  current_macro_input[9] = 0x00;
  current_macro_input[10] = 0x00;
  current_macro_input[11] = 0x00;

  old_macro_input[0] = 0x00;
  old_macro_input[1] = 0x00;
  old_macro_input[2] = 0x00;
  old_macro_input[3] = 0x00;
  old_macro_input[4] = 0x00;
  old_macro_input[5] = 0x00;
  old_macro_input[6] = 0x00;
  old_macro_input[7] = 0x00;
  old_macro_input[8] = 0x00;
  old_macro_input[9] = 0x00;
  old_macro_input[10] = 0x00;
  old_macro_input[11] = 0x00;
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
      for (unsigned int currentInputIndex = 0; currentInputIndex < sizeof(serial_rx_buffer); currentInputIndex++) {
        current_macro_input[currentInputIndex] = serial_rx_buffer[currentInputIndex];
      }
      // Make the button presses actually work
      macroIndex = 0;
      currentMacroIndexRunning = 0;
      macroInputsToRun = 0;
      loopMacro = 0;
      timesToLoop = 0;
      loopCounter = 0;
      isInputting = true;
      isInputtingDelayed = false;
      previousInputDelay = currentMillis;
    }
    if ((serial_rx_buffer[0] >= startingMacroIndex) && (serial_rx_buffer[11] >= startingMacroIndex))
    {
      if ((serial_rx_buffer[0] < endingMacroIndex) && (serial_rx_buffer[11] < endingMacroIndex))
      {
        if (serial_rx_buffer[0] == serial_rx_buffer[11]) {
          // Stop the current loop when we receive a new macro
          macroIndex = 0;
          currentMacroIndexRunning = 0;
          macroInputsToRun = 0;
          loopMacro = 0;
          timesToLoop = 0;
          loopCounter = 0;
          //isInputting = false;
          isInputtingDelayed = false;
          macroIndex = serial_rx_buffer[0] - startingMacroIndex;
          /*
            Serial.print("Received ");
            Serial.print(serial_rx_buffer[0]);

            Serial.print(" macro index ");
            Serial.println(macroIndex);
          */
          for (unsigned int macroInputIndex = 0; macroInputIndex < sizeof(serial_rx_buffer); macroInputIndex++) {
            macro_buffer[macroIndex][macroInputIndex] = serial_rx_buffer[macroInputIndex];
            //Serial.println(macro_buffer[macroIndex][macroInputIndex]);
          }
        }
      }
    }
    if ((serial_rx_buffer[0] == endingMacroIndex) && (serial_rx_buffer[11] == endingMacroIndex))
    {
      // Stop the current loop when we receive a new macro setter (The thing that tells how a macro should be executed, if it should loop, how many inputs it has to iterate through)
      macroIndex = 0;
      currentMacroIndexRunning = 0;
      macroInputsToRun = 0;
      loopMacro = 0;
      timesToLoop = 0;
      loopCounter = 0;
      isInputting = false;
      isInputtingDelayed = false;
      macroInputsToRun = serial_rx_buffer[1];
      loopMacro = serial_rx_buffer[2];
      currentMacroIndexRunning = serial_rx_buffer[3];
      timesToLoop = serial_rx_buffer[4]; // Times to repeat, if == 0, it'll not repeat, if != 0, it'll repeat n times, so in this case, gramatically speaking, timesToLoop and times to repeat are different things (does this make sense?), so the max amount of times it can loop is 256, the amount of times it can repeat is 255, the first iteration is not a repetition (Repeat input? Repeated input?) (Again, does this makes sense?)
      loopCounter = serial_rx_buffer[5];
      //isInputting = true;
      //previousInputDelay = currentMillis;
    }
  }
  runMacro();
  pressButtons();
} // Close Loop Function

void runMacro()
{
  if (isInputting == false) {
    if (macroInputsToRun != 0) {
      if (macroInputsToRun > currentMacroIndexRunning)
      {
        if (loopCounter <= timesToLoop) {
          for (unsigned int currentInputIndex = 0; currentInputIndex < sizeof(serial_rx_buffer); currentInputIndex++) {
            current_macro_input[currentInputIndex] = macro_buffer[currentMacroIndexRunning][currentInputIndex];
            //Serial.println(macro_buffer[currentMacroIndexRunning][currentInputIndex]);
          }
          // Make the button presses actually work
          isInputting = true;
          previousInputDelay = currentMillis;
        }
      }
      if (currentMacroIndexRunning < macroInputsToRun) {
        currentMacroIndexRunning++;
      }
      if (loopMacro != 0) {
        if (currentMacroIndexRunning >= macroInputsToRun) {
          currentMacroIndexRunning = 0;
          if (timesToLoop <= 0) {
            //
          }
          if (timesToLoop > 0 && loopCounter <= timesToLoop) {
            // Sending this block for redundancy sake, will comment this block if something goes wrong (it shouldn't)
            Serial.write(endingMacroIndex);
            Serial.write(macroInputsToRun);
            Serial.write(loopMacro);
            Serial.write(currentMacroIndexRunning);
            Serial.write(timesToLoop);
            Serial.write(loopCounter);
            Serial.write(0x00);
            Serial.write(0x00);
            Serial.write(0x00);
            Serial.write(0x00);
            Serial.write(0x00);
            Serial.write(endingMacroIndex);
            loopCounter++;
            Serial.write(endingMacroIndex);
            Serial.write(macroInputsToRun);
            Serial.write(loopMacro);
            Serial.write(currentMacroIndexRunning);
            Serial.write(timesToLoop);
            Serial.write(loopCounter);
            Serial.write(0x00);
            Serial.write(0x00);
            Serial.write(0x00);
            Serial.write(0x00);
            Serial.write(0x00);
            Serial.write(endingMacroIndex);
          }
        }
      }
    }
  }
}

void pressButtons()
{
  if (isInputtingDelayed == false)
  {
    //  Define input delay (If Buffer Array Element 9 and 10 !=0)
    inputDelay = (unsigned long)current_macro_input[9] << 8 | (unsigned long)current_macro_input[10];
  }
  if (isInputting == true)
  {
    didInputChange = false;
    // Send the controller data back so it can be used to display controller information on the overlay
    for (unsigned int currentByteIndex = 0; currentByteIndex < sizeof(current_macro_input); currentByteIndex++) {
      if (current_macro_input[currentByteIndex] != old_macro_input[currentByteIndex]) {
        didInputChange = true;
      }
      old_macro_input[currentByteIndex] = current_macro_input[currentByteIndex];
    }
    if (didInputChange == true) {
      if (macroInputsToRun != 0) {
        // This block is used to tell the backend where in the macro chain the current macro input is
        Serial.write(endingMacroIndex);
        Serial.write(macroInputsToRun);
        Serial.write(loopMacro);
        Serial.write(currentMacroIndexRunning);
        Serial.write(timesToLoop);
        Serial.write(loopCounter);
        Serial.write(0x00);
        Serial.write(0x00);
        Serial.write(0x00);
        Serial.write(0x00);
        Serial.write(0x00);
        Serial.write(endingMacroIndex);
      }
      for (unsigned int currentByteIndex = 0; currentByteIndex < sizeof(current_macro_input); currentByteIndex++) {
        // Send only data back if it has changed, I don't know how to do this without having two loops
        Serial.write(current_macro_input[currentByteIndex]);
      }
    }
    Serial.flush();
    //  Press Button

    //  First 8 buttons, Buffer Array Element 1
    //  B, Y, SELECT, START, UP, DOWN, LEFT, RIGHT
    inputStatus[4] =  (current_macro_input[1] & B00000001); // B
    inputStatus[5] =  (current_macro_input[1] & B00000010); // Y
    inputStatus[6] =  (current_macro_input[1] & B00000100); // Select
    inputStatus[7] =  (current_macro_input[1] & B00001000); // Start
    inputStatus[8] =  (current_macro_input[1] & B00010000); // Up
    inputStatus[10] = (current_macro_input[1] & B00100000); // Down
    inputStatus[1] =  (current_macro_input[1] & B01000000); // Left
    inputStatus[0] =  (current_macro_input[1] & B10000000); // Right

    //  Second 4 buttons, Buffer Array Element 2
    //  A, X, L, R, N/A, N/A, N/A, N/A
    inputStatus[24] =  (current_macro_input[2] & B00000001); // A
    inputStatus[3] =   (current_macro_input[2] & B00000010); // X

    // Because the L and R buttons are connected to a board where
    // it outputs pseudo-analog levels, we have to set 2 bits low
    // or high to be able to actually press the buttons
    inputStatus[20] = (current_macro_input[2] & B00000100); // L
    inputStatus[21] = (current_macro_input[2] & B00000100); // L
    inputStatus[22] = (current_macro_input[2] & B00001000); // R
    inputStatus[23] = (current_macro_input[2] & B00001000); // R

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

          current_macro_input[0] = 0x00;
          current_macro_input[1] = 0x00;
          current_macro_input[2] = 0x00;
          current_macro_input[3] = 0x00;
          current_macro_input[4] = 0x00;
          current_macro_input[5] = 0x00;
          current_macro_input[6] = 0x00;
          current_macro_input[7] = 0x00;
          current_macro_input[8] = 0x00;
          current_macro_input[9] = 0x00;
          current_macro_input[10] = 0x00;
          current_macro_input[11] = 0x00;

          didInputChange = false;

          // Send the controller data back so it can be used to display controller information on the overlay
          for (unsigned int currentByteIndex = 0; currentByteIndex < sizeof(current_macro_input); currentByteIndex++) {
            if (current_macro_input[currentByteIndex] != old_macro_input[currentByteIndex]) {
              didInputChange = true;
            }
            old_macro_input[currentByteIndex] = current_macro_input[currentByteIndex];
          }
          if (didInputChange == true) {
            if (macroInputsToRun != 0) {
              // This block is used to tell the backend where in the macro chain the current macro input is
              Serial.write(endingMacroIndex);
              Serial.write(macroInputsToRun);
              Serial.write(loopMacro);
              Serial.write(currentMacroIndexRunning);
              Serial.write(timesToLoop);
              Serial.write(loopCounter);
              Serial.write(0x00);
              Serial.write(0x00);
              Serial.write(0x00);
              Serial.write(0x00);
              Serial.write(0x00);
              Serial.write(endingMacroIndex);
            }
            for (unsigned int currentByteIndex = 0; currentByteIndex < sizeof(current_macro_input); currentByteIndex++) {
              // Send only data back if it has changed, I don't know how to do this without having two loops
              Serial.write(current_macro_input[currentByteIndex]);
            }
          }
          Serial.flush();
          //  First 8 buttons, Buffer Array Element 1
          //  B, Y, SELECT, START, UP, DOWN, LEFT, RIGHT
          inputStatus[4] =  (current_macro_input[1] & B00000001); // B
          inputStatus[5] =  (current_macro_input[1] & B00000010); // Y
          inputStatus[6] =  (current_macro_input[1] & B00000100); // Select
          inputStatus[7] =  (current_macro_input[1] & B00001000); // Start
          inputStatus[8] =  (current_macro_input[1] & B00010000); // Up
          inputStatus[10] = (current_macro_input[1] & B00100000); // Down
          inputStatus[1] =  (current_macro_input[1] & B01000000); // Left
          inputStatus[0] =  (current_macro_input[1] & B10000000); // Right

          //  Second 8 buttons, Buffer Array Element 2
          //  A, X, L, R, N/A, N/A, N/A, N/A
          inputStatus[24] =  (current_macro_input[2] & B00000001); // A
          inputStatus[3] =   (current_macro_input[2] & B00000010); // X

          // Because the L and R buttons are connected to a board where
          // it outputs pseudo-analog levels, we have to set 2 bits low
          // or high to be able to actually press the
          inputStatus[20] = (current_macro_input[2] & B00000100); // L
          inputStatus[21] = (current_macro_input[2] & B00000100); // L
          inputStatus[22] = (current_macro_input[2] & B00001000); // R
          inputStatus[23] = (current_macro_input[2] & B00001000); // R

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
