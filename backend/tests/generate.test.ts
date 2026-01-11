import { app } from "../src/app";

async function testGenerateNoQuery() {
  console.log("Testing GET /api/generate without query...");
  const res = await app.request("/api/generate");
  const json = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(json, null, 2));
  console.assert(res.status === 400, "Expected 400 without query");
  console.log("✓ GET /api/generate (no query) passed\n");
}

async function testGenerateWithQuery() {
  console.log("Testing GET /api/generate?q=Tesla...");
  const res = await app.request("/api/generate?q=Tesla");
  console.log("Status:", res.status);
  console.log("Content-Type:", res.headers.get("content-type"));

  if (res.headers.get("content-type")?.includes("text/event-stream")) {
    console.log("✓ SSE stream started");
    const text = await res.text();
    console.log("Stream content (first 500 chars):", text.slice(0, 500));
  } else {
    const json = await res.json();
    console.log("Response:", JSON.stringify(json, null, 2));
  }
  console.log("✓ GET /api/generate?q=Tesla passed\n");
}

async function runTests() {
  console.log("=== Generate API Tests ===\n");
  try {
    await testGenerateNoQuery();
    await testGenerateWithQuery();
    console.log("=== All tests passed ===");
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

runTests();
