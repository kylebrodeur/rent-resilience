/**
 * Custom markdownlint rule carrying Kyle's publish-gate checks: the same codes
 * and messages as validate_publish_markdown.py, so markdown findings read
 * identically across both tools. HTML keeps going through the Python gate;
 * this rule owns markdown. Dependency-free CJS so the file can be vendored
 * into other repos (e.g. Personal-Publishing-Plan) as-is.
 */

"use strict";

const REDUNDANT_CURRENCY = /\$\d+(?:\.\d+)?\s+dollars?\b/i;
const ITALIC_CAPTION = /^\*[^*].*\*\s*$/;
const MARKDOWN_IMAGE = /^\s*!\[([^]]*)\]\(([^)]+)\)\s*$/;
const FENCE = /^\s*(?:```|~~~)/;

// Built-in markdownlint rules already cover heading spacing (MD022) and
// image alt text (MD045); this rule adds only what built-ins lack.
module.exports = {
	names: ["rr-publish-gate"],
	tags: ["prose"],
	description: "Publish gate: dash ban, editorial markers, redundant currency, image captions",
	function: (params, onError) => {
		let inCodeFence = false;

		params.lines.forEach((line, index) => {
			const lineNumber = index + 1;

			if (FENCE.test(line)) {
				inCodeFence = !inCodeFence;
				return;
			}
			if (inCodeFence) return;

			const fail = (detail) =>
				onError({
					lineNumber,
					detail,
					// Highlight the offending characters where they are.
					context: line.trim().slice(0, 60),
				});

			if (line.includes("—") || line.includes("–")) {
				fail("dash: Replace em/en dashes in publish-bound text.");
			}

			if (line.includes("[[KB:")) {
				fail("editor-note: Resolve the [[KB: ...]] editorial note.");
			}

			if (line.includes("<mark>")) {
				fail("review-mark: Accept or reject the marked revision before staging.");
			}

			if (line.includes("![[")) {
				fail("obsidian-image: Replace the Obsidian embed with portable Markdown image syntax.");
			}

			if (REDUNDANT_CURRENCY.test(line)) {
				fail("redundant-currency-unit: Use either the currency symbol or the word dollars, not both.");
			}

			const image = MARKDOWN_IMAGE.exec(line);
			if (image) {
				// A caption is the next non-blank line in italic syntax.
				let next = index + 1;
				while (next < params.lines.length && params.lines[next].trim() === "") next += 1;
				const following = next < params.lines.length ? params.lines[next].trim() : "";
				if (following === "" || !ITALIC_CAPTION.test(following)) {
					fail("image-caption: Follow the image with an italic caption that explains why it matters.");
				}
			}
		});
	},
};