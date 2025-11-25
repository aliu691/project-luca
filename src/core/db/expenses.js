import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src/core/db/expenses.db.json");

function ensureDb() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ expenses: [] }, null, 2));
  }
}
export function loadExpenses() {
  ensureDb();
  const raw = fs.readFileSync(dbPath, "utf8");
  return JSON.parse(raw).expenses;
}
export function saveExpenses(expenses) {
  fs.writeFileSync(dbPath, JSON.stringify({ expenses }, null, 2));
}
export function createExpense(expense) {
  const expenses = loadExpenses();
  const id = expenses.length ? expenses[expenses.length - 1].id + 1 : 1;
  const record = { id, ...expense, createdAt: new Date().toISOString() };
  expenses.push(record);
  saveExpenses(expenses);
  return record;
}
