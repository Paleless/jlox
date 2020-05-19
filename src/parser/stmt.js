class Expression {
  constructor(expression) {
    this.expression = expression;
  }

  evaluate(interpreter) {
    return interpreter.evaluateExpression(this);
  }
}

class Print {
  constructor(expression) {
    this.expression = expression;
  }

  evaluate(interpreter) {
    return interpreter.evaluatePrint(this);
  }
}

class Var {
  constructor(name, initializer) {
    this.name = name;
    this.initializer = initializer;
  }

  evaluate(interpreter) {
    return interpreter.evaluateVar(this);
  }
}

class Block {
  constructor(statements) {
    this.statements = statements;
  }

  evaluate(interpreter) {
    return interpreter.evaluateBlock(this);
  }
}

class If {
  constructor(condition, thenBranch, elseBranch) {
    this.condition = condition;
    this.thenBranch = thenBranch;
    this.elseBranch = elseBranch;
  }

  evaluate(interpreter) {
    return interpreter.evaluateIf(this);
  }
}

class FunctionStmt {
  constructor(name, params, body) {
    this.name = name;
    this.params = params;
    this.body = body;
  }

  evaluate(interpreter) {
    return interpreter.evaluateFunctionStmt(this);
  }
}

class While {
  constructor(condition, body) {
    this.condition = condition;
    this.body = body;
  }

  evaluate(interpreter) {
    return interpreter.evaluateWhile(this);
  }
}

class Return {
  constructor(keyword, value) {
    this.keyword = keyword;
    this.value = value;
  }

  evaluate(interpreter) {
    return interpreter.evaluateReturn(this);
  }
}

class Class {
  constructor(name, methods, superclass) {
    this.name = name;
    this.methods = methods;
    this.superclass = superclass;
  }

  evaluate(interpreter) {
    return interpreter.evaluateClass(this);
  }
}

module.exports = {
  Print,
  Expression,
  Var,
  Block,
  If,
  While,
  FunctionStmt,
  Return,
  Class,
};
