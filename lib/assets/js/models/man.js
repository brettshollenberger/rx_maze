function Man(options) {
  var man = options.selector;

  man.extend(Abilities);

  man.ability("up");
  man.ability("down");
  man.ability("left");
  man.ability("right");

  man.enableAllMoves = function() {
    _.each(man.abilities, function(ability) { man.enable(ability); });
  }

  return man;
}
