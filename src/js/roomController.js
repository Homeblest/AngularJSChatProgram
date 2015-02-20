RuChat.controller('roomController', function($scope, $location, $rootScope, $routeParams, socket) {

    $scope.currentRoom = $routeParams.room;
    $scope.currentUser = $routeParams.user;
    $scope.currentUsers = [];
    $scope.errorMessage = '';
    $scope.allMessages = [];
    $scope.allRoomUsers = [];
    $scope.serverMessage = '';
    $scope.roomOps = [];
    $scope.roomObject = {};

    var roomObj = {
        room: $scope.currentRoom
    };
    socket.emit('joinroom', roomObj, function(success, reason) {
        if (!success) {
            $scope.errorMessage = reason;
        }
        sendJoinMsg();
    });

    socket.on('updateusers', function(room, users, ops) {
        // This fires the rooms event which fires the roomlist event.
        socket.emit('rooms');
    });

    // fires when leave button is clicked
    $scope.leaveRoom = function() {
        sendLeaveMsg();
        socket.emit('partroom', $scope.currentRoom);
        $location.path('/rooms/' + $scope.currentUser);
    };

    // Get the user roster for the room
    // to display all connected users in that room
    socket.emit('rooms');
    socket.on('roomlist', function(list) {
        $scope.currentUsers = Object.keys(list[$scope.currentRoom].users);
        $scope.allMessages = list[$scope.currentRoom].messageHistory;
        $scope.roomTopic = list[$scope.currentRoom].topic;
        $scope.roomOps = Object.keys(list[$scope.currentRoom].ops);
    });

    $scope.isOp = function(name) {
        for (var i = 0; i < $scope.roomOps.length; ++i) {
            if(name === $scope.roomOps[i]){
                return true;
            }
        }
    };

    $scope.sendMsg = function() {
        var data = {
            roomName: $scope.currentRoom,
            msg: $scope.message
        };
        socket.emit('sendmsg', data);
        $scope.message = "";
    };
    
    $scope.kick = function (user) {
        var data = {
            room: $scope.currentRoom,
            user: user
        };
        socket.emit('kick', data);
    };

    $scope.isInUserList = function (user) {
        for (var i = 0; i < $scope.currentUsers.length; i++) {
            if ($scope.currentUsers[i] == user) {
                return true;
            }
        }
        // var data = "someString";
        // $scope.$emit('openModal', data);
        return false;
    };

    $scope.ban = function (user) {
        var data = {
            room: $scope.currentRoom,
            user: user
        };
        socket.emit('ban', data);
    };

    var sendJoinMsg = function() {
        var data = {
            roomName: $scope.currentRoom,
            msg: "Joined Room"
        };
        socket.emit('sendmsg', data);
    };

    var sendLeaveMsg = function() {
        var data = {
            roomName: $scope.currentRoom,
            msg: "Left Room"
        };
        socket.emit('sendmsg', data);
    };

    socket.on('updatechat', function(roomName, history) {
        for (var i = 0; i < history.length; i++) {
            $scope.allMessages[i] = history[i];
        }
    });
});