// This project uses 4 8-bit shift register, such as 74HC595 or HCF4094, in cascading format
/*
  GCN Controller for Arduino UNO by WhatAboutGaming NOTE: THIS CODE HAD TO BE MODIFIED TO WORK WITH MEGA 2560 BECAUSE UNO RAN OUT OF RAM, THIS CODE NEEDS TO BE OPTIMIZED TO SAVE RAM, I DON'T KNOW WHERE TO EVEN START TO OPTIMIZE THE CODE, TO ME, EVERYTHING LOOKS FINE BUT I'M A NOOB
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

const uint8_t startingMacroIndex = 0x04;
const uint8_t endingMacroIndex = 0x64;
const uint8_t macroBufferSize = endingMacroIndex - startingMacroIndex;
const uint8_t startingMacroMetadataIndex = endingMacroIndex + 1;
const uint8_t endingMacroMetadataIndex = startingMacroMetadataIndex + macroBufferSize;
const uint8_t macroMetadataSize = endingMacroMetadataIndex - startingMacroMetadataIndex; // Using define on these variables for some reason was making it return wrong values
//const uint8_t macroMetadataSize = macroBufferSize;

uint8_t macroIndex = 0;
uint8_t currentMacroIndexRunning = 0;
uint8_t macroInputsToRun = 0;
uint8_t loopMacro = 0; //0 = Don't loop, 1 = loop
uint8_t timesToLoop = 0; //0 = Loop indefinitely, >0 = loop n times
uint8_t loopCounter = 0;
//uint8_t macroHasInnerLoops = 0; //This variable is used to tell if the macro has inner loops (eg: a+b,[wait b]255) // 0 = There are NO inner loops !0 = There is at least one inner loop
uint8_t howManyInnerLoopsMacroHas = 0; //This variable is used to tell if the macro has inner loops (eg: a+b,[wait b]255) and how many there are // 0 = There are NO inner loops !0 = There are n inner loops, where n is this variable
uint8_t macroMetadataIndex = 0;
uint8_t currentMacroMetadataIndexRunning = 0;

#define motorInput A0 // Left 9
#define turboLed A1 // Right 11
#define macroLed A2 // Right 12

// Left 9 = Motor Input = A0
// Right 11 = Turbo LED = A1
// Right 12 = Macro LED = A2

const bool defaultStatus[] =        {HIGH,        HIGH,        HIGH,    HIGH,        HIGH,      HIGH,         HIGH,        HIGH,        LOW,          LOW,          HIGH,           HIGH,           HIGH,    HIGH,    HIGH,    HIGH,    HIGH,       LOW,        HIGH,       LOW,        HIGH,      LOW,       HIGH,      LOW,       HIGH,       HIGH, HIGH, HIGH, HIGH, HIGH, HIGH, HIGH};
bool inputStatus[] =          {HIGH,        HIGH,        HIGH,    HIGH,        HIGH,      HIGH,         HIGH,        HIGH,        LOW,          LOW,          HIGH,           HIGH,           HIGH,    HIGH,    HIGH,    HIGH,    HIGH,       LOW,        HIGH,       LOW,        HIGH,      LOW,       HIGH,      LOW,       HIGH,       HIGH, HIGH, HIGH, HIGH, HIGH, HIGH, HIGH};
//uint8_t commandArray[] = {buttonLTrigger, buttonRTrigger, buttonZ, buttonStart, buttonY, buttonX, buttonB, buttonA, axisLTrigger, axisRTrigger, buttonMacro, buttonTurbo, buttonDUp, buttonDDown, buttonDRight, buttonDLeft, axisXHalf, axisXFull, axisYHalf, axisYFull, axisCxHalf, axisCxFull, axisCyHalf, axisCyHalf, buttonMode, 25, 26, 27, 28, 29, 30, 31};
uint8_t commandArray[] = {buttonTurbo, buttonMacro, buttonZ, buttonStart, buttonDUp, buttonDRight, buttonDLeft, buttonDDown, axisLTrigger, axisRTrigger, buttonLTrigger, buttonRTrigger, buttonY, buttonX, buttonA, buttonB, axisCyHalf, axisCyFull, axisCxHalf, axisCxFull, axisXHalf, axisXFull, axisYHalf, axisYHalf, buttonMode, 25, 26, 27, 28, 29, 30, 31};
uint8_t motorArray[] = {motorInput, turboLed, macroLed}; // Motor, Turbo LED, Macro LED

bool isInputting = false;
bool isInputtingDelayed = false;

bool didInputChange = false;

uint32_t inputDelay = 0;
uint32_t previousInputDelay = 0;
//uint32_t currentMillis = 0;

uint32_t baudRate = 500000;

uint8_t serial_rx_buffer[12];
uint8_t current_macro_input[12];
uint8_t old_macro_input[12];
uint8_t macro_buffer[macroBufferSize][12];
uint8_t macro_loop_metadata[macroMetadataSize][12]; // Contains informations such as how many times to repeat a portion of a macro, and where to start and end
uint32_t controller = 0;

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
  for (int8_t i = 31; i >= 0; i--)
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
  for (int8_t i = 31; i >= 0; i--)
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
  for (int8_t i = 31; i >= 0; i--)
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

  current_macro_input[0] = 0x00;
  current_macro_input[1] = 0x00;
  current_macro_input[2] = 0x00;
  current_macro_input[3] = 0x7F;
  current_macro_input[4] = 0x7F;
  current_macro_input[5] = 0x7F;
  current_macro_input[6] = 0x7F;
  current_macro_input[7] = 0x00;
  current_macro_input[8] = 0x00;
  current_macro_input[9] = 0x00;
  current_macro_input[10] = 0x00;
  current_macro_input[11] = 0x00;

  old_macro_input[0] = 0x00;
  old_macro_input[1] = 0x00;
  old_macro_input[2] = 0x00;
  old_macro_input[3] = 0x7F;
  old_macro_input[4] = 0x7F;
  old_macro_input[5] = 0x7F;
  old_macro_input[6] = 0x7F;
  old_macro_input[7] = 0x00;
  old_macro_input[8] = 0x00;
  old_macro_input[9] = 0x00;
  old_macro_input[10] = 0x00;
  old_macro_input[11] = 0x00;

  Serial.println(startingMacroIndex);
  Serial.println(endingMacroIndex);
  Serial.println(macroBufferSize);
  Serial.println(startingMacroMetadataIndex);
  Serial.println(endingMacroMetadataIndex);
  Serial.println(macroMetadataSize);

}

void loop()
{
  //currentMillis = millis();
  if (Serial.available() > 0)
  {
    controller = Serial.readBytes(serial_rx_buffer, sizeof(serial_rx_buffer)) && 0xFF;

    //  Set Start Byte (Preamble Byte) and End Byte (Postamble Byte)
    //  1 == 0x01
    if ((serial_rx_buffer[0] == 0x01) && (serial_rx_buffer[11] == 0x01))
    {
      for (uint8_t currentInputIndex = 0; currentInputIndex < sizeof(serial_rx_buffer); currentInputIndex++) {
        current_macro_input[currentInputIndex] = serial_rx_buffer[currentInputIndex];
      }
      // Make the button presses actually work
      macroIndex = 0;
      currentMacroIndexRunning = 0;
      macroInputsToRun = 0;
      loopMacro = 0;
      timesToLoop = 0;
      loopCounter = 0;
      howManyInnerLoopsMacroHas = 0;
      isInputting = true;
      isInputtingDelayed = false;
      previousInputDelay = millis();
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
          howManyInnerLoopsMacroHas = 0;
          //isInputting = false;
          isInputtingDelayed = false;
          macroIndex = serial_rx_buffer[0] - startingMacroIndex;
          for (uint8_t macroInputIndex = 0; macroInputIndex < sizeof(serial_rx_buffer); macroInputIndex++) {
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
      howManyInnerLoopsMacroHas = 0;
      isInputtingDelayed = false;
      isInputting = false;
      macroInputsToRun = serial_rx_buffer[1];
      loopMacro = serial_rx_buffer[2];
      currentMacroIndexRunning = serial_rx_buffer[3];
      timesToLoop = serial_rx_buffer[4]; // Times to repeat, if == 0, it'll not repeat, if != 0, it'll repeat n times, so in this case, gramatically speaking, timesToLoop and times to repeat are different things (does this make sense?), so the max amount of times it can loop is 256, the amount of times it can repeat is 255, the first iteration is not a repetition (Repeat input? Repeated input?) (Again, does this makes sense?)
      loopCounter = serial_rx_buffer[5];
      howManyInnerLoopsMacroHas = serial_rx_buffer[6]; // Different than 0 if there are, 0 if there aren't
      //isInputting = true;
      //previousInputDelay = millis();
    }
    if ((serial_rx_buffer[0] >= startingMacroMetadataIndex) && (serial_rx_buffer[11] >= startingMacroMetadataIndex)) {
      if ((serial_rx_buffer[0] < endingMacroMetadataIndex) && (serial_rx_buffer[11] < endingMacroMetadataIndex)) {
        if (serial_rx_buffer[0] == serial_rx_buffer[11]) {
          //Serial.print("Received loop metadata 1 info at index ");
          //Serial.println(serial_rx_buffer[0]);
          // Stop the current loop when we receive a new macro
          macroIndex = 0;
          currentMacroIndexRunning = 0;
          macroInputsToRun = 0;
          loopMacro = 0;
          timesToLoop = 0;
          loopCounter = 0;
          howManyInnerLoopsMacroHas = 0;
          //isInputting = false;
          isInputtingDelayed = false;
          macroMetadataIndex = serial_rx_buffer[0] - startingMacroMetadataIndex;
          /*
            macro_loop_metadata[macroMetadataIndex][0] = 0; // Preamble
            macro_loop_metadata[macroMetadataIndex][1] = 0; // Inputs to execute (number of inputs that should be executed in this inner loop) (Use same logic as [5] here instead?)
            macro_loop_metadata[macroMetadataIndex][2] = 0; // Current input index
            macro_loop_metadata[macroMetadataIndex][3] = 0; // Times to repeat (number of times this inner loop should be executed, before going to the next inner loop, if any)
            macro_loop_metadata[macroMetadataIndex][4] = 0; // Repeat counter (number of times this inner loop was executed)
            macro_loop_metadata[macroMetadataIndex][5] = 0; // Where is the next inner loop's first input (index 0 input for the next inner loop, aka the index for the input in the macro_buffer array) (Continue normally if value is 0, or do nothing if there are no more inputs to be executed)
            macro_loop_metadata[macroMetadataIndex][6] = 0; // Where to start (index of the starting input) (Inclusive)
            macro_loop_metadata[macroMetadataIndex][7] = 0; // Where to end (index of the ending input) (Inclusive)
            macro_loop_metadata[macroMetadataIndex][8] = 0; // How many inner loops that should be executed after this (if <=0, don't execute inner loops any inner loops after this, and move on as normal, if there are normal inputs to be exeucuted, execute those, if there's nothing else to do, go back to the beginning of the larger loop, if > 0, execute n inner loops after this)
            macro_loop_metadata[macroMetadataIndex][9] = 0; // Unused?
            macro_loop_metadata[macroMetadataIndex][10] = 0; // Unused?
            macro_loop_metadata[macroMetadataIndex][11] = 0; // Postamble
          */
          for (uint8_t macroInputMetadataIndex = 0; macroInputMetadataIndex < sizeof(serial_rx_buffer); macroInputMetadataIndex++) {
            macro_loop_metadata[macroMetadataIndex][macroInputMetadataIndex] = serial_rx_buffer[macroInputMetadataIndex];
            //Serial.print("macroMetadataIndex = ");
            //Serial.println(macroMetadataIndex);
            //Serial.print("macroInputMetadataIndex = ");
            //Serial.println(macroInputMetadataIndex);
            Serial.println(macro_loop_metadata[macroMetadataIndex][macroInputMetadataIndex]);
          }
          //Serial.println("");
        }
      }
    }
    if ((serial_rx_buffer[0] == endingMacroMetadataIndex) && (serial_rx_buffer[11] == endingMacroMetadataIndex)) {
      //Serial.print("Received loop metadata 2 info at index ");
      //Serial.println(serial_rx_buffer[0]);
    }
  }
  runMacro();
  pressButtons();
} // Close Loop Function

