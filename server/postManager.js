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
	post.id = this.posts.length;
	this.posts[this.posts.length] = post;
}
module.exports = new postManager();