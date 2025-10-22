-- CreateTable
CREATE TABLE "passwords" (
    "hash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "passwords_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "passwords_userId_key" ON "passwords"("userId");

-- AddForeignKey
ALTER TABLE "passwords" ADD CONSTRAINT "passwords_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
