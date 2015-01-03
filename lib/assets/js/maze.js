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

jQuery.fn.coordinates = function() {
  var pos = this.position();

  pos.bottom = this.height() + pos.top;
  pos.right  = this.width() + pos.left;

  return pos;
}

var maze = $("#maze"),
    o    = "open",
    w    = "wall",
    s    = "start",
    cellMap = [
    [w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w],
    [w, s, w, o, w, w, o, w, o, w, w, w, w, w, w, o, w, w, w],
    [w, o, o, o, o, o, o, w, o, w, o, o, o, o, o, w, w, w, w],
    [w, w, o, w, w, w, o, w, o, w, o, w, o, w, o, w, w, w, w],
    [w, w, o, w, w, w, o, w, o, w, o, w, o, w, o, w, o, o, o],
    [w, o, o, w, o, o, o, w, o, w, o, w, o, w, o, w, w, w, w],
    [w, w, o, w, w, w, o, w, w, w, o, w, o, w, o, o, o, w, w],
    [w, w, o, w, w, w, o, o, o, o, o, w, w, w, w, w, o, w, w],
    [w, w, o, o, o, w, o, w, w, w, w, w, o, w, o, o, o, w, w],
    [w, w, o, w, o, w, o, o, w, o, o, o, o, w, w, w, o, w, w],
    [w, w, o, w, o, w, o, o, o, o, w, o, w, w, o, o, o, w, w],
    [w, w, o, w, o, w, o, o, w, o, w, o, w, o, o, w, w, o, o],
    [w, w, o, w, o, o, o, o, w, o, w, w, o, o, w, w, w, o, w],
    [w, w, o, w, o, w, o, w, w, o, w, w, w, o, o, o, o, o, w],
    [w, w, o, w, w, w, w, w, o, o, w, o, o, o, o, w, w, w, w],
    [w, o, o, o, o, o, o, w, o, w, w, o, w, w, w, w, o, o, o],
    [w, w, o, w, w, w, w, w, o, w, w, o, o, o, o, o, o, w, w],
    [w, w, o, w, w, w, o, o, o, o, o, w, w, w, w, w, w, w, w],
    [w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w]
    ];

    for (i in cellMap) {
      var row = cellMap[i];
      for (j in row) {
        var square = row[j];
        maze.append("<div class='cell " + square + "'></div>");
      }
    }

var man = $("<div id='man'></div>")[0];

$(".start").append(man);

var cells = {}
var cellStore = [];

$(".cell").each(function(i, c) {
  var cell = $(c),
  position = cell.position(),
  x        = parseInt(position.left),
  y        = parseInt(position.top),
  width    = cell.width(),
  height   = cell.height(),
  maxX     = width + x,
  maxY     = height + y;

if (cells[x] === undefined) {
  cells[x] = {}
}

cells[x][y] = cell;
cellStore.push({
  left: x, 
  top: y, 
  right: maxX, 
  bottom: maxY, 
  width: width, 
  height: height, 
  cell: cell,
  id: x + "-" + y + "-" + maxX + "-" + maxY
});
});

Rx.Observable.prototype.only = function(o) {
  return this.filter(function(i) { return i == o; });
}

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

var cardinals     = ["left", "right", "up", "down"],
    allKeydowns   = $(document).toObservable("keydown"),
    allKeyups     = $(document).toObservable("keyup"),
    speedStream   = Rx.Observable.interval(5),
    particularKeyupStream = function(direction) {
      return Rx.Observable.create(function(observer) {
        var subscribed = true;

        allKeyups.map(eventToCardinal)
        .filter(function(cardinal) { 
          return cardinal == direction; 
        })
      .forEach(function(cardinal) {
        if (subscribed) {
          observer.onNext(cardinal);
          observer.onCompleted();
        }
      })

      return function() {
        subscribed = false;
      }
      })
    },
    disabled = {
      left: false,
      right: false,
      down: false,
      up: false
    },
    keyups = {
      up: particularKeyupStream("up"),
      down: particularKeyupStream("down"),
      left: particularKeyupStream("left"),
      right: particularKeyupStream("right")
    };

function cardinalNotDisabled(cardinal) {
  return disabled[cardinal] != true;
}

cardinals.map(function(cardinal) {
  allKeydowns
  .map(eventToCardinal)
  .distinctUntilEvent(keyups[cardinal])
  .only(cardinal)
  .flatMap(cardinalStream)
  .filter(function(cardinal) { return cardinalNotDisabled(cardinal); })
  .map(cardinalToInstruction)
  .forEach(moveMan);
});

function eventToCardinal(e) {
  return {
      37: "left",
      38: "up",
      39: "right",
      40: "down"
  }[e.which];
}

