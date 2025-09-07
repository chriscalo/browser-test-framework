# @chriscalo/browser-test-framework

A minimal test framework for browser-based testing with zero dependencies. Drop it in an HTML file and start testing immediately. No Node.js required, no build step, just `test()` in the browser.

## Features

- 🚀 **Zero dependencies** - Just one JavaScript file
- 🎯 **Auto-execution** - Tests run automatically on page load
- 📊 **Console reporting** - Clear, emoji-enhanced test results
- ✅ **Basic assertions** - `equal`, `deepEqual`, `ok`
- 🧪 **UI testing** - DOM sandboxing for isolated component tests
- ⚡ **Async support** - Works with promises and async/await
- 📦 **ES modules** - Works as both ES module and global script

## Installation

### Option 1: NPM (for package management)

```bash
npm install @chriscalo/browser-test-framework
```

### Option 2: Direct download

Download `index.js` and include it in your HTML:

```html
<script src="index.js"></script>
```

### Option 3: ES Module

```html
<script type="module">
  import { test, assert } from './index.js';
  
  test("my test", () => {
    assert.equal(2 + 2, 4);
  });
</script>
```

## Usage

### Basic Testing

```javascript
test("arithmetic operations", () => {
  assert.equal(2 + 2, 4);
  assert.equal(10 - 5, 5);
});

test("string operations", () => {
  assert.equal("hello" + " world", "hello world");
  assert.equal("test".toUpperCase(), "TEST");
});

test("boolean assertions", () => {
  assert.ok(true);
  assert.ok([1, 2, 3].length > 0);
});
```

### Deep Equality

```javascript
test("deep equality for objects", () => {
  const obj1 = { a: 1, b: { c: 2 } };
  const obj2 = { a: 1, b: { c: 2 } };
  assert.deepEqual(obj1, obj2);
});

test("deep equality for arrays", () => {
  const arr1 = [1, 2, [3, 4]];
  const arr2 = [1, 2, [3, 4]];
  assert.deepEqual(arr1, arr2);
});
```

### Async Tests

```javascript
test("async test support", async () => {
  const result = await fetch('/api/data').then(r => r.json());
  assert.equal(result.status, 'success');
});

test("promise-based test", async () => {
  const value = await Promise.resolve(42);
  assert.equal(value, 42);
});
```

### UI Testing

Test DOM components in isolation with automatic cleanup:

```html
<!-- Define a template for testing -->
<template id="button-template">
  <button>Click me</button>
</template>

<script>
test.ui("button text changes", "#button-template", async ({ container }) => {
  const button = container.querySelector("button");
  assert.equal(button.textContent, "Click me");
  
  button.textContent = "Clicked!";
  assert.equal(button.textContent, "Clicked!");
});
</script>
```

## API Reference

### Core Functions

#### `test(name, fn)`
Registers a test to be run.

- `name` (string): Test description
- `fn` (function): Test function (can be async)

#### `test.ui(name, selector, fn)`
Registers a UI test with DOM sandboxing.

- `name` (string): Test description
- `selector` (string): CSS selector for template element
- `fn` (async function): Test function receiving `{ container }`

### Assertions

#### `assert.equal(actual, expected)`
Asserts strict equality (`===`).

#### `assert.deepEqual(actual, expected)`
Asserts deep equality for objects and arrays.

#### `assert.ok(value, [message])`
Asserts that value is truthy.

### Classes

#### `TestRunner`
The test runner class that manages test execution.

#### `AssertionError`
Custom error class with detailed error information.

## Examples

### Complete HTML Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Tests</title>
</head>
<body>
  <h1>Test Suite</h1>
  
  <!-- Test templates -->
  <template id="component">
    <div class="my-component">
      <span class="label">Hello</span>
    </div>
  </template>
  
  <!-- Load test framework -->
  <script src="node_modules/@chriscalo/browser-test-framework/index.js"></script>
  
  <!-- Write tests -->
  <script>
    // Unit tests
    test("addition", () => {
      assert.equal(1 + 1, 2);
    });
    
    // UI tests
    test.ui("component renders", "#component", async ({ container }) => {
      const label = container.querySelector(".label");
      assert.equal(label.textContent, "Hello");
    });
  </script>
</body>
</html>
```

### Running Tests

1. Open `index.html` in a browser
2. Open the browser console to see test results
3. Tests run automatically on page load

## Philosophy

This framework is designed for **quick and dirty HTML prototyping**. It's not meant for production applications but for rapid experimentation where you want to:

- Test ideas quickly in the browser
- Avoid build tools and complex setups
- Get immediate feedback in the console
- Focus on prototyping, not tooling

## Similar To

- **Mocha** - But simpler and browser-first
- **QUnit** - But more minimal
- **Tape** - But designed for browser use

## Development

```bash
# Run tests
npm test  # Opens test.html in browser

# Run demo
npm run demo  # Opens index.html in browser

# Start dev server
npm start  # Starts http-server on port 3000
```

## License

MIT