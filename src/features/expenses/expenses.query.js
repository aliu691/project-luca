import { prisma } from "../../core/db/prisma.js";
import { startOfDay, startOfWeek, startOfMonth, subDays } from "date-fns";

export async function getTodayExpenses(userId) {
  const today = startOfDay(new Date());
  return prisma.expense.findMany({
    where: { userId, date: { gte: today } },
    orderBy: { date: "desc" },
  });
}

export async function getYesterdayExpenses(userId) {
  const yesterday = startOfDay(subDays(new Date(), 1));
  const today = startOfDay(new Date());

  return prisma.expense.findMany({
    where: { userId, date: { gte: yesterday, lt: today } },
    orderBy: { date: "desc" },
  });
}

export async function getThisWeekExpenses(userId) {
  const week = startOfWeek(new Date(), { weekStartsOn: 1 });
  return prisma.expense.findMany({
    where: { userId, date: { gte: week } },
    orderBy: { date: "desc" },
  });
}

export async function getThisMonthExpenses(userId) {
  const month = startOfMonth(new Date());
  return prisma.expense.findMany({
    where: { userId, date: { gte: month } },
    orderBy: { date: "desc" },
  });
}
