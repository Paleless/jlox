const Environment = require("./environment");
const { TOKEN_ENUM } = require("../config");
const LoxError = require("../error");
const Stmt = require("../parser/stmt");
const Expr = require("../parser/expression");

class Interpreter {
  constructor() {
    this.locals = new Map();
    this.globals = new Environment();
    this.environment = this.globals;
    this.globals.define(
      "clock",
      new LoxNaiveFunc(
        (_interpreter, _args) => {
          return new Date().toString();
        },
        () => 0
      )
    );
  }

  interpret(expressions) {
    expressions.forEach((expression) => expression.evaluate(this));
  }

  resolve(expr, depth) {
    this.locals.set(expr, depth);
  }

  lookUpVariable(name, expr) {
    const distance = this.locals.get(expr);
    if (distance !== undefined) {
      return this.environment.getAt(distance, name);
    } else {
      return this.globals.get(name);
    }
  }

  checkNumberOperand(operator, operand) {
    if (/\d+/.test(operand)) return;
    throw new LoxError(operator.line, operand, "Operand must be a number.");
  }

  evaluateClass(stmt) {
    this.environment.define(stmt.name.lexeme, null);

    let superclass = null;
    if (stmt.superclass) {
      superclass = stmt.superclass.evaluate(this);
      if (!(superclass instanceof LoxClass)) {
        throw new LoxError(
          stmt.superclass.name.line,
          stmt.superclass.name.lexeme,
          `Superclass must be a class.`
        );
      } else {
        this.environment = new Environment(this.environment);
        this.environment.define("super", superclass);
      }
    }

    const methods = stmt.methods.reduce((acc, method) => {
      const func = new LoxFunc(method, this.environment);
      acc[method.name.lexeme] = func;
      return acc;
    }, {});

    const klass = new LoxClass(stmt.name.lexeme, methods, superclass);

    if (superclass) {
      this.environment = this.environment.enclosing;
    }

    this.environment.assign(stmt.name, klass);
    return null;
  }

  evaluateSuper(expr) {
    const distance = this.locals.get(expr);
    const superclass = this.environment.getAt(distance, { lexeme: "super" });
    const object = this.environment.getAt(distance - 1, "this");
    const method = superclass.findMethod(expr.method.lexeme);

    if (!method) {
      throw new LoxError(
        expr.method.line,
        expr.keyword.lexeme,
        `Undefined property ${expr.method.lexeme}.`
      );
    }
    return method.bind(object);
  }

  evaluateLiteral(expr) {
    return expr.value;
  }

  evaluateBinary(expr) {
    const left = expr.left.evaluate(this);
    const right = expr.right.evaluate(this);
    const matchTable = {
      [TOKEN_ENUM.PLUS]: () => {
        return left + right;
      },
      [TOKEN_ENUM.MINUS]: () => {
        this.checkNumberOperand(expr.operator, left);
        this.checkNumberOperand(expr.operator, right);
        return left - right;
      },
      [TOKEN_ENUM.SLASH]: () => {
        this.checkNumberOperand(expr.operator, left);
        this.checkNumberOperand(expr.operator, right);
        return left / right;
      },
      [TOKEN_ENUM.STAR]: () => {
        this.checkNumberOperand(expr.operator, left);
        this.checkNumberOperand(expr.operator, right);
        return left * right;
      },
      [TOKEN_ENUM.GREATER]: () => {
        this.checkNumberOperand(expr.operator, left);
        this.checkNumberOperand(expr.operator, right);
        return left > right;
      },
      [TOKEN_ENUM.GREATER_EQUAL]: () => {
        this.checkNumberOperand(expr.operator, left);
        this.checkNumberOperand(expr.operator, right);
        return left >= right;
      },
      [TOKEN_ENUM.LESS]: () => {
        this.checkNumberOperand(expr.operator, left);
        this.checkNumberOperand(expr.operator, right);
        return left < right;
      },
      [TOKEN_ENUM.LESS_EQUAL]: () => {
        this.checkNumberOperand(expr.operator, left);
        this.checkNumberOperand(expr.operator, right);
        return left <= right;
      },
      [TOKEN_ENUM.BANG_EQUAL]: () => left != right,
      [TOKEN_ENUM.EQUAL_EQUAL]: () => left == right,
    };

    if (expr.operator.type in matchTable) {
      return matchTable[expr.operator.type]();
    } else {
      return null;
    }
  }

  evaluateUnary(expr) {
    const right = expr.right.evaluate(this);
    const matchTable = {
      [TOKEN_ENUM.MINUS]: () => {
        this.checkNumberOperand(expr.operator, right);
        return -right;
      },
      [TOKEN_ENUM.BANG]: () => !right,
    };

    if (expr.operator.type in matchTable) {
      return matchTable[expr.operator.type]();
    } else {
      return null;
    }
  }

  evaluateGrouping(expr) {
    return expr.expression.evaluate(this);
  }

  evaluateLogical(expr) {
    const left = expr.left.evaluate(this);

    if (expr.operator.type === TOKEN_ENUM.OR && left) return left;
    if (!left) return left;

    return expr.right.evaluate(this);
  }

  evaluateReturn(stmt) {
    const value = stmt.value ? stmt.value.evaluate(this) : null;
    throw {
      type: "return",
      value,
    };
  }

