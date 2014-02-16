function globals() {
	this.sv_cheats = false;
	this.rcon = 'sauce';

	this.sv_maxPlayers = 5;

	this.GAMESTATES = {
		NOTPLAYING : {value: 0, name: "Not Playing"},
		TAPPINGPHASE: {value: 1, name: "Tapping phase"},
		PLAYERTURN: {value:2, name: "Player turn"},
		AITURN: {value:3, name: "AI turn"}
	};

	this.gameState = this.GAMESTATES.NOTPLAYING;

	this.gameRules = {};
	this.playerManager = {};
	this.accountManager = {};
	this.voteSystem = {};

	this.events = [];
};

globals.prototype.on = function(name, fct) {
	if(this.events[name]=== undefined)
		this.events[name] = [];

	this.events[name][this.events[name].length] = fct;
};
globals.prototype.emit = function(name, data) {
	var ev = this.events[name];
	
	if(ev === undefined)
		return;

	for (var i = ev.length - 1; i >= 0; i--) {
		ev[i](data);
	};
};

module.exports = new globals();