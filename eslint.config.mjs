import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Código generado por Prisma
    "src/generated/**",
  ]),
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/dal/**", "src/lib/prisma.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/prisma",
              message:
                "Acceso a BDD solo desde src/lib/dal/. Ahí vive el control de acceso.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
