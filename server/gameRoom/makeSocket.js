//This was exported to its own module so it can be called on the fakeSocket of AIs as well as player's socket

module.exports = function(host) {
	this.on('disconnect', function () {
		host.playerManager.removePlayer(this);
	});
	this.on('get current state', function () {
		this.emit('current state', {	playingStack: host.gameRules.playingStack,
										pickingStackSize: host.gameRules.playingDeck.length, 
										gameState: host.gameState, 
										players: host.playerManager.getPlayerList(),
										availableCommands: host.gameChat.getCommandList(),
										roomName: host.roomName	});
	});
	this.on('set ready', function () {
		host.playerManager.setPlayerReady(this);
	});
	this.on('set unready', function () {
		host.playerManager.setPlayerUnready(this);
	});
	this.on('set tapped card', function (card) {
		if(host.playerManager.tappedCard(this, card))
			this.broadcast.to(host.roomName).emit('tapped card', {name: this.player.name, card: card});
	});
	this.on('play cards', function (cards) {
		host.gameRules.playCards(this, cards);
	});
	this.on('gibe stack', function () {
		host.gameRules.playerTakeStack(this);
	});
	this.on('play table card', function (id) {
		host.gameRules.playTableCard(this, id);
	});
	this.on('ace target', function (name) {
		host.gameRules.aceTarget(name);
	});
	this.on('send chat', function (msg) {
		host.gameChat.rcvChat(this, msg);
	});
};