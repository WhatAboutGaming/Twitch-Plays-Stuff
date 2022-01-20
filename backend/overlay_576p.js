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

//var ttsAudio;
//var ttsAudioStatus = true;
//var ttsAudioStatusPrevious = true;
//var startTimeMillis = 1611211608000;
var startTimeMillis = new Date().getTime();
var playTimeTotal = 0;

//var helpMessages = ["Type “!speak 《message》” to talk to Pikachu!", "Type “!help” or “!commands” to learn how to play!"];
//var helpMessages = ["Type “!help” or “!commands” to learn how to play!", "Please, don’t delete any files!", "Please save regularly!"];
//var helpMessages = ["Type \"!help\" or \"!commands\" to learn how to play!", "Please, don\'t delete any files, and please save regularly!", "Attempting to delete or deleting any file will earn you\na permaban", "If you\'re caught AFK botting, you\'ll be timed out for\none day.", "If anything breaks, please ping @WhatAboutGamingLive", "Paper Mario Main quest took 8d10h01m47s!\nEnded at 2021-01-29T16:48:35Z!", "Congrats to everyone who participated!", "Current goal: Play SM64 until I decide what the next game\nis!"];
//var helpMessages = ["Type “!help” or “!commands” to learn how to play!", "Please, don’t delete any files, and please save regularly!", "Deliberately deleting any file will result in a ban", "If anything breaks, please ping @WhatAboutGamingLive", "The Twitch Plays file is File 4 named “Ponjos”", "Main quest took 8d10h01m47s! Ended at 2021-01-29T16:48:35Z!", "Congrats to everyone who participated!", "Current goal: Do sidequests until I decide what the next game is!"];
var helpMessages = [];
var headerText = "";

var secondCurrent = 0;
var secondOld = 0;
var currentValueToDisplay = 0;

var font;
var offlineImg;
var controllerGraphics;

var socket;
var inputQueue = [];
var isTtsBusy = false;
var isTtsBusyPrevious = false;
var isControllerBusy = false;
var currentInputInQueue = 0;
var currentInputInQueuePrevious = 0;
var dataChanged = "";
var inputQueueLength = 0;

var inputToHighlight = 0;
var initialPosition = 0;
var initialPositionPrevious = 0;
var inputToHighlightPrevious = 0;
var stepsToMoveUp = 0;

var viewerCount = -1;

var gameTitle = "";

var votingBarSize = 200;
var votingBarCenterPosition = 896;
var votingBarLeftEdgePosition = 767;
votingBarLeftEdgePosition = 767 + ((256 - votingBarSize) / 2);
var votingBarSlider = 768 + ((256 - votingBarSize) / 2);

var endInputString = "";
var basicInputString = "";
var advancedInputString = "";

var inputModesArray = [{
  mode_name: "Basic",
  mode_id: 0
}, {
  mode_name: "Democracy",
  mode_id: 1
}, {
  mode_name: "Advanced",
  mode_id: 2
}];

var voteDataObject = {
  basic_vote_count: 0,
  advanced_vote_count: 0,
  threshold_to_change_mode: 0.75,
  total_votes: 0,
  advanced_vote_count_ratio: 0,
  basic_vote_count_ratio: 0,
  input_modes_array: inputModesArray,
  input_mode: 0
};

var advancedInputMetadata = {
  loop_macro: 0,
  macro_inputs_to_run: 0,
  current_macro_index_running: 0,
  times_to_loop: 0,
  loop_counter: 0
};

var inputCountsObject = {
  run_id: 0,
  basic_inputs_sent: 0,
  advanced_inputs_sent: 0,
  total_inputs_sent: 0,
  basic_inputs_executed: 0,
  advanced_inputs_executed: 0,
  total_inputs_executed: 0
};

