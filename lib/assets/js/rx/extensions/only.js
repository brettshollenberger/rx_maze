Rx.Observable.prototype.only = function(o) {
  return this.filter(function(i) { return i == o; });
}
