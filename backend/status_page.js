var fontTable = [{
    "font_name": "5x5.ttf", // Not mono, has arrows, has <^>v- for arrow replacement, has special quotation marks, has normal quotation marks, has apostrophe, is slightly blurry when it comes to numbers
    "font_default_size": 10,
    "font_default_leading": 6,
    "font_stroke_leading": 8
  },
  {
    "font_name": "5x5_pixel.ttf", // Only has letters and numbers, nothing else, not mono, no arrows, doesn't have <^>v- for arrow replacement, doesn't have special quotation marks, doesn't have normal quotation marks, doesn't have apostrophe
    "font_default_size": 8,
    "font_default_leading": 6,
    "font_stroke_leading": 8
  },
  {
    "font_name": "Berkelium64.ttf", // Not mono, no arrows, has <^>v- for arrow replacement, has special quotation marks, has normal quotation marks, has apostrophe
    "font_default_size": 10,
    "font_default_leading": 10,
    "font_stroke_leading": 12
  },
  {
    "font_name": "Berkelium1541.ttf", // Not mono, no arrows, has <^>v- for arrow replacement, has special quotation marks, has normal quotation marks, has apostrophe
    "font_default_size": 6,
    "font_default_leading": 7,
    "font_stroke_leading": 9
  },
  {
    "font_name": "CG_pixel_3x5.ttf", // Numbers are mono, no arrows, has <^>v- for arrow replacement, doesn't have special quotation marks, has normal quotation marks, has apostrophe, slightly blurry at certain points, but way less blurrier than 5x5.ttf
    "font_default_size": 5,
    "font_default_leading": 6,
    "font_stroke_leading": 8
  },
  {
    "font_name": "CG_pixel_3x5_mono.ttf", // No arrows, has <^>v- for arrow replacement, doesn't have special quotation marks, has normal quotation marks, has apostrophe
    "font_default_size": 5,
    "font_default_leading": 6,
    "font_stroke_leading": 8
  },
  {
    "font_name": "CG_pixel_4x5.ttf", // Numbers are mono, no arrows, has <^>v- for arrow replacement, doesn't have special quotation marks, has normal quotation marks, has apostrophe
    "font_default_size": 5,
    "font_default_leading": 6,
    "font_stroke_leading": 8
  },
  {
    "font_name": "CG_pixel_4x5_mono.ttf", // No arrows, has <^>v- for arrow replacement, doesn't have special quotation marks, has normal quotation marks, has apostrophe
    "font_default_size": 5,
    "font_default_leading": 6,
    "font_stroke_leading": 8
  },
  {
    "font_name": "Pokemon_DPPt_mod2.ttf", // Has special characters for thicker arrows, doesn't have <^>v- for arrow replacement, has special quotation marks, doesn't have normal quotation marks, doesn't have apostrophe
    "font_default_size": 16,
    "font_default_leading": 12,
    "font_stroke_leading": 14
  },
  {
    "font_name": "TLOZ-Phantom-Hourglass.ttf", // This font is odd, it doesn't quite line up but 16 is indeed the right size, not quite pixel perfect but almost, not mono, no arrows, has <^>v- for arrow replacement, has special quotation marks, has normal quotation marks that look like special quotation marks, has apostrophe that looks like special apostrophe
    "font_default_size": 16,
    "font_default_leading": 14,
    "font_stroke_leading": 16
  },
  {
    "font_name": "VCR_OSD_MONO.ttf", // Not pixel perfect at all????, has arrows, has <^>v- for arrow replacement, has special quotation marks, has normal quotation marks, has apostrophe
    "font_default_size": 20,
    "font_default_leading": 17,
    "font_stroke_leading": 19
  },
  {
    "font_name": "VCR_OSD_MONO_1.001.ttf", // Not pixel perfect at all????, is this the same as the font above?, has arrows, has <^>v- for arrow replacement, has special quotation marks, has normal quotation marks, has apostrophe
    "font_default_size": 20,
    "font_default_leading": 17,
    "font_stroke_leading": 19
  },
  {
    "font_name": "VCREAS_3.0.ttf", // A lot sharper than the fonts above, but still kinda blurry?, no arrows, has arrows, has <^>v- for arrow replacement, doesn't have special quotation marks, has normal quotation marks, has apostrophe
    "font_default_size": 20,
    "font_default_leading": 17,
    "font_stroke_leading": 19
  }
];

var fontToUse = "CG_pixel_4x5.ttf";
var fontNameIndex = fontTable.findIndex(element => element.font_name == fontToUse);
var fontName = fontTable[fontNameIndex].font_name;
var fontDefaultSize = fontTable[fontNameIndex].font_default_size;
var fontDefaultLeading = fontTable[fontNameIndex].font_default_leading;
var fontStrokeLeading = fontTable[fontNameIndex].font_stroke_leading;
var differenceBetweenDefaultAndStrokeLeadingDistances = fontStrokeLeading - fontDefaultLeading; // Should always be 2 for pixel perfect fonts, but this is here in case it isn't
var fontSizeMultiplier = 3;
var fontStrokeWeightMultiplier = 1;
var fontStrokeWeight = 2 * fontStrokeWeightMultiplier; // Has to be 2 because 1 is transparent????, so only use even numbers
var fontDefaultLeading1px = fontSizeMultiplier - 1; // -1 because we want to make it one pixel closer
var fontStrokeLeading1px = (fontSizeMultiplier) * (differenceBetweenDefaultAndStrokeLeadingDistances + 1) - (differenceBetweenDefaultAndStrokeLeadingDistances + 1); // +1 because one extra pixel needed // Need to figure out how to have constant 1px regardless of strokeweight
var textSizeToUse = fontDefaultSize * fontSizeMultiplier;
var textDefaultLeadingToUse = ((fontDefaultLeading * fontSizeMultiplier) - fontDefaultLeading1px) + fontStrokeWeight;
var textStrokeLeadingToUse = ((fontStrokeLeading * fontSizeMultiplier) - fontStrokeLeading1px) + fontStrokeWeight;

