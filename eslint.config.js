import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";

export default defineConfig([
  {
    ignores: ["**/*.jsx"]
  },
  js.configs.recommended,
  {
    rules: {
      indent: ["error", 2],
      "arrow-parens": "off",
      "linebreak-style": ["error", "unix"],
      quotes: ["error", "double"],
      semi: ["error", "always"],
      "comma-dangle": ["error", "never"],
      "default-param-last": "off",
      "function-call-argument-newline": "off",
      "function-paren-newline": "off",
      "no-cond-assign": ["error", "except-parens"],
      "no-multiple-empty-lines": "off",
      "no-use-before-define": ["error", "nofunc"],
      eqeqeq: ["error", "always", { null: "ignore" }],
      "max-len": "off",
      "no-nested-ternary": "error",
      "no-await-in-loop": "error",
      "no-lonely-if": "error",
      "no-restricted-syntax": "off",
      "no-console": "off",
      "global-require": "off",
      "no-underscore-dangle": "off",
      "object-shorthand": "off",
      "prefer-destructuring": "off",
      radix: ["error", "as-needed"],
      "no-plusplus": "off",
      "no-unused-vars": "off",
      "no-useless-assignment": "off",
      "no-unassigned-vars": "off",
      "preserve-caught-error": "off"
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        app: "readonly",
        log: "readonly",
        fetch: "readonly",
        document: "readonly",
        window: "readonly",
        __: "readonly"
      }
    }
  }
]);
