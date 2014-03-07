var room = require('./gameRoom/room');

function roomService() {
	this.io = {};
	this.accountManager = {};

	this.rcon = 'sauce';

	this.playingRooms = [];

	this.roomDelay = 60*1000; // check every 60 seconds
	setTimeout(this.watchForEmptyRooms, this.roomDelay);
};

roomService.prototype.createRoom = function(roomName) {
	if(this.getRoom(roomName) !== undefined)
		return false;

	this.playingRooms[roomName] = new room(roomName, this.io);

	return true;
};
roomService.prototype.getRoom = function(roomName) {
	return this.playingRooms[roomName];
};
roomService.prototype.watchForEmptyRooms = function() {
	for(r in this.playingRooms)
	{
		var ro = this.playingRooms[r];
		if(ro.playerManager.getPlayers().length == 0){
			ro.remove();
			this.playingRooms[r] = undefined;
		}
	}

	setTimeout(this.watchForEmptyRooms, this.roomDelay);
};
roomService.prototype.getRoomsInfos = function() {
	var ret = [], i = 0;
	for(r in this.playingRooms)
	{
		var ro = this.playingRooms[r];
		ret[i] = ro.getInfos();
		i++;
	}
	return ret;
};
roomService.prototype.joinRoom = function(socket, name) {
	var room = this.playingRooms[name];

	if(room === undefined)
		return false;

	if(room.canJoin(socket))
		return room.playerJoin(socket);
	else
		return false;
};

module.exports = new roomService();