//This was exported to its own module so it can be called on the fakeSocket of AIs as well as player's socket

module.exports = function() {
	var playerManager = require('./playerManager'),
		gameRules = require('./danishGameRules'),
		gameChat = require('./chat'),
		accountManager = require('./accountManager');

	this.on('activate', function (data) {
		if(accountManager.connect(data.name, data.pw))
			playerManager.addPlayer(this, data.name);
		else 
		{
			if(accountManager.addAccount(data.name, data.pw))
				playerManager.addPlayer(this, data.name);
			else
				this.emit('error', 'couldn\'t create account');
		}
	});
	this.on('disconnect', function () {
		playerManager.removePlayer(this);
	});
	this.on('set ready', function () {
		playerManager.setPlayerReady(this);
	});
	this.on('set unready', function () {
		playerManager.setPlayerUnready(this);
	});
	this.on('set tapped card', function (card) {
		if(playerManager.tappedCard(this, card))
			this.broadcast.emit('tapped card', {name: this.player.name, card: card});
	});
	this.on('play cards', function (cards) {
		gameRules.playCards(this, cards);
	});
	this.on('gibe stack', function () {
		gameRules.playerTakeStack(this);
	});
	this.on('play table card', function (id) {
		gameRules.playTableCard(this, id);
	});
	this.on('ace target', function (name) {
		gameRules.aceTarget(name);
	});
	this.on('send chat', function (msg) {
		gameChat.rcvChat(this, msg);
	});
};