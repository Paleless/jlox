class Literal {
  constructor(value) {
    this.value = value;
  }

  normalize() {
    return this.value === null ? "nil" : this.value.toString();
  }

  evaluate(interpreter) {
    return interpreter.evaluateLiteral(this);
  }
}

class Binary {
  constructor(left, operator, right) {
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  normalize() {
    return parenthesize(
      this.operator.lexeme,
      this.left.normalize(),
      this.right.normalize()
    );
  }

  evaluate(interpreter) {
    return interpreter.evaluateBinary(this);
  }
}

class Unary {
  constructor(operator, right) {
    this.operator = operator;
    this.right = right;
  }

  normalize() {
    return parenthesize(this.operator.lexeme, this.right.normalize());
  }

  evaluate(interpreter) {
    return interpreter.evaluateUnary(this);
  }
}

class Grouping {
  constructor(expression) {
    this.expression = expression;
  }

  normalize() {
    return parenthesize("group", this.expression.normalize());
  }

  evaluate(interpreter) {
    return interpreter.evaluateGrouping(this);
  }
}

class Variable {
  constructor(name) {
    this.name = name;
  }

  normalize() {}

  evaluate(interpreter) {
    return interpreter.evaluateVariable(this);
  }
}

class Assign {
  constructor(name, value) {
    this.name = name;
    this.value = value;
  }

  normalize() {}

  evaluate(interpreter) {
    return interpreter.evaluateAssign(this);
  }
}

class Logical {
  constructor(left, operator, right) {
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  evaluate(interpreter) {
    return interpreter.evaluateLogical(this);
  }
}

class Call {
  constructor(callee, paren, args) {
    this.callee = callee;
    this.paren = paren;
    this.args = args;
  }

  evaluate(interpreter) {
    return interpreter.evaluateCall(this);
  }
}

class Get {
  constructor(object, name) {
    this.object = object;
    this.name = name;
  }

  evaluate(interpreter) {
    return interpreter.evaluateGet(this);
  }
}

class SetExpr {
  constructor(object, name, value) {
    this.object = object;
    this.name = name;
    this.value = value;
  }

  evaluate(interpreter) {
    return interpreter.evaluateSet(this);
  }
}

class This {
  constructor(keyword) {
    this.keyword = keyword;
  }

  evaluate(interpreter) {
    return interpreter.evaluateThis(this);
  }
}

class Super {
  constructor(keyword, method) {
    this.keyword = keyword;
    this.method = method;
  }

  evaluate(interpreter) {
    return interpreter.evaluateSuper(this);
  }
}

function parenthesize(fn, ...params) {
  return `(${fn} ${params.join(" ")})`;
}

module.exports = {
  Super,
  This,
  Get,
  SetExpr,
  Unary,
  Binary,
  Literal,
  Grouping,
  Variable,
  Assign,
  Logical,
  Call,
};
