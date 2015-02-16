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

    $scope.$watch('roomName', function(name){
        console.log(name);
    });

    $scope.createRoom = function() {
        $location.path('/room/' + $scope.currentUser + '/' + $scope.roomName);
    };

});

RuChat.controller('roomController', function($scope, $location, $rootScope, $routeParams, socket) {

    $scope.currentRoom = $routeParams.room;
    $scope.currentUser = $routeParams.user;
    $scope.currentUsers = [];
    $scope.errorMessage = '';
    $scope.allMessages = [];
    $scope.allRoomUsers = [];

    var roomObj = {
        room: $scope.currentRoom
    }
    socket.emit('joinroom', roomObj, function(success, reason) {
        console.log(roomObj.room + " was created");
        if (!success) {
            $scope.errorMessage = reason;
        }
    });

    $scope.leaveRoom = function() {
        $location.path('/rooms/' + $scope.currentUser);
    };

    socket.emit('users');

    socket.on('userlist', function(userlist) {
        for (var i = 0; i < userlist.length; ++i) {
            $scope.allRoomUsers[i] = userlist[i];
        }
    });

    socket.emit('rooms');

    socket.on('roomlist', function(list) {
        $scope.currentUsers = list[$scope.currentRoom].users;
        console.log(Object.keys(list[$scope.currentRoom].users));
        for(var i = 0; i < $scope.currentUsers.length; ++i){
            console.log($scope.currentUsers[i]);
        }
    });

    $scope.sendMsg = function() {
        var data = {
            roomName: $scope.currentRoom,
            msg: $scope.message
        };
        socket.emit('sendmsg', data);
        $scope.message = "";
    };

    socket.on('updatechat', function(roomName, history) {
        for (var i = 0; i < history.length; i++) {
            $scope.allMessages[i] = history[i];
        }
    });
});