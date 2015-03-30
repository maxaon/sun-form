###*
  * @author Peter Kicenko
  * @file Classes which define behaviour of standard form
  * @description
  * Form options should be used for general cases,  AdvancedFormOptions for manipulation of objects
  * (models from sun-rest)
###
###*
  * @typedef FormOptionButton
  * @property {string} name Name of the button
  * @property {string} label Label of the button
  * @property {expression|function(FormOptions)} action Action which will be performed if button is pressed.
  *       if expression the scope it current object.
  * @property {bool=} default  Is button is default. If true it will have additional class and
  *       action of the button will be called on form submit
  * @property {string=} type Type of the button
###
angular.module 'sun.form.standard-form.form-options', []
.provider 'FormOptions', ->
  baseConfig = this
  baseConfig.defaultButtons =
    cancel:
      name: 'cancel'
      label: "CANCEL_BTN_LABEL"
      action: "_cancel_btn()"
    save:
      name: 'save'
      label: "SAVE_BTN_LABEL"
      action: "valid_save(false)"
    saveAndReturn:
      name: 'saveAndReturn'
      label: "SAVE_AND_RETURN_BTN_LABEL"
      action: "valid_save(true)"
      default: true
      type: 'submit'

  this.$get = ($q, $parse, $translate)->
    ###*
      * @description
      * Main purpose is to set options and then override save method to perform some actions.
      * If you need to show errors display them directly (showError) or `handleErrors` should bu used to wrap promise
    ###
    class FormOptions

      ###*
        @description Buttons for form from FormOptionsProvider.defaultButtons
      ###
      standardButtons: ['cancel', 'saveAndReturn']

      ###*
        * @param {Object} options Options of class.
        * @param {FormOptionButton[]|string[]} options.buttons Buttons displayed by standard form.
        *       If element of array is a strings is supplied, defaults buttons will be used
      ###
      constructor: (options)->
        this.msg = {show: false}
        this.form = null
        _.extend(this, options)

        this.buttons = null
        if options && not _.isUndefined(options.buttons)
          this.setButtons(options.buttons)
        else
          this.useDefaultButtons()
        return

      ###*
        * @description Set bottons to standard
      ###
      useDefaultButtons: ->
        this.setButtons(this.standardButtons)

      ###*
        * @description Set buttons. See constructor
        * @param {FormOptionButton[]|string} Buttons to bw set
      ###
      setButtons: (buttons)->
        if _.isArray(buttons)
          this.buttons = {}
          for button in buttons
            if _.isString(button)
              button = _.cloneDeep(baseConfig.defaultButtons[button])
              if not button
                throw new Error("No button found by name #{button}")
            if !button.name
              throw new Error("Button must have name")
            this.buttons[button.name] = button
        else
          this.buttons = buttons

      ###*
        * @description Set form controller
        * @param {form.FormController} form Form Controller
      ###
      setForm: (form)->
        this.form = form

      ###*
        * @description Forces simpleInput to show validation errors and retusrn is form is valid
        * @returns {bool} Is all form elements are valid
      ###
      validate: ->
        form = this.form
        _(form)
        .keys()
        .filter (e)-> e[0] != "$" && !_.isUndefined(form[e].$valid)
        .each (name)->
          form[name].$showValidationMsg = true
        return this.form.$valid

      ###*
        * @description Set error for form
        * @param {string} msg Message to be shown
        * @param {string=} title Title of the error
      ###
      showError: (msg, title)->
        this.showMessage(msg, 'danger', title)

      ###*
        * @description Set custom message
        * @param {string} msg Message to be shown
        * @param {string=} type Containter type if the error
        * @param {string=} title Title of the error
      ###
      showMessage: (msg, type = "info", title)->
        this.msg =
          type: type
          text: msg
          show: true
          title: title
        return

      ###*
        * @description Wraps `promise`. If promise is resolved message will be hidden.
        *     If promise is rejected, then the error will be shown with the `title`.
        * @param {Promise} promise Wrapping promise
        * @params {string=} title Title for error if error occurs
      ###
      handleErrors: (promise, title)->
        deferred = $q.defer()
        promise
        .then (res)=>
          this.msg.show = false
          deferred.resolve(res)
        .catch (resp)=>
          #set error message to form
          deferred.reject(resp)
          $q.when this._parseError(resp)
          .then (errorMsg)=>
            this.showError(errorMsg, title)
        return deferred.promise

      ###*
        * @description Stub. Method is called for valid form to perform action. Should be overriden for instance
      ###
      save: ->
        #stub
        return

      ###*
        * @description Validate form and call save method if validation is success
      ###
      valid_save: ->
        if this.validate()
          this.save.apply(this, arguments)

      ###
        @description Parses server response
        @param {string|Object} Error message or http response object
      ###
      _parseError: (resp)->
        if _.isString(resp)
          return resp
        else if resp instanceof Error
          return resp.message
        else if angular.isDefined(resp.status) and angular.isDefined(resp.data)
          if _.isString(resp.data)
            if 500 <= resp.status < 600
              return $translate("SERVER_ERROR_MESSAGE", {status: resp.status, text: resp.statusText})
            return resp.data
          else if resp.data.msg
            msg = resp.data.msg.message
            return $translate(msg)

      _runAction: (action, button)->
        return if not action
        if _.isFunction(action)
          action.call(button, this)
        else
          $parse(action)(this, {button})

      _clicked: (button)->
        return if button.type == 'submit' # Will be handled by `_form_submit`
        this._runAction(button.action, button)

      _form_submit: ->
        button = _(this.buttons).filter((b)->b.default).first()
        if button
          this._runAction(button.action, button)
        else
          this.valid_save()

      _cancel_btn: ->

  return

