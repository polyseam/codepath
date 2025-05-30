// deno-lint-ignore-file no-constant-condition no-empty
import { assert, assertMatch, assertStringIncludes } from "@std/assert";
import { Codepath } from "../mod.ts";
import { loadOhmGrammar } from "../src/codepath-ohm.ts";

Deno.test("grammar matches known valid and invalid DSL strings", () => {
  const g = loadOhmGrammar();
  const valid = [
    "src/foo.ts/block[0]",
    'src/foo.ts/if[condition="x"]/then/block[0]',
    'src/foo.ts/forOf[expression="items"]/block[0]',
    'src/foo.ts/switch[expression="y"]/case[expression="1"]/block[0]/default/block[0]',
    'src/foo.ts/try/block[0]/catch[name="e"]/block[0]/finally/block[0]',
  ];
  for (const s of valid) {
    const res = g.match(s);
    assert(res.succeeded(), `Expected valid DSL: ${s}`);
  }

  const invalid = [
    "foo",
    "src/foo.txt/block[0]",
    "src/foo.ts/block[x]",
    "src/foo.ts/if[condition=x]/then",
  ];
  for (const s of invalid) {
    const res = g.match(s);
    assert(!res.succeeded(), `Expected invalid DSL: ${s}`);
  }
});

Deno.test("toString produces grammar-valid DSL strings", () => {
  const cp = new Codepath();
  const raw = cp.toString();
  const g = loadOhmGrammar();
  const match = g.match(raw);
  assert(match.succeeded(), `DSL did not match grammar: ${match.message}`);
});

Deno.test("toScheme formats file and vscode URIs correctly", () => {
  const cp = new Codepath();
  const fileUri = cp.toScheme("file");
  assertMatch(fileUri, /^file:\/\/\/.+:\d+:\d+$/);
  const vsUri = cp.toScheme("vscode");
  assertMatch(vsUri, /^vscode:\/\/file\/.+:\d+:\d+$/);
});

Deno.test("if statement then branch", () => {
  if (true) {
    const raw = new Codepath().toString();
    assertStringIncludes(raw, 'if[condition="true"]');
    assertStringIncludes(raw, "/then/");
    assertStringIncludes(raw, "/block[0]");
    assert(loadOhmGrammar().match(raw).succeeded());
  }
});

Deno.test("if statement else branch", () => {
  if (false) {
  } else {
    const raw = new Codepath().toString();
    assertStringIncludes(raw, 'if[condition="false"]');
    assertStringIncludes(raw, "/else/");
    assertStringIncludes(raw, "/block[0]");
    assert(loadOhmGrammar().match(raw).succeeded());
  }
});

Deno.test("for-of loop", () => {
  const items = [1, 2, 3];
  for (const _item of items) {
    const raw = new Codepath().toString();
    assertStringIncludes(raw, 'forOf[expression="items"]');
    assertStringIncludes(raw, "/block[0]");
    assert(loadOhmGrammar().match(raw).succeeded());
  }
});

Deno.test("for-in loop", () => {
  const obj = { a: 1, b: 2 };
  for (const _key in obj) {
    const raw = new Codepath().toString();
    assertStringIncludes(raw, 'forIn[expression="obj"]');
    assertStringIncludes(raw, "/block[0]");
    assert(loadOhmGrammar().match(raw).succeeded());
  }
});

Deno.test("for loop", () => {
  for (let i = 0; i < 1; i++) {
    const raw = new Codepath().toString();
    assertStringIncludes(raw, "/for/");
    assertStringIncludes(raw, "/block[0]");
    assert(loadOhmGrammar().match(raw).succeeded());
  }
});

Deno.test("while loop", () => {
  while (false) {
    const raw = new Codepath().toString();
    assertStringIncludes(raw, 'while[condition="false"]');
    assertStringIncludes(raw, "/block[0]");
    assert(loadOhmGrammar().match(raw).succeeded());
  }
});

Deno.test("do-while loop", () => {
  do {
    const raw = new Codepath().toString();
    assertStringIncludes(raw, "/do/");
    assertStringIncludes(raw, 'while[condition="false"]');
    assertStringIncludes(raw, "/block[0]");
    assert(loadOhmGrammar().match(raw).succeeded());
  } while (false);
});

Deno.test("switch-case-default", () => {
  const x = 1;
  switch (x) {
    case 1: {
      const raw1 = new Codepath().toString();
      assertStringIncludes(raw1, 'case[expression="1"]');
      assertStringIncludes(raw1, "/block[0]");
      assert(loadOhmGrammar().match(raw1).succeeded());
      break;
    }
    default: {
      const raw2 = new Codepath().toString();
      assertStringIncludes(raw2, "/default/");
      assertStringIncludes(raw2, "/block[0]");
      assert(loadOhmGrammar().match(raw2).succeeded());
    }
  }
});

Deno.test("try-catch-finally", () => {
  try {
    const raw1 = new Codepath().toString();
    assertStringIncludes(raw1, "/try/");
    assertStringIncludes(raw1, "/block[0]");
    assert(loadOhmGrammar().match(raw1).succeeded());
    throw new Error();
  } catch (_e) {
    const raw2 = new Codepath().toString();
    assertStringIncludes(raw2, 'catch[name="e"]');
    assertStringIncludes(raw2, "/block[0]");
    assert(loadOhmGrammar().match(raw2).succeeded());
  } finally {
    const raw3 = new Codepath().toString();
    assertStringIncludes(raw3, "/finally");
    assertStringIncludes(raw3, "/block[0]");
    assert(loadOhmGrammar().match(raw3).succeeded());
  }
});

Deno.test("class declaration and method", () => {
  class A {
    method() {
      const raw = new Codepath().toString();
      assertStringIncludes(raw, "/A/");
      assertStringIncludes(raw, "/method/");
      assertStringIncludes(raw, "/block[0]");
      assert(loadOhmGrammar().match(raw).succeeded());
    }
  }
  new A().method();
});

Deno.test("function declaration", () => {
  function foo() {
    const raw = new Codepath().toString();
    assertStringIncludes(raw, "/foo/");
    assertStringIncludes(raw, "/block[0]");
    assert(loadOhmGrammar().match(raw).succeeded());
  }
  foo();
});
