import { prisma } from "./src/server/db";
import { createApiKey } from "./src/server/api-keys";

async function runTest() {
    console.log("Starting Leak Revocation Test...");

    // 1. Find a user
    const user = await prisma.user.findFirst();
    if (!user) {
        console.error("No user found in database. Please register first.");
        process.exit(1);
    }
    console.log(`Testing with user: ${user.email}`);

    // 2. Create a fresh API key
    const keyObj = await createApiKey({
        userId: user.id,
        label: "Leak Protection Test Key",
        environment: "PRODUCTION"
    });
    console.log(`Created test key: ${keyObj.prefix}... (Plaintext: ${keyObj.key})`);

    // 3. Trigger the revocation API (simulate finding it on GitHub)
    console.log("Simulating leak report to /api/v1/keys/leak-revoke...");
    const response = await fetch("http://subsplit.co/api/v1/keys/leak-revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: keyObj.key })
    });

    const result = await response.json();
    console.log("API Response:", result);

    if (!result.ok || result.status !== "REVOKED") {
        console.error("Revocation failed!");
        process.exit(1);
    }

    // 4. Verify in DB
    const updatedKey = await prisma.apiKey.findUnique({
        where: { id: keyObj.id },
        select: { revokedAt: true }
    });

    if (updatedKey?.revokedAt) {
        console.log("✅ Success: Key successfully marked as revoked in database.");
    } else {
        console.error("❌ Error: Key is NOT marked as revoked in database.");
        process.exit(1);
    }

    // 5. Check for notification
    const notif = await prisma.notification.findFirst({
        where: { userId: user.id, title: "Security Alert: Key Leaked" },
        orderBy: { createdAt: "desc" }
    });

    if (notif) {
        console.log(`✅ Success: User notification created: "${notif.message}"`);
    } else {
        console.error("❌ Error: Security notification not found.");
        process.exit(1);
    }

    console.log("Test completed successfully!");
    process.exit(0);
}

runTest().catch(err => {
    console.error("Test failed with error:", err);
    process.exit(1);
});
