(function() {
  angular.module('sun.form', ['pascalprecht.translate', 'sun.form.standard-form', 'sun.form.simple-input']);

  angular.module('sun.form.tpls', ['sun.form']);

}).call(this);

(function() {
  var module;

  module = angular.module('sun.form.form-group', []).directive("formGroupConfig", function() {
    return {
      controller: function($scope, $attrs) {
        this.formGroupWidth = ($attrs.formGroupWidth || "3").split(":").map(function(i) {
          return parseInt(i);
        });
        if (this.formGroupWidth.length === 1) {
          return this.formGroupWidth[1] = 12 - this.formGroupWidth[0];
        }
      }
    };
  });


  /*
    it seems deprecated
   */

  module.directive("formGroup", function($translate) {
    return {
      restrict: "AE",
      transclude: true,
      require: '^?formGroupConfig',
      templateUrl: 'form-group/form-group.tpl.html',
      link: function(scope, element, attrs, ctrl) {
        var elementWidth, label, labelWidth;
        element.addClass('form-group');
        labelWidth = (ctrl != null ? ctrl.formGroupWidth[0] : void 0) || 3;
        elementWidth = (ctrl != null ? ctrl.formGroupWidth[1] : void 0) || 9;
        label = element.children('label').addClass("col-sm-" + labelWidth);
        element.children('div').addClass("col-sm-" + elementWidth);
        if (attrs.label) {
          return $translate(attrs.label).then(function(tr) {
            return label.text(tr);
          });
        }
      }
    };
  });

}).call(this);


/**
  * @author Peter Kicenko
  * @file Wrapper for inputs
  * @description Wrapper for different input elements to use with standard-form
 */

(function() {
  var hasProp = {}.hasOwnProperty;

  angular.module('sun.form.simple-input', ['pascalprecht.translate', 'ui.router', 'ngMessages', 'sun.form.simple-input.date', 'sun.form.form-group']).provider('SimpleInputOptions', function() {
    var options;
    options = this;
    options.pathPrefix = 'simple-input/templates/';
    options.inputs = {
      select: {
        templateUrl: 'select.tpl.html'
      },
      date: {
        controller: 'SimpleInputDateController',
        templateUrl: 'date.tpl.html'
      },
      textarea: {
        templateUrl: 'textarea.tpl.html'
      },
      checkbox: {
        templateUrl: 'switch.tpl.html'
      },
      $default: {
        templateUrl: 'input.tpl.html'
      }
    };
    options.getDefault = function(type) {
      return options.inputs.$default;
    };
    this.$get = function() {
      var opt, ref, type;
      if (options.pathPrefix) {
        ref = options.inputs;
        for (type in ref) {
          if (!hasProp.call(ref, type)) continue;
          opt = ref[type];
          if (options.inputs[type].templateUrl) {
            options.inputs[type].templateUrl = options.pathPrefix + options.inputs[type].templateUrl;
          }
        }
      }
      return options;
    };
  }).controller('SimpleInputController', function($scope, $element, $transclude, $attrs, $q, $translate, $compile, $controller, SimpleInputOptions, $templateFactory) {
    var SimpleInputController;
    SimpleInputController = (function() {
      function SimpleInputController() {}

      SimpleInputController.prototype.init = function(formController, formGroupController) {
        var ref, ref1, ref2;
        this.formController = formController;
        this.formGroupConfig = formGroupController;
        this.hideLabel = (ref = $attrs.hideLabel) === 'true' || ref === '1' || ref === 'hide-label' || ref === '';
        this.labelWidth = parseInt($attrs.labelWidth) || ((ref1 = this.formGroupConfig) != null ? ref1.formGroupWidth[0] : void 0) || 3;
        this.elementWidth = parseInt($attrs.elementWidth) || ((ref2 = this.formGroupConfig) != null ? ref2.formGroupWidth[1] : void 0) || 9;
        if (this.hideLabel && !$attrs.elementWidth) {
          this.elementWidth += this.labelWidth;
        }
        this.type = $attrs.type || 'text';
        this.name = this._getName();
        this.formGroup = $element.children('div');
        this.inputGroup = this.formGroup.children('div');
        this.destinationElement = $element.find('[inner-content]');
        return this.label = this.formGroup.children('label');
      };

      SimpleInputController.prototype.render = function() {
        return this._processExistingContent().then((function(_this) {
          return function() {
            _this._insertMessages();
            _this._addClasses();
            $scope.inputCtrl = _this._getInputController();
            return _.extend($scope, _this._getScopeVariables());
          };
        })(this));
      };

      SimpleInputController.prototype._addClasses = function() {
        var cls;
        cls = this.hideLabel ? 'sr-only' : "col-sm-" + this.labelWidth;
        this.label.addClass(cls);
        return this.inputGroup.addClass("col-sm-" + this.elementWidth);
      };

      SimpleInputController.prototype._getInputController = function() {
        if (this.name && this.formController) {
          return this.formController[this.name];
        } else {
          return void 0;
        }
      };

      SimpleInputController.prototype._getScopeVariables = function() {
        var vars;
        vars = {};
        vars.name = this.name;
        vars.type = this.type;
        vars.label = $scope.label;
        if (this.name) {
          vars.id = this.name + "-id";
        }
        return vars;
      };

      SimpleInputController.prototype._extractMessages = function(elements) {
        var messages, res;
        res = [];
        this.__messages = messages = [];
        elements.each(function(i, e) {
          var ref;
          if (((ref = e.tagName) != null ? ref.toLowerCase() : void 0) === "message") {
            messages.push({
              when: e.attributes.when.value,
              message: e.innerHTML,
              e: e
            });
            return;
          } else if (e.nodeType === e.TEXT_NODE && !e.textContent.trim()) {
            return;
          }
          return res.push(e);
        });
        this.__messagesExtracted = true;
        return res;
      };

      SimpleInputController.prototype._processExistingContent = function() {
        var deferred;
        deferred = $q.defer();
        $transclude((function(_this) {
          return function(innerElements, scope) {
            var res;
            innerElements = _this._extractMessages(innerElements);
            _this._useExisting = innerElements.length !== 0;
            if (_this._useExisting) {
              res = _this.destinationElement.html(innerElements);
            } else {
              res = _this._processStandardInput(scope);
            }
            return deferred.resolve(res);
          };
        })(this));
        return deferred.promise;
      };

      SimpleInputController.prototype._processStandardInput = function(scope) {
        var options;
        options = SimpleInputOptions.inputs[this.type] || SimpleInputOptions.getDefault(this.type);
        return $templateFactory.fromConfig(options).then((function(_this) {
          return function(templateText) {
            var controller, input, template;
            _.extend(scope, _this._getScopeVariables());
            template = angular.element(templateText);
            input = template.closest("[ng-model]").add(template.find("[ng-model]"));
            _this._updateName(input, _this._getName());
            _this._attachInputAttributes($element[0].attributes, input);
            _this._traverseNgModel(input, $attrs.ngModel);
            template = _this._preCompile(template);
            if (options.controller) {
              controller = $controller(options.controller, {
                $scope: scope,
                options: options
              });
              if (options.controllerAs) {
                scope[options.controllerAs] = controller;
              }
            }
            _this.destinationElement.html(template);
            $compile(_this.destinationElement.contents())(scope);
            return scope.inputCtrl = _this._getInputController();
          };
        })(this));
      };

      SimpleInputController.prototype._attachInputAttributes = function(attrs, to) {
        var attr, j, k, len, results, v;
        results = [];
        for (j = 0, len = attrs.length; j < len; j++) {
          attr = attrs[j];
          if (attr.name.indexOf('in-') === 0) {
            k = attr.name.slice(3);
            v = attr.value;
            results.push(to.attr(k, v));
          } else {
            results.push(void 0);
          }
        }
        return results;
      };

      SimpleInputController.prototype._getName = function() {
        if (this._useExisting) {
          return $attrs.name;
        } else {
          return $attrs.name || $attrs.ngModel;
        }
      };

      SimpleInputController.prototype._updateName = function(element, name) {
        return element.attr('name', name);
      };

      SimpleInputController.prototype._preCompile = function(input) {
        return input;
      };

      SimpleInputController.prototype._getMessages = function() {
        if (!this.__messagesExtracted) {
          throw new Error("messages were not extracted. Wrong function order call");
        }
        return this.__messages;
      };

      SimpleInputController.prototype._insertMessages = function() {
        var j, len, m, msgs, ref, results;
        msgs = $element.find('[ng-messages]');
        ref = this._getMessages() || [];
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          m = ref[j];
          msgs.append(m.e);
          results.push($compile(m.e)($scope));
        }
        return results;
      };

      SimpleInputController.prototype._traverseNgModel = function(input, name) {
        return input.attr('ng-model', name);
      };

      return SimpleInputController;

    })();
    _.extend(this, SimpleInputController.prototype);
  }).directive("simpleInput", function() {
    return {

      /**
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
       */
      restrict: "E",
      require: ['simpleInput', '^?form', '^?formGroupConfig'],
      transclude: true,
      scope: {
        ngModel: '=',
        label: '@',
        helpText: '@'
      },
      templateUrl: 'simple-input/simple-input.tpl.html',
      controller: 'SimpleInputController',
      link: function(scope, element, attrs, arg) {
        var formCtrl, formGroupConfig, simpleInputCtrl;
        simpleInputCtrl = arg[0], formCtrl = arg[1], formGroupConfig = arg[2];
        simpleInputCtrl.init(formCtrl, formGroupConfig);
        return simpleInputCtrl.render().then(function() {
          return scope.showError = function() {
            var ctrl;
            ctrl = scope.inputCtrl;
            if (ctrl) {
              return (ctrl.$showValidationMsg || ctrl.$touched) && ctrl.$invalid;
            }
          };
        });
      }
    };
  });

}).call(this);


/**
  * @author Peter Kicenko
  * @file Classes which define behaviour of standard form
  * @description
  * Form options should be used for general cases,  AdvancedFormOptions for manipulation of objects
  * (models from sun-rest)
 */


/**
  * @typedef FormOptionButton
  * @property {string} name Name of the button
  * @property {string} label Label of the button
  * @property {expression|function(FormOptions)} action Action which will be performed if button is pressed.
  *       if expression the scope it current object.
  * @property {bool=} default  Is button is default. If true it will have additional class and
  *       action of the button will be called on form submit
  * @property {string=} type Type of the button
 */

