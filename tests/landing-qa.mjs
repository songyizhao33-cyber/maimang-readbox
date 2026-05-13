import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const BASE_URL = process.env.LANDING_QA_BASE_URL ?? "https://maimang-readbox.vercel.app";
const REQUEST_TIMEOUT_MS = 30_000;
const SCREENSHOT_ENABLED = process.env.LANDING_QA_SCREENSHOTS === "1";
const SCREENSHOT_DIR =
  process.env.LANDING_QA_SCREENSHOT_DIR ??
  path.join(process.cwd(), "docs", "qa-screenshots");
const LOCALE_STORAGE_KEY = "maimang-locale";

const REQUIRED_HTML_TEXT = [
  "把订阅、保存和笔记",
  "放回安静的阅读空间",
  "开始阅读",
  "作者",
  "登录",
  "注册",
  "中文",
  "EN",
  "系统状态",
];

const FORBIDDEN_TEXT = [
  "核心闭环",
  "明确不做",
  "MVP navigation",
  "Product boundary",
  "T59",
  "T60",
];

const FORBIDDEN_PATTERNS = [/\bT\d{2}\b/];

const FORBIDDEN_SENSITIVE_TEXT = [
  "userId",
  "user_id",
  "email",
  "service_role",
  "token",
  "original_content",
  "extracted_content",
];

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 1000, mobile: false },
  { name: "tablet", width: 768, height: 1024, mobile: false },
  { name: "mobile", width: 390, height: 844, mobile: true },
];

class QaFailure extends Error {
  constructor(label, detail) {
    super(`${label}: ${detail}`);
    this.name = "QaFailure";
    this.label = label;
    this.detail = detail;
  }
}

function assert(condition, label, detail) {
  if (!condition) {
    throw new QaFailure(label, detail);
  }
}

function getProxyServer() {
  const proxy =
    process.env.HTTPS_PROXY ??
    process.env.HTTP_PROXY ??
    process.env.ALL_PROXY ??
    process.env.https_proxy ??
    process.env.http_proxy ??
    process.env.all_proxy;

  return proxy || null;
}

