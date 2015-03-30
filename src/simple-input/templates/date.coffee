angular.module 'sun.form.simple-input.date', [
  'ui.bootstrap.datepicker'
]
.controller "SimpleInputDateController", ($scope, $locale)->
  $scope.format = $locale.DATETIME_FORMATS.mediumDate
  $scope.open = ($event)->
    $event.preventDefault()
    $event.stopPropagation()

    $scope.opened = true
