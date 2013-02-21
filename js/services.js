'use strict';

/* Semantic CORS services */
var DMSemanticServices = angular.module('DM.SemanticServices',[]);

DMSemanticServices.factory('$dmSemantics', function ($rootScope, $http, $q, $timeout) {

    var serviceUrl = $rootScope.sharedVars.serviceBaseUrl + ':' + $rootScope.sharedVars.servicePort;

    return {
        MedicineProblems: function (meds) {
            var deferred = $q.defer();
            $http.post(serviceUrl + '/problems_meds', meds).
            success(function (data, status, headers, config) {
                deferred.resolve(data.result);
            });
            return deferred.promise;
        },
        MedicineRxTerms: function (meds) {
            var deferred = $q.defer();
            $http.post(serviceUrl + '/problems_meds/meds', meds).
            success(function (data, status, headers, config) {
                deferred.resolve(data.result);
            });
            return deferred.promise;
        },
        DeIdentify: function (patientDemographics, mode) {
            var deferred = $q.defer();
            $http.post(serviceUrl + '/de_ident/' + mode, patientDemographics).
            success(function (data, status, headers, config) {
                deferred.resolve(data.result);
            });
            return deferred.promise;
        },
        LabPanels: function (patientDemographics, CID) {
            var deferred = $q.defer();
            var payload = { "gender": patientDemographics.gender[0].toUpperCase(), "age": patientDemographics.age };
            var data = { 'restrict': JSON.stringify(payload) };
            $http.post(serviceUrl + '/test/1234/6/' + CID, data).
               success(function (data, status, headers, config) {
                   deferred.resolve(data);
               }).
                error(function (data, status, headers, config) {
               
               });
            return deferred.promise;
        },
        DecisionSupport: function (labPanels) {
            var deferred = $q.defer();
            var data = {'dsData': JSON.stringify(labPanels)};
            $http.post(serviceUrl + '/test/check/', data).
            success(function (data, status, headers, config) {
                deferred.resolve(data);
            });
            return deferred.promise;
        }
    }
});