  evaluateFunctionStmt(stmt) {
    const func = new LoxFunc(stmt, this.environment);
    this.environment.define(stmt.name.lexeme, func);
    return null;
  }

  evaluateCall(expr) {
    const callee = expr.callee.evaluate(this);
    if (!(callee instanceof LoxFunc || callee instanceof LoxClass)) {
      throw new LoxError(
        expr.paren.line,
        "",
        "Can only call functions and classes."
      );
    }

    if (callee.arity() !== expr.args.length) {
      throw new LoxError(
        expr.paren.line,
        "",
        `Expected ${callee.arity()} arguments but got ${expr.args.length}.`
      );
    }

    const args = expr.args.map((arg) => arg.evaluate(this));

    return callee.call(this, args);
  }

  evaluateWhile(stmt) {
    while (stmt.condition.evaluate(this)) {
      stmt.body.evaluate(this);
    }
  }

  evaluateIf(stmt) {
    const condition = stmt.condition.evaluate(this);
    if (condition) {
      stmt.thenBranch.evaluate(this);
    } else if (stmt.elseBranch) {
      stmt.elseBranch.evaluate(this);
    }
  }

  evaluateBlock(stmt) {
    const previous = this.environment;
    try {
      this.environment = new Environment(previous);
      this.interpret(stmt.statements);
    } catch (err) {
      throw err;
    } finally {
      this.environment = previous;
    }
  }

  evaluateAssign(expr) {
    const value = expr.value.evaluate(this);

    const distance = this.locals.get(expr);
    if (distance !== undefined) {
      this.environment.assignAt(distance, expr.name, value);
    } else {
      this.globals.assign(expr.name, value);
    }
    return value;
  }

  evaluateVariable(expr) {
    return this.lookUpVariable(expr.name, expr);
  }

  evaluateVar(stmt) {
    const value = stmt.initializer ? stmt.initializer.evaluate(this) : null;
    this.environment.define(stmt.name.lexeme, value);
    return null;
  }

  evaluatePrint(stmt) {
    const value = stmt.expression.evaluate(this);
    console.log(value);
    return value;
  }

  evaluateExpression(stmt) {
    return stmt.expression.evaluate(this);
  }

  evaluateGet(expr) {
    const object = expr.object.evaluate(this);
    if (object instanceof LoxInstance) {
      return object.get(expr.name);
    }

    throw new LoxError(
      expr.name.line,
      expr.name.lexeme,
      "Only instances have properties."
    );
  }

  evaluateSet(expr) {
    const object = expr.object.evaluate(this);
    if (!(object instanceof LoxInstance)) {
      throw new LoxError(
        expr.name.line,
        expr.name,
        "Only instances have fields"
      );
    }

    const value = expr.value.evaluate(this);
    object.set(expr.name, value);
    return value;
  }

  evaluateThis(expr) {
    return this.lookUpVariable(expr.keyword, expr);
  }
}

class LoxClass {
  constructor(name, methods, superclass) {
    this.name = name;
    this.methods = methods;
    this.superclass = superclass;
  }

  call(interpreter, args) {
    const instance = new LoxInstance(this);
    const initializer = this.findMethod("init");
    if (initializer) {
      initializer.bind(instance).call(interpreter, args);
    }
    return instance;
  }

  findMethod(name) {
    if (name in this.methods) {
      return this.methods[name];
    }

    if (this.superclass) {
      return this.superclass.findMethod(name);
    }

    return null;
  }

  arity() {
    return 0;
  }

  toString() {
    return this.name;
  }
}

class LoxInstance {
  constructor(klass) {
    this.klass = klass;
    this.fields = new Map();
  }

  get(name) {
    if (this.fields.has(name.lexeme)) {
      return this.fields.get(name.lexeme);
    }

    const method = this.klass.findMethod(name.lexeme);
    if (method !== null) return method.bind(this);

    throw new LoxError(
      name.line,
      name.lexeme,
      `Undefined property "${name.lexeme}".`
    );
  }

  set(name, value) {
    this.fields.set(name.lexeme, value);
  }

  toString() {
    return this.klass.name + " instance";
  }
}

class LoxFunc {
  constructor(declaration, closure) {
    this.declaration = declaration;
    this.closure = closure;
  }

  call(interpreter, args) {
    const paramsDeclations = this.declaration.params.map((paramName, index) => {
      const paramValue = args[index];
      return new Stmt.Var(paramName, new Expr.Literal(paramValue));
    });

    const body = new Stmt.Block([
      ...paramsDeclations,
      ...this.declaration.body.statements,
    ]);

    const previous = interpreter.environment;
    try {
      interpreter.environment = this.closure;
      interpreter.evaluateBlock(body);
    } catch (err) {
      if (err.type === "return") {
        return err.value;
      } else {
        throw err;
      }
    } finally {
      interpreter.environment = previous;
    }
    return null;
  }

  bind(instance) {
    const env = new Environment(this.closure);
    env.define("this", instance);
    return new LoxFunc(this.declaration, env);
  }

  arity() {
    return this.declaration.params.length;
  }
}

class LoxNaiveFunc extends LoxFunc {
  constructor(call, arity) {
    super();
    this.call = call;
    this.arity = arity;
  }
}

module.exports = Interpreter;