var chatConnectionStatus = {
  chat_logger_ready_state: "CLOSED",
  client_ready_state: "CLOSED",
  client_reconnect_attempts: 0,
  chat_logger_reconnect_attempts: 0,
  server_start_time: new Date().getTime()
};

var restartBackendButton;
var restartMachineButton;
var restartConnectionButton;

var font;
var socket;

function preload() {
  font = loadFont(fontName);
}

function recalculateFont(newFontSizeMultiplier, newFontStrokeWeightMultiplier) {
  differenceBetweenDefaultAndStrokeLeadingDistances = fontStrokeLeading - fontDefaultLeading; // Should always be 2 for pixel perfect fonts, but this is here in case it isn't
  fontSizeMultiplier = newFontSizeMultiplier;
  fontStrokeWeightMultiplier = newFontStrokeWeightMultiplier;
  fontStrokeWeight = 2 * fontStrokeWeightMultiplier; // Has to be 2 because 1 is transparent????, so only use even numbers
  fontDefaultLeading1px = fontSizeMultiplier - 1; // -1 because we want to make it one pixel closer
  fontStrokeLeading1px = (fontSizeMultiplier) * (differenceBetweenDefaultAndStrokeLeadingDistances + 1) - (differenceBetweenDefaultAndStrokeLeadingDistances + 1); // +1 because one extra pixel needed // Need to figure out how to have constant 1px regardless of strokeweight
  textSizeToUse = fontDefaultSize * fontSizeMultiplier;
  textDefaultLeadingToUse = ((fontDefaultLeading * fontSizeMultiplier) - fontDefaultLeading1px) + fontStrokeWeight;
  textStrokeLeadingToUse = ((fontStrokeLeading * fontSizeMultiplier) - fontStrokeLeading1px) + fontStrokeWeight;
}

function setup() {
  noSmooth();
  frameRate(60);
  createCanvas(1920, 1080);
  background("#00000000");

  socket = io.connect();
  socket.on("chat_connection_status", function(data) {
    chatConnectionStatus = data;
  });
  
  restartBackendButton = createButton("RESTART BACKEND");
  restartBackendButton.position(5, 408);
  restartBackendButton.mousePressed(restartBackend);

  restartMachineButton = createButton("RESTART MACHINE");
  restartMachineButton.position(5, 555);
  restartMachineButton.mousePressed(restartMachine);

  restartConnectionButton = createButton("RESTART CONNECTION");
  restartConnectionButton.position(5, 702);
  restartConnectionButton.mousePressed(restartConnection);
}

function draw() {
  clear();
  background("#00000000");
  textFont(font);
  recalculateFont(8, 4);
  textSize(textSizeToUse);
  strokeWeight(fontStrokeWeight);
  stroke("#000000FF");
  textAlign(LEFT, TOP);
  fill("#FFFFFFFF");
  textLeading(textDefaultLeadingToUse);
  let uptimeTotal = new Date().getTime() - chatConnectionStatus.server_start_time;
  let uptimeDays = (parseInt(uptimeTotal / 86400000)).toString().padStart(2, "0");
  let uptimeHours = (parseInt(uptimeTotal / 3600000) % 24).toString().padStart(2, "0");
  let uptimeMinutes = (parseInt(uptimeTotal / 60000) % 60).toString().padStart(2, "0");
  let uptimeSeconds = (parseInt(uptimeTotal / 1000) % 60).toString().padStart(2, "0");
  let uptimeMillis = (uptimeTotal % 1000).toString().padStart(3, "0");
  let uptimeString = uptimeDays + "d " + uptimeHours + "h " + uptimeMinutes + "m " + uptimeSeconds + "s " + uptimeMillis + "ms";
  text("chatLogger.readyState() = " + chatConnectionStatus.chat_logger_ready_state + "\nclient.readyState() = " + chatConnectionStatus.client_ready_state + "\nclientReconnectAttempts = " + chatConnectionStatus.client_reconnect_attempts + "\nchatLoggerReconnectAttempts = " + chatConnectionStatus.chat_logger_reconnect_attempts + "\nsocket.connected = " + socket.connected + "\n\nPress Q on the keyboard to restart\nthe backend\n\nPress P on the keyboard to restart\nthe machine\n\nPress R on the keyboard to restart\nthe chat connection\n\nUptime: " + uptimeString, 5, 5);
  text(new Date().toISOString(), 5, 1024);
}

function restartMachine() {
  console.log(new Date().toISOString() + " Someone pressed the RESTART MACHINE button!");
  socket.emit("restart_command", "restart_machine");
}

function restartBackend() {
  console.log(new Date().toISOString() + " Someone pressed the RESTART BACKEND button!");
  socket.emit("restart_command", "restart_backend");
}

function restartConnection() {
  console.log(new Date().toISOString() + " Someone pressed the RESTART CONNECTION button!");
  socket.emit("restart_command", "restart_connection");
}

function keyPressed() {
  if (key === "q" || key === "Q") {
    console.log(new Date().toISOString() + " Someone pressed Q on the keyboard to restart the backend!");
    socket.emit("restart_command", "restart_backend");
  }
  if (key === "p" || key === "P") {
    console.log(new Date().toISOString() + " Someone pressed P on the keyboard to restart the machine!");
    socket.emit("restart_command", "restart_machine");
  }
  if (key === "r" || key === "R") {
    console.log(new Date().toISOString() + " Someone pressed R on the keyboard to restart the chat connection!");
    socket.emit("restart_command", "restart_connection");
  }
}