import * as p from "@clack/prompts";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { wrangler, WranglerError } from "../lib/wrangler.js";

interface DatabaseResult {
  databaseId: string;
  databaseName: string;
}

export async function createDatabase(
  repoDir: string,
  databaseName: string,
  accountId: string,
): Promise<DatabaseResult> {
  const s = p.spinner();

  // Create D1 database — keep this in pipe mode so we can parse the ID and
  // detect the "already exists" case via captured stderr.
  s.start("D1 データベース作成中...");
  let databaseId: string;
  try {
    const output = await wrangler(["d1", "create", databaseName]);
    // Parse database_id from TOML or JSON format
    const tomlMatch = output.match(/database_id\s*=\s*"([^"]+)"/);
    const jsonMatch = output.match(/"database_id"\s*:\s*"([^"]+)"/);
    const uuidMatch = output.match(
      /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
    );
    const match = tomlMatch || jsonMatch || uuidMatch;
    if (!match) {
      throw new Error(`D1 ID をパースできません: ${output}`);
    }
    databaseId = match[1];
    s.stop("D1 データベース作成完了");
  } catch (error) {
    if (
      error instanceof WranglerError &&
      error.stderr.includes("already exists")
    ) {
      s.stop("D1 データベースは既に存在します");
      const listOutput = await wrangler(["d1", "list", "--json"]);
      const databases = JSON.parse(listOutput);
      const db = databases.find(
        (d: { name: string }) => d.name === databaseName,
      );
      if (!db) {
        throw new Error("既存の D1 データベースが見つかりません");
      }
      databaseId = db.uuid;
    } else {
      s.stop("D1 データベース作成失敗");
      throw error;
    }
  }

  // Apply migrations via wrangler's native d1_migrations tracking.
  // We swap wrangler.toml to a config pointing at the freshly-created DB so
  // `wrangler d1 migrations apply` resolves it, then restore the original.
  const workerDir = join(repoDir, "apps/worker");
  const tomlPath = join(workerDir, "wrangler.toml");
  const originalToml = existsSync(tomlPath)
    ? readFileSync(tomlPath, "utf-8")
    : null;

  s.start("マイグレーション適用中...");
  try {
    const migrateToml = `name = "${databaseName}"
main = "src/index.ts"
compatibility_date = "2024-12-01"
account_id = "${accountId}"

[[d1_databases]]
binding = "DB"
database_name = "${databaseName}"
database_id = "${databaseId}"
migrations_dir = "../../packages/db/migrations"
`;
    writeFileSync(tomlPath, migrateToml);
    await wrangler(
      ["d1", "migrations", "apply", databaseName, "--remote"],
      { cwd: workerDir },
    );
    s.stop("マイグレーション適用完了");
  } catch (error) {
    s.stop("マイグレーション適用失敗");
    throw error;
  } finally {
    if (originalToml !== null) {
      writeFileSync(tomlPath, originalToml);
    }
  }

  return { databaseId, databaseName };
}
