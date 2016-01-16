var BaseClass = require('../gameRoom/room'),
	gameRules = require('./danishGameRules'),
	playerManager = require('./playerManager');
	const util = require('util');

var room = function (data, roomService) {
	BaseClass.call(this,data, roomService);
};
util.inherits(room, BaseClass);

room.prototype.getGameRules = function() {
	return new gameRules(this);
};
room.prototype.getPlayerManager = function () {
	return new playerManager(this);
}
room.prototype.postInit = function() {
};

module.exports = room;