import {loadOhmGrammar} from './src/codepath-ohm.ts';

const g = loadOhmGrammar();
const match = g.match("src/codepath.ts/foo/if/then");

console.log('m',match.message); // Should print "src/codepath.ts/foo/if/then is not a valid codepath"