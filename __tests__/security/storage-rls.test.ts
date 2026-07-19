import { describe, it, expect, beforeAll } from "vitest";
import { hasTestDb, getTestClient, randomSuffix } from "./test-db";
import { createClient } from "@supabase/supabase-js";

describe.skipIf(!hasTestDb)("P1-19: Storage Bucket RLS Protection", () => {
  let adminClient: any;
  let anonClient: any;
  let fileName: string;

  beforeAll(async () => {
    if (!hasTestDb) return;
    adminClient = getTestClient();
    
    // Create Anon client
    anonClient = createClient(process.env.TEST_SUPABASE_URL!, process.env.TEST_SUPABASE_ANON_KEY!);

    // Upload a dummy file to the finance_attachments bucket using service_role
    fileName = `test-receipt-${randomSuffix()}.jpg`;
    
    // Create the bucket if it doesn't exist (assuming it's finance_attachments)
    await adminClient.storage.createBucket("finance_attachments", { public: false });
    
    await adminClient.storage.from("finance_attachments").upload(fileName, "dummy data", {
      contentType: "image/jpeg",
    });
  });

  it("finance_attachments bucket objects are not fetchable without a valid signed URL", async () => {
    // Attempt to download the file directly via the anon client (which tests public access)
    const { data, error } = await anonClient.storage.from("finance_attachments").download(fileName);
    
    // Because public access is disabled and RLS should be active, it should fail.
    expect(error).toBeDefined();
    expect(data).toBeNull();
  });
});
