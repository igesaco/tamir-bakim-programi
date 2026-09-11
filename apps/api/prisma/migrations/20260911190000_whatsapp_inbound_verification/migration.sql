ALTER TABLE "CustomerPortalChallenge"
ADD COLUMN "channel" TEXT NOT NULL DEFAULT 'SMS',
ADD COLUMN "whatsappConfirmedAt" TIMESTAMP(3);

CREATE INDEX "CustomerPortalChallenge_channel_expiresAt_idx"
ON "CustomerPortalChallenge"("channel", "expiresAt");
