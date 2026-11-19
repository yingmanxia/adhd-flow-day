-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('HIGH', 'MED', 'LOW');

-- CreateEnum
CREATE TYPE "TaskBucket" AS ENUM ('INBOX', 'UNSCHEDULED', 'SCHEDULED', 'TODAY', 'DONE');

-- CreateEnum
CREATE TYPE "FocusSessionStatus" AS ENUM ('RUNNING', 'PAUSED', 'COMPLETED', 'EARLY_STOPPED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Shanghai',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "motivation" TEXT,
    "expectedDate" DATE,
    "status" "PlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "planId" UUID,
    "dailyPlanId" UUID,
    "title" TEXT NOT NULL,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MED',
    "bucket" "TaskBucket" NOT NULL DEFAULT 'INBOX',
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "estimateMin" INTEGER,
    "actualMin" INTEGER,
    "deferCount" INTEGER NOT NULL DEFAULT 0,
    "isFrog" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "scheduledDate" DATE,
    "isFromSchedule" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyPlan" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "planDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompletionLog" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "statDate" DATE NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "estimateMin" INTEGER,
    "actualMin" INTEGER,

    CONSTRAINT "CompletionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FocusSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "taskId" UUID,
    "status" "FocusSessionStatus" NOT NULL DEFAULT 'RUNNING',
    "plannedSec" INTEGER NOT NULL,
    "actualFocusSec" INTEGER NOT NULL DEFAULT 0,
    "pauseCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "statDate" DATE NOT NULL,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FocusSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" BIGSERIAL NOT NULL,
    "userId" UUID,
    "eventName" TEXT NOT NULL,
    "props" JSONB NOT NULL DEFAULT '{}',
    "sessionId" TEXT NOT NULL,
    "eventId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Plan_userId_status_idx" ON "Plan"("userId", "status");

-- CreateIndex
CREATE INDEX "Task_userId_bucket_idx" ON "Task"("userId", "bucket");

-- CreateIndex
CREATE INDEX "Task_userId_bucket_scheduledDate_idx" ON "Task"("userId", "bucket", "scheduledDate");

-- CreateIndex
CREATE INDEX "Task_planId_idx" ON "Task"("planId");

-- CreateIndex
CREATE INDEX "Task_dailyPlanId_idx" ON "Task"("dailyPlanId");

-- CreateIndex
CREATE INDEX "Task_deletedAt_idx" ON "Task"("deletedAt");

-- CreateIndex
CREATE INDEX "Step_taskId_orderIndex_idx" ON "Step"("taskId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPlan_userId_planDate_key" ON "DailyPlan"("userId", "planDate");

-- CreateIndex
CREATE INDEX "CompletionLog_userId_statDate_idx" ON "CompletionLog"("userId", "statDate");

-- CreateIndex
CREATE INDEX "CompletionLog_taskId_idx" ON "CompletionLog"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "FocusSession_idempotencyKey_key" ON "FocusSession"("idempotencyKey");

-- CreateIndex
CREATE INDEX "FocusSession_userId_statDate_idx" ON "FocusSession"("userId", "statDate");

-- CreateIndex
CREATE INDEX "FocusSession_taskId_idx" ON "FocusSession"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_eventId_key" ON "Event"("eventId");

-- CreateIndex
CREATE INDEX "Event_occurredAt_idx" ON "Event"("occurredAt");

-- CreateIndex
CREATE INDEX "Event_eventName_occurredAt_idx" ON "Event"("eventName", "occurredAt");

-- CreateIndex
CREATE INDEX "Event_userId_idx" ON "Event"("userId");

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_dailyPlanId_fkey" FOREIGN KEY ("dailyPlanId") REFERENCES "DailyPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step" ADD CONSTRAINT "Step_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPlan" ADD CONSTRAINT "DailyPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletionLog" ADD CONSTRAINT "CompletionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletionLog" ADD CONSTRAINT "CompletionLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocusSession" ADD CONSTRAINT "FocusSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocusSession" ADD CONSTRAINT "FocusSession_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
