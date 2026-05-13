# Mainland Accessibility Plan

## Current State

The current production URL is:

https://maimang-readbox.vercel.app

The application is deployed and reachable in browser checks, and production smoke can pass when the terminal uses the configured proxy. Some networks in mainland China may still have trouble resolving or reaching `.vercel.app` domains directly. This is a deployment and network accessibility concern, not an application code defect.

## Short-Term Position

- Continue using the Vercel URL for development, preview, and smoke testing.
- For public demos in mainland China, prepare a custom domain before inviting broader users.
- Terminal smoke can run through a proxy when local network resolution is blocked.
- CI-based smoke, such as GitHub Actions, can be used as an additional neutral network check.

## T62 Blocker Status

T62 custom-domain setup is paused because no purchased or selected domain is currently available.

Current position:

- Continue using `https://maimang-readbox.vercel.app` for the small beta.
- Keep the Vercel URL as the fallback entry.
- Do not update Vercel Domains, DNS, Supabase Auth Site URL, or Supabase Redirect URLs until a domain is selected.
- Resume the custom-domain workflow after the domain and DNS provider are known.

During beta, ask testers to record:

- Whether the site opened without a proxy.
- Network location or ISP if they can share it.
- Device and browser.
- Any DNS, TLS, blank-screen, or loading failure.

## Recommended No-Proxy Access Path

To make access as reliable as possible without a proxy, the next deployment pass should evaluate:

- Binding a custom domain instead of relying on the default `.vercel.app` hostname.
- Using DNS providers with stable mainland China resolution.
- Keeping third-party scripts to a minimum.
- Continuing to use local/system fonts where possible instead of remote font dependencies.
- Avoiding runtime dependencies on blocked external assets.
- Evaluating CDN, edge acceleration, or a compliant mainland-hosted deployment path if the product needs broad mainland availability.
- Reviewing ICP filing requirements if a mainland-hosted production deployment becomes necessary.

This plan does not claim that all mainland China networks are already solved. Network reachability varies by ISP, DNS resolver, and local policy. A custom domain and DNS plan reduces risk but should still be validated from representative networks.

## Current Application Constraints

- No secrets, cookies, tokens, or service-role keys are needed for the public landing page.
- The landing page uses CSS and HTML only for its product preview; it does not depend on remote images.
- The app should avoid adding external marketing scripts until there is a clear operational need.

## Text Layout Note / 文本排版说明

本轮中文标题断行优先用 CSS 响应式排版解决。

具体策略：

- 控制标题 `max-width`，避免整行过长。
- 使用断点字号，而不是引入运行时文本测量。
- 使用稳定的 `line-height`、正常字距和 `text-wrap` 能力。
- 中文标题拆成自然语义行，避免移动端出现单字换行。
- 英文标题保留自然空格换行，避免硬切单词。

本轮暂不引入 Pretext。

原因是当前 landing page 只是有限数量的标题和短文案，CSS 已足以解决断行、层级和移动端可读性问题。Pretext 更适合大规模文本测量、虚拟列表、Canvas/SVG 排版、复杂自定义布局或长文卡片高度预测。如果后续要做瀑布流阅读卡片、Canvas 阅读摘要图、复杂文本测量或虚拟化列表，再重新评估 Pretext。
