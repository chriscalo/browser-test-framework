/**
 * Browser Test Framework
 * A minimal test framework for browser-based testing with zero dependencies.
 * 
 * Provides basic functionality for running tests in the browser with
 * console-based reporting. Includes a test runner, simple assertions,
 * and UI testing utilities.
 * 
 * Usage:
 * 
 * ```js
 * test("addition works", () => {
 *   assert.equal(2 + 2, 4);
 * });
 * 
 * test.ui("button click", `template[test="button"]`, async ({ container }) => {
 *   const button = container.querySelector("button");
 *   button.click();
 *   assert.equal(button.textContent, "Clicked!");
 * });
 * ```
 */

class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.total = 0;
    this.startTime = 0;
    this.testResults = [];
    this.testQueue = [];
    this.autoRunScheduled = false;
    this.domContentLoaded = false;
    
    document.addEventListener("DOMContentLoaded", () => {
      this.domContentLoaded = true;
      this.scheduleAutoRun();
    });
    
    window.addEventListener("load", () => {
      setTimeout(() => this.runPendingTests(), 100);
    });
  }
  
  scheduleAutoRun() {
    if (this.autoRunScheduled) return;
    
    this.autoRunScheduled = true;
    setTimeout(() => {
      this.autoRunScheduled = false;
      this.runPendingTests();
    }, 50);
  }
  
  enqueueTest(name, fn) {
    this.testQueue.push({ name, fn });
    
    if (this.domContentLoaded) {
      this.scheduleAutoRun();
    }
  }
  
  async runPendingTests() {
    if (this.testQueue.length === 0) return;
    
    this.start();
    this.total = this.testQueue.length;
    
    const testsToRun = [...this.testQueue];
    this.testQueue = [];
    
    for (const testCase of testsToRun) {
      try {
        await testCase.fn();
        this.passed++;
        this.testResults.push({ name: testCase.name, passed: true });
      } catch (error) {
        this.failed++;
        this.testResults.push({ name: testCase.name, passed: false, error });
      }
    }
    
    return await this.logSummary();
  }
  
  start() {
    this.passed = 0;
    this.failed = 0;
    this.total = 0;
    this.testResults = [];
    this.startTime = performance.now();
    console.log("Running tests...");
  }
  
  async logSummary() {
    const now = performance.now();
    const duration = ((now - this.startTime) / 1000).toFixed(3);
    
    console.info("\n📊 Tests: " + this.total);
    
    for (const result of this.testResults) {
      if (result.passed) {
        console.info(`✅ ${result.name}`);
      } else {
        console.error(`❌ ${result.name}`);
        if (result.error instanceof AssertionError) {
          result.error.log();
        } else {
          console.error(`  ${result.error.message}`);
        }
      }
    }
    
    console.log("\n");
    console.log(`✅ Passed: ${this.passed}`);
    if (this.failed > 0) {
      console.log(`❌ Failed: ${this.failed}`);
    }
    console.log(`⏱️ Duration: ${duration}s`);
    
    if (this.failed > 0) {
      console.log("\n❌ Tests failed");
      const summary = `❌ ${this.failed} of ${this.total} tests failed. See console for details.`;
      alert(summary);
      // Signal completion for test runners
      if (typeof window !== "undefined") {
        window.__testCompleted = true;
      }
      return false;
    } else {
      console.log("\n✅ All tests passed");
      // Signal completion for test runners
      if (typeof window !== "undefined") {
        window.__testCompleted = true;
      }
      return true;
    }
  }
}

const testRunner = new TestRunner();

function test(name, fn) {
  testRunner.enqueueTest(name, fn);
}

class AssertionError extends Error {
  constructor(message, details = {}) {
    super(message);
    Object.assign(this, details);
  }
  
  log() {
    console.group(`🚨 AssertionError`);
    console.error(`Message: `, this.message);
    if ("actual" in this && "expected" in this) {
      console.log(`Actual:`);
      console.dir(this.actual);
      
      console.log(`Expected:`);
      console.dir(this.expected);
    }
    
    if ("differences" in this) {
      console.log(`Differences:`);
      console.dir(this.differences);
    }
    console.debug(`Stack: `, this.stack);
    console.groupEnd();
  }
}

const assert = {
  equal(actual, expected) {
    if (actual !== expected) {
      const message = `Expected ${expected}, but got ${actual}`;
      throw new AssertionError(message, { actual, expected });
    }
  },
  
  deepEqual(actual, expected) {
    const differences = [...diff(actual, expected)];
    
    if (differences.length > 0) {
      const message = `Values are not deeply equal`;
      throw new AssertionError(message, {
        actual,
        expected,
        differences,
      });
    }
    
    function* diff(a, b, path = []) {
      if (a === b) return;
      
      if (!isObject(a) || !isObject(b)) {
        yield {
          path,
          actual: a,
          expected: b,
        };
        return;
      }
      
      const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
      
      for (const key of keys) {
        const aValue = a[key];
        const bValue = b[key];
        const differences = diff(aValue, bValue, [...path, key]);
        
        for (const difference of differences) {
          yield difference;
        }
      }
      
      function isObject(value) {
        return value != null && typeof value === "object";
      }
    }
  },
  
  ok(value, message = "Value should be truthy") {
    if (!value) {
      throw new AssertionError(message, { actual: value, expected: true });
    }
  },
};

// UI Test Framework
async function withSandbox(fn) {
  // Create sandbox element if template doesn't exist
  const existingTemplate = document.querySelector(`template[name="ui-test-sandbox"]`);
  let sandbox;
  
  if (existingTemplate) {
    sandbox = existingTemplate.content.cloneNode(true)
      .querySelector(`section[name="ui-test-sandbox"]`);
  } else {
    // Create a simple div sandbox if no template exists
    sandbox = document.createElement("div");
    sandbox.setAttribute("data-test-sandbox", "true");
    sandbox.style.position = "fixed";
    sandbox.style.inset = "0";
    sandbox.style.pointerEvents = "none";
    sandbox.style.visibility = "hidden";
  }
  
  document.body.appendChild(sandbox);
  
  try {
    return await fn(sandbox);
  } finally {
    document.body.removeChild(sandbox);
  }
}

test.ui = function testUI(name, selector, testFn) {
  test(name, async () => {
    await withSandbox(async (sandbox) => {
      const templateFragment = makeTestDOM(selector);
      sandbox.appendChild(templateFragment);
      
      await testFn({ container: sandbox });
    });
  });
};

function makeTestDOM(selector) {
  const testTemplate = findTestTemplate(selector);
  return cloneTemplateContent(testTemplate);
}

function findTestTemplate(selector) {
  const testTemplate = document.querySelector(selector);
  if (!testTemplate) {
    throw new Error(`test.ui(): Template not found: ${selector}`);
  }
  return testTemplate;
}

function cloneTemplateContent(testTemplate) {
  try {
    return testTemplate.content.cloneNode(true);
  } catch (error) {
    throw new Error(`test.ui(): Failed to clone template content: ${error.message}`);
  }
}

// Export for ES modules
export {
  TestRunner,
  testRunner,
  test,
  AssertionError,
  assert,
  withSandbox,
};

// Also make available globally for non-module scripts
if (typeof window !== "undefined") {
  window.TestRunner = TestRunner;
  window.testRunner = testRunner;
  window.test = test;
  window.AssertionError = AssertionError;
  window.assert = assert;
  window.withSandbox = withSandbox;
}
