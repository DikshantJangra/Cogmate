import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";

export default {
	input: "src/pptxgen.ts",
	output: [
		{ file: "./dist/pptxgen.cjs.js", format: "cjs", exports: "default" },
		{ file: "./dist/pptxgen.es.js", format: "es" },
	],
	plugins: [
		resolve({ extensions: [".ts", ".js"] }),
		commonjs(),
		typescript(),
	]
};
