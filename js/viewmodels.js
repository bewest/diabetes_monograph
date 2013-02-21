'use strict';

/* Application View Models
This is where most of the application logic resides. Here we combine data (from the model) with app-specific properties and functions for data binding, ui rendering, etc.
Note that we also have a dependency on the semantic services, as these modify, enhance, or organize data from the underlying model.
Depends on Mod
*/

var DMViewModels = angular.module('DM.ViewModels', ['DM.SemanticServices', 'DM.PatientServices']);

DMViewModels.factory('$dmViewModels', function ($dmSemantics, $dmPatient) {
    return {
        DiseaseViewModel: function() {
            this.diseases = [{ "diseaseName": "Diabetes", "CID": "44054006" }, { "diseaseName": "Hypothyroidism", "CID": "40930008" }, { "diseaseName": "Anemia", "CID": "271737000" }, { "diseaseName": "Asthma", "CID": "195967001" }, { "diseaseName": "New...", "CID": "" }];

            this.disease = this.diseases[0];
            this.disableddisease = this.diseases[4];

            this.patientHasDiseaseFrom = function () {
                var problems = $dmPatient.patient.problems;
                var problem = _.where(problems, {CID: this.disease.CID});
                if (problem.length > 0) {
                    this.show = true;
                    var now = new XDate();
                    var then = new XDate(problem[0].startDate);
                    var yrs = then.diffYears(now);
                    return Math.floor(yrs);
                }

                else {
                    this.show = false
                    return "";
                }
            }
        },
        ProblemViewModel: function () {
            this.problems = $dmPatient.patient.problems;

            this.categories = [{label:"Normal", filter:"Normal", show:true}, {label:"CoMorbidity",filter: 'CoMorbidity',show:true}, {label:"Resolved",show:true}];

            this.checkedOptions = function () {
                var sum = 0;
                _.each(this.categories, function (item) {
                    if (item.show)
                        sum += 1;
                });
                return (sum + '/' + this.categories.length);
            };

            this.hasFilteredProblems = function (filter) {
                var filtered = _.where(this.problems, { category: filter });
                return filtered.length == 0;
            };

            this.setSelected = function (problem) {
                _.each(this.problems, function (p) {
                    if (p.CID != problem.CID)
                        p.selected = false;
                });
                problem.selected = !problem.selected; 
            };

            this.setStatus = function (problem, status) {
                if (status == "clear") {
                    problem.status = "";
                    problem.isDirty = false;
                    problem.note = "";
                }
                else {
                    problem.status = status;
                    problem.isDirty = true;
                }
                problem.selected = false;
            };

            this.cartUnselect = function () {
                _.each(this.problems, function (p) {
                    p.selected = false;
                });
            };

            this.getCartItems = function () {
                return _.where(this.problems, { "isDirty": true });
            };
        },
        MedicineViewModel: function () {
            this.medicines = $dmPatient.patient.medicines;

            this.medNames = false;
            
            this.sort = 'alpha';
            this.setMedNames = function () {
                var self = this;
                if (this.medNames) {
                    $dmSemantics.MedicineRxTerms(_.pluck(this.medicines, 'rxCui')).then(function (data) {
                        self.medicines.forEach(function (med, i) {
                            var rxterm = _.where(data, { RxCui: med.rxCui });
                            if (rxterm) {
                                med.rxNameOrig = med.rxName;
                                med.rxName = rxterm[0].DisplayNameSynonym;
                                med.strengthAndDoseFormOrig = med.strengthAndDoseForm;
                                med.strengthAndDoseForm = rxterm[0].StrengthAndDoseForm;
                                med.SYOrig = med.SY;
                                med.SY = rxterm[0].DisplayNameSynonym;
                            }
                        });
                        self.setSort();
                    });
                }
                else {
                    this.medicines.forEach(function (med, i) {
                        med.rxName = med.rxNameOrig;
                        med.strengthAndDoseForm = med.strengthAndDoseFormOrig;
                        med.SY = med.SYOrig;
                    });
                    this.setSort();
                }
            };
            this.setSort = function () {
                if (this.sort == 'alpha') {
                    this.sortAlpha();
                }
                if (this.sort == 'chrono') {
                    this.sortChrono();
                }
            };
            this.sortAlpha = function () {
                this.medicines = _(this.medicines).sortBy(function (med) {
                    return String.fromCharCode((med.rxName.toLowerCase().charCodeAt(0)));
                });
            };
            this.sortChrono = function () {
                this.medicines = _(this.medicines).sortBy(function (med) {
                    var d = new XDate(med.startDate);

                    return -d.valueOf();
                });
            };
            this.setSelected = function (med) {
                _.each(this.medicines, function (m) {
                    if (m.rxCui != med.rxCui)
                        m.selected = false;
                });
                med.selected = !med.selected;
            };
            this.setStatus = function (med, status) {
                if (status == "clear") {
                    med.status = "";
                    med.isDirty = false;
                    med.note = "";
                }
                else {
                    med.status = status;
                    med.isDirty = true;
                }
                med.selected = false;
            };

            this.checkStatus = function (med, status) {
                return med.status == status;
            };

            this.cartUnselect = function () {
                _.each(this.medicines, function (m) {
                    m.selected = false;
                });
            };
            
            this.getCartItems = function () {
                return _.where(this.medicines, {"isDirty": true});
            }
        },
        VitalsViewModel: function() {
            this.vitals = $dmPatient.patient.vitals;

            _(this.vitals).each(function (vital) {
                vital.data = _(vital.data).sortBy(function (r) {
                    return -(new XDate(r.date)).valueOf();
                });
            });
        },
       
        LabResultsViewModel: function () {
            this.showDecisionSupport = false;
           
            this.checkedOptions = function () {
                if (this.labPanels) {
                    var total = this.labPanels.length;
                    var sum = 0;
                    _.each(this.labPanels, function (panel) {
                        if (panel.show)
                            sum += 1;
                    });
                    return sum + '/' + total;
                }
            };

            // Organize labs into panels and filter panels by disease using semantic services. Service also returns normal ranges by patient sex/age.
            this.setLabs = function (disease) {
                var self = this;
                var patientDemographics = {
                    medicalRecordNumber: $dmPatient.patient.medicalRecordNumber,
                    givenName: $dmPatient.patient.givenName,
                    familyName: $dmPatient.patient.familyName,
                    bday: $dmPatient.patient.bday,
                    age: $dmPatient.patient.age,
                    gender: $dmPatient.patient.gender
                };
                $dmSemantics.LabPanels(patientDemographics, disease).then(function (thedata) {
                    var LabPanels = _.sortBy(thedata, function (item) {
                        return item.panelOrder;
                    });

                    LabPanels = _.filter(LabPanels, function (panel) {
                        return panel.tests.length > 0;
                    });

                    _(LabPanels).each(function (panel) {
                        panel.show = !panel.hidePanel && panel.tests.length > 0;
                        _(panel.tests).each(function (test) {
                            var loinc = test.loinc;
                            test.range = test.testMin + '-' + test.testMax;// + ' ' + test.units;
                   
                            var data = _.where($dmPatient.patient.labs, { 'loinc': loinc });
                            
                            if (data.length >= 1) {
                                test.hasData = true;
                                var testdata = _.sortBy(data[0].data, function (t) {
                                    var d = new XDate(t.date);
                                    t.order = d.getTime();
                                    return -t.order;
                                });
                                test.data = testdata;
                                _.each(test.data, function (data) {
                                    data.flag = false;
                                    if (Number(data.value) != NaN && Number(test.testMin) != NaN && Number(test.testMax) != NaN) {
                                        if (Number(data.value) < Number(test.testMin) || Number(data.value) > Number(test.testMax)) {
                                            data.flag = true;
                                        }
                                    }
                                });
                            }
                            else {
                                test.hasData = false;
                                test.data = [{'value':'-'}, {'value':'-'}]
                            }
                        });
                    });
           
                    self.labPanels = LabPanels;
                   
                    // Semantic service returns DS by analysis of lab data
                    $dmSemantics.DecisionSupport(LabPanels).then(function (thedata) {
                        self.reminders = thedata;
                    });
                });
            };
            this.labPanels = {};
            this.reminders = {}
        },
        OtherInfoViewModel: function() {
            this.otherinfo = $dmPatient.patient.otherinfo;
            
            this.setOtherInfo = function () {
                //TODO
            }
        },
        AllergyViewModel: function() {
            this.allergies = $dmPatient.patient.allergies;
        },
        PatientDemographicsViewModel: function () {
            this.init = function() {
                this.patientDemographics = {
                    medicalRecordNumber: $dmPatient.patient.medicalRecordNumber,
                    givenName: $dmPatient.patient.givenName,
                    familyName: $dmPatient.patient.familyName,
                    bday: $dmPatient.patient.bday,
                    age: $dmPatient.patient.age,
                    gender: $dmPatient.patient.gender
                };
                this.origPatientDemographcs = JSON.parse(JSON.stringify(this.patientDemographics));
            };

            this.deIdOptions = {
                options: [{ name: 'None', value: '' }, { name: 'Redact all', value: 'redact_all' }, { name: 'Publication', value: 'publication' }, { name: 'Aggregation', value: 'aggregation' }],
                selected: {name: 'None', value: ''}
            };
            
            this.setDeId = function () {
                if (this.deIdOptions.selected.value != '') {
                    this.deIdentify();
                }
                else {
                    this.deDeIdentify();
                }
            };

            this.deIdentify = function () {
                var self = this;
                return $.Deferred(function (dfd) {
                    if (self.deIdOptions.selected.value != '') {
                        self.showPatient = 'invisible';
                        self.deDeIdentify();
                        $dmSemantics.DeIdentify(self.patientDemographics, self.deIdOptions.selected.value).then(function (data) {
                            for (var prop in data) {
                                if (typeof (data[prop]) === "string")
                                    self.patientDemographics[prop] = data[prop];
                            }
                            self.showPatient = 'visible';
                            dfd.resolve();
                        });
                    }
                    else
                        dfd.resolve();
                }).promise();
            };
            this.deDeIdentify = function () {
                for (var prop in this.origPatientDemographcs) {
                    if (typeof (this.origPatientDemographcs[prop]) === "string")
                        this.patientDemographics[prop] = this.origPatientDemographcs[prop];
                }
            };
        },
        ProblemMedSemanticViewModel: function () {
            var self = this;

            var medicines = $dmPatient.patient.medicines;
            var problems = $dmPatient.patient.problems;
            var medicineproblems;

            this.init = function() {
                medicines = $dmPatient.patient.medicines;
                problems = $dmPatient.patient.problems;
            }

            this.probMedSemantics = false;
            this.colorPerc = 0;
            this.beginColor = new RGBColor('#E46C0A');
            this.endColor = new RGBColor('#202ef3');
            this.dimAlpha = 0.5;

            this.getDimStyle = function () {
                return { 'border': 'solid 1px #cccccc', 'height': '14px', 'width': '30px', 'background-color': getDimRGB() }
            };
           
            this.getBgColorStyle = function () {
                return {
                    'border': 'solid 1px #cccccc', 'height': '14px', 'width': '30px', 'background-color': getRGB()
                };
            };

            var getDim = function () {
                return { opacity: self.dimAlpha };
            };

            var getDimRGB = function () {
                return 'rgb(' + gradedValue(255, 0, self.dimAlpha) + ',' + gradedValue(255, 0, self.dimAlpha) + ',' + gradedValue(255, 0, self.dimAlpha) + ')';
            };

            var getRGB = function () {
                return 'rgb(' + gradedValue(self.beginColor.r, self.endColor.r, self.colorPerc) + ',' + gradedValue(self.beginColor.g, self.endColor.g, self.colorPerc) + ',' + gradedValue(self.beginColor.b, self.endColor.b, self.colorPerc) + ')';
            };
    
            var gradedValue = function (start, end, percent) {
                return start + Math.floor((percent * (end - start)));
            };

            // Event handlers - hooked to medicine and problem sections
            this.mouseAction = {
                options: [{ name: "Hover", value: "Hover" }, { name: "Click", value: "Click" }],
                selected: { name: "Hover", value: "Hover" }

            };

            this.semanticHighlight = {
                options: [{ name: "Both", value: "Both" }, {name:"Highlight",value:"Highlight"}, {name:"Dim", value:"Dim"}],
                selected: { name: "Both", value: "Both" }
            };

            this.medMouseDown = function (med) {
                if (this.mouseAction.selected.value == "Click" && this.probMedSemantics)
                    findProblems(med, this);
            };

            this.medMouseUp = function (med) {
                if (this.mouseAction.selected.value == "Click" && this.probMedSemantics)
                    unhighlight();
            };

            this.medMouseOver = function (med) {
                if (this.mouseAction.selected.value == "Hover" && this.probMedSemantics)
                    findProblems(med, this);
            };
            this.medMouseLeave = function (med) {
                if (this.mouseAction.selected.value == "Hover" && this.probMedSemantics)
                    unhighlight();
            };
            this.problemMouseDown = function (problem) {
                if (this.mouseAction.selected.value == "Click" && this.probMedSemantics)
                    findMeds(problem, this);
            };
            this.problemMouseUp = function (problem) {
                if (this.mouseAction.selected.value == "Click" && this.probMedSemantics)
                    unhighlight();
            };
            this.problemMouseOver = function (problem) {
                if (this.mouseAction.selected.value == "Hover" && this.probMedSemantics)
                    findMeds(problem, this);
            };
            this.problemMouseLeave = function (problem) {
                if (this.mouseAction.selected.value == "Hover" && this.probMedSemantics)
                    unhighlight();
            };

            this.getMedicineProblems = function () {
                medicineproblems = [];
                $dmSemantics.MedicineProblems(_.pluck(medicines, 'rxCui')).then(function (data) {
                    data.forEach(function (item, i) {
                        addMedProblem(item.RxCui, item.CID);
                    });
                });
            };

            this.removeMedicineProblems = function () {
                medicineproblems = [];
            };

            var addMedProblem = function (rxCui, CID) {
                var med = _.find(medicines, function (med) {
                    return med.rxCui == rxCui
                });
                var problem = _.find(problems, function (problem) {
                    return problem.CID == CID
                });
                if (med && problem)
                    medicineproblems.push({ 'medicine': med, 'problem': problem });
            };
            
            var findMeds = function (problem) {
                _.each(problems, function (p) {
                    p.style = (self.semanticHighlight.selected.value == 'Dim' || self.semanticHighlight.selected.value == 'Both') ? getDim() : {};
                });
                problem.style = { 'color': getRGB(), 'cursor': 'pointer' };
                _.each(medicines, function (m) {
                    m.style = (self.semanticHighlight.selected.value == 'Dim' || self.semanticHighlight.selected.value == 'Both') ? getDim() : {};
                });
                _.each(medicineproblems, function (mp) {
                    if (mp.problem.CID == problem.CID) {
                        mp.medicine.style = (self.semanticHighlight.selected.value == 'Highlight' || self.semanticHighlight.selected.value == 'Both') ? { 'color': getRGB(), 'cursor': 'pointer' } : {};
                    }
                });
            };
            var findProblems = function (med) {
                _.each(medicines, function (m) {
                    m.style = (self.semanticHighlight.selected.value == 'Dim' || self.semanticHighlight.selected.value == 'Both') ? getDim() : {};
                });
                med.style = { 'color': getRGB(), 'cursor': 'pointer' };
                _.each(problems, function (p) {
                    p.style = (self.semanticHighlight.selected.value == 'Dim' || self.semanticHighlight.selected.value == 'Both') ? getDim() : {};
                });
                _.each(medicineproblems, function (mp) {
                    if (mp.medicine.rxCui == med.rxCui) {
                        mp.problem.style = (self.semanticHighlight.selected.value == 'Highlight' || self.semanticHighlight.selected.value == 'Both') ? { 'color': getRGB() } : {};
                    }
                });
            };
            var unhighlight = function () {
                _.each(medicines, function (med) {
                    med.style = {};
                });
                _.each(problems, function (problem) {
                    problem.style = {};
                });
            };
        },
        CartViewModel: function () {
            this.getCartNum = function () {
                var count = 0;
                _.each($dmPatient.patient.problems, function (problem) {
                    if (problem.isDirty)
                        count++;
                });
                _.each($dmPatient.patient.medicines, function (med) {
                    if (med.isDirty)
                        count++;
                });
                return count;
            };

            this.getCartDisabled = function () {
                if (this.getCartNum() > 0) {
                    return true;
                }
                return false;
            }
        }
    }
});