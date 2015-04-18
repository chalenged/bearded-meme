/**
 * Created by Chalenged on 4/15/2015.
 */

exports.setup = function() {
    userData = {}; //userData[channel][user] = {};
    userData.userlist = {};
    var self = this;
    bot.addListener('join', function(channel, username) {
        if (!userData.hasOwnProperty(channel)) {
            userData[channel] = {};
            userData[channel].userlist = [];
        }
        if (!userData[channel].hasOwnProperty(username)) {
            userData[channel][username] = {};
            userData[channel][username].joinDate = new Date();
            userData[channel].userlist.push(username);
        }
    });

    bot.addListener('')
};

