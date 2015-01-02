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

var man  = $("#man")[0],
    maze = $("#maze"),
    o    = "open",
    w    = "wall",
    cellMap = [
        [o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, w, w, w],
        [o, w, w, o, w, w, o, w, o, w, w, w, w, w, w, o, w, w, w],
        [o, o, o, o, o, o, o, w, o, w, o, o, o, o, o, w, w, w, w],
        [o, w, o, w, w, w, o, w, o, w, o, w, o, w, o, w, w, w, w],
        [o, w, o, w, w, w, o, w, o, w, o, w, o, w, o, w, o, o, o],
        [o, o, o, w, o, o, o, w, o, w, o, w, o, w, o, w, w, w, w],
        [o, w, o, w, w, w, o, w, w, w, o, w, o, w, o, o, o, w, w],
        [o, w, o, w, w, w, o, o, o, o, o, w, w, w, w, w, o, w, w],
        [o, w, o, o, o, w, o, w, w, w, w, w, o, w, o, o, o, w, w],
        [o, w, o, w, o, w, o, o, w, o, o, o, o, w, w, w, o, w, w],
        [o, w, o, w, o, w, o, o, o, o, w, o, w, w, o, o, o, w, w],
        [o, w, o, w, o, w, o, o, w, o, w, o, w, o, o, w, w, o, o],
        [o, w, o, w, o, o, o, o, w, o, w, w, o, o, w, w, w, o, w],
        [o, w, o, w, o, w, o, w, w, o, w, w, w, o, o, o, o, o, w],
        [o, w, o, w, w, w, w, w, o, o, w, o, o, o, o, w, w, w, w],
        [o, o, o, o, o, o, o, w, o, w, w, o, w, w, w, w, o, o, o],
        [o, w, o, w, w, w, w, w, o, w, w, o, o, o, o, o, o, w, w],
        [o, w, o, w, w, w, o, o, o, o, o, w, w, w, w, w, w, w, w],
        [o, o, o, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w]
    ];

for (i in cellMap) {
    var row = cellMap[i];
    for (j in row) {
        var square = row[j];
        maze.append("<div class='cell " + square + "'></div>");
    }
}

var cells = {};

$(".cell").each(function(i, c) {
    var cell = $(c),
        position = cell.position(),
        x        = parseInt(position.left),
        y        = parseInt(position.top);
    
    if (cells[x] === undefined) {
        cells[x] = {}
    }
    
    cells[x][y] = cell;
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
    keyups = {
        up: particularKeyupStream("up"),
        down: particularKeyupStream("down"),
        left: particularKeyupStream("left"),
        right: particularKeyupStream("right")
    };

cardinals.map(function(cardinal) {
    allKeydowns
        .map(eventToCardinal)
        .distinctUntilEvent(keyups[cardinal])
        .only(cardinal)
        .flatMap(cardinalStream)
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
    
    for (var i = 0, l=xes.length; i<l; i++) {
        if (xVals === undefined) {
            var cellMinX = xes[i],
                cellMaxX = cellMinX + cellDimensions;

            if (minX >= cellMinX && minX <= cellMaxX) {
                var adjacentCellMinX = xes[i+1];
                
                if (maxX >= adjacentCellMinX) {
                    xVals = [cellMinX, adjacentCellMinX];
                } else {
                    xVals = [cellMinX];
                }
            }
        }
    }
    
    return _.chain(xVals)
    .map(function(x) { 
        return cells[x];
    })
    .map(function(yGroup) {
        var ys = Object.keys(yGroup).map(parseFloat),
            ret = [];
        
        for (var i = 0, l=ys.length; i<l; i++) {
            var cellMinY = ys[i],
                cellMaxY = cellMinY + cellDimensions;
            
            if ((minY >= cellMinY && minY <= cellMaxY) || 
                (maxY >= cellMinY && maxY <= cellMaxY)) {
                ret.push(yGroup[cellMinY]);
            }
        }
         
        return ret;
    })
    .flatten()
    .map(function(cell) {
        return cell.attr("class");
    })
    .filter(function(klass) {
        return klass.match(/wall/) != null;
    })
    .value()
    .length > 0;
}

function mansPosition(cardinal) {
    var changingAxis     = cardinalToChangingAxis(cardinal),
        changingCSS    = cardinalToCSS(cardinal),
        constantCSS    = otherCSS(changingCSS),
        changingPosition = pixelsToInt(man.style[changingCSS]),
        constantPosition = pixelsToInt(man.style[constantCSS]),
        currentPosition  = precisePosition(cardinal, changingPosition, constantPosition),
        proposedPosition = proposedNewPosition(cardinal, changingPosition, constantPosition);
        
    if (collision(proposedPosition)) {
        return intToPixels(currentPosition[changingAxis]);
    } else {
        return intToPixels(proposedPosition[changingAxis]);
    }
}