void runMacro()
{
  if (isInputting == false) {
    if (macroInputsToRun > 0) {
      if (macroInputsToRun > currentMacroIndexRunning)
      {
        if (loopCounter <= timesToLoop) {
          for (uint8_t currentInputIndex = 0; currentInputIndex < sizeof(serial_rx_buffer); currentInputIndex++) {
            current_macro_input[currentInputIndex] = macro_buffer[currentMacroIndexRunning][currentInputIndex];
            //Serial.println(current_macro_input[currentInputIndex]);
            //Serial.print("currentMacroIndexRunning = ");
            //Serial.println(currentMacroIndexRunning);
          }
          //Serial.print("currentMacroIndexRunning = ");
          //Serial.println(currentMacroIndexRunning);
          if (howManyInnerLoopsMacroHas <= 0) {
            //Serial.println("\r\nTEST A");
            /*
              currentMacroMetadataIndexRunning = currentMacroIndexRunning + startingMacroMetadataIndex;
              Serial.print("currentMacroMetadataIndexRunning = ");
              Serial.println(currentMacroMetadataIndexRunning);
            */
            //
            /*
              Serial.println("");
              Serial.print("howManyInnerLoopsMacroHas = ");
              Serial.println(howManyInnerLoopsMacroHas);
              Serial.print(" , currentMacroIndexRunning = ");
              Serial.println(currentMacroIndexRunning);
              Serial.println("");
            */
          }
          if (howManyInnerLoopsMacroHas > 0) {
            //Serial.println("\r\nTEST B");
            //
            currentMacroMetadataIndexRunning = currentMacroIndexRunning + startingMacroMetadataIndex;
            if (macro_loop_metadata[currentMacroIndexRunning][2] == currentMacroMetadataIndexRunning) {
              //Serial.println("");
              //Serial.println("YEAH 2");
              //Serial.println("");
            }
            if (macro_loop_metadata[currentMacroIndexRunning][2] == currentMacroIndexRunning) {
              //Serial.println("");
              //Serial.print("currentMacroMetadataIndexRunning = ");
              //Serial.println(currentMacroMetadataIndexRunning);
              //Serial.println("YEAH");
              //Serial.println("");
            }

            /*
              Serial.print("startingMacroMetadataIndex = ");
              Serial.println(startingMacroMetadataIndex);
              Serial.print("currentMacroIndexRunning = ");
              Serial.println(currentMacroIndexRunning);
              Serial.print("macro_loop_metadata[currentMacroIndexRunning][2] = ");
              Serial.println(macro_loop_metadata[currentMacroIndexRunning][2]);
              Serial.print("currentMacroMetadataIndexRunning = ");
              Serial.println(currentMacroMetadataIndexRunning);
            */

            /*
              Serial.println("");
              Serial.print("howManyInnerLoopsMacroHas = ");
              Serial.println(howManyInnerLoopsMacroHas);
              Serial.print(" , currentMacroIndexRunning = ");
              Serial.println(currentMacroIndexRunning);
              Serial.println("");
            */
          }
          // Make the button presses actually work
          isInputting = true;
          previousInputDelay = millis();
        }
      }
      if (currentMacroIndexRunning < macroInputsToRun) {
        //Serial.print("A BEFORE currentMacroIndexRunning = ");
        //Serial.println(currentMacroIndexRunning);
        if (howManyInnerLoopsMacroHas <= 0) {
          // Do stuff normally
          Serial.println("This macro does not have inner loops");
          currentMacroIndexRunning++;
        }
        if (howManyInnerLoopsMacroHas > 0) {
          // This is where inner loop logic goes (???)
          Serial.println("This macro has inner loops");
          if (macro_loop_metadata[macroMetadataIndex][1] > 0 && macro_loop_metadata[macroMetadataIndex][3] > 0) {
            // Do something
            Serial.println("This inner loop metadata is valid");
            Serial.print("A currentMacroIndexRunning  = ");
            Serial.println(currentMacroIndexRunning);
            if (macro_loop_metadata[macroMetadataIndex][3] > 0 && macro_loop_metadata[macroMetadataIndex][4] <= macro_loop_metadata[macroMetadataIndex][3]) {
              Serial.println("TEST");
              if (macro_loop_metadata[macroMetadataIndex][2] < macro_loop_metadata[macroMetadataIndex][6]) {
                // Current input index is lower than starting index, fix this
                Serial.println("Current input index for current inner loop is below what it is supposed to be, fix that!");
                Serial.print("B currentMacroIndexRunning  = ");
                Serial.println(currentMacroIndexRunning);
                macro_loop_metadata[macroMetadataIndex][2] = macro_loop_metadata[macroMetadataIndex][6];
                currentMacroIndexRunning = macro_loop_metadata[macroMetadataIndex][6];
                Serial.print("C currentMacroIndexRunning  = ");
                Serial.println(currentMacroIndexRunning);
              }
              if (macro_loop_metadata[macroMetadataIndex][2] >= macro_loop_metadata[macroMetadataIndex][6] && currentMacroIndexRunning <= macro_loop_metadata[macroMetadataIndex][7]) {
                // Current input index is lower than starting index, fix this
                Serial.println("Current input index for current inner loop is in the valid range!");
                Serial.print("D currentMacroIndexRunning  = ");
                Serial.println(currentMacroIndexRunning);
                currentMacroIndexRunning++;
                macro_loop_metadata[macroMetadataIndex][2]++;
                Serial.print("E currentMacroIndexRunning  = ");
                Serial.println(currentMacroIndexRunning);
              }
              if (macro_loop_metadata[macroMetadataIndex][2] > macro_loop_metadata[macroMetadataIndex][7]) {
                // Inner loop ended?
                Serial.println("Inner loop ended");
                Serial.print("F currentMacroIndexRunning  = ");
                Serial.println(currentMacroIndexRunning);
                currentMacroIndexRunning = macro_loop_metadata[macroMetadataIndex][6];
                macro_loop_metadata[macroMetadataIndex][2] = macro_loop_metadata[macroMetadataIndex][6];
                macro_loop_metadata[macroMetadataIndex][4]++;
                Serial.print("macro_loop_metadata[macroMetadataIndex][4] = ");
                Serial.println(macro_loop_metadata[macroMetadataIndex][4]);
                Serial.print("G currentMacroIndexRunning  = ");
                Serial.println(currentMacroIndexRunning);
              }
            }
            if (macro_loop_metadata[macroMetadataIndex][3] > 0 && macro_loop_metadata[macroMetadataIndex][4] > macro_loop_metadata[macroMetadataIndex][3]) {
              Serial.println("Broke out from inner loop?");
              Serial.print("H currentMacroIndexRunning  = ");
              Serial.println(currentMacroIndexRunning);
              currentMacroIndexRunning = macro_loop_metadata[macroMetadataIndex][7] + 1;
              Serial.print("I currentMacroIndexRunning  = ");
              Serial.println(currentMacroIndexRunning);
            }
            Serial.print("J currentMacroIndexRunning  = ");
            Serial.println(currentMacroIndexRunning);
          }
          if (macro_loop_metadata[macroMetadataIndex][1] <= 0 || macro_loop_metadata[macroMetadataIndex][3] <= 0) {
            // Ignore this inner loop, it is not valid
            Serial.println("This inner loop metadata is not valid");
            currentMacroIndexRunning++;
          }
        }
        //Serial.print("B AFTER currentMacroIndexRunning = ");
        //Serial.println(currentMacroIndexRunning);
      }
      if (loopMacro > 0) {
        if (currentMacroIndexRunning >= macroInputsToRun) {
          //Serial.print("C BEFORE currentMacroIndexRunning = ");
          //Serial.println(currentMacroIndexRunning);
          currentMacroIndexRunning = 0;
          //Serial.print("D AFTER currentMacroIndexRunning = ");
          //Serial.println(currentMacroIndexRunning);
          /*
            if (timesToLoop <= 0) {
            //
            }
          */
          if (timesToLoop > 0 && loopCounter <= timesToLoop) {
            // Sending this block for redundancy sake, will comment this block if something goes wrong (it shouldn't)
            Serial.print("E BEFORE loopCounter = ");
            Serial.println(loopCounter);
            Serial.write(endingMacroIndex);
            Serial.write(macroInputsToRun);
            Serial.write(loopMacro);
            Serial.write(currentMacroIndexRunning);
            Serial.write(timesToLoop);
            Serial.write(loopCounter);
            Serial.write(howManyInnerLoopsMacroHas);
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
            Serial.write(howManyInnerLoopsMacroHas);
            Serial.write(0x00);
            Serial.write(0x00);
            Serial.write(0x00);
            Serial.write(0x00);
            Serial.write(endingMacroIndex);
            Serial.print("F AFTER loopCounter = ");
            Serial.println(loopCounter);
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
    inputDelay = (uint32_t)current_macro_input[9] << 8 | (uint32_t)current_macro_input[10];
  }
  if (isInputting == true)
  {
    didInputChange = false;
    // Send the controller data back so it can be used to display controller information on the overlay
    for (uint8_t currentByteIndex = 0; currentByteIndex < sizeof(current_macro_input); currentByteIndex++) {
      if (current_macro_input[currentByteIndex] != old_macro_input[currentByteIndex]) {
        didInputChange = true;
      }
      old_macro_input[currentByteIndex] = current_macro_input[currentByteIndex];
    }
    if (didInputChange == true) {
      if (macroInputsToRun > 0) {
        // This block is used to tell the backend where in the macro chain the current macro input is
        Serial.write(endingMacroIndex);
        Serial.write(macroInputsToRun);
        Serial.write(loopMacro);
        Serial.write(currentMacroIndexRunning);
        Serial.write(timesToLoop);
        Serial.write(loopCounter);
        Serial.write(howManyInnerLoopsMacroHas);
        Serial.write(0x00);
        Serial.write(0x00);
        Serial.write(0x00);
        Serial.write(0x00);
        Serial.write(endingMacroIndex);
      }
      for (uint8_t currentByteIndex = 0; currentByteIndex < sizeof(current_macro_input); currentByteIndex++) {
        // Send only data back if it has changed, I don't know how to do this without having two loops
        Serial.write(current_macro_input[currentByteIndex]);
        //Serial.println(current_macro_input[currentByteIndex]);
        //Serial.println("TEST");
      }
      /*
        if (current_macro_input[2] == macro_loop_metadata[currentMacroIndexRunning][2]) {
        //
        //Serial.println("TEST");
        }
      */
    }
    Serial.flush();
    //  Press Button

    //  First 8 buttons, Buffer Array Element 1
    //  Digital L Trigger, Digital R Trigger, Z, Start, Y, X, B, A
    inputStatus[buttonLTrigger] = !(current_macro_input[1] & B00000001);
    inputStatus[buttonRTrigger] = !(current_macro_input[1] & B00000010);
    inputStatus[buttonZ] = !(current_macro_input[1] & B00000100);
    inputStatus[buttonStart] = !(current_macro_input[1] & B00001000);
    inputStatus[buttonY] = !(current_macro_input[1] & B00010000);
    inputStatus[buttonX] = !(current_macro_input[1] & B00100000);
    inputStatus[buttonB] = !(current_macro_input[1] & B01000000);
    inputStatus[buttonA] = !(current_macro_input[1] & B10000000);

    //  Second 8 buttons, Buffer Array Element 2
    //  Analog L Trigger, Analog R Trigger, Macro (Bootleg), Turbo (Bootleg), DUp, DDown, DRight, DLeft
    //  Analog R and L Triggers have to be inverted (invert the logic level)
    inputStatus[axisLTrigger] = (current_macro_input[2] & B00000001);
    inputStatus[axisRTrigger] = (current_macro_input[2] & B00000010);
    inputStatus[buttonMacro] = !(current_macro_input[2] & B00000100);
    inputStatus[buttonTurbo] = !(current_macro_input[2] & B00001000);
    inputStatus[buttonDUp] = !(current_macro_input[2] & B00010000);
    inputStatus[buttonDDown] = !(current_macro_input[2] & B00100000);
    inputStatus[buttonDRight] = !(current_macro_input[2] & B01000000);
    inputStatus[buttonDLeft] = !(current_macro_input[2] & B10000000);

    //  4 Axis, Buffer Array Elements 3, 4, 5, 6
    //  X, Y, CX, CY

    //X STICK
    if (current_macro_input[3] > 127)
    {
      // Push X Stick to Right
      inputStatus[axisXHalf] = HIGH;
      inputStatus[axisXFull] = HIGH;
    }

    if (current_macro_input[3] < 127)
    {
      // Push X Stick to Left
      inputStatus[axisXHalf] = LOW;
      inputStatus[axisXFull] = LOW;
    }

    if (current_macro_input[3] == 127)
    {
      // Keep X Stick Centered
      inputStatus[axisXHalf] = HIGH;
      inputStatus[axisXFull] = LOW;
    }

    //Y STICK
    if (current_macro_input[4] > 127)
    {
      // Push Y Stick to Up
      inputStatus[axisYHalf] = LOW;
      inputStatus[axisYFull] = LOW;
    }

    if (current_macro_input[4] < 127)
    {
      // Push Y Stick to Down
      inputStatus[axisYHalf] = HIGH;
      inputStatus[axisYFull] = HIGH;
    }

    if (current_macro_input[4] == 127)
    {
      // Keep Y Stick Centered
      inputStatus[axisYHalf] = HIGH;
      inputStatus[axisYFull] = LOW;
    }

    //CX STICK
    if (current_macro_input[5] > 127)
    {
      // Push CX Stick to Right
      inputStatus[axisCxHalf] = HIGH;
      inputStatus[axisCxFull] = HIGH;
    }

    if (current_macro_input[5] < 127)
    {
      // Push CX Stick to Left
      inputStatus[axisCxHalf] = LOW;
      inputStatus[axisCxFull] = LOW;
    }

    if (current_macro_input[5] == 127)
    {
      // Keep CX Stick Centered
      inputStatus[axisCxHalf] = HIGH;
      inputStatus[axisCxFull] = LOW;
    }

    //CY STICK
    if (current_macro_input[6] > 127)
    {
      // Push CY Stick to Down
      inputStatus[axisCyHalf] = LOW;
      inputStatus[axisCyFull] = LOW;
    }

    if (current_macro_input[6] < 127)
    {
      // Push CY Stick to Up
      inputStatus[axisCyHalf] = HIGH;
      inputStatus[axisCyFull] = HIGH;
    }

    if (current_macro_input[6] == 127)
    {
      // Keep CY Stick Centered
      inputStatus[axisCyHalf] = HIGH;
      inputStatus[axisCyFull] = LOW;
    }

    //  Mode (Bootleg), Buffer Array Element 7
    //  All other bits in this Buffer Array Element are unused
    inputStatus[buttonMode] = !(current_macro_input[7] & B00000001);

    digitalWrite(latchPin, LOW);
    for (int8_t i = 31; i >= 0; i--)
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
        if (millis() - previousInputDelay >= inputDelay)
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

          current_macro_input[0] = 0x00;
          current_macro_input[1] = 0x00;
          current_macro_input[2] = 0x00;
          current_macro_input[3] = 0x7F;
          current_macro_input[4] = 0x7F;
          current_macro_input[5] = 0x7F;
          current_macro_input[6] = 0x7F;
          current_macro_input[7] = 0x00;
          current_macro_input[8] = 0x00;
          current_macro_input[9] = 0x00;
          current_macro_input[10] = 0x00;
          current_macro_input[11] = 0x00;

          didInputChange = false;

          // Send the controller data back so it can be used to display controller information on the overlay
          for (uint8_t currentByteIndex = 0; currentByteIndex < sizeof(current_macro_input); currentByteIndex++) {
            if (current_macro_input[currentByteIndex] != old_macro_input[currentByteIndex]) {
              didInputChange = true;
            }
            old_macro_input[currentByteIndex] = current_macro_input[currentByteIndex];
          }
          if (didInputChange == true) {
            if (macroInputsToRun > 0) {
              // This block is used to tell the backend where in the macro chain the current macro input is
              Serial.write(endingMacroIndex);
              Serial.write(macroInputsToRun);
              Serial.write(loopMacro);
              Serial.write(currentMacroIndexRunning);
              Serial.write(timesToLoop);
              Serial.write(loopCounter);
              Serial.write(howManyInnerLoopsMacroHas);
              Serial.write(0x00);
              Serial.write(0x00);
              Serial.write(0x00);
              Serial.write(0x00);
              Serial.write(endingMacroIndex);
            }
            for (uint8_t currentByteIndex = 0; currentByteIndex < sizeof(current_macro_input); currentByteIndex++) {
              // Send only data back if it has changed, I don't know how to do this without having two loops
              Serial.write(current_macro_input[currentByteIndex]);
              //Serial.println(current_macro_input[currentByteIndex]);
            }
          }
          Serial.flush();
          //  First 8 buttons, Buffer Array Element 1
          //  Digital L Trigger, Digital R Trigger, Z, Start, Y, X, B, A
          inputStatus[buttonLTrigger] = !(current_macro_input[1] & B00000001);
          inputStatus[buttonRTrigger] = !(current_macro_input[1] & B00000010);
          inputStatus[buttonZ] = !(current_macro_input[1] & B00000100);
          inputStatus[buttonStart] = !(current_macro_input[1] & B00001000);
          inputStatus[buttonY] = !(current_macro_input[1] & B00010000);
          inputStatus[buttonX] = !(current_macro_input[1] & B00100000);
          inputStatus[buttonB] = !(current_macro_input[1] & B01000000);
          inputStatus[buttonA] = !(current_macro_input[1] & B10000000);

          //  Second 8 buttons, Buffer Array Element 2
          //  Analog L Trigger, Analog R Trigger, Macro (Bootleg), Turbo (Bootleg), DUp, DDown, DRight, DLeft
          //  Analog R and L Triggers have to be inverted (invert the logic level)
          inputStatus[axisLTrigger] = (current_macro_input[2] & B00000001);
          inputStatus[axisRTrigger] = (current_macro_input[2] & B00000010);
          inputStatus[buttonMacro] = !(current_macro_input[2] & B00000100);
          inputStatus[buttonTurbo] = !(current_macro_input[2] & B00001000);
          inputStatus[buttonDUp] = !(current_macro_input[2] & B00010000);
          inputStatus[buttonDDown] = !(current_macro_input[2] & B00100000);
          inputStatus[buttonDRight] = !(current_macro_input[2] & B01000000);
          inputStatus[buttonDLeft] = !(current_macro_input[2] & B10000000);

          //  4 Axis, Buffer Array Elements 3, 4, 5, 6
          //  X, Y, CX, CY

          //X STICK
          if (current_macro_input[3] > 127)
          {
            // Push X Stick to Right
            inputStatus[axisXHalf] = HIGH;
            inputStatus[axisXFull] = HIGH;
          }

          if (current_macro_input[3] < 127)
          {
            // Push X Stick to Left
            inputStatus[axisXHalf] = LOW;
            inputStatus[axisXFull] = LOW;
          }

          if (current_macro_input[3] == 127)
          {
            // Keep X Stick Centered
            inputStatus[axisXHalf] = HIGH;
            inputStatus[axisXFull] = LOW;
          }

          //Y STICK
          if (current_macro_input[4] > 127)
          {
            // Push Y Stick to Up
            inputStatus[axisYHalf] = LOW;
            inputStatus[axisYFull] = LOW;
          }

          if (current_macro_input[4] < 127)
          {
            // Push Y Stick to Down
            inputStatus[axisYHalf] = HIGH;
            inputStatus[axisYFull] = HIGH;
          }

          if (current_macro_input[4] == 127)
          {
            // Keep Y Stick Centered
            inputStatus[axisYHalf] = HIGH;
            inputStatus[axisYFull] = LOW;
          }

          //CX STICK
          if (current_macro_input[5] > 127)
          {
            // Push CX Stick to Right
            inputStatus[axisCxHalf] = HIGH;
            inputStatus[axisCxFull] = HIGH;
          }

          if (current_macro_input[5] < 127)
          {
            // Push CX Stick to Left
            inputStatus[axisCxHalf] = LOW;
            inputStatus[axisCxFull] = LOW;
          }

          if (current_macro_input[5] == 127)
          {
            // Keep CX Stick Centered
            inputStatus[axisCxHalf] = HIGH;
            inputStatus[axisCxFull] = LOW;
          }

          //CY STICK
          if (current_macro_input[6] > 127)
          {
            // Push CY Stick to Down
            inputStatus[axisCyHalf] = LOW;
            inputStatus[axisCyFull] = LOW;
          }

          if (current_macro_input[6] < 127)
          {
            // Push CY Stick to Up
            inputStatus[axisCyHalf] = HIGH;
            inputStatus[axisCyFull] = HIGH;
          }

          if (current_macro_input[6] == 127)
          {
            // Keep CY Stick Centered
            inputStatus[axisCyHalf] = HIGH;
            inputStatus[axisCyFull] = LOW;
          }

          //  Mode (Bootleg), Buffer Array Element 7
          //  All other bits in this Buffer Array Element are unused
          inputStatus[buttonMode] = !(current_macro_input[7] & B00000001);
          // Sometimes buttons are considered as released by the console between inputs, the pieces of code below will hopefully make it so buttons are only released at the end of the final iteration of a loopable macro, or released at the final input of a non-loopable macro, or released at the end of a basic input
          if (loopMacro <= 0) {
            //Serial.println("TEST A");
            if (currentMacroIndexRunning == macroInputsToRun) {
              //Serial.println("TEST B");
              // Reset all variables related to macro to stop the arduino from running useless code
              macroIndex = 0;
              macroInputsToRun = 0;
              loopMacro = 0;
              currentMacroIndexRunning = 0;
              timesToLoop = 0;
              loopCounter = 0;
              howManyInnerLoopsMacroHas = 0;
              digitalWrite(latchPin, LOW);
              for (int8_t i = 31; i >= 0; i--)
              {
                digitalWrite(clockPin, LOW);
                digitalWrite(dataPin, inputStatus[i]);
                digitalWrite(clockPin, HIGH);
              }
              digitalWrite(latchPin, HIGH);
            }
          }
          if (loopMacro > 0) {
            //Serial.println("TEST C");
            if (loopCounter > timesToLoop) {
              //Serial.println("TEST D");
              // Reset all variables related to macro to stop the arduino from running useless code
              macroIndex = 0;
              macroInputsToRun = 0;
              loopMacro = 0;
              currentMacroIndexRunning = 0;
              timesToLoop = 0;
              loopCounter = 0;
              howManyInnerLoopsMacroHas = 0;
              digitalWrite(latchPin, LOW);
              for (int8_t i = 31; i >= 0; i--)
              {
                digitalWrite(clockPin, LOW);
                digitalWrite(dataPin, inputStatus[i]);
                digitalWrite(clockPin, HIGH);
              }
              digitalWrite(latchPin, HIGH);
            }
          }

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
