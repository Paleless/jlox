class LoxError {
  constructor(line, where, msg) {
    this.line = line;
    this.where = where;
    this.msg = msg;
  }

  toString() {
    return `[line ${this.line} Error ${this.where}: ${this.msg}]`;
  }
}

module.exports = LoxError;
