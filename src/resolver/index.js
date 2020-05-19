const LoxError = require("../error");

class Resolver {
  constructor(interpreter) {
    this.interpreter = interpreter;
    this.scopes = [{}];
    this.enterClass = false;
  }

  get scopePeek() {
    if (this.isScopesEmpty()) return null;
    return this.scopes[this.scopes.length - 1];
  }

  isScopesEmpty() {
    return this.scopes.length === 0;
  }

  beginScope() {
    this.scopes.push({});
  }

  endScope() {
    this.scopes.pop();
  }

  resolve(...statements) {
    statements.forEach((stmt) => stmt.evaluate(this));
  }

  resolveLocal(expr, name) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const scope = this.scopes[i];
      if (name.lexeme in scope) {
        return this.interpreter.resolve(expr, this.scopes.length - 1 - i);
      }
    }
  }

  declare(name) {
    if (this.isScopesEmpty()) return;
    if (name.lexeme in this.scopePeek) {
      throw new LoxError(
        name.line,
        "",
        "Variable with this name already declared in this scope."
      );
    }

    this.scopePeek[name.lexeme] = false;
  }
  define(name) {
    if (this.isScopesEmpty()) return;

    this.scopePeek[name.lexeme] = true;
  }

  evaluateBlock(stmt) {
    this.beginScope();
    this.resolve(...stmt.statements);
    this.endScope();
    return null;
  }

  evaluateVar(stmt) {
    this.declare(stmt.name);
    if (stmt.initializer) {
      this.resolve(stmt.initializer);
    }
    this.define(stmt.name);
    return null;
  }

  evaluateVariable(expr) {
    if (!this.isScopesEmpty() && this.scopePeek[expr.name.lexeme] === false) {
      throw new LoxError(
        expr.name.line,
        "",
        "Cannot read local variable in its own initializer."
      );
    }

    this.resolveLocal(expr, expr.name);
    return null;
  }

  evaluateClass(stmt) {
    const previousEnterClass = this.enterClass;
    this.enterClass = true;

    this.declare(stmt.name);
    this.define(stmt.name);

    if (
      stmt.superclass !== null &&
      stmt.name.lexeme === stmt.superclass.name.lexeme
    ) {
      throw new LoxError(
        stmt.superclass.name.line,
        stmt.superclass.name.lexeme,
        `A class cannot inherit from itself.`
      );
    }

    if (stmt.superclass) {
      this.beginScope();
      this.scopePeek["super"] = true;
      this.resolve(stmt.superclass);
    }

    this.beginScope();

    this.scopePeek["this"] = true;

    stmt.methods.forEach((method) => {
      this.evaluateFunctionStmt(method);
    });

    this.endScope();

    if (stmt.superclass) {
      this.endScope();
    }

    this.enterClass = previousEnterClass;
    return null;
  }

  evaluateSuper(expr) {
    if (this.enterClass === false) {
      throw new LoxError(
        stmt.keyword.line,
        stmt.keyword.lexeme,
        "Cannot use 'super' outside of class"
      );
    }
    this.resolveLocal(expr, expr.keyword);
    return null;
  }

  evaluateThis(expr) {
    if (this.enterClass === false) {
      throw new LoxError(
        stmt.keyword.line,
        stmt.keyword.lexeme,
        "Cannot use 'this' outside of class."
      );
    }

    this.resolveLocal(expr, expr.keyword);
    return null;
  }

  evaluateGet(expr) {
    this.resolve(expr.object);
    return null;
  }

  evaluateSet(expr) {
    this.resolve(expr.value);
    this.resolve(expr.object);
    return null;
  }

  evaluateLiteral(expr) {
    return null;
  }

  evaluateBinary(expr) {
    this.resolve(expr.left);
    this.resolve(expr.right);
    return null;
  }

  evaluateUnary(expr) {
    this.resolve(expr.right);
    return null;
  }

  evaluateGrouping(expr) {
    this.resolve(expr.expression);
    return null;
  }

  evaluateLogical(expr) {
    this.resolve(expr.left);
    this.resolve(expr.right);
    return null;
  }

  evaluateReturn(stmt) {
    if (this.scopes.length === 1) {
      throw new LoxError(
        stmt.keyword.line,
        stmt.keyword.lexeme,
        "Cannot return from top-level code."
      );
    }
    if (stmt.value !== null) {
      this.resolve(stmt.value);
    }
    return null;
  }

  evaluateFunctionStmt(stmt) {
    this.declare(stmt.name);
    this.define(stmt.name);

    this.beginScope();
    stmt.params.forEach((param) => {
      this.declare(param);
      this.define(param);
    });
    this.resolve(...stmt.body.statements);
    this.endScope();

    return null;
  }

  evaluateCall(expr) {
    this.resolve(expr.callee);

    expr.args.forEach(this.resolve);
    return null;
  }

  evaluateWhile(stmt) {
    this.resolve(stmt.condition);
    this.resolve(stmt.body);
    return null;
  }

  evaluateIf(stmt) {
    this.resolve(stmt.condition);
    this.resolve(stmt.thenBranch);
    if (stmt.elseBranch) this.resolve(stmt.elseBranch);
    return null;
  }

  evaluateAssign(expr) {
    this.resolve(expr.value);
    this.resolveLocal(expr, expr.name);
    return null;
  }

  evaluatePrint(stmt) {
    this.resolve(stmt.expression);
    return null;
  }

  evaluateExpression(stmt) {
    this.resolve(stmt.expression);
    return null;
  }
}

module.exports = Resolver;
