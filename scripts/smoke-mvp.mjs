import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const PROJECT_ROOT = process.cwd();
const ENV_LOCAL_PATH = path.join(PROJECT_ROOT, ".env.local");
const BASE_URL =
  process.env.SMOKE_BASE_URL ??
  `http://127.0.0.1:${process.env.PORT ? String(process.env.PORT) : "3000"}`;
const REQUEST_TIMEOUT_MS = 30_000;
const SENSITIVE_KEYS = new Set([
  "userId",
  "user_id",
  "email",
  "profiles",
  "author_profiles.user_id",
  "external_items.user_id",
  "original_content",
  "extracted_content",
  "service_role",
  "access_token",
  "refresh_token",
]);

class SmokeFailure extends Error {
  constructor(label, detail) {
    super(`${label}: ${detail}`);
    this.name = "SmokeFailure";
    this.label = label;
    this.detail = detail;
  }
}

class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  apply(response) {
    const setCookies =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : [];

    for (const setCookie of setCookies) {
      const [pair] = setCookie.split(";", 1);
      const separatorIndex = pair.indexOf("=");

      if (separatorIndex <= 0) {
        continue;
      }

      const name = pair.slice(0, separatorIndex).trim();
      const value = pair.slice(separatorIndex + 1).trim();

      if (!name) {
        continue;
      }

      if (!value) {
        this.cookies.delete(name);
        continue;
      }

      this.cookies.set(name, value);
    }
  }

  header() {
    if (this.cookies.size === 0) {
      return "";
    }

    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }
}

class HttpSession {
  constructor(label) {
    this.label = label;
    this.jar = new CookieJar();
  }

