// Runs one SQL file against the production database through the Supabase
// Management API and prints the result. For the migrations the policy keeps
// with the owner (drops, rewrites): the owner runs it, Claude only writes it.
//
//   node scripts/apply-migration.mjs supabase/migrations/0087_drop_community.sql
//
// Reads the token from ~/.supabase/access-token and never prints it.
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { homedir } from "node:os";

const file = process.argv[2];
if (!file) throw new Error("usage: node scripts/apply-migration.mjs <file.sql>");
const token = readFileSync(`${homedir()}/.supabase/access-token`, "utf8").trim();
// supabase/.temp is gone from this working tree; the committed copy has the ref.
const ref = execSync("git show HEAD:supabase/.temp/project-ref").toString().trim();

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: readFileSync(file, "utf8") }),
});
console.log(res.status, JSON.stringify(await res.json(), null, 1));
