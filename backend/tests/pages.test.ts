import { app } from "../src/app";

async function testListPages() {
  console.log("Testing GET /api/pages...");
  const res = await app.request("/api/pages");
  const json = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(json, null, 2));
  console.assert(res.status === 200, "Expected 200");
  console.log("✓ GET /api/pages passed\n");
}

async function testGetPage() {
  console.log("Testing GET /api/pages/:slug...");
  const res = await app.request("/api/pages/test-page");
  const json = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(json, null, 2));
  console.log("✓ GET /api/pages/:slug passed\n");
}

async function testCreatePage() {
  console.log("Testing POST /api/pages...");
  const res = await app.request("/api/pages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Test Page",
      slug: "test-page",
      content: "# Test\n\nThis is a test page.",
    }),
  });
  const json = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(json, null, 2));
  console.log("✓ POST /api/pages passed\n");
}

async function runTests() {
  console.log("=== Pages API Tests ===\n");
  try {
    await testListPages();
    await testGetPage();
    await testCreatePage();
    console.log("=== All tests passed ===");
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

runTests();
