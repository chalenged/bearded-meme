/**
 * Created by Chalenged on 3/30/2015.
 */

/*
 * Commands structure is as follows:
 * commands.commandName = {"command": function(user, message, channel) {
 *   return "message to say";
 * },
 * "rank": <rank>;//rank is a numeric from 0-3. 0=regular, 1=subscriber, 2=moderator, 3=broadcaster
 * };
 * using the "this" keyword in a command represents the command object
 * */


exports.setup = function() {
    commands = {}; //global object for commands

    getRank = function(user) { //allows commands to easily get ranks
        if (user.special.indexOf("broadcaster") > -1) return 3;
        if (user.special.indexOf("mod") > -1) return 2;
        if (user.special.indexOf("subscriber") > -1) return 1;
        else return 0;
    };

    readRank = function(rank) {
        rank = String(rank);
        rank = rank.trim();
        if ("0123".indexOf(rank) > -1) rank = "rsmb"["0123".indexOf(rank)];
        var text = "";
        switch (rank) {
            case "r": text = "r (regular)"; break;
            case "s": text = "s (subscriber)"; break;
            case "m": text = "m (mod)"; break;
            case "b": text = "b (broadcaster)"; break;
            default: console.log("Error determining rank from \"" + rank + "\""); text = "undetermined"; break;
        }
        return text;
    }
};

exports.onMessage = function(user, message, channel) {
    //console.log(user);
    var commandCharacters = getPreference("commandCharacters", channel, "!");
    var found = false;
    console.log("command characters: "  + commandCharacters);
    if (commandCharacters.indexOf(message.charAt(0)) > -1) {
        var index = message.indexOf(" ");
        if (index === -1) index = message.length + 1;
        var command = message.substring(1, index);
        if (commands.hasOwnProperty(command)) {
            if (!commands[command].hasOwnProperty("rank")) {
                commands[command].rank = 0;
                console.log("Command " + command + " had no rank set, defaulting to 0 (regular)");
            }
            if (commands[command].rank <= getRank(user)) {
                if (!commands[command].hasOwnProperty("command")) {
                    console.log("Command object " + command + " found, but has no command function.");
                } else {
                    commands[command].command(user, message, channel);
                    found = true;
                }
            }
        }
    }
    if (!found) runModules("customCommand", user, message, channel); //won't fail if customCommands isn't loaded, but shouldn't affect other modules regardless
};

exports.priority = 10; //since any module that adds commands needs to run after commands is loaded, commands gets a high priority