  async request(method, pathname, options = {}) {
    const {
      body,
      expectedStatus,
      headers = {},
      parse = "json",
      allowRedirect = false,
    } = options;

    const requestHeaders = new Headers(headers);
    const cookieHeader = this.jar.header();

    if (cookieHeader) {
      requestHeaders.set("cookie", cookieHeader);
    }

    let requestBody;
    if (body !== undefined) {
      requestHeaders.set("content-type", "application/json");
      requestBody = JSON.stringify(body);
    }

    const response = await fetch(new URL(pathname, BASE_URL), {
      method,
      headers: requestHeaders,
      body: requestBody,
      redirect: allowRedirect ? "follow" : "manual",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    this.jar.apply(response);

    if (expectedStatus !== undefined && response.status !== expectedStatus) {
      throw new SmokeFailure(
        `${this.label} ${method} ${pathname}`,
        `expected ${expectedStatus}, got ${response.status}`,
      );
    }

    if (parse === "text") {
      return {
        response,
        text: await response.text(),
      };
    }

    const payload = await response.json().catch(() => null);

    if (payload === null) {
      throw new SmokeFailure(
        `${this.label} ${method} ${pathname}`,
        "response was not valid JSON",
      );
    }

    return {
      response,
      payload,
    };
  }
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, "utf8");
  const values = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function getPublicSupabaseEnv() {
  const localEnv = parseEnvFile(ENV_LOCAL_PATH);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? localEnv.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? localEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new SmokeFailure(
      "env",
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required",
    );
  }

  return { url, anonKey };
}

function assert(condition, label, detail) {
  if (!condition) {
    throw new SmokeFailure(label, detail);
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new SmokeFailure(label, `expected ${expected}, got ${actual}`);
  }
}

function assertIncludes(haystack, needle, label) {
  if (!haystack.includes(needle)) {
    throw new SmokeFailure(label, `expected HTML to include "${needle}"`);
  }
}

function assertNotIncludes(haystack, needle, label) {
  if (haystack.includes(needle)) {
    throw new SmokeFailure(label, `expected HTML to exclude "${needle}"`);
  }
}

function assertNoSensitiveFields(value, label, extraBlockedKeys = []) {
  const blockedKeys = new Set([...SENSITIVE_KEYS, ...extraBlockedKeys]);
  const visit = (current, currentPath) => {
    if (Array.isArray(current)) {
      current.forEach((item, index) => visit(item, `${currentPath}[${index}]`));
      return;
    }

    if (!current || typeof current !== "object") {
      return;
    }

    for (const [key, child] of Object.entries(current)) {
      const nextPath = currentPath ? `${currentPath}.${key}` : key;

      if (blockedKeys.has(key) || blockedKeys.has(nextPath)) {
        throw new SmokeFailure(label, `found blocked key "${nextPath}"`);
      }

      visit(child, nextPath);
    }
  };

  visit(value, "");
}

function unwrapSuccess(payload, label, extraBlockedKeys = []) {
  assert(payload && typeof payload === "object", label, "missing JSON payload");
  assert(!("error" in payload), label, "expected success payload");
  assert("data" in payload, label, "missing data field");
  assertNoSensitiveFields(payload, label, extraBlockedKeys);
  return payload.data;
}

function expectApiError(payload, code, label) {
  assert(payload && typeof payload === "object", label, "missing JSON payload");
  assert("error" in payload, label, `expected error payload ${code}`);
  assertEqual(payload.error?.code, code, label);
  assertNoSensitiveFields(payload, label);
}

async function expectHealth() {
  const response = await fetch(new URL("/api/health", BASE_URL), {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (response.status !== 200) {
    throw new SmokeFailure("health", `expected 200, got ${response.status}`);
  }
}

async function registerAndLogin(session, email, password) {
  const register = await session.request("POST", "/api/auth/register", {
    body: { email, password },
  });

  assert(
    register.response.status === 201 || register.response.status === 409,
    `${session.label} register`,
    `unexpected status ${register.response.status}`,
  );

  const login = await session.request("POST", "/api/auth/login", {
    body: { email, password },
    expectedStatus: 200,
  });

  unwrapSuccess(login.payload, `${session.label} login`);
}

async function getSupabaseAccessToken(email, password, env) {
  const response = await fetch(`${env.url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: env.anonKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (response.status !== 200) {
    throw new SmokeFailure(
      "supabase auth token",
      `expected 200, got ${response.status}`,
    );
  }

  const payload = await response.json().catch(() => null);
  assert(payload && typeof payload === "object", "supabase auth token", "invalid JSON");
  const token = payload.access_token;
  assert(typeof token === "string" && token.length > 0, "supabase auth token", "missing access token");
  return token;
}

async function supabaseRestSelect(pathname, env, jwt) {
  const headers = {
    apikey: env.anonKey,
    authorization: `Bearer ${jwt ?? env.anonKey}`,
  };

  const response = await fetch(`${env.url}/rest/v1/${pathname}`, {
    headers,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (response.status !== 200) {
    throw new SmokeFailure(
      `raw probe ${pathname}`,
      `expected 200, got ${response.status}`,
    );
  }

  const payload = await response.json().catch(() => null);
  assert(Array.isArray(payload), `raw probe ${pathname}`, "expected array response");
  return payload;
}

async function getHtml(session, pathname, expectedStatus = 200) {
  const result = await session.request("GET", pathname, {
    parse: "text",
    expectedStatus,
    headers: {
      accept: "text/html",
    },
  });

  return result.text;
}

async function run() {
  const startedAt = Date.now();
  const env = getPublicSupabaseEnv();
  const timestamp = String(startedAt);
  const password = `Codex-T50-${timestamp}!`;

  await expectHealth();

  const authorSession = new HttpSession("authorUser");
  const readerSession = new HttpSession("readerUser");
  const otherSession = new HttpSession("otherUser");
  const anonymousSession = new HttpSession("anonymous");

  const authorEmail = `codex-t50-author-${timestamp}@example.com`;
  const readerEmail = `codex-t50-reader-${timestamp}@example.com`;
  const otherEmail = `codex-t50-other-${timestamp}@example.com`;

  await registerAndLogin(authorSession, authorEmail, password);
  await registerAndLogin(readerSession, readerEmail, password);
  await registerAndLogin(otherSession, otherEmail, password);

  const authorMe = unwrapSuccess(
    (await authorSession.request("GET", "/api/me", { expectedStatus: 200 })).payload,
    "authorUser get me",
  );
  const readerMe = unwrapSuccess(
    (await readerSession.request("GET", "/api/me", { expectedStatus: 200 })).payload,
    "readerUser get me",
  );
  const otherMe = unwrapSuccess(
    (await otherSession.request("GET", "/api/me", { expectedStatus: 200 })).payload,
    "otherUser get me",
  );

  assert(authorMe.user?.id, "authorUser get me", "missing user id");
  assert(readerMe.user?.id, "readerUser get me", "missing user id");
  assert(otherMe.user?.id, "otherUser get me", "missing user id");

  const authorProfile = unwrapSuccess(
    (
      await authorSession.request("PATCH", "/api/me/profile", {
        expectedStatus: 200,
        body: {
          display_name: `Author ${timestamp}`,
          bio: `Author bio ${timestamp}`,
          avatar_url: `https://example.com/avatar-author-${timestamp}.png`,
        },
      })
    ).payload,
    "authorUser patch me profile",
  );
  const readerProfile = unwrapSuccess(
    (
      await readerSession.request("PATCH", "/api/me/profile", {
        expectedStatus: 200,
        body: {
          display_name: `Reader ${timestamp}`,
          bio: `Reader bio ${timestamp}`,
          avatar_url: `https://example.com/avatar-reader-${timestamp}.png`,
        },
      })
    ).payload,
    "readerUser patch me profile",
  );
  const otherProfile = unwrapSuccess(
    (
      await otherSession.request("PATCH", "/api/me/profile", {
        expectedStatus: 200,
        body: {
          display_name: `Other ${timestamp}`,
          bio: `Other bio ${timestamp}`,
          avatar_url: `https://example.com/avatar-other-${timestamp}.png`,
        },
      })
    ).payload,
    "otherUser patch me profile",
  );

  assertEqual(authorProfile.displayName, `Author ${timestamp}`, "authorUser profile persisted");
  assertEqual(readerProfile.displayName, `Reader ${timestamp}`, "readerUser profile persisted");
  assertEqual(otherProfile.displayName, `Other ${timestamp}`, "otherUser profile persisted");

  expectApiError(
    (
      await authorSession.request("PATCH", "/api/me/profile", {
        expectedStatus: 400,
        body: { role: "admin" },
      })
    ).payload,
    "VALIDATION_ERROR",
    "authorUser patch me profile rejects role",
  );
  expectApiError(
    (
      await authorSession.request("PATCH", "/api/me/profile", {
        expectedStatus: 400,
        body: { email: "new@example.com" },
      })
    ).payload,
    "VALIDATION_ERROR",
    "authorUser patch me profile rejects email",
  );

  const createdAuthor = unwrapSuccess(
    (
      await authorSession.request("POST", "/api/authors", {
        expectedStatus: 201,
        body: {
          pen_name: `Pen ${timestamp}`,
          bio: `Author profile bio ${timestamp}`,
          avatar_url: `https://example.com/author-profile-${timestamp}.png`,
          homepage_url: `https://example.com/author-${timestamp}`,
        },
      })
    ).payload,
    "authorUser create author profile",
  );

  const authorId = createdAuthor.id;
  assert(typeof authorId === "string" && authorId.length > 0, "author profile id", "missing author id");

  unwrapSuccess(
    (
      await authorSession.request("PATCH", `/api/authors/${authorId}`, {
        expectedStatus: 200,
        body: {
          pen_name: `Pen Updated ${timestamp}`,
          bio: `Author profile bio updated ${timestamp}`,
        },
      })
    ).payload,
    "authorUser patch author profile",
  );

  unwrapSuccess(
    (
      await anonymousSession.request("GET", `/api/authors/${authorId}`, {
        expectedStatus: 200,
      })
    ).payload,
    "anonymous get author profile",
  );

  const draftArticleA = unwrapSuccess(
    (
      await authorSession.request("POST", "/api/articles", {
        expectedStatus: 201,
        body: {
          title: `T50 Draft Article A ${timestamp}`,
          subtitle: `Draft A subtitle ${timestamp}`,
          excerpt: `Draft A excerpt ${timestamp}`,
          content: `Draft A body ${timestamp}`,
          cover_url: `https://example.com/article-a-${timestamp}.png`,
        },
      })
    ).payload,
    "authorUser create article A",
  );
  const draftArticleB = unwrapSuccess(
    (
      await authorSession.request("POST", "/api/articles", {
        expectedStatus: 201,
        body: {
          title: `T50 Draft Article B ${timestamp}`,
          subtitle: `Draft B subtitle ${timestamp}`,
          excerpt: `Draft B excerpt ${timestamp}`,
          content: `Draft B body ${timestamp}`,
        },
      })
    ).payload,
    "authorUser create article B",
  );

  const articleA = unwrapSuccess(
    (
      await authorSession.request("POST", `/api/articles/${draftArticleA.id}/publish`, {
        expectedStatus: 200,
      })
    ).payload,
    "authorUser publish article A",
  );

  assertEqual(articleA.status, "published", "article A published status");

  unwrapSuccess(
    (
      await anonymousSession.request("GET", `/api/articles/${draftArticleA.id}`, {
        expectedStatus: 200,
      })
    ).payload,
    "anonymous get published article A",
  );

  expectApiError(
    (
      await anonymousSession.request("GET", `/api/articles/${draftArticleB.id}`, {
        expectedStatus: 404,
      })
    ).payload,
    "NOT_FOUND",
    "anonymous get draft article B",
  );
  expectApiError(
    (
      await readerSession.request("GET", `/api/articles/${draftArticleB.id}`, {
        expectedStatus: 404,
      })
    ).payload,
    "NOT_FOUND",
    "readerUser get draft article B",
  );

  expectApiError(
    (
      await readerSession.request("POST", "/api/notes", {
        expectedStatus: 404,
        body: {
          itemType: "article",
          articleId: draftArticleB.id,
          content: `Draft note should fail ${timestamp}`,
          selectedText: "draft",
        },
      })
    ).payload,
    "NOT_FOUND",
    "readerUser note on other draft article",
  );
  expectApiError(
    (
      await readerSession.request("POST", "/api/reflections", {
        expectedStatus: 404,
        body: {
          itemType: "article",
          articleId: draftArticleB.id,
          content: `Draft reflection should fail ${timestamp}`,
        },
      })
    ).payload,
    "NOT_FOUND",
    "readerUser reflection on other draft article",
  );

  unwrapSuccess(
    (
      await readerSession.request("POST", "/api/subscriptions", {
        expectedStatus: 201,
        body: { authorId },
      })
    ).payload,
    "readerUser subscribe author",
  );

  const draftArticleC = unwrapSuccess(
    (
      await authorSession.request("POST", "/api/articles", {
        expectedStatus: 201,
        body: {
          title: `T50 Draft Article C ${timestamp}`,
          excerpt: `Draft C excerpt ${timestamp}`,
          content: `Draft C body ${timestamp}`,
        },
      })
    ).payload,
    "authorUser create article C",
  );

  const publishedArticleC = unwrapSuccess(
    (
      await authorSession.request("POST", `/api/articles/${draftArticleC.id}/publish`, {
        expectedStatus: 200,
      })
    ).payload,
    "authorUser publish article C",
  );

  assert(
    publishedArticleC.inboxItemsCreated >= 1,
    "publish article C inbox fanout",
    "expected inbox fanout to create at least one item",
  );

  const readerInbox = unwrapSuccess(
    (
      await readerSession.request("GET", "/api/inbox?filter=all", {
        expectedStatus: 200,
      })
    ).payload,
    "readerUser get inbox",
  );
  const inboxItem = readerInbox.find((item) => item.articleId === draftArticleC.id);
  assert(inboxItem, "readerUser get inbox", "missing inbox item for article C");

  unwrapSuccess(
    (
      await readerSession.request("PATCH", `/api/inbox/${inboxItem.id}`, {
        expectedStatus: 200,
        body: { status: "reading" },
      })
    ).payload,
    "readerUser mark inbox reading",
  );
  unwrapSuccess(
    (
      await readerSession.request("PATCH", `/api/inbox/${inboxItem.id}`, {
        expectedStatus: 200,
        body: { isStarred: true },
      })
    ).payload,
    "readerUser star inbox item",
  );
  unwrapSuccess(
    (
      await readerSession.request("PATCH", `/api/inbox/${inboxItem.id}`, {
        expectedStatus: 200,
        body: { status: "archived" },
      })
    ).payload,
    "readerUser archive inbox item",
  );
  unwrapSuccess(
    (
      await readerSession.request("PATCH", `/api/inbox/${inboxItem.id}`, {
        expectedStatus: 200,
        body: { status: "unread", isStarred: false },
      })
    ).payload,
    "readerUser reset inbox item",
  );

  const otherInbox = unwrapSuccess(
    (
      await otherSession.request("GET", "/api/inbox?filter=all", {
        expectedStatus: 200,
      })
    ).payload,
    "otherUser get inbox",
  );
  assert(
    !otherInbox.some((item) => item.id === inboxItem.id),
    "otherUser inbox isolation",
    "other user should not see reader inbox item",
  );
  expectApiError(
    (
      await anonymousSession.request("GET", "/api/inbox", {
        expectedStatus: 401,
      })
    ).payload,
    "AUTH_REQUIRED",
    "anonymous get inbox",
  );

  expectApiError(
    (
      await otherSession.request("PATCH", `/api/inbox/${inboxItem.id}`, {
        expectedStatus: 404,
        body: { status: "reading" },
      })
    ).payload,
    "NOT_FOUND",
    "otherUser patch reader inbox item",
  );

  expectApiError(
    (
      await readerSession.request("POST", "/api/external-items", {
        expectedStatus: 400,
        body: {
          title: `Rejected external ${timestamp}`,
          source_url: `https://example.com/rejected-${timestamp}`,
          original_content: "should not be allowed",
        },
      })
    ).payload,
    "VALIDATION_ERROR",
    "readerUser create external item rejects original_content",
  );

  const externalItem = unwrapSuccess(
    (
      await readerSession.request("POST", "/api/external-items", {
        expectedStatus: 201,
        body: {
          title: `Reader external item ${timestamp}`,
          source_url: `https://example.com/external-${timestamp}`,
          source_platform: "Example Platform",
          author_name: "Example Author",
          excerpt: `External excerpt ${timestamp}`,
          content_type: "link",
        },
      })
    ).payload,
    "readerUser create external item",
  );

  const externalList = unwrapSuccess(
    (
      await readerSession.request("GET", "/api/external-items", {
        expectedStatus: 200,
      })
    ).payload,
    "readerUser list external items",
  );
  assert(
    externalList.some((item) => item.id === externalItem.id),
    "readerUser list external items",
    "created external item missing from list",
  );

  unwrapSuccess(
    (
      await readerSession.request("GET", `/api/external-items/${externalItem.id}`, {
        expectedStatus: 200,
      })
    ).payload,
    "readerUser get external item detail",
  );

  unwrapSuccess(
    (
      await readerSession.request("PATCH", `/api/external-items/${externalItem.id}`, {
        expectedStatus: 200,
        body: {
          title: `Reader external item updated ${timestamp}`,
          excerpt: `External excerpt updated ${timestamp}`,
          source_platform: "Example Platform Updated",
        },
      })
    ).payload,
    "readerUser patch external item",
  );

  expectApiError(
    (
      await readerSession.request("PATCH", `/api/external-items/${externalItem.id}`, {
        expectedStatus: 400,
        body: {
          original_content: "blocked",
        },
      })
    ).payload,
    "VALIDATION_ERROR",
    "readerUser patch external item rejects original_content",
  );

  expectApiError(
    (
      await otherSession.request("GET", `/api/external-items/${externalItem.id}`, {
        expectedStatus: 404,
      })
    ).payload,
    "NOT_FOUND",
    "otherUser get reader external item",
  );
  expectApiError(
    (
      await otherSession.request("PATCH", `/api/external-items/${externalItem.id}`, {
        expectedStatus: 404,
        body: { title: "blocked" },
      })
    ).payload,
    "NOT_FOUND",
    "otherUser patch reader external item",
  );
  expectApiError(
    (
      await otherSession.request("DELETE", `/api/external-items/${externalItem.id}`, {
        expectedStatus: 404,
      })
    ).payload,
    "NOT_FOUND",
    "otherUser delete reader external item",
  );

  const collection = unwrapSuccess(
    (
      await readerSession.request("POST", "/api/collections", {
        expectedStatus: 201,
        body: {
          name: `T50 collection ${timestamp}`,
          description: `Collection description ${timestamp}`,
        },
      })
    ).payload,
    "readerUser create collection",
  );

  unwrapSuccess(
    (
      await readerSession.request("PATCH", `/api/collections/${collection.id}`, {
        expectedStatus: 200,
        body: {
          name: `T50 collection updated ${timestamp}`,
          description: `Collection description updated ${timestamp}`,
        },
      })
    ).payload,
    "readerUser patch collection",
  );

  const articleCollectionItem = unwrapSuccess(
    (
      await readerSession.request("POST", `/api/collections/${collection.id}/items`, {
        expectedStatus: 201,
        body: {
          itemType: "article",
          articleId: draftArticleA.id,
        },
      })
    ).payload,
    "readerUser add published article to collection",
  );

  const externalCollectionItem = unwrapSuccess(
    (
      await readerSession.request("POST", `/api/collections/${collection.id}/items`, {
        expectedStatus: 201,
        body: {
          itemType: "external_item",
          externalItemId: externalItem.id,
        },
      })
    ).payload,
    "readerUser add external item to collection",
  );

  expectApiError(
    (
      await readerSession.request("POST", `/api/collections/${collection.id}/items`, {
        expectedStatus: 404,
        body: {
          itemType: "article",
          articleId: draftArticleB.id,
        },
      })
    ).payload,
    "NOT_FOUND",
    "readerUser add draft article to collection rejected",
  );

  const collectionItems = unwrapSuccess(
    (
      await readerSession.request("GET", `/api/collections/${collection.id}/items`, {
        expectedStatus: 200,
      })
    ).payload,
    "readerUser get collection items",
  );

  assert(
    collectionItems.items.some((item) => item.id === articleCollectionItem.id && item.article),
    "readerUser collection contains article item",
    "missing article relation",
  );
  assert(
    collectionItems.items.some(
      (item) => item.id === externalCollectionItem.id && item.externalItem,
    ),
    "readerUser collection contains external item",
    "missing external item relation",
  );

  expectApiError(
    (
      await otherSession.request("GET", `/api/collections/${collection.id}/items`, {
        expectedStatus: 404,
      })
    ).payload,
    "NOT_FOUND",
    "otherUser get reader collection items",
  );

  expectApiError(
    (
      await otherSession.request(
        "DELETE",
        `/api/collections/${collection.id}/items/${externalCollectionItem.id}`,
        {
          expectedStatus: 404,
        },
      )
    ).payload,
    "NOT_FOUND",
    "otherUser delete reader collection item",
  );

  unwrapSuccess(
    (
      await readerSession.request(
        "DELETE",
        `/api/collections/${collection.id}/items/${externalCollectionItem.id}`,
        {
          expectedStatus: 200,
        },
      )
    ).payload,
    "readerUser delete external collection relation",
  );

  unwrapSuccess(
    (
      await readerSession.request("GET", `/api/external-items/${externalItem.id}`, {
        expectedStatus: 200,
      })
    ).payload,
    "external item survives collection relation delete",
  );
  unwrapSuccess(
    (
      await anonymousSession.request("GET", `/api/articles/${draftArticleA.id}`, {
        expectedStatus: 200,
      })
    ).payload,
    "article survives collection relation delete",
  );

  const privateArticleNote = unwrapSuccess(
    (
      await readerSession.request("POST", "/api/notes", {
        expectedStatus: 201,
        body: {
          itemType: "article",
          articleId: draftArticleA.id,
          selectedText: `private selected article ${timestamp}`,
          content: `private article note ${timestamp}`,
        },
      })
    ).payload,
    "readerUser create article note",
  );

  const articleNotes = unwrapSuccess(
    (
      await readerSession.request(
        "GET",
        `/api/notes?itemType=article&articleId=${draftArticleA.id}`,
        {
          expectedStatus: 200,
        },
      )
    ).payload,
    "readerUser list article notes",
  );
  assert(
    articleNotes.some((note) => note.id === privateArticleNote.id),
    "readerUser list article notes",
    "missing private article note",
  );

  unwrapSuccess(
    (
      await readerSession.request("PATCH", `/api/notes/${privateArticleNote.id}`, {
        expectedStatus: 200,
        body: {
          content: `private article note updated ${timestamp}`,
          selectedText: `private selected article updated ${timestamp}`,
          visibility: "private",
        },
      })
    ).payload,
    "readerUser patch article note",
  );

  const otherArticleNotes = unwrapSuccess(
    (
      await otherSession.request(
        "GET",
        `/api/notes?itemType=article&articleId=${draftArticleA.id}`,
        {
          expectedStatus: 200,
        },
      )
    ).payload,
    "otherUser list article notes on same article",
  );
  assertEqual(otherArticleNotes.length, 0, "otherUser cannot see reader article notes");

  expectApiError(
    (
      await otherSession.request("PATCH", `/api/notes/${privateArticleNote.id}`, {
        expectedStatus: 404,
        body: { content: "blocked" },
      })
    ).payload,
    "NOT_FOUND",
    "otherUser patch reader article note",
  );
  expectApiError(
    (
      await otherSession.request("DELETE", `/api/notes/${privateArticleNote.id}`, {
        expectedStatus: 404,
      })
    ).payload,
    "NOT_FOUND",
    "otherUser delete reader article note",
  );

  unwrapSuccess(
    (
      await readerSession.request("DELETE", `/api/notes/${privateArticleNote.id}`, {
        expectedStatus: 200,
      })
    ).payload,
    "readerUser delete article note",
  );

  const privateArticleReflection = unwrapSuccess(
    (
      await readerSession.request("POST", "/api/reflections", {
        expectedStatus: 201,
        body: {
          itemType: "article",
          articleId: draftArticleA.id,
          content: `private article reflection ${timestamp}`,
        },
      })
    ).payload,
    "readerUser create article reflection",
  );

  const articleReflections = unwrapSuccess(
    (
      await readerSession.request(
        "GET",
        `/api/reflections?itemType=article&articleId=${draftArticleA.id}`,
        {
          expectedStatus: 200,
        },
      )
    ).payload,
    "readerUser list article reflections",
  );
  assert(
    articleReflections.some((item) => item.id === privateArticleReflection.id),
    "readerUser list article reflections",
    "missing private article reflection",
  );

  unwrapSuccess(
    (
      await readerSession.request("PATCH", `/api/reflections/${privateArticleReflection.id}`, {
        expectedStatus: 200,
        body: {
          content: `private article reflection updated ${timestamp}`,
          visibility: "private",
        },
      })
    ).payload,
    "readerUser patch article reflection",
  );

  const otherArticleReflections = unwrapSuccess(
    (
      await otherSession.request(
        "GET",
        `/api/reflections?itemType=article&articleId=${draftArticleA.id}`,
        {
          expectedStatus: 200,
        },
      )
    ).payload,
    "otherUser list article reflections on same article",
  );
  assertEqual(
    otherArticleReflections.length,
    0,
    "otherUser cannot see reader article reflections",
  );

  expectApiError(
    (
      await otherSession.request(
        "PATCH",
        `/api/reflections/${privateArticleReflection.id}`,
        {
          expectedStatus: 404,
          body: { content: "blocked" },
        },
      )
    ).payload,
    "NOT_FOUND",
    "otherUser patch reader article reflection",
  );
  expectApiError(
    (
      await otherSession.request(
        "DELETE",
        `/api/reflections/${privateArticleReflection.id}`,
        {
          expectedStatus: 404,
        },
      )
    ).payload,
    "NOT_FOUND",
    "otherUser delete reader article reflection",
  );

  unwrapSuccess(
    (
      await readerSession.request(
        "DELETE",
        `/api/reflections/${privateArticleReflection.id}`,
        {
          expectedStatus: 200,
        },
      )
    ).payload,
    "readerUser delete article reflection",
  );

  const privatePublicMixNote = unwrapSuccess(
    (
      await readerSession.request("POST", "/api/notes", {
        expectedStatus: 201,
        body: {
          itemType: "article",
          articleId: draftArticleA.id,
          selectedText: `private selected mix ${timestamp}`,
          content: `private article note hidden ${timestamp}`,
        },
      })
    ).payload,
    "readerUser create private article note for public DTO check",
  );

  const publicArticleNote = unwrapSuccess(
    (
      await readerSession.request("POST", "/api/notes", {
        expectedStatus: 201,
        body: {
          itemType: "article",
          articleId: draftArticleA.id,
          selectedText: `public selected article ${timestamp}`,
          content: `public article note ${timestamp}`,
        },
      })
    ).payload,
    "readerUser create article note for public DTO check",
  );
  unwrapSuccess(
    (
      await readerSession.request("PATCH", `/api/notes/${publicArticleNote.id}`, {
        expectedStatus: 200,
        body: {
          visibility: "public",
          content: `public article note ${timestamp}`,
          selectedText: `public selected article ${timestamp}`,
        },
      })
    ).payload,
    "readerUser publish article note visibility",
  );

  const privatePublicMixReflection = unwrapSuccess(
    (
      await readerSession.request("POST", "/api/reflections", {
        expectedStatus: 201,
        body: {
          itemType: "article",
          articleId: draftArticleA.id,
          content: `private article reflection hidden ${timestamp}`,
        },
      })
    ).payload,
    "readerUser create private article reflection for public DTO check",
  );

  const publicArticleReflection = unwrapSuccess(
    (
      await readerSession.request("POST", "/api/reflections", {
        expectedStatus: 201,
        body: {
          itemType: "article",
          articleId: draftArticleA.id,
          content: `public article reflection ${timestamp}`,
        },
      })
    ).payload,
    "readerUser create article reflection for public DTO check",
  );
  unwrapSuccess(
    (
      await readerSession.request(
        "PATCH",
        `/api/reflections/${publicArticleReflection.id}`,
        {
          expectedStatus: 200,
          body: {
            visibility: "public",
            content: `public article reflection ${timestamp}`,
          },
        },
      )
    ).payload,
    "readerUser publish article reflection visibility",
  );

  const publicNotes = unwrapSuccess(
    (
      await anonymousSession.request(
        "GET",
        `/api/articles/${draftArticleA.id}/public-notes`,
        {
          expectedStatus: 200,
        },
      )
    ).payload,
    "anonymous get public article notes",
    ["externalItemId"],
  );
  assert(
    publicNotes.some((note) => note.id === publicArticleNote.id),
    "anonymous get public article notes",
    "missing public note",
  );
  assert(
    !publicNotes.some((note) => note.id === privatePublicMixNote.id),
    "anonymous get public article notes",
    "private note leaked to public DTO",
  );

  const publicReflections = unwrapSuccess(
    (
      await anonymousSession.request(
        "GET",
        `/api/articles/${draftArticleA.id}/public-reflections`,
        {
          expectedStatus: 200,
        },
      )
    ).payload,
    "anonymous get public article reflections",
    ["externalItemId"],
  );
  assert(
    publicReflections.some((item) => item.id === publicArticleReflection.id),
    "anonymous get public article reflections",
    "missing public reflection",
  );
  assert(
    !publicReflections.some((item) => item.id === privatePublicMixReflection.id),
    "anonymous get public article reflections",
    "private reflection leaked to public DTO",
  );

  const readerSupabaseJwt = await getSupabaseAccessToken(readerEmail, password, env);
  const otherSupabaseJwt = await getSupabaseAccessToken(otherEmail, password, env);

  assertEqual(
    (
      await supabaseRestSelect(
        `notes?id=eq.${privatePublicMixNote.id}&select=id,user_id,content`,
        env,
        undefined,
      )
    ).length,
    0,
    "anon raw probe cannot see notes rows",
  );
  assertEqual(
    (
      await supabaseRestSelect(
        `reflections?id=eq.${privatePublicMixReflection.id}&select=id,user_id,content`,
        env,
        undefined,
      )
    ).length,
    0,
    "anon raw probe cannot see reflections rows",
  );
  assertEqual(
    (
      await supabaseRestSelect(
        `notes?id=eq.${privatePublicMixNote.id}&select=id,user_id,content`,
        env,
        otherSupabaseJwt,
      )
    ).length,
    0,
    "otherUser raw probe cannot see reader private note",
  );
  assertEqual(
    (
      await supabaseRestSelect(
        `reflections?id=eq.${privatePublicMixReflection.id}&select=id,user_id,content`,
        env,
        otherSupabaseJwt,
      )
    ).length,
    0,
    "otherUser raw probe cannot see reader private reflection",
  );
  assertEqual(
    (
      await supabaseRestSelect(
        `notes?id=eq.${publicArticleNote.id}&select=id,user_id,content`,
        env,
        readerSupabaseJwt,
      )
    ).length,
    1,
    "reader raw probe can see own note",
  );

  const externalPrivateNote = unwrapSuccess(
    (
      await readerSession.request("POST", "/api/notes", {
        expectedStatus: 201,
        body: {
          itemType: "external_item",
          externalItemId: externalItem.id,
          selectedText: `external selected ${timestamp}`,
          content: `external private note ${timestamp}`,
        },
      })
    ).payload,
    "readerUser create external item note",
  );

  const externalNotes = unwrapSuccess(
    (
      await readerSession.request(
        "GET",
        `/api/notes?itemType=external_item&externalItemId=${externalItem.id}`,
        {
          expectedStatus: 200,
        },
      )
    ).payload,
    "readerUser list external item notes",
  );
  assert(
    externalNotes.some((item) => item.id === externalPrivateNote.id),
    "readerUser list external item notes",
    "missing external note",
  );

  unwrapSuccess(
    (
      await readerSession.request("PATCH", `/api/notes/${externalPrivateNote.id}`, {
        expectedStatus: 200,
        body: {
          content: `external private note updated ${timestamp}`,
          selectedText: `external selected updated ${timestamp}`,
          visibility: "private",
        },
      })
    ).payload,
    "readerUser patch external item note",
  );

  expectApiError(
    (
      await otherSession.request(
        "GET",
        `/api/notes?itemType=external_item&externalItemId=${externalItem.id}`,
        {
          expectedStatus: 404,
        },
      )
    ).payload,
    "NOT_FOUND",
    "otherUser get reader external notes",
  );
  expectApiError(
    (
      await otherSession.request("POST", "/api/notes", {
        expectedStatus: 404,
        body: {
          itemType: "external_item",
          externalItemId: externalItem.id,
          selectedText: "blocked",
          content: "blocked",
        },
      })
    ).payload,
    "NOT_FOUND",
    "otherUser create note on reader external item",
  );
  expectApiError(
    (
      await otherSession.request("PATCH", `/api/notes/${externalPrivateNote.id}`, {
        expectedStatus: 404,
        body: { content: "blocked" },
      })
    ).payload,
    "NOT_FOUND",
    "otherUser patch reader external note",
  );
  expectApiError(
    (
      await otherSession.request("DELETE", `/api/notes/${externalPrivateNote.id}`, {
        expectedStatus: 404,
      })
    ).payload,
    "NOT_FOUND",
    "otherUser delete reader external note",
  );

  unwrapSuccess(
    (
      await readerSession.request("DELETE", `/api/notes/${externalPrivateNote.id}`, {
        expectedStatus: 200,
      })
    ).payload,
    "readerUser delete external item note",
  );
  unwrapSuccess(
    (
      await readerSession.request("GET", `/api/external-items/${externalItem.id}`, {
        expectedStatus: 200,
      })
    ).payload,
    "external item survives external note delete",
  );

  const externalPrivateReflection = unwrapSuccess(
    (
      await readerSession.request("POST", "/api/reflections", {
        expectedStatus: 201,
        body: {
          itemType: "external_item",
          externalItemId: externalItem.id,
          content: `external private reflection ${timestamp}`,
        },
      })
    ).payload,
    "readerUser create external item reflection",
  );

  const externalReflections = unwrapSuccess(
    (
      await readerSession.request(
        "GET",
        `/api/reflections?itemType=external_item&externalItemId=${externalItem.id}`,
        {
          expectedStatus: 200,
        },
      )
    ).payload,
    "readerUser list external item reflections",
  );
  assert(
    externalReflections.some((item) => item.id === externalPrivateReflection.id),
    "readerUser list external item reflections",
    "missing external reflection",
  );

  unwrapSuccess(
    (
      await readerSession.request(
        "PATCH",
        `/api/reflections/${externalPrivateReflection.id}`,
        {
          expectedStatus: 200,
          body: {
            content: `external private reflection updated ${timestamp}`,
            visibility: "private",
          },
        },
      )
    ).payload,
    "readerUser patch external item reflection",
  );

  expectApiError(
    (
      await otherSession.request(
        "GET",
        `/api/reflections?itemType=external_item&externalItemId=${externalItem.id}`,
        {
          expectedStatus: 404,
        },
      )
    ).payload,
    "NOT_FOUND",
    "otherUser get reader external reflections",
  );
  expectApiError(
    (
      await otherSession.request("POST", "/api/reflections", {
        expectedStatus: 404,
        body: {
          itemType: "external_item",
          externalItemId: externalItem.id,
          content: "blocked",
        },
      })
    ).payload,
    "NOT_FOUND",
    "otherUser create reflection on reader external item",
  );
  expectApiError(
    (
      await otherSession.request(
        "PATCH",
        `/api/reflections/${externalPrivateReflection.id}`,
        {
          expectedStatus: 404,
          body: { content: "blocked" },
        },
      )
    ).payload,
    "NOT_FOUND",
    "otherUser patch reader external reflection",
  );
  expectApiError(
    (
      await otherSession.request(
        "DELETE",
        `/api/reflections/${externalPrivateReflection.id}`,
        {
          expectedStatus: 404,
        },
      )
    ).payload,
    "NOT_FOUND",
    "otherUser delete reader external reflection",
  );

  unwrapSuccess(
    (
      await readerSession.request(
        "DELETE",
        `/api/reflections/${externalPrivateReflection.id}`,
        {
          expectedStatus: 200,
        },
      )
    ).payload,
    "readerUser delete external item reflection",
  );
  unwrapSuccess(
    (
      await readerSession.request("GET", `/api/external-items/${externalItem.id}`, {
        expectedStatus: 200,
      })
    ).payload,
    "external item survives external reflection delete",
  );

  const articleTraceNote = unwrapSuccess(
    (
      await readerSession.request("POST", "/api/notes", {
        expectedStatus: 201,
        body: {
          itemType: "article",
          articleId: draftArticleA.id,
          selectedText: `trace article selected ${timestamp}`,
          content: `trace article note ${timestamp}`,
        },
      })
    ).payload,
    "readerUser create reading trace article note",
  );
  const articleTraceReflection = unwrapSuccess(
    (
      await readerSession.request("POST", "/api/reflections", {
        expectedStatus: 201,
        body: {
          itemType: "article",
          articleId: draftArticleA.id,
          content: `trace article reflection ${timestamp}`,
        },
      })
    ).payload,
    "readerUser create reading trace article reflection",
  );
  const externalTraceNote = unwrapSuccess(
    (
      await readerSession.request("POST", "/api/notes", {
        expectedStatus: 201,
        body: {
          itemType: "external_item",
          externalItemId: externalItem.id,
          selectedText: `trace external selected ${timestamp}`,
          content: `trace external note ${timestamp}`,
        },
      })
    ).payload,
    "readerUser create reading trace external note",
  );
  const externalTraceReflection = unwrapSuccess(
    (
      await readerSession.request("POST", "/api/reflections", {
        expectedStatus: 201,
        body: {
          itemType: "external_item",
          externalItemId: externalItem.id,
          content: `trace external reflection ${timestamp}`,
        },
      })
    ).payload,
    "readerUser create reading trace external reflection",
  );

  const readingTracesAll = unwrapSuccess(
    (
      await readerSession.request("GET", "/api/me/reading-traces", {
        expectedStatus: 200,
      })
    ).payload,
    "readerUser get reading traces all",
  );

  assert(
    readingTracesAll.items.some((item) => item.id === articleTraceNote.id),
    "reading traces include article note",
    "missing article note trace",
  );
  assert(
    readingTracesAll.items.some((item) => item.id === articleTraceReflection.id),
    "reading traces include article reflection",
    "missing article reflection trace",
  );
  assert(
    readingTracesAll.items.some((item) => item.id === externalTraceNote.id),
    "reading traces include external note",
    "missing external note trace",
  );
  assert(
    readingTracesAll.items.some((item) => item.id === externalTraceReflection.id),
    "reading traces include external reflection",
    "missing external reflection trace",
  );

  const readingTracesNotes = unwrapSuccess(
    (
      await readerSession.request("GET", "/api/me/reading-traces?traceType=note", {
        expectedStatus: 200,
      })
    ).payload,
    "readerUser get reading traces traceType=note",
  );
  assert(
    readingTracesNotes.items.every((item) => item.traceType === "note"),
    "reading traces note filter",
    "non-note item leaked into note filter",
  );

  const readingTracesReflections = unwrapSuccess(
    (
      await readerSession.request(
        "GET",
        "/api/me/reading-traces?traceType=reflection",
        {
          expectedStatus: 200,
        },
      )
    ).payload,
    "readerUser get reading traces traceType=reflection",
  );
  assert(
    readingTracesReflections.items.every((item) => item.traceType === "reflection"),
    "reading traces reflection filter",
    "non-reflection item leaked into reflection filter",
  );

  const readingTracesArticles = unwrapSuccess(
    (
      await readerSession.request("GET", "/api/me/reading-traces?itemType=article", {
        expectedStatus: 200,
      })
    ).payload,
    "readerUser get reading traces itemType=article",
  );
  assert(
    readingTracesArticles.items.every((item) => item.itemType === "article"),
    "reading traces article filter",
    "external item leaked into article filter",
  );

  const readingTracesExternal = unwrapSuccess(
    (
      await readerSession.request(
        "GET",
        "/api/me/reading-traces?itemType=external_item",
        {
          expectedStatus: 200,
        },
      )
    ).payload,
    "readerUser get reading traces itemType=external_item",
  );
  assert(
    readingTracesExternal.items.every((item) => item.itemType === "external_item"),
    "reading traces external filter",
    "article leaked into external filter",
  );

  const readingTracesLimit = unwrapSuccess(
    (
      await readerSession.request("GET", "/api/me/reading-traces?limit=999", {
        expectedStatus: 200,
      })
    ).payload,
    "readerUser get reading traces limit clamp",
  );
  assert(
    readingTracesLimit.items.length <= 100,
    "reading traces limit clamp",
    "limit was not clamped to 100",
  );

  expectApiError(
    (
      await readerSession.request(
        "GET",
        "/api/me/reading-traces?traceType=bad-value",
        {
          expectedStatus: 400,
        },
      )
    ).payload,
    "VALIDATION_ERROR",
    "readerUser invalid reading traces traceType",
  );
  expectApiError(
    (
      await readerSession.request(
        "GET",
        "/api/me/reading-traces?itemType=bad-value",
        {
          expectedStatus: 400,
        },
      )
    ).payload,
    "VALIDATION_ERROR",
    "readerUser invalid reading traces itemType",
  );

  const otherReadingTraces = unwrapSuccess(
    (
      await otherSession.request("GET", "/api/me/reading-traces", {
        expectedStatus: 200,
      })
    ).payload,
    "otherUser get own reading traces",
  );
  assertEqual(otherReadingTraces.items.length, 0, "otherUser reading traces isolated");

  const inboxHtml = await getHtml(readerSession, "/inbox");
  assertIncludes(inboxHtml, "收件箱", "reader inbox page");
  assertIncludes(inboxHtml, draftArticleC.title, "reader inbox page item visible");

  const laterHtml = await getHtml(readerSession, "/later");
  assertIncludes(laterHtml, "保存外部内容", "reader later page");
  assertIncludes(
    laterHtml,
    `Reader external item updated ${timestamp}`,
    "reader later page item visible",
  );

  const collectionsHtml = await getHtml(readerSession, "/collections");
  assertIncludes(collectionsHtml, "专题", "reader collections page");
  assertIncludes(
    collectionsHtml,
    `T50 collection updated ${timestamp}`,
    "reader collections page item visible",
  );

  const collectionDetailHtml = await getHtml(
    readerSession,
    `/collections/${collection.id}`,
  );
  assertIncludes(
    collectionDetailHtml,
    draftArticleA.title,
    "reader collection detail page article visible",
  );
  assertNotIncludes(
    collectionDetailHtml,
    `Reader external item updated ${timestamp}`,
    "deleted external relation removed from collection detail page",
  );

  await getHtml(otherSession, `/collections/${collection.id}`, 404);

  const articleHtml = await getHtml(anonymousSession, `/articles/${draftArticleA.id}`);
  assertIncludes(articleHtml, draftArticleA.title, "anonymous published article page");
  assertIncludes(articleHtml, `public article note ${timestamp}`, "article page public note");
  assertIncludes(
    articleHtml,
    `public article reflection ${timestamp}`,
    "article page public reflection",
  );
  assertNotIncludes(
    articleHtml,
    `private article note hidden ${timestamp}`,
    "article page private note hidden",
  );
  assertNotIncludes(
    articleHtml,
    `private article reflection hidden ${timestamp}`,
    "article page private reflection hidden",
  );

  const externalItemHtml = await getHtml(
    readerSession,
    `/external-items/${externalItem.id}`,
  );
  assertIncludes(externalItemHtml, `Reader external item updated ${timestamp}`, "reader external item page");
  await getHtml(otherSession, `/external-items/${externalItem.id}`, 404);

  const readingTracesHtml = await getHtml(readerSession, "/reading-traces");
  assertIncludes(
    readingTracesHtml,
    "笔记和读后感都在这里",
    "reader reading traces page",
  );
  assertIncludes(
    readingTracesHtml,
    `trace article note ${timestamp}`,
    "reading traces page article note visible",
  );
  assertIncludes(
    readingTracesHtml,
    `trace external reflection ${timestamp}`,
    "reading traces page external reflection visible",
  );

  const anonymousReadingTracesHtml = await getHtml(anonymousSession, "/reading-traces");
  assertIncludes(
    anonymousReadingTracesHtml,
    "登录后查看阅读痕迹",
    "anonymous reading traces page",
  );
  assertNotIncludes(
    anonymousReadingTracesHtml,
    `trace article note ${timestamp}`,
    "anonymous reading traces page hides trace content",
  );

  const logoutResponse = await otherSession.request("POST", "/api/auth/logout", {
    expectedStatus: 200,
  });
  unwrapSuccess(logoutResponse.payload, "otherUser logout");
  expectApiError(
    (
      await otherSession.request("GET", "/api/me", {
        expectedStatus: 401,
      })
    ).payload,
    "AUTH_REQUIRED",
    "otherUser me after logout",
  );

  const durationMs = Date.now() - startedAt;
  console.log(
    JSON.stringify(
      {
        ok: true,
        baseUrl: BASE_URL,
        durationMs,
        users: 3,
        articles: {
          draft: 1,
          published: 2,
        },
        externalItems: 1,
        collections: 1,
        publicArticleTraces: {
          notes: publicNotes.length,
          reflections: publicReflections.length,
        },
        readingTraces: {
          total: readingTracesAll.summary.total,
          notes: readingTracesAll.summary.notes,
          reflections: readingTracesAll.summary.reflections,
          articles: readingTracesAll.summary.articles,
          externalItems: readingTracesAll.summary.externalItems,
        },
      },
      null,
      2,
    ),
  );
}

run().catch((error) => {
  if (error instanceof SmokeFailure) {
    console.error(`[SMOKE FAIL] ${error.label}: ${error.detail}`);
    process.exit(1);
  }

  console.error("[SMOKE FAIL] unexpected:", error?.message ?? String(error));
  process.exit(1);
});
