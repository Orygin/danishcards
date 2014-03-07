function loungeCtrl($scope) {
	$scope.joinRoom = function (name) {
		$scope.socket.emit('join room', name);
	};
};