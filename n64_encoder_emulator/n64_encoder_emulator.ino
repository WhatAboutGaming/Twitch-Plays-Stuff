/*
  1 2 A
  8 3 D-Right
  7 4 D-Left
  6 5 D-Down
  5 6 D-Up
  4 7 Start
  3 8 Z
  2 9 B
  9 10  L
  10  11  R
  11  12  C-Up
  12  13  C-Down
  13  A0  C-Left
  17  A1  Analog YQ
  16  A2  Analog XI
  18  A3  Analog YI
  15  A4  Analog XQ
  14  A5  C-Right
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

unsigned int buttonArrayIndex = 0;
unsigned int buttonArray[] = {buttonA, buttonB, buttonZ, buttonZ, buttonDUp, buttonDDown, buttonDLeft, buttonDRight, buttonL, buttonR, buttonCUp, buttonCDown, buttonCLeft, buttonCRight};
////////////////////////////////////////////////////////// ^ Replace with START after finishing
unsigned int xAxisPins[] = {axisXq, axisXi};
unsigned int yAxisPins[] = {axisYq, axisYi};

void setup() {
  Serial.begin(2000000);
  // Setup buttons
  //pinMode(7, OUTPUT);
  for (buttonArrayIndex = 0; buttonArrayIndex < (sizeof(buttonArray) / sizeof(unsigned int)); buttonArrayIndex++) {
    pinMode(buttonArray[buttonArrayIndex], OUTPUT);
  }
  // Setup axis
  for (xAxisIndex = 0; xAxisIndex < (sizeof(xAxisPins) / sizeof(unsigned int)); xAxisIndex++) {
    pinMode(xAxisPins[xAxisIndex], OUTPUT);
  }
  for (yAxisIndex = 0; yAxisIndex < (sizeof(yAxisPins) / sizeof(unsigned int)); yAxisIndex++) {
    pinMode(yAxisPins[yAxisIndex], OUTPUT);
  }
  resetController();
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
    delay(133);
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

void loop() {
  //int fadeValueB = 127;
  //int fadeValue = 127;
  for (buttonArrayIndex = 0; buttonArrayIndex < (sizeof(buttonArray) / sizeof(unsigned int)); buttonArrayIndex++) {
    for (int buttonPresses = 0; buttonPresses < 2; buttonPresses++) {
      digitalWrite(buttonArray[buttonArrayIndex], HIGH);
      delay(133);
      digitalWrite(buttonArray[buttonArrayIndex], LOW);
      delay(133);
    }
  }
  for (int buttonPresses = 0; buttonPresses < 2; buttonPresses++) {
    moveStick(127, 127); // CENTER
    delay(133);
    moveStick(0, 127); // LEFT
    delay(133);
    moveStick(0, 0); // LEFT+UP
    delay(133);
    moveStick(127, 0); // UP
    delay(133);
    moveStick(255, 1); // UP+RIGHT
    delay(133);
    moveStick(255, 127); // RIGHT
    delay(133);
    moveStick(255, 255); // RIGHT+DOWN
    delay(133);
    moveStick(127, 255); // DOWN
    delay(133);
    moveStick(0, 255); // DOWN+LEFT
    delay(133);
    moveStick(0, 127); // LEFT
    delay(133);
    moveStick(127, 127); // CENTER
    delay(133);
    /*
      for (fadeValue = 0 ; fadeValue <= 255; fadeValue++)
      {
      delay(5);
      moveStick(127, fadeValue);
      }
      for (fadeValue = 255 ; fadeValue >= 0; fadeValue--)
      {
      delay(5);
      moveStick(127, fadeValue);
      }
      for (fadeValueB = 0 ; fadeValueB <= 255; fadeValueB++)
      {
      delay(5);
      moveStick(fadeValueB, 127);
      }
      for (fadeValueB = 255 ; fadeValueB >= 0; fadeValueB--)
      {
      delay(5);
      moveStick(fadeValueB, 127);
      }
    */
  }
}
