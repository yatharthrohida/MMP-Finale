CREATE TABLE "CommunityIssueReport" (
  "id" TEXT NOT NULL,
  "reporterId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "locationName" TEXT NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "imageUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'UNVERIFIED',
  "verificationCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommunityIssueReport_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CommunityIssueVerification" (
  "id" TEXT NOT NULL,
  "issueId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityIssueVerification_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CommunityIssueVerification_issueId_userId_key" ON "CommunityIssueVerification"("issueId", "userId");
CREATE INDEX "CommunityIssueReport_status_createdAt_idx" ON "CommunityIssueReport"("status", "createdAt");
CREATE INDEX "CommunityIssueReport_category_status_idx" ON "CommunityIssueReport"("category", "status");
CREATE INDEX "CommunityIssueReport_reporterId_idx" ON "CommunityIssueReport"("reporterId");
CREATE INDEX "CommunityIssueVerification_userId_idx" ON "CommunityIssueVerification"("userId");
ALTER TABLE "CommunityIssueReport" ADD CONSTRAINT "CommunityIssueReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityIssueVerification" ADD CONSTRAINT "CommunityIssueVerification_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "CommunityIssueReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityIssueVerification" ADD CONSTRAINT "CommunityIssueVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
