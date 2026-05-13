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
      eyebrow: "给深度阅读一个安静入口",
      titleLines: ["把订阅、保存和笔记", "放回安静的阅读空间。"],
      subtitle:
        "麦芒订阅是一款安静的深度阅读工具。你可以订阅作者、接收文章、手动保存外部内容，并把笔记、读后感和专题整理留在自己的阅读空间里。",
      primaryCta: "开始阅读",
      authenticatedCta: "进入收件箱",
      secondaryCta: "浏览作者",
      loginCta: "登录",
      note: "没有热榜、推荐流或复杂社交压力。",
    },
    preview: {
      eyebrow: "阅读空间预览",
      title: "今日收件箱",
      badge: "3 篇待读",
      items: [
        {
          kind: "作者新文章",
          title: "城市、记忆与日常阅读",
          meta: "来自已订阅作者",
        },
        {
          kind: "手动保存",
          title: "一篇稍后阅读的外部文章",
          meta: "保留来源、摘录和阅读入口",
        },
        {
          kind: "私人笔记",
          title: "这段材料可以放入“城市文化”专题",
          meta: "只在自己的阅读空间里沉淀",
        },
      ],
      traceTitle: "阅读痕迹",
      traceDescription: "笔记、读后感和专题会跟随原文保留下来。",
      collectionTitle: "专题",
      collectionName: "城市文化",
    },
    values: {
      eyebrow: "核心价值",
      title: "少一点噪音，多一点沉淀",
      items: [
        {
          title: "订阅作者",
          description: "把你真正关心的作者放进自己的阅读列表。",
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
      title: "从接收文章到沉淀阅读",
      steps: [
        {
          title: "订阅作者",
          description: "把你真正关心的作者放进自己的阅读列表。",
        },
        {
          title: "文章进入收件箱",
          description: "新文章像邮件一样抵达，而不是被信息流冲走。",
        },
        {
          title: "阅读并记录笔记",
          description: "把关键段落、想法和读后感留在原文旁边。",
        },
        {
          title: "手动保存外部内容",
          description: "遇到值得回看的链接，先放进稍后阅读。",
        },
        {
          title: "长期整理",
          description: "用专题和阅读痕迹，把零散阅读变成结构。",
        },
      ],
    },
    boundary: {
      eyebrow: "产品理念",
      title: "为安静阅读而克制",
      description:
        "麦芒订阅不追逐热榜，不制造推荐流，也不自动搬运第三方全文。它只帮助你接收、保存、阅读和整理自己真正关心的内容。",
      items: [
        "没有热榜和推荐流",
        "没有评论、私信和复杂社交压力",
        "不自动抓取或公开第三方全文",
      ],
    },
    finalCta: {
      title: "从一个安静的收件箱开始。",
      description: "先订阅作者，再把真正值得读的内容慢慢留下来。",
      primaryCta: "开始阅读",
      secondaryCta: "浏览作者",
    },
    footer: {
      summary: "一个面向订阅、稍后阅读、笔记和专题整理的安静阅读空间。",
      apiHealth: "系统状态",
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
      eyebrow: "A calm entry point for deep reading",
      titleLines: [
        "A quiet home for subscriptions,",
        "saved reading, and private notes.",
      ],
      subtitle:
        "Maimang Readbox helps you subscribe to authors, receive long-form writing, save external reading manually, and keep notes, reflections, and collections in one calm workspace.",
      primaryCta: "Start reading",
      authenticatedCta: "Open Inbox",
      secondaryCta: "Browse authors",
      loginCta: "Login",
      note: "No trending loops, recommendation feeds, or heavy social pressure.",
    },
    preview: {
      eyebrow: "Reading workspace preview",
      title: "Today’s inbox",
      badge: "3 unread",
      items: [
        {
          kind: "New essay",
          title: "Cities, memory, and everyday reading",
          meta: "From an author you follow",
        },
        {
          kind: "Saved reading",
          title: "An external article saved for later",
          meta: "Source, excerpt, and reading entry preserved",
        },
        {
          kind: "Private note",
          title: "This passage belongs in the Urban Culture collection",
          meta: "Kept inside your own reading workspace",
        },
      ],
      traceTitle: "Reading Traces",
      traceDescription:
        "Notes, reflections, and collections stay connected to the source.",
      collectionTitle: "Collection",
      collectionName: "Urban Culture",
    },
    values: {
      eyebrow: "Core value",
      title: "Less noise, more durable reading",
      items: [
        {
          title: "Subscribe to authors",
          description: "Keep the writers you care about in your own reading list.",
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
      title: "From incoming articles to lasting notes",
      steps: [
        {
          title: "Subscribe to authors",
          description: "Choose the writers you actually want to follow.",
        },
        {
          title: "Articles enter Inbox",
          description: "New writing arrives calmly instead of disappearing in a feed.",
        },
        {
          title: "Read and keep notes",
          description: "Keep key passages, thoughts, and reflections beside the source.",
        },
        {
          title: "Save external reading",
          description: "Put worthwhile links into Later before you lose them.",
        },
        {
          title: "Organize over time",
          description: "Use collections and reading traces to turn fragments into structure.",
        },
      ],
    },
    boundary: {
      eyebrow: "Product principle",
      title: "Built for quiet reading",
      description:
        "Maimang Readbox does not chase trending lists, manufacture recommendation feeds, or mirror third-party full text. It helps you receive, save, read, and organize the work you actually care about.",
      items: [
        "No trending lists or recommendation feeds",
        "No comments, direct messages, or social pressure",
        "No automatic crawling or public mirrors of third-party full text",
      ],
    },
    finalCta: {
      title: "Start with one quiet inbox.",
      description:
        "Follow authors first, then keep the reading that is worth returning to.",
      primaryCta: "Start reading",
      secondaryCta: "Browse authors",
    },
    footer: {
      summary: "A quiet reading space for subscriptions, later reading, notes, and collections.",
      apiHealth: "System status",
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