async function fetchText(pathname) {
  const response = await fetch(new URL(pathname, BASE_URL), {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  return {
    response,
    text: await response.text(),
  };
}

async function expectStatus(pathname, expectedStatus) {
  const response = await fetch(new URL(pathname, BASE_URL), {
    redirect: "manual",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  assert(
    response.status === expectedStatus,
    `GET ${pathname}`,
    `expected ${expectedStatus}, got ${response.status}`,
  );
}

function assertHtmlChecks(html) {
  for (const requiredText of REQUIRED_HTML_TEXT) {
    assert(
      html.includes(requiredText),
      "homepage html",
      `missing required text: ${requiredText}`,
    );
  }

  for (const forbiddenText of FORBIDDEN_TEXT) {
    assert(
      !html.includes(forbiddenText),
      "homepage html",
      `found forbidden text: ${forbiddenText}`,
    );
  }

  for (const pattern of FORBIDDEN_PATTERNS) {
    assert(!pattern.test(html), "homepage html", `matched forbidden pattern: ${pattern}`);
  }

  for (const forbiddenSensitiveText of FORBIDDEN_SENSITIVE_TEXT) {
    assert(
      !html.includes(forbiddenSensitiveText),
      "homepage html",
      `found sensitive text: ${forbiddenSensitiveText}`,
    );
  }
}

function findBrowserPath() {
  if (process.env.LANDING_QA_BROWSER_PATH) {
    return process.env.LANDING_QA_BROWSER_PATH;
  }

  const candidates =
    process.platform === "win32"
      ? [
          "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
          "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        ]
      : [
          "/usr/bin/google-chrome",
          "/usr/bin/chromium",
          "/usr/bin/chromium-browser",
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        ];

  return candidates.find((candidate) => {
    try {
      return Boolean(process.getBuiltinModule("fs").existsSync(candidate));
    } catch {
      return false;
    }
  });
}

function getFreePort() {
  return 43_000 + Math.floor(Math.random() * 10_000);
}

async function waitForJson(url, timeoutMs = 10_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(1_000),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  throw new QaFailure("browser", `timed out waiting for ${url}`);
}

class CdpClient {
  constructor(webSocket) {
    this.webSocket = webSocket;
    this.nextId = 1;
    this.pending = new Map();
    this.waiters = [];

    this.webSocket.addEventListener("message", async (event) => {
      const message = JSON.parse(await readWebSocketData(event.data));

      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);

        if (message.error) {
          reject(new QaFailure("cdp", JSON.stringify(message.error)));
          return;
        }

        resolve(message.result ?? {});
        return;
      }

      for (const waiter of [...this.waiters]) {
        if (
          waiter.method === message.method &&
          waiter.sessionId === (message.sessionId ?? null)
        ) {
          this.waiters = this.waiters.filter((item) => item !== waiter);
          clearTimeout(waiter.timeout);
          waiter.resolve(message.params ?? {});
        }
      }
    });
  }

  send(method, params = {}, sessionId = null) {
    const id = this.nextId;
    this.nextId += 1;

    const payload = { id, method, params };
    if (sessionId) {
      payload.sessionId = sessionId;
    }

    this.webSocket.send(JSON.stringify(payload));

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new QaFailure("cdp", `timed out waiting for ${method}`));
      }, REQUEST_TIMEOUT_MS);

      this.pending.set(id, {
        resolve: (result) => {
          clearTimeout(timeout);
          resolve(result);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });
    });
  }

  waitForEvent(method, sessionId = null, timeoutMs = REQUEST_TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
      const waiter = {
        method,
        sessionId,
        resolve,
        timeout: setTimeout(() => {
          this.waiters = this.waiters.filter((item) => item !== waiter);
          reject(new QaFailure("cdp", `timed out waiting for event ${method}`));
        }, timeoutMs),
      };

      this.waiters.push(waiter);
    });
  }

  close() {
    this.webSocket.close();
  }
}

async function readWebSocketData(data) {
  if (typeof data === "string") {
    return data;
  }

  if (data instanceof ArrayBuffer) {
    return Buffer.from(data).toString("utf8");
  }

  if (ArrayBuffer.isView(data)) {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString("utf8");
  }

  if (typeof data?.text === "function") {
    return await data.text();
  }

  return String(data);
}

