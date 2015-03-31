/**
 * Created by Chalenged on 3/30/2015.
 */

exports.setup = function() {
    messages = {};
    assertFolder("./logs");
    logMessage = function (user, message, channel) {
        //console.log((getPreference("log", "#cirno_tv", true) === "0"));
        if (!messages[channel]) messages[channel] = {};
        if (!messages[channel][user.username]) messages[channel][user.username] = [];
        if (messages[channel][user.username].length > 10) messages[channel][user.username].pop();
        messages[channel][user.username].unshift(message);
        if (getPreference("log", channel, "true") === "false") return;
        fs.appendFile("./logs/" + channel.substr(1) + ".txt", user.username + ": " + message + "\r\n", function (err) {
            if (err) throw err;
        });
    };
};

exports.onMessage = function(user, message, channel) {
    logMessage(user, message, channel);
};