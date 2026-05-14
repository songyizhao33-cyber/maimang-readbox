import process from "node:process";

const BASE_URL = process.env.APP_SHELL_QA_BASE_URL ?? "https://maimang-readbox.vercel.app";
const REQUEST_TIMEOUT_MS = 30_000;

const FORBIDDEN_TEXT = [
  "Quiet reading inbox",
  "Quiet later shelf",
  "Quiet collection shelves",
  "Author Dashboard",
  "My articles",
  "Write a draft",
  "Sign in to open your inbox",
  "若项目开启",
];

const FORBIDDEN_SENSITIVE_TEXT = [
  "userId",
  "user_id",
  "service_role",
  "access_token",
  "refresh_token",
  "original_content",
  "extracted_content",
];

class QaFailure extends Error {
  constructor(label, detail) {
    super(`${label}: ${detail}`);
    this.name = "QaFailure";
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

function assert(condition, label, detail) {
  if (!condition) {
    throw new QaFailure(label, detail);
  }
}

async function request(jar, method, pathname, options = {}) {
  const headers = new Headers(options.headers ?? {});
  const cookieHeader = jar?.header();

  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  let body;
  if (options.body !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(options.body);
  }

  const response = await fetch(new URL(pathname, BASE_URL), {
    method,
    headers,
    body,
    redirect: "manual",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  jar?.apply(response);

  return response;
}

async function expectHtml(jar, pathname, requiredText) {
  const response = await request(jar, "GET", pathname, {
    headers: { accept: "text/html" },
  });

  assert(response.status === 200, `GET ${pathname}`, `expected 200, got ${response.status}`);

  const html = await response.text();

  for (const text of requiredText) {
    assert(html.includes(text), `GET ${pathname}`, `missing text: ${text}`);
  }

  for (const text of FORBIDDEN_TEXT) {
    assert(!html.includes(text), `GET ${pathname}`, `found forbidden text: ${text}`);
  }

  for (const text of FORBIDDEN_SENSITIVE_TEXT) {
    assert(!html.includes(text), `GET ${pathname}`, `found sensitive text: ${text}`);
  }

  return html;
}

async function run() {
  const jar = new CookieJar();
  const timestamp = Date.now();
  const testEmail = `codex-t64-app-shell-${timestamp}@example.com`;
  const testPassword = `Codex-T64-${timestamp}!`;

  const registerResponse = await request(jar, "POST", "/api/auth/register", {
    body: {
      email: testEmail,
      password: testPassword,
    },
  });

  assert(
    registerResponse.status === 201 || registerResponse.status === 409,
    "register",
    `expected 201 or 409, got ${registerResponse.status}`,
  );

  const loginResponse = await request(jar, "POST", "/api/auth/login", {
    body: {
      email: testEmail,
      password: testPassword,
    },
  });

  assert(loginResponse.status === 200, "login", `expected 200, got ${loginResponse.status}`);

  await expectHtml(jar, "/", ["阅读工作台", "今天从哪里开始？", "进入收件箱", "保存外部内容", "作者工作区"]);
  await expectHtml(jar, "/inbox", ["收件箱", "未读", "阅读中", "浏览作者", "保存外部内容"]);
  await expectHtml(jar, "/later", ["稍后阅读", "保存外部内容", "标题", "原文链接"]);
  await expectHtml(jar, "/author/dashboard", ["作者工作区", "创建作者资料"]);
  await expectHtml(jar, "/author/write", ["写草稿", "去创建作者资料"]);

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseUrl: BASE_URL,
        checked: ["/", "/inbox", "/later", "/author/dashboard", "/author/write"],
      },
      null,
      2,
    ),
  );
}

run().catch((error) => {
  if (error instanceof QaFailure) {
    console.error(`[APP SHELL QA FAIL] ${error.label}: ${error.detail}`);
    process.exit(1);
  }

  console.error("[APP SHELL QA FAIL] unexpected:", error?.message ?? String(error));
  process.exit(1);
});
