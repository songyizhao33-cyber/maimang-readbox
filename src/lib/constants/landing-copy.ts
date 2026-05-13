import { ROUTES } from "./routes";

export type LandingLocale = "zh" | "en";

export const LANDING_LOCALE_STORAGE_KEY = "maimang-locale";

export const landingLocaleLabels: Record<LandingLocale, string> = {
  zh: "中文",
  en: "EN",
};

export const landingCopy = {
  zh: {
    brand: "麦芒订阅",
    brandAlt: "Maimang Readbox",
    nav: {
      authors: "作者",
      inbox: "收件箱",
      readingTraces: "阅读痕迹",
      settings: "设置",
      login: "登录",
      register: "注册",
    },
    hero: {
      eyebrow: "安静的深度阅读收件箱",
      title: "让订阅像收信一样抵达，而不是像信息流一样喧闹。",
      subtitle:
        "麦芒订阅是一款安静的深度阅读工具：订阅作者，接收文章，手动保存外部内容，并把笔记、读后感和专题整理留在自己的阅读空间里。",
      primaryCta: "开始阅读",
      authenticatedCta: "进入 Inbox",
      secondaryCta: "浏览作者",
      note: "没有热榜、推荐流或复杂社交压力。",
    },
    values: {
      eyebrow: "为什么存在",
      title: "只留下真正帮助阅读的部分",
      items: [
        {
          title: "订阅作者",
          description: "文章进入你的 Inbox，而不是被算法流冲走。",
        },
        {
          title: "保存外部阅读",
          description: "手动保存链接、摘录和来源，留给真正阅读的时间。",
        },
        {
          title: "沉淀阅读痕迹",
          description: "用笔记、读后感和专题，把阅读变成长期积累。",
        },
      ],
    },
    workflow: {
      eyebrow: "阅读路径",
      title: "从订阅到沉淀，只保留必要步骤",
      steps: [
        "订阅作者",
        "文章进入 Inbox",
        "阅读并记录笔记",
        "保存外部内容到 Later",
        "用 Collections 和 Reading Traces 长期整理",
      ],
    },
    boundary: {
      eyebrow: "产品理念",
      title: "为安静阅读而克制",
      description:
        "麦芒订阅不追逐热榜，不制造推荐流，也不自动搬运第三方全文。它只帮助你接收、保存、阅读和整理自己真正关心的内容。",
      items: [
        "没有推荐流和热榜",
        "没有评论、私信和复杂社交压力",
        "不自动抓取或公开第三方全文",
        "不用 AI 摘要替代阅读",
      ],
    },
    footer: {
      summary: "一个面向订阅、稍后阅读、笔记和专题整理的安静阅读空间。",
      apiHealth: "API Health",
    },
  },
  en: {
    brand: "Maimang Readbox",
    brandAlt: "麦芒订阅",
    nav: {
      authors: "Authors",
      inbox: "Inbox",
      readingTraces: "Reading Traces",
      settings: "Settings",
      login: "Login",
      register: "Register",
    },
    hero: {
      eyebrow: "A quiet readbox for deep reading",
      title: "Let subscriptions arrive like letters, not shout like a feed.",
      subtitle:
        "Maimang Readbox is a quiet reading tool for following authors, receiving articles, saving external reading by hand, and keeping notes, reflections, and collections in your own reading space.",
      primaryCta: "Start reading",
      authenticatedCta: "Open Inbox",
      secondaryCta: "Browse authors",
      note: "No trending loops, recommendation feeds, or heavy social pressure.",
    },
    values: {
      eyebrow: "Why it exists",
      title: "Only the parts that help reading stay",
      items: [
        {
          title: "Subscribe to authors",
          description: "Articles arrive in your Inbox instead of being swept away by feeds.",
        },
        {
          title: "Save external reading",
          description: "Save links, excerpts, and sources manually for focused reading later.",
        },
        {
          title: "Keep private reading traces",
          description: "Turn notes, reflections, and collections into durable reading memory.",
        },
      ],
    },
    workflow: {
      eyebrow: "Reading path",
      title: "From subscription to lasting notes",
      steps: [
        "Subscribe to authors",
        "Articles enter Inbox",
        "Read and keep notes",
        "Save external items to Later",
        "Organize with Collections and Reading Traces",
      ],
    },
    boundary: {
      eyebrow: "Product principle",
      title: "Built for quiet reading",
      description:
        "Maimang Readbox does not chase trending lists, manufacture recommendation feeds, or mirror third-party full text. It helps you receive, save, read, and organize the work you actually care about.",
      items: [
        "No recommendation feeds or trending loops",
        "No comments, direct messages, or social pressure",
        "No automatic crawling or public mirrors of third-party full text",
        "No AI summaries replacing reading",
      ],
    },
    footer: {
      summary: "A quiet reading space for subscriptions, later reading, notes, and collections.",
      apiHealth: "API Health",
    },
  },
} as const;

export const landingLinks = {
  home: ROUTES.HOME,
  authors: ROUTES.AUTHORS,
  login: ROUTES.LOGIN,
  register: ROUTES.REGISTER,
  inbox: ROUTES.INBOX,
  readingTraces: ROUTES.READING_TRACES,
  settings: ROUTES.SETTINGS,
  apiHealth: ROUTES.API_HEALTH,
} as const;
