Function.prototype.include = function(Module) {
  var methods           = new Module(),
      propNames         = Object.getOwnPropertyNames(methods),
      instancePropNames = _.remove(propNames, function(val) {
                            return val.slice(0, 2) == '__';
                          });

  _.each(instancePropNames, function(ipn) {
    var propDescriptor = Object.getOwnPropertyDescriptor(methods, ipn);
    Object.defineProperty(this.prototype, ipn.slice(2), propDescriptor);
  }, this);

  if (_.isFunction(Module.included)) {
    Module.included(this);
  }
};
