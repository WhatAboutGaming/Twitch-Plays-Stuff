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

#define bootLed 13

#define latchPin 2  // HCF4094/74HC595 Latch/Strobe Input
#define dataPin 3   // HCF4094/74HC595 Data Input
#define clockPin 4  // HCF4094/74HC595 Clock Input

#define buttonB 0       // Left 3
#define buttonY 1       // Left 4
#define buttonSelect 2  // Left 5
#define buttonStart 3   // Left 6

#define buttonUp 4     // Left 7
#define buttonDown 5   // Left 8
#define buttonLeft A0  // Left 9
#define buttonRight 7  // Left 10

#define buttonA 8  // Left 11
#define buttonX 9  // Left 12

#define buttonLHalf 10  // Left 13
#define buttonLFull 11  // Left 13
#define buttonRHalf 12  // Left 14
#define buttonRFull 13  // Left 14

const uint16_t startingMacroIndex = 0x04;
const uint16_t endingMacroIndex = 0x44;
const uint16_t macroBufferSize = endingMacroIndex - startingMacroIndex;
const uint16_t startingMacroMetadataIndex = endingMacroIndex + 1;
const uint16_t endingMacroMetadataIndex = startingMacroMetadataIndex + macroBufferSize;
const uint16_t macroMetadataSize = endingMacroMetadataIndex - startingMacroMetadataIndex;  // Using define on these variables for some reason was making it return wrong values

uint16_t macroIndex = 0;
uint16_t currentMacroIndexRunning = 0;
uint16_t macroInputsToRun = 0;
uint16_t loopMacro = 0;    //0 = Don't loop, 1 = loop
uint16_t timesToLoop = 0;  //0 = Loop indefinitely, >0 = loop n times
uint16_t loopCounter = 0;
uint16_t howManyInnerLoopsMacroHas = 0;  //This variable is used to tell if the macro has inner loops (eg: a+b,[wait b]255) and how many there are // 0 = There are NO inner loops !0 = There are n inner loops, where n is this variable
uint16_t macroMetadataIndex = 0;
uint16_t isInnerLoop = 0;

const bool defaultStatus[] = { LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW };
bool inputStatus[] = { LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW, LOW };
uint16_t commandArray[] = { buttonB, buttonY, buttonSelect, buttonStart, buttonUp, buttonDown, buttonLeft, buttonRight, buttonA, buttonX, buttonLHalf, buttonLFull, buttonRHalf, buttonRFull, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31 };

bool isInputting = false;
bool isInputtingDelayed = false;

bool didInputChange = false;

uint32_t inputDelay = 0UL;
uint32_t previousInputDelay = 0UL;

uint32_t baudRate = 500000UL;

uint8_t serial_rx_buffer[12];
uint8_t current_macro_input[12];
uint8_t old_macro_input[12];
uint8_t macro_buffer[macroBufferSize][12];
uint8_t inner_loop_metadata[macroMetadataSize][12];  // Contains informations such as how many times to repeat a portion of a macro, and where to start and end
uint32_t controller = 0UL;

