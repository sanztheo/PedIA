import { app } from "../src/app";

async function testGetGraph() {
  console.log("Testing GET /api/graph...");
  const res = await app.request("/api/graph");
  const json = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(json, null, 2));
  console.assert(res.status === 200, "Expected 200");
  console.assert(Array.isArray(json.nodes), "Expected nodes array");
  console.assert(Array.isArray(json.links), "Expected links array");
  console.log("✓ GET /api/graph passed\n");
}

async function testGetLocalGraph() {
  console.log("Testing GET /api/graph/local/:pageId...");
  const res = await app.request("/api/graph/local/test-page-id?depth=2");
  const json = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(json, null, 2));
  console.assert(res.status === 200, "Expected 200");
  console.log("✓ GET /api/graph/local/:pageId passed\n");
}

async function testGetEntityRelations() {
  console.log("Testing GET /api/graph/entity/:entityId...");
  const res = await app.request("/api/graph/entity/test-entity-id");
  const json = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(json, null, 2));
  console.assert(res.status === 200, "Expected 200");
  console.log("✓ GET /api/graph/entity/:entityId passed\n");
}

async function runTests() {
  console.log("=== Graph API Tests ===\n");
  try {
    await testGetGraph();
    await testGetLocalGraph();
    await testGetEntityRelations();
    console.log("=== All tests passed ===");
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

runTests();
