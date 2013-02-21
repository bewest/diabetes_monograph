'use strict';

/* Controller */
var dmController = angular.module('DM.controllers', ['DM.ViewModels','DM.Graph','DM.directives' ]);
    
dmController.controller('$dmController', function ($scope, $rootScope, $dmPatient, $dmViewModels, $dmGraph) {
    // Load view models from patient model. All async loading has been finished by now. In AngularJS, $scope is the (view) model.
    var vm = $scope; // Maybe load to $rootScope?

    var start = function () {
        vm.problemViewModel =       new $dmViewModels.ProblemViewModel();
        vm.medicineViewModel =      new $dmViewModels.MedicineViewModel();
        vm.vitalsViewModel =        new $dmViewModels.VitalsViewModel();
        vm.labResultsViewModel =    new $dmViewModels.LabResultsViewModel();
        vm.diseaseViewModel =       new $dmViewModels.DiseaseViewModel();
        vm.otherInfoViewModel =     new $dmViewModels.OtherInfoViewModel();
        vm.allergyViewModel =       new $dmViewModels.AllergyViewModel();
        vm.cartViewModel =          new $dmViewModels.CartViewModel();

        vm.patientDemographicsViewModel.init();
        vm.problemMedSemanticViewModel.init();

        vm.$watch('diseaseViewModel.disease', function (v) {
            vm.labResultsViewModel.setLabs(v.CID);
        });

        vm.$watch('problemMedSemanticViewModel.probMedSemantics', function () {
            if (vm.problemMedSemanticViewModel.probMedSemantics) {
                vm.problemMedSemanticViewModel.getMedicineProblems();
            }
            else {
                vm.problemMedSemanticViewModel.removeMedicineProblems();
            }
        });

        vm.$watch('patientDemographicsViewModel.deIdOptions.selected.value', function () {
            vm.patientDemographicsViewModel.setDeId()
        });

        vm.graph = new $dmGraph();

        vm.patientDemographicsViewModel.deIdentify().then(function () {
            $('body').fadeIn();
            if (inSMART) {
                vm.graph.plotbp();
                vm.graph.plotldl();
                vm.graph.plota1c();
                vm.$apply();
            }
        });
    }

    // Find out if we are in SMART or dev environments
    var inSMART = (window.location != window.parent.location) ? true : false;

    // Kick start everthing
    var initialize = function () {
        // Need to create these two view models early to avoid null references in prefs
        vm.problemMedSemanticViewModel = new $dmViewModels.ProblemMedSemanticViewModel();
        vm.patientDemographicsViewModel = new $dmViewModels.PatientDemographicsViewModel();

        // For development purposes, always load from JSON - most sections will be overwritten by data in SMART
        $dmPatient.getFromJSON();
    
        if (inSMART) {
            // Load up the patient from SMART
            // Note: we use DI to inject the patient model ($dmPatient) into the view models within the start method
            SMART.ready(function () {
                $.when(
                    $dmPatient.get_demographics(),
                    $dmPatient.get_medications(),
                    $dmPatient.get_problems(),
                    $dmPatient.get_allergies(),
                    $dmPatient.get_vital_sign_sets(),
                    $dmPatient.get_lab_results()
                    )
                .then(function (r) {
                    start();
                });
            });
        }
        else {
            start();
        }
    }();
});
