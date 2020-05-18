const Scanner = require("../src/scanner/");
const LoxError = require("../src/error");

test("test scanner TOKENENUM", () => {
  expect(getFirstToken("").type === "EOF").toBe(true);
  expect(getFirstToken("(").type === "LEFT_PAREN").toBe(true);
  expect(getFirstToken(")").type === "RIGHT_PAREN").toBe(true);
  expect(getFirstToken("{").type === "LEFT_BRACE").toBe(true);
  expect(getFirstToken("}").type === "RIGHT_BRACE").toBe(true);
  expect(getFirstToken(".").type === "DOT").toBe(true);
  expect(getFirstToken(",").type === "COMMA").toBe(true);
  expect(getFirstToken("-").type === "MINUS").toBe(true);
  expect(getFirstToken("+").type === "PLUS").toBe(true);
  expect(getFirstToken(";").type === "SEMICOLON").toBe(true);
  expect(getFirstToken("*").type === "STAR").toBe(true);
  expect(getFirstToken("!").type === "BANG").toBe(true);
  expect(getFirstToken("!=").type === "BANG_EQUAL").toBe(true);
  expect(getFirstToken("=").type === "EQUAL").toBe(true);
  expect(getFirstToken("==").type === "EQUAL_EQUAL").toBe(true);
  expect(getFirstToken("<").type === "LESS").toBe(true);
  expect(getFirstToken("<=").type === "LESS_EQUAL").toBe(true);
  expect(getFirstToken(">").type === "GREATER").toBe(true);
  expect(getFirstToken(">=").type === "GREATER_EQUAL").toBe(true);
  expect(getFirstToken("/").type === "SLASH").toBe(true);
  expect(getFirstToken("//").type === "EOF").toBe(true);
  expect(getFirstToken(" ").type === "EOF").toBe(true);
  expect(getFirstToken("\r").type === "EOF").toBe(true);
  expect(getFirstToken("\t").type === "EOF").toBe(true);
});

test("test scanner string", () => {
  expect(getFirstToken(`"hello world"`).type === "STRING").toBe(true);
  expect(() => getTokens(`"`)).toThrow();
});
test("test scanner number", () => {
  expect(getFirstToken("1").type).toBe("NUMBER");
  expect(getFirstToken("2").type).toBe("NUMBER");
  expect(getFirstToken("3").type).toBe("NUMBER");
  expect(getFirstToken("9").type).toBe("NUMBER");
  expect(getFirstToken("10").type).toBe("NUMBER");
  expect(getFirstToken("101").type).toBe("NUMBER");
  expect(getFirstToken("1011").type).toBe("NUMBER");
  expect(getFirstToken("1011.11").type).toBe("NUMBER");
});
test("test scanner keyword and identifier", () => {
  expect(getFirstToken("if").type).toBe("IF");
  expect(getFirstToken("obj").type).toBe("IDENTIFIER");
});

function getTokens(str) {
  return new Scanner(str).scanTokens();
}

function getFirstToken(str) {
  return getTokens(str)[0];
}
