function Solid() {
  this.onCollision = function(otherObject, collision) {
    var directionToDisable = collision.detailsFor(otherObject).collidesOn;

    otherObject.disable(directionToDisable);
  }
}
