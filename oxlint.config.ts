import { defineConfig } from "oxlint";

// Anti-slop lint policy, vendored from uofd-shared templates/oxlint (see
// tools/oxlint/anti-slop/README.md for provenance) plus rent-specific rules.
export default defineConfig({
	ignorePatterns: [
		// Agent tooling and authored skills are not application source.
		".agents/**",
		".claude/**",
		// Prose, brand SVG sources, and the static landing page.
		"docs/**",
		"branding/**",
		"site/public/**",
		// Linting the vendored plugin against its own rules is noise.
		"tools/oxlint/anti-slop/**",
	],
	jsPlugins: [
		{ name: "anti-slop", specifier: "./tools/oxlint/anti-slop/index.ts" },
		{ name: "anti-slop-rent", specifier: "./tools/oxlint/anti-slop/rent/index.ts" },
	],
	rules: {
		"anti-slop/no-chained-type-assertions": "error",
		"anti-slop/no-conditional-empty-object-spread": "error",
		"anti-slop/no-known-value-widening": "error",
		"anti-slop/no-module-mocking": "error",
		"anti-slop/no-object-parameters": "error",
		"anti-slop/no-reflect-apply": "error",
		"anti-slop/no-reflect-get": "error",
		"anti-slop/no-runtime-typeof": "error",
		"anti-slop/no-shape-in-symbol-names": "error",
		"anti-slop/no-unknown-parameters": "error",
		"anti-slop/no-unknown-returns": "error",
		"anti-slop/no-unknown-type-aliases": "error",
		"anti-slop/no-unsafe-dictionary-type": "error",
		"anti-slop/no-widen-then-assert": "error",
		"anti-slop/require-safety-comment-for-type-assertion": "error",
		"anti-slop-rent/no-float-money": "error",
		"anti-slop-rent/no-oversized-comments": "error",
		"anti-slop-rent/no-weak-randomness": "error",
	},
});
