'use strict';

/* Directives */

var dmDirectives = angular.module('DM.directives', ['$strap.directives']);

// Single use directives
// *********************************************************************************************************
// show/hide prefs panel
dmDirectives.directive('myPreferences', function ($rootScope) {
    return {
        restrict: 'E',
        link: function (scope, elem, attr) {
            elem.bind('click', function (e) {
                $("#panel").css('border-bottom', 'solid 1px #cccccc').slideToggle("slow", function () {
                    $rootScope.sharedVars.prefsVisible = !$rootScope.sharedVars.prefsVisible;
                    if (!$rootScope.sharedVars.prefsVisible) {
                        $(this).css('border-bottom', 'solid 1px blue');
                    }
                });
                $('.btn-slide').toggleClass("active");
            });
        }
    };
});

// disease selector
dmDirectives.directive('diseaseSelector', function () {
    return {
        restrict: 'E',
        scope: { model: '=', options: '=', disabledoption: '=' },
        controller: function ($scope) {
            $scope.activate = function (option) {
                $scope.model = option;
            };
        },
        template: "<button type='button' style='font-size:9pt' class='btn' name='btn' " +
                  "ng-class='{active: option == model}' " +
                  "ng-disabled='disabledoption==option' " +
                  "ng-repeat='option in options' " +
                  "ng-click='activate(option)'>{{option.diseaseName}} " +
                  "</button>"
    };
});

// Multi-use directives
// *********************************************************************************************************

// slider with option list
dmDirectives.directive('uiDiscreteSlider', function () {
    return {
        restrict: 'E',
        scope: {
            model: '=ngModel'
        },
        link: function (scope, elem, attrs) {
            var options = {
                range: false,
                min: 0,
                max: scope.model.options.length - 1,
                animate: true,
                value: 0,
                slide: function (event, ui) {
                    scope.$apply(function () {
                        scope.model.selected = scope.model.options[ui.value];
                    });
                }
            };
            elem.slider(options);
        },
        replace: true,
        template: '<div></div>'
    };
});

// 0-100 value slider
dmDirectives.directive('uiPercentSlider', function () {
    return {
        restrict: 'E',
        scope: {
            value: '=ngModel'
        },
        link: function (scope, elem, attr) {
            var options = {
                range: false,
                min:0,
                max: 100,
                animate: true,
                value: scope.value * 100,
                slide: function (event, ui) {
                    scope.$apply(function () {
                        scope.value = ui.value / 100.0;
                    });
                }
            };
            elem.slider(options);
        },
        replace: true,
        template: '<div></div>'
    };
});

// fades an element in or out depending on boolean (like built-in ng-show)
dmDirectives.directive('ngDsFade', function () {
    return function (scope, element, attrs) {
        element.css('display', 'none');
        scope.$watch(attrs.ngDsFade, function (value) {
            if (value) {
                element.fadeIn(800);
            }
            else {
                element.fadeOut(800);
            }
        });
    }
});

// Contents of "sections" (from templates) 
dmDirectives.directive('section', [
    '$compile', '$http', '$templateCache', '$timeout', function ($compile, $http, $templateCache) {
        return {
            restrict: "A",
            compile: function (tElement, tAttr) {
                var templateLoader = $http.get('views/templates/' + tAttr.template, { cache: $templateCache })
                .success(function (html) {
                    tElement.html($(html));
                });
                return function(scope, element, attrs) {
                    templateLoader.then(function (templateText) {
                        var compiled = ($compile(templateText.data)(scope));
                        
                        element.html(compiled);
                    });
                }
            }
        }
    }
]);

// Section editors (from templates)
dmDirectives.directive('sectionEditor', [
    '$compile', '$http', '$templateCache', function ($compile, $http, $templateCache) {
        return {

            restrict: "A",
         
            compile: function (tElement, tAttr, $templateCache) {
                var templateLoader = $http.get('views/templates/' + tAttr.template, { cache: $templateCache })
                .success(function (html) {
                    tElement.html($(html));
                });
                var countermodel = tAttr.countermodel;

                return function(scope, element, attrs) {
                    templateLoader.then(function (templateText) {
                        var compiled = ($compile('<div class="dropdown" style="margin-top:-27px; float:right; margin-right:4px"><a class="dropdown-toggle" data-toggle="dropdown" href="#" style="display:inline-block;width:80px;text-align:right;text-decoration:none;"><span style="color:#888;font-weight:800"> {{' + countermodel + '}} </span><img src="img/cog.png" style="border:0; margin-top:-2px"/></a>' + templateText.data + '</div>')(scope));

                        tElement.replaceWith(compiled);
                      
                        compiled.find("ul.dropdown-menu").bind("click", function (e) {
                            e.stopPropagation();
                        });
                    });
                };
            }
        }
    }
]);

// Cart editors (from templates) - NEED TO REFACTOR TO REUSE EDITOR (currently attached to every row)
dmDirectives.directive('cartEditor', [
    '$compile', '$http', '$templateCache', function ($compile, $http, $templateCache) {
        return {

            restrict: "A",
            scope: {
                model: "=ngModel",
                enableCart: "=enabled"
            },
            compile: function (tElement, tAttr, $templateCache) {
                var templateLoader = $http.get('views/templates/' + tAttr.template, { cache: $templateCache })
                .success(function (html) {
                    tElement.html($(html));
                });
               
                return function postLink(scope, element, attrs) {
                    templateLoader.then(function (templateText) {
                        var template = '<span ng-show="(model.selected || model.isDirty)  && enableCart" >' +
                                       '<span class="dropdown">' +
                                       '<a class="dropdown-toggle" data-toggle="dropdown" href="#" style="display:inline-block;width:18px;text-align:left;text-decoration:none;">' +
                                       '<img src="img/cart_small.png" style="border:solid 1px blue" /></a>' +
                                       templateText.data +
                                       '</span></span>';

                        var compiled = ($compile(template)(scope));

                        compiled.find('textarea').bind("click", function (e) {
                            e.stopPropagation();
                        });

                        compiled.find('button').bind("click", function (e) {
                            compiled.find('a').click();
                        });

                        element.replaceWith(compiled);
                     
                        //  Cart editors need access to data in parent scope - NEED TO REFACTOR THIS DIRECTIVE?
                        scope.problemViewModel = scope.$parent.problemViewModel;
                        scope.medicineViewModel = scope.$parent.medicineViewModel;
                    });
                };
            }
        }
    }
]);

// The following are needed to allow lists to be sortable. Need to wait for all to be rendered before calling jQueryUI sortable
dmDirectives.directive('sortSection', function () {
    return function (scope, element, attrs) {
        if (scope.$last === true) {
            element.ready(function () {
                element.parent('.section-content').sortable({
                    axis: 'y',
                    items: 'section',
                    handle: 'header',
                    tolerance: 'pointer',
                    placeHolder: 'section_subheader'
                });
            });
        }
    }
});

dmDirectives.directive('sortLab', function () {
    return function (scope, element, attrs) {
        var fixHelper = function (e, tr) {
            var $originals = tr.children();
            var $helper = tr.clone();

            $helper.children().each(function (index) {
                var width;
                width = $originals.eq(index).width() + 2;
                $(this).width(width);
            });

            return $helper;
        };
        var rowheight; // Fix for IE 8
        if (scope.$last === true) {
            $('tr.sortabletr').bind('mousedown', function () {
                rowheight = $(this).height();
            }).css('cursor', 'pointer');
            element.ready(function () {
                element.parent().sortable({
                    axis: 'y',
                    items: 'tr',
                    helper: fixHelper,
                    start: function (e, ui) {
                        ui.placeholder.height(rowheight);
                        ui.placeholder.html("<td colspan='3'></td>")
                    },
                    tolerance: 'pointer'

                });
            });
        }
    }
});
// This will become a directive to display lab data in a graph
//dmDirectives.directive('graph', function () {
//    return {
//        restrict: 'E',
//        replace: false,

//        scope: {
//            model:'=ngData'
//        },
//        link: function ($scope, elem, attr, ctrl) {
//            $("#foo_graph").height(100);
//            if (attr.ngModel.length > 0) {
//                $.plot($("#foo_graph"), [attrs.ngModel], patientModel.a1c_flot_opts);
//                if (!$scope.$$phase)
//                    $scope.$apply();
//            }

//        },
//        template:   "<section class='section'>" + 
//                    "<header class='section_header'>" + 
//                    "A1C <span class='smaller' style='font-weight: normal'>goal < 7%</span>" +
//                    "</header>" +
//                    "<div id='foo_graph'></div>" + 
//                    "</section>"
//    };
//});