void setup() {
  pinMode(bootLed, OUTPUT);
  digitalWrite(bootLed, HIGH);
  Serial.begin(baudRate);

  pinMode(latchPin, OUTPUT);
  pinMode(dataPin, OUTPUT);
  pinMode(clockPin, OUTPUT);
  pinMode(buttonLeft, OUTPUT);

  digitalWrite(latchPin, LOW);
  for (int8_t i = 31; i >= 0; i--) {
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
  digitalWrite(bootLed, LOW);
}

void loop() {
  if (Serial.available() > 0) {
    controller = Serial.readBytes(serial_rx_buffer, sizeof(serial_rx_buffer)) && 0xFF;
    //  Set Start Byte (Preamble Byte) and End Byte (Postamble Byte)
    //  1 == 0x01
    if ((serial_rx_buffer[0] == 0x01) && (serial_rx_buffer[11] == 0x01)) {
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
      macroMetadataIndex = 0;
      isInnerLoop = 0;
      isInputting = true;
      isInputtingDelayed = false;
      previousInputDelay = millis();
    }
    if ((serial_rx_buffer[0] >= startingMacroIndex) && (serial_rx_buffer[11] >= startingMacroIndex)) {
      if ((serial_rx_buffer[0] < endingMacroIndex) && (serial_rx_buffer[11] < endingMacroIndex)) {
        if (serial_rx_buffer[0] == serial_rx_buffer[11]) {
          // Stop the current loop when we receive a new macro
          macroIndex = 0;
          currentMacroIndexRunning = 0;
          macroInputsToRun = 0;
          loopMacro = 0;
          timesToLoop = 0;
          loopCounter = 0;
          howManyInnerLoopsMacroHas = 0;
          macroMetadataIndex = 0;
          isInnerLoop = 0;
          //isInputting = false;
          isInputtingDelayed = false;
          macroIndex = serial_rx_buffer[0] - startingMacroIndex;
          for (uint8_t macroInputIndex = 0; macroInputIndex < sizeof(serial_rx_buffer); macroInputIndex++) {
            macro_buffer[macroIndex][macroInputIndex] = serial_rx_buffer[macroInputIndex];
          }
        }
      }
    }
    if ((serial_rx_buffer[0] == endingMacroIndex) && (serial_rx_buffer[11] == endingMacroIndex)) {
      // Stop the current loop when we receive a new macro setter (The thing that tells how a macro should be executed, if it should loop, how many inputs it has to iterate through)
      macroIndex = 0;
      currentMacroIndexRunning = 0;
      macroInputsToRun = 0;
      loopMacro = 0;
      timesToLoop = 0;
      loopCounter = 0;
      howManyInnerLoopsMacroHas = 0;
      macroMetadataIndex = 0;
      isInnerLoop = 0;
      isInputtingDelayed = false;
      isInputting = false;
      macroInputsToRun = serial_rx_buffer[1];
      loopMacro = serial_rx_buffer[2];
      currentMacroIndexRunning = serial_rx_buffer[3];
      timesToLoop = serial_rx_buffer[4];  // Times to repeat, if <=0, it'll not repeat, if >0, it'll repeat n times, so in this case, gramatically speaking, timesToLoop and times to repeat are different things (does this make sense?), so the max amount of times it can loop is 256, the amount of times it can repeat is 255, the first iteration is not a repetition (Repeat input? Repeated input?) (Again, does this makes sense?)
      loopCounter = serial_rx_buffer[5];
      howManyInnerLoopsMacroHas = serial_rx_buffer[6];  // >0 if there are, <=0 if there aren't
      macroMetadataIndex = serial_rx_buffer[7];
      isInnerLoop = serial_rx_buffer[8];
      if (howManyInnerLoopsMacroHas > 0) {
        macroMetadataIndex = 0;
        // Check if the first inner loop metadata is valid, if it is, use that, if not, disregard and don't do anything (how many inputs that shout be executed, and how many times the inner block should be repeated)
        if (inner_loop_metadata[0][1] > 0 && inner_loop_metadata[0][3] > 0) {
          if (inner_loop_metadata[0][6] < inner_loop_metadata[0][7]) {
            // Accept inner loop metadata if first inner loop metadata is valid
            macroMetadataIndex = 0;
            for (uint8_t macroMetadataIndexInner = 0; macroMetadataIndexInner < howManyInnerLoopsMacroHas; macroMetadataIndexInner++) {
              inner_loop_metadata[macroMetadataIndexInner][2] = 0;  // Reset current input index for inner loop
              inner_loop_metadata[macroMetadataIndexInner][4] = 0;  // Reset current repeat counter for inner loop
            }
          }
        }
        if (inner_loop_metadata[0][6] >= inner_loop_metadata[0][7]) {
          // Clear all inner loop metadata if first inner loop metadata is invalid
          macroMetadataIndex = 0;
          howManyInnerLoopsMacroHas = 0;
          for (uint8_t macroMetadataIndexInner = 0; macroMetadataIndexInner < macroMetadataSize; macroMetadataIndexInner++) {
            for (uint8_t innerLoopMetadataIndex = 0; innerLoopMetadataIndex < sizeof(inner_loop_metadata[0]); innerLoopMetadataIndex++) {
              inner_loop_metadata[macroMetadataIndexInner][innerLoopMetadataIndex] = 0;
            }
          }
          isInnerLoop = 0;
        }
        if (inner_loop_metadata[0][1] <= 0 || inner_loop_metadata[0][3] <= 0) {
          // Clear all inner loop metadata if first inner loop metadata is invalid
          macroMetadataIndex = 0;
          howManyInnerLoopsMacroHas = 0;
          for (uint8_t macroMetadataIndexInner = 0; macroMetadataIndexInner < macroMetadataSize; macroMetadataIndexInner++) {
            for (uint8_t innerLoopMetadataIndex = 0; innerLoopMetadataIndex < sizeof(inner_loop_metadata[0]); innerLoopMetadataIndex++) {
              inner_loop_metadata[macroMetadataIndexInner][innerLoopMetadataIndex] = 0;
            }
          }
          isInnerLoop = 0;
        }
        if (howManyInnerLoopsMacroHas > 0) {
          // If we entered this block, that means we still have to test the other inner loops
          uint16_t howManyInnerLoopsMacroHasInternalTesting = 0;
          bool countValidInnerLoops = true;
          //uint16_t whereDoesTheNextInnerLoopStart = 0; // Not used yet (should definitely be used (Now that I think about it, it's completely optional) )
          uint16_t whereDoesTheCurrentInnerLoopStart = 0;  // Used
          //uint16_t whereDoesTheCurrentInnerLoopEnd = 0; // Not used yet (can be used, but not really necessary?)
          uint16_t howManyInnerLoopsShouldBeExecutedAfterTheCurrentInnerLoop = 0;  // Used (should definitely be used (Now that I think about it, it's completely optional) )

          uint16_t whereDoesTheNextPreviousInnerLoopStart = 0;  // Used (should definitely be used (Now that I think about it, it's completely optional) ) // Confusing name is confusing
          //uint16_t whereDoesThePreviousInnerLoopStart = 0; // Not used yet (can be used, but not really necessary?)
          uint16_t whereDoesThePreviousInnerLoopEnd = 0;  // Used
          //uint16_t howManyInnerLoopsShouldBeExecutedAfterThePreviousInnerLoop = 0; // Not used yet (should definitely be used (Now that I think about it, it's completely optional) )
          for (uint8_t macroMetadataIndexInner = 0; macroMetadataIndexInner < howManyInnerLoopsMacroHas; macroMetadataIndexInner++) {
            if (inner_loop_metadata[macroMetadataIndexInner][1] > 0 && inner_loop_metadata[macroMetadataIndexInner][3] > 0) {
              if (inner_loop_metadata[macroMetadataIndexInner][6] < inner_loop_metadata[macroMetadataIndexInner][7]) {
                // Valid
                //whereDoesTheNextInnerLoopStart = inner_loop_metadata[macroMetadataIndexInner][5];
                whereDoesTheCurrentInnerLoopStart = inner_loop_metadata[macroMetadataIndexInner][6];
                //whereDoesTheCurrentInnerLoopEnd = inner_loop_metadata[macroMetadataIndexInner][7];
                howManyInnerLoopsShouldBeExecutedAfterTheCurrentInnerLoop = inner_loop_metadata[macroMetadataIndexInner][8];
                if (countValidInnerLoops == true) {
                  if (macroMetadataIndexInner <= 0) {
                    if (whereDoesThePreviousInnerLoopEnd <= 0) {
                      if (howManyInnerLoopsShouldBeExecutedAfterTheCurrentInnerLoop > 0) {
                        // Very simple logic, less maths to apply and will likely work fine, if there are more than 0 inner loops left, then we count the inner loop
                        howManyInnerLoopsMacroHasInternalTesting++;  // Increment the counter but don't end yet
                      }
                      if (howManyInnerLoopsShouldBeExecutedAfterTheCurrentInnerLoop <= 0) {
                        // Very simple logic, less maths to apply and will likely work fine, if there are 0 or less than 0 inner loops left, then end here
                        howManyInnerLoopsMacroHasInternalTesting++;  // But this one has to count too
                        countValidInnerLoops = false;                // Then stop counting right after
                      }
                      // It's safe to ignore this
                      //howManyInnerLoopsMacroHasInternalTesting++;  // Do not increment this counter here?
                      /*
                      if (whereDoesTheNextPreviousInnerLoopStart == whereDoesTheCurrentInnerLoopStart) {
                        // This is correct, but should also be ignored
                        countValidInnerLoops = false;
                      }
                      */
                      /*
                      if (whereDoesTheNextPreviousInnerLoopStart != whereDoesTheCurrentInnerLoopStart) {
                        // This should be ignored tho
                        howManyInnerLoopsMacroHasInternalTesting++;
                      }
                      */
                    }
                    if (whereDoesThePreviousInnerLoopEnd > 0) {
                      // This is definitely invalid (should never happen, and will probably never happen)
                      countValidInnerLoops = false;
                    }
                    // Something happens here but only if it's the first inner loop metadata
                  }
                  if (macroMetadataIndexInner > 0) {
                    if (whereDoesThePreviousInnerLoopEnd <= 0) {
                      // This is definitely invalid (or it ends here (?) )
                      countValidInnerLoops = false;
                    }
                    if (whereDoesThePreviousInnerLoopEnd > 0) {
                      // Might be valid (?)
                      if (whereDoesThePreviousInnerLoopEnd <= whereDoesTheCurrentInnerLoopStart) {
                        if (whereDoesTheNextPreviousInnerLoopStart == whereDoesTheCurrentInnerLoopStart) {
                          if (howManyInnerLoopsShouldBeExecutedAfterTheCurrentInnerLoop > 0) {
                            // Very simple logic, less maths to apply and will likely work fine, if there are more than 0 inner loops left, then we count the inner loop
                            howManyInnerLoopsMacroHasInternalTesting++;  // Increment the counter but don't end yet
                          }
                          if (howManyInnerLoopsShouldBeExecutedAfterTheCurrentInnerLoop <= 0) {
                            // Very simple logic, less maths to apply and will likely work fine, if there are 0 or less than 0 inner loops left, then end here
                            howManyInnerLoopsMacroHasInternalTesting++;  // But this one has to count too
                            countValidInnerLoops = false;                // Then stop counting right after
                          }
                        }
                        if (whereDoesTheNextPreviousInnerLoopStart != whereDoesTheCurrentInnerLoopStart) {
                          countValidInnerLoops = false;
                        }
                      }
                      if (whereDoesThePreviousInnerLoopEnd > whereDoesTheCurrentInnerLoopStart) {
                        countValidInnerLoops = false;
                      }
                    }
                    // Something else happens here
                  }
                }
                whereDoesTheNextPreviousInnerLoopStart = inner_loop_metadata[macroMetadataIndexInner][5];
                //whereDoesThePreviousInnerLoopStart = inner_loop_metadata[macroMetadataIndexInner][6];
                whereDoesThePreviousInnerLoopEnd = inner_loop_metadata[macroMetadataIndexInner][7];
                //howManyInnerLoopsShouldBeExecutedAfterThePreviousInnerLoop = inner_loop_metadata[macroMetadataIndexInner][8];
              }
              if (inner_loop_metadata[macroMetadataIndexInner][6] >= inner_loop_metadata[macroMetadataIndexInner][7]) {
                // Invalid
                countValidInnerLoops = false;
              }
            }
            if (inner_loop_metadata[macroMetadataIndexInner][1] <= 0 && inner_loop_metadata[macroMetadataIndexInner][3] <= 0) {
              if (inner_loop_metadata[macroMetadataIndexInner][6] < inner_loop_metadata[macroMetadataIndexInner][7]) {
                // Invalid
                countValidInnerLoops = false;
              }
              if (inner_loop_metadata[macroMetadataIndexInner][6] >= inner_loop_metadata[macroMetadataIndexInner][7]) {
                // Invalid
                countValidInnerLoops = false;
              }
            }
            //inner_loop_metadata[macroMetadataIndexInner][2] = 0;  // Reset current input index for inner loop
            //inner_loop_metadata[macroMetadataIndexInner][4] = 0;  // Reset current repeat counter for inner loop
          }
          howManyInnerLoopsMacroHas = howManyInnerLoopsMacroHasInternalTesting;
        }
        if (howManyInnerLoopsMacroHas <= 0) {
          // No further testing needed
          isInnerLoop = 0;
        }
      }
      if (howManyInnerLoopsMacroHas <= 0) {
        isInnerLoop = 0;
      }
    }
    if ((serial_rx_buffer[0] >= startingMacroMetadataIndex) && (serial_rx_buffer[11] >= startingMacroMetadataIndex)) {
      if ((serial_rx_buffer[0] < endingMacroMetadataIndex) && (serial_rx_buffer[11] < endingMacroMetadataIndex)) {
        if (serial_rx_buffer[0] == serial_rx_buffer[11]) {
          // Stop the current loop when we receive a new macro inner loop metadata
          macroIndex = 0;
          currentMacroIndexRunning = 0;
          macroInputsToRun = 0;
          loopMacro = 0;
          timesToLoop = 0;
          loopCounter = 0;
          howManyInnerLoopsMacroHas = 0;
          macroMetadataIndex = 0;
          isInnerLoop = 0;
          //isInputting = false;
          isInputtingDelayed = false;
          macroMetadataIndex = serial_rx_buffer[0] - startingMacroMetadataIndex;
          /*
            inner_loop_metadata[macroMetadataIndex][0] = 0; // Preamble
            inner_loop_metadata[macroMetadataIndex][1] = 0; // Inputs to execute (number of inputs that should be executed in this inner loop)
            inner_loop_metadata[macroMetadataIndex][2] = 0; // Current input index
            inner_loop_metadata[macroMetadataIndex][3] = 0; // Times to repeat (number of times this inner loop should be executed, before going to the next inner loop, if any)
            inner_loop_metadata[macroMetadataIndex][4] = 0; // Repeat counter (number of times this inner loop was executed)
            inner_loop_metadata[macroMetadataIndex][5] = 0; // Where is the next inner loop's first input (index 0 input for the next inner loop, aka the index for the input in the macro_buffer array) (Continue normally if value is 0, or do nothing if there are no more inputs to be executed) // Current unused, apply logic to this // Is this really needed? (maybe as a failsafe?) (I will not use this variable for anything because I'm scared it'll break things during an actual run)
            inner_loop_metadata[macroMetadataIndex][6] = 0; // Where to start (index of the starting input) (Inclusive)
            inner_loop_metadata[macroMetadataIndex][7] = 0; // Where to end (index of the ending input) (Inclusive)
            inner_loop_metadata[macroMetadataIndex][8] = 0; // How many inner loops that should be executed after this (if <=0, don't execute inner loops any inner loops after this, and move on as normal, if there are normal inputs to be exeucuted, execute those, if there's nothing else to do, go back to the beginning of the larger loop, if > 0, execute n inner loops after this) // Currently unused, apply logic to this // Is this really needed? (maybe as a failsafe?) (I will not use this variable for anything because I'm scared it'll break things during an actual run)
            inner_loop_metadata[macroMetadataIndex][9] = 0; // Unused?
            inner_loop_metadata[macroMetadataIndex][10] = 0; // Unused?
            inner_loop_metadata[macroMetadataIndex][11] = 0; // Postamble
          */
          for (uint8_t macroInputMetadataIndex = 0; macroInputMetadataIndex < sizeof(serial_rx_buffer); macroInputMetadataIndex++) {
            inner_loop_metadata[macroMetadataIndex][macroInputMetadataIndex] = serial_rx_buffer[macroInputMetadataIndex];
          }
        }
      }
    }
  }
  runMacro();
  pressButtons();
}  // Close Loop Function

void runMacro() {
  if (isInputting == false) {
    if (macroInputsToRun > 0) {
      if (macroInputsToRun > currentMacroIndexRunning) {
        if (loopCounter <= timesToLoop) {
          for (uint8_t currentInputIndex = 0; currentInputIndex < sizeof(serial_rx_buffer); currentInputIndex++) {
            current_macro_input[currentInputIndex] = macro_buffer[currentMacroIndexRunning][currentInputIndex];
          }
          // Make the button presses actually work
          isInputting = true;
          previousInputDelay = millis();
        }
      }
      if (currentMacroIndexRunning < macroInputsToRun) {
        if (howManyInnerLoopsMacroHas <= 0) {
          isInnerLoop = 0;
          currentMacroIndexRunning++;
        }
        if (howManyInnerLoopsMacroHas > 0 && howManyInnerLoopsMacroHas <= macroMetadataIndex) {
          isInnerLoop = 0;
          currentMacroIndexRunning++;
        }
        if (howManyInnerLoopsMacroHas > 0 && howManyInnerLoopsMacroHas > macroMetadataIndex) {
          for (uint8_t innerLoopMetadataIndex = 0; innerLoopMetadataIndex < sizeof(inner_loop_metadata[macroMetadataIndex]); innerLoopMetadataIndex++) {
            Serial.write(inner_loop_metadata[macroMetadataIndex][innerLoopMetadataIndex]);
          }
          bool incrementCurrentMacroIndexRunningAgain = true;
          if (currentMacroIndexRunning < inner_loop_metadata[macroMetadataIndex][6] || currentMacroIndexRunning > inner_loop_metadata[macroMetadataIndex][7]) {
            isInnerLoop = 0;
            // Increment normally until it enters an inner loop
            if (incrementCurrentMacroIndexRunningAgain == true) {
              currentMacroIndexRunning++;
              inner_loop_metadata[macroMetadataIndex][2] = currentMacroIndexRunning;
              incrementCurrentMacroIndexRunningAgain = false;
            }
            if (currentMacroIndexRunning == inner_loop_metadata[macroMetadataIndex][6] && currentMacroIndexRunning <= inner_loop_metadata[macroMetadataIndex][7]) {
              isInnerLoop = 1;
            }
          }
          if (currentMacroIndexRunning >= inner_loop_metadata[macroMetadataIndex][6] && currentMacroIndexRunning <= inner_loop_metadata[macroMetadataIndex][7]) {
            if (currentMacroIndexRunning >= inner_loop_metadata[macroMetadataIndex][7]) {
              isInnerLoop = 1;
              if (incrementCurrentMacroIndexRunningAgain == true) {
                //currentMacroIndexRunning = inner_loop_metadata[macroMetadataIndex][6]; // Return to the beginning of the inner loop
                //incrementCurrentMacroIndexRunningAgain = false;
                if (inner_loop_metadata[macroMetadataIndex][4] < inner_loop_metadata[macroMetadataIndex][3]) {
                  inner_loop_metadata[macroMetadataIndex][4]++;
                }
                if (inner_loop_metadata[macroMetadataIndex][4] < inner_loop_metadata[macroMetadataIndex][3]) {
                  currentMacroIndexRunning = inner_loop_metadata[macroMetadataIndex][6];  // Return to the beginning of the inner loop
                  inner_loop_metadata[macroMetadataIndex][2] = currentMacroIndexRunning;
                  incrementCurrentMacroIndexRunningAgain = false;
                }
                if (inner_loop_metadata[macroMetadataIndex][4] >= inner_loop_metadata[macroMetadataIndex][3]) {
                  inner_loop_metadata[macroMetadataIndex][4] = 0;
                  macroMetadataIndex++;
                }
              }
            }
            isInnerLoop = 1;
            if (incrementCurrentMacroIndexRunningAgain == true) {
              currentMacroIndexRunning++;
              inner_loop_metadata[macroMetadataIndex][2] = currentMacroIndexRunning;
              incrementCurrentMacroIndexRunningAgain = false;
            }
          }
          //currentMacroIndexRunning++;
          for (uint8_t innerLoopMetadataIndex = 0; innerLoopMetadataIndex < sizeof(inner_loop_metadata[macroMetadataIndex]); innerLoopMetadataIndex++) {
            Serial.write(inner_loop_metadata[macroMetadataIndex][innerLoopMetadataIndex]);
          }
        }
        if (howManyInnerLoopsMacroHas > 0 && howManyInnerLoopsMacroHas <= macroMetadataIndex) {
          //isInnerLoop = 0;
          //currentMacroIndexRunning++;
        }
      }
      if (loopMacro > 0) {
        if (currentMacroIndexRunning >= macroInputsToRun) {
          currentMacroIndexRunning = 0;
          if (howManyInnerLoopsMacroHas <= 0) {
            //macroMetadataIndex = 0;
          }
          if (howManyInnerLoopsMacroHas > 0) {
            macroMetadataIndex = 0;
          }
          if (timesToLoop > 0 && loopCounter <= timesToLoop) {
            // Sending this block for redundancy sake, will comment this block if something goes wrong (it shouldn't)
            Serial.write(endingMacroIndex);
            Serial.write(macroInputsToRun);
            Serial.write(loopMacro);
            Serial.write(currentMacroIndexRunning);
            Serial.write(timesToLoop);
            Serial.write(loopCounter);
            Serial.write(howManyInnerLoopsMacroHas);
            Serial.write(macroMetadataIndex);
            Serial.write(isInnerLoop);
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
            Serial.write(macroMetadataIndex);
            Serial.write(isInnerLoop);
            Serial.write(0x00);
            Serial.write(0x00);
            Serial.write(endingMacroIndex);
          }
        }
      }
    }
  }
}

void pressButtons() {
  if (isInputtingDelayed == false) {
    //  Define input delay (If Buffer Array Element 9 and 10 !=0)
    inputDelay = (uint32_t)current_macro_input[9] << 8 | (uint32_t)current_macro_input[10];
  }
  if (isInputting == true) {
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
        Serial.write(macroMetadataIndex);
        Serial.write(isInnerLoop);
        Serial.write(0x00);
        Serial.write(0x00);
        Serial.write(endingMacroIndex);
      }
      for (uint8_t currentByteIndex = 0; currentByteIndex < sizeof(current_macro_input); currentByteIndex++) {
        // Send only data back if it has changed, I don't know how to do this without having two loops
        Serial.write(current_macro_input[currentByteIndex]);
      }
    }
    Serial.flush();
    //  Press Button

    //  First 8 buttons, Buffer Array Element 1
    //  B, Y, SELECT, START, UP, DOWN, LEFT, RIGHT
    inputStatus[4] = (current_macro_input[1] & B00000001);   // B
    inputStatus[5] = (current_macro_input[1] & B00000010);   // Y
    inputStatus[6] = (current_macro_input[1] & B00000100);   // Select
    inputStatus[7] = (current_macro_input[1] & B00001000);   // Start
    inputStatus[8] = (current_macro_input[1] & B00010000);   // Up
    inputStatus[10] = (current_macro_input[1] & B00100000);  // Down
    inputStatus[1] = (current_macro_input[1] & B01000000);   // Left
    inputStatus[0] = (current_macro_input[1] & B10000000);   // Right

    //  Second 4 buttons, Buffer Array Element 2
    //  A, X, L, R, N/A, N/A, N/A, N/A
    inputStatus[24] = (current_macro_input[2] & B00000001);  // A
    inputStatus[3] = (current_macro_input[2] & B00000010);   // X

    // Because the L and R buttons are connected to a board where
    // it outputs pseudo-analog levels, we have to set 2 bits low
    // or high to be able to actually press the buttons
    inputStatus[20] = (current_macro_input[2] & B00000100);  // L
    inputStatus[21] = (current_macro_input[2] & B00000100);  // L
    inputStatus[22] = (current_macro_input[2] & B00001000);  // R
    inputStatus[23] = (current_macro_input[2] & B00001000);  // R

    digitalWrite(latchPin, LOW);
    for (int8_t i = 31; i >= 0; i--) {
      digitalWrite(clockPin, LOW);
      digitalWrite(dataPin, !inputStatus[i]);
      digitalWrite(buttonLeft, !inputStatus[1]);  // This is the Left Dpad button, which isn't on the shift registers, it's on the output A0
      digitalWrite(clockPin, HIGH);
    }
    digitalWrite(latchPin, HIGH);

    //  Buffer Array Element 8 is unused in this code, but is existing in case changes are needed

    //  Buffer Array Elements 9 and 10 are used to tell the Arduino how long commands are executed, on a delay ranging from 1-65535ms
    if (inputDelay != 0) {
      isInputtingDelayed = true;
      //  The block below executes Soft Delay for holding the buttons down
      if (isInputtingDelayed == true) {
        if (millis() - previousInputDelay >= inputDelay) {
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
              Serial.write(macroMetadataIndex);
              Serial.write(isInnerLoop);
              Serial.write(0x00);
              Serial.write(0x00);
              Serial.write(endingMacroIndex);
            }
            if (loopMacro <= 0) {
              if (currentMacroIndexRunning == macroInputsToRun) {
                for (uint8_t currentByteIndex = 0; currentByteIndex < sizeof(current_macro_input); currentByteIndex++) {
                  // Send only data back if it has changed, I don't know how to do this without having two loops
                  Serial.write(current_macro_input[currentByteIndex]);
                }
              }
            }
            if (loopMacro > 0) {
              if (loopCounter > timesToLoop) {
                for (uint8_t currentByteIndex = 0; currentByteIndex < sizeof(current_macro_input); currentByteIndex++) {
                  // Send only data back if it has changed, I don't know how to do this without having two loops
                  Serial.write(current_macro_input[currentByteIndex]);
                }
              }
            }
          }
          Serial.flush();
          //  First 8 buttons, Buffer Array Element 1
          //  B, Y, SELECT, START, UP, DOWN, LEFT, RIGHT
          inputStatus[4] = (current_macro_input[1] & B00000001);   // B
          inputStatus[5] = (current_macro_input[1] & B00000010);   // Y
          inputStatus[6] = (current_macro_input[1] & B00000100);   // Select
          inputStatus[7] = (current_macro_input[1] & B00001000);   // Start
          inputStatus[8] = (current_macro_input[1] & B00010000);   // Up
          inputStatus[10] = (current_macro_input[1] & B00100000);  // Down
          inputStatus[1] = (current_macro_input[1] & B01000000);   // Left
          inputStatus[0] = (current_macro_input[1] & B10000000);   // Right

          //  Second 8 buttons, Buffer Array Element 2
          //  A, X, L, R, N/A, N/A, N/A, N/A
          inputStatus[24] = (current_macro_input[2] & B00000001);  // A
          inputStatus[3] = (current_macro_input[2] & B00000010);   // X

          // Because the L and R buttons are connected to a board where
          // it outputs pseudo-analog levels, we have to set 2 bits low
          // or high to be able to actually press the
          inputStatus[20] = (current_macro_input[2] & B00000100);  // L
          inputStatus[21] = (current_macro_input[2] & B00000100);  // L
          inputStatus[22] = (current_macro_input[2] & B00001000);  // R
          inputStatus[23] = (current_macro_input[2] & B00001000);  // R
          // Sometimes buttons are considered as released by the console between inputs, the pieces of code below will hopefully make it so buttons are only released at the end of the final iteration of a loopable macro, or released at the final input of a non-loopable macro, or released at the end of a basic input
          if (loopMacro <= 0) {
            if (currentMacroIndexRunning == macroInputsToRun) {
              // Reset all variables related to macro to stop the arduino from running useless code
              macroIndex = 0;
              macroInputsToRun = 0;
              loopMacro = 0;
              currentMacroIndexRunning = 0;
              timesToLoop = 0;
              loopCounter = 0;
              howManyInnerLoopsMacroHas = 0;
              macroMetadataIndex = 0;
              isInnerLoop = 0;
              digitalWrite(latchPin, LOW);
              for (int8_t i = 31; i >= 0; i--) {
                digitalWrite(clockPin, LOW);
                digitalWrite(dataPin, !inputStatus[i]);
                digitalWrite(buttonLeft, !inputStatus[1]);  // This is the Left Dpad button, which isn't on the shift registers, it's on the output A0
                digitalWrite(clockPin, HIGH);
              }
              digitalWrite(latchPin, HIGH);
            }
          }
          if (loopMacro > 0) {
            if (loopCounter > timesToLoop) {
              // Reset all variables related to macro to stop the arduino from running useless code
              macroIndex = 0;
              macroInputsToRun = 0;
              loopMacro = 0;
              currentMacroIndexRunning = 0;
              timesToLoop = 0;
              loopCounter = 0;
              howManyInnerLoopsMacroHas = 0;
              macroMetadataIndex = 0;
              isInnerLoop = 0;
              digitalWrite(latchPin, LOW);
              for (int8_t i = 31; i >= 0; i--) {
                digitalWrite(clockPin, LOW);
                digitalWrite(dataPin, !inputStatus[i]);
                digitalWrite(buttonLeft, !inputStatus[1]);  // This is the Left Dpad button, which isn't on the shift registers, it's on the output A0
                digitalWrite(clockPin, HIGH);
              }
              digitalWrite(latchPin, HIGH);
            }
          }
          //  Buffer Array Element 8 is unused in this code, but is existing in case changes are needed
          isInputtingDelayed = false;
          isInputting = false;
          previousInputDelay += inputDelay;
          inputDelay = 0UL;
        }
      }
    }
  }
}