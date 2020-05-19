const { TOKEN_ENUM } = require("../config/");
const LoxError = require("../error");
const Expr = require("./expression");
const Stmt = require("./stmt");

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.current = 0;
  }

  parse() {
    const statements = [];
    while (!this.isAtEnd()) {
      const declaration = this.declaration();
      if (declaration) statements.push(declaration);
    }
    return statements;
  }

  declaration() {
    try {
      if (this.match(TOKEN_ENUM.CLASS)) return this.classDeclaration();
      if (this.match(TOKEN_ENUM.FUN)) return this.funDeclaration();
      if (this.match(TOKEN_ENUM.VAR)) return this.varDeclaration();
      return this.statement();
    } catch (err) {
      console.log(err);
      this.synchronize();
      return null;
    }
  }

  classDeclaration() {
    const name = this.consume(TOKEN_ENUM.IDENTIFIER, `Expect class name.`);

    let superclass = null;
    if (this.match(TOKEN_ENUM.LESS)) {
      this.consume(TOKEN_ENUM.IDENTIFIER, "Expect superclass name.");
      superclass = new Expr.Variable(this.previous());
    }

    this.consume(TOKEN_ENUM.LEFT_BRACE, `Expect '{' before class body.`);

    const methods = [];
    while (!this.check(TOKEN_ENUM.RIGHT_BRACE) && !this.isAtEnd()) {
      methods.push(this.funDeclaration());
    }

    this.consume(TOKEN_ENUM.RIGHT_BRACE, `Expect '}' after class body.`);
    return new Stmt.Class(name, methods, superclass);
  }

  funDeclaration() {
    const name = this.consume(TOKEN_ENUM.IDENTIFIER, `Expect function name.`);

    this.consume(TOKEN_ENUM.LEFT_PAREN, `Expect '(' after function name`);
    const params = [];
    if (!this.check(TOKEN_ENUM.RIGHT_PAREN)) {
      do {
        params.push(
          this.consume(TOKEN_ENUM.IDENTIFIER, "Expect parameter name.")
        );
      } while (this.match(TOKEN_ENUM.COMMA));
    }
    this.consume(TOKEN_ENUM.RIGHT_PAREN, "Expect ')' after parameters.");

    this.consume(TOKEN_ENUM.LEFT_BRACE, "Expect '{' before function body.");
    const body = this.block();

    return new Stmt.FunctionStmt(name, params, body);
  }

  varDeclaration() {
    const name = this.consume(TOKEN_ENUM.IDENTIFIER, "Expect variable name.");

    const initializer = this.match(TOKEN_ENUM.EQUAL) ? this.expression() : null;

    this.consume(
      TOKEN_ENUM.SEMICOLON,
      "Expect ';' after variable declaration."
    );
    return new Stmt.Var(name, initializer);
  }

  statement() {
    if (this.match(TOKEN_ENUM.RETURN)) return this.returnStatement();
    if (this.match(TOKEN_ENUM.FOR)) return this.forStatement();
    if (this.match(TOKEN_ENUM.WHILE)) return this.whileStatement();
    if (this.match(TOKEN_ENUM.IF)) return this.ifStatement();
    if (this.match(TOKEN_ENUM.PRINT)) return this.printStatement();
    if (this.match(TOKEN_ENUM.LEFT_BRACE)) return this.block();

    return this.expressionStatement();
  }

  returnStatement() {
    const keyword = this.previous();
    const value = this.check(TOKEN_ENUM.SEMICOLON) ? null : this.expression();
    this.consume(TOKEN_ENUM.SEMICOLON, "Expect ';' after return value.");
    return new Stmt.Return(keyword, value);
  }

  forStatement() {
    this.consume(TOKEN_ENUM.LEFT_PAREN, `expect '(' after 'for'.`);

    const initializer = this.match(TOKEN_ENUM.SEMICOLON)
      ? null
      : this.match(TOKEN_ENUM.VAR)
      ? this.varDeclaration()
      : this.expressionStatement();

    const condition = this.check(TOKEN_ENUM.SEMICOLON)
      ? new Expr.Literal(true)
      : this.expression();
    this.consume(TOKEN_ENUM.SEMICOLON, `expect ';' after for condition`);

    const increment = this.check(TOKEN_ENUM.RIGHT_PAREN)
      ? null
      : this.expression();
    this.consume(TOKEN_ENUM.RIGHT_PAREN, `expect ')' after for clauses`);

    const body = increment
      ? new Stmt.Block([this.statement(), new Stmt.Expression(increment)])
      : this.statement();

    if (initializer) {
      return new Stmt.Block([initializer, new Stmt.While(condition, body)]);
    } else {
      return new Stmt.While(condition, body);
    }
  }

  whileStatement() {
    this.consume(TOKEN_ENUM.LEFT_PAREN, `Expect '(' after while.)`);
    const condition = this.expression();
    this.consume(TOKEN_ENUM.RIGHT_PAREN, `expect ')' after condition.`);

    const body = this.statement();

    return new Stmt.While(condition, body);
  }

  ifStatement() {
    this.consume(TOKEN_ENUM.LEFT_PAREN, "Expect '(' after 'if'.");
    const condition = this.expression();
    this.consume(TOKEN_ENUM.RIGHT_PAREN, "Expect ')' after if condition.");

    const thenBranch = this.statement();
    const elseBranch = this.match(TOKEN_ENUM.ELSE) ? this.statement() : null;

    return new Stmt.If(condition, thenBranch, elseBranch);
  }

  printStatement() {
    const value = this.expression();
    this.consume(TOKEN_ENUM.SEMICOLON, `Expect ';' after value.`);
    return new Stmt.Print(value);
  }

  block() {
    const statements = [];

    while (!this.check(TOKEN_ENUM.RIGHT_BRACE) && !this.isAtEnd()) {
      statements.push(this.declaration());
    }

    this.consume(TOKEN_ENUM.RIGHT_BRACE, `Expect '}' after block.`);
    return new Stmt.Block(statements);
  }

  expressionStatement() {
    const value = this.expression();
    this.consume(TOKEN_ENUM.SEMICOLON, `Expect ';' after value.`);
    return new Stmt.Expression(value);
  }

  expression() {
    return this.assignment();
  }

  assignment() {
    const expr = this.or();

    if (this.match(TOKEN_ENUM.EQUAL)) {
      const value = this.assignment();

      if (expr instanceof Expr.Variable) {
        return new Expr.Assign(expr.name, value);
      } else if (expr instanceof Expr.Get) {
        return new Expr.SetExpr(expr.object, expr.name, value);
      } else {
        this.reportError("Invalid assignment target.");
      }
    }

    return expr;
  }

  or() {
    let expr = this.and();

    while (this.match(TOKEN_ENUM.OR)) {
      const operator = this.previous();
      const right = this.and();
      expr = new Expr.Logical(expr, operator, right);
    }
    return expr;
  }

  and() {
    let expr = this.equality();

    while (this.match(TOKEN_ENUM.AND)) {
      const operator = this.previous();
      const right = this.equality();
      expr = new Expr.Logical(expr, operator, right);
    }

    return expr;
  }

  equality() {
    let expr = this.comparsion();
    while (this.match(TOKEN_ENUM.BANG_EQUAL, TOKEN_ENUM.EQUAL_EQUAL)) {
      const operator = this.previous();
      const right = this.comparsion();
      expr = new Expr.Binary(expr, operator, right);
    }
    return expr;
  }

  comparsion() {
    let expr = this.addition();
    while (
      this.match(
        TOKEN_ENUM.GREATER,
        TOKEN_ENUM.GREATER_EQUAL,
        TOKEN_ENUM.LESS,
        TOKEN_ENUM.LESS_EQUAL
      )
    ) {
      const operator = this.previous();
      const right = this.addition();
      expr = new Expr.Binary(expr, operator, right);
    }
    return expr;
  }

  addition() {
    let expr = this.multiplication();

    while (this.match(TOKEN_ENUM.MINUS, TOKEN_ENUM.PLUS)) {
      const operator = this.previous();
      const right = this.multiplication();
      expr = new Expr.Binary(expr, operator, right);
    }

    return expr;
  }

  multiplication() {
    let expr = this.unary();

    while (this.match(TOKEN_ENUM.SLASH, TOKEN_ENUM.STAR)) {
      const operator = this.previous();
      const right = this.unary();
      expr = new Expr.Binary(expr, operator, right);
    }

    return expr;
  }

  unary() {
    if (this.match(TOKEN_ENUM.BANG, TOKEN_ENUM.MINUS)) {
      const operator = this.previous();
      const right = this.unary();
      return new Expr.Unary(operator, right);
    }

    return this.callExpression();
  }

  callExpression() {
    let expr = this.primary();
    while (true) {
      if (this.match(TOKEN_ENUM.LEFT_PAREN)) {
        expr = this.finishCall(expr);
      } else if (this.match(TOKEN_ENUM.DOT)) {
        const name = this.consume(
          TOKEN_ENUM.IDENTIFIER,
          `Expect property name after '.'.`
        );
        expr = new Expr.Get(expr, name);
      } else {
        break;
      }
    }

    return expr;
  }

  finishCall(callee) {
    const args = [];

    if (!this.check(TOKEN_ENUM.RIGHT_PAREN)) {
      do {
        if (args.length >= 255) {
          this.reportError("Cannot have more than 255 arguments.");
        }
        args.push(this.expression());
      } while (this.match(TOKEN_ENUM.COMMA));
    }

    const paren = this.consume(
      TOKEN_ENUM.RIGHT_PAREN,
      "Expect ')' after arguments."
    );

    return new Expr.Call(callee, paren, args);
  }

  primary() {
    if (this.match(TOKEN_ENUM.SUPER)) {
      const keyword = this.previous();
      this.consume(TOKEN_ENUM.DOT, `Expect '.' after super.`);
      const method = this.consume(
        TOKEN_ENUM.IDENTIFIER,
        "Expect superclass method name."
      );
      return new Expr.Super(keyword, method);
    }
    if (this.match(TOKEN_ENUM.THIS)) return new Expr.This(this.previous());
    if (this.match(TOKEN_ENUM.FALSE)) return new Expr.Literal(false);
    if (this.match(TOKEN_ENUM.TRUE)) return new Expr.Literal(true);
    if (this.match(TOKEN_ENUM.NIL)) return new Expr.Literal("nil");
    if (this.match(TOKEN_ENUM.NUMBER))
      return new Expr.Literal(Number(this.previous().literal));
    if (this.match(TOKEN_ENUM.STRING))
      return new Expr.Literal(this.previous().literal);
    if (this.match(TOKEN_ENUM.IDENTIFIER))
      return new Expr.Variable(this.previous());
    if (this.match(TOKEN_ENUM.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TOKEN_ENUM.RIGHT_PAREN, "Expect ')' after expression");
      return new Expr.Grouping(expr);
    }

    this.reportError("Expect expression");
  }

  consume(type, msg) {
    if (this.check(type)) return this.advance();
    this.reportError(msg);
  }

  match(...types) {
    if (types.some((type) => this.check(type))) {
      this.advance();
      return true;
    } else {
      return false;
    }
  }

  check(type) {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  advance() {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  isAtEnd() {
    return this.peek().type === TOKEN_ENUM.EOF;
  }

  peek() {
    return this.tokens[this.current];
  }

  previous() {
    return this.tokens[this.current - 1];
  }

  reportError(msg) {
    const token = this.peek();
    const where =
      token.type === TOKEN_ENUM.EOF ? "at end" : `at ${token.lexeme}`;
    throw new LoxError(token.line, `at ${where}`, msg);
  }

  synchronize() {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TOKEN_ENUM.SEMICOLON) return;
      if (
        [
          TOKEN_ENUM.CLASS,
          TOKEN_ENUM.FUN,
          TOKEN_ENUM.VAR,
          TOKEN_ENUM.FOR,
          TOKEN_ENUM.IF,
          TOKEN_ENUM.WHILE,
          TOKEN_ENUM.PRINT,
          TOKEN_ENUM.RETURN,
        ].includes(this.peek().type)
      )
        return;
      this.advance();
    }
  }
}

module.exports = Parser;
