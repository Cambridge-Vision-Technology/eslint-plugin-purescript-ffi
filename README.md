# eslint-plugin-purescript-ffi

ESLint plugin to enforce FFI stub-only pattern for PureScript-JavaScript interop.

## Purpose

FFI (Foreign Function Interface) files should only contain thin wrappers to external libraries. All business logic must be in PureScript. This plugin enforces that pattern by detecting:

- Business logic in FFI files (if/else, loops, array methods, etc.)
- Imports from local JavaScript files (only external packages allowed)

## Installation

### npm

```bash
npm install --save-dev eslint-plugin-purescript-ffi
```

### Nix (FlakeHub)

```nix
{
  inputs.eslint-plugin-purescript-ffi.url = "flakehub:Cambridge-Vision-Technology/eslint-plugin-purescript-ffi/*";
}
```

## Usage

Add to your ESLint config (`eslint.config.js`):

```javascript
import * as purescriptFfiPlugin from "eslint-plugin-purescript-ffi";

export default [
  {
    files: ["src/FFI/**/*.js"],
    plugins: {
      "purescript-ffi": purescriptFfiPlugin,
    },
    rules: {
      "purescript-ffi/no-logic-in-ffi": "error",
      "purescript-ffi/no-local-imports": "error",
    },
  },
];
```

## Rules

### `purescript-ffi/no-logic-in-ffi`

Disallows business logic in FFI files. Detects:

- Non-exported helper functions
- `if`/`else` statements
- Loop statements (`for`, `while`, `do-while`, `for...of`, `for...in`)
- Ternary operators
- `switch` statements
- Array transformation methods (`.map`, `.filter`, `.reduce`, `.find`, `.some`, `.every`, `.flatMap`, `.findIndex`)

**Allowed:**
```javascript
// Direct library calls
export const foo = (x) => () => lib.method(x);

// Async wrappers
export const bar = (x) => async () => lib.asyncMethod(x);

// Constant exports
export const alignLeft = TextAlignment.Left;

// Simple default values
export const getText = (field) => () => field.getText() || "";
```

**Prohibited:**
```javascript
// Helper functions (not exported)
function transform(data) { ... }

// Conditionals
if (condition) { ... }

// Loops
for (const item of items) { ... }

// Array methods
items.map(x => x.value);
```

### `purescript-ffi/no-local-imports`

Disallows imports from local JavaScript files in FFI. Only external npm packages and Node.js built-ins are allowed.

**Allowed:**
```javascript
// External npm packages
import { PDFDocument } from "pdf-lib";
import mupdf from "mupdf";

// Node.js built-ins
import fs from "fs";
import crypto from "node:crypto";
```

**Prohibited:**
```javascript
// Local JS files
import { helper } from "../../js/utils.js";
import { service } from "./services/index.js";

// Dynamic imports from local files
const mod = await import("../../js/module.js");
```

## Why This Pattern?

When using PureScript with JavaScript FFI:

1. **Type Safety**: Business logic in PureScript benefits from static typing
2. **Testability**: PureScript functions are easier to unit test
3. **Maintainability**: Clear separation between typed core and JS interop
4. **Predictability**: FFI files become simple, predictable stubs

## License

MIT
