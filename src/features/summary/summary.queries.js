// src/features/summary/summary.queries.js

import { prisma } from "../../core/db/prisma.js";
import { startOfDay, startOfWeek, startOfMonth, subDays } from "date-fns";

// ─────────────────────────────────────────────
// TODAY
// ─────────────────────────────────────────────
export async function getTodayExpenses(userId) {
  const today = startOfDay(new Date());
  return prisma.expense.findMany({
    where: { userId, date: { gte: today } },
  });
}

// ─────────────────────────────────────────────
// YESTERDAY
// ─────────────────────────────────────────────
export async function getYesterdayExpenses(userId) {
  const yesterday = startOfDay(subDays(new Date(), 1));
  const today = startOfDay(new Date());

  return prisma.expense.findMany({
    where: {
      userId,
      date: { gte: yesterday, lt: today },
    },
  });
}

// ─────────────────────────────────────────────
// THIS WEEK
// ─────────────────────────────────────────────
export async function getThisWeekExpenses(userId) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  return prisma.expense.findMany({
    where: { userId, date: { gte: weekStart } },
  });
}

// ─────────────────────────────────────────────
// THIS MONTH
// ─────────────────────────────────────────────
export async function getThisMonthExpenses(userId) {
  const monthStart = startOfMonth(new Date());

  return prisma.expense.findMany({
    where: { userId, date: { gte: monthStart } },
  });
}

// ─────────────────────────────────────────────
// LAST 5 TRANSACTIONS
// ─────────────────────────────────────────────
export async function getLast5Expenses(userId) {
  return prisma.expense.findMany({
    where: { userId },
    take: 5,
  });
}

// ─────────────────────────────────────────────
// CATEGORY FILTER
// ─────────────────────────────────────────────
export async function getExpensesByCategory(userId, category) {
  return prisma.expense.findMany({
    where: { userId, category },
  });
}

// ─────────────────────────────────────────────
// CUSTOM DATE RANGE
// ─────────────────────────────────────────────
export async function getExpensesByRange(userId, from, to) {
  return prisma.expense.findMany({
    where: {
      userId,
      date: {
        gte: new Date(from + "T00:00:00.000Z"),
        lt: new Date(to + "T23:59:59.999Z"),
      },
    },
  });
}
