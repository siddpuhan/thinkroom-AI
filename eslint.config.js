import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  { ignores: ['.next/**', 'public/**', 'dist/**', 'scratch/**', 'node_modules/**'] },
  js.configs.recommended,
  {
    ignores: ['.next/', "dist/**", "scratch/**", "public/**", "node_modules/**"],
    files: ["src/**/*.{js,jsx,ts,tsx}", "server/**/*.{js,ts}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/no-unescaped-entities": "off",
      "react/display-name": "off",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/ban-ts-comment": "off"
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];
