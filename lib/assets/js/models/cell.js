function Cell(options) {
  this.height   = options.height;
  this.width    = options.width;
  this.left     = options.left;
  this.right    = this.left + this.width;
  this.top      = options.top;
  this.bottom   = this.top + this.height;
  this.selector = options.selector;
  this.id       = this.left + "-" + this.top + "-" + this.right + "-" + this.bottom;

  if (this.selector.hasClass("open")) {
    this.extend(Open);
  }

  if (this.selector.hasClass("wall")) {
    this.extend(Wall);
  }
}

function Open() {
  this.onCollision = noop;
}

function Wall() {
  this.extend(Solid);
}
