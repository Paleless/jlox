const fs = require("fs");
const readline = require("readline");
const chalk = require("chalk");
const Scanner = require("./src/scanner");
const Parser = require("./src/parser");
const Interpreter = require("./src/interpreter");
const Resolver = require("./src/resolver");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const interpreter = new Interpreter();
const resolver = new Resolver(interpreter);
let hadError = false;

const args = process.argv.slice(2);
if (args.length === 1) {
  runFile(args[0]);
} else if (args.length === 0) {
  console.log("");
  console.log(chalk.bold.yellow("   Welcome to Lox :)"));
  console.log("");
  runPrompt();
} else {
  console.log("Usage: jlox [script]");
  process.exit();
}

function runFile(filepath) {
  fs.readFile(filepath, "utf-8", (err, raw) => {
    if (err) {
      console.log("Error: file not exist");
      process.exit(64);
    }
    try {
      run(raw);
    } catch (err) {
      report(err);
    } finally {
      process.exit(65);
    }
  });
}

function runPrompt() {
  rl.question(chalk.red("> "), (line) => {
    try {
      run(line);
    } catch (err) {
      report(err);
    }
    hadError = false;
    runPrompt();
  });
}

function run(raw) {
  const tokens = new Scanner(raw).scanTokens();
  const statements = new Parser(tokens).parse();
  resolver.resolve(...statements);
  interpreter.interpret(statements);
}

function report(err) {
  hadError = true;
  console.log(err);
}
