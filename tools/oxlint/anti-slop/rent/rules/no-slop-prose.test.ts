import { RuleTester } from "oxlint/plugins-dev";

import { noSlopProseRule } from "./no-slop-prose.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

tester.run("anti-slop-rent/no-slop-prose", noSlopProseRule, {
	valid: [
		// Concrete product copy with facts and numbers is the sanctioned shape.
		'const description = "Rent Resilience early-access opt-in for agents";',
		// Money and rail facts in a template string.
		"`2.75% fee: $53 on $1,925`",
		// Code identifiers that merely contain a banned stem are not prose.
		"const leverageRatio = 0; // leverageRatio is a domain variable, not prose",
		// Domain terms that merely resemble banned words.
		"const robustParse = 1; // SAFETY: input validated at the boundary",
		// A comment quoting the rule name itself.
		"// no-slop-prose keeps reader-facing strings concrete",
	],
	invalid: [
		{
			code: 'const blurb = "Our seamless platform streamlines rent payments";',
			errors: [{ messageId: "slopWord" }],
		},
		{
			code: "const tagline = `Empower renters with a robust protocol`;",
			errors: [{ messageId: "slopWord" }],
		},
		{
			code: "// This delves into the intricate details of the ledger",
			errors: [{ messageId: "slopWord" }],
		},
		{
			code: "/* This game changer will transform the tapestry */",
			errors: [{ messageId: "slopWord" }],
		},
	],
});

console.log("no-slop-prose: all RuleTester cases passed");