/*
var testNumber = (0).toString(2);
while (testNumber.length < 8) {
  console.log(testNumber.length);
  console.log(testNumber);
  testNumber = testNumber.concat(0);
  console.log(testNumber.length);
  console.log(testNumber);
}
*/

var serverStartTime = new Date().getTime();

var tmi = require("tmi.js");
var SerialPort = require("serialport");
var fs = require("fs");
var cmd = require("node-cmd");
var sound = require("sound-play");
var getMP3Duration = require("get-mp3-duration");
var http = require("http");
var https = require("https")
var url = require("url");
var path = require("path");
var mongoClient = require("mongodb").MongoClient;
var mongoUrl = "mongodb://127.0.0.1/";

var globalConfig = JSON.parse(fs.readFileSync("global.json", "utf8")); // Contains Web server settings, which controller to use, which chat settings to use
var controllerConfig = JSON.parse(fs.readFileSync(globalConfig.controller_config, "utf8")); // Contains COM port settings, which controller object file to load, help message for that controller, simultaneous basic different button presses allowed
var controllerObject = JSON.parse(fs.readFileSync(controllerConfig.controller_object, "utf8")); // Contains the controller object itself
var chatConfig = JSON.parse(fs.readFileSync(globalConfig.chat_config, "utf8")); // Contains chat settings, what account to use, what oauth, what channels to join
var twitchCredentials = JSON.parse(fs.readFileSync("twitch_credentials.json", "utf8")); // Contains Twitch Credentials used to generate OAuth 2.0 Tokens as well as the Channel ID, which is used to update channel information such as stream title
var twitchJsonEncodedAppAccessToken = {}; // Object returned from the Twitch API which contains the OAuth 2.0 Token that was generated using the Twitch Credentials, as mentioned above, this OAuth 2.0 token is used to make API calls to twitch. This Object isn't changes every time the server starts.
//console.log(JSON.stringify(controllerConfig, null, 2));
var helpMessageCooldown = 0;
var runStartTime = globalConfig.run_start_time;
var nextRunStartTime = globalConfig.next_run_start_time;
var streamEndTime = globalConfig.stream_end_time;
var currentTime = new Date().getTime();
var oldTime = new Date().getTime();
var advancedAllowed = 0; // Advanced mode can be used until the current time in milliseconds is higher than this number
var votingAllowed = 0; // Voting will be allowed after the current time in milliseconds is higher than this number
var channelToSendMessageTo = chatConfig.main_channel;
var stopCheckingRunStartTime = false;
var chatLoggerReconnectAttempts = 0;
var clientReconnectAttempts = 0;
//var settableMacroChain = new Array(64);
//settableMacroChain.fill(undefined);
//console.log(settableMacroChain);
var settableMacroChain = [];
//settableMacroChain.fill(undefined);
//console.log(settableMacroChain);

var neutralController;
var isControllerBusy = false;
var isTtsBusy = false;
var isControllerBusyPrevious = false;
var isTtsBusyPrevious = false;
var inputQueue = [];

var currentInputInQueue = 0;
var currentInputInQueuePrevious = 0;
var inputsAllowed = controllerConfig.simultaneous_different_basic_buttons_allowed;
var precisionInputsAllowed = controllerConfig.simultaneous_different_advanced_buttons_allowed;
var defaultColors = ["#0000FF", "#8A2BE2", "#5F9EA0", "#D2691E", "#FF7F50", "#1E90FF", "#B22222", "#DAA520", "#008000", "#FF69B4", "#FF4500", "#FF0000", "#2E8B57", "#00FF7F", "#9ACD32"];
var defaultColorNames = ["Blue", "BlueViolet", "CadetBlue", "Chocolate", "Coral", "DodgerBlue", "Firebrick", "GoldenRod", "Green", "HotPink", "OrangeRed", "Red", "SeaGreen", "SpringGreen", "YellowGreen"];

var usersWhoDontHaveColor = [];

//var helpMessage = "Valid inputs are a, b, z, l, r, start, cup, cdown, cleft, cright, dup, ddown, dleft, dright, up, down, left and right. Type \"!speak <message>\" to talk to Pikachu: \"!speak Thunderbolt\" will make Pikachu use Thunderbolt. Directions can be replaced with cardinal directions (n, s, w, e). Up to 3 buttons can be pressed simultaneously: b+up+right. End your input with \"-\" to hold the buttons down."
//var helpMessage = "Valid inputs are a, b, z, l, r, start, cup, cdown, cleft, cright, dup, ddown, dleft, dright, up, down, left and right. Typos work too! Directions can be replaced with cardinal directions (n, s, w, e, north, south, west, east). Up to 3 buttons can be pressed simultaneously: \"b+up+right\". End your input with \"-\" to hold the buttons down for a longer (hold indefinitely until the next input comes) period than normal (266 milliseconds): \"a+z+right-\". Commands are not case sensitive: Typing \"left\" and \"lEft\" have the same effect."
var helpMessageBasic = controllerConfig.help_message_basic;
var helpMessageAdvanced = controllerConfig.help_message_advanced;

var acceptInputs = globalConfig.initial_accept_inputs;
var acceptTts = globalConfig.initial_accept_tts;

var inputMode = globalConfig.initial_input_mode; // Modes are 0 = anarchy (Normal mode), 1 = democracy (people vote for the next input), 2 = TAS or Advanced Mode (Used for making macros, and doing very precise movements, very precise timings, etc)
var inputModePrevious = 0;
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

var inputCountsObject = {
  run_id: 0,
  basic_inputs_sent: 0,
  advanced_inputs_sent: 0,
  total_inputs_sent: 0,
  basic_inputs_executed: 0,
  advanced_inputs_executed: 0,
  total_inputs_executed: 0
};

var modeVotes = [];
var basicVoteCount = 0;
var advancedVoteCount = 0;
var thresholdToChangeMode = globalConfig.threshold_to_change_mode; // 75% of votes needed to change mode, doesn't matter what vote, 75% or more advanced votes to change to advanced, 75% or more basic votes to change to basic
var totalVotes = advancedVoteCount + basicVoteCount;
var advancedVoteCountRatio = (advancedVoteCount / totalVotes);
var basicVoteCountRatio = (basicVoteCount / totalVotes);

var basicVoteCountPrevious = 0;
var advancedVoteCountPrevious = 0;
var totalVotesPrevious = 0;

var advancedInputsToUse = 0;
var advancedInputsMacrosAllowed = controllerConfig.advanced_input_macros_allowed;
var inputsSent = 0;

var endInputString = "";
var basicInputString = "";
var advancedInputString = "";
var advancedInputMetadata = {
  loop_macro: 0,
  macro_inputs_to_run: 0,
  current_macro_index_running: 0,
  times_to_loop: 0,
  loop_counter: 0
};

var server = http.createServer(handleRequest);
server.listen(globalConfig.webserver_port);

console.log("Server started on port " + globalConfig.webserver_port);

function handleRequest(req, res) {
  // What did we request?
  var pathname = req.url;

  // If blank let's ask for index.html
  if (pathname == '/') {
    pathname = '/index.html';
  }

  // Ok what's our file extension
  var ext = path.extname(pathname);

  // Map extension to file type
  var typeExt = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".ttf": "font/ttf",
    ".ico": "image/vnd.microsoft.icon",
    ".mp3": "audio/mpeg",
    ".png": "image/png",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg"
  };

  // What is it?  Default to plain text
  var contentType = typeExt[ext] || "text/plain";

  // User file system module
  fs.readFile(__dirname + pathname,
    // Callback function for reading
    function(err, data) {
      // if there is an error
      if (err) {
        res.writeHead(500);
        return res.end('Error loading ' + pathname);
      }
      // Otherwise, send the data, the contents of the file
      res.writeHead(200, {
        'Content-Type': contentType
      });
      res.end(data);
    }
  );
}


// WebSocket Portion
// WebSockets work with the HTTP server
var io = require("socket.io").listen(server);

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection',
  // We are given a websocket object in our function
  function(socket) {

    console.log("We have a new client: " + socket.id);

    globalConfig = JSON.parse(fs.readFileSync("global.json", "utf8")); // Contains Web server settings, which controller to use, which chat settings to use
    controllerConfig = JSON.parse(fs.readFileSync(globalConfig.controller_config, "utf8")); // Contains COM port settings, which controller object file to load, help message for that controller, simultaneous basic different button presses allowed
    controllerObject = JSON.parse(fs.readFileSync(controllerConfig.controller_object, "utf8")); // Contains the controller object itself
    chatConfig = JSON.parse(fs.readFileSync(globalConfig.chat_config, "utf8")); // Contains chat settings, what account to use, what oauth, what channels to join
    twitchCredentials = JSON.parse(fs.readFileSync("twitch_credentials.json", "utf8")); // Contains Twitch Credentials used to generate OAuth 2.0 Tokens as well as the Channel ID, which is used to update channel information such as stream title

    runStartTime = globalConfig.run_start_time;
    nextRunStartTime = globalConfig.next_run_start_time;
    streamEndTime = globalConfig.stream_end_time;
    //acceptInputs = globalConfig.initial_accept_inputs;
    //acceptTts = globalConfig.initial_accept_tts;
    //inputMode = globalConfig.initial_input_mode;
    //thresholdToChangeMode = globalConfig.threshold_to_change_mode;

    checkModeVotes();

    if (isNaN(advancedVoteCountRatio) == true) {
      advancedVoteCountRatio = 0;
    }
    if (isNaN(basicVoteCountRatio) == true) {
      basicVoteCountRatio = 0;
    }

    let voteDataObject = {
      basic_vote_count: basicVoteCount,
      advanced_vote_count: advancedVoteCount,
      threshold_to_change_mode: thresholdToChangeMode,
      total_votes: totalVotes,
      advanced_vote_count_ratio: advancedVoteCountRatio,
      basic_vote_count_ratio: basicVoteCountRatio,
      input_modes_array: inputModesArray,
      input_mode: inputMode
    };
    if (inputMode == 0) {
      io.to(socket.id).emit("basic_input_string", basicInputString);
      //io.to(socket.id).emit("advanced_input_string", advancedInputString);
      io.to(socket.id).emit("end_input_string", endInputString);
    }
    if (inputMode == 2) {
      //io.to(socket.id).emit("basic_input_string", basicInputString);
      io.to(socket.id).emit("advanced_input_string", advancedInputString);
      io.to(socket.id).emit("end_input_string", endInputString);
    }
    io.to(socket.id).emit("input_counts_object", inputCountsObject);
    io.to(socket.id).emit("advanced_input_metadata", advancedInputMetadata);
    io.to(socket.id).emit("controller_graphics", controllerConfig.controller_graphics);
    io.to(socket.id).emit("game_title", globalConfig.game_title);
    io.to(socket.id).emit("next_game_title", globalConfig.next_game_title);
    io.to(socket.id).emit("vote_data", voteDataObject);
    io.to(socket.id).emit("viewer_count", currentViewerCount);
    io.to(socket.id).emit("run_start_time", runStartTime);
    io.to(socket.id).emit("next_run_start_time", nextRunStartTime);
    io.to(socket.id).emit("stream_end_time", streamEndTime);
    io.to(socket.id).emit("help_messages", globalConfig.overlay_text_rotation);
    io.to(socket.id).emit("header_text", globalConfig.overlay_header_text);

    socket.on('disconnect', function() {
      console.log("Client has disconnected: " + socket.id);
    });
  }
);

//setInterval(function a() {console.log(inputsSent)}, 1000);

/*
if (new Date().getTime() < runStartTime) {
  acceptInputs = false;
  console.log(new Date().getTime() + " is less than " + runStartTime);
}
*/

//var currentMacroChainIndex = 0;
/*
modeVotes.push({
                username_to_display: usernameToPing,
                username: username,
                display_name: displayName,
                user_color: userColor,
                user_color_inverted: userColorInverted,
                message_id: messageId,
                user_id: userId,
                mode_vote: 0
              });
*/
/*
var dataToWrite2 = [0x01, 0x00, 0x00, 0x7F, 0x7F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x85, 0x01];
controllerQueue.push(dataToWrite2);
controllerQueue.push(dataToWrite2);
controllerQueue.push(dataToWrite2);
controllerQueue.push(dataToWrite2);
controllerQueue.push({
  username: "String",
  display_name: "String",
  user_color: "String",
  is_tts: false,
  message: "String",
  controller_data: [],
  input_string: "String",
  input_index: 0,
  message_id: "String"
});
console.log(controllerQueue);
*/

/*
fs.writeFile("message.txt", stringToWrite, "utf8", function(err) {
  if (err) {
    console.log(err);
  }
  console.log("The file has been saved!");
});
*/

/*
fs.readFile("controller-min.json", "utf8", function(data, err) {
  if (err) {
    console.log(err);
  }
  //console.log(data);
});
*/

//console.log(controllerObject.length);
//var controllerState = []; // false = input not being used, true = input being used and can't be used again in the same message

if (controllerObject.length > 0) {
  /*
  for (var controllerObjectIndex = 0; controllerObjectIndex < controllerObject.length; controllerObjectIndex++) {
    //console.log(controllerObjectIndex + " " + controllerState[controllerObjectIndex]);
    //console.log(controllerObjectIndex + " " + controllerState.length);
    controllerState.push(false);
    //console.log(controllerObjectIndex + " " + controllerState[controllerObjectIndex]);
    //console.log(controllerObjectIndex + " " + controllerState.length);
  }
  */
  var rawInputValue = controllerObject[0].input_value;
  rawInputValue = rawInputValue.replace(/(0x)+/ig, "");
  rawInputValue = rawInputValue.replace(/L+/ig, "");
  rawInputValue = rawInputValue.replace(/#+/ig, "");
  neutralController = Uint8Array.from(Buffer.from(rawInputValue, "hex"));
  //console.log(neutralController);
}

//var dataToWrite = [0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x85, 0x01];

var port = new SerialPort(controllerConfig.com_port, controllerConfig.com_port_parameters);

port.open(function(err) {
  if (err) {
    if (client.readyState() === "OPEN") {
      if (chatConfig.send_debug_channel_messages == true) {
        let randomColorName = Math.floor(Math.random() * defaultColors.length);
        client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
        client.action(chatConfig.debug_channel, new Date().toISOString() + " [SERIAL PORT] Failed to open port com_port=" + controllerConfig.com_port + ", com_port_parameters=" + JSON.stringify(controllerConfig.com_port_parameters) + ", err.message=" + err.message);
      }
    }
    return console.log("Error opening port: " + err.message);
  }
  // Because there's no callback to write, write errors will be emitted on the port:
  if (client.readyState() === "OPEN") {
    if (chatConfig.send_debug_channel_messages == true) {
      let randomColorName = Math.floor(Math.random() * defaultColors.length);
      client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
      client.action(chatConfig.debug_channel, new Date().toISOString() + " [SERIAL PORT] Successfully opened port com_port=" + controllerConfig.com_port + ", com_port_parameters=" + JSON.stringify(controllerConfig.com_port_parameters));
    }
  }
  console.log("we ready to go");
  //port.write("main screen turn on");
});

let cyrillicsReplacementTable = [{
  symbolOriginalString: /А/g,
  symbolReplacementString: "A"
}, {
  symbolOriginalString: /В/g,
  symbolReplacementString: "B"
}, {
  symbolOriginalString: /Е/g,
  symbolReplacementString: "E"
}, {
  symbolOriginalString: /З/g,
  symbolReplacementString: "3"
}, {
  symbolOriginalString: /К/g,
  symbolReplacementString: "K"
}, {
  symbolOriginalString: /М/g,
  symbolReplacementString: "M"
}, {
  symbolOriginalString: /Н/g,
  symbolReplacementString: "H"
}, {
  symbolOriginalString: /О/g,
  symbolReplacementString: "O"
}, {
  symbolOriginalString: /Р/g,
  symbolReplacementString: "P"
}, {
  symbolOriginalString: /С/g,
  symbolReplacementString: "C"
}, {
  symbolOriginalString: /Т/g,
  symbolReplacementString: "T"
}, {
  symbolOriginalString: /Х/g,
  symbolReplacementString: "X"
}, {
  symbolOriginalString: /Ѕ/g,
  symbolReplacementString: "S"
}, {
  symbolOriginalString: /Ј/g,
  symbolReplacementString: "J"
}, {
  symbolOriginalString: /а/g,
  symbolReplacementString: "a"
}, {
  symbolOriginalString: /е/g,
  symbolReplacementString: "e"
}, {
  symbolOriginalString: /о/g,
  symbolReplacementString: "o"
}, {
  symbolOriginalString: /р/g,
  symbolReplacementString: "p"
}, {
  symbolOriginalString: /с/g,
  symbolReplacementString: "c"
}, {
  symbolOriginalString: /у/g,
  symbolReplacementString: "y"
}, {
  symbolOriginalString: /х/g,
  symbolReplacementString: "x"
}, {
  symbolOriginalString: /ѕ/g,
  symbolReplacementString: "s"
}, {
  symbolOriginalString: /ј/g,
  symbolReplacementString: "j"
}, {
  symbolOriginalString: /і/g,
  symbolReplacementString: "i"
}, {
  symbolOriginalString: /І/g,
  symbolReplacementString: "I"
}];

function writeToPort(inputArray, inputIndex, inputDelay) {
  if (inputMode != 0) {
    return;
  }
  console.log(inputQueue.length + " " + inputQueue[inputIndex].input_index + " " + inputQueue[inputIndex].username_to_display + " " + inputQueue[inputIndex].input_string);
  //console.log("Writing index " + inputIndex);

  // Clear the incoming serial data from arduino before sending a basic input
  port.flush(function(err, results) {
    if (err) {
      if (client.readyState() === "OPEN") {
        if (chatConfig.send_debug_channel_messages == true) {
          let randomColorName = Math.floor(Math.random() * defaultColors.length);
          client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
          client.action(chatConfig.debug_channel, new Date().toISOString() + " [SERIAL PORT] Failed to flush port com_port=" + controllerConfig.com_port + ", com_port_parameters=" + JSON.stringify(controllerConfig.com_port_parameters) + ", err.message=" + err.message);
        }
      }
      return console.log(err);
    }
    //console.log(new Date().toISOString() + " flush results " + results);
  });
  port.drain(function(err, results) {
    if (err) {
      if (client.readyState() === "OPEN") {
        if (chatConfig.send_debug_channel_messages == true) {
          let randomColorName = Math.floor(Math.random() * defaultColors.length);
          client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
          client.action(chatConfig.debug_channel, new Date().toISOString() + " [SERIAL PORT] Failed to drain port com_port=" + controllerConfig.com_port + ", com_port_parameters=" + JSON.stringify(controllerConfig.com_port_parameters) + ", err.message=" + err.message);
        }
      }
      return console.log(err);
    }
    //console.log(new Date().toISOString() + " drain results " + results);
  });

  port.write(inputArray, function(err) {
    if (err) {
      if (client.readyState() === "OPEN") {
        if (chatConfig.send_debug_channel_messages == true) {
          let randomColorName = Math.floor(Math.random() * defaultColors.length);
          client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
          client.action(chatConfig.debug_channel, new Date().toISOString() + " [SERIAL PORT] Failed to write to port com_port=" + controllerConfig.com_port + ", com_port_parameters=" + JSON.stringify(controllerConfig.com_port_parameters) + ", err.message=" + err.message);
        }
      }
      return console.log("Error on write: " + err.message);
    }
    isControllerBusy = true;
    let inputDelayToWrite2 = (inputArray[9] << 8) | (inputArray[10]);
    //console.log("inputDelayToWrite2: " + inputDelayToWrite2);
    if (isTtsBusy == true) {
      //io.sockets.emit("play_audio", true);
    }
    setTimeout(function() {
      if (isTtsBusy == true) {
        isTtsBusy = false;
        isControllerBusy = false;
      }
      if (isTtsBusy == false) {
        //isTtsBusy = false;
        isControllerBusy = false;
      }
      //delete inputQueue[inputIndex];
      inputQueue.splice(inputIndex, 1);
      currentInputInQueue--;
      //console.log(inputQueue[inputIndex]);
    }, 0); // This is ugly, I know // delay before we can send the next input // inputDelayToWrite2 + 0)
    //console.log(inputArray + " " + inputIndex);
    //console.log("message written");
  });
}

function convertByteToBitArray(inputInteger) {
  inputInteger = (inputInteger).toString(2).toUpperCase();
  while (inputInteger.length < 8) {
    //console.log(inputInteger.length);
    //console.log(inputInteger);
    inputInteger = "0" + inputInteger;
    //inputInteger = inputInteger.concat(0);
    //console.log(inputInteger.length);
    //console.log(inputInteger);
  }
  return inputInteger;
}

function changeControllerStatus() {
  isControllerBusy = false;
}
var oldSerialData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
//const parser = new Readline();
//port.pipe(parser);
//parser.on('data', console.log);
var incomingSerialDataSize = 12;
var ByteLength = require("@serialport/parser-byte-length");
var InterByteTimeout = require("@serialport/parser-inter-byte-timeout");
//var parser = port.pipe();
var parser = port.pipe(new ByteLength({
  length: incomingSerialDataSize
}));
//parser = port.pipe(new InterByteTimeout({interval: 1}));
parser.on("data", async function(data) {
  let didSerialDataChange = false;
  for (let serialDataIndex = 0; serialDataIndex < data.length; serialDataIndex++) {
    //console.log(data[serialDataIndex]);
    //console.log(oldSerialData[serialDataIndex]);
    //console.log("serialDataIndex " + serialDataIndex);
    if (oldSerialData[serialDataIndex] != data[serialDataIndex]) {
      //console.log(new Date().toISOString() + " " + oldSerialData[serialDataIndex] + " " + data[serialDataIndex]);
      didSerialDataChange = true;
    }
  }
  //console.log(new Date().toISOString() + " didSerialDataChange = " + didSerialDataChange);
  if (didSerialDataChange == false) {
    // This should never happen
    //console.log(new Date().toISOString() + " NO");
  }

  if (didSerialDataChange == true) {

    //console.log(new Date().toISOString() + " DATA");
    //console.log(data);
    //console.log(new Date().toISOString() + " OLDSERIALDATA");
    //console.log(oldSerialData);

    //let buf = Buffer.from(data);
    //console.log(data);
    //console.log(new Date().toISOString() + " Data " + data);

    // The block below should never happen, if it does, something horribly wrong happened
    if (data.length != incomingSerialDataSize) {
      //console.log(new Date().toISOString() + " Invalid data size");
      port.flush(function(err, results) {
        if (err) {
          return console.log(err);
        }
        //console.log(new Date().toISOString() + " flush results " + results);
      });
      port.drain(function(err, results) {
        if (err) {
          return console.log(err);
        }
        //console.log(new Date().toISOString() + " drain results " + results);
      });
    }
    //
    if (data.length == incomingSerialDataSize) {
      let inputArrayToDisplay = [];
      let inputDurationToDisplay = 0;
      let inputStateFromArduino = [];
      endInputString = "";
      basicInputString = "";
      advancedInputString = "";
      if (data[0] == data[11]) {
        //
        //console.log(new Date().toISOString() + " Valid data format, data[0] = " + data[0] + " data[11] = " + data[11]);
        if (data[0] == 0) {
          for (var controllerObjectIndex4 = 0; controllerObjectIndex4 < controllerObject.length; controllerObjectIndex4++) {
            inputStateFromArduino.push(false);
            //console.log(inputStateFromArduino[controllerObjectIndex4]);
          }
          // End of Input
          //console.log(new Date().toISOString() + " 0 Stick " + data[3] + "," + data[4] + " CStick " + data[5] + "," + data[6]);
          for (let neutralControllerIndex = 0; neutralControllerIndex < neutralController.length; neutralControllerIndex++) {
            if (neutralController[neutralControllerIndex] != data[neutralControllerIndex + 1]) {
              //console.log("neutralControllerIndex = " + neutralControllerIndex);
              if (neutralController[neutralControllerIndex] == 0) {
                //Digital Input
                //console.log("Digital at index " + neutralControllerIndex);
                let digitalInputBitArrayNeutral = convertByteToBitArray(neutralController[neutralControllerIndex]);
                let digitalInputBitArrayData = convertByteToBitArray(data[neutralControllerIndex + 1]);
                //console.log(neutralControllerIndex);
                for (var controllerObjectIndex4 = 0; controllerObjectIndex4 < controllerObject.length; controllerObjectIndex4++) {
                  let controllerDataToCompareTo = controllerObject[controllerObjectIndex4].input_value;
                  controllerDataToCompareTo = controllerDataToCompareTo.replace(/(0x)+/ig, "");
                  controllerDataToCompareTo = controllerDataToCompareTo.replace(/L+/ig, "");
                  controllerDataToCompareTo = controllerDataToCompareTo.replace(/#+/ig, "");
                  controllerDataToCompareTo = Uint8Array.from(Buffer.from(controllerDataToCompareTo, "hex"));

                  let controllerDataToCompareToOpposite = controllerObject[controllerObjectIndex4].opposite_input_value;
                  controllerDataToCompareToOpposite = controllerDataToCompareToOpposite.replace(/(0x)+/ig, "");
                  controllerDataToCompareToOpposite = controllerDataToCompareToOpposite.replace(/L+/ig, "");
                  controllerDataToCompareToOpposite = controllerDataToCompareToOpposite.replace(/#+/ig, "");
                  controllerDataToCompareToOpposite = Uint8Array.from(Buffer.from(controllerDataToCompareToOpposite, "hex"));

                  //console.log(controllerDataToCompareTo[neutralControllerIndex]);
                  //let backToHexString = Buffer.from(controllerDataToCompareTo).toString("hex").toUpperCase();
                  //console.log("0x" + backToHexString);
                  let controllerObjectBitArray = convertByteToBitArray(controllerDataToCompareTo[neutralControllerIndex]);
                  for (let bitArrayIndex = 0; bitArrayIndex < digitalInputBitArrayData.length; bitArrayIndex++) {
                    //
                    if (controllerObjectBitArray[bitArrayIndex] == digitalInputBitArrayData[bitArrayIndex]) {
                      if (digitalInputBitArrayData[bitArrayIndex] == 1) {
                        //console.log(controllerObject[controllerObjectIndex4].input_name);
                        //console.log(digitalInputBitArrayData[bitArrayIndex] + " at index " + bitArrayIndex);
                        if (inputStateFromArduino[controllerObjectIndex4] == true) {
                          //console.log(controllerObject[controllerObjectIndex4].input_name + " was already used!");
                        }
                        if (inputStateFromArduino[controllerObjectIndex4] == false) {
                          inputArrayToDisplay.push(controllerObject[controllerObjectIndex4].input_name);
                          inputStateFromArduino[controllerObjectIndex4] = true;
                        }
                      }
                    }
                  }
                }
              }
              if (neutralController[neutralControllerIndex] != 0) {
                //Analog Input
                //console.log("Analog at index " + neutralControllerIndex);
                for (var controllerObjectIndex4 = 0; controllerObjectIndex4 < controllerObject.length; controllerObjectIndex4++) {
                  let controllerDataToCompareTo = controllerObject[controllerObjectIndex4].input_value;
                  controllerDataToCompareTo = controllerDataToCompareTo.replace(/(0x)+/ig, "");
                  controllerDataToCompareTo = controllerDataToCompareTo.replace(/L+/ig, "");
                  controllerDataToCompareTo = controllerDataToCompareTo.replace(/#+/ig, "");
                  controllerDataToCompareTo = Uint8Array.from(Buffer.from(controllerDataToCompareTo, "hex"));

                  let controllerDataToCompareToOpposite = controllerObject[controllerObjectIndex4].opposite_input_value;
                  controllerDataToCompareToOpposite = controllerDataToCompareToOpposite.replace(/(0x)+/ig, "");
                  controllerDataToCompareToOpposite = controllerDataToCompareToOpposite.replace(/L+/ig, "");
                  controllerDataToCompareToOpposite = controllerDataToCompareToOpposite.replace(/#+/ig, "");
                  controllerDataToCompareToOpposite = Uint8Array.from(Buffer.from(controllerDataToCompareToOpposite, "hex"));

                  //console.log(controllerDataToCompareTo[neutralControllerIndex]);
                  //let backToHexString = Buffer.from(controllerDataToCompareTo).toString("hex").toUpperCase();
                  //console.log("0x" + backToHexString);
                  if (controllerDataToCompareTo[neutralControllerIndex] != neutralController[neutralControllerIndex]) {
                    if (controllerDataToCompareTo[neutralControllerIndex] == data[neutralControllerIndex + 1]) {
                      // This part will detect only the correct input
                      //console.log("C " + controllerObject[controllerObjectIndex4].input_name);
                      //inputArrayToDisplay.push(controllerObject[controllerObjectIndex4].input_name);
                      if (inputStateFromArduino[controllerObjectIndex4] == true) {
                        //console.log(controllerObject[controllerObjectIndex4].input_name + " was already used!");
                      }
                      if (inputStateFromArduino[controllerObjectIndex4] == false) {
                        inputArrayToDisplay.push(controllerObject[controllerObjectIndex4].input_name);
                        inputStateFromArduino[controllerObjectIndex4] = true;
                      }
                    }
                    if (controllerDataToCompareTo[neutralControllerIndex] != data[neutralControllerIndex + 1]) {
                      if (data[neutralControllerIndex + 1] != neutralController[neutralControllerIndex]) {
                        // This part will detect the correct input as well as the opposite input
                        /*
                        console.log("F " + controllerObject[controllerObjectIndex4].input_name);
                        console.log("neutralControllerIndex = " + neutralControllerIndex);
                        console.log("controllerObjectIndex4 = " + controllerObjectIndex4);
                        console.log("data[neutralControllerIndex + 1] = " + data[neutralControllerIndex + 1]);
                        console.log("controllerDataToCompareTo[neutralControllerIndex] = " + controllerDataToCompareTo[neutralControllerIndex]);
                        console.log("controllerDataToCompareToOpposite[neutralControllerIndex] = " + controllerDataToCompareToOpposite[neutralControllerIndex]);
                        console.log("neutralController[neutralControllerIndex] = " + neutralController[neutralControllerIndex]);
                        */
                        if ((controllerDataToCompareTo[neutralControllerIndex] == controllerConfig.stick_minimum) && (data[neutralControllerIndex + 1] < neutralController[neutralControllerIndex])) {
                          //
                          //console.log("D " + controllerObject[controllerObjectIndex4].input_name);
                          //console.log("data[neutralControllerIndex + 1] = " + data[neutralControllerIndex + 1]);
                          //console.log(data[neutralControllerIndex + 1] + controllerConfig.stick_center);
                          //console.log(data[neutralControllerIndex + 1] - controllerConfig.stick_center);
                          //console.log(controllerConfig.stick_center - data[neutralControllerIndex + 1]);
                          //inputArrayToDisplay.push(controllerObject[controllerObjectIndex4].input_name + ":" + (controllerConfig.stick_center - data[neutralControllerIndex + 1]));
                          if (inputStateFromArduino[controllerObjectIndex4] == true) {
                            //console.log(controllerObject[controllerObjectIndex4].input_name + " was already used!");
                          }
                          if (inputStateFromArduino[controllerObjectIndex4] == false) {
                            inputArrayToDisplay.push(controllerObject[controllerObjectIndex4].input_name + ":" + (controllerConfig.stick_center - data[neutralControllerIndex + 1]));
                            inputStateFromArduino[controllerObjectIndex4] = true;
                          }
                        }
                        if ((controllerDataToCompareTo[neutralControllerIndex] == controllerConfig.stick_maximum) && (data[neutralControllerIndex + 1] > neutralController[neutralControllerIndex])) {
                          //
                          //console.log("E " + controllerObject[controllerObjectIndex4].input_name);
                          //console.log("data[neutralControllerIndex + 1] = " + data[neutralControllerIndex + 1]);
                          //console.log(data[neutralControllerIndex + 1] + controllerConfig.stick_center);
                          //console.log(data[neutralControllerIndex + 1] - controllerConfig.stick_center);
                          //console.log(controllerConfig.stick_center - data[neutralControllerIndex + 1]);
                          //inputArrayToDisplay.push(controllerObject[controllerObjectIndex4].input_name + ":" + (data[neutralControllerIndex + 1] - controllerConfig.stick_center));
                          if (inputStateFromArduino[controllerObjectIndex4] == true) {
                            //console.log(controllerObject[controllerObjectIndex4].input_name + " was already used!");
                          }
                          if (inputStateFromArduino[controllerObjectIndex4] == false) {
                            inputArrayToDisplay.push(controllerObject[controllerObjectIndex4].input_name + ":" + (data[neutralControllerIndex + 1] - controllerConfig.stick_center));
                            inputStateFromArduino[controllerObjectIndex4] = true;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          inputDurationToDisplay = (data[9] << 8) | (data[10]);
          //console.log("inputDurationToDisplay = " + inputDurationToDisplay);
          inputArrayToDisplay = inputArrayToDisplay.join("+");
          if (inputArrayToDisplay == "") {
            // Do nothing
            //console.log("Empty String, this shouldn't happen, maybe this is valid end of input");
            endInputString = inputArrayToDisplay;
            io.sockets.emit("end_input_string", endInputString);
            io.sockets.emit("input_state_from_arduino", inputStateFromArduino);
          }
          if (inputArrayToDisplay != "") {
            if (inputDurationToDisplay == controllerConfig.normal_delay) {
              // Do nothing
            }
            if (inputDurationToDisplay == controllerConfig.held_delay) {
              inputArrayToDisplay = inputArrayToDisplay + "-";
            }
            if ((inputDurationToDisplay != controllerConfig.normal_delay) && (inputDurationToDisplay != controllerConfig.held_delay)) {
              inputArrayToDisplay = inputArrayToDisplay + " " + inputDurationToDisplay + "ms";
            }
            //console.log(new Date().toISOString() + " " + inputArrayToDisplay);
            endInputString = inputArrayToDisplay;
            io.sockets.emit("end_input_string", endInputString);
            io.sockets.emit("input_state_from_arduino", inputStateFromArduino);
            //console.log(inputArrayToDisplay.join("+"));
          }
        }
        if (data[0] == 1) {
          if (inputMode != 0) {
            port.flush(function(err, results) {
              if (err) {
                return console.log(err);
              }
              //console.log(new Date().toISOString() + " flush results " + results);
            });
            port.drain(function(err, results) {
              if (err) {
                return console.log(err);
              }
              //console.log(new Date().toISOString() + " drain results " + results);
            });
            data[0] = 0;
            data[1] = 0;
            data[2] = 0;
            data[3] = 0;
            data[4] = 0;
            data[5] = 0;
            data[6] = 0;
            data[7] = 0;
            data[8] = 0;
            data[9] = 0;
            data[10] = 0;
            data[11] = 0;
          }
          if (inputMode == 0) {
            for (var controllerObjectIndex4 = 0; controllerObjectIndex4 < controllerObject.length; controllerObjectIndex4++) {
              //console.log(inputStateFromArduino[controllerObjectIndex4]);
              inputStateFromArduino.push(false);
              //console.log(inputStateFromArduino[controllerObjectIndex4]);
            }
            // Basic Input
            //console.log(data);
            //console.log(new Date().toISOString() + " 1 Stick " + data[3] + "," + data[4] + " CStick " + data[5] + "," + data[6]);
            for (let neutralControllerIndex = 0; neutralControllerIndex < neutralController.length; neutralControllerIndex++) {
              if (neutralController[neutralControllerIndex] != data[neutralControllerIndex + 1]) {
                //console.log("neutralControllerIndex = " + neutralControllerIndex);
                if (neutralController[neutralControllerIndex] == 0) {
                  //Digital Input
                  //console.log("Digital at index " + neutralControllerIndex);
                  let digitalInputBitArrayNeutral = convertByteToBitArray(neutralController[neutralControllerIndex]);
                  let digitalInputBitArrayData = convertByteToBitArray(data[neutralControllerIndex + 1]);
                  //console.log(neutralControllerIndex);
                  for (var controllerObjectIndex4 = 0; controllerObjectIndex4 < controllerObject.length; controllerObjectIndex4++) {
                    let controllerDataToCompareTo = controllerObject[controllerObjectIndex4].input_value;
                    controllerDataToCompareTo = controllerDataToCompareTo.replace(/(0x)+/ig, "");
                    controllerDataToCompareTo = controllerDataToCompareTo.replace(/L+/ig, "");
                    controllerDataToCompareTo = controllerDataToCompareTo.replace(/#+/ig, "");
                    controllerDataToCompareTo = Uint8Array.from(Buffer.from(controllerDataToCompareTo, "hex"));

                    let controllerDataToCompareToOpposite = controllerObject[controllerObjectIndex4].opposite_input_value;
                    controllerDataToCompareToOpposite = controllerDataToCompareToOpposite.replace(/(0x)+/ig, "");
                    controllerDataToCompareToOpposite = controllerDataToCompareToOpposite.replace(/L+/ig, "");
                    controllerDataToCompareToOpposite = controllerDataToCompareToOpposite.replace(/#+/ig, "");
                    controllerDataToCompareToOpposite = Uint8Array.from(Buffer.from(controllerDataToCompareToOpposite, "hex"));

                    //console.log(controllerDataToCompareTo[neutralControllerIndex]);
                    //let backToHexString = Buffer.from(controllerDataToCompareTo).toString("hex").toUpperCase();
                    //console.log("0x" + backToHexString);
                    let controllerObjectBitArray = convertByteToBitArray(controllerDataToCompareTo[neutralControllerIndex]);
                    for (let bitArrayIndex = 0; bitArrayIndex < digitalInputBitArrayData.length; bitArrayIndex++) {
                      //
                      if (controllerObjectBitArray[bitArrayIndex] == digitalInputBitArrayData[bitArrayIndex]) {
                        if (digitalInputBitArrayData[bitArrayIndex] == 1) {
                          //console.log(controllerObject[controllerObjectIndex4].input_name);
                          //console.log(digitalInputBitArrayData[bitArrayIndex] + " at index " + bitArrayIndex);
                          //console.log(inputStateFromArduino[controllerObjectIndex4]);
                          if (inputStateFromArduino[controllerObjectIndex4] == true) {
                            //console.log(controllerObject[controllerObjectIndex4].input_name + " was already used!");
                          }
                          if (inputStateFromArduino[controllerObjectIndex4] == false) {
                            inputArrayToDisplay.push(controllerObject[controllerObjectIndex4].input_name);
                            inputStateFromArduino[controllerObjectIndex4] = true;
                          }
                        }
                      }
                    }
                  }
                }
                if (neutralController[neutralControllerIndex] != 0) {
                  //Analog Input
                  //console.log("Analog at index " + neutralControllerIndex);
                  for (var controllerObjectIndex4 = 0; controllerObjectIndex4 < controllerObject.length; controllerObjectIndex4++) {
                    let controllerDataToCompareTo = controllerObject[controllerObjectIndex4].input_value;
                    controllerDataToCompareTo = controllerDataToCompareTo.replace(/(0x)+/ig, "");
                    controllerDataToCompareTo = controllerDataToCompareTo.replace(/L+/ig, "");
                    controllerDataToCompareTo = controllerDataToCompareTo.replace(/#+/ig, "");
                    controllerDataToCompareTo = Uint8Array.from(Buffer.from(controllerDataToCompareTo, "hex"));

                    let controllerDataToCompareToOpposite = controllerObject[controllerObjectIndex4].opposite_input_value;
                    controllerDataToCompareToOpposite = controllerDataToCompareToOpposite.replace(/(0x)+/ig, "");
                    controllerDataToCompareToOpposite = controllerDataToCompareToOpposite.replace(/L+/ig, "");
                    controllerDataToCompareToOpposite = controllerDataToCompareToOpposite.replace(/#+/ig, "");
                    controllerDataToCompareToOpposite = Uint8Array.from(Buffer.from(controllerDataToCompareToOpposite, "hex"));

                    //console.log(controllerDataToCompareTo[neutralControllerIndex]);
                    //let backToHexString = Buffer.from(controllerDataToCompareTo).toString("hex").toUpperCase();
                    //console.log("0x" + backToHexString);
                    if (controllerDataToCompareTo[neutralControllerIndex] != neutralController[neutralControllerIndex]) {
                      if (controllerDataToCompareTo[neutralControllerIndex] == data[neutralControllerIndex + 1]) {
                        // This part will detect only the correct input
                        //console.log("C " + controllerObject[controllerObjectIndex4].input_name);
                        //inputArrayToDisplay.push(controllerObject[controllerObjectIndex4].input_name);
                        if (inputStateFromArduino[controllerObjectIndex4] == true) {
                          //console.log(controllerObject[controllerObjectIndex4].input_name + " was already used!");
                        }
                        if (inputStateFromArduino[controllerObjectIndex4] == false) {
                          inputArrayToDisplay.push(controllerObject[controllerObjectIndex4].input_name);
                          inputStateFromArduino[controllerObjectIndex4] = true;
                        }
                      }
                      if (controllerDataToCompareTo[neutralControllerIndex] != data[neutralControllerIndex + 1]) {
                        if (data[neutralControllerIndex + 1] != neutralController[neutralControllerIndex]) {
                          // This part will detect the correct input as well as the opposite input
                          /*
                          console.log("F " + controllerObject[controllerObjectIndex4].input_name);
                          console.log("neutralControllerIndex = " + neutralControllerIndex);
                          console.log("controllerObjectIndex4 = " + controllerObjectIndex4);
                          console.log("data[neutralControllerIndex + 1] = " + data[neutralControllerIndex + 1]);
                          console.log("controllerDataToCompareTo[neutralControllerIndex] = " + controllerDataToCompareTo[neutralControllerIndex]);
                          console.log("controllerDataToCompareToOpposite[neutralControllerIndex] = " + controllerDataToCompareToOpposite[neutralControllerIndex]);
                          console.log("neutralController[neutralControllerIndex] = " + neutralController[neutralControllerIndex]);
                          */
                          if ((controllerDataToCompareTo[neutralControllerIndex] == controllerConfig.stick_minimum) && (data[neutralControllerIndex + 1] < neutralController[neutralControllerIndex])) {
                            //
                            //console.log("D " + controllerObject[controllerObjectIndex4].input_name);
                            //console.log("data[neutralControllerIndex + 1] = " + data[neutralControllerIndex + 1]);
                            //console.log(data[neutralControllerIndex + 1] + controllerConfig.stick_center);
                            //console.log(data[neutralControllerIndex + 1] - controllerConfig.stick_center);
                            //console.log(controllerConfig.stick_center - data[neutralControllerIndex + 1]);
                            //inputArrayToDisplay.push(controllerObject[controllerObjectIndex4].input_name + ":" + (controllerConfig.stick_center - data[neutralControllerIndex + 1]));
                            if (inputStateFromArduino[controllerObjectIndex4] == true) {
                              //console.log(controllerObject[controllerObjectIndex4].input_name + " was already used!");
                            }
                            if (inputStateFromArduino[controllerObjectIndex4] == false) {
                              inputArrayToDisplay.push(controllerObject[controllerObjectIndex4].input_name + ":" + (controllerConfig.stick_center - data[neutralControllerIndex + 1]));
                              inputStateFromArduino[controllerObjectIndex4] = true;
                            }
                          }
                          if ((controllerDataToCompareTo[neutralControllerIndex] == controllerConfig.stick_maximum) && (data[neutralControllerIndex + 1] > neutralController[neutralControllerIndex])) {
                            //
                            //console.log("E " + controllerObject[controllerObjectIndex4].input_name);
                            //console.log("data[neutralControllerIndex + 1] = " + data[neutralControllerIndex + 1]);
                            //console.log(data[neutralControllerIndex + 1] + controllerConfig.stick_center);
                            //console.log(data[neutralControllerIndex + 1] - controllerConfig.stick_center);
                            //console.log(controllerConfig.stick_center - data[neutralControllerIndex + 1]);
                            //inputArrayToDisplay.push(controllerObject[controllerObjectIndex4].input_name + ":" + (data[neutralControllerIndex + 1] - controllerConfig.stick_center));
                            if (inputStateFromArduino[controllerObjectIndex4] == true) {
                              //console.log(controllerObject[controllerObjectIndex4].input_name + " was already used!");
                            }
                            if (inputStateFromArduino[controllerObjectIndex4] == false) {
                              inputArrayToDisplay.push(controllerObject[controllerObjectIndex4].input_name + ":" + (data[neutralControllerIndex + 1] - controllerConfig.stick_center));
                              inputStateFromArduino[controllerObjectIndex4] = true;
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            inputDurationToDisplay = (data[9] << 8) | (data[10]);
            //console.log("inputDurationToDisplay = " + inputDurationToDisplay);
            inputArrayToDisplay = inputArrayToDisplay.join("+");
            if (inputArrayToDisplay == "") {
              // Do nothing
              //console.log("Empty String, this shouldn't happen CASE 1");
              basicInputString = inputArrayToDisplay;
              io.sockets.emit("basic_input_string", basicInputString);
              io.sockets.emit("input_state_from_arduino", inputStateFromArduino);
            }
            if (inputArrayToDisplay != "") {
              if (inputDurationToDisplay == controllerConfig.normal_delay) {
                // Do nothing
              }
              if (inputDurationToDisplay == controllerConfig.held_delay) {
                inputArrayToDisplay = inputArrayToDisplay + "-";
              }
              if ((inputDurationToDisplay != controllerConfig.normal_delay) && (inputDurationToDisplay != controllerConfig.held_delay)) {
                inputArrayToDisplay = inputArrayToDisplay + " " + inputDurationToDisplay + "ms";
              }
              //console.log(new Date().toISOString() + " " + inputArrayToDisplay);
              basicInputString = inputArrayToDisplay;
              io.sockets.emit("basic_input_string", basicInputString);
              io.sockets.emit("input_state_from_arduino", inputStateFromArduino);
              //console.log(inputArrayToDisplay.join("+"));
              //await sleep(500);
              // The database operations below check the total input count
              /*
              mongoClient.connect(mongoUrl, {
                useUnifiedTopology: true
              }, function(err, globalDb) {
                //isDatabaseBusy = true;
                if (err) {
                  throw err;
                }
                // Check if the entry for a specific game exists
                let globalDatabase = globalDb.db(globalConfig.global_database_name);
                globalDatabase.collection(globalConfig.run_name).findOne({}, function(err, result) {
                  if (err) {
                    throw err;
                  }
                  //console.log(result);
                  //isNullDatabase = result;
                  if (result === null) {
                    //console.log("A YES");
                    mongoClient.connect(mongoUrl, {
                      useUnifiedTopology: true
                    }, function(err, databaseToCreate) {
                      if (err) {
                        throw err;
                      }
                      let globalDatabaseToCreate = databaseToCreate.db(globalConfig.global_database_name);
                      let dataToInsert = {
                        run_id: globalConfig.run_id,
                        basic_inputs_sent: 1,
                        advanced_inputs_sent: 0,
                        total_inputs_sent: 1,
                        basic_inputs_executed: 1,
                        advanced_inputs_executed: 0,
                        total_inputs_executed: 1
                      };

                      inputCountsObject = dataToInsert;
                      io.sockets.emit("input_counts_object", inputCountsObject);

                      //console.log("dataToInsert SERIAL");
                      //console.log(dataToInsert);
                      // Executed means inputs that were successfully executed by the Arduino and sent back to the PC
                      globalDatabaseToCreate.collection(globalConfig.run_name).insertOne(dataToInsert, function(err, res) {
                        if (err) {
                          throw err;
                        }
                        //console.log("1 document inserted");
                        mongoClient.connect(mongoUrl, {
                          useUnifiedTopology: true
                        }, function(err, databaseToReadFrom) {
                          if (err) {
                            throw err;
                          }
                          let globalDatabaseToreadFrom = databaseToReadFrom.db(globalConfig.global_database_name);
                          globalDatabaseToreadFrom.collection(globalConfig.run_name).findOne({}, function(err, databaseToReadFromResult) {
                            if (err) {
                              throw err;
                            }
                            databaseToReadFrom.close();
                            //console.log(databaseToReadFromResult);
                            //inputsSent = databaseToReadFromResult.input_count;
                          });
                        });
                        databaseToCreate.close();
                      });
                    });
                    //test();
                  }
                  if (result !== null) {
                    //console.log("A NO");
                    mongoClient.connect(mongoUrl, {
                      useUnifiedTopology: true
                    }, function(err, databaseToUpdate) {
                      if (err) {
                        throw err;
                      }
                      let globalDatabaseToUpdate = databaseToUpdate.db(globalConfig.global_database_name);
                      let dataToQuery = {
                        run_id: result.run_id,
                        
                        basic_inputs_sent: result.basic_inputs_sent,
                        advanced_inputs_sent: result.advanced_inputs_sent,
                        total_inputs_sent: result.total_inputs_sent,
                        
                        basic_inputs_executed: result.basic_inputs_executed,
                        advanced_inputs_executed: result.advanced_inputs_executed,
                        total_inputs_executed: result.total_inputs_executed
                      };
                      // Executed means inputs that were successfully executed by the Arduino and sent back to the PC
                      let dataToUpdate = {
                        $set: {
                          run_id: result.run_id,
                          
                          basic_inputs_sent: result.basic_inputs_sent,
                          advanced_inputs_sent: result.advanced_inputs_sent,
                          total_inputs_sent: result.total_inputs_sent,
                          
                          basic_inputs_executed: result.basic_inputs_executed + 1,
                          advanced_inputs_executed: result.advanced_inputs_executed,
                          total_inputs_executed: result.total_inputs_executed + 1
                        }
                      };

                      inputCountsObject = dataToUpdate.$set;
                      io.sockets.emit("input_counts_object", inputCountsObject);

                      //console.log("dataToUpdate SERIAL");
                      //console.log(dataToUpdate);
                      // Executed means inputs that were successfully executed by the Arduino and sent back to the PC
                      //console.log(newvalues);
                      globalDatabaseToUpdate.collection(globalConfig.run_name).updateOne(dataToQuery, dataToUpdate, function(err, res) {
                        if (err) {
                          throw err;
                        }
                        //console.log(res.result);
                        //console.log("1 document updated");
                        mongoClient.connect(mongoUrl, {
                          useUnifiedTopology: true
                        }, function(err, databaseToReadFrom) {
                          if (err) {
                            throw err;
                          }
                          let globalDatabaseToreadFrom = databaseToReadFrom.db(globalConfig.global_database_name);
                          globalDatabaseToreadFrom.collection(globalConfig.run_name).findOne({}, function(err, databaseToReadFromResult) {
                            if (err) {
                              throw err;
                            }
                            databaseToReadFrom.close();
                            //console.log(databaseToReadFromResult);
                            //inputsSent = databaseToReadFromResult.input_count;
                          });
                        });
                        databaseToUpdate.close();
                      });
                    });
                    //console.log(result.input_count);
                    //test3(result.input_count);
                  }
                  globalDb.close();
                  //isDatabaseBusy = false;
                });
              });
              */
            }
          }
        }
        if (data[0] >= controllerConfig.initial_macro_preamble && data[0] <= (controllerConfig.final_macro_preamble - 1)) {
          if (inputMode != 2) {
            port.flush(function(err, results) {
              if (err) {
                return console.log(err);
              }
              //console.log(new Date().toISOString() + " flush results " + results);
            });
            port.drain(function(err, results) {
              if (err) {
                return console.log(err);
              }
              //console.log(new Date().toISOString() + " drain results " + results);
            });
            data[0] = 0;
            data[1] = 0;
            data[2] = 0;
            data[3] = 0;
            data[4] = 0;
            data[5] = 0;
            data[6] = 0;
            data[7] = 0;
            data[8] = 0;
            data[9] = 0;
            data[10] = 0;
            data[11] = 0;
          }
          if (inputMode == 2) {
            for (var controllerObjectIndex4 = 0; controllerObjectIndex4 < controllerObject.length; controllerObjectIndex4++) {
              //console.log(inputStateFromArduino[controllerObjectIndex4]);
              inputStateFromArduino.push(false);
              //console.log(inputStateFromArduino[controllerObjectIndex4]);
            }
            // Advanced Input
            //console.log(new Date().toISOString() + " " + data[0] + " Stick " + data[3] + "," + data[4] + " CStick " + data[5] + "," + data[6]);
            for (let neutralControllerIndex = 0; neutralControllerIndex < neutralController.length; neutralControllerIndex++) {
              if (neutralController[neutralControllerIndex] != data[neutralControllerIndex + 1]) {
                //console.log("neutralControllerIndex = " + neutralControllerIndex);
                if (neutralController[neutralControllerIndex] == 0) {
                  //Digital Input
                  //console.log("Digital at index " + neutralControllerIndex);
                  let digitalInputBitArrayNeutral = convertByteToBitArray(neutralController[neutralControllerIndex]);
                  let digitalInputBitArrayData = convertByteToBitArray(data[neutralControllerIndex + 1]);
                  //console.log(neutralControllerIndex);
                  for (var controllerObjectIndex4 = 0; controllerObjectIndex4 < controllerObject.length; controllerObjectIndex4++) {
                    let controllerDataToCompareTo = controllerObject[controllerObjectIndex4].input_value;
                    controllerDataToCompareTo = controllerDataToCompareTo.replace(/(0x)+/ig, "");
                    controllerDataToCompareTo = controllerDataToCompareTo.replace(/L+/ig, "");
                    controllerDataToCompareTo = controllerDataToCompareTo.replace(/#+/ig, "");
                    controllerDataToCompareTo = Uint8Array.from(Buffer.from(controllerDataToCompareTo, "hex"));

                    let controllerDataToCompareToOpposite = controllerObject[controllerObjectIndex4].opposite_input_value;
                    controllerDataToCompareToOpposite = controllerDataToCompareToOpposite.replace(/(0x)+/ig, "");
                    controllerDataToCompareToOpposite = controllerDataToCompareToOpposite.replace(/L+/ig, "");
                    controllerDataToCompareToOpposite = controllerDataToCompareToOpposite.replace(/#+/ig, "");
                    controllerDataToCompareToOpposite = Uint8Array.from(Buffer.from(controllerDataToCompareToOpposite, "hex"));

                    //console.log(controllerDataToCompareTo[neutralControllerIndex]);
                    //let backToHexString = Buffer.from(controllerDataToCompareTo).toString("hex").toUpperCase();
                    //console.log("0x" + backToHexString);
                    let controllerObjectBitArray = convertByteToBitArray(controllerDataToCompareTo[neutralControllerIndex]);
                    for (let bitArrayIndex = 0; bitArrayIndex < digitalInputBitArrayData.length; bitArrayIndex++) {
                      //
                      if (controllerObjectBitArray[bitArrayIndex] == digitalInputBitArrayData[bitArrayIndex]) {
                        if (digitalInputBitArrayData[bitArrayIndex] == 1) {
                          //console.log(controllerObject[controllerObjectIndex4].input_name);
                          //console.log(digitalInputBitArrayData[bitArrayIndex] + " at index " + bitArrayIndex);
                          //inputArrayToDisplay.push(controllerObject[controllerObjectIndex4].input_name);
                          if (inputStateFromArduino[controllerObjectIndex4] == true) {
                            //console.log(controllerObject[controllerObjectIndex4].input_name + " was already used!");
                          }
                          if (inputStateFromArduino[controllerObjectIndex4] == false) {
                            inputArrayToDisplay.push(controllerObject[controllerObjectIndex4].input_name);
                            inputStateFromArduino[controllerObjectIndex4] = true;
                          }
                        }
                      }
                    }
                  }
                }
                if (neutralController[neutralControllerIndex] != 0) {
                  //Analog Input
                  //console.log("Analog at index " + neutralControllerIndex);
                  for (var controllerObjectIndex4 = 0; controllerObjectIndex4 < controllerObject.length; controllerObjectIndex4++) {
                    let controllerDataToCompareTo = controllerObject[controllerObjectIndex4].input_value;
                    controllerDataToCompareTo = controllerDataToCompareTo.replace(/(0x)+/ig, "");
                    controllerDataToCompareTo = controllerDataToCompareTo.replace(/L+/ig, "");
                    controllerDataToCompareTo = controllerDataToCompareTo.replace(/#+/ig, "");
                    controllerDataToCompareTo = Uint8Array.from(Buffer.from(controllerDataToCompareTo, "hex"));

                    let controllerDataToCompareToOpposite = controllerObject[controllerObjectIndex4].opposite_input_value;
                    controllerDataToCompareToOpposite = controllerDataToCompareToOpposite.replace(/(0x)+/ig, "");
                    controllerDataToCompareToOpposite = controllerDataToCompareToOpposite.replace(/L+/ig, "");
                    controllerDataToCompareToOpposite = controllerDataToCompareToOpposite.replace(/#+/ig, "");
                    controllerDataToCompareToOpposite = Uint8Array.from(Buffer.from(controllerDataToCompareToOpposite, "hex"));

                    //console.log(controllerDataToCompareTo[neutralControllerIndex]);
                    //let backToHexString = Buffer.from(controllerDataToCompareTo).toString("hex").toUpperCase();
                    //console.log("0x" + backToHexString);
                    if (controllerDataToCompareTo[neutralControllerIndex] != neutralController[neutralControllerIndex]) {
                      if (controllerDataToCompareTo[neutralControllerIndex] == data[neutralControllerIndex + 1]) {
                        // This part will detect only the correct input
                        //console.log("C " + controllerObject[controllerObjectIndex4].input_name);
                        //inputArrayToDisplay.push(controllerObject[controllerObjectIndex4].input_name);
                        if (inputStateFromArduino[controllerObjectIndex4] == true) {
                          //console.log(controllerObject[controllerObjectIndex4].input_name + " was already used!");
                        }
                        if (inputStateFromArduino[controllerObjectIndex4] == false) {
                          inputArrayToDisplay.push(controllerObject[controllerObjectIndex4].input_name);
                          inputStateFromArduino[controllerObjectIndex4] = true;
                        }
                      }
                      if (controllerDataToCompareTo[neutralControllerIndex] != data[neutralControllerIndex + 1]) {
                        if (data[neutralControllerIndex + 1] != neutralController[neutralControllerIndex]) {
                          // This part will detect the correct input as well as the opposite input
                          /*
                          console.log("F " + controllerObject[controllerObjectIndex4].input_name);
                          console.log("neutralControllerIndex = " + neutralControllerIndex);
                          console.log("controllerObjectIndex4 = " + controllerObjectIndex4);
                          console.log("data[neutralControllerIndex + 1] = " + data[neutralControllerIndex + 1]);
                          console.log("controllerDataToCompareTo[neutralControllerIndex] = " + controllerDataToCompareTo[neutralControllerIndex]);
                          console.log("controllerDataToCompareToOpposite[neutralControllerIndex] = " + controllerDataToCompareToOpposite[neutralControllerIndex]);
                          console.log("neutralController[neutralControllerIndex] = " + neutralController[neutralControllerIndex]);
                          */
                          if ((controllerDataToCompareTo[neutralControllerIndex] == controllerConfig.stick_minimum) && (data[neutralControllerIndex + 1] < neutralController[neutralControllerIndex])) {
                            //
                            //console.log("D " + controllerObject[controllerObjectIndex4].input_name);
                            //console.log("data[neutralControllerIndex + 1] = " + data[neutralControllerIndex + 1]);
                            //console.log(data[neutralControllerIndex + 1] + controllerConfig.stick_center);
                            //console.log(data[neutralControllerIndex + 1] - controllerConfig.stick_center);
                            //console.log(controllerConfig.stick_center - data[neutralControllerIndex + 1]);
                            //inputArrayToDisplay.push(controllerObject[controllerObjectIndex4].input_name + ":" + (controllerConfig.stick_center - data[neutralControllerIndex + 1]));
                            if (inputStateFromArduino[controllerObjectIndex4] == true) {
                              //console.log(controllerObject[controllerObjectIndex4].input_name + " was already used!");
                            }
                            if (inputStateFromArduino[controllerObjectIndex4] == false) {
                              inputArrayToDisplay.push(controllerObject[controllerObjectIndex4].input_name + ":" + (controllerConfig.stick_center - data[neutralControllerIndex + 1]));
                              inputStateFromArduino[controllerObjectIndex4] = true;
                            }
                          }
                          if ((controllerDataToCompareTo[neutralControllerIndex] == controllerConfig.stick_maximum) && (data[neutralControllerIndex + 1] > neutralController[neutralControllerIndex])) {
                            //
                            //console.log("E " + controllerObject[controllerObjectIndex4].input_name);
                            //console.log("data[neutralControllerIndex + 1] = " + data[neutralControllerIndex + 1]);
                            //console.log(data[neutralControllerIndex + 1] + controllerConfig.stick_center);
                            //console.log(data[neutralControllerIndex + 1] - controllerConfig.stick_center);
                            //console.log(controllerConfig.stick_center - data[neutralControllerIndex + 1]);
                            //inputArrayToDisplay.push(controllerObject[controllerObjectIndex4].input_name + ":" + (data[neutralControllerIndex + 1] - controllerConfig.stick_center));
                            if (inputStateFromArduino[controllerObjectIndex4] == true) {
                              //console.log(controllerObject[controllerObjectIndex4].input_name + " was already used!");
                            }
                            if (inputStateFromArduino[controllerObjectIndex4] == false) {
                              inputArrayToDisplay.push(controllerObject[controllerObjectIndex4].input_name + ":" + (data[neutralControllerIndex + 1] - controllerConfig.stick_center));
                              inputStateFromArduino[controllerObjectIndex4] = true;
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            inputDurationToDisplay = (data[9] << 8) | (data[10]);
            //console.log("inputDurationToDisplay = " + inputDurationToDisplay);
            inputArrayToDisplay = inputArrayToDisplay.join("+");
            if (inputArrayToDisplay == "") {
              // Do nothing
              //console.log("Empty String, this shouldn't happen CASE 64 - 127");
            }
            if (inputArrayToDisplay != "") {
              if (inputDurationToDisplay == controllerConfig.default_duration_per_precision_input_millis) {
                advancedInputString = inputArrayToDisplay;
                io.sockets.emit("advanced_input_string", advancedInputString);
                io.sockets.emit("input_state_from_arduino", inputStateFromArduino);
                // Do nothing
              }
              if (inputDurationToDisplay == controllerConfig.held_duration_per_precision_input_millis) {
                inputArrayToDisplay = inputArrayToDisplay + "-";
              }
              if ((inputDurationToDisplay != controllerConfig.default_duration_per_precision_input_millis) && (inputDurationToDisplay != controllerConfig.held_duration_per_precision_input_millis)) {
                inputArrayToDisplay = inputArrayToDisplay + " " + inputDurationToDisplay + "ms";
              }
              //console.log(new Date().toISOString() + " " + inputArrayToDisplay);
              advancedInputString = inputArrayToDisplay;
              io.sockets.emit("advanced_input_string", advancedInputString);
              io.sockets.emit("input_state_from_arduino", inputStateFromArduino);
              //console.log(inputArrayToDisplay.join("+"));
              //await sleep(500);
              // The database operations below check the total input count
              /*
              mongoClient.connect(mongoUrl, {
                useUnifiedTopology: true
              }, function(err, globalDb) {
                //isDatabaseBusy = true;
                if (err) {
                  throw err;
                }
                // Check if the entry for a specific game exists
                let globalDatabase = globalDb.db(globalConfig.global_database_name);
                globalDatabase.collection(globalConfig.run_name).findOne({}, function(err, result) {
                  if (err) {
                    throw err;
                  }
                  //console.log(result);
                  //isNullDatabase = result;
                  if (result === null) {
                    //console.log("B YES");
                    mongoClient.connect(mongoUrl, {
                      useUnifiedTopology: true
                    }, function(err, databaseToCreate) {
                      if (err) {
                        throw err;
                      }
                      let globalDatabaseToCreate = databaseToCreate.db(globalConfig.global_database_name);
                      let dataToInsert = {
                        run_id: globalConfig.run_id,
                        basic_inputs_sent: 0,
                        advanced_inputs_sent: 1,
                        total_inputs_sent: 1,
                        basic_inputs_executed: 0,
                        advanced_inputs_executed: 1,
                        total_inputs_executed: 1
                      };

                      inputCountsObject = dataToInsert;
                      io.sockets.emit("input_counts_object", inputCountsObject);

                      //console.log("dataToInsert SERIAL");
                      //console.log(dataToInsert);
                      // Executed means inputs that were successfully executed by the Arduino and sent back to the PC
                      globalDatabaseToCreate.collection(globalConfig.run_name).insertOne(dataToInsert, function(err, res) {
                        if (err) {
                          throw err;
                        }
                        //console.log("1 document inserted");
                        mongoClient.connect(mongoUrl, {
                          useUnifiedTopology: true
                        }, function(err, databaseToReadFrom) {
                          if (err) {
                            throw err;
                          }
                          let globalDatabaseToreadFrom = databaseToReadFrom.db(globalConfig.global_database_name);
                          globalDatabaseToreadFrom.collection(globalConfig.run_name).findOne({}, function(err, databaseToReadFromResult) {
                            if (err) {
                              throw err;
                            }
                            databaseToReadFrom.close();
                            //console.log(databaseToReadFromResult);
                            //inputsSent = databaseToReadFromResult.input_count;
                          });
                        });
                        databaseToCreate.close();
                      });
                    });
                    //test();
                  }
                  if (result !== null) {
                    //console.log("B NO");
                    mongoClient.connect(mongoUrl, {
                      useUnifiedTopology: true
                    }, function(err, databaseToUpdate) {
                      if (err) {
                        throw err;
                      }
                      let globalDatabaseToUpdate = databaseToUpdate.db(globalConfig.global_database_name);
                      let dataToQuery = {
                        run_id: result.run_id,
                        
                        basic_inputs_sent: result.basic_inputs_sent,
                        advanced_inputs_sent: result.advanced_inputs_sent,
                        total_inputs_sent: result.total_inputs_sent,
                        
                        basic_inputs_executed: result.basic_inputs_executed,
                        advanced_inputs_executed: result.advanced_inputs_executed,
                        total_inputs_executed: result.total_inputs_executed
                      };
                      // Executed means inputs that were successfully executed by the Arduino and sent back to the PC
                      let dataToUpdate = {
                        $set: {
                          run_id: result.run_id,
                          
                          basic_inputs_sent: result.basic_inputs_sent,
                          advanced_inputs_sent: result.advanced_inputs_sent,
                          total_inputs_sent: result.total_inputs_sent,
                          
                          basic_inputs_executed: result.basic_inputs_executed,
                          advanced_inputs_executed: result.advanced_inputs_executed + 1,
                          total_inputs_executed: result.total_inputs_executed + 1
                        }
                      };

                      inputCountsObject = dataToUpdate.$set;
                      io.sockets.emit("input_counts_object", inputCountsObject);

                      //console.log("dataToUpdate SERIAL");
                      //console.log(dataToUpdate);
                      // Executed means inputs that were successfully executed by the Arduino and sent back to the PC
                      //console.log(newvalues);
                      globalDatabaseToUpdate.collection(globalConfig.run_name).updateOne(dataToQuery, dataToUpdate, function(err, res) {
                        if (err) {
                          throw err;
                        }
                        //console.log(res.result);
                        //console.log("1 document updated");
                        mongoClient.connect(mongoUrl, {
                          useUnifiedTopology: true
                        }, function(err, databaseToReadFrom) {
                          if (err) {
                            throw err;
                          }
                          let globalDatabaseToreadFrom = databaseToReadFrom.db(globalConfig.global_database_name);
                          globalDatabaseToreadFrom.collection(globalConfig.run_name).findOne({}, function(err, databaseToReadFromResult) {
                            if (err) {
                              throw err;
                            }
                            databaseToReadFrom.close();
                            //console.log(databaseToReadFromResult);
                            //inputsSent = databaseToReadFromResult.input_count;
                          });
                        });
                        databaseToUpdate.close();
                      });
                    });
                    //console.log(result.input_count);
                    //test3(result.input_count);
                  }
                  globalDb.close();
                  //isDatabaseBusy = false;
                });
              });
              */
            }
          }
        }
        if (data[0] == controllerConfig.final_macro_preamble) {
          advancedInputMetadata = {
            loop_macro: data[2],
            macro_inputs_to_run: data[1],
            current_macro_index_running: data[3],
            times_to_loop: data[4],
            loop_counter: data[5]
          };
          io.sockets.emit("advanced_input_metadata", advancedInputMetadata);
          // Data that says where in the macro chain the arduino is
          //console.log(new Date().toISOString() + " endingMacroIndex = " + data[0] + " macroInputsToRun = " + data[1] + " loopMacro = " + data[2] + " currentMacroIndexRunning = " + data[3] + " timesToLoop = " + data[4] + " loopCounter = " + data[5] + " N/A = " + data[6] + " N/A = " + data[7] + " N/A = " + data[8] + " N/A = " + data[9] + " N/A = " + data[10] + " endingMacroIndex = " + data[11]);
          /*
          if (data[2] == 0) {
            console.log(new Date().toISOString() + " Input: " + data[3] + "/" + data[1]);
          }
          if (data[2] == 1) {
            console.log(new Date().toISOString() + " Input: " + data[3] + "/" + data[1] + " Iteration: " + data[5] + "/" + data[4]);
          }
          //console.log(new Date().toISOString() + " Input: " + data[3] + "/" + data[1] + " Iteration: " + data[5] + "/" + data[4] + " loopMacro: " + data[2]);
          */
        }
        //console.log(data);
      }
      if (data[0] != data[11]) {
        // If this block happens, then the data is invalid format (probably because the serial communication desynced), the serial port will be flushed to clear any desync issues and should hopefully be in sync when the next message is received from the Arduino
        //console.log(new Date().toISOString() + " Invalid data format, data[0] = " + data[0] + " data[11] = " + data[11]);
        //console.log(data);
        port.flush(function(err, results) {
          if (err) {
            return console.log(err);
          }
          //console.log(new Date().toISOString() + " flush results " + results);
        });
        port.drain(function(err, results) {
          if (err) {
            return console.log(err);
          }
          //console.log(new Date().toISOString() + " drain results " + results);
        });
      }
    }
  }
  //console.log(new Date().toISOString() + " Data 0 " + data);
  //console.log(new Date().toISOString() + " Data 0 " + data[0]);
  //console.log(data.readUInt8());
  //let byteFromBufferTest = data;
  //byteFromBufferTest.writeUInt8(data, 0);
  //console.log(data);
  //oldSerialData = data;
  for (let serialDataIndex = 0; serialDataIndex < data.length; serialDataIndex++) {
    oldSerialData[serialDataIndex] = data[serialDataIndex];
  }
});
/*
// Switches the port into "flowing mode"
port.on("data", function (data) {
  let serialDataTest = data;
  console.log(serialDataTest);
});
*/
port.on("error", function(err) {
  if (client.readyState() === "OPEN") {
    if (chatConfig.send_debug_channel_messages == true) {
      let randomColorName = Math.floor(Math.random() * defaultColors.length);
      client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
      client.action(chatConfig.debug_channel, new Date().toISOString() + " [SERIAL PORT] Port error occurred at port com_port=" + controllerConfig.com_port + ", com_port_parameters=" + JSON.stringify(controllerConfig.com_port_parameters) + ", err.message=" + err.message);
    }
  }
  console.log("Error: ", err.message);
});
// The open event is always emitted
port.on("open", function() {
  if (client.readyState() === "OPEN") {
    if (chatConfig.send_debug_channel_messages == true) {
      let randomColorName = Math.floor(Math.random() * defaultColors.length);
      client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
      client.action(chatConfig.debug_channel, new Date().toISOString() + " [SERIAL PORT] Successfully opened port com_port=" + controllerConfig.com_port + ", com_port_parameters=" + JSON.stringify(controllerConfig.com_port_parameters));
    }
  }
  console.log("was the port opened?");
  // open logic
});

// Create a client with our options
var client = new tmi.client(chatConfig);
var chatLogger = new tmi.client(chatConfig);

// Register our event handlers (defined below)
client.on("raided", onRaid);
client.on("timeout", onTimeOut);
client.on("ban", onBan);
client.on("messagedeleted", onClearMsg);
client.on("message", onMessageHandler);
client.on("connected", onConnectedHandler);
client.on("raw_message", onRawMessageHandler);
chatLogger.on("raw_message", rawMessageLogger);
// client.join("channel_name"); // To join a channel?

function onRaid(channel, username, viewers, tags) {

  let systemMsg = tags["system-msg"];
  systemMsg = systemMsg.replace(/(\\s)+/ig, " ");
  systemMsg = systemMsg.replace(/\s+/ig, " ");
  /*
  console.log("ONRAID");
  console.log(channel);
  console.log(username);
  console.log(viewers);
  console.log(tags);
  */
  let randomColorName = Math.floor(Math.random() * defaultColors.length);
  client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
  //client.action(chatConfig.debug_channel, new Date().toISOString() + " [RAID] channel=" + channel + ", username=" + username + ",viewers=" + viewers + ", tags=" + tags);
  //client.whisper(chatConfig.channel_owner, new Date().toISOString() + " [RAID] channel=" + channel + ", username=" + username + ",viewers=" + viewers + ", tags=" + tags);
  //client.action(chatConfig.debug_channel, new Date().toISOString() + " [RAID] channel=" + channel + ", username=" + username + ",viewers=" + viewers + ", tags=" + JSON.stringify(tags));
  //client.whisper(chatConfig.channel_owner, new Date().toISOString() + " [RAID] channel=" + channel + ", username=" + username + ",viewers=" + viewers + ", tags=" + JSON.stringify(tags));
  client.action(channel, systemMsg); // the tag system-msg is a message generated by the Twitch API which says how many people are raiding and what channel they're coming from, hopefully this works
}

function onTimeOut(channel, msg, unused, duration, tags) {
  /*
  console.log("ONTIMEOUT");
  console.log(channel);
  console.log(msg);
  console.log(unused);
  console.log(duration);
  console.log(tags);
  */
  let randomColorName = Math.floor(Math.random() * defaultColors.length);
  client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
  client.whisper(msg, "You were timed out for " + duration + " seconds from channel " + channel + ".");
}

function onBan(channel, msg, unused, tags) {
  /*
  console.log("ONBAN");
  console.log(channel);
  console.log(msg);
  console.log(unused);
  console.log(tags);
  */
  let randomColorName = Math.floor(Math.random() * defaultColors.length);
  client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
  client.whisper(msg, "You were permanently banned from channel " + channel + ".");
}

function onClearMsg(channel, username, deletedMessage, tags) {
  /*
  console.log("ONCLEARMSG");
  console.log(channel);
  console.log(username);
  console.log(deletedMessage);
  console.log(tags);
  */
  let randomColorName = Math.floor(Math.random() * defaultColors.length);
  client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
  client.whisper(username, "Your message \"" + deletedMessage + "\" was deleted from channel " + channel + ".");
}

function rawMessageLogger(messageCloned, message) {
  if (chatConfig.log_chat_as_receiver == false) {
    //console.log("CHAT LOGGING IS DISABLED");
    return;
  }
  //console.log("CHAT LOGGING IS ENABLED");
  // This block logs chat from a viewer's (receiver only) point of view
  let rawLineMillis = new Date().getTime();
  let rawLineTimestamp = new Date(rawLineMillis).toISOString();
  let rawLineTimestampDate = new Date(rawLineMillis).getUTCDate();
  let rawLineTimestampMonth = new Date(rawLineMillis).getUTCMonth() + 1;
  let rawLineTimestampYear = new Date(rawLineMillis).getUTCFullYear();
  let chatLogDate = rawLineTimestampYear + "-" + rawLineTimestampMonth + "-" + rawLineTimestampDate;
  //console.log(rawLineTimestamp + " [RAW CHAT LINE] " + JSON.stringify(message));
  //console.log(__dirname + "\\" + );

  //let dirName = __dirname + "\\logs\\chat\\" + rawLineTimestampYear + "\\" + rawLineTimestampMonth + "\\" + rawLineTimestampDate;
  //let dirName = __dirname + "\\logs\\whisper\\" + rawLineTimestampYear + "\\" + rawLineTimestampMonth + "\\" + rawLineTimestampDate;
  /*
  if (fs.existsSync(dirName) == false) {
    console.log("Create the folder");
    //fs.mkdirSync(dirName, { recursive: true });
  }
  */
  // messageCloned is the JSON converted to string
  // message is the raw, unmodified JSON
  let rawLineCommand = message.command;
  let rawLineParam0 = message.params[0];
  let folderToMake = "";
  let chatLogFilename = "";
  let roomId = message.tags["room-id"];
  let userId = message.tags["user-id"];
  let threadId = message.tags["thread-id"]; // Used to keep track of whispers
  //console.log(rawLineTimestamp + " [RAW LINE PARAM0] " + rawLineParam0);
  if (message.params.length === 0) {
    rawLineParam0 = "";
  }
  //console.log(rawLineTimestamp + " [RAW LINE PARAM0] " + rawLineParam0);
  //console.log(rawLineTimestamp + " [RAW LINE PARAM0] " + rawLineParam0);
  //console.log(rawLineTimestamp + " [RAW LINE COMMAND] " + rawLineCommand);
  // This block logs chat from a viewer's (receiver only) point of view
  // I have to do this because I need to listen and log all messages sent to chat, including messages sent by this application, as the receiver, not the sender
  // Is there a better way to do this without connecting two clients (having two instances of tmi.js running) to twitch?
  //console.log(new Date().toISOString() + " [RAW CHAT LINE] " + messageCloned);
  if (rawLineParam0 === "" || rawLineParam0 === undefined || rawLineParam0 === "*") {
    return; // We don't want the first parameter to be an empty string, this param is either the channel name or the whisperer name, we don't want it to be undefined either, but it's possible that it is "undefined", we don't want it to be "*" because that's a twitch control line, and we don't want to log that
  }
  if (rawLineCommand === "PING" || rawLineCommand == "PONG" || rawLineCommand === "CAP" || rawLineCommand === "001" || rawLineCommand === "002" || rawLineCommand === "003" || rawLineCommand === "004" || rawLineCommand === "375" || rawLineCommand === "372" || rawLineCommand === "376" || rawLineCommand === "353" || rawLineCommand === "366" || rawLineCommand === "GLOBALUSERSTATE" || rawLineCommand === "USERSTATE" || rawLineCommand === "ROOMSTATE" || rawLineCommand === "PART" || rawLineCommand === "JOIN") {
    return; // Should I filter PART and JOIN? And maybe ROOMSTATE too? Yes, too much unecessary logging otherwise
  }
  //console.log(rawLineTimestamp + " [RAW CHAT LINE] " + JSON.stringify(message));
  if (rawLineCommand === "WHISPER") {
    // Doing this multiple times because I'm using an old version of node that doesn't support recursive folder creation
    folderToMake = __dirname + "\\logs";
    if (fs.existsSync(folderToMake) == false) {
      console.log(new Date().toISOString() + " [FOLDER CREATION] Creating the folder logs");
      fs.mkdirSync(folderToMake);
    }
    folderToMake = __dirname + "\\logs\\receiver";
    if (fs.existsSync(folderToMake) == false) {
      console.log(new Date().toISOString() + " [FOLDER CREATION] Creating the folder receiver");
      fs.mkdirSync(folderToMake);
    }
    folderToMake = __dirname + "\\logs\\receiver\\whisper";
    if (fs.existsSync(folderToMake) == false) {
      console.log(new Date().toISOString() + " [FOLDER CREATION] Creating the folder whisper");
      fs.mkdirSync(folderToMake);
    }
    folderToMake = __dirname + "\\logs\\receiver\\whisper\\" + rawLineTimestampYear;
    if (fs.existsSync(folderToMake) == false) {
      console.log(new Date().toISOString() + " [FOLDER CREATION] Creating the folder " + rawLineTimestampYear);
      fs.mkdirSync(folderToMake);
    }
    folderToMake = __dirname + "\\logs\\receiver\\whisper\\" + rawLineTimestampYear + "\\" + rawLineTimestampMonth;
    if (fs.existsSync(folderToMake) == false) {
      console.log(new Date().toISOString() + " [FOLDER CREATION] Creating the folder " + rawLineTimestampMonth);
      fs.mkdirSync(folderToMake);
    }
    folderToMake = __dirname + "\\logs\\receiver\\whisper\\" + rawLineTimestampYear + "\\" + rawLineTimestampMonth + "\\" + rawLineTimestampDate;
    if (fs.existsSync(folderToMake) == false) {
      console.log(new Date().toISOString() + " [FOLDER CREATION] Creating the folder " + rawLineTimestampDate);
      fs.mkdirSync(folderToMake);
    }
    // And then we make the file
    chatLogFilename = __dirname + "\\logs\\receiver\\whisper\\" + rawLineTimestampYear + "\\" + rawLineTimestampMonth + "\\" + rawLineTimestampDate + "\\" + userId + "_" + rawLineTimestampYear + "-" + rawLineTimestampMonth + "-" + rawLineTimestampDate + ".txt";
    if (fs.existsSync(chatLogFilename) == false) {
      console.log(new Date().toISOString() + " [FILE CREATION] Creating the file " + userId + "_" + rawLineTimestampYear + "-" + rawLineTimestampMonth + "-" + rawLineTimestampDate + ".txt");
      fs.writeFileSync(chatLogFilename, "", "utf8"); // Create an empty file with UTF-8 Encoding
    }
    // Then we append to the file
    chatLogFilename = __dirname + "\\logs\\receiver\\whisper\\" + rawLineTimestampYear + "\\" + rawLineTimestampMonth + "\\" + rawLineTimestampDate + "\\" + userId + "_" + rawLineTimestampYear + "-" + rawLineTimestampMonth + "-" + rawLineTimestampDate + ".txt";
    if (fs.existsSync(chatLogFilename) == true) {
      //console.log(new Date().toISOString() + " [FILE WRITING] Append to the file");
      fs.appendFileSync(chatLogFilename, rawLineTimestamp + " " + JSON.stringify(message) + "\n", "utf8");
    }
    // And that's how you log twitch raw lines on an older version of nodejs
    return; // This case is a different case from the rest, whispers have to be logged separately
  }
  // Doing this multiple times because I'm using an old version of node that doesn't support recursive folder creation
  folderToMake = __dirname + "\\logs";
  if (fs.existsSync(folderToMake) == false) {
    console.log(new Date().toISOString() + " [FOLDER CREATION] Creating the folder logs");
    fs.mkdirSync(folderToMake);
  }
  folderToMake = __dirname + "\\logs\\receiver";
  if (fs.existsSync(folderToMake) == false) {
    console.log(new Date().toISOString() + " [FOLDER CREATION] Creating the folder receiver");
    fs.mkdirSync(folderToMake);
  }
  folderToMake = __dirname + "\\logs\\receiver\\chat";
  if (fs.existsSync(folderToMake) == false) {
    console.log(new Date().toISOString() + " [FOLDER CREATION] Creating the folder chat");
    fs.mkdirSync(folderToMake);
  }
  folderToMake = __dirname + "\\logs\\receiver\\chat\\" + rawLineTimestampYear;
  if (fs.existsSync(folderToMake) == false) {
    console.log(new Date().toISOString() + " [FOLDER CREATION] Creating the folder " + rawLineTimestampYear);
    fs.mkdirSync(folderToMake);
  }
  folderToMake = __dirname + "\\logs\\receiver\\chat\\" + rawLineTimestampYear + "\\" + rawLineTimestampMonth;
  if (fs.existsSync(folderToMake) == false) {
    console.log(new Date().toISOString() + " [FOLDER CREATION] Creating the folder " + rawLineTimestampMonth);
    fs.mkdirSync(folderToMake);
  }
  folderToMake = __dirname + "\\logs\\receiver\\chat\\" + rawLineTimestampYear + "\\" + rawLineTimestampMonth + "\\" + rawLineTimestampDate;
  if (fs.existsSync(folderToMake) == false) {
    console.log(new Date().toISOString() + " [FOLDER CREATION] Creating the folder " + rawLineTimestampDate);
    fs.mkdirSync(folderToMake);
  }
  // And then we make the file
  chatLogFilename = __dirname + "\\logs\\receiver\\chat\\" + rawLineTimestampYear + "\\" + rawLineTimestampMonth + "\\" + rawLineTimestampDate + "\\" + rawLineParam0 + "_" + rawLineTimestampYear + "-" + rawLineTimestampMonth + "-" + rawLineTimestampDate + ".txt";
  if (fs.existsSync(chatLogFilename) == false) {
    console.log(new Date().toISOString() + " [FILE CREATION] Creating the file " + rawLineParam0 + "_" + rawLineTimestampYear + "-" + rawLineTimestampMonth + "-" + rawLineTimestampDate + ".txt");
    fs.writeFileSync(chatLogFilename, "", "utf8"); // Create an empty file with UTF-8 Encoding
  }
  // Then we append to the file
  chatLogFilename = __dirname + "\\logs\\receiver\\chat\\" + rawLineTimestampYear + "\\" + rawLineTimestampMonth + "\\" + rawLineTimestampDate + "\\" + rawLineParam0 + "_" + rawLineTimestampYear + "-" + rawLineTimestampMonth + "-" + rawLineTimestampDate + ".txt";
  if (fs.existsSync(chatLogFilename) == true) {
    //console.log(new Date().toISOString() + " [FILE WRITING] Append to the file");
    fs.appendFileSync(chatLogFilename, rawLineTimestamp + " " + JSON.stringify(message) + "\n", "utf8");
  }
  // And that's how you log twitch raw lines on an older version of nodejs
  // How would I go about saving this to a mongo database?
  //console.log(rawLineTimestamp + " [RAW CHAT LINE] " + JSON.stringify(message));
  //console.log(new Date().toISOString() + " [rawMessageLogger CHAT READY STATES] chatLogger.readyState() = " + chatLogger.readyState() + " client.readyState() = " + client.readyState() + " clientReconnectAttempts = " + clientReconnectAttempts + " chatLoggerReconnectAttempts = " + chatLoggerReconnectAttempts);
}

function onRawMessageHandler(messageCloned, message) {
  if (chatConfig.log_chat_as_moderator == false) {
    //console.log("CHAT LOGGING IS DISABLED");
    return;
  }
  //console.log("CHAT LOGGING IS ENABLED");
  // This is where the bot's point of view logging should happen (basically logging chat twice but slightly different, also I'm doing this because I want to log moderation actions made by the bot itself, not by someone else who's not the bot, like what happens in the block rawMessageLogger)
  //console.log(messageCloned);
  //message = JSON.stringify(message);
  //console.log(message);
  //console.log(new Date().toISOString() + " [RAW CHAT LINE] " + message.raw);
  //console.log(new Date().toISOString() + " [RAW CHAT LINE] " + messageCloned.raw);

  //

  // This block logs chat from the bot's (sender (logging moderation messages), moderator and partial receiver (it can't see its own messages)) point of view
  let rawLineMillis = new Date().getTime();
  let rawLineTimestamp = new Date(rawLineMillis).toISOString();
  let rawLineTimestampDate = new Date(rawLineMillis).getUTCDate();
  let rawLineTimestampMonth = new Date(rawLineMillis).getUTCMonth() + 1;
  let rawLineTimestampYear = new Date(rawLineMillis).getUTCFullYear();
  let chatLogDate = rawLineTimestampYear + "-" + rawLineTimestampMonth + "-" + rawLineTimestampDate;
  //console.log(rawLineTimestamp + " [RAW CHAT LINE] " + JSON.stringify(message));
  //console.log(__dirname + "\\" + );

  //let dirName = __dirname + "\\logs\\chat\\" + rawLineTimestampYear + "\\" + rawLineTimestampMonth + "\\" + rawLineTimestampDate;
  //let dirName = __dirname + "\\logs\\whisper\\" + rawLineTimestampYear + "\\" + rawLineTimestampMonth + "\\" + rawLineTimestampDate;
  /*
  if (fs.existsSync(dirName) == false) {
    console.log("Create the folder");
    //fs.mkdirSync(dirName, { recursive: true });
  }
  */
  // messageCloned is the JSON converted to string
  // message is the raw, unmodified JSON
  let rawLineCommand = message.command;
  let rawLineParam0 = message.params[0];
  let folderToMake = "";
  let chatLogFilename = "";
  let roomId = message.tags["room-id"];
  let userId = message.tags["user-id"];
  let threadId = message.tags["thread-id"]; // Used to keep track of whispers
  //console.log(rawLineTimestamp + " [RAW LINE PARAM0] " + rawLineParam0);
  if (message.params.length === 0) {
    rawLineParam0 = "";
  }
  //console.log(rawLineTimestamp + " [RAW LINE PARAM0] " + rawLineParam0);
  //console.log(rawLineTimestamp + " [RAW LINE PARAM0] " + rawLineParam0);
  //console.log(rawLineTimestamp + " [RAW LINE COMMAND] " + rawLineCommand);
  // This block logs chat from the bot's (sender (logging moderation messages), moderator and partial receiver (it can't see its own messages)) point of view
  // I have to do this because I need to listen and log all messages sent to chat, including messages sent by this application, as the receiver, not the sender (disregard this, this is a copypaste)
  // Is there a better way to do this without connecting two clients (having two instances of tmi.js running) to twitch?
  //console.log(new Date().toISOString() + " [RAW CHAT LINE] " + messageCloned);
  if (rawLineParam0 === "" || rawLineParam0 === undefined || rawLineParam0 === "*") {
    return; // We don't want the first parameter to be an empty string, this param is either the channel name or the whisperer name, we don't want it to be undefined either, but it's possible that it is "undefined", we don't want it to be "*" because that's a twitch control line, and we don't want to log that
  }
  if (rawLineCommand === "PING" || rawLineCommand == "PONG" || rawLineCommand === "CAP" || rawLineCommand === "001" || rawLineCommand === "002" || rawLineCommand === "003" || rawLineCommand === "004" || rawLineCommand === "375" || rawLineCommand === "372" || rawLineCommand === "376" || rawLineCommand === "353" || rawLineCommand === "366" || rawLineCommand === "GLOBALUSERSTATE" || rawLineCommand === "USERSTATE" || rawLineCommand === "ROOMSTATE" || rawLineCommand === "PART" || rawLineCommand === "JOIN") {
    return; // Should I filter PART and JOIN? And maybe ROOMSTATE too? Yes, too much unecessary logging otherwise
  }
  //console.log(rawLineTimestamp + " [RAW CHAT LINE] " + JSON.stringify(message));
  if (rawLineCommand === "WHISPER") {
    // Doing this multiple times because I'm using an old version of node that doesn't support recursive folder creation
    folderToMake = __dirname + "\\logs";
    if (fs.existsSync(folderToMake) == false) {
      console.log(new Date().toISOString() + " [FOLDER CREATION] Creating the folder logs");
      fs.mkdirSync(folderToMake);
    }
    folderToMake = __dirname + "\\logs\\moderator";
    if (fs.existsSync(folderToMake) == false) {
      console.log(new Date().toISOString() + " [FOLDER CREATION] Creating the folder moderator");
      fs.mkdirSync(folderToMake);
    }
    folderToMake = __dirname + "\\logs\\moderator\\whisper";
    if (fs.existsSync(folderToMake) == false) {
      console.log(new Date().toISOString() + " [FOLDER CREATION] Creating the folder whisper");
      fs.mkdirSync(folderToMake);
    }
    folderToMake = __dirname + "\\logs\\moderator\\whisper\\" + rawLineTimestampYear;
    if (fs.existsSync(folderToMake) == false) {
      console.log(new Date().toISOString() + " [FOLDER CREATION] Creating the folder " + rawLineTimestampYear);
      fs.mkdirSync(folderToMake);
    }
    folderToMake = __dirname + "\\logs\\moderator\\whisper\\" + rawLineTimestampYear + "\\" + rawLineTimestampMonth;
    if (fs.existsSync(folderToMake) == false) {
      console.log(new Date().toISOString() + " [FOLDER CREATION] Creating the folder " + rawLineTimestampMonth);
      fs.mkdirSync(folderToMake);
    }
    folderToMake = __dirname + "\\logs\\moderator\\whisper\\" + rawLineTimestampYear + "\\" + rawLineTimestampMonth + "\\" + rawLineTimestampDate;
    if (fs.existsSync(folderToMake) == false) {
      console.log(new Date().toISOString() + " [FOLDER CREATION] Creating the folder " + rawLineTimestampDate);
      fs.mkdirSync(folderToMake);
    }
    // And then we make the file
    chatLogFilename = __dirname + "\\logs\\moderator\\whisper\\" + rawLineTimestampYear + "\\" + rawLineTimestampMonth + "\\" + rawLineTimestampDate + "\\" + userId + "_" + rawLineTimestampYear + "-" + rawLineTimestampMonth + "-" + rawLineTimestampDate + ".txt";
    if (fs.existsSync(chatLogFilename) == false) {
      console.log(new Date().toISOString() + " [FILE CREATION] Creating the file " + userId + "_" + rawLineTimestampYear + "-" + rawLineTimestampMonth + "-" + rawLineTimestampDate + ".txt");
      fs.writeFileSync(chatLogFilename, "", "utf8"); // Create an empty file with UTF-8 Encoding
    }
    // Then we append to the file
    chatLogFilename = __dirname + "\\logs\\moderator\\whisper\\" + rawLineTimestampYear + "\\" + rawLineTimestampMonth + "\\" + rawLineTimestampDate + "\\" + userId + "_" + rawLineTimestampYear + "-" + rawLineTimestampMonth + "-" + rawLineTimestampDate + ".txt";
    if (fs.existsSync(chatLogFilename) == true) {
      //console.log(new Date().toISOString() + " [FILE WRITING] Append to the file");
      fs.appendFileSync(chatLogFilename, rawLineTimestamp + " " + JSON.stringify(message) + "\n", "utf8");
    }
    // And that's how you log twitch raw lines on an older version of nodejs
    return; // This case is a different case from the rest, whispers have to be logged separately
  }
  // Doing this multiple times because I'm using an old version of node that doesn't support recursive folder creation
  folderToMake = __dirname + "\\logs";
  if (fs.existsSync(folderToMake) == false) {
    console.log(new Date().toISOString() + " [FOLDER CREATION] Creating the folder logs");
    fs.mkdirSync(folderToMake);
  }
  folderToMake = __dirname + "\\logs\\moderator";
  if (fs.existsSync(folderToMake) == false) {
    console.log(new Date().toISOString() + " [FOLDER CREATION] Creating the folder moderator");
    fs.mkdirSync(folderToMake);
  }
  folderToMake = __dirname + "\\logs\\moderator\\chat";
  if (fs.existsSync(folderToMake) == false) {
    console.log(new Date().toISOString() + " [FOLDER CREATION] Creating the folder chat");
    fs.mkdirSync(folderToMake);
  }
  folderToMake = __dirname + "\\logs\\moderator\\chat\\" + rawLineTimestampYear;
  if (fs.existsSync(folderToMake) == false) {
    console.log(new Date().toISOString() + " [FOLDER CREATION] Creating the folder " + rawLineTimestampYear);
    fs.mkdirSync(folderToMake);
  }
  folderToMake = __dirname + "\\logs\\moderator\\chat\\" + rawLineTimestampYear + "\\" + rawLineTimestampMonth;
  if (fs.existsSync(folderToMake) == false) {
    console.log(new Date().toISOString() + " [FOLDER CREATION] Creating the folder " + rawLineTimestampMonth);
    fs.mkdirSync(folderToMake);
  }
  folderToMake = __dirname + "\\logs\\moderator\\chat\\" + rawLineTimestampYear + "\\" + rawLineTimestampMonth + "\\" + rawLineTimestampDate;
  if (fs.existsSync(folderToMake) == false) {
    console.log(new Date().toISOString() + " [FOLDER CREATION] Creating the folder " + rawLineTimestampDate);
    fs.mkdirSync(folderToMake);
  }
  // And then we make the file
  chatLogFilename = __dirname + "\\logs\\moderator\\chat\\" + rawLineTimestampYear + "\\" + rawLineTimestampMonth + "\\" + rawLineTimestampDate + "\\" + rawLineParam0 + "_" + rawLineTimestampYear + "-" + rawLineTimestampMonth + "-" + rawLineTimestampDate + ".txt";
  if (fs.existsSync(chatLogFilename) == false) {
    console.log(new Date().toISOString() + " [FILE CREATION] Creating the file " + rawLineParam0 + "_" + rawLineTimestampYear + "-" + rawLineTimestampMonth + "-" + rawLineTimestampDate + ".txt");
    fs.writeFileSync(chatLogFilename, "", "utf8"); // Create an empty file with UTF-8 Encoding
  }
  // Then we append to the file
  chatLogFilename = __dirname + "\\logs\\moderator\\chat\\" + rawLineTimestampYear + "\\" + rawLineTimestampMonth + "\\" + rawLineTimestampDate + "\\" + rawLineParam0 + "_" + rawLineTimestampYear + "-" + rawLineTimestampMonth + "-" + rawLineTimestampDate + ".txt";
  if (fs.existsSync(chatLogFilename) == true) {
    //console.log(new Date().toISOString() + " [FILE WRITING] Append to the file");
    fs.appendFileSync(chatLogFilename, rawLineTimestamp + " " + JSON.stringify(message) + "\n", "utf8");
  }
  // And that's how you log twitch raw lines on an older version of nodejs
  // How would I go about saving this to a mongo database?
  //console.log(rawLineTimestamp + " [RAW CHAT LINE] " + JSON.stringify(message));
  //console.log(new Date().toISOString() + " [onRawMessageHandler CHAT READY STATES] chatLogger.readyState() = " + chatLogger.readyState() + " client.readyState() = " + client.readyState() + " clientReconnectAttempts = " + clientReconnectAttempts + " chatLoggerReconnectAttempts = " + chatLoggerReconnectAttempts);
}
//client.connect();
// Connect to Twitch:
if (client.readyState() === "CLOSED") {
  client.connect();
}
if (chatLogger.readyState() === "CLOSED") {
  if (chatConfig.log_chat_as_receiver == true) {
    chatLogger.connect();
  }
}

var currentViewerCount = -1;
var oldViewerCount = -1;

function getStreamViewerCount(twitchCredentialsObject, twitchAccessTokenObject) {
  let twitchClientId = twitchCredentialsObject.twitch_client_id;
  let twitchChannelId = twitchCredentialsObject.twitch_channel_id;
  let twitchOauthToken = twitchAccessTokenObject.access_token;

  let options = {
    hostname: "api.twitch.tv",
    path: "/helix/streams?user_id=" + twitchChannelId,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + twitchOauthToken,
      "Client-Id": twitchClientId
    }
  };

  let req = https.request(options, res => {
    //console.log("statusCode: " + res.statusCode);

    res.on("data", (d) => {
      //console.log(JSON.parse(d.toString("utf8")));
      let dataSize = JSON.parse(d.toString("utf8")).data.length;
      //console.log(" dataSize = " + dataSize);
      if (dataSize > 0) {
        // The stream is LIVE!
        currentViewerCount = JSON.parse(d.toString("utf8")).data[0].viewer_count;
        //console.log(new Date().toISOString() + " [STREAM OFFLINE] oldViewerCount = " + oldViewerCount + " currentViewerCount = " + currentViewerCount);
        if (currentViewerCount != oldViewerCount) {
          // Viewer Count Changed
          io.sockets.emit("viewer_count", currentViewerCount);
          //console.log(new Date().toISOString() + " [VIEWER COUNTS CHANGED ONLINE] oldViewerCount = " + oldViewerCount + " currentViewerCount = " + currentViewerCount);
          /*
          if (client.readyState() === "OPEN") {
            if (chatConfig.send_debug_channel_messages == true) {
              let randomColorName = Math.floor(Math.random() * defaultColors.length);
              client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
              client.action(chatConfig.debug_channel, new Date().toISOString() + " [VIEWER COUNTS CHANGED ONLINE] oldViewerCount = " + oldViewerCount + " currentViewerCount = " + currentViewerCount);
            }
          }
          */
        }
      }
      if (dataSize <= 0) {
        // Stream is probably offline or the Twitch API fucked up (Or the OAuth Token expired)
        currentViewerCount = -1;
        //console.log(new Date().toISOString() + " [STREAM OFFLINE] oldViewerCount = " + oldViewerCount + " currentViewerCount = " + currentViewerCount);
        if (currentViewerCount != oldViewerCount) {
          // Viewer Count Changed
          io.sockets.emit("viewer_count", currentViewerCount);
          //console.log(new Date().toISOString() + " [VIEWER COUNTS CHANGED OFFLINE] oldViewerCount = " + oldViewerCount + " currentViewerCount = " + currentViewerCount);
          /*
          if (client.readyState() === "OPEN") {
            if (chatConfig.send_debug_channel_messages == true) {
              let randomColorName = Math.floor(Math.random() * defaultColors.length);
              client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
              client.action(chatConfig.debug_channel, new Date().toISOString() + " [VIEWER COUNTS CHANGED OFFLINE] oldViewerCount = " + oldViewerCount + " currentViewerCount = " + currentViewerCount);
            }
          }
          */
        }
        //oldViewerCount = currentViewerCount;
      }
      oldViewerCount = currentViewerCount;
      /*
      if (currentViewerCount !== null && currentViewerCount !== undefined) {
        // The stream is LIVE!
        if (currentViewerCount != oldViewerCount) {
          console.log(new Date().toISOString() + " [VIEWER COUNTS CHANGED] oldViewerCount = " + oldViewerCount + " currentViewerCount = " + currentViewerCount);
        }
      }
      if (currentViewerCount === null || currentViewerCount === undefined) {
        // Stream is probably offline or the Twitch API fucked up (Or the OAuth Token expired)
        console.log(new Date().toISOString() + " [STREAM OFFLINE] oldViewerCount = " + oldViewerCount + " currentViewerCount = " + currentViewerCount);
        currentViewerCount = 0;
        oldViewerCount = 0;
      }
      */
      //console.log(currentViewerCount);
      //oldViewerCount = currentViewerCount;

      //process.stdout.write(d);
      //console.log(d);
    });
  });

  req.on("error", (error) => {
    currentViewerCount = -1;
    console.log(new Date().toISOString() + " CONNECTION ERROR");
    console.error(error);
  });
  req.end();
}

setInterval(updateStreamTime, 100);

var currentSecond = 0;
var currentMinute = 0;
var currentHour = 0;

var oldSecond = 0;
var oldMinute = 0;
var oldHour = 0;

var secondToCheck = 30;
var minuteToCheck = 59;
var hourToCheckAm = 11;
var hourToCheckPm = 23;

var runStartLeniency = -60000; // This variable is used to start checking for time at least 60000 milliseconds before the run actually starts, so the title can be changed just before it actually starts

function updateStreamTime() {
  let currentTimeObject = new Date();
  let currentTimeMillis = currentTimeObject.getTime();
  currentSecond = currentTimeObject.getUTCSeconds();
  currentMinute = currentTimeObject.getUTCMinutes();
  currentHour = currentTimeObject.getUTCHours();

  //

  let playTimeTotal = currentTimeMillis - runStartTime;
  /*
  let playTimeDays = (parseInt(playTimeTotal / 86400000)).toString().padStart(2, "0");
  let playTimeHours = (parseInt(playTimeTotal / 3600000) % 24).toString().padStart(2, "0");
  let playTimeMinutes = (parseInt(playTimeTotal / 60000) % 60).toString().padStart(2, "0");
  let playTimeSeconds = (parseInt(playTimeTotal / 1000) % 60).toString().padStart(2, "0");
  let playTimeMillis = (playTimeTotal % 1000).toString().padStart(3, "0");
  */
  let playTimeDays = (parseInt(playTimeTotal / 86400000));
  let playTimeHours = (parseInt(playTimeTotal / 3600000) % 24);
  let playTimeMinutes = (parseInt(playTimeTotal / 60000) % 60);
  let playTimeSeconds = (parseInt(playTimeTotal / 1000) % 60);
  let playTimeMillis = (playTimeTotal % 1000);
  let playTimeString = playTimeDays + "day " + playTimeHours + "hr " + playTimeMinutes + "min " + playTimeSeconds + "sec " + playTimeMillis + "msec";
  //console.log(playTimeString);
  //console.log(playTimeTotal);
  //playTimeDays = -1;
  //console.log(playTimeDays+1);
  /*
  console.log(playTimeString);
  if (playTimeHours >= 0 && playTimeHours <= 11) {
    console.log("Day " + playTimeDays + " Hour 12 to Hour 23 ");
  }
  if (playTimeHours >= 12 && playTimeHours <= 23) {
    console.log("Day " + (playTimeDays + 1) + " Hour 0 to Hour 11 ");
  }
  */
  //
  if (playTimeTotal < 0 && playTimeTotal < runStartLeniency) {
    //console.log("Don't check time here");
    return;
  }
  if (playTimeTotal < 0 && playTimeTotal >= runStartLeniency) {
    //console.log(playTimeTotal);
    //console.log("Time can be checked here for the start of the run");
    if (oldSecond != currentSecond) {
      //console.log("Second changed from " + oldSecond + " to " + currentSecond);
      if (currentSecond == secondToCheck) {
        //console.log("Current Second " + currentSecond + " equals to " + secondToCheck);
        if (currentMinute == minuteToCheck) {
          //console.log("Current Minute " + currentMinute + " equals to " + minuteToCheck);
          if (currentHour == hourToCheckAm) {
            //
            console.log("A Time can be checked here for the start of the run");
            console.log("Day " + (playTimeDays) + " Hour 12 to Hour 24 ");
            console.log("Current Hour " + currentHour + " equals to " + hourToCheckAm);
            updateStreamTitle(globalConfig.stream_title + " Day " + playTimeDays + ", Hour 12 to Hour 24, type !help to learn how to play", twitchCredentials, twitchJsonEncodedAppAccessToken);
            if (client.readyState() === "OPEN") {
              let randomColorName = Math.floor(Math.random() * defaultColors.length);
              client.say(chatConfig.main_channel, ".color " + defaultColorNames[randomColorName]);
              client.action(chatConfig.main_channel, globalConfig.game_title + " Day " + playTimeDays + ", Hour 12 to Hour 24");
            }
          }
          if (currentHour == hourToCheckPm) {
            //
            console.log("B Time can be checked here for the start of the run");
            console.log("Day " + (playTimeDays + 1) + " Hour 0 to Hour 12 ");
            console.log("Current Hour " + currentHour + " equals to " + hourToCheckPm);
            updateStreamTitle(globalConfig.stream_title + " Day " + (playTimeDays + 1) + ", Hour 0 to Hour 12, type !help to learn how to play", twitchCredentials, twitchJsonEncodedAppAccessToken);
            if (client.readyState() === "OPEN") {
              let randomColorName = Math.floor(Math.random() * defaultColors.length);
              client.say(chatConfig.main_channel, ".color " + defaultColorNames[randomColorName]);
              client.action(chatConfig.main_channel, globalConfig.game_title + " Day " + (playTimeDays + 1) + ", Hour 0 to Hour 12");
            }
          }
          /*
          if ((currentHour == hourToCheckAm) || (currentHour == hourToCheckPm)) {
            console.log("PogChamp?");
          }
          */
        }
      }
    }
  }
  if (playTimeTotal >= 0 && playTimeTotal >= runStartLeniency) {
    //console.log(playTimeTotal);
    //console.log(" Time can be checked here for the rest of the run");
    if (oldSecond != currentSecond) {
      //console.log("Second changed from " + oldSecond + " to " + currentSecond);
      if (currentSecond == secondToCheck) {
        //console.log("Current Second " + currentSecond + " equals to " + secondToCheck);
        if (currentMinute == minuteToCheck) {
          //console.log("Current Minute " + currentMinute + " equals to " + minuteToCheck);
          if (currentHour == hourToCheckAm) {
            //
            console.log(" A Time can be checked here for the rest of the run");
            console.log("Day " + (playTimeDays) + " Hour 12 to Hour 24 ");
            console.log("Current Hour " + currentHour + " equals to " + hourToCheckAm);
            updateStreamTitle(globalConfig.stream_title + " Day " + playTimeDays + ", Hour 12 to Hour 24, type !help to learn how to play", twitchCredentials, twitchJsonEncodedAppAccessToken);
            if (client.readyState() === "OPEN") {
              let randomColorName = Math.floor(Math.random() * defaultColors.length);
              client.say(chatConfig.main_channel, ".color " + defaultColorNames[randomColorName]);
              client.action(chatConfig.main_channel, globalConfig.game_title + " Day " + playTimeDays + ", Hour 12 to Hour 24");
            }
          }
          if (currentHour == hourToCheckPm) {
            //
            console.log(" B Time can be checked here for the rest of the run");
            console.log("Day " + (playTimeDays + 1) + " Hour 0 to Hour 12 ");
            console.log("Current Hour " + currentHour + " equals to " + hourToCheckPm);
            updateStreamTitle(globalConfig.stream_title + " Day " + (playTimeDays + 1) + ", Hour 0 to Hour 12, type !help to learn how to play", twitchCredentials, twitchJsonEncodedAppAccessToken);
            if (client.readyState() === "OPEN") {
              let randomColorName = Math.floor(Math.random() * defaultColors.length);
              client.say(chatConfig.main_channel, ".color " + defaultColorNames[randomColorName]);
              client.action(chatConfig.main_channel, globalConfig.game_title + " Day " + (playTimeDays + 1) + ", Hour 0 to Hour 12");
            }
          }
          /*
          if ((currentHour == hourToCheckAm) || (currentHour == hourToCheckPm)) {
            console.log("PogChamp?");
          }
          */
        }
      }
    }
  }
  //console.log(currentTimeObject.getUTCHours());
  //console.log(currentHour + " " + currentMinute + " " + currentSecond + " " + oldHour + " " + oldMinute + " " + oldSecond);
  oldSecond = currentSecond;
  oldMinute = currentMinute;
  oldHour = currentHour;
}

//updateStreamTitle("test");
//getTwitchTokenStatus();
generateTwitchOAuthToken(twitchCredentials);
//console.log(twitchJsonEncodedAppAccessToken);

async function generateTwitchOAuthToken(twitchCredentialsObject) {
  // This function should only be called when the server starts to generate a new OAuth 2.0 Token
  // According to the Twitch API Documentation, this is the wrong way for refreshing an OAuth 2.0 Token, but it works
  console.log(new Date().toISOString() + " Attempting to generate new Twitch OAuth 2.0 Token!");
  let twitchClientId = twitchCredentialsObject.twitch_client_id;
  let twitchClientSecret = twitchCredentialsObject.twitch_client_secret;
  let twitchGrantType = "client_credentials";
  let twitchScopes = "analytics:read:extensions%20analytics:read:games%20bits:read%20channel:edit:commercial%20channel:manage:broadcast%20channel:manage:extensions%20channel:manage:polls%20channel:manage:predictions%20channel:manage:redemptions%20channel:manage:schedule%20channel:manage:videos%20channel:read:editors%20channel:read:goals%20channel:read:hype_train%20channel:read:polls%20channel:read:predictions%20channel:read:redemptions%20channel:read:stream_key%20channel:read:subscriptions%20clips:edit%20moderation:read%20moderator:manage:banned_users%20moderator:read:blocked_terms%20moderator:manage:blocked_terms%20moderator:manage:automod%20moderator:read:automod_settings%20moderator:manage:automod_settings%20moderator:read:chat_settings%20moderator:manage:chat_settings%20user:edit%20user:edit:follows%20user:manage:blocked_users%20user:read:blocked_users%20user:read:broadcast%20user:read:email%20user:read:follows%20user:read:subscriptions%20channel_subscriptions%20channel_commercial%20channel_editor%20user_follows_edit%20channel_read%20user_read%20user_blocks_read%20user_blocks_edit%20channel:moderate%20chat:edit%20chat:read%20whispers:read%20whispers:edit";
  let httpsOptions = {
    hostname: "id.twitch.tv",
    path: "/oauth2/token?" + "client_id=" + twitchClientId + "&client_secret=" + twitchClientSecret + "&grant_type=" + twitchGrantType + "&scope=" + twitchScopes,
    method: "POST"
  };

  let twitchRequest = https.request(httpsOptions, res => {
    console.log("statusCode: " + res.statusCode);
    //console.log(res);

    res.on("data", (d) => {
      console.log(new Date().toISOString() + " Did it work?");
      //console.log("BODY: " + d);
      //console.log(d);
      let outputData = JSON.parse(d.toString("utf8"));
      twitchJsonEncodedAppAccessToken = outputData;
      setInterval(getStreamViewerCount, 5000, twitchCredentials, twitchJsonEncodedAppAccessToken);
      //console.log(outputData);
      //console.log(outputData.message);
      //process.stdout.write(d);
      //console.log(d);
    });
  });

  twitchRequest.on("error", (error) => {
    console.log(new Date().toISOString() + " Did it fail?");
    console.error(error);
  });

  //twitchRequest.write(streamTitleToUpdate);
  twitchRequest.end();
  //await sleep(2000);
  console.log(new Date().toISOString() + " Was the token generated?");
  //getTwitchTokenStatus(twitchJsonEncodedAppAccessToken);
  //console.log(twitchJsonEncodedAppAccessToken);
}

//setInterval(updateStreamTitleTest, 10000);

function updateStreamTitleTest() {
  updateStreamTitle("TEST", twitchCredentials, twitchJsonEncodedAppAccessToken);
}

function updateStreamTitle(newStreamTitle, twitchCredentialsObject, twitchAccessTokenObject) {
  console.log("Attempting to update stream title to: " + newStreamTitle);
  let twitchClientId = twitchCredentialsObject.twitch_client_id;
  let twitchChannelId = twitchCredentialsObject.twitch_channel_id;
  let twitchOauthToken = twitchCredentialsObject.twitch_oauth_access_token;
  let streamTitleToUpdate = "{\"title\":\"" + newStreamTitle + "\"}";
  let options = {
    hostname: "api.twitch.tv",
    path: "/helix/channels?broadcaster_id=" + twitchChannelId,
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + twitchOauthToken,
      "Client-Id": twitchClientId
    }
  };

  let req = https.request(options, res => {
    console.log("statusCode: " + res.statusCode);

    res.on("data", (d) => {
      console.log(JSON.parse(d.toString("utf8")));
      //process.stdout.write(d);
      //console.log(d);
    });
  });

  req.on("error", (error) => {
    console.error(error);
  });
  req.write(streamTitleToUpdate);
  req.end();
  console.log("I'm not sure if the stream title was updated or not, look above for any error messages!");
  getTwitchTokenStatus(twitchAccessTokenObject);
}

function getTwitchTokenStatus(twitchAccessTokenObject) {
  let twitchOauthToken = twitchAccessTokenObject.access_token;
  let options = {
    hostname: "id.twitch.tv",
    path: "/oauth2/validate",
    method: "GET",
    headers: {
      "Authorization": "Bearer " + twitchOauthToken
    }
  };

  let req = https.request(options, res => {
    console.log("statusCode: " + res.statusCode);

    res.on("data", (d) => {
      console.log(JSON.parse(d.toString("utf8")));
      //process.stdout.write(d);
      //console.log(d);
    });
  });

  req.on("error", (error) => {
    console.error(error);
  });
  req.end();
}

setInterval(checkChatConnection, 10000);

function checkChatConnection() {
  //console.log(client.readyState());
  //console.log(new Date().toISOString() + " [checkChatConnection CHAT READY STATES] chatLogger.readyState() = " + chatLogger.readyState() + " client.readyState() = " + client.readyState() + " clientReconnectAttempts = " + clientReconnectAttempts + " chatLoggerReconnectAttempts = " + chatLoggerReconnectAttempts);
  if (client.readyState() === "CLOSED") {
    clientReconnectAttempts++;
    console.log(new Date().toISOString() + " [checkChatConnection A CHAT READY STATES] chatLogger.readyState() = " + chatLogger.readyState() + " client.readyState() = " + client.readyState() + " clientReconnectAttempts = " + clientReconnectAttempts + " chatLoggerReconnectAttempts = " + chatLoggerReconnectAttempts);
    client.connect();
  }
  if (chatLogger.readyState() === "CLOSED") {
    chatLoggerReconnectAttempts++;
    console.log(new Date().toISOString() + " [checkChatConnection B CHAT READY STATES] chatLogger.readyState() = " + chatLogger.readyState() + " client.readyState() = " + client.readyState() + " clientReconnectAttempts = " + clientReconnectAttempts + " chatLoggerReconnectAttempts = " + chatLoggerReconnectAttempts);
    chatLogger.connect();
  }
}

setInterval(checkRunStartTime, 100);

function checkRunStartTime() {
  //new Date().getTime();
  if (stopCheckingRunStartTime == true) {
    return;
  }
  //currentTime = new Date().getTime();
  /*
  if (new Date().getTime() < runStartTime) {
    //stopCheckingRunStartTime = true;
    acceptInputs = false;
    console.log(currentTime + " is less than " + globalConfig.run_start_time);
  }
  */
  if (new Date().getTime() >= runStartTime) {
    stopCheckingRunStartTime = true;
    acceptInputs = true;
    console.log(new Date().getTime() + " is greater or equals than " + runStartTime);
    if (client.readyState() === "OPEN") {
      let randomColorName = Math.floor(Math.random() * defaultColors.length);
      client.say(chatConfig.main_channel, ".color " + defaultColorNames[randomColorName]);
      client.action(chatConfig.main_channel, "Run has started!");
    }
  }
  //oldTime = currentTime;
  //globalConfig.run_start_time;
  /*
  if (acceptInputs == false) {

  }
  */
}

// Called every time a message comes in
async function onMessageHandler(target, tags, message, self) {
  let internalMessageTimestamp = new Date().getTime();
  let internalMessageTimestampIsoString = new Date(internalMessageTimestamp).toISOString();
  //console.log(tags);
  if (self == true) {
    return;
  } // Ignore messages from the bot
  //console.log(message);
  //console.log(target);
  //console.log("TAGS");
  //console.log(tags);
  let originalMessage = message;
  let customRewardId = tags["custom-reward-id"];
  let messageType = tags["message-type"];
  let displayName = tags["display-name"];
  let username = tags["username"];
  let userColor = tags["color"];
  let userColorInverted = "#000000";
  let isFirstTwitchMessage = tags["first-msg"];
  let twitchUserColor = userColor;
  let messageId = tags["id"];
  let twitchMessageTimestamp = tags["tmi-sent-ts"];
  let twitchMessageTimestampIsoString = "";
  //console.log(messageType);
  //console.log(JSON.stringify(tags));
  if (isNaN(parseInt(twitchMessageTimestamp, 10)) == false) {
    twitchMessageTimestamp = parseInt(twitchMessageTimestamp, 10);
    twitchMessageTimestampIsoString = new Date(parseInt(twitchMessageTimestamp, 10)).toISOString();
  }
  if (isNaN(parseInt(twitchMessageTimestamp, 10)) == true) {
    twitchMessageTimestamp = internalMessageTimestamp;
    twitchMessageTimestampIsoString = internalMessageTimestampIsoString;
  }
  //console.log("internalMessageTimestamp = " + internalMessageTimestamp);
  //console.log("internalMessageTimestampIsoString = " + internalMessageTimestampIsoString);
  //console.log("twitchMessageTimestamp = " + twitchMessageTimestamp);
  //console.log("twitchMessageTimestampIsoString = " + twitchMessageTimestampIsoString);
  //console.log("messageId = " + messageId);
  let userId = tags["user-id"];
  let roomId = tags["room-id"];
  //console.log("roomId=" + roomId);
  //console.log("userId=" + userId);
  username = username.replace(/(\\s)+/ig, "");
  username = username.replace(/\s+/ig, "");
  displayName = displayName.replace(/(\\s)+/ig, "");
  displayName = displayName.replace(/\s+/ig, "");
  let usernameToPing = (username.toLowerCase() == displayName.toLowerCase()) ? displayName : username;
  let randomColorIndex = Math.floor(Math.random() * defaultColors.length);
  let randomColor = defaultColors[randomColorIndex];
  //console.log("randomColor = " + randomColor);
  if (userColor == null || userColor == undefined) {
    //var randomColor = Math.floor(Math.random() * defaultColors.length);
    //console.log("Color " + defaultColors[randomColor] + " " + defaultColorNames[randomColor])
    //userColor = defaultColors[randomColor];
    //userColor = "#DEDEDE"; // Default twitch color when an user doesn't have color set (only appears on vod playback, not live chat)
    userColor = "#000000";
    /*
    usersWhoDontHaveColor.push({
      user_color: userColor,
      user_id: userId
    });
    */
  }
  /*
  console.log(target);
  console.log(tags);
  console.log(message);
  console.log(self);
  */
  //var inputContainsDashes = false;
  //var inputContainsDashesAtTheEnd = false;
  /*
  console.log(userId);
  console.log(messageId);
  console.log(userColor);
  console.log(customRewardId);
  console.log(messageType);
  console.log(displayName);
  console.log(username);
  console.log(message);
  */
  if (messageType == "whisper") {
    // Resend whisper to channel owner here
    let randomColorName = Math.floor(Math.random() * defaultColors.length);
    client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
    if (chatConfig.resend_whisper_to_channel_owner == true) {
      client.whisper(chatConfig.channel_owner, new Date().toISOString() + " [WHISPER] " + userId + " " + usernameToPing + ": " + originalMessage);
    }
    if (chatConfig.send_debug_channel_messages == true) {
      //
    }
    if (chatConfig.resend_whisper_to_debug_channel == true) {
      client.action(chatConfig.debug_channel, new Date().toISOString() + " [WHISPER] " + userId + " " + usernameToPing + ": " + originalMessage);
    }
  }
  if (messageType == "chat" || messageType == "action") {
    //let checkBigFollowsSpamBot = /(w+a+n+a+)+\s+(b+e+c+o+m+e)+\s+(f+a+m+o+u+s+\W*)+\s+(b+u+y+)+\s+(f+o+l+o+w+\w*)+\W*\s*(p*r*i*m*e*s*)*\s+(a+n+d+)+\s+(v+i+e+w+\w*)+\s+(\w*)+\s*/ig.test(message.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, ""));

    //let checkTwitchViewBotSoftwareBot = /(t+w+\w*t+c+h+)+\s+(v+i+e+w+\w*\s*b+o+t+\w*)+\s+(s+o+f+t+w+a+r+e+\w*\W*)+\s*(d+o+)+\s+(a+n+y+)+\s*(o+n+l+i+n+e+)*\s+(\w*)+\s+(a+n+y+)+\s+(s+t+r+e+a+m+\w*\W*\w*)+\s+(\W*\d*\W*)+\W*\s*((d+i+s+c+o+r+d+)+\s+\W*\s+(\w+\W*\d+))*/ig.test(message.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, ""));

    /*
    let bannerSpamBotTypeA = [/((i+t+)+\s*(i+s+)|(i+t+\W*s+))+\s+(n+i+c+e+)+\s+(t+o+)+\s+(m+e+t+)+\s+(y+\w*)+\s+(\w+\W*v+e+)+\s+(w+a+t+c+h+e+d+)+\s+(y+\w*)+\s+([^\n\s]*)+\s+(t+w+\w*t+c+h+)\s+(c+h+a+n+e+l+\w*\W*)+/ig.test(message.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, "")),
      /(y+\w*)+\s+(s+i+r+\W*)+\s+(h+a+v+e+)+\s+(f+l+o+w+\W*)+\s+(i+t+\W*s+)+\s+(a+w+e+s+\w+m+e\W*)+\s+(\w+)+\s+(l+i+k+e+)+\s+(y+\w*)+\s+(s+t+r+e+a+m+\w*\W*\w*)+/ig.test(message.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, "")),
      /(g+o+d+\W*)+\s+((\w+\W*\s*a+m+)|(\w+\W*\s*m+))+\s+(\w*b+o+u+t+)+\s+(t+o+)+\s+(d+o+)+\s+(g+r+a+p+h+i+c+)+\s+(d+e+s+i+g+n+)+\s+(f+o+r+)+\s+(y+\w*)+\s+(s+t+r+e+a+m+\w*\W*\w*)+/ig.test(message.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, "")),
      /(h+a+v+e+)+\s+(\w+)+\s+(l+o+k+)+\s+((a*t*|i*n*|o*n*)*\s*(t+h+e+)+)+\s+(r+e+f+e+r+e+n+c+e)+\s+(\w*)+\s+(m+y+)+\s+(p+r+o+f+i+l+e\W*\w*)+\s+(b+a+n+e+r+)+/ig.test(message.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, ""))
    ];
    */
    //console.log(bannerSpamBotTypeA);
    /*
    let bannerSpamBotTypeB = [/(h+e+y+)+\s+(t+h+e+r+e+\W*)+\s+(w+h+a+t+\W*s+\s*n+e+w+)+\s+(\w+)+\s+(c+h+e+c+k+e+d+)+\s+(o+u+t+)+\s+(y+\w*)+\s+([^\n\s]*)+\s+(c+h+a+n+e+l+\w*)+\s+(h+e+r+e+)+\s+(\w+)+\s+(t+w+\w*t+c+h+\W*)+/ig.test(message.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig)),
      /^(\w*b+o+u+t+)+/ig.test(message.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig)),
      /(k+e+e+p+)+\s+(u+p+)+\s+(t+h+e+)+\s+(g+o+d+)+\s+(s+t+r+e+a+m\w*\W*\w*)+\s+(m+a+n+)+\s+((\w+\W*\s*a+m+)|(\w+\W*\s*m+))+\s+(g+o+i+n+g+)+\s+(t+o+)+\s+(d+o+)+\s+(a+n+i+m+a+t+e+d+)+\s+(b+r+b+\W*)+\s+(i+n+t+r+o\W*)+\s+(a+n+d+)+\s+(o+f+l+i+n+e+)+\s+(s+c+r+e+n+)+\s+(f+o+r+)+\s+(y+\w*)+\s+(c+h+a+n+e+l+\w*\W*)+/ig.test(message.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig)),
      /(t+a+k+e+)+\s+(\w+)+\s+(l+o+k+)+\s+((a*t*|i*n*|o*n*)*\s*(t+h+e+)+)+\s+(u+r+l+)+\s+(\w*)+\s+(m+y+)+\s+(a+c+o+u+n+t+\W*\w*)+\s+(i+m+a+g+e+)+\s+(p+r+o+b+a+b+l+y+)+\s+(t+h+e+)+\s+(b+e+s+t+\W*)+/ig.test(message.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig))
    ];
    */
    //console.log(bannerSpamBotTypeB);
    //console.log("checkBigFollowsSpamBot = " + checkBigFollowsSpamBot);
    //console.log("checkTwitchViewBotSoftwareBot = " + checkTwitchViewBotSoftwareBot);

    //let checkDiscordStreamersCommunityBot = /(h+e+y+\W*)+\s+(n+i+c+e+)+\s+(s+t+r+e+a+m+\w*\W*\w*\W*)+\s+(y+\w*)+\s+(s+h+\w*)+\s+(f+o+r+)+\s+(s+u+r+e+)+\s+(j+o+i+n+)+\s+(\w*)+\s+(s+t+r+e+a+m\w*\W*\w*)+\s+(c+o+m+u+n+i+t+y+)+\s+(\w*)+\s+(j+u+s+t+)+\s+(f+o+u+n+d+)+\s+(\w*)+\s+(d+i+s+c+o+r+d+)+\s+(y+e+s+t+e+r+d+a+y+)+\s+([^\n\s]*)+\s+(c+h+e+c+k+)+\s+(i+t+)+\s+(o+u+t+)+/ig.test(message.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig));
    //console.log("checkDiscordStreamersCommunityBot = " + checkDiscordStreamersCommunityBot);

    //let singleMessageSpamBots = [/(w+a+n+a+)+\s+(b+e+c+o+m+e)+\s+(f+a+m+o+u+s+\W*)+\s+(b+u+y+)+\s+(f+o+l+o+w+\w*)+\W*\s*(p*r*i*m*e*s*)*\s+(a+n+d+)+\s+(v+i+e+w+\w*)+\s+(\w*)+\s*/ig.test(message.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, "")),
    //  /(t+w+\w*t+c+h+)+\s+(v+i+e+w+\w*\s*b+o+t+\w*)+\s+(s+o+f+t+w+a+r+e+\w*\W*)+\s*(d+o+)+\s+(a+n+y+)+\s*(o+n+l+i+n+e+)*\s+(\w*)+\s+(a+n+y+)+\s+(s+t+r+e+a+m+\w*\W*\w*)+\s+(\W*\d*\W*)+\W*\s*((d+i+s+c+o+r+d+)+\s+\W*\s+(\w+\W*\d+))*/ig.test(message.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, "")),
    //  /(h+e+y+\W*)+\s+(n+i+c+e+)+\s+(s+t+r+e+a+m+\w*\W*\w*\W*)+\s+(y+\w*)+\s+(s+h+\w*)+\s+(f+o+r+)+\s+(s+u+r+e+)+\s+(j+o+i+n+)+\s+(\w*)+\s+(s+t+r+e+a+m\w*\W*\w*)+\s+(c+o+m+u+n+i+t+y+)+\s+(\w*)+\s+(j+u+s+t+)+\s+(f+o+u+n+d+)+\s+(\w*)+\s+(d+i+s+c+o+r+d+)+\s+(y+e+s+t+e+r+d+a+y+)+\s+([^\n\s]*)+\s+(c+h+e+c+k+)+\s+(i+t+)+\s+(o+u+t+)+/ig.test(message.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig)),
    //  /(d+o+)+\s+(y+o+\w*)+\s+((w+a+n+t+)|(w+a+n+a+))+\s+(p+o+p+u+l+a+r+\w*[^\n\s]*)+\s+(b+u+y+)+\s+(f+o+l+o+w+\w*)+\s+(a+n+d+)+\s+(v+i+e+w+\w*)+\s+(\w+)+\s+([^\n\s]+)+/ig.test(message.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig)),
    //  /([^\n\s]+)+\s+([^\n\s]+)+\s+(a+f+i+l+i+a+t+e+)+\s+(f+o+\w*)+\s+(f+r+e+)+\s+([^\n\s]+)+/ig.test(message.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig)), // Message processing somethings hangs on this regex
    //  /([^\n\s]+)+\s+(s+u+\w+e+r+\w*)+\s+(p+r+i+m+e+)+\s+(s+u+b+\w*)+\s+([^\n\s]+)+/ig.test(message.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig))
    //];
    let replaceCyrillicsWithLatin = message;
    replaceCyrillicsWithLatin = replaceCyrillicsWithLatin.normalize("NFD");

    for (let cyrillicsReplacementTableIndex = 0; cyrillicsReplacementTableIndex < cyrillicsReplacementTable.length; cyrillicsReplacementTableIndex++) {
      replaceCyrillicsWithLatin = replaceCyrillicsWithLatin.replace(cyrillicsReplacementTable[cyrillicsReplacementTableIndex].symbolOriginalString, cyrillicsReplacementTable[cyrillicsReplacementTableIndex].symbolReplacementString);
      //console.log(cyrillicsReplacementTableIndex);
      //console.log(cyrillicsReplacementTable[cyrillicsReplacementTableIndex]);
      //console.log(cyrillicsReplacementTable[cyrillicsReplacementTableIndex].symbolOriginalString);
      //console.log(cyrillicsReplacementTable[cyrillicsReplacementTableIndex].symbolReplacementString);
    }
    //console.log("replaceCyrillicsWithLatin");
    //console.log(replaceCyrillicsWithLatin);

    let singleMessageSpamBots = [/(b+u+y+)+\s+(f+o+l+o+w+\w*)+\W*\s*(p*r*i*m*e*\w*)*\s+(a+n+d+)+\s+(v+i+e+w+\w*)+/ig.test(replaceCyrillicsWithLatin.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, "")),
      ///(w+a+n+\w+)+\s*(t*o*)*\s+(b+e+c+o+m+e)+\s+(f+a+m+o+u+s+\W*)+\s+(b+u+y+)+\s+(f+o+l+o+w+\w*)+\W*\s*(p*r*i*m*e*\w*)*\s+(a+n+d+)+\s+(v+i+e+w+\w*)+\s+(\w*)/ig.test(replaceCyrillicsWithLatin.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, "")),
      /(t+w+\w*t+c+h+)+\s+(v+i+e+w+\w*\s*b+o+t+\w*)+\s+(s+o+f+t+w+a+r+e+\w*\W*)+\s*(d+o+)+\s+(a+n+y+)+\s*(o+n+l+i+n+e+)*\s+(\w*)\s+(a+n+y+)+\s+(s+t+r+e+a+m+[^\s]*)+\s+([^\s]*)\s*(d+i+s+c+o+r+d+)+\s+([^\s]*)\s+([^\s]*)/ig.test(replaceCyrillicsWithLatin.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, "")),
      /(h+e+y+[^\s]*)+\s+(n+i+c+e+)+\s+(s+t+r+e+a+m+[^\s]*)+\s+(y+\w*)+\s+(s+h+\w*)+\s+(f+o+r+)+\s+(s+u+r+e+)+\s+(j+o+i+n+)+\s+(\w*)\s+(s+t+r+e+a+m+[^\s]*)+\s+(c+o+m+u+n+i+t+y+)+\s+(\w*)\s+(j+u+s+t+)+\s+(f+o+u+n+d+)+\s+(\w*)\s+(d+i+s+c+o+r+d+)+\s+(y+e+s+t+e+r+d+a+y+)+\s+([^\s]*)\s+(c+h+e+c+k+)+\s+(i+t+)+\s+(o+u+t+)+\s*([^\s]*)/ig.test(replaceCyrillicsWithLatin.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, "")),
      /(d+o+)+\s+(y+o+\w*)+\s+(w+a+n+\w+)+\s*(t*o*)*\s*(b*e*c*o*m*e*)*\s+(p+o+p+u+l+a+r+\w*[^\s]*)+\s+(b+u+y+)+\s+(f+o+l+o+w+\w*)+\s+(a+n+d+)+\s+(v+i+e+w+\w*)+\s+(\w+)\s+([^\s]+)/ig.test(replaceCyrillicsWithLatin.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, "")),
      /(a+f+i+l+i+a+t+e+)+\s+(f+o+\w*)+\s+(f+r+e+)+/ig.test(replaceCyrillicsWithLatin.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, "")),
      ///([^\s]*)\s*([^\s]+)\s+(a+f+i+l+i+a+t+e+)+\s+(f+o+\w*)+\s+(f+r+e+)+\s*([^\s]*)/ig.test(replaceCyrillicsWithLatin.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, "")),
      /([^\s]+)\s+(s+u+\w+e+r+\w*)+\s+(p+r+i+m+e+)+\s+(s+u+b+\w*)+\s*([^\s]*)/ig.test(replaceCyrillicsWithLatin.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, "")),
      /([^\s]*)\s*(h+e+l+o+[^\s]*)+\s+(i+f+)+\s+(y+o+u+\w*)+\s+(n+e+d+)+\s+(r+e+a+l+)\s+(f+r+e+)+\s+(a+n+d+)+\s+(h+i+g+h+)+\s+(q+u+a+l+i+t+y+)+\s+(s+e+r+v+i+c+e+s*)+\s+(t+\w*)+\s+(i+n+c+r+e+a+s+e+)+\s+(y+o+u+\w*)+\s+(v+i+e+w+\w*)/ig.test(replaceCyrillicsWithLatin.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, "")),
      /(c+u+t+)+\s*(\.+|d+o+t+)*\s*(l+y+)+/ig.test(replaceCyrillicsWithLatin.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, "")),
      /(b+i+g+)+\s*(\.+|d+o+t+)*\s*(f+o+l+o+w+\w*)+/ig.test(replaceCyrillicsWithLatin.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, "")),
      /(c+h+i+l+p+|b+i+g+\s*f+o+l+o+w+\w*)+\s*(\.+|d+o+t+)*\s*(c+o+m+|i+t+)+/ig.test(replaceCyrillicsWithLatin.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, "")),
      ///(b+i+g+\s*f+o+l+o+w+\w*)+\s*(\.+|d+o+t+)*\s*(c+o+m+)+/ig.test(replaceCyrillicsWithLatin.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, "")),
      /(h+e+l+o+[^\s]*)+\s+(i+)+\s+(d+o+)+\s+(g+r+a+p+h+i+c+)+\s+(d+e+s+i+g+n+)+\s+(\w+o+)+\s+(i+f+)+\s+(y+o+u+\w*)+\s+(n+e+d+)+\s+(w+o+r+k+)+\s+(d+o+n+e+)+\s+(l+i+k+e+)+\s+(\w+)+\s+(l+o+g+o+[^\s]*)+\s+(b+a+n+e+r+[^\s]*)+\s+(p+a+n+e+l+[^\s]*)+\s+(o+v+e+r+l+a+y+[^\s]*)+\s+(e+t+c+[^\s]*)+/ig.test(replaceCyrillicsWithLatin.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, ""))
    ];
    let multiMessageSpamBotTypeA = [/((i+t+)+\s*(i+s+)|(i+t+\W*s+))+\s+(n+i+c+e+)+\s+(t+o+)+\s+(m+e+t+)+\s+(y+\w*)+\s+(\w+\W*v+e+)+\s+(w+a+t+c+h+e+d+)+\s+(y+\w*)+\s+([^\s]*)+\s+(t+w+\w*t+c+h+)\s+(c+h+a+n+e+l+\w*\W*)+/ig.test(replaceCyrillicsWithLatin.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, "")),
      /(y+\w*)+\s+(s+i+r+\W*)+\s+(h+a+v+e+)+\s+(f+l+o+w+\W*)+\s+(i+t+\W*s+)+\s+(a+w+e+s+\w+m+e\W*)+\s+(\w+)+\s+(l+i+k+e+)+\s+(y+\w*)+\s+(s+t+r+e+a+m+\w*\W*\w*)+/ig.test(replaceCyrillicsWithLatin.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, "")),
      /(g+o+d+\W*)+\s+((\w+\W*\s*a+m+)|(\w+\W*\s*m+))+\s+(\w*b+o+u+t+)+\s+(t+o+)+\s+(d+o+)+\s+(g+r+a+p+h+i+c+)+\s+(d+e+s+i+g+n+)+\s+(f+o+r+)+\s+(y+\w*)+\s+(s+t+r+e+a+m+\w*\W*\w*)+/ig.test(replaceCyrillicsWithLatin.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, "")),
      /(h+a+v+e+)+\s+(\w+)+\s+(l+o+k+)+\s+((a*t*|i*n*|o*n*)*\s*(t+h+e+)+)+\s+(r+e+f+e+r+e+n+c+e)+\s+(\w*)+\s+(m+y+)+\s+(p+r+o+f+i+l+e\W*\w*)+\s+(b+a+n+e+r+)+/ig.test(replaceCyrillicsWithLatin.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, ""))
    ];
    let multiMessageSpamBotTypeB = [/(h+e+y+)+\s+(t+h+e+r+e+\W*)+\s+(w+h+a+t+\W*s+\s*n+e+w+)+\s+(\w+)+\s+(c+h+e+c+k+e+d+)+\s+(o+u+t+)+\s+(y+\w*)+\s+([^\s]*)+\s+(c+h+a+n+e+l+\w*)+\s+(h+e+r+e+)+\s+(\w+)+\s+(t+w+\w*t+c+h+\W*)+/ig.test(replaceCyrillicsWithLatin.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, "")),
      /^(a*b+o+u+t+)+/ig.test(replaceCyrillicsWithLatin.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, "")),
      /(k+e+e+p+)+\s+(u+p+)+\s+(t+h+e+)+\s+(g+o+d+)+\s+(s+t+r+e+a+m\w*\W*\w*)+\s+(m+a+n+)+\s+((\w+\W*\s*a+m+)|(\w+\W*\s*m+))+\s+(g+o+i+n+g+)+\s+(t+o+)+\s+(d+o+)+\s+(a+n+i+m+a+t+e+d+)+\s+(b+r+b+\W*)+\s+(i+n+t+r+o\W*)+\s+(a+n+d+)+\s+(o+f+l+i+n+e+)+\s+(s+c+r+e+n+)+\s+(f+o+r+)+\s+(y+\w*)+\s+(c+h+a+n+e+l+\w*\W*)+/ig.test(replaceCyrillicsWithLatin.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, "")),
      /(t+a+k+e+)+\s+(\w+)+\s+(l+o+k+)+\s+((a*t*|i*n*|o*n*)*\s*(t+h+e+)+)+\s+(u+r+l+)+\s+(\w*)+\s+(m+y+)+\s+(a+c+o+u+n+t+\W*\w*)+\s+(i+m+a+g+e+)+\s+(p+r+o+b+a+b+l+y+)+\s+(t+h+e+)+\s+(b+e+s+t+\W*)+/ig.test(replaceCyrillicsWithLatin.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, ""))
    ];
    //console.log("singleMessageSpamBots");
    //console.log(singleMessageSpamBots);
    //console.log("multiMessageSpamBotTypeA");
    //console.log(multiMessageSpamBotTypeA);
    //console.log("multiMessageSpamBotTypeB");
    //console.log(multiMessageSpamBotTypeB);
    let isSingleMessageSpamBot = false;
    let isFirstMessageSpam = false;
    let isPossibleMultiMessageSpamBot = false;
    for (let singleMessageSpamBotsIndex = 0; singleMessageSpamBotsIndex < singleMessageSpamBots.length; singleMessageSpamBotsIndex++) {
      if (singleMessageSpamBots[singleMessageSpamBotsIndex] == true) {
        isSingleMessageSpamBot = true;
        //isFirstMessageSpam = true;
        //console.log("We have a single message spam bot maybe, idk still have to check the database");
      }
    }
    for (let multiMessageSpamBotTypeAIndex = 0; multiMessageSpamBotTypeAIndex < multiMessageSpamBotTypeA.length; multiMessageSpamBotTypeAIndex++) {
      if (multiMessageSpamBotTypeA[multiMessageSpamBotTypeAIndex] == true) {
        isFirstMessageSpam = true;
        //console.log("We have a multimessage spambot type A, we have to check all the messages it sends tho for confirmation");
      }
    }
    for (let multiMessageSpamBotTypeBIndex = 0; multiMessageSpamBotTypeBIndex < multiMessageSpamBotTypeB.length; multiMessageSpamBotTypeBIndex++) {
      if (multiMessageSpamBotTypeB[multiMessageSpamBotTypeBIndex] == true) {
        isFirstMessageSpam = true;
        //console.log("We have a multimessage spambot type B, we have to check all the messages it sends tho for confirmation");
      }
    }
    //console.log("isSingleMessageSpamBot = " + isSingleMessageSpamBot);

    // The database checks below checks if an user exists
    // MOVE THIS UP TO WHERE THE MESSAGE ISNT MODIFIED
    // LIKE HERE
    mongoClient.connect(mongoUrl, {
      useUnifiedTopology: true
    }, function(err, userDb) {
      //isDatabaseBusy = true;
      if (err) {
        throw err;
      }
      let userDatabase = userDb.db(globalConfig.main_database_name);
      userDatabase.collection(globalConfig.chatters_collection_name).findOne({
        user_id: userId
      }, function(err, result) {
        if (err) {
          throw err;
        }
        //console.log(result);
        //isNullDatabase = result;
        if (result === null) {
          console.log("User doesn't exist");
          //
          mongoClient.connect(mongoUrl, {
            useUnifiedTopology: true
          }, function(err, databaseToCreate) {
            if (err) {
              throw err;
            }
            let userDatabaseToCreate = databaseToCreate.db(globalConfig.main_database_name);
            let dataToInsert = {
              user_id: userId,

              first_known_username: username,
              first_known_display_name: displayName,
              first_user_color: twitchUserColor,
              first_username_to_ping: usernameToPing,

              last_known_username: username,
              last_known_display_name: displayName,
              last_user_color: twitchUserColor,
              last_username_to_ping: usernameToPing,

              randomly_generated_color: randomColor,

              messages_sent: 1,

              is_first_twitch_message: isFirstTwitchMessage,

              first_message_sent_id: messageId,
              first_message_sent: originalMessage,
              first_message_sent_at_timestamp: internalMessageTimestamp,
              first_message_sent_at_iso_timestamp: internalMessageTimestampIsoString,
              first_message_sent_at_twitch_timestamp: twitchMessageTimestamp,
              first_message_sent_at_twitch_iso_timestamp: twitchMessageTimestampIsoString,
              first_message_length: originalMessage.length,
              is_first_message_basic_input: false,
              is_first_message_advanced_input: false,
              first_basic_input: "",
              first_advanced_input: "",

              last_message_sent_id: messageId,
              last_message_sent: originalMessage,
              last_message_sent_at_timestamp: internalMessageTimestamp,
              last_message_sent_at_iso_timestamp: internalMessageTimestampIsoString,
              last_message_sent_at_twitch_timestamp: twitchMessageTimestamp,
              last_message_sent_at_twitch_iso_timestamp: twitchMessageTimestampIsoString,
              last_message_length: originalMessage.length,
              is_last_message_basic_input: false,
              is_last_message_advanced_input: false,
              last_basic_input: "",
              last_advanced_input: "",

              shortest_message_sent_id: messageId,
              shortest_message_sent: originalMessage,
              shortest_message_sent_at_timestamp: internalMessageTimestamp,
              shortest_message_sent_at_iso_timestamp: internalMessageTimestampIsoString,
              shortest_message_sent_at_twitch_timestamp: twitchMessageTimestamp,
              shortest_message_sent_at_twitch_iso_timestamp: twitchMessageTimestampIsoString,
              shortest_message_length: originalMessage.length,

              longest_message_sent_id: messageId,
              longest_message_sent: originalMessage,
              longest_message_sent_at_timestamp: internalMessageTimestamp,
              longest_message_sent_at_iso_timestamp: internalMessageTimestampIsoString,
              longest_message_sent_at_twitch_timestamp: twitchMessageTimestamp,
              longest_message_sent_at_twitch_iso_timestamp: twitchMessageTimestampIsoString,
              longest_message_length: originalMessage.length,

              basic_inputs_sent: 0,
              advanced_inputs_sent: 0,
              total_inputs_sent: 0,
              ban_count: 0,
              strike_count: 0,
              timeout_count: 0,
              message_deletion_count: 0,
              is_account_blacklisted: false,
              is_banned: false,
              is_first_message_spam_bot: isFirstMessageSpam,
              is_spam_bot: isSingleMessageSpamBot
            };
            if (isFirstMessageSpam == false) {
              if (dataToInsert.first_message_sent_id == dataToInsert.last_message_sent_id) {
                if (dataToInsert.first_message_length >= globalConfig.long_message_length) {
                  if (globalConfig.permaban_if_first_message_is_long == true) {
                    dataToInsert.ban_count = dataToInsert.ban_count + 1;
                    //dataToInsert.is_account_blacklisted = true;
                    dataToInsert.is_banned = true;
                  }
                  if (globalConfig.permaban_if_first_message_is_long == false) {
                    dataToInsert.timeout_count = dataToInsert.timeout_count + 1;
                  }
                }
              }
            }
            if (isFirstMessageSpam == true) {
              dataToInsert.strike_count = dataToInsert.strike_count + 1;
            }
            if (isSingleMessageSpamBot == true) {
              dataToInsert.ban_count = dataToInsert.ban_count + 1;
              dataToInsert.is_account_blacklisted = true;
              dataToInsert.is_banned = true;
            }
            if (dataToInsert.is_account_blacklisted == true) {
              dataToInsert.message_deletion_count = dataToInsert.message_deletion_count + 1;
            }
            /*
            if (checkBigFollowsSpamBot == true) {
              dataToInsert = {
                user_id: userId,
                messages_sent: 1,
                input_count: 0,
                ban_count: 1,
                is_spam_bot: true
              };
            }
            if (checkBigFollowsSpamBot == false) {
              dataToInsert = {
                user_id: userId,
                messages_sent: 1,
                input_count: 0,
                ban_count: 0,
                is_spam_bot: false
              };
            }
            */
            userDatabaseToCreate.collection(globalConfig.chatters_collection_name).insertOne(dataToInsert, function(err, res) {
              if (err) {
                throw err;
              }
              //console.log("1 document inserted");
              mongoClient.connect(mongoUrl, {
                useUnifiedTopology: true
              }, function(err, databaseToReadFrom) {
                if (err) {
                  throw err;
                }
                let userDatabaseToReadFrom = databaseToReadFrom.db(globalConfig.main_database_name);
                userDatabaseToReadFrom.collection(globalConfig.chatters_collection_name).findOne({
                  user_id: userId
                }, function(err, databaseToReadFromResult) {
                  if (err) {
                    throw err;
                  }
                  databaseToReadFrom.close();
                  //console.log("databaseToReadFromResult");
                  //console.log(databaseToReadFromResult);
                  if (databaseToReadFromResult.last_user_color == null || databaseToReadFromResult.last_user_color == undefined) {
                    // This block picks the randomly generated color that was saved in the database when the user was first added to the database, and hopefully applies this color instead of using the hardcoded default color
                    userColor = databaseToReadFromResult.randomly_generated_color;
                  }
                  if (databaseToReadFromResult.first_message_sent_id == databaseToReadFromResult.last_message_sent_id) {
                    console.log("New user successfully added to database");
                    if (chatConfig.send_debug_channel_messages == true) {
                      //console.log("chatConfig.debug_channel = " + chatConfig.debug_channel);
                      let randomColorName = Math.floor(Math.random() * defaultColors.length);
                      client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
                      client.action(chatConfig.debug_channel, new Date().toISOString() + " [NEW USER] user_id=" + databaseToReadFromResult.user_id + ", last_username_to_ping=" + databaseToReadFromResult.last_username_to_ping + ", last_message_sent_id=" + databaseToReadFromResult.last_message_sent_id + ", last_message_sent=" + databaseToReadFromResult.last_message_sent + ", last_message_sent_at=" + databaseToReadFromResult.last_message_sent_at_iso_timestamp + ", last_message_length=" + databaseToReadFromResult.last_message_length + ", is_first_twitch_message=" + databaseToReadFromResult.is_first_twitch_message);
                    }
                  }
                  if (databaseToReadFromResult.is_account_blacklisted == true) {
                    if (databaseToReadFromResult.is_banned == false) {
                      console.log("Silently timeout or delete message");
                      client.say(target, ".delete " + databaseToReadFromResult.last_message_sent_id);
                      client.say(target, ".timeout " + databaseToReadFromResult.last_known_username + " 1");
                    }
                  }
                  if (databaseToReadFromResult.is_account_blacklisted == false) {
                    if (databaseToReadFromResult.is_spam_bot == false) {
                      if (databaseToReadFromResult.first_message_sent_id == databaseToReadFromResult.last_message_sent_id) {
                        if (databaseToReadFromResult.first_message_length >= globalConfig.long_message_length) {
                          console.log("First message is too long, do something about it");
                          if (globalConfig.permaban_if_first_message_is_long == true) {
                            let randomColorName = Math.floor(Math.random() * defaultColors.length);
                            client.say(target, ".color " + defaultColorNames[randomColorName]);
                            client.say(target, ".ban " + databaseToReadFromResult.last_known_username + " You were banned because your first message is too long, you're either a spam bot, or just came here to spam.");
                            client.action(target, "@" + databaseToReadFromResult.last_username_to_ping + " You were banned because your first message is too long, you're either a spam bot, or just came here to spam.");
                            client.whisper(databaseToReadFromResult.last_known_username, "@" + databaseToReadFromResult.last_username_to_ping + " You were banned because your first message is too long, you're either a spam bot, or just came here to spam. This whisper was sent from the channel " + target + ".");
                            if (chatConfig.send_debug_channel_messages == true) {
                              client.action(chatConfig.debug_channel, new Date().toISOString() + " [MODBOT] user_id=" + databaseToReadFromResult.user_id + ", last_username_to_ping=" + databaseToReadFromResult.last_username_to_ping + ", last_message_sent_id=" + databaseToReadFromResult.last_message_sent_id + ", last_message_sent=" + databaseToReadFromResult.last_message_sent + ", last_message_sent_at=" + databaseToReadFromResult.last_message_sent_at_iso_timestamp + ", last_message_length=" + databaseToReadFromResult.last_message_length + ", is_first_twitch_message=" + databaseToReadFromResult.is_first_twitch_message + " Banned, first message too long.");
                            }
                          }
                          if (globalConfig.permaban_if_first_message_is_long == false) {
                            let randomColorName = Math.floor(Math.random() * defaultColors.length);
                            client.say(target, ".color " + defaultColorNames[randomColorName]);
                            client.say(target, ".timeout " + databaseToReadFromResult.last_known_username + " " + globalConfig.long_message_timeout + " You were timed out for " + globalConfig.long_message_timeout + " seconds because your first message is too long, please calm down!");
                            client.action(target, "@" + databaseToReadFromResult.last_username_to_ping + " You were timed out for " + globalConfig.long_message_timeout + " seconds because your first message is too long, please calm down!");
                            client.whisper(databaseToReadFromResult.last_known_username, "@" + databaseToReadFromResult.last_username_to_ping + " You were timed out for " + globalConfig.long_message_timeout + " seconds because your first message is too long, please calm down! This whisper was sent from the channel " + target + ".");
                            if (chatConfig.send_debug_channel_messages == true) {
                              client.action(chatConfig.debug_channel, new Date().toISOString() + " [MODBOT] user_id=" + databaseToReadFromResult.user_id + ", last_username_to_ping=" + databaseToReadFromResult.last_username_to_ping + ", last_message_sent_id=" + databaseToReadFromResult.last_message_sent_id + ", last_message_sent=" + databaseToReadFromResult.last_message_sent + ", last_message_sent_at=" + databaseToReadFromResult.last_message_sent_at_iso_timestamp + ", last_message_length=" + databaseToReadFromResult.last_message_length + ", is_first_twitch_message=" + databaseToReadFromResult.is_first_twitch_message + " Timeout, first message too long.");
                            }
                          }
                        }
                      }
                    }
                  }
                  if (databaseToReadFromResult.is_spam_bot == true) {
                    console.log("BAN THAT MOTHERFUCKER");
                    let randomColorName = Math.floor(Math.random() * defaultColors.length);
                    client.say(target, ".color " + defaultColorNames[randomColorName]);
                    client.say(target, ".ban " + databaseToReadFromResult.last_known_username + " You were banned because you got detected as spam bot."); // These should use the names stored in the database, not the IRC names twitch sends
                    client.action(target, "@" + databaseToReadFromResult.last_username_to_ping + " You were banned because you got detected as spam bot.");
                    client.whisper(databaseToReadFromResult.last_known_username, "@" + databaseToReadFromResult.last_username_to_ping + " You were banned because you got detected as spam bot. This whisper was sent from the channel " + target + ". It is possible your account may have been compromised and is being used to send malicious links to multiple streams.");
                    if (chatConfig.send_debug_channel_messages == true) {
                      client.action(chatConfig.debug_channel, new Date().toISOString() + " [MODBOT] user_id=" + databaseToReadFromResult.user_id + ", last_username_to_ping=" + databaseToReadFromResult.last_username_to_ping + ", last_message_sent_id=" + databaseToReadFromResult.last_message_sent_id + ", last_message_sent=" + databaseToReadFromResult.last_message_sent + ", last_message_sent_at=" + databaseToReadFromResult.last_message_sent_at_iso_timestamp + ", last_message_length=" + databaseToReadFromResult.last_message_length + ", is_first_twitch_message=" + databaseToReadFromResult.is_first_twitch_message + " Banned, detected as spam bot.");
                    }
                  }
                  if (databaseToReadFromResult.is_first_message_spam_bot == true) {
                    console.log("Keep an eye on this user");
                  }
                });
              });
              databaseToCreate.close();
            });
          });
          //
          //test();
        }
        if (result !== null) {
          //console.log("User exists");
          //console.log("result");
          //console.log(result);
          mongoClient.connect(mongoUrl, {
            useUnifiedTopology: true
          }, function(err, databaseToUpdate) {
            if (err) {
              throw err;
            }
            let userDatabaseToUpdate = databaseToUpdate.db(globalConfig.main_database_name);
            let dataToQuery = {
              user_id: userId
            };
            let dataToUpdate = {
              $set: {
                user_id: userId,

                last_known_username: username,
                last_known_display_name: displayName,
                last_user_color: twitchUserColor,
                last_username_to_ping: usernameToPing,

                messages_sent: result.messages_sent + 1,

                is_first_twitch_message: result.is_first_twitch_message,

                last_message_sent_id: messageId,
                last_message_sent: originalMessage,
                last_message_sent_at_timestamp: internalMessageTimestamp,
                last_message_sent_at_iso_timestamp: internalMessageTimestampIsoString,
                last_message_sent_at_twitch_timestamp: twitchMessageTimestamp,
                last_message_sent_at_twitch_iso_timestamp: twitchMessageTimestampIsoString,
                last_message_length: originalMessage.length,
                is_last_message_basic_input: false,
                is_last_message_advanced_input: false,

                shortest_message_sent_id: result.shortest_message_sent_id,
                shortest_message_sent: result.shortest_message_sent,
                shortest_message_sent_at_timestamp: result.shortest_message_sent_at_timestamp,
                shortest_message_sent_at_iso_timestamp: result.shortest_message_sent_at_iso_timestamp,
                shortest_message_sent_at_twitch_timestamp: result.shortest_message_sent_at_twitch_timestamp,
                shortest_message_sent_at_twitch_iso_timestamp: result.shortest_message_sent_at_twitch_iso_timestamp,
                shortest_message_length: result.shortest_message_length,

                longest_message_sent_id: result.longest_message_sent_id,
                longest_message_sent: result.longest_message_sent,
                longest_message_sent_at_timestamp: result.longest_message_sent_at_timestamp,
                longest_message_sent_at_iso_timestamp: result.longest_message_sent_at_iso_timestamp,
                longest_message_sent_at_twitch_timestamp: result.longest_message_sent_at_twitch_timestamp,
                longest_message_sent_at_twitch_iso_timestamp: result.longest_message_sent_at_twitch_iso_timestamp,
                longest_message_length: result.longest_message_length,

                ban_count: result.ban_count,
                strike_count: result.strike_count,
                timeout_count: result.timeout_count,
                message_deletion_count: result.message_deletion_count,
                is_account_blacklisted: result.is_account_blacklisted,
                is_first_message_spam_bot: result.is_first_message_spam_bot,
                is_spam_bot: result.is_spam_bot
              }
            };
            if (dataToUpdate.$set.shortest_message_length > originalMessage.length) {
              console.log("Shorter message");
              dataToUpdate.$set.shortest_message_sent_id = messageId;
              dataToUpdate.$set.shortest_message_sent = originalMessage;
              dataToUpdate.$set.shortest_message_sent_at_timestamp = internalMessageTimestamp;
              dataToUpdate.$set.shortest_message_sent_at_iso_timestamp = internalMessageTimestampIsoString;
              dataToUpdate.$set.shortest_message_sent_at_twitch_timestamp = twitchMessageTimestamp;
              dataToUpdate.$set.shortest_message_sent_at_twitch_iso_timestamp = twitchMessageTimestampIsoString;
              dataToUpdate.$set.shortest_message_length = originalMessage.length;
            }
            if (dataToUpdate.$set.longest_message_length < originalMessage.length) {
              console.log("Longer message");
              dataToUpdate.$set.longest_message_sent_id = messageId;
              dataToUpdate.$set.longest_message_sent = originalMessage;
              dataToUpdate.$set.longest_message_sent_at_timestamp = internalMessageTimestamp;
              dataToUpdate.$set.longest_message_sent_at_iso_timestamp = internalMessageTimestampIsoString;
              dataToUpdate.$set.longest_message_sent_at_twitch_timestamp = twitchMessageTimestamp;
              dataToUpdate.$set.longest_message_sent_at_twitch_iso_timestamp = twitchMessageTimestampIsoString;
              dataToUpdate.$set.longest_message_length = originalMessage.length;
            }
            if (dataToUpdate.$set.is_first_message_spam_bot == true) {
              console.log("IS THIS THING WORKING 1");
              if (dataToUpdate.$set.strike_count >= 0) {
                console.log("IS THIS THING WORKING 2");
                if (isFirstMessageSpam == true) {
                  console.log("IS THIS THING WORKING 3");
                  dataToUpdate.$set.strike_count = dataToUpdate.$set.strike_count + 1;
                }
              }
            }
            if (dataToUpdate.$set.is_first_message_spam_bot == true) {
              console.log("IS THIS THING WORKING 4");
              if (dataToUpdate.$set.messages_sent < 3) {
                console.log("IS THIS THING WORKING 5");
                if (dataToUpdate.$set.strike_count < 3) {
                  console.log("IS THIS THING WORKING 6");
                  if (dataToUpdate.$set.strike_count != dataToUpdate.$set.messages_sent) {
                    console.log("IS THIS THING WORKING 7");
                    dataToUpdate.$set.is_first_message_spam_bot = false;
                  }
                }
              }
            }
            if (dataToUpdate.$set.is_first_message_spam_bot == true) {
              console.log("IS THIS THING WORKING 8");
              if (dataToUpdate.$set.messages_sent >= 3) {
                console.log("IS THIS THING WORKING 9");
                if (dataToUpdate.$set.strike_count >= 3) {
                  console.log("IS THIS THING WORKING 10");
                  if (dataToUpdate.$set.strike_count == dataToUpdate.$set.messages_sent) {
                    console.log("IS THIS THING WORKING 11");
                    dataToUpdate.$set.ban_count = dataToUpdate.$set.ban_count + 1;
                    dataToUpdate.$set.is_spam_bot = true;
                    dataToUpdate.$set.is_account_blacklisted = true;
                    dataToUpdate.$set.is_banned = true;
                  }
                }
              }
            }
            if (dataToUpdate.$set.is_account_blacklisted == true) {
              dataToUpdate.$set.message_deletion_count = dataToUpdate.$set.message_deletion_count + 1;
            }
            //console.log("dataToUpdate");
            //console.log(dataToUpdate);
            //console.log(newvalues);
            userDatabaseToUpdate.collection(globalConfig.chatters_collection_name).updateOne(dataToQuery, dataToUpdate, function(err, res) {
              if (err) {
                throw err;
              }
              //console.log(res.result);
              //console.log("1 document updated");
              mongoClient.connect(mongoUrl, {
                useUnifiedTopology: true
              }, function(err, databaseToReadFrom) {
                if (err) {
                  throw err;
                }
                let userDatabaseToReadFrom = databaseToReadFrom.db(globalConfig.main_database_name);
                userDatabaseToReadFrom.collection(globalConfig.chatters_collection_name).findOne({
                  user_id: userId
                }, function(err, databaseToReadFromResult) {
                  if (err) {
                    throw err;
                  }
                  databaseToReadFrom.close();
                  //console.log("databaseToReadFromResult");
                  //console.log(databaseToReadFromResult);
                  if (databaseToReadFromResult.last_user_color == null || databaseToReadFromResult.last_user_color == undefined) {
                    // This block picks the randomly generated color that was saved in the database when the user was first added to the database, and hopefully applies this color instead of using the hardcoded default color
                    userColor = databaseToReadFromResult.randomly_generated_color;
                  }
                  if (databaseToReadFromResult.first_message_sent_id == databaseToReadFromResult.last_message_sent_id) {
                    console.log("New user successfully added to database");
                    if (chatConfig.send_debug_channel_messages == true) {
                      //console.log("chatConfig.debug_channel = " + chatConfig.debug_channel);
                      let randomColorName = Math.floor(Math.random() * defaultColors.length);
                      client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
                      client.action(chatConfig.debug_channel, new Date().toISOString() + " [NEW USER] user_id=" + databaseToReadFromResult.user_id + ", last_username_to_ping=" + databaseToReadFromResult.last_username_to_ping + ", last_message_sent_id=" + databaseToReadFromResult.last_message_sent_id + ", last_message_sent=" + databaseToReadFromResult.last_message_sent + ", last_message_sent_at=" + databaseToReadFromResult.last_message_sent_at_iso_timestamp + ", last_message_length=" + databaseToReadFromResult.last_message_length + ", is_first_twitch_message=" + databaseToReadFromResult.is_first_twitch_message);
                    }
                  }
                  if (databaseToReadFromResult.is_account_blacklisted == true) {
                    if (databaseToReadFromResult.is_banned == false) {
                      console.log("Silently timeout or delete message");
                      client.say(target, ".delete " + databaseToReadFromResult.last_message_sent_id);
                      client.say(target, ".timeout " + databaseToReadFromResult.last_known_username + " 1");
                    }
                  }
                  if (databaseToReadFromResult.is_account_blacklisted == false) {
                    if (databaseToReadFromResult.is_spam_bot == false) {
                      if (databaseToReadFromResult.last_message_length >= globalConfig.long_message_length) {
                        // This should never happen
                        console.log("First message is too long, do something about it");
                        if (globalConfig.timeout_if_message_is_long == true) {
                          /*
                          let randomColorName = Math.floor(Math.random() * defaultColors.length);
                          client.say(target, ".color " + defaultColorNames[randomColorName]);
                          client.say(target, ".ban " + databaseToReadFromResult.last_known_username + " You were banned because your first message is too long, you're either a spam bot, or just came here to spam.");
                          client.action(target, "@" + databaseToReadFromResult.last_username_to_ping + " You were banned because your first message is too long, you're either a spam bot, or just came here to spam.");
                          client.whisper(databaseToReadFromResult.last_known_username, "@" + databaseToReadFromResult.last_username_to_ping + " You were banned because your first message is too long, you're either a spam bot, or just came here to spam. This whisper was sent from the channel " + target + ".");
                          if (chatConfig.send_debug_channel_messages == true) {
                            client.action(chatConfig.debug_channel, new Date().toISOString() + " [MODBOT] user_id=" + databaseToReadFromResult.user_id + ", last_username_to_ping=" + databaseToReadFromResult.last_username_to_ping + ", last_message_sent_id=" + databaseToReadFromResult.last_message_sent_id + ", last_message_sent=" + databaseToReadFromResult.last_message_sent + ", last_message_sent_at=" + databaseToReadFromResult.last_message_sent_at_iso_timestamp + ", last_message_length=" + databaseToReadFromResult.last_message_length + ", is_first_twitch_message=" + databaseToReadFromResult.is_first_twitch_message + " Timeout, message too long.");
                          }
                          */
                        }
                        if (globalConfig.timeout_if_message_is_long == false) {
                          // For now idk if timeout/delete or not when a message is too long, so I settled for just an in chat warning. It'll obviously happen again and again if the user keeps sending long messages. Not a good way to moderate but it's there just in case.
                          //let randomColorName = Math.floor(Math.random() * defaultColors.length);
                          //client.say(target, ".color " + defaultColorNames[randomColorName]);
                          //client.say(target, ".timeout " + databaseToReadFromResult.last_known_username + " " + globalConfig.long_message_timeout + " You were timed out for " + globalConfig.long_message_timeout + " seconds because your first message is too long, please calm down!");
                          //client.action(target, "@" + databaseToReadFromResult.last_username_to_ping + " Your message is too long, please calm down!");
                        }
                      }
                    }
                  }
                  if (databaseToReadFromResult.is_account_blacklisted == false) {
                    if (databaseToReadFromResult.is_spam_bot == false) {
                      if (databaseToReadFromResult.first_message_sent_id == databaseToReadFromResult.last_message_sent_id) {
                        if (databaseToReadFromResult.first_message_length >= globalConfig.long_message_length) {
                          // This should never happen
                          console.log("First message is too long, do something about it");
                          if (globalConfig.permaban_if_first_message_is_long == true) {
                            let randomColorName = Math.floor(Math.random() * defaultColors.length);
                            client.say(target, ".color " + defaultColorNames[randomColorName]);
                            client.say(target, ".ban " + databaseToReadFromResult.last_known_username + " You were banned because your first message is too long, you're either a spam bot, or just came here to spam.");
                            client.action(target, "@" + databaseToReadFromResult.last_username_to_ping + " You were banned because your first message is too long, you're either a spam bot, or just came here to spam.");
                            client.whisper(databaseToReadFromResult.last_known_username, "@" + databaseToReadFromResult.last_username_to_ping + " You were banned because your first message is too long, you're either a spam bot, or just came here to spam. This whisper was sent from the channel " + target + ".");
                            if (chatConfig.send_debug_channel_messages == true) {
                              client.action(chatConfig.debug_channel, new Date().toISOString() + " [MODBOT] user_id=" + databaseToReadFromResult.user_id + ", last_username_to_ping=" + databaseToReadFromResult.last_username_to_ping + ", last_message_sent_id=" + databaseToReadFromResult.last_message_sent_id + ", last_message_sent=" + databaseToReadFromResult.last_message_sent + ", last_message_sent_at=" + databaseToReadFromResult.last_message_sent_at_iso_timestamp + ", last_message_length=" + databaseToReadFromResult.last_message_length + ", is_first_twitch_message=" + databaseToReadFromResult.is_first_twitch_message + " Banned, first message too long.");
                            }
                          }
                          if (globalConfig.permaban_if_first_message_is_long == false) {
                            let randomColorName = Math.floor(Math.random() * defaultColors.length);
                            client.say(target, ".color " + defaultColorNames[randomColorName]);
                            client.say(target, ".timeout " + databaseToReadFromResult.last_known_username + " " + globalConfig.long_message_timeout + " You were timed out for " + globalConfig.long_message_timeout + " seconds because your first message is too long, please calm down!");
                            client.action(target, "@" + databaseToReadFromResult.last_username_to_ping + " You were timed out for " + globalConfig.long_message_timeout + " seconds because your first message is too long, please calm down!");
                            client.whisper(databaseToReadFromResult.last_known_username, "@" + databaseToReadFromResult.last_username_to_ping + " You were timed out for " + globalConfig.long_message_timeout + " seconds because your first message is too long, please calm down! This whisper was sent from the channel " + target + ".");
                            if (chatConfig.send_debug_channel_messages == true) {
                              client.action(chatConfig.debug_channel, new Date().toISOString() + " [MODBOT] user_id=" + databaseToReadFromResult.user_id + ", last_username_to_ping=" + databaseToReadFromResult.last_username_to_ping + ", last_message_sent_id=" + databaseToReadFromResult.last_message_sent_id + ", last_message_sent=" + databaseToReadFromResult.last_message_sent + ", last_message_sent_at=" + databaseToReadFromResult.last_message_sent_at_iso_timestamp + ", last_message_length=" + databaseToReadFromResult.last_message_length + ", is_first_twitch_message=" + databaseToReadFromResult.is_first_twitch_message + " Timeout, first message too long.");
                            }
                          }
                        }
                      }
                    }
                  }
                  if (databaseToReadFromResult.is_spam_bot == true) {
                    // this should never happen tho lol
                    console.log("BAN THAT MOTHERFUCKER AGAIN");
                    let randomColorName = Math.floor(Math.random() * defaultColors.length);
                    client.say(target, ".color " + defaultColorNames[randomColorName]);
                    client.say(target, ".ban " + databaseToReadFromResult.last_known_username + " You were banned because you got detected as spam bot."); // These should use the names stored in the database, not the IRC names twitch sends
                    client.action(target, "@" + databaseToReadFromResult.last_username_to_ping + " You were banned because you got detected as spam bot.");
                    client.whisper(databaseToReadFromResult.last_known_username, "@" + databaseToReadFromResult.last_username_to_ping + " You were banned because you got detected as spam bot. This whisper was sent from the channel " + target + ". It is possible your account may have been compromised and is being used to send malicious links to multiple streams.");
                    if (chatConfig.send_debug_channel_messages == true) {
                      client.action(chatConfig.debug_channel, new Date().toISOString() + " [MODBOT] user_id=" + databaseToReadFromResult.user_id + ", last_username_to_ping=" + databaseToReadFromResult.last_username_to_ping + ", last_message_sent_id=" + databaseToReadFromResult.last_message_sent_id + ", last_message_sent=" + databaseToReadFromResult.last_message_sent + ", last_message_sent_at=" + databaseToReadFromResult.last_message_sent_at_iso_timestamp + ", last_message_length=" + databaseToReadFromResult.last_message_length + ", is_first_twitch_message=" + databaseToReadFromResult.is_first_twitch_message + " Banned, detected as spam bot.");
                    }
                  }
                  if (databaseToReadFromResult.is_first_message_spam_bot == true) {
                    if (databaseToReadFromResult.messages_sent >= 3) {
                      if (databaseToReadFromResult.strike_count >= 3) {
                        if (databaseToReadFromResult.ban_count >= 1) {
                          console.log("Yep, that's a multimessage spam bot");
                          let randomColorName = Math.floor(Math.random() * defaultColors.length);
                          client.say(target, ".color " + defaultColorNames[randomColorName]);
                          client.say(target, ".ban " + databaseToReadFromResult.last_known_username + " You were banned because you got detected as spam bot.");
                          client.action(target, "@" + databaseToReadFromResult.last_username_to_ping + " You were banned because you got detected as spam bot.");
                          client.whisper(databaseToReadFromResult.last_known_username, "@" + databaseToReadFromResult.last_username_to_ping + " You were banned because you got detected as spam bot. This whisper was sent from the channel " + target + ". It is possible your account may have been compromised and is being used to send malicious links to multiple streams.");
                          if (chatConfig.send_debug_channel_messages == true) {
                            client.action(chatConfig.debug_channel, new Date().toISOString() + " [MODBOT] user_id=" + databaseToReadFromResult.user_id + ", last_username_to_ping=" + databaseToReadFromResult.last_username_to_ping + ", last_message_sent_id=" + databaseToReadFromResult.last_message_sent_id + ", last_message_sent=" + databaseToReadFromResult.last_message_sent + ", last_message_sent_at=" + databaseToReadFromResult.last_message_sent_at_iso_timestamp + ", last_message_length=" + databaseToReadFromResult.last_message_length + ", is_first_twitch_message=" + databaseToReadFromResult.is_first_twitch_message + " Banned, detected as spam bot.");
                          }
                        }
                      }
                    }
                    console.log("Keep an eye on this user");
                  }
                });
              });
              databaseToUpdate.close();
            });
          });
          //
        }
        userDb.close();
        //isDatabaseBusy = false;
      });
    });
    //if (inputMode == 0) {
    // There's no need to run this block for advanced mode, only basic mode since names are not displayed in advanced mode
    // It turns out this sleep is important because the database is used again below, no matter which input mode, so we have to sleep long enough to make sure the database completed any operations above before doing anything to the database below 
    //console.log(new Date().toISOString() + " BEFORE user_color=" + userColor);
    await sleep(400); // LOL this is so ugly, I've made the database checks async then learned how to do database checks that block until they're completed, but I learned after a good chunk of this async database check was done, I don't want to redo everything so it's blocking everything after, it's going to take forever :( with that being said, the database checks being sync look much cleaner on code than async, at least cleaner than how I implemented the async checks, this means every message will have an artificial delay, which will also make moderation delayed
    //console.log(new Date().toISOString() + " AFTER  user_color=" + userColor);
    userColorInverted = userColor;
    userColorInverted = userColorInverted.replace(/(0x)+/ig, "");
    userColorInverted = userColorInverted.replace(/L+/ig, "");
    userColorInverted = userColorInverted.replace(/#+/ig, "");
    userColorInverted = Uint8Array.from(Buffer.from(userColorInverted, "hex"));
    //console.log(new Date().toISOString() + " userColorInverted = " + userColorInverted);
    userColorInverted[0] = 255 - userColorInverted[0];
    userColorInverted[1] = 255 - userColorInverted[1];
    userColorInverted[2] = 255 - userColorInverted[2];
    //console.log(new Date().toISOString() + " userColorInverted = " + userColorInverted);
    userColorInverted = "#" + Buffer.from(userColorInverted).toString("hex").toUpperCase();
    //console.log(new Date().toISOString() + " userColorInverted = " + userColorInverted);
    //}
    // Then check if user exists here
    /*
    mongoClient.connect(mongoUrl, {
      useUnifiedTopology: true
    }, function(err, userDb) {
      if (err) {
        throw err;
      }
      let userDatabase = userDb.db(globalConfig.main_database_name);
      userDatabase.collection(globalConfig.chatters_collection_name).findOne({
        user_id: userId
      }, function(err, result) {
        if (err) {
          throw err;
        }
        console.log(result);
        userDb.close();
      });
    });
    */
    let hasInvalidInput = false;
    let isValidInputDelay = false;

    let hasInvalidPrecisionInput = false;
    let isValidPrecisionInputRepeat = false;

    let dataToWrite = [0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0x01];
    dataToWrite[1] = neutralController[0];
    dataToWrite[2] = neutralController[1];
    dataToWrite[3] = neutralController[2];
    dataToWrite[4] = neutralController[3];
    dataToWrite[5] = neutralController[4];
    dataToWrite[6] = neutralController[5];
    dataToWrite[7] = neutralController[6];
    dataToWrite[8] = neutralController[7];
    let lowerCaseMessage = "";
    let lowerCaseCommand = "";
    let inputString = "";
    let removedDashesAtTheEnd = "";
    let setHold = false;
    let inputDelay = controllerConfig.normal_delay;
    let adjustableInputDelay = controllerConfig.normal_delay;
    let inputDelayHigh = 0;
    let inputDelayLow = 133;
    let ttsInputDelayHigh = 0;
    let ttsInputDelayLow = 133;
    let controllerState = [];
    //console.log("message Before " + message);
    message = message.replace(/\s+/ig, " ")
    message = message.replace(/\s*\++\s*/ig, "+");
    message = message.replace(/\s*\_+\s*/ig, "+");
    message = message.replace(/\s*\|+\s*/ig, "+");
    message = message.replace(/\s*\#+\s*/ig, "+");
    message = message.replace(/\s*\[+\s*/ig, "+");
    message = message.replace(/\s*\]+\s*/ig, "+");
    message = message.replace(/\s*(and)+\s*/ig, "+");
    message = message.replace(/\s*(adn)+\s*/ig, "+");
    message = message.replace(/\s*(then)+\s*/ig, ",");
    message = message.replace(/\s*[\.\,]+\s*/ig, ",");
    message = message.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, "");
    //console.log("NORMALIZED " + message);
    //console.log("message now " + message);
    let messageWords = message.split(/\s+/ig);
    let messageInputs = [];
    let inputsUsed = 0;
    let processedMessage = "";
    //var usernameToPing = (username.toLowerCase() == displayName.toLowerCase()) ? displayName : username;
    let precisionInputs = [];
    let precisionInputsObjArr = [];
    let processedPrecisionInputs = [];
    let precisionInputsDelay = [];
    let precisionInputsLoops = [];
    let advancedInputInputs = [];
    let precisionInputsPreProcessed = {
      input_array: [],
      input_repeat_count: 0
    };
    let precisionInputsLoop = false;

    //let precisionInputString = "";
    //let precisionInputDelay = 133;
    //let precisionInputLoop = false;

    let precisionInputString = "";
    let precisionInputHold = 133;
    let precisionInputRepeat = 0;

    let precisionInputDelayHigh = 0;
    let precisionInputDelayLow = 133;

    let precisionInputsMacroCount = 0;

    let precisionInputsUsed = 0;

    let precisionInputStringToDisplay = {
      macro_array: [],
      repeat_count: 0
    };
    let precisionInputStringToDisplay2 = "";

    let trustedUsersIndex = chatConfig.trusted_users.findIndex(element => element == userId);
    //console.log(trustedUsersIndex);
    //console.log(chatConfig.trusted_users[trustedUsersIndex])
    let channelsToListenIndex = chatConfig.channels_to_listen.findIndex(element => element == roomId);
    //let checkBigFollowsSpamBot = /(w+a+n+a+)+\s+(b+e+c+o+m+e)+\s+(f+a+m+o+u+s+\?*)+\s+(b+u+y+)+\s+(f+o+l+o+w+e+r+s*)+[\,\.]*\s*(p*r*i*m*e*s*)*\s+(a+n+d+)+\s+(v+i+e+w+e+r+s*)+\s+(o+n+)+\s+([^\s]+)+\s+(\(*b+i+g+f+o+l+o+w+s*)+\s*([^\w])\s*(c+o+m+\)*\!*)/ig.test(message);
    //let checkBigFollowsSpamBot = /(w+a+n+a+)+\s+(b+e+c+o+m+e)+\s+(f+a+m+o+u+s+\W*)+\s+(b+u+y+)+\s+(f+o+l+o+w+\w*)+\W*\s*(p*r*i*m*e*s*)*\s+(a+n+d+)+\s+(v+i+e+w+\w*)+\s+(o+n+)+\s+([^\s]+)+\s+(\W*\w+)+\s*\W*\s*(\w+\W*)/ig.test(message);
    //let checkBigFollowsSpamBot = /(w+a+n+a+)+\s+(b+e+c+o+m+e)+\s+(f+a+m+o+u+s+\W*)+\s+(b+u+y+)+\s+(f+o+l+o+w+\w*)+\W*\s*(p*r*i*m*e*s*)*\s+(a+n+d+)+\s+(v+i+e+w+\w*)+\s+(o+n+)+\s+([\S\s]+)/ig.test(message);
    //let checkTwitchViewBotSoftwareBot = /(t+w+i+t+c+h+)+\s+(v+i+e+w+\w*\s*b+o+t+\w*)+\s+(s+o+f+t+w+a+r+e+\w*\W*)+\s*(d+o+)+\s+(a+n+y+)+\s*(o+n+l+i+n+e+)*\s+(o+n+)+\s+(a+n+y+)+\s+(s+t+r+e+a+m+\W*)+\s+(\W*\d*\W*)+\W*\s*(d+i+s+c+o+r+d+)+(\s+\W*\s+(\w+\W*\d+))*/ig.test(message);
    //console.log("checkBigFollowsSpamBot = " + checkBigFollowsSpamBot);
    //console.log("checkTwitchViewBotSoftwareBot = " + checkTwitchViewBotSoftwareBot);

    //console.log(channelsToListenIndex);
    //console.log(chatConfig.channels_to_listen[channelsToListenIndex])
    /*
    for (let trustedUsersIndex = 0; trustedUsersIndex < chatConfig.trusted_users.length; trustedUsersIndex++) {
      if (userId == chatConfig.trusted_users[trustedUsersIndex]) {
        console.log("Is Trusted User");
      }
    }
    */
    if (channelsToListenIndex == -1) {
      //console.log("Don't listen to this channel");
      return;
    }
    channelToSendMessageTo = target;
    if (userId == chatConfig.trusted_users[trustedUsersIndex]) {
      if (messageWords[0].toLowerCase() == "!toggleinputs") {
        acceptInputs = !acceptInputs;
        let randomColorName = Math.floor(Math.random() * defaultColors.length);
        client.say(target, ".color " + defaultColorNames[randomColorName]);
        client.action(target, "@" + usernameToPing + " acceptInputs=" + acceptInputs);
      }
      if (messageWords[0].toLowerCase() == "!toggletts") {
        acceptTts = !acceptTts;
        let randomColorName = Math.floor(Math.random() * defaultColors.length);
        client.say(target, ".color " + defaultColorNames[randomColorName]);
        client.action(target, "@" + usernameToPing + " acceptTts=" + acceptTts);
      }
    }
    if (acceptInputs == false) {
      //console.log(message);
    }
    if (acceptInputs == true) {
      if (globalConfig.voting_enabled == true) {
        let voteTime = 0;
        if (new Date().getTime() <= votingAllowed) {
          //console.log(modeVotes);
          //console.log("Voting in cooldown " + (votingAllowed - new Date().getTime()));
        }
        if (new Date().getTime() > votingAllowed) {
          let playerVoteIndex = modeVotes.findIndex(element => element.user_id == userId);
          //playerVoteIndex = -1;
          //console.log(playerVoteIndex);
          //console.log(modeVotes);
          //console.log(modeVotes.length);
          let checkUptime = /^[!\"#$%&'()*+,\-./:;%=%?@\[\\\]^_`{|}~¡¦¨«¬­¯°±»½⅔¾⅝⅞∅ⁿ№★†‡‹›¿‰℅æßçñ¹⅓¼⅛²⅜³⁴₱€¢£¥—–·„“”‚‘’•√π÷×¶∆′″←↑↓→§Π♣♠♥♪♦∞≠≈©®™✓‛‟❛❜❝❞❟❠❮❯⹂〝〞〟＂🙶🙷🙸󠀢⍻✅✔𐄂🗸‱]*\s*(uptime|uptiem|up\s*time|up\s*tiem)+/ig.test(originalMessage);
          if (checkUptime == true) {
            //console.log("Someone requested to get the uptime!");
            //
            let hasRunStarted = false;
            let timeUptimeWasRequested = new Date().getTime();
            let uptimeTotal = timeUptimeWasRequested - serverStartTime;
            let playTimeTotal = timeUptimeWasRequested - runStartTime;
            //console.log("playTimeTotal before " + playTimeTotal);
            //
            if (playTimeTotal >= 0) {
              //console.log("Run has started");
              hasRunStarted = true;
            }
            if (playTimeTotal < 0) {
              //console.log("Run hasn't started yet");
              playTimeTotal = Math.abs(playTimeTotal);
              hasRunStarted = false;
            }
            //console.log("playTimeTotal after " + playTimeTotal);
            //
            let uptimeDays = (parseInt(uptimeTotal / 86400000)).toString().padStart(2, "0");
            let uptimeHours = (parseInt(uptimeTotal / 3600000) % 24).toString().padStart(2, "0");
            let uptimeMinutes = (parseInt(uptimeTotal / 60000) % 60).toString().padStart(2, "0");
            let uptimeSeconds = (parseInt(uptimeTotal / 1000) % 60).toString().padStart(2, "0");
            let uptimeMillis = (uptimeTotal % 1000).toString().padStart(3, "0");
            let uptimeString = uptimeDays + "day " + uptimeHours + "hr " + uptimeMinutes + "min " + uptimeSeconds + "sec " + uptimeMillis + "msec";
            //
            let playTimeDays = (parseInt(playTimeTotal / 86400000)).toString().padStart(2, "0");
            let playTimeHours = (parseInt(playTimeTotal / 3600000) % 24).toString().padStart(2, "0");
            let playTimeMinutes = (parseInt(playTimeTotal / 60000) % 60).toString().padStart(2, "0");
            let playTimeSeconds = (parseInt(playTimeTotal / 1000) % 60).toString().padStart(2, "0");
            let playTimeMillis = (playTimeTotal % 1000).toString().padStart(3, "0");
            let playTimeString = playTimeDays + "day " + playTimeHours + "hr " + playTimeMinutes + "min " + playTimeSeconds + "sec " + playTimeMillis + "msec";
            //
            if (hasRunStarted == false) {
              let randomColorName = Math.floor(Math.random() * defaultColors.length);
              client.say(target, ".color " + defaultColorNames[randomColorName]);
              client.action(target, "@" + usernameToPing + " The stream has been up for " + uptimeString + ". The next run starts in " + playTimeString + ".");
            }
            if (hasRunStarted == true) {
              let randomColorName = Math.floor(Math.random() * defaultColors.length);
              client.say(target, ".color " + defaultColorNames[randomColorName]);
              client.action(target, "@" + usernameToPing + " The stream has been up for " + uptimeString + ". This run has been going for " + playTimeString + ".");
            }

          }
          let checkBasicVote = /^[!\"#$%&'()*+,\-./:;%=%?@\[\\\]^_`{|}~¡¦¨«¬­¯°±»½⅔¾⅝⅞∅ⁿ№★†‡‹›¿‰℅æßçñ¹⅓¼⅛²⅜³⁴₱€¢£¥—–·„“”‚‘’•√π÷×¶∆′″←↑↓→§Π♣♠♥♪♦∞≠≈©®™✓‛‟❛❜❝❞❟❠❮❯⹂〝〞〟＂🙶🙷🙸󠀢⍻✅✔𐄂🗸‱]*\s*(basic)+\b/ig.test(originalMessage);
          if (checkBasicVote == true) {
            //checkModeVotes();
            if (playerVoteIndex == -1) {
              //checkModeVotes();
              voteTime = new Date().getTime() + globalConfig.vote_expiration_time_millis;
              modeVotes.push({
                username_to_display: usernameToPing,
                username: username,
                display_name: displayName,
                user_color: userColor,
                user_color_inverted: userColorInverted,
                message_id: messageId,
                user_id: userId,
                expiration_time: voteTime,
                mode_vote: 0
              });
              //console.log("BASIC 1");
              let randomColorName = Math.floor(Math.random() * defaultColors.length);
              client.say(target, ".color " + defaultColorNames[randomColorName]);
              client.action(target, "@" + usernameToPing + " Your mode vote was added as Basic and will expire at " + new Date(voteTime).toISOString() + ".");
              checkModeVotes();
              //console.log(modeVotes);
              //console.log(modeVotes);
              //console.log(modeVotes.length);
              let voteDataObject = {
                basic_vote_count: basicVoteCount,
                advanced_vote_count: advancedVoteCount,
                threshold_to_change_mode: thresholdToChangeMode,
                total_votes: totalVotes,
                advanced_vote_count_ratio: advancedVoteCountRatio,
                basic_vote_count_ratio: basicVoteCountRatio,
                input_modes_array: inputModesArray,
                input_mode: inputMode
              };
              io.sockets.emit("vote_data", voteDataObject);
            }
            //checkModeVotes();
            if (playerVoteIndex != -1) {
              //checkModeVotes();
              voteTime = new Date().getTime() + globalConfig.vote_expiration_time_millis;
              modeVotes[playerVoteIndex].mode_vote = 0;
              modeVotes[playerVoteIndex].expiration_time = voteTime;
              //console.log("BASIC 2");
              let randomColorName = Math.floor(Math.random() * defaultColors.length);
              client.say(target, ".color " + defaultColorNames[randomColorName]);
              client.action(target, "@" + usernameToPing + " Your mode vote was readded as Basic and will expire at " + new Date(modeVotes[playerVoteIndex].expiration_time).toISOString() + ".");
              checkModeVotes();
              //console.log(modeVotes);
              //console.log(modeVotes);
              //console.log(modeVotes.length);
              let voteDataObject = {
                basic_vote_count: basicVoteCount,
                advanced_vote_count: advancedVoteCount,
                threshold_to_change_mode: thresholdToChangeMode,
                total_votes: totalVotes,
                advanced_vote_count_ratio: advancedVoteCountRatio,
                basic_vote_count_ratio: basicVoteCountRatio,
                input_modes_array: inputModesArray,
                input_mode: inputMode
              };
              io.sockets.emit("vote_data", voteDataObject);
            }
            //checkModeVotes();
          }
          let checkAdvancedVote = /^[!\"#$%&'()*+,\-./:;%=%?@\[\\\]^_`{|}~¡¦¨«¬­¯°±»½⅔¾⅝⅞∅ⁿ№★†‡‹›¿‰℅æßçñ¹⅓¼⅛²⅜³⁴₱€¢£¥—–·„“”‚‘’•√π÷×¶∆′″←↑↓→§Π♣♠♥♪♦∞≠≈©®™✓‛‟❛❜❝❞❟❠❮❯⹂〝〞〟＂🙶🙷🙸󠀢⍻✅✔𐄂🗸‱]*\s*(advanced|advaced)+\b/ig.test(originalMessage);
          if (checkAdvancedVote == true) {
            //checkModeVotes();
            if (playerVoteIndex == -1) {
              //checkModeVotes();
              voteTime = new Date().getTime() + globalConfig.vote_expiration_time_millis;
              modeVotes.push({
                username_to_display: usernameToPing,
                username: username,
                display_name: displayName,
                user_color: userColor,
                user_color_inverted: userColorInverted,
                message_id: messageId,
                user_id: userId,
                expiration_time: voteTime,
                mode_vote: 2
              });
              //checkModeVotes();
              //console.log("ADVANCED 1");
              let randomColorName = Math.floor(Math.random() * defaultColors.length);
              client.say(target, ".color " + defaultColorNames[randomColorName]);
              client.action(target, "@" + usernameToPing + " Your mode vote was added as Advanced and will expire at " + new Date(voteTime).toISOString() + ".");
              checkModeVotes();
              //console.log(modeVotes);
              //console.log(modeVotes);
              //console.log(modeVotes.length);
              let voteDataObject = {
                basic_vote_count: basicVoteCount,
                advanced_vote_count: advancedVoteCount,
                threshold_to_change_mode: thresholdToChangeMode,
                total_votes: totalVotes,
                advanced_vote_count_ratio: advancedVoteCountRatio,
                basic_vote_count_ratio: basicVoteCountRatio,
                input_modes_array: inputModesArray,
                input_mode: inputMode
              };
              io.sockets.emit("vote_data", voteDataObject);
            }
            if (playerVoteIndex != -1) {
              //checkModeVotes();
              voteTime = new Date().getTime() + globalConfig.vote_expiration_time_millis;
              modeVotes[playerVoteIndex].mode_vote = 2;
              modeVotes[playerVoteIndex].expiration_time = voteTime;
              //checkModeVotes();
              //console.log("ADVANCED 2");
              let randomColorName = Math.floor(Math.random() * defaultColors.length);
              client.say(target, ".color " + defaultColorNames[randomColorName]);
              client.action(target, "@" + usernameToPing + " Your mode vote was readded as Advanced and will expire at " + new Date(modeVotes[playerVoteIndex].expiration_time).toISOString() + ".");
              checkModeVotes();
              //console.log(modeVotes);
              //console.log(modeVotes);
              //console.log(modeVotes.length);
              let voteDataObject = {
                basic_vote_count: basicVoteCount,
                advanced_vote_count: advancedVoteCount,
                threshold_to_change_mode: thresholdToChangeMode,
                total_votes: totalVotes,
                advanced_vote_count_ratio: advancedVoteCountRatio,
                basic_vote_count_ratio: basicVoteCountRatio,
                input_modes_array: inputModesArray,
                input_mode: inputMode
              };
              io.sockets.emit("vote_data", voteDataObject);
            }
            //checkModeVotes();
          }
        }
      }
    }
    let discordPrefixCheck = /^[!\"#$%&'()*+,\-./:;%=%?@\[\\\]^_`{|}~¡¦¨«¬­¯°±»½⅔¾⅝⅞∅ⁿ№★†‡‹›¿‰℅æßçñ¹⅓¼⅛²⅜³⁴₱€¢£¥—–·„“”‚‘’•√π÷×¶∆′″←↑↓→§Π♣♠♥♪♦∞≠≈©®™✓‛‟❛❜❝❞❟❠❮❯⹂〝〞〟＂🙶🙷🙸󠀢⍻✅✔𐄂🗸‱]*\s*(discord)+/ig.test(originalMessage);
    if (discordPrefixCheck == true) {
      let randomColorName = Math.floor(Math.random() * defaultColors.length);
      client.say(target, ".color " + defaultColorNames[randomColorName]);
      client.action(target, "@" + usernameToPing + " Discord: " + globalConfig.discord_url);
    }
    if (inputMode == 2) {
      let helpPrefixCheck = /^[!\"#$%&'()*+,\-./:;%=%?@\[\\\]^_`{|}~¡¦¨«¬­¯°±»½⅔¾⅝⅞∅ⁿ№★†‡‹›¿‰℅æßçñ¹⅓¼⅛²⅜³⁴₱€¢£¥—–·„“”‚‘’•√π÷×¶∆′″←↑↓→§Π♣♠♥♪♦∞≠≈©®™✓‛‟❛❜❝❞❟❠❮❯⹂〝〞〟＂🙶🙷🙸󠀢⍻✅✔𐄂🗸‱]*\s*((inputs*)+|(set+ings*)+|(help)+|(hel\[)+|(hel\])+|(com+ands*)+|(cmds*)+|(cmnds*)+|(control+s*)+|(control+ers*)+|(how\s*to\s*play)+|(how\s*do\s*(i|we)\s*play))+/ig.test(originalMessage);
      if (helpPrefixCheck == true) {
        if (helpMessageCooldown >= new Date().getTime()) {
          //console.log("Don't send the help message yet");
        }
        if (helpMessageCooldown < new Date().getTime()) {
          let randomColorName = Math.floor(Math.random() * defaultColors.length);
          client.say(target, ".color " + defaultColorNames[randomColorName]);
          for (let helpMessageIndex = 0; helpMessageIndex < helpMessageAdvanced.length; helpMessageIndex++) {
            if (helpMessageIndex == 0) {
              client.action(target, "@" + usernameToPing + " " + helpMessageAdvanced[helpMessageIndex]);
            }
            if (helpMessageIndex != 0) {
              client.action(target, helpMessageAdvanced[helpMessageIndex]);
            }
          }
          helpMessageCooldown = new Date().getTime() + globalConfig.help_message_cooldown_millis;
        }
      }
      if (acceptInputs == true) {
        if (messageWords.length > 0) {
          let listSettablePrefixCheck = /^[!\"#$%&'()*+,\-./:;%=%?@\[\\\]^_`{|}~¡¦¨«¬­¯°±»½⅔¾⅝⅞∅ⁿ№★†‡‹›¿‰℅æßçñ¹⅓¼⅛²⅜³⁴₱€¢£¥—–·„“”‚‘’•√π÷×¶∆′″←↑↓→§Π♣♠♥♪♦∞≠≈©®™✓‛‟❛❜❝❞❟❠❮❯⹂〝〞〟＂🙶🙷🙸󠀢⍻✅✔𐄂🗸‱]*\s*(list\s*macro)+/ig.test(originalMessage);
          //console.log("listSettablePrefixCheck = " + listSettablePrefixCheck);
          if (listSettablePrefixCheck == true) {
            //let tempListableInputArray = messageWords[1].replace(/[\:\/\\\.\;\']+/ig, " ");
            //tempListableInputArray = tempListableInputArray.trim();
            //tempListableInputArray = tempListableInputArray.split(/\s+/ig);
            //let listablePrecisionInputHold = 0;
            let listablePrecisionInputIndex = 0;
            let isValidIndex = false;
            let inputsToList = "";
            if (settableMacroChain.length == 0) {
              let randomColorName = Math.floor(Math.random() * defaultColors.length);
              client.say(target, ".color " + defaultColorNames[randomColorName]);
              client.action(target, "@" + usernameToPing + " There are no inputs set, use !set a+b;300 0, where a+b can be replaced with any input that's listed in !help, 300 is the duration in milliseconds, which can replaced with the duration from 1 to 10000 milliseconds, duration is an optional parameter, and 0 can be replaced with the position you want to set the input, starting at 0 and ending at 63.");
            }
            if (settableMacroChain.length > 0) {
              if (isNaN(parseInt(messageWords[1], 10)) == false) {
                //console.log("POGGERS WE GOT A NUMBER");
                if (parseInt(messageWords[1], 10) >= 0) {
                  if (settableMacroChain.length == 0) {
                    //console.log("There are 0 inputs");
                  }
                  if (settableMacroChain.length > 0) {
                    //console.log("There's at least one input");
                  }
                  if (parseInt(messageWords[1], 10) <= settableMacroChain.length - 1) {
                    //console.log("Case1 " + settableMacroChain.length + " " + parseInt(messageWords[1], 10));
                    //console.log(controllerConfig.final_macro_preamble - controllerConfig.initial_macro_preamble);
                    if (settableMacroChain.length - 1 >= parseInt(messageWords[1], 10)) {
                      //console.log("THIS IS WITHIN THE RANGE");
                      //console.log(controllerConfig.final_macro_preamble - controllerConfig.initial_macro_preamble);
                      isValidIndex = true;
                      listablePrecisionInputIndex = parseInt(messageWords[1], 10) + 1;
                    }
                    if (settableMacroChain.length - 1 < parseInt(messageWords[1], 10)) {
                      //console.log("THIS IS BEYOND THE RANGE");
                      //console.log(controllerConfig.final_macro_preamble - controllerConfig.initial_macro_preamble);
                      isValidIndex = false;
                      //settablePrecisionInputIndex = parseInt(messageWords[2], 10);
                    }
                    //isValidIndex = true;
                    //settablePrecisionInputIndex = parseInt(messageWords[2], 10);
                  }
                  if (parseInt(messageWords[1], 10) > settableMacroChain.length - 1) {
                    //console.log("Case2 " + settableMacroChain.length + " " + parseInt(messageWords[1], 10));
                    isValidIndex = false;
                    //settablePrecisionInputIndex = controllerConfig.max_duration_per_precision_input_millis;
                  }
                  //console.log("WE GOT A POSITIVE INTEGER");
                  //console.log(testVar[testVarIndex]);
                  //precisionInputHold = parseInt(testVar[testVarIndex], 10);
                }
                if (parseInt(messageWords[1], 10) < 0) {
                  //console.log("Case3 " + settableMacroChain.length + " " + parseInt(messageWords[1], 10));
                  isValidIndex = false;
                  //console.log("WE GOT A NON-POSITIVE INTEGER");
                  //console.log(testVar[testVarIndex]);
                  //settablePrecisionInputIndex = controllerConfig.default_duration_per_precision_input_millis;
                }
              }
              if (isNaN(parseInt(messageWords[1], 10)) == true) {
                //console.log("Case4 " + settableMacroChain.length + " " + parseInt(messageWords[1], 10));
                isValidIndex = false;
                // Just add to the next index if this happens?
                //console.log(testVar[testVarIndex]);
                //console.log("NOT A NUMBER :(");
                //settablePrecisionInputIndex = controllerConfig.default_duration_per_precision_input_millis;
              }
              //
              if (isValidIndex == false) {
                for (let settableInputsIndex = 0; settableInputsIndex < settableMacroChain.length; settableInputsIndex++) {
                  //console.log(new Date().toISOString() + " [AZ] settableInputsIndex=" + settableInputsIndex + ", settableMacroChain.length=" + settableMacroChain.length + ", listablePrecisionInputIndex=" + listablePrecisionInputIndex);
                  inputsToList = inputsToList + settableMacroChain[settableInputsIndex].processed_macro_input_string + ";" + settableMacroChain[settableInputsIndex].processed_macro_input_delay + "ms,";
                }
              }
              if (isValidIndex == true) {
                for (let settableInputsIndex = 0; settableInputsIndex < listablePrecisionInputIndex; settableInputsIndex++) {
                  //console.log(new Date().toISOString() + " [BZ] settableInputsIndex=" + settableInputsIndex + ", settableMacroChain.length=" + settableMacroChain.length + ", listablePrecisionInputIndex=" + listablePrecisionInputIndex);
                  inputsToList = inputsToList + settableMacroChain[settableInputsIndex].processed_macro_input_string + ";" + settableMacroChain[settableInputsIndex].processed_macro_input_delay + "ms,";
                }
              }
              inputsToList = inputsToList.replace(/[\.\,]+$/ig, "");
              //console.log(inputsToList);
              let splitInputsToListInMultipleStrings = [];
              if (inputsToList.length >= 200) {
                //let splitInputsToListInMultipleStrings = inputsToList.match(/.{100}/ig);
                splitInputsToListInMultipleStrings = inputsToList.match(/(?:[^\s]+\s){0,15}[^\s]+/ig);
                //console.log(splitInputsToListInMultipleStrings);
                let randomColorName = Math.floor(Math.random() * defaultColors.length);
                client.say(target, ".color " + defaultColorNames[randomColorName]);
                for (let splitInputsInMultipleStringsIndex = 0; splitInputsInMultipleStringsIndex < splitInputsToListInMultipleStrings.length; splitInputsInMultipleStringsIndex++) {
                  if (splitInputsInMultipleStringsIndex == 0) {
                    if (isValidIndex == false) {
                      client.action(target, "@" + usernameToPing + " Here are all the inputs currently set: " + splitInputsToListInMultipleStrings[splitInputsInMultipleStringsIndex]);
                    }
                    if (isValidIndex == true) {
                      client.action(target, "@" + usernameToPing + " Here are the first " + (listablePrecisionInputIndex - 1) + " inputs currently set: " + splitInputsToListInMultipleStrings[splitInputsInMultipleStringsIndex]);
                    }
                  }
                  if (splitInputsInMultipleStringsIndex > 0) {
                    client.action(target, splitInputsToListInMultipleStrings[splitInputsInMultipleStringsIndex]);
                  }
                }
                //console.log(splitInputsToListInMultipleStrings);
                //client.action(target, "@" + usernameToPing + " Your input was interpreted as " + inputsToList);
              }
              if (inputsToList.length < 200) {
                //let splitInputsToListInMultipleStrings = inputsToList.match(/.{100}/ig);
                //splitInputsToListInMultipleStrings = inputsToList.match(/(?:[^\,]+\,){1,10}[^\,]+/ig);
                //console.log(splitInputsToListInMultipleStrings);
                let randomColorName = Math.floor(Math.random() * defaultColors.length);
                client.say(target, ".color " + defaultColorNames[randomColorName]);
                if (isValidIndex == false) {
                  client.action(target, "@" + usernameToPing + " Here are all the inputs currently set: " + inputsToList);
                }
                if (isValidIndex == true) {
                  client.action(target, "@" + usernameToPing + " Here are the first " + (listablePrecisionInputIndex - 1) + " inputs currently set: " + inputsToList);
                }
                //client.action(target, "@" + usernameToPing + " Your input was interpreted as " + inputsToList);
              }
            }
          }
          let setSettablePrefixCheck = /^[!\"#$%&'()*+,\-./:;%=%?@\[\\\]^_`{|}~¡¦¨«¬­¯°±»½⅔¾⅝⅞∅ⁿ№★†‡‹›¿‰℅æßçñ¹⅓¼⅛²⅜³⁴₱€¢£¥—–·„“”‚‘’•√π÷×¶∆′″←↑↓→§Π♣♠♥♪♦∞≠≈©®™✓‛‟❛❜❝❞❟❠❮❯⹂〝〞〟＂🙶🙷🙸󠀢⍻✅✔𐄂🗸‱]*\s*(set\s*macro)+/ig.test(originalMessage);
          //console.log("setSettablePrefixCheck = " + setSettablePrefixCheck);
          if (setSettablePrefixCheck == true) {
            if (messageWords[1] == undefined) {
              let randomColorName = Math.floor(Math.random() * defaultColors.length);
              client.say(target, ".color " + defaultColorNames[randomColorName]);
              client.action(target, "@" + usernameToPing + " You didn't enter anything.");
            }
            if (messageWords[1] != undefined) {
              //console.log(messageWords);
              //console.log("");
              //console.log(messageWords[0]);
              //console.log(messageWords[1]);
              //console.log(messageWords[2]);
              //console.log(messageWords[3]);
              let processedSingleInput = {};
              //settableMacroChain[0] = ["A", "B", "C"];
              //settableMacroChain[1] = ["D", "E", "F"];
              let tempSettableInputArray = messageWords[1].replace(/[\/\\\.\;\*\,\']+/ig, " ");
              tempSettableInputArray = tempSettableInputArray.trim();
              tempSettableInputArray = tempSettableInputArray.split(/\s+/ig);
              //console.log(tempSettableInputArray);
              //console.log("SET THIS AS DELAY INSTEAD OF REPEAT MAYBE");
              let settablePrecisionInputHold = 0;
              let settablePrecisionInputIndex = 0;
              let isValidIndex = false;
              //console.log(isNaN(parseInt(testVar[testVarIndex], 10)));
              if (isNaN(parseInt(tempSettableInputArray[1], 10)) == false) {
                //console.log("POGGERS WE GOT A NUMBER");
                if (parseInt(tempSettableInputArray[1], 10) >= 0) {
                  if (parseInt(tempSettableInputArray[1], 10) <= controllerConfig.max_duration_per_precision_input_millis) {
                    settablePrecisionInputHold = parseInt(tempSettableInputArray[1], 10);
                    if (settablePrecisionInputHold <= 10) {
                      settablePrecisionInputHold = settablePrecisionInputHold * 1000; // People will intuitively enter seconds as delay, this fixes that so seconds are valid, but only if the desired delay is less than or equals 10 seconds
                    }
                  }
                  if (parseInt(tempSettableInputArray[1], 10) > controllerConfig.max_duration_per_precision_input_millis) {
                    settablePrecisionInputHold = controllerConfig.max_duration_per_precision_input_millis;
                  }
                  //console.log("WE GOT A POSITIVE INTEGER");
                  //console.log(testVar[testVarIndex]);
                  //precisionInputHold = parseInt(testVar[testVarIndex], 10);
                }
                if (parseInt(tempSettableInputArray[1], 10) < 1) {
                  //console.log("WE GOT A NON-POSITIVE INTEGER");
                  //console.log(testVar[testVarIndex]);
                  settablePrecisionInputHold = controllerConfig.default_duration_per_precision_input_millis;
                }
              }
              if (isNaN(parseInt(tempSettableInputArray[1], 10)) == true) {
                //console.log(testVar[testVarIndex]);
                //console.log("NOT A NUMBER :(");
                settablePrecisionInputHold = controllerConfig.default_duration_per_precision_input_millis;
              }
              //console.log("settablePrecisionInputHold = " + settablePrecisionInputHold);

              if (isNaN(parseInt(messageWords[2], 10)) == false) {
                //console.log("POGGERS WE GOT A NUMBER");
                if (parseInt(messageWords[2], 10) >= 0) {
                  if (settableMacroChain.length == 0) {
                    //console.log("There are 0 inputs");
                  }
                  if (settableMacroChain.length > 0) {
                    //console.log("There's at least one input");
                  }
                  if (parseInt(messageWords[2], 10) <= settableMacroChain.length) {
                    //console.log("Case1 " + settableMacroChain.length + " " + parseInt(messageWords[2], 10));
                    //console.log(controllerConfig.final_macro_preamble - controllerConfig.initial_macro_preamble);
                    if ((controllerConfig.final_macro_preamble - controllerConfig.initial_macro_preamble) - 1 >= parseInt(messageWords[2], 10)) {
                      //console.log("THIS IS WITHIN THE RANGE");
                      //console.log(controllerConfig.final_macro_preamble - controllerConfig.initial_macro_preamble);
                      isValidIndex = true;
                      settablePrecisionInputIndex = parseInt(messageWords[2], 10);
                    }
                    if ((controllerConfig.final_macro_preamble - controllerConfig.initial_macro_preamble) - 1 < parseInt(messageWords[2], 10)) {
                      //console.log("THIS IS BEYOND THE RANGE");
                      //console.log(controllerConfig.final_macro_preamble - controllerConfig.initial_macro_preamble);
                      isValidIndex = false;
                      //settablePrecisionInputIndex = parseInt(messageWords[2], 10);
                    }
                    //isValidIndex = true;
                    //settablePrecisionInputIndex = parseInt(messageWords[2], 10);
                  }
                  if (parseInt(messageWords[2], 10) > settableMacroChain.length) {
                    //console.log("Case2 " + settableMacroChain.length + " " + parseInt(messageWords[2], 10));
                    isValidIndex = false;
                    //settablePrecisionInputIndex = controllerConfig.max_duration_per_precision_input_millis;
                  }
                  //console.log("WE GOT A POSITIVE INTEGER");
                  //console.log(testVar[testVarIndex]);
                  //precisionInputHold = parseInt(testVar[testVarIndex], 10);
                }
                if (parseInt(messageWords[2], 10) < 0) {
                  //console.log("Case3 " + settableMacroChain.length + " " + parseInt(messageWords[2], 10));
                  isValidIndex = false;
                  //console.log("WE GOT A NON-POSITIVE INTEGER");
                  //console.log(testVar[testVarIndex]);
                  //settablePrecisionInputIndex = controllerConfig.default_duration_per_precision_input_millis;
                }
              }
              if (isNaN(parseInt(messageWords[2], 10)) == true) {
                //console.log("Case4 " + settableMacroChain.length + " " + parseInt(messageWords[2], 10));
                isValidIndex = false;
                // Just add to the next index if this happens?
                //console.log(testVar[testVarIndex]);
                //console.log("NOT A NUMBER :(");
                //settablePrecisionInputIndex = controllerConfig.default_duration_per_precision_input_millis;
              }
              //console.log("settablePrecisionInputIndex = " + settablePrecisionInputIndex);
              //console.log("isValidIndex = " + isValidIndex);
              //console.log("Should be a positive integer");
              //console.log(settableMacroChain);
              //processMacroChain(macroString, macroInputDelay, macroIndex, sendToArduino)
              if (isValidIndex == true) {
                if (settableMacroChain[settablePrecisionInputIndex] != undefined) {
                  //console.log(settableMacroChain[settablePrecisionInputIndex]);
                  //console.log("Index is already assigned, overwriting");
                  processedSingleInput = processMacroChain(tempSettableInputArray[0], settablePrecisionInputHold, settablePrecisionInputIndex, false);
                  if (processedSingleInput.is_valid_input == true) {
                    //console.log("Valid input");
                    settableMacroChain[settablePrecisionInputIndex] = processedSingleInput;
                    //console.log(settableMacroChain[settablePrecisionInputIndex]);
                    //
                    let randomColorName = Math.floor(Math.random() * defaultColors.length);
                    client.say(target, ".color " + defaultColorNames[randomColorName]);
                    client.action(target, "@" + usernameToPing + " Your input was interpreted as " + settableMacroChain[settablePrecisionInputIndex].processed_macro_input_string + ";" + settableMacroChain[settablePrecisionInputIndex].processed_macro_input_delay + "ms and was added to position " + settablePrecisionInputIndex + ".");
                  }
                  if (processedSingleInput.is_valid_input == false) {
                    //console.log("Invalid input, warn user");
                    //
                    let randomColorName = Math.floor(Math.random() * defaultColors.length);
                    client.say(target, ".color " + defaultColorNames[randomColorName]);
                    client.action(target, "@" + usernameToPing + " Invalid input, make sure you entered your input correctly.");
                  }
                }
                if (settableMacroChain[settablePrecisionInputIndex] == undefined) {
                  //console.log(settableMacroChain[settablePrecisionInputIndex]);
                  //console.log("Index is empty, but valid");
                  processedSingleInput = processMacroChain(tempSettableInputArray[0], settablePrecisionInputHold, settablePrecisionInputIndex, false);
                  if (processedSingleInput.is_valid_input == true) {
                    //console.log("Valid input");
                    settableMacroChain.push(processedSingleInput);
                    //console.log(settableMacroChain[settablePrecisionInputIndex]);
                    //
                    let randomColorName = Math.floor(Math.random() * defaultColors.length);
                    client.say(target, ".color " + defaultColorNames[randomColorName]);
                    client.action(target, "@" + usernameToPing + " Your input was interpreted as " + settableMacroChain[settablePrecisionInputIndex].processed_macro_input_string + ";" + settableMacroChain[settablePrecisionInputIndex].processed_macro_input_delay + "ms and was added to position " + settablePrecisionInputIndex + ".");
                  }
                  if (processedSingleInput.is_valid_input == false) {
                    //console.log("Invalid input, warn user");
                    //
                    let randomColorName = Math.floor(Math.random() * defaultColors.length);
                    client.say(target, ".color " + defaultColorNames[randomColorName]);
                    client.action(target, "@" + usernameToPing + " Invalid input, make sure you entered your input correctly.");
                  }
                }
                //let processedSingleInput = processMacroChain(tempSettableInputArray[0], settablePrecisionInputHold, settablePrecisionInputIndex, false);
                //settableMacroChain.push(processedSingleInput);
                //console.log(processedSingleInput);
                //console.log("settableMacroChain.length = " + settableMacroChain.length);
                //console.log(settableMacroChain);
              }
              if (isValidIndex == false) {
                //console.log("Invalid index, warn user");
                //
                let randomColorName = Math.floor(Math.random() * defaultColors.length);
                client.say(target, ".color " + defaultColorNames[randomColorName]);
                client.action(target, "@" + usernameToPing + " Invalid position, please make sure there are no typos, and please make sure the positions before the position you entered were already assigned with inputs. First position is 0, last position is 63. Negative positions don't work, and positions higher than 63 can't be assigned.");
              }
              //console.log("settableMacroChain.length = " + settableMacroChain.length);
              //console.log(settableMacroChain);
              //let processedSingleInput = processMacroChain(messageWords[2], messageWords[3], messageWords[1], false);
              //console.log(processedSingleInput); 
            }
          }
          let playSettablePrefixCheck = /^[!\"#$%&'()*+,\-./:;%=%?@\[\\\]^_`{|}~¡¦¨«¬­¯°±»½⅔¾⅝⅞∅ⁿ№★†‡‹›¿‰℅æßçñ¹⅓¼⅛²⅜³⁴₱€¢£¥—–·„“”‚‘’•√π÷×¶∆′″←↑↓→§Π♣♠♥♪♦∞≠≈©®™✓‛‟❛❜❝❞❟❠❮❯⹂〝〞〟＂🙶🙷🙸󠀢⍻✅✔𐄂🗸‱]*\s*(exec\s*macro)+/ig.test(originalMessage);
          //console.log("playSettablePrefixCheck = " + playSettablePrefixCheck);
          if (playSettablePrefixCheck == true) {
            let playSettableParametersToWrite = [controllerConfig.final_macro_preamble, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, controllerConfig.final_macro_preamble];
            let playSettableRepeatCount = 0; // How many times to repeat the macro chain
            let playSettableInputCount = 0; // How many inputs from the macro chain to execute
            let isValidInputCount = false;
            //console.log(isNaN(parseInt(testVar[testVarIndex], 10)));
            if (isNaN(parseInt(messageWords[1], 10)) == false) {
              //console.log("POGGERS WE GOT A NUMBER");
              if (parseInt(messageWords[1], 10) >= 0) {
                if (settableMacroChain.length == 0) {
                  //console.log("There are 0 inputs");
                }
                if (settableMacroChain.length > 0) {
                  //console.log("There's at least one input");
                }
                if (parseInt(messageWords[1], 10) <= settableMacroChain.length - 1) {
                  //console.log("Case1 " + settableMacroChain.length + " " + parseInt(messageWords[1], 10));
                  //console.log(controllerConfig.final_macro_preamble - controllerConfig.initial_macro_preamble);
                  if (settableMacroChain.length - 1 >= parseInt(messageWords[1], 10)) {
                    //console.log("THIS IS WITHIN THE RANGE");
                    //console.log(controllerConfig.final_macro_preamble - controllerConfig.initial_macro_preamble);
                    isValidInputCount = true;
                    playSettableInputCount = parseInt(messageWords[1], 10);
                  }
                  if (settableMacroChain.length - 1 < parseInt(messageWords[1], 10)) {
                    //console.log("THIS IS BEYOND THE RANGE");
                    //console.log(controllerConfig.final_macro_preamble - controllerConfig.initial_macro_preamble);
                    isValidInputCount = false;
                    //settablePrecisionInputIndex = parseInt(messageWords[2], 10);
                  }
                  //isValidIndex = true;
                  //settablePrecisionInputIndex = parseInt(messageWords[2], 10);
                }
                if (parseInt(messageWords[1], 10) > settableMacroChain.length - 1) {
                  //console.log("Case2 " + settableMacroChain.length + " " + parseInt(messageWords[1], 10));
                  isValidInputCount = false;
                  //settablePrecisionInputIndex = controllerConfig.max_duration_per_precision_input_millis;
                }
                //console.log("WE GOT A POSITIVE INTEGER");
                //console.log(testVar[testVarIndex]);
                //precisionInputHold = parseInt(testVar[testVarIndex], 10);
              }
              if (parseInt(messageWords[1], 10) < 0) {
                //console.log("Case3 " + settableMacroChain.length + " " + parseInt(messageWords[1], 10));
                isValidInputCount = false;
                //console.log("WE GOT A NON-POSITIVE INTEGER");
                //console.log(testVar[testVarIndex]);
                //settablePrecisionInputIndex = controllerConfig.default_duration_per_precision_input_millis;
              }
            }
            if (isNaN(parseInt(messageWords[1], 10)) == true) {
              //console.log("Case4 " + settableMacroChain.length + " " + parseInt(messageWords[1], 10));
              isValidInputCount = false;
              // Just add to the next index if this happens?
              //console.log(testVar[testVarIndex]);
              //console.log("NOT A NUMBER :(");
              //settablePrecisionInputIndex = controllerConfig.default_duration_per_precision_input_millis;
            }

            if (isNaN(parseInt(messageWords[2], 10)) == false) {
              //console.log("POGGERS WE GOT A NUMBER");
              //console.log("Play0");
              if (parseInt(messageWords[2], 10) >= 0) {
                //console.log("Play1");
                if (parseInt(messageWords[2], 10) <= controllerConfig.max_times_to_repeat_macro) {
                  //console.log("Play2");
                  playSettableRepeatCount = parseInt(messageWords[2], 10);
                }
                if (parseInt(messageWords[2], 10) > controllerConfig.max_times_to_repeat_macro) {
                  //console.log("Play3");
                  playSettableRepeatCount = controllerConfig.max_times_to_repeat_macro;
                }
                //console.log("WE GOT A NON-NEGATIVE INTEGER");
                //console.log(testVar[testVarIndex]);
                //precisionInputRepeat = parseInt(testVar[testVarIndex], 10);
              }
              if (parseInt(messageWords[2], 10) < 0) {
                //console.log("Play4");
                //console.log("WE GOT A NEGATIVE INTEGER");
                //console.log(testVar[testVarIndex]);
                playSettableRepeatCount = 0;
              }
            }
            if (isNaN(parseInt(messageWords[2], 10)) == true) {
              //console.log("Play5");
              //console.log(testVar[testVarIndex]);
              //console.log("NOT A NUMBER :(");
              playSettableRepeatCount = 0;
            }
            //console.log("isValidInputCount = " + isValidInputCount);
            //console.log("playSettableRepeatCount = " + playSettableRepeatCount);
            //console.log("isValidInputCount = " + isValidInputCount);
            if (isValidInputCount == false) {
              let randomColorName = Math.floor(Math.random() * defaultColors.length);
              client.say(target, ".color " + defaultColorNames[randomColorName]);
              client.action(target, "@" + usernameToPing + " Invalid ending position, please make sure there are no typos, and please make sure the positions before the position you entered were already assigned with inputs. First position is 0, last position is the position you entered. (It'll play the inputs starting from the position 0 and will end at the position you entered.) Negative positions don't work, and positions higher than 63 can't be used.");
            }
            if (isValidInputCount == true) {
              let inputsToListPlayback = "";
              //console.log("playSettableInputCount = " + playSettableInputCount);
              //console.log("playSettableRepeatCount = " + playSettableRepeatCount);
              for (let settableInputsIndex = 0; settableInputsIndex < playSettableInputCount + 1; settableInputsIndex++) {
                await sleep(1);
                //console.log("");
                //console.log("settableInputsIndex = " + settableInputsIndex);
                //console.log("playSettableInputCount = " + playSettableInputCount);
                //console.log("playSettableInputCount + 1 = " + (playSettableInputCount + 1));
                //console.log(settableMacroChain[settableInputsIndex]);
                inputsToListPlayback = inputsToListPlayback + settableMacroChain[settableInputsIndex].processed_macro_input_string + ";" + settableMacroChain[settableInputsIndex].processed_macro_input_delay + "ms,";
                //

                // Clear the incoming serial data from arduino before setting settable advanced input
                port.flush(function(err, results) {
                  if (err) {
                    if (client.readyState() === "OPEN") {
                      if (chatConfig.send_debug_channel_messages == true) {
                        let randomColorName = Math.floor(Math.random() * defaultColors.length);
                        client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
                        client.action(chatConfig.debug_channel, new Date().toISOString() + " [SERIAL PORT] Failed to flush port com_port=" + controllerConfig.com_port + ", com_port_parameters=" + JSON.stringify(controllerConfig.com_port_parameters) + ", err.message=" + err.message);
                      }
                    }
                    return console.log(err);
                  }
                  //console.log(new Date().toISOString() + " flush results " + results);
                });
                port.drain(function(err, results) {
                  if (err) {
                    if (client.readyState() === "OPEN") {
                      if (chatConfig.send_debug_channel_messages == true) {
                        let randomColorName = Math.floor(Math.random() * defaultColors.length);
                        client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
                        client.action(chatConfig.debug_channel, new Date().toISOString() + " [SERIAL PORT] Failed to drain port com_port=" + controllerConfig.com_port + ", com_port_parameters=" + JSON.stringify(controllerConfig.com_port_parameters) + ", err.message=" + err.message);
                      }
                    }
                    return console.log(err);
                  }
                  //console.log(new Date().toISOString() + " drain results " + results);
                });

                port.write(settableMacroChain[settableInputsIndex].input_data, function(err) {
                  if (err) {
                    if (client.readyState() === "OPEN") {
                      if (chatConfig.send_debug_channel_messages == true) {
                        let randomColorName = Math.floor(Math.random() * defaultColors.length);
                        client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
                        client.action(chatConfig.debug_channel, new Date().toISOString() + " [SERIAL PORT] Failed to write to port com_port=" + controllerConfig.com_port + ", com_port_parameters=" + JSON.stringify(controllerConfig.com_port_parameters) + ", err.message=" + err.message);
                      }
                    }
                    return console.log("Error on write: " + err.message);
                  }
                });
                //
              }
              //
              if (playSettableRepeatCount > 0) {
                playSettableParametersToWrite[2] = 0x01; // Tell the arduino to loop, it'll loop when it gets to the end of a macro, otherwise it'll only execute once, even if the "times to loop" parameter is higher than 1
              }
              //
              playSettableParametersToWrite[0] = controllerConfig.final_macro_preamble; // controllerConfig.final_macro_preamble Preamble is used to tell the arduino how an input macro should be executed
              playSettableParametersToWrite[1] = playSettableInputCount + 1; // How many inputs to iterate through
              //macroParametersToWrite[2] = 0x00; // Loop or no Loop 0 == No loop, 1 == Loop
              playSettableParametersToWrite[3] = 0x00; // Current Macro index (always set this to 0 to start at the beginning, otherwise you can specify where it should start)
              playSettableParametersToWrite[4] = playSettableRepeatCount; // Times to loop
              playSettableParametersToWrite[5] = 0x00; // Loop counter (Always set this to 0)
              playSettableParametersToWrite[6] = 0x00; // Unused for pre/postamble controllerConfig.final_macro_preamble
              playSettableParametersToWrite[7] = 0x00; // Unused for pre/postamble controllerConfig.final_macro_preamble
              playSettableParametersToWrite[8] = 0x00; // Unused for pre/postamble controllerConfig.final_macro_preamble
              playSettableParametersToWrite[9] = 0x00; // Unused for pre/postamble controllerConfig.final_macro_preamble
              playSettableParametersToWrite[10] = 0x00; // Unused for pre/postamble controllerConfig.final_macro_preamble
              playSettableParametersToWrite[11] = controllerConfig.final_macro_preamble; // controllerConfig.final_macro_preamble Postamble is used to tell the arduino how an input macro should be executed
              //console.log(playSettableParametersToWrite);
              //let macroParametersToWrite = [controllerConfig.final_macro_preamble, currentMacroChainIndex + 1, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, controllerConfig.final_macro_preamble];
              //
              await sleep(1);

              // Clear the incoming serial data from arduino before setting an advanced input to be executed
              port.flush(function(err, results) {
                if (err) {
                  if (client.readyState() === "OPEN") {
                    if (chatConfig.send_debug_channel_messages == true) {
                      let randomColorName = Math.floor(Math.random() * defaultColors.length);
                      client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
                      client.action(chatConfig.debug_channel, new Date().toISOString() + " [SERIAL PORT] Failed to flush port com_port=" + controllerConfig.com_port + ", com_port_parameters=" + JSON.stringify(controllerConfig.com_port_parameters) + ", err.message=" + err.message);
                    }
                  }
                  return console.log(err);
                }
                //console.log(new Date().toISOString() + " flush results " + results);
              });
              port.drain(function(err, results) {
                if (err) {
                  if (client.readyState() === "OPEN") {
                    if (chatConfig.send_debug_channel_messages == true) {
                      let randomColorName = Math.floor(Math.random() * defaultColors.length);
                      client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
                      client.action(chatConfig.debug_channel, new Date().toISOString() + " [SERIAL PORT] Failed to drain port com_port=" + controllerConfig.com_port + ", com_port_parameters=" + JSON.stringify(controllerConfig.com_port_parameters) + ", err.message=" + err.message);
                    }
                  }
                  return console.log(err);
                }
                //console.log(new Date().toISOString() + " drain results " + results);
              });

              port.write(playSettableParametersToWrite, function(err) {
                if (err) {
                  if (client.readyState() === "OPEN") {
                    if (chatConfig.send_debug_channel_messages == true) {
                      let randomColorName = Math.floor(Math.random() * defaultColors.length);
                      client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
                      client.action(chatConfig.debug_channel, new Date().toISOString() + " [SERIAL PORT] Failed to write to port com_port=" + controllerConfig.com_port + ", com_port_parameters=" + JSON.stringify(controllerConfig.com_port_parameters) + ", err.message=" + err.message);
                    }
                  }
                  return console.log("Error on write: " + err.message);
                }
              });
              //
              //let randomColorName = Math.floor(Math.random() * defaultColors.length);
              //client.say(target, ".color " + defaultColorNames[randomColorName]);
              //client.action(target, "@" + usernameToPing + " Executing the first " + playSettableInputCount + " inputs (starting position is 0) and repeating " + playSettableRepeatCount + " times. Type Stop or Wait to stop execution of inputs.");
              inputsToListPlayback = inputsToListPlayback.replace(/[\.\,]+$/ig, "");
              //console.log("inputsToListPlayback = " + inputsToListPlayback);
              let splitInputsToListInMultipleStringsPlayback = [];
              if (inputsToListPlayback.length >= 200) {
                //let splitInputsToListInMultipleStringsPlayback = inputsToListPlayback.match(/.{100}/ig);
                splitInputsToListInMultipleStringsPlayback = inputsToListPlayback.match(/(?:[^\s]+\s){0,15}[^\s]+/ig);
                //console.log(splitInputsToListInMultipleStringsPlayback);
                let randomColorName = Math.floor(Math.random() * defaultColors.length);
                client.say(target, ".color " + defaultColorNames[randomColorName]);
                for (let splitInputsInMultipleStringsPlaybackIndex = 0; splitInputsInMultipleStringsPlaybackIndex < splitInputsToListInMultipleStringsPlayback.length; splitInputsInMultipleStringsPlaybackIndex++) {
                  if (splitInputsInMultipleStringsPlaybackIndex == 0) {
                    //console.log("CASE A");
                    client.action(target, "@" + usernameToPing + " Executing the first " + playSettableInputCount + " inputs (starting position is 0) and repeating " + playSettableRepeatCount + " times. Type Stop or Wait to stop execution of inputs. " + splitInputsToListInMultipleStringsPlayback[splitInputsInMultipleStringsPlaybackIndex]);
                  }
                  if (splitInputsInMultipleStringsPlaybackIndex > 0) {
                    //console.log("CASE B");
                    client.action(target, splitInputsToListInMultipleStringsPlayback[splitInputsInMultipleStringsPlaybackIndex]);
                  }
                }
                //console.log(splitInputsToListInMultipleStringsPlayback);
                //client.action(target, "@" + usernameToPing + " Your input was interpreted as " + inputsToListPlayback);
              }
              if (inputsToListPlayback.length < 200) {
                //console.log("CASE C");
                //let splitInputsToListInMultipleStringsPlayback = inputsToListPlayback.match(/.{100}/ig);
                //splitInputsToListInMultipleStringsPlayback = inputsToListPlayback.match(/(?:[^\,]+\,){1,10}[^\,]+/ig);
                //console.log(splitInputsToListInMultipleStringsPlayback);
                let randomColorName = Math.floor(Math.random() * defaultColors.length);
                client.say(target, ".color " + defaultColorNames[randomColorName]);
                client.action(target, "@" + usernameToPing + " Executing the first " + playSettableInputCount + " inputs (starting position is 0) and repeating " + playSettableRepeatCount + " times. Type Stop or Wait to stop execution of inputs. " + inputsToListPlayback);
                //client.action(target, "@" + usernameToPing + " Your input was interpreted as " + inputsToListPlayback);
              }
            }
            //console.log("Should be a non-negative integer");
          }
          // Sample input:
          // a+b+z:266/255.up+left:133/a+b+z:266/255.up+left:133/a+b+z:266/255.up+left:133/0
          // Input explanation:
          // input1:delay/repeatcount.input2:delay/input3:delay/repeatcount.input4:delay/input5:delay/repeatcount.input5:delay/repeatcount
          // First, inputs are split by periods (now split by commas),
          // Then, the elements of the input are split by : and /
          // Output should kinda look like this
          // a+b+z 266ms of delay repeating 255 times (repeat is only considered on the last element in the input array, so this repeat is not taken into consideration)
          // up+l
          let macroDelayUsed = 0; // This variable keeps track of how many inputs have custom delay in the macro chain, if it's 0, set the first param in the last input of the macro chain to be repeat, if it's not 0, set the first param in the last input of the macro chain to be delay (only really used on a macro chain that has more than one input)
          precisionInputs = [];
          //console.log("messageWords[0] Before " + messageWords[0]);
          precisionInputs = message.replace(/[\s\.\,]+/ig, " ");
          precisionInputs = precisionInputs.trim();
          //console.log("messageWords[0] NOW " + precisionInputs);

          precisionInputs = precisionInputs.split(/\s+/ig);
          //precisionInputs = precisionInputs.trim();
          //console.log("precisionInputs.length = " + precisionInputs.length);
          for (var precisionInputsIndex = 0; precisionInputsIndex < precisionInputs.length; precisionInputsIndex++) {
            let didPrecisionInputMatch = false;
            //console.log("");
            //console.log("precisionInputsIndex = " + precisionInputsIndex + " precisionInputs[precisionInputsIndex] = " + precisionInputs[precisionInputsIndex]);
            //console.log("precisionInputs[precisionInputsIndex] at index " + precisionInputsIndex + " " + precisionInputs[precisionInputsIndex]);
            precisionInputs[precisionInputsIndex] = precisionInputs[precisionInputsIndex].replace(/^[!\"#$%&'()*+,-./:;%=%?@\[\\\]_`{|}~¡¦¨«¬­¯°±»½⅔¾⅝⅞∅ⁿ№★†‡‹›¿‰℅æßçñ¹⅓¼⅛²⅜³⁴₱€¢£¥—–·„“”‚‘’•√π÷×¶∆′″←↑↓→§Π♣♠♥♪♦∞≠≈©®™✓‛‟❛❜❝❞❟❠❮❯⹂〝〞〟＂🙶🙷🙸󠀢⍻✅✔𐄂🗸‱]+/ig, ""); // Remove all unecessary prefix
            //console.log("precisionInputs[precisionInputsIndex] at index " + precisionInputsIndex + " " + precisionInputs[precisionInputsIndex]);
            if (precisionInputs[precisionInputsIndex] == "") {
              //console.log("INVALID INPUT 1");
            }
            if (precisionInputs[precisionInputsIndex] != "") {
              //console.log("VALID INPUT 1");
              let tempInputArray = precisionInputs[precisionInputsIndex].replace(/[\/\\\;\*\']+/ig, " ");
              tempInputArray = tempInputArray.trim();

              tempInputArray = tempInputArray.split(/\s+/ig);

              precisionInputString = "";
              precisionInputHold = controllerConfig.default_duration_per_precision_input_millis;
              //precisionInputRepeat = 0;
              //console.log("tempInputArray.length = " + tempInputArray.length);
              for (let tempInputArrayIndex = 0; tempInputArrayIndex < tempInputArray.length; tempInputArrayIndex++) {
                //console.log("tempInputArrayIndex = " + tempInputArrayIndex + " tempInputArray[tempInputArrayIndex] = " + tempInputArray[tempInputArrayIndex]);
                if (tempInputArrayIndex == 0) {
                  //console.log(testVar[testVarIndex]);
                  //console.log("Should be a string");
                  precisionInputString = tempInputArray[tempInputArrayIndex];
                }
                //console.log("precisionInputs.length - 1 = " + (precisionInputs.length - 1))
                if (tempInputArrayIndex == 1) {
                  if (precisionInputs.length == 1) {
                    //console.log(new Date().toISOString() + " JUST A SINGLE INPUT CASE A");
                    {
                      //console.log(new Date().toISOString() + " SET THIS AS DELAY INSTEAD OF REPEAT MAYBE CASE B");
                      //console.log(isNaN(parseInt(testVar[testVarIndex], 10)));
                      if (isNaN(parseInt(tempInputArray[tempInputArrayIndex], 10)) == false) {
                        //console.log("POGGERS WE GOT A NUMBER");
                        if (parseInt(tempInputArray[tempInputArrayIndex], 10) >= 0) {
                          if (parseInt(tempInputArray[tempInputArrayIndex], 10) <= controllerConfig.max_duration_per_precision_input_millis) {
                            precisionInputHold = parseInt(tempInputArray[tempInputArrayIndex], 10);
                            if (precisionInputHold <= 10) {
                              precisionInputHold = precisionInputHold * 1000; // People will intuitively enter seconds as delay, this fixes that so seconds are valid, but only if the desired delay is less than or equals 10 seconds
                            }
                          }
                          if (parseInt(tempInputArray[tempInputArrayIndex], 10) > controllerConfig.max_duration_per_precision_input_millis) {
                            precisionInputHold = controllerConfig.max_duration_per_precision_input_millis;
                          }
                          //console.log("WE GOT A POSITIVE INTEGER");
                          //console.log(testVar[testVarIndex]);
                          //precisionInputHold = parseInt(testVar[testVarIndex], 10);
                        }
                        if (parseInt(tempInputArray[tempInputArrayIndex], 10) < 1) {
                          //console.log("WE GOT A NON-POSITIVE INTEGER");
                          //console.log(testVar[testVarIndex]);
                          precisionInputHold = controllerConfig.default_duration_per_precision_input_millis;
                        }
                      }
                      if (isNaN(parseInt(tempInputArray[tempInputArrayIndex], 10)) == true) {
                        //console.log(testVar[testVarIndex]);
                        //console.log("NOT A NUMBER :(");
                        precisionInputHold = controllerConfig.default_duration_per_precision_input_millis;
                      }
                      //console.log("Should be a positive integer");
                    }
                  }
                  if (precisionInputs.length != 1) {
                    //console.log(new Date().toISOString() + " MORE THAN A SINGLE INPUT CASE C");
                    if (precisionInputsIndex != precisionInputs.length - 1) {
                      //if (tempInputArray.length != 2)
                      {
                        //console.log(new Date().toISOString() + " SET THIS AS DELAY INSTEAD OF REPEAT MAYBE CASE D");
                        //console.log(isNaN(parseInt(testVar[testVarIndex], 10)));
                        if (isNaN(parseInt(tempInputArray[tempInputArrayIndex], 10)) == false) {
                          //console.log("POGGERS WE GOT A NUMBER");
                          macroDelayUsed++;
                          if (parseInt(tempInputArray[tempInputArrayIndex], 10) >= 0) {
                            if (parseInt(tempInputArray[tempInputArrayIndex], 10) <= controllerConfig.max_duration_per_precision_input_millis) {
                              precisionInputHold = parseInt(tempInputArray[tempInputArrayIndex], 10);
                              if (precisionInputHold <= 10) {
                                precisionInputHold = precisionInputHold * 1000; // People will intuitively enter seconds as delay, this fixes that so seconds are valid, but only if the desired delay is less than or equals 10 seconds
                              }
                            }
                            if (parseInt(tempInputArray[tempInputArrayIndex], 10) > controllerConfig.max_duration_per_precision_input_millis) {
                              precisionInputHold = controllerConfig.max_duration_per_precision_input_millis;
                            }
                            //console.log("WE GOT A POSITIVE INTEGER");
                            //console.log(testVar[testVarIndex]);
                            //precisionInputHold = parseInt(testVar[testVarIndex], 10);
                          }
                          if (parseInt(tempInputArray[tempInputArrayIndex], 10) < 1) {
                            //console.log("WE GOT A NON-POSITIVE INTEGER");
                            //console.log(testVar[testVarIndex]);
                            precisionInputHold = controllerConfig.default_duration_per_precision_input_millis;
                          }
                        }
                        if (isNaN(parseInt(tempInputArray[tempInputArrayIndex], 10)) == true) {
                          //console.log(testVar[testVarIndex]);
                          //console.log("NOT A NUMBER :(");
                          precisionInputHold = controllerConfig.default_duration_per_precision_input_millis;
                        }
                        //console.log("Should be a positive integer");
                      }
                    }
                    //console.log(new Date().toISOString() + " macroDelayUsed = " + macroDelayUsed);
                    if (precisionInputsIndex == precisionInputs.length - 1) {
                      if (macroDelayUsed != 0) {
                        //console.log(new Date().toISOString() + " SET THIS AS DELAY INSTEAD OF REPEAT MAYBE CASE E");
                        //console.log(isNaN(parseInt(testVar[testVarIndex], 10)));
                        if (isNaN(parseInt(tempInputArray[tempInputArrayIndex], 10)) == false) {
                          //console.log("POGGERS WE GOT A NUMBER");
                          if (parseInt(tempInputArray[tempInputArrayIndex], 10) >= 0) {
                            if (parseInt(tempInputArray[tempInputArrayIndex], 10) <= controllerConfig.max_duration_per_precision_input_millis) {
                              precisionInputHold = parseInt(tempInputArray[tempInputArrayIndex], 10);
                              if (precisionInputHold <= 10) {
                                precisionInputHold = precisionInputHold * 1000; // People will intuitively enter seconds as delay, this fixes that so seconds are valid, but only if the desired delay is less than or equals 10 seconds
                              }
                            }
                            if (parseInt(tempInputArray[tempInputArrayIndex], 10) > controllerConfig.max_duration_per_precision_input_millis) {
                              precisionInputHold = controllerConfig.max_duration_per_precision_input_millis;
                            }
                            //console.log("WE GOT A POSITIVE INTEGER");
                            //console.log(testVar[testVarIndex]);
                            //precisionInputHold = parseInt(testVar[testVarIndex], 10);
                          }
                          if (parseInt(tempInputArray[tempInputArrayIndex], 10) < 1) {
                            //console.log("WE GOT A NON-POSITIVE INTEGER");
                            //console.log(testVar[testVarIndex]);
                            precisionInputHold = controllerConfig.default_duration_per_precision_input_millis;
                          }
                        }
                        if (isNaN(parseInt(tempInputArray[tempInputArrayIndex], 10)) == true) {
                          //console.log(testVar[testVarIndex]);
                          //console.log("NOT A NUMBER :(");
                          precisionInputHold = controllerConfig.default_duration_per_precision_input_millis;
                        }
                        //console.log("Should be a positive integer");
                      }
                      if (macroDelayUsed == 0) {
                        if (tempInputArray.length == 2) {
                          //console.log(new Date().toISOString() + " A SET THIS AS REPEAT INSTEAD OF DELAY MAYBE CASE F");
                          //console.log(isNaN(parseInt(testVar[testVarIndex], 10)));
                          if (isNaN(parseInt(tempInputArray[tempInputArrayIndex], 10)) == false) {
                            //console.log(new Date().toISOString() + " A POGGERS WE GOT A NUMBER");
                            if (parseInt(tempInputArray[tempInputArrayIndex], 10) >= 0) {
                              if (parseInt(tempInputArray[tempInputArrayIndex], 10) <= controllerConfig.max_times_to_repeat_macro) {
                                precisionInputRepeat = parseInt(tempInputArray[tempInputArrayIndex], 10);
                                isValidPrecisionInputRepeat = true;
                              }
                              if (parseInt(tempInputArray[tempInputArrayIndex], 10) > controllerConfig.max_times_to_repeat_macro) {
                                precisionInputRepeat = controllerConfig.max_times_to_repeat_macro;
                                isValidPrecisionInputRepeat = true;
                              }
                              //console.log(new Date().toISOString() + " A WE GOT A POSITIVE INTEGER");
                              //console.log(testVar[testVarIndex]);
                              //precisionInputHold = parseInt(testVar[testVarIndex], 10);
                            }
                            if (parseInt(tempInputArray[tempInputArrayIndex], 10) < 0) {
                              //console.log(new Date().toISOString() + " A WE GOT A NON-POSITIVE INTEGER");
                              //console.log(testVar[testVarIndex]);
                              precisionInputRepeat = 0;
                            }
                          }
                          if (isNaN(parseInt(tempInputArray[tempInputArrayIndex], 10)) == true) {
                            //console.log(testVar[testVarIndex]);
                            //console.log(new Date().toISOString() + " A NOT A NUMBER :(");
                            precisionInputRepeat = 0;
                          }
                          //console.log("Should be a positive integer");
                        }
                      }
                      if (tempInputArray.length != 2) {
                        //console.log(new Date().toISOString() + " SET THIS AS DELAY INSTEAD OF REPEAT MAYBE CASE G");
                        //console.log(isNaN(parseInt(testVar[testVarIndex], 10)));
                        if (isNaN(parseInt(tempInputArray[tempInputArrayIndex], 10)) == false) {
                          //console.log("POGGERS WE GOT A NUMBER");
                          if (parseInt(tempInputArray[tempInputArrayIndex], 10) >= 0) {
                            if (parseInt(tempInputArray[tempInputArrayIndex], 10) <= controllerConfig.max_duration_per_precision_input_millis) {
                              precisionInputHold = parseInt(tempInputArray[tempInputArrayIndex], 10);
                              if (precisionInputHold <= 10) {
                                precisionInputHold = precisionInputHold * 1000; // People will intuitively enter seconds as delay, this fixes that so seconds are valid, but only if the desired delay is less than or equals 10 seconds
                              }
                            }
                            if (parseInt(tempInputArray[tempInputArrayIndex], 10) > controllerConfig.max_duration_per_precision_input_millis) {
                              precisionInputHold = controllerConfig.max_duration_per_precision_input_millis;
                            }
                            //console.log("WE GOT A POSITIVE INTEGER");
                            //console.log(testVar[testVarIndex]);
                            //precisionInputHold = parseInt(testVar[testVarIndex], 10);
                          }
                          if (parseInt(tempInputArray[tempInputArrayIndex], 10) < 1) {
                            //console.log("WE GOT A NON-POSITIVE INTEGER");
                            //console.log(testVar[testVarIndex]);
                            precisionInputHold = controllerConfig.default_duration_per_precision_input_millis;
                          }
                        }
                        if (isNaN(parseInt(tempInputArray[tempInputArrayIndex], 10)) == true) {
                          //console.log(testVar[testVarIndex]);
                          //console.log("NOT A NUMBER :(");
                          precisionInputHold = controllerConfig.default_duration_per_precision_input_millis;
                        }
                        //console.log("Should be a positive integer");
                      }
                    }
                  }
                }
                if (tempInputArrayIndex == 2) {
                  //console.log(new Date().toISOString() + " B SET THIS AS REPEAT INSTEAD OF DELAY MAYBE CASE H");
                  //console.log(isNaN(parseInt(testVar[testVarIndex], 10)));
                  if (isNaN(parseInt(tempInputArray[tempInputArrayIndex], 10)) == false) {
                    //console.log(new Date().toISOString() + " B POGGERS WE GOT A NUMBER");
                    if (parseInt(tempInputArray[tempInputArrayIndex], 10) >= 0) {
                      if (parseInt(tempInputArray[tempInputArrayIndex], 10) <= controllerConfig.max_times_to_repeat_macro) {
                        precisionInputRepeat = parseInt(tempInputArray[tempInputArrayIndex], 10);
                        isValidPrecisionInputRepeat = true;
                      }
                      if (parseInt(tempInputArray[tempInputArrayIndex], 10) > controllerConfig.max_times_to_repeat_macro) {
                        precisionInputRepeat = controllerConfig.max_times_to_repeat_macro;
                        isValidPrecisionInputRepeat = true;
                      }
                      //console.log(new Date().toISOString() + " B WE GOT A NON-NEGATIVE INTEGER");
                      //console.log(testVar[testVarIndex]);
                      //precisionInputRepeat = parseInt(testVar[testVarIndex], 10);
                    }
                    if (parseInt(tempInputArray[tempInputArrayIndex], 10) < 0) {
                      //console.log(new Date().toISOString() + " B WE GOT A NEGATIVE INTEGER");
                      //console.log(testVar[testVarIndex]);
                      precisionInputRepeat = 0;
                    }
                  }
                  if (isNaN(parseInt(tempInputArray[tempInputArrayIndex], 10)) == true) {
                    //console.log(testVar[testVarIndex]);
                    //console.log(new Date().toISOString() + " B NOT A NUMBER :(");
                    precisionInputRepeat = 0;
                  }
                  //console.log("Should be a non-negative integer");
                }
                //console.log(testVarIndex);
                //console.log(testVar[testVarIndex]);
              }
              if (precisionInputString == "") {
                //console.log("INVALID INPUT 2");
              }
              if (precisionInputString != "") {
                //console.log("VALID INPUT 2");
                precisionInputString = precisionInputString.replace(/[\+\_\|\#\[\]]+/ig, " ");
                precisionInputString = precisionInputString.trim();
                precisionInputString = precisionInputString.split(/\s+/ig);
                if (precisionInputString[0] == "") {
                  //console.log("INVALID INPUT 3");
                }
                if (precisionInputString[0] != "") {
                  //console.log("VALID INPUT 3");
                  //console.log(precisionInputsIndex)
                  //console.log(precisionInputString);
                  //console.log(precisionInputHold);
                  //console.log(precisionInputRepeat);

                  precisionInputsPreProcessed.input_array.push({
                    input_string_array: precisionInputString,
                    input_hold_delay: precisionInputHold
                  });
                }
              }
              // ALSO ADD MAX LIMIT TO HOLD AND REPEAT
              // MAYBE 65535 FOR HOLD AND 255 FOR REPEAT?
              // I THINK THAT'S TOO HIGH(???)
              // ADD THESE TO AN ARRAY OF OBJECTS
              //testVar = testVar.trim();
              //console.log(precisionInputsIndex);
              //console.log(testVar);
              //console.log(precisionInputs);
              //console.log("Yes");
            }
          }
          //console.log(new Date().toISOString() + " [PRECISIONINPUTREPEAT] precisionInputRepeat = " + precisionInputRepeat);
          if (precisionInputsPreProcessed.input_array.length > 0) {
            precisionInputsPreProcessed.input_repeat_count = precisionInputRepeat;
            //console.log(precisionInputsPreProcessed);
            let currentMacroChainIndex = 0;
            for (let preprocessedArrayIndex = 0; preprocessedArrayIndex < precisionInputsPreProcessed.input_array.length; preprocessedArrayIndex++) {
              if (hasInvalidPrecisionInput == true) {
                //console.log(new Date().toISOString() + " [HASINVALIDPRECISIONINPUT] hasInvalidPrecisionInput = " + hasInvalidPrecisionInput);
              }
              if (hasInvalidPrecisionInput == false) {
                //console.log(new Date().toISOString() + " [HASINVALIDPRECISIONINPUT] hasInvalidPrecisionInput = " + hasInvalidPrecisionInput);
                //console.log(precisionInputsPreProcessed.input_array[preprocessedArrayIndex].input_string_array.join("+"));
                //console.log("currentMacroChainIndex:" + currentMacroChainIndex)
                if (currentMacroChainIndex < controllerConfig.advanced_input_macros_allowed) {
                  await sleep(1); // Have to sleep here because if we sent messages too fast to the arduino, it fails to process the whole thing, yes I have to fix this code on arduino side, not using a hack in this code, yes 0ms, weirdly is just slow enough for it to work, I hate this "solution"
                  let macroChainInputObject = processMacroChain(precisionInputsPreProcessed.input_array[preprocessedArrayIndex].input_string_array.join("+"), precisionInputsPreProcessed.input_array[preprocessedArrayIndex].input_hold_delay, currentMacroChainIndex, true);
                  if (macroChainInputObject.is_valid_input == false) {
                    // idk do the thing to do the replacmenet thing
                    //console.log(new Date().toISOString() + " [ISVALIDPRECISIONINPUTREPEAT] isValidPrecisionInputRepeat = " + isValidPrecisionInputRepeat);
                    hasInvalidPrecisionInput = true;

                    if (isValidPrecisionInputRepeat == false) {
                      //
                      //console.log(isNaN(parseInt(testVar[testVarIndex], 10)));
                      if (isNaN(parseInt(precisionInputsPreProcessed.input_array[preprocessedArrayIndex].input_string_array.join("+"), 10)) == false) {
                        //console.log("POGGERS WE GOT A NUMBER");
                        if (parseInt(precisionInputsPreProcessed.input_array[preprocessedArrayIndex].input_string_array.join("+"), 10) >= 0) {
                          if (parseInt(precisionInputsPreProcessed.input_array[preprocessedArrayIndex].input_string_array.join("+"), 10) <= controllerConfig.max_times_to_repeat_macro) {
                            precisionInputRepeat = parseInt(precisionInputsPreProcessed.input_array[preprocessedArrayIndex].input_string_array.join("+"), 10);
                          }
                          if (parseInt(precisionInputsPreProcessed.input_array[preprocessedArrayIndex].input_string_array.join("+"), 10) > controllerConfig.max_times_to_repeat_macro) {
                            precisionInputRepeat = controllerConfig.max_times_to_repeat_macro;
                          }
                          //console.log("WE GOT A NON-NEGATIVE INTEGER");
                          //console.log(testVar[testVarIndex]);
                          //precisionInputRepeat = parseInt(testVar[testVarIndex], 10);
                        }
                        if (parseInt(precisionInputsPreProcessed.input_array[preprocessedArrayIndex].input_string_array.join("+"), 10) < 0) {
                          //console.log("WE GOT A NEGATIVE INTEGER");
                          //console.log(testVar[testVarIndex]);
                          precisionInputRepeat = 0;
                        }
                      }
                      if (isNaN(parseInt(precisionInputsPreProcessed.input_array[preprocessedArrayIndex].input_string_array.join("+"), 10)) == true) {
                        //console.log(testVar[testVarIndex]);
                        //console.log("NOT A NUMBER :(");
                        precisionInputRepeat = 0;
                      }
                      precisionInputsPreProcessed.input_repeat_count = precisionInputRepeat;
                      //console.log("Should be a non-negative integer");
                      //
                      //console.log(new Date().toISOString() + " [MACRO STRING] precisionInputsPreProcessed.input_array[preprocessedArrayIndex].input_string_array.join(\"+\") = " + precisionInputsPreProcessed.input_array[preprocessedArrayIndex].input_string_array.join("+") + " preprocessedArrayIndex = " + preprocessedArrayIndex + " precisionInputsPreProcessed.input_repeat_count = " + precisionInputsPreProcessed.input_repeat_count);
                    }

                  }
                  //console.log(macroChainInputObject);
                  if (macroChainInputObject.is_valid_input == true) {
                    precisionInputStringToDisplay.macro_array.push(macroChainInputObject);
                    //precisionInputStringToDisplay2 = precisionInputStringToDisplay2 + macroChainInputObject.processed_macro_input_string + ";";
                    precisionInputStringToDisplay2 = precisionInputStringToDisplay2 + macroChainInputObject.processed_macro_input_string + ";" + macroChainInputObject.processed_macro_input_delay + "ms";
                    if (preprocessedArrayIndex < precisionInputsPreProcessed.input_array.length - 1) {
                      precisionInputStringToDisplay2 = precisionInputStringToDisplay2 + " ";
                      //precisionInputStringToDisplay2 = precisionInputStringToDisplay2 + macroChainInputObject.processed_macro_input_delay + "\n";
                    }
                    if (preprocessedArrayIndex >= precisionInputsPreProcessed.input_array.length - 1) {
                      //precisionInputStringToDisplay2 = precisionInputStringToDisplay2 + "*" + macroChainInputObject.processed_macro_input_delay;
                      //precisionInputStringToDisplay2 = precisionInputStringToDisplay2 + macroChainInputObject.processed_macro_input_delay;
                    }
                    //precisionInputStringToDisplay2.concat(macroChainInputObject.processed_macro_input_string)
                    //precisionInputStringToDisplay2.concat(macroChainInputObject.processed_macro_input_delay + "ms ")
                    //console.log(precisionInputStringToDisplay2);
                    //console.log(macroChainInputObject);
                    currentMacroChainIndex++;
                  }
                }
              }
              //console.log(processMacroChain(precisionInputsPreProcessed.input_array[preprocessedArrayIndex].input_string_array.join("+"), precisionInputsPreProcessed.input_array[preprocessedArrayIndex].input_hold_delay, preprocessedArrayIndex));
              /*
              for (let inputStringArrayIndex = 0; inputStringArrayIndex < precisionInputsPreProcessed.input_array[preprocessedArrayIndex].input_string_array.length; inputStringArrayIndex++) {
                //console.log(precisionInputsPreProcessed.input_array[preprocessedArrayIndex].input_string_array[inputStringArrayIndex]);
              }
              */
            }
            let macroParametersToWrite = [controllerConfig.final_macro_preamble, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, controllerConfig.final_macro_preamble];
            //console.log(macroParametersToWrite);
            //console.log("precisionInputsPreProcessed.input_repeat_count: " + precisionInputsPreProcessed.input_repeat_count);
            if (currentMacroChainIndex > 0) {
              //console.log("IS THIS VALID INPUT?");
              // Get user from userdatabase by using their userid then increment the user's advanced input count
              mongoClient.connect(mongoUrl, {
                useUnifiedTopology: true
              }, function(err, userDb) {
                if (err) {
                  throw err;
                }
                let userDatabase = userDb.db(globalConfig.main_database_name);
                userDatabase.collection(globalConfig.chatters_collection_name).findOne({
                  user_id: userId
                }, function(err, result) {
                  if (err) {
                    throw err;
                  }
                  //console.log(result);
                  //
                  mongoClient.connect(mongoUrl, {
                    useUnifiedTopology: true
                  }, function(err, databaseToUpdate) {
                    if (err) {
                      throw err;
                    }
                    let userDatabaseToUpdate = databaseToUpdate.db(globalConfig.main_database_name);
                    let dataToQuery = {
                      user_id: userId
                    };
                    let dataToUpdate = {
                      $set: {
                        user_id: result.user_id,

                        first_message_sent_id: result.first_message_sent_id,
                        last_message_sent_id: result.last_message_sent_id,

                        basic_inputs_sent: result.basic_inputs_sent,
                        advanced_inputs_sent: result.advanced_inputs_sent + 1,
                        total_inputs_sent: result.total_inputs_sent + 1,

                        is_first_message_basic_input: result.is_first_message_basic_input,
                        is_last_message_basic_input: false,

                        is_first_message_advanced_input: result.is_first_message_advanced_input,
                        is_last_message_advanced_input: true,

                        first_basic_input: result.first_basic_input,
                        first_advanced_input: result.first_advanced_input,

                        last_basic_input: result.last_basic_input,
                        last_advanced_input: originalMessage
                      }
                    };
                    if (dataToUpdate.$set.first_advanced_input == "") {
                      // User's first advanced input
                      dataToUpdate.$set.first_advanced_input = originalMessage;
                    }
                    if (dataToUpdate.$set.first_message_sent_id == dataToUpdate.$set.last_message_sent_id) {
                      // User's first message is also an input
                      //console.log("NEW USER PogChamp");
                      dataToUpdate.$set.is_first_message_basic_input = false;
                      dataToUpdate.$set.is_first_message_advanced_input = true;
                    }
                    userDatabaseToUpdate.collection(globalConfig.chatters_collection_name).updateOne(dataToQuery, dataToUpdate, function(err, res) {
                      if (err) {
                        throw err;
                      }
                      //console.log("1 document updated");
                      databaseToUpdate.close();
                    });
                  });
                  //
                  userDb.close();
                });
              });
              // The database checks below check an user's input count
              mongoClient.connect(mongoUrl, {
                useUnifiedTopology: true
              }, function(err, userDb) {
                //isDatabaseBusy = true;
                if (err) {
                  throw err;
                }
                // Check if the user entry for a specific game exists
                let userDatabase = userDb.db(globalConfig.inputter_database_name);
                userDatabase.collection(globalConfig.run_name).findOne({
                  user_id: userId
                }, function(err, result) {
                  if (err) {
                    throw err;
                  }
                  //console.log(result);
                  //isNullDatabase = result;
                  if (result === null) {
                    console.log("YES");
                    mongoClient.connect(mongoUrl, {
                      useUnifiedTopology: true
                    }, function(err, databaseToCreate) {
                      if (err) {
                        throw err;
                      }
                      let userDatabaseToCreate = databaseToCreate.db(globalConfig.inputter_database_name);
                      let dataToInsert = {
                        run_id: globalConfig.run_id,
                        user_id: userId,
                        basic_inputs_sent: 0,
                        advanced_inputs_sent: 1,
                        total_inputs_sent: 1
                      };
                      userDatabaseToCreate.collection(globalConfig.run_name).insertOne(dataToInsert, function(err, res) {
                        if (err) {
                          throw err;
                        }
                        //console.log("1 document inserted");
                        mongoClient.connect(mongoUrl, {
                          useUnifiedTopology: true
                        }, function(err, databaseToReadFrom) {
                          if (err) {
                            throw err;
                          }
                          let userDatabaseToReadFrom = databaseToReadFrom.db(globalConfig.inputter_database_name);
                          userDatabaseToReadFrom.collection(globalConfig.run_name).findOne({
                            user_id: userId
                          }, function(err, databaseToReadFromResult) {
                            if (err) {
                              throw err;
                            }
                            databaseToReadFrom.close();
                            //console.log(databaseToReadFromResult);
                          });
                        });
                        databaseToCreate.close();
                      });
                    });
                    //test();
                  }
                  if (result !== null) {
                    //console.log("NO");
                    mongoClient.connect(mongoUrl, {
                      useUnifiedTopology: true
                    }, function(err, databaseToUpdate) {
                      if (err) {
                        throw err;
                      }
                      let userDatabaseToUpdate = databaseToUpdate.db(globalConfig.inputter_database_name);
                      let dataToQuery = {
                        run_id: result.run_id,
                        user_id: result.user_id,
                        basic_inputs_sent: result.basic_inputs_sent,
                        advanced_inputs_sent: result.advanced_inputs_sent,
                        total_inputs_sent: result.total_inputs_sent
                      };
                      let dataToUpdate = {
                        $set: {
                          run_id: result.run_id,
                          user_id: result.user_id,
                          basic_inputs_sent: result.basic_inputs_sent,
                          advanced_inputs_sent: result.advanced_inputs_sent + 1,
                          total_inputs_sent: result.total_inputs_sent + 1
                        }
                      };
                      //console.log(newvalues);
                      userDatabaseToUpdate.collection(globalConfig.run_name).updateOne(dataToQuery, dataToUpdate, function(err, res) {
                        if (err) {
                          throw err;
                        }
                        //console.log(res.result);
                        //console.log("1 document updated");
                        mongoClient.connect(mongoUrl, {
                          useUnifiedTopology: true
                        }, function(err, databaseToReadFrom) {
                          if (err) {
                            throw err;
                          }
                          let userDatabaseToReadFrom = databaseToReadFrom.db(globalConfig.inputter_database_name);
                          userDatabaseToReadFrom.collection(globalConfig.run_name).findOne({
                            user_id: userId
                          }, function(err, databaseToReadFromResult) {
                            if (err) {
                              throw err;
                            }
                            databaseToReadFrom.close();
                            //console.log(databaseToReadFromResult);
                          });
                        });
                        databaseToUpdate.close();
                      });
                    });
                    //console.log(result.input_count);
                    //test3(result.input_count);
                  }
                  userDb.close();
                  //isDatabaseBusy = false;
                });
              });
              //await sleep(333);
              // The database operations below check the total input count
              mongoClient.connect(mongoUrl, {
                useUnifiedTopology: true
              }, function(err, globalDb) {
                //isDatabaseBusy = true;
                if (err) {
                  throw err;
                }
                // Check if the entry for a specific game exists
                let globalDatabase = globalDb.db(globalConfig.global_database_name);
                globalDatabase.collection(globalConfig.run_name).findOne({}, function(err, result) {
                  if (err) {
                    throw err;
                  }
                  //console.log(result);
                  //isNullDatabase = result;
                  if (result === null) {
                    //console.log("YES");
                    mongoClient.connect(mongoUrl, {
                      useUnifiedTopology: true
                    }, function(err, databaseToCreate) {
                      if (err) {
                        throw err;
                      }
                      let globalDatabaseToCreate = databaseToCreate.db(globalConfig.global_database_name);
                      let dataToInsert = {
                        run_id: globalConfig.run_id,
                        basic_inputs_sent: 0,
                        advanced_inputs_sent: 1,
                        total_inputs_sent: 1,
                        basic_inputs_executed: 0,
                        advanced_inputs_executed: 1,
                        total_inputs_executed: 1
                      };

                      inputCountsObject = dataToInsert;
                      io.sockets.emit("input_counts_object", inputCountsObject);

                      // Executed means inputs that were successfully executed by the Arduino and sent back to the PC
                      globalDatabaseToCreate.collection(globalConfig.run_name).insertOne(dataToInsert, function(err, res) {
                        if (err) {
                          throw err;
                        }
                        //console.log("1 document inserted");
                        mongoClient.connect(mongoUrl, {
                          useUnifiedTopology: true
                        }, function(err, databaseToReadFrom) {
                          if (err) {
                            throw err;
                          }
                          let globalDatabaseToreadFrom = databaseToReadFrom.db(globalConfig.global_database_name);
                          globalDatabaseToreadFrom.collection(globalConfig.run_name).findOne({}, function(err, databaseToReadFromResult) {
                            if (err) {
                              throw err;
                            }
                            databaseToReadFrom.close();
                            //console.log(databaseToReadFromResult);
                            //inputsSent = databaseToReadFromResult.input_count;
                          });
                        });
                        databaseToCreate.close();
                      });
                    });
                    //test();
                  }
                  if (result !== null) {
                    //console.log("NO");
                    mongoClient.connect(mongoUrl, {
                      useUnifiedTopology: true
                    }, function(err, databaseToUpdate) {
                      if (err) {
                        throw err;
                      }
                      let globalDatabaseToUpdate = databaseToUpdate.db(globalConfig.global_database_name);
                      let dataToQuery = {
                        run_id: result.run_id,
                        basic_inputs_sent: result.basic_inputs_sent,
                        advanced_inputs_sent: result.advanced_inputs_sent,
                        total_inputs_sent: result.total_inputs_sent
                        /*
                        basic_inputs_executed: result.basic_inputs_executed,
                        advanced_inputs_executed: result.advanced_inputs_executed,
                        total_inputs_executed: result.total_inputs_executed
                        */
                      };
                      // Executed means inputs that were successfully executed by the Arduino and sent back to the PC
                      let dataToUpdate = {
                        $set: {
                          run_id: result.run_id,
                          basic_inputs_sent: result.basic_inputs_sent,
                          advanced_inputs_sent: result.advanced_inputs_sent + 1,
                          total_inputs_sent: result.total_inputs_sent + 1,
                          basic_inputs_executed: result.basic_inputs_executed,
                          advanced_inputs_executed: result.advanced_inputs_executed,
                          total_inputs_executed: result.total_inputs_executed
                        }
                      };

                      inputCountsObject = dataToUpdate.$set;
                      io.sockets.emit("input_counts_object", inputCountsObject);

                      // Executed means inputs that were successfully executed by the Arduino and sent back to the PC
                      //console.log(newvalues);
                      globalDatabaseToUpdate.collection(globalConfig.run_name).updateOne(dataToQuery, dataToUpdate, function(err, res) {
                        if (err) {
                          throw err;
                        }
                        //console.log(res.result);
                        //console.log("1 document updated");
                        mongoClient.connect(mongoUrl, {
                          useUnifiedTopology: true
                        }, function(err, databaseToReadFrom) {
                          if (err) {
                            throw err;
                          }
                          let globalDatabaseToreadFrom = databaseToReadFrom.db(globalConfig.global_database_name);
                          globalDatabaseToreadFrom.collection(globalConfig.run_name).findOne({}, function(err, databaseToReadFromResult) {
                            if (err) {
                              throw err;
                            }
                            databaseToReadFrom.close();
                            //console.log(databaseToReadFromResult);
                            //inputsSent = databaseToReadFromResult.input_count;
                          });
                        });
                        databaseToUpdate.close();
                      });
                    });
                    //console.log(result.input_count);
                    //test3(result.input_count);
                  }
                  globalDb.close();
                  //isDatabaseBusy = false;
                });
              });
              if (precisionInputsPreProcessed.input_repeat_count > 0) {
                macroParametersToWrite[2] = 0x01; // Tell the arduino to loop, it'll loop when it gets to the end of a macro, otherwise it'll only execute once, even if the "times to loop" parameter is higher than 1
              }

              macroParametersToWrite[0] = controllerConfig.final_macro_preamble; // controllerConfig.final_macro_preamble Preamble is used to tell the arduino how an input macro should be executed
              macroParametersToWrite[1] = currentMacroChainIndex; // How many inputs to iterate through
              //macroParametersToWrite[2] = 0x00; // Loop or no Loop 0 == No loop, 1 == Loop
              macroParametersToWrite[3] = 0x00; // Current Macro index (always set this to 0 to start at the beginning, otherwise you can specify where it should start)
              macroParametersToWrite[4] = precisionInputsPreProcessed.input_repeat_count; // Times to loop
              macroParametersToWrite[5] = 0x00; // Loop counter (Always set this to 0)
              macroParametersToWrite[6] = 0x00; // Unused for pre/postamble controllerConfig.final_macro_preamble
              macroParametersToWrite[7] = 0x00; // Unused for pre/postamble controllerConfig.final_macro_preamble
              macroParametersToWrite[8] = 0x00; // Unused for pre/postamble controllerConfig.final_macro_preamble
              macroParametersToWrite[9] = 0x00; // Unused for pre/postamble controllerConfig.final_macro_preamble
              macroParametersToWrite[10] = 0x00; // Unused for pre/postamble controllerConfig.final_macro_preamble
              macroParametersToWrite[11] = controllerConfig.final_macro_preamble; // controllerConfig.final_macro_preamble Postamble is used to tell the arduino how an input macro should be executed
              //let macroParametersToWrite = [controllerConfig.final_macro_preamble, currentMacroChainIndex + 1, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, controllerConfig.final_macro_preamble];
              precisionInputStringToDisplay.repeat_count = precisionInputsPreProcessed.input_repeat_count;
              precisionInputStringToDisplay2 = precisionInputStringToDisplay2.replace(/[\.\,]+$/ig, "");
              precisionInputStringToDisplay2 = precisionInputStringToDisplay2 + "*" + precisionInputsPreProcessed.input_repeat_count;
              //console.log(macroParametersToWrite);
              //console.log(precisionInputStringToDisplay);
              //console.log(precisionInputStringToDisplay.macro_array.join("."));
              //precisionInputStringToDisplay2 = precisionInputStringToDisplay2 + "Repeat " + precisionInputsPreProcessed.input_repeat_count;
              //console.log(precisionInputStringToDisplay2);
              let randomColorName = Math.floor(Math.random() * defaultColors.length);
              //client.say(target, ".color " + defaultColorNames[randomColorName]);
              //console.log(precisionInputStringToDisplay2.length);
              let splitInputsInMultipleStrings = [];
              if (precisionInputStringToDisplay2.length >= 200) {
                //let splitInputsInMultipleStrings = precisionInputStringToDisplay2.match(/.{100}/ig);
                splitInputsInMultipleStrings = precisionInputStringToDisplay2.match(/(?:[^\s]+\s){0,15}[^\s]+/ig);
                //console.log(splitInputsInMultipleStrings);
                client.say(target, ".color " + defaultColorNames[randomColorName]);
                for (let splitInputsInMultipleStringsIndex = 0; splitInputsInMultipleStringsIndex < splitInputsInMultipleStrings.length; splitInputsInMultipleStringsIndex++) {
                  if (splitInputsInMultipleStringsIndex == 0) {
                    client.action(target, "@" + usernameToPing + " Your input was interpreted as " + splitInputsInMultipleStrings[splitInputsInMultipleStringsIndex]);
                  }
                  if (splitInputsInMultipleStringsIndex > 0 && splitInputsInMultipleStringsIndex != splitInputsInMultipleStrings.length - 1) {
                    client.action(target, splitInputsInMultipleStrings[splitInputsInMultipleStringsIndex]);
                  }
                  if (splitInputsInMultipleStringsIndex == splitInputsInMultipleStrings.length - 1) {
                    client.action(target, splitInputsInMultipleStrings[splitInputsInMultipleStringsIndex] + ". Type Stop or Wait to stop execution of inputs");
                  }
                }
                //console.log(splitInputsInMultipleStrings);
                //client.action(target, "@" + usernameToPing + " Your input was interpreted as " + precisionInputStringToDisplay2);
              }
              if (precisionInputStringToDisplay2.length < 200) {
                //let splitInputsInMultipleStrings = precisionInputStringToDisplay2.match(/.{100}/ig);
                //splitInputsInMultipleStrings = precisionInputStringToDisplay2.match(/(?:[^\,]+\,){1,10}[^\,]+/ig);
                //console.log(splitInputsInMultipleStrings);
                client.say(target, ".color " + defaultColorNames[randomColorName]);
                client.action(target, "@" + usernameToPing + " Your input was interpreted as " + precisionInputStringToDisplay2 + ". Type Stop or Wait to stop execution of inputs");
                //client.action(target, "@" + usernameToPing + " Your input was interpreted as " + precisionInputStringToDisplay2);
              }
              //let splitInputsInMultipleStrings = precisionInputStringToDisplay2.match(/.{100}/ig);
              //console.log(splitInputsInMultipleStrings);
              //client.action(target, "@" + usernameToPing + " Your input was interpreted as " + precisionInputStringToDisplay2);

              // Clear the incoming serial data from arduino before setting an advanced input (Will this break things?)
              port.flush(function(err, results) {
                if (err) {
                  if (client.readyState() === "OPEN") {
                    if (chatConfig.send_debug_channel_messages == true) {
                      let randomColorName = Math.floor(Math.random() * defaultColors.length);
                      client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
                      client.action(chatConfig.debug_channel, new Date().toISOString() + " [SERIAL PORT] Failed to flush port com_port=" + controllerConfig.com_port + ", com_port_parameters=" + JSON.stringify(controllerConfig.com_port_parameters) + ", err.message=" + err.message);
                    }
                  }
                  return console.log(err);
                }
                //console.log(new Date().toISOString() + " flush results " + results);
              });
              port.drain(function(err, results) {
                if (err) {
                  if (client.readyState() === "OPEN") {
                    if (chatConfig.send_debug_channel_messages == true) {
                      let randomColorName = Math.floor(Math.random() * defaultColors.length);
                      client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
                      client.action(chatConfig.debug_channel, new Date().toISOString() + " [SERIAL PORT] Failed to drain port com_port=" + controllerConfig.com_port + ", com_port_parameters=" + JSON.stringify(controllerConfig.com_port_parameters) + ", err.message=" + err.message);
                    }
                  }
                  return console.log(err);
                }
                //console.log(new Date().toISOString() + " drain results " + results);
              });

              port.write(macroParametersToWrite, function(err) {
                if (err) {
                  if (client.readyState() === "OPEN") {
                    if (chatConfig.send_debug_channel_messages == true) {
                      let randomColorName = Math.floor(Math.random() * defaultColors.length);
                      client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
                      client.action(chatConfig.debug_channel, new Date().toISOString() + " [SERIAL PORT] Failed to write to port com_port=" + controllerConfig.com_port + ", com_port_parameters=" + JSON.stringify(controllerConfig.com_port_parameters) + ", err.message=" + err.message);
                    }
                  }
                  return console.log("Error on write: " + err.message);
                }
              });
            }
            /*
            for (let controllerDataArrayIndex = 0; controllerDataArrayIndex < controllerObject.length; controllerDataArrayIndex++) {
              // use .find() here to find the name of the input
              for (let preprocessedArrayIndex = 0; preprocessedArrayIndex < precisionInputsPreProcessed.input_array.length; preprocessedArrayIndex++) {
                for (let inputStringArrayIndex = 0; inputStringArrayIndex < precisionInputsPreProcessed.input_array[preprocessedArrayIndex].input_string_array.length; inputStringArrayIndex++) {
                  //console.log(precisionInputsPreProcessed.input_array[preprocessedArrayIndex].input_string_array[inputStringArrayIndex]);
                }
                //removedDashesAtTheEnd = messageInputs[messageInputIndex].replace(/\-+$/ig, "");
                //console.log(preprocessedArrayIndex);
                //console.log(precisionInputsPreProcessed.input_array[preprocessedArrayIndex]);
              }
              //console.log(controllerObject[controllerDataArrayIndex]);
            }
            */
          }
        }
      }
    }
    if (inputMode == 0) {
      if (messageWords.length > 0) {
        messageInputs = message.split(/[\+\_\|\#\[\]\,\.\s]+/ig);
        if (messageInputs[0] === "" || messageInputs[0] === undefined || messageInputs[0] === null) {
          messageInputs.splice(0, 1);
        }
        //messageInputs = messageInputs.join("");
        //messageInputs = messageInputs.split(/[\+\_\|\#\[\]\,\.\s]+/ig);
        //console.log(messageInputs);
      }
      let helpPrefixCheck = /^[!\"#$%&'()*+,\-./:;%=%?@\[\\\]^_`{|}~¡¦¨«¬­¯°±»½⅔¾⅝⅞∅ⁿ№★†‡‹›¿‰℅æßçñ¹⅓¼⅛²⅜³⁴₱€¢£¥—–·„“”‚‘’•√π÷×¶∆′″←↑↓→§Π♣♠♥♪♦∞≠≈©®™✓‛‟❛❜❝❞❟❠❮❯⹂〝〞〟＂🙶🙷🙸󠀢⍻✅✔𐄂🗸‱]*\s*((inputs*)+|(set+ings*)+|(help)+|(hel\[)+|(hel\])+|(com+ands*)+|(cmds*)+|(cmnds*)+|(control+s*)+|(control+ers*)+|(how\s*to\s*play)+|(how\s*do\s*(i|we)\s*play))+/ig.test(originalMessage);
      if (helpPrefixCheck == true) {
        if (helpMessageCooldown >= new Date().getTime()) {
          //console.log("Don't send the help message yet");
        }
        if (helpMessageCooldown < new Date().getTime()) {
          let randomColorName = Math.floor(Math.random() * defaultColors.length);
          client.say(target, ".color " + defaultColorNames[randomColorName]);
          for (let helpMessageIndex = 0; helpMessageIndex < helpMessageBasic.length; helpMessageIndex++) {
            if (helpMessageIndex == 0) {
              client.action(target, "@" + usernameToPing + " " + helpMessageBasic[helpMessageIndex]);
            }
            if (helpMessageIndex != 0) {
              client.action(target, helpMessageBasic[helpMessageIndex]);
            }
          }
          helpMessageCooldown = new Date().getTime() + globalConfig.help_message_cooldown_millis;
        }
      }
      if (acceptInputs == true) {
        //console.log(messageWords);
        if ((messageWords[0].toLowerCase() == "!speak") && (acceptTts == true)) {
          //console.log("isTtsBusy:" + isTtsBusy + ",isControllerBusy:" + isControllerBusy);
          //var messageToRead = "";
          var messageToRead = message.trim();
          //messageToRead = messageToRead.replace(/(\!speak)+\s+/ig, " ");
          messageToRead = messageToRead.replace(/\s+/ig, " ");
          messageToRead = messageToRead.replace(/[\u0000-\u001F]+/ig, ""); // Control Characters
          /*
          messageToRead = messageToRead.replace(/\"+/ig, ""); // "
          messageToRead = messageToRead.replace(/\/+/ig, ""); // /
          messageToRead = messageToRead.replace(/\\+/ig, ""); // \
          messageToRead = messageToRead.replace(/\^+/ig, ""); // ^
          messageToRead = messageToRead.replace(/\%+/ig, ""); // %
          messageToRead = messageToRead.replace(/\'+/ig, ""); // '
          */
          messageToRead = messageToRead.normalize("NFD").replace(/[\u007E-\uFFFF]+/ig, ""); // Remove diacritics from letters without removing entire letters
          messageToRead = messageToRead.replace(/[\u0022-\u0026]+/ig, ""); // " to &
          messageToRead = messageToRead.replace(/[\u0028-\u002B]+/ig, ""); // ( to +
          messageToRead = messageToRead.replace(/\u002D+/ig, ""); // -
          messageToRead = messageToRead.replace(/\u002F+/ig, ""); // /
          //messageToRead = messageToRead.replace(/[\u002D-\u002F]+/ig, ""); // - to /
          messageToRead = messageToRead.replace(/[\u003A-\u003E]+/ig, ""); // : to >
          messageToRead = messageToRead.replace(/\u0040+/ig, ""); // @
          messageToRead = messageToRead.replace(/[\u005B-\u0060]+/ig, ""); // [ to `
          messageToRead = messageToRead.replace(/[\u007B-\uFFFF]+/ig, ""); // { to everything else
          messageToRead = messageToRead.trim();
          var ttsWords = messageToRead.split(/\s+/ig);
          messageToRead = "";
          //console.log("ttsWords: " + ttsWords);
          for (var ttsWordIndex = 0; ttsWordIndex < ttsWords.length; ttsWordIndex++) {
            if (ttsWordIndex >= 1) {
              messageToRead = messageToRead.concat(ttsWords[ttsWordIndex] + " ");
              //console.log("SENTENCE TO READ: " + messageToRead);
            }
          }
          messageToRead = messageToRead.replace(/\s+/ig, " ");
          messageToRead = messageToRead.trim();
          //console.log("messageToRead.length: " + messageToRead.length)
          messageToRead = messageToRead.substring(0, 200);
          messageToRead = messageToRead.replace(/\s+/ig, " ");
          messageToRead = messageToRead.trim();
          //console.log("messageToRead.length: " + messageToRead.length)
          if (messageToRead.length > 0) {
            if (isControllerBusy == false) {
              if (isTtsBusy == false) {
                isTtsBusy = true;
                var randomColorName = Math.floor(Math.random() * defaultColors.length);
                client.say(target, ".color " + defaultColorNames[randomColorName]);
                client.action(target, "@" + usernameToPing + " Message accepted!");
                var commandLine = "cd " + __dirname + "\n" + "espeak.lnk --ipa -a 200 -s 175 -p 50 -b 2 -v en -w \"" + __dirname + "\\audio.wav" + "\" \"" + messageToRead + "\"" + "\n" + "ffmpeg.lnk -y -i \"" + __dirname + "\\audio.wav" + "\" -b:a 128k -ar 48000 \"" + __dirname + "\\output.mp3" + "\"" + "\n" + "cd " + __dirname + "\n" + "echo %CD%";
                //console.log(commandLine);
                fs.writeFileSync("runtts.bat", commandLine, "utf8");
                cmd.get("runtts.bat", function(err, data, stderr) {
                  io.sockets.emit("load_audio", true);
                  //console.log("DATA:" + data);
                  //console.log("ERR:" + err);
                  //console.log("STDERR:" + stderr);
                  var buffer = fs.readFileSync("output.mp3");
                  var duration = getMP3Duration(buffer) + 600; // Hack to make sure the button is only released after the tts file is done playing
                  //console.log("duration: " + duration + "ms");
                  ttsInputDelayHigh = (duration & 0x0000ff00) >> 8;
                  ttsInputDelayLow = (duration & 0x000000ff);
                  dataToWrite[1] = 0x04;
                  dataToWrite[9] = ttsInputDelayHigh;
                  dataToWrite[10] = ttsInputDelayLow;
                  //console.log(ttsInputDelayHigh + " AND " + ttsInputDelayLow);
                  //inputQueue.push(dataToWrite);
                  inputQueue.push({
                    username_to_display: usernameToPing,
                    username: username,
                    display_name: displayName,
                    user_color: userColor,
                    user_color_inverted: userColorInverted,
                    is_tts: true,
                    message: message,
                    tts_message: messageToRead,
                    controller_data: dataToWrite,
                    input_string: "Speak",
                    input_index: currentInputInQueue,
                    message_id: messageId,
                    user_id: userId
                  });
                  io.sockets.emit("input_data", inputQueue[currentInputInQueue]);
                  setTimeout(async function() {
                    io.sockets.emit("play_audio", true);

                    // Get user from userdatabase by using their userid then increment the user's basic input count
                    mongoClient.connect(mongoUrl, {
                      useUnifiedTopology: true
                    }, function(err, userDb) {
                      if (err) {
                        throw err;
                      }
                      let userDatabase = userDb.db(globalConfig.main_database_name);
                      userDatabase.collection(globalConfig.chatters_collection_name).findOne({
                        user_id: userId
                      }, function(err, result) {
                        if (err) {
                          throw err;
                        }
                        //console.log(result);
                        //
                        mongoClient.connect(mongoUrl, {
                          useUnifiedTopology: true
                        }, function(err, databaseToUpdate) {
                          if (err) {
                            throw err;
                          }
                          let userDatabaseToUpdate = databaseToUpdate.db(globalConfig.main_database_name);
                          let dataToQuery = {
                            user_id: userId
                          };
                          let dataToUpdate = {
                            $set: {
                              user_id: result.user_id,

                              first_message_sent_id: result.first_message_sent_id,
                              last_message_sent_id: result.last_message_sent_id,

                              basic_inputs_sent: result.basic_inputs_sent + 1,
                              advanced_inputs_sent: result.advanced_inputs_sent,
                              total_inputs_sent: result.total_inputs_sent + 1,

                              is_first_message_basic_input: result.is_first_message_basic_input,
                              is_last_message_basic_input: true,

                              is_first_message_advanced_input: result.is_first_message_advanced_input,
                              is_last_message_advanced_input: false,

                              first_basic_input: result.first_basic_input,
                              first_advanced_input: result.first_advanced_input,

                              last_basic_input: originalMessage,
                              last_advanced_input: result.last_advanced_input
                            }
                          };
                          if (dataToUpdate.$set.first_basic_input == "") {
                            // User's first basic input
                            dataToUpdate.$set.first_basic_input = originalMessage;
                          }
                          if (dataToUpdate.$set.first_message_sent_id == dataToUpdate.$set.last_message_sent_id) {
                            // User's first message is also an input
                            //console.log("NEW USER PogChamp");
                            dataToUpdate.$set.is_first_message_basic_input = true;
                            dataToUpdate.$set.is_first_message_advanced_input = false;
                          }
                          userDatabaseToUpdate.collection(globalConfig.chatters_collection_name).updateOne(dataToQuery, dataToUpdate, function(err, res) {
                            if (err) {
                              throw err;
                            }
                            //console.log("1 document updated");
                            databaseToUpdate.close();
                          });
                        });
                        //
                        userDb.close();
                      });
                    });

                    // The database checks below check an user's input count
                    mongoClient.connect(mongoUrl, {
                      useUnifiedTopology: true
                    }, function(err, userDb) {
                      //isDatabaseBusy = true;
                      if (err) {
                        throw err;
                      }
                      // Check if the user entry for a specific game exists
                      let userDatabase = userDb.db(globalConfig.inputter_database_name);
                      userDatabase.collection(globalConfig.run_name).findOne({
                        user_id: userId
                      }, function(err, result) {
                        if (err) {
                          throw err;
                        }
                        //console.log(result);
                        //isNullDatabase = result;
                        if (result === null) {
                          console.log("YES");
                          mongoClient.connect(mongoUrl, {
                            useUnifiedTopology: true
                          }, function(err, databaseToCreate) {
                            if (err) {
                              throw err;
                            }
                            let userDatabaseToCreate = databaseToCreate.db(globalConfig.inputter_database_name);
                            let dataToInsert = {
                              run_id: globalConfig.run_id,
                              user_id: userId,
                              basic_inputs_sent: 1,
                              advanced_inputs_sent: 0,
                              total_inputs_sent: 1
                            };
                            userDatabaseToCreate.collection(globalConfig.run_name).insertOne(dataToInsert, function(err, res) {
                              if (err) {
                                throw err;
                              }
                              //console.log("1 document inserted");
                              mongoClient.connect(mongoUrl, {
                                useUnifiedTopology: true
                              }, function(err, databaseToReadFrom) {
                                if (err) {
                                  throw err;
                                }
                                let userDatabaseToReadFrom = databaseToReadFrom.db(globalConfig.inputter_database_name);
                                userDatabaseToReadFrom.collection(globalConfig.run_name).findOne({
                                  user_id: userId
                                }, function(err, databaseToReadFromResult) {
                                  if (err) {
                                    throw err;
                                  }
                                  databaseToReadFrom.close();
                                  //console.log(databaseToReadFromResult);
                                });
                              });
                              databaseToCreate.close();
                            });
                          });
                          //test();
                        }
                        if (result !== null) {
                          //console.log("NO");
                          mongoClient.connect(mongoUrl, {
                            useUnifiedTopology: true
                          }, function(err, databaseToUpdate) {
                            if (err) {
                              throw err;
                            }
                            let userDatabaseToUpdate = databaseToUpdate.db(globalConfig.inputter_database_name);
                            let dataToQuery = {
                              run_id: result.run_id,
                              user_id: result.user_id,
                              basic_inputs_sent: result.basic_inputs_sent,
                              advanced_inputs_sent: result.advanced_inputs_sent,
                              total_inputs_sent: result.total_inputs_sent
                            };
                            let dataToUpdate = {
                              $set: {
                                run_id: result.run_id,
                                user_id: result.user_id,
                                basic_inputs_sent: result.basic_inputs_sent + 1,
                                advanced_inputs_sent: result.advanced_inputs_sent,
                                total_inputs_sent: result.total_inputs_sent + 1
                              }
                            };
                            //console.log(dataToUpdate);
                            //console.log(newvalues);
                            userDatabaseToUpdate.collection(globalConfig.run_name).updateOne(dataToQuery, dataToUpdate, function(err, res) {
                              if (err) {
                                throw err;
                              }
                              //console.log(res.result);
                              //console.log("1 document updated");
                              mongoClient.connect(mongoUrl, {
                                useUnifiedTopology: true
                              }, function(err, databaseToReadFrom) {
                                if (err) {
                                  throw err;
                                }
                                let userDatabaseToReadFrom = databaseToReadFrom.db(globalConfig.inputter_database_name);
                                userDatabaseToReadFrom.collection(globalConfig.run_name).findOne({
                                  user_id: userId
                                }, function(err, databaseToReadFromResult) {
                                  if (err) {
                                    throw err;
                                  }
                                  databaseToReadFrom.close();
                                  //console.log(databaseToReadFromResult);
                                });
                              });
                              databaseToUpdate.close();
                            });
                          });
                          //console.log(result.input_count);
                          //test3(result.input_count);
                        }
                        userDb.close();
                        //isDatabaseBusy = false;
                      });
                    });
                    //await sleep(333);
                    // The database operations below check the total input count
                    mongoClient.connect(mongoUrl, {
                      useUnifiedTopology: true
                    }, function(err, globalDb) {
                      //isDatabaseBusy = true;
                      if (err) {
                        throw err;
                      }
                      // Check if the entry for a specific game exists
                      let globalDatabase = globalDb.db(globalConfig.global_database_name);
                      globalDatabase.collection(globalConfig.run_name).findOne({}, function(err, result) {
                        if (err) {
                          throw err;
                        }
                        //console.log(result);
                        //isNullDatabase = result;
                        if (result === null) {
                          //console.log("YES");
                          mongoClient.connect(mongoUrl, {
                            useUnifiedTopology: true
                          }, function(err, databaseToCreate) {
                            if (err) {
                              throw err;
                            }
                            let globalDatabaseToCreate = databaseToCreate.db(globalConfig.global_database_name);
                            let dataToInsert = {
                              run_id: globalConfig.run_id,
                              basic_inputs_sent: 1,
                              advanced_inputs_sent: 0,
                              total_inputs_sent: 1,
                              basic_inputs_executed: 1,
                              advanced_inputs_executed: 0,
                              total_inputs_executed: 1
                            };

                            inputCountsObject = dataToInsert;
                            io.sockets.emit("input_counts_object", inputCountsObject);

                            //console.log("dataToInsert");
                            //console.log(dataToInsert);
                            // Executed means inputs that were successfully executed by the Arduino and sent back to the PC
                            globalDatabaseToCreate.collection(globalConfig.run_name).insertOne(dataToInsert, function(err, res) {
                              if (err) {
                                throw err;
                              }
                              //console.log("1 document inserted");
                              mongoClient.connect(mongoUrl, {
                                useUnifiedTopology: true
                              }, function(err, databaseToReadFrom) {
                                if (err) {
                                  throw err;
                                }
                                let globalDatabaseToreadFrom = databaseToReadFrom.db(globalConfig.global_database_name);
                                globalDatabaseToreadFrom.collection(globalConfig.run_name).findOne({}, function(err, databaseToReadFromResult) {
                                  if (err) {
                                    throw err;
                                  }
                                  databaseToReadFrom.close();
                                  //console.log(databaseToReadFromResult);
                                  //inputsSent = databaseToReadFromResult.input_count;
                                });
                              });
                              databaseToCreate.close();
                            });
                          });
                          //test();
                        }
                        if (result !== null) {
                          //console.log("NO");
                          mongoClient.connect(mongoUrl, {
                            useUnifiedTopology: true
                          }, function(err, databaseToUpdate) {
                            if (err) {
                              throw err;
                            }
                            let globalDatabaseToUpdate = databaseToUpdate.db(globalConfig.global_database_name);
                            let dataToQuery = {
                              run_id: result.run_id,
                              basic_inputs_sent: result.basic_inputs_sent,
                              advanced_inputs_sent: result.advanced_inputs_sent,
                              total_inputs_sent: result.total_inputs_sent
                              /*
                              basic_inputs_executed: result.basic_inputs_executed,
                              advanced_inputs_executed: result.advanced_inputs_executed,
                              total_inputs_executed: result.total_inputs_executed
                              */
                            };
                            // Executed means inputs that were successfully executed by the Arduino and sent back to the PC
                            let dataToUpdate = {
                              $set: {
                                run_id: result.run_id,
                                basic_inputs_sent: result.basic_inputs_sent + 1,
                                advanced_inputs_sent: result.advanced_inputs_sent,
                                total_inputs_sent: result.total_inputs_sent + 1,
                                basic_inputs_executed: result.basic_inputs_executed,
                                advanced_inputs_executed: result.advanced_inputs_executed,
                                total_inputs_executed: result.total_inputs_executed
                              }
                            };

                            inputCountsObject = dataToUpdate.$set;
                            io.sockets.emit("input_counts_object", inputCountsObject);

                            //console.log("dataToUpdate");
                            //console.log(dataToUpdate);
                            // Executed means inputs that were successfully executed by the Arduino and sent back to the PC
                            //console.log(newvalues);
                            globalDatabaseToUpdate.collection(globalConfig.run_name).updateOne(dataToQuery, dataToUpdate, function(err, res) {
                              if (err) {
                                throw err;
                              }
                              //console.log(res.result);
                              //console.log("1 document updated");
                              mongoClient.connect(mongoUrl, {
                                useUnifiedTopology: true
                              }, function(err, databaseToReadFrom) {
                                if (err) {
                                  throw err;
                                }
                                let globalDatabaseToreadFrom = databaseToReadFrom.db(globalConfig.global_database_name);
                                globalDatabaseToreadFrom.collection(globalConfig.run_name).findOne({}, function(err, databaseToReadFromResult) {
                                  if (err) {
                                    throw err;
                                  }
                                  databaseToReadFrom.close();
                                  //console.log(databaseToReadFromResult);
                                  //inputsSent = databaseToReadFromResult.input_count;
                                });
                              });
                              databaseToUpdate.close();
                            });
                          });
                          //console.log(result.input_count);
                          //test3(result.input_count);
                        }
                        globalDb.close();
                        //isDatabaseBusy = false;
                      });
                    });

                    //sound.play(__dirname + "\\output.mp3").then(function() {
                    //console.log("done");
                    //isTtsBusy = false;
                    //}); // BRUH, this is a hack to make sure the audio plays at the moment the z button is pressed, we don't want the z button to be pressed before the file has finished loading
                  }, 100); // This is ugly, I know // delay before we can send the next input
                  // when the code gets to this, call the next function inside this block, instead of outside, this is a hack to make this async function run as sync, it's ugly but I need it to be async, and this seems to work
                });
              }
            }
          }
        }
        /*
        for (var messageInputIndex = 0; messageInputIndex < messageInputs.length; messageInputIndex++) {
          for (var controllerObjectIndex = 0; controllerObjectIndex < controllerObject.length; controllerObjectIndex++) {
            for (var controllerAliasIndex = 0; controllerAliasIndex < controllerObject[controllerObjectIndex].input_alias.length; controllerAliasIndex++) {
              lowerCaseMessage = messageInputs[messageInputIndex].toLowerCase();
              lowerCaseCommand = controllerObject[controllerObjectIndex].input_alias[controllerAliasIndex].toLowerCase();
              if (lowerCaseMessage != lowerCaseCommand) {
                //console.log("Command at " + messageInputIndex + " " + lowerCaseMessage + " does not match alias at index " + controllerObjectIndex + " " + lowerCaseCommand);
              }
            }
          }
        }
        */
        if (isTtsBusy == false) {
          for (var messageInputIndex = 0; messageInputIndex < messageInputs.length; messageInputIndex++) {
            if (hasInvalidInput == false) {
              let didInputMatch = false;
              messageInputs[messageInputIndex] = messageInputs[messageInputIndex].replace(/^[!\"#$%&'()*+,-./:;%=%?@\[\\\]_`{|}~¡¦¨«¬­¯°±»½⅔¾⅝⅞∅ⁿ№★†‡‹›¿‰℅æßçñ¹⅓¼⅛²⅜³⁴₱€¢£¥—–·„“”‚‘’•√π÷×¶∆′″←↑↓→§Π♣♠♥♪♦∞≠≈©®™✓‛‟❛❜❝❞❟❠❮❯⹂〝〞〟＂🙶🙷🙸󠀢⍻✅✔𐄂🗸‱]+/ig, ""); // Remove all unecessary prefix

              let adjustableAnalogStickPosition = -1;

              //console.log(new Date().toISOString() + " messageInputs[messageInputIndex] = " + messageInputs[messageInputIndex] + " messageInputIndex = " + messageInputIndex);
              let splitToFindCustomAnalogStickPosition = messageInputs[messageInputIndex].replace(/\:+/ig, " ");
              //console.log(new Date().toISOString() + " splitToFindCustomAnalogStickPosition = " + splitToFindCustomAnalogStickPosition);
              splitToFindCustomAnalogStickPosition = splitToFindCustomAnalogStickPosition.trim();
              //console.log(new Date().toISOString() + " splitToFindCustomAnalogStickPosition = " + splitToFindCustomAnalogStickPosition);
              splitToFindCustomAnalogStickPosition = splitToFindCustomAnalogStickPosition.split(/\s+/ig);
              //console.log(new Date().toISOString() + " splitToFindCustomAnalogStickPosition = " + splitToFindCustomAnalogStickPosition);

              if (splitToFindCustomAnalogStickPosition[0] !== undefined) {
                // Valid, do the thing!
                //console.log(new Date().toISOString() + " OK WE GOOD " + splitToFindCustomAnalogStickPosition[0]);
                if (splitToFindCustomAnalogStickPosition[1] !== undefined) {
                  //console.log(new Date().toISOString() + " OK WE GOOD AGAIN " + splitToFindCustomAnalogStickPosition[1]);
                  // Maybe this is valid custom analog stick position?
                  //
                  //console.log("Z SET THIS AS CUSTOM ANALOG POSITION MAYBE");
                  //console.log(isNaN(parseInt(testVar[testVarIndex], 10)));
                  if (isNaN(parseInt(splitToFindCustomAnalogStickPosition[1], 10)) == false) {
                    //console.log("Z POGGERS WE GOT A NUMBER");
                    if (parseInt(splitToFindCustomAnalogStickPosition[1], 10) >= 0) {
                      if (parseInt(splitToFindCustomAnalogStickPosition[1], 10) <= controllerConfig.stick_center) {
                        //console.log("Z Outcome A");
                        adjustableAnalogStickPosition = parseInt(splitToFindCustomAnalogStickPosition[1], 10);
                      }
                      if (parseInt(splitToFindCustomAnalogStickPosition[1], 10) > controllerConfig.stick_center) {
                        //console.log("Z Outcome B");
                        adjustableAnalogStickPosition = controllerConfig.stick_center;
                      }
                      //console.log("Z WE GOT A POSITIVE INTEGER");
                      //console.log(testVar[testVarIndex]);
                      //precisionInputHold = parseInt(testVar[testVarIndex], 10);
                    }
                    if (parseInt(splitToFindCustomAnalogStickPosition[1], 10) < 1) {
                      //console.log("Z WE GOT A NON-POSITIVE INTEGER");
                      //console.log(testVar[testVarIndex]);
                      adjustableAnalogStickPosition = 1;
                    }
                  }
                  if (isNaN(parseInt(splitToFindCustomAnalogStickPosition[1], 10)) == true) {
                    //console.log(testVar[testVarIndex]);
                    //console.log("Z NOT A NUMBER :(");
                    adjustableAnalogStickPosition = -1;
                    // Instead of setting to default, maybe just don't do anything?
                    //console.log("Invalid number");
                    //adjustableInputDelay = controllerConfig.normal_delay;
                  }
                  //console.log("Z Should be a positive integer");
                  //
                  //splitToFindCustomAnalogStickPosition[0] = splitToFindCustomAnalogStickPosition[0] + " " + splitToFindCustomAnalogStickPosition[1];
                  //console.log(splitToFindCustomAnalogStickPosition[0] + " " + splitToFindCustomAnalogStickPosition[1]);
                  //console.log(splitToFindCustomAnalogStickPosition[1]);

                  let tempInputArray2 = splitToFindCustomAnalogStickPosition[1].replace(/[\/\\\;\*\']+/ig, " ");
                  //console.log(new Date().toISOString() + " tempInputArray2 = " + tempInputArray2);
                  tempInputArray2 = tempInputArray2.trim();
                  //console.log(new Date().toISOString() + " tempInputArray2 = " + tempInputArray2);
                  tempInputArray2 = tempInputArray2.split(/\s+/ig);
                  //console.log(new Date().toISOString() + " tempInputArray2 = " + tempInputArray2);

                  if (tempInputArray2[1] === undefined) {
                    //console.log(new Date().toISOString() + " NO WHAT THE FUCK 3 " + tempInputArray2);
                    //splitToFindCustomAnalogStickPosition[0] = splitToFindCustomAnalogStickPosition[0] + " " + tempInputArray2[0];
                    let inputContainsDashesAtTheEnd2 = /[\-\=\‒\–\—\­\˗\−\－\̠]+$|(h+o+l+d+)+$|(h+e+l+d+)+$|(r+u+n+)+$|(c+o+n+t+i+n+u+o+u+s+l*y*)+$|^[\-\=\‒\–\—\­\˗\−\－\̠]+|^(h+o+l+d+)+|^(h+e+l+d+)+|^(r+u+n+)+|^(c+o+n+t+i+n+u+o+u+s+l*y*)+|(d+a+s+h+)+$|(s+p+r+i+n+t+)+$|^(d+a+s+h+)+|^(s+p+r+i+n+t+)+|^(k+e+p+)+|(k+e+p+)+$|^(b+i+g+)+|(b+i+g+)+$|^(l+o+n+g+)+|(l+o+n+g+)+$|^(p+e+r+m+a+n*e*n*t*l*y*)+|(p+e+r+m+a+n*e*n*t*l*y*)+$/ig.test(tempInputArray2[0]);
                    if (inputContainsDashesAtTheEnd2 == true) {
                      splitToFindCustomAnalogStickPosition[0] = splitToFindCustomAnalogStickPosition[0] + "-";
                      //console.log(splitToFindCustomAnalogStickPosition[0] + "-");
                    }
                  }
                  if (tempInputArray2[1] !== undefined) {
                    //console.log(new Date().toISOString() + " OK WE GOOD AGAIN AGAIN " + tempInputArray2);
                    //console.log(splitToFindCustomAnalogStickPosition[0]);
                    //console.log(tempInputArray2[0]);
                    //console.log(tempInputArray2[1]);
                    splitToFindCustomAnalogStickPosition[0] = splitToFindCustomAnalogStickPosition[0] + " " + tempInputArray2[1];
                    //console.log(splitToFindCustomAnalogStickPosition[0]);
                  }
                }
                if (splitToFindCustomAnalogStickPosition[1] === undefined) {
                  //console.log(new Date().toISOString() + " NO WHAT THE FUCK 2 " + splitToFindCustomAnalogStickPosition[1]);
                }
              }
              if (splitToFindCustomAnalogStickPosition[0] === undefined) {
                // Invalid, don't the thing!
                //console.log(new Date().toISOString() + " NO WHAT THE FUCK " + splitToFindCustomAnalogStickPosition[0]);
              }

              let tempInputArray = splitToFindCustomAnalogStickPosition[0].replace(/[\/\\\;\*\']+/ig, " ");
              //console.log(new Date().toISOString() + " tempInputArray = " + tempInputArray);
              tempInputArray = tempInputArray.trim();
              //console.log(new Date().toISOString() + " tempInputArray = " + tempInputArray);
              tempInputArray = tempInputArray.split(/\s+/ig);
              //console.log(new Date().toISOString() + " tempInputArray = " + tempInputArray);

              for (let tempInputArrayIndex = 0; tempInputArrayIndex < tempInputArray.length; tempInputArrayIndex++) {
                if (tempInputArrayIndex == 1) {
                  {
                    //console.log("A SET THIS AS DELAY INSTEAD OF REPEAT MAYBE");
                    //console.log(isNaN(parseInt(testVar[testVarIndex], 10)));
                    if (isNaN(parseInt(tempInputArray[tempInputArrayIndex], 10)) == false) {
                      //console.log("A POGGERS WE GOT A NUMBER");
                      if (parseInt(tempInputArray[tempInputArrayIndex], 10) >= 0) {
                        if (parseInt(tempInputArray[tempInputArrayIndex], 10) <= controllerConfig.max_delay) {
                          //console.log("A Outcome A");
                          adjustableInputDelay = parseInt(tempInputArray[tempInputArrayIndex], 10);
                          isValidInputDelay = true;
                          if (adjustableInputDelay <= 10) {
                            adjustableInputDelay = adjustableInputDelay * 1000; // People will intuitively enter seconds as delay, this fixes that so seconds are valid, but only if the desired delay is less than or equals 10 seconds
                          }
                        }
                        if (parseInt(tempInputArray[tempInputArrayIndex], 10) > controllerConfig.max_delay) {
                          //console.log("A Outcome B");
                          adjustableInputDelay = controllerConfig.max_delay;
                          isValidInputDelay = true;
                        }
                        //console.log("A WE GOT A POSITIVE INTEGER");
                        //console.log(testVar[testVarIndex]);
                        //precisionInputHold = parseInt(testVar[testVarIndex], 10);
                      }
                      if (parseInt(tempInputArray[tempInputArrayIndex], 10) < 1) {
                        //console.log("A WE GOT A NON-POSITIVE INTEGER");
                        //console.log(testVar[testVarIndex]);
                        adjustableInputDelay = controllerConfig.normal_delay;
                      }
                    }
                    if (isNaN(parseInt(tempInputArray[tempInputArrayIndex], 10)) == true) {
                      //console.log(testVar[testVarIndex]);
                      //console.log("A NOT A NUMBER :(");
                      // Instead of setting to default, maybe just don't do anything?
                      //console.log("Invalid number");
                      //adjustableInputDelay = controllerConfig.normal_delay;
                    }
                    //console.log("A Should be a positive integer");
                  }
                }
              }

              {
                //console.log("B SET THIS AS DELAY INSTEAD OF REPEAT MAYBE");
                //console.log(isNaN(parseInt(testVar[testVarIndex], 10)));
                if (isNaN(parseInt(messageWords[1], 10)) == false) {
                  //console.log("B POGGERS WE GOT A NUMBER");
                  if (parseInt(messageWords[1], 10) >= 0) {
                    if (parseInt(messageWords[1], 10) <= controllerConfig.max_delay) {
                      //console.log("B Outcome A");
                      adjustableInputDelay = parseInt(messageWords[1], 10);
                      isValidInputDelay = true;
                      if (adjustableInputDelay <= 10) {
                        adjustableInputDelay = adjustableInputDelay * 1000; // People will intuitively enter seconds as delay, this fixes that so seconds are valid, but only if the desired delay is less than or equals 10 seconds
                      }
                    }
                    if (parseInt(messageWords[1], 10) > controllerConfig.max_delay) {
                      //console.log("B Outcome B");
                      adjustableInputDelay = controllerConfig.max_delay;
                      isValidInputDelay = true;
                    }
                    //console.log("B WE GOT A POSITIVE INTEGER");
                    //console.log(testVar[testVarIndex]);
                    //precisionInputHold = parseInt(testVar[testVarIndex], 10);
                  }
                  if (parseInt(messageWords[1], 10) < 1) {
                    //console.log("B WE GOT A NON-POSITIVE INTEGER");
                    //console.log(testVar[testVarIndex]);
                    adjustableInputDelay = controllerConfig.normal_delay;
                  }
                }
                if (isNaN(parseInt(messageWords[1], 10)) == true) {
                  //console.log(testVar[testVarIndex]);
                  //console.log("B NOT A NUMBER :(");
                  // Instead of setting to default, maybe just don't do anything?
                  //console.log("Invalid number");
                  //adjustableInputDelay = controllerConfig.normal_delay;
                }
                //console.log("B Should be a positive integer");
              }

              //console.log("adjustableInputDelay = " + adjustableInputDelay);


              //console.log("messageInputs[messageInputIndex] at index " + messageInputIndex + " = " + messageInputs[messageInputIndex]);
              processedMessage = tempInputArray[0].toLowerCase();
              //processedMessage = messageInputs[messageInputIndex].toLowerCase();
              //console.log("processedMessage " + processedMessage);

              //let inputContainsDashes = /[\-\=]+/ig.test(messageInputs[messageInputIndex]);
              //let inputContainsDashesAtTheEnd = /[\-\=]+$/ig.test(messageInputs[messageInputIndex]);
              let inputContainsDashes = /[\-\=\‒\–\—\­\˗\−\－\̠]+|(h+o+l+d+)+|(h+e+l+d+)+|(r+u+n+)+|(c+o+n+t+i+n+u+o+u+s+l*y*)+|(d+a+s+h+)+|(s+p+r+i+n+t+)+|(k+e+p+)+|(b+i+g+)+|(l+o+n+g+)+|(p+e+r+m+a+n*e*n*t*l*y*)+/ig.test(tempInputArray[0]);
              let inputContainsDashesAtTheEnd = /[\-\=\‒\–\—\­\˗\−\－\̠]+$|(h+o+l+d+)+$|(h+e+l+d+)+$|(r+u+n+)+$|(c+o+n+t+i+n+u+o+u+s+l*y*)+$|^[\-\=\‒\–\—\­\˗\−\－\̠]+|^(h+o+l+d+)+|^(h+e+l+d+)+|^(r+u+n+)+|^(c+o+n+t+i+n+u+o+u+s+l*y*)+|(d+a+s+h+)+$|(s+p+r+i+n+t+)+$|^(d+a+s+h+)+|^(s+p+r+i+n+t+)+|^(k+e+p+)+|(k+e+p+)+$|^(b+i+g+)+|(b+i+g+)+$|^(l+o+n+g+)+|(l+o+n+g+)+$|^(p+e+r+m+a+n*e*n*t*l*y*)+|(p+e+r+m+a+n*e*n*t*l*y*)+$/ig.test(tempInputArray[0]);

              //var testComparison = inputContainsDashes ? "Message contains dashes " + inputContainsDashes + " " + messageInputs[messageInputIndex] : "Message doesn't contain dashes " + inputContainsDashes + " " + messageInputs[messageInputIndex];
              //var testComparison2 = inputContainsDashesAtTheEnd ? "Message contains dashes at the end " + inputContainsDashesAtTheEnd + " " + messageInputs[messageInputIndex] : "Message doesn't contain dashes at the end " + inputContainsDashesAtTheEnd + " " + messageInputs[messageInputIndex];

              //console.log(testComparison);
              //console.log(testComparison2);

              if (inputContainsDashes == true) {
                if (inputContainsDashesAtTheEnd == true) {
                  removedDashesAtTheEnd = tempInputArray[0].replace(/[\-\=\‒\–\—\­\˗\−\－\̠]+$|(h+o+l+d+)+$|(h+e+l+d+)+$|(r+u+n+)+$|(c+o+n+t+i+n+u+o+u+s+l*y*)+$|^[\-\=\‒\–\—\­\˗\−\－\̠]+|^(h+o+l+d+)+|^(h+e+l+d+)+|^(r+u+n+)+|^(c+o+n+t+i+n+u+o+u+s+l*y*)+|(d+a+s+h+)+$|(s+p+r+i+n+t+)+$|^(d+a+s+h+)+|^(s+p+r+i+n+t+)+|^(k+e+p+)+|(k+e+p+)+$|^(b+i+g+)+|(b+i+g+)+$|^(l+o+n+g+)+|(l+o+n+g+)+$|^(p+e+r+m+a+n*e*n*t*l*y*)+|(p+e+r+m+a+n*e*n*t*l*y*)+$/ig, "");
                  processedMessage = removedDashesAtTheEnd;
                  setHold = true;
                  //console.log("removedDashesAtTheEnd: " + removedDashesAtTheEnd);
                }
                if (inputContainsDashesAtTheEnd == false) {
                  // Discard input
                }
              }

              if (inputContainsDashes == false) {
                // Might be an actual input, this is checked later
              }

              //console.log(messageInputs[messageInputIndex]);
              for (var controllerObjectIndex = 0; controllerObjectIndex < controllerObject.length; controllerObjectIndex++) {
                //console.log(controllerObjectIndex + " " + controllerState[controllerObjectIndex]);
                //console.log(controllerObjectIndex + " " + controllerState.length);
                controllerState.push(false);
                //console.log(controllerObjectIndex + " " + controllerState[controllerObjectIndex]);
                //console.log(controllerObjectIndex + " " + controllerState.length);
                //controllerObject[0].input_alias[0]
                for (var controllerAliasIndex = 0; controllerAliasIndex < controllerObject[controllerObjectIndex].input_alias.length; controllerAliasIndex++) {
                  //console.log(controllerObject[controllerObjectIndex].input_alias.length);
                  lowerCaseMessage = processedMessage.toLowerCase();
                  //lowerCaseMessage = messageInputs[messageInputIndex].toLowerCase();
                  lowerCaseCommand = controllerObject[controllerObjectIndex].input_alias[controllerAliasIndex].toLowerCase();
                  if (lowerCaseMessage != lowerCaseCommand) {
                    // If there is at least one invalid, no matter where, entire input combo should be discarded(?????? is this a good idea?)
                    // Or I can compare inputsUsed to the amount of possible inputs in messageInputs, if inputsUsed is less than messageInputs, then discard it completely
                    // If it is equals messageInputs, then use it
                    //console.log("Invalid command");
                    //console.log("Command at " + messageInputIndex + " " + lowerCaseMessage + " does not match alias at index " + controllerObjectIndex + " " + lowerCaseCommand);
                  }
                  if (lowerCaseMessage == lowerCaseCommand) {
                    didInputMatch = true;
                    //console.log("Command at messageInputIndex " + messageInputIndex  + " " + lowerCaseMessage + " matches alias at controllerObjectIndex " + controllerObjectIndex + " " + lowerCaseCommand);
                    //controllerState[controllerObjectIndex] = true;
                    //console.log(controllerObjectIndex + " " + controllerState[controllerObjectIndex]);
                    //console.log("Valid command");
                    //console.log("controllerObjectIndex:" + controllerObjectIndex + " controllerAliasIndex:" + controllerAliasIndex + " " + controllerObject[controllerObjectIndex].input_alias[controllerAliasIndex]);
                    let rawInputValueUsed = controllerObject[controllerObjectIndex].input_value;
                    rawInputValueUsed = rawInputValueUsed.replace(/(0x)+/ig, "");
                    rawInputValueUsed = rawInputValueUsed.replace(/L+/ig, "");
                    let hex = Uint8Array.from(Buffer.from(rawInputValueUsed, "hex"));
                    //console.log(hex[0])
                    // dataToWrite = [0x01, 0x00, 0x00, 0x7F, 0x7F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x85, 0x01];
                    //console.log(hex);
                    //var backToHexString = Buffer.from(hex).toString("hex");

                    inputDelay = (setHold == true) ? controllerConfig.held_delay : adjustableInputDelay;
                    //inputDelay = (setHold == true) ? controllerConfig.held_delay : controllerConfig.normal_delay;
                    //console.log("inputDelay = " + inputDelay);

                    //inputDelay = 200;
                    inputDelayHigh = (inputDelay & 0x0000ff00) >> 8;
                    inputDelayLow = (inputDelay & 0x000000ff);
                    //console.log(inputDelay);
                    //console.log(inputDelayHigh);
                    //console.log(inputDelayLow);
                    dataToWrite[9] = inputDelayHigh;
                    dataToWrite[10] = inputDelayLow;
                    //console.log(backToHexString);
                    //console.log(controllerObject[controllerObjectIndex].is_blacklisted);
                    if (controllerState[controllerObjectIndex] == false) {
                      if (inputsUsed < inputsAllowed) {
                        inputString = inputString.concat(controllerObject[controllerObjectIndex].input_name + "+");
                      }
                    }
                    //console.log(inputString);
                    if (controllerObject[controllerObjectIndex].is_blacklisted == false) {
                      if (inputsUsed < inputsAllowed) {
                        if (controllerState[controllerObjectIndex] == true) {
                          //console.log("Input used, ignoring");
                        }
                        if (controllerState[controllerObjectIndex] != true) {
                          //console.log("Input not used");
                          //console.log(controllerObject[controllerObjectIndex].input_value);
                          //console.log(controllerObject[controllerObjectIndex].opposite_input_value);
                          //console.log(controllerObject[controllerObjectIndex].has_opposite);
                          if (controllerObject[controllerObjectIndex].has_opposite == true) {
                            for (var controllerObjectIndex2 = 0; controllerObjectIndex2 < controllerObject.length; controllerObjectIndex2++) {
                              if (controllerObject[controllerObjectIndex].input_value == controllerObject[controllerObjectIndex2].opposite_input_value) {
                                controllerState[controllerObjectIndex2] = true;
                                //console.log(new Date().toISOString() + " controllerObjectIndex = " + controllerObjectIndex + " controllerObjectIndex2 = " + controllerObjectIndex2 + " controllerObject[controllerObjectIndex2].input_name = " + controllerObject[controllerObjectIndex2].input_name + " controllerObject[controllerObjectIndex2].input_value = " + controllerObject[controllerObjectIndex2].input_value + " controllerObject[controllerObjectIndex2].opposite_input_value = " + controllerObject[controllerObjectIndex2].opposite_input_value);
                                //console.log("is opposite? " + controllerObjectIndex + " " + controllerObjectIndex2 + " " + controllerObject[controllerObjectIndex2].input_value + " " + controllerObject[controllerObjectIndex2].opposite_input_value);
                                // the code above is ugly but it marks the opposite inputs, eg: up and down, as not being usable when one of the inputs on the same axis was already used, so the other input will be ignored, this is useful for analogs, which can't be pressed up and down at the same time, but also useful for dpads, which can technically be pressed up and down at the same time but the controller design should prevent that from happening
                              }
                            }
                          }
                          for (var byteIndex = 0; byteIndex < neutralController.length; byteIndex++) {
                            //console.log(byteIndex + " " + neutralController[byteIndex]);
                            if (neutralController[byteIndex] == 0) {
                              //console.log("Yes");
                              dataToWrite[byteIndex + 1] = hex[byteIndex] + dataToWrite[byteIndex + 1];
                              //console.log(dataToWrite[byteIndex + 1]);
                            }
                            if (neutralController[byteIndex] != 0) {
                              if (neutralController[byteIndex] != hex[byteIndex]) {
                                // Which value should I use for analog limit? 32, 48, 64? (For n64 only?)
                                //console.log(byteIndex + " this byte is different, so it must be analog?");
                                //console.log("adjustableAnalogStickPosition = " + adjustableAnalogStickPosition);
                                //console.log("inputString = " + inputString);
                                let limitedAnalog = (hex[byteIndex] <= controllerConfig.stick_center) ? hex[byteIndex] + controllerConfig.stick_limit : hex[byteIndex] - controllerConfig.stick_limit; // Set to 0 or set to 255 respectively (0 + 0 = 0 OR 255 - 0 = 255)
                                if (adjustableAnalogStickPosition != -1) {
                                  // Valid Stick Position
                                  //console.log("inputString = " + inputString);
                                  inputString = inputString.replace(/[\+\_\|\#\[\]\,\.\s]+$/ig, "");
                                  //console.log("inputString = " + inputString);
                                  inputString = inputString + ":" + adjustableAnalogStickPosition + "+";
                                  //console.log("inputString = " + inputString);
                                  limitedAnalog = (hex[byteIndex] <= controllerConfig.stick_center) ? controllerConfig.stick_center - adjustableAnalogStickPosition : controllerConfig.stick_center + adjustableAnalogStickPosition;
                                  //console.log("limitedAnalog = " + limitedAnalog);
                                }
                                if (adjustableAnalogStickPosition == -1) {
                                  // Invalid Stick Position
                                  limitedAnalog = (hex[byteIndex] <= controllerConfig.stick_center) ? hex[byteIndex] + controllerConfig.stick_limit : hex[byteIndex] - controllerConfig.stick_limit;
                                }
                                //console.log("limitedAnalog = " + limitedAnalog);
                                //let customAnalog = 0;
                                //console.log("limitedAnalog: " + limitedAnalog);
                                //console.log("HOLD ON: " + byteIndex + " " + hex[byteIndex] + " " + neutralController[byteIndex]);
                                dataToWrite[byteIndex + 1] = limitedAnalog;
                              }
                              //console.log("No");
                              //dataToWrite[byteIndex + 1] = hex[byteIndex];
                            }
                          }
                          controllerState[controllerObjectIndex] = true;
                          inputsUsed++;
                          //console.log(new Date().toISOString() + " controllerObjectIndex = " + controllerObjectIndex + " controllerObject[controllerObjectIndex].input_name = " + controllerObject[controllerObjectIndex].input_name + " controllerObject[controllerObjectIndex].input_value = " + controllerObject[controllerObjectIndex].input_value + " controllerObject[controllerObjectIndex].opposite_input_value = " + controllerObject[controllerObjectIndex].opposite_input_value);
                          //console.log("Inputs used: " + inputsUsed);
                        }
                      }
                    }
                    /*
                    dataToWrite[1] = hex[0];
                    dataToWrite[2] = hex[1];
                    dataToWrite[3] = hex[2];
                    dataToWrite[4] = hex[3];
                    dataToWrite[5] = hex[4];
                    dataToWrite[6] = hex[5];
                    dataToWrite[7] = hex[6];
                    dataToWrite[8] = hex[7];
                    */
                    //writeToPort(dataToWrite);
                  }
                  if (lowerCaseMessage != lowerCaseCommand) {
                    //console.log("Invalid command");
                  }
                  //console.log("controllerObjectIndex:" + controllerObjectIndex + " controllerAliasIndex:" + controllerAliasIndex + " " + controllerObject[controllerObjectIndex].input_alias[controllerAliasIndex]);
                }
              }
              //console.log(new Date().toISOString() + " didInputMatch = " + didInputMatch);
              if (didInputMatch == false) {
                hasInvalidInput = true;
              }
            }
            //console.log(new Date().toISOString() + " messageInputs[messageInputIndex] = " + messageInputs[messageInputIndex] + " messageInputIndex = " + messageInputIndex);
            if (hasInvalidInput == true) {
              if (isValidInputDelay == false) {
                //console.log(new Date().toISOString() + " messageInputs[messageInputIndex] = " + messageInputs[messageInputIndex] + " messageInputIndex = " + messageInputIndex);
                //

                //for (let tempInputArrayIndex = 0; tempInputArrayIndex < tempInputArray.length; tempInputArrayIndex++)
                {
                  //if (tempInputArrayIndex == 1)
                  {
                    {
                      //console.log("C SET THIS AS DELAY INSTEAD OF REPEAT MAYBE");
                      //console.log(isNaN(parseInt(testVar[testVarIndex], 10)));
                      if (isNaN(parseInt(messageInputs[messageInputIndex], 10)) == false) {
                        //console.log("C POGGERS WE GOT A NUMBER");
                        if (parseInt(messageInputs[messageInputIndex], 10) >= 0) {
                          if (parseInt(messageInputs[messageInputIndex], 10) <= controllerConfig.max_delay) {
                            //console.log("C Outcome A");
                            adjustableInputDelay = parseInt(messageInputs[messageInputIndex], 10);
                            isValidInputDelay = true;
                            if (adjustableInputDelay <= 10) {
                              adjustableInputDelay = adjustableInputDelay * 1000; // People will intuitively enter seconds as delay, this fixes that so seconds are valid, but only if the desired delay is less than or equals 10 seconds
                            }
                          }
                          if (parseInt(messageInputs[messageInputIndex], 10) > controllerConfig.max_delay) {
                            //console.log("C Outcome B");
                            adjustableInputDelay = controllerConfig.max_delay;
                            isValidInputDelay = true;
                          }
                          //console.log("C WE GOT A POSITIVE INTEGER");
                          //console.log(testVar[testVarIndex]);
                          //precisionInputHold = parseInt(testVar[testVarIndex], 10);
                        }
                        if (parseInt(messageInputs[messageInputIndex], 10) < 1) {
                          //console.log("C WE GOT A NON-POSITIVE INTEGER");
                          //console.log(testVar[testVarIndex]);
                          isValidInputDelay = true;
                          adjustableInputDelay = controllerConfig.normal_delay;
                        }
                      }
                      if (isNaN(parseInt(messageInputs[messageInputIndex], 10)) == true) {
                        //console.log(testVar[testVarIndex]);
                        //console.log("C NOT A NUMBER :(");
                        // Instead of setting to default, maybe just don't do anything?
                        //console.log("Invalid number");
                        //adjustableInputDelay = controllerConfig.normal_delay;
                      }
                      //console.log("C Should be a positive integer");
                    }
                  }
                }


                /*
                {
                  console.log("D SET THIS AS DELAY INSTEAD OF REPEAT MAYBE");
                  //console.log(isNaN(parseInt(testVar[testVarIndex], 10)));
                  if (isNaN(parseInt(messageWords[1], 10)) == false) {
                    console.log("D POGGERS WE GOT A NUMBER");
                    if (parseInt(messageWords[1], 10) >= 0) {
                      if (parseInt(messageWords[1], 10) <= controllerConfig.max_delay) {
                        console.log("D Outcome A");
                        adjustableInputDelay = parseInt(messageWords[1], 10);
                        if (adjustableInputDelay <= 10) {
                          adjustableInputDelay = adjustableInputDelay * 1000; // People will intuitively enter seconds as delay, this fixes that so seconds are valid, but only if the desired delay is less than or equals 10 seconds
                        }
                      }
                      if (parseInt(messageWords[1], 10) > controllerConfig.max_delay) {
                        console.log("D Outcome B");
                        adjustableInputDelay = controllerConfig.max_delay;
                      }
                      console.log("D WE GOT A POSITIVE INTEGER");
                      //console.log(testVar[testVarIndex]);
                      //precisionInputHold = parseInt(testVar[testVarIndex], 10);
                    }
                    if (parseInt(messageWords[1], 10) < 1) {
                      console.log("D WE GOT A NON-POSITIVE INTEGER");
                      //console.log(testVar[testVarIndex]);
                      adjustableInputDelay = controllerConfig.normal_delay;
                    }
                  }
                  if (isNaN(parseInt(messageWords[1], 10)) == true) {
                    //console.log(testVar[testVarIndex]);
                    console.log("D NOT A NUMBER :(");
                    // Instead of setting to default, maybe just don't do anything?
                    //console.log("Invalid number");
                    //adjustableInputDelay = controllerConfig.normal_delay;
                  }
                  console.log("D Should be a positive integer");
                }
                */

                //console.log("adjustableInputDelay = " + adjustableInputDelay);



                // isValidInputDelay Parse delay here
                inputDelay = (setHold == true) ? controllerConfig.held_delay : adjustableInputDelay;
                //inputDelay = (setHold == true) ? controllerConfig.held_delay : controllerConfig.normal_delay;
                //console.log("inputDelay = " + inputDelay);
                //inputDelay = 200;
                inputDelayHigh = (inputDelay & 0x0000ff00) >> 8;
                inputDelayLow = (inputDelay & 0x000000ff);
                //console.log(inputDelay);
                //console.log(inputDelayHigh);
                //console.log(inputDelayLow);
                dataToWrite[9] = inputDelayHigh;
                dataToWrite[10] = inputDelayLow;
                //console.log("inputDelay = " + inputDelay);
              }
              if (isValidInputDelay == true) {
                // Do nothing?
                //console.log("YOOOOOOOOOOOOOOOOOOOOOOOOO");
              }
              //isValidInputDelay
              // Do nothing?
              isValidInputDelay = true;
            }
            //console.log(new Date().toISOString() + " hasInvalidInput = " + hasInvalidInput);
          }
          if (inputsUsed > 0) {
            let isBlacklistedCombo = false;
            //console.log(new Date().toISOString() + " inputsUsed = " + inputsUsed);
            //console.log(controllerConfig.blacklisted_combos.length);
            for (let blacklistedComboIndex = 0; blacklistedComboIndex < controllerConfig.blacklisted_combos.length; blacklistedComboIndex++) {
              let blacklistedComboInputComponentCount = 0;
              //console.log("controllerConfig.blacklisted_combos[blacklistedComboIndex].blacklisted_combo_input_size = " + controllerConfig.blacklisted_combos[blacklistedComboIndex].blacklisted_combo_input_size);
              //if (inputsUsed == controllerConfig.blacklisted_combos[blacklistedComboIndex].blacklisted_combo_input_size)
              {
                //console.log("YES");
                //console.log("blacklistedComboIndex = " + blacklistedComboIndex);
                //console.log("controllerConfig.blacklisted_combos[blacklistedComboIndex].blacklisted_combo_input_size = " + controllerConfig.blacklisted_combos[blacklistedComboIndex].blacklisted_combo_input_size);
                for (let blacklistedComboInputComponentIndex = 0; blacklistedComboInputComponentIndex < controllerConfig.blacklisted_combos[blacklistedComboIndex].blacklisted_combo_input_components.length; blacklistedComboInputComponentIndex++) {
                  //console.log("blacklistedComboInputComponentIndex = " + blacklistedComboInputComponentIndex);
                  //console.log(controllerConfig.blacklisted_combos[blacklistedComboIndex].blacklisted_combo_input_components[blacklistedComboInputComponentIndex]);
                  let blacklistedComboInputComponentInputValue = controllerConfig.blacklisted_combos[blacklistedComboIndex].blacklisted_combo_input_components[blacklistedComboInputComponentIndex].component_input_value;
                  blacklistedComboInputComponentInputValue = blacklistedComboInputComponentInputValue.replace(/(0x)+/ig, "");
                  blacklistedComboInputComponentInputValue = blacklistedComboInputComponentInputValue.replace(/L+/ig, "");
                  blacklistedComboInputComponentInputValue = blacklistedComboInputComponentInputValue.replace(/#+/ig, "");
                  //console.log("blacklistedComboInputComponentInputValue = " + blacklistedComboInputComponentInputValue);
                  blacklistedComboInputComponentInputValue = Uint8Array.from(Buffer.from(blacklistedComboInputComponentInputValue, "hex"));
                  //console.log("blacklistedComboInputComponentInputValue = " + blacklistedComboInputComponentInputValue);
                  //console.log(blacklistedComboInputComponentInputValue);
                  for (var controllerObjectIndex3 = 0; controllerObjectIndex3 < controllerObject.length; controllerObjectIndex3++) {
                    if (controllerState[controllerObjectIndex3] == true) {
                      //console.log("USED INPUT");
                      //console.log(controllerObject[controllerObjectIndex3].input_name);
                      let blacklistedComboInputComponentInputValueToCompareTo = controllerObject[controllerObjectIndex3].input_value;
                      blacklistedComboInputComponentInputValueToCompareTo = blacklistedComboInputComponentInputValueToCompareTo.replace(/(0x)+/ig, "");
                      blacklistedComboInputComponentInputValueToCompareTo = blacklistedComboInputComponentInputValueToCompareTo.replace(/L+/ig, "");
                      blacklistedComboInputComponentInputValueToCompareTo = blacklistedComboInputComponentInputValueToCompareTo.replace(/#+/ig, "");
                      blacklistedComboInputComponentInputValueToCompareTo = Uint8Array.from(Buffer.from(blacklistedComboInputComponentInputValueToCompareTo, "hex"));
                      let blacklistedComboInputMatchCount = 0;
                      for (var blacklistedComboInputValueIndex = 0; blacklistedComboInputValueIndex < blacklistedComboInputComponentInputValueToCompareTo.length; blacklistedComboInputValueIndex++) {
                        if (blacklistedComboInputComponentInputValueToCompareTo[blacklistedComboInputValueIndex] == blacklistedComboInputComponentInputValue[blacklistedComboInputValueIndex]) {
                          blacklistedComboInputMatchCount++;
                          //console.log("blacklistedComboInputMatchCount " + blacklistedComboInputMatchCount);
                          //console.log(" YES " + blacklistedComboInputComponentInputValueToCompareTo[blacklistedComboInputValueIndex] + " " + blacklistedComboInputComponentInputValue[blacklistedComboInputValueIndex] + " AT INDEX " + blacklistedComboInputValueIndex);
                        }
                      }
                      if (blacklistedComboInputMatchCount == blacklistedComboInputComponentInputValueToCompareTo.length) {
                        /*
                        console.log(controllerObjectIndex3);
                        console.log(blacklistedComboInputComponentIndex);
                        console.log(blacklistedComboIndex);
                        console.log("WE FOUND A BLACKLISTED INPUT!!!!!!!!!!");
                        console.log(controllerObject[controllerObjectIndex3].input_name);
                        */
                        blacklistedComboInputComponentCount++;
                      }
                    }
                    //console.log(blacklistedComboInputComponentCount);
                    //console.log("controllerObjectIndex3 = " + controllerObjectIndex3);
                    //console.log(blacklistedComboInputComponentInputValueToCompareTo);
                  }
                  //console.log(blacklistedComboInputComponentCount);
                }
              }
              //if (inputsUsed != controllerConfig.blacklisted_combos[blacklistedComboIndex].blacklisted_combo_input_size) {
              //console.log("NO");
              //}
              //console.log("blacklistedComboIndex = " + blacklistedComboIndex);
              //console.log(controllerConfig.blacklisted_combos[blacklistedComboIndex]);
              //console.log(controllerConfig.blacklisted_combos[blacklistedComboIndex]);
              //console.log(controllerConfig.blacklisted_combos[blacklistedComboIndex].blacklisted_combo_input_string);
              //console.log(controllerConfig.blacklisted_combos[blacklistedComboIndex].blacklisted_combo_input_description);
              //console.log(controllerConfig.blacklisted_combos[blacklistedComboIndex].blacklisted_combo_input_components.length);
              //console.log(blacklistedComboInputComponentCount);
              if (blacklistedComboInputComponentCount == controllerConfig.blacklisted_combos[blacklistedComboIndex].blacklisted_combo_input_components.length) {
                //console.log("BLACKLISTED COMBO????????????");
                //console.log(controllerConfig.blacklisted_combos[blacklistedComboIndex]);
                //console.log(controllerConfig.blacklisted_combos[blacklistedComboIndex].blacklisted_combo_input_components.length);
                //console.log(blacklistedComboInputComponentCount);
                isBlacklistedCombo = true;
              }
              //console.log(blacklistedComboInputComponentCount);
            }
            //console.log("isBlacklistedCombo = " + isBlacklistedCombo);
            // if (inputsUsed == messageInputs.length)
            if (isBlacklistedCombo == true) {
              //console.log(new Date().toISOString() + " Blacklisted combos detected, dropping input!");
            }
            if (isBlacklistedCombo == false) {
              inputString = inputString.replace(/[\+\_\|\#\[\]\,\.\s]+$/ig, "");
              inputString = (setHold == true) ? inputString.concat("-") : inputString.concat("");
              if (inputDelay == controllerConfig.normal_delay) {
                // Do nothing
              }
              if (inputDelay == controllerConfig.held_delay) {
                //inputString = inputString + "-";
              }
              if ((inputDelay != controllerConfig.normal_delay) && (inputDelay != controllerConfig.held_delay)) {
                inputString = inputString + " " + inputDelay + "ms";
              }
              //console.log(usernameToPing + " " + inputString);
              //inputQueue.push(dataToWrite);
              //let userColorInverted = "#000000";
              inputQueue.push({
                username_to_display: usernameToPing,
                username: username,
                display_name: displayName,
                user_color: userColor,
                user_color_inverted: userColorInverted,
                is_tts: false,
                message: message,
                tts_message: "",
                controller_data: dataToWrite,
                input_string: inputString,
                input_index: currentInputInQueue,
                message_id: messageId,
                user_id: userId
              });
              io.sockets.emit("input_data", inputQueue[currentInputInQueue]);
              // Get user from userdatabase by using their userid then increment the user's basic input count
              mongoClient.connect(mongoUrl, {
                useUnifiedTopology: true
              }, function(err, userDb) {
                if (err) {
                  throw err;
                }
                let userDatabase = userDb.db(globalConfig.main_database_name);
                userDatabase.collection(globalConfig.chatters_collection_name).findOne({
                  user_id: userId
                }, function(err, result) {
                  if (err) {
                    throw err;
                  }
                  //console.log(result);
                  //
                  mongoClient.connect(mongoUrl, {
                    useUnifiedTopology: true
                  }, function(err, databaseToUpdate) {
                    if (err) {
                      throw err;
                    }
                    let userDatabaseToUpdate = databaseToUpdate.db(globalConfig.main_database_name);
                    let dataToQuery = {
                      user_id: userId
                    };
                    let dataToUpdate = {
                      $set: {
                        user_id: result.user_id,

                        first_message_sent_id: result.first_message_sent_id,
                        last_message_sent_id: result.last_message_sent_id,

                        basic_inputs_sent: result.basic_inputs_sent + 1,
                        advanced_inputs_sent: result.advanced_inputs_sent,
                        total_inputs_sent: result.total_inputs_sent + 1,

                        is_first_message_basic_input: result.is_first_message_basic_input,
                        is_last_message_basic_input: true,

                        is_first_message_advanced_input: result.is_first_message_advanced_input,
                        is_last_message_advanced_input: false,

                        first_basic_input: result.first_basic_input,
                        first_advanced_input: result.first_advanced_input,

                        last_basic_input: originalMessage,
                        last_advanced_input: result.last_advanced_input
                      }
                    };
                    if (dataToUpdate.$set.first_basic_input == "") {
                      // User's first basic input
                      dataToUpdate.$set.first_basic_input = originalMessage;
                    }
                    if (dataToUpdate.$set.first_message_sent_id == dataToUpdate.$set.last_message_sent_id) {
                      // User's first message is also an input
                      //console.log("NEW USER PogChamp");
                      dataToUpdate.$set.is_first_message_basic_input = true;
                      dataToUpdate.$set.is_first_message_advanced_input = false;
                    }
                    userDatabaseToUpdate.collection(globalConfig.chatters_collection_name).updateOne(dataToQuery, dataToUpdate, function(err, res) {
                      if (err) {
                        throw err;
                      }
                      //console.log("1 document updated");
                      databaseToUpdate.close();
                    });
                  });
                  //
                  userDb.close();
                });
              });
              //console.log(inputQueue[currentInputInQueue]);
              // The database checks below check an user's input count
              mongoClient.connect(mongoUrl, {
                useUnifiedTopology: true
              }, function(err, userDb) {
                //isDatabaseBusy = true;
                if (err) {
                  throw err;
                }
                // Check if the user entry for a specific game exists
                let userDatabase = userDb.db(globalConfig.inputter_database_name);
                userDatabase.collection(globalConfig.run_name).findOne({
                  user_id: userId
                }, function(err, result) {
                  if (err) {
                    throw err;
                  }
                  //console.log(result);
                  //isNullDatabase = result;
                  if (result === null) {
                    console.log("YES");
                    mongoClient.connect(mongoUrl, {
                      useUnifiedTopology: true
                    }, function(err, databaseToCreate) {
                      if (err) {
                        throw err;
                      }
                      let userDatabaseToCreate = databaseToCreate.db(globalConfig.inputter_database_name);
                      let dataToInsert = {
                        run_id: globalConfig.run_id,
                        user_id: userId,
                        basic_inputs_sent: 1,
                        advanced_inputs_sent: 0,
                        total_inputs_sent: 1
                      };
                      userDatabaseToCreate.collection(globalConfig.run_name).insertOne(dataToInsert, function(err, res) {
                        if (err) {
                          throw err;
                        }
                        //console.log("1 document inserted");
                        mongoClient.connect(mongoUrl, {
                          useUnifiedTopology: true
                        }, function(err, databaseToReadFrom) {
                          if (err) {
                            throw err;
                          }
                          let userDatabaseToReadFrom = databaseToReadFrom.db(globalConfig.inputter_database_name);
                          userDatabaseToReadFrom.collection(globalConfig.run_name).findOne({
                            user_id: userId
                          }, function(err, databaseToReadFromResult) {
                            if (err) {
                              throw err;
                            }
                            databaseToReadFrom.close();
                            //console.log(databaseToReadFromResult);
                          });
                        });
                        databaseToCreate.close();
                      });
                    });
                    //test();
                  }
                  if (result !== null) {
                    //console.log("NO");
                    mongoClient.connect(mongoUrl, {
                      useUnifiedTopology: true
                    }, function(err, databaseToUpdate) {
                      if (err) {
                        throw err;
                      }
                      let userDatabaseToUpdate = databaseToUpdate.db(globalConfig.inputter_database_name);
                      let dataToQuery = {
                        run_id: result.run_id,
                        user_id: result.user_id,
                        basic_inputs_sent: result.basic_inputs_sent,
                        advanced_inputs_sent: result.advanced_inputs_sent,
                        total_inputs_sent: result.total_inputs_sent
                      };
                      let dataToUpdate = {
                        $set: {
                          run_id: result.run_id,
                          user_id: result.user_id,
                          basic_inputs_sent: result.basic_inputs_sent + 1,
                          advanced_inputs_sent: result.advanced_inputs_sent,
                          total_inputs_sent: result.total_inputs_sent + 1
                        }
                      };
                      //console.log(newvalues);
                      userDatabaseToUpdate.collection(globalConfig.run_name).updateOne(dataToQuery, dataToUpdate, function(err, res) {
                        if (err) {
                          throw err;
                        }
                        //console.log(res.result);
                        //console.log("1 document updated");
                        mongoClient.connect(mongoUrl, {
                          useUnifiedTopology: true
                        }, function(err, databaseToReadFrom) {
                          if (err) {
                            throw err;
                          }
                          let userDatabaseToReadFrom = databaseToReadFrom.db(globalConfig.inputter_database_name);
                          userDatabaseToReadFrom.collection(globalConfig.run_name).findOne({
                            user_id: userId
                          }, function(err, databaseToReadFromResult) {
                            if (err) {
                              throw err;
                            }
                            databaseToReadFrom.close();
                            //console.log(databaseToReadFromResult);
                          });
                        });
                        databaseToUpdate.close();
                      });
                    });
                    //console.log(result.input_count);
                    //test3(result.input_count);
                  }
                  userDb.close();
                  //isDatabaseBusy = false;
                });
              });
              //await sleep(333);
              // The database operations below check the total input count
              mongoClient.connect(mongoUrl, {
                useUnifiedTopology: true
              }, function(err, globalDb) {
                //isDatabaseBusy = true;
                if (err) {
                  throw err;
                }
                // Check if the entry for a specific game exists
                let globalDatabase = globalDb.db(globalConfig.global_database_name);
                globalDatabase.collection(globalConfig.run_name).findOne({}, function(err, result) {
                  if (err) {
                    throw err;
                  }
                  //console.log(result);
                  //isNullDatabase = result;
                  if (result === null) {
                    //console.log("YES");
                    mongoClient.connect(mongoUrl, {
                      useUnifiedTopology: true
                    }, function(err, databaseToCreate) {
                      if (err) {
                        throw err;
                      }
                      let globalDatabaseToCreate = databaseToCreate.db(globalConfig.global_database_name);
                      let dataToInsert = {
                        run_id: globalConfig.run_id,
                        basic_inputs_sent: 1,
                        advanced_inputs_sent: 0,
                        total_inputs_sent: 1,
                        basic_inputs_executed: 1,
                        advanced_inputs_executed: 0,
                        total_inputs_executed: 1
                      };

                      inputCountsObject = dataToInsert;
                      io.sockets.emit("input_counts_object", inputCountsObject);

                      //console.log("dataToInsert");
                      //console.log(dataToInsert);
                      // Executed means inputs that were successfully executed by the Arduino and sent back to the PC
                      globalDatabaseToCreate.collection(globalConfig.run_name).insertOne(dataToInsert, function(err, res) {
                        if (err) {
                          throw err;
                        }
                        //console.log("1 document inserted");
                        mongoClient.connect(mongoUrl, {
                          useUnifiedTopology: true
                        }, function(err, databaseToReadFrom) {
                          if (err) {
                            throw err;
                          }
                          let globalDatabaseToreadFrom = databaseToReadFrom.db(globalConfig.global_database_name);
                          globalDatabaseToreadFrom.collection(globalConfig.run_name).findOne({}, function(err, databaseToReadFromResult) {
                            if (err) {
                              throw err;
                            }
                            databaseToReadFrom.close();
                            //console.log(databaseToReadFromResult);
                            //inputsSent = databaseToReadFromResult.input_count;
                          });
                        });
                        databaseToCreate.close();
                      });
                    });
                    //test();
                  }
                  if (result !== null) {
                    //console.log("NO");
                    mongoClient.connect(mongoUrl, {
                      useUnifiedTopology: true
                    }, function(err, databaseToUpdate) {
                      if (err) {
                        throw err;
                      }
                      let globalDatabaseToUpdate = databaseToUpdate.db(globalConfig.global_database_name);
                      let dataToQuery = {
                        run_id: result.run_id,
                        basic_inputs_sent: result.basic_inputs_sent,
                        advanced_inputs_sent: result.advanced_inputs_sent,
                        total_inputs_sent: result.total_inputs_sent
                        /*
                        basic_inputs_executed: result.basic_inputs_executed,
                        advanced_inputs_executed: result.advanced_inputs_executed,
                        total_inputs_executed: result.total_inputs_executed
                        */
                      };
                      // Executed means inputs that were successfully executed by the Arduino and sent back to the PC
                      let dataToUpdate = {
                        $set: {
                          run_id: result.run_id,
                          basic_inputs_sent: result.basic_inputs_sent + 1,
                          advanced_inputs_sent: result.advanced_inputs_sent,
                          total_inputs_sent: result.total_inputs_sent + 1,
                          basic_inputs_executed: result.basic_inputs_executed,
                          advanced_inputs_executed: result.advanced_inputs_executed,
                          total_inputs_executed: result.total_inputs_executed
                        }
                      };

                      inputCountsObject = dataToUpdate.$set;
                      io.sockets.emit("input_counts_object", inputCountsObject);

                      //console.log("dataToUpdate");
                      //console.log(dataToUpdate);
                      // Executed means inputs that were successfully executed by the Arduino and sent back to the PC
                      //console.log(newvalues);
                      globalDatabaseToUpdate.collection(globalConfig.run_name).updateOne(dataToQuery, dataToUpdate, function(err, res) {
                        if (err) {
                          throw err;
                        }
                        //console.log(res.result);
                        //console.log("1 document updated");
                        mongoClient.connect(mongoUrl, {
                          useUnifiedTopology: true
                        }, function(err, databaseToReadFrom) {
                          if (err) {
                            throw err;
                          }
                          let globalDatabaseToreadFrom = databaseToReadFrom.db(globalConfig.global_database_name);
                          globalDatabaseToreadFrom.collection(globalConfig.run_name).findOne({}, function(err, databaseToReadFromResult) {
                            if (err) {
                              throw err;
                            }
                            databaseToReadFrom.close();
                            //console.log(databaseToReadFromResult);
                            //inputsSent = databaseToReadFromResult.input_count;
                          });
                        });
                        databaseToUpdate.close();
                      });
                    });
                    //console.log(result.input_count);
                    //test3(result.input_count);
                  }
                  globalDb.close();
                  //isDatabaseBusy = false;
                });
              });
            }
            //writeToPort(dataToWrite, currentInputInQueue);
          }
        }
        //writeToPort(dataToWrite, currentInputInQueue);
        /*
        console.log(target);
        console.log(tags);
        console.log(message);
        console.log(self);
        */
        /*
        if (tags["custom-reward-id"] != undefined) {
          console.log("yep, that's a custom reward");
        }
        if (tags["custom-reward-id"] == undefined) {
          console.log("this is not a custom reward");
        }
        */
      }
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function checkModeVotes() {
  checkVotingCooldownTime();
  let basicVoteCountLocal = 0;
  let advancedVoteCountLocal = 0;
  let removedVoteCountLocal = 0;
  modeVotes.forEach(function(item, index, array) {
    //console.log(item);
    let voteExpirationTime = item.expiration_time - new Date().getTime();
    //console.log(index + " " + voteExpirationTime);
    if (voteExpirationTime <= 0) {
      if (client.readyState() === "OPEN") {
        let randomColorName = Math.floor(Math.random() * defaultColors.length);
        client.say(chatConfig.main_channel, ".color " + defaultColorNames[randomColorName]);
        client.action(chatConfig.main_channel, "@" + item.username_to_display + " Your " + inputModesArray[item.mode_vote].mode_name + " mode vote has expired and was removed!");
      }
      //console.log("Removing vote at index " + index);
      modeVotes.splice(index, 1);
      if (item.mode_vote == 0) {
        basicVoteCountLocal--;
        //console.log("Removed basic vote at index " + index + " count: " + basicVoteCountLocal);
        removedVoteCountLocal++;
      }
      if (item.mode_vote == 2) {
        advancedVoteCountLocal--;
        //console.log("Removed advanced vote at index " + index + " count: " + advancedVoteCountLocal);
        removedVoteCountLocal++;
      }
    }
    if (item.mode_vote == 0) {
      basicVoteCountLocal++;
      //console.log("Added basic from index " + index + " count: " + basicVoteCountLocal);
    }
    if (item.mode_vote == 2) {
      //console.log("Added advanced from index " + index);
      advancedVoteCountLocal++;
      //console.log("Added advanced from index " + index + " count: " + advancedVoteCountLocal);
    }
    //console.log(voteExpirationTime);
    //console.log(array);
  });
  //thresholdToChangeMode;
  basicVoteCount = basicVoteCountLocal;
  advancedVoteCount = advancedVoteCountLocal;
  totalVotes = advancedVoteCount + basicVoteCount;
  advancedVoteCountRatio = (advancedVoteCount / totalVotes);
  basicVoteCountRatio = (basicVoteCount / totalVotes);
  if (isNaN(advancedVoteCountRatio) == true) {
    advancedVoteCountRatio = 0;
  }
  if (isNaN(basicVoteCountRatio) == true) {
    basicVoteCountRatio = 0;
  }
  if (basicVoteCountRatio >= thresholdToChangeMode) {
    inputMode = 0;
  }
  if (advancedVoteCountRatio >= thresholdToChangeMode) {
    inputMode = 2;
  }
  if (inputMode != inputModePrevious) {
    //console.log("Mode changed, right?");
    if (inputMode == 0) {
      if (globalConfig.is_voting_temporary == true) {
        //console.log("Mode change to 0, right?");
        if (votingAllowed > new Date().getTime()) {
          //console.log("Can't set new votingAllowed time yet, previous time is still ticking");
          //console.log(votingAllowed - new Date().getTime());
        }
        if (votingAllowed <= new Date().getTime()) {
          votingAllowed = new Date().getTime() + globalConfig.voting_allowed_period_millis;
          modeVotes = [];
          //console.log("Setting new votingAllowed time");
          //console.log(votingAllowed - new Date().getTime());
        }
      }
    }
    if (inputMode == 2) {
      if (globalConfig.is_advanced_mode_temporary == true) {
        //console.log("Mode change to 2, right?");
        if (advancedAllowed > new Date().getTime()) {
          //console.log("Can't set new advancedAllowed time yet, previous time is still ticking");
          //console.log(advancedAllowed - new Date().getTime());
        }
        if (advancedAllowed <= new Date().getTime()) {
          advancedAllowed = new Date().getTime() + globalConfig.advanced_allowed_period_millis;
          //console.log("Setting new advancedAllowed time");
          //console.log(advancedAllowed - new Date().getTime());
        }
      }
    }
    //console.log("Changing from " + inputModePrevious + " to " + inputMode);
    let neutralDataToWrite = [0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x85, 0x01];
    neutralDataToWrite[1] = neutralController[0];
    neutralDataToWrite[2] = neutralController[1];
    neutralDataToWrite[3] = neutralController[2];
    neutralDataToWrite[4] = neutralController[3];
    neutralDataToWrite[5] = neutralController[4];
    neutralDataToWrite[6] = neutralController[5];
    neutralDataToWrite[7] = neutralController[6];
    neutralDataToWrite[8] = neutralController[7];
    // We're writing neutral controller data to the arduino when changing modes becuase we don't want it to keep running inputs from basic in advanced or advanced in basic mode
    inputQueue = []; // We also have to clear the basic input queue so it doesn't continue from where it left off when the mode is changed back from advanced to basic (Unlikely to happen anyway unless chat is going super fast)
    //console.log(neutralDataToWrite);

    // Clear the incoming serial data from arduino before setting an advanced input
    port.flush(function(err, results) {
      if (err) {
        if (client.readyState() === "OPEN") {
          if (chatConfig.send_debug_channel_messages == true) {
            let randomColorName = Math.floor(Math.random() * defaultColors.length);
            client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
            client.action(chatConfig.debug_channel, new Date().toISOString() + " [SERIAL PORT] Failed to flush port com_port=" + controllerConfig.com_port + ", com_port_parameters=" + JSON.stringify(controllerConfig.com_port_parameters) + ", err.message=" + err.message);
          }
        }
        return console.log(err);
      }
      //console.log(new Date().toISOString() + " flush results " + results);
    });
    port.drain(function(err, results) {
      if (err) {
        if (client.readyState() === "OPEN") {
          if (chatConfig.send_debug_channel_messages == true) {
            let randomColorName = Math.floor(Math.random() * defaultColors.length);
            client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
            client.action(chatConfig.debug_channel, new Date().toISOString() + " [SERIAL PORT] Failed to drain port com_port=" + controllerConfig.com_port + ", com_port_parameters=" + JSON.stringify(controllerConfig.com_port_parameters) + ", err.message=" + err.message);
          }
        }
        return console.log(err);
      }
      //console.log(new Date().toISOString() + " drain results " + results);
    });

    port.write(neutralDataToWrite, function(err) {
      if (err) {
        if (client.readyState() === "OPEN") {
          if (chatConfig.send_debug_channel_messages == true) {
            let randomColorName = Math.floor(Math.random() * defaultColors.length);
            client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
            client.action(chatConfig.debug_channel, new Date().toISOString() + " [SERIAL PORT] Failed to write to port com_port=" + controllerConfig.com_port + ", com_port_parameters=" + JSON.stringify(controllerConfig.com_port_parameters) + ", err.message=" + err.message);
          }
        }
        return console.log("Error on write: " + err.message);
      }
    });
    if ((basicVoteCount + advancedVoteCount) == 0) {
      if (inputMode == 0) {
        //console.log("If this happened, then that means we got kicked out from a mode");
      }
      if (inputMode == 2) {
        //console.log("If this happened, then that means we got kicked out from a mode");
      }
    }
    //console.log("Switching from " + inputModesArray[inputModePrevious].mode_name + " to " + inputModesArray[inputMode].mode_name + ". Basic mode has " + parseInt(basicVoteCountRatio * 100) + "% of all votes (" + basicVoteCount + " vote(s)) and Advanced mode has " + parseInt(advancedVoteCountRatio * 100) + "% of all votes (" + advancedVoteCount + " vote(s))!");
    if (client.readyState() === "OPEN") {
      let randomColorName = Math.floor(Math.random() * defaultColors.length);
      client.say(chatConfig.main_channel, ".color " + defaultColorNames[randomColorName]);
      client.action(chatConfig.main_channel, "Switching from " + inputModesArray[inputModePrevious].mode_name + " to " + inputModesArray[inputMode].mode_name + ". Basic mode has " + parseInt(basicVoteCountRatio * 100) + "% of all votes (" + basicVoteCount + " vote(s)) and Advanced mode has " + parseInt(advancedVoteCountRatio * 100) + "% of all votes (" + advancedVoteCount + " vote(s))!");
    }
    let voteDataObject = {
      basic_vote_count: basicVoteCount,
      advanced_vote_count: advancedVoteCount,
      threshold_to_change_mode: thresholdToChangeMode,
      total_votes: totalVotes,
      advanced_vote_count_ratio: advancedVoteCountRatio,
      basic_vote_count_ratio: basicVoteCountRatio,
      input_modes_array: inputModesArray,
      input_mode: inputMode
    };
    io.sockets.emit("vote_data", voteDataObject);
  }
  if (removedVoteCountLocal > 0) {
    let voteDataObject = {
      basic_vote_count: basicVoteCount,
      advanced_vote_count: advancedVoteCount,
      threshold_to_change_mode: thresholdToChangeMode,
      total_votes: totalVotes,
      advanced_vote_count_ratio: advancedVoteCountRatio,
      basic_vote_count_ratio: basicVoteCountRatio,
      input_modes_array: inputModesArray,
      input_mode: inputMode
    };
    io.sockets.emit("vote_data", voteDataObject);
  }
  if ((basicVoteCount != basicVoteCountPrevious) || (advancedVoteCount != advancedVoteCountPrevious) || (totalVotes != totalVotesPrevious)) {
    //console.log("basicVoteCount=" + basicVoteCount + ", basicVoteCountPrevious=" + basicVoteCountPrevious + ", advancedVoteCount=" + advancedVoteCount + ", advancedVoteCountPrevious=" + advancedVoteCountPrevious + ", totalVotes=" + totalVotes + ", totalVotesPrevious=" + totalVotesPrevious);
    let voteDataObject = {
      basic_vote_count: basicVoteCount,
      advanced_vote_count: advancedVoteCount,
      threshold_to_change_mode: thresholdToChangeMode,
      total_votes: totalVotes,
      advanced_vote_count_ratio: advancedVoteCountRatio,
      basic_vote_count_ratio: basicVoteCountRatio,
      input_modes_array: inputModesArray,
      input_mode: inputMode
    };
    io.sockets.emit("vote_data", voteDataObject);
  }
  basicVoteCountPrevious = basicVoteCount;
  advancedVoteCountPrevious = advancedVoteCount;
  totalVotesPrevious = totalVotes;
  inputModePrevious = inputMode;
  //console.log("Basic: " + basicVoteCount + " Advanced: " + advancedVoteCount + " Total: " + totalVotes + " InputMode: " + inputMode + " " + parseInt(advancedVoteCountRatio * 100) + " " + parseInt(basicVoteCountRatio * 100));
}

setInterval(checkVotingCooldownTime, 100);

function checkVotingCooldownTime() {
  if (globalConfig.is_advanced_mode_temporary == false) {
    return;
  }
  //console.log("votingAllowed " + (votingAllowed - new Date().getTime()));
  //console.log("advancedAllowed " + (advancedAllowed - new Date().getTime()));
  if (inputMode == 2) {
    if (new Date().getTime() > advancedAllowed) {
      modeVotes = []; // Clear all votes then kick everyone out to basic mode
      inputMode = 0; // Set to basic mode
      //console.log("advancedAllowed time over, going back to basic");
      if (client.readyState() === "OPEN") {
        let randomColorName = Math.floor(Math.random() * defaultColors.length);
        client.say(chatConfig.main_channel, ".color " + defaultColorNames[randomColorName]);
        client.action(chatConfig.main_channel, "Switching from " + inputModesArray[inputModePrevious].mode_name + " to " + inputModesArray[inputMode].mode_name + " because time for Advanced mode has ended. All votes were removed.");
      }
      inputModePrevious = 0; // We don't want to trigger the difference detection
      let voteDataObject = {
        basic_vote_count: basicVoteCount,
        advanced_vote_count: advancedVoteCount,
        threshold_to_change_mode: thresholdToChangeMode,
        total_votes: totalVotes,
        advanced_vote_count_ratio: advancedVoteCountRatio,
        basic_vote_count_ratio: basicVoteCountRatio,
        input_modes_array: inputModesArray,
        input_mode: inputMode
      };
      io.sockets.emit("vote_data", voteDataObject);
    }
  }
};

setInterval(checkModeVotes, 100);

// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr, port) {
  console.log("* Connected to " + addr + ":" + port);
  if (chatConfig.send_debug_channel_messages == true) {
    let randomColorName = Math.floor(Math.random() * defaultColors.length);
    client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
    client.action(chatConfig.debug_channel, new Date().toISOString() + " Connected! PogChamp");
  }
}

setInterval(sendInputs3, 10);

function sendInputs3() {
  if (inputMode != 0) {
    return;
  }
  if (inputQueue.length > 0) {
    if (isControllerBusy == false) {
      if (currentInputInQueue != inputQueue.length) {
        //console.log("Sounds about right?");
        //console.log("CHANGED FROM " + currentInputInQueuePrevious +  " TO " + currentInputInQueue + " TO " + inputQueue.length);
        let inputDelayToWrite = (inputQueue[currentInputInQueue].controller_data[9] << 8) | (inputQueue[currentInputInQueue].controller_data[10]);
        writeToPort(inputQueue[currentInputInQueue].controller_data, currentInputInQueue, inputDelayToWrite);
        //console.log(inputQueue[currentInputInQueue].username_to_display + " " + inputQueue[currentInputInQueue].input_string);
        currentInputInQueue++;
      }
      //currentInputInQueue++;
      if (currentInputInQueuePrevious != currentInputInQueue) {
        //console.log("CHANGED FROM " + currentInputInQueuePrevious +  " TO " + currentInputInQueue);
      }
    }
  }
  if (isControllerBusy != isControllerBusyPrevious) {
    var inputStatus = {
      is_controller_busy: isControllerBusy,
      is_tts_busy: isTtsBusy,
      current_input_in_queue: currentInputInQueue,
      previous_input_in_queue: currentInputInQueuePrevious,
      data_changed: "controller_status",
      input_queue_length: inputQueue.length
    };
    io.sockets.emit("input_status", inputStatus);
  }

  if (isTtsBusy != isTtsBusyPrevious) {
    var inputStatus = {
      is_controller_busy: isControllerBusy,
      is_tts_busy: isTtsBusy,
      current_input_in_queue: currentInputInQueue,
      previous_input_in_queue: currentInputInQueuePrevious,
      data_changed: "tts_status",
      input_queue_length: inputQueue.length
    };
    io.sockets.emit("input_status", inputStatus);
  }

  if (currentInputInQueue != currentInputInQueuePrevious) {
    var inputStatus = {
      is_controller_busy: isControllerBusy,
      is_tts_busy: isTtsBusy,
      current_input_in_queue: currentInputInQueue,
      previous_input_in_queue: currentInputInQueuePrevious,
      data_changed: "current_input",
      input_queue_length: inputQueue.length
    };
    io.sockets.emit("input_status", inputStatus);
  }

  isTtsBusyPrevious = isTtsBusy;
  isControllerBusyPrevious = isControllerBusy;
  currentInputInQueuePrevious = currentInputInQueue;
}

//setInterval(sendInputs2, 1);

function sendInputs2() {
  if (inputQueue.length > 0) {
    if (currentInputInQueue > 0) {

    }
    if (currentInputInQueue == 0) {
      if (isControllerBusy == false) {
        if (currentInputInQueue != currentInputInQueuePrevious) {
          var inputDelay = (inputQueue[currentInputInQueue][9] << 8) | (inputQueue[currentInputInQueue][10]);
          writeToPort(inputQueue[currentInputInQueue], currentInputInQueue, inputDelay);
        }
      }
    }
  }
  currentInputInQueuePrevious = currentInputInQueue;
}

//setInterval(sendInputs, 1);

function sendInputs() {
  //console.log("NO " + currentInputInQueue);
  if (inputQueue.length > 0) {
    //currentInputInQueue++;
    if (isControllerBusy == false) {
      //console.log("YES " + currentInputInQueue);
      if (currentInputInQueue <= inputQueue.length - 1) {
        var inputDelay = (inputQueue[currentInputInQueue][9] << 8) | (inputQueue[currentInputInQueue][10]);
        writeToPort(inputQueue[currentInputInQueue], currentInputInQueue, inputDelay);
        //console.log("SOMETHING???????");
        currentInputInQueue++;
      }
      //currentInputInQueue = inputQueue.length - 1;
    }
    if (isControllerBusy == true) {
      //console.log("NO " + currentInputInQueue);
      //writeToPort(inputQueue[currentInputInQueue], currentInputInQueue);
      //currentInputInQueue = inputQueue.length - 1;
    }
    /*
    while (currentInputInQueue - 1 < inputQueue.length) {
      currentInputInQueue++;
      console.log("YES " + currentInputInQueue);
    }
    */
    /*
    console.log("H " + inputQueue.length + " " + currentInputInQueue);
    if (isControllerBusy == false) {
      if (currentInputInQueue <= inputQueue.length - 1) {
        //console.log("H " + inputQueue.length + " " + currentInputInQueue);
        currentInputInQueue++;
        //writeToPort(inputQueue[currentInputInQueue], currentInputInQueue);
        //console.log("A " + inputQueue.length + " " + currentInputInQueue);
      }
    }
    */
    //console.log("SOMETHING?");
    //writeToPort(inputQueue[currentInputInQueue], currentInputInQueue);
  }
  //currentInputInQueuePrevious = currentInputInQueue;
}

//processMacroChain("a+b+z", 133, 0);

function processMacroChain(macroString, macroInputDelay, macroIndex, sendToArduino) {
  let isValidInput = false;
  let processedMacroInputString = "";
  let processedMacroInputDelay = 0;
  let hasInvalidMacroInput = false;
  //console.log("RECEIVED MACRO CHAIN: " + macroString);
  //console.log("MACRO CHAIN DELAY: " + macroInputDelay);
  //console.log("MACRO CHAIN INDEX: " + macroIndex);

  let dataToWrite = [macroIndex + controllerConfig.initial_macro_preamble, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, macroIndex + controllerConfig.initial_macro_preamble];
  dataToWrite[1] = neutralController[0];
  dataToWrite[2] = neutralController[1];
  dataToWrite[3] = neutralController[2];
  dataToWrite[4] = neutralController[3];
  dataToWrite[5] = neutralController[4];
  dataToWrite[6] = neutralController[5];
  dataToWrite[7] = neutralController[6];
  dataToWrite[8] = neutralController[7];
  let lowerCaseMessage = "";
  let lowerCaseCommand = "";
  let inputString = "";
  let removedDashesAtTheEnd = "";
  let setHold = false;
  let inputDelay = macroInputDelay;
  let inputDelayHigh = 0;
  let inputDelayLow = 133;
  let ttsInputDelayHigh = 0;
  let ttsInputDelayLow = 133;
  let controllerState = [];
  //message = message.replace(/\s+/ig, " ")
  //message = message.replace(/\s*\++\s*/ig, "+");
  //let messageWords = message.split(/\s+/ig);
  let messageInputs = [];
  let inputsUsed = 0;
  let processedMessage = "";
  //let usernameToPing = (username.toLowerCase() == displayName.toLowerCase()) ? displayName : username;
  let precisionInputs = [];
  let precisionInputsObjArr = [];
  let processedPrecisionInputs = [];
  let precisionInputsDelay = [];
  let precisionInputsLoops = [];
  let advancedInputInputs = [];
  let precisionInputsPreProcessed = {
    input_array: [],
    input_repeat_count: 0
  };
  let precisionInputsLoop = false;

  //let precisionInputString = "";
  //let precisionInputDelay = 133;
  //let precisionInputLoop = false;

  let precisionInputString = "";
  let precisionInputHold = 133;
  let precisionInputRepeat = 0;

  let precisionInputDelayHigh = 0;
  let precisionInputDelayLow = 133;

  let precisionInputsMacroCount = 0;

  let precisionInputsUsed = 0;
  //console.log(messageWords);
  let macroStringArray = macroString.split(/[\+\_\|\#\[\]\,\.\s]+/ig);
  /*
  for (var messageInputIndex = 0; messageInputIndex < macroStringArray.length; messageInputIndex++) {
    for (var controllerObjectIndex = 0; controllerObjectIndex < controllerObject.length; controllerObjectIndex++) {
      for (var controllerAliasIndex = 0; controllerAliasIndex < controllerObject[controllerObjectIndex].input_alias.length; controllerAliasIndex++) {
        lowerCaseMessage = macroStringArray[messageInputIndex].toLowerCase();
        lowerCaseCommand = controllerObject[controllerObjectIndex].input_alias[controllerAliasIndex].toLowerCase();
        if (lowerCaseMessage != lowerCaseCommand) {
          //console.log("Command at " + messageInputIndex + " " + lowerCaseMessage + " does not match alias at index " + controllerObjectIndex + " " + lowerCaseCommand);
        }
      }
    }
  }
  */
  if (isTtsBusy == false) {
    for (var messageInputIndex = 0; messageInputIndex < macroStringArray.length; messageInputIndex++) {
      let didMacroInputMatch = false;
      macroStringArray[messageInputIndex] = macroStringArray[messageInputIndex].replace(/^[!\"#$%&'()*+,-./:;%=%?@\[\\\]_`{|}~¡¦¨«¬­¯°±»½⅔¾⅝⅞∅ⁿ№★†‡‹›¿‰℅æßçñ¹⅓¼⅛²⅜³⁴₱€¢£¥—–·„“”‚‘’•√π÷×¶∆′″←↑↓→§Π♣♠♥♪♦∞≠≈©®™✓‛‟❛❜❝❞❟❠❮❯⹂〝〞〟＂🙶🙷🙸󠀢⍻✅✔𐄂🗸‱]+/ig, ""); // Remove all unecessary prefix
      //console.log("macroStringArray[messageInputIndex] at index " + messageInputIndex + " = " + macroStringArray[messageInputIndex]);
      processedMessage = macroStringArray[messageInputIndex].toLowerCase();

      let adjustableAnalogStickPosition = -1;

      //console.log(new Date().toISOString() + " processedMessage = " + processedMessage + " messageInputIndex = " + messageInputIndex);
      let splitToFindCustomAnalogStickPosition = processedMessage.replace(/\:+/ig, " ");
      //console.log(new Date().toISOString() + " splitToFindCustomAnalogStickPosition = " + splitToFindCustomAnalogStickPosition);
      splitToFindCustomAnalogStickPosition = splitToFindCustomAnalogStickPosition.trim();
      //console.log(new Date().toISOString() + " splitToFindCustomAnalogStickPosition = " + splitToFindCustomAnalogStickPosition);
      splitToFindCustomAnalogStickPosition = splitToFindCustomAnalogStickPosition.split(/\s+/ig);
      //console.log(new Date().toISOString() + " splitToFindCustomAnalogStickPosition = " + splitToFindCustomAnalogStickPosition);

      if (splitToFindCustomAnalogStickPosition[0] !== undefined) {
        // Valid, do the thing!
        //console.log(new Date().toISOString() + " OK WE GOOD " + splitToFindCustomAnalogStickPosition[0]);
        if (splitToFindCustomAnalogStickPosition[1] !== undefined) {
          //console.log(new Date().toISOString() + " OK WE GOOD AGAIN " + splitToFindCustomAnalogStickPosition[1]);
          // Maybe this is valid custom analog stick position?
          //
          //console.log("Z SET THIS AS CUSTOM ANALOG POSITION MAYBE");
          //console.log(isNaN(parseInt(testVar[testVarIndex], 10)));
          if (isNaN(parseInt(splitToFindCustomAnalogStickPosition[1], 10)) == false) {
            //console.log("Z POGGERS WE GOT A NUMBER");
            if (parseInt(splitToFindCustomAnalogStickPosition[1], 10) >= 0) {
              if (parseInt(splitToFindCustomAnalogStickPosition[1], 10) <= controllerConfig.stick_center) {
                //console.log("Z Outcome A");
                adjustableAnalogStickPosition = parseInt(splitToFindCustomAnalogStickPosition[1], 10);
              }
              if (parseInt(splitToFindCustomAnalogStickPosition[1], 10) > controllerConfig.stick_center) {
                //console.log("Z Outcome B");
                adjustableAnalogStickPosition = controllerConfig.stick_center;
              }
              //console.log("Z WE GOT A POSITIVE INTEGER");
              //console.log(testVar[testVarIndex]);
              //precisionInputHold = parseInt(testVar[testVarIndex], 10);
            }
            if (parseInt(splitToFindCustomAnalogStickPosition[1], 10) < 1) {
              //console.log("Z WE GOT A NON-POSITIVE INTEGER");
              //console.log(testVar[testVarIndex]);
              adjustableAnalogStickPosition = 1;
            }
          }
          if (isNaN(parseInt(splitToFindCustomAnalogStickPosition[1], 10)) == true) {
            //console.log(testVar[testVarIndex]);
            //console.log("Z NOT A NUMBER :(");
            adjustableAnalogStickPosition = -1;
            // Instead of setting to default, maybe just don't do anything?
            //console.log("Invalid number");
            //adjustableInputDelay = controllerConfig.normal_delay;
          }
          //console.log("Z Should be a positive integer");
          //
          //splitToFindCustomAnalogStickPosition[0] = splitToFindCustomAnalogStickPosition[0] + " " + splitToFindCustomAnalogStickPosition[1];
          //console.log(splitToFindCustomAnalogStickPosition[0] + " " + splitToFindCustomAnalogStickPosition[1]);
          //console.log(splitToFindCustomAnalogStickPosition[1]);

          let tempInputArray2 = splitToFindCustomAnalogStickPosition[1].replace(/[\/\\\;\*\']+/ig, " ");
          //console.log(new Date().toISOString() + " tempInputArray2 = " + tempInputArray2);
          tempInputArray2 = tempInputArray2.trim();
          //console.log(new Date().toISOString() + " tempInputArray2 = " + tempInputArray2);
          tempInputArray2 = tempInputArray2.split(/\s+/ig);
          //console.log(new Date().toISOString() + " tempInputArray2 = " + tempInputArray2);

          if (tempInputArray2[1] === undefined) {
            //console.log(new Date().toISOString() + " NO WHAT THE FUCK 3 " + tempInputArray2);
            //splitToFindCustomAnalogStickPosition[0] = splitToFindCustomAnalogStickPosition[0] + " " + tempInputArray2[0];
            let inputContainsDashesAtTheEnd2 = /[\-\=\‒\–\—\­\˗\−\－\̠]+$|(h+o+l+d+)+$|(h+e+l+d+)+$|(r+u+n+)+$|(c+o+n+t+i+n+u+o+u+s+l*y*)+$|^[\-\=\‒\–\—\­\˗\−\－\̠]+|^(h+o+l+d+)+|^(h+e+l+d+)+|^(r+u+n+)+|^(c+o+n+t+i+n+u+o+u+s+l*y*)+|(d+a+s+h+)+$|(s+p+r+i+n+t+)+$|^(d+a+s+h+)+|^(s+p+r+i+n+t+)+|^(k+e+p+)+|(k+e+p+)+$|^(b+i+g+)+|(b+i+g+)+$|^(l+o+n+g+)+|(l+o+n+g+)+$|^(p+e+r+m+a+n*e*n*t*l*y*)+|(p+e+r+m+a+n*e*n*t*l*y*)+$/ig.test(tempInputArray2[0]);
            if (inputContainsDashesAtTheEnd2 == true) {
              splitToFindCustomAnalogStickPosition[0] = splitToFindCustomAnalogStickPosition[0] + "-";
              //console.log(splitToFindCustomAnalogStickPosition[0] + "-");
            }
          }
          if (tempInputArray2[1] !== undefined) {
            //console.log(new Date().toISOString() + " OK WE GOOD AGAIN AGAIN " + tempInputArray2);
            //console.log(splitToFindCustomAnalogStickPosition[0]);
            //console.log(tempInputArray2[0]);
            //console.log(tempInputArray2[1]);
            splitToFindCustomAnalogStickPosition[0] = splitToFindCustomAnalogStickPosition[0] + " " + tempInputArray2[1];
            //console.log(splitToFindCustomAnalogStickPosition[0]);
          }
        }
        if (splitToFindCustomAnalogStickPosition[1] === undefined) {
          //console.log(new Date().toISOString() + " NO WHAT THE FUCK 2 " + splitToFindCustomAnalogStickPosition[1]);
        }
      }
      if (splitToFindCustomAnalogStickPosition[0] === undefined) {
        // Invalid, don't the thing!
        //console.log(new Date().toISOString() + " NO WHAT THE FUCK " + splitToFindCustomAnalogStickPosition[0]);
      }
      //console.log(new Date().toISOString() + " TEST " + splitToFindCustomAnalogStickPosition);
      //console.log(new Date().toISOString() + " TOAST " + processedMessage);
      if (splitToFindCustomAnalogStickPosition[1] !== undefined) {
        //console.log("THIS IS A TEST");
        //splitToFindCustomAnalogStickPosition.splice(1, 1);
        processedMessage = splitToFindCustomAnalogStickPosition[0];
      }
      if (splitToFindCustomAnalogStickPosition[1] === undefined) {
        //console.log("THIS IS A TOAST");
      }
      //console.log(new Date().toISOString() + " TEST " + splitToFindCustomAnalogStickPosition);
      //console.log(new Date().toISOString() + " TOAST " + processedMessage);

      var inputContainsDashes = /[\-\=\‒\–\—\­\˗\−\－\̠]+|(h+o+l+d+)+|(h+e+l+d+)+|(r+u+n+)+|(c+o+n+t+i+n+u+o+u+s+l*y*)+|(d+a+s+h+)+|(s+p+r+i+n+t+)+|(k+e+p+)+|(b+i+g+)+|(l+o+n+g+)+|(p+e+r+m+a+n*e*n*t*l*y*)+/ig.test(macroStringArray[messageInputIndex]);
      var inputContainsDashesAtTheEnd = /[\-\=\‒\–\—\­\˗\−\－\̠]+$|(h+o+l+d+)+$|(h+e+l+d+)+$|(r+u+n+)+$|(c+o+n+t+i+n+u+o+u+s+l*y*)+$|^[\-\=\‒\–\—\­\˗\−\－\̠]+|^(h+o+l+d+)+|^(h+e+l+d+)+|^(r+u+n+)+|^(c+o+n+t+i+n+u+o+u+s+l*y*)+|(d+a+s+h+)+$|(s+p+r+i+n+t+)+$|^(d+a+s+h+)+|^(s+p+r+i+n+t+)+|^(k+e+p+)+|(k+e+p+)+$|^(b+i+g+)+|(b+i+g+)+$|^(l+o+n+g+)+|(l+o+n+g+)+$|^(p+e+r+m+a+n*e*n*t*l*y*)+|(p+e+r+m+a+n*e*n*t*l*y*)+$/ig.test(macroStringArray[messageInputIndex]);

      //var testComparison = inputContainsDashes ? "Message contains dashes " + inputContainsDashes + " " + macroStringArray[messageInputIndex] : "Message doesn't contain dashes " + inputContainsDashes + " " + macroStringArray[messageInputIndex];
      //var testComparison2 = inputContainsDashesAtTheEnd ? "Message contains dashes at the end " + inputContainsDashesAtTheEnd + " " + macroStringArray[messageInputIndex] : "Message doesn't contain dashes at the end " + inputContainsDashesAtTheEnd + " " + macroStringArray[messageInputIndex];

      //console.log(testComparison);
      //console.log(testComparison2);

      if (inputContainsDashes == true) {
        if (inputContainsDashesAtTheEnd == true) {
          removedDashesAtTheEnd = macroStringArray[messageInputIndex].replace(/[\-\=\‒\–\—\­\˗\−\－\̠]+$|(h+o+l+d+)+$|(h+e+l+d+)+$|(r+u+n+)+$|(c+o+n+t+i+n+u+o+u+s+l*y*)+$|^[\-\=\‒\–\—\­\˗\−\－\̠]+|^(h+o+l+d+)+|^(h+e+l+d+)+|^(r+u+n+)+|^(c+o+n+t+i+n+u+o+u+s+l*y*)+|(d+a+s+h+)+$|(s+p+r+i+n+t+)+$|^(d+a+s+h+)+|^(s+p+r+i+n+t+)+|^(k+e+p+)+|(k+e+p+)+$|^(b+i+g+)+|(b+i+g+)+$|^(l+o+n+g+)+|(l+o+n+g+)+$|^(p+e+r+m+a+n*e*n*t*l*y*)+|(p+e+r+m+a+n*e*n*t*l*y*)+$/ig, "");
          processedMessage = removedDashesAtTheEnd;
          setHold = true;
          //console.log("removedDashesAtTheEnd: " + removedDashesAtTheEnd);
        }
        if (inputContainsDashesAtTheEnd == false) {
          // Discard input
        }
      }

      if (inputContainsDashes == false) {
        // Might be an actual input, this is checked later
      }

      //console.log(macroStringArray[messageInputIndex]);
      for (var controllerObjectIndex = 0; controllerObjectIndex < controllerObject.length; controllerObjectIndex++) {
        //console.log(controllerObjectIndex + " " + controllerState[controllerObjectIndex]);
        //console.log(controllerObjectIndex + " " + controllerState.length);
        controllerState.push(false);
        //console.log(controllerObjectIndex + " " + controllerState[controllerObjectIndex]);
        //console.log(controllerObjectIndex + " " + controllerState.length);
        //controllerObject[0].input_alias[0]
        for (var controllerAliasIndex = 0; controllerAliasIndex < controllerObject[controllerObjectIndex].input_alias.length; controllerAliasIndex++) {
          //console.log(controllerObject[controllerObjectIndex].input_alias.length);
          lowerCaseMessage = processedMessage.toLowerCase();
          //lowerCaseMessage = macroStringArray[messageInputIndex].toLowerCase();
          lowerCaseCommand = controllerObject[controllerObjectIndex].input_alias[controllerAliasIndex].toLowerCase();
          if (lowerCaseMessage != lowerCaseCommand) {
            //hasInvalidMacroInput = true;
            // If there is at least one invalid, no matter where, entire input combo should be discarded(?????? is this a good idea?)
            // Or I can compare inputsUsed to the amount of possible inputs in macroStringArray, if inputsUsed is less than macroStringArray, then discard it completely
            // If it is equals macroStringArray, then use it
            //console.log("Invalid command");
            //console.log("Command at " + messageInputIndex + " " + lowerCaseMessage + " does not match alias at index " + controllerObjectIndex + " " + lowerCaseCommand);
          }
          if (lowerCaseMessage == lowerCaseCommand) {
            //console.log(new Date().toISOString() + " [MACRO INPUT] matched at controllerObjectIndex " + controllerObjectIndex + " messageInputIndex " + messageInputIndex + " controllerAliasIndex " + controllerAliasIndex + " " + controllerObject[controllerObjectIndex].input_alias[controllerAliasIndex]);
            didMacroInputMatch = true;
            //console.log("Command at " + messageInputIndex + " " + lowerCaseMessage + " matches alias at index " + controllerObjectIndex + " " + lowerCaseCommand);
            //controllerState[controllerObjectIndex] = true;
            //console.log(controllerObjectIndex + " " + controllerState[controllerObjectIndex]);
            //console.log("Valid command");
            //console.log("controllerObjectIndex:" + controllerObjectIndex + " controllerAliasIndex:" + controllerAliasIndex + " " + controllerObject[controllerObjectIndex].input_alias[controllerAliasIndex]);
            let rawInputValueUsed = controllerObject[controllerObjectIndex].input_value;
            rawInputValueUsed = rawInputValueUsed.replace(/(0x)+/ig, "");
            rawInputValueUsed = rawInputValueUsed.replace(/L+/ig, "");
            let hex = Uint8Array.from(Buffer.from(rawInputValueUsed, "hex"));
            //console.log(hex[0])
            // dataToWrite = [0x01, 0x00, 0x00, 0x7F, 0x7F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x85, 0x01];
            //console.log(hex);
            //var backToHexString = Buffer.from(hex).toString("hex");
            if (controllerConfig.default_duration_per_precision_input_millis != macroInputDelay) {
              inputDelay = macroInputDelay;
            }
            if (controllerConfig.default_duration_per_precision_input_millis == macroInputDelay) {
              inputDelay = (setHold == true) ? controllerConfig.held_duration_per_precision_input_millis : macroInputDelay;
            }
            //inputDelay = (setHold == true) ? controllerConfig.held_delay : macroInputDelay;
            //inputDelay = macroInputDelay;
            processedMacroInputDelay = inputDelay;
            //console.log("inputDelay = " + inputDelay);

            //inputDelay = 200;
            inputDelayHigh = (inputDelay & 0x0000ff00) >> 8;
            inputDelayLow = (inputDelay & 0x000000ff);
            //console.log(inputDelay);
            //console.log(inputDelayHigh);
            //console.log(inputDelayLow);
            dataToWrite[9] = inputDelayHigh;
            dataToWrite[10] = inputDelayLow;
            //console.log(backToHexString);
            //console.log(controllerObject[controllerObjectIndex].is_blacklisted);
            if (controllerState[controllerObjectIndex] == false) {
              if (inputsUsed < precisionInputsAllowed) {
                inputString = inputString.concat(controllerObject[controllerObjectIndex].input_name + "+");
              }
            }
            //console.log(inputString);
            if (controllerObject[controllerObjectIndex].is_blacklisted == false) {
              if (inputsUsed < precisionInputsAllowed) {
                if (controllerState[controllerObjectIndex] == true) {
                  //console.log("Input used, ignoring");
                }
                if (controllerState[controllerObjectIndex] != true) {
                  //console.log("Input not used");
                  //console.log(controllerObject[controllerObjectIndex].input_value);
                  //console.log(controllerObject[controllerObjectIndex].opposite_input_value);
                  //console.log(controllerObject[controllerObjectIndex].has_opposite);
                  if (controllerObject[controllerObjectIndex].has_opposite == true) {
                    for (var controllerObjectIndex2 = 0; controllerObjectIndex2 < controllerObject.length; controllerObjectIndex2++) {
                      if (controllerObject[controllerObjectIndex].input_value == controllerObject[controllerObjectIndex2].opposite_input_value) {
                        controllerState[controllerObjectIndex2] = true;
                        //console.log("is opposite? " + controllerObjectIndex + " " + controllerObjectIndex2 + " " + controllerObject[controllerObjectIndex2].input_value + " " + controllerObject[controllerObjectIndex2].opposite_input_value);
                        // the code above is ugly but it marks the opposite inputs, eg: up and down, as not being usable when one of the inputs on the same axis was already used, so the other input will be ignored, this is useful for analogs, which can't be pressed up and down at the same time, but also useful for dpads, which can technically be pressed up and down at the same time but the controller design should prevent that from happening
                      }
                    }
                  }
                  for (var byteIndex = 0; byteIndex < neutralController.length; byteIndex++) {
                    //console.log(byteIndex + " " + neutralController[byteIndex]);
                    if (neutralController[byteIndex] == 0) {
                      //console.log("Yes");
                      dataToWrite[byteIndex + 1] = hex[byteIndex] + dataToWrite[byteIndex + 1];
                      //console.log(dataToWrite[byteIndex + 1]);
                    }
                    if (neutralController[byteIndex] != 0) {
                      if (neutralController[byteIndex] != hex[byteIndex]) {
                        // Which value should I use for analog limit? 32, 48, 64? (For n64 only?)
                        //console.log(byteIndex + " this byte is different, so it must be analog?");
                        //console.log("adjustableAnalogStickPosition = " + adjustableAnalogStickPosition);
                        //console.log("inputString = " + inputString);
                        let limitedAnalog = (hex[byteIndex] <= controllerConfig.stick_center) ? hex[byteIndex] + controllerConfig.stick_limit : hex[byteIndex] - controllerConfig.stick_limit; // Set to 0 or set to 255 respectively (0 + 0 = 0 OR 255 - 0 = 255)
                        if (adjustableAnalogStickPosition != -1) {
                          // Valid Stick Position
                          //console.log("inputString = " + inputString);
                          inputString = inputString.replace(/[\+\_\|\#\[\]\,\.\s]+$/ig, "");
                          //console.log("inputString = " + inputString);
                          inputString = inputString + ":" + adjustableAnalogStickPosition + "+";
                          //console.log("inputString = " + inputString);
                          limitedAnalog = (hex[byteIndex] <= controllerConfig.stick_center) ? controllerConfig.stick_center - adjustableAnalogStickPosition : controllerConfig.stick_center + adjustableAnalogStickPosition;
                          //console.log("limitedAnalog = " + limitedAnalog);
                        }
                        if (adjustableAnalogStickPosition == -1) {
                          // Invalid Stick Position
                          limitedAnalog = (hex[byteIndex] <= controllerConfig.stick_center) ? hex[byteIndex] + controllerConfig.stick_limit : hex[byteIndex] - controllerConfig.stick_limit;
                        }
                        //console.log("limitedAnalog = " + limitedAnalog);
                        //console.log("adjustableAnalogStickPosition = " + adjustableAnalogStickPosition);
                        //let customAnalog = 0;
                        //console.log("limitedAnalog: " + limitedAnalog);
                        //console.log("HOLD ON: " + byteIndex + " " + hex[byteIndex] + " " + neutralController[byteIndex]);
                        dataToWrite[byteIndex + 1] = limitedAnalog;
                      }
                      //console.log("No");
                      //dataToWrite[byteIndex + 1] = hex[byteIndex];
                    }
                  }
                  controllerState[controllerObjectIndex] = true;
                  inputsUsed++;
                  //console.log("Inputs used: " + inputsUsed);
                }
              }
            }
            /*
            dataToWrite[1] = hex[0];
            dataToWrite[2] = hex[1];
            dataToWrite[3] = hex[2];
            dataToWrite[4] = hex[3];
            dataToWrite[5] = hex[4];
            dataToWrite[6] = hex[5];
            dataToWrite[7] = hex[6];
            dataToWrite[8] = hex[7];
            */
            //writeToPort(dataToWrite);
          }
          if (lowerCaseMessage != lowerCaseCommand) {
            //console.log("Invalid command");
          }
          //console.log("controllerObjectIndex:" + controllerObjectIndex + " controllerAliasIndex:" + controllerAliasIndex + " " + controllerObject[controllerObjectIndex].input_alias[controllerAliasIndex]);
        }
      }
      if (didMacroInputMatch == false) {
        //isValidInput = false;
        hasInvalidMacroInput = true;
      }
      /*
      if (didMacroInputMatch == true) {
        //
        hasInvalidMacroInput = false;
      }
      */
    }
    if (inputsUsed > 0) {
      let isBlacklistedCombo = false;
      //console.log(new Date().toISOString() + " inputsUsed = " + inputsUsed);
      //console.log(controllerConfig.blacklisted_combos.length);
      for (let blacklistedComboIndex = 0; blacklistedComboIndex < controllerConfig.blacklisted_combos.length; blacklistedComboIndex++) {
        let blacklistedComboInputComponentCount = 0;
        //console.log("controllerConfig.blacklisted_combos[blacklistedComboIndex].blacklisted_combo_input_size = " + controllerConfig.blacklisted_combos[blacklistedComboIndex].blacklisted_combo_input_size);
        //if (inputsUsed == controllerConfig.blacklisted_combos[blacklistedComboIndex].blacklisted_combo_input_size)
        {
          //console.log("YES");
          //console.log("blacklistedComboIndex = " + blacklistedComboIndex);
          //console.log("controllerConfig.blacklisted_combos[blacklistedComboIndex].blacklisted_combo_input_size = " + controllerConfig.blacklisted_combos[blacklistedComboIndex].blacklisted_combo_input_size);
          for (let blacklistedComboInputComponentIndex = 0; blacklistedComboInputComponentIndex < controllerConfig.blacklisted_combos[blacklistedComboIndex].blacklisted_combo_input_components.length; blacklistedComboInputComponentIndex++) {
            //console.log("blacklistedComboInputComponentIndex = " + blacklistedComboInputComponentIndex);
            //console.log(controllerConfig.blacklisted_combos[blacklistedComboIndex].blacklisted_combo_input_components[blacklistedComboInputComponentIndex]);
            let blacklistedComboInputComponentInputValue = controllerConfig.blacklisted_combos[blacklistedComboIndex].blacklisted_combo_input_components[blacklistedComboInputComponentIndex].component_input_value;
            blacklistedComboInputComponentInputValue = blacklistedComboInputComponentInputValue.replace(/(0x)+/ig, "");
            blacklistedComboInputComponentInputValue = blacklistedComboInputComponentInputValue.replace(/L+/ig, "");
            blacklistedComboInputComponentInputValue = blacklistedComboInputComponentInputValue.replace(/#+/ig, "");
            //console.log("blacklistedComboInputComponentInputValue = " + blacklistedComboInputComponentInputValue);
            blacklistedComboInputComponentInputValue = Uint8Array.from(Buffer.from(blacklistedComboInputComponentInputValue, "hex"));
            //console.log("blacklistedComboInputComponentInputValue = " + blacklistedComboInputComponentInputValue);
            //console.log(blacklistedComboInputComponentInputValue);
            for (var controllerObjectIndex3 = 0; controllerObjectIndex3 < controllerObject.length; controllerObjectIndex3++) {
              if (controllerState[controllerObjectIndex3] == true) {
                //console.log("USED INPUT");
                //console.log(controllerObject[controllerObjectIndex3].input_name);
                let blacklistedComboInputComponentInputValueToCompareTo = controllerObject[controllerObjectIndex3].input_value;
                blacklistedComboInputComponentInputValueToCompareTo = blacklistedComboInputComponentInputValueToCompareTo.replace(/(0x)+/ig, "");
                blacklistedComboInputComponentInputValueToCompareTo = blacklistedComboInputComponentInputValueToCompareTo.replace(/L+/ig, "");
                blacklistedComboInputComponentInputValueToCompareTo = blacklistedComboInputComponentInputValueToCompareTo.replace(/#+/ig, "");
                blacklistedComboInputComponentInputValueToCompareTo = Uint8Array.from(Buffer.from(blacklistedComboInputComponentInputValueToCompareTo, "hex"));
                let blacklistedComboInputMatchCount = 0;
                for (var blacklistedComboInputValueIndex = 0; blacklistedComboInputValueIndex < blacklistedComboInputComponentInputValueToCompareTo.length; blacklistedComboInputValueIndex++) {
                  if (blacklistedComboInputComponentInputValueToCompareTo[blacklistedComboInputValueIndex] == blacklistedComboInputComponentInputValue[blacklistedComboInputValueIndex]) {
                    blacklistedComboInputMatchCount++;
                    //console.log("blacklistedComboInputMatchCount " + blacklistedComboInputMatchCount);
                    //console.log(" YES " + blacklistedComboInputComponentInputValueToCompareTo[blacklistedComboInputValueIndex] + " " + blacklistedComboInputComponentInputValue[blacklistedComboInputValueIndex] + " AT INDEX " + blacklistedComboInputValueIndex);
                  }
                }
                if (blacklistedComboInputMatchCount == blacklistedComboInputComponentInputValueToCompareTo.length) {
                  /*
                  console.log(controllerObjectIndex3);
                  console.log(blacklistedComboInputComponentIndex);
                  console.log(blacklistedComboIndex);
                  console.log("WE FOUND A BLACKLISTED INPUT!!!!!!!!!!");
                  console.log(controllerObject[controllerObjectIndex3].input_name);
                  */
                  blacklistedComboInputComponentCount++;
                }
              }
              //console.log(blacklistedComboInputComponentCount);
              //console.log("controllerObjectIndex3 = " + controllerObjectIndex3);
              //console.log(blacklistedComboInputComponentInputValueToCompareTo);
            }
            //console.log(blacklistedComboInputComponentCount);
          }
        }
        //if (inputsUsed != controllerConfig.blacklisted_combos[blacklistedComboIndex].blacklisted_combo_input_size) {
        //console.log("NO");
        //}
        //console.log("blacklistedComboIndex = " + blacklistedComboIndex);
        //console.log(controllerConfig.blacklisted_combos[blacklistedComboIndex]);
        //console.log(controllerConfig.blacklisted_combos[blacklistedComboIndex]);
        //console.log(controllerConfig.blacklisted_combos[blacklistedComboIndex].blacklisted_combo_input_string);
        //console.log(controllerConfig.blacklisted_combos[blacklistedComboIndex].blacklisted_combo_input_description);
        //console.log(controllerConfig.blacklisted_combos[blacklistedComboIndex].blacklisted_combo_input_components.length);
        //console.log(blacklistedComboInputComponentCount);
        if (blacklistedComboInputComponentCount == controllerConfig.blacklisted_combos[blacklistedComboIndex].blacklisted_combo_input_components.length) {
          //console.log("BLACKLISTED COMBO????????????");
          //console.log(controllerConfig.blacklisted_combos[blacklistedComboIndex]);
          //console.log(controllerConfig.blacklisted_combos[blacklistedComboIndex].blacklisted_combo_input_components.length);
          //console.log(blacklistedComboInputComponentCount);
          isBlacklistedCombo = true;
        }
        //console.log(blacklistedComboInputComponentCount);
      }
      //console.log("isBlacklistedCombo = " + isBlacklistedCombo);
      // if (inputsUsed == messageInputs.length)
      if (isBlacklistedCombo == true) {
        //isValidInput = false;
        //console.log(new Date().toISOString() + " Blacklisted combos detected, dropping input!");
      }
      // if (inputsUsed == macroStringArray.length)
      //if (isBlacklistedCombo == false)
      {
        inputString = inputString.replace(/[\+\_\|\#\[\]\,\.\s]+$/ig, "");
        if (controllerConfig.default_duration_per_precision_input_millis != macroInputDelay) {
          //
        }
        if (controllerConfig.default_duration_per_precision_input_millis == macroInputDelay) {
          inputString = (setHold == true) ? inputString.concat("") : inputString.concat("");
        }
        //inputString = (setHold == true) ? inputString.concat("-") : inputString.concat("");
        //console.log(inputString);
        processedMacroInputString = inputString;
        //console.log(new Date().toISOString() + " [SERIAL PORT] dataToWrite");
        //console.log(dataToWrite);
        //isValidInput = true;
        //
        if (hasInvalidMacroInput == false && isBlacklistedCombo == false) {
          isValidInput = true;
        }
        if (hasInvalidMacroInput == true || isBlacklistedCombo == true) {
          isValidInput = false;
        }
        //console.log(new Date().toISOString() + " isValidInput = " + isValidInput);
        if (isValidInput == true) {
          if (sendToArduino == true) {

            // Clear the incoming serial data from arduino before setting any input in the input chain
            port.flush(function(err, results) {
              if (err) {
                if (client.readyState() === "OPEN") {
                  if (chatConfig.send_debug_channel_messages == true) {
                    let randomColorName = Math.floor(Math.random() * defaultColors.length);
                    client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
                    client.action(chatConfig.debug_channel, new Date().toISOString() + " [SERIAL PORT] Failed to flush port com_port=" + controllerConfig.com_port + ", com_port_parameters=" + JSON.stringify(controllerConfig.com_port_parameters) + ", err.message=" + err.message);
                  }
                }
                return console.log(err);
              }
              //console.log(new Date().toISOString() + " flush results " + results);
            });
            port.drain(function(err, results) {
              if (err) {
                if (client.readyState() === "OPEN") {
                  if (chatConfig.send_debug_channel_messages == true) {
                    let randomColorName = Math.floor(Math.random() * defaultColors.length);
                    client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
                    client.action(chatConfig.debug_channel, new Date().toISOString() + " [SERIAL PORT] Failed to drain port com_port=" + controllerConfig.com_port + ", com_port_parameters=" + JSON.stringify(controllerConfig.com_port_parameters) + ", err.message=" + err.message);
                  }
                }
                return console.log(err);
              }
              //console.log(new Date().toISOString() + " drain results " + results);
            });

            port.write(dataToWrite, function(err) {
              if (err) {
                if (client.readyState() === "OPEN") {
                  if (chatConfig.send_debug_channel_messages == true) {
                    let randomColorName = Math.floor(Math.random() * defaultColors.length);
                    client.say(chatConfig.debug_channel, ".color " + defaultColorNames[randomColorName]);
                    client.action(chatConfig.debug_channel, new Date().toISOString() + " [SERIAL PORT] Failed to write to port com_port=" + controllerConfig.com_port + ", com_port_parameters=" + JSON.stringify(controllerConfig.com_port_parameters) + ", err.message=" + err.message);
                  }
                }
                return console.log("Error on write: " + err.message);
              }
            });
          }
        }
        //console.log(usernameToPing + " " + inputString);
        //inputQueue.push(dataToWrite);
        /*
        inputQueue.push({
          username_to_display: usernameToPing,
          username: username,
          display_name: displayName,
          user_color: userColor,
          user_color_inverted: userColorInverted,
          is_tts: false,
          message: message,
          tts_message: "",
          controller_data: dataToWrite,
          input_string: inputString,
          input_index: currentInputInQueue,
          message_id: messageId,
          user_id: userId
        });
        io.sockets.emit("input_data", inputQueue[currentInputInQueue]);
        */
        //console.log(inputQueue[currentInputInQueue]);
      }
      //writeToPort(dataToWrite, currentInputInQueue);
    }
  }
  //writeToPort(dataToWrite, currentInputInQueue);
  /*
  console.log(target);
  console.log(tags);
  console.log(message);
  console.log(self);
  */
  /*
  if (tags["custom-reward-id"] != undefined) {
    console.log("yep, that's a custom reward");
  }
  if (tags["custom-reward-id"] == undefined) {
    console.log("this is not a custom reward");
  }
  */
  return {
    is_valid_input: isValidInput,
    processed_macro_input_string: processedMacroInputString,
    processed_macro_input_delay: processedMacroInputDelay,
    input_data: dataToWrite
  };
}
