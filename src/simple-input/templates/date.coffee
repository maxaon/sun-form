angular.module 'sun.form.simple-input.date', [
  'ui.bootstrap.datepicker'
]
.config "SimpleInputOptions", (SimpleInputOptions) ->
  SimpleInputOptions.inputs.date =
    date:
      controller : 'SimpleInputDateController'
      templateUrl: 'date.tpl.html'
.controller "SimpleInputDateController", ($scope, $locale)->
  $scope.format = $locale.DATETIME_FORMATS.mediumDate
  $scope.open = ($event)->
    $event.preventDefault()
    $event.stopPropagation()

    $scope.opened = true
