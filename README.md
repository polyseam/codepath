# Codepath

Deterministic, human-readable code locations (code paths) for debugging &
tooling.

`Codepath` captures the file path & AST context segments at runtime and emits a
DSL-defined path string. You can parse it with [Ohm](https://ohmjs.org/), or
convert it to clickable URIs (VSCode, file://) for editor integrations.

---

## Table of Contents

- [Features](#features)
- [Quickstart](#quickstart)
- [Examples](#examples)
- [DSL Grammar](#dsl-grammar)
- [API](#api)
- [Development](#development)

---

## Features

- **Precise AST context**: `if[condition="x"]/then/block[0]`,
  `forOf[expression="items"]`, `switch[...]/case[...]`, `try/catch/finally`,
  `class/MyClass/methodName`, `arrow[0]`, `block[0]`, etc.
- **Grammar-defined**: formal DSL spec in Ohm (`src/codepath.ohm`).
- **Editor URIs**: `toScheme("file")` → `file:///…:line:col`,
  `toScheme("vscode")` → `vscode://file/…:line:col`.
- **Minimal deps**: only `typescript` & `ohm-js`.
- **Tested**: robust Deno test suite.

---

## Quickstart

```ts
import { Codepath } from "./mod.ts";
import { loadOhmGrammar } from "./src/codepath-ohm.ts";

// Simple call site capture
const cp = new Codepath();
console.log(cp.toString());
// → example.ts/if[condition="true"]/then/block[0]

console.log(cp.toScheme("file"));
// → file:///…/example.ts:10:5

console.log(cp.toScheme("vscode"));
// → vscode://file/…/example.ts:10:5
```

Run it:

```bash
deno run --allow-read example.ts
```

---

## Examples

See [example.ts](example.ts) for a full demonstration, including DSL validation
against the grammar:

```bash
deno run -A example.ts
```

---

## DSL Grammar

The Codepath DSL grammar (Ohm) is defined in
[`src/codepath.ohm`](src/codepath.ohm):

```ohm
Codepath {
  Reference      = FilePath ("/" Segment)*
  FilePath       = Abs? PathComponent ("/" PathComponent)* "." Extension
  Abs            = "/"
  PathComponent  = PathChar+
  PathChar       = ~("/" | "[" | "]" | " " | ".") any
  Extension      = "ts" | "tsx" | "js" | "jsx"
  Segment        = Name Filter?
  Filter         = "[" (Index | PropertyFilter) "]"
  Name           = Identifier | Keyword
  Keyword        = "if" | "then" | "else"
                 | "for" | "forOf" | "forIn"
                 | "while" | "do"
                 | "switch" | "case" | "default"
                 | "try" | "catch" | "finally"
                 | "arrow" | "anon" | "block"
  Identifier     = loletter (loletter | digit)*
  Index          = digit+
  PropertyFilter = PropName "=" Literal
  PropName       = "name" | "condition" | "callee" | "expression"
  Literal        = StringLiteral | NumericLiteral
  StringLiteral  = "\"" (~"\"" any)* "\""
  NumericLiteral = digit+ ("." digit*)?
  loletter         = "_" | lower | upper
}
```

---

## API

### `new Codepath()`

Capture the call site and compute AST context segments.

### `cp.toString(): string`

Serialize to a DSL string: `"<relativePath>/<segment>/…"`.

### `cp.toScheme(scheme: "file"|"vscode"): string`

Format as a URI: `file:///abs/path:line:col` or
`vscode://file/abs/path:line:col`.

---

## Development

```bash
deno task test
deno fmt
deno lint
deno check
```