(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  angular.module('sun.form.standard-form.form-options', []).provider('FormOptions', function() {
    var baseConfig;
    baseConfig = this;
    baseConfig.defaultButtons = {
      cancel: {
        name: 'cancel',
        label: "CANCEL_BTN_LABEL",
        action: "_cancel_btn()"
      },
      save: {
        name: 'save',
        label: "SAVE_BTN_LABEL",
        action: "valid_save(false)"
      },
      saveAndReturn: {
        name: 'saveAndReturn',
        label: "SAVE_AND_RETURN_BTN_LABEL",
        action: "valid_save(true)",
        "default": true,
        type: 'submit'
      }
    };
    this.$get = function($q, $parse, $translate) {

      /**
        * @description
        * Main purpose is to set options and then override save method to perform some actions.
        * If you need to show errors display them directly (showError) or `handleErrors` should bu used to wrap promise
       */
      var FormOptions;
      return FormOptions = (function() {

        /**
          @description Buttons for form from FormOptionsProvider.defaultButtons
         */
        FormOptions.prototype.standardButtons = ['cancel', 'saveAndReturn'];


        /**
          * @param {Object} options Options of class.
          * @param {FormOptionButton[]|string[]} options.buttons Buttons displayed by standard form.
          *       If element of array is a strings is supplied, defaults buttons will be used
         */

        function FormOptions(options) {
          this.msg = {
            show: false
          };
          this.form = null;
          _.extend(this, options);
          this.buttons = null;
          if (options && !_.isUndefined(options.buttons)) {
            this.setButtons(options.buttons);
          } else {
            this.useDefaultButtons();
          }
          return;
        }


        /**
          * @description Set bottons to standard
         */

        FormOptions.prototype.useDefaultButtons = function() {
          return this.setButtons(this.standardButtons);
        };


        /**
          * @description Set buttons. See constructor
          * @param {FormOptionButton[]|string} Buttons to bw set
         */

        FormOptions.prototype.setButtons = function(buttons) {
          var button, i, len, results;
          if (_.isArray(buttons)) {
            this.buttons = {};
            results = [];
            for (i = 0, len = buttons.length; i < len; i++) {
              button = buttons[i];
              if (_.isString(button)) {
                button = _.cloneDeep(baseConfig.defaultButtons[button]);
                if (!button) {
                  throw new Error("No button found by name " + button);
                }
              }
              if (!button.name) {
                throw new Error("Button must have name");
              }
              results.push(this.buttons[button.name] = button);
            }
            return results;
          } else {
            return this.buttons = buttons;
          }
        };


        /**
          * @description Set form controller
          * @param {form.FormController} form Form Controller
         */

        FormOptions.prototype.setForm = function(form) {
          return this.form = form;
        };


        /**
          * @description Forces simpleInput to show validation errors and retusrn is form is valid
          * @returns {bool} Is all form elements are valid
         */

        FormOptions.prototype.validate = function() {
          var form;
          form = this.form;
          _(form).keys().filter(function(e) {
            return e[0] !== "$" && !_.isUndefined(form[e].$valid);
          }).each(function(name) {
            return form[name].$showValidationMsg = true;
          });
          return this.form.$valid;
        };


        /**
          * @description Set error for form
          * @param {string} msg Message to be shown
          * @param {string=} title Title of the error
         */

        FormOptions.prototype.showError = function(msg, title) {
          return this.showMessage(msg, 'danger', title);
        };


        /**
          * @description Set custom message
          * @param {string} msg Message to be shown
          * @param {string=} type Containter type if the error
          * @param {string=} title Title of the error
         */

        FormOptions.prototype.showMessage = function(msg, type, title) {
          if (type == null) {
            type = "info";
          }
          this.msg = {
            type: type,
            text: msg,
            show: true,
            title: title
          };
        };


        /**
          * @description Wraps `promise`. If promise is resolved message will be hidden.
          *     If promise is rejected, then the error will be shown with the `title`.
          * @param {Promise} promise Wrapping promise
          * @params {string=} title Title for error if error occurs
         */

        FormOptions.prototype.handleErrors = function(promise, title) {
          var deferred;
          deferred = $q.defer();
          promise.then((function(_this) {
            return function(res) {
              _this.msg.show = false;
              return deferred.resolve(res);
            };
          })(this))["catch"]((function(_this) {
            return function(resp) {
              deferred.reject(resp);
              return $q.when(_this._parseError(resp)).then(function(errorMsg) {
                return _this.showError(errorMsg, title);
              });
            };
          })(this));
          return deferred.promise;
        };


        /**
          * @description Stub. Method is called for valid form to perform action. Should be overriden for instance
         */

        FormOptions.prototype.save = function() {};


        /**
          * @description Validate form and call save method if validation is success
         */

        FormOptions.prototype.valid_save = function() {
          if (this.validate()) {
            return this.save.apply(this, arguments);
          }
        };


        /*
          @description Parses server response
          @param {string|Object} Error message or http response object
         */

        FormOptions.prototype._parseError = function(resp) {
          var msg, ref;
          if (_.isString(resp)) {
            return resp;
          } else if (resp instanceof Error) {
            return resp.message;
          } else if (angular.isDefined(resp.status) && angular.isDefined(resp.data)) {
            if (_.isString(resp.data)) {
              if ((500 <= (ref = resp.status) && ref < 600)) {
                return $translate("SERVER_ERROR_MESSAGE", {
                  status: resp.status,
                  text: resp.statusText
                });
              }
              return resp.data;
            } else if (resp.data.msg) {
              msg = resp.data.msg.message;
              return $translate(msg);
            }
          }
        };

        FormOptions.prototype._runAction = function(action, button) {
          if (!action) {
            return;
          }
          if (_.isFunction(action)) {
            return action.call(button, this);
          } else {
            return $parse(action)(this, {
              button: button
            });
          }
        };

        FormOptions.prototype._clicked = function(button) {
          if (button.type === 'submit') {
            return;
          }
          return this._runAction(button.action, button);
        };

        FormOptions.prototype._form_submit = function() {
          var button;
          button = _(this.buttons).filter(function(b) {
            return b["default"];
          }).first();
          if (button) {
            return this._runAction(button.action, button);
          } else {
            return this.valid_save();
          }
        };

        FormOptions.prototype._cancel_btn = function() {};

        return FormOptions;

      })();
    };
  }).provider('AdvancedFormOptions', function(FormOptionsProvider) {
    var baseConfig;
    baseConfig = FormOptionsProvider;
    this.$get = function($translate, $q, FormOptions, $state, FlashMessage, sunRestBaseModel) {
      var AdvancedFormOptions;
      AdvancedFormOptions = (function(superClass) {
        extend(AdvancedFormOptions, superClass);

        AdvancedFormOptions.prototype.standardButtons = ['cancel', 'save', 'saveAndReturn'];

        AdvancedFormOptions.prototype.successSavedMessage = "OBJECT_SAVED_FLASH_MESSAGE";


        /**
          * @description Use
          * @param {Object} options
          * @param {Object.<string,string|function(sunRestBaseModel)>} options.states States to be go, after save.
          *       Available are 'return','created','simplySaved'. If value is function it will be called with model.
        
          * @param {sunRestBaseModel} model Model to work with
         */

        function AdvancedFormOptions(options, model) {
          var ref;
          if (options instanceof sunRestBaseModel) {
            ref = [options, model], model = ref[0], options = ref[1];
          }
          AdvancedFormOptions.__super__.constructor.apply(this, arguments);
          if (model) {
            this.setModel(model);
          }
        }


        /**
          * @description Set model.
         */

        AdvancedFormOptions.prototype.setModel = function(model) {
          return this.model = model;
        };


        /**
          * @description Stub. Action before model save
          * @params {Object} model Model to be saved
         */

        AdvancedFormOptions.prototype.preSave = function(model) {};


        /**
          * @description Stub. Action after model save
          * @params {Object} model Model to be saved
          * @params {Object} respone Response from the server
         */

        AdvancedFormOptions.prototype.postSave = function(model, response) {};


        /**
          * @description Set bottons to standard
         */

        AdvancedFormOptions.prototype.useDefaultButtons = function() {
          var buttons, ref, ref1;
          buttons = _.cloneDeep(this.standardButtons);
          if (!((ref = this.states) != null ? ref["return"] : void 0)) {
            buttons.remove('saveAndReturn');
          }
          this.setButtons(buttons);
          if (!((ref1 = this.states) != null ? ref1["return"] : void 0)) {
            this.buttons.save["default"] = true;
            return this.buttons.save.type = 'submit';
          }
        };


        /**
          * @description Save model
         */

        AdvancedFormOptions.prototype.saveModel = function() {
          return this.model.mngr.save();
        };


        /**
          * @description Method to save model, handle errors and go to state, specified by `shouldReturn` and
          *       previous model state.
          * @params {Object} model Model to be saved
         */

        AdvancedFormOptions.prototype.save = function(shouldReturn) {
          var model;
          model = this.model;
          this.previousModelState = model.mngr.state;
          return $q.when(this.preSave(model)).then((function(_this) {
            return function() {
              return _this.handleErrors(_this.saveModel());
            };
          })(this)).then((function(_this) {
            return function(response) {
              return _this.postSave(model, response);
            };
          })(this)).then((function(_this) {
            return function() {
              if (shouldReturn === true || shouldReturn === void 0) {
                return _this.stateReturn();
              } else if (_this.previousModelState === model.mngr.NEW) {
                return _this.stateToCreated();
              } else {
                return _this.stateSimplySaved();
              }
            };
          })(this)).then((function(_this) {
            return function() {
              return _this._showSuccessMessage();
            };
          })(this));
        };

        AdvancedFormOptions.prototype._goTo = function(state) {
          if (_.isFunction(state)) {
            return state.call(this, this.model);
          } else if (_.isArray(state)) {
            return $state.go.apply($state, state);
          } else {
            return $state.go(state);
          }
        };

        AdvancedFormOptions.prototype.stateReturn = function() {
          var ref;
          if ((ref = this.states) != null ? ref["return"] : void 0) {
            return this._goTo(this.states["return"]);
          }
        };

        AdvancedFormOptions.prototype.stateToCreated = function() {
          var ref;
          if ((ref = this.states) != null ? ref.created : void 0) {
            return this._goTo(this.states.created);
          }
        };

        AdvancedFormOptions.prototype.stateSimplySaved = function() {
          var ref;
          if ((ref = this.states) != null ? ref.simplySaved : void 0) {
            return this._goTo(this.states.simplySaved);
          }
        };

        AdvancedFormOptions.prototype._showSuccessMessage = function(message, title) {
          if (this.showSuceessMessages !== false) {
            return FlashMessage.success(message || this.successSavedMessage, title);
          }
        };

        AdvancedFormOptions.prototype._cancel_btn = function() {
          return this.stateReturn();
        };

        return AdvancedFormOptions;

      })(FormOptions);
      return AdvancedFormOptions;
    };
  });

}).call(this);


/**
  * @author Peter Kicenko
  * @file Standard form with buttons and additional actions
 */

(function() {
  var module;

  module = angular.module('sun.form.standard-form', ['sun.form.standard-form.form-options', 'sun.form.standard-form.spatial.simple-input-group']).directive('standartForm', function() {
    return function() {
      throw new Error("You again misspelled standard form");
    };
  });

  module.directive('standardForm', function($parse, FormOptions) {
    return {

      /**
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
       */
      restrict: 'EA',
      scope: {
        model: '=ngModel'
      },
      transclude: true,
      templateUrl: 'standard-form/standard-form.tpl.html',
      link: function(scope, element, attrs, controller) {
        var optionName;
        optionName = attrs['standardForm'] || attrs['options'];
        scope.options = $parse(optionName)(scope.$parent) || new FormOptions();
        scope.options.setForm(scope.innerForm);
        if (scope.options.setModel) {
          scope.$watch('model', function(model) {
            if (model) {
              return scope.options.setModel(model);
            }
          });
        }
        if (attrs.name) {
          scope.$parent[attrs.name] = scope.innerForm;
        }
        return scope.getButtonClass = function(button) {
          return button["class"] || (button["default"] ? 'btn btn-primary' : 'btn btn-default');
        };
      }
    };
  });

}).call(this);

(function() {
  angular.module('sun.form.simple-input.date', ['ui.bootstrap.datepicker']).controller("SimpleInputDateController", function($scope, $locale) {
    $scope.format = $locale.DATETIME_FORMATS.mediumDate;
    return $scope.open = function($event) {
      $event.preventDefault();
      $event.stopPropagation();
      return $scope.opened = true;
    };
  });

}).call(this);


/**
  * @author Peter Kicenko
  * @file Extended simple input (with prepend and append icon)
 */

