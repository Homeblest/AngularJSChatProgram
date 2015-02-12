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
            socket.emit('adduser', $scope.nickname, function(available) {
                if (available) {
                    $location.path('/rooms/' + $scope.nickname);
                } else {
                    $scope.errorMessage = 'This nick-name is already taken!';
                }
            });
        }
    };
});

RuChat.controller('roomsController', function($scope, $location, $rootScope, $routeParams, socket) {
    // TODO: Query chat server for active rooms
    $scope.rooms = ['General Chat', 'Roleplay', 'Help', 'History', 'JoinOrDie'];
    $scope.currentUser = $routeParams.user;
});

RuChat.controller('roomController', function($scope, $location, $rootScope, $routeParams, socket) {
    $scope.currentRoom = $routeParams.room;
    $scope.currentUser = $routeParams.user;
    $scope.currentUsers = [];
    $scope.errorMessage = '';

    socket.on('updateusers', function(roomName, users, ops) {
        // TODO: Check if the roomName equals the current room !
        $scope.currentUsers = users;
    });

    socket.emit('joinroom', $scope.currentRoom, function(success, reason) {
        if (!success) {
            $scope.errorMessage = reason;
        }
    });
});