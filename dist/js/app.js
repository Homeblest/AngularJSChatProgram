var RuChat = angular.module('RuChat', ['ngRoute', 'luegg.directives', 'ui.bootstrap']);

RuChat.config(
    function($routeProvider) {
        $routeProvider
            .when('/login', {
                templateUrl: 'partials/login.html',
                controller: 'loginController'
            })
            .when('/rooms/:user', {
                templateUrl: 'partials/rooms.html',
                controller: 'roomsController'
            })
            .when('/room/:user/:room/', {
                templateUrl: 'partials/room.html',
                controller: 'roomController'
            })
            .otherwise({
                redirectTo: '/login'
            });
    }
);






RuChat.factory('socket', function ($rootScope) {
    var socket = io.connect('http://localhost:8080');
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        }
    };
});
RuChat.controller('loginController', function($scope, $location, $rootScope, $routeParams, socket) {

    $scope.errorMessage = '';
    $scope.nickname = '';

    $scope.login = function() {
        if ($scope.nickname === '') {
            $scope.errorMessage = 'Please choose a username before continuing!';
        } else {
            var nick = $scope.nickname;
            socket.emit('adduser', nick, function(available) {
                if (available) {
                    $location.path('/rooms/' + $scope.nickname);
                } else {
                    $scope.errorMessage = 'This username is already taken!';
                }
            });
        }
    };
});
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
        //socket.emit('partroom', $scope.currentRoom);
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

    socket.on('updatechat', function (roomName, history) {
        for (var i = 0; i < history.length; i++) {
            $scope.allMessages[i] = history[i];
        }
    });
});
RuChat.controller('roomsController', function($scope, $location, $rootScope, $routeParams, socket) {

    $scope.currentUser = $routeParams.user;
    $scope.allUsers = [];

    // Get the list of all rooms
    socket.emit('rooms');
    // respond to emitted event from server
    socket.on('roomlist', function(list) {
        $scope.rooms = Object.keys(list);
    });

    socket.emit('users');

    socket.on('userlist', function(userlist) {
        for (var i = 0; i < userlist.length; ++i) {
            $scope.allUsers[i] = userlist[i];
        }
    });

    $scope.createRoom = function(roomName) {
        //$location.path('/room/' + $scope.currentUser + '/' + $scope.roomName);
        var joinObj = {
            room: roomName
        };
        socket.emit('joinroom', joinObj, function(success, reason) {
            if (!success) {
                $scope.errorMessage = reason;
            }
            sendJoinMsg(roomName);
        });

        socket.emit('getUserChannels');
        socket.emit('rooms');

    };

    $scope.curUserChannels = {};

    socket.emit('getUserChannels');

    socket.on('getCurUserChannels', function(channels) {
        $scope.curUserChannels = channels;
    });

    $scope.data = {
        roomName: "",
        msg: ""
    };

    $scope.sendMsg = function(channel) {

        $scope.data.msg = $scope.data.msg;
        $scope.data.roomName = channel;

        socket.emit('sendmsg', $scope.data);
        $scope.data.msg = "";
    };


    socket.on('updatechat', function(roomName, history) {
        $scope.curUserChannels[roomName].messageHistory = history;
    });

    var sendJoinMsg = function(roomName) {
        var data = {
            roomName: roomName,
            msg: "Joined Room"
        };
        socket.emit('sendmsg', data);
    };

    var sendLeaveMsg = function(roomName) {
        var data = {
            roomName: roomName,
            msg: "Left Room"
        };
        socket.emit('sendmsg', data);
    };

});