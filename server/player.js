module.exports = function(name){
	this.name = name;
	this.handCards = [];
	this.tableCards = [];
	this.tappedCards = [];
	this.isAI = false;
	this.isPlayer = function() { return !this.isAI; };
	this.hasCards = function() {
		return (this.handCards.length != 0 || this.tappedCards.length != 0 || this.tableCards.length != 0);
	};
}