function loungeCtrl($scope) {
	$scope.socket.on('update lounge', function (data) {
		$scope.$apply(function () {
			$scope.lounge.rooms = data;
		});
	});
	$scope.joinRoom = function (name) {
		$scope.socket.emit('join room', name);
	};
	$scope.createRoom = function () {
		if($scope.roomName === '' || $scope.roomName === undefined)	
			return $scope.addAlert('Can\'t create room with empty name', 'warning');

		$scope.socket.emit('create room', {roomName: $scope.roomName, cheats: $scope.cheats, owner: $scope.playerName});
	};
};