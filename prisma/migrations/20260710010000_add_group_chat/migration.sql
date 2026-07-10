-- CreateTable
CREATE TABLE "ChatGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3),

    CONSTRAINT "ChatGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3),

    CONSTRAINT "ChatGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatGroupMessage" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "replyToId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),

    CONSTRAINT "ChatGroupMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatGroupReaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatGroupReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatGroupTyping" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatGroupTyping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatGroup_createdById_updatedAt_idx" ON "ChatGroup"("createdById", "updatedAt");
CREATE INDEX "ChatGroup_lastMessageAt_idx" ON "ChatGroup"("lastMessageAt");
CREATE UNIQUE INDEX "ChatGroupMember_groupId_userId_key" ON "ChatGroupMember"("groupId", "userId");
CREATE INDEX "ChatGroupMember_userId_joinedAt_idx" ON "ChatGroupMember"("userId", "joinedAt");
CREATE INDEX "ChatGroupMember_groupId_lastReadAt_idx" ON "ChatGroupMember"("groupId", "lastReadAt");
CREATE INDEX "ChatGroupMessage_groupId_createdAt_idx" ON "ChatGroupMessage"("groupId", "createdAt");
CREATE INDEX "ChatGroupMessage_senderId_createdAt_idx" ON "ChatGroupMessage"("senderId", "createdAt");
CREATE INDEX "ChatGroupMessage_replyToId_idx" ON "ChatGroupMessage"("replyToId");
CREATE UNIQUE INDEX "ChatGroupReaction_messageId_userId_key" ON "ChatGroupReaction"("messageId", "userId");
CREATE INDEX "ChatGroupReaction_messageId_idx" ON "ChatGroupReaction"("messageId");
CREATE INDEX "ChatGroupReaction_userId_idx" ON "ChatGroupReaction"("userId");
CREATE UNIQUE INDEX "ChatGroupTyping_groupId_userId_key" ON "ChatGroupTyping"("groupId", "userId");
CREATE INDEX "ChatGroupTyping_groupId_updatedAt_idx" ON "ChatGroupTyping"("groupId", "updatedAt");

-- AddForeignKey
ALTER TABLE "ChatGroup" ADD CONSTRAINT "ChatGroup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatGroupMember" ADD CONSTRAINT "ChatGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ChatGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatGroupMember" ADD CONSTRAINT "ChatGroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatGroupMessage" ADD CONSTRAINT "ChatGroupMessage_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ChatGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatGroupMessage" ADD CONSTRAINT "ChatGroupMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatGroupMessage" ADD CONSTRAINT "ChatGroupMessage_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "ChatGroupMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ChatGroupReaction" ADD CONSTRAINT "ChatGroupReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatGroupMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatGroupReaction" ADD CONSTRAINT "ChatGroupReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatGroupTyping" ADD CONSTRAINT "ChatGroupTyping_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ChatGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatGroupTyping" ADD CONSTRAINT "ChatGroupTyping_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
