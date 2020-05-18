const LoxError = require("../error");
const { TOKEN_ENUM, Keywords } = require("../config/");
const Token = require("./token");

class Scanner {
  constructor(source) {
    this.source = source;
    this.tokens = [];
    this.start = 0;
    this.current = 0;
    this.line = 1;
  }

  scanTokens() {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }
    this.addToken(TOKEN_ENUM.EOF, null);
    return this.tokens;
  }

  isAtEnd() {
    return this.current >= this.source.length;
  }

  scanToken() {
    const c = this.advance();
    const matchTable = {
      "(": () => {
        this.addToken(TOKEN_ENUM.LEFT_PAREN);
      },
      ")": () => {
        this.addToken(TOKEN_ENUM.RIGHT_PAREN);
      },
      "{": () => {
        this.addToken(TOKEN_ENUM.LEFT_BRACE);
      },
      "}": () => {
        this.addToken(TOKEN_ENUM.RIGHT_BRACE);
      },
      ".": () => {
        this.addToken(TOKEN_ENUM.DOT);
      },
      ",": () => {
        this.addToken(TOKEN_ENUM.COMMA);
      },
      "-": () => {
        this.addToken(TOKEN_ENUM.MINUS);
      },
      "+": () => {
        this.addToken(TOKEN_ENUM.PLUS);
      },
      ";": () => {
        this.addToken(TOKEN_ENUM.SEMICOLON);
      },
      "*": () => {
        this.addToken(TOKEN_ENUM.STAR);
      },
      "!": () => {
        this.addToken(
          this.match("=") ? TOKEN_ENUM.BANG_EQUAL : TOKEN_ENUM.BANG
        );
      },
      "=": () => {
        this.addToken(
          this.match("=") ? TOKEN_ENUM.EQUAL_EQUAL : TOKEN_ENUM.EQUAL
        );
      },
      "<": () => {
        this.addToken(
          this.match("=") ? TOKEN_ENUM.LESS_EQUAL : TOKEN_ENUM.LESS
        );
      },
      ">": () => {
        this.addToken(
          this.match("=") ? TOKEN_ENUM.GREATER_EQUAL : TOKEN_ENUM.GREATER
        );
      },
      "/": () => {
        if (this.match("/")) {
          while (this.peek() !== "/n" && !this.isAtEnd()) this.advance();
        } else {
          this.addToken(TOKEN_ENUM.SLASH);
        }
      },
      "\n": () => {
        this.line += 1;
      },
      " ": () => {},
      "\r": () => {},
      "\t": () => {},
      '"': () => {
        this.string();
      },
    };
    if (matchTable[c]) {
      matchTable[c]();
    } else if (isDigit(c)) {
      this.number();
    } else if (isAlpha(c)) {
      this.identifier();
    } else {
      throw new LoxError(this.line, "", "Unexpected character.");
    }
  }

  addToken(type, literal) {
    const text = this.source.slice(this.start, this.current);
    this.tokens.push(new Token(type, text, literal, this.line));
  }

  advance() {
    this.current += 1;
    return this.source[this.current - 1];
  }

  peek() {
    if (this.isAtEnd()) return "\0";
    return this.source[this.current];
  }

  peekNext() {
    if (this.current + 1 >= this.source.length) return "\0";
    return this.source[this.current + 1];
  }

  match(expected) {
    if (this.isAtEnd()) return false;
    if (this.source[this.current] !== expected) return false;
    this.current += 1;
    return true;
  }

  string() {
    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === "\n") this.line++;
      this.advance();
    }

    if (this.isAtEnd()) {
      throw new LoxError(this.line, "", "Unterminated string");
    }

    this.advance();
    this.addToken(
      TOKEN_ENUM.STRING,
      this.source.slice(this.start + 1, this.current - 1)
    );
  }

  number() {
    while (isDigit(this.peek())) this.advance();
    if (this.peek() === "." && isDigit(this.peekNext())) {
      this.advance();
      while (isDigit(this.peek())) this.advance();
    }
    this.addToken(
      TOKEN_ENUM.NUMBER,
      this.source.slice(this.start, this.current)
    );
  }

  identifier() {
    while (isAlphaNumeric(this.peek())) this.advance();
    const text = this.source.slice(this.start, this.current);
    const tokenType = Keywords[text] || TOKEN_ENUM.IDENTIFIER;
    this.addToken(tokenType);
  }
}

function isDigit(c) {
  return c >= "0" && c <= "9";
}

function isAlpha(c) {
  return c === "_" || (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
}

function isAlphaNumeric(c) {
  return isDigit(c) || isAlpha(c);
}
module.exports = Scanner;
