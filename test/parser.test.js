const {
  Unary,
  Binary,
  Literal,
  Grouping,
} = require("../src/parser/expression");
const Parser = require("../src/parser");
const Scanner = require("../src/scanner");
const Token = require("../src/scanner/token");

test("test expression normalize", () => {
  expect(new Literal(1).normalize()).toBe("1");
  expect(new Literal(null).normalize()).toBe("nil");
  expect(new Unary(new Token(null, "-"), new Literal(3)).normalize()).toBe(
    "(- 3)"
  );
  expect(
    new Binary(new Literal(3), new Token(null, "+"), new Literal(4)).normalize()
  ).toBe("(+ 3 4)");
  expect(new Grouping(new Literal(3)).normalize()).toBe("(group 3)");
  expect(
    new Unary(
      new Token(null, "-"),
      new Binary(
        new Literal(1),
        new Token(null, "+"),
        new Binary(new Literal(5), new Token(null, "-"), new Literal(4))
      )
    ).normalize()
  ).toBe("(- (+ 1 (- 5 4)))");
});

test("test parser parse tokens", () => {
  expect(parse("nil")).toBe("nil");
  expect(parse("1")).toBe("1");
  expect(parse("-1")).toBe("(- 1)");
  expect(parse("1+1")).toBe("(+ 1 1)");
  expect(parse("1==1")).toBe("(== 1 1)");
  expect(parse("1+5*2")).toBe("(+ 1 (* 5 2))");

  function parse(str) {
    const tokens = new Scanner(str).scanTokens();
    return new Parser(tokens).parse().normalize();
  }
});
