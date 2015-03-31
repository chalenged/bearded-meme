/**
 * Created by Chalenged on 3/30/2015.
 */

/*
* Commands structure is as follows:
* commandName: function(user, message, channel) {
*   return "message to say";
* }
* */


exports.setup = function() {
    commands = {}; //global object for commands
    //commands
};

exports.onMessage = function(user, message, channel) {
    //console.log(user);
    var commandCharacters = getPreference("commandCharacters", channel, "!");
    console.log("command characters: "  + commandCharacters);
    if (commandCharacters.indexOf(message.charAt(0)) > -1) {
        var index = message.indexOf(" ");
        if (index === -1) index = message.length + 1;
        var command = message.substring(1, index);
        if (commands.hasOwnProperty(command)) commands[command](user, message, channel);
        //console.log(command);
    }
};

exports.priority = 10; //since any module that adds commands needs to run after commands is loaded, commands gets a high priority