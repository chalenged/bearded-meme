/**
 * Created by Chalenged on 3/30/2015.
 */

exports.setup = function() {
    this.count = {};
    var self = this;
    commands.example = function(user, message, channel) {
        bot.say(channel, "Hello, " + user.username + "! This is an example command!");
    };
    commands.count = function(user, message, channel) {
        if (!self.count[channel]) self.count[channel] = 0;
        self.count[channel]++;
        bot.say(channel, "This command has been used " + self.count[channel] + " times!");
    };
};

exports.requirements = ["commands", "!incompatablemodule"];