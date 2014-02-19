//Basic definition of a player

module.exports = function(name){
	this.name = name;
	this.handCards = [];
	this.tableCards = [];
	this.tappedCards = [];
	this.isAI = false;
	this.askew = 0;
	
	this.isPlayer = function() { return !this.isAI; };
	this.hasCards = function() {
		return (this.handCards.length != 0 || this.tappedCards.length != 0 || this.tableCards.length != 0);
	};
	this.getSmallestCard = function() {
		var smallest = {id: 15, family:'none'};
		for (var i = this.handCards.length - 1; i >= 0; i--) {
			if(this.handCards[i].id < smallest.id && this.handCards[i].id != 2 && this.handCards[i].id != 3)
				smallest = this.handCards[i];
		};
		return smallest;
	};
}