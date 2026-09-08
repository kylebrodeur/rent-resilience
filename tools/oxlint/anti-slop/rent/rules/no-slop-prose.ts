import { defineRule } from "@oxlint/plugins";

// The word list comes from Kyle's no-ai-slop editing rules (words banned
// outright): filler that survives only where a concrete fact should be.
// Applied to string literals and comments, i.e. the surfaces a reader or an
// API consumer actually sees. Code identifiers are not prose; `WordBoundary`
// matching keeps `utilizes`-style variants in and `MyLeverageHelper` out.
const SLOP_WORDS: ReadonlyArray<[string, RegExp]> = [
	["delve", /\bdelving\b|\bdelve(?:s|d)?\b/iu],
	["foster", /\bfoster(?:s|ed|ing)?\b/iu],
	["leverage", /\bleverag(?:e|es|ed|ing)\b/iu],
	["utilize", /\butiliz(?:e|es|ed|ing)\b/iu],
	["facilitate", /\bfacilitat(?:e|es|ed|ing)\b/iu],
	["empower", /\bempower(?:s|ed|ing)?\b/iu],
	["streamline", /\bstreamlin(?:e|es|ed|ing)\b/iu],
	["robust", /\brobust(?:ness|ly)?\b/iu],
	["seamless", /\bseamless(?:ly)?\b/iu],
	["cutting-edge", /\bcutting-edge\b/iu],
	["paradigm-shift", /\bparadigm shift\b/iu],
	["game-changer", /\bgame changer\b/iu],
	["tapestry", /\btapestry\b/iu],
	["realm", /\brealm\b/iu],
	["beacon", /\bbeacon\b/iu],
	["multifaceted", /\bmultifaceted\b/iu],
	["meticulous", /\bmeticulous(?:ly)?\b/iu],
	["intricate", /\bintricate(?:ly)?\b/iu],
	["paramount", /\bparamount\b/iu],
	["transformative", /\btransformative\b/iu],
	["elevate", /\belevat(?:e|es|ed|ing)\b/iu],
	["embark", /\bembark(?:s|ed|ing)?\b/iu],
	["supercharge", /\bsupercharg(?:e|es|ed|ing)\b/iu],
	["harness-verb", /\bharness(?:es|ed|ing)?\s+(?:the|your|our|its|all|this)\b/iu],
	["ever-evolving", /\bever-evolving\b/iu],
];

interface LiteralNode {
	type: string;
	value?: unknown;
	quasis?: ReadonlyArray<{ value: { cooked?: string } }>;
}

interface CommentToken {
	type: "Line" | "Block";
	value: string;
	loc: {
		start: { line: number; column: number };
		end: { line: number; column: number };
	};
}

function literalText(node: LiteralNode): string | undefined {
	if (node.type === "Literal" && typeof node.value === "string") return node.value;
	if (node.type === "TemplateLiteral" && node.quasis !== undefined) {
		return node.quasis.map((quasi) => quasi.value.cooked ?? "").join(" ");
	}
	return undefined;
}

/**
 * Reader-facing prose (user-visible strings, API copy, comments) carries the
 * repo's voice. Filler words are where a concrete fact was skipped; replace
 * the word with the fact or drop it.
 */
export const noSlopProseRule = defineRule({
	meta: {
		type: "suggestion",
		docs: {
			description:
				"Disallow AI-slop filler words in string literals and comments; state the concrete fact instead.",
		},
		messages: {
			slopWord:
				"\"{{word}}\" is filler prose ({{where}}). Replace it with the concrete fact it stands in for, or drop it.",
		},
	},
	createOnce(context) {
		const check = (text: string) => {
			for (const [word, pattern] of SLOP_WORDS) {
				if (pattern.test(text)) return word;
			}
			return undefined;
		};

		return {
			Literal(node) {
				const text = literalText(node as unknown as LiteralNode);
				const word = text === undefined ? undefined : check(text);
				if (word !== undefined) {
					context.report({ node, messageId: "slopWord", data: { word, where: "string" } });
				}
			},
			TemplateLiteral(node) {
				const text = literalText(node as LiteralNode);
				const word = text === undefined ? undefined : check(text);
				if (word !== undefined) {
					context.report({ node, messageId: "slopWord", data: { word, where: "template string" } });
				}
			},
			Program() {
				const comments = context.sourceCode.getAllComments() as ReadonlyArray<CommentToken>;
				for (const comment of comments) {
					const word = check(comment.value);
					if (word !== undefined) {
						context.report({
							loc: comment.loc,
							messageId: "slopWord",
							data: { word, where: "comment" },
						});
					}
				}
			},
		};
	},
});