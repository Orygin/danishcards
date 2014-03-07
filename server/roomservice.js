var room = require('./gameRoom/room');

function roomService() {
	this.io = {};
	this.accountManager = {};

	this.rcon = 'sauce';

	this.playingRooms = [];

	this.roomDelay = 60*1000; // check every 60 seconds
	setTimeout(this.think, this.roomDelay, this);
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
roomService.prototype.think = function(self) {
	for(var r in self.playingRooms) // Remove empty rooms
	{
		var ro = self.playingRooms[r];
		if(ro === undefined)
			continue;

		if(ro.playerManager.getPlayers().length == 0){
			ro.remove();
			self.playingRooms[r] = undefined;
		}
	}

	setTimeout(self.think, self.roomDelay, self);
};
roomService.prototype.joinLounge = function(socket, name) {
	var ret = {};
    ret.player = require('./accountManager').getAccount(name);
    ret.rooms = this.getRoomsInfos();
    socket.emit('join lounge', ret);
};
roomService.prototype.getRoomsInfos = function() {
	var ret = [], i = 0;
	for(var r in this.playingRooms)
	{
		var ro = this.playingRooms[r];
		if(ro === undefined)
			continue;
		
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
roomService.prototype.leaveRoom = function(socket, name) {
	var room = this.playingRooms[name];

	if(room === undefined)
		return false;
	
	room.playerLeave(socket);

	this.joinLounge(socket, socket.name);
};
module.exports = new roomService();