-- AlterTable
ALTER TABLE "UserResult" ADD COLUMN     "masterDataReleaseId" TEXT,
ADD COLUMN     "masterDataVersion" TEXT,
ADD COLUMN     "matchingEngineVersion" TEXT;

-- CreateTable
CREATE TABLE "MasterDataRelease" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "snapshotJson" JSONB,
    "baseReleaseId" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "MasterDataRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StartupItemDraft" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "sourceItemId" INTEGER,
    "rowStatus" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "coreSkills" TEXT NOT NULL,
    "investmentRange" TEXT NOT NULL,
    "investmentMin" INTEGER NOT NULL,
    "investmentMax" INTEGER,
    "competencyScores" JSONB NOT NULL,
    "operationType" TEXT NOT NULL,
    "requiredStaff" TEXT NOT NULL,
    "weekendWork" TEXT NOT NULL,
    "workLifeBalance" INTEGER NOT NULL,
    "seasonality" TEXT NOT NULL,
    "requiredLicense" TEXT NOT NULL,
    "avgMonthlyRevenue" TEXT NOT NULL,
    "operatingMargin" TEXT NOT NULL,
    "breakeven" TEXT NOT NULL,
    "competitionLevel" INTEGER NOT NULL,
    "differentiationRoom" INTEGER NOT NULL,
    "closureRate" TEXT NOT NULL,
    "growthPotential" INTEGER NOT NULL,
    "entryBarrier" INTEGER NOT NULL,

    CONSTRAINT "StartupItemDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetencyQuestionDraft" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "sourceQuestionId" INTEGER,
    "payload" JSONB NOT NULL,

    CONSTRAINT "CompetencyQuestionDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HardFilterDraft" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "sourceFilterId" TEXT,
    "payload" JSONB NOT NULL,

    CONSTRAINT "HardFilterDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalityQuestionDraft" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "sourceQuestionId" INTEGER,
    "payload" JSONB NOT NULL,

    CONSTRAINT "PersonalityQuestionDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerSynergyDraft" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "careerKey" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "CareerSynergyDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetencyGuideDraft" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "sourceGuideKey" TEXT,
    "payload" JSONB NOT NULL,

    CONSTRAINT "CompetencyGuideDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MasterDataRelease_version_key" ON "MasterDataRelease"("version");

-- CreateIndex
CREATE INDEX "MasterDataRelease_status_publishedAt_idx" ON "MasterDataRelease"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "StartupItemDraft_releaseId_rowStatus_idx" ON "StartupItemDraft"("releaseId", "rowStatus");

-- CreateIndex
CREATE INDEX "StartupItemDraft_releaseId_category_idx" ON "StartupItemDraft"("releaseId", "category");

-- CreateIndex
CREATE INDEX "CompetencyQuestionDraft_releaseId_idx" ON "CompetencyQuestionDraft"("releaseId");

-- CreateIndex
CREATE INDEX "HardFilterDraft_releaseId_idx" ON "HardFilterDraft"("releaseId");

-- CreateIndex
CREATE INDEX "PersonalityQuestionDraft_releaseId_idx" ON "PersonalityQuestionDraft"("releaseId");

-- CreateIndex
CREATE INDEX "CareerSynergyDraft_releaseId_careerKey_idx" ON "CareerSynergyDraft"("releaseId", "careerKey");

-- CreateIndex
CREATE INDEX "CompetencyGuideDraft_releaseId_idx" ON "CompetencyGuideDraft"("releaseId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_targetType_idx" ON "AdminAuditLog"("action", "targetType");

