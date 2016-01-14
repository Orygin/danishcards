var fs = require('fs');
function postManager() {
	this.posts = [];
	this.saveDelay = 60*1000;
	setTimeout(this.think, this.saveDelay, this);
};
postManager.prototype.think = function (self) {
	self.savePosts();
	setTimeout(self.think, self.saveDelay, self);
}
postManager.prototype.getPosts = function (){
	return this.posts.slice(0,10);
};
postManager.prototype.getPostsFrom = function (pos){
	return this.posts.slice(pos,pos+10);
};
postManager.prototype.addPost = function (post) {
	console.log(this.posts);
	post.id = this.posts.length;
	this.posts[this.posts.length] = post;
}
postManager.prototype.savePosts = function () {
	fs.writeFileSync('posts.json', JSON.stringify(this.posts));
}
postManager.prototype.loadPosts = function () {
	var posts = this.posts;
	fs.readFile('posts.json', function (err, data) {
		data = data.toString();
		data = JSON.parse(data);
		
		if(data === undefined)
			return;

		for(o in data){
			posts[posts.length] = data[o];
		}
		console.log('Read posts from file');
	});
}
module.exports = new postManager();