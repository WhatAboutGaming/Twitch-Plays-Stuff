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

var globalConfig = {
  controller_config: "",
  linux_restart_command: "",
  windows_restart_command: "",
  enable_slur_detection: true,
  permaban_when_slur_is_detected: true,
  slur_detection_timeout: 600,
  long_message_length: 250,
  long_message_timeout: 300,
  all_caps_message_length: 175,
  all_caps_message_ratio: 0.9,
  all_caps_message_timeout: 300,
  permaban_if_first_message_is_long: true,
  timeout_if_message_is_long: false,
  warn_if_message_is_long: true,
  enable_updating_stream_title_automatically: true,
  enable_check_uptime: true,
  enable_check_moderators: true,
  enable_check_followage: true,
  send_introductory_messages_to_new_users: true,
  send_help_messages_to_new_users: false,
  introductory_message_to_new_users: "",
  introductory_message_to_new_users_with_help_messages: "",
  introductory_message_to_returning_users: "",
  introductory_message_to_returning_users_with_help_messages: "",
  get_stream_viewer_count: false,
  webserver_port: 8080,
  chat_config: "",
  run_start_time: new Date().getTime(),
  next_run_start_time: new Date().getTime(),
  stream_end_time: new Date().getTime(),
  initial_accept_inputs: false,
  initial_accept_tts: false,
  initial_input_mode: 2,
  voting_enabled: true,
  threshold_to_change_mode: 0.75,
  is_advanced_mode_temporary: false,
  is_voting_temporary: false,
  is_advanced_cooldown_enabled: true,
  is_voting_cooldown_enabled: true,
  advanced_allowed_period_millis: 300000,
  voting_allowed_period_millis: 300000,
  vote_expiration_time_millis: 300000,
  help_message_cooldown_millis: 5000,
  game_title: "Game Title",
  game_title_short: "Game Title Short",
  game_title_shorter: "Game Title Shorter",
  game_title_shorter_2: "Game Title Shorter 2",
  game_title_shorter_3: "Game Title Shorter 3",
  stream_title: "Stream Title",
  stream_going_offline_message: "Stream Going Offline Message",
  send_stream_going_offline_message: true,
  next_game_title: "Next Game Title",
  next_game_title_short: "Next Game Title Short",
  next_game_title_shorter: "Next Game Title Shorter",
  next_game_title_shorter_2: "Next Game Title Shorter 2",
  next_game_title_shorter_3: "Next Game Title Shorter 3",
  main_database_name: "",
  chatters_collection_name: "",
  run_name: "",
  global_database_name: "",
  inputter_database_name: "",
  macro_database_name: "",
  use_macro_database: false,
  reason_macro_database_is_disabled: "",
  discord_url: "",
  github_message: "",
  github_repo: "",
  run_id: -1,
  notes: "To test server: Set game_title as TEST RUN 0, set stream_title as TEST RUN 1, set next_game_title as TEST RUN 2, set main_database_name as test_database_main, set chatters_collection_name as test_database_chatters, set run_name as test_database_run_name, set global_database_name as test_database_global, set inputter_database_name as test_database_inputters, set macro_database_name as test_database_macro, set run_id as -1",
  overlay_enable_hourly_beeps: false,
  overlay_enable_secondary_beeps: false,
  overlay_header_text: "Restarting overlay",
  overlay_advanced_mode_help_message_to_display: "\n\n\n\n\n!help to learn how to play",
  overlay_text_rotation: [
   "Hi Chat :)"
  ],
  current_run_endgame_goals: [
    "Hi Chat :)"
  ],
  periodical_news_messages: [
    "Hi Chat :)"
  ],
  help_message_saving_macros: [
    "Hi Chat :)"
  ],
  sassy_replies: [
    "Used to reply to certain users when they send a message or ping the bot or ping the streamer or ping the channel owner??? This is not implemented yet"
  ]
};

var controllerConfig = {
  com_port: "COM4",
  com_port_parameters: {
    autoOpen: false,
    baudRate: 500000
  },
  time_unit: "milliseconds",
  time_unit_alternate: "seconds",
  time_unit_short: "ms",
  millis_to_seconds_conversion_threshold: 10,
  display_framerate: false,
  normal_delay: 266,
  max_delay: 65535,
  held_delay: 0,
  stick_minimum: 0,
  stick_maximum: 255,
  stick_center: 127,
  stick_limit: 0,
  initial_macro_preamble: 4,
  final_macro_preamble: 68,
  initial_macro_inner_loop: 69,
  final_macro_inner_loop: 133,
  advanced_input_macros_allowed: 64,
  advanced_input_macro_inner_loops_allowed: 64,
  max_duration_per_precision_input_millis: 65535,
  default_duration_per_precision_input_millis: 266,
  held_duration_per_precision_input_millis: 533,
  max_times_to_repeat_macro: 255,
  controller_object: "",
  simultaneous_different_basic_buttons_allowed: 5,
  controller_graphics: "placeholder.png",
  use_controller_graphics: false,
  help_message_basic: [
    "Hi Chat :)"
  ],
  simultaneous_different_advanced_buttons_allowed: 5,
  help_message_advanced: [
    "Hi Chat :)"
  ],
  blacklisted_combos: [
  ]
};

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
var startTimeMillis = globalConfig.run_start_time;
var nextStartTimeMillis = globalConfig.next_run_start_time;
var streamEndTimeMillis = globalConfig.stream_end_time;
var currentTimeMillis = new Date().getTime();
var playTimeTotal = 0;

var acceptInputs = false;

//var helpMessages = ["Type “!speak 《message》” to talk to Pikachu!", "Type “!help” or “!commands” to learn how to play!"];
//var helpMessages = ["Type “!help” or “!commands” to learn how to play!", "Please, don’t delete any files!", "Please save regularly!"];
//var helpMessages = ["Type \"!help\" or \"!commands\" to learn how to play!", "Please, don\'t delete any files, and please save regularly!", "Attempting to delete or deleting any file will earn you\na permaban", "If you\'re caught AFK botting, you\'ll be timed out for\none day.", "If anything breaks, please ping @WhatAboutGamingLive", "Paper Mario Main quest took 8d10h01m47s!\nEnded at 2021-01-29T16:48:35Z!", "Congrats to everyone who participated!", "Current goal: Play SM64 until I decide what the next game\nis!"];
//var helpMessages = ["Type “!help” or “!commands” to learn how to play!", "Please, don’t delete any files, and please save regularly!", "Deliberately deleting any file will result in a ban", "If anything breaks, please ping @WhatAboutGamingLive", "The Twitch Plays file is File 4 named “Ponjos”", "Main quest took 8d10h01m47s! Ended at 2021-01-29T16:48:35Z!", "Congrats to everyone who participated!", "Current goal: Do sidequests until I decide what the next game is!"];
var helpMessages = globalConfig.overlay_text_rotation;
var headerText = globalConfig.overlay_header_text;
var advancedModeHelpMessageToDisplay = globalConfig.overlay_advanced_mode_help_message_to_display;

var secondCurrent = 0;
var secondOld = 0;
var minuteCurrent = 0;
var minuteOld = 0;
var hourCurrent = 0;
var hourOld = 0;
var currentValueToDisplay = 0;

var font;
var offlineImg;
var controllerGraphics;
var controllerMotorOnGraphics = [[0], [0], [0], [0]];
var controllerMotorOffGraphics = [0, 0, 0, 0];
var controllerLedOnGraphics = [0, 0, 0, 0];
var controllerLedOffGraphics = [0, 0, 0, 0];

var hourlyBeepSoundEffects = [0, 0];
var secondaryBeepSoundEffects = [0, 0];

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

var gameTitle = globalConfig.game_title;
var gameTitleShort = globalConfig.game_title_short;
var nextGameTitle = globalConfig.next_game_title;
var nextGameTitleShort = globalConfig.next_game_title_short;

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
  input_mode: 2
};

var advancedInputMetadata = {
  loop_macro: 0,
  macro_inputs_to_run: 0,
  current_macro_index_running: 0,
  times_to_loop: 0,
  loop_counter: 0,
  how_many_inner_loops_macro_has: 0,
  macro_metadata_index: 0,
  is_inner_loop: 0
};

