###*
  * @author Peter Kicenko
  * @file Extended simple input (with prepend and append icon)
###
angular.module('sun.form.standard-form.spatial.simple-input-group', [])
.controller 'InputGroupController', ($scope, $element, $attrs, $transclude, $translate, $compile, $controller)->
  _.extend this, $controller('SimpleInputController', {$scope, $element, $attrs, $transclude})
  this._preCompile = (input)->
    res = $(document.createElement('div')).addClass('input-group')
    prepend = $(document.createElement('span')).addClass('input-group-addon')
    if $attrs.prependIcon
      prepend.append $(document.createElement('i')).addClass($attrs.prependIcon)
      res.append(prepend)
    res.append(input)
    return res
  return this
.directive 'inputGroup', (simpleInputDirective)->
  assert simpleInputDirective.length == 1, 'More than once simpleInputDirective found!'
  _.extend {}, simpleInputDirective[0],
    controller: 'InputGroupController'




