var staticCards = require('./cards'),
	_g = require('./globals');

function danishGameRules(){
	this.playerTurn = -1;
	this.playingStack = [];
	this.playingDeck = this.shuffleCards(staticCards.cards());
	this.playerManager = {};
	this.io = {};
	_g.gameRules = this;

	_g.on('player disconnect', function (socket) {
		_g.gameRules.checkEndGame();
	});
}
danishGameRules.prototype.setPlayerManager = function (manager) {
	this.playerManager = manager;
}
danishGameRules.prototype.shuffleCards = function(deck){ // function taken from stackoverflow
	var currentIndex = deck.length //http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
		, temporaryValue
		, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = deck[currentIndex];
    deck[currentIndex] = deck[randomIndex];
    deck[randomIndex] = temporaryValue;
  }

  return deck;
}
danishGameRules.prototype.startGame = function () {
	if(_g.gameState.value != 0)
		return;

	var j = 0;
	var len = this.playingDeck.length;

	for (var i = len-1; i >= len-(this.playerManager.players.length * 3); i--) { // table cards
		this.playerManager.players[j].player.tableCards[this.playerManager.players[j].player.tableCards.length] = this.playingDeck[i];
		this.playingDeck.splice(i, 1);
		j++;
		if(j >= this.playerManager.players.length)
			j=0;
	}

	this.playerManager.broadcastPlayersTableSize();

	j=0;
	len = this.playingDeck.length;
	for (var i = len-1; i >= len-(this.playerManager.players.length * 6); i--) { // starting hand
		this.playerManager.players[j].player.handCards.splice(this.playerManager.players[j].player.handCards.length, 0, this.playingDeck[i]);
		this.playingDeck.splice(i, 1);
		j++;
		if(j >= this.playerManager.players.length)
			j=0;
	};
	this.playerManager.broadcastPlayersHand();
	this.playerManager.broadcastPickingDeckSize();
	this.setGameState(_g.GAMESTATES.TAPPINGPHASE);
};
danishGameRules.prototype.setGameState = function (state) {
	_g.gameState = state;
	this.io.sockets.emit('new game state', state);
}
danishGameRules.prototype.endTappingPhase = function () {
	var startCard = 4, found = false;
	while(!found){
		for (var i = this.playerManager.players.length - 1; i >= 0; i--) {
			for (var j = this.playerManager.players[i].player.handCards.length - 1; j >= 0; j--) {
				if(this.playerManager.players[i].player.handCards[j].id == startCard)
				{
					this.playerTurn = i;
					this.io.sockets.emit('new game state', {value: 2, name: "Player turn"});
					this.playerManager.broadcastPlayerTurn(this.playerTurn);
					this.playerManager.players[i].emit('force play smallest');
					this.playerManager.players[i].player.forcePlaySmallest = true;
					return;
				}
			};
		};
		startCard +=1;
	}
}
danishGameRules.prototype.cardsEqual = function (card1, card2) {
	return (card1.id == card2.id && card1.family == card2.family);
}
danishGameRules.prototype.playCards = function (socket, cards) {
	if(this.canPlayCard(cards[0], socket) && this.playerManager.players[this.playerTurn].player.name == socket.player.name) //it's our turn and we can play this card
	{
		if(socket.player.forcePlaySmallest)
				socket.player.forcePlaySmallest = false;

		for (var i = cards.length - 1; i >= 0; i--) {
			this.playingStack[this.playingStack.length] = cards[i];
		};

		var source = socket.player.handCards;
		if(socket.player.handCards.length == 0 && socket.player.tappedCards.length > 0){
			source = socket.player.tappedCards;
			socket.broadcast.emit('play tapped cards', {name: socket.player.name, cards: cards});
		}

		for (var i = source.length - 1; i >= 0; i--) {
			for (var j = cards.length - 1; j >= 0; j--) {
				if(this.cardsEqual(source[i], cards[j])){
					source.splice(i,1);
					break;
				}
			};
		};

		while(socket.player.handCards.length < 3 && this.playingDeck.length > 0)
			this.drawCard(socket);

		this.playerManager.broadcastNewStackCards(cards);

		var cutByFour = true;
		if(this.playingStack.length >= 4)
		{
			for (var i = this.playingStack.length - 1; i >= this.playingStack.length - 4; i--) {
				if(this.playingStack[i].id != cards[0].id)
					cutByFour = false;
			};
		}
		else
			cutByFour = false;

		var actualCard = cards[0];
		if(cards[0].id == 3 && !cutByFour)
		{ // resolve which card we're playing on
			for (var i = this.playingStack.length - cards.length; i >= 0; i--) {
				if(this.playingStack[i].id == 3)
					continue;
				actualCard = this.playingStack[i];
				break;
			};
		}


		if(!cutByFour && actualCard.id == 14)
		{
			if(this.playerManager.players.length > 2)
				socket.emit('select ace target');
			else
				this.nextPlayerTurn();	

			this.playerManager.broadcastPlayerHandSize(socket);
			this.checkEndGame();
			return true; // we dont want to go further because we might go to the next player turn
		}

		if(cards[0].id == 10 || cutByFour){
			this.playingStack = [];
			this.playerManager.broadcastCutStack();
			if(!this.playerManager.players[this.playerTurn].player.hasCards())
				this.nextPlayerTurn();
		}
		else
			this.nextPlayerTurn();

		if(actualCard.id == 8 && !cutByFour){
			for (var i = cards.length - 1; i >= 0; i--) {
				if(this.playerManager.players[this.playerTurn].player.name == socket.player.name) // we don't skip our turn, so we skip a turn more
					this.nextPlayerTurn();
						
				this.nextPlayerTurn();
			};
		}

		this.playerManager.broadcastPlayerHandSize(socket);
		this.checkEndGame();
		return true;
	}
	else if(!this.canPlayCard(cards[0], socket) && socket.player.handCards.length == 0 && socket.player.tappedCards.length > 0 && this.playerManager.players[this.playerTurn].player.name == socket.player.name)
	{
		// it's our turn and we tried to play a tapped but we can't, so play anyway but make the player take the stack
		for (var i = cards.length - 1; i >= 0; i--) { // Add bad cards to the stack
			this.playingStack[this.playingStack.length] = cards[i];
		};

		socket.broadcast.emit('play tapped cards', {name: socket.player.name, cards: cards});

		for (var i = socket.player.tappedCards.length - 1; i >= 0; i--) {
			for (var j = cards.length - 1; j >= 0; j--) {
				if(this.cardsEqual(socket.player.tappedCards[i], cards[j])){
					socket.player.tappedCards.splice(i,1);
					break;
				}
			};
		};

		socket.emit('take stack', this.playingStack); // and make him take back the whole stack

		for (var i = this.playingStack.length - 1; i >= 0; i--) {
			socket.player.handCards[socket.player.handCards.length] = this.playingStack[i];
		};
		this.playerManager.broadcastPlayerHandSize(socket);

		this.playingStack = [];
		this.io.sockets.emit('stack taken', socket.player.name);
		this.playerManager.broadcastCutStack();
		this.nextPlayerTurn();
		this.checkEndGame();
		return false;
	}
	return false;
}
danishGameRules.prototype.canPlayCard = function (card, socket) {
	if(this.playingStack.length <= 0)
			return true;
		
	var latest = this.playingStack[this.playingStack.length-1];

	if(card.id == 2 || card.id == 3)
		return true;

	if(socket.player.forcePlaySmallest && card != socket.player.getSmallestCard())
		return false;

	if(latest.id == 3)
	{ // resolve which card we're playing on
		for (var i = this.playingStack.length - 2; i >= 0; i--) {
			if(this.playingStack[i].id == 3)
				continue;
			latest = this.playingStack[i];
			break;
		};
	}
  
	if(latest.id != 7 && (card.id == 10 || card.id == 14))
		return true;

	if(latest.id == 7 && card.id <= 7)
		return true;
	else if (latest.id == 7 && card.id > 7)
		return false;

	if(latest.id <= card.id)
		return true;
	else
		return false;
}
danishGameRules.prototype.nextPlayerTurn = function () {
	this.playerTurn += 1;
	if(this.playerTurn >= this.playerManager.players.length)
		this.playerTurn = 0;

	if(this.playerManager.playerWithCardsCount() > 1 && !this.playerManager.players[this.playerTurn].player.hasCards())
		return this.nextPlayerTurn(); // don't broadcast it if we skip a player

	this.playerManager.broadcastPlayerTurn(this.playerTurn);
}
danishGameRules.prototype.drawCard = function (player) {
	if(this.playingDeck.length > 0){
		var j = player.player.askew;
		var i = this.playingDeck.length-1;
		var card = this.playingDeck[this.playingDeck.length-1];
		while(j > 0)
		{
			var card2 = this.playingDeck[this.playingDeck.length-j];

			if(card2.id == 2 || card2.id == 3 || card2.id == 10){
				card = card2;
				i = this.playingDeck.length-j;
				console.log('Considering card : ' card2.id);
			}
			else if(card2.id > card.id){
				card = card2;
				i = this.playingDeck.length-j;
				console.log('Considering card : ' card2.id);
			}
			else
				console.log('Skipped card : ' card2.id);

			j -= 1;
		}
		player.emit('draw card', card);
		player.player.handCards[player.player.handCards.length] = card;
		this.playingDeck.splice(i,1);
		this.playerManager.broadcastPickingDeckSize();
	}
}
danishGameRules.prototype.playerTakeStack = function (player) {
	if(this.playingStack.length <= 0)
		return;

	player.emit('take stack', this.playingStack);

	for (var i = this.playingStack.length - 1; i >= 0; i--) {
		player.player.handCards[player.player.handCards.length] = this.playingStack[i];
	};
	this.playerManager.broadcastPlayerHandSize(player);

	this.playingStack = [];
	this.io.sockets.emit('stack taken', player.player.name);
	this.playerManager.broadcastCutStack();
	this.nextPlayerTurn();
}
danishGameRules.prototype.playTableCard = function (player, id) {
	if(player.player.handCards.length == 0 && player.player.tappedCards.length == 0)
	{
		if(!this.playCards(player, [player.player.tableCards[id]]))
		{
			this.playingStack[this.playingStack.length] = player.player.tableCards[id];
			this.playerManager.broadcastNewStackCards([player.player.tableCards[id]]);
			this.playerTakeStack(player);
		}
		player.player.tableCards.splice(id,1);
		player.broadcast.emit('played table card', player.player.name);
		this.checkEndGame();
	}
}
danishGameRules.prototype.aceTarget = function (name) {
	for (var i = this.playerManager.players.length - 1; i >= 0; i--) {
		if(this.playerManager.players[i].player.name == name && this.playerManager.players[i].player.hasCards())
		{
			this.playerTurn = i;
			this.playerManager.broadcastPlayerTurn(this.playerTurn);
			this.io.sockets.emit('ace targeted', name);
		}
	};
}
danishGameRules.prototype.checkEndGame = function () {
	var playerWithCards = 0;
	for (var i = this.playerManager.players.length - 1; i >= 0; i--) {
		if(this.playerManager.players[i].player.hasCards())
		{
			playerWithCards += 1;
		}
	};	
	if(playerWithCards <= 1)
	this.endGame();
}
danishGameRules.prototype.endGame = function () {
	if(_g.gameState.value == 0)
		return;

	for (var i = this.playerManager.players.length - 1; i >= 0; i--) {
		this.playerManager.players[i].player.tableCards = [];
		this.playerManager.players[i].player.handCards = [];
		this.playerManager.players[i].player.tappedCards = [];
    	this.playerManager.players[i].player.ready = false;
	};

	this.io.sockets.emit('gameEnd');
	this.io.sockets.emit('currentState', {	playingStack: this.playingStack,
												pickingStackSize: this.playingDeck.length, 
												gameState: _g.gameState, 
												players: this.playerManager.getPlayerList()	});

	this.playingStack = [];

	this.playingDeck = this.shuffleCards(staticCards.cards());
  
	this.setGameState(_g.GAMESTATES.NOTPLAYING);
}
danishGameRules.prototype.renewHand = function(socket) {
	if(_g.gameState.value != 2)
		return;

	this.playingDeck.splice(this.playingDeck.length, 0, socket.player.handCards);
	socket.player.handCards.splice(0,3);

	socket.player.handCards.splice(socket.player.handCards.length, 0, this.playingDeck[0]);
	this.playingDeck.splice(0,1);
	socket.player.handCards.splice(socket.player.handCards.length, 0, this.playingDeck[0]);
	this.playingDeck.splice(0,1);
	socket.player.handCards.splice(socket.player.handCards.length, 0, this.playingDeck[0]);
	this.playingDeck.splice(0,1);

	socket.emit('new playing hand', socket.player.handCards);
};
module.exports = new danishGameRules();