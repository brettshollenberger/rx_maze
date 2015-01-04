Rx.Observable.prototype.distinctUntilEvent = function(event) {
  var source = this;
  keySelector = Rx.helpers.identity;
  comparer = Rx.helpers.defaultComparer;
  return new Rx.AnonymousObservable(function (observer) {
    var hasCurrentKey = false, currentKey;
    return source.subscribe(function (value) {
      var comparerEquals = false, key;

      event.forEach(function(i) { 
        hasCurrentKey = false;
        currentKey = undefined;
      });

      try {
        key = keySelector(value);
      } catch (e) {
        observer.onError(e);
        return;
      }
      if (hasCurrentKey) {
        try {
          comparerEquals = comparer(currentKey, key);
        } catch (e) {
          observer.onError(e);
          return;
        }
      }
      if (!hasCurrentKey || !comparerEquals) {
        hasCurrentKey = true;
        currentKey = key;
        observer.onNext(value);
      }
    }, observer.onError.bind(observer),                  observer.onCompleted.bind(observer));
  }, this);
}
