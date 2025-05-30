import { loadOhmGrammar } from "./src/codepath-ohm.ts";

const g = loadOhmGrammar();
const input = `src/codepath.ts/foo/if[condition="name=matt"]/then`;
const match = g.match(input);

if (match.succeeded()) {
  console.log(`"${input}" is a valid codepath`);
} else {
  console.log(`"${input}" is not a valid codepath: ${match.message}`);
}
