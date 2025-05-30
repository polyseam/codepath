import * as ts from "typescript";
import { relative, toFileUrl } from "@std/path";

/**
 * Captures the call site and generates a deterministic, human-readable DSL
 * path through the AST for debugging purposes.
 */
export class Codepath {
  /** Absolute path to the source file containing the call site. */
  private filePath: string;
  /** Path to the source file relative to the current working directory. */
  private relPath: string;
  /** 1-based line number of the call site. */
  private line: number;
  /** 1-based column number of the call site. */
  private column: number;
  /** AST path segments following the file path. */
  private segments: string[];

  /**
   * Initialize Codepath by capturing the call site and computing the AST segments.
   */
  constructor() {
    const { file, line, column } = this.captureCallSite();
    this.filePath = Deno.realPathSync(file);
    this.relPath = relative(Deno.cwd(), this.filePath);
    this.line = line;
    this.column = column;

    this.segments = this.buildSegments();
  }

  /**
   * Return the raw DSL codepath string in the form:
   *   "<relativePath>/<segment1>/<segment2>/…"
   */
  toString(): string {
    return [this.relPath, ...this.segments].join("/");
  }

  /**
   * Format the call site as a URI for "file" or "vscode" schemes,
   * including line and column number.
   *
   * - "file":  file:///abs/path:line:col
   * - "vscode": vscode://file//abs/path:line:col
   */
  toScheme(scheme: "file" | "vscode"): string {
    const uriPath = toFileUrl(this.filePath).href;
    const loc = `:${this.line}:${this.column}`;
    const prefix = scheme === "file"
      ? uriPath
      : `vscode://file/${this.filePath}`;
    return `${prefix}${loc}`;
  }

  /**
   * Inspect the stack trace to find the first frame outside this module,
   * returning the file path (absolute) along with 1-based line and column.
   */
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

  /**
   * Read and parse the TypeScript source file, locate the AST node at the
   * call site, and walk up the tree to accumulate path segments.
   */
  private buildSegments(): string[] {
    const src = Deno.readTextFileSync(this.filePath);
    const sf = ts.createSourceFile(
      this.filePath,
      src,
      ts.ScriptTarget.Latest,
      true,
    );
    const pos = sf.getPositionOfLineAndCharacter(
      this.line - 1,
      this.column - 1,
    );

    const hit = this.findDeepestNode(sf, pos);
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
        segs.unshift(`${label}[${this.indexAmongSiblings(cur, cur.kind)}]`);
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
        const rawName = cur.variableDeclaration?.name.getText(sf) ?? "";
        const name = rawName.replace(/^_+/, "");
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
        segs.unshift(`block[${this.indexAmongSiblings(cur, cur.kind)}]`);
      }

      cur = cur.parent;
    }

    if (segs.length === 0) {
      segs.push("block[0]");
    }

    return segs;
  }

  /**
   * Recursively find the most-specific AST node that contains the given position.
   */
  private findDeepestNode(node: ts.Node, pos: number): ts.Node {
    for (const c of node.getChildren()) {
      if (c.getStart() <= pos && pos < c.getEnd()) {
        return this.findDeepestNode(c, pos);
      }
    }
    return node;
  }

  /**
   * Return the non-negative 0-based index of this node among its parent's
   * children of the same kind.
   */
  private indexAmongSiblings(node: ts.Node, kind: ts.SyntaxKind): number {
    const siblings =
      node.parent?.getChildren().filter((c) => c.kind === kind) || [];
    return Math.max(0, siblings.findIndex((c) => c === node));
  }
}
