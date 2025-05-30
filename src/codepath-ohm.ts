import * as ohm from "npm:ohm-js";

export function loadOhmGrammar(): ohm.Grammar {
  const grammarText = Deno.readTextFileSync("src/codepath.ohm");
  return ohm.grammar(grammarText);
}
