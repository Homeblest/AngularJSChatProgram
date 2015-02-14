var RuChat = angular.module('RuChat', ['ngRoute']);

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

RuChat.controller('roomsController', function($scope, $location, $rootScope, $routeParams, socket) {

    $scope.currentUser = $routeParams.user;
    $scope.allUsers = [];

    socket.emit('rooms');

    socket.on('roomlist', function(list) {
        $scope.rooms = Object.keys(list);
    });

    socket.emit('users');

    socket.on('userlist', function(userlist) {
        for (var i = 0; i < userlist.length; ++i) {
            $scope.allUsers[i] = userlist[i];
        }
    });

    $scope.createRoom = function() {
        if ($scope.roomName === undefined) {
            $scope.errorMessage = 'Please choose a room name before continuing!';
        } else {
            var joinObj = {
                room: $scope.roomName,
                pass: $scope.roomPass
            };
            socket.emit('joinroom', joinObj, function(available) {
                if (available) {
                    $location.path('/room/' + $scope.currentUser + '/' + $scope.roomName);
                } else {
                    $scope.errorMessage = "Some room error occured!";
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

    $scope.sendMsg = function() {
        var data = {
            roomName: $scope.currentRoom,
            msg: $scope.message
        };
        socket.emit('sendmsg', data);
    };

    socket.on('updatechat', function (roomName, history){
        for(var i = 0; i < history.length; i++){
            $scope.allMessages[i] = history[i];
        }
    });

    socket.emit('joinroom', $scope.currentRoom, function (success, reason) {
        if (!success) {
            $scope.errorMessage = reason;
        }
    });
});