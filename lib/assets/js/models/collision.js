function Collision(options) {
  this.type     = options.type;
  this.location = options.location;
  this.objects  = options.objects;

  this.detailsFor = function(object) {
    return _.filter(this.objects, function(o) {
      return o.value === object;
    })[0];
  }

  this.detailsForOther = function(object) {
    return _.filter(this.objects, function(o) {
      return o.value != object;
    })[0];
  }
}

Collision.top = function(x) {
  return {
    bottom: function(y) {
      return {
        at: function(px) {
          return new Collision({
            type: "y",
            location: px,
            objects: [
              { collidesOn: "down", value: x },
              { collidesOn: "up", value: y }
            ]
          });
        }
      }
    }
  }
}

Collision.left = function(x) {
  return {
    right: function(y) {
      return {
        at: function(px) {
          return new Collision({
            type: "x",
            location: px,
            objects: [
              { collidesOn: "right", value: x },
              { collidesOn: "left", value: y }
            ]
          });
        }
      }
    }
  }
}
