'use strict';

angular.module('bahmni.clinical')
    .controller('DiagnosisController', ['$scope', '$rootScope', '$stateParams', 'diagnosisService', 'contextChangeHandler',
     function ($scope, $rootScope, $stateParams, diagnosisService, contextChangeHandler) {

        $scope.placeholder = "Add Diagnosis";
        $scope.hasAnswers = false;

        // TODO : Mujir/Sushmita - remove this hard coding. 'Ruled Out' would not be configured as certainty in OpenMRS.
        $scope.orderOptions = ['PRIMARY', 'SECONDARY'];
        $scope.certaintyOptions = ['CONFIRMED', 'PRESUMED', Bahmni.Common.Constants.ruledOutCertainty];

        $scope.getDiagnosis = function (searchTerm) {
            return diagnosisService.getAllFor(searchTerm);
        };

        var _canAdd = function (diagnosis) {
            var canAdd = true;
            $scope.diagnosisList.forEach(function (observation) {
                if (observation.conceptName === diagnosis.conceptName) {
                    canAdd = false;
                }
            });
            return canAdd;
        };

        var addDiagnosis = function (concept, index) {
            var diagnosisBeingEdited = $scope.diagnosisList[index];
            if (diagnosisBeingEdited) {
                var diagnosis = new Bahmni.Clinical.Diagnosis(concept, diagnosisBeingEdited.order,
                    diagnosisBeingEdited.certainty, diagnosisBeingEdited.existingObsUuid);
            }
            else {
                var diagnosis = new Bahmni.Clinical.Diagnosis(concept);
            }
            if (_canAdd(diagnosis)) {
                $scope.diagnosisList.splice(index, 1, diagnosis);
            }
        };

        var addPlaceHolderDiagnosis = function () {
            var diagnosis = new Bahmni.Clinical.Diagnosis('');
            $scope.diagnosisList.push(diagnosis);
        };

        var init = function () {
            if ($rootScope.consultation.diagnoses === undefined || $rootScope.consultation.diagnoses.length === 0) {
                $scope.diagnosisList = [];
            }
            else {
                $scope.diagnosisList = $rootScope.consultation.diagnoses;
            }
            contextChangeHandler.add(allowContextChange);
            addPlaceHolderDiagnosis();
        };

        var allowContextChange = function () {
            var invalidDrugs = $scope.diagnosisList.filter(function (diagnosis) {
                return !diagnosis.isValid();
            });
            return invalidDrugs.length === 0;
        };


        $scope.selectItem = function (item, index) {
            addDiagnosis(item.concept, index);
        };

        $scope.removeObservation = function (index) {
            if (index >= 0) {
                $scope.diagnosisList[index].voided = true;
            }
        };

        $scope.$on('$destroy', function () {
            $rootScope.consultation.diagnoses = $scope.diagnosisList.filter(function (diagnosis) {
                return !diagnosis.isEmpty();
            });
        });

        $scope.processDiagnoses = function (data) {
            data.map(
                function (concept) {
                    if (concept.conceptName === concept.matchedName) {
                        return {
                            'value': concept.matchedName,
                            'concept': concept
                        }
                    }
                    return {
                        'value': concept.matchedName + "=>" + concept.conceptName,
                        'concept': concept
                    }
                }
            );
        };

        $scope.clearEmptyRows = function (index) {
            var iter;
            for (iter = 0; iter < $scope.diagnosisList.length; iter++) {
                if ($scope.diagnosisList[iter].isEmpty() && iter !== index) {
                    $scope.diagnosisList.splice(iter, 1)
                }
            }
            var emptyRows = $scope.diagnosisList.filter(function (diagnosis) {
                    return diagnosis.isEmpty();
                }
            );
            if (emptyRows.length == 0) {
                addPlaceHolderDiagnosis();
            }
        };

        $scope.isValid = function (diagnosis) {
            return diagnosis.isValid();
        };

        init();

    }]);
