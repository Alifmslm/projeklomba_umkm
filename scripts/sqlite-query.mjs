// SQL runner for the verification scripts, so shell quoting never reaches SQLite.
// Also usable on its own when a SQLite answer is wanted without touching psql.
//
//   node scripts/sqlite-query.mjs "select id,name from umkms order by id"
//   node scripts/sqlite-query.mjs query.sql
//
// The SQL may be given inline or as a path to a .sql file. Printed as JSON.
// A statement that does not begin with delete/update/insert is only ever read, so
// an accidental write cannot slip through unnoticed.
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

const argument = process.argv[2] ?? "";
if (!argument) {
  console.error("usage: node scripts/sqlite-query.mjs \"<sql>\" | <file.sql>");
  process.exit(1);
}

const statement = argument.endsWith(".sql")
  ? readFileSync(argument, "utf8").trim()
  : argument.trim();

const db = new DatabaseSync("data.db");
const isWrite = /^(delete|update|insert)/i.test(statement);

try {
  if (isWrite) {
    console.log(JSON.stringify({ changed: db.prepare(statement).run().changes }));
  } else {
    console.log(JSON.stringify(db.prepare(statement).all()));
  }
} catch (error) {
  console.error("FAILED: " + error.message);
  process.exit(1);
}
