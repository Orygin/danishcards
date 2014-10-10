var baseAI 	= require('./baseAI');

oryginAI.prototype = baseAI.prototype;
oryginAI.prototype.constructor = oryginAI;

function oryginAI() {
	baseAI.call(this);

	this.onCreate = function (state) {
		if(state.gameState == this.hostRoom.GAMESTATES.NOTPLAYING)
			this.socket.emit('set ready');
	}
	
// The client has to handle these functions accordingly,
// While we use the values from the server directly
// So these are events but our object already reflect the changes
// Only add AI logic code
	this.on('new game state', function(state) {

	});
	this.on('new playing hand', function (cards) {
		//get our best cards and tap them
		var sorting = { "id": 4 };
		while(best.length < 3){
			for (var i = this.player.handCards.length - 1; i >= 0; i--) {
				var card = this.player.handCards[i];
				if(card.id == 2 || card.id == 3 || card.id == 10){
					this.emit('set tapped card', card);
				}
				else if(card.id > sorting.id){
					sorting = card;
				}
			};
			if(best.length < 3)
				this.emit('set tapped card', card);
		}
	});

	this.on('new table hand', function (size) {
	});

	this.on('playing hand size', function (playerName) {
	});

	this.on('picking deck size', function (size) {
	});

	this.on('player turn', function (playerName) {
		if(playerName == this.player.name)
			this.play();
	});

	this.on('force play smallest', function () {
		this.gameRules.playCards(this, [this.player.getSmallestCard()]);
	});

	this.on('cards played', function (cards) {
	});

	this.on('draw card', function (cards) {
	});

	this.on('stack cut', function (size) {
	});

	this.on('play tapped cards', function (data) {
	});

	this.on('played table card', function (playerName) {
	});

	this.on('ace targeted', function (playerName) {
	});

	this.on('select ace target', function() {
		var list = this.playerHelper.getPlayerList();
		for (var i = list.length - 1; i >= 0; i--) {
			if(list[i].name == this.player.name){
				if(i == 0)
					i = list.length;

				var pl = list[i-1];
				while(!pl.hasCards()){ //Get a player with cards that plays just before us
					i--;

					if(i == 0)
						i = list.length;

					var pl = list[i-1];
				}

				this.emit('ace target', pl.name);
				break;
			}
		};
	});

	this.play = function () {
		//it's our turn to play
		if(!this.player.hasCards())
			return;

		var source = this.player.handCards;
		if(this.player.handCards.length == 0 && this.player.tappedCards.length > 0){
			source = this.player.tappedCards; // We are using our tapped cards as source
		}
		else if (this.player.handCards.length == 0){
			//We must play a table card, doesn't matter which one
			this.emit('play table card', this.player.tableCards.length);
		}

		for (var i = source.length - 1; i >= 0; i--) {
			if(this.gameRules.canPlayCard(source[i], this)){
				return this.emit('play card', source[i]);
			}
		};
		// No cards available
		this.emit('gib stack');
		this.emit('send chat', 'gimme that stack yo\'');
	}
}

module.exports = oryginAI;