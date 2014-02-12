var app = angular.module('danish', ['ui.keypress', 'ui.bootstrap', 'luegg.directives', 'angular-audio-player'])

.controller('Sound', function ($scope){
	$scope.muted = false;

	$scope.toggleMute = function () {
		$scope.muted = !$scope.muted;
	}

	$scope.$on('connected', function(){
		if(!$scope.muted)
			$scope.connectSound.play();
	});
	$scope.$on('selfTurn', function () {
		if(!$scope.muted)
			$scope.selfTurnSound.play();
	});
	$scope.$on('playerTurn', function(){
		if(!$scope.muted)
			$scope.playerTurnSound.play();
	});
	$scope.$on('stackCut', function(){
		if(!$scope.muted)
			$scope.stackCutSound.play();
	});
	$scope.$on('plsrdy', function(){
		if(!$scope.muted)
			$scope.plsRdy.play();
	});
})

.controller('Main', function ($scope, $location){
	$scope.title = "Danish";
	if($location.host() == "congo.ledessert.eu")
		$scope.title = "Congo";
	else if($location.host() == "sauce.ledessert.eu")
		$scope.title = "Sauce et re Sauce";

	$scope.alerts = [];
	$scope.addAlert = function(mesg, level) {
		$scope.alerts.push({msg: mesg, type: level});
	};
	$scope.closeAlert = function(index) {
		$scope.alerts.splice(index, 1);
	};
	$scope.getTemplateForStatus = function () {
		if($scope.connectionStatus == "disconnected")
			return 'tpl/disconnected.html';
		else if($scope.connectionStatus == "connected")
			return 'tpl/connected.html';
		else if($scope.connectionStatus == "connecting")
			return 'tpl/disconnected.html';
	};

	$scope.players = [];
	$scope.connectionStatus = "disconnected";
	$scope.pickingStackSize = 52;
	$scope.gameState = {};
	$scope.playingHand = [];
	$scope.tappedHand = [];
	$scope.tableHand = 0;
	$scope.isReady = false;
	$scope.playingStack = [];
	$scope.glog = "";
	$scope.gchat = "";
	$scope.selectedCards = [];
	$scope.shouldTarget = false;
	$scope.shouldPlaySmall = false;
	$scope.playerName = "Anonymousse";
	$scope.chatLine = "";

	$scope.createAccount = function(playerName, password) {
		var socket = io.connect('/');
		$scope.socket = socket;
		$scope.createSocketOn(socket);

		$scope.playerName = playerName;

		socket.on('connect', function () {
			$scope.$apply(function () {
				$scope.connectionStatus = "connecting";
			});
			socket.emit('create account', {name: playerName, pw: password});
		});
		socket.on('account created', function () {
			socket.emit('activate', {name: playerName, pw: password});	
		});
	};

	$scope.connect = function (playerName, password) {
		var socket = io.connect('/');
		$scope.socket = socket;
		$scope.createSocketOn(socket);

		$scope.playerName = playerName;

		socket.on('connect', function () {
			$scope.$apply(function () {
				$scope.connectionStatus = "connecting";
			});
			socket.emit('activate', {name: playerName, pw: password});
		});
	}
	$scope.createSocketOn = function(socket) {
		socket.on('error', function (name, value) {
	    	$scope.$apply(function(){
		        if(name == 'too many players')
		        {
		          $scope.connectionStatus = "disconnected";
		          $scope.addAlert('Too many players already. You can still observe', 'danger');
		          socket.disconnect();
		        }
		        else if (name == 'name already in use')
		        {
		          $scope.connectionStatus = "disconnected";
		          $scope.addAlert('name already in use', 'danger');
		          socket.disconnect();
		        }
		        else if (name == 'couldn\'t log in')
		        {
		          $scope.connectionStatus = "disconnected";
		          $scope.addAlert('Couldn\'t log in', 'danger');
		          socket.disconnect();	
		        }
		        else if (name == 'couldn\'t create account')
		        {
		          $scope.connectionStatus = "disconnected";
		          $scope.addAlert('Couldn\'t create account', 'danger');
		          socket.disconnect();	
		        }
      		});
		});

		socket.on('current state', function (data) {
			console.log(data);
			$scope.$apply(function () {
				$scope.connectionStatus = "connected";
				$scope.glog += 'Connected \n';

				$scope.players = data.players;
				$scope.gameState = data.gameState;
				$scope.pickingStackSize = data.pickingStackSize;
				$scope.playingStack = data.playingStack;
				$scope.isReady = false;
				$scope.playingHand = [];
				$scope.tappedHand = [];
				$scope.tableHand = 0;
			})
		});
		socket.on('new game state', function (state) {
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

		socket.on('user connected', function (pName) {
			$scope.$apply(function () {
				$scope.players[$scope.players.length] = {name:pName, ready: false, tableHand: 0, tappedHand: [], playingHand: 0};
				$scope.glog += 'User connected : ' + pName + '\n';
				$scope.$broadcast('connected');
			});
		});
		socket.on('user disconnected', function (pName) {
			$scope.$apply(function () {
				for (var i = $scope.players.length - 1; i >= 0; i--) {
					if($scope.players[i].name == pName)
						$scope.players.splice(i,1);
				};
				$scope.glog += 'User disconnected : ' + pName + '\n';
			});
		});
		socket.on('player ready', function (pName) {
			$scope.$apply(function () {
				for (var i = $scope.players.length - 1; i >= 0; i--) {
					if($scope.players[i].name == pName)
						$scope.players[i].ready = true;
				};
				$scope.glog += 'User ready : ' + pName + '\n';
			});
		});
		socket.on('player unready', function (pName) {
			$scope.$apply(function () {
				for (var i = $scope.players.length - 1; i >= 0; i--) {
					if($scope.players[i].name == pName)
						$scope.players[i].ready = false;
				};
				$scope.glog += 'User unready : ' + pName + '\n';
			});
		});
		socket.on('new playing hand', function (hand) {
			$scope.$apply(function () {
				$scope.playingHand = hand;
				$scope.playingHand.sort(sortCards);
			});
		});
		socket.on('new table hand', function (size) {
			$scope.$apply(function () {
				$scope.tableHand = size;
			});
		});
		socket.on('tapped card', function (data) {
			$scope.$apply(function () {
				for (var i = $scope.players.length - 1; i >= 0; i--) {
					if($scope.players[i].name == data.name)
					{
						$scope.players[i].tappedHand[$scope.players[i].tappedHand.length] = data.card;
					}
				};
				$scope.glog += 'Tapped card : ' + data.card.id + " of " + data.card.family + '\n';
			});
		});
		socket.on('playing hand size', function (data) {
			$scope.$apply(function () {
				for (var i = $scope.players.length - 1; i >= 0; i--) {
					if($scope.players[i].name == data.name)
					{
						$scope.players[i].playingHand = data.size;
					}
				};
			});
		});
		socket.on('picking deck size', function (size) {
			$scope.$apply(function () {
				$scope.pickingStackSize = size;
			});
		});
		socket.on('player turn', function (plr) {
			$scope.$apply(function () {
				$scope.playerTurn = plr;
				$scope.glog += 'Player turn : ' + plr +'\n';
				if(plr == $scope.playerName)
					$scope.$broadcast('selfTurn');
				else
					$scope.$broadcast('playerTurn');
			})
		});
		socket.on('draw card', function (card) {
			$scope.$apply(function () {
				$scope.playingHand[$scope.playingHand.length] = card;
				$scope.playingHand.sort(sortCards);
				$scope.glog += 'Drawn card : ' + card.id + " of " + card.family + '\n';
			});
		});
		socket.on('cards played', function (cards) {
			$scope.$apply(function () {
				for (var i = cards.length - 1; i >= 0; i--) {
					$scope.playingStack[$scope.playingStack.length] = cards[i];
					$scope.glog += 'Card played : ' + cards[i].id + " of " + cards[i].family + '\n';
				};
			});
		});
		socket.on('play tapped cards', function (data) {
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
		socket.on('played table card', function (plr) {
			$scope.$apply(function () {
				for (var i = $scope.players.length - 1; i >= 0; i--) {
					if($scope.players[i].name == plr)
					{
						$scope.players[i].tableHand -= 1;
					}
				};
			});
		})
		socket.on('take stack', function (stack) {
			$scope.$apply(function () {
				for (var i = stack.length - 1; i >= 0; i--) {
					$scope.playingHand[$scope.playingHand.length] = stack[i];
					$scope.playingHand.sort(sortCards);
				};
				$scope.glog += 'Took stack : ' + stack.length + '\n';
			});
		});
		socket.on('stack taken', function (plr) {
			$scope.$apply(function () {
				$scope.glog += 'Player took stack : ' + plr + " :" + $scope.playingStack.length + '\n';
			});
		});
		socket.on('stack cut', function () {
			$scope.$apply(function () {
				$scope.glog += 'Stack cut : ' + $scope.playingStack.length + '\n';
				$scope.playingStack = [];
				$scope.$broadcast('stackCut');
			});
		});
		socket.on('select ace target', function () {
			$scope.$apply(function () {
				$scope.shouldTarget = true;
			});
		});
		socket.on('ace targeted', function (name) {
			$scope.glog += 'Player targeted by ace : ' + name + '\n';
			$scope.$apply(function () {
				$scope.shouldTarget	 = false;
			});
		});
		socket.on('force play smallest', function () {
			$scope.$apply(function () {
				$scope.shouldPlaySmall = true;
				$scope.glog += 'Begining round : play smallest card\n';
			});
		});
		socket.on('gameEnd', function () {
			$scope.$apply(function () {
				for (var i = $scope.players.length - 1; i >= 0; i--) {
					$scope.players[i].tappedHand = [];
					$scope.players[i].playingHand = 0;
					$scope.players[i].tableHand = 0;
					$scope.players[i].isReady = false;
				};
				$scope.playingStack = [];
				$scope.playingHand = [];
				$scope.tappedHand = [];
				$scope.tableHand = 0;
				$scope.playerTurn = "";
				$scope.shouldTarget = false;
				$scope.isReady = false;
			});
		});
		socket.on('chat message', function (data) {
			$scope.$apply(function () {
				$scope.gchat += data.player + " : " + data.message + "\n";
			});
		});
		socket.on('chat command', function (data) {
			$scope.$apply(function () {
				$scope.gchat += data.message + "\n";
			});
		});
		socket.on('play sound rdy', function () {
			$scope.$apply(function() {
				$scope.$broadcast('plsrdy');
			});
		});
	};
	$scope.sendMessage = function (msg) {
		$scope.socket.emit('send chat', msg);
		return true;
	}
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
	}
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
	$scope.toggleReady = function () {
		if($scope.isReady){
			$scope.socket.emit('set unready');
			$scope.isReady = false;
		}
		else{
			$scope.socket.emit('set ready');
			$scope.isReady = true;
		}
	};
	$scope.getNumber = function(num) {
		return new Array(num);   
	}
});
app.directive('zKeypress', function(){
  return {
    restrict: 'A',
    link: function(scope, elem, attr, ctrl) {
      elem.bind('keypress', function($event){
        scope.$apply(function(s) {
        	if($event.keyCode == 13)
        		if(s.sendMessage(elem[0].value))
        			elem[0].value = "";
          //s.$eval(attr.zKeypress);
        });
      });
    }
  };
});
function sortCards (c1,c2) {
	return c1.id - c2.id;
}