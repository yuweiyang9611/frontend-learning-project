import { defineConfig } from 'vitepress';

const base = '/frontend-learning-project/';
const repository = 'https://github.com/yuweiyang9611/frontend-learning-project';
const siteUrl = 'https://yuweiyang9611.github.io/frontend-learning-project/';

function canonicalUrl(relativePath: string): string {
  const markdownPath = relativePath.replace(/\.md$/, '');

  if (markdownPath === 'index') {
    return siteUrl;
  }

  if (markdownPath.endsWith('/index')) {
    return new URL(`${markdownPath.slice(0, -'/index'.length)}/`, siteUrl).href;
  }

  return new URL(`${markdownPath}.html`, siteUrl).href;
}

export default defineConfig({
  lang: 'zh-CN',
  title: 'IssueFlow 学习站',
  titleTemplate: ':title · IssueFlow 学习站',
  description: '91 天、182 小时，通过真实 Issue Tracker 学习前端、TypeScript、React、API 与测试。',
  base,
  cleanUrls: false,
  appearance: true,
  lastUpdated: true,
  ignoreDeadLinks: 'localhostLinks',
  sitemap: {
    hostname: siteUrl,
  },
  srcExclude: ['archive/original-curriculum/0*.md'],
  rewrites: {
    '90-days/README.md': '90-days/index.md',
    'learning/README.md': 'learning/index.md',
    'typescript/README.md': 'typescript/index.md',
    'backend/README.md': 'backend/index.md',
  },
  markdown: {
    lineNumbers: true,
  },
  transformPageData(pageData) {
    if (pageData.isNotFound) {
      return;
    }

    const canonical = canonicalUrl(pageData.relativePath);
    const socialTitle =
      pageData.relativePath === 'index.md'
        ? 'IssueFlow 学习站'
        : `${pageData.title} · IssueFlow 学习站`;
    const existingHead = Array.isArray(pageData.frontmatter.head)
      ? pageData.frontmatter.head
      : [];

    return {
      frontmatter: {
        ...pageData.frontmatter,
        head: [
          ...existingHead,
          ['link', { rel: 'canonical', href: canonical }],
          ['meta', { property: 'og:url', content: canonical }],
          ['meta', { property: 'og:title', content: socialTitle }],
        ],
      },
    };
  },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }],
    ['meta', { name: 'theme-color', content: '#6558e8' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'zh_CN' }],
    [
      'meta',
      {
        property: 'og:description',
        content: '91 天、182 小时，从浏览器基础到 TypeScript、React、双后端与测试的源码驱动课程。',
      },
    ],
    ['meta', { property: 'og:image', content: `${siteUrl}og.png` }],
  ],
  themeConfig: {
    siteTitle: 'IssueFlow 学习站',
    logo: '/favicon.svg',
    nav: [
      { text: '91 天课程', link: '/90-days/' },
      { text: '知识专题', link: '/learning/' },
      { text: 'TypeScript', link: '/typescript/' },
      { text: '后端对照', link: '/backend/' },
      {
        text: '参考',
        items: [
          { text: '源码追踪', link: '/reference/source-traces' },
          { text: '产品需求', link: '/reference/product-requirements' },
          { text: '术语表', link: '/reference/glossary' },
          { text: '官方资料', link: '/reference/resources' },
          { text: '练习模板', link: '/reference/task-template' },
        ],
      },
    ],
    sidebar: {
      '/90-days/': [
        {
          text: '开始与学习记录',
          items: [
            { text: '课程总览', link: '/90-days/' },
            { text: '怎样学习每天 2 小时', link: '/90-days/how-to-study' },
            { text: '91 天进度与日志', link: '/90-days/progress-and-journal' },
            { text: '考核、检查点与毕业标准', link: '/90-days/assessments' },
            { text: '陌生领域迁移任务', link: '/90-days/transfer-tasks' },
          ],
        },
        {
          text: '第 1–4 周 · Web 基础',
          items: [
            {
              text: '第 1 周 · 环境与 Web 地图',
              link: '/90-days/week-01-foundations',
            },
            {
              text: '第 2 周 · HTML 与无障碍',
              link: '/90-days/week-02-html-accessibility',
            },
            {
              text: '第 3 周 · CSS 与响应式',
              link: '/90-days/week-03-css-responsive',
            },
            {
              text: '第 4 周 · JavaScript、DOM 与异步',
              link: '/90-days/week-04-javascript-dom-async',
            },
          ],
        },
        {
          text: '第 5–8 周 · TypeScript 与 React',
          items: [
            {
              text: '第 5 周 · TypeScript 基础',
              link: '/90-days/week-05-typescript-foundations',
            },
            {
              text: '第 6 周 · 建模与泛型',
              link: '/90-days/week-06-typescript-modeling-generics',
            },
            {
              text: '第 7 周 · 运行时与 Contract',
              link: '/90-days/week-07-typescript-runtime-contracts',
            },
            {
              text: '第 8 周 · React 与 TypeScript',
              link: '/90-days/week-08-react-typescript',
            },
          ],
        },
        {
          text: '第 9–13 周 · 工程与毕业项目',
          items: [
            {
              text: '第 9 周 · 路由、表单与无障碍',
              link: '/90-days/week-09-routing-forms-a11y',
            },
            {
              text: '第 10 周 · Query 与服务端状态',
              link: '/90-days/week-10-query-server-state',
            },
            {
              text: '第 11 周 · 双后端与安全',
              link: '/90-days/week-11-backends-security',
            },
            {
              text: '第 12 周 · 测试、调试与 CI',
              link: '/90-days/week-12-testing-debugging-ci',
            },
            { text: '第 13 周 · 毕业项目', link: '/90-days/week-13-capstone' },
          ],
        },
      ],
      '/learning/': [
        {
          text: '专题入口',
          items: [
            { text: '路线总览', link: '/learning/' },
            { text: '00 · 开始之前', link: '/learning/00-getting-started' },
            {
              text: '01 · 项目地图与数据模式',
              link: '/learning/01-project-map-and-data-modes',
            },
          ],
        },
        {
          text: 'Web 基础',
          items: [
            { text: '02 · 浏览器与 Web', link: '/learning/02-browser-and-web' },
            { text: '03 · HTML 与 CSS', link: '/learning/03-html-and-css' },
            {
              text: '04 · JavaScript、DOM 与异步',
              link: '/learning/04-javascript-dom-and-http',
            },
          ],
        },
        {
          text: '前端应用',
          items: [
            {
              text: '05 · TypeScript 路线',
              link: '/learning/05-typescript-roadmap',
            },
            {
              text: '06 · React 组件与状态',
              link: '/learning/06-react-components-and-state',
            },
            {
              text: '07 · 路由、URL 与认证',
              link: '/learning/07-routing-url-and-auth',
            },
            {
              text: '08 · 服务端状态与 API',
              link: '/learning/08-server-state-and-api',
            },
            {
              text: '09 · 表单、交互与可访问性',
              link: '/learning/09-forms-interactions-and-a11y',
            },
          ],
        },
        {
          text: '工程与毕业项目',
          items: [
            {
              text: '10 · 持久化、双后端与安全',
              link: '/learning/10-persistence-backends-and-security',
            },
            {
              text: '11 · 测试、调试与 CI',
              link: '/learning/11-testing-engineering-and-deployment',
            },
            {
              text: '12 · 综合练习与毕业标准',
              link: '/learning/12-capstone-and-graduation',
            },
          ],
        },
      ],
      '/typescript/': [
        {
          text: 'TypeScript 专题',
          items: [
            { text: '专题索引', link: '/typescript/' },
            {
              text: '01 · 从 C# 到 TypeScript',
              link: '/typescript/01-from-csharp-to-typescript',
            },
            {
              text: '02 · 领域建模与收窄',
              link: '/typescript/02-domain-modeling-and-narrowing',
            },
            {
              text: '03 · 泛型与 Utility Types',
              link: '/typescript/03-generics-utilities-and-keyof',
            },
            {
              text: '04 · 运行时边界',
              link: '/typescript/04-runtime-boundaries',
            },
            {
              text: '05 · .NET Wire Contract',
              link: '/typescript/05-dotnet-wire-contracts',
            },
            { text: '06 · Lab 实验手册', link: '/typescript/06-lab-workbook' },
            {
              text: '07 · 类型模式 Cookbook',
              link: '/typescript/07-pattern-cookbook',
            },
            { text: '08 · 24+ 题练习库', link: '/typescript/08-exercise-bank' },
            {
              text: '09 · 类型错误排查',
              link: '/typescript/09-type-error-debugging',
            },
          ],
        },
      ],
      '/backend/': [
        {
          text: '后端对照',
          items: [
            { text: '专题索引', link: '/backend/' },
            {
              text: '01 · Minimal API 与 Contract',
              link: '/backend/01-minimal-api-and-contracts',
            },
            {
              text: '02 · EF Core 与数据',
              link: '/backend/02-ef-core-and-data',
            },
            {
              text: '03 · 认证、错误与上传',
              link: '/backend/03-auth-errors-and-uploads',
            },
            {
              text: '04 · 双后端对照实验',
              link: '/backend/04-compare-two-backends',
            },
          ],
        },
      ],
      '/reference/': [
        {
          text: '参考资料',
          items: [
            { text: '源码追踪路线', link: '/reference/source-traces' },
            { text: '产品需求', link: '/reference/product-requirements' },
            { text: '术语表', link: '/reference/glossary' },
            { text: '官方资料索引', link: '/reference/resources' },
            { text: '学习任务模板', link: '/reference/task-template' },
          ],
        },
      ],
      '/maintainers/': [
        {
          text: '维护者',
          items: [
            { text: '维护学习文档', link: '/maintainers/documentation' },
            {
              text: '维护 TypeScript Lab',
              link: '/maintainers/typescript-lab',
            },
            { text: 'GitHub Pages 发布', link: '/maintainers/github-pages' },
          ],
        },
      ],
      '/archive/': [
        {
          text: '历史存档',
          items: [
            {
              text: '原始课程设计',
              link: '/archive/original-curriculum/README',
            },
          ],
        },
      ],
    },
    outline: {
      level: [2, 3],
      label: '本页目录',
    },
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: '搜索',
                buttonAriaLabel: '搜索文档',
              },
              modal: {
                noResultsText: '没有找到相关内容',
                resetButtonTitle: '清除搜索',
                backButtonTitle: '关闭搜索',
                displayDetails: '显示详细列表',
                footer: {
                  selectText: '选择',
                  selectKeyAriaLabel: '回车',
                  navigateText: '切换',
                  navigateUpKeyAriaLabel: '向上',
                  navigateDownKeyAriaLabel: '向下',
                  closeText: '关闭',
                  closeKeyAriaLabel: 'Escape',
                },
              },
            },
          },
        },
      },
    },
    editLink: {
      pattern: `${repository}/edit/main/docs/:path`,
      text: '在 GitHub 上编辑此页',
    },
    lastUpdated: {
      text: '最后更新',
      formatOptions: {
        dateStyle: 'medium',
        timeStyle: 'short',
      },
    },
    docFooter: {
      prev: '上一页',
      next: '下一页',
    },
    returnToTopLabel: '返回顶部',
    sidebarMenuLabel: '课程导航',
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到浅色主题',
    darkModeSwitchTitle: '切换到深色主题',
    socialLinks: [{ icon: 'github', link: repository }],
    footer: {
      message: '以真实 IssueFlow 源码为教材，边运行、边观察、边验证。',
      copyright: 'IssueFlow Learning Project',
    },
  },
});
