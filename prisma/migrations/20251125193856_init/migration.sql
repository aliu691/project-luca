-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "phone" TEXT NOT NULL,
    "joinDate" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userPhone" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "merchant" TEXT,
    "category" TEXT,
    "date" TEXT NOT NULL,
    "notes" TEXT,
    "raw_text" TEXT,
    CONSTRAINT "Expense_userPhone_fkey" FOREIGN KEY ("userPhone") REFERENCES "User" ("phone") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
