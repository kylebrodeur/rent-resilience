import { eslintCompatPlugin } from "@oxlint/plugins";

import { noFloatMoneyRule } from "./rules/no-float-money.ts";
import { noOversizedCommentsRule } from "./rules/no-oversized-comments.ts";
import { noWeakRandomnessRule } from "./rules/no-weak-randomness.ts";

/**
 * Rent Resilience rules layered on the vendored generic anti-slop set: the
 * comment-discipline rule plus two crypto/payments tripwires. Kept in a
 * separate plugin group so re-vendoring upstream rules/ and shared/ never
 * touches local policy.
 */
const antiSlopRentPlugin = eslintCompatPlugin({
	meta: { name: "anti-slop-rent" },
	rules: {
		"no-float-money": noFloatMoneyRule,
		"no-oversized-comments": noOversizedCommentsRule,
		"no-weak-randomness": noWeakRandomnessRule,
	},
});

export default antiSlopRentPlugin;
