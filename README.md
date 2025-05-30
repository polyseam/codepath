# codepath

`codepath` is a language and library for generating and opening code paths in a source tree


## Usage

### generate

```ts
import { generate } from 'codepath';
import { squeeze } from '@polyseam/squeeze';

for(const juice of [
  'apple',
  'orange',
  'grape',
]) {
  const juicePath = squeeze(juice);
  if(juice==='orange') {
    const codepath = generate();
    console.log(codepath); // 
  }
}
```

### 

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