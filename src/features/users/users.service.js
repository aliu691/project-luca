import { findUserByPhone, createUser } from "../../core/db/users.js";

export function getOrCreateUser(phone) {
  let user = findUserByPhone(phone);
  if (!user) {
    user = createUser(phone);
    console.log("🆕 New user created:", user);
  }
  return user;
}
