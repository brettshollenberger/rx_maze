function Abilities() {
  this.abilities = [];
  this.disabled  = {};

  this.ability = function(ability) {
    this.abilities.push(ability);
    this.enable(ability);
  }

  this.disable = function(ability) {
    this.disabled[ability] = true;
  }

  this.enable = function(ability) {
    this.disabled[ability] = false;
  }
}
