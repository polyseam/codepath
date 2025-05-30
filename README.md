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

```bnf
<Reference>     ::= <FilePath> [ "/" <Segment> ( "/" <Segment> )* ]
<FilePath>      ::= <String>  # e.g. "src/utils/math.ts"

<Segment>       ::= <NamedDecl>
                  | <IfBranch>
                  | <ElseBranch>
                  | <Loop>
                  | <Block>
                  | <Switch>
                  | <Case>
                  | <Default>
                  | <Try>
                  | <Catch>
                  | <Finally>
                  | <ArrowFunc>
                  | <AnonFunc>

<NamedDecl>     ::= <Identifier>  # class, function or method name
<IfBranch>      ::= "if" [ "[" <Index> "]" ]
<ElseBranch>    ::= "else"
<Loop>          ::= ("for" | "forOf" | "forIn" | "while" | "do") [ "[" <Index> "]" ]
<Block>         ::= "block" [ "[" <Index> "]" ]
<Switch>        ::= "switch" [ "[" <Index> "]" ]
<Case>          ::= "case(" <Literal> ")"
<Default>       ::= "default"
<Try>           ::= "try"
<Catch>         ::= "catch"
<Finally>       ::= "finally"
<ArrowFunc>     ::= "arrow" [ "[" <Index> "]" ]
<AnonFunc>      ::= "anon" [ "[" <Index> "]" ]

<Identifier>    ::= (valid TypeScript identifier)
<Literal>       ::= (string or number or expression literal)
<Index>         ::= (non-negative integer, e.g. 0, 1, 2, …)
```
