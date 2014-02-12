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
};

module.exports = new globals();