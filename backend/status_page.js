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
//textDefaultLeadingToUse = textDefaultLeadingToUse + fontStrokeWeight;
/*
console.log("fontStrokeLeading1px = " + fontStrokeLeading1px);
//fontStrokeLeading1px = fontStrokeLeading1px - 6; // -18 for 10x, -8 for 5x, -6 for 4x, -2 for 2x, -0 for 1x
console.log("differenceBetweenDefaultAndStrokeLeadingDistances = " + differenceBetweenDefaultAndStrokeLeadingDistances);
console.log("fontStrokeLeading1px = " + fontStrokeLeading1px);
console.log("fontStrokeWeight = " + fontStrokeWeight);
console.log("textSizeToUse = " + textSizeToUse);
//chatConfig.trusted_users.findIndex(element => element == userId);
//array1.findIndex((element) => element == 12)
console.log("fontName = " + fontName);
*/

// Oh my god I hate this overlay, it is full of ugly hacks how does it EVEN WORK
var socket;

//var ttsAudio;
//var ttsAudioStatus = true;
//var ttsAudioStatusPrevious = true;
//var startTimeMillis = 1611211608000;
var startTimeMillis = new Date().getTime();
var nextStartTimeMillis = new Date().getTime();
var streamEndTimeMillis = new Date().getTime();
var playTimeTotal = 0;

var acceptInputs = false;

//var helpMessages = ["Type “!speak 《message》” to talk to Pikachu!", "Type “!help” or “!commands” to learn how to play!"];
//var helpMessages = ["Type “!help” or “!commands” to learn how to play!", "Please, don’t delete any files!", "Please save regularly!"];
//var helpMessages = ["Type \"!help\" or \"!commands\" to learn how to play!", "Please, don\'t delete any files, and please save regularly!", "Attempting to delete or deleting any file will earn you\na permaban", "If you\'re caught AFK botting, you\'ll be timed out for\none day.", "If anything breaks, please ping @WhatAboutGamingLive", "Paper Mario Main quest took 8d10h01m47s!\nEnded at 2021-01-29T16:48:35Z!", "Congrats to everyone who participated!", "Current goal: Play SM64 until I decide what the next game\nis!"];
//var helpMessages = ["Type “!help” or “!commands” to learn how to play!", "Please, don’t delete any files, and please save regularly!", "Deliberately deleting any file will result in a ban", "If anything breaks, please ping @WhatAboutGamingLive", "The Twitch Plays file is File 4 named “Ponjos”", "Main quest took 8d10h01m47s! Ended at 2021-01-29T16:48:35Z!", "Congrats to everyone who participated!", "Current goal: Do sidequests until I decide what the next game is!"];
var helpMessages = ["Hi Chat :)"];
var headerText = "Restarting overlay";
var advancedModeHelpMessageToDisplay = "\n\n\n\n\n!help to learn how to play";

var chatConnectionStatus = {
  chat_logger_ready_state: "CLOSED",
  client_ready_state: "CLOSED",
  client_reconnect_attempts: 0,
  chat_logger_reconnect_attempts: 0,
  server_start_time: new Date().getTime()
};

var restartBackendButton;
var restartMachineButton;

var secondCurrent = 0;
var secondOld = 0;
var currentValueToDisplay = 0;

var font;
//var offlineImg;

var viewerCount = -1;

function preload() {
  //soundFormats("mp3");
  //font = loadFont("Pokemon_DPPt_mod2.ttf");
  font = loadFont(fontName);
  //offlineImg = loadImage("tttp_brb_screen_lq.png");
  //ttsAudio = loadSound("output.mp3");
}

function recalculateFont(newFontSizeMultiplier, newFontStrokeWeightMultiplier) {
  /*
  fontToUse = "CG_pixel_3x5.ttf";
  fontNameIndex = fontTable.findIndex(element => element.font_name == fontToUse);
  fontName = fontTable[fontNameIndex].font_name;
  fontDefaultSize = fontTable[fontNameIndex].font_default_size;
  fontDefaultLeading = fontTable[fontNameIndex].font_default_leading;
  fontStrokeLeading = fontTable[fontNameIndex].font_stroke_leading;
  */
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
  frameRate(30);
  createCanvas(1920, 1080);
  background("#00000000");
  
  restartBackendButton = createButton("RESTART BACKEND");
  restartBackendButton.position(5, 440);
  restartBackendButton.mousePressed(restartBackend);

  restartMachineButton = createButton("RESTART MACHINE");
  restartMachineButton.position(5, 600);
  restartMachineButton.mousePressed(restartMachine);

  restartMachineButton = createButton("RESTART CONNECTION");
  restartMachineButton.position(5, 760);
  restartMachineButton.mousePressed(restartConnection);
  
  socket = io.connect();
  socket.on("chat_connection_status", function(data) {
    chatConnectionStatus = data;
  });
}

function draw() {
  clear();
  background("#00000000");
  secondCurrent = new Date().getUTCSeconds();
  if (socket.connected == false) {
    // DO nothing I guess
  }
  // Nothing
  textFont(font);
  /*
  textSize(60);
  strokeWeight(4);
  stroke("#000000FF");
  textAlign(LEFT, TOP);
  // Main text
  fill("#FFFFFFFF");
  textLeading(56);
  text(new Date().toISOString(), 5, 1024);
  */
  recalculateFont(4, 2);
  textSize(textSizeToUse);
  strokeWeight(fontStrokeWeight);
  stroke("#000000FF");
  textAlign(LEFT, TOP);
  fill("#FFFFFFFF");
  textLeading(textDefaultLeadingToUse);
  let uptimeTotal = new Date().getTime() - chatConnectionStatus.server_start_time;
  //
  let uptimeDays = (parseInt(uptimeTotal / 86400000)).toString().padStart(2, "0");
  let uptimeHours = (parseInt(uptimeTotal / 3600000) % 24).toString().padStart(2, "0");
  let uptimeMinutes = (parseInt(uptimeTotal / 60000) % 60).toString().padStart(2, "0");
  let uptimeSeconds = (parseInt(uptimeTotal / 1000) % 60).toString().padStart(2, "0");
  let uptimeMillis = (uptimeTotal % 1000).toString().padStart(3, "0");
  let uptimeString = uptimeDays + "d " + uptimeHours + "h " + uptimeMinutes + "m " + uptimeSeconds + "s " + uptimeMillis + "ms";
  text("chatLogger.readyState() = " + chatConnectionStatus.chat_logger_ready_state + "\nclient.readyState() = " + chatConnectionStatus.client_ready_state + "\nclientReconnectAttempts = " + chatConnectionStatus.client_reconnect_attempts + "\nchatLoggerReconnectAttempts = " + chatConnectionStatus.chat_logger_reconnect_attempts + "\nsocket.connected = " + socket.connected + "\n\nPress Q on the keyboard to restart\nthe backend\n\nPress P on the keyboard to restart\nthe machine\n\nPress R on the keyboard to restart\nthe chat connection\n\nUptime: " + uptimeString, 5, 5);
  text(new Date().toISOString(), 5, 1024);
  secondOld = secondCurrent;
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