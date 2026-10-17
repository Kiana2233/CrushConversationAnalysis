import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { ChatSession, SessionSummary, Message, OverallAnalysis } from "@/types/chat";

// 保证 data 存储目录存在
const dbDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "wechat_chat.db");

// 单例 SQLite 连接
let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(dbPath);
    dbInstance.pragma("journal_mode = WAL");
    initSchema(dbInstance);
  }
  return dbInstance;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      crush_name TEXT DEFAULT '',
      my_name TEXT DEFAULT '',
      relationship_status TEXT DEFAULT 'Crush / 暧昧升温中',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      messages_json TEXT NOT NULL DEFAULT '[]',
      analysis_json TEXT DEFAULT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON sessions(updated_at DESC);
  `);
}

/**
 * 获取所有会话列表摘要（按最近更新时间倒序排）
 */
export function listSessionSummaries(): SessionSummary[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, title, crush_name, my_name, relationship_status, created_at, updated_at, messages_json, analysis_json
    FROM sessions
    ORDER BY updated_at DESC
  `);

  const rows = stmt.all() as any[];

  return rows.map((row) => {
    let messages: Message[] = [];
    try {
      messages = JSON.parse(row.messages_json || "[]");
    } catch {
      messages = [];
    }

    let analysis: OverallAnalysis | null = null;
    try {
      if (row.analysis_json) {
        analysis = JSON.parse(row.analysis_json);
      }
    } catch {
      analysis = null;
    }

    const lastMsg = messages[messages.length - 1];
    const lastSnippet = lastMsg ? `${lastMsg.sender}: ${lastMsg.content.slice(0, 30)}` : "暂无消息";

    return {
      id: row.id,
      title: row.title,
      crushName: row.crush_name || "",
      myName: row.my_name || "",
      relationshipStatus: row.relationship_status || "Crush / 暧昧中",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      messageCount: messages.length,
      affectionScore: analysis?.affectionScore ?? null,
      affectionStage: analysis?.affectionStage ?? null,
      lastMessageSnippet: lastSnippet,
    };
  });
}

/**
 * 根据 ID 获取单次会话详情
 */
export function getSessionById(id: string): ChatSession | null {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, title, crush_name, my_name, relationship_status, created_at, updated_at, messages_json, analysis_json
    FROM sessions
    WHERE id = ?
  `);

  const row = stmt.get(id) as any;
  if (!row) return null;

  let messages: Message[] = [];
  try {
    messages = JSON.parse(row.messages_json || "[]");
  } catch {
    messages = [];
  }

  let overallAnalysis: OverallAnalysis | undefined = undefined;
  try {
    if (row.analysis_json) {
      overallAnalysis = JSON.parse(row.analysis_json);
    }
  } catch {
    overallAnalysis = undefined;
  }

  return {
    id: row.id,
    title: row.title,
    crushName: row.crush_name || "",
    myName: row.my_name || "",
    relationshipStatus: row.relationship_status || "Crush / 暧昧中",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    messages,
    overallAnalysis,
  };
}

/**
 * 保存或更新会话（Upsert）
 */
export function saveSession(session: ChatSession): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO sessions (
      id, title, crush_name, my_name, relationship_status, created_at, updated_at, messages_json, analysis_json
    ) VALUES (
      @id, @title, @crush_name, @my_name, @relationship_status, @created_at, @updated_at, @messages_json, @analysis_json
    )
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      crush_name = excluded.crush_name,
      my_name = excluded.my_name,
      relationship_status = excluded.relationship_status,
      updated_at = excluded.updated_at,
      messages_json = excluded.messages_json,
      analysis_json = excluded.analysis_json
  `);

  stmt.run({
    id: session.id,
    title: session.title,
    crush_name: session.crushName || "",
    my_name: session.myName || "",
    relationship_status: session.relationshipStatus || "Crush / 暧昧中",
    created_at: session.createdAt || Date.now(),
    updated_at: session.updatedAt || Date.now(),
    messages_json: JSON.stringify(session.messages || []),
    analysis_json: session.overallAnalysis ? JSON.stringify(session.overallAnalysis) : null,
  });
}

/**
 * 重命名会话标题
 */
export function renameSession(id: string, newTitle: string): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE sessions
    SET title = ?, updated_at = ?
    WHERE id = ?
  `);
  stmt.run(newTitle, Date.now(), id);
}

/**
 * 删除会话
 */
export function deleteSession(id: string): void {
  const db = getDatabase();
  const stmt = db.prepare(`DELETE FROM sessions WHERE id = ?`);
  stmt.run(id);
}
