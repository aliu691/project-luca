//users helper class

import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src/core/db/users.db.json");

export function loadUsers() {
  const raw = fs.readFileSync(dbPath, "utf8");
  return JSON.parse(raw).users;
}

export function saveUsers(users) {
  const data = { users };
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

export function findUserByPhone(phone) {
  const users = loadUsers();
  return users.find((u) => u.phone === phone);
}

export function createUser(phone) {
  const users = loadUsers();

  const newUser = {
    phone,
    joinDate: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  return newUser;
}
