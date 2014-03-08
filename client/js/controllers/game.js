function gameCtrl ($scope) {
	$scope.roomName = "";

	$scope.players = [];
	$scope.pickingStackSize = 52;
	$scope.gameState = {};
	$scope.playingHand = [];
	$scope.tappedHand = [];
	$scope.tableHand = 0;
	$scope.ready = false;
	$scope.playingStack = [];
	$scope.glog = "";
	$scope.gchat = "";
	$scope.selectedCards = [];
	$scope.shouldTarget = false;
	$scope.shouldPlaySmall = false;
	$scope.chatLine = "";
	$scope.availableCommands = [];

	$scope.autoCompletePos = 0;
	$scope.autoCompleteValue = "";

	$scope.chatHistory = [];
	$scope.chatHistoryPos = -1;
	$scope.chatHistoryValue = "";

	$scope.socket.removeAllListeners();
	$scope.createSocketOn($scope.socket);

		$scope.socket.on('current state', function (data) {
			$scope.$apply(function () {
				$scope.glog += 'Joined to room : ' + data.roomName + '\n';

				$scope.roomName = data.roomName;
				$scope.players = data.players;
				$scope.gameState = data.gameState;
				$scope.pickingStackSize = data.pickingStackSize;
				$scope.playingStack = data.playingStack;
				$scope.availableCommands = data.availableCommands;
				$scope.ready = false;
				$scope.playingHand = [];
				$scope.tappedHand = [];
				$scope.tableHand = 0;
			})
		});
		$scope.socket.on('new game state', function (state) {
			$scope.$apply(function () {
				$scope.gameState = state;
				if(state.value = 1 && state.name == "Tapping phase") // tapping phase
				{
          			$scope.playingStack = [];
					for (var i = $scope.players.length - 1; i >= 0; i--) {
						$scope.players[i].tableHand = 3;
					};
				}

				$scope.glog += 'New game state ' + state.name +'\n';
			});
		});

		$scope.socket.on('user connected', function (pName) {
			$scope.$apply(function () {
				$scope.players[$scope.players.length] = {name:pName, ready: false, tableHand: 0, tappedHand: [], playingHand: 0};
				$scope.glog += 'User connected : ' + pName + '\n';
				$scope.$broadcast('connected');
			});
		});
		$scope.socket.on('user disconnected', function (pName) {
			$scope.$apply(function () {
				for (var i = $scope.players.length - 1; i >= 0; i--) {
					if($scope.players[i].name == pName)
						$scope.players.splice(i,1);
				};
				$scope.glog += 'User disconnected : ' + pName + '\n';
			});
		});
		$scope.socket.on('player ready', function (pName) {
			$scope.$apply(function () {
				for (var i = $scope.players.length - 1; i >= 0; i--) {
					if($scope.players[i].name == pName)
						$scope.players[i].ready = true;
				};
				$scope.glog += 'User ready : ' + pName + '\n';
			});
		});
		$scope.socket.on('player unready', function (pName) {
			$scope.$apply(function () {
				for (var i = $scope.players.length - 1; i >= 0; i--) {
					if($scope.players[i].name == pName)
						$scope.players[i].ready = false;
				};
				$scope.glog += 'User unready : ' + pName + '\n';
			});
		});
		$scope.socket.on('new playing hand', function (hand) {
			$scope.$apply(function () {
				$scope.playingHand = hand;
				$scope.playingHand.sort(sortCards);
			});
		});
		$scope.socket.on('new table hand', function (size) {
			$scope.$apply(function () {
				$scope.tableHand = size;
			});
		});
		$scope.socket.on('tapped card', function (data) {
			$scope.$apply(function () {
				for (var i = $scope.players.length - 1; i >= 0; i--) {
					if($scope.players[i].name == data.name)
					{
						$scope.players[i].tappedHand[$scope.players[i].tappedHand.length] = data.card;
						$scope.glog += $scope.players[i].name + ' tapped card : ' + data.card.id + " of " + data.card.family + '\n';
					}
				};
			});
		});
		$scope.socket.on('playing hand size', function (data) {
			$scope.$apply(function () {
				for (var i = $scope.players.length - 1; i >= 0; i--) {
					if($scope.players[i].name == data.name)
					{
						$scope.players[i].playingHand = data.size;
					}
				};
			});
		});
		$scope.socket.on('picking deck size', function (size) {
			$scope.$apply(function () {
				$scope.pickingStackSize = size;
			});
		});
		$scope.socket.on('player turn', function (plr) {
			$scope.$apply(function () {
				$scope.playerTurn = plr;
				$scope.glog += 'Player turn : ' + plr +'\n';
				if(plr == $scope.playerName)
					$scope.$broadcast('selfTurn');
				else
					$scope.$broadcast('playerTurn');
			})
		});
		$scope.socket.on('draw card', function (card) {
			$scope.$apply(function () {
				$scope.playingHand[$scope.playingHand.length] = card;
				$scope.playingHand.sort(sortCards);
				$scope.glog += 'Drawn card : ' + card.id + " of " + card.family + '\n';
			});
		});
		$scope.socket.on('cards played', function (cards) {
			$scope.$apply(function () {
				for (var i = cards.length - 1; i >= 0; i--) {
					$scope.playingStack[$scope.playingStack.length] = cards[i];
					$scope.glog += 'Card played : ' + cards[i].id + " of " + cards[i].family + '\n';
				};
			});
		});
		$scope.socket.on('play tapped cards', function (data) {
			$scope.$apply(function () {
				for (var i = $scope.players.length - 1; i >= 0; i--) {
					if($scope.players[i].name == data.name)
					{
						for (var k = $scope.players[i].tappedHand.length - 1; k >= 0; k--) {
							for (var j = data.cards.length - 1; j >= 0; j--) {
								if($scope.cardsEqual($scope.players[i].tappedHand[k], data.cards[j]))
									$scope.players[i].tappedHand.splice(k,1);
							};
						};
						break;
					}
				};
			});
		});
		$scope.socket.on('played table card', function (plr) {
			$scope.$apply(function () {
				for (var i = $scope.players.length - 1; i >= 0; i--) {
					if($scope.players[i].name == plr)
					{
						$scope.players[i].tableHand -= 1;
					}
				};
			});
		})
		$scope.socket.on('take stack', function (stack) {
			$scope.$apply(function () {
				for (var i = stack.length - 1; i >= 0; i--) {
					$scope.playingHand[$scope.playingHand.length] = stack[i];
					$scope.playingHand.sort(sortCards);
				};
				$scope.glog += 'Took stack : ' + stack.length + '\n';
			});
		});
		$scope.socket.on('stack taken', function (plr) {
			$scope.$apply(function () {
				$scope.glog += 'Player took stack : ' + plr + " :" + $scope.playingStack.length + '\n';
			});
		});
		$scope.socket.on('stack cut', function () {
			$scope.$apply(function () {
				$scope.glog += 'Stack cut : ' + $scope.playingStack.length + '\n';
				$scope.playingStack = [];
				$scope.$broadcast('stackCut');
			});
		});
		$scope.socket.on('select ace target', function () {
			$scope.$apply(function () {
				$scope.shouldTarget = true;
			});
		});
		$scope.socket.on('ace targeted', function (name) {
			$scope.glog += 'Player targeted by ace : ' + name + '\n';
			$scope.$apply(function () {
				$scope.shouldTarget	 = false;
			});
		});
		$scope.socket.on('force play smallest', function () {
			$scope.$apply(function () {
				$scope.shouldPlaySmall = true;
				$scope.glog += 'Begining round : play smallest card\n';
			});
		});
		$scope.socket.on('gameEnd', function () {
			$scope.$apply(function () {
				for (var i = $scope.players.length - 1; i >= 0; i--) {
					$scope.players[i].tappedHand = [];
					$scope.players[i].playingHand = 0;
					$scope.players[i].tableHand = 0;
					$scope.players[i].ready = false;
				};
				$scope.playingHand = [];
				$scope.tappedHand = [];
				$scope.tableHand = 0;
				$scope.playerTurn = "";
				$scope.shouldTarget = false;
				$scope.ready = false;
			});
		});
		$scope.socket.on('chat message', function (data) {
			$scope.$apply(function () {
				$scope.gchat += data.player + " : " + data.message + "\n";
				var words = data.message.split(' ');
				for (var i = words.length - 1; i >= 0; i--) {
					if(words[i] == $scope.playerName)
						$scope.$broadcast('mention');
				};
			});
		});
		$scope.socket.on('chat command', function (data) {
			$scope.$apply(function () {
				$scope.gchat += data.message + "\n";
			});
		});
		$scope.socket.on('play sound rdy', function () {
			$scope.$apply(function() {
				$scope.$broadcast('plsrdy');
			});
		});

	$scope.socket.emit('get current state');

	$scope.nextAutoComplete = function(msg) {
		var words = msg.split(" ");

		if($scope.autoCompletePos == -1)
			$scope.autoCompleteValue = words[words.length-1];

		$scope.autoCompletePos += 1;

		var work = $scope.autoCompleteValue;
		var values = [];

		if(work[0] == "/") // auto complete command
			values = $scope.getCommandStartingWith(work);
		else
			values = $scope.getPlayerStartingWith(work);

		if(values.length == 0){ //Nothing to do here, reset ourselves
			$scope.autoCompletePos = -1;
			return msg;
		}
		if($scope.autoCompletePos >= values.length)
			$scope.autoCompletePos = 0;

		work = values[$scope.autoCompletePos];
		words[words.length-1] = work;
		return words.join(' ');
	};
	$scope.previousAutoComplete = function(msg) {
		var words = msg.split(" ");

		if($scope.autoCompletePos == -1)
			$scope.autoCompleteValue = words[words.length-1];

		$scope.autoCompletePos -= 1;

		var work = $scope.autoCompleteValue;
		var values = [];

		if(work[0] == "/") // auto complete command
			values = $scope.getCommandStartingWith(work);
		else
			values = $scope.getPlayerStartingWith(work);

		if(values.length == 0){ //Nothing to do here, reset ourselves
			$scope.autoCompletePos = -1;
			return msg;
		}
		if($scope.autoCompletePos < 0 || $scope.autoCompletePos >= values.length)
			$scope.autoCompletePos = 0;
		
		work = values[$scope.autoCompletePos];
		words[words.length-1] = work;
		return words.join(' ');
	};
	$scope.getCommandStartingWith = function(starting) {
		var res = [];

		var commandsCpy = JSON.parse(JSON.stringify($scope.availableCommands));
		commandsCpy.sort(function(a,b) { return a.name > b.name });
		commandsCpy.reverse();

		for (var i = commandsCpy.length - 1; i >= 0; i--) {
			var cmd = commandsCpy[i];

			var add = true;
			for (var j = starting.length - 1; j >= 0; j--) {
				if(starting[j] != cmd.name[j])
					add = false;
			};
			if(add)
				res[res.length] = cmd.name;
		};
		return res;
	};
	$scope.getPlayerStartingWith = function(starting) {
		var res = [];

		var playersCpy = JSON.parse(JSON.stringify($scope.players));
		playersCpy.sort(function(a,b) { return a.name > b.name });
		playersCpy.reverse();


		for (var i = playersCpy.length - 1; i >= 0; i--) {
			var plr = playersCpy[i];
			var add = true;
			for (var j = starting.length - 1; j >= 0; j--) {
				if(starting[j] != plr.name[j])
					add = false;
			};
			if(add)
				res[res.length] = plr.name;
		};
		return res;
	};
	$scope.removeAutoComplete = function(msg) {
		if($scope.autoCompletePos == -1)
			return false;

		$scope.autoCompletePos = -1;

		var words = msg.split(" ");
		words[words.length-1] = $scope.autoCompleteValue; //Restore the original line

		return words.join(' ');
	};
	$scope.stopAutoComplete = function() {
		$scope.autoCompletePos = -1;
	};
	$scope.sendMessage = function (msg) {
		$scope.autoCompletePos = -1;
		$scope.socket.emit('send chat', msg);

		$scope.chatHistory[$scope.chatHistory.length] = msg;
		$scope.chatHistoryPos = $scope.chatHistory.length;

		return true;
	}
	$scope.moveUpHistory = function(msg) {
		if($scope.chatHistoryPos >= $scope.chatHistory.length)
			$scope.chatHistoryValue = msg;

		$scope.chatHistoryPos = Math.max($scope.chatHistoryPos - 1, 0); //Move up the history but no further than 0

		var res = $scope.chatHistory[$scope.chatHistoryPos];

		return res;
	};
	$scope.moveDownHistory = function(msg) {
		$scope.chatHistoryPos += 1;

		if($scope.chatHistoryPos >= $scope.chatHistory.length){
			$scope.chatHistoryPos  = $scope.chatHistory.length;
			if($scope.chatHistoryValue == '')
				return msg;
			else
				return $scope.chatHistoryValue;
		}
		
		return $scope.chatHistory[$scope.chatHistoryPos];
	};
	$scope.stopHistory = function() {
		$scope.chatHistoryPos = $scope.chatHistory.length;		
	};
	$scope.hasCards = function(id)
  	{
    	return ($scope.players[id].playingHand != 0 || $scope.players[id].tappedHand.length != 0 || $scope.players[id].tableHand != 0);
  	}
	$scope.cardsEqual = function (c1, c2) {
		return (c1.id == c2.id && c1.family == c2.family);
	}
	$scope.handCardClick = function (card, id) {
		if(( $scope.gameState.name == "Tapping phase" && $scope.gameState.value == 1) && $scope.tappedHand.length < 3) //tapping phase
		{
			$scope.socket.emit('set tapped card', card);
			$scope.playingHand.splice(id,1);
			$scope.tappedHand[$scope.tappedHand.length] = card;
		}
		else
			$scope.toggleCardSelection(card, id);
	}
	$scope.doubleClickHand = function (card, id) {
		$scope.selectedCards = [];
		for (var i = $scope.playingHand.length - 1; i >= 0; i--) {
			if($scope.playingHand[i].id == card.id)
				$scope.selectedCards[$scope.selectedCards.length] =	$scope.playingHand[i];
		};
	}
	$scope.toggleCardSelection = function (card, id) {
		var rm = false;
		for (var i = $scope.selectedCards.length - 1; i >= 0; i--) {
			if($scope.selectedCards[i] == card)
			{
				$scope.selectedCards.splice(i,1);
				rm = true;
			}
		};
		if(!rm && $scope.selectedCards.length == 0)
			$scope.selectedCards[$scope.selectedCards.length] = card;
		else if (!rm && $scope.selectedCards.length >= 1 && $scope.selectedCards[0].id == card.id)
			$scope.selectedCards[$scope.selectedCards.length] = card;
		else if (!rm && $scope.selectedCards.length >= 1 && $scope.selectedCards[0].id != card.id)
		{
			$scope.selectedCards = [];
			$scope.selectedCards[$scope.selectedCards.length] = card;
		}
	}
	$scope.tappedCardClick = function (card, id) {
		if($scope.playingHand.length == 0)
		{
			$scope.toggleCardSelection(card, id);
		}
	}
	$scope.tableCardClick = function (id) {
		if($scope.playingHand.length == 0 && $scope.tappedHand.length == 0 && $scope.playerTurn == $scope.playerName)
		{
			$scope.playTableCard(id);
		}
	}
	$scope.playTableCard = function (id) {
		if($scope.shouldTarget)
			return false;
		
		$scope.socket.emit('play table card', id);
		$scope.tableHand -= 1;
	}
	$scope.isCardSelected = function (card) {
		for (var i = $scope.selectedCards.length - 1; i >= 0; i--) {
			if($scope.selectedCards[i] == card)
				return true;
		};
		return false;
	}
	Mousetrap.bind('space', function() { $scope.$apply($scope.playSelected); return false; });
	$scope.playSelected = function () {
		if($scope.playerTurn == $scope.playerName && $scope.selectedCards.length >= 1 && $scope.canPlayCard($scope.selectedCards[0]) )
		{
			if($scope.shouldPlaySmall)
				$scope.shouldPlaySmall = false;

			$scope.socket.emit('play cards', $scope.selectedCards);

			var source = $scope.playingHand;
			if ($scope.playingHand.length == 0 && $scope.tappedHand.length > 0)
				source = $scope.tappedHand;

			for (var i = source.length - 1; i >= 0; i--) {
				for (var j = $scope.selectedCards.length - 1; j >= 0; j--) {
					if(source[i] == $scope.selectedCards[j])
						source.splice(i,1);
				};
			};
		$scope.selectedCards = [];
		}
	}
	$scope.playCard = function (card, id) {
		if($scope.canPlayCard(card)){
			$scope.socket.emit('play card', card);
			$scope.playingHand.splice(id,1);
		}
	}
	$scope.getSmallestCard = function () {
		var smallest = {id: 15, family:'none'};
		for (var i = $scope.playingHand.length - 1; i >= 0; i--) {
			if($scope.playingHand[i].id < smallest.id && $scope.playingHand[i].id != 2 && $scope.playingHand[i].id != 3)
				smallest = $scope.playingHand[i];
		};
		return smallest;
	}
	$scope.canPlayCard = function (card) {
		if($scope.shouldTarget)
			return false;
		if($scope.shouldPlaySmall && card.id > $scope.getSmallestCard().id)
			return false;

		if($scope.playingStack.length <= 0)
			return true;

		if($scope.playingHand.length == 0)
			return true; // we can always play tapped cards. if they are bad, player take stack with them

		var latest = $scope.playingStack[$scope.playingStack.length-1];

		if(card.id == 2 || card.id == 3)
			return true;

		if(latest.id == 3)
		{
			for (var i = $scope.playingStack.length - 2; i >= 0; i--) {
				if($scope.playingStack[i].id == 3)
					continue;
				latest = $scope.playingStack[i];
				break;
			};
		}
    
		if(latest.id != 7 && (card.id == 10 || card.id == 14))
			return true;

		if(latest.id == 7 && card.id <= 7) // Playing under
			return true;
		else if (latest.id == 7 && card.id > 7) // playing higher
			return false;

		if(latest.id <= card.id)
			return true;
		else
			return false;
	};
	$scope.canTakeStack = function() {
		if($scope.playerTurn == $scope.playerName) // and
		if($scope.playingStack.length != 0) //and
		if($scope.playingHand.length != 0)
			return true

		return false;
	};
	$scope.aceTarget = function (plr) {
		if($scope.shouldTarget)
		{
			$scope.socket.emit('ace target', plr);
		}
	}
	$scope.takeStack = function () {
		if($scope.playerTurn == $scope.playerName)
			$scope.socket.emit('gibe stack');
	}
	$scope.makeStylePlayingHand = function (index) {
		var shift = 0;

		for(var i = 1; i <= index; i++)
		{
			if($scope.playingHand[i].id == $scope.playingHand[i-1].id)
				shift += 18;
			else
				shift += 78;
		}

		return {position: 'absolute', left: shift + 'px'};
	}
	$scope.toggleReady = function () {
		if($scope.ready){
			$scope.socket.emit('set unready');
			$scope.ready = false;
		}
		else{
			$scope.socket.emit('set ready');
			$scope.ready = true;
		}
	};
	$scope.leaveRoom = function() {
		$scope.socket.emit('leave room', $scope.roomName);
	};
};
function sortCards (c1,c2) {
	return c1.id - c2.id;
}