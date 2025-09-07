# Browser Test Framework - Design Document

## Overview

A minimal, zero-dependency test framework designed explicitly for browser-based prototyping. This framework enables developers to write and run tests directly in the browser without any build tools, Node.js dependencies, or complex setup.

## Goals

### Primary Goals

1. **Zero Dependencies** - The framework must work standalone without any external libraries
2. **Browser-First** - Designed to run natively in browsers, not adapted from Node.js
3. **Instant Feedback** - Tests auto-execute on page load with console reporting
4. **Prototyping Focus** - Optimize for quick experimentation over production features
5. **Simple API** - Minimal learning curve with familiar assertion patterns

### Non-Goals

- Production test running
- Code coverage reporting
- Test watching/hot reload
- Complex mocking/stubbing
- Cross-browser compatibility testing

## Requirements

### Functional Requirements

1. **Test Registration**
   - Simple `test(name, fn)` API
   - Support for async/await tests
   - Automatic test discovery and execution

2. **Assertions**
   - `assert.equal(actual, expected)` - Strict equality
   - `assert.deepEqual(actual, expected)` - Deep object/array comparison
   - `assert.ok(value, message)` - Truthy assertion

3. **UI Testing**
   - `test.ui(name, selector, fn)` - DOM component testing
   - Automatic sandbox creation and cleanup
   - Template-based test fixtures

4. **Reporting**
   - Console-based output with emojis
   - Clear pass/fail status
   - Detailed error information
   - Test execution timing

5. **Integration**
   - Works as ES module with both import and global access
   - Compatible with modern browsers (Chrome, Firefox, Safari, Edge)
   - No transpilation required

### Technical Requirements

1. **Memory** - Clean up all test artifacts after execution
2. **Compatibility** - ES2015+ browser features only

## Architecture

### Core Components

```
TestRunner
├── Test Queue Management
├── Execution Lifecycle
├── Result Aggregation
└── Console Reporting

Assertions
├── Equal (===)
├── Deep Equal (recursive)
└── Ok (truthy)

UI Testing
├── Sandbox Creation
├── Template Cloning
├── DOM Isolation
└── Cleanup
```

### Execution Flow

1. **Page Load**
   - Framework initializes TestRunner
   - Registers DOMContentLoaded and load event listeners

2. **Test Registration**
   - Tests added to queue via `test()` calls
   - Auto-run scheduled if DOM is ready

3. **Test Execution**
   - Tests run sequentially (to avoid console interleaving)
   - Each test wrapped in try/catch
   - Results collected for summary

4. **Reporting**
   - Individual test results logged
   - Summary statistics displayed
   - Alert shown for failures (development aid)


## API Design

### Public API

```javascript
// Test registration
test(name: string, fn: Function): void
test.ui(name: string, selector: string, fn: AsyncFunction): void

// Assertions
assert.equal(actual: any, expected: any): void
assert.deepEqual(actual: any, expected: any): void
assert.ok(value: any, message?: string): void

// Classes (for advanced usage)
class TestRunner
class AssertionError extends Error
```

### Usage Examples

```javascript
// Basic test
test("addition", () => {
  assert.equal(2 + 2, 4);
});

// Async test
test("fetch data", async () => {
  const data = await fetchSomething();
  assert.ok(data);
});
```

Complete example with template and test:

```html
<template id="button-template">
  <button>Click me</button>
</template>

<script type="module">
  import { test, assert } from "./index.js";
  
  test.ui("button click", "#button-template", async ({ container }) => {
    const button = container.querySelector("button");
    button.click();
    assert.equal(button.textContent, "Clicked!");
  });
</script>
```

## Success Criteria

The framework successfully enables developers to:

1. Write tests in under 30 seconds
2. See results immediately in the console
3. Test DOM components without setup
4. Debug failures with clear error messages
5. Avoid any build or compilation step

## Trade-offs

### What We're Optimizing For

- Developer experience during prototyping
- Minimal setup time
- Fast feedback loops
- Learning curve

### What We're Trading Off

- Advanced features (mocking, coverage)
- Performance optimizations
- Cross-environment portability
- Production readiness

## Future Considerations

Potential enhancements that maintain the zero-dependency philosophy:

