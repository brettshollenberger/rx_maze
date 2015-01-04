Function.prototype.extend = function(Module, options) {
  var properties     = new Module(),
      options        = options || {},
      propertyNames  = Object.getOwnPropertyNames(properties),
      classPropNames = _.remove(propertyNames, function(propName) {
                          return propName.slice(0, 2) != '__';
                       });

  _.each(classPropNames, function(cpn) {
    var propertyDescriptor = _.clone(Object.getOwnPropertyDescriptor(properties, cpn));

    if (options.private) { propertyDescriptor.enumerable = false; }

    Object.defineProperty(this, cpn, propertyDescriptor);
  }, this);

  if (_.isFunction(Module.extended)) {
    Module.extended(this);
  }
};

Object.defineProperty(Object.prototype, 'extend', {
  enumerable: false,
  configurable: true,
  value: Function.prototype.extend
});