var innerLoopMetadata = {
  inner_loop_inputs_to_run: 0,
  inner_loop_input_index: 0,
  inner_loop_times_to_repeat: 0,
  inner_loop_repeat_counter: 0,
  where_does_next_inner_loop_start_index: 0,
  where_does_inner_loop_start_index: 0,
  where_does_inner_loop_end_index: 0,
  how_many_inner_loops_to_execute_after_this: 0
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

var displayFramerate = false;

var frameDataToDisplayObject = {
  frame_count_to_display: 0,
  frame_rate_to_display: 0
};

var vibrationAndLedDataToDisplayObject = {
  motors_data: [
    0, 0, 0, 0
  ],
  leds_data: [
    0, 0, 0, 0
  ]
};

var minimumVibrationPosition = Math.ceil(-5);
var maximumVibrationPosition = Math.floor(5);
var vibrationXAxisPosition = 0;
var vibrationYAxisPosition = 0;
var isAnyMotorVibrating = false;
var vibrateCurrentInput = false;
var changeCurrentInputColor = false;
var colorToChangeCurrentInputTo = "#FFFFFFFF";

function preload() {
  //soundFormats("mp3");
  //font = loadFont("Pokemon_DPPt_mod2.ttf");
  font = loadFont(fontName);
  offlineImg = loadImage("tttp_brb_screen_lq.png");

  controllerMotorOnGraphics[0][0] = loadImage("placeholder.png"); // Motor 1 On // In this part of the code, these are all placeholders
  controllerMotorOnGraphics[1][0] = loadImage("placeholder.png"); // Motor 2 On
  controllerMotorOnGraphics[2][0] = loadImage("placeholder.png"); // Motor 3 On
  controllerMotorOnGraphics[3][0] = loadImage("placeholder.png"); // Motor 4 On

  controllerMotorOffGraphics[0] = loadImage("placeholder.png"); // Motor 1 Off
  controllerMotorOffGraphics[1] = loadImage("placeholder.png"); // Motor 2 Off
  controllerMotorOffGraphics[2] = loadImage("placeholder.png"); // Motor 3 Off
  controllerMotorOffGraphics[3] = loadImage("placeholder.png"); // Motor 4 Off

  controllerLedOnGraphics[0] = loadImage("placeholder.png"); // LED 1 On
  controllerLedOnGraphics[1] = loadImage("placeholder.png"); // LED 2 On
  controllerLedOnGraphics[2] = loadImage("placeholder.png"); // LED 3 On
  controllerLedOnGraphics[3] = loadImage("placeholder.png"); // LED 4 On

  controllerLedOffGraphics[0] = loadImage("placeholder.png"); // LED 1 Off
  controllerLedOffGraphics[1] = loadImage("placeholder.png"); // LED 2 Off
  controllerLedOffGraphics[2] = loadImage("placeholder.png"); // LED 3 Off
  controllerLedOffGraphics[3] = loadImage("placeholder.png"); // LED 4 Off

  hourlyBeepSoundEffects[0] = loadSound("watch_beep_1.mp3");
  hourlyBeepSoundEffects[1] = loadSound("watch_beep_2.mp3");

  secondaryBeepSoundEffects[0] = loadSound("watch_beep_1_short.mp3");
  secondaryBeepSoundEffects[1] = loadSound("watch_beep_2_short.mp3");
  if (controllerConfig.use_controller_graphics == true) {
    controllerGraphics = loadImage(controllerConfig.controller_graphics);
  }
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

function getRelativeTimeFromHelpMessageString(helpMessageInputString, timeToCountFromAsMilliseconds, displayMilliseconds, displayAlternateUnitAbbreviation) {
  let numberToExtractFromRelativeTime = helpMessageInputString.match(/({{relative_time:\d+}})+/ig);
  if (numberToExtractFromRelativeTime !== "" && numberToExtractFromRelativeTime !== undefined && numberToExtractFromRelativeTime !== null && numberToExtractFromRelativeTime !== [] && numberToExtractFromRelativeTime !== "[]" && numberToExtractFromRelativeTime !== {} && numberToExtractFromRelativeTime !== "{}" && numberToExtractFromRelativeTime !== "null" && numberToExtractFromRelativeTime !== "undefined") {
    if (numberToExtractFromRelativeTime.length > 0) {
      if (numberToExtractFromRelativeTime[0] !== "" && numberToExtractFromRelativeTime[0] !== undefined && numberToExtractFromRelativeTime[0] !== null && numberToExtractFromRelativeTime[0] !== [] && numberToExtractFromRelativeTime[0] !== "[]" && numberToExtractFromRelativeTime[0] !== {} && numberToExtractFromRelativeTime[0] !== "{}" && numberToExtractFromRelativeTime[0] !== "null" && numberToExtractFromRelativeTime[0] !== "undefined") {
        numberToExtractFromRelativeTime = numberToExtractFromRelativeTime[0].split(/\:+/ig);
        if (numberToExtractFromRelativeTime[1] !== "" && numberToExtractFromRelativeTime[1] !== undefined && numberToExtractFromRelativeTime[1] !== null && numberToExtractFromRelativeTime[1] !== [] && numberToExtractFromRelativeTime[1] !== "[]" && numberToExtractFromRelativeTime[1] !== {} && numberToExtractFromRelativeTime[1] !== "{}" && numberToExtractFromRelativeTime[1] !== "null" && numberToExtractFromRelativeTime[1] !== "undefined") {
          numberToExtractFromRelativeTime = numberToExtractFromRelativeTime[1];
          numberToExtractFromRelativeTime = numberToExtractFromRelativeTime.replace(/([\{\}])+/ig, "");
          if (numberToExtractFromRelativeTime.length > 0) {
            if (numberToExtractFromRelativeTime !== "" && numberToExtractFromRelativeTime !== undefined && numberToExtractFromRelativeTime !== null && numberToExtractFromRelativeTime !== [] && numberToExtractFromRelativeTime !== "[]" && numberToExtractFromRelativeTime !== {} && numberToExtractFromRelativeTime !== "{}" && numberToExtractFromRelativeTime !== "null" && numberToExtractFromRelativeTime !== "undefined") {
              numberToExtractFromRelativeTime = parseInt(numberToExtractFromRelativeTime);
              let checkIfnumberToExtractFromRelativeTimeIsNotANumber = isNaN(numberToExtractFromRelativeTime);
              if (checkIfnumberToExtractFromRelativeTimeIsNotANumber == false) {
                // Now we parse this number into usable timestamp
                let helpMessageRelativeTimeTotal = numberToExtractFromRelativeTime - timeToCountFromAsMilliseconds;
                helpMessageRelativeTimeTotal = Math.abs(helpMessageRelativeTimeTotal);
                let helpMessageRelativeTimeDays = (parseInt(helpMessageRelativeTimeTotal / 86400000)).toString().padStart(2, "0");
                let helpMessageRelativeTimeHours = (parseInt(helpMessageRelativeTimeTotal / 3600000) % 24).toString().padStart(2, "0");
                let helpMessageRelativeTimeMinutes = (parseInt(helpMessageRelativeTimeTotal / 60000) % 60).toString().padStart(2, "0");
                let helpMessageRelativeTimeSeconds = (parseInt(helpMessageRelativeTimeTotal / 1000) % 60).toString().padStart(2, "0");
                let helpMessageRelativeTimeMillis = (helpMessageRelativeTimeTotal % 1000).toString().padStart(3, "0");
                if (displayMilliseconds == true) {
                  if (displayAlternateUnitAbbreviation == true) {
                    let helpMessageRelativeTimeString = helpMessageRelativeTimeDays + "day " + helpMessageRelativeTimeHours + "hour " + helpMessageRelativeTimeMinutes + "min " + helpMessageRelativeTimeSeconds + "sec " + helpMessageRelativeTimeMillis + "msec";
                    helpMessageInputString = helpMessageInputString.replace(/({{relative_time:\d+}})+/ig, helpMessageRelativeTimeString);
                    return helpMessageInputString;
                  }
                  if (displayAlternateUnitAbbreviation == false) {
                    let helpMessageRelativeTimeString = helpMessageRelativeTimeDays + "d " + helpMessageRelativeTimeHours + "h " + helpMessageRelativeTimeMinutes + "m " + helpMessageRelativeTimeSeconds + "s " + helpMessageRelativeTimeMillis + "ms";
                    helpMessageInputString = helpMessageInputString.replace(/({{relative_time:\d+}})+/ig, helpMessageRelativeTimeString);
                    return helpMessageInputString;
                  }
                }
                if (displayMilliseconds == false) {
                  if (displayAlternateUnitAbbreviation == true) {
                    let helpMessageRelativeTimeString = helpMessageRelativeTimeDays + "day " + helpMessageRelativeTimeHours + "hour " + helpMessageRelativeTimeMinutes + "min " + helpMessageRelativeTimeSeconds + "sec";
                    helpMessageInputString = helpMessageInputString.replace(/({{relative_time:\d+}})+/ig, helpMessageRelativeTimeString);
                    return helpMessageInputString;
                  }
                  if (displayAlternateUnitAbbreviation == false) {
                    let helpMessageRelativeTimeString = helpMessageRelativeTimeDays + "d " + helpMessageRelativeTimeHours + "h " + helpMessageRelativeTimeMinutes + "m " + helpMessageRelativeTimeSeconds + "s";
                    helpMessageInputString = helpMessageInputString.replace(/({{relative_time:\d+}})+/ig, helpMessageRelativeTimeString);
                    return helpMessageInputString;
                  }
                }
              }
              if (checkIfnumberToExtractFromRelativeTimeIsNotANumber == true) {
                numberToExtractFromRelativeTime = 0;
                return helpMessageInputString;
              }
            }
            if (numberToExtractFromRelativeTime === "" || numberToExtractFromRelativeTime === undefined || numberToExtractFromRelativeTime === null || numberToExtractFromRelativeTime === [] || numberToExtractFromRelativeTime === "[]" || numberToExtractFromRelativeTime === {} || numberToExtractFromRelativeTime === "{}" || numberToExtractFromRelativeTime === "null" || numberToExtractFromRelativeTime === "undefined") {
              numberToExtractFromRelativeTime = 0;
              return helpMessageInputString;
            }
          }
          if (numberToExtractFromRelativeTime.length <= 0) {
            numberToExtractFromRelativeTime = 0;
            return helpMessageInputString;
          }
        }
        if (numberToExtractFromRelativeTime[1] === "" || numberToExtractFromRelativeTime[1] === undefined || numberToExtractFromRelativeTime[1] === null || numberToExtractFromRelativeTime[1] === [] || numberToExtractFromRelativeTime[1] === "[]" || numberToExtractFromRelativeTime[1] === {} || numberToExtractFromRelativeTime[1] === "{}" || numberToExtractFromRelativeTime[1] === "null" || numberToExtractFromRelativeTime[1] === "undefined") {
          numberToExtractFromRelativeTime = 0;
          return helpMessageInputString;
        }
      }
      if (numberToExtractFromRelativeTime[0] === "" || numberToExtractFromRelativeTime[0] === undefined || numberToExtractFromRelativeTime[0] === null || numberToExtractFromRelativeTime[0] === [] || numberToExtractFromRelativeTime[0] === "[]" || numberToExtractFromRelativeTime[0] === {} || numberToExtractFromRelativeTime[0] === "{}" || numberToExtractFromRelativeTime[0] === "null" || numberToExtractFromRelativeTime[0] === "undefined") {
        numberToExtractFromRelativeTime = 0;
        return helpMessageInputString;
      }
    }
    if (numberToExtractFromRelativeTime.length <= 0) {
      numberToExtractFromRelativeTime = 0
      return helpMessageInputString;
    }
  }
  if (numberToExtractFromRelativeTime === "" || numberToExtractFromRelativeTime === undefined || numberToExtractFromRelativeTime === null || numberToExtractFromRelativeTime === [] || numberToExtractFromRelativeTime === "[]" || numberToExtractFromRelativeTime === {} || numberToExtractFromRelativeTime === "{}" || numberToExtractFromRelativeTime === "null" || numberToExtractFromRelativeTime === "undefined") {
    numberToExtractFromRelativeTime = 0;
    return helpMessageInputString;
  }
  numberToExtractFromRelativeTime = 0;
  return helpMessageInputString;
}

function getPlayTimeFromHelpMessageString(helpMessageInputString, runStartTimeAsMilliseconds, displayMilliseconds, displayAlternateUnitAbbreviation) {
  let numberToExtractFromPlayTime = helpMessageInputString.match(/({{play_time:\d+}})+/ig);
  if (numberToExtractFromPlayTime !== "" && numberToExtractFromPlayTime !== undefined && numberToExtractFromPlayTime !== null && numberToExtractFromPlayTime !== [] && numberToExtractFromPlayTime !== "[]" && numberToExtractFromPlayTime !== {} && numberToExtractFromPlayTime !== "{}" && numberToExtractFromPlayTime !== "null" && numberToExtractFromPlayTime !== "undefined") {
    if (numberToExtractFromPlayTime.length > 0) {
      if (numberToExtractFromPlayTime[0] !== "" && numberToExtractFromPlayTime[0] !== undefined && numberToExtractFromPlayTime[0] !== null && numberToExtractFromPlayTime[0] !== [] && numberToExtractFromPlayTime[0] !== "[]" && numberToExtractFromPlayTime[0] !== {} && numberToExtractFromPlayTime[0] !== "{}" && numberToExtractFromPlayTime[0] !== "null" && numberToExtractFromPlayTime[0] !== "undefined") {
        numberToExtractFromPlayTime = numberToExtractFromPlayTime[0].split(/\:+/ig);
        if (numberToExtractFromPlayTime[1] !== "" && numberToExtractFromPlayTime[1] !== undefined && numberToExtractFromPlayTime[1] !== null && numberToExtractFromPlayTime[1] !== [] && numberToExtractFromPlayTime[1] !== "[]" && numberToExtractFromPlayTime[1] !== {} && numberToExtractFromPlayTime[1] !== "{}" && numberToExtractFromPlayTime[1] !== "null" && numberToExtractFromPlayTime[1] !== "undefined") {
          numberToExtractFromPlayTime = numberToExtractFromPlayTime[1];
          numberToExtractFromPlayTime = numberToExtractFromPlayTime.replace(/([\{\}])+/ig, "");
          if (numberToExtractFromPlayTime.length > 0) {
            if (numberToExtractFromPlayTime !== "" && numberToExtractFromPlayTime !== undefined && numberToExtractFromPlayTime !== null && numberToExtractFromPlayTime !== [] && numberToExtractFromPlayTime !== "[]" && numberToExtractFromPlayTime !== {} && numberToExtractFromPlayTime !== "{}" && numberToExtractFromPlayTime !== "null" && numberToExtractFromPlayTime !== "undefined") {
              numberToExtractFromPlayTime = parseInt(numberToExtractFromPlayTime);
              let checkIfnumberToExtractFromPlayTimeIsNotANumber = isNaN(numberToExtractFromPlayTime);
              if (checkIfnumberToExtractFromPlayTimeIsNotANumber == false) {
                // Now we parse this number into usable timestamp
                let helpMessagePlayTimeTotal = numberToExtractFromPlayTime - runStartTimeAsMilliseconds;
                helpMessagePlayTimeTotal = Math.abs(helpMessagePlayTimeTotal);
                let helpMessagePlayTimeDays = (parseInt(helpMessagePlayTimeTotal / 86400000)).toString().padStart(2, "0");
                let helpMessagePlayTimeHours = (parseInt(helpMessagePlayTimeTotal / 3600000) % 24).toString().padStart(2, "0");
                let helpMessagePlayTimeMinutes = (parseInt(helpMessagePlayTimeTotal / 60000) % 60).toString().padStart(2, "0");
                let helpMessagePlayTimeSeconds = (parseInt(helpMessagePlayTimeTotal / 1000) % 60).toString().padStart(2, "0");
                let helpMessagePlayTimeMillis = (helpMessagePlayTimeTotal % 1000).toString().padStart(3, "0");
                if (displayMilliseconds == true) {
                  if (displayAlternateUnitAbbreviation == true) {
                    let helpMessagePlayTimeString = helpMessagePlayTimeDays + "day " + helpMessagePlayTimeHours + "hour " + helpMessagePlayTimeMinutes + "min " + helpMessagePlayTimeSeconds + "sec " + helpMessagePlayTimeMillis + "msec";
                    helpMessageInputString = helpMessageInputString.replace(/({{play_time:\d+}})+/ig, helpMessagePlayTimeString);
                    return helpMessageInputString;
                  }
                  if (displayAlternateUnitAbbreviation == false) {
                    let helpMessagePlayTimeString = helpMessagePlayTimeDays + "d " + helpMessagePlayTimeHours + "h " + helpMessagePlayTimeMinutes + "m " + helpMessagePlayTimeSeconds + "s " + helpMessagePlayTimeMillis + "ms";
                    helpMessageInputString = helpMessageInputString.replace(/({{play_time:\d+}})+/ig, helpMessagePlayTimeString);
                    return helpMessageInputString;
                  }
                }
                if (displayMilliseconds == false) {
                  if (displayAlternateUnitAbbreviation == true) {
                    let helpMessagePlayTimeString = helpMessagePlayTimeDays + "day " + helpMessagePlayTimeHours + "hour " + helpMessagePlayTimeMinutes + "min " + helpMessagePlayTimeSeconds + "sec";
                    helpMessageInputString = helpMessageInputString.replace(/({{play_time:\d+}})+/ig, helpMessagePlayTimeString);
                    return helpMessageInputString;
                  }
                  if (displayAlternateUnitAbbreviation == false) {
                    let helpMessagePlayTimeString = helpMessagePlayTimeDays + "d " + helpMessagePlayTimeHours + "h " + helpMessagePlayTimeMinutes + "m " + helpMessagePlayTimeSeconds + "s";
                    helpMessageInputString = helpMessageInputString.replace(/({{play_time:\d+}})+/ig, helpMessagePlayTimeString);
                    return helpMessageInputString;
                  }
                }
              }
              if (checkIfnumberToExtractFromPlayTimeIsNotANumber == true) {
                numberToExtractFromPlayTime = 0;
                return helpMessageInputString;
              }
            }
            if (numberToExtractFromPlayTime === "" || numberToExtractFromPlayTime === undefined || numberToExtractFromPlayTime === null || numberToExtractFromPlayTime === [] || numberToExtractFromPlayTime === "[]" || numberToExtractFromPlayTime === {} || numberToExtractFromPlayTime === "{}" || numberToExtractFromPlayTime === "null" || numberToExtractFromPlayTime === "undefined") {
              numberToExtractFromPlayTime = 0;
              return helpMessageInputString;
            }
          }
          if (numberToExtractFromPlayTime.length <= 0) {
            numberToExtractFromPlayTime = 0;
            return helpMessageInputString;
          }
        }
        if (numberToExtractFromPlayTime[1] === "" || numberToExtractFromPlayTime[1] === undefined || numberToExtractFromPlayTime[1] === null || numberToExtractFromPlayTime[1] === [] || numberToExtractFromPlayTime[1] === "[]" || numberToExtractFromPlayTime[1] === {} || numberToExtractFromPlayTime[1] === "{}" || numberToExtractFromPlayTime[1] === "null" || numberToExtractFromPlayTime[1] === "undefined") {
          numberToExtractFromPlayTime = 0;
          return helpMessageInputString;
        }
      }
      if (numberToExtractFromPlayTime[0] === "" || numberToExtractFromPlayTime[0] === undefined || numberToExtractFromPlayTime[0] === null || numberToExtractFromPlayTime[0] === [] || numberToExtractFromPlayTime[0] === "[]" || numberToExtractFromPlayTime[0] === {} || numberToExtractFromPlayTime[0] === "{}" || numberToExtractFromPlayTime[0] === "null" || numberToExtractFromPlayTime[0] === "undefined") {
        numberToExtractFromPlayTime = 0;
        return helpMessageInputString;
      }
    }
    if (numberToExtractFromPlayTime.length <= 0) {
      numberToExtractFromPlayTime = 0
      return helpMessageInputString;
    }
  }
  if (numberToExtractFromPlayTime === "" || numberToExtractFromPlayTime === undefined || numberToExtractFromPlayTime === null || numberToExtractFromPlayTime === [] || numberToExtractFromPlayTime === "[]" || numberToExtractFromPlayTime === {} || numberToExtractFromPlayTime === "{}" || numberToExtractFromPlayTime === "null" || numberToExtractFromPlayTime === "undefined") {
    numberToExtractFromPlayTime = 0;
    return helpMessageInputString;
  }
  numberToExtractFromPlayTime = 0;
  return helpMessageInputString;
}

function getAbsoluteTimeAsISOStringFromHelpMessageString(helpMessageInputString, displayMilliseconds) {
  let numberToExtractFromAbsoluteTime = helpMessageInputString.match(/({{absolute_time:\d+}})+/ig);
  if (numberToExtractFromAbsoluteTime !== "" && numberToExtractFromAbsoluteTime !== undefined && numberToExtractFromAbsoluteTime !== null && numberToExtractFromAbsoluteTime !== [] && numberToExtractFromAbsoluteTime !== "[]" && numberToExtractFromAbsoluteTime !== {} && numberToExtractFromAbsoluteTime !== "{}" && numberToExtractFromAbsoluteTime !== "null" && numberToExtractFromAbsoluteTime !== "undefined") {
    if (numberToExtractFromAbsoluteTime.length > 0) {
      if (numberToExtractFromAbsoluteTime[0] !== "" && numberToExtractFromAbsoluteTime[0] !== undefined && numberToExtractFromAbsoluteTime[0] !== null && numberToExtractFromAbsoluteTime[0] !== [] && numberToExtractFromAbsoluteTime[0] !== "[]" && numberToExtractFromAbsoluteTime[0] !== {} && numberToExtractFromAbsoluteTime[0] !== "{}" && numberToExtractFromAbsoluteTime[0] !== "null" && numberToExtractFromAbsoluteTime[0] !== "undefined") {
        numberToExtractFromAbsoluteTime = numberToExtractFromAbsoluteTime[0].split(/\:+/ig);
        if (numberToExtractFromAbsoluteTime[1] !== "" && numberToExtractFromAbsoluteTime[1] !== undefined && numberToExtractFromAbsoluteTime[1] !== null && numberToExtractFromAbsoluteTime[1] !== [] && numberToExtractFromAbsoluteTime[1] !== "[]" && numberToExtractFromAbsoluteTime[1] !== {} && numberToExtractFromAbsoluteTime[1] !== "{}" && numberToExtractFromAbsoluteTime[1] !== "null" && numberToExtractFromAbsoluteTime[1] !== "undefined") {
          numberToExtractFromAbsoluteTime = numberToExtractFromAbsoluteTime[1];
          numberToExtractFromAbsoluteTime = numberToExtractFromAbsoluteTime.replace(/([\{\}])+/ig, "");
          if (numberToExtractFromAbsoluteTime.length > 0) {
            if (numberToExtractFromAbsoluteTime !== "" && numberToExtractFromAbsoluteTime !== undefined && numberToExtractFromAbsoluteTime !== null && numberToExtractFromAbsoluteTime !== [] && numberToExtractFromAbsoluteTime !== "[]" && numberToExtractFromAbsoluteTime !== {} && numberToExtractFromAbsoluteTime !== "{}" && numberToExtractFromAbsoluteTime !== "null" && numberToExtractFromAbsoluteTime !== "undefined") {
              numberToExtractFromAbsoluteTime = parseInt(numberToExtractFromAbsoluteTime);
              let checkIfNumberToExtractFromAbsoluteTimeIsNotANumber = isNaN(numberToExtractFromAbsoluteTime);
              if (checkIfNumberToExtractFromAbsoluteTimeIsNotANumber == false) {
                // Now we parse this number into usable timestamp
                if (displayMilliseconds == true) {
                  let numberToExtractFromAbsoluteTimeToISOString = new Date(numberToExtractFromAbsoluteTime).toISOString();
                  helpMessageInputString = helpMessageInputString.replace(/({{absolute_time:\d+}})+/ig, numberToExtractFromAbsoluteTimeToISOString);
                  return helpMessageInputString;
                }
                if (displayMilliseconds == false) {
                  let numberToExtractFromAbsoluteTimeToISOString = new Date(numberToExtractFromAbsoluteTime).toISOString().split(/\.+/ig)[0] + "Z";
                  helpMessageInputString = helpMessageInputString.replace(/({{absolute_time:\d+}})+/ig, numberToExtractFromAbsoluteTimeToISOString);
                  return helpMessageInputString;
                }
              }
              if (checkIfNumberToExtractFromAbsoluteTimeIsNotANumber == true) {
                numberToExtractFromAbsoluteTime = 0;
                return helpMessageInputString;
              }
            }
            if (numberToExtractFromAbsoluteTime === "" || numberToExtractFromAbsoluteTime === undefined || numberToExtractFromAbsoluteTime === null || numberToExtractFromAbsoluteTime === [] || numberToExtractFromAbsoluteTime === "[]" || numberToExtractFromAbsoluteTime === {} || numberToExtractFromAbsoluteTime === "{}" || numberToExtractFromAbsoluteTime === "null" || numberToExtractFromAbsoluteTime === "undefined") {
              numberToExtractFromAbsoluteTime = 0;
              return helpMessageInputString;
            }
          }
          if (numberToExtractFromAbsoluteTime.length <= 0) {
            numberToExtractFromAbsoluteTime = 0;
            return helpMessageInputString;
          }
        }
        if (numberToExtractFromAbsoluteTime[1] === "" || numberToExtractFromAbsoluteTime[1] === undefined || numberToExtractFromAbsoluteTime[1] === null || numberToExtractFromAbsoluteTime[1] === [] || numberToExtractFromAbsoluteTime[1] === "[]" || numberToExtractFromAbsoluteTime[1] === {} || numberToExtractFromAbsoluteTime[1] === "{}" || numberToExtractFromAbsoluteTime[1] === "null" || numberToExtractFromAbsoluteTime[1] === "undefined") {
          numberToExtractFromAbsoluteTime = 0;
          return helpMessageInputString;
        }
      }
      if (numberToExtractFromAbsoluteTime[0] === "" || numberToExtractFromAbsoluteTime[0] === undefined || numberToExtractFromAbsoluteTime[0] === null || numberToExtractFromAbsoluteTime[0] === [] || numberToExtractFromAbsoluteTime[0] === "[]" || numberToExtractFromAbsoluteTime[0] === {} || numberToExtractFromAbsoluteTime[0] === "{}" || numberToExtractFromAbsoluteTime[0] === "null" || numberToExtractFromAbsoluteTime[0] === "undefined") {
        numberToExtractFromAbsoluteTime = 0;
        return helpMessageInputString;
      }
    }
    if (numberToExtractFromAbsoluteTime.length <= 0) {
      numberToExtractFromAbsoluteTime = 0
      return helpMessageInputString;
    }
  }
  if (numberToExtractFromAbsoluteTime === "" || numberToExtractFromAbsoluteTime === undefined || numberToExtractFromAbsoluteTime === null || numberToExtractFromAbsoluteTime === [] || numberToExtractFromAbsoluteTime === "[]" || numberToExtractFromAbsoluteTime === {} || numberToExtractFromAbsoluteTime === "{}" || numberToExtractFromAbsoluteTime === "null" || numberToExtractFromAbsoluteTime === "undefined") {
    numberToExtractFromAbsoluteTime = 0;
    return helpMessageInputString;
  }
  numberToExtractFromAbsoluteTime = 0;
  return helpMessageInputString;
}

function setup() {
  noSmooth();
  frameRate(60);
  createCanvas(1024, 576);
  background("#00000000");
  socket = io.connect();
  socket.on("controller_config", function(data) {
    controllerConfig = data;

    if (controllerConfig.use_vibration_and_led_data == true) {
      for (let vibrationOptionsIndex = 0; vibrationOptionsIndex < controllerConfig.vibration_options.length; vibrationOptionsIndex++) {
        if (controllerConfig.vibration_options[vibrationOptionsIndex].display_motor == true) {
          for (let motorIconOnIndex = 0; motorIconOnIndex < controllerConfig.vibration_options[vibrationOptionsIndex].motor_icon_on.length; motorIconOnIndex++) {
            controllerMotorOnGraphics[vibrationOptionsIndex][motorIconOnIndex] = loadImage(controllerConfig.vibration_options[vibrationOptionsIndex].motor_icon_on[motorIconOnIndex]);
          }
          controllerMotorOffGraphics[vibrationOptionsIndex] = loadImage(controllerConfig.vibration_options[vibrationOptionsIndex].motor_icon_off);
        }
      }
      for (let ledOptionsIndex = 0; ledOptionsIndex < controllerConfig.led_options.length; ledOptionsIndex++) {
        if (controllerConfig.led_options[ledOptionsIndex].display_led == true) {
          controllerLedOnGraphics[ledOptionsIndex] = loadImage(controllerConfig.led_options[ledOptionsIndex].led_icon_on);
          controllerLedOffGraphics[ledOptionsIndex] = loadImage(controllerConfig.led_options[ledOptionsIndex].led_icon_off);
        }
      }
    }
    if (controllerConfig.use_controller_graphics == true) {
      controllerGraphics = loadImage(controllerConfig.controller_graphics);
    }
    //console.log("CONTROLLER CONFIG");
    //console.log(controllerConfig);
  });
  socket.on("global_config", function(data) {
    globalConfig = data;
    //console.log("GLOBAL CONFIG");
    //console.log(globalConfig);
  });
  socket.on("vibration_and_led_data_to_display_object", function(data) {
    vibrationAndLedDataToDisplayObject = data;
  });
  socket.on("frame_data_to_display_object", function(data) {
    frameDataToDisplayObject = data;
  });
  socket.on("display_framerate", function(data) {
    displayFramerate = data;
  });
  socket.on("input_counts_object", function(data) {
    inputCountsObject = data;
    //console.log(inputCountsObject);
  });
  socket.on("advanced_input_metadata", function(data) {
    //console.log(data);
    advancedInputMetadata = data;
    //console.log(advancedInputMetadata);
  });
  socket.on("inner_loop_metadata", function(data) {
    //console.log(data);
    innerLoopMetadata = data;
    //console.log(innerLoopMetadata);
  });
  socket.on("controller_graphics", function(data) {
    //console.log(data);
    if (controllerConfig.use_controller_graphics == true) {
      controllerGraphics = loadImage(data);
    }
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
  socket.on("game_title_short", function(data) {
    gameTitleShort = data;
  });
  socket.on("next_game_title", function(data) {
    nextGameTitle = data;
  });
  socket.on("next_game_title_short", function(data) {
    nextGameTitleShort = data;
  });
  socket.on("header_text", function(data) {
    headerText = data;
  });
  socket.on("advanced_mode_help_message_to_display", function(data) {
    advancedModeHelpMessageToDisplay = data;
  });
  socket.on("accept_inputs", function(data) {
    acceptInputs = data;
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
  socket.on("next_run_start_time", function(data) {
    nextStartTimeMillis = data;
  });
  socket.on("stream_end_time", function(data) {
    streamEndTimeMillis = data;
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
  isAnyMotorVibrating = false;
  vibrateCurrentInput = false;
  changeCurrentInputColor = false;
  colorToChangeCurrentInputTo = "#FFFFFFFF";
  vibrationXAxisPosition = 0;
  vibrationYAxisPosition = 0;
  currentTimeMillis = new Date().getTime();
  playTimeTotal = currentTimeMillis - globalConfig.run_start_time;
  //console.log(currentTimeMillis - globalConfig.run_start_time);
  let playTimeDays = (parseInt(playTimeTotal / 86400000)).toString().padStart(2, "0");
  let playTimeHours = (parseInt(playTimeTotal / 3600000) % 24).toString().padStart(2, "0");
  let playTimeMinutes = (parseInt(playTimeTotal / 60000) % 60).toString().padStart(2, "0");
  let playTimeSeconds = (parseInt(playTimeTotal / 1000) % 60).toString().padStart(2, "0");
  let playTimeMillis = (playTimeTotal % 1000).toString().padStart(3, "0");
  let playTimeString = playTimeDays + "d " + playTimeHours + "h " + playTimeMinutes + "m " + playTimeSeconds + "s " + playTimeMillis + "ms";
  let playTimeStringShort = playTimeDays + "d " + playTimeHours + "h " + playTimeMinutes + "m " + playTimeSeconds + "s " + playTimeMillis + "ms";
  let playTimeStringNoMillis = playTimeDays + "d " + playTimeHours + "h " + playTimeMinutes + "m " + playTimeSeconds + "s";
  //console.log(playTimeDays + "d" + playTimeHours + "h" + playTimeMinutes + "m" + playTimeSeconds + "s" + playTimeMillis + "ms");
  secondCurrent = new Date().getUTCSeconds();
  minuteCurrent = new Date().getUTCMinutes();
  hourCurrent = new Date().getUTCHours();
  //ttsAudioStatus = ttsAudio.isLoaded();
  //var inputToHighlight = 0;
  inputToHighlight = inputQueueLength - inputQueue.length;
  inputToHighlight = currentInputInQueue - inputToHighlight;

  let nextStartTimeISOString = new Date(globalConfig.next_run_start_time).toISOString();
  let nextStartTimeRemaining = currentTimeMillis - globalConfig.next_run_start_time;
  nextStartTimeRemaining = Math.abs(nextStartTimeRemaining);
  let nextStartTimeRemainingDays = (parseInt(nextStartTimeRemaining / 86400000)).toString().padStart(2, "0");
  let nextStartTimeRemainingHours = (parseInt(nextStartTimeRemaining / 3600000) % 24).toString().padStart(2, "0");
  let nextStartTimeRemainingMinutes = (parseInt(nextStartTimeRemaining / 60000) % 60).toString().padStart(2, "0");
  let nextStartTimeRemainingSeconds = (parseInt(nextStartTimeRemaining / 1000) % 60).toString().padStart(2, "0");
  let nextStartTimeRemainingMillis = (nextStartTimeRemaining % 1000).toString().padStart(3, "0");
  //let nextStartTimeRemainingString = nextStartTimeRemainingDays + "d " + nextStartTimeRemainingHours + "h " + nextStartTimeRemainingMinutes + "m " + nextStartTimeRemainingSeconds + "s " + nextStartTimeRemainingMillis + "ms";
  let nextStartTimeRemainingString = nextStartTimeRemainingDays + "d " + nextStartTimeRemainingHours + "h " + nextStartTimeRemainingMinutes + "m " + nextStartTimeRemainingSeconds + "s";

  let streamEndTimeISOString = new Date(globalConfig.stream_end_time).toISOString();
  let streamEndTimeRemaining = currentTimeMillis - globalConfig.stream_end_time;
  streamEndTimeRemaining = Math.abs(streamEndTimeRemaining);
  let streamEndTimeRemainingDays = (parseInt(streamEndTimeRemaining / 86400000)).toString().padStart(2, "0");
  let streamEndTimeRemainingHours = (parseInt(streamEndTimeRemaining / 3600000) % 24).toString().padStart(2, "0");
  let streamEndTimeRemainingMinutes = (parseInt(streamEndTimeRemaining / 60000) % 60).toString().padStart(2, "0");
  let streamEndTimeRemainingSeconds = (parseInt(streamEndTimeRemaining / 1000) % 60).toString().padStart(2, "0");
  let streamEndTimeRemainingMillis = (streamEndTimeRemaining % 1000).toString().padStart(3, "0");
  let streamEndTimeRemainingString = streamEndTimeRemainingDays + "d " + streamEndTimeRemainingHours + "h " + streamEndTimeRemainingMinutes + "m " + streamEndTimeRemainingSeconds + "s " + streamEndTimeRemainingMillis + "ms";

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
  //console.log(new Date(currentTimeMillis).toISOString() + " A " + textDefaultLeadingToUse);
  //text(playTimeString + "\n" + new Date(currentTimeMillis).toISOString(), 768, 551);
  if (socket.connected == true) {
    if (playTimeTotal >= 0 || acceptInputs == true) {
      if (controllerConfig.use_vibration_and_led_data == false) {
        vibrationXAxisPosition = 0;
        vibrationYAxisPosition = 0;
      }
      if (controllerConfig.use_vibration_and_led_data == true) {
        for (let motorsDataIndex = 0; motorsDataIndex < vibrationAndLedDataToDisplayObject.motors_data.length; motorsDataIndex++) {
          if (vibrationAndLedDataToDisplayObject.motors_data[motorsDataIndex] == 1) {
            isAnyMotorVibrating = true; // If at least one motor is vibrating, use this variable to generate a random value and use the same random value for all motors, which means only 1 random value is generated per frame, there is no need to have multiple random values for different motors
          }
        }
        if (isAnyMotorVibrating == false) {
          vibrationXAxisPosition = 0;
          vibrationYAxisPosition = 0;
        }
        if (isAnyMotorVibrating == true) {
          minimumVibrationPosition = Math.ceil(controllerConfig.vibration_negative_range_pixels);
          maximumVibrationPosition = Math.floor(controllerConfig.vibration_positive_range_pixels);
          vibrationXAxisPosition = Math.floor(Math.random() * (maximumVibrationPosition - minimumVibrationPosition + 1) + minimumVibrationPosition);
          vibrationYAxisPosition = Math.floor(Math.random() * (maximumVibrationPosition - minimumVibrationPosition + 1) + minimumVibrationPosition);
        }
        for (let vibrationOptionsIndex = 0; vibrationOptionsIndex < controllerConfig.vibration_options.length; vibrationOptionsIndex++) {
          if (controllerConfig.vibration_options[vibrationOptionsIndex].display_motor == true) {
            if (controllerConfig.vibration_options[vibrationOptionsIndex].motor_behavior == "vibrate_label") {
              recalculateFont(controllerConfig.vibration_options[vibrationOptionsIndex].motor_label_scale, controllerConfig.vibration_options[vibrationOptionsIndex].motor_label_scale / 2);
              textSize(textSizeToUse);
              strokeWeight(fontStrokeWeight);
              textLeading(textDefaultLeadingToUse);
              textAlign(LEFT, TOP);
              if (vibrationAndLedDataToDisplayObject.motors_data[vibrationOptionsIndex] <= 0) {
                fill(controllerConfig.vibration_options[vibrationOptionsIndex].motor_color_state_off);
                text(controllerConfig.vibration_options[vibrationOptionsIndex].motor_label_state_off, controllerConfig.vibration_options[vibrationOptionsIndex].motor_label_position[0], controllerConfig.vibration_options[vibrationOptionsIndex].motor_label_position[1]);
              }
              if (vibrationAndLedDataToDisplayObject.motors_data[vibrationOptionsIndex] > 0) {
                if (controllerConfig.vibration_options[vibrationOptionsIndex].enable_visual_vibration == false) {
                  fill(controllerConfig.vibration_options[vibrationOptionsIndex].motor_color_state_on);
                  text(controllerConfig.vibration_options[vibrationOptionsIndex].motor_label_state_on, controllerConfig.vibration_options[vibrationOptionsIndex].motor_label_position[0], controllerConfig.vibration_options[vibrationOptionsIndex].motor_label_position[1]);
                }
                if (controllerConfig.vibration_options[vibrationOptionsIndex].enable_visual_vibration == true) {
                  fill(controllerConfig.vibration_options[vibrationOptionsIndex].motor_color_state_on);
                  text(controllerConfig.vibration_options[vibrationOptionsIndex].motor_label_state_on, controllerConfig.vibration_options[vibrationOptionsIndex].motor_label_position[0] + vibrationXAxisPosition, controllerConfig.vibration_options[vibrationOptionsIndex].motor_label_position[1] + vibrationYAxisPosition);
                }
              }
            }
            if (controllerConfig.vibration_options[vibrationOptionsIndex].motor_behavior == "vibrate_icon") {
              if (vibrationAndLedDataToDisplayObject.motors_data[vibrationOptionsIndex] <= 0) {
                image(controllerMotorOffGraphics[vibrationOptionsIndex], controllerConfig.vibration_options[vibrationOptionsIndex].motor_icon_position[0], controllerConfig.vibration_options[vibrationOptionsIndex].motor_icon_position[1], controllerConfig.vibration_options[vibrationOptionsIndex].motor_icon_scale * (controllerMotorOffGraphics[vibrationOptionsIndex].width / controllerConfig.vibration_options[vibrationOptionsIndex].divisor_to_use_for_motor_icon), controllerConfig.vibration_options[vibrationOptionsIndex].motor_icon_scale * (controllerMotorOffGraphics[vibrationOptionsIndex].height / controllerConfig.vibration_options[vibrationOptionsIndex].divisor_to_use_for_motor_icon));
              }
              if (vibrationAndLedDataToDisplayObject.motors_data[vibrationOptionsIndex] > 0) {
                if (controllerConfig.vibration_options[vibrationOptionsIndex].enable_visual_vibration == false) {
                  let randomControllerMotorOnGraphicsIndex = Math.floor(Math.random() * controllerMotorOnGraphics[vibrationOptionsIndex].length);
                  image(controllerMotorOnGraphics[vibrationOptionsIndex][randomControllerMotorOnGraphicsIndex], controllerConfig.vibration_options[vibrationOptionsIndex].motor_icon_position[0], controllerConfig.vibration_options[vibrationOptionsIndex].motor_icon_position[1], controllerConfig.vibration_options[vibrationOptionsIndex].motor_icon_scale * (controllerMotorOnGraphics[vibrationOptionsIndex].width / controllerConfig.vibration_options[vibrationOptionsIndex].divisor_to_use_for_motor_icon), controllerConfig.vibration_options[vibrationOptionsIndex].motor_icon_scale * (controllerMotorOnGraphics[vibrationOptionsIndex].height / controllerConfig.vibration_options[vibrationOptionsIndex].divisor_to_use_for_motor_icon));
                }
                if (controllerConfig.vibration_options[vibrationOptionsIndex].enable_visual_vibration == true) {
                  let randomControllerMotorOnGraphicsIndex = Math.floor(Math.random() * controllerMotorOnGraphics[vibrationOptionsIndex].length);
                  image(controllerMotorOnGraphics[vibrationOptionsIndex][randomControllerMotorOnGraphicsIndex], controllerConfig.vibration_options[vibrationOptionsIndex].motor_icon_position[0] + vibrationXAxisPosition, controllerConfig.vibration_options[vibrationOptionsIndex].motor_icon_position[1] + vibrationYAxisPosition, controllerConfig.vibration_options[vibrationOptionsIndex].motor_icon_scale * (controllerMotorOnGraphics[vibrationOptionsIndex].width / controllerConfig.vibration_options[vibrationOptionsIndex].divisor_to_use_for_motor_icon), controllerConfig.vibration_options[vibrationOptionsIndex].motor_icon_scale * (controllerMotorOnGraphics[vibrationOptionsIndex].height / controllerConfig.vibration_options[vibrationOptionsIndex].divisor_to_use_for_motor_icon));
                }
              }
            }
            if (controllerConfig.vibration_options[vibrationOptionsIndex].motor_behavior == "vibrate_icon_and_label") {
              recalculateFont(controllerConfig.vibration_options[vibrationOptionsIndex].motor_label_scale, controllerConfig.vibration_options[vibrationOptionsIndex].motor_label_scale / 2);
              textSize(textSizeToUse);
              strokeWeight(fontStrokeWeight);
              textLeading(textDefaultLeadingToUse);
              textAlign(LEFT, TOP);
              if (vibrationAndLedDataToDisplayObject.motors_data[vibrationOptionsIndex] <= 0) {
                fill(controllerConfig.vibration_options[vibrationOptionsIndex].motor_color_state_off);
                text(controllerConfig.vibration_options[vibrationOptionsIndex].motor_label_state_off, controllerConfig.vibration_options[vibrationOptionsIndex].motor_label_position[0], controllerConfig.vibration_options[vibrationOptionsIndex].motor_label_position[1]);
                image(controllerMotorOffGraphics[vibrationOptionsIndex], controllerConfig.vibration_options[vibrationOptionsIndex].motor_icon_position[0], controllerConfig.vibration_options[vibrationOptionsIndex].motor_icon_position[1], controllerConfig.vibration_options[vibrationOptionsIndex].motor_icon_scale * (controllerMotorOffGraphics[vibrationOptionsIndex].width / controllerConfig.vibration_options[vibrationOptionsIndex].divisor_to_use_for_motor_icon), controllerConfig.vibration_options[vibrationOptionsIndex].motor_icon_scale * (controllerMotorOffGraphics[vibrationOptionsIndex].height / controllerConfig.vibration_options[vibrationOptionsIndex].divisor_to_use_for_motor_icon));
              }
              if (vibrationAndLedDataToDisplayObject.motors_data[vibrationOptionsIndex] > 0) {
                if (controllerConfig.vibration_options[vibrationOptionsIndex].enable_visual_vibration == false) {
                  let randomControllerMotorOnGraphicsIndex = Math.floor(Math.random() * controllerMotorOnGraphics[vibrationOptionsIndex].length);
                  fill(controllerConfig.vibration_options[vibrationOptionsIndex].motor_color_state_on);
                  text(controllerConfig.vibration_options[vibrationOptionsIndex].motor_label_state_on, controllerConfig.vibration_options[vibrationOptionsIndex].motor_label_position[0], controllerConfig.vibration_options[vibrationOptionsIndex].motor_label_position[1]);
                  image(controllerMotorOnGraphics[vibrationOptionsIndex][randomControllerMotorOnGraphicsIndex], controllerConfig.vibration_options[vibrationOptionsIndex].motor_icon_position[0], controllerConfig.vibration_options[vibrationOptionsIndex].motor_icon_position[1], controllerConfig.vibration_options[vibrationOptionsIndex].motor_icon_scale * (controllerMotorOnGraphics[vibrationOptionsIndex].width / controllerConfig.vibration_options[vibrationOptionsIndex].divisor_to_use_for_motor_icon), controllerConfig.vibration_options[vibrationOptionsIndex].motor_icon_scale * (controllerMotorOnGraphics[vibrationOptionsIndex].height / controllerConfig.vibration_options[vibrationOptionsIndex].divisor_to_use_for_motor_icon));
                }
                if (controllerConfig.vibration_options[vibrationOptionsIndex].enable_visual_vibration == true) {
                  let randomControllerMotorOnGraphicsIndex = Math.floor(Math.random() * controllerMotorOnGraphics[vibrationOptionsIndex].length);
                  fill(controllerConfig.vibration_options[vibrationOptionsIndex].motor_color_state_on);
                  text(controllerConfig.vibration_options[vibrationOptionsIndex].motor_label_state_on, controllerConfig.vibration_options[vibrationOptionsIndex].motor_label_position[0] + vibrationXAxisPosition, controllerConfig.vibration_options[vibrationOptionsIndex].motor_label_position[1] + vibrationYAxisPosition);
                  image(controllerMotorOnGraphics[vibrationOptionsIndex][randomControllerMotorOnGraphicsIndex], controllerConfig.vibration_options[vibrationOptionsIndex].motor_icon_position[0] + vibrationXAxisPosition, controllerConfig.vibration_options[vibrationOptionsIndex].motor_icon_position[1] + vibrationYAxisPosition, controllerConfig.vibration_options[vibrationOptionsIndex].motor_icon_scale * (controllerMotorOnGraphics[vibrationOptionsIndex].width / controllerConfig.vibration_options[vibrationOptionsIndex].divisor_to_use_for_motor_icon), controllerConfig.vibration_options[vibrationOptionsIndex].motor_icon_scale * (controllerMotorOnGraphics[vibrationOptionsIndex].height / controllerConfig.vibration_options[vibrationOptionsIndex].divisor_to_use_for_motor_icon));
                }
              }
            }
            if (controllerConfig.vibration_options[vibrationOptionsIndex].motor_behavior == "vibrate_current_input") {
              if (vibrationAndLedDataToDisplayObject.motors_data[vibrationOptionsIndex] <= 0) {
                vibrateCurrentInput = false;
                changeCurrentInputColor = false;
                colorToChangeCurrentInputTo = "#FFFFFFFF";
              }
              if (vibrationAndLedDataToDisplayObject.motors_data[vibrationOptionsIndex] > 0) {
                vibrateCurrentInput = true;
                changeCurrentInputColor = false;
                colorToChangeCurrentInputTo = "#FFFFFFFF";
              }
            }
            if (controllerConfig.vibration_options[vibrationOptionsIndex].motor_behavior == "vibrate_current_input_with_color_change") {
              if (vibrationAndLedDataToDisplayObject.motors_data[vibrationOptionsIndex] <= 0) {
                vibrateCurrentInput = false;
                changeCurrentInputColor = false;
                colorToChangeCurrentInputTo = controllerConfig.vibration_options[vibrationOptionsIndex].motor_color_state_off;
              }
              if (vibrationAndLedDataToDisplayObject.motors_data[vibrationOptionsIndex] > 0) {
                vibrateCurrentInput = true;
                changeCurrentInputColor = true;
                colorToChangeCurrentInputTo = controllerConfig.vibration_options[vibrationOptionsIndex].motor_color_state_on;
              }
            }
          }
        }
        for (let ledOptionsIndex = 0; ledOptionsIndex < controllerConfig.led_options.length; ledOptionsIndex++) {
          if (controllerConfig.led_options[ledOptionsIndex].display_led == true) {
            if (controllerConfig.led_options[ledOptionsIndex].led_behavior == "use_label") {
              recalculateFont(controllerConfig.led_options[ledOptionsIndex].led_label_scale, controllerConfig.led_options[ledOptionsIndex].led_label_scale / 2);
              textSize(textSizeToUse);
              strokeWeight(fontStrokeWeight);
              textLeading(textDefaultLeadingToUse);
              textAlign(LEFT, TOP);
              if (vibrationAndLedDataToDisplayObject.leds_data[ledOptionsIndex] <= 0) {
                fill(controllerConfig.led_options[ledOptionsIndex].led_color_state_off);
                text(controllerConfig.led_options[ledOptionsIndex].led_label_state_off, controllerConfig.led_options[ledOptionsIndex].led_label_position[0], controllerConfig.led_options[ledOptionsIndex].led_label_position[1]);
              }
              if (vibrationAndLedDataToDisplayObject.leds_data[ledOptionsIndex] > 0) {
                fill(controllerConfig.led_options[ledOptionsIndex].led_color_state_on);
                text(controllerConfig.led_options[ledOptionsIndex].led_label_state_on, controllerConfig.led_options[ledOptionsIndex].led_label_position[0], controllerConfig.led_options[ledOptionsIndex].led_label_position[1]);
              }
            }
            if (controllerConfig.led_options[ledOptionsIndex].led_behavior == "use_icon") {
              if (vibrationAndLedDataToDisplayObject.leds_data[ledOptionsIndex] <= 0) {
                image(controllerLedOffGraphics[ledOptionsIndex], controllerConfig.led_options[ledOptionsIndex].led_icon_position[0], controllerConfig.led_options[ledOptionsIndex].led_icon_position[1], controllerConfig.led_options[ledOptionsIndex].led_icon_scale * (controllerLedOffGraphics[ledOptionsIndex].width / controllerConfig.led_options[ledOptionsIndex].divisor_to_use_for_led_icon), controllerConfig.led_options[ledOptionsIndex].led_icon_scale * (controllerLedOffGraphics[ledOptionsIndex].height / controllerConfig.led_options[ledOptionsIndex].divisor_to_use_for_led_icon));
              }
              if (vibrationAndLedDataToDisplayObject.leds_data[ledOptionsIndex] > 0) {
                image(controllerLedOnGraphics[ledOptionsIndex], controllerConfig.led_options[ledOptionsIndex].led_icon_position[0], controllerConfig.led_options[ledOptionsIndex].led_icon_position[1], controllerConfig.led_options[ledOptionsIndex].led_icon_scale * (controllerLedOnGraphics[ledOptionsIndex].width / controllerConfig.led_options[ledOptionsIndex].divisor_to_use_for_led_icon), controllerConfig.led_options[ledOptionsIndex].led_icon_scale * (controllerLedOnGraphics[ledOptionsIndex].height / controllerConfig.led_options[ledOptionsIndex].divisor_to_use_for_led_icon));
              }
            }
            if (controllerConfig.led_options[ledOptionsIndex].led_behavior == "use_icon_and_label") {
              recalculateFont(controllerConfig.led_options[ledOptionsIndex].led_label_scale, controllerConfig.led_options[ledOptionsIndex].led_label_scale / 2);
              textSize(textSizeToUse);
              strokeWeight(fontStrokeWeight);
              textLeading(textDefaultLeadingToUse);
              textAlign(LEFT, TOP);
              if (vibrationAndLedDataToDisplayObject.leds_data[ledOptionsIndex] <= 0) {
                fill(controllerConfig.led_options[ledOptionsIndex].led_color_state_off);
                text(controllerConfig.led_options[ledOptionsIndex].led_label_state_off, controllerConfig.led_options[ledOptionsIndex].led_label_position[0], controllerConfig.led_options[ledOptionsIndex].led_label_position[1]);
                image(controllerLedOffGraphics[ledOptionsIndex], controllerConfig.led_options[ledOptionsIndex].led_icon_position[0], controllerConfig.led_options[ledOptionsIndex].led_icon_position[1], controllerConfig.led_options[ledOptionsIndex].led_icon_scale * (controllerLedOffGraphics[ledOptionsIndex].width / controllerConfig.led_options[ledOptionsIndex].divisor_to_use_for_led_icon), controllerConfig.led_options[ledOptionsIndex].led_icon_scale * (controllerLedOffGraphics[ledOptionsIndex].height / controllerConfig.led_options[ledOptionsIndex].divisor_to_use_for_led_icon));
              }
              if (vibrationAndLedDataToDisplayObject.leds_data[ledOptionsIndex] > 0) {
                image(controllerLedOnGraphics[ledOptionsIndex], controllerConfig.led_options[ledOptionsIndex].led_icon_position[0], controllerConfig.led_options[ledOptionsIndex].led_icon_position[1], controllerConfig.led_options[ledOptionsIndex].led_icon_scale * (controllerLedOnGraphics[ledOptionsIndex].width / controllerConfig.led_options[ledOptionsIndex].divisor_to_use_for_led_icon), controllerConfig.led_options[ledOptionsIndex].led_icon_scale * (controllerLedOnGraphics[ledOptionsIndex].height / controllerConfig.led_options[ledOptionsIndex].divisor_to_use_for_led_icon));
                fill(controllerConfig.led_options[ledOptionsIndex].led_color_state_on);
                text(controllerConfig.led_options[ledOptionsIndex].led_label_state_on, controllerConfig.led_options[ledOptionsIndex].led_label_position[0], controllerConfig.led_options[ledOptionsIndex].led_label_position[1]);
              }
            }
          }
        }
      }
      recalculateFont(2, 1);
      textSize(textSizeToUse);
      strokeWeight(fontStrokeWeight);
      textLeading(textDefaultLeadingToUse);
      fill("#FFFFFFFF");
      text(playTimeString + "\n" + new Date(currentTimeMillis).toISOString(), 768, 551);
      /*
      recalculateFont(4, 2);
      textSize(textSizeToUse);
      strokeWeight(fontStrokeWeight);
      stroke("#000000FF");
      textAlign(CENTER, TOP);
      fill("#FFFFFFFF");
      textLeading(textDefaultLeadingToUse);
      text(globalConfig.game_title + "\nstarts in " + playTimeString, 384, 288);
      */
    }
    if (playTimeTotal < 0) {
      playTimeTotal = Math.abs(playTimeTotal);
      playTimeDays = (parseInt(playTimeTotal / 86400000)).toString().padStart(2, "0");
      playTimeHours = (parseInt(playTimeTotal / 3600000) % 24).toString().padStart(2, "0");
      playTimeMinutes = (parseInt(playTimeTotal / 60000) % 60).toString().padStart(2, "0");
      playTimeSeconds = (parseInt(playTimeTotal / 1000) % 60).toString().padStart(2, "0");
      playTimeMillis = (playTimeTotal % 1000).toString().padStart(3, "0");
      playTimeString = playTimeDays + "day " + playTimeHours + "hour " + playTimeMinutes + "min " + playTimeSeconds + "sec " + playTimeMillis + "msec";
      playTimeStringShort = playTimeDays + "d " + playTimeHours + "h " + playTimeMinutes + "m " + playTimeSeconds + "s " + playTimeMillis + "ms";
      playTimeStringNoMillis = playTimeDays + "d " + playTimeHours + "h " + playTimeMinutes + "m " + playTimeSeconds + "s";
      if (acceptInputs == false) {
        recalculateFont(2, 1);
        textSize(textSizeToUse);
        strokeWeight(fontStrokeWeight);
        textLeading(textDefaultLeadingToUse);
        text("\n" + new Date(currentTimeMillis).toISOString(), 768, 551);
        recalculateFont(4, 2);
        textSize(textSizeToUse);
        strokeWeight(fontStrokeWeight);
        stroke("#000000FF");
        textAlign(CENTER, TOP);
        fill("#FFFFFFFF");
        textLeading(textDefaultLeadingToUse);
        text(globalConfig.game_title + "\nstarts in " + playTimeString, 384, 288);
      }
      if (acceptInputs == true) {
        recalculateFont(2, 1);
        textSize(textSizeToUse);
        strokeWeight(fontStrokeWeight);
        textLeading(textDefaultLeadingToUse);
        text("\n" + new Date(currentTimeMillis).toISOString(), 768, 551);
        /*
        recalculateFont(4, 2);
        textSize(textSizeToUse);
        strokeWeight(fontStrokeWeight);
        stroke("#000000FF");
        textAlign(CENTER, TOP);
        fill("#FFFFFFFF");
        textLeading(textDefaultLeadingToUse);
        text(globalConfig.game_title + "\nstarts in " + playTimeString, 384, 288);
        */
        if (advancedInputString == "") {
          if (voteDataObject.input_mode == 2) {
            recalculateFont(4, 2);
            textSize(textSizeToUse);
            strokeWeight(fontStrokeWeight);
            textAlign(CENTER, TOP);
            scale(0.5, 1);
            textLeading(textDefaultLeadingToUse);
            //text("Stream goes offline in\n" + streamEndTimeRemainingString + "\n(" + streamEndTimeISOString  + ")\n(The 31 day mark)\n\n Super Mario RPG:\nLegend of the Seven Stars\nStarts in\n" + nextStartTimeRemainingString + "\n(" + nextStartTimeISOString + ")", 896 * 2, 60);
            text(globalConfig.game_title_short + "\nstarts in\n" + playTimeStringShort, 896 * 2, 60);
            scale(2, 1);
          }
        }
      }
    }
    //recalculateFont(2, 1);
    //textSize(textSizeToUse);
    //strokeWeight(fontStrokeWeight);
    //text(new Date(currentTimeMillis).toISOString(), 768, 564);
    recalculateFont(3, 2);
    textAlign(LEFT, TOP);
    textSize(textSizeToUse);
    strokeWeight(fontStrokeWeight);
    textLeading(textDefaultLeadingToUse);
    //console.log(new Date(currentTimeMillis).toISOString() + " B " + textDefaultLeadingToUse);
    //text("Twitch Plays (Viewers play/Chat plays) Super Mario 64 on a\nreal N64 console, please don\'t delete any files", 2, 2);
    let headerText2 = globalConfig.overlay_header_text;
    headerText2 = headerText2.replace(/({{game_title}})+/ig, globalConfig.game_title);
    headerText2 = headerText2.replace(/({{game_title_short}})+/ig, globalConfig.game_title_short);
    headerText2 = headerText2.replace(/({{game_title_shorter}})+/ig, globalConfig.game_title_shorter);
    headerText2 = headerText2.replace(/({{game_title_shorter_2}})+/ig, globalConfig.game_title_shorter_2);
    headerText2 = headerText2.replace(/({{game_title_shorter_3}})+/ig, globalConfig.game_title_shorter_3);
    headerText2 = headerText2.replace(/({{next_game_title}})+/ig, globalConfig.next_game_title);
    headerText2 = headerText2.replace(/({{next_game_title_short}})+/ig, globalConfig.next_game_title_short);
    headerText2 = headerText2.replace(/({{next_game_title_shorter}})+/ig, globalConfig.next_game_title_shorter);
    headerText2 = headerText2.replace(/({{next_game_title_shorter_2}})+/ig, globalConfig.next_game_title_shorter_2);
    headerText2 = headerText2.replace(/({{next_game_title_shorter_3}})+/ig, globalConfig.next_game_title_shorter_3);
    text(headerText2, 2, 2);
  }
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
      input_mode: 2
    };
    
    advancedInputMetadata = {
      loop_macro: 0,
      macro_inputs_to_run: 0,
      current_macro_index_running: 0,
      times_to_loop: 0,
      loop_counter: 0,
      how_many_inner_loops_macro_has: 0,
      macro_metadata_index: 0,
      is_inner_loop: 0
    };

    innerLoopMetadata = {
      inner_loop_inputs_to_run: 0,
      inner_loop_input_index: 0,
      inner_loop_times_to_repeat: 0,
      inner_loop_repeat_counter: 0,
      where_does_next_inner_loop_start_index: 0,
      where_does_inner_loop_start_index: 0,
      where_does_inner_loop_end_index: 0,
      how_many_inner_loops_to_execute_after_this: 0
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

  if (globalConfig.overlay_text_rotation.length > 0) {
    if (secondCurrent != secondOld) {
      if (minuteCurrent != minuteOld) {
        if (globalConfig.overlay_enable_secondary_beeps == true) {
          if (minuteCurrent == 15 || minuteCurrent == 30 || minuteCurrent == 45) {
            if (secondaryBeepSoundEffects.length > 0) {
              let randomSecondaryBeepSoundEffectIndex = Math.floor(Math.random() * secondaryBeepSoundEffects.length);
              //console.log(new Date().toISOString() + " randomSecondaryBeepSoundEffectIndex = " + randomSecondaryBeepSoundEffectIndex);
              secondaryBeepSoundEffects[randomSecondaryBeepSoundEffectIndex].play();
            }
          }
        }
        if (globalConfig.overlay_enable_hourly_beeps == true) {
          if (minuteCurrent == 0) {
            if (hourCurrent != hourOld) {
              if (hourlyBeepSoundEffects.length > 0) {
                let randomHourlyBeepSoundEffectIndex = Math.floor(Math.random() * hourlyBeepSoundEffects.length);
                //console.log(new Date().toISOString() + " randomHourlyBeepSoundEffectIndex = " + randomHourlyBeepSoundEffectIndex);
                hourlyBeepSoundEffects[randomHourlyBeepSoundEffectIndex].play();
              }
            }
          }
        }
      }
      if (secondCurrent % 3 == 0) {
        currentValueToDisplay++;
        if (currentValueToDisplay > globalConfig.overlay_text_rotation.length - 1) {
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
      //console.log(new Date(currentTimeMillis).toISOString());
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
    if (globalConfig.overlay_text_rotation.length > 0) {
      let helpMessageToDisplay = globalConfig.overlay_text_rotation[currentValueToDisplay];
      helpMessageToDisplay = getAbsoluteTimeAsISOStringFromHelpMessageString(helpMessageToDisplay, false);
      helpMessageToDisplay = getPlayTimeFromHelpMessageString(helpMessageToDisplay, globalConfig.run_start_time, false, false);
      helpMessageToDisplay = getRelativeTimeFromHelpMessageString(helpMessageToDisplay, currentTimeMillis, false, false);
      helpMessageToDisplay = helpMessageToDisplay.replace(/({{game_title}})+/ig, globalConfig.game_title);
      helpMessageToDisplay = helpMessageToDisplay.replace(/({{game_title_short}})+/ig, globalConfig.game_title_short);
      helpMessageToDisplay = helpMessageToDisplay.replace(/({{game_title_shorter}})+/ig, globalConfig.game_title_shorter);
      helpMessageToDisplay = helpMessageToDisplay.replace(/({{game_title_shorter_2}})+/ig, globalConfig.game_title_shorter_2);
      helpMessageToDisplay = helpMessageToDisplay.replace(/({{game_title_shorter_3}})+/ig, globalConfig.game_title_shorter_3);
      helpMessageToDisplay = helpMessageToDisplay.replace(/({{current_time}})+/ig, new Date(currentTimeMillis).toISOString());
      helpMessageToDisplay = helpMessageToDisplay.replace(/({{play_time_total_string}})+/ig, playTimeString);
      helpMessageToDisplay = helpMessageToDisplay.replace(/({{current_time_no_millis}})+/ig, new Date(currentTimeMillis).toISOString().split(/\.+/ig)[0] + "Z");
      helpMessageToDisplay = helpMessageToDisplay.replace(/({{play_time_total_string_no_millis}})+/ig, playTimeStringNoMillis);
      helpMessageToDisplay = helpMessageToDisplay.replace(/({{next_game_title}})+/ig, globalConfig.next_game_title);
      helpMessageToDisplay = helpMessageToDisplay.replace(/({{next_game_title_short}})+/ig, globalConfig.next_game_title_short);
      helpMessageToDisplay = helpMessageToDisplay.replace(/({{next_game_title_shorter}})+/ig, globalConfig.next_game_title_shorter);
      helpMessageToDisplay = helpMessageToDisplay.replace(/({{next_game_title_shorter_2}})+/ig, globalConfig.next_game_title_shorter_2);
      helpMessageToDisplay = helpMessageToDisplay.replace(/({{next_game_title_shorter_3}})+/ig, globalConfig.next_game_title_shorter_3);
      helpMessageToDisplay = helpMessageToDisplay.replace(/({{next_run_start_time}})+/ig, nextStartTimeRemainingString + " (" + nextStartTimeISOString + ")");
      helpMessageToDisplay = helpMessageToDisplay.replace(/({{stream_end_time}})+/ig, streamEndTimeRemainingString + "\n(" + streamEndTimeISOString + ")");
      /*
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
        text(helpMessageToDisplay, 3, 573); 
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
        text(helpMessageToDisplay, 2, 574); 
      }
      */
      recalculateFont(3, 2);
      textFont(font);
      textSize(textSizeToUse);
      strokeWeight(fontStrokeWeight);
      stroke("#000000FF");
      textAlign(LEFT, BOTTOM);
      fill("#FFFFFFFF");
      textLeading(textDefaultLeadingToUse);
      text(helpMessageToDisplay, 2, 574); 
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
  //console.log(new Date(currentTimeMillis).toISOString() + " " + votingBarLeftEdgePosition + " " + votingBarSize);

  recalculateFont(3, 1);
  textFont(font);
  textSize(textSizeToUse);
  strokeWeight(fontStrokeWeight);
  stroke("#FFFFFFFF");
  textAlign(LEFT, TOP);
  fill("#00FF00FF");
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
    if (acceptInputs == true) {
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
    fill("#00FF00FF");
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
    if (acceptInputs == true) {
      if (basicInputString.length > 12) {
        textAlign(CENTER, TOP);
        scale(0.5, 1);
        textLeading(textDefaultLeadingToUse);
        if (vibrateCurrentInput == false) {
          text(basicInputString, (896 * 2), 306);
        }
        if (vibrateCurrentInput == true) {
          if (changeCurrentInputColor == true) {
            fill(colorToChangeCurrentInputTo);
          }
          text(basicInputString, (896 * 2) + vibrationXAxisPosition, 306 + vibrationYAxisPosition);
        }
        scale(2, 1);
      }
      if (basicInputString.length <= 12 && basicInputString.length > 0) {
        textAlign(CENTER, TOP);
        textLeading(textDefaultLeadingToUse);
        if (vibrateCurrentInput == false) {
          text(basicInputString, 896, 306);
        }
        if (vibrateCurrentInput == true) {
          if (changeCurrentInputColor == true) {
            fill(colorToChangeCurrentInputTo);
          }
          text(basicInputString, 896 + vibrationXAxisPosition, 306 + vibrationYAxisPosition);
        }
      }
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
    fill("#00FF00FF");
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
    if (advancedInputString == "") {
      if (acceptInputs == true) {
        textAlign(CENTER, TOP);
        scale(0.5, 1);
        textLeading(textDefaultLeadingToUse);
        //text("Stream goes offline in\n" + streamEndTimeRemainingString + "\n(" + streamEndTimeISOString  + ")\n(The 31 day mark)\n\n Super Mario RPG:\nLegend of the Seven Stars\nStarts in\n" + nextStartTimeRemainingString + "\n(" + nextStartTimeISOString + ")", 896 * 2, 60);
        let advancedModeHelpMessageToDisplay2 = globalConfig.overlay_advanced_mode_help_message_to_display;
        advancedModeHelpMessageToDisplay2 = getAbsoluteTimeAsISOStringFromHelpMessageString(advancedModeHelpMessageToDisplay2, true);
        advancedModeHelpMessageToDisplay2 = getPlayTimeFromHelpMessageString(advancedModeHelpMessageToDisplay2, globalConfig.run_start_time, false, false);
        advancedModeHelpMessageToDisplay2 = getRelativeTimeFromHelpMessageString(advancedModeHelpMessageToDisplay2, currentTimeMillis, false, false);
        advancedModeHelpMessageToDisplay2 = advancedModeHelpMessageToDisplay2.replace(/({{game_title}})+/ig, globalConfig.game_title);
        advancedModeHelpMessageToDisplay2 = advancedModeHelpMessageToDisplay2.replace(/({{game_title_short}})+/ig, globalConfig.game_title_short);
        advancedModeHelpMessageToDisplay2 = advancedModeHelpMessageToDisplay2.replace(/({{game_title_shorter}})+/ig, globalConfig.game_title_shorter);
        advancedModeHelpMessageToDisplay2 = advancedModeHelpMessageToDisplay2.replace(/({{game_title_shorter_2}})+/ig, globalConfig.game_title_shorter_2);
        advancedModeHelpMessageToDisplay2 = advancedModeHelpMessageToDisplay2.replace(/({{game_title_shorter_3}})+/ig, globalConfig.game_title_shorter_3);
        advancedModeHelpMessageToDisplay2 = advancedModeHelpMessageToDisplay2.replace(/({{current_time}})+/ig, new Date(currentTimeMillis).toISOString());
        advancedModeHelpMessageToDisplay2 = advancedModeHelpMessageToDisplay2.replace(/({{play_time_total_string}})+/ig, playTimeString);
        advancedModeHelpMessageToDisplay2 = advancedModeHelpMessageToDisplay2.replace(/({{current_time_no_millis}})+/ig, new Date(currentTimeMillis).toISOString().split(/\.+/ig)[0] + "Z");
        advancedModeHelpMessageToDisplay2 = advancedModeHelpMessageToDisplay2.replace(/({{play_time_total_string_no_millis}})+/ig, playTimeStringNoMillis);
        advancedModeHelpMessageToDisplay2 = advancedModeHelpMessageToDisplay2.replace(/({{next_game_title}})+/ig, globalConfig.next_game_title);
        advancedModeHelpMessageToDisplay2 = advancedModeHelpMessageToDisplay2.replace(/({{next_game_title_short}})+/ig, globalConfig.next_game_title_short);
        advancedModeHelpMessageToDisplay2 = advancedModeHelpMessageToDisplay2.replace(/({{next_game_title_shorter}})+/ig, globalConfig.next_game_title_shorter);
        advancedModeHelpMessageToDisplay2 = advancedModeHelpMessageToDisplay2.replace(/({{next_game_title_shorter_2}})+/ig, globalConfig.next_game_title_shorter_2);
        advancedModeHelpMessageToDisplay2 = advancedModeHelpMessageToDisplay2.replace(/({{next_game_title_shorter_3}})+/ig, globalConfig.next_game_title_shorter_3);
        advancedModeHelpMessageToDisplay2 = advancedModeHelpMessageToDisplay2.replace(/({{next_run_start_time}})+/ig, nextStartTimeRemainingString + "\n(" + nextStartTimeISOString + ")");
        advancedModeHelpMessageToDisplay2 = advancedModeHelpMessageToDisplay2.replace(/({{stream_end_time}})+/ig, streamEndTimeRemainingString + "\n(" + streamEndTimeISOString + ")");
        //console.log(globalConfig.overlay_advanced_mode_help_message_to_display);
        //console.log(advancedModeHelpMessageToDisplay2);
        text(advancedModeHelpMessageToDisplay2, (896 * 2), 60);
        scale(2, 1);
      }
    }
    if (advancedInputString != "") {
      if (acceptInputs == true) {
        if (advancedInputMetadata.is_inner_loop == 0) {
          if (advancedInputMetadata.loop_macro == 0) {
            textAlign(CENTER, TOP);
            textLeading(textDefaultLeadingToUse);
            if (vibrateCurrentInput == false) {
              text("Input\n" + advancedInputMetadata.current_macro_index_running + "/" + advancedInputMetadata.macro_inputs_to_run, 896, 100);
            }
            if (vibrateCurrentInput == true) {
              if (changeCurrentInputColor == true) {
                fill(colorToChangeCurrentInputTo);
              }
              text("Input\n" + advancedInputMetadata.current_macro_index_running + "/" + advancedInputMetadata.macro_inputs_to_run, 896 + vibrationXAxisPosition, 100 + vibrationYAxisPosition);
            }
          }
          if (advancedInputMetadata.loop_macro == 1) {
            textAlign(CENTER, TOP);
            textLeading(textDefaultLeadingToUse);
            if (vibrateCurrentInput == false) {
              text("Input\n" + (advancedInputMetadata.current_macro_index_running + 1) + "/" + advancedInputMetadata.macro_inputs_to_run + "\n\nLoop\n" + advancedInputMetadata.loop_counter + "/" + (advancedInputMetadata.times_to_loop + 1), 896, 100);
            }
            if (vibrateCurrentInput == true) {
              if (changeCurrentInputColor == true) {
                fill(colorToChangeCurrentInputTo);
              }
              text("Input\n" + (advancedInputMetadata.current_macro_index_running + 1) + "/" + advancedInputMetadata.macro_inputs_to_run + "\n\nLoop\n" + advancedInputMetadata.loop_counter + "/" + (advancedInputMetadata.times_to_loop + 1), 896 + vibrationXAxisPosition, 100 + vibrationYAxisPosition);
            }
          }
          if (advancedInputString.length > 12) {
            textAlign(CENTER, TOP);
            scale(0.5, 1);
            textLeading(textDefaultLeadingToUse);
            if (vibrateCurrentInput == false) {
              text("\n" + advancedInputString, (896 * 2), 224);
            }
            if (vibrateCurrentInput == true) {
              if (changeCurrentInputColor == true) {
                fill(colorToChangeCurrentInputTo);
              }
              text("\n" + advancedInputString, (896 * 2) + vibrationXAxisPosition, 224 + vibrationYAxisPosition);
            }
            scale(2, 1);
          }
          if (advancedInputString.length <= 12 && advancedInputString.length > 0) {
            textAlign(CENTER, TOP);
            textLeading(textDefaultLeadingToUse);
            if (vibrateCurrentInput == false) {
              text("\n" + advancedInputString, 896, 224);
            }
            if (vibrateCurrentInput == true) {
              if (changeCurrentInputColor == true) {
                fill(colorToChangeCurrentInputTo);
              }
              text("\n" + advancedInputString, 896 + vibrationXAxisPosition, 224 + vibrationYAxisPosition);
            }
          }
        }
        if (advancedInputMetadata.is_inner_loop == 1) {
          let innerLoopCurrentInputIndex = innerLoopMetadata.inner_loop_input_index - innerLoopMetadata.where_does_inner_loop_start_index;
          if (innerLoopCurrentInputIndex <= 0) {
            innerLoopCurrentInputIndex = 0;
          }
          if (advancedInputMetadata.loop_macro == 0) {
            textAlign(CENTER, TOP);
            textLeading(textDefaultLeadingToUse);
            if (vibrateCurrentInput == false) {
              text("Input\n" + (advancedInputMetadata.current_macro_index_running + 1) + "/" + advancedInputMetadata.macro_inputs_to_run + "\nInner Input\n" + (innerLoopCurrentInputIndex + 1) + "/" + innerLoopMetadata.inner_loop_inputs_to_run + "\nI. Loop\n" + (advancedInputMetadata.macro_metadata_index + 1) + "/" + (advancedInputMetadata.how_many_inner_loops_macro_has) + "\nI. Loop Count\n" + (innerLoopMetadata.inner_loop_repeat_counter) + "/" + (innerLoopMetadata.inner_loop_times_to_repeat), 896, 60);
            }
            if (vibrateCurrentInput == true) {
              if (changeCurrentInputColor == true) {
                fill(colorToChangeCurrentInputTo);
              }
              text("Input\n" + (advancedInputMetadata.current_macro_index_running + 1) + "/" + advancedInputMetadata.macro_inputs_to_run + "\nInner Input\n" + (innerLoopCurrentInputIndex + 1) + "/" + innerLoopMetadata.inner_loop_inputs_to_run + "\nI. Loop\n" + (advancedInputMetadata.macro_metadata_index + 1) + "/" + (advancedInputMetadata.how_many_inner_loops_macro_has) + "\nI. Loop Count\n" + (innerLoopMetadata.inner_loop_repeat_counter) + "/" + (innerLoopMetadata.inner_loop_times_to_repeat), 896 + vibrationXAxisPosition, 60 + vibrationYAxisPosition);
            }
          }
          if (advancedInputMetadata.loop_macro == 1) {
            textAlign(CENTER, TOP);
            textLeading(textDefaultLeadingToUse);
            if (vibrateCurrentInput == false) {
              text("Input\n" + (advancedInputMetadata.current_macro_index_running + 1) + "/" + advancedInputMetadata.macro_inputs_to_run + "\nLoop\n" + advancedInputMetadata.loop_counter + "/" + (advancedInputMetadata.times_to_loop + 1) + "\nInner Input\n" + (innerLoopCurrentInputIndex + 1) + "/" + innerLoopMetadata.inner_loop_inputs_to_run + "\nI. Loop\n" + (advancedInputMetadata.macro_metadata_index + 1) + "/" + (advancedInputMetadata.how_many_inner_loops_macro_has) + "\nI. Loop Count\n" + (innerLoopMetadata.inner_loop_repeat_counter) + "/" + (innerLoopMetadata.inner_loop_times_to_repeat), 896, 40);            
            }
            if (vibrateCurrentInput == true) {
              if (changeCurrentInputColor == true) {
                fill(colorToChangeCurrentInputTo);
              }
              text("Input\n" + (advancedInputMetadata.current_macro_index_running + 1) + "/" + advancedInputMetadata.macro_inputs_to_run + "\nLoop\n" + advancedInputMetadata.loop_counter + "/" + (advancedInputMetadata.times_to_loop + 1) + "\nInner Input\n" + (innerLoopCurrentInputIndex + 1) + "/" + innerLoopMetadata.inner_loop_inputs_to_run + "\nI. Loop\n" + (advancedInputMetadata.macro_metadata_index + 1) + "/" + (advancedInputMetadata.how_many_inner_loops_macro_has) + "\nI. Loop Count\n" + (innerLoopMetadata.inner_loop_repeat_counter) + "/" + (innerLoopMetadata.inner_loop_times_to_repeat), 896 + vibrationXAxisPosition, 40 + vibrationYAxisPosition);            
            }
          }
          if (advancedInputString.length > 12) {
            textAlign(CENTER, TOP);
            scale(0.5, 1);
            textLeading(textDefaultLeadingToUse);
            if (vibrateCurrentInput == false) {
              text("\n" + advancedInputString, (896 * 2), 266);
            }
            if (vibrateCurrentInput == true) {
              if (changeCurrentInputColor == true) {
                fill(colorToChangeCurrentInputTo);
              }
              text("\n" + advancedInputString, (896 * 2) + vibrationXAxisPosition, 266 + vibrationYAxisPosition);
            }
            scale(2, 1);
          }
          if (advancedInputString.length <= 12 && advancedInputString.length > 0) {
            textAlign(CENTER, TOP);
            textLeading(textDefaultLeadingToUse);
            if (vibrateCurrentInput == false) {
              text("\n" + advancedInputString, 896, 266);
            }
            if (vibrateCurrentInput == true) {
              if (changeCurrentInputColor == true) {
                fill(colorToChangeCurrentInputTo);
              }
              text("\n" + advancedInputString, 896 + vibrationXAxisPosition, 266 + vibrationYAxisPosition);
            }
          }
        }
      }
    }
  }

  recalculateFont(3, 1);
  textSize(textSizeToUse);
  strokeWeight(fontStrokeWeight);
  stroke("#000000FF");
  textAlign(LEFT, TOP); // 4x5 font isn't kind to CENTER, LEFT, text gets blurry, so I have to do LEFT, TOP and kinda hardcode the text position so it looks like it is centered, ugly hack but it works
  fill("#FFFFFFFF");
  if (globalConfig.get_stream_viewer_count == true) {
    if (viewerCount < 0) {
      textLeading(textDefaultLeadingToUse);
      if (controllerConfig.display_framerate == true) {
        text("OFFLINE    " + frameDataToDisplayObject.frame_rate_to_display + "fps", 768, 346);
      }
      if (controllerConfig.display_framerate == false) {
        text("OFFLINE", 768, 346);
      }
    }
    if (viewerCount == 0) {
      textLeading(textDefaultLeadingToUse);
      if (controllerConfig.display_framerate == true) {
        text(viewerCount + " Viewers    " + frameDataToDisplayObject.frame_rate_to_display + "fps", 768, 346);
      }
      if (controllerConfig.display_framerate == false) {
        text(viewerCount + " Viewers", 768, 346);
      }
    }
    if (viewerCount == 1) {
      textLeading(textDefaultLeadingToUse);
      if (controllerConfig.display_framerate == true) {
        text(viewerCount + " Viewer    " + frameDataToDisplayObject.frame_rate_to_display + "fps", 768, 346);
      }
      if (controllerConfig.display_framerate == false) {
        text(viewerCount + " Viewer", 768, 346);
      }
    }
    if (viewerCount > 1) {
      textLeading(textDefaultLeadingToUse);
      if (controllerConfig.display_framerate == true) {
        text(viewerCount + " Viewers    " + frameDataToDisplayObject.frame_rate_to_display + "fps", 768, 346);
      }
      if (controllerConfig.display_framerate == false) {
        text(viewerCount + " Viewers", 768, 346);
      }
    }
  }
  if (globalConfig.get_stream_viewer_count == false) {
    if (viewerCount < 0) {
      textLeading(textDefaultLeadingToUse);
      if (controllerConfig.display_framerate == true) {
        text(frameDataToDisplayObject.frame_rate_to_display + "fps", 768, 346);
      }
      if (controllerConfig.display_framerate == false) {
        //text("OFFLINE", 768, 346);
      }
    }
    if (viewerCount == 0) {
      textLeading(textDefaultLeadingToUse);
      if (controllerConfig.display_framerate == true) {
        text(frameDataToDisplayObject.frame_rate_to_display + "fps", 768, 346);
      }
      if (controllerConfig.display_framerate == false) {
        //text(viewerCount + " Viewers", 768, 346);
      }
    }
    if (viewerCount == 1) {
      textLeading(textDefaultLeadingToUse);
      if (controllerConfig.display_framerate == true) {
        text(frameDataToDisplayObject.frame_rate_to_display + "fps", 768, 346);
      }
      if (controllerConfig.display_framerate == false) {
        //text(viewerCount + " Viewer", 768, 346);
      }
    }
    if (viewerCount > 1) {
      textLeading(textDefaultLeadingToUse);
      if (controllerConfig.display_framerate == true) {
        text(frameDataToDisplayObject.frame_rate_to_display + "fps", 768, 346);
      }
      if (controllerConfig.display_framerate == false) {
        //text(viewerCount + " Viewers", 768, 346);
      }
    }
  }
  //tint(255, 127);
  if (controllerConfig.use_controller_graphics == true) {
    //image(controllerGraphics, 40, 40, 13, 19, 13, 50, 13, 19); // Position X on Canvas, Position Y on Canvas, Width on Canvas, Height on Canvas, Origin X on Image, Origin Y on Image, Width on image, Height on Image    
  }
  secondOld = secondCurrent;
  minuteOld = minuteCurrent;
  hourOld = hourCurrent;
  isTtsBusyPrevious = isTtsBusy;
  //ttsAudioStatusPrevious = ttsAudioStatus;
}