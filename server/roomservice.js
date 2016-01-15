var room = require('./gameRoom/room');

function roomService() {
	this.io = {};
	this.accountManager = {};

	this.playingRooms = [];
	this.loungePlayers = [];

	this.delay = 60*1000; // check every 60 seconds
	setTimeout(this.think, this.delay, this);
};

roomService.prototype.createRoom = function(data) {
	if(this.getRoom(data.roomName) !== undefined)
		return false;

	if(data.gameRules === 'danish'){
		gameRules = require('./danish/danishGameRules')
		playerManager = require('./danish/playerManager')
	} else if(data.gameRules === 'loupGarou'){
		gameRules = require('./loupgarou/gameRules')
		playerManager = require('./loupgarou/playerManager')
	}

	this.playingRooms[data.roomName] = new room(data, this, gameRules, playerManager);

	this.updateLounge();

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
			self.playingRooms[r] = undefined;
		}
	}
	self.updateLounge();
	setTimeout(self.think, self.delay, self);
};
roomService.prototype.joinLounge = function(socket, name) {
    this.loungePlayers[this.loungePlayers.length] = socket;
	var ret = this.getLoungeUpdateInfos();
	ret.player = require('./accountManager').getAccount(name);
    socket.emit('join lounge', ret);
    this.updateLounge();
};
roomService.prototype.addPost = function (socket, data) {
	data.user = socket.playerName;
	require('./postManager').addPost(data);
	this.updateLounge();
};

roomService.prototype.getPosts = function (socket, pos) {
	socket.emit('get posts', require('./postManager').getPostsFrom(pos));
	
};
roomService.prototype.getConnectedUsers = function () {
	var users = [];
	for (var i = this.loungePlayers.length - 1; i >= 0; i--) {
		users[i] = {};
		users[i].playerName = this.loungePlayers[i].playerName;
	};
	return users;
}
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
roomService.prototype.joinRoom = function(socket, name, pass) {
	var room = this.playingRooms[name];

	if(room === undefined){
		socket.emit('fail', 'fail join room exist');
		return false;
	}

	if(!room.canJoin(socket, pass)){
		socket.emit('fail', 'fail join room password');
		return false;
	}

	room.playerJoin(socket);

	for (var i = this.loungePlayers.length - 1; i >= 0; i--) {
		if(this.loungePlayers[i] === socket){
			this.loungePlayers.splice(i,1);
			break;
		}
	};
	this.updateLounge();
};
roomService.prototype.leaveRoom = function(socket, name) {
	var room = this.playingRooms[name];

	if(room === undefined)
		return false;
	
	room.playerLeave(socket);

	this.joinLounge(socket, socket.name);
	this.updateLounge();
};
roomService.prototype.playerDisconnect = function (socket) {
	if(socket.hostRoom !== undefined)
		socket.hostRoom.playerLeave(socket);
	else{
		for (var i = this.loungePlayers.length - 1; i >= 0; i--) {
			if(this.loungePlayers[i] === socket){
				this.loungePlayers.splice(i,1);
				this.updateLounge();
			}
		};
	}
}
roomService.prototype.getLoungeUpdateInfos = function () {
	var ret = {};
    ret.posts = require('./postManager').getPosts();
    ret.rooms = this.getRoomsInfos();
    ret.connectedUsers = this.getConnectedUsers();
    return ret;
}
roomService.prototype.updateLounge = function() {
	var ret = this.getLoungeUpdateInfos(); 

	for (var i = this.loungePlayers.length - 1; i >= 0; i--) {
		if (this.loungePlayers[i] !== undefined){
			this.loungePlayers[i].volatile.emit('update lounge', ret);
		}
	};
};
roomService.prototype.kickPlayer = function(name, timeSec) {
	require('./accountManager').kickPlayer(name, timeSec);

	var clients = this.io.sockets.clients();
	for (var i = clients.length - 1; i >= 0; i--) {
		if(clients[i].player.name === name){
			clients[i].disconnect();
			break;
		}
	};
};
module.exports = new roomService();