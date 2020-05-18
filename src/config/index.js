const TOKEN_ENUM = {
  LEFT_PAREN: 1,
  RIGHT_PAREN: 1,
  LEFT_BRACE: 1,
  RIGHT_BRACE: 1,
  COMMA: 1,
  DOT: 1,
  MINUS: 1,
  PLUS: 1,
  SEMICOLON: 1,
  SLASH: 1,
  STAR: 1,

  // One or two character tokens.
  BANG: 1,
  BANG_EQUAL: 1,
  EQUAL: 1,
  EQUAL_EQUAL: 1,
  GREATER: 1,
  GREATER_EQUAL: 1,
  LESS: 1,
  LESS_EQUAL: 1,

  // Literals.
  IDENTIFIER: 1,
  STRING: 1,
  NUMBER: 1,

  // Keywords.
  AND: 1,
  CLASS: 1,
  ELSE: 1,
  FALSE: 1,
  FUN: 1,
  FOR: 1,
  IF: 1,
  NIL: 1,
  OR: 1,
  PRINT: 1,
  RETURN: 1,
  SUPER: 1,
  THIS: 1,
  TRUE: 1,
  VAR: 1,
  WHILE: 1,

  EOF: 1,
};
for (const key in TOKEN_ENUM) {
  TOKEN_ENUM[key] = key;
}

const Keywords = {
  and: TOKEN_ENUM.AND,
  class: TOKEN_ENUM.CLASS,
  else: TOKEN_ENUM.ELSE,
  false: TOKEN_ENUM.FALSE,
  for: TOKEN_ENUM.FOR,
  fun: TOKEN_ENUM.FUN,
  if: TOKEN_ENUM.IF,
  nil: TOKEN_ENUM.NIL,
  or: TOKEN_ENUM.OR,
  print: TOKEN_ENUM.PRINT,
  return: TOKEN_ENUM.RETURN,
  super: TOKEN_ENUM.SUPER,
  this: TOKEN_ENUM.THIS,
  true: TOKEN_ENUM.TRUE,
  var: TOKEN_ENUM.VAR,
  while: TOKEN_ENUM.WHILE,
};

module.exports = {
  TOKEN_ENUM,
  Keywords,
};
