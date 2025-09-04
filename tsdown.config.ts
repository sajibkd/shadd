import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts"],
  outDir: "dist",
  format: "esm",
  target: "node18",
  platform: "node",
  // We keep code readable and rely on postbuild to ensure shebang + chmod
  minify: false,
  sourcemap: false,
});


