import prisma from "../src/lib/prisma";
import {
  extractQueue,
  linkQueue,
  enrichQueue,
  flowProducer,
  addExtractJob,
  addLinkJob,
  addEnrichJob,
  getQueueStats,
  closeQueues,
  getRedisUrl,
  PREFIX,
} from "../src/queue/queues";
import {
  startAllWorkers,
  stopAllWorkers,
  getWorkersHealth,
} from "../src/queue";

let testPageId: string | null = null;

async function testRedisConnection() {
  console.log("Testing Redis connection...");
  const redisUrl = getRedisUrl();

  if (!redisUrl) {
    console.log("⚠ REDIS_URL not set, skipping queue tests");
    return false;
  }

  console.log("✓ REDIS_URL is configured");
  console.log(`  PREFIX: ${PREFIX}`);
  return true;
}

async function setupTestData() {
  console.log("\nSetting up test data...");

  const existingPage = await prisma.page.findFirst({
    where: { status: "PUBLISHED" },
    select: { id: true, slug: true },
  });

  if (existingPage) {
    testPageId = existingPage.id;
    console.log(`✓ Using existing page: ${existingPage.slug} (${testPageId})`);
    return;
  }

  const testPage = await prisma.page.create({
    data: {
      slug: "test-queue-page",
      title: "Test Queue Page",
      content:
        "This is a test page for queue testing with [[Albert Einstein]] and [[Physics]].",
      status: "PUBLISHED",
    },
  });

  testPageId = testPage.id;
  console.log(`✓ Created test page: ${testPage.slug} (${testPageId})`);
}

async function testQueueInitialization() {
  console.log("\nTesting queue initialization...");

  console.assert(extractQueue !== null, "extractQueue should be initialized");
  console.assert(linkQueue !== null, "linkQueue should be initialized");
  console.assert(enrichQueue !== null, "enrichQueue should be initialized");
  console.assert(flowProducer !== null, "flowProducer should be initialized");

  console.log("✓ All queues initialized");
}

async function testAddExtractJob() {
  console.log("\nTesting addExtractJob...");

  if (!testPageId) {
    console.log("⚠ No test page, skipping");
    return null;
  }

  const testData = {
    pageId: testPageId,
    content: "This is test content about [[Albert Einstein]] and [[Physics]].",
  };

  const job = await addExtractJob(testData);

  if (!job) {
    console.log("⚠ Job not created (queue not available)");
    return null;
  }

  console.log(`✓ Extract job created: ${job.id}`);
  console.log(`  Queue: ${job.queueName}`);
  console.log(`  PageId: ${testData.pageId}`);

  return job;
}

async function testAddLinkJob() {
  console.log("\nTesting addLinkJob...");

  if (!testPageId) {
    console.log("⚠ No test page, skipping");
    return null;
  }

  const testData = {
    pageId: testPageId,
    entities: [
      { name: "Albert Einstein", type: "PERSON" as const, relevance: 0.9 },
      { name: "Physics", type: "CONCEPT" as const, relevance: 0.8 },
    ],
  };

  const job = await addLinkJob(testData);

  if (!job) {
    console.log("⚠ Job not created (queue not available)");
    return null;
  }

  console.log(`✓ Link job created: ${job.id}`);
  console.log(`  PageId: ${testData.pageId}`);
  console.log(`  Entities count: ${testData.entities.length}`);

  return job;
}

async function testAddEnrichJob() {
  console.log("\nTesting addEnrichJob (will fail without AI API key)...");

  const testData = {
    entityId: "test-entity-id-456",
    entityName: "Marie Curie",
    entityType: "PERSON" as const,
  };

  const job = await addEnrichJob(testData);

  if (!job) {
    console.log("⚠ Job not created (queue not available)");
    return null;
  }

  console.log(`✓ Enrich job created: ${job.id}`);
  console.log(`  Entity: ${testData.entityName} (${testData.entityType})`);
  console.log("  Note: Will fail during processing without GOOGLE_AI_API_KEY");

  return job;
}

async function testGetQueueStats() {
  console.log("\nTesting getQueueStats...");

  const stats = await getQueueStats();

  if (!stats) {
    console.log("⚠ Stats not available (queues not initialized)");
    return;
  }

  console.log("✓ Queue stats retrieved:");
  console.log(
    `  Extract: waiting=${stats.extract.waiting}, active=${stats.extract.active}, completed=${stats.extract.completed}, failed=${stats.extract.failed}`,
  );
  console.log(
    `  Link: waiting=${stats.link.waiting}, active=${stats.link.active}, completed=${stats.link.completed}, failed=${stats.link.failed}`,
  );
  console.log(
    `  Enrich: waiting=${stats.enrich.waiting}, active=${stats.enrich.active}, completed=${stats.enrich.completed}, failed=${stats.enrich.failed}`,
  );
}

