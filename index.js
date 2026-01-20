/**
 * ESLint plugin to enforce FFI stub-only pattern for PureScript-JavaScript interop.
 *
 * FFI files should ONLY contain thin wrappers to external libraries.
 * All business logic must be in PureScript.
 *
 * FILE TARGETING:
 * Rules apply to all files matched by your ESLint config's `files` pattern.
 * Typically configured as: files: ["src/**/*.js"]
 * The plugin does NOT filter by path - use ESLint config to control scope.
 *
 * ALLOWED:
 * - Direct library calls: `export const foo = (x) => () => lib.method(x)`
 * - Async wrappers: `export const foo = (x) => async () => lib.method(x)`
 * - Constant exports: `export const alignLeft = TextAlignment.Left`
 * - Simple default values: `field.getText() || ""`
 * - Imports from external npm packages (e.g., "pdf-lib", "@aws-sdk/client-textract")
 * - Imports from Node.js built-ins (e.g., "fs", "path", "node:crypto")
 *
 * PROHIBITED:
 * - Non-exported helper functions
 * - if/else statements
 * - for/while loops
 * - Array transformation methods (.map, .filter, .reduce, .findIndex, .find, .some, .every, .flatMap)
 * - Ternary operators (conditional expressions)
 * - switch statements
 * - Imports from local JS files (e.g., "../../js/services/index.js", "./helper.js")
 */

const LOGIC_INDICATOR_MESSAGE =
  "FFI files must only contain stubs to external libraries. Move this logic to PureScript.";

const ARRAY_METHODS = [
  "map",
  "filter",
  "reduce",
  "findIndex",
  "find",
  "some",
  "every",
  "flatMap",
];

export const rules = {
  "no-logic-in-ffi": {
    meta: {
      type: "problem",
      docs: {
        description:
          "Disallow business logic in FFI files - only library stubs allowed",
        category: "Best Practices",
      },
      messages: {
        noHelperFunctions:
          "Non-exported helper function '{{name}}' detected. FFI should only have exports. Move logic to PureScript.",
        noIfStatements: `if/else statements indicate business logic. ${LOGIC_INDICATOR_MESSAGE}`,
        noLoops: `Loop statements indicate business logic. ${LOGIC_INDICATOR_MESSAGE}`,
        noTernary: `Ternary operators indicate business logic. ${LOGIC_INDICATOR_MESSAGE}`,
        noSwitch: `Switch statements indicate business logic. ${LOGIC_INDICATOR_MESSAGE}`,
        noArrayMethods: `Array method '.{{method}}()' indicates data transformation. ${LOGIC_INDICATOR_MESSAGE}`,
        noComplexCatch: `Complex catch blocks with logic indicate error handling that should be in PureScript.`,
      },
    },
    create(context) {
      // Rule applies to all files matched by ESLint config's `files` pattern.
      // No path filtering here - let the ESLint config control which files are checked.
      return {
        FunctionDeclaration(node) {
          const parent = node.parent;
          if (
            parent.type !== "ExportNamedDeclaration" &&
            parent.type !== "ExportDefaultDeclaration"
          ) {
            context.report({
              node,
              messageId: "noHelperFunctions",
              data: { name: node.id?.name || "anonymous" },
            });
          }
        },

        IfStatement(node) {
          context.report({
            node,
            messageId: "noIfStatements",
          });
        },

        ForStatement(node) {
          context.report({
            node,
            messageId: "noLoops",
          });
        },
        ForInStatement(node) {
          context.report({
            node,
            messageId: "noLoops",
          });
        },
        ForOfStatement(node) {
          context.report({
            node,
            messageId: "noLoops",
          });
        },
        WhileStatement(node) {
          context.report({
            node,
            messageId: "noLoops",
          });
        },
        DoWhileStatement(node) {
          context.report({
            node,
            messageId: "noLoops",
          });
        },

        ConditionalExpression(node) {
          context.report({
            node,
            messageId: "noTernary",
          });
        },

        SwitchStatement(node) {
          context.report({
            node,
            messageId: "noSwitch",
          });
        },

        CallExpression(node) {
          if (
            node.callee.type === "MemberExpression" &&
            node.callee.property.type === "Identifier" &&
            ARRAY_METHODS.includes(node.callee.property.name)
          ) {
            context.report({
              node,
              messageId: "noArrayMethods",
              data: { method: node.callee.property.name },
            });
          }
        },
      };
    },
  },

  "no-local-imports": {
    meta: {
      type: "problem",
      docs: {
        description:
          "Disallow imports from local JS files in FFI - only external libraries allowed",
        category: "Best Practices",
      },
      messages: {
        noLocalImport:
          "Import from local file '{{source}}' is not allowed in FFI. FFI must only import from external npm packages or Node.js built-ins. Move this logic to PureScript.",
        noLocalRequire:
          "Require of local file '{{source}}' is not allowed in FFI. FFI must only require external npm packages or Node.js built-ins. Move this logic to PureScript.",
        noLocalDynamicImport:
          "Dynamic import from local file '{{source}}' is not allowed in FFI. FFI must only import from external npm packages or Node.js built-ins. Move this logic to PureScript.",
      },
    },
    create(context) {
      // Rule applies to all files matched by ESLint config's `files` pattern.
      // No path filtering here - let the ESLint config control which files are checked.
      const isLocalImport = (source) => {
        if (!source) {
          return false;
        }
        return source.startsWith("./") || source.startsWith("../");
      };

      return {
        ImportDeclaration(node) {
          const source = node.source.value;
          if (isLocalImport(source)) {
            context.report({
              node,
              messageId: "noLocalImport",
              data: { source },
            });
          }
        },

        CallExpression(node) {
          if (
            node.callee.type === "Identifier" &&
            node.callee.name === "require" &&
            node.arguments.length > 0 &&
            node.arguments[0].type === "Literal"
          ) {
            const source = node.arguments[0].value;
            if (isLocalImport(source)) {
              context.report({
                node,
                messageId: "noLocalRequire",
                data: { source },
              });
            }
          }
        },

        ImportExpression(node) {
          if (node.source.type === "Literal") {
            const source = node.source.value;
            if (isLocalImport(source)) {
              context.report({
                node,
                messageId: "noLocalDynamicImport",
                data: { source },
              });
            }
          }
        },
      };
    },
  },
};
