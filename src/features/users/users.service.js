// src/features/users/user.service.js

import { prisma } from "../../core/db/prisma.js";

/**
 * Fetch user by phone
 */
export async function findUserByPhone(phone) {
  return prisma.user.findUnique({
    where: { phone },
  });
}

/**
 * Create a new user
 */
export async function createUser(phone) {
  return prisma.user.create({
    data: {
      phone,
      joinDate: new Date(),
    },
  });
}

/**
 * Fetch OR create a user.
 * Sends the welcome message on first registration.
 */
export async function getOrCreateUser(phone, client = null, msg = null) {
  let user = await findUserByPhone(phone);

  if (!user) {
    user = await createUser(phone);

    console.log("🆕 New user created:", user);

    // Send welcome message (only if handler passes client + msg)
    if (client && msg) {
      await client.sendText(
        msg.from,
        "👋 Welcome to LUCA! You're now registered."
      );
    }
  }

  return user;
}
