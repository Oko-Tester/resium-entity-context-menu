import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  dts: true,
  platform: "browser",
  format: ["cjs", "esm"],
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom", "resium", "cesium"],
});
