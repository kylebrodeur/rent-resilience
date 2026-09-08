import { defineRule } from "@oxlint/plugins";

const MONEY_NAME = /amount|price|due|balance|cents|minor|usdc|fee|rent|payout|total/iu;

interface NamedNode {
	type: string;
	name?: string;
	property?: { type: string; name?: string };
}

function moneyName(node: NamedNode): boolean {
	if (node.type === "Identifier" && node.name !== undefined) return MONEY_NAME.test(node.name);
	if (node.type === "MemberExpression" && node.property?.type === "Identifier") {
		return node.property.name !== undefined && MONEY_NAME.test(node.property.name);
	}
	return false;
}

/**
 * Money in this protocol is integers in minor units (see docs/protocol.md,
 * invariant 6). Floating-point parsing or cent/dollar conversion arithmetic on
 * money-named values is where rounding bugs enter; both are rejected here.
 */
export const noFloatMoneyRule = defineRule({
	meta: {
		type: "problem",
		docs: {
			description:
				"Disallow parseFloat and dollar/cent float arithmetic on money-named values; money is integer minor units.",
		},
		messages: {
			parseFloat:
				"Do not parseFloat money or anything else in this codebase. Parse money as integer minor units at the boundary.",
			floatMoneyMath:
				"Do not convert money with float arithmetic (`{{op}} {{literal}}`). Keep amounts as integer minor units end to end.",
		},
	},
	createOnce(context) {
		return {
			CallExpression(node) {
				if (node.callee.type === "Identifier" && node.callee.name === "parseFloat") {
					context.report({ node, messageId: "parseFloat" });
				}
			},
			BinaryExpression(node) {
				if (node.operator !== "*" && node.operator !== "/") return;
				const sides = [
					{ value: node.left, other: node.right },
					{ value: node.right, other: node.left },
				];
				for (const side of sides) {
					if (side.value.type !== "Literal") continue;
					const literal = side.value.value;
					if (literal !== 100 && literal !== 0.01) continue;
					if (!moneyName(side.other)) continue;
					context.report({
						node,
						messageId: "floatMoneyMath",
						data: { op: node.operator, literal: String(literal) },
					});
					return;
				}
			},
		};
	},
});
