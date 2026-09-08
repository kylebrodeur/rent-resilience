import { RuleTester } from "oxlint/plugins-dev";

import { noFloatMoneyRule } from "./no-float-money.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

tester.run("anti-slop-rent/no-float-money", noFloatMoneyRule, {
	valid: [
		// Integer minor-unit arithmetic is the sanctioned path.
		"const totalMinor = amountDue + assistanceMinor;",
		// parseInt at a boundary is fine; the rule targets float parsing.
		"const amountDue = parseInt(raw, 10);",
		// Literal 100 against a non-money name is not a conversion smell.
		"const scaled = progress * 100;",
	],
	invalid: [
		{ code: "const x = parseFloat(input);", errors: [{ messageId: "parseFloat" }] },
		{ code: "const dollars = amountDue / 100;", errors: [{ messageId: "floatMoneyMath" }] },
		{ code: "const cents = price * 100;", errors: [{ messageId: "floatMoneyMath" }] },
		{ code: "const d = obligation.amountDue * 0.01;", errors: [{ messageId: "floatMoneyMath" }] },
	],
});

console.log("no-float-money: all RuleTester cases passed");
