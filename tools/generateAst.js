const fs = require("fs");

const args = process.argv.slice(2);
if (args.length !== 1) {
  console.log("Uaage: generate_ast <output directory>");
  process.exit(64);
}

const outputPath = args[0];
defineAst(outputPath, "Expr", {
  Binary: ["left", "operator", "right"],
  Grouping: ["expression"],
  Literal: ["value"],
  Unary: ["operator", "right"],
});

function defineAst(outputPath, baseClassName, list) {
  fs.writeFileSync(outputPath, "");
  const wirter = fs.createWriteStream(outputPath);
  wirter.write(`
  class ${baseClassName} {}
  `);
  for (const className in list) {
    const params = list[className];
    const paramsSetStatement = params
      .map((param) => `this.${param} = ${param}`)
      .join("\n");
    wirter.write(`
    class ${className} extends ${baseClassName} {
      constructor(${params.join(", ")}) {
        super();
        ${paramsSetStatement}
      }
    }
    `);
  }
  wirter.close();
}
