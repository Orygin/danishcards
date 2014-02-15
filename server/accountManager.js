var fs = require('fs');

function simpleAccountManager () {
	this.accounts = [];
}
function account(name, pw, rank) {
	this.name = name;
	this.password = pw;
	this.rank = rank;

	this.kickedTime = {};
	this.stats = {};

	this.kick = function(timeSec) {
		this.kickedTime = new Date((new Date()).getTime() + time * 1000);
	};
	this.isKicked = function() {
		return this.kickedTime > (new Date());
	};
}

simpleAccountManager.prototype.addAccount = function(name, pw) {
	if(this.getAccount(name))
		return false;

	this.accounts[this.accounts.length] = new account(name, pw, 'user');

	return true;
};
simpleAccountManager.prototype.getAccount = function(name) {
	for (var i = this.accounts.length - 1; i >= 0; i--) {
		if(this.accounts[i].name == name)
			return this.accounts[i];
	};
	return false;
};
simpleAccountManager.prototype.connect = function(name, pw) {
	var acc = this.getAccount(name);

	if(!acc)
		return false;

	if(acc.password == pw && !acc.isKicked())
		return true;

	else
		return false;
};
simpleAccountManager.prototype.kickPlayer = function(name, timeSec) {
	var acc = this.getAccount(name);

	if(!acc)
		return false;

	acc.kick(timeSec);
};
simpleAccountManager.prototype.isPlayerAdmin = function(name) {
	return this.getAccount(name).rank == 'admin';
};
simpleAccountManager.prototype.saveToFile = function(sync) {
	if(!sync)
		fs.writeFile('accounts.json', JSON.stringify(this.accounts), function (err) {
			if(err)
				console.log('Error saving to file');
			else
				console.log('Accounts saved');
		});
	else
		fs.writeFileSync('accounts.json', JSON.stringify(this.accounts));
};
simpleAccountManager.prototype.readFromFile = function() {
	this.accounts = [];
	var acc = this.accounts;
	fs.readFile('accounts.json', function (err, data) {
		data = data.toString();
		data = JSON.parse(data);
		
		if(data === undefined)
			return;

		for(o in data){
			acc[acc.length] = new account(data[o].name, data[o].password, data[o].rank);
			acc[acc.length-1].kickedTime = data[o].kickedTime;
			acc[acc.length-1].stats = data[o].stats;
		}
		console.log('Read accounts from file');
	});
};
module.exports = new simpleAccountManager();