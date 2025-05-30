import { loadOhmGrammar } from "./src/codepath-ohm.ts";
import { Codepath } from "./mod.ts";

// Generate a codepath for this call site and verify it matches the DSL grammar

const codepath = new Codepath();
const raw = codepath.toString();
console.log("Raw codepath:", raw);

const grammar = loadOhmGrammar();
const match = grammar.match(raw);
if (match.succeeded()) {
  console.log("✓ Valid codepath DSL");
} else {
  console.error(`✗ Invalid codepath DSL: ${match.message}`);
  Deno.exit(1);
}

// Show platform-specific URLs
console.log("VSCode URL:", codepath.toScheme("vscode"));
console.log("File URL:", codepath.toScheme("file"));
