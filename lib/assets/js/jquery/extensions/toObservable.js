jQuery.fn.toObservable = function (eventName) {
  var selector = this;

  return Rx.Observable.create(function(observer) {
    var subscribed = true;

    selector.on(eventName, passClickEvent);

    function passClickEvent(e) {
      if (subscribed == true) {
        observer.onNext(e);
      }
    }

    return function() {
      subscribed = false;
      selector.unbind(eventName, passClickEvent);
    };
  });
};