1. **Grouped Tests** - `describe()` blocks for organization
2. **Setup/Teardown** - `beforeEach()` and `afterEach()` hooks
3. **Skip/Only** - `test.skip()` and `test.only()` for focused testing
4. **Custom Assertions** - Extensible assertion API
5. **Better Diffs** - Visual diff output for deep equality failures

## Open Questions

### Should we support both ES module and traditional script loading?

Currently, the framework only works when loaded as an ES module (`<script type="module">`). Loading it as a traditional script (`<script>`) throws an error when it hits the `export` statement.

**The issue:**
- ES modules use `export/import` syntax
- Traditional scripts don't understand `export` 
- We have `export` statements at line 291 of index.js

**Potential solutions:**

1. **UMD pattern**: Wrap the code to detect the environment and export accordingly
2. **Build step**: Create two versions (index.js and index.umd.js)
3. **Dynamic exports**: Use conditional exports based on `typeof module`
4. **Remove exports**: Only use global assignment (loses ES module benefits)

**Recommendation**: Defer this for now. The current approach (ES module that also sets globals) works for modern prototyping. If needed later, we can:
- Add a simple build step to generate a UMD version
- Or wrap the exports in a try/catch (hacky but works)
- Or detect `type="module"` and conditionally export

For now, document that it must be loaded as `<script type="module" src="index.js">`.

### Should we output TAP format to the console?

[TAP (Test Anything Protocol)](https://testanything.org/) is a simple text-based format for test results that looks like:

```
TAP version 14
1..4
ok 1 - Input file opened
ok 2 - First line of the input valid
not ok 3 - Read the rest of the file
# Subtest: Math operations
    ok 1 - addition works
    ok 2 - subtraction works
    1..2
ok 4 - Math operations
```

**Benefits of TAP:**
- **Machine parseable**: TAP parsers can easily extract test results from mixed console output
- **CI/CD friendly**: Many CI systems understand TAP natively
- **Standardized**: Well-established protocol with tooling ecosystem
- **Filtering**: Can grep for TAP lines and ignore other console noise

**Drawbacks for this project:**

**(a) Human readability:**
- **Current format is clearer**: Our emoji-based output (✅/❌) is instantly recognizable
- **TAP is verbose**: "ok 1 - test name" vs "✅ test name"
- **Prototyping context**: Developers prototyping want quick visual feedback, not machine formats
- **Browser console**: Browsers already provide filtering/searching in dev tools

**(b) Detection vs noise:**
- **Already solved**: Our Playwright test runner already extracts test results by looking for ✅/❌ markers
- **Unique markers**: Emoji prefixes are unlikely to appear in regular console output
- **TAP collision risk**: "ok" and "not ok" are common words that might appear in debug output

**Recommendation**: Keep the current emoji-based format. It's optimized for the primary use case (human developers prototyping in browser console) and our test runner already handles extraction well. TAP would add complexity without clear benefit for our target audience.

### Should we provide a Node.js bin executable?

We could add a CLI tool that projects can use when they install browser-test-framework as a dependency:

```json
{
  "bin": {
    "browser-test": "./bin/browser-test.js"
  }
}
```

This would allow:
```bash
npm install --save-dev browser-test-framework
npx browser-test my-tests.html
```

**Benefits:**
- **Convenience**: No need to copy/write a test runner
- **Standardization**: Same runner across projects
- **CI/CD ready**: Easy to add to npm scripts
- **Configuration**: Could support options like `--timeout`, `--port`, etc.

**Drawbacks:**
- **Scope creep**: Moves away from "zero dependency, browser-first" philosophy
- **Complexity**: Now maintaining both browser framework AND Node.js tooling
- **Already solved**: Projects can copy our `index.test.js` pattern

**Recommendation**: Yes, but keep it minimal. A simple bin script that wraps the Playwright runner would be valuable for projects using this framework. It should:
1. Start a local server
2. Run the HTML file in Playwright
3. Extract and report test results
4. Exit with proper code

This stays true to our mission (making browser testing easy) without bloating the core framework.

## Conclusion

This browser test framework fills a specific niche: enabling rapid prototyping with immediate test feedback in the browser. By maintaining zero dependencies and focusing on simplicity, it provides the minimal viable testing infrastructure for HTML/JavaScript experimentation without the overhead of modern testing toolchains.