async function testWorkersHealth() {
  console.log("\nTesting getWorkersHealth...");

  const health = await getWorkersHealth();

  console.log(`✓ Workers health: running=${health.workersRunning}`);

  if (health.queues) {
    console.log("  Queue stats available");
  }
}

async function testWorkerLifecycle() {
  console.log("\nTesting worker lifecycle...");

  console.log("  Starting workers...");
  const workers = startAllWorkers();

  console.log(
    `  Extract worker: ${workers.extract ? "started" : "not started"}`,
  );
  console.log(`  Link worker: ${workers.link ? "started" : "not started"}`);
  console.log(`  Enrich worker: ${workers.enrich ? "started" : "not started"}`);

  const healthAfterStart = await getWorkersHealth();
  console.assert(
    healthAfterStart.workersRunning === true,
    "Workers should be running",
  );

  console.log("  Workers running, waiting 3s for job processing...");
  await new Promise((r) => setTimeout(r, 3000));

  const statsAfterProcessing = await getQueueStats();
  if (statsAfterProcessing) {
    console.log("\n  Stats after processing:");
    console.log(
      `  Extract: completed=${statsAfterProcessing.extract.completed}, failed=${statsAfterProcessing.extract.failed}`,
    );
    console.log(
      `  Link: completed=${statsAfterProcessing.link.completed}, failed=${statsAfterProcessing.link.failed}`,
    );
    console.log(
      `  Enrich: completed=${statsAfterProcessing.enrich.completed}, failed=${statsAfterProcessing.enrich.failed}`,
    );
  }

  console.log("\n  Stopping workers...");
  await stopAllWorkers();

  console.log("✓ Worker lifecycle completed");
}

async function cleanupTestJobs() {
  console.log("\nCleaning up test jobs...");

  try {
    if (extractQueue) {
      const extractJobs = await extractQueue.getJobs([
        "waiting",
        "failed",
        "completed",
      ]);
      for (const job of extractJobs) {
        await job.remove().catch(() => {});
      }
      console.log(`  Removed ${extractJobs.length} extract jobs`);
    }

    if (linkQueue) {
      const linkJobs = await linkQueue.getJobs([
        "waiting",
        "failed",
        "completed",
      ]);
      for (const job of linkJobs) {
        await job.remove().catch(() => {});
      }
      console.log(`  Removed ${linkJobs.length} link jobs`);
    }

    if (enrichQueue) {
      const enrichJobs = await enrichQueue.getJobs([
        "waiting",
        "failed",
        "completed",
      ]);
      for (const job of enrichJobs) {
        await job.remove().catch(() => {});
      }
      console.log(`  Removed ${enrichJobs.length} enrich jobs`);
    }

    console.log("✓ Test jobs cleaned up");
  } catch (err) {
    console.log("⚠ Cleanup error (non-fatal):", (err as Error).message);
  }
}

async function cleanupTestPage() {
  console.log("\nCleaning up test page...");

  const testPage = await prisma.page.findFirst({
    where: { slug: "test-queue-page" },
  });

  if (testPage) {
    await prisma.pageEntity.deleteMany({ where: { pageId: testPage.id } });
    await prisma.page.delete({ where: { id: testPage.id } });
    console.log("✓ Test page deleted");
  } else {
    console.log("  No test page to clean up");
  }
}

async function runTests() {
  console.log("=== Queue System Tests ===\n");

  try {
    const redisAvailable = await testRedisConnection();

    if (!redisAvailable) {
      console.log("\n=== Skipping tests (Redis not available) ===");
      process.exit(0);
    }

    await setupTestData();
    await testQueueInitialization();
    await testAddExtractJob();
    await testAddLinkJob();
    await testAddEnrichJob();
    await testGetQueueStats();
    await testWorkersHealth();
    await testWorkerLifecycle();
    await cleanupTestJobs();
    await cleanupTestPage();
    await closeQueues();
    await prisma.$disconnect();

    console.log("\n=== All queue tests passed ===");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    await closeQueues().catch(() => {});
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

runTests();
