###*
  * @author Peter Kicenko
  * @file Wrapper for inputs
  * @description Wrapper for different input elements to use with standard-form
###
angular.module 'sun.form.simple-input', [
  'pascalprecht.translate'
  'ui.router'
  'ngMessages'
  'sun.form.simple-input.date'
  'sun.form.form-group'
]
.provider 'SimpleInputOptions', ->
  options = this
  options.pathPrefix = 'simple-input/templates/'
  options.inputs =
    select  :
      templateUrl: 'select.tpl.html'
    date    :
      controller : 'SimpleInputDateController'
      templateUrl: 'date.tpl.html'
    textarea:
      templateUrl: 'textarea.tpl.html'
    checkbox:
      templateUrl: 'switch.tpl.html'
    $default:
      templateUrl: 'input.tpl.html'
  # Get default config for `type`
  options.getDefault = (type)->
    return options.inputs.$default

  this.$get = ->
    if options.pathPrefix
      for own type,opt of options.inputs
        if options.inputs[type].templateUrl
          options.inputs[type].templateUrl = options.pathPrefix + options.inputs[type].templateUrl
    return options

  return
.controller 'SimpleInputController', ($scope, $element, $transclude, $attrs, $q, $translate, $compile, $controller,
                                      SimpleInputOptions, $templateFactory)->
  class SimpleInputController

    init: (formController, formGroupController)->
      @formController = formController
      @formGroupConfig = formGroupController
      @hideLabel = $attrs.hideLabel in ['true', '1', 'hide-label', '']
      @labelWidth = parseInt($attrs.labelWidth) or @formGroupConfig?.formGroupWidth[0] or 3
      @elementWidth = parseInt($attrs.elementWidth) or @formGroupConfig?.formGroupWidth[1] or 9
      @elementWidth += @labelWidth if @hideLabel and not $attrs.elementWidth

      @type = $attrs.type or 'text'
      @name = this._getName()

      @formGroup = $element.children('div')
      @inputGroup = @formGroup.children('div')
      @destinationElement = $element.find('[inner-content]')

      @label = @formGroup.children('label')

    render: ->
      this._processExistingContent()
      .then =>
        this._insertMessages()
        this._addClasses()
        $scope.inputCtrl = this._getInputController()
        _.extend($scope, this._getScopeVariables())

    _addClasses: ->
      cls = if this.hideLabel then  'sr-only' else "col-sm-#{this.labelWidth}"
      this.label.addClass(cls)
      this.inputGroup.addClass("col-sm-#{this.elementWidth}")

    _getInputController: ->
      if this.name and this.formController
        this.formController[this.name]
      else
        return undefined
    _getScopeVariables : ->
      vars = {}
      vars.name = @name
      vars.type = @type
      vars.label = $scope.label
      vars.id = "#{@name}-id" if @name
      return vars

    _extractMessages: (elements)->
      res = []
      this.__messages = messages = []
      elements.each (i, e)->
        if e.tagName?.toLowerCase() == "message" # message tag
          messages.push
            when   : e.attributes.when.value
            message: e.innerHTML
            e      : e
          return
        else if e.nodeType == e.TEXT_NODE and not e.textContent.trim()  # empty text
          return
        res.push(e)
      this.__messagesExtracted = true
      return res

    _processExistingContent: ->
      deferred = $q.defer()
      $transclude (innerElements, scope) =>
        innerElements = this._extractMessages(innerElements)

        this._useExisting = innerElements.length != 0

        if this._useExisting
          res = this.destinationElement.html(innerElements)
        else
          res = this._processStandardInput(scope)

        deferred.resolve(res)

      return deferred.promise

    _processStandardInput: (scope)->
      options = SimpleInputOptions.inputs[this.type] or SimpleInputOptions.getDefault(this.type)
      $templateFactory.fromConfig(options)
      .then (templateText)=>
        _.extend(scope, this._getScopeVariables())

        template = angular.element(templateText)
        input = template.closest("[ng-model]").add(template.find("[ng-model]"))

        this._updateName(input, this._getName())
        this._attachInputAttributes($element[0].attributes, input)
        this._traverseNgModel(input, $attrs.ngModel)

        template = this._preCompile(template)

        if options.controller
          controller = $controller(options.controller, {$scope: scope, options})
          if options.controllerAs
            scope[options.controllerAs] = controller

        this.destinationElement.html(template)


        $compile(this.destinationElement.contents())(scope)

        scope.inputCtrl = this._getInputController()

    _attachInputAttributes: (attrs, to)->
      for attr in attrs
        if attr.name.indexOf('in-') == 0
          k = attr.name.slice(3)
          v = attr.value
          to.attr(k, v)

    _getName: ->
      if this._useExisting
        return $attrs.name
      else
        return $attrs.name or $attrs.ngModel

    _updateName: (element, name)->
      element.attr('name', name)

    _preCompile: (input)->
      return input

    _getMessages: ->
      if not this.__messagesExtracted
        throw new Error("messages were not extracted. Wrong function order call")
      return this.__messages

    _insertMessages: ->
      msgs = $element.find('[ng-messages]')
      for m in this._getMessages() || []
        msgs.append(m.e)
        $compile(m.e)($scope)

    _traverseNgModel: (input, name)->
      input.attr('ng-model', name)

  _.extend(this, SimpleInputController.prototype)
  return
.directive "simpleInput", ->
  ###*
    * @ngdoc directive
    * @name simpleInput
    * @restrict E
    *
    * @description
    * Element to simplify usage of standard html input and an a wrapper for custom inputs.
    *
    * Using directive message with attribute `when` can be used to extend error messages.
    * ```html
    *   <message when="validator">Some error message</message>
    * ```
    *
    * Directive can be user in two different ways. As standalone and as a wrapper.
    * In a standalone mode `ngModel` is required. For a correct work in a wrapper mode same value of attribute `name`
    * and form element is required for correct working
    *
    * @example
    * Simple work in a standalone mode
    <example>
      <file name="index.html">
        <form>
          <simple-input label="Text" ng-model="model.value"></simple-input>
        </form>
      </file>
    </example>
    *
    * @example
    * Work in a standalone work with custom messages and custom validator matches
    <example>
      <file name="index.html">
        <form>
          <simple-input label="Password repeat" ng-model="model.passwordRepeat" in-required
                        in-matches="model.password">
             <message when="matches">{{ 'Passwords doesn't match' | translate }}</message>
          </simple-input>
        </form>
      </file>
    </example>
    *
    * @example
    * Example of work as a wrapper for ui-select.
    <example>
      <file name="index.html">
        <form>
          <simple-input label="Some select of person" name="person">
            <ui-select ng-model="person.selected" name="person">
              <ui-select-match placeholder="Select a person in the list or search his name/age...">
                {{$select.selected.name}}
              </ui-select-match>
              <ui-select-choices repeat="person in people | propsFilter: {name: $select.search, age: $select.search}">
                <div ng-bind-html="person.name | highlight: $select.search"></div>
              </ui-select-choices>
            </ui-select>
          </simple-input>
        </form>
      </file>
    </example>
    *

    * @param {string=} label Label for the input, also used as a placeholder
    * @param {string=} type of the input ('text', 'number', 'select','textarea', etc). If template is registered in
    *     `SimpleInputOptions` template will be used, or SimpleInputOptions.getDefault will be invoked if specific type
    *     will not be found.
    * @param {string=} ngModel  Assignable angular expression to data-bind to. Do not use 'simple' refference to model,
    *     only with dot
    * @param {string=} name Property name of the form under which the control is published.
    *     If no name is specified value if `ngModel` attribute will be used
    * @params {number=} labelWidth Width of label (bootstrap 1-12).
    *     Default value can be took from `formGroupConfig` or 3
    * @params {number=} elementWidth Width of input element (bootstrap 1-12). Default value can be took from
    *     `formGroupConfig` 9
    * @param {bool=} hideLabel If true label will be hidden  and width will be recalculated accordingly
    * @param {any=} in-* All attributes starting with the prefix `in-` will be copied to the input element (without
    *     the prefix). Only for standalone
    *
    * To see more examples see this project pages
  ###
  restrict   : "E"
  require    : ['simpleInput', '^?form', '^?formGroupConfig']
  transclude : true
  scope      :
    ngModel : '='
    label   : '@'
    helpText: '@'
  templateUrl: 'simple-input/simple-input.tpl.html'
  controller : 'SimpleInputController'
  link       : (scope, element, attrs, [simpleInputCtrl, formCtrl, formGroupConfig])->
    simpleInputCtrl.init(formCtrl, formGroupConfig)
    simpleInputCtrl.render()
    .then ->
      scope.showError = ->
        ctrl = scope.inputCtrl
        return (ctrl.$showValidationMsg || ctrl.$touched) && ctrl.$invalid if ctrl






