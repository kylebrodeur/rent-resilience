import { defineRule } from "@oxlint/plugins";

interface CommentToken {
	type: "Line" | "Block";
	value: string;
	loc: {
		start: { line: number; column: number };
		end: { line: number; column: number };
	};
}

const DEFAULT_MAX_LINES = 4;

// A long comment is allowed when it is real documentation (JSDoc), a
// license/banner, a tooling directive, or an explicitly-marked rationale for
// genuinely hard code. `WHY:` / `SAFETY:` are the sanctioned escape hatches:
// the author asserts the complexity, exactly as `require-safety-comment` does.
const ALLOW_MARKER =
	/\b(?:WHY|SAFETY|SPDX-License-Identifier)\b|copyright|@(?:license|ts-|preserve)|eslint|oxlint|biome|prettier-ignore/iu;

function isAllowed(comment: CommentToken): boolean {
	// `/** ... */` JSDoc — documentation is always fine.
	if (comment.type === "Block" && comment.value.startsWith("*")) return true;
	return ALLOW_MARKER.test(comment.value);
}

/**
 * Reject large narration comments on ordinary code. Self-document with clear
 * names and small functions; reserve prose for genuinely hard logic (marked
 * `WHY:`) or API documentation (`/** *\/` JSDoc).
 */
export const noOversizedCommentsRule = defineRule({
	meta: {
		type: "suggestion",
		docs: {
			description:
				"Disallow oversized narration comments; keep comments for genuinely hard code or documentation.",
		},
		schema: [
			{
				type: "object",
				properties: { maxLines: { type: "number", minimum: 1 } },
				additionalProperties: false,
			},
		],
		messages: {
			oversizedComment:
				"This {{lines}}-line comment exceeds the {{max}}-line limit. Narrating obvious code is low-signal: simplify the code or let clear names carry it. Keep the comment only for genuinely hard logic — prefix it with `WHY:` — or use a `/** */` JSDoc comment to document an API.",
		},
	},
	createOnce(context) {
		const options = context.options as ReadonlyArray<{ maxLines?: number }> | undefined;
		const maxLines = options?.[0]?.maxLines ?? DEFAULT_MAX_LINES;

		const report = (comment: CommentToken, lines: number) => {
			context.report({
				loc: comment.loc,
				messageId: "oversizedComment",
				data: { lines: String(lines), max: String(maxLines) },
			});
		};

		return {
			Program() {
				const comments = context.sourceCode.getAllComments() as ReadonlyArray<CommentToken>;
				let i = 0;
				while (i < comments.length) {
					const first = comments[i];

					if (first.type === "Block") {
						const lines = first.loc.end.line - first.loc.start.line + 1;
						if (lines > maxLines && !isAllowed(first)) report(first, lines);
						i += 1;
						continue;
					}

					// Fold a run of adjacent `//` lines into one logical block.
					let last = i;
					while (
						last + 1 < comments.length &&
						comments[last + 1].type === "Line" &&
						comments[last + 1].loc.start.line === comments[last].loc.end.line + 1
					) {
						last += 1;
					}

					const runLength = last - i + 1;
					if (runLength > maxLines) {
						const run = comments.slice(i, last + 1);
						if (!run.some(isAllowed)) report(first, runLength);
					}
					i = last + 1;
				}
			},
		};
	},
});
