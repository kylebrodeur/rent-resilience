import { RuleTester } from "oxlint/plugins-dev";

import { noWeakRandomnessRule } from "./no-weak-randomness.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

tester.run("anti-slop-rent/no-weak-randomness", noWeakRandomnessRule, {
	valid: [
		"const id = crypto.randomUUID();",
		"const bytes = crypto.getRandomValues(new Uint8Array(32));",
		"const rounded = Math.round(x);",
	],
	invalid: [
		{ code: "const n = Math.random();", errors: [{ messageId: "weakRandom" }] },
		{ code: "const id = `evt_${Math.random()}`;", errors: [{ messageId: "weakRandom" }] },
	],
});

console.log("no-weak-randomness: all RuleTester cases passed");
