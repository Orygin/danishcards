var basePlayer = require('../player');
var playerHelper = require('./playerHelper');
var chat = require('../chat');

module.exports = function AI () {
	this.playerHelper = playerHelper;
	this.player = {};
	this.io = {};

	this.socketCallbacks = [];

	this.on('new playing hand', function (cards) {
	});

	this.on('new table hand', function (size) {
	});

	this.on('playing hand size', function (playerName) {
	});

	this.on('picking deck size', function (size) {
	});

	this.on('player turn', function (playerName) {
		if(playerName = this.name)
			this.selfTurn();
		else
			this.otherTurn();
	});

	this.on('cards played', function (cards) {
	});

	this.on('stack cut', function (size) {
	});

	this.on('draw card', function (cards) {
	});

	this.on('played table card', function (playerName) {
	});

	this.on('ace targeted', function (playerName) {
	});

	this.on('force play smallest', function () {
	});

	this.on('play tapped cards', function (data) {
	});

	this.on('current state', function (state) { // called when the player object was created upon us
		this.player.isAI = true;
	});
}

module.exports.prototype.__defineGetter__('broadcast', function () { // We are to send info to everyone and other AIs
	
	
	return this; // Won't be used
});

module.exports.prototype.on = function(name, fct) {
	this.socketCallbacks[name] = fct;
};
module.exports.prototype.emit = function(name, data) {
	if(this.socketCallbacks[name] === undefined)
		return;

	this.socketCallbacks[name].call(this, data);
};

module.exports.prototype.selfTurn = function() {
	chat.rcvMessage(this, 'It\'s my turn yay');
};
module.exports.prototype.otherTurn = function() {
	
};

// The client has to handle these functions, the changes are already made for IA, treat it as events