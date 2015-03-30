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

  angular.module('sun.form.simple-input', ['pascalprecht.translate', 'ui.router', 'ngMessages', 'sun.form.form-group']).provider('SimpleInputOptions', function() {
    var options;
    options = this;
    options.pathPrefix = 'simple-input/templates/';
    options.inputs = {
      select: {
        templateUrl: 'select.tpl.html'
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
  }).provider('AdvancedFormOptions', function() {
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
      link: function(scope, element, attrs) {
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
  angular.module('sun.form.simple-input.date', ['ui.bootstrap.datepicker']).config("SimpleInputOptions", function(SimpleInputOptions) {
    return SimpleInputOptions.inputs.date = {
      date: {
        controller: 'SimpleInputDateController',
        templateUrl: 'date.tpl.html'
      }
    };
  }).controller("SimpleInputDateController", function($scope, $locale) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN1bi1mb3JtLmNvZmZlZSIsImZvcm0tZ3JvdXAvZm9ybS1ncm91cC5jb2ZmZWUiLCJzaW1wbGUtaW5wdXQvc2ltcGxlLWlucHV0LmNvZmZlZSIsInN0YW5kYXJkLWZvcm0vZm9ybS1vcHRpb25zLmNvZmZlZSIsInN0YW5kYXJkLWZvcm0vc3RhbmRhcmQtZm9ybS5jb2ZmZWUiLCJzaW1wbGUtaW5wdXQvdGVtcGxhdGVzL2RhdGUuY29mZmVlIiwic3RhbmRhcmQtZm9ybS9zcGF0aWFsL3NpbXBsZS1ncm91cC1pbnB1dC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxFQUFBLE9BQU8sQ0FBQyxNQUFSLENBQWUsVUFBZixFQUEyQixDQUFDLHdCQUFELEVBQTBCLHdCQUExQixFQUFvRCx1QkFBcEQsQ0FBM0IsQ0FBQSxDQUFBOztBQUFBLEVBRUEsT0FBTyxDQUFDLE1BQVIsQ0FBZSxlQUFmLEVBQWdDLENBQUMsVUFBRCxDQUFoQyxDQUZBLENBQUE7QUFBQTs7O0FDQUE7QUFBQSxNQUFBLE1BQUE7O0FBQUEsRUFBQSxNQUFBLEdBQVMsT0FBTyxDQUFDLE1BQVIsQ0FBZSxxQkFBZixFQUFzQyxFQUF0QyxDQUNULENBQUMsU0FEUSxDQUNFLGlCQURGLEVBQ3FCLFNBQUEsR0FBQTtXQUM1QjtBQUFBLE1BQUEsVUFBQSxFQUFZLFNBQUMsTUFBRCxFQUFTLE1BQVQsR0FBQTtBQUNWLFFBQUEsSUFBQyxDQUFBLGNBQUQsR0FBa0IsQ0FBQyxNQUFNLENBQUMsY0FBUCxJQUF5QixHQUExQixDQUE4QixDQUFDLEtBQS9CLENBQXFDLEdBQXJDLENBQXlDLENBQUMsR0FBMUMsQ0FBOEMsU0FBQyxDQUFELEdBQUE7aUJBQU0sUUFBQSxDQUFTLENBQVQsRUFBTjtRQUFBLENBQTlDLENBQWxCLENBQUE7QUFDQSxRQUFBLElBQUcsSUFBQyxDQUFBLGNBQWMsQ0FBQyxNQUFoQixLQUEwQixDQUE3QjtpQkFDRSxJQUFDLENBQUEsY0FBZSxDQUFBLENBQUEs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V0FBTCxHQUFtQixTQUFDLEtBQUQsR0FBQTtBQUNqQixVQUFBLFlBQUE7QUFBQSxNQUFBLEdBQUEsR0FBTSxDQUFBLENBQUUsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBRixDQUFnQyxDQUFDLFFBQWpDLENBQTBDLGFBQTFDLENBQU4sQ0FBQTtBQUFBLE1BQ0EsT0FBQSxHQUFVLENBQUEsQ0FBRSxRQUFRLENBQUMsYUFBVCxDQUF1QixNQUF2QixDQUFGLENBQWlDLENBQUMsUUFBbEMsQ0FBMkMsbUJBQTNDLENBRFYsQ0FBQTtBQUVBLE1BQUEsSUFBRyxNQUFNLENBQUMsV0FBVjtBQUNFLFFBQUEsT0FBTyxDQUFDLE1BQVIsQ0FBZSxDQUFBLENBQUUsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsR0FBdkIsQ0FBRixDQUE4QixDQUFDLFFBQS9CLENBQXdDLE1BQU0sQ0FBQyxXQUEvQyxDQUFmLENBQUEsQ0FBQTtBQUFBLFFBQ0EsR0FBRyxDQUFDLE1BQUosQ0FBVyxPQUFYLENBREEsQ0FERjtPQUZBO0FBQUEsTUFLQSxHQUFHLENBQUMsTUFBSixDQUFXLEtBQVgsQ0FMQSxDQUFBO0FBTUEsYUFBTyxHQUFQLENBUGlCO0lBQUEsQ0FEbkIsQ0FBQTtBQVNBLFdBQU8sSUFBUCxDQVZrQztFQUFBLENBRHBDLENBWUEsQ0FBQyxTQVpELENBWVcsWUFaWCxFQVl5QixTQUFDLG9CQUFELEdBQUE7QUFDdkIsSUFBQSxNQUFBLENBQU8sb0JBQW9CLENBQUMsTUFBckIsS0FBK0IsQ0FBdEMsRUFBeUMsNENBQXpDLENBQUEsQ0FBQTtXQUNBLENBQUMsQ0FBQyxNQUFGLENBQVMsRUFBVCxFQUFhLG9CQUFxQixDQUFBLENBQUEsQ0FBbEMsRUFDRTtBQUFBLE1BQUEsVUFBQSxFQUFZLHNCQUFaO0tBREYsRUFGdUI7RUFBQSxDQVp6QixDQUpBLENBQUE7QUFBQSIsImZpbGUiOiJzdW4tZm9ybS5qcyIsInNvdXJjZXNDb250ZW50IjpbImFuZ3VsYXIubW9kdWxlICdzdW4uZm9ybScsIFsncGFzY2FscHJlY2h0LnRyYW5zbGF0ZScsJ3N1bi5mb3JtLnN0YW5kYXJkLWZvcm0nLCAnc3VuLmZvcm0uc2ltcGxlLWlucHV0J11cclxuXHJcbmFuZ3VsYXIubW9kdWxlICdzdW4uZm9ybS50cGxzJywgWydzdW4uZm9ybSddIiwibW9kdWxlID0gYW5ndWxhci5tb2R1bGUgJ3N1bi5mb3JtLmZvcm0tZ3JvdXAnLCBbXVxyXG4uZGlyZWN0aXZlIFwiZm9ybUdyb3VwQ29uZmlnXCIsIC0+XHJcbiAgY29udHJvbGxlcjogKCRzY29wZSwgJGF0dHJzKS0+XHJcbiAgICBAZm9ybUdyb3VwV2lkdGggPSAoJGF0dHJzLmZvcm1Hcm91cFdpZHRoIG9yIFwiM1wiKS5zcGxpdChcIjpcIikubWFwIChpKS0+IHBhcnNlSW50KGkpXHJcbiAgICBpZiBAZm9ybUdyb3VwV2lkdGgubGVuZ3RoID09IDFcclxuICAgICAgQGZvcm1Hcm91cFdpZHRoWzFdID0gMTIgLSBAZm9ybUdyb3VwV2lkdGhbMF1cclxuIyMjXHJcbiAgaXQgc2VlbXMgZGVwcmVjYXRlZFxyXG4jIyNcclxubW9kdWxlLmRpcmVjdGl2ZSBcImZvcm1Hcm91cFwiLCAoJHRyYW5zbGF0ZSktPlxyXG4gIHJlc3RyaWN0ICAgOiBcIkFFXCJcclxuICB0cmFuc2NsdWRlIDogdHJ1ZVxyXG4gIHJlcXVpcmUgICAgOiAnXj9mb3JtR3JvdXBDb25maWcnXHJcbiAgdGVtcGxhdGVVcmw6ICdmb3JtLWdyb3VwL2Zvcm0tZ3JvdXAudHBsLmh0bWwnXHJcbiAgbGluayAgICAgICA6IChzY29wZSwgZWxlbWVudCwgYXR0cnMsIGN0cmwpLT5cclxuICAgIGVsZW1lbnQuYWRkQ2xhc3MoJ2Zvcm0tZ3JvdXAnKVxyXG4gICAgbGFiZWxXaWR0aCA9IGN0cmw/LmZvcm1Hcm91cFdpZHRoWzBdIG9yIDNcclxuICAgIGVsZW1lbnRXaWR0aCA9IGN0cmw/LmZvcm1Hcm91cFdpZHRoWzFdIG9yIDlcclxuICAgIGxhYmVsID0gZWxlbWVudC5jaGlsZHJlbignbGFiZWwnKS5hZGRDbGFzcyhcImNvbC1zbS0je2xhYmVsV2lkdGh9XCIpXHJcbiAgICBlbGVtZW50LmNoaWxkcmVuKCdkaXYnKS5hZGRDbGFzcyhcImNvbC1zbS0je2VsZW1lbnRXaWR0aH1cIilcclxuICAgIGlmIGF0dHJzLmxhYmVsXHJcbiAgICAgICR0cmFuc2xhdGUoYXR0cnMubGFiZWwpLnRoZW4gKHRyKS0+IGxhYmVsLnRleHQodHIpXHJcblxyXG4iLCIjIyMqXHJcbiAgKiBAYXV0aG9yIFBldGVyIEtpY2Vua29cclxuICAqIEBmaWxlIFdyYXBwZXIgZm9yIGlucHV0c1xyXG4gICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgZm9yIGRpZmZlcmVudCBpbnB1dCBlbGVtZW50cyB0byB1c2Ugd2l0aCBzdGFuZGFyZC1mb3JtXHJcbiMjI1xyXG5hbmd1bGFyLm1vZHVsZSAnc3VuLmZvcm0uc2ltcGxlLWlucHV0JywgW1xyXG4gICdwYXNjYWxwcmVjaHQudHJhbnNsYXRlJ1xyXG4gICd1aS5yb3V0ZXInXHJcbiAgJ25nTWVzc2FnZXMnXHJcbiAgJ3N1bi5mb3JtLmZvcm0tZ3JvdXAnXHJcbl1cclxuLnByb3ZpZGVyICdTaW1wbGVJbnB1dE9wdGlvbnMnLCAtPlxyXG4gIG9wdGlvbnMgPSB0aGlzXHJcbiAgb3B0aW9ucy5wYXRoUHJlZml4ID0gJ3NpbXBsZS1pbnB1dC90ZW1wbGF0ZXMvJ1xyXG4gIG9wdGlvbnMuaW5wdXRzID1cclxuICAgIHNlbGVjdCAgOlxyXG4gICAgICB0ZW1wbGF0ZVVybDogJ3NlbGVjdC50cGwuaHRtbCdcclxuICAgIHRleHRhcmVhOlxyXG4gICAgICB0ZW1wbGF0ZVVybDogJ3RleHRhcmVhLnRwbC5odG1sJ1xyXG4gICAgY2hlY2tib3g6XHJcbiAgICAgIHRlbXBsYXRlVXJsOiAnc3dpdGNoLnRwbC5odG1sJ1xyXG4gICAgJGRlZmF1bHQ6XHJcbiAgICAgIHRlbXBsYXRlVXJsOiAnaW5wdXQudHBsLmh0bWwnXHJcbiAgIyBHZXQgZGVmYXVsdCBjb25maWcgZm9yIGB0eXBlYFxyXG4gIG9wdGlvbnMuZ2V0RGVmYXVsdCA9ICh0eXBlKS0+XHJcbiAgICByZXR1cm4gb3B0aW9ucy5pbnB1dHMuJGRlZmF1bHRcclxuXHJcbiAgdGhpcy4kZ2V0ID0gLT5cclxuICAgIGlmIG9wdGlvbnMucGF0aFByZWZpeFxyXG4gICAgICBmb3Igb3duIHR5cGUsb3B0IG9mIG9wdGlvbnMuaW5wdXRzXHJcbiAgICAgICAgaWYgb3B0aW9ucy5pbnB1dHNbdHlwZV0udGVtcGxhdGVVcmxcclxuICAgICAgICAgIG9wdGlvbnMuaW5wdXRzW3R5cGVdLnRlbXBsYXRlVXJsID0gb3B0aW9ucy5wYXRoUHJlZml4ICsgb3B0aW9ucy5pbnB1dHNbdHlwZV0udGVtcGxhdGVVcmxcclxuICAgIHJldHVybiBvcHRpb25zXHJcblxyXG4gIHJldHVyblxyXG4uY29udHJvbGxlciAnU2ltcGxlSW5wdXRDb250cm9sbGVyJywgKCRzY29wZSwgJGVsZW1lbnQsICR0cmFuc2NsdWRlLCAkYXR0cnMsICRxLCAkdHJhbnNsYXRlLCAkY29tcGlsZSwgJGNvbnRyb2xsZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU2ltcGxlSW5wdXRPcHRpb25zLCAkdGVtcGxhdGVGYWN0b3J5KS0+XHJcbiAgY2xhc3MgU2ltcGxlSW5wdXRDb250cm9sbGVyXHJcblxyXG4gICAgaW5pdDogKGZvcm1Db250cm9sbGVyLCBmb3JtR3JvdXBDb250cm9sbGVyKS0+XHJcbiAgICAgIEBmb3JtQ29udHJvbGxlciA9IGZvcm1Db250cm9sbGVyXHJcbiAgICAgIEBmb3JtR3JvdXBDb25maWcgPSBmb3JtR3JvdXBDb250cm9sbGVyXHJcbiAgICAgIEBoaWRlTGFiZWwgPSAkYXR0cnMuaGlkZUxhYmVsIGluIFsndHJ1ZScsICcxJywgJ2hpZGUtbGFiZWwnLCAnJ11cclxuICAgICAgQGxhYmVsV2lkdGggPSBwYXJzZUludCgkYXR0cnMubGFiZWxXaWR0aCkgb3IgQGZvcm1Hcm91cENvbmZpZz8uZm9ybUdyb3VwV2lkdGhbMF0gb3IgM1xyXG4gICAgICBAZWxlbWVudFdpZHRoID0gcGFyc2VJbnQoJGF0dHJzLmVsZW1lbnRXaWR0aCkgb3IgQGZvcm1Hcm91cENvbmZpZz8uZm9ybUdyb3VwV2lkdGhbMV0gb3IgOVxyXG4gICAgICBAZWxlbWVudFdpZHRoICs9IEBsYWJlbFdpZHRoIGlmIEBoaWRlTGFiZWwgYW5kIG5vdCAkYXR0cnMuZWxlbWVudFdpZHRoXHJcblxyXG4gICAgICBAdHlwZSA9ICRhdHRycy50eXBlIG9yICd0ZXh0J1xyXG4gICAgICBAbmFtZSA9IHRoaXMuX2dldE5hbWUoKVxyXG5cclxuICAgICAgQGZvcm1Hcm91cCA9ICRlbGVtZW50LmNoaWxkcmVuKCdkaXYnKVxyXG4gICAgICBAaW5wdXRHcm91cCA9IEBmb3JtR3JvdXAuY2hpbGRyZW4oJ2RpdicpXHJcbiAgICAgIEBkZXN0aW5hdGlvbkVsZW1lbnQgPSAkZWxlbWVudC5maW5kKCdbaW5uZXItY29udGVudF0nKVxyXG5cclxuICAgICAgQGxhYmVsID0gQGZvcm1Hcm91cC5jaGlsZHJlbignbGFiZWwnKVxyXG5cclxuICAgIHJlbmRlcjogLT5cclxuICAgICAgdGhpcy5fcHJvY2Vzc0V4aXN0aW5nQ29udGVudCgpXHJcbiAgICAgIC50aGVuID0+XHJcbiAgICAgICAgdGhpcy5faW5zZXJ0TWVzc2FnZXMoKVxyXG4gICAgICAgIHRoaXMuX2FkZENsYXNzZXMoKVxyXG4gICAgICAgICRzY29wZS5pbnB1dEN0cmwgPSB0aGlzLl9nZXRJbnB1dENvbnRyb2xsZXIoKVxyXG4gICAgICAgIF8uZXh0ZW5kKCRzY29wZSwgdGhpcy5fZ2V0U2NvcGVWYXJpYWJsZXMoKSlcclxuXHJcbiAgICBfYWRkQ2xhc3NlczogLT5cclxuICAgICAgY2xzID0gaWYgdGhpcy5oaWRlTGFiZWwgdGhlbiAgJ3NyLW9ubHknIGVsc2UgXCJjb2wtc20tI3t0aGlzLmxhYmVsV2lkdGh9XCJcclxuICAgICAgdGhpcy5sYWJlbC5hZGRDbGFzcyhjbHMpXHJcbiAgICAgIHRoaXMuaW5wdXRHcm91cC5hZGRDbGFzcyhcImNvbC1zbS0je3RoaXMuZWxlbWVudFdpZHRofVwiKVxyXG5cclxuICAgIF9nZXRJbnB1dENvbnRyb2xsZXI6IC0+XHJcbiAgICAgIGlmIHRoaXMubmFtZSBhbmQgdGhpcy5mb3JtQ29udHJvbGxlclxyXG4gICAgICAgIHRoaXMuZm9ybUNvbnRyb2xsZXJbdGhpcy5uYW1lXVxyXG4gICAgICBlbHNlXHJcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxyXG4gICAgX2dldFNjb3BlVmFyaWFibGVzIDogLT5cclxuICAgICAgdmFycyA9IHt9XHJcbiAgICAgIHZhcnMubmFtZSA9IEBuYW1lXHJcbiAgICAgIHZhcnMudHlwZSA9IEB0eXBlXHJcbiAgICAgIHZhcnMubGFiZWwgPSAkc2NvcGUubGFiZWxcclxuICAgICAgdmFycy5pZCA9IFwiI3tAbmFtZX0taWRcIiBpZiBAbmFtZVxyXG4gICAgICByZXR1cm4gdmFyc1xyXG5cclxuICAgIF9leHRyYWN0TWVzc2FnZXM6IChlbGVtZW50cyktPlxyXG4gICAgICByZXMgPSBbXVxyXG4gICAgICB0aGlzLl9fbWVzc2FnZXMgPSBtZXNzYWdlcyA9IFtdXHJcbiAgICAgIGVsZW1lbnRzLmVhY2ggKGksIGUpLT5cclxuICAgICAgICBpZiBlLnRhZ05hbWU/LnRvTG93ZXJDYXNlKCkgPT0gXCJtZXNzYWdlXCIgIyBtZXNzYWdlIHRhZ1xyXG4gICAgICAgICAgbWVzc2FnZXMucHVzaFxyXG4gICAgICAgICAgICB3aGVuICAgOiBlLmF0dHJpYnV0ZXMud2hlbi52YWx1ZVxyXG4gICAgICAgICAgICBtZXNzYWdlOiBlLmlubmVySFRNTFxyXG4gICAgICAgICAgICBlICAgICAgOiBlXHJcbiAgICAgICAgICByZXR1cm5cclxuICAgICAgICBlbHNlIGlmIGUubm9kZVR5cGUgPT0gZS5URVhUX05PREUgYW5kIG5vdCBlLnRleHRDb250ZW50LnRyaW0oKSAgIyBlbXB0eSB0ZXh0XHJcbiAgICAgICAgICByZXR1cm5cclxuICAgICAgICByZXMucHVzaChlKVxyXG4gICAgICB0aGlzLl9fbWVzc2FnZXNFeHRyYWN0ZWQgPSB0cnVlXHJcbiAgICAgIHJldHVybiByZXNcclxuXHJcbiAgICBfcHJvY2Vzc0V4aXN0aW5nQ29udGVudDogLT5cclxuICAgICAgZGVmZXJyZWQgPSAkcS5kZWZlcigpXHJcbiAgICAgICR0cmFuc2NsdWRlIChpbm5lckVsZW1lbnRzLCBzY29wZSkgPT5cclxuICAgICAgICBpbm5lckVsZW1lbnRzID0gdGhpcy5fZXh0cmFjdE1lc3NhZ2VzKGlubmVyRWxlbWVudHMpXHJcblxyXG4gICAgICAgIHRoaXMuX3VzZUV4aXN0aW5nID0gaW5uZXJFbGVtZW50cy5sZW5ndGggIT0gMFxyXG5cclxuICAgICAgICBpZiB0aGlzLl91c2VFeGlzdGluZ1xyXG4gICAgICAgICAgcmVzID0gdGhpcy5kZXN0aW5hdGlvbkVsZW1lbnQuaHRtbChpbm5lckVsZW1lbnRzKVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgIHJlcyA9IHRoaXMuX3Byb2Nlc3NTdGFuZGFyZElucHV0KHNjb3BlKVxyXG5cclxuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlcylcclxuXHJcbiAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlXHJcblxyXG4gICAgX3Byb2Nlc3NTdGFuZGFyZElucHV0OiAoc2NvcGUpLT5cclxuICAgICAgb3B0aW9ucyA9IFNpbXBsZUlucHV0T3B0aW9ucy5pbnB1dHNbdGhpcy50eXBlXSBvciBTaW1wbGVJbnB1dE9wdGlvbnMuZ2V0RGVmYXVsdCh0aGlzLnR5cGUpXHJcbiAgICAgICR0ZW1wbGF0ZUZhY3RvcnkuZnJvbUNvbmZpZyhvcHRpb25zKVxyXG4gICAgICAudGhlbiAodGVtcGxhdGVUZXh0KT0+XHJcbiAgICAgICAgXy5leHRlbmQoc2NvcGUsIHRoaXMuX2dldFNjb3BlVmFyaWFibGVzKCkpXHJcblxyXG4gICAgICAgIHRlbXBsYXRlID0gYW5ndWxhci5lbGVtZW50KHRlbXBsYXRlVGV4dClcclxuICAgICAgICBpbnB1dCA9IHRlbXBsYXRlLmNsb3Nlc3QoXCJbbmctbW9kZWxdXCIpLmFkZCh0ZW1wbGF0ZS5maW5kKFwiW25nLW1vZGVsXVwiKSlcclxuXHJcbiAgICAgICAgdGhpcy5fdXBkYXRlTmFtZShpbnB1dCwgdGhpcy5fZ2V0TmFtZSgpKVxyXG4gICAgICAgIHRoaXMuX2F0dGFjaElucHV0QXR0cmlidXRlcygkZWxlbWVudFswXS5hdHRyaWJ1dGVzLCBpbnB1dClcclxuICAgICAgICB0aGlzLl90cmF2ZXJzZU5nTW9kZWwoaW5wdXQsICRhdHRycy5uZ01vZGVsKVxyXG5cclxuICAgICAgICB0ZW1wbGF0ZSA9IHRoaXMuX3ByZUNvbXBpbGUodGVtcGxhdGUpXHJcblxyXG4gICAgICAgIGlmIG9wdGlvbnMuY29udHJvbGxlclxyXG4gICAgICAgICAgY29udHJvbGxlciA9ICRjb250cm9sbGVyKG9wdGlvbnMuY29udHJvbGxlciwgeyRzY29wZTogc2NvcGUsIG9wdGlvbnN9KVxyXG4gICAgICAgICAgaWYgb3B0aW9ucy5jb250cm9sbGVyQXNcclxuICAgICAgICAgICAgc2NvcGVbb3B0aW9ucy5jb250cm9sbGVyQXNdID0gY29udHJvbGxlclxyXG5cclxuICAgICAgICB0aGlzLmRlc3RpbmF0aW9uRWxlbWVudC5odG1sKHRlbXBsYXRlKVxyXG5cclxuXHJcbiAgICAgICAgJGNvbXBpbGUodGhpcy5kZXN0aW5hdGlvbkVsZW1lbnQuY29udGVudHMoKSkoc2NvcGUpXHJcblxyXG4gICAgICAgIHNjb3BlLmlucHV0Q3RybCA9IHRoaXMuX2dldElucHV0Q29udHJvbGxlcigpXHJcblxyXG4gICAgX2F0dGFjaElucHV0QXR0cmlidXRlczogKGF0dHJzLCB0byktPlxyXG4gICAgICBmb3IgYXR0ciBpbiBhdHRyc1xyXG4gICAgICAgIGlmIGF0dHIubmFtZS5pbmRleE9mKCdpbi0nKSA9PSAwXHJcbiAgICAgICAgICBrID0gYXR0ci5uYW1lLnNsaWNlKDMpXHJcbiAgICAgICAgICB2ID0gYXR0ci52YWx1ZVxyXG4gICAgICAgICAgdG8uYXR0cihrLCB2KVxyXG5cclxuICAgIF9nZXROYW1lOiAtPlxyXG4gICAgICBpZiB0aGlzLl91c2VFeGlzdGluZ1xyXG4gICAgICAgIHJldHVybiAkYXR0cnMubmFtZVxyXG4gICAgICBlbHNlXHJcbiAgICAgICAgcmV0dXJuICRhdHRycy5uYW1lIG9yICRhdHRycy5uZ01vZGVsXHJcblxyXG4gICAgX3VwZGF0ZU5hbWU6IChlbGVtZW50LCBuYW1lKS0+XHJcbiAgICAgIGVsZW1lbnQuYXR0cignbmFtZScsIG5hbWUpXHJcblxyXG4gICAgX3ByZUNvbXBpbGU6IChpbnB1dCktPlxyXG4gICAgICByZXR1cm4gaW5wdXRcclxuXHJcbiAgICBfZ2V0TWVzc2FnZXM6IC0+XHJcbiAgICAgIGlmIG5vdCB0aGlzLl9fbWVzc2FnZXNFeHRyYWN0ZWRcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJtZXNzYWdlcyB3ZXJlIG5vdCBleHRyYWN0ZWQuIFdyb25nIGZ1bmN0aW9uIG9yZGVyIGNhbGxcIilcclxuICAgICAgcmV0dXJuIHRoaXMuX19tZXNzYWdlc1xyXG5cclxuICAgIF9pbnNlcnRNZXNzYWdlczogLT5cclxuICAgICAgbXNncyA9ICRlbGVtZW50LmZpbmQoJ1tuZy1tZXNzYWdlc10nKVxyXG4gICAgICBmb3IgbSBpbiB0aGlzLl9nZXRNZXNzYWdlcygpIHx8IFtdXHJcbiAgICAgICAgbXNncy5hcHBlbmQobS5lKVxyXG4gICAgICAgICRjb21waWxlKG0uZSkoJHNjb3BlKVxyXG5cclxuICAgIF90cmF2ZXJzZU5nTW9kZWw6IChpbnB1dCwgbmFtZSktPlxyXG4gICAgICBpbnB1dC5hdHRyKCduZy1tb2RlbCcsIG5hbWUpXHJcblxyXG4gIF8uZXh0ZW5kKHRoaXMsIFNpbXBsZUlucHV0Q29udHJvbGxlci5wcm90b3R5cGUpXHJcbiAgcmV0dXJuXHJcbi5kaXJlY3RpdmUgXCJzaW1wbGVJbnB1dFwiLCAtPlxyXG4gICMjIypcclxuICAgICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gICAgKiBAbmFtZSBzaW1wbGVJbnB1dFxyXG4gICAgKiBAcmVzdHJpY3QgRVxyXG4gICAgKlxyXG4gICAgKiBAZGVzY3JpcHRpb25cclxuICAgICogRWxlbWVudCB0byBzaW1wbGlmeSB1c2FnZSBvZiBzdGFuZGFyZCBodG1sIGlucHV0IGFuZCBhbiBhIHdyYXBwZXIgZm9yIGN1c3RvbSBpbnB1dHMuXHJcbiAgICAqXHJcbiAgICAqIFVzaW5nIGRpcmVjdGl2ZSBtZXNzYWdlIHdpdGggYXR0cmlidXRlIGB3aGVuYCBjYW4gYmUgdXNlZCB0byBleHRlbmQgZXJyb3IgbWVzc2FnZXMuXHJcbiAgICAqIGBgYGh0bWxcclxuICAgICogICA8bWVzc2FnZSB3aGVuPVwidmFsaWRhdG9yXCI+U29tZSBlcnJvciBtZXNzYWdlPC9tZXNzYWdlPlxyXG4gICAgKiBgYGBcclxuICAgICpcclxuICAgICogRGlyZWN0aXZlIGNhbiBiZSB1c2VyIGluIHR3byBkaWZmZXJlbnQgd2F5cy4gQXMgc3RhbmRhbG9uZSBhbmQgYXMgYSB3cmFwcGVyLlxyXG4gICAgKiBJbiBhIHN0YW5kYWxvbmUgbW9kZSBgbmdNb2RlbGAgaXMgcmVxdWlyZWQuIEZvciBhIGNvcnJlY3Qgd29yayBpbiBhIHdyYXBwZXIgbW9kZSBzYW1lIHZhbHVlIG9mIGF0dHJpYnV0ZSBgbmFtZWBcclxuICAgICogYW5kIGZvcm0gZWxlbWVudCBpcyByZXF1aXJlZCBmb3IgY29ycmVjdCB3b3JraW5nXHJcbiAgICAqXHJcbiAgICAqIEBleGFtcGxlXHJcbiAgICAqIFNpbXBsZSB3b3JrIGluIGEgc3RhbmRhbG9uZSBtb2RlXHJcbiAgICA8ZXhhbXBsZT5cclxuICAgICAgPGZpbGUgbmFtZT1cImluZGV4Lmh0bWxcIj5cclxuICAgICAgICA8Zm9ybT5cclxuICAgICAgICAgIDxzaW1wbGUtaW5wdXQgbGFiZWw9XCJUZXh0XCIgbmctbW9kZWw9XCJtb2RlbC52YWx1ZVwiPjwvc2ltcGxlLWlucHV0PlxyXG4gICAgICAgIDwvZm9ybT5cclxuICAgICAgPC9maWxlPlxyXG4gICAgPC9leGFtcGxlPlxyXG4gICAgKlxyXG4gICAgKiBAZXhhbXBsZVxyXG4gICAgKiBXb3JrIGluIGEgc3RhbmRhbG9uZSB3b3JrIHdpdGggY3VzdG9tIG1lc3NhZ2VzIGFuZCBjdXN0b20gdmFsaWRhdG9yIG1hdGNoZXNcclxuICAgIDxleGFtcGxlPlxyXG4gICAgICA8ZmlsZSBuYW1lPVwiaW5kZXguaHRtbFwiPlxyXG4gICAgICAgIDxmb3JtPlxyXG4gICAgICAgICAgPHNpbXBsZS1pbnB1dCBsYWJlbD1cIlBhc3N3b3JkIHJlcGVhdFwiIG5nLW1vZGVsPVwibW9kZWwucGFzc3dvcmRSZXBlYXRcIiBpbi1yZXF1aXJlZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbi1tYXRjaGVzPVwibW9kZWwucGFzc3dvcmRcIj5cclxuICAgICAgICAgICAgIDxtZXNzYWdlIHdoZW49XCJtYXRjaGVzXCI+e3sgJ1Bhc3N3b3JkcyBkb2Vzbid0IG1hdGNoJyB8IHRyYW5zbGF0ZSB9fTwvbWVzc2FnZT5cclxuICAgICAgICAgIDwvc2ltcGxlLWlucHV0PlxyXG4gICAgICAgIDwvZm9ybT5cclxuICAgICAgPC9maWxlPlxyXG4gICAgPC9leGFtcGxlPlxyXG4gICAgKlxyXG4gICAgKiBAZXhhbXBsZVxyXG4gICAgKiBFeGFtcGxlIG9mIHdvcmsgYXMgYSB3cmFwcGVyIGZvciB1aS1zZWxlY3QuXHJcbiAgICA8ZXhhbXBsZT5cclxuICAgICAgPGZpbGUgbmFtZT1cImluZGV4Lmh0bWxcIj5cclxuICAgICAgICA8Zm9ybT5cclxuICAgICAgICAgIDxzaW1wbGUtaW5wdXQgbGFiZWw9XCJTb21lIHNlbGVjdCBvZiBwZXJzb25cIiBuYW1lPVwicGVyc29uXCI+XHJcbiAgICAgICAgICAgIDx1aS1zZWxlY3QgbmctbW9kZWw9XCJwZXJzb24uc2VsZWN0ZWRcIiBuYW1lPVwicGVyc29uXCI+XHJcbiAgICAgICAgICAgICAgPHVpLXNlbGVjdC1tYXRjaCBwbGFjZWhvbGRlcj1cIlNlbGVjdCBhIHBlcnNvbiBpbiB0aGUgbGlzdCBvciBzZWFyY2ggaGlzIG5hbWUvYWdlLi4uXCI+XHJcbiAgICAgICAgICAgICAgICB7eyRzZWxlY3Quc2VsZWN0ZWQubmFtZX19XHJcbiAgICAgICAgICAgICAgPC91aS1zZWxlY3QtbWF0Y2g+XHJcbiAgICAgICAgICAgICAgPHVpLXNlbGVjdC1jaG9pY2VzIHJlcGVhdD1cInBlcnNvbiBpbiBwZW9wbGUgfCBwcm9wc0ZpbHRlcjoge25hbWU6ICRzZWxlY3Quc2VhcmNoLCBhZ2U6ICRzZWxlY3Quc2VhcmNofVwiPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBuZy1iaW5kLWh0bWw9XCJwZXJzb24ubmFtZSB8IGhpZ2hsaWdodDogJHNlbGVjdC5zZWFyY2hcIj48L2Rpdj5cclxuICAgICAgICAgICAgICA8L3VpLXNlbGVjdC1jaG9pY2VzPlxyXG4gICAgICAgICAgICA8L3VpLXNlbGVjdD5cclxuICAgICAgICAgIDwvc2ltcGxlLWlucHV0PlxyXG4gICAgICAgIDwvZm9ybT5cclxuICAgICAgPC9maWxlPlxyXG4gICAgPC9leGFtcGxlPlxyXG4gICAgKlxyXG5cclxuICAgICogQHBhcmFtIHtzdHJpbmc9fSBsYWJlbCBMYWJlbCBmb3IgdGhlIGlucHV0LCBhbHNvIHVzZWQgYXMgYSBwbGFjZWhvbGRlclxyXG4gICAgKiBAcGFyYW0ge3N0cmluZz19IHR5cGUgb2YgdGhlIGlucHV0ICgndGV4dCcsICdudW1iZXInLCAnc2VsZWN0JywndGV4dGFyZWEnLCBldGMpLiBJZiB0ZW1wbGF0ZSBpcyByZWdpc3RlcmVkIGluXHJcbiAgICAqICAgICBgU2ltcGxlSW5wdXRPcHRpb25zYCB0ZW1wbGF0ZSB3aWxsIGJlIHVzZWQsIG9yIFNpbXBsZUlucHV0T3B0aW9ucy5nZXREZWZhdWx0IHdpbGwgYmUgaW52b2tlZCBpZiBzcGVjaWZpYyB0eXBlXHJcbiAgICAqICAgICB3aWxsIG5vdCBiZSBmb3VuZC5cclxuICAgICogQHBhcmFtIHtzdHJpbmc9fSBuZ01vZGVsICBBc3NpZ25hYmxlIGFuZ3VsYXIgZXhwcmVzc2lvbiB0byBkYXRhLWJpbmQgdG8uIERvIG5vdCB1c2UgJ3NpbXBsZScgcmVmZmVyZW5jZSB0byBtb2RlbCxcclxuICAgICogICAgIG9ubHkgd2l0aCBkb3RcclxuICAgICogQHBhcmFtIHtzdHJpbmc9fSBuYW1lIFByb3BlcnR5IG5hbWUgb2YgdGhlIGZvcm0gdW5kZXIgd2hpY2ggdGhlIGNvbnRyb2wgaXMgcHVibGlzaGVkLlxyXG4gICAgKiAgICAgSWYgbm8gbmFtZSBpcyBzcGVjaWZpZWQgdmFsdWUgaWYgYG5nTW9kZWxgIGF0dHJpYnV0ZSB3aWxsIGJlIHVzZWRcclxuICAgICogQHBhcmFtcyB7bnVtYmVyPX0gbGFiZWxXaWR0aCBXaWR0aCBvZiBsYWJlbCAoYm9vdHN0cmFwIDEtMTIpLlxyXG4gICAgKiAgICAgRGVmYXVsdCB2YWx1ZSBjYW4gYmUgdG9vayBmcm9tIGBmb3JtR3JvdXBDb25maWdgIG9yIDNcclxuICAgICogQHBhcmFtcyB7bnVtYmVyPX0gZWxlbWVudFdpZHRoIFdpZHRoIG9mIGlucHV0IGVsZW1lbnQgKGJvb3RzdHJhcCAxLTEyKS4gRGVmYXVsdCB2YWx1ZSBjYW4gYmUgdG9vayBmcm9tXHJcbiAgICAqICAgICBgZm9ybUdyb3VwQ29uZmlnYCA5XHJcbiAgICAqIEBwYXJhbSB7Ym9vbD19IGhpZGVMYWJlbCBJZiB0cnVlIGxhYmVsIHdpbGwgYmUgaGlkZGVuICBhbmQgd2lkdGggd2lsbCBiZSByZWNhbGN1bGF0ZWQgYWNjb3JkaW5nbHlcclxuICAgICogQHBhcmFtIHthbnk9fSBpbi0qIEFsbCBhdHRyaWJ1dGVzIHN0YXJ0aW5nIHdpdGggdGhlIHByZWZpeCBgaW4tYCB3aWxsIGJlIGNvcGllZCB0byB0aGUgaW5wdXQgZWxlbWVudCAod2l0aG91dFxyXG4gICAgKiAgICAgdGhlIHByZWZpeCkuIE9ubHkgZm9yIHN0YW5kYWxvbmVcclxuICAgICpcclxuICAgICogVG8gc2VlIG1vcmUgZXhhbXBsZXMgc2VlIHRoaXMgcHJvamVjdCBwYWdlc1xyXG4gICMjI1xyXG4gIHJlc3RyaWN0ICAgOiBcIkVcIlxyXG4gIHJlcXVpcmUgICAgOiBbJ3NpbXBsZUlucHV0JywgJ14/Zm9ybScsICdeP2Zvcm1Hcm91cENvbmZpZyddXHJcbiAgdHJhbnNjbHVkZSA6IHRydWVcclxuICBzY29wZSAgICAgIDpcclxuICAgIG5nTW9kZWwgOiAnPSdcclxuICAgIGxhYmVsICAgOiAnQCdcclxuICAgIGhlbHBUZXh0OiAnQCdcclxuICB0ZW1wbGF0ZVVybDogJ3NpbXBsZS1pbnB1dC9zaW1wbGUtaW5wdXQudHBsLmh0bWwnXHJcbiAgY29udHJvbGxlciA6ICdTaW1wbGVJbnB1dENvbnRyb2xsZXInXHJcbiAgbGluayAgICAgICA6IChzY29wZSwgZWxlbWVudCwgYXR0cnMsIFtzaW1wbGVJbnB1dEN0cmwsIGZvcm1DdHJsLCBmb3JtR3JvdXBDb25maWddKS0+XHJcbiAgICBzaW1wbGVJbnB1dEN0cmwuaW5pdChmb3JtQ3RybCwgZm9ybUdyb3VwQ29uZmlnKVxyXG4gICAgc2ltcGxlSW5wdXRDdHJsLnJlbmRlcigpXHJcbiAgICAudGhlbiAtPlxyXG4gICAgICBzY29wZS5zaG93RXJyb3IgPSAtPlxyXG4gICAgICAgIGN0cmwgPSBzY29wZS5pbnB1dEN0cmxcclxuICAgICAgICByZXR1cm4gKGN0cmwuJHNob3dWYWxpZGF0aW9uTXNnIHx8IGN0cmwuJHRvdWNoZWQpICYmIGN0cmwuJGludmFsaWQgaWYgY3RybFxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIjIyMqXHJcbiAgKiBAYXV0aG9yIFBldGVyIEtpY2Vua29cclxuICAqIEBmaWxlIENsYXNzZXMgd2hpY2ggZGVmaW5lIGJlaGF2aW91ciBvZiBzdGFuZGFyZCBmb3JtXHJcbiAgKiBAZGVzY3JpcHRpb25cclxuICAqIEZvcm0gb3B0aW9ucyBzaG91bGQgYmUgdXNlZCBmb3IgZ2VuZXJhbCBjYXNlcywgIEFkdmFuY2VkRm9ybU9wdGlvbnMgZm9yIG1hbmlwdWxhdGlvbiBvZiBvYmplY3RzXHJcbiAgKiAobW9kZWxzIGZyb20gc3VuLXJlc3QpXHJcbiMjI1xyXG4jIyMqXHJcbiAgKiBAdHlwZWRlZiBGb3JtT3B0aW9uQnV0dG9uXHJcbiAgKiBAcHJvcGVydHkge3N0cmluZ30gbmFtZSBOYW1lIG9mIHRoZSBidXR0b25cclxuICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBsYWJlbCBMYWJlbCBvZiB0aGUgYnV0dG9uXHJcbiAgKiBAcHJvcGVydHkge2V4cHJlc3Npb258ZnVuY3Rpb24oRm9ybU9wdGlvbnMpfSBhY3Rpb24gQWN0aW9uIHdoaWNoIHdpbGwgYmUgcGVyZm9ybWVkIGlmIGJ1dHRvbiBpcyBwcmVzc2VkLlxyXG4gICogICAgICAgaWYgZXhwcmVzc2lvbiB0aGUgc2NvcGUgaXQgY3VycmVudCBvYmplY3QuXHJcbiAgKiBAcHJvcGVydHkge2Jvb2w9fSBkZWZhdWx0ICBJcyBidXR0b24gaXMgZGVmYXVsdC4gSWYgdHJ1ZSBpdCB3aWxsIGhhdmUgYWRkaXRpb25hbCBjbGFzcyBhbmRcclxuICAqICAgICAgIGFjdGlvbiBvZiB0aGUgYnV0dG9uIHdpbGwgYmUgY2FsbGVkIG9uIGZvcm0gc3VibWl0XHJcbiAgKiBAcHJvcGVydHkge3N0cmluZz19IHR5cGUgVHlwZSBvZiB0aGUgYnV0dG9uXHJcbiMjI1xyXG5hbmd1bGFyLm1vZHVsZSAnc3VuLmZvcm0uc3RhbmRhcmQtZm9ybS5mb3JtLW9wdGlvbnMnLCBbXVxyXG4ucHJvdmlkZXIgJ0Zvcm1PcHRpb25zJywgLT5cclxuICBiYXNlQ29uZmlnID0gdGhpc1xyXG4gIGJhc2VDb25maWcuZGVmYXVsdEJ1dHRvbnMgPVxyXG4gICAgY2FuY2VsOlxyXG4gICAgICBuYW1lOiAnY2FuY2VsJ1xyXG4gICAgICBsYWJlbDogXCJDQU5DRUxfQlROX0xBQkVMXCJcclxuICAgICAgYWN0aW9uOiBcIl9jYW5jZWxfYnRuKClcIlxyXG4gICAgc2F2ZTpcclxuICAgICAgbmFtZTogJ3NhdmUnXHJcbiAgICAgIGxhYmVsOiBcIlNBVkVfQlROX0xBQkVMXCJcclxuICAgICAgYWN0aW9uOiBcInZhbGlkX3NhdmUoZmFsc2UpXCJcclxuICAgIHNhdmVBbmRSZXR1cm46XHJcbiAgICAgIG5hbWU6ICdzYXZlQW5kUmV0dXJuJ1xyXG4gICAgICBsYWJlbDogXCJTQVZFX0FORF9SRVRVUk5fQlROX0xBQkVMXCJcclxuICAgICAgYWN0aW9uOiBcInZhbGlkX3NhdmUodHJ1ZSlcIlxyXG4gICAgICBkZWZhdWx0OiB0cnVlXHJcbiAgICAgIHR5cGU6ICdzdWJtaXQnXHJcblxyXG4gIHRoaXMuJGdldCA9ICgkcSwgJHBhcnNlLCAkdHJhbnNsYXRlKS0+XHJcbiAgICAjIyMqXHJcbiAgICAgICogQGRlc2NyaXB0aW9uXHJcbiAgICAgICogTWFpbiBwdXJwb3NlIGlzIHRvIHNldCBvcHRpb25zIGFuZCB0aGVuIG92ZXJyaWRlIHNhdmUgbWV0aG9kIHRvIHBlcmZvcm0gc29tZSBhY3Rpb25zLlxyXG4gICAgICAqIElmIHlvdSBuZWVkIHRvIHNob3cgZXJyb3JzIGRpc3BsYXkgdGhlbSBkaXJlY3RseSAoc2hvd0Vycm9yKSBvciBgaGFuZGxlRXJyb3JzYCBzaG91bGQgYnUgdXNlZCB0byB3cmFwIHByb21pc2VcclxuICAgICMjI1xyXG4gICAgY2xhc3MgRm9ybU9wdGlvbnNcclxuXHJcbiAgICAgICMjIypcclxuICAgICAgICBAZGVzY3JpcHRpb24gQnV0dG9ucyBmb3IgZm9ybSBmcm9tIEZvcm1PcHRpb25zUHJvdmlkZXIuZGVmYXVsdEJ1dHRvbnNcclxuICAgICAgIyMjXHJcbiAgICAgIHN0YW5kYXJkQnV0dG9uczogWydjYW5jZWwnLCAnc2F2ZUFuZFJldHVybiddXHJcblxyXG4gICAgICAjIyMqXHJcbiAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBPcHRpb25zIG9mIGNsYXNzLlxyXG4gICAgICAgICogQHBhcmFtIHtGb3JtT3B0aW9uQnV0dG9uW118c3RyaW5nW119IG9wdGlvbnMuYnV0dG9ucyBCdXR0b25zIGRpc3BsYXllZCBieSBzdGFuZGFyZCBmb3JtLlxyXG4gICAgICAgICogICAgICAgSWYgZWxlbWVudCBvZiBhcnJheSBpcyBhIHN0cmluZ3MgaXMgc3VwcGxpZWQsIGRlZmF1bHRzIGJ1dHRvbnMgd2lsbCBiZSB1c2VkXHJcbiAgICAgICMjI1xyXG4gICAgICBjb25zdHJ1Y3RvcjogKG9wdGlvbnMpLT5cclxuICAgICAgICB0aGlzLm1zZyA9IHtzaG93OiBmYWxzZX1cclxuICAgICAgICB0aGlzLmZvcm0gPSBudWxsXHJcbiAgICAgICAgXy5leHRlbmQodGhpcywgb3B0aW9ucylcclxuXHJcbiAgICAgICAgdGhpcy5idXR0b25zID0gbnVsbFxyXG4gICAgICAgIGlmIG9wdGlvbnMgJiYgbm90IF8uaXNVbmRlZmluZWQob3B0aW9ucy5idXR0b25zKVxyXG4gICAgICAgICAgdGhpcy5zZXRCdXR0b25zKG9wdGlvbnMuYnV0dG9ucylcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICB0aGlzLnVzZURlZmF1bHRCdXR0b25zKClcclxuICAgICAgICByZXR1cm5cclxuXHJcbiAgICAgICMjIypcclxuICAgICAgICAqIEBkZXNjcmlwdGlvbiBTZXQgYm90dG9ucyB0byBzdGFuZGFyZFxyXG4gICAgICAjIyNcclxuICAgICAgdXNlRGVmYXVsdEJ1dHRvbnM6IC0+XHJcbiAgICAgICAgdGhpcy5zZXRCdXR0b25zKHRoaXMuc3RhbmRhcmRCdXR0b25zKVxyXG5cclxuICAgICAgIyMjKlxyXG4gICAgICAgICogQGRlc2NyaXB0aW9uIFNldCBidXR0b25zLiBTZWUgY29uc3RydWN0b3JcclxuICAgICAgICAqIEBwYXJhbSB7Rm9ybU9wdGlvbkJ1dHRvbltdfHN0cmluZ30gQnV0dG9ucyB0byBidyBzZXRcclxuICAgICAgIyMjXHJcbiAgICAgIHNldEJ1dHRvbnM6IChidXR0b25zKS0+XHJcbiAgICAgICAgaWYgXy5pc0FycmF5KGJ1dHRvbnMpXHJcbiAgICAgICAgICB0aGlzLmJ1dHRvbnMgPSB7fVxyXG4gICAgICAgICAgZm9yIGJ1dHRvbiBpbiBidXR0b25zXHJcbiAgICAgICAgICAgIGlmIF8uaXNTdHJpbmcoYnV0dG9uKVxyXG4gICAgICAgICAgICAgIGJ1dHRvbiA9IF8uY2xvbmVEZWVwKGJhc2VDb25maWcuZGVmYXVsdEJ1dHRvbnNbYnV0dG9uXSlcclxuICAgICAgICAgICAgICBpZiBub3QgYnV0dG9uXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBidXR0b24gZm91bmQgYnkgbmFtZSAje2J1dHRvbn1cIilcclxuICAgICAgICAgICAgaWYgIWJ1dHRvbi5uYW1lXHJcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQnV0dG9uIG11c3QgaGF2ZSBuYW1lXCIpXHJcbiAgICAgICAgICAgIHRoaXMuYnV0dG9uc1tidXR0b24ubmFtZV0gPSBidXR0b25cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICB0aGlzLmJ1dHRvbnMgPSBidXR0b25zXHJcblxyXG4gICAgICAjIyMqXHJcbiAgICAgICAgKiBAZGVzY3JpcHRpb24gU2V0IGZvcm0gY29udHJvbGxlclxyXG4gICAgICAgICogQHBhcmFtIHtmb3JtLkZvcm1Db250cm9sbGVyfSBmb3JtIEZvcm0gQ29udHJvbGxlclxyXG4gICAgICAjIyNcclxuICAgICAgc2V0Rm9ybTogKGZvcm0pLT5cclxuICAgICAgICB0aGlzLmZvcm0gPSBmb3JtXHJcblxyXG4gICAgICAjIyMqXHJcbiAgICAgICAgKiBAZGVzY3JpcHRpb24gRm9yY2VzIHNpbXBsZUlucHV0IHRvIHNob3cgdmFsaWRhdGlvbiBlcnJvcnMgYW5kIHJldHVzcm4gaXMgZm9ybSBpcyB2YWxpZFxyXG4gICAgICAgICogQHJldHVybnMge2Jvb2x9IElzIGFsbCBmb3JtIGVsZW1lbnRzIGFyZSB2YWxpZFxyXG4gICAgICAjIyNcclxuICAgICAgdmFsaWRhdGU6IC0+XHJcbiAgICAgICAgZm9ybSA9IHRoaXMuZm9ybVxyXG4gICAgICAgIF8oZm9ybSlcclxuICAgICAgICAua2V5cygpXHJcbiAgICAgICAgLmZpbHRlciAoZSktPiBlWzBdICE9IFwiJFwiICYmICFfLmlzVW5kZWZpbmVkKGZvcm1bZV0uJHZhbGlkKVxyXG4gICAgICAgIC5lYWNoIChuYW1lKS0+XHJcbiAgICAgICAgICBmb3JtW25hbWVdLiRzaG93VmFsaWRhdGlvbk1zZyA9IHRydWVcclxuICAgICAgICByZXR1cm4gdGhpcy5mb3JtLiR2YWxpZFxyXG5cclxuICAgICAgIyMjKlxyXG4gICAgICAgICogQGRlc2NyaXB0aW9uIFNldCBlcnJvciBmb3IgZm9ybVxyXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG1zZyBNZXNzYWdlIHRvIGJlIHNob3duXHJcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZz19IHRpdGxlIFRpdGxlIG9mIHRoZSBlcnJvclxyXG4gICAgICAjIyNcclxuICAgICAgc2hvd0Vycm9yOiAobXNnLCB0aXRsZSktPlxyXG4gICAgICAgIHRoaXMuc2hvd01lc3NhZ2UobXNnLCAnZGFuZ2VyJywgdGl0bGUpXHJcblxyXG4gICAgICAjIyMqXHJcbiAgICAgICAgKiBAZGVzY3JpcHRpb24gU2V0IGN1c3RvbSBtZXNzYWdlXHJcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbXNnIE1lc3NhZ2UgdG8gYmUgc2hvd25cclxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nPX0gdHlwZSBDb250YWludGVyIHR5cGUgaWYgdGhlIGVycm9yXHJcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZz19IHRpdGxlIFRpdGxlIG9mIHRoZSBlcnJvclxyXG4gICAgICAjIyNcclxuICAgICAgc2hvd01lc3NhZ2U6IChtc2csIHR5cGUgPSBcImluZm9cIiwgdGl0bGUpLT5cclxuICAgICAgICB0aGlzLm1zZyA9XHJcbiAgICAgICAgICB0eXBlOiB0eXBlXHJcbiAgICAgICAgICB0ZXh0OiBtc2dcclxuICAgICAgICAgIHNob3c6IHRydWVcclxuICAgICAgICAgIHRpdGxlOiB0aXRsZVxyXG4gICAgICAgIHJldHVyblxyXG5cclxuICAgICAgIyMjKlxyXG4gICAgICAgICogQGRlc2NyaXB0aW9uIFdyYXBzIGBwcm9taXNlYC4gSWYgcHJvbWlzZSBpcyByZXNvbHZlZCBtZXNzYWdlIHdpbGwgYmUgaGlkZGVuLlxyXG4gICAgICAgICogICAgIElmIHByb21pc2UgaXMgcmVqZWN0ZWQsIHRoZW4gdGhlIGVycm9yIHdpbGwgYmUgc2hvd24gd2l0aCB0aGUgYHRpdGxlYC5cclxuICAgICAgICAqIEBwYXJhbSB7UHJvbWlzZX0gcHJvbWlzZSBXcmFwcGluZyBwcm9taXNlXHJcbiAgICAgICAgKiBAcGFyYW1zIHtzdHJpbmc9fSB0aXRsZSBUaXRsZSBmb3IgZXJyb3IgaWYgZXJyb3Igb2NjdXJzXHJcbiAgICAgICMjI1xyXG4gICAgICBoYW5kbGVFcnJvcnM6IChwcm9taXNlLCB0aXRsZSktPlxyXG4gICAgICAgIGRlZmVycmVkID0gJHEuZGVmZXIoKVxyXG4gICAgICAgIHByb21pc2VcclxuICAgICAgICAudGhlbiAocmVzKT0+XHJcbiAgICAgICAgICB0aGlzLm1zZy5zaG93ID0gZmFsc2VcclxuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzKVxyXG4gICAgICAgIC5jYXRjaCAocmVzcCk9PlxyXG4gICAgICAgICAgI3NldCBlcnJvciBtZXNzYWdlIHRvIGZvcm1cclxuICAgICAgICAgIGRlZmVycmVkLnJlamVjdChyZXNwKVxyXG4gICAgICAgICAgJHEud2hlbiB0aGlzLl9wYXJzZUVycm9yKHJlc3ApXHJcbiAgICAgICAgICAudGhlbiAoZXJyb3JNc2cpPT5cclxuICAgICAgICAgICAgdGhpcy5zaG93RXJyb3IoZXJyb3JNc2csIHRpdGxlKVxyXG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlXHJcblxyXG4gICAgICAjIyMqXHJcbiAgICAgICAgKiBAZGVzY3JpcHRpb24gU3R1Yi4gTWV0aG9kIGlzIGNhbGxlZCBmb3IgdmFsaWQgZm9ybSB0byBwZXJmb3JtIGFjdGlvbi4gU2hvdWxkIGJlIG92ZXJyaWRlbiBmb3IgaW5zdGFuY2VcclxuICAgICAgIyMjXHJcbiAgICAgIHNhdmU6IC0+XHJcbiAgICAgICAgI3N0dWJcclxuICAgICAgICByZXR1cm5cclxuXHJcbiAgICAgICMjIypcclxuICAgICAgICAqIEBkZXNjcmlwdGlvbiBWYWxpZGF0ZSBmb3JtIGFuZCBjYWxsIHNhdmUgbWV0aG9kIGlmIHZhbGlkYXRpb24gaXMgc3VjY2Vzc1xyXG4gICAgICAjIyNcclxuICAgICAgdmFsaWRfc2F2ZTogLT5cclxuICAgICAgICBpZiB0aGlzLnZhbGlkYXRlKClcclxuICAgICAgICAgIHRoaXMuc2F2ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpXHJcblxyXG4gICAgICAjIyNcclxuICAgICAgICBAZGVzY3JpcHRpb24gUGFyc2VzIHNlcnZlciByZXNwb25zZVxyXG4gICAgICAgIEBwYXJhbSB7c3RyaW5nfE9iamVjdH0gRXJyb3IgbWVzc2FnZSBvciBodHRwIHJlc3BvbnNlIG9iamVjdFxyXG4gICAgICAjIyNcclxuICAgICAgX3BhcnNlRXJyb3I6IChyZXNwKS0+XHJcbiAgICAgICAgaWYgXy5pc1N0cmluZyhyZXNwKVxyXG4gICAgICAgICAgcmV0dXJuIHJlc3BcclxuICAgICAgICBlbHNlIGlmIHJlc3AgaW5zdGFuY2VvZiBFcnJvclxyXG4gICAgICAgICAgcmV0dXJuIHJlc3AubWVzc2FnZVxyXG4gICAgICAgIGVsc2UgaWYgYW5ndWxhci5pc0RlZmluZWQocmVzcC5zdGF0dXMpIGFuZCBhbmd1bGFyLmlzRGVmaW5lZChyZXNwLmRhdGEpXHJcbiAgICAgICAgICBpZiBfLmlzU3RyaW5nKHJlc3AuZGF0YSlcclxuICAgICAgICAgICAgaWYgNTAwIDw9IHJlc3Auc3RhdHVzIDwgNjAwXHJcbiAgICAgICAgICAgICAgcmV0dXJuICR0cmFuc2xhdGUoXCJTRVJWRVJfRVJST1JfTUVTU0FHRVwiLCB7c3RhdHVzOiByZXNwLnN0YXR1cywgdGV4dDogcmVzcC5zdGF0dXNUZXh0fSlcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3AuZGF0YVxyXG4gICAgICAgICAgZWxzZSBpZiByZXNwLmRhdGEubXNnXHJcbiAgICAgICAgICAgIG1zZyA9IHJlc3AuZGF0YS5tc2cubWVzc2FnZVxyXG4gICAgICAgICAgICByZXR1cm4gJHRyYW5zbGF0ZShtc2cpXHJcblxyXG4gICAgICBfcnVuQWN0aW9uOiAoYWN0aW9uLCBidXR0b24pLT5cclxuICAgICAgICByZXR1cm4gaWYgbm90IGFjdGlvblxyXG4gICAgICAgIGlmIF8uaXNGdW5jdGlvbihhY3Rpb24pXHJcbiAgICAgICAgICBhY3Rpb24uY2FsbChidXR0b24sIHRoaXMpXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgJHBhcnNlKGFjdGlvbikodGhpcywge2J1dHRvbn0pXHJcblxyXG4gICAgICBfY2xpY2tlZDogKGJ1dHRvbiktPlxyXG4gICAgICAgIHJldHVybiBpZiBidXR0b24udHlwZSA9PSAnc3VibWl0JyAjIFdpbGwgYmUgaGFuZGxlZCBieSBgX2Zvcm1fc3VibWl0YFxyXG4gICAgICAgIHRoaXMuX3J1bkFjdGlvbihidXR0b24uYWN0aW9uLCBidXR0b24pXHJcblxyXG4gICAgICBfZm9ybV9zdWJtaXQ6IC0+XHJcbiAgICAgICAgYnV0dG9uID0gXyh0aGlzLmJ1dHRvbnMpLmZpbHRlcigoYiktPmIuZGVmYXVsdCkuZmlyc3QoKVxyXG4gICAgICAgIGlmIGJ1dHRvblxyXG4gICAgICAgICAgdGhpcy5fcnVuQWN0aW9uKGJ1dHRvbi5hY3Rpb24sIGJ1dHRvbilcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICB0aGlzLnZhbGlkX3NhdmUoKVxyXG5cclxuICAgICAgX2NhbmNlbF9idG46IC0+XHJcblxyXG4gIHJldHVyblxyXG5cclxuLnByb3ZpZGVyICdBZHZhbmNlZEZvcm1PcHRpb25zJywgLT5cclxuICB0aGlzLiRnZXQgPSAoJHRyYW5zbGF0ZSwgJHEsIEZvcm1PcHRpb25zLCAkc3RhdGUsIEZsYXNoTWVzc2FnZSwgc3VuUmVzdEJhc2VNb2RlbCktPlxyXG4gICAgY2xhc3MgQWR2YW5jZWRGb3JtT3B0aW9ucyBleHRlbmRzIEZvcm1PcHRpb25zXHJcbiAgICAgIHN0YW5kYXJkQnV0dG9uczogWydjYW5jZWwnLCAnc2F2ZScsICdzYXZlQW5kUmV0dXJuJ11cclxuICAgICAgc3VjY2Vzc1NhdmVkTWVzc2FnZTogXCJPQkpFQ1RfU0FWRURfRkxBU0hfTUVTU0FHRVwiXHJcblxyXG4gICAgICAjIyMqXHJcbiAgICAgICAgKiBAZGVzY3JpcHRpb24gVXNlXHJcbiAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xyXG4gICAgICAgICogQHBhcmFtIHtPYmplY3QuPHN0cmluZyxzdHJpbmd8ZnVuY3Rpb24oc3VuUmVzdEJhc2VNb2RlbCk+fSBvcHRpb25zLnN0YXRlcyBTdGF0ZXMgdG8gYmUgZ28sIGFmdGVyIHNhdmUuXHJcbiAgICAgICAgKiAgICAgICBBdmFpbGFibGUgYXJlICdyZXR1cm4nLCdjcmVhdGVkJywnc2ltcGx5U2F2ZWQnLiBJZiB2YWx1ZSBpcyBmdW5jdGlvbiBpdCB3aWxsIGJlIGNhbGxlZCB3aXRoIG1vZGVsLlxyXG5cclxuICAgICAgICAqIEBwYXJhbSB7c3VuUmVzdEJhc2VNb2RlbH0gbW9kZWwgTW9kZWwgdG8gd29yayB3aXRoXHJcbiAgICAgICMjI1xyXG4gICAgICBjb25zdHJ1Y3RvcjogKG9wdGlvbnMsIG1vZGVsKS0+XHJcbiAgICAgICAgaWYgb3B0aW9ucyBpbnN0YW5jZW9mIHN1blJlc3RCYXNlTW9kZWxcclxuICAgICAgICAgIFttb2RlbCwgb3B0aW9uc10gPSBbb3B0aW9ucywgbW9kZWxdXHJcbiAgICAgICAgc3VwZXJcclxuICAgICAgICB0aGlzLnNldE1vZGVsKG1vZGVsKSBpZiBtb2RlbFxyXG5cclxuICAgICAgIyMjKlxyXG4gICAgICAgICogQGRlc2NyaXB0aW9uIFNldCBtb2RlbC5cclxuICAgICAgIyMjXHJcbiAgICAgIHNldE1vZGVsOiAobW9kZWwpLT5cclxuICAgICAgICB0aGlzLm1vZGVsID0gbW9kZWxcclxuXHJcbiAgICAgICMjIypcclxuICAgICAgICAqIEBkZXNjcmlwdGlvbiBTdHViLiBBY3Rpb24gYmVmb3JlIG1vZGVsIHNhdmVcclxuICAgICAgICAqIEBwYXJhbXMge09iamVjdH0gbW9kZWwgTW9kZWwgdG8gYmUgc2F2ZWRcclxuICAgICAgIyMjXHJcbiAgICAgIHByZVNhdmU6IChtb2RlbCktPlxyXG4gICAgICAgICNzdHViXHJcbiAgICAgICAgcmV0dXJuXHJcblxyXG4gICAgICAjIyMqXHJcbiAgICAgICAgKiBAZGVzY3JpcHRpb24gU3R1Yi4gQWN0aW9uIGFmdGVyIG1vZGVsIHNhdmVcclxuICAgICAgICAqIEBwYXJhbXMge09iamVjdH0gbW9kZWwgTW9kZWwgdG8gYmUgc2F2ZWRcclxuICAgICAgICAqIEBwYXJhbXMge09iamVjdH0gcmVzcG9uZSBSZXNwb25zZSBmcm9tIHRoZSBzZXJ2ZXJcclxuICAgICAgIyMjXHJcbiAgICAgIHBvc3RTYXZlOiAobW9kZWwsIHJlc3BvbnNlKS0+XHJcbiAgICAgICAgI3N0dWJcclxuICAgICAgICByZXR1cm5cclxuXHJcbiAgICAgICMjIypcclxuICAgICAgICAqIEBkZXNjcmlwdGlvbiBTZXQgYm90dG9ucyB0byBzdGFuZGFyZFxyXG4gICAgICAjIyNcclxuICAgICAgdXNlRGVmYXVsdEJ1dHRvbnM6IC0+XHJcbiAgICAgICAgYnV0dG9ucyA9IF8uY2xvbmVEZWVwKHRoaXMuc3RhbmRhcmRCdXR0b25zKVxyXG4gICAgICAgIGlmIG5vdCB0aGlzLnN0YXRlcz8ucmV0dXJuXHJcbiAgICAgICAgICBidXR0b25zLnJlbW92ZSgnc2F2ZUFuZFJldHVybicpXHJcbiAgICAgICAgdGhpcy5zZXRCdXR0b25zKGJ1dHRvbnMpXHJcbiAgICAgICAgaWYgbm90IHRoaXMuc3RhdGVzPy5yZXR1cm5cclxuICAgICAgICAgIHRoaXMuYnV0dG9ucy5zYXZlLmRlZmF1bHQgPSB0cnVlXHJcbiAgICAgICAgICB0aGlzLmJ1dHRvbnMuc2F2ZS50eXBlID0gJ3N1Ym1pdCdcclxuXHJcbiAgICAgICMjIypcclxuICAgICAgICAqIEBkZXNjcmlwdGlvbiBTYXZlIG1vZGVsXHJcbiAgICAgICMjI1xyXG4gICAgICBzYXZlTW9kZWw6IC0+XHJcbiAgICAgICAgdGhpcy5tb2RlbC5tbmdyLnNhdmUoKVxyXG5cclxuICAgICAgIyMjKlxyXG4gICAgICAgICogQGRlc2NyaXB0aW9uIE1ldGhvZCB0byBzYXZlIG1vZGVsLCBoYW5kbGUgZXJyb3JzIGFuZCBnbyB0byBzdGF0ZSwgc3BlY2lmaWVkIGJ5IGBzaG91bGRSZXR1cm5gIGFuZFxyXG4gICAgICAgICogICAgICAgcHJldmlvdXMgbW9kZWwgc3RhdGUuXHJcbiAgICAgICAgKiBAcGFyYW1zIHtPYmplY3R9IG1vZGVsIE1vZGVsIHRvIGJlIHNhdmVkXHJcbiAgICAgICMjI1xyXG4gICAgICBzYXZlOiAoc2hvdWxkUmV0dXJuKS0+XHJcbiAgICAgICAgbW9kZWwgPSB0aGlzLm1vZGVsXHJcbiAgICAgICAgdGhpcy5wcmV2aW91c01vZGVsU3RhdGUgPSBtb2RlbC5tbmdyLnN0YXRlXHJcbiAgICAgICAgJHEud2hlbih0aGlzLnByZVNhdmUobW9kZWwpKVxyXG4gICAgICAgIC50aGVuID0+XHJcbiAgICAgICAgICB0aGlzLmhhbmRsZUVycm9ycyB0aGlzLnNhdmVNb2RlbCgpXHJcbiAgICAgICAgLnRoZW4gKHJlc3BvbnNlKT0+XHJcbiAgICAgICAgICB0aGlzLnBvc3RTYXZlKG1vZGVsLCByZXNwb25zZSlcclxuICAgICAgICAudGhlbiAoKT0+XHJcbiAgICAgICAgICBpZiBzaG91bGRSZXR1cm4gPT0gdHJ1ZSBvciBzaG91bGRSZXR1cm4gPT0gdW5kZWZpbmVkXHJcbiAgICAgICAgICAgIHRoaXMuc3RhdGVSZXR1cm4oKVxyXG4gICAgICAgICAgZWxzZSBpZiB0aGlzLnByZXZpb3VzTW9kZWxTdGF0ZSA9PSBtb2RlbC5tbmdyLk5FV1xyXG4gICAgICAgICAgICB0aGlzLnN0YXRlVG9DcmVhdGVkKClcclxuICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgdGhpcy5zdGF0ZVNpbXBseVNhdmVkKClcclxuICAgICAgICAudGhlbiA9PlxyXG4gICAgICAgICAgdGhpcy5fc2hvd1N1Y2Nlc3NNZXNzYWdlKClcclxuXHJcbiAgICAgIF9nb1RvOiAoc3RhdGUpLT5cclxuICAgICAgICBpZiBfLmlzRnVuY3Rpb24oc3RhdGUpXHJcbiAgICAgICAgICBzdGF0ZS5jYWxsKHRoaXMsIHRoaXMubW9kZWwpXHJcbiAgICAgICAgZWxzZSBpZiBfLmlzQXJyYXkoc3RhdGUpXHJcbiAgICAgICAgICAkc3RhdGUuZ28uYXBwbHkoJHN0YXRlLCBzdGF0ZSlcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAkc3RhdGUuZ28oc3RhdGUpXHJcblxyXG4gICAgICBzdGF0ZVJldHVybjogLT5cclxuICAgICAgICBpZiB0aGlzLnN0YXRlcz8ucmV0dXJuXHJcbiAgICAgICAgICB0aGlzLl9nb1RvKHRoaXMuc3RhdGVzLnJldHVybilcclxuXHJcbiAgICAgIHN0YXRlVG9DcmVhdGVkOiAtPlxyXG4gICAgICAgIGlmIHRoaXMuc3RhdGVzPy5jcmVhdGVkXHJcbiAgICAgICAgICB0aGlzLl9nb1RvKHRoaXMuc3RhdGVzLmNyZWF0ZWQpXHJcblxyXG4gICAgICBzdGF0ZVNpbXBseVNhdmVkOiAtPlxyXG4gICAgICAgIGlmIHRoaXMuc3RhdGVzPy5zaW1wbHlTYXZlZFxyXG4gICAgICAgICAgdGhpcy5fZ29Ubyh0aGlzLnN0YXRlcy5zaW1wbHlTYXZlZClcclxuXHJcbiAgICAgIF9zaG93U3VjY2Vzc01lc3NhZ2U6IChtZXNzYWdlLCB0aXRsZSktPlxyXG4gICAgICAgIGlmIHRoaXMuc2hvd1N1Y2Vlc3NNZXNzYWdlcyAhPSBmYWxzZVxyXG4gICAgICAgICAgRmxhc2hNZXNzYWdlLnN1Y2Nlc3MobWVzc2FnZSBvciB0aGlzLnN1Y2Nlc3NTYXZlZE1lc3NhZ2UsIHRpdGxlKVxyXG5cclxuICAgICAgX2NhbmNlbF9idG46IC0+XHJcbiAgICAgICAgdGhpcy5zdGF0ZVJldHVybigpXHJcblxyXG4gICAgcmV0dXJuIEFkdmFuY2VkRm9ybU9wdGlvbnNcclxuXHJcbiAgcmV0dXJuXHJcbiIsIiMjIypcclxuICAqIEBhdXRob3IgUGV0ZXIgS2ljZW5rb1xyXG4gICogQGZpbGUgU3RhbmRhcmQgZm9ybSB3aXRoIGJ1dHRvbnMgYW5kIGFkZGl0aW9uYWwgYWN0aW9uc1xyXG4jIyNcclxubW9kdWxlID0gYW5ndWxhci5tb2R1bGUgJ3N1bi5mb3JtLnN0YW5kYXJkLWZvcm0nLCBbXHJcbiAgJ3N1bi5mb3JtLnN0YW5kYXJkLWZvcm0uZm9ybS1vcHRpb25zJ1xyXG4gICdzdW4uZm9ybS5zdGFuZGFyZC1mb3JtLnNwYXRpYWwuc2ltcGxlLWlucHV0LWdyb3VwJ1xyXG5dXHJcbi5kaXJlY3RpdmUgJ3N0YW5kYXJ0Rm9ybScsIC0+XHJcbiAgLT4gdGhyb3cgbmV3IEVycm9yKFwiWW91IGFnYWluIG1pc3NwZWxsZWQgc3RhbmRhcmQgZm9ybVwiKVxyXG5tb2R1bGUuZGlyZWN0aXZlICdzdGFuZGFyZEZvcm0nLCAoJHBhcnNlLCBGb3JtT3B0aW9ucyktPlxyXG4gICMjIypcclxuICAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICAqIEBuYW1lIHN0YW5kYXJkRm9ybVxyXG4gICogQHJlc3RyaWN0IEVBXHJcbiAgKlxyXG4gICogQGRlc2NyaXB0aW9uXHJcbiAgKiBEaXJlY3RpdmUgdG8gd3JhcCBzdGFuZGFyZCBodG1sIGZvcm0uIEJhc2VkIG9uIHN1cHBsaWVkIGZvcm0gb3B0aW9ucyBjcmVhdGVzIGFjdGlvbiBidXR0b25zIGFuZCBhbGVydCBib3hcclxuICAqXHJcbiAgKiBAcGFyYW0ge0Zvcm1PcHRpb25zPX0gb3B0aW9uc3xzdGFuZGFyZEZvcm0gKG9yIGNoaWxkKSB3aGljaCBkZWZpbmVzIGJlaGF2aW91ci4gRGVmYXVsdCBpcyBGb3JtT3B0aW9ucy5cclxuICAqIEBwYXJhbSB7c3RyaW5nPX0gbmdNb2RlbCBXaWxsIGJlIHNldCB0byBmb3JtT3B0aW9ucyB0aG91Z2h0IGBzZXRNb2RlbGAgbWV0aG9kXHJcbiAgKiBAcGFyYW0ge3N0cmluZz19IG5hbWUgSWYgbmFtZSBpcyBzcGVjaWZpZWQsIGZvcm0gY29udHJvbGxlciB3aWxsIGJlIHB1Ymxpc2hlZCB0byB0aGUgc2NvcGUsIHVuZGVyIHRoaXMgbmFtZVxyXG4gICMjI1xyXG5cclxuICByZXN0cmljdDogJ0VBJ1xyXG4gIHNjb3BlOlxyXG4gICAgbW9kZWw6ICc9bmdNb2RlbCdcclxuICB0cmFuc2NsdWRlOiB0cnVlXHJcbiAgdGVtcGxhdGVVcmw6ICdzdGFuZGFyZC1mb3JtL3N0YW5kYXJkLWZvcm0udHBsLmh0bWwnXHJcbiAgbGluazogKHNjb3BlLCBlbGVtZW50LCBhdHRycykgLT5cclxuICAgIG9wdGlvbk5hbWUgPSBhdHRyc1snc3RhbmRhcmRGb3JtJ10gb3IgYXR0cnNbJ29wdGlvbnMnXVxyXG4gICAgc2NvcGUub3B0aW9ucyA9ICRwYXJzZShvcHRpb25OYW1lKShzY29wZS4kcGFyZW50KSBvciBuZXcgRm9ybU9wdGlvbnMoKVxyXG5cclxuICAgIHNjb3BlLm9wdGlvbnMuc2V0Rm9ybShzY29wZS5pbm5lckZvcm0pXHJcblxyXG4gICAgaWYgc2NvcGUub3B0aW9ucy5zZXRNb2RlbFxyXG4gICAgICBzY29wZS4kd2F0Y2ggJ21vZGVsJywgKG1vZGVsKS0+XHJcbiAgICAgICAgc2NvcGUub3B0aW9ucy5zZXRNb2RlbChtb2RlbCkgaWYgbW9kZWxcclxuXHJcbiAgICBpZiBhdHRycy5uYW1lXHJcbiAgICAgIHNjb3BlLiRwYXJlbnRbYXR0cnMubmFtZV0gPSBzY29wZS5pbm5lckZvcm1cclxuXHJcbiAgICBzY29wZS5nZXRCdXR0b25DbGFzcyA9IChidXR0b24pLT5cclxuICAgICAgcmV0dXJuIGJ1dHRvbi5jbGFzcyBvciBpZiBidXR0b24uZGVmYXVsdCB0aGVuICdidG4gYnRuLXByaW1hcnknIGVsc2UgJ2J0biBidG4tZGVmYXVsdCdcclxuXHJcbiIsImFuZ3VsYXIubW9kdWxlICdzdW4uZm9ybS5zaW1wbGUtaW5wdXQuZGF0ZScsIFtcclxuICAndWkuYm9vdHN0cmFwLmRhdGVwaWNrZXInXHJcbl1cclxuLmNvbmZpZyBcIlNpbXBsZUlucHV0T3B0aW9uc1wiLChTaW1wbGVJbnB1dE9wdGlvbnMpLT5cclxuICBTaW1wbGVJbnB1dE9wdGlvbnMuaW5wdXRzLmRhdGU9XHJcbiAgICBkYXRlICAgIDpcclxuICAgICAgY29udHJvbGxlciA6ICdTaW1wbGVJbnB1dERhdGVDb250cm9sbGVyJ1xyXG4gICAgICB0ZW1wbGF0ZVVybDogJ2RhdGUudHBsLmh0bWwnXHJcbi5jb250cm9sbGVyIFwiU2ltcGxlSW5wdXREYXRlQ29udHJvbGxlclwiLCAoJHNjb3BlLCAkbG9jYWxlKS0+XHJcbiAgJHNjb3BlLmZvcm1hdCA9ICRsb2NhbGUuREFURVRJTUVfRk9STUFUUy5tZWRpdW1EYXRlXHJcbiAgJHNjb3BlLm9wZW4gPSAoJGV2ZW50KS0+XHJcbiAgICAkZXZlbnQucHJldmVudERlZmF1bHQoKVxyXG4gICAgJGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXHJcblxyXG4gICAgJHNjb3BlLm9wZW5lZCA9IHRydWVcclxuIiwiIyMjKlxyXG4gICogQGF1dGhvciBQZXRlciBLaWNlbmtvXHJcbiAgKiBAZmlsZSBFeHRlbmRlZCBzaW1wbGUgaW5wdXQgKHdpdGggcHJlcGVuZCBhbmQgYXBwZW5kIGljb24pXHJcbiMjI1xyXG5hbmd1bGFyLm1vZHVsZSgnc3VuLmZvcm0uc3RhbmRhcmQtZm9ybS5zcGF0aWFsLnNpbXBsZS1pbnB1dC1ncm91cCcsIFtdKVxyXG4uY29udHJvbGxlciAnSW5wdXRHcm91cENvbnRyb2xsZXInLCAoJHNjb3BlLCAkZWxlbWVudCwgJGF0dHJzLCAkdHJhbnNjbHVkZSwgJHRyYW5zbGF0ZSwgJGNvbXBpbGUsICRjb250cm9sbGVyKS0+XHJcbiAgXy5leHRlbmQgdGhpcywgJGNvbnRyb2xsZXIoJ1NpbXBsZUlucHV0Q29udHJvbGxlcicsIHskc2NvcGUsICRlbGVtZW50LCAkYXR0cnMsICR0cmFuc2NsdWRlfSlcclxuICB0aGlzLl9wcmVDb21waWxlID0gKGlucHV0KS0+XHJcbiAgICByZXMgPSAkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpKS5hZGRDbGFzcygnaW5wdXQtZ3JvdXAnKVxyXG4gICAgcHJlcGVuZCA9ICQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpKS5hZGRDbGFzcygnaW5wdXQtZ3JvdXAtYWRkb24nKVxyXG4gICAgaWYgJGF0dHJzLnByZXBlbmRJY29uXHJcbiAgICAgIHByZXBlbmQuYXBwZW5kICQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaScpKS5hZGRDbGFzcygkYXR0cnMucHJlcGVuZEljb24pXHJcbiAgICAgIHJlcy5hcHBlbmQocHJlcGVuZClcclxuICAgIHJlcy5hcHBlbmQoaW5wdXQpXHJcbiAgICByZXR1cm4gcmVzXHJcbiAgcmV0dXJuIHRoaXNcclxuLmRpcmVjdGl2ZSAnaW5wdXRHcm91cCcsIChzaW1wbGVJbnB1dERpcmVjdGl2ZSktPlxyXG4gIGFzc2VydCBzaW1wbGVJbnB1dERpcmVjdGl2ZS5sZW5ndGggPT0gMSwgJ01vcmUgdGhhbiBvbmNlIHNpbXBsZUlucHV0RGlyZWN0aXZlIGZvdW5kISdcclxuICBfLmV4dGVuZCB7fSwgc2ltcGxlSW5wdXREaXJlY3RpdmVbMF0sXHJcbiAgICBjb250cm9sbGVyOiAnSW5wdXRHcm91cENvbnRyb2xsZXInXHJcblxyXG5cclxuXHJcblxyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=