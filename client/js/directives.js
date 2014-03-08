angular.module('danishDirectives', [])
	.directive('zKeypress', function(){
  return {
    restrict: 'A',
    link: function(scope, elem, attr, ctrl) {
      elem.bind('keydown', function($event){
        scope.$apply(function(s) {
        	if($event.which == 13){
        		if(s.sendMessage(elem[0].value))
        			elem[0].value = "";
        	}
        	else if($event.keyCode == 9){ //tab
        		if($event.shiftKey)
        			elem[0].value = s.previousAutoComplete(elem[0].value);
        		else
        			elem[0].value = s.nextAutoComplete(elem[0].value);
        		$event.preventDefault();
        	}
        	else if($event.which == 8) {// backspace
        		s.stopHistory();
        		var res = s.removeAutoComplete(elem[0].value);
        		if(res){
        			elem[0].value = res;
        			$event.preventDefault();
        		}
        	}
        	else if($event.keyCode == 38){ // Up
        		s.stopAutoComplete();
        		elem[0].value = s.moveUpHistory(elem[0].value);
        	}
        	else if($event.keyCode == 40){ // down
        		s.stopAutoComplete();
        		elem[0].value = s.moveDownHistory(elem[0].value);
        	}
        	else
        		s.stopAutoComplete();
        });
      });
    }
  };
})
.directive('playerCard', function($window){
  return {
    restrict: 'E',
    scope: {
        sizeList: '=size',
        activate: '=activate',
    },
    link: function(scope, elem, attr, ctrl) {
    	elem[0].style.position = 'relative';
    	resize();

		angular.element($window).bind('resize',function(){
    		scope.$apply(resize);
		});

    	function resize() {
    		var parentSize = elem[0].parentElement.clientWidth - 10;
    		var size = parentSize / 71;

    		if(size <= scope.sizeList && scope.activate)
    		{
    			size = ((-parentSize+71)/(scope.sizeList)) + 71;
    			size = Math.max(size, 0);

    			elem[0].style.right = size + 'px';
    			elem[0].style.marginRight = -size + 'px';
			}
    	}
  	}
  };
});
