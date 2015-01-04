jQuery.fn.coordinates = function() {
  var pos = this.position();

  pos.bottom = this.height() + pos.top;
  pos.right  = this.width() + pos.left;

  return pos;
}
