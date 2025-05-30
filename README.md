# codepath

`codepath` is a language and library for generating and opening code paths in a
source tree

## Usage

```ts
import { Codepath } from "codepath";
import { squeeze } from "@polyseam/squeeze";
const fruits = ["apple", "orange", "grape"];

for (const fruit of fruits) {
  const juice = squeeze(fruit);
  if (juice === "orange") {
    const codepath = new Codepath();
    console.log(codepath); // /src/utils/juice.ts/for[0]/if[0]then
    const vscodeURL = codepath.toScheme("vscode");
    console.log(vscodeURL); // vscode://file/src/utils/juice.ts:7:4
    const fileURL = codepath.toScheme("file");
    console.log(fileURL); // file:///src/utils/juice.ts:7:4
  }
}
```

## spec

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
