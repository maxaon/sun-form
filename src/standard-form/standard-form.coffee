###*
  * @author Peter Kicenko
  * @file Standard form with buttons and additional actions
###
module = angular.module 'sun.form.standard-form', [
  'sun.form.standard-form.form-options'
  'sun.form.standard-form.spatial.simple-input-group'
]
.directive 'standartForm', ->
  -> throw new Error("You again misspelled standard form")
module.directive 'standardForm', ($parse, FormOptions)->
  ###*
  * @ngdoc directive
  * @name standardForm
  * @restrict EA
  *
  * @description
  * Directive to wrap standard html form. Based on supplied form options creates action buttons and alert box
  *
  * @param {FormOptions=} options|standardForm (or child) which defines behaviour. Default is FormOptions.
  * @param {string=} ngModel Will be set to formOptions thought `setModel` method
  * @param {string=} name If name is specified, form controller will be published to the scope, under this name
  ###

  restrict: 'EA'
  scope:
    model: '=ngModel'
  transclude: true
  templateUrl: 'standard-form/standard-form.tpl.html'
  link: (scope, element, attrs) ->
    optionName = attrs['standardForm'] or attrs['options']
    scope.options = $parse(optionName)(scope.$parent) or new FormOptions()

    scope.options.setForm(scope.innerForm)

    if scope.options.setModel
      scope.$watch 'model', (model)->
        scope.options.setModel(model) if model

    if attrs.name
      scope.$parent[attrs.name] = scope.innerForm

    scope.getButtonClass = (button)->
      return button.class or if button.default then 'btn btn-primary' else 'btn btn-default'

