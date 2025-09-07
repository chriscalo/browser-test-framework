import { strict as assert } from "node:assert";
import { describe, test } from "node:test";
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get HTML file from environment variable or default to index.html
const htmlFile = process.env.HTML_FILE || "index.html";

describe(`Browser Tests from ${htmlFile}`, () => {
  let browser;
  let page;
  let server;
  let testResults = [];

  test("setup browser and capture test results", async () => {
    // Start local server
    server = createServer((req, res) => {
      let filePath = req.url === "/" ? htmlFile : req.url.slice(1);
      filePath = filePath.split("?")[0];
      
      const fullPath = join(__dirname, filePath);
      const ext = extname(fullPath);
      const contentType = ext === ".js" ? "application/javascript" : 
                        ext === ".html" ? "text/html" : 
                        ext === ".css" ? "text/css" :
                        "text/plain";
      
      try {
        const content = readFileSync(fullPath);
        res.writeHead(200, { "Content-Type": contentType });
        res.end(content);
      } catch (err) {
        res.writeHead(404);
        res.end("Not found");
      }
    });

    const port = await new Promise((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        resolve(server.address().port);
      });
    });

    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();

    // Capture console output to extract test results
    const consoleMessages = [];
    page.on("console", msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
      });
    });

    // Navigate and wait for tests to complete
    await page.goto(`http://localhost:${port}/${htmlFile}`);
    await page.waitForTimeout(5000); // Give tests time to complete

    // Extract test results from console output
    testResults = extractTestResults(consoleMessages);

    const actual = testResults.length;
    const expected = 0;

    console.log(`📊 Captured ${actual} test results from browser`);
    assert.ok(actual > expected, "Should capture test results from browser");
  });

  // Dynamically create a Node.js test for each browser test
  test("run individual browser tests", async (t) => {
    for (const result of testResults) {
      await t.test(result.name, () => {
        const actual = result.status;
        const expected = "passed";
        assert.strictEqual(
          actual,
          expected,
          `Browser test failed: ${result.name}\nError: ${
            result.error || "Unknown error"
          }`,
        );
      });
    }
  });

  test("verify overall test suite status", () => {
    const passed = testResults.filter(r => r.status === "passed").length;
    const failed = testResults.filter(r => r.status === "failed").length;
    const total = testResults.length;

    console.log(`\n📈 Browser Test Summary:`);
    console.log(`   Total: ${total}`);
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${failed}`);

    const actualFailed = failed;
    const expectedFailed = 0;
    assert.strictEqual(
      actualFailed,
      expectedFailed,
      `${failed} browser tests failed`,
    );
  });

  test("cleanup browser", async () => {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  });
});

/**
 * Extract individual test results from browser console messages
 */
function extractTestResults(consoleMessages) {
  const results = [];
  let totalTests = 0;
  let passedTests = 0;

  for (const msg of consoleMessages) {
    const text = msg.text;

    // Look for test summary info
    if (text.includes("📊 Tests:")) {
      const match = text.match(/📊 Tests: (\d+)/);
      if (match) {
        totalTests = parseInt(match[1]);
      }
    }

    // Look for individual test results (✅ or ❌)
    if (text.startsWith("✅ ")) {
      const testName = text.replace("✅ ", "").trim();
      results.push({
        name: testName,
        status: "passed",
      });
      passedTests++;
    } else if (text.startsWith("❌ ")) {
      const testName = text.replace("❌ ", "").trim();
      results.push({
        name: testName,
        status: "failed",
        error: "Test assertion failed",
      });
    }

    // Look for final summary
    if (text.includes("✅ Passed:")) {
      const match = text.match(/✅ Passed: (\d+)/);
      if (match) {
        const reportedPassed = parseInt(match[1]);
        console.log(`🔍 Browser reported ${reportedPassed} passed tests`);
      }
    }

    // Look for test completion message
    if (text.includes("✅ All tests passed")) {
      console.log("🎉 Browser reports all tests passed");
    }
  }

  // If we didn't capture individual test names but have summary info,
  // create generic test entries
  if (results.length === 0 && totalTests > 0) {
    console.log(`📝 Creating ${totalTests} generic test entries from summary`);
    for (let i = 1; i <= totalTests; i++) {
      results.push({
        name: `Browser Test ${i}`,
        status: i <= passedTests ? "passed" : "failed",
      });
    }
  }

  return results;
}