const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const TARGET_DIR = path.join(__dirname, "src");
const EXTENSIONS = [".ts", ".tsx"];

function stripCommentsKeepLines(text) {
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    false,
    ts.LanguageVariant.JSX,
    text
  );

  let out = "";
  let pos = 0;
  const braceStack = [];

  function isCommentKind(kind) {
    return (
      kind === ts.SyntaxKind.SingleLineCommentTrivia ||
      kind === ts.SyntaxKind.MultiLineCommentTrivia
    );
  }

  function isTemplateOpenKind(kind) {
    return (
      kind === ts.SyntaxKind.TemplateHead || kind === ts.SyntaxKind.TemplateMiddle
    );
  }

  function processToken(kind) {
    const start = scanner.getTokenPos();
    const end = scanner.getTextPos();

    if (isCommentKind(kind)) {
      out += text.slice(pos, start);

      const lastNL = out.lastIndexOf("\n");
      const lineSoFar = out.slice(lastNL + 1);
      const isLineOnlyComment = /^[ \t]*$/.test(lineSoFar);

      if (isLineOnlyComment) {
        out = out.slice(0, lastNL + 1);
        let after = end;
        if (text[after] === "\r") after++;
        if (text[after] === "\n") after++;
        pos = after;
      } else {
        pos = end;
      }
    }
  }

  let kind = scanner.scan();
  while (kind !== ts.SyntaxKind.EndOfFileToken) {
    if (isTemplateOpenKind(kind)) {
      processToken(kind);
      braceStack.push("template");
      kind = scanner.scan();
      continue;
    }

    if (kind === ts.SyntaxKind.OpenBraceToken) {
      processToken(kind);
      braceStack.push("brace");
      kind = scanner.scan();
      continue;
    }

    if (kind === ts.SyntaxKind.CloseBraceToken) {
      const top = braceStack.pop();
      if (top === "template") {
        const resumed = scanner.reScanTemplateToken(false);
        processToken(resumed);
        if (resumed === ts.SyntaxKind.TemplateMiddle) {
          braceStack.push("template");
        }
        kind = scanner.scan();
        continue;
      }
      processToken(kind);
      kind = scanner.scan();
      continue;
    }

    processToken(kind);
    kind = scanner.scan();
  }

  out += text.slice(pos);
  return out;
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (EXTENSIONS.includes(path.extname(entry.name))) {
      const original = fs.readFileSync(full, "utf8");
      const stripped = stripCommentsKeepLines(original);
      if (stripped !== original) {
        fs.writeFileSync(full, stripped, "utf8");
        console.log("Dibersihkan:", path.relative(__dirname, full));
      }
    }
  }
}

walk(TARGET_DIR);
console.log("Selesai.");