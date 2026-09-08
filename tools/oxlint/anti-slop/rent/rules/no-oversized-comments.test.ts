import { RuleTester } from "oxlint/plugins-dev";

import { noOversizedCommentsRule } from "./no-oversized-comments.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });
const error = { messageId: "oversizedComment" };

tester.run("anti-slop-uofd/no-oversized-comments", noOversizedCommentsRule, {
	valid: [
		// Small comments are fine.
		"// one line\nconst x = 1;",
		"// two\n// lines\nconst x = 1;",
		// Exactly at the default 4-line limit.
		"// a\n// b\n// c\n// d\nconst x = 1;",
		// JSDoc documentation is always allowed, regardless of length.
		"/**\n * Documented API surface.\n * spanning\n * several\n * lines\n * is fine\n */\nexport function f() {}",
		// Explicit WHY: escape hatch for genuinely hard logic.
		"// WHY: the upstream API has no batch endpoint, so we page manually and\n// dedupe across pages to avoid double-counting, which the vendor confirmed\n// is expected for cursor pagination and cannot be simplified without server\n// changes we do not control, so these lines document a real constraint\n// rather than narrating obvious code\nconst y = 2;",
		// Non-adjacent short comments do not fold into one block.
		"// header\nconst a = 1;\n// footer\nconst b = 2;\n// tail\nconst c = 3;\n// more\nconst d = 4;\n// even more\nconst e = 5;",
	],
	invalid: [
		// 5-line narration run of obvious code.
		{
			code: "// step one do a thing\n// step two do another\n// step three keep going\n// step four almost there\n// step five done narrating obvious code\nconst a = 1;",
			errors: [error],
		},
		// Oversized non-JSDoc block comment.
		{
			code: "/*\n narrating\n obvious\n simple\n assignment\n here\n*/\nconst b = 2;",
			errors: [error],
		},
	],
});

console.log("no-oversized-comments: all RuleTester cases passed");
