import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Project Araso',
  description: 'Project Araso 的 maimai DX 简明指南',
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ],

  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      themeConfig: {
        lastUpdatedText: '最后更新于',
        outline: {
          level: [2, 6],
          label: '本页大纲'
        },
        nav: [
          { text: '首页', link: '/' },
          { text: '序章', link: '/prologue' },
          { text: '开始阅读', link: '/guide/newcomer' }
        ],
        sidebar: {
          '/guide/': [
            {
              text: '📖 主线章节',
              items: [
                {
                  text: '初来乍到',
                  link: '/guide/newcomer',
                  collapsed: false,
                  items: [
                    { text: '附章：音游窝是什么？', link: '/guide/appendix-arcade-hub' }
                  ]
                },
                { text: '第一次进店前要知道什么', link: '/guide/first-visit' }
              ]
            }
          ]
        }
      }
    },
  },

  themeConfig: {
    search: {
      provider: 'local'
    },
    footer: {
      message: 'Project Araso 文档站点',
      copyright: 'Copyright © 2026-present Project Araso'
    }
  }
})
