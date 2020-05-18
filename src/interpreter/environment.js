const LoxError = require("../error");

class Environment {
  constructor(enclosing) {
    this.values = {};
    this.enclosing = enclosing;
  }

  define(name, value) {
    this.values[name] = value;
  }

  get(name) {
    if (name.lexeme in this.values) {
      return this.values[name.lexeme];
    }
    if (this.enclosing) {
      return this.enclosing.get(name);
    }
    throw new LoxError(name.line, "", `Undefined variable ${name.lexeme}.`);
  }

  ancestor(distance) {
    let result = this;
    let i = distance;
    while (i > 0) {
      result = result.enclosing;
      i--;
    }
    return result;
  }

  getAt(distance, name) {
    return this.ancestor(distance).get(name);
  }

  assign(name, value) {
    if (name.lexeme in this.values) {
      return (this.values[name.lexeme] = value);
    }

    if (this.enclosing) {
      return this.enclosing.assign(name, value);
    }

    throw new LoxError(name.line, "", `Undefined variable ${name.lexeme}.`);
  }

  assignAt(distance, name, value) {
    this.ancestor(distance).assign(name, value);
  }
}

module.exports = Environment;
