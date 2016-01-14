//This was exported to its own module so it can be called on the fakeSocket of AIs as well as player's socket

module.exports = function() {
	this.on('set ready', function () {
		this.hostRoom.playerManager.setPlayerReady(this);
	});
	this.on('set unready', function () {
		this.hostRoom.playerManager.setPlayerUnready(this);
	});
	this.on('send chat', function (msg) {
		this.hostRoom.gameChat.rcvChat(this, msg);
	});
};