async function launchBrowser() {
  const browserPath = findBrowserPath();
  assert(browserPath, "browser", "Chrome or Edge executable was not found");

  const userDataDir = await mkdtemp(path.join(os.tmpdir(), "maimang-landing-qa-"));
  const port = getFreePort();
  const proxyServer = getProxyServer();
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--remote-allow-origins=*",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "about:blank",
  ];

  if (proxyServer) {
    args.unshift(`--proxy-server=${proxyServer}`);
  }

  const child = spawn(browserPath, args, {
    stdio: "ignore",
  });

  const version = await waitForJson(`http://127.0.0.1:${port}/json/version`);
  const webSocket = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    webSocket.addEventListener("open", resolve, { once: true });
    webSocket.addEventListener("error", reject, { once: true });
  });

  const client = new CdpClient(webSocket);

  return {
    browserPath,
    port,
    client,
    pageClients: [],
    async close() {
      try {
        await client.send("Browser.close");
      } catch {
        child.kill();
      }

      for (const pageClient of this.pageClients) {
        pageClient.close();
      }
      client.close();
      await new Promise((resolve) => {
        const timeout = setTimeout(resolve, 2_000);
        child.once("exit", () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      await rm(userDataDir, {
        force: true,
        maxRetries: 8,
        recursive: true,
        retryDelay: 250,
      }).catch(() => null);
    },
  };
}

async function createPage(browser, viewport) {
  let response = await fetch(`http://127.0.0.1:${browser.port}/json/new?about:blank`, {
    method: "PUT",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    response = await fetch(`http://127.0.0.1:${browser.port}/json/new?about:blank`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  }

  assert(response.ok, "browser", `could not create page target: ${response.status}`);
  const target = await response.json();
  const webSocket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    webSocket.addEventListener("open", resolve, { once: true });
    webSocket.addEventListener("error", reject, { once: true });
  });
  const client = new CdpClient(webSocket);
  browser.pageClients.push(client);
  const sessionId = null;

  await client.send("Page.enable", {}, sessionId);
  await client.send("Runtime.enable", {}, sessionId);
  await client.send(
    "Emulation.setDeviceMetricsOverride",
    {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.mobile ? 2 : 1,
      mobile: viewport.mobile,
    },
    sessionId,
  );

  return { client, sessionId };
}

async function navigate(client, sessionId, pathname = "/") {
  const loadEvent = client.waitForEvent("Page.loadEventFired", sessionId, 20_000);
  await client.send("Page.navigate", { url: new URL(pathname, BASE_URL).toString() }, sessionId);
  await loadEvent.catch(() => null);
  await new Promise((resolve) => setTimeout(resolve, 700));
}

async function evaluate(client, sessionId, expression) {
  const result = await client.send(
    "Runtime.evaluate",
    {
      expression,
      returnByValue: true,
      awaitPromise: true,
    },
    sessionId,
  );

  if (result.exceptionDetails) {
    throw new QaFailure("runtime", JSON.stringify(result.exceptionDetails));
  }

  return result.result?.value;
}

async function waitForCondition(client, sessionId, expression, label) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 10_000) {
    const value = await evaluate(client, sessionId, expression);
    if (value) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new QaFailure(label, "condition timed out");
}

function luminance([r, g, b]) {
  const values = [r, g, b].map((value) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}

function contrastRatio(foreground, background) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function parseRgb(value) {
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return [Number(match[1]), Number(match[2]), Number(match[3])];
  }

  const labMatch = value.match(/lab\(([-\d.]+)%?\s+([-\d.]+)\s+([-\d.]+)/);
  if (labMatch) {
    return labToRgb(Number(labMatch[1]), Number(labMatch[2]), Number(labMatch[3]));
  }

  const oklchMatch = value.match(/oklch\(([-\d.]+)%?\s+([-\d.]+)\s+([-\d.]+)/);
  if (oklchMatch) {
    const rawLightness = Number(oklchMatch[1]);
    const lightness = rawLightness > 1 ? rawLightness / 100 : rawLightness;
    return oklchToRgb(lightness, Number(oklchMatch[2]), Number(oklchMatch[3]));
  }

  assert(false, "color", `could not parse color ${value}`);
}

function labToRgb(lightness, a, b) {
  const fy = (lightness + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const epsilon = 216 / 24389;
  const kappa = 24389 / 27;
  const transform = (value) =>
    value ** 3 > epsilon ? value ** 3 : (116 * value - 16) / kappa;

  let x = transform(fx) * 0.96422;
  let y = transform(fy);
  let z = transform(fz) * 0.82521;

  const d65X = x * 0.9555766 + y * -0.0230393 + z * 0.0631636;
  const d65Y = x * -0.0282895 + y * 1.0099416 + z * 0.0210077;
  const d65Z = x * 0.0122982 + y * -0.020483 + z * 1.3299098;

  x = d65X;
  y = d65Y;
  z = d65Z;

  return linearRgbToRgb([
    x * 3.2404542 + y * -1.5371385 + z * -0.4985314,
    x * -0.969266 + y * 1.8760108 + z * 0.041556,
    x * 0.0556434 + y * -0.2040259 + z * 1.0572252,
  ]);
}

function oklchToRgb(lightness, chroma, hue) {
  const hueRadians = (hue * Math.PI) / 180;
  const a = Math.cos(hueRadians) * chroma;
  const b = Math.sin(hueRadians) * chroma;
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return linearRgbToRgb([
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]);
}

function linearRgbToRgb(values) {
  return values.map((value) => {
    const clamped = Math.min(1, Math.max(0, value));
    const channel =
      clamped <= 0.0031308
        ? clamped * 12.92
        : 1.055 * clamped ** (1 / 2.4) - 0.055;

    return Math.round(channel * 255);
  });
}

function assertViewportChecks(viewport, checks) {
  assert(
    checks.horizontalOverflow <= 1,
    `${viewport.name} layout`,
    `document overflows horizontally by ${checks.horizontalOverflow}px`,
  );
  assert(
    checks.overflowingElements.length === 0,
    `${viewport.name} layout`,
    `text overflow: ${JSON.stringify(checks.overflowingElements)}`,
  );
  assert(checks.hasPrimaryCta, `${viewport.name} cta`, "missing primary CTA");
  assert(checks.primaryCtaText.length > 0, `${viewport.name} cta`, "empty primary CTA");
  assert(
    contrastRatio(
      parseRgb(checks.primaryCtaColor),
      parseRgb(checks.primaryCtaBackgroundColor),
    ) >= 4.5,
    `${viewport.name} cta`,
    `primary CTA contrast below AA: ${JSON.stringify({
      color: checks.primaryCtaColor,
      backgroundColor: checks.primaryCtaBackgroundColor,
    })}`,
  );
  assert(checks.hasAuthorsLink, `${viewport.name} nav`, "missing authors link");
  assert(checks.hasLoginLink, `${viewport.name} nav`, "missing login link");
  assert(checks.hasRegisterLink, `${viewport.name} nav`, "missing register link");
  assert(checks.hasApiHealthLink, `${viewport.name} footer`, "missing API Health link");
  assert(!checks.apiHealthInHero, `${viewport.name} hero`, "API Health is in hero");
  assert(checks.hasLanguageButtons, `${viewport.name} language`, "missing language buttons");
  assert(checks.hasDarkSection, `${viewport.name} contrast`, "missing dark section");
  assert(
    checks.darkSamples.every((sample) => {
      const ratio = contrastRatio(parseRgb(sample.color), parseRgb(sample.backgroundColor));
      return ratio >= 4.5;
    }),
    `${viewport.name} contrast`,
    `dark section contrast below AA: ${JSON.stringify(checks.darkSamples)}`,
  );
}

async function captureScreenshot(client, sessionId, fileName) {
  if (!SCREENSHOT_ENABLED) {
    return null;
  }

  await mkdir(SCREENSHOT_DIR, { recursive: true });
  const result = await client.send(
    "Page.captureScreenshot",
    {
      captureBeyondViewport: true,
      format: "png",
    },
    sessionId,
  );
  const filePath = path.join(SCREENSHOT_DIR, fileName);
  await writeFile(filePath, Buffer.from(result.data, "base64"));
  return filePath;
}

async function runBrowserChecks() {
  const browser = await launchBrowser();
  const screenshots = [];

  try {
    for (const viewport of VIEWPORTS) {
      const { client, sessionId } = await createPage(browser, viewport);
      await navigate(client, sessionId);

      const defaultChecks = await evaluate(
        client,
        sessionId,
        `(() => {
          const text = document.body.innerText;
          const hero = document.querySelector("main section");
          const primaryCta = hero?.querySelector('a[href="/register"], a[href="/inbox"]');
          const primaryCtaTextNode = primaryCta?.querySelector("span") ?? primaryCta;
          const darkElements = Array.from(document.querySelectorAll('[class*="bg-neutral-950"], [class*="bg-stone-950"]'));
          const darkSamples = darkElements.flatMap((element) => {
            const backgroundColor = getComputedStyle(element).backgroundColor;
            return Array.from(element.querySelectorAll("h1,h2,h3,p,li,div,span"))
              .filter((child) => child.textContent.trim().length > 0)
              .slice(0, 6)
              .map((child) => ({
                text: child.textContent.trim().slice(0, 40),
                color: getComputedStyle(child).color,
                backgroundColor,
              }));
          });
          const overflowingElements = Array.from(document.querySelectorAll("h1,h2,h3,p,a,button,li"))
            .filter((element) => {
              const rect = element.getBoundingClientRect();
              return rect.width > 0 && rect.height > 0 && element.scrollWidth > element.clientWidth + 2;
            })
            .slice(0, 8)
            .map((element) => ({
              tag: element.tagName,
              text: element.textContent.trim().slice(0, 60),
              scrollWidth: element.scrollWidth,
              clientWidth: element.clientWidth,
            }));

          return {
            text,
            horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
            overflowingElements,
            hasPrimaryCta: Boolean(primaryCta),
            primaryCtaText: primaryCta?.textContent.trim() ?? "",
            primaryCtaHref: primaryCta?.getAttribute("href") ?? "",
            primaryCtaColor: primaryCtaTextNode ? getComputedStyle(primaryCtaTextNode).color : "",
            primaryCtaBackgroundColor: primaryCta ? getComputedStyle(primaryCta).backgroundColor : "",
            hasAuthorsLink: Boolean(document.querySelector('a[href="/authors"]')),
            hasLoginLink: Boolean(document.querySelector('a[href="/login"]')),
            hasRegisterLink: Boolean(document.querySelector('a[href="/register"]')),
            hasApiHealthLink: Boolean(document.querySelector('a[href="/api/health"]')),
            apiHealthInHero: Boolean(hero?.querySelector('a[href="/api/health"]')),
            hasLanguageButtons: Array.from(document.querySelectorAll("button")).some((button) => button.textContent.trim() === "EN") &&
              Array.from(document.querySelectorAll("button")).some((button) => button.textContent.trim() === "中文"),
            hasDarkSection: darkElements.length > 0,
            darkSamples,
            forbiddenText: ${JSON.stringify([...FORBIDDEN_TEXT, ...FORBIDDEN_SENSITIVE_TEXT])}.filter((item) => text.includes(item)),
          };
        })()`,
      );

      assert(
        defaultChecks.text.includes("把订阅、保存和笔记") &&
          defaultChecks.text.includes("放回安静的阅读空间"),
        `${viewport.name} default locale`,
        "Chinese title was not visible",
      );
      assert(
        defaultChecks.forbiddenText.length === 0,
        `${viewport.name} copy safety`,
        `forbidden text visible: ${defaultChecks.forbiddenText.join(", ")}`,
      );
      assertViewportChecks(viewport, defaultChecks);

      if (viewport.name === "desktop" || viewport.name === "mobile") {
        const screenshot = await captureScreenshot(
          client,
          sessionId,
          `landing-${viewport.name}-zh.png`,
        );
        if (screenshot) {
          screenshots.push(screenshot);
        }
      }

      const clickedToRegister = await evaluate(
        client,
        sessionId,
        `(() => {
          const link = document.querySelector('main section a[href="/register"]');
          if (!link) return false;
          link.click();
          return true;
        })()`,
      );
      assert(clickedToRegister, `${viewport.name} primary cta`, "could not click primary CTA");
      await waitForCondition(
        client,
        sessionId,
        `location.pathname === "/register"`,
        `${viewport.name} primary cta`,
      );

      await navigate(client, sessionId);

      await evaluate(
        client,
        sessionId,
        `(() => {
          const button = Array.from(document.querySelectorAll("button")).find((item) => item.textContent.trim() === "EN");
          button?.click();
          return Boolean(button);
        })()`,
      );
      await waitForCondition(
        client,
        sessionId,
        `document.body.innerText.includes("A quiet home for subscriptions") && localStorage.getItem("${LOCALE_STORAGE_KEY}") === "en"`,
        `${viewport.name} english switch`,
      );

      await navigate(client, sessionId);
      await waitForCondition(
        client,
        sessionId,
        `document.body.innerText.includes("A quiet home for subscriptions") && localStorage.getItem("${LOCALE_STORAGE_KEY}") === "en"`,
        `${viewport.name} english persistence`,
      );

      const englishChecks = await evaluate(
        client,
        sessionId,
        `(() => ({
          horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
          titleVisible: document.body.innerText.includes("A quiet home for subscriptions"),
          overflowingElements: Array.from(document.querySelectorAll("h1,h2,h3,p,a,button,li"))
            .filter((element) => {
              const rect = element.getBoundingClientRect();
              return rect.width > 0 && rect.height > 0 && element.scrollWidth > element.clientWidth + 2;
            })
            .slice(0, 8)
            .map((element) => ({
              tag: element.tagName,
              text: element.textContent.trim().slice(0, 60),
              scrollWidth: element.scrollWidth,
              clientWidth: element.clientWidth,
            })),
        }))()`,
      );
      assert(englishChecks.titleVisible, `${viewport.name} english`, "English title missing");
      assert(
        englishChecks.horizontalOverflow <= 1,
        `${viewport.name} english layout`,
        `document overflows horizontally by ${englishChecks.horizontalOverflow}px`,
      );
      assert(
        englishChecks.overflowingElements.length === 0,
        `${viewport.name} english layout`,
        `text overflow: ${JSON.stringify(englishChecks.overflowingElements)}`,
      );

      if (viewport.name === "desktop" || viewport.name === "mobile") {
        const screenshot = await captureScreenshot(
          client,
          sessionId,
          `landing-${viewport.name}-en.png`,
        );
        if (screenshot) {
          screenshots.push(screenshot);
        }
      }

      await evaluate(
        client,
        sessionId,
        `(() => {
          const button = Array.from(document.querySelectorAll("button")).find((item) => item.textContent.trim() === "中文");
          button?.click();
          return Boolean(button);
        })()`,
      );
      await waitForCondition(
        client,
        sessionId,
        `document.body.innerText.includes("把订阅、保存和笔记") && document.body.innerText.includes("放回安静的阅读空间") && localStorage.getItem("${LOCALE_STORAGE_KEY}") === "zh"`,
        `${viewport.name} chinese switch`,
      );

      await navigate(client, sessionId);
      await waitForCondition(
        client,
        sessionId,
        `document.body.innerText.includes("把订阅、保存和笔记") && document.body.innerText.includes("放回安静的阅读空间") && localStorage.getItem("${LOCALE_STORAGE_KEY}") === "zh"`,
        `${viewport.name} chinese persistence`,
      );
    }

    return {
      browserPath: browser.browserPath,
      screenshots,
      viewports: VIEWPORTS.map(({ name, width, height }) => ({ name, width, height })),
    };
  } finally {
    await browser.close();
  }
}

async function run() {
  await expectStatus("/api/health", 200);
  await expectStatus("/", 200);
  await expectStatus("/authors", 200);
  await expectStatus("/login", 200);
  await expectStatus("/register", 200);

  const { text: homepageHtml } = await fetchText("/");
  assertHtmlChecks(homepageHtml);

  const browser = await runBrowserChecks();

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseUrl: BASE_URL,
        localStorageKey: LOCALE_STORAGE_KEY,
        browserPath: browser.browserPath,
        viewports: browser.viewports,
        screenshots: browser.screenshots,
      },
      null,
      2,
    ),
  );
}

run().catch((error) => {
  if (error instanceof QaFailure) {
    console.error(`[LANDING QA FAIL] ${error.label}: ${error.detail}`);
    process.exit(1);
  }

  console.error("[LANDING QA FAIL] unexpected:", error?.message ?? String(error));
  process.exit(1);
});
