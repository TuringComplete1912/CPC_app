-- CreateTable
CREATE TABLE "PartyInfo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "politicalStatus" TEXT NOT NULL DEFAULT '群众',
    "className" TEXT NOT NULL DEFAULT '',
    "hometown" TEXT NOT NULL DEFAULT '',
    "wechatQQ" TEXT NOT NULL DEFAULT '',
    "joinLeagueDate" DATETIME,
    "activistDate" DATETIME,
    "probationaryDate" DATETIME,
    "formalDate" DATETIME,
    "showPoliticalStatus" BOOLEAN NOT NULL DEFAULT true,
    "showClassName" BOOLEAN NOT NULL DEFAULT true,
    "showHometown" BOOLEAN NOT NULL DEFAULT true,
    "showWechatQQ" BOOLEAN NOT NULL DEFAULT false,
    "showJoinLeagueDate" BOOLEAN NOT NULL DEFAULT true,
    "showActivistDate" BOOLEAN NOT NULL DEFAULT true,
    "showProbationaryDate" BOOLEAN NOT NULL DEFAULT true,
    "showFormalDate" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartyInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnswerLike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "AnswerLike_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AnswerLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reply" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answerId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "Reply_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PartyInfo_userId_key" ON "PartyInfo"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerLike_answerId_userId_key" ON "AnswerLike"("answerId", "userId");
