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

    //for ui-bootstrap if using dropdown in userlist
    // $scope.collapseChat = function() {
    //     $(.collabsable).toggleClass(.hide);
    // };
    
    // $scope.kick = function () {
    //     var data = {
    //         room: $scope.currentRoom,
    //         user: $scope.currentUser
    //     };
    //     socket.emit('kick', data);
    // }

    // $scope.ban = function () {
    //     var data = {
    //         room: $scope.currentRoom,
    //         user: $scope.currentUser
    //     };
    //     socket.emit('ban', data);
    // }

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