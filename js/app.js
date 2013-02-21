'use strict';

// Main app module called by index.html
var $dmApp = angular.module('SMART_Disease_Monograph', ['DM.controllers']);

$dmApp.config([
    '$routeProvider', function ($routeProvider) {
        $routeProvider.when('/', {
            templateUrl: 'views/monograph.html',
            controller: '$dmController'
        });
        $routeProvider.otherwise({ redirectTo: '/' });
    }
]);

$dmApp.run(function ($rootScope) {
    $rootScope.sharedVars = {
        serviceBaseUrl: "http://smart.cingulata.us",
        servicePort: "8000",
        version: 'V1.92',
        enableCart: false,
        verboseDisplay: false,
        prefsVisible: false
    }

    $rootScope.buttonLabel = function (arg) {
        return arg ? "On" : "Off";
    }
});

// Not sure where to put this so I will put it here
String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};
