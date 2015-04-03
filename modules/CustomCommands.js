/**
 * Created by Chalenged on 3/31/2015.
 */

exports.setup = function() {
    this.customCommands = {};
    var self = this;
    fs.readFile("./misc/commands.txt", {"encoding": "utf8"}, function(err, data) {
        if (err) throw err;
        data = data.replace(/\r/g, "");
        var file = data.split("\n");
        for (var i = 0; i < file.length; i++) {
            var args = file[i].split(" ");
            var channel = args[0];
            var name = args[1];
            var rank = args[2];
            var text = file[i].substr(file[i].getIndexes(" ")[2] + 1);
            var command = {};
            command.rank = rank;
            command.command = text;
            if (!self.customCommands.hasOwnProperty(channel)) self.customCommands[channel] = {};
            self.customCommands[channel][name] = command;
        }
        console.log(self.customCommands);
    });
    commands.addcom = {
        syntax: "addcom <rank r/s/m/b> <command name> <formatted text>",
        command: function(user, message, channel) {
            if (this.rank < 2) {
                console.log("Addcom is not supported on rank lower than 2 (mod).");
                this.rank = 2;
            }
            if (getRank(user) < this.rank) return;//rank checking, just incase
            var indexes = message.getIndexes(" ");
            if (indexes.length < 3) {
                bot.say(channel, "Error adding command. Correct syntax is: " + this.syntax);
                return;
            }
            var rank = message.substring(indexes[0], indexes[1]).trim();
            console.log(rank);
            if ("rsmb0123".indexOf(rank) === -1 || rank.length != 1) {
                bot.say(channel, "Error determining rank. Correct syntax is: " + this.syntax);
                return;
            }
            var name = message.substring(indexes[1], indexes[2]).trim();
            if (!name) return;//edge case
            if (!self.customCommands.hasOwnProperty(channel)) self.customCommands[channel] = {};
            var command = message.substr(indexes[2]).trim();
            if (self.customCommands[channel].hasOwnProperty(name)) {
                var edited = true;
            }
            if ("rsmb".indexOf(rank) > -1) rank = "rsmb".indexOf(rank);
            self.customCommands[channel][name] = {};
            self.customCommands[channel][name].command = command;
            self.customCommands[channel][name].rank = rank;
            bot.say(channel, ((edited) ? ("Edited ") : ("Added ")) + name + " at rank " + readRank(rank) + "!");

            console.log(name + ": " + self.customCommands[channel][name]);
        },
        rank: 2
    }
};

exports.customCommand = function(user, message, channel) {
    var trigger = message.split(" ")[0].toLowerCase();
    var text = message.substr(message.indexOf(" ") + 1);
    var args = text.split(" ");
    if (args[0].toLowerCase() === trigger) args = [];
    //console.log(trigger,text,args);
    //console.log(this);
    if (this.customCommands.hasOwnProperty(channel) && this.customCommands[channel].hasOwnProperty(trigger)) {
        if (this.customCommands[channel][trigger].rank <= getRank(user)) {
            var i = 0;
            text = this.customCommands[channel][trigger].command;
            while (text.indexOf("{arg" + Number(i + 1) + "}") > -1) {
                i++;
                text = text.replace(new RegExp("{arg" + i + "}", "g"), args[i-1]);
                //console.log(text + "//" + i);
            }
            if (i > args.length) return;
            text = text.replace(/\{user}/g, user.username);
            bot.say(channel, text);
        }
    }
};

exports.requirements = ["commands"];