function cardinalToCSS(cardinal) {
  return {
      "left": "left",
      "right": "left",
      "up": "top",
      "down": "top"
  }[cardinal];
}

function cardinalStream(cardinal) {
  return speedStream.takeUntil(keyups[cardinal]).map(function() {
    return cardinal;
  });
}

function cardinalToInstruction(cardinal) {
  return { 
    direction: cardinalToCSS(cardinal),
    value:     mansPosition(cardinal)
  }
}

function moveMan(instruction) {
  man.style[instruction.direction] = instruction.value;
}

function mansX() {
  return pixeslToInt(man.style.left);
}

function mansY() {
  return pixelsToInt(man.style.top);
}

var speed = 1;

function otherCSS(css) {
  return css == "top" ? "left" : "top"
}

function pixelsToInt(pixels) {
  return (pixels == "" || pixels === undefined) ? 0 : parseInt(pixels);
}

function proposedNewPosition(cardinal, changingPosition, constantPosition) {
  if (cardinal == "left" || cardinal == "up") {
    changingPosition -= speed;
  } else {
    changingPosition += speed;
  }

  return precisePosition(cardinal, changingPosition, constantPosition);
}

function cardinalToChangingAxis(cardinal) {
  return {
    "up": "y",
    "down": "y",
    "left": "x",
    "right": "x"
  }[cardinal];   
}

function otherAxis(axis) {
  return {
    "y": "x",
    "x": "y"
  }[axis]
}

function precisePosition(cardinal, changingPosition, constantPosition) {
  var changingAxis = cardinalToChangingAxis(cardinal),
      constantAxis = otherAxis(changingAxis),
      coordinates  = {};

  coordinates[changingAxis] = changingPosition;
  coordinates[constantAxis] = constantPosition;

  return coordinates;
}

function intToPixels(int) {
  return int + "px";
}

function collision(proposedPosition) {
  var minX = proposedPosition.x,
      minY = proposedPosition.y,
      maxX = minX + 20,
      maxY = minY + 20,
      xes  = Object.keys(cells).map(parseFloat),
      cellDimensions = 26,
      xVals, yVals, cell;

  var collidingCells = _.filter(cellStore, function(cell) {
    return minX <= cell.left + cell.width &&
    maxX >= cell.left &&
    minY <= cell.top + cell.height &&
    maxY >= cell.top
  });

  return _.chain(collidingCells).map(function(cell) {
    var collisions = [];
    if (cell.bottom == minY) {
      collisions.push({
        type: "y", 
        location: minY, 
        cell: {
          collidesOn: "down",
        value: cell
        },
        man: {
          collidesOn: "up",
        value: man
        }
      });
    }
    if (cell.top == maxY) {
      collisions.push({
        type: "y", 
        location: maxY, 
        cell: {
          collidesOn: "up",
        value: cell
        },
        man: {
          collidesOn: "down",
        value: man
        }
      });
    }
    if (cell.right == minX) {
      collisions.push({
        type: "x",              
        location: minX, 
        cell: {
          collidesOn: "right",
        value: cell
        },
        man: {
          collidesOn: "left",
        value: man
        }
      });
    }
    if (cell.left == maxX) {
      collisions.push({
        type: "x", 
        location: maxX,
        cell: {
          collidesOn: "left",
        value: cell
        },
        man: {
          collidesOn: "right",
        value: man
        }
      });
    }

    return collisions;
  })
  .flatten()
    .groupBy(function(collision) { return collision.cell.value.id; })
    .filter(function(group) { return group.length == 1; })
    .flatten()
    .value();
}

function allowAllMoves() {
  disabled.left = false;
  disabled.right = false;
  disabled.up = false;
  disabled.down = false;
}

function disableMove(move) {
  disabled[move] = true;
}

function onCollision(collision) {
  return disableMove(collision.man.collidesOn);
}

function mansPosition(cardinal) {
  var changingAxis     = cardinalToChangingAxis(cardinal),
      constantAxis     = otherAxis(changingAxis),
      changingCSS      = cardinalToCSS(cardinal),
      constantCSS      = otherCSS(changingCSS),
      mansCoords       = $(man).position(),
      changingPosition = pixelsToInt(mansCoords[changingCSS]),
      constantPosition = pixelsToInt(mansCoords[constantCSS]),
      currentPosition  = precisePosition(cardinal, changingPosition, constantPosition),
      proposedPosition = proposedNewPosition(cardinal, changingPosition, constantPosition),
      colls            = collidingWalls(proposedPosition);

  allowAllMoves();

  _.each(colls, function(coll) { onCollision(coll); });

  return intToPixels(proposedPosition[changingAxis]);
}

function collidingWalls(proposedPosition) {
  return _.filter(collision(proposedPosition), function(coll) { 
    return coll.cell.value.cell.hasClass("wall");
  });
}
