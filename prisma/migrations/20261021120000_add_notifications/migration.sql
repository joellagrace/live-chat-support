-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "url" TEXT,
    "dedupeKey" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPref" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationPref_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_shop_customerId_createdAt_idx" ON "Notification"("shop", "customerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_shop_customerId_dedupeKey_key" ON "Notification"("shop", "customerId", "dedupeKey");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPref_shop_customerId_type_key" ON "NotificationPref"("shop", "customerId", "type");
