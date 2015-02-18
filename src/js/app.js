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