function preload() {
  //soundFormats("mp3");
  //font = loadFont("Pokemon_DPPt_mod2.ttf");
  font = loadFont(fontName);
  offlineImg = loadImage("tttp_brb_screen_lq.png");
  controllerGraphics = loadImage("gcn_controller_graphics.png");
  //ttsAudio = loadSound("output.mp3");
}

/*
inputQueue.push({
  username_to_display: usernameToPing,
  username: username,
  display_name: displayName,
  user_color: userColor,
  is_tts: true,
  message: message,
  tts_message: messageToRead,
  controller_data: dataToWrite,
  input_string: "",
  input_index: currentInputInQueue,
  message_id: messageId,
  user_id: userId
});

var inputStatus = {
  is_controller_busy: isControllerBusy,
  is_tts_busy: isTtsBusy,
  current_input_in_queue: currentInputInQueue,
  data_changed: "current_input"
};
*/

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
  createCanvas(1024, 576);
  background("#00000000");
  socket = io.connect();
  socket.on("input_counts_object", function(data) {
    inputCountsObject = data;
    //console.log(inputCountsObject);
  });
  socket.on("advanced_input_metadata", function(data) {
    //console.log(data);
    advancedInputMetadata = data;
    //console.log(advancedInputMetadata);
  });
  socket.on("controller_graphics", function(data) {
    //console.log(data);
    controllerGraphics = loadImage(data);
  });
  socket.on("input_state_from_arduino", function(data) {
    //console.log(data);
  });
  socket.on("end_input_string", function(data) {
    endInputString = data;
    basicInputString = endInputString;
    advancedInputString = endInputString;
    //console.log("A");
    /*
    console.log("A");
    console.log("endInputString = " + endInputString);
    console.log("basicInputString = " + basicInputString);
    console.log("advancedInputString = " + advancedInputString);
    */
    /*
    if (voteDataObject.input_mode == 0) {
      basicInputString = endInputString;
    }
    if (voteDataObject.input_mode == 2) {
      advancedInputString = endInputString;
    }
    */
  });
  socket.on("basic_input_string", function(data) {
    basicInputString = data;
    advancedInputString = "";
    //console.log("B");
    /*
    console.log("B");
    console.log("endInputString = " + endInputString);
    console.log("basicInputString = " + basicInputString);
    console.log("advancedInputString = " + advancedInputString);
    */
  });
  socket.on("advanced_input_string", function(data) {
    advancedInputString = data;
    basicInputString = "";
    //console.log("C");
    /*
    console.log("C");
    console.log("endInputString = " + endInputString);
    console.log("basicInputString = " + basicInputString);
    console.log("advancedInputString = " + advancedInputString);
    */
  });
  socket.on("game_title", function(data) {
    gameTitle = data;
  });
  socket.on("header_text", function(data) {
    headerText = data;
  });
  socket.on("help_messages", function(data) {
    helpMessages = data;
  });
  socket.on("vote_data", function(data) {
    //console.log(data);
    voteDataObject = data;
    //console.log(voteDataObject);
  });
  socket.on("run_start_time", function(data) {
    startTimeMillis = data;
  });
  socket.on("viewer_count", function(data) {
    viewerCount = data;
  });
  /*
  socket.on("play_audio", function(data) {
    ttsAudio.play();
  });
  socket.on("load_audio", function(data) {
    ttsAudio = loadSound("output.mp3");
  });
  */
  socket.on("input_data", function(data) {
    inputQueue.push(data);
    //console.log(data.username_to_display);
  });
  socket.on("input_status", function(data) {
    isControllerBusy = data.is_controller_busy;
    isTtsBusy = data.is_tts_busy;
    currentInputInQueue = data.current_input_in_queue;
    currentInputInQueuePrevious = data.previous_input_in_queue;
    dataChanged = data.data_changed;
    inputQueueLength = data.input_queue_length;
    //inputQueue.splice(0, 1);
    /*
    if (inputQueue.length > 25) {
      stepsToMoveUp++;
      //console.log(new Date().toISOString());
    }
    */
    //console.log(data);
  });
}

function draw() {
  //tint(255, 255);
  let currentTimeMillis = new Date().getTime();
  playTimeTotal = currentTimeMillis - startTimeMillis;
  //console.log(currentTimeMillis - startTimeMillis);
  let playTimeDays = (parseInt(playTimeTotal / 86400000)).toString().padStart(2, "0");
  let playTimeHours = (parseInt(playTimeTotal / 3600000) % 24).toString().padStart(2, "0");
  let playTimeMinutes = (parseInt(playTimeTotal / 60000) % 60).toString().padStart(2, "0");
  let playTimeSeconds = (parseInt(playTimeTotal / 1000) % 60).toString().padStart(2, "0");
  let playTimeMillis = (playTimeTotal % 1000).toString().padStart(3, "0");
  let playTimeString = playTimeDays + "d " + playTimeHours + "h " + playTimeMinutes + "m " + playTimeSeconds + "s " + playTimeMillis + "ms";
  //console.log(playTimeDays + "d" + playTimeHours + "h" + playTimeMinutes + "m" + playTimeSeconds + "s" + playTimeMillis + "ms");
  secondCurrent = new Date().getUTCSeconds();
  //ttsAudioStatus = ttsAudio.isLoaded();
  //var inputToHighlight = 0;
  inputToHighlight = inputQueueLength - inputQueue.length;
  inputToHighlight = currentInputInQueue - inputToHighlight;
  clear();
  background("#00000000");
  //recalculateFont(2, 1);
  textFont(font);
  /*
  textSize(textSizeToUse);
  strokeWeight(fontStrokeWeight);
  stroke("#000000FF");
  textAlign(LEFT, TOP);
  textLeading(textDefaultLeadingToUse);
  text(frameRate(), 320, 240);
  fill("#FFFFFFFF");
  */
  
  /*
  recalculateFont(2, 1);
  textSize(textSizeToUse);
  strokeWeight(fontStrokeWeight);
  textLeading(textDefaultLeadingToUse);
  */
  //console.log(new Date().toISOString() + " A " + textDefaultLeadingToUse);
  //text(playTimeString + "\n" + new Date().toISOString(), 768, 551);
  if (playTimeTotal >= 0) {
    recalculateFont(2, 1);
    textSize(textSizeToUse);
    strokeWeight(fontStrokeWeight);
    textLeading(textDefaultLeadingToUse);
    text(playTimeString + "\n" + new Date().toISOString(), 768, 551);
    /*
    recalculateFont(4, 2);
    textSize(textSizeToUse);
    strokeWeight(fontStrokeWeight);
    stroke("#000000FF");
    textAlign(CENTER, TOP);
    fill("#FFFFFFFF");
    textLeading(textDefaultLeadingToUse);
    text(gameTitle + "\nstarts in " + playTimeString, 384, 288);
    */
  }
  if (playTimeTotal < 0) {
    playTimeTotal = Math.abs(playTimeTotal);
    playTimeDays = (parseInt(playTimeTotal / 86400000)).toString().padStart(2, "0");
    playTimeHours = (parseInt(playTimeTotal / 3600000) % 24).toString().padStart(2, "0");
    playTimeMinutes = (parseInt(playTimeTotal / 60000) % 60).toString().padStart(2, "0");
    playTimeSeconds = (parseInt(playTimeTotal / 1000) % 60).toString().padStart(2, "0");
    playTimeMillis = (playTimeTotal % 1000).toString().padStart(3, "0");
    playTimeString = playTimeDays + "day " + playTimeHours + "hr " + playTimeMinutes + "min " + playTimeSeconds + "sec " + playTimeMillis + "msec";

    recalculateFont(2, 1);
    textSize(textSizeToUse);
    strokeWeight(fontStrokeWeight);
    textLeading(textDefaultLeadingToUse);
    text("\n" + new Date().toISOString(), 768, 551);
    recalculateFont(4, 2);
    textSize(textSizeToUse);
    strokeWeight(fontStrokeWeight);
    stroke("#000000FF");
    textAlign(CENTER, TOP);
    fill("#FFFFFFFF");
    textLeading(textDefaultLeadingToUse);
    text(gameTitle + "\nstarts in " + playTimeString, 384, 288);
  }
  //recalculateFont(2, 1);
  //textSize(textSizeToUse);
  //strokeWeight(fontStrokeWeight);
  //text(new Date().toISOString(), 768, 564);
  recalculateFont(3, 2);
  textAlign(LEFT, TOP);
  textSize(textSizeToUse);
  strokeWeight(fontStrokeWeight);
  textLeading(textDefaultLeadingToUse);
  //console.log(new Date().toISOString() + " B " + textDefaultLeadingToUse);
  //text("Twitch Plays (Viewers play/Chat plays) Super Mario 64 on a\nreal N64 console, please don\'t delete any files", 2, 2);
  text(headerText, 2, 2);

  //recalculateFont(3, 2);
  //textSize(textSizeToUse);
  //strokeWeight(fontStrokeWeight);
  //text("Viewers: " + viewerCount, 768, 345);
  //text("real N64 console, please don’t delete any files", 2, 20); // For some reason text leading doesn't work with this font, so I have to do this ugly hack
  //text(inputQueue.length + " " + isControllerBusy + " " + isTtsBusy + " " + currentInputInQueue + " " + dataChanged + " " + inputQueueLength + " " + inputToHighlight + " " + stepsToMoveUp, 4, 1024);

  if (socket.connected == false) {
    image(offlineImg, 0, 0, width, height);
    inputQueue = [];
    isTtsBusy = false;
    isControllerBusy = false;
    currentInputInQueue = 0;
    dataChanged = "";
    inputQueueLength = 0;
    currentValueToDisplay = 0;
    endInputString = "";
    basicInputString = "";
    advancedInputString = "";
    viewerCount = -1;
    voteDataObject = {
      basic_vote_count: 0,
      advanced_vote_count: 0,
      threshold_to_change_mode: 0.75,
      total_votes: 0,
      advanced_vote_count_ratio: 0,
      basic_vote_count_ratio: 0,
      input_modes_array: inputModesArray,
      input_mode: 0
    };
    
    advancedInputMetadata = {
      loop_macro: 0,
      macro_inputs_to_run: 0,
      current_macro_index_running: 0,
      times_to_loop: 0,
      loop_counter: 0
    };

    inputCountsObject = {
      run_id: 0,
      basic_inputs_sent: 0,
      advanced_inputs_sent: 0,
      total_inputs_sent: 0,
      basic_inputs_executed: 0,
      advanced_inputs_executed: 0,
      total_inputs_executed: 0
    };
    /*
    textFont(font);
    textSize(64);
    strokeWeight(4);
    stroke("#000000FF");
    textAlign(LEFT, TOP);
    textLeading(12);
    fill("#FFFFFFFF");
    text("Waiting for data", 10, 10);
    */
    return;
  }

  if (helpMessages.length > 0) {
    if (secondCurrent != secondOld) {
      if (secondCurrent % 3 == 0) {
        currentValueToDisplay++;
        if (currentValueToDisplay > helpMessages.length - 1) {
          currentValueToDisplay = 0;
        }
      }
    }
  }
  if (voteDataObject.input_mode == 0) {
    if (inputQueue.length >= 16) {
      if (isControllerBusy == false) {
        //if (isTtsBusy == false) {
          inputQueue.splice(0, 1);
        //}
      }
      //stepsToMoveUp++;
      //console.log(new Date().toISOString());
    }
  }
  /*
  if (isControllerBusy == true) {
    //inputToHighlight = inputQueueLength - inputQueue.length;
    //inputToHighlight = currentInputInQueue - inputToHighlight;
    
    recalculateFont(2, 1);
    strokeWeight(fontStrokeWeight);
    stroke("#000000FF");
    fill("#FFFFFFFF");
    rect(768, ((inputToHighlight - 1) * 24) + 0, 255, 24);
    
    if (isTtsBusy == true) {
      //inputQueue[currentInputInQueue].tts_message;
      recalculateFont(3, 2);
      textFont(font);
      textSize(textSizeToUse);
      strokeWeight(fontStrokeWeight);
      stroke("#000000FF");
      textAlign(LEFT, BOTTOM);
      fill("#FFFFFFFF");
      textLeading(textDefaultLeadingToUse);
      text(inputQueue[inputToHighlight - 1].tts_message, 2, 574);
    }
  }
  */
  //if (isTtsBusy == false) {
    //inputQueue[currentInputInQueue].tts_message;
    if (helpMessages.length > 0) {
      if (currentValueToDisplay == 0) {
        // Big red text case
        recalculateFont(6, 3);
        textFont(font);
        textSize(textSizeToUse);
        strokeWeight(fontStrokeWeight);
        stroke("#000000FF");
        textAlign(LEFT, BOTTOM);
        fill("#FF0000FF");
        textLeading(textDefaultLeadingToUse);
        text(helpMessages[currentValueToDisplay], 3, 573); 
      }
      if (currentValueToDisplay != 0) {
        // Normal case
        recalculateFont(3, 2);
        textFont(font);
        textSize(textSizeToUse);
        strokeWeight(fontStrokeWeight);
        stroke("#000000FF");
        textAlign(LEFT, BOTTOM);
        fill("#FFFFFFFF");
        textLeading(textDefaultLeadingToUse);
        text(helpMessages[currentValueToDisplay], 2, 574); 
      }
    }
  //}

  /*
  if (isControllerBusy == false) {
    if (inputQueue.length > 0) {
      //inputToHighlight = inputQueueLength - inputQueue.length;
      //inputToHighlight = currentInputInQueue - inputToHighlight;
      strokeWeight(2);
      stroke("#00000040");
      fill("#FFFFFF40");
      rect(768, ((inputToHighlight - 1) * 24) + 0, 255, 24);
    }
  }
  */
  //votingBarLeftEdgePosition = 767 + ((256 - votingBarSize) / 2);

  strokeWeight(2);
  stroke("#FFFFFFFF");
  fill("#FFFFFF7F");
  rect(votingBarLeftEdgePosition, 2, votingBarSize, 19);
  //console.log(new Date().toISOString() + " " + votingBarLeftEdgePosition + " " + votingBarSize);

  recalculateFont(3, 1);
  textFont(font);
  textSize(textSizeToUse);
  strokeWeight(fontStrokeWeight);
  stroke("#FFFFFFFF");
  textAlign(LEFT, TOP);
  fill("#0000FFFF");
  textLeading(textDefaultLeadingToUse);
  //text("B                         A", 767 + 3, 4);
  text("B\n" + parseInt(voteDataObject.basic_vote_count_ratio * 100) + "%\n" + voteDataObject.basic_vote_count + " Vote", 767 + 3, 4);
  textAlign(RIGHT, TOP);
  fill("#FF0000FF");
  text("A\n" + parseInt(voteDataObject.advanced_vote_count_ratio * 100) + "%\n" + voteDataObject.advanced_vote_count + " Vote", 1022 + 3, 4);
  if (voteDataObject.advanced_vote_count_ratio == voteDataObject.basic_vote_count_ratio) {
    fill("#000000FF");
    votingBarSlider = votingBarLeftEdgePosition + 1 + (votingBarSize / 2);
    textAlign(CENTER, TOP);
    textLeading(textDefaultLeadingToUse);
    text("|", votingBarSlider, 4);
  }
  if (voteDataObject.advanced_vote_count_ratio != voteDataObject.basic_vote_count_ratio) {
    fill("#000000FF");
    votingBarSlider = (votingBarLeftEdgePosition + 1) + (votingBarSize * voteDataObject.advanced_vote_count_ratio);
    textAlign(CENTER, TOP);
    textLeading(textDefaultLeadingToUse);
    text("|", votingBarSlider, 4);
  }
  if (voteDataObject.input_mode == 0) {
    inputQueue.forEach(function(item, index, array) {
      recalculateFont(2, 2);
      initialPosition = (index * textDefaultLeadingToUse) + 57;
      textFont(font);
      textSize(textSizeToUse);
      strokeWeight(fontStrokeWeight);
      stroke(item.user_color_inverted); // Username stroke color
      textAlign(LEFT, TOP);
      fill(item.user_color);
      if (item.username_to_display.length > 16) {
        scale(0.5, 1);
        textLeading(textDefaultLeadingToUse);
        text(item.username_to_display, (771 * 2) - 2, 2 + initialPosition);
        scale(2, 1);
      }
      if (item.username_to_display.length <= 16) {
        // Don't rescale
        textLeading(textDefaultLeadingToUse);
        text(item.username_to_display, 771, 2 + initialPosition);
      }
      strokeWeight(fontStrokeWeight);
      stroke("#FFFFFFFF");
      textAlign(RIGHT, TOP);
      fill("#000000FF");
      //scale(0.5);
      if (item.input_string.length > 12) {
        scale(0.5, 1);
        textLeading(textDefaultLeadingToUse);
        text(item.input_string, (1022 * 2) + 2, 2 + initialPosition);
        scale(2, 1);
      }
      if (item.input_string.length <= 12) {
        textLeading(textDefaultLeadingToUse);
        text(item.input_string, 1023, 2 + initialPosition);
      }
    });
  }

  // Draw the BASIC/ADVANCED text behind the vote bar (the bar is translucent)
  if (voteDataObject.input_mode == 0) {
    // Basic Mode
    recalculateFont(3, 1);
    textFont(font);
    textSize(textSizeToUse);
    strokeWeight(fontStrokeWeight);
    stroke("#FFFFFFFF");
    textAlign(LEFT, TOP); // 4x5 font isn't kind to CENTER, LEFT, text gets blurry, so I have to do LEFT, TOP and kinda hardcode the text position so it looks like it is centered, ugly hack but it works
    fill("#0000FFFF");
    textLeading(textDefaultLeadingToUse);
    text("\nBASIC", 864, 4);
    stroke("#000000FF");
    fill("#FFFFFFFF");
    textLeading(textDefaultLeadingToUse);
    text(inputCountsObject.basic_inputs_sent + " Basic inputs", 768, 328);

    stroke("#FFFFFFFF");
    fill("#FF0000FF");
    votingBarSlider = (votingBarLeftEdgePosition + 1) + (votingBarSize * voteDataObject.threshold_to_change_mode);
    textAlign(CENTER, TOP);
    textLeading(textDefaultLeadingToUse);
    text("|\n^", votingBarSlider, 4);

    recalculateFont(4, 2);
    textFont(font);
    textSize(textSizeToUse);
    strokeWeight(fontStrokeWeight);
    stroke("#000000FF");
    textAlign(LEFT, TOP); // 4x5 font isn't kind to CENTER, LEFT, text gets blurry, so I have to do LEFT, TOP and kinda hardcode the text position so it looks like it is centered, ugly hack but it works
    fill("#FFFFFFFF");
    if (basicInputString.length > 12) {
      textAlign(CENTER, TOP);
      scale(0.5, 1);
      textLeading(textDefaultLeadingToUse);
      text(basicInputString, 896 * 2, 306);
      scale(2, 1);
    }
    if (basicInputString.length <= 12 && basicInputString.length > 0) {
      textAlign(CENTER, TOP);
      textLeading(textDefaultLeadingToUse);
      text(basicInputString, 896, 306);
    }
  }
  if (voteDataObject.input_mode == 2) {
    // Advanced Mode
    recalculateFont(3, 1);
    textFont(font);
    textSize(textSizeToUse);
    strokeWeight(fontStrokeWeight);
    stroke("#FFFFFFFF");
    textAlign(LEFT, TOP); // 4x5 font isn't kind to CENTER, LEFT, text gets blurry, so I have to do LEFT, TOP and kinda hardcode the text position so it looks like it is centered, ugly hack but it works
    fill("#FF0000FF");
    textLeading(textDefaultLeadingToUse);
    text("\nADVANCED", 840, 4);
    stroke("#000000FF");
    fill("#FFFFFFFF");
    textLeading(textDefaultLeadingToUse);
    text(inputCountsObject.advanced_inputs_sent + " Adv. inputs", 768, 328);

    stroke("#FFFFFFFF");
    fill("#0000FFFF");
    votingBarSlider = (votingBarLeftEdgePosition + 1) + (votingBarSize * (1 - voteDataObject.threshold_to_change_mode));
    textAlign(CENTER, TOP);
    textLeading(textDefaultLeadingToUse);
    text("|\n^", votingBarSlider, 4);

    recalculateFont(4, 2);
    textFont(font);
    textSize(textSizeToUse);
    strokeWeight(fontStrokeWeight);
    stroke("#000000FF");
    //textAlign(LEFT, TOP); // 4x5 font isn't kind to CENTER, LEFT, text gets blurry, so I have to do LEFT, TOP and kinda hardcode the text position so it looks like it is centered, ugly hack but it works
    fill("#FFFFFFFF");
    if (advancedInputString != "") {
      if (advancedInputMetadata.loop_macro == 0) {
        textAlign(CENTER, TOP);
        textLeading(textDefaultLeadingToUse);
        text("Input\n" + advancedInputMetadata.current_macro_index_running + "/" + advancedInputMetadata.macro_inputs_to_run, 896, 100);
      }
      if (advancedInputMetadata.loop_macro == 1) {
        textAlign(CENTER, TOP);
        textLeading(textDefaultLeadingToUse);
        text("Input\n" + (advancedInputMetadata.current_macro_index_running + 1) + "/" + advancedInputMetadata.macro_inputs_to_run + "\n\nLoop\n" + advancedInputMetadata.loop_counter + "/" + (advancedInputMetadata.times_to_loop + 1), 896, 100);
      }
      if (advancedInputString.length > 12) {
        textAlign(CENTER, TOP);
        scale(0.5, 1);
        textLeading(textDefaultLeadingToUse);
        text("\n" + advancedInputString, 896 * 2, 224);
        scale(2, 1);
      }
      if (advancedInputString.length <= 12 && advancedInputString.length > 0) {
        textAlign(CENTER, TOP);
        textLeading(textDefaultLeadingToUse);
        text("\n" + advancedInputString, 896, 224);
      }
    }
  }

  recalculateFont(3, 1);
  textSize(textSizeToUse);
  strokeWeight(fontStrokeWeight);
  stroke("#000000FF");
  textAlign(LEFT, TOP); // 4x5 font isn't kind to CENTER, LEFT, text gets blurry, so I have to do LEFT, TOP and kinda hardcode the text position so it looks like it is centered, ugly hack but it works
  fill("#FFFFFFFF");
  if (viewerCount == 1) {
    textLeading(textDefaultLeadingToUse);
    text(viewerCount + " Viewer", 768, 346);
  }
  if (viewerCount != 1) {
    textLeading(textDefaultLeadingToUse);
    text(viewerCount + " Viewers", 768, 346);
  }
  //tint(255, 127);
  //image(controllerGraphics, 40, 40, 13, 19, 13, 50, 13, 19); // Position X on Canvas, Position Y on Canvas, Width on Canvas, Height on Canvas, Origin X on Image, Origin Y on Image, Width on image, Height on Image
  secondOld = secondCurrent;
  isTtsBusyPrevious = isTtsBusy;
  //ttsAudioStatusPrevious = ttsAudioStatus;
}