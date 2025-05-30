import { loadOhmGrammar } from "./src/codepath-ohm.ts";
import { Codepath } from "./mod.ts";

// Generate a codepath for this call site and verify it matches the DSL grammar
function myFn() {
  const codepath = new Codepath();

  const grammar = loadOhmGrammar();
  const match = grammar.match(`${codepath}`);
  if (match.succeeded()) {
    console.log("✓ Valid codepath DSL");
  } else {
    console.error(`✗ Invalid codepath DSL: ${match.message}`);
    Deno.exit(1);
  }
  return codepath;
}

// deno-lint-ignore no-constant-condition
if (true) {
  const codepath = myFn();

  // Show platform-specific URLs
  console.log("Codepath:", codepath.toString());
  console.log("VSCode URL:", codepath.toScheme("vscode"));
  console.log("File URL:", codepath.toScheme("file"));
}
