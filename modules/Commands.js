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

    getRank = function(user, channel) { //allows commands to easily get ranks
        if (getPreference("admins", channel, "").indexOf(user.username) > -1 || (preferences["#global"].hasOwnProperty("admins") && preferences["#global"].admins.indexOf(user.username) > -1)) return 5; //admins have highest rank
        if (user.isBroadcaster()) return 4;
        if (user.isMod()) return 3;
        //get voice rank (coming soon!)
        if (user.isSubscriber()) return 1;
        else return 0;
    };

    readRank = function(rank) {
        rank = String(rank);
        rank = rank.trim();
        if ("012345".indexOf(rank) > -1) rank = "rsvmb"["012345".indexOf(rank)];
        var text = "";
        switch (rank) {
            case "r": text = "r (regular)"; break;
            case "s": text = "s (subscriber)"; break;
            case "v": text = "v (voice)"; break;
            case "m": text = "m (mod)"; break;
            case "b": text = "b (broadcaster)"; break;
            case "a": text = "a (admin)"; break;
            default: console.log("Error determining rank from \"" + rank + "\""); text = "undetermined"; break;
        }
        return text;
    }
};

exports.onMessage = function(user, channel, msg, message) {
    //console.log(user);
    var commandCharacters = getPreference("commandCharacters", channel, "!");
    var found = false;
    console.log(user.username, "has rank of", getRank(user));
    //console.log("command characters: "  + commandCharacters);
    if (commandCharacters.indexOf(msg.charAt(0)) > -1) {
        var index = msg.indexOf(" ");
        if (index === -1) index = msg.length + 1;
        var command = msg.substring(1, index);
        if (commands.hasOwnProperty(command)) {
            if (!commands[command].hasOwnProperty("rank")) {
                commands[command].rank = 0;
                console.log("Command " + command + " had no rank set, defaulting to 0 (regular)");
            }
            if (commands[command].rank <= getRank(user, channel)) {
                if (!commands[command].hasOwnProperty("command")) {
                    console.log("Command object " + command + " found, but has no command function.");
                } else {
                    commands[command].command(user, msg, channel);
                    found = true;
                }
            }
        }
    }
    if (!found) runModules("customCommand", user, msg, channel); //won't fail if customCommands isn't loaded, but shouldn't affect other modules regardless
};

exports.priority = 10; //since any module that adds commands needs to run after commands is loaded, commands gets a high priority