import { prisma } from "../../core/db/prisma.js";
import { startOfDay, startOfWeek, startOfMonth, subDays } from "date-fns";

export async function getTodayExpenses(userId) {
  const today = startOfDay(new Date());
  return prisma.expense.findMany({
    where: { userId, date: { gte: today } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getYesterdayExpenses(userId) {
  const yesterday = startOfDay(subDays(new Date(), 1));
  const today = startOfDay(new Date());

  return prisma.expense.findMany({
    where: { userId, date: { gte: yesterday, lt: today } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getThisWeekExpenses(userId) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  return prisma.expense.findMany({
    where: { userId, date: { gte: weekStart } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getThisMonthExpenses(userId) {
  const monthStart = startOfMonth(new Date());

  return prisma.expense.findMany({
    where: { userId, date: { gte: monthStart } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getLast5Expenses(userId) {
  return prisma.expense.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
}

export async function getExpensesByCategory(userId, category) {
  return prisma.expense.findMany({
    where: { userId, category },
    orderBy: { createdAt: "asc" },
  });
}

export async function getExpensesByRange(userId, from, to) {
  return prisma.expense.findMany({
    where: {
      userId,
      date: {
        gte: new Date(from + "T00:00:00.000Z"),
        lt: new Date(to + "T23:59:59.999Z"),
      },
    },
    orderBy: { createdAt: "asc" },
  });
}
