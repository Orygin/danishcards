socket = function(parent)
{
	this.parent = parent;
	this.cb = [];
};

socket.prototype.emit = function(name) {
	if(this.cb[name] === undefined)
		return;

	this.cb[name].call(this.parent);
};

socket.prototype.on = function(name, fct) {
	this.cb[name] = fct;
};

module.exports = socket;