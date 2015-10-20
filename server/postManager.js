function postManager() {
	this.posts = [];
};

postManager.prototype.getPosts = function (){
	return this.posts.slice(0,10);
};
postManager.prototype.getPostsFrom = function (pos){
	return this.posts.slice(pos,pos+10);
};
postManager.prototype.addPost = function (post) {
	console.log(post);
	this.posts[this.posts.length] = post;
}
module.exports = new postManager();