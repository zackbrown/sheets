/**
 * @ngdoc directive
 * @name tsSheet
 * @module ts.sheets
 * @restrict A
 * @param {string} tsSheet the name of the sheet you want to apply to this DOM subtree
 * ts-sheet allows you to apply a Sheet to a DOM node's 'subtree
 * Use it in conjunction with $media.$sheet to apply responsive, declarative, and reactive animations or DOM-manipulation to your application.
 */
angular.module('ts.sheets')
  .directive('tsSheet', ["$media", function ($media) {
    return {
      restrict: 'A',
      scope: false,
      compile: function () {
        return {
          post: function (scope, element, attrs) {
            //TODO:  $observe tsSheet to support dynamic sheet binding.  Will need to clean up (probably using $media.$clearSheets)
            //TODO:  support arrays of multiple sheets per element (scope.$eval(attrs.tsSheet))
            scope.$$postDigest(function(){
              $media.$applySheet(element, attrs.tsSheet);
            });

            scope.$on('$destroy', function(){
              $media.$clearSheets(element, attrs.tsSheet);
            })
          }
        };
      }
    };
  }]);
