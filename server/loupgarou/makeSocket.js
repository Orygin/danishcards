//This was exported to its own module so it can be called on the fakeSocket of AIs as well as player's socket

module.exports = function() {
	this.on('get current state', function () {
		this.emit('current state', {	gameState: this.hostRoom.gameState, 
										players: this.hostRoom.playerManager.getPlayerList(),
										availableCommands: this.hostRoom.gameChat.getCommandList(),
										roomName: this.hostRoom.roomName	});
	});
};