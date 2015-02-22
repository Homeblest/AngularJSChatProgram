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
                controller: 'MainController'
            })
            .otherwise({
                redirectTo: '/login'
            });
    }
);





