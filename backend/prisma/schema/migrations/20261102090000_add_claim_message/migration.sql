-- CreateTable
CREATE TABLE "claim_messages" (
    "id" UUID NOT NULL,
    "claim_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "read_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "claim_messages_claim_id_created_at_idx" ON "claim_messages"("claim_id", "created_at");

-- AddForeignKey
ALTER TABLE "claim_messages" ADD CONSTRAINT "claim_messages_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_messages" ADD CONSTRAINT "claim_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create partial index for unread messages
CREATE INDEX "claim_messages_unread_idx"
ON "claim_messages" ("claim_id", "created_at")
WHERE "read_at" IS NULL;

-- Ensure message body contains 1 to 2000 characters
ALTER TABLE "claim_messages"
ADD CONSTRAINT "claim_messages_body_length_check"
CHECK (char_length("body") BETWEEN 1 AND 2000);
