import * as fs from "node:fs";
import * as path from "node:path";

export interface User {
  user_id: string;
  email: string;
  password_hash: string;
  name: string;
  store_name: string;
  bio: string;
  whatsapp_number: string;
  picture: string;
  created_at: string;
}

export interface Item {
  item_id: string;
  user_id: string;
  name: string;
  price: number;
  category: "Plants" | "Pots" | "Tools" | "Seeds" | "Accessories";
  description: string;
  stock: number;
  image_base64: string;
  created_at: string;
}

export interface Session {
  session_id: string;
  user_id: string;
  created_at: string;
}

interface DBStructure {
  users: User[];
  items: Item[];
  sessions: Session[];
}

const DB_PATH = path.join(process.cwd(), "db.json");

function initDB(): DBStructure {
  if (!fs.existsSync(DB_PATH)) {
    const initial: DBStructure = { users: [], items: [], sessions: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch {
    const initial: DBStructure = { users: [], items: [], sessions: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
}

export function getDB(): DBStructure {
  return initDB();
}

export function saveDB(db: DBStructure): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}
