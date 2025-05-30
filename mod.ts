import * as ts from "npm:typescript@latest";
import { relative, toFileUrl } from "jsr:@std/path";

export class Codepath {
  private filePath: string; // absolute
  private relPath: string; // relative to cwd
  private line: number; // 1-based
  private column: number; // 1-based
  private segments: string[]; // AST path segments after the file

  constructor() {
    // 1) Figure out who called us
    const { file, line, column } = this.captureCallSite();
    this.filePath = Deno.realPathSync(file);
    this.relPath = relative(Deno.cwd(), this.filePath);
    this.line = line;
    this.column = column;

    // 2) Parse the file and build our codepath segments
    this.segments = this.buildSegments();
  }

  /** Returns the raw DSL: "<relPath>/<segment1>/<segment2>/…". */
  toString(): string {
    return [this.relPath, ...this.segments].join("/");
  }

  /**
   * Emits either:
   *  - file:// URL: `file:///abs/path:line:col`
   *  - vscode:// URL: `vscode://file//abs/path:line:col`
   */
  toScheme(scheme: "file" | "vscode"): string {
    const uriPath = toFileUrl(this.filePath).href; // e.g. "file:///home/…"
    const loc = `:${this.line}:${this.column}`;
    if (scheme === "file") {
      return uriPath + loc;
    } else {
      return `vscode://file/${this.filePath}${loc}`;
    }
  }

  /** Inspect Error.stack, find the first external frame, return file + 1-based line/col. */
  private captureCallSite(): { file: string; line: number; column: number } {
    const myFile = new URL(import.meta.url).pathname;
    const stack = (new Error().stack || "").split("\n").slice(1);
    for (const frame of stack) {
      const m = frame.match(/(file:\/\/\/[^():]+):(\d+):(\d+)/);
      if (m) {
        const filePath = new URL(m[1]).pathname;
        if (filePath !== myFile) {
          return {
            file: filePath,
            line: parseInt(m[2], 10),
            column: parseInt(m[3], 10),
          };
        }
      }
    }
    throw new Error("Could not determine caller location");
  }

  /** Read & parse the TS file, find the AST node at (line,col), ascend to build segments. */
  private buildSegments(): string[] {
    const src = Deno.readTextFileSync(this.filePath);
    const sf = ts.createSourceFile(
      this.filePath,
      src,
      ts.ScriptTarget.Latest,
      /*setParents*/ true,
    );
    const pos = sf.getPositionOfLineAndCharacter(
      this.line - 1,
      this.column - 1,
    );

    // 1. Find the deepest node containing pos
    const hit = this.findDeepestNode(sf, pos);

    // 2. Walk up, collecting segments
    const segs: string[] = [];
    let cur: ts.Node | undefined = hit;
    while (cur && cur.kind !== ts.SyntaxKind.SourceFile) {
      if (ts.isClassDeclaration(cur) && cur.name) {
        segs.unshift(cur.name.text);
      } else if (
        (ts.isFunctionDeclaration(cur) || ts.isMethodDeclaration(cur)) &&
        cur.name
      ) {
        segs.unshift((cur.name as ts.Identifier).text);
      } else if (ts.isArrowFunction(cur) || ts.isFunctionExpression(cur)) {
        const label = ts.isArrowFunction(cur) ? "arrow" : "anon";
        let idx = this.indexAmongSiblings(cur, cur.kind);
        if (idx < 0) idx = 0;
        segs.unshift(`${label}[${idx}]`);
      } else if (ts.isIfStatement(cur)) {
        const cond = cur.expression.getText(sf);
        const filter = `[condition=${JSON.stringify(cond)}]`;
        const then = cur.thenStatement;
        if (pos >= then.getStart() && pos < then.getEnd()) {
          segs.unshift("then");
        } else if (
          cur.elseStatement &&
          pos >= cur.elseStatement.getStart() &&
          pos < cur.elseStatement.getEnd()
        ) {
          segs.unshift("else");
        }
        segs.unshift(`if${filter}`);
      } else if (ts.isForOfStatement(cur)) {
        const expr = cur.expression.getText(sf);
        segs.unshift(`forOf[expression=${JSON.stringify(expr)}]`);
      } else if (ts.isForInStatement(cur)) {
        const expr = cur.expression.getText(sf);
        segs.unshift(`forIn[expression=${JSON.stringify(expr)}]`);
      } else if (ts.isForStatement(cur)) {
        segs.unshift("for");
      } else if (ts.isWhileStatement(cur)) {
        const cond = cur.expression.getText(sf);
        segs.unshift(`while[condition=${JSON.stringify(cond)}]`);
      } else if (ts.isDoStatement(cur)) {
        const cond = cur.expression.getText(sf);
        segs.unshift(`while[condition=${JSON.stringify(cond)}]`);
        segs.unshift("do");
      } else if (ts.isSwitchStatement(cur)) {
        const expr = cur.expression.getText(sf);
        segs.unshift(`switch[expression=${JSON.stringify(expr)}]`);
      } else if (ts.isCaseClause(cur)) {
        const expr = cur.expression.getText(sf);
        segs.unshift(`case[expression=${JSON.stringify(expr)}]`);
      } else if (ts.isDefaultClause(cur)) {
        segs.unshift("default");
      } else if (ts.isTryStatement(cur)) {
        segs.unshift("try");
      } else if (ts.isCatchClause(cur)) {
        const name = cur.variableDeclaration?.name.getText(sf);
        segs.unshift(
          name ? `catch[name=${JSON.stringify(name)}]` : "catch",
        );
      } else if (
        ts.isBlock(cur) &&
        ts.isTryStatement(cur.parent) &&
        (cur.parent as ts.TryStatement).finallyBlock === cur
      ) {
        segs.unshift("finally");
      } else if (ts.isBlock(cur)) {
        let idx = this.indexAmongSiblings(cur, cur.kind);
        if (idx < 0) idx = 0;
        segs.unshift(`block[${idx}]`);
      }

      cur = cur.parent;
    }

    // If no segments were collected (top-level code), use an implicit block
    if (segs.length === 0) {
      segs.push("block[0]");
    }

    return segs;
  }

  /** Recursively find the smallest node containing pos */
  private findDeepestNode(node: ts.Node, pos: number): ts.Node {
    for (const c of node.getChildren()) {
      if (c.getStart() <= pos && pos < c.getEnd()) {
        return this.findDeepestNode(c, pos);
      }
    }
    return node;
  }

  /** Among parent’s children of same kind, what is this node’s 0-based index? */
  private indexAmongSiblings(node: ts.Node, kind: ts.SyntaxKind): number {
    const siblings =
      node.parent?.getChildren().filter((c) => c.kind === kind) || [];
    return siblings.findIndex((c) => c === node);
  }
}
