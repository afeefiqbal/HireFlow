import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  functions: {
    backend: {
      name: "hireflow backend api",
      source: "functions/api/index.ts",
    },
  },
});
