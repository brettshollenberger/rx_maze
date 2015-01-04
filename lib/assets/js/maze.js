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

var man = new Man({
  selector: $("<div id='man'></div>")[0]
});

$(".start").append(man);

var cellStore = [];

$(".cell").each(function(i, c) {
  var selector = $(c),
      position = selector.position(),
      left     = parseInt(position.left),
      top      = parseInt(position.top),
      width    = selector.width(),
      height   = selector.height();

  cellStore.push(new Cell({
    height: height,
    width: width,
    left: left,
    top:  top,
    selector: selector
  }))
});

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
  return man.disabled[cardinal] != true;
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

function collisions(proposedPosition) {
  var minX = proposedPosition.x,
      minY = proposedPosition.y,
      maxX = minX + 20,
      maxY = minY + 20;

  var collidingCells = _.filter(cellStore, function(cell) {
    return minX <= cell.left + cell.width &&
    maxX >= cell.left &&
    minY <= cell.top + cell.height &&
    maxY >= cell.top
  });

  return _.chain(collidingCells).map(function(cell) {
    var collisions = [];
    if (cell.bottom == minY) {
      collisions.push(
        Collision.top(cell).bottom(man).at(minY)
      );
    }
    if (cell.top == maxY) {
      collisions.push(
        Collision.top(man).bottom(cell).at(maxY)
      );
    }
    if (cell.right == minX) {
      collisions.push(
        Collision.left(cell).right(man).at(minX)
      );
    }
    if (cell.left == maxX) {
      collisions.push(
        Collision.left(man).right(cell).at(maxX)
      );
    }

    return collisions;
  })
  .flatten()
  .groupBy(function(collision) { return collision.detailsForOther(man).value.id; })
  .filter(function(group) { return group.length == 1; })
  .flatten()
  .value();
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
      colls            = collisions(proposedPosition);

  man.enableAllMoves();

  _.each(colls, function(coll) {
    _.chain(coll.objects)
     .map(function(object) {
       return object.value;
     })
     .each(function(object) {
      if (_.isFunction(object.onCollision)) {
        var otherObject = coll.detailsForOther(object).value;

        object.onCollision(otherObject, coll);
      }
    });
  });

  return intToPixels(proposedPosition[changingAxis]);
}
