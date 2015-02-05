socket = function(parent)
{
	this.parent = parent;
	this.cb = [];
};

socket.prototype.emit = function(name, value) {
	if(this.cb[name] === undefined){
		console.log("Tried to call undefined callback : ", name);
		return;
	}

	this.cb[name].call(this.parent, value);
};

socket.prototype.on = function(name, fct) {
	this.cb[name] = fct;
};

module.exports = socket;