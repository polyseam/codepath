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
<Reference>       ::= <FilePath> [ "/" <Segment> ( "/" <Segment> )* ]

# A file path (relative or absolute), ending in a recognized extension.
<FilePath>        ::= <PathChars>+ "." <Extension>
<Extension>       ::= "ts" | "tsx" | "js" | "jsx" | …  

<Segment>         ::= <Name> [ "[" ( <Index> | <PropertyFilter> ) "]" ]

# A Name is either a general identifier (e.g. class, function names)
# or one of the reserved Keywords for control structures.
<Name>            ::= <Identifier> | <Keyword>

<Keyword>         ::= "if" | "then" | "else"
                    | "for" | "forOf" | "forIn" | "while" | "do"
                    | "switch" | "case" | "default"
                    | "try" | "catch" | "finally"
                    | "arrow" | "anon" | "block"

<Identifier>      ::= <Alpha> ( <AlphaNum> | "_" )*

<Index>           ::= <Digit>+

<PropertyFilter>  ::= <PropName> "=" <Literal>

# PropName is the name of an AST node property
PropName          ::= "name"          # e.g. FunctionDeclaration.name
                    | "condition"     # e.g. IfStatement.expression
                    | "callee"        # e.g. CallExpression.expression
                    | "expression"    # e.g. CaseClause.expression
                    | …               # extendable per language needs

<Literal>         ::= <StringLiteral> | <NumericLiteral>

<StringLiteral>   ::= "\"" <StringChars>* "\""  
<NumericLiteral>  ::= <Digit>+ ( "." <Digit>* )?

<PathChars>       ::= any character except "/" or "[" or "]"

<Alpha>           ::= "A" … "Z" | "a" … "z" | "_"
<Digit>           ::= "0" … "9"
<AlphaNum>        ::= <Alpha> | <Digit>
```
