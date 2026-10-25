// Where Keyhole keeps its files in a project (ADR-0005). A leaf: it imports
// nothing, so the MCP server can know the cache's path without importing the
// code that reads `.env` (src/test/mcpServer.test.ts checks that wall). The
// names are provisional until the naming review rules.

export const KEYHOLE_FOLDER = '.keyhole';
/** The project's requests, committed: names and the assistant's words, never a value. */
export const INBOX_FILE = `${KEYHOLE_FOLDER}/inbox.json`;
/** Keyhole's cache, ignored by git: whether each name is set, its length and keyprint, never a value. */
export const STATUS_FILE = `${KEYHOLE_FOLDER}/status.local.json`;
