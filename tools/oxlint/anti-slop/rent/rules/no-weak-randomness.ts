import { defineRule } from "@oxlint/plugins";

/**
 * This codebase signs events and handles payment identifiers. Math.random is
 * never acceptable for anything that touches ids, nonces, salts, or keys, and
 * a payments repo has no safe "decorative" use worth the review burden.
 */
export const noWeakRandomnessRule = defineRule({
	meta: {
		type: "problem",
		docs: {
			description:
				"Disallow Math.random; use crypto.randomUUID or crypto.getRandomValues, or a seeded generator in tests.",
		},
		messages: {
			weakRandom:
				"Replace Math.random with crypto.randomUUID / crypto.getRandomValues (or a seeded generator in tests).",
		},
	},
	createOnce(context) {
		return {
			MemberExpression(node) {
				if (
					node.object.type === "Identifier" &&
					node.object.name === "Math" &&
					node.property.type === "Identifier" &&
					node.property.name === "random"
				) {
					context.report({ node, messageId: "weakRandom" });
				}
			},
		};
	},
});
