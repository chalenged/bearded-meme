/**
  * Copyright (C) 2015 Chalenged
  * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version.
  *
  * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
  *
  * You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
options = require("./options.json");
//irc = require("irc");
twitchirc = require("twitch-irc");
fs = require("fs");


bot = new twitchirc.client(options); //global so modules can access the bot, to make it say things, do actions, etc.


bot.connect();

String.prototype.getIndexes = function(arg) {//returns an array of indexes the arg appears
    var indexes = [];
    var text = this;
    var count = 0;
    var index = text.indexOf(arg);
    while (index > -1) {
        text = text.substr(index+1);
        count += index;
        indexes.push(count);
        count++;
        index = text.indexOf(arg);
    }
    return indexes;
};

preferences = {};

assertFolder = function(folder) {
    fs.mkdir(folder, function(err) {
        if (!err) return;
        if (err.code != "EEXIST") //if the error was something other than the folder already existing
            console.log("Error while making " + folder + " folder: " + err);
    });
};

assertFolder("./modules"); //make sure modules exists
assertFolder("./misc");

var availableModules = fs.readdirSync("./modules/");//synchronous to ensure modules are loaded before bot starts

//console.log(availableModules);
function readPreferences() {
    var channel = "#global";
    preferences[channel] = {};
    var fail = false;
    try {
        var data = fs.readFileSync('./Preferences.txt', {encoding: 'utf8'}); //we want preferences loaded before things are set up, so load them synchronously
    } catch(err) {
        if (err.code === "ENOENT") fail = true; //no preferences file, none loaded
        else throw err; //some other readFile error
    }
    if (fail) {
        console.log("Preferences.txt file not found (no modules will be loaded!)");
        return; //can't read preferences if the file doesn't exist
    }
    data = data.replace(/\r/g, ""); //remove carriage returns
    var prefs = data.split("\n"); //splits for each line
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
    console.log("Preferences successfully loaded");
}
readPreferences();

var modulesToLoad = [];
modules = {};
function loadModules() {
    if (preferences["#global"]["modules"]) { //finds requested modules
        var modulesToUse = preferences["#global"]["modules"].split(" ");
        for (var i = 0; i < modulesToUse.length; i++) {
            var mod = modulesToUse[i] + ".js";
            var found = false;
            for (var j = 0; j < availableModules.length; j++) {
                var avMod = availableModules[j];

                if (avMod.toLowerCase() === mod.toLowerCase()) {
                    found = true;
                    modulesToLoad.push(avMod);
                }
            }
            if (!found) throw "Error loading module " + mod + ": Module not found";
        }
    }
    if (modulesToLoad.length > 0) console.log("Loading modules: ", modulesToLoad.join(", ").replace( /.js/g, ""));

    for (var i = 0; i < modulesToLoad.length; i++) {
        var module = modulesToLoad[i];
        //console.log(this);
        modules[module.substring(0, module.length-3)] = require("./modules/" + module);
    }

}
loadModules();

function checkModuleRequirements() {
    for (var x in modules) {
        if (!modules[x].hasOwnProperty("requirements")) continue; //if no requirements, move to next module
        for (var i = 0; i < modules[x].requirements.length; i++) {
            var found = false;
            var moduleList = Object.keys(modules);
            for (var j = 0; j < moduleList.length; j++) {
                if (moduleList[j].toLowerCase() === modules[x].requirements[i].toLowerCase() || modules[x].requirements[i].charAt(0) === "!") found = true;
                if (modules[x].requirements[i].charAt(0) === "!") {
                    if (moduleList[j].toLowerCase() === modules[x].requirements[i].substr(1).toLowerCase()) {
                        var err = "Error loading module " + x + ": incompatable with " + modules[x].requirements[i].substr(1);
                        console.log(err);
                        throw err;
                    }
                }
            }
            if (!found) {
                    var err = "Error loading module " + x + ": Requires " + modules[x].requirements[i];
                    console.log(err);
                    throw err;
            }
        }
    }
}
checkModuleRequirements();

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

getPreference = function(preference, channel, defaultValue) { //global function, modules need this function
    if (preferences[channel].hasOwnProperty(preference)) return preferences[channel][preference];
    if (preferences["#global"].hasOwnProperty(preference)) return preferences["#global"][preference];
    else return defaultValue;
};


function setupModules() {
    var priorityList = modulePriorityList();
    if (priorityList.length === 0) return; //no reason to try loading modules that don't exist
    console.log("Setting up modules...");
    for (var i = 0; i < priorityList.length; i++) { //setup modules in order of priority
        if (modules[priorityList[i]].hasOwnProperty("setup")) modules[priorityList[i]].setup(this);
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

runModules = function(func) {
    //console.log(priorityList);
    //this[func].apply(this, Array.prototype.slice.call(arguments, 1));
    var priorityList = modulePriorityList();
    for (var i = 0; i < priorityList.length; i++) {
        if (Number(getPreference("debugLevel", "#global", "0")) > 1) console.log("Running " + func + " on module" + priorityList[i]);
        if (modules[priorityList[i]].hasOwnProperty(func)) modules[priorityList[i]][func].apply(modules[priorityList[i]], Array.prototype.slice.call(arguments, 1));
    }
};
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





bot.addListener('chat', function (channel, user, message) {
    //console.log(user.username + ": " + message);
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