.provider 'AdvancedFormOptions', ->
  this.$get = ($translate, $q, FormOptions, $state, FlashMessage, sunRestBaseModel)->
    class AdvancedFormOptions extends FormOptions
      standardButtons: ['cancel', 'save', 'saveAndReturn']
      successSavedMessage: "OBJECT_SAVED_FLASH_MESSAGE"

      ###*
        * @description Use
        * @param {Object} options
        * @param {Object.<string,string|function(sunRestBaseModel)>} options.states States to be go, after save.
        *       Available are 'return','created','simplySaved'. If value is function it will be called with model.

        * @param {sunRestBaseModel} model Model to work with
      ###
      constructor: (options, model)->
        if options instanceof sunRestBaseModel
          [model, options] = [options, model]
        super
        this.setModel(model) if model

      ###*
        * @description Set model.
      ###
      setModel: (model)->
        this.model = model

      ###*
        * @description Stub. Action before model save
        * @params {Object} model Model to be saved
      ###
      preSave: (model)->
        #stub
        return

      ###*
        * @description Stub. Action after model save
        * @params {Object} model Model to be saved
        * @params {Object} respone Response from the server
      ###
      postSave: (model, response)->
        #stub
        return

      ###*
        * @description Set bottons to standard
      ###
      useDefaultButtons: ->
        buttons = _.cloneDeep(this.standardButtons)
        if not this.states?.return
          buttons.remove('saveAndReturn')
        this.setButtons(buttons)
        if not this.states?.return
          this.buttons.save.default = true
          this.buttons.save.type = 'submit'

      ###*
        * @description Save model
      ###
      saveModel: ->
        this.model.mngr.save()

      ###*
        * @description Method to save model, handle errors and go to state, specified by `shouldReturn` and
        *       previous model state.
        * @params {Object} model Model to be saved
      ###
      save: (shouldReturn)->
        model = this.model
        this.previousModelState = model.mngr.state
        $q.when(this.preSave(model))
        .then =>
          this.handleErrors this.saveModel()
        .then (response)=>
          this.postSave(model, response)
        .then ()=>
          if shouldReturn == true or shouldReturn == undefined
            this.stateReturn()
          else if this.previousModelState == model.mngr.NEW
            this.stateToCreated()
          else
            this.stateSimplySaved()
        .then =>
          this._showSuccessMessage()

      _goTo: (state)->
        if _.isFunction(state)
          state.call(this, this.model)
        else if _.isArray(state)
          $state.go.apply($state, state)
        else
          $state.go(state)

      stateReturn: ->
        if this.states?.return
          this._goTo(this.states.return)

      stateToCreated: ->
        if this.states?.created
          this._goTo(this.states.created)

      stateSimplySaved: ->
        if this.states?.simplySaved
          this._goTo(this.states.simplySaved)

      _showSuccessMessage: (message, title)->
        if this.showSuceessMessages != false
          FlashMessage.success(message or this.successSavedMessage, title)

      _cancel_btn: ->
        this.stateReturn()

    return AdvancedFormOptions

  return