(function() {
  angular.module('sun.form.standard-form.spatial.simple-input-group', []).controller('InputGroupController', function($scope, $element, $attrs, $transclude, $translate, $compile, $controller) {
    _.extend(this, $controller('SimpleInputController', {
      $scope: $scope,
      $element: $element,
      $attrs: $attrs,
      $transclude: $transclude
    }));
    this._preCompile = function(input) {
      var prepend, res;
      res = $(document.createElement('div')).addClass('input-group');
      prepend = $(document.createElement('span')).addClass('input-group-addon');
      if ($attrs.prependIcon) {
        prepend.append($(document.createElement('i')).addClass($attrs.prependIcon));
        res.append(prepend);
      }
      res.append(input);
      return res;
    };
    return this;
  }).directive('inputGroup', function(simpleInputDirective) {
    assert(simpleInputDirective.length === 1, 'More than once simpleInputDirective found!');
    return _.extend({}, simpleInputDirective[0], {
      controller: 'InputGroupController'
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN1bi1mb3JtLmNvZmZlZSIsImZvcm0tZ3JvdXAvZm9ybS1ncm91cC5jb2ZmZWUiLCJzaW1wbGUtaW5wdXQvc2ltcGxlLWlucHV0LmNvZmZlZSIsInN0YW5kYXJkLWZvcm0vZm9ybS1vcHRpb25zLmNvZmZlZSIsInN0YW5kYXJkLWZvcm0vc3RhbmRhcmQtZm9ybS5jb2ZmZWUiLCJzaW1wbGUtaW5wdXQvdGVtcGxhdGVzL2RhdGUuY29mZmVlIiwic3RhbmRhcmQtZm9ybS9zcGF0aWFsL3NpbXBsZS1ncm91cC1pbnB1dC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxFQUFBLE9BQU8sQ0FBQyxNQUFSLENBQWUsVUFBZixFQUEyQixDQUFDLHdCQUFELEVBQTBCLHdCQUExQixFQUFvRCx1QkFBcEQsQ0FBM0IsQ0FBQSxDQUFBOztBQUFBLEVBRUEsT0FBTyxDQUFDLE1BQVIsQ0FBZSxlQUFmLEVBQWdDLENBQUMsVUFBRCxDQUFoQyxDQUZBLENBQUE7QUFBQTs7O0FDQUE7QUFBQSxNQUFBLE1BQUE7O0FBQUEsRUFBQSxNQUFBLEdBQVMsT0FBTyxDQUFDLE1BQVIsQ0FBZSxxQkFBZixFQUFzQyxFQUF0QyxDQUNULENBQUMsU0FEUSxDQUNFLGlCQURGLEVBQ3FCLFNBQUEsR0FBQTtXQUM1QjtBQUFBLE1BQUEsVUFBQSxFQUFZLFNBQUMsTUFBRCxFQUFTLE1BQVQsR0FBQTtBQUNWLFFBQUEsSUFBQyxDQUFBLGNBQUQsR0FBa0IsQ0FBQyxNQUFNLENBQUMsY0FBUCxJQUF5QixHQUExQixDQUE4QixDQUFDLEtBQS9CLENBQXFDLEdBQXJDLENBQXlDLENBQUMsR0FBMUMsQ0FBOEMsU0FBQyxDQUFELEdBQUE7aUJBQU0sUUFBQSxDQUFTLENBQVQsRUFBTjtRQUFBLENBQTlDLENBQWxCLENBQUE7QUFDQSxRQUFBLElBQUcsSUFBQyxDQUFBLGNBQWMsQ0FBQyxNQUFoQixLQUEwQixDQUE3QjtpQkFDRSxJQUFDLENBQUEsY0FBZSxDQUFBLENBQUEs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O0FBQ2pCLFVBQUEsWUFBQTtBQUFBLE1BQUEsR0FBQSxHQUFNLENBQUEsQ0FBRSxRQUFRLENBQUMsYUFBVCxDQUF1QixLQUF2QixDQUFGLENBQWdDLENBQUMsUUFBakMsQ0FBMEMsYUFBMUMsQ0FBTixDQUFBO0FBQUEsTUFDQSxPQUFBLEdBQVUsQ0FBQSxDQUFFLFFBQVEsQ0FBQyxhQUFULENBQXVCLE1BQXZCLENBQUYsQ0FBaUMsQ0FBQyxRQUFsQyxDQUEyQyxtQkFBM0MsQ0FEVixDQUFBO0FBRUEsTUFBQSxJQUFHLE1BQU0sQ0FBQyxXQUFWO0FBQ0UsUUFBQSxPQUFPLENBQUMsTUFBUixDQUFlLENBQUEsQ0FBRSxRQUFRLENBQUMsYUFBVCxDQUF1QixHQUF2QixDQUFGLENBQThCLENBQUMsUUFBL0IsQ0FBd0MsTUFBTSxDQUFDLFdBQS9DLENBQWYsQ0FBQSxDQUFBO0FBQUEsUUFDQSxHQUFHLENBQUMsTUFBSixDQUFXLE9BQVgsQ0FEQSxDQURGO09BRkE7QUFBQSxNQUtBLEdBQUcsQ0FBQyxNQUFKLENBQVcsS0FBWCxDQUxBLENBQUE7QUFNQSxhQUFPLEdBQVAsQ0FQaUI7SUFBQSxDQURuQixDQUFBO0FBU0EsV0FBTyxJQUFQLENBVmtDO0VBQUEsQ0FEcEMsQ0FZQSxDQUFDLFNBWkQsQ0FZVyxZQVpYLEVBWXlCLFNBQUMsb0JBQUQsR0FBQTtBQUN2QixJQUFBLE1BQUEsQ0FBTyxvQkFBb0IsQ0FBQyxNQUFyQixLQUErQixDQUF0QyxFQUF5Qyw0Q0FBekMsQ0FBQSxDQUFBO1dBQ0EsQ0FBQyxDQUFDLE1BQUYsQ0FBUyxFQUFULEVBQWEsb0JBQXFCLENBQUEsQ0FBQSxDQUFsQyxFQUNFO0FBQUEsTUFBQSxVQUFBLEVBQVksc0JBQVo7S0FERixFQUZ1QjtFQUFBLENBWnpCLENBSkEsQ0FBQTtBQUFBIiwiZmlsZSI6InN1bi1mb3JtLmpzIiwic291cmNlc0NvbnRlbnQiOlsiYW5ndWxhci5tb2R1bGUgJ3N1bi5mb3JtJywgWydwYXNjYWxwcmVjaHQudHJhbnNsYXRlJywnc3VuLmZvcm0uc3RhbmRhcmQtZm9ybScsICdzdW4uZm9ybS5zaW1wbGUtaW5wdXQnXVxyXG5cclxuYW5ndWxhci5tb2R1bGUgJ3N1bi5mb3JtLnRwbHMnLCBbJ3N1bi5mb3JtJ10iLCJtb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSAnc3VuLmZvcm0uZm9ybS1ncm91cCcsIFtdXG4uZGlyZWN0aXZlIFwiZm9ybUdyb3VwQ29uZmlnXCIsIC0+XG4gIGNvbnRyb2xsZXI6ICgkc2NvcGUsICRhdHRycyktPlxuICAgIEBmb3JtR3JvdXBXaWR0aCA9ICgkYXR0cnMuZm9ybUdyb3VwV2lkdGggb3IgXCIzXCIpLnNwbGl0KFwiOlwiKS5tYXAgKGkpLT4gcGFyc2VJbnQoaSlcbiAgICBpZiBAZm9ybUdyb3VwV2lkdGgubGVuZ3RoID09IDFcbiAgICAgIEBmb3JtR3JvdXBXaWR0aFsxXSA9IDEyIC0gQGZvcm1Hcm91cFdpZHRoWzBdXG4jIyNcbiAgaXQgc2VlbXMgZGVwcmVjYXRlZFxuIyMjXG5tb2R1bGUuZGlyZWN0aXZlIFwiZm9ybUdyb3VwXCIsICgkdHJhbnNsYXRlKS0+XG4gIHJlc3RyaWN0ICAgOiBcIkFFXCJcbiAgdHJhbnNjbHVkZSA6IHRydWVcbiAgcmVxdWlyZSAgICA6ICdeP2Zvcm1Hcm91cENvbmZpZydcbiAgdGVtcGxhdGVVcmw6ICdmb3JtLWdyb3VwL2Zvcm0tZ3JvdXAudHBsLmh0bWwnXG4gIGxpbmsgICAgICAgOiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjdHJsKS0+XG4gICAgZWxlbWVudC5hZGRDbGFzcygnZm9ybS1ncm91cCcpXG4gICAgbGFiZWxXaWR0aCA9IGN0cmw/LmZvcm1Hcm91cFdpZHRoWzBdIG9yIDNcbiAgICBlbGVtZW50V2lkdGggPSBjdHJsPy5mb3JtR3JvdXBXaWR0aFsxXSBvciA5XG4gICAgbGFiZWwgPSBlbGVtZW50LmNoaWxkcmVuKCdsYWJlbCcpLmFkZENsYXNzKFwiY29sLXNtLSN7bGFiZWxXaWR0aH1cIilcbiAgICBlbGVtZW50LmNoaWxkcmVuKCdkaXYnKS5hZGRDbGFzcyhcImNvbC1zbS0je2VsZW1lbnRXaWR0aH1cIilcbiAgICBpZiBhdHRycy5sYWJlbFxuICAgICAgJHRyYW5zbGF0ZShhdHRycy5sYWJlbCkudGhlbiAodHIpLT4gbGFiZWwudGV4dCh0cilcblxuIiwiIyMjKlxuICAqIEBhdXRob3IgUGV0ZXIgS2ljZW5rb1xuICAqIEBmaWxlIFdyYXBwZXIgZm9yIGlucHV0c1xuICAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIGZvciBkaWZmZXJlbnQgaW5wdXQgZWxlbWVudHMgdG8gdXNlIHdpdGggc3RhbmRhcmQtZm9ybVxuIyMjXG5hbmd1bGFyLm1vZHVsZSAnc3VuLmZvcm0uc2ltcGxlLWlucHV0JywgW1xuICAncGFzY2FscHJlY2h0LnRyYW5zbGF0ZSdcbiAgJ3VpLnJvdXRlcidcbiAgJ25nTWVzc2FnZXMnXG4gICdzdW4uZm9ybS5zaW1wbGUtaW5wdXQuZGF0ZSdcbiAgJ3N1bi5mb3JtLmZvcm0tZ3JvdXAnXG5dXG4ucHJvdmlkZXIgJ1NpbXBsZUlucHV0T3B0aW9ucycsIC0+XG4gIG9wdGlvbnMgPSB0aGlzXG4gIG9wdGlvbnMucGF0aFByZWZpeCA9ICdzaW1wbGUtaW5wdXQvdGVtcGxhdGVzLydcbiAgb3B0aW9ucy5pbnB1dHMgPVxuICAgIHNlbGVjdCAgOlxuICAgICAgdGVtcGxhdGVVcmw6ICdzZWxlY3QudHBsLmh0bWwnXG4gICAgZGF0ZSAgICA6XG4gICAgICBjb250cm9sbGVyIDogJ1NpbXBsZUlucHV0RGF0ZUNvbnRyb2xsZXInXG4gICAgICB0ZW1wbGF0ZVVybDogJ2RhdGUudHBsLmh0bWwnXG4gICAgdGV4dGFyZWE6XG4gICAgICB0ZW1wbGF0ZVVybDogJ3RleHRhcmVhLnRwbC5odG1sJ1xuICAgIGNoZWNrYm94OlxuICAgICAgdGVtcGxhdGVVcmw6ICdzd2l0Y2gudHBsLmh0bWwnXG4gICAgJGRlZmF1bHQ6XG4gICAgICB0ZW1wbGF0ZVVybDogJ2lucHV0LnRwbC5odG1sJ1xuICAjIEdldCBkZWZhdWx0IGNvbmZpZyBmb3IgYHR5cGVgXG4gIG9wdGlvbnMuZ2V0RGVmYXVsdCA9ICh0eXBlKS0+XG4gICAgcmV0dXJuIG9wdGlvbnMuaW5wdXRzLiRkZWZhdWx0XG5cbiAgdGhpcy4kZ2V0ID0gLT5cbiAgICBpZiBvcHRpb25zLnBhdGhQcmVmaXhcbiAgICAgIGZvciBvd24gdHlwZSxvcHQgb2Ygb3B0aW9ucy5pbnB1dHNcbiAgICAgICAgaWYgb3B0aW9ucy5pbnB1dHNbdHlwZV0udGVtcGxhdGVVcmxcbiAgICAgICAgICBvcHRpb25zLmlucHV0c1t0eXBlXS50ZW1wbGF0ZVVybCA9IG9wdGlvbnMucGF0aFByZWZpeCArIG9wdGlvbnMuaW5wdXRzW3R5cGVdLnRlbXBsYXRlVXJsXG4gICAgcmV0dXJuIG9wdGlvbnNcblxuICByZXR1cm5cbi5jb250cm9sbGVyICdTaW1wbGVJbnB1dENvbnRyb2xsZXInLCAoJHNjb3BlLCAkZWxlbWVudCwgJHRyYW5zY2x1ZGUsICRhdHRycywgJHEsICR0cmFuc2xhdGUsICRjb21waWxlLCAkY29udHJvbGxlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU2ltcGxlSW5wdXRPcHRpb25zLCAkdGVtcGxhdGVGYWN0b3J5KS0+XG4gIGNsYXNzIFNpbXBsZUlucHV0Q29udHJvbGxlclxuXG4gICAgaW5pdDogKGZvcm1Db250cm9sbGVyLCBmb3JtR3JvdXBDb250cm9sbGVyKS0+XG4gICAgICBAZm9ybUNvbnRyb2xsZXIgPSBmb3JtQ29udHJvbGxlclxuICAgICAgQGZvcm1Hcm91cENvbmZpZyA9IGZvcm1Hcm91cENvbnRyb2xsZXJcbiAgICAgIEBoaWRlTGFiZWwgPSAkYXR0cnMuaGlkZUxhYmVsIGluIFsndHJ1ZScsICcxJywgJ2hpZGUtbGFiZWwnLCAnJ11cbiAgICAgIEBsYWJlbFdpZHRoID0gcGFyc2VJbnQoJGF0dHJzLmxhYmVsV2lkdGgpIG9yIEBmb3JtR3JvdXBDb25maWc/LmZvcm1Hcm91cFdpZHRoWzBdIG9yIDNcbiAgICAgIEBlbGVtZW50V2lkdGggPSBwYXJzZUludCgkYXR0cnMuZWxlbWVudFdpZHRoKSBvciBAZm9ybUdyb3VwQ29uZmlnPy5mb3JtR3JvdXBXaWR0aFsxXSBvciA5XG4gICAgICBAZWxlbWVudFdpZHRoICs9IEBsYWJlbFdpZHRoIGlmIEBoaWRlTGFiZWwgYW5kIG5vdCAkYXR0cnMuZWxlbWVudFdpZHRoXG5cbiAgICAgIEB0eXBlID0gJGF0dHJzLnR5cGUgb3IgJ3RleHQnXG4gICAgICBAbmFtZSA9IHRoaXMuX2dldE5hbWUoKVxuXG4gICAgICBAZm9ybUdyb3VwID0gJGVsZW1lbnQuY2hpbGRyZW4oJ2RpdicpXG4gICAgICBAaW5wdXRHcm91cCA9IEBmb3JtR3JvdXAuY2hpbGRyZW4oJ2RpdicpXG4gICAgICBAZGVzdGluYXRpb25FbGVtZW50ID0gJGVsZW1lbnQuZmluZCgnW2lubmVyLWNvbnRlbnRdJylcblxuICAgICAgQGxhYmVsID0gQGZvcm1Hcm91cC5jaGlsZHJlbignbGFiZWwnKVxuXG4gICAgcmVuZGVyOiAtPlxuICAgICAgdGhpcy5fcHJvY2Vzc0V4aXN0aW5nQ29udGVudCgpXG4gICAgICAudGhlbiA9PlxuICAgICAgICB0aGlzLl9pbnNlcnRNZXNzYWdlcygpXG4gICAgICAgIHRoaXMuX2FkZENsYXNzZXMoKVxuICAgICAgICAkc2NvcGUuaW5wdXRDdHJsID0gdGhpcy5fZ2V0SW5wdXRDb250cm9sbGVyKClcbiAgICAgICAgXy5leHRlbmQoJHNjb3BlLCB0aGlzLl9nZXRTY29wZVZhcmlhYmxlcygpKVxuXG4gICAgX2FkZENsYXNzZXM6IC0+XG4gICAgICBjbHMgPSBpZiB0aGlzLmhpZGVMYWJlbCB0aGVuICAnc3Itb25seScgZWxzZSBcImNvbC1zbS0je3RoaXMubGFiZWxXaWR0aH1cIlxuICAgICAgdGhpcy5sYWJlbC5hZGRDbGFzcyhjbHMpXG4gICAgICB0aGlzLmlucHV0R3JvdXAuYWRkQ2xhc3MoXCJjb2wtc20tI3t0aGlzLmVsZW1lbnRXaWR0aH1cIilcblxuICAgIF9nZXRJbnB1dENvbnRyb2xsZXI6IC0+XG4gICAgICBpZiB0aGlzLm5hbWUgYW5kIHRoaXMuZm9ybUNvbnRyb2xsZXJcbiAgICAgICAgdGhpcy5mb3JtQ29udHJvbGxlclt0aGlzLm5hbWVdXG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICBfZ2V0U2NvcGVWYXJpYWJsZXMgOiAtPlxuICAgICAgdmFycyA9IHt9XG4gICAgICB2YXJzLm5hbWUgPSBAbmFtZVxuICAgICAgdmFycy50eXBlID0gQHR5cGVcbiAgICAgIHZhcnMubGFiZWwgPSAkc2NvcGUubGFiZWxcbiAgICAgIHZhcnMuaWQgPSBcIiN7QG5hbWV9LWlkXCIgaWYgQG5hbWVcbiAgICAgIHJldHVybiB2YXJzXG5cbiAgICBfZXh0cmFjdE1lc3NhZ2VzOiAoZWxlbWVudHMpLT5cbiAgICAgIHJlcyA9IFtdXG4gICAgICB0aGlzLl9fbWVzc2FnZXMgPSBtZXNzYWdlcyA9IFtdXG4gICAgICBlbGVtZW50cy5lYWNoIChpLCBlKS0+XG4gICAgICAgIGlmIGUudGFnTmFtZT8udG9Mb3dlckNhc2UoKSA9PSBcIm1lc3NhZ2VcIiAjIG1lc3NhZ2UgdGFnXG4gICAgICAgICAgbWVzc2FnZXMucHVzaFxuICAgICAgICAgICAgd2hlbiAgIDogZS5hdHRyaWJ1dGVzLndoZW4udmFsdWVcbiAgICAgICAgICAgIG1lc3NhZ2U6IGUuaW5uZXJIVE1MXG4gICAgICAgICAgICBlICAgICAgOiBlXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIGVsc2UgaWYgZS5ub2RlVHlwZSA9PSBlLlRFWFRfTk9ERSBhbmQgbm90IGUudGV4dENvbnRlbnQudHJpbSgpICAjIGVtcHR5IHRleHRcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgcmVzLnB1c2goZSlcbiAgICAgIHRoaXMuX19tZXNzYWdlc0V4dHJhY3RlZCA9IHRydWVcbiAgICAgIHJldHVybiByZXNcblxuICAgIF9wcm9jZXNzRXhpc3RpbmdDb250ZW50OiAtPlxuICAgICAgZGVmZXJyZWQgPSAkcS5kZWZlcigpXG4gICAgICAkdHJhbnNjbHVkZSAoaW5uZXJFbGVtZW50cywgc2NvcGUpID0+XG4gICAgICAgIGlubmVyRWxlbWVudHMgPSB0aGlzLl9leHRyYWN0TWVzc2FnZXMoaW5uZXJFbGVtZW50cylcblxuICAgICAgICB0aGlzLl91c2VFeGlzdGluZyA9IGlubmVyRWxlbWVudHMubGVuZ3RoICE9IDBcblxuICAgICAgICBpZiB0aGlzLl91c2VFeGlzdGluZ1xuICAgICAgICAgIHJlcyA9IHRoaXMuZGVzdGluYXRpb25FbGVtZW50Lmh0bWwoaW5uZXJFbGVtZW50cylcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJlcyA9IHRoaXMuX3Byb2Nlc3NTdGFuZGFyZElucHV0KHNjb3BlKVxuXG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzKVxuXG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZVxuXG4gICAgX3Byb2Nlc3NTdGFuZGFyZElucHV0OiAoc2NvcGUpLT5cbiAgICAgIG9wdGlvbnMgPSBTaW1wbGVJbnB1dE9wdGlvbnMuaW5wdXRzW3RoaXMudHlwZV0gb3IgU2ltcGxlSW5wdXRPcHRpb25zLmdldERlZmF1bHQodGhpcy50eXBlKVxuICAgICAgJHRlbXBsYXRlRmFjdG9yeS5mcm9tQ29uZmlnKG9wdGlvbnMpXG4gICAgICAudGhlbiAodGVtcGxhdGVUZXh0KT0+XG4gICAgICAgIF8uZXh0ZW5kKHNjb3BlLCB0aGlzLl9nZXRTY29wZVZhcmlhYmxlcygpKVxuXG4gICAgICAgIHRlbXBsYXRlID0gYW5ndWxhci5lbGVtZW50KHRlbXBsYXRlVGV4dClcbiAgICAgICAgaW5wdXQgPSB0ZW1wbGF0ZS5jbG9zZXN0KFwiW25nLW1vZGVsXVwiKS5hZGQodGVtcGxhdGUuZmluZChcIltuZy1tb2RlbF1cIikpXG5cbiAgICAgICAgdGhpcy5fdXBkYXRlTmFtZShpbnB1dCwgdGhpcy5fZ2V0TmFtZSgpKVxuICAgICAgICB0aGlzLl9hdHRhY2hJbnB1dEF0dHJpYnV0ZXMoJGVsZW1lbnRbMF0uYXR0cmlidXRlcywgaW5wdXQpXG4gICAgICAgIHRoaXMuX3RyYXZlcnNlTmdNb2RlbChpbnB1dCwgJGF0dHJzLm5nTW9kZWwpXG5cbiAgICAgICAgdGVtcGxhdGUgPSB0aGlzLl9wcmVDb21waWxlKHRlbXBsYXRlKVxuXG4gICAgICAgIGlmIG9wdGlvbnMuY29udHJvbGxlclxuICAgICAgICAgIGNvbnRyb2xsZXIgPSAkY29udHJvbGxlcihvcHRpb25zLmNvbnRyb2xsZXIsIHskc2NvcGU6IHNjb3BlLCBvcHRpb25zfSlcbiAgICAgICAgICBpZiBvcHRpb25zLmNvbnRyb2xsZXJBc1xuICAgICAgICAgICAgc2NvcGVbb3B0aW9ucy5jb250cm9sbGVyQXNdID0gY29udHJvbGxlclxuXG4gICAgICAgIHRoaXMuZGVzdGluYXRpb25FbGVtZW50Lmh0bWwodGVtcGxhdGUpXG5cblxuICAgICAgICAkY29tcGlsZSh0aGlzLmRlc3RpbmF0aW9uRWxlbWVudC5jb250ZW50cygpKShzY29wZSlcblxuICAgICAgICBzY29wZS5pbnB1dEN0cmwgPSB0aGlzLl9nZXRJbnB1dENvbnRyb2xsZXIoKVxuXG4gICAgX2F0dGFjaElucHV0QXR0cmlidXRlczogKGF0dHJzLCB0byktPlxuICAgICAgZm9yIGF0dHIgaW4gYXR0cnNcbiAgICAgICAgaWYgYXR0ci5uYW1lLmluZGV4T2YoJ2luLScpID09IDBcbiAgICAgICAgICBrID0gYXR0ci5uYW1lLnNsaWNlKDMpXG4gICAgICAgICAgdiA9IGF0dHIudmFsdWVcbiAgICAgICAgICB0by5hdHRyKGssIHYpXG5cbiAgICBfZ2V0TmFtZTogLT5cbiAgICAgIGlmIHRoaXMuX3VzZUV4aXN0aW5nXG4gICAgICAgIHJldHVybiAkYXR0cnMubmFtZVxuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gJGF0dHJzLm5hbWUgb3IgJGF0dHJzLm5nTW9kZWxcblxuICAgIF91cGRhdGVOYW1lOiAoZWxlbWVudCwgbmFtZSktPlxuICAgICAgZWxlbWVudC5hdHRyKCduYW1lJywgbmFtZSlcblxuICAgIF9wcmVDb21waWxlOiAoaW5wdXQpLT5cbiAgICAgIHJldHVybiBpbnB1dFxuXG4gICAgX2dldE1lc3NhZ2VzOiAtPlxuICAgICAgaWYgbm90IHRoaXMuX19tZXNzYWdlc0V4dHJhY3RlZFxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJtZXNzYWdlcyB3ZXJlIG5vdCBleHRyYWN0ZWQuIFdyb25nIGZ1bmN0aW9uIG9yZGVyIGNhbGxcIilcbiAgICAgIHJldHVybiB0aGlzLl9fbWVzc2FnZXNcblxuICAgIF9pbnNlcnRNZXNzYWdlczogLT5cbiAgICAgIG1zZ3MgPSAkZWxlbWVudC5maW5kKCdbbmctbWVzc2FnZXNdJylcbiAgICAgIGZvciBtIGluIHRoaXMuX2dldE1lc3NhZ2VzKCkgfHwgW11cbiAgICAgICAgbXNncy5hcHBlbmQobS5lKVxuICAgICAgICAkY29tcGlsZShtLmUpKCRzY29wZSlcblxuICAgIF90cmF2ZXJzZU5nTW9kZWw6IChpbnB1dCwgbmFtZSktPlxuICAgICAgaW5wdXQuYXR0cignbmctbW9kZWwnLCBuYW1lKVxuXG4gIF8uZXh0ZW5kKHRoaXMsIFNpbXBsZUlucHV0Q29udHJvbGxlci5wcm90b3R5cGUpXG4gIHJldHVyblxuLmRpcmVjdGl2ZSBcInNpbXBsZUlucHV0XCIsIC0+XG4gICMjIypcbiAgICAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAgICAqIEBuYW1lIHNpbXBsZUlucHV0XG4gICAgKiBAcmVzdHJpY3QgRVxuICAgICpcbiAgICAqIEBkZXNjcmlwdGlvblxuICAgICogRWxlbWVudCB0byBzaW1wbGlmeSB1c2FnZSBvZiBzdGFuZGFyZCBodG1sIGlucHV0IGFuZCBhbiBhIHdyYXBwZXIgZm9yIGN1c3RvbSBpbnB1dHMuXG4gICAgKlxuICAgICogVXNpbmcgZGlyZWN0aXZlIG1lc3NhZ2Ugd2l0aCBhdHRyaWJ1dGUgYHdoZW5gIGNhbiBiZSB1c2VkIHRvIGV4dGVuZCBlcnJvciBtZXNzYWdlcy5cbiAgICAqIGBgYGh0bWxcbiAgICAqICAgPG1lc3NhZ2Ugd2hlbj1cInZhbGlkYXRvclwiPlNvbWUgZXJyb3IgbWVzc2FnZTwvbWVzc2FnZT5cbiAgICAqIGBgYFxuICAgICpcbiAgICAqIERpcmVjdGl2ZSBjYW4gYmUgdXNlciBpbiB0d28gZGlmZmVyZW50IHdheXMuIEFzIHN0YW5kYWxvbmUgYW5kIGFzIGEgd3JhcHBlci5cbiAgICAqIEluIGEgc3RhbmRhbG9uZSBtb2RlIGBuZ01vZGVsYCBpcyByZXF1aXJlZC4gRm9yIGEgY29ycmVjdCB3b3JrIGluIGEgd3JhcHBlciBtb2RlIHNhbWUgdmFsdWUgb2YgYXR0cmlidXRlIGBuYW1lYFxuICAgICogYW5kIGZvcm0gZWxlbWVudCBpcyByZXF1aXJlZCBmb3IgY29ycmVjdCB3b3JraW5nXG4gICAgKlxuICAgICogQGV4YW1wbGVcbiAgICAqIFNpbXBsZSB3b3JrIGluIGEgc3RhbmRhbG9uZSBtb2RlXG4gICAgPGV4YW1wbGU+XG4gICAgICA8ZmlsZSBuYW1lPVwiaW5kZXguaHRtbFwiPlxuICAgICAgICA8Zm9ybT5cbiAgICAgICAgICA8c2ltcGxlLWlucHV0IGxhYmVsPVwiVGV4dFwiIG5nLW1vZGVsPVwibW9kZWwudmFsdWVcIj48L3NpbXBsZS1pbnB1dD5cbiAgICAgICAgPC9mb3JtPlxuICAgICAgPC9maWxlPlxuICAgIDwvZXhhbXBsZT5cbiAgICAqXG4gICAgKiBAZXhhbXBsZVxuICAgICogV29yayBpbiBhIHN0YW5kYWxvbmUgd29yayB3aXRoIGN1c3RvbSBtZXNzYWdlcyBhbmQgY3VzdG9tIHZhbGlkYXRvciBtYXRjaGVzXG4gICAgPGV4YW1wbGU+XG4gICAgICA8ZmlsZSBuYW1lPVwiaW5kZXguaHRtbFwiPlxuICAgICAgICA8Zm9ybT5cbiAgICAgICAgICA8c2ltcGxlLWlucHV0IGxhYmVsPVwiUGFzc3dvcmQgcmVwZWF0XCIgbmctbW9kZWw9XCJtb2RlbC5wYXNzd29yZFJlcGVhdFwiIGluLXJlcXVpcmVkXG4gICAgICAgICAgICAgICAgICAgICAgICBpbi1tYXRjaGVzPVwibW9kZWwucGFzc3dvcmRcIj5cbiAgICAgICAgICAgICA8bWVzc2FnZSB3aGVuPVwibWF0Y2hlc1wiPnt7ICdQYXNzd29yZHMgZG9lc24ndCBtYXRjaCcgfCB0cmFuc2xhdGUgfX08L21lc3NhZ2U+XG4gICAgICAgICAgPC9zaW1wbGUtaW5wdXQ+XG4gICAgICAgIDwvZm9ybT5cbiAgICAgIDwvZmlsZT5cbiAgICA8L2V4YW1wbGU+XG4gICAgKlxuICAgICogQGV4YW1wbGVcbiAgICAqIEV4YW1wbGUgb2Ygd29yayBhcyBhIHdyYXBwZXIgZm9yIHVpLXNlbGVjdC5cbiAgICA8ZXhhbXBsZT5cbiAgICAgIDxmaWxlIG5hbWU9XCJpbmRleC5odG1sXCI+XG4gICAgICAgIDxmb3JtPlxuICAgICAgICAgIDxzaW1wbGUtaW5wdXQgbGFiZWw9XCJTb21lIHNlbGVjdCBvZiBwZXJzb25cIiBuYW1lPVwicGVyc29uXCI+XG4gICAgICAgICAgICA8dWktc2VsZWN0IG5nLW1vZGVsPVwicGVyc29uLnNlbGVjdGVkXCIgbmFtZT1cInBlcnNvblwiPlxuICAgICAgICAgICAgICA8dWktc2VsZWN0LW1hdGNoIHBsYWNlaG9sZGVyPVwiU2VsZWN0IGEgcGVyc29uIGluIHRoZSBsaXN0IG9yIHNlYXJjaCBoaXMgbmFtZS9hZ2UuLi5cIj5cbiAgICAgICAgICAgICAgICB7eyRzZWxlY3Quc2VsZWN0ZWQubmFtZX19XG4gICAgICAgICAgICAgIDwvdWktc2VsZWN0LW1hdGNoPlxuICAgICAgICAgICAgICA8dWktc2VsZWN0LWNob2ljZXMgcmVwZWF0PVwicGVyc29uIGluIHBlb3BsZSB8IHByb3BzRmlsdGVyOiB7bmFtZTogJHNlbGVjdC5zZWFyY2gsIGFnZTogJHNlbGVjdC5zZWFyY2h9XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBuZy1iaW5kLWh0bWw9XCJwZXJzb24ubmFtZSB8IGhpZ2hsaWdodDogJHNlbGVjdC5zZWFyY2hcIj48L2Rpdj5cbiAgICAgICAgICAgICAgPC91aS1zZWxlY3QtY2hvaWNlcz5cbiAgICAgICAgICAgIDwvdWktc2VsZWN0PlxuICAgICAgICAgIDwvc2ltcGxlLWlucHV0PlxuICAgICAgICA8L2Zvcm0+XG4gICAgICA8L2ZpbGU+XG4gICAgPC9leGFtcGxlPlxuICAgICpcblxuICAgICogQHBhcmFtIHtzdHJpbmc9fSBsYWJlbCBMYWJlbCBmb3IgdGhlIGlucHV0LCBhbHNvIHVzZWQgYXMgYSBwbGFjZWhvbGRlclxuICAgICogQHBhcmFtIHtzdHJpbmc9fSB0eXBlIG9mIHRoZSBpbnB1dCAoJ3RleHQnLCAnbnVtYmVyJywgJ3NlbGVjdCcsJ3RleHRhcmVhJywgZXRjKS4gSWYgdGVtcGxhdGUgaXMgcmVnaXN0ZXJlZCBpblxuICAgICogICAgIGBTaW1wbGVJbnB1dE9wdGlvbnNgIHRlbXBsYXRlIHdpbGwgYmUgdXNlZCwgb3IgU2ltcGxlSW5wdXRPcHRpb25zLmdldERlZmF1bHQgd2lsbCBiZSBpbnZva2VkIGlmIHNwZWNpZmljIHR5cGVcbiAgICAqICAgICB3aWxsIG5vdCBiZSBmb3VuZC5cbiAgICAqIEBwYXJhbSB7c3RyaW5nPX0gbmdNb2RlbCAgQXNzaWduYWJsZSBhbmd1bGFyIGV4cHJlc3Npb24gdG8gZGF0YS1iaW5kIHRvLiBEbyBub3QgdXNlICdzaW1wbGUnIHJlZmZlcmVuY2UgdG8gbW9kZWwsXG4gICAgKiAgICAgb25seSB3aXRoIGRvdFxuICAgICogQHBhcmFtIHtzdHJpbmc9fSBuYW1lIFByb3BlcnR5IG5hbWUgb2YgdGhlIGZvcm0gdW5kZXIgd2hpY2ggdGhlIGNvbnRyb2wgaXMgcHVibGlzaGVkLlxuICAgICogICAgIElmIG5vIG5hbWUgaXMgc3BlY2lmaWVkIHZhbHVlIGlmIGBuZ01vZGVsYCBhdHRyaWJ1dGUgd2lsbCBiZSB1c2VkXG4gICAgKiBAcGFyYW1zIHtudW1iZXI9fSBsYWJlbFdpZHRoIFdpZHRoIG9mIGxhYmVsIChib290c3RyYXAgMS0xMikuXG4gICAgKiAgICAgRGVmYXVsdCB2YWx1ZSBjYW4gYmUgdG9vayBmcm9tIGBmb3JtR3JvdXBDb25maWdgIG9yIDNcbiAgICAqIEBwYXJhbXMge251bWJlcj19IGVsZW1lbnRXaWR0aCBXaWR0aCBvZiBpbnB1dCBlbGVtZW50IChib290c3RyYXAgMS0xMikuIERlZmF1bHQgdmFsdWUgY2FuIGJlIHRvb2sgZnJvbVxuICAgICogICAgIGBmb3JtR3JvdXBDb25maWdgIDlcbiAgICAqIEBwYXJhbSB7Ym9vbD19IGhpZGVMYWJlbCBJZiB0cnVlIGxhYmVsIHdpbGwgYmUgaGlkZGVuICBhbmQgd2lkdGggd2lsbCBiZSByZWNhbGN1bGF0ZWQgYWNjb3JkaW5nbHlcbiAgICAqIEBwYXJhbSB7YW55PX0gaW4tKiBBbGwgYXR0cmlidXRlcyBzdGFydGluZyB3aXRoIHRoZSBwcmVmaXggYGluLWAgd2lsbCBiZSBjb3BpZWQgdG8gdGhlIGlucHV0IGVsZW1lbnQgKHdpdGhvdXRcbiAgICAqICAgICB0aGUgcHJlZml4KS4gT25seSBmb3Igc3RhbmRhbG9uZVxuICAgICpcbiAgICAqIFRvIHNlZSBtb3JlIGV4YW1wbGVzIHNlZSB0aGlzIHByb2plY3QgcGFnZXNcbiAgIyMjXG4gIHJlc3RyaWN0ICAgOiBcIkVcIlxuICByZXF1aXJlICAgIDogWydzaW1wbGVJbnB1dCcsICdeP2Zvcm0nLCAnXj9mb3JtR3JvdXBDb25maWcnXVxuICB0cmFuc2NsdWRlIDogdHJ1ZVxuICBzY29wZSAgICAgIDpcbiAgICBuZ01vZGVsIDogJz0nXG4gICAgbGFiZWwgICA6ICdAJ1xuICAgIGhlbHBUZXh0OiAnQCdcbiAgdGVtcGxhdGVVcmw6ICdzaW1wbGUtaW5wdXQvc2ltcGxlLWlucHV0LnRwbC5odG1sJ1xuICBjb250cm9sbGVyIDogJ1NpbXBsZUlucHV0Q29udHJvbGxlcidcbiAgbGluayAgICAgICA6IChzY29wZSwgZWxlbWVudCwgYXR0cnMsIFtzaW1wbGVJbnB1dEN0cmwsIGZvcm1DdHJsLCBmb3JtR3JvdXBDb25maWddKS0+XG4gICAgc2ltcGxlSW5wdXRDdHJsLmluaXQoZm9ybUN0cmwsIGZvcm1Hcm91cENvbmZpZylcbiAgICBzaW1wbGVJbnB1dEN0cmwucmVuZGVyKClcbiAgICAudGhlbiAtPlxuICAgICAgc2NvcGUuc2hvd0Vycm9yID0gLT5cbiAgICAgICAgY3RybCA9IHNjb3BlLmlucHV0Q3RybFxuICAgICAgICByZXR1cm4gKGN0cmwuJHNob3dWYWxpZGF0aW9uTXNnIHx8IGN0cmwuJHRvdWNoZWQpICYmIGN0cmwuJGludmFsaWQgaWYgY3RybFxuXG5cblxuXG5cblxuIiwiIyMjKlxuICAqIEBhdXRob3IgUGV0ZXIgS2ljZW5rb1xuICAqIEBmaWxlIENsYXNzZXMgd2hpY2ggZGVmaW5lIGJlaGF2aW91ciBvZiBzdGFuZGFyZCBmb3JtXG4gICogQGRlc2NyaXB0aW9uXG4gICogRm9ybSBvcHRpb25zIHNob3VsZCBiZSB1c2VkIGZvciBnZW5lcmFsIGNhc2VzLCAgQWR2YW5jZWRGb3JtT3B0aW9ucyBmb3IgbWFuaXB1bGF0aW9uIG9mIG9iamVjdHNcbiAgKiAobW9kZWxzIGZyb20gc3VuLXJlc3QpXG4jIyNcbiMjIypcbiAgKiBAdHlwZWRlZiBGb3JtT3B0aW9uQnV0dG9uXG4gICogQHByb3BlcnR5IHtzdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgYnV0dG9uXG4gICogQHByb3BlcnR5IHtzdHJpbmd9IGxhYmVsIExhYmVsIG9mIHRoZSBidXR0b25cbiAgKiBAcHJvcGVydHkge2V4cHJlc3Npb258ZnVuY3Rpb24oRm9ybU9wdGlvbnMpfSBhY3Rpb24gQWN0aW9uIHdoaWNoIHdpbGwgYmUgcGVyZm9ybWVkIGlmIGJ1dHRvbiBpcyBwcmVzc2VkLlxuICAqICAgICAgIGlmIGV4cHJlc3Npb24gdGhlIHNjb3BlIGl0IGN1cnJlbnQgb2JqZWN0LlxuICAqIEBwcm9wZXJ0eSB7Ym9vbD19IGRlZmF1bHQgIElzIGJ1dHRvbiBpcyBkZWZhdWx0LiBJZiB0cnVlIGl0IHdpbGwgaGF2ZSBhZGRpdGlvbmFsIGNsYXNzIGFuZFxuICAqICAgICAgIGFjdGlvbiBvZiB0aGUgYnV0dG9uIHdpbGwgYmUgY2FsbGVkIG9uIGZvcm0gc3VibWl0XG4gICogQHByb3BlcnR5IHtzdHJpbmc9fSB0eXBlIFR5cGUgb2YgdGhlIGJ1dHRvblxuIyMjXG5hbmd1bGFyLm1vZHVsZSAnc3VuLmZvcm0uc3RhbmRhcmQtZm9ybS5mb3JtLW9wdGlvbnMnLCBbXVxuLnByb3ZpZGVyICdGb3JtT3B0aW9ucycsIC0+XG4gIGJhc2VDb25maWcgPSB0aGlzXG4gIGJhc2VDb25maWcuZGVmYXVsdEJ1dHRvbnMgPVxuICAgIGNhbmNlbDpcbiAgICAgIG5hbWU6ICdjYW5jZWwnXG4gICAgICBsYWJlbDogXCJDQU5DRUxfQlROX0xBQkVMXCJcbiAgICAgIGFjdGlvbjogXCJfY2FuY2VsX2J0bigpXCJcbiAgICBzYXZlOlxuICAgICAgbmFtZTogJ3NhdmUnXG4gICAgICBsYWJlbDogXCJTQVZFX0JUTl9MQUJFTFwiXG4gICAgICBhY3Rpb246IFwidmFsaWRfc2F2ZShmYWxzZSlcIlxuICAgIHNhdmVBbmRSZXR1cm46XG4gICAgICBuYW1lOiAnc2F2ZUFuZFJldHVybidcbiAgICAgIGxhYmVsOiBcIlNBVkVfQU5EX1JFVFVSTl9CVE5fTEFCRUxcIlxuICAgICAgYWN0aW9uOiBcInZhbGlkX3NhdmUodHJ1ZSlcIlxuICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgdHlwZTogJ3N1Ym1pdCdcblxuICB0aGlzLiRnZXQgPSAoJHEsICRwYXJzZSwgJHRyYW5zbGF0ZSktPlxuICAgICMjIypcbiAgICAgICogQGRlc2NyaXB0aW9uXG4gICAgICAqIE1haW4gcHVycG9zZSBpcyB0byBzZXQgb3B0aW9ucyBhbmQgdGhlbiBvdmVycmlkZSBzYXZlIG1ldGhvZCB0byBwZXJmb3JtIHNvbWUgYWN0aW9ucy5cbiAgICAgICogSWYgeW91IG5lZWQgdG8gc2hvdyBlcnJvcnMgZGlzcGxheSB0aGVtIGRpcmVjdGx5IChzaG93RXJyb3IpIG9yIGBoYW5kbGVFcnJvcnNgIHNob3VsZCBidSB1c2VkIHRvIHdyYXAgcHJvbWlzZVxuICAgICMjI1xuICAgIGNsYXNzIEZvcm1PcHRpb25zXG5cbiAgICAgICMjIypcbiAgICAgICAgQGRlc2NyaXB0aW9uIEJ1dHRvbnMgZm9yIGZvcm0gZnJvbSBGb3JtT3B0aW9uc1Byb3ZpZGVyLmRlZmF1bHRCdXR0b25zXG4gICAgICAjIyNcbiAgICAgIHN0YW5kYXJkQnV0dG9uczogWydjYW5jZWwnLCAnc2F2ZUFuZFJldHVybiddXG5cbiAgICAgICMjIypcbiAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBPcHRpb25zIG9mIGNsYXNzLlxuICAgICAgICAqIEBwYXJhbSB7Rm9ybU9wdGlvbkJ1dHRvbltdfHN0cmluZ1tdfSBvcHRpb25zLmJ1dHRvbnMgQnV0dG9ucyBkaXNwbGF5ZWQgYnkgc3RhbmRhcmQgZm9ybS5cbiAgICAgICAgKiAgICAgICBJZiBlbGVtZW50IG9mIGFycmF5IGlzIGEgc3RyaW5ncyBpcyBzdXBwbGllZCwgZGVmYXVsdHMgYnV0dG9ucyB3aWxsIGJlIHVzZWRcbiAgICAgICMjI1xuICAgICAgY29uc3RydWN0b3I6IChvcHRpb25zKS0+XG4gICAgICAgIHRoaXMubXNnID0ge3Nob3c6IGZhbHNlfVxuICAgICAgICB0aGlzLmZvcm0gPSBudWxsXG4gICAgICAgIF8uZXh0ZW5kKHRoaXMsIG9wdGlvbnMpXG5cbiAgICAgICAgdGhpcy5idXR0b25zID0gbnVsbFxuICAgICAgICBpZiBvcHRpb25zICYmIG5vdCBfLmlzVW5kZWZpbmVkKG9wdGlvbnMuYnV0dG9ucylcbiAgICAgICAgICB0aGlzLnNldEJ1dHRvbnMob3B0aW9ucy5idXR0b25zKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgdGhpcy51c2VEZWZhdWx0QnV0dG9ucygpXG4gICAgICAgIHJldHVyblxuXG4gICAgICAjIyMqXG4gICAgICAgICogQGRlc2NyaXB0aW9uIFNldCBib3R0b25zIHRvIHN0YW5kYXJkXG4gICAgICAjIyNcbiAgICAgIHVzZURlZmF1bHRCdXR0b25zOiAtPlxuICAgICAgICB0aGlzLnNldEJ1dHRvbnModGhpcy5zdGFuZGFyZEJ1dHRvbnMpXG5cbiAgICAgICMjIypcbiAgICAgICAgKiBAZGVzY3JpcHRpb24gU2V0IGJ1dHRvbnMuIFNlZSBjb25zdHJ1Y3RvclxuICAgICAgICAqIEBwYXJhbSB7Rm9ybU9wdGlvbkJ1dHRvbltdfHN0cmluZ30gQnV0dG9ucyB0byBidyBzZXRcbiAgICAgICMjI1xuICAgICAgc2V0QnV0dG9uczogKGJ1dHRvbnMpLT5cbiAgICAgICAgaWYgXy5pc0FycmF5KGJ1dHRvbnMpXG4gICAgICAgICAgdGhpcy5idXR0b25zID0ge31cbiAgICAgICAgICBmb3IgYnV0dG9uIGluIGJ1dHRvbnNcbiAgICAgICAgICAgIGlmIF8uaXNTdHJpbmcoYnV0dG9uKVxuICAgICAgICAgICAgICBidXR0b24gPSBfLmNsb25lRGVlcChiYXNlQ29uZmlnLmRlZmF1bHRCdXR0b25zW2J1dHRvbl0pXG4gICAgICAgICAgICAgIGlmIG5vdCBidXR0b25cbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBidXR0b24gZm91bmQgYnkgbmFtZSAje2J1dHRvbn1cIilcbiAgICAgICAgICAgIGlmICFidXR0b24ubmFtZVxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCdXR0b24gbXVzdCBoYXZlIG5hbWVcIilcbiAgICAgICAgICAgIHRoaXMuYnV0dG9uc1tidXR0b24ubmFtZV0gPSBidXR0b25cbiAgICAgICAgZWxzZVxuICAgICAgICAgIHRoaXMuYnV0dG9ucyA9IGJ1dHRvbnNcblxuICAgICAgIyMjKlxuICAgICAgICAqIEBkZXNjcmlwdGlvbiBTZXQgZm9ybSBjb250cm9sbGVyXG4gICAgICAgICogQHBhcmFtIHtmb3JtLkZvcm1Db250cm9sbGVyfSBmb3JtIEZvcm0gQ29udHJvbGxlclxuICAgICAgIyMjXG4gICAgICBzZXRGb3JtOiAoZm9ybSktPlxuICAgICAgICB0aGlzLmZvcm0gPSBmb3JtXG5cbiAgICAgICMjIypcbiAgICAgICAgKiBAZGVzY3JpcHRpb24gRm9yY2VzIHNpbXBsZUlucHV0IHRvIHNob3cgdmFsaWRhdGlvbiBlcnJvcnMgYW5kIHJldHVzcm4gaXMgZm9ybSBpcyB2YWxpZFxuICAgICAgICAqIEByZXR1cm5zIHtib29sfSBJcyBhbGwgZm9ybSBlbGVtZW50cyBhcmUgdmFsaWRcbiAgICAgICMjI1xuICAgICAgdmFsaWRhdGU6IC0+XG4gICAgICAgIGZvcm0gPSB0aGlzLmZvcm1cbiAgICAgICAgXyhmb3JtKVxuICAgICAgICAua2V5cygpXG4gICAgICAgIC5maWx0ZXIgKGUpLT4gZVswXSAhPSBcIiRcIiAmJiAhXy5pc1VuZGVmaW5lZChmb3JtW2VdLiR2YWxpZClcbiAgICAgICAgLmVhY2ggKG5hbWUpLT5cbiAgICAgICAgICBmb3JtW25hbWVdLiRzaG93VmFsaWRhdGlvbk1zZyA9IHRydWVcbiAgICAgICAgcmV0dXJuIHRoaXMuZm9ybS4kdmFsaWRcblxuICAgICAgIyMjKlxuICAgICAgICAqIEBkZXNjcmlwdGlvbiBTZXQgZXJyb3IgZm9yIGZvcm1cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbXNnIE1lc3NhZ2UgdG8gYmUgc2hvd25cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZz19IHRpdGxlIFRpdGxlIG9mIHRoZSBlcnJvclxuICAgICAgIyMjXG4gICAgICBzaG93RXJyb3I6IChtc2csIHRpdGxlKS0+XG4gICAgICAgIHRoaXMuc2hvd01lc3NhZ2UobXNnLCAnZGFuZ2VyJywgdGl0bGUpXG5cbiAgICAgICMjIypcbiAgICAgICAgKiBAZGVzY3JpcHRpb24gU2V0IGN1c3RvbSBtZXNzYWdlXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG1zZyBNZXNzYWdlIHRvIGJlIHNob3duXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmc9fSB0eXBlIENvbnRhaW50ZXIgdHlwZSBpZiB0aGUgZXJyb3JcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZz19IHRpdGxlIFRpdGxlIG9mIHRoZSBlcnJvclxuICAgICAgIyMjXG4gICAgICBzaG93TWVzc2FnZTogKG1zZywgdHlwZSA9IFwiaW5mb1wiLCB0aXRsZSktPlxuICAgICAgICB0aGlzLm1zZyA9XG4gICAgICAgICAgdHlwZTogdHlwZVxuICAgICAgICAgIHRleHQ6IG1zZ1xuICAgICAgICAgIHNob3c6IHRydWVcbiAgICAgICAgICB0aXRsZTogdGl0bGVcbiAgICAgICAgcmV0dXJuXG5cbiAgICAgICMjIypcbiAgICAgICAgKiBAZGVzY3JpcHRpb24gV3JhcHMgYHByb21pc2VgLiBJZiBwcm9taXNlIGlzIHJlc29sdmVkIG1lc3NhZ2Ugd2lsbCBiZSBoaWRkZW4uXG4gICAgICAgICogICAgIElmIHByb21pc2UgaXMgcmVqZWN0ZWQsIHRoZW4gdGhlIGVycm9yIHdpbGwgYmUgc2hvd24gd2l0aCB0aGUgYHRpdGxlYC5cbiAgICAgICAgKiBAcGFyYW0ge1Byb21pc2V9IHByb21pc2UgV3JhcHBpbmcgcHJvbWlzZVxuICAgICAgICAqIEBwYXJhbXMge3N0cmluZz19IHRpdGxlIFRpdGxlIGZvciBlcnJvciBpZiBlcnJvciBvY2N1cnNcbiAgICAgICMjI1xuICAgICAgaGFuZGxlRXJyb3JzOiAocHJvbWlzZSwgdGl0bGUpLT5cbiAgICAgICAgZGVmZXJyZWQgPSAkcS5kZWZlcigpXG4gICAgICAgIHByb21pc2VcbiAgICAgICAgLnRoZW4gKHJlcyk9PlxuICAgICAgICAgIHRoaXMubXNnLnNob3cgPSBmYWxzZVxuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzKVxuICAgICAgICAuY2F0Y2ggKHJlc3ApPT5cbiAgICAgICAgICAjc2V0IGVycm9yIG1lc3NhZ2UgdG8gZm9ybVxuICAgICAgICAgIGRlZmVycmVkLnJlamVjdChyZXNwKVxuICAgICAgICAgICRxLndoZW4gdGhpcy5fcGFyc2VFcnJvcihyZXNwKVxuICAgICAgICAgIC50aGVuIChlcnJvck1zZyk9PlxuICAgICAgICAgICAgdGhpcy5zaG93RXJyb3IoZXJyb3JNc2csIHRpdGxlKVxuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZVxuXG4gICAgICAjIyMqXG4gICAgICAgICogQGRlc2NyaXB0aW9uIFN0dWIuIE1ldGhvZCBpcyBjYWxsZWQgZm9yIHZhbGlkIGZvcm0gdG8gcGVyZm9ybSBhY3Rpb24uIFNob3VsZCBiZSBvdmVycmlkZW4gZm9yIGluc3RhbmNlXG4gICAgICAjIyNcbiAgICAgIHNhdmU6IC0+XG4gICAgICAgICNzdHViXG4gICAgICAgIHJldHVyblxuXG4gICAgICAjIyMqXG4gICAgICAgICogQGRlc2NyaXB0aW9uIFZhbGlkYXRlIGZvcm0gYW5kIGNhbGwgc2F2ZSBtZXRob2QgaWYgdmFsaWRhdGlvbiBpcyBzdWNjZXNzXG4gICAgICAjIyNcbiAgICAgIHZhbGlkX3NhdmU6IC0+XG4gICAgICAgIGlmIHRoaXMudmFsaWRhdGUoKVxuICAgICAgICAgIHRoaXMuc2F2ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG5cbiAgICAgICMjI1xuICAgICAgICBAZGVzY3JpcHRpb24gUGFyc2VzIHNlcnZlciByZXNwb25zZVxuICAgICAgICBAcGFyYW0ge3N0cmluZ3xPYmplY3R9IEVycm9yIG1lc3NhZ2Ugb3IgaHR0cCByZXNwb25zZSBvYmplY3RcbiAgICAgICMjI1xuICAgICAgX3BhcnNlRXJyb3I6IChyZXNwKS0+XG4gICAgICAgIGlmIF8uaXNTdHJpbmcocmVzcClcbiAgICAgICAgICByZXR1cm4gcmVzcFxuICAgICAgICBlbHNlIGlmIHJlc3AgaW5zdGFuY2VvZiBFcnJvclxuICAgICAgICAgIHJldHVybiByZXNwLm1lc3NhZ2VcbiAgICAgICAgZWxzZSBpZiBhbmd1bGFyLmlzRGVmaW5lZChyZXNwLnN0YXR1cykgYW5kIGFuZ3VsYXIuaXNEZWZpbmVkKHJlc3AuZGF0YSlcbiAgICAgICAgICBpZiBfLmlzU3RyaW5nKHJlc3AuZGF0YSlcbiAgICAgICAgICAgIGlmIDUwMCA8PSByZXNwLnN0YXR1cyA8IDYwMFxuICAgICAgICAgICAgICByZXR1cm4gJHRyYW5zbGF0ZShcIlNFUlZFUl9FUlJPUl9NRVNTQUdFXCIsIHtzdGF0dXM6IHJlc3Auc3RhdHVzLCB0ZXh0OiByZXNwLnN0YXR1c1RleHR9KVxuICAgICAgICAgICAgcmV0dXJuIHJlc3AuZGF0YVxuICAgICAgICAgIGVsc2UgaWYgcmVzcC5kYXRhLm1zZ1xuICAgICAgICAgICAgbXNnID0gcmVzcC5kYXRhLm1zZy5tZXNzYWdlXG4gICAgICAgICAgICByZXR1cm4gJHRyYW5zbGF0ZShtc2cpXG5cbiAgICAgIF9ydW5BY3Rpb246IChhY3Rpb24sIGJ1dHRvbiktPlxuICAgICAgICByZXR1cm4gaWYgbm90IGFjdGlvblxuICAgICAgICBpZiBfLmlzRnVuY3Rpb24oYWN0aW9uKVxuICAgICAgICAgIGFjdGlvbi5jYWxsKGJ1dHRvbiwgdGhpcylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICRwYXJzZShhY3Rpb24pKHRoaXMsIHtidXR0b259KVxuXG4gICAgICBfY2xpY2tlZDogKGJ1dHRvbiktPlxuICAgICAgICByZXR1cm4gaWYgYnV0dG9uLnR5cGUgPT0gJ3N1Ym1pdCcgIyBXaWxsIGJlIGhhbmRsZWQgYnkgYF9mb3JtX3N1Ym1pdGBcbiAgICAgICAgdGhpcy5fcnVuQWN0aW9uKGJ1dHRvbi5hY3Rpb24sIGJ1dHRvbilcblxuICAgICAgX2Zvcm1fc3VibWl0OiAtPlxuICAgICAgICBidXR0b24gPSBfKHRoaXMuYnV0dG9ucykuZmlsdGVyKChiKS0+Yi5kZWZhdWx0KS5maXJzdCgpXG4gICAgICAgIGlmIGJ1dHRvblxuICAgICAgICAgIHRoaXMuX3J1bkFjdGlvbihidXR0b24uYWN0aW9uLCBidXR0b24pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICB0aGlzLnZhbGlkX3NhdmUoKVxuXG4gICAgICBfY2FuY2VsX2J0bjogLT5cblxuICByZXR1cm5cblxuLnByb3ZpZGVyICdBZHZhbmNlZEZvcm1PcHRpb25zJywgKEZvcm1PcHRpb25zUHJvdmlkZXIpLT5cbiAgYmFzZUNvbmZpZyA9IEZvcm1PcHRpb25zUHJvdmlkZXJcbiAgdGhpcy4kZ2V0ID0gKCR0cmFuc2xhdGUsICRxLCBGb3JtT3B0aW9ucywgJHN0YXRlLCBGbGFzaE1lc3NhZ2UsIHN1blJlc3RCYXNlTW9kZWwpLT5cbiAgICBjbGFzcyBBZHZhbmNlZEZvcm1PcHRpb25zIGV4dGVuZHMgRm9ybU9wdGlvbnNcbiAgICAgIHN0YW5kYXJkQnV0dG9uczogWydjYW5jZWwnLCAnc2F2ZScsICdzYXZlQW5kUmV0dXJuJ11cbiAgICAgIHN1Y2Nlc3NTYXZlZE1lc3NhZ2U6IFwiT0JKRUNUX1NBVkVEX0ZMQVNIX01FU1NBR0VcIlxuXG4gICAgICAjIyMqXG4gICAgICAgICogQGRlc2NyaXB0aW9uIFVzZVxuICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gICAgICAgICogQHBhcmFtIHtPYmplY3QuPHN0cmluZyxzdHJpbmd8ZnVuY3Rpb24oc3VuUmVzdEJhc2VNb2RlbCk+fSBvcHRpb25zLnN0YXRlcyBTdGF0ZXMgdG8gYmUgZ28sIGFmdGVyIHNhdmUuXG4gICAgICAgICogICAgICAgQXZhaWxhYmxlIGFyZSAncmV0dXJuJywnY3JlYXRlZCcsJ3NpbXBseVNhdmVkJy4gSWYgdmFsdWUgaXMgZnVuY3Rpb24gaXQgd2lsbCBiZSBjYWxsZWQgd2l0aCBtb2RlbC5cblxuICAgICAgICAqIEBwYXJhbSB7c3VuUmVzdEJhc2VNb2RlbH0gbW9kZWwgTW9kZWwgdG8gd29yayB3aXRoXG4gICAgICAjIyNcbiAgICAgIGNvbnN0cnVjdG9yOiAob3B0aW9ucywgbW9kZWwpLT5cbiAgICAgICAgaWYgb3B0aW9ucyBpbnN0YW5jZW9mIHN1blJlc3RCYXNlTW9kZWxcbiAgICAgICAgICBbbW9kZWwsIG9wdGlvbnNdID0gW29wdGlvbnMsIG1vZGVsXVxuICAgICAgICBzdXBlclxuICAgICAgICB0aGlzLnNldE1vZGVsKG1vZGVsKSBpZiBtb2RlbFxuXG4gICAgICAjIyMqXG4gICAgICAgICogQGRlc2NyaXB0aW9uIFNldCBtb2RlbC5cbiAgICAgICMjI1xuICAgICAgc2V0TW9kZWw6IChtb2RlbCktPlxuICAgICAgICB0aGlzLm1vZGVsID0gbW9kZWxcblxuICAgICAgIyMjKlxuICAgICAgICAqIEBkZXNjcmlwdGlvbiBTdHViLiBBY3Rpb24gYmVmb3JlIG1vZGVsIHNhdmVcbiAgICAgICAgKiBAcGFyYW1zIHtPYmplY3R9IG1vZGVsIE1vZGVsIHRvIGJlIHNhdmVkXG4gICAgICAjIyNcbiAgICAgIHByZVNhdmU6IChtb2RlbCktPlxuICAgICAgICAjc3R1YlxuICAgICAgICByZXR1cm5cblxuICAgICAgIyMjKlxuICAgICAgICAqIEBkZXNjcmlwdGlvbiBTdHViLiBBY3Rpb24gYWZ0ZXIgbW9kZWwgc2F2ZVxuICAgICAgICAqIEBwYXJhbXMge09iamVjdH0gbW9kZWwgTW9kZWwgdG8gYmUgc2F2ZWRcbiAgICAgICAgKiBAcGFyYW1zIHtPYmplY3R9IHJlc3BvbmUgUmVzcG9uc2UgZnJvbSB0aGUgc2VydmVyXG4gICAgICAjIyNcbiAgICAgIHBvc3RTYXZlOiAobW9kZWwsIHJlc3BvbnNlKS0+XG4gICAgICAgICNzdHViXG4gICAgICAgIHJldHVyblxuXG4gICAgICAjIyMqXG4gICAgICAgICogQGRlc2NyaXB0aW9uIFNldCBib3R0b25zIHRvIHN0YW5kYXJkXG4gICAgICAjIyNcbiAgICAgIHVzZURlZmF1bHRCdXR0b25zOiAtPlxuICAgICAgICBidXR0b25zID0gXy5jbG9uZURlZXAodGhpcy5zdGFuZGFyZEJ1dHRvbnMpXG4gICAgICAgIGlmIG5vdCB0aGlzLnN0YXRlcz8ucmV0dXJuXG4gICAgICAgICAgYnV0dG9ucy5yZW1vdmUoJ3NhdmVBbmRSZXR1cm4nKVxuICAgICAgICB0aGlzLnNldEJ1dHRvbnMoYnV0dG9ucylcbiAgICAgICAgaWYgbm90IHRoaXMuc3RhdGVzPy5yZXR1cm5cbiAgICAgICAgICB0aGlzLmJ1dHRvbnMuc2F2ZS5kZWZhdWx0ID0gdHJ1ZVxuICAgICAgICAgIHRoaXMuYnV0dG9ucy5zYXZlLnR5cGUgPSAnc3VibWl0J1xuXG4gICAgICAjIyMqXG4gICAgICAgICogQGRlc2NyaXB0aW9uIFNhdmUgbW9kZWxcbiAgICAgICMjI1xuICAgICAgc2F2ZU1vZGVsOiAtPlxuICAgICAgICB0aGlzLm1vZGVsLm1uZ3Iuc2F2ZSgpXG5cbiAgICAgICMjIypcbiAgICAgICAgKiBAZGVzY3JpcHRpb24gTWV0aG9kIHRvIHNhdmUgbW9kZWwsIGhhbmRsZSBlcnJvcnMgYW5kIGdvIHRvIHN0YXRlLCBzcGVjaWZpZWQgYnkgYHNob3VsZFJldHVybmAgYW5kXG4gICAgICAgICogICAgICAgcHJldmlvdXMgbW9kZWwgc3RhdGUuXG4gICAgICAgICogQHBhcmFtcyB7T2JqZWN0fSBtb2RlbCBNb2RlbCB0byBiZSBzYXZlZFxuICAgICAgIyMjXG4gICAgICBzYXZlOiAoc2hvdWxkUmV0dXJuKS0+XG4gICAgICAgIG1vZGVsID0gdGhpcy5tb2RlbFxuICAgICAgICB0aGlzLnByZXZpb3VzTW9kZWxTdGF0ZSA9IG1vZGVsLm1uZ3Iuc3RhdGVcbiAgICAgICAgJHEud2hlbih0aGlzLnByZVNhdmUobW9kZWwpKVxuICAgICAgICAudGhlbiA9PlxuICAgICAgICAgIHRoaXMuaGFuZGxlRXJyb3JzIHRoaXMuc2F2ZU1vZGVsKClcbiAgICAgICAgLnRoZW4gKHJlc3BvbnNlKT0+XG4gICAgICAgICAgdGhpcy5wb3N0U2F2ZShtb2RlbCwgcmVzcG9uc2UpXG4gICAgICAgIC50aGVuICgpPT5cbiAgICAgICAgICBpZiBzaG91bGRSZXR1cm4gPT0gdHJ1ZSBvciBzaG91bGRSZXR1cm4gPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICB0aGlzLnN0YXRlUmV0dXJuKClcbiAgICAgICAgICBlbHNlIGlmIHRoaXMucHJldmlvdXNNb2RlbFN0YXRlID09IG1vZGVsLm1uZ3IuTkVXXG4gICAgICAgICAgICB0aGlzLnN0YXRlVG9DcmVhdGVkKClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aGlzLnN0YXRlU2ltcGx5U2F2ZWQoKVxuICAgICAgICAudGhlbiA9PlxuICAgICAgICAgIHRoaXMuX3Nob3dTdWNjZXNzTWVzc2FnZSgpXG5cbiAgICAgIF9nb1RvOiAoc3RhdGUpLT5cbiAgICAgICAgaWYgXy5pc0Z1bmN0aW9uKHN0YXRlKVxuICAgICAgICAgIHN0YXRlLmNhbGwodGhpcywgdGhpcy5tb2RlbClcbiAgICAgICAgZWxzZSBpZiBfLmlzQXJyYXkoc3RhdGUpXG4gICAgICAgICAgJHN0YXRlLmdvLmFwcGx5KCRzdGF0ZSwgc3RhdGUpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAkc3RhdGUuZ28oc3RhdGUpXG5cbiAgICAgIHN0YXRlUmV0dXJuOiAtPlxuICAgICAgICBpZiB0aGlzLnN0YXRlcz8ucmV0dXJuXG4gICAgICAgICAgdGhpcy5fZ29Ubyh0aGlzLnN0YXRlcy5yZXR1cm4pXG5cbiAgICAgIHN0YXRlVG9DcmVhdGVkOiAtPlxuICAgICAgICBpZiB0aGlzLnN0YXRlcz8uY3JlYXRlZFxuICAgICAgICAgIHRoaXMuX2dvVG8odGhpcy5zdGF0ZXMuY3JlYXRlZClcblxuICAgICAgc3RhdGVTaW1wbHlTYXZlZDogLT5cbiAgICAgICAgaWYgdGhpcy5zdGF0ZXM/LnNpbXBseVNhdmVkXG4gICAgICAgICAgdGhpcy5fZ29Ubyh0aGlzLnN0YXRlcy5zaW1wbHlTYXZlZClcblxuICAgICAgX3Nob3dTdWNjZXNzTWVzc2FnZTogKG1lc3NhZ2UsIHRpdGxlKS0+XG4gICAgICAgIGlmIHRoaXMuc2hvd1N1Y2Vlc3NNZXNzYWdlcyAhPSBmYWxzZVxuICAgICAgICAgIEZsYXNoTWVzc2FnZS5zdWNjZXNzKG1lc3NhZ2Ugb3IgdGhpcy5zdWNjZXNzU2F2ZWRNZXNzYWdlLCB0aXRsZSlcblxuICAgICAgX2NhbmNlbF9idG46IC0+XG4gICAgICAgIHRoaXMuc3RhdGVSZXR1cm4oKVxuXG4gICAgcmV0dXJuIEFkdmFuY2VkRm9ybU9wdGlvbnNcblxuICByZXR1cm5cbiIsIiMjIypcbiAgKiBAYXV0aG9yIFBldGVyIEtpY2Vua29cbiAgKiBAZmlsZSBTdGFuZGFyZCBmb3JtIHdpdGggYnV0dG9ucyBhbmQgYWRkaXRpb25hbCBhY3Rpb25zXG4jIyNcbm1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlICdzdW4uZm9ybS5zdGFuZGFyZC1mb3JtJywgW1xuICAnc3VuLmZvcm0uc3RhbmRhcmQtZm9ybS5mb3JtLW9wdGlvbnMnXG4gICdzdW4uZm9ybS5zdGFuZGFyZC1mb3JtLnNwYXRpYWwuc2ltcGxlLWlucHV0LWdyb3VwJ1xuXVxuLmRpcmVjdGl2ZSAnc3RhbmRhcnRGb3JtJywgLT5cbiAgLT4gdGhyb3cgbmV3IEVycm9yKFwiWW91IGFnYWluIG1pc3NwZWxsZWQgc3RhbmRhcmQgZm9ybVwiKVxubW9kdWxlLmRpcmVjdGl2ZSAnc3RhbmRhcmRGb3JtJywgKCRwYXJzZSwgRm9ybU9wdGlvbnMpLT5cbiAgIyMjKlxuICAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAgKiBAbmFtZSBzdGFuZGFyZEZvcm1cbiAgKiBAcmVzdHJpY3QgRUFcbiAgKlxuICAqIEBkZXNjcmlwdGlvblxuICAqIERpcmVjdGl2ZSB0byB3cmFwIHN0YW5kYXJkIGh0bWwgZm9ybS4gQmFzZWQgb24gc3VwcGxpZWQgZm9ybSBvcHRpb25zIGNyZWF0ZXMgYWN0aW9uIGJ1dHRvbnMgYW5kIGFsZXJ0IGJveFxuICAqXG4gICogQHBhcmFtIHtGb3JtT3B0aW9ucz19IG9wdGlvbnN8c3RhbmRhcmRGb3JtIChvciBjaGlsZCkgd2hpY2ggZGVmaW5lcyBiZWhhdmlvdXIuIERlZmF1bHQgaXMgRm9ybU9wdGlvbnMuXG4gICogQHBhcmFtIHtzdHJpbmc9fSBuZ01vZGVsIFdpbGwgYmUgc2V0IHRvIGZvcm1PcHRpb25zIHRob3VnaHQgYHNldE1vZGVsYCBtZXRob2RcbiAgKiBAcGFyYW0ge3N0cmluZz19IG5hbWUgSWYgbmFtZSBpcyBzcGVjaWZpZWQsIGZvcm0gY29udHJvbGxlciB3aWxsIGJlIHB1Ymxpc2hlZCB0byB0aGUgc2NvcGUsIHVuZGVyIHRoaXMgbmFtZVxuICAjIyNcblxuICByZXN0cmljdDogJ0VBJ1xuICBzY29wZTpcbiAgICBtb2RlbDogJz1uZ01vZGVsJ1xuICB0cmFuc2NsdWRlOiB0cnVlXG4gIHRlbXBsYXRlVXJsOiAnc3RhbmRhcmQtZm9ybS9zdGFuZGFyZC1mb3JtLnRwbC5odG1sJ1xuICBsaW5rOiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjb250cm9sbGVyKSAtPlxuICAgIG9wdGlvbk5hbWUgPSBhdHRyc1snc3RhbmRhcmRGb3JtJ10gb3IgYXR0cnNbJ29wdGlvbnMnXVxuICAgIHNjb3BlLm9wdGlvbnMgPSAkcGFyc2Uob3B0aW9uTmFtZSkoc2NvcGUuJHBhcmVudCkgb3IgbmV3IEZvcm1PcHRpb25zKClcblxuICAgIHNjb3BlLm9wdGlvbnMuc2V0Rm9ybShzY29wZS5pbm5lckZvcm0pXG5cbiAgICBpZiBzY29wZS5vcHRpb25zLnNldE1vZGVsXG4gICAgICBzY29wZS4kd2F0Y2ggJ21vZGVsJywgKG1vZGVsKS0+XG4gICAgICAgIHNjb3BlLm9wdGlvbnMuc2V0TW9kZWwobW9kZWwpIGlmIG1vZGVsXG5cbiAgICBpZiBhdHRycy5uYW1lXG4gICAgICBzY29wZS4kcGFyZW50W2F0dHJzLm5hbWVdID0gc2NvcGUuaW5uZXJGb3JtXG5cbiAgICBzY29wZS5nZXRCdXR0b25DbGFzcyA9IChidXR0b24pLT5cbiAgICAgIHJldHVybiBidXR0b24uY2xhc3Mgb3IgaWYgYnV0dG9uLmRlZmF1bHQgdGhlbiAnYnRuIGJ0bi1wcmltYXJ5JyBlbHNlICdidG4gYnRuLWRlZmF1bHQnXG5cbiIsImFuZ3VsYXIubW9kdWxlICdzdW4uZm9ybS5zaW1wbGUtaW5wdXQuZGF0ZScsIFtcbiAgJ3VpLmJvb3RzdHJhcC5kYXRlcGlja2VyJ1xuXVxuLmNvbnRyb2xsZXIgXCJTaW1wbGVJbnB1dERhdGVDb250cm9sbGVyXCIsICgkc2NvcGUsICRsb2NhbGUpLT5cbiAgJHNjb3BlLmZvcm1hdCA9ICRsb2NhbGUuREFURVRJTUVfRk9STUFUUy5tZWRpdW1EYXRlXG4gICRzY29wZS5vcGVuID0gKCRldmVudCktPlxuICAgICRldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgJGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cbiAgICAkc2NvcGUub3BlbmVkID0gdHJ1ZVxuIiwiIyMjKlxuICAqIEBhdXRob3IgUGV0ZXIgS2ljZW5rb1xuICAqIEBmaWxlIEV4dGVuZGVkIHNpbXBsZSBpbnB1dCAod2l0aCBwcmVwZW5kIGFuZCBhcHBlbmQgaWNvbilcbiMjI1xuYW5ndWxhci5tb2R1bGUoJ3N1bi5mb3JtLnN0YW5kYXJkLWZvcm0uc3BhdGlhbC5zaW1wbGUtaW5wdXQtZ3JvdXAnLCBbXSlcbi5jb250cm9sbGVyICdJbnB1dEdyb3VwQ29udHJvbGxlcicsICgkc2NvcGUsICRlbGVtZW50LCAkYXR0cnMsICR0cmFuc2NsdWRlLCAkdHJhbnNsYXRlLCAkY29tcGlsZSwgJGNvbnRyb2xsZXIpLT5cbiAgXy5leHRlbmQgdGhpcywgJGNvbnRyb2xsZXIoJ1NpbXBsZUlucHV0Q29udHJvbGxlcicsIHskc2NvcGUsICRlbGVtZW50LCAkYXR0cnMsICR0cmFuc2NsdWRlfSlcbiAgdGhpcy5fcHJlQ29tcGlsZSA9IChpbnB1dCktPlxuICAgIHJlcyA9ICQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykpLmFkZENsYXNzKCdpbnB1dC1ncm91cCcpXG4gICAgcHJlcGVuZCA9ICQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpKS5hZGRDbGFzcygnaW5wdXQtZ3JvdXAtYWRkb24nKVxuICAgIGlmICRhdHRycy5wcmVwZW5kSWNvblxuICAgICAgcHJlcGVuZC5hcHBlbmQgJChkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpJykpLmFkZENsYXNzKCRhdHRycy5wcmVwZW5kSWNvbilcbiAgICAgIHJlcy5hcHBlbmQocHJlcGVuZClcbiAgICByZXMuYXBwZW5kKGlucHV0KVxuICAgIHJldHVybiByZXNcbiAgcmV0dXJuIHRoaXNcbi5kaXJlY3RpdmUgJ2lucHV0R3JvdXAnLCAoc2ltcGxlSW5wdXREaXJlY3RpdmUpLT5cbiAgYXNzZXJ0IHNpbXBsZUlucHV0RGlyZWN0aXZlLmxlbmd0aCA9PSAxLCAnTW9yZSB0aGFuIG9uY2Ugc2ltcGxlSW5wdXREaXJlY3RpdmUgZm91bmQhJ1xuICBfLmV4dGVuZCB7fSwgc2ltcGxlSW5wdXREaXJlY3RpdmVbMF0sXG4gICAgY29udHJvbGxlcjogJ0lucHV0R3JvdXBDb250cm9sbGVyJ1xuXG5cblxuXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=