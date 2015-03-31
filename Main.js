/**
 * Created by Chalenged on 3/26/2015.
 */
var settings = require("./settings.json");
var options = require("./options.json");
//irc = require("irc");
twitchirc = require("twitch-irc");
fs = require("fs");



preferences = {};

assertFolder = function(folder) {
    fs.mkdir(folder, function(err) {
        if (!err) return;
        if (err.code != "EEXIST") //if the error was something other than the folder already existing
            console.log("Error while making " + folder + " folder: " + err);
    });
};

assertFolder("./modules"); //make sure modules exists

var availableModules = fs.readdirSync("./modules/", function(err) { //synchronous to ensure modules are loaded before bot starts
    if (err) throw err;
});

//console.log(availableModules);
function readPreferences() {
    var data = fs.readFileSync('./Preferences.txt', {encoding: 'utf8'}); //we want preferences loaded before things are set up, so load them synchronously
    data = data.replace(/\r/g, ""); //remove carriage returns
    var prefs = data.split("\n"); //splits for each line
    var channel = "#global";
    preferences[channel] = {};
    for (var i = 0; i < prefs.length; i++) { //operate on each line
        var line = prefs[i]; //easy reference
        if (!line) continue;
        if (line.charAt(0) === '#') {
            channel = line;
            preferences[channel] = {};
            continue;
        }
        var index = line.indexOf(" "); //separator index
        if (index === -1) {
            var err = "Improperly formatted preferences file on line " + (Number(i) + 1) + ": No space";
            throw err;
        }
        var end = line.indexOf("//"); //finds comments
        if (end === -1) end = data.length; //end of line if no comments
        preferences[channel][line.substring(0, index)] = line.substring(index + 1, end); //adds to preferences object
    }
    console.log("preferences successfully loaded");
}
readPreferences();

var modulesToLoad = [];
modules = {};
function loadModules() {
    if (preferences["#global"]["modules"]) { //finds requested modules
        var modulesToUse = preferences["#global"]["modules"].split(" ");
        for (var i = 0; i < modulesToUse.length; i++) {
            var mod = modulesToUse[i] + ".js";
            //mod = new RegExp(mod + ".js", "i");
            var found = false;
            var modFile = "";
            for (var j = 0; j < availableModules.length; j++) {
                var avMod = availableModules[j];

                if (avMod.toLowerCase() === mod.toLowerCase()) {
                    //console.log(avMod.toLowerCase(), mod.toLowerCase());
                    //throw "Error loading module " + mod + ": Module not found";
                    found = true;
                    modulesToLoad.push(avMod);
                }
            }
            if (!found) throw "Error loading module " + mod + ": Module not found";
            //if (availableModules.indexOf(new RegExp(mod + ".js", "i")) === -1) {
            //    throw "Error loading module " + mod + ": Module not found";
            //}
        }
    }
    console.log("Loading modules: ", modulesToLoad.join(", ").replace( /.js/g, ""));

    for (var i = 0; i < modulesToLoad.length; i++) {
        var module = modulesToLoad[i];
        //console.log(this);
        modules[module.substring(0, module.length-3)] = require("./modules/" + module);
    }

}
loadModules();
/*
bot = new irc.Client(settings.server, settings.nick, {
    channels: [settings.channels + " " + settings.password],
    debug: false,
    password: settings.password,
    username: settings.nick
});

bot.addListener("join", function (channel, who) {
    if(who === settings.nick){
        console.log("Bot successfully joined channel " + channel);
    }
    else {
        //console.log(who + " joined the chat!");
        //var mes = "Welcome to the channel, " + who + "!";
        //bot.say(settings.channels[0], mes);
    }
});
*/

getPreference = function(preference, channel, defaultValue) {
    if (preferences[channel].hasOwnProperty(preference)) return preferences[channel][preference];
    if (preferences["global"].hasOwnProperty(preference)) return preferences["global"][preference];
    else return defaultValue;
};


function setupModules() {
    console.log("Setting up modules...");
    var priorityList = modulePriorityList();
    for (var i = 0; i < priorityList.length; i++) {
        if (modules[priorityList[i]].hasOwnProperty("setup")) modules[priorityList[i]].setup();
    }
}
setupModules();

function modulePriorityList() {
    return Object.keys(modules).sort(function(a, b) {   //sorts modules based on priority level
        if (!modules[b].hasOwnProperty("priority")) modules[b].priority = 0; //defaults to 0 priority
        if (!modules[a].hasOwnProperty("priority")) modules[a].priority = 0;
        return modules[b].priority - modules[a].priority ;          //higher priority objects get ran first
    });                                                             //same priority shouldn't matter the order. If it does, the priorities should be changed
}

function runModules(func) {
    //console.log(priorityList);
    //this[func].apply(this, Array.prototype.slice.call(arguments, 1));
    var priorityList = modulePriorityList();
    for (var i = 0; i < priorityList.length; i++) {
        if (modules[priorityList[i]].hasOwnProperty(func)) modules[priorityList[i]][func].apply(this, Array.prototype.slice.call(arguments, 1));
    }
}
//runModules();
/*
for (var x in settings.channels) {
    var channel = settings.channels[x];
    try {
        bot.addListener("message" + channel, function (nick, to, text, message) {
            //bot.say("#chalenged", to);
            //console.log(text);
            var chan = text.args[0];
            //if (nick === "twitchnotify" && chan === "#cirno_tv") {
            //    //twitchnotify: potatohandle subscribed for 17 months in a row!
            //    //var months = to.indexOf("for") + 4;
            //    //console.log(months);
            //    console.log(to);
            //    var subber = to.split(" ")[0];
            //    if (to.indexOf("for") === -1) {
            //        bot.say(chan, "cirFairy cirMini Welcome to the Baka Brigade, " + subber + "! cirMini cirFairy");
            //    } else {
            //        var months = to.split("for ")[1].split(" months")[0];
            //        bot.say(chan, "cirFairy cirMini Welcome back to the Baka Brigade, " + subber + "! " + months + " months! cirMini cirFairy");
            //    }
            //    //bot.say(chan, "cirMini");
            //}

             //if (messages[chan][nick].length >= 2 && messages[chan][nick][0].split(messages[chan][nick][1]).length === 3) {
                //console.log(nick + " is trying to pyramid!");
             //}
             //if (messages[chan][nick].length >= 2 && messages[chan][nick][0].split(messages[chan][nick][2]).length === 4) {
                 //if (pyramidBlock && nick != "chalenged") bot.say(chan, "cirMini");
                 //console.log(nick + " is trying to pyramid even more!");
             //}
            runModules("onMessage", nick, to, chan, text);
        });
    } catch (err) {
        console.log("Error adding message listener: " + err);
    }
}

bot.addListener("raw", function(message) {
    console.log(message);
});
*/

bot = new twitchirc.client(options);

bot.connect();

getRank = function(user) {
    if (user.special.indexOf("broadcaster") > -1) return 3;
    if (user.special.indexOf("mod") > -1) return 2;
    if (user.special.indexOf("subscriber") > -1) return 1;
    else return 0;
};

bot.addListener('chat', function (channel, user, message) {
    console.log(user.username + ": " + message);
    runModules("onMessage", user, message, channel);
});
/*
process.stdin.setEncoding('utf8');

process.stdin.on('readable', function() {
    var chunk = process.stdin.read();
    if (chunk !== null) {
        console.log(eval(chunk));
    }
});
*/