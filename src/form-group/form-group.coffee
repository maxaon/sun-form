module = angular.module 'sun.form.form-group', []
.directive "formGroupConfig", ->
  controller: ($scope, $attrs)->
    @formGroupWidth = ($attrs.formGroupWidth or "3").split(":").map (i)-> parseInt(i)
    if @formGroupWidth.length == 1
      @formGroupWidth[1] = 12 - @formGroupWidth[0]
###
  it seems deprecated
###
module.directive "formGroup", ($translate)->
  restrict   : "AE"
  transclude : true
  require    : '^?formGroupConfig'
  templateUrl: 'form-group/form-group.tpl.html'
  link       : (scope, element, attrs, ctrl)->
    element.addClass('form-group')
    labelWidth = ctrl?.formGroupWidth[0] or 3
    elementWidth = ctrl?.formGroupWidth[1] or 9
    label = element.children('label').addClass("col-sm-#{labelWidth}")
    element.children('div').addClass("col-sm-#{elementWidth}")
    if attrs.label
      $translate(attrs.label).then (tr)-> label.text(tr)

