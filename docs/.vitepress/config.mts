import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vitepress'

type GuidePage = {
  text: string
  link: string
  appendixOf?: string
  sidebarOrder: number
}

type SidebarItem = {
  text: string
  link?: string
  collapsed?: boolean
  items?: SidebarItem[]
}

const docsRoot = path.resolve(__dirname, '..')
const guideRoot = path.resolve(docsRoot, 'guide')

function walkMarkdownFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      return walkMarkdownFiles(fullPath)
    }

    return entry.isFile() && entry.name.endsWith('.md') ? [fullPath] : []
  })
}

function getFrontmatterBlock(source: string): string {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  return match?.[1] ?? ''
}

function getFrontmatterValue(frontmatter: string, key: string): string | undefined {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = frontmatter.match(new RegExp(`^${escapedKey}:\\s*(.+)$`, 'm'))
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, '')
}

function getFirstHeading(source: string): string | undefined {
  const match = source.match(/^#\s+(.+)$/m)
  return match?.[1]?.trim()
}

function toGuideLink(filePath: string): string {
  const relativePath = path.relative(docsRoot, filePath).replace(/\\/g, '/')
  const withoutExtension = relativePath.replace(/\.md$/, '')
  return `/${withoutExtension}`
}

function getGuidePages(): GuidePage[] {
  return walkMarkdownFiles(guideRoot)
    .map((filePath) => {
      const source = fs.readFileSync(filePath, 'utf8')
      const frontmatter = getFrontmatterBlock(source)
      const heading = getFirstHeading(source)
      const appendixOf = getFrontmatterValue(frontmatter, 'appendixOf')
      const text = heading ?? getFrontmatterValue(frontmatter, 'title') ?? path.basename(filePath, '.md')
      const orderStr = getFrontmatterValue(frontmatter, 'sidebarOrder')
      const sidebarOrder = orderStr ? Number(orderStr) : 999

      return {
        text,
        link: toGuideLink(filePath),
        appendixOf,
        sidebarOrder: isNaN(sidebarOrder) ? 999 : sidebarOrder
      }
    })
    .sort((left, right) => left.sidebarOrder - right.sidebarOrder || left.link.localeCompare(right.link, 'zh-CN'))
}

function buildGuideSidebar(): SidebarItem[] {
  const pages = getGuidePages()
  const appendixMap = new Map<string, SidebarItem[]>()

  for (const page of pages) {
    if (!page.appendixOf) {
      continue
    }

    const appendixItems = appendixMap.get(page.appendixOf) ?? []
    appendixItems.push({ text: page.text, link: page.link })
    appendixMap.set(page.appendixOf, appendixItems)
  }

  // 按 sidebarOrder 给每个附章组排序
  for (const [, items] of appendixMap) {
    items.sort((a, b) => {
      const pageA = pages.find((p) => p.link === a.link)
      const pageB = pages.find((p) => p.link === b.link)
      return (pageA?.sidebarOrder ?? 999) - (pageB?.sidebarOrder ?? 999)
    })
  }

  const mainlineItems = pages
    .filter((page) => !page.appendixOf)
    .map<SidebarItem>((page) => {
      const appendixItems = appendixMap.get(page.link)

      if (!appendixItems?.length) {
        return { text: page.text, link: page.link }
      }

      return {
        text: page.text,
        link: page.link,
        collapsed: false,
        items: appendixItems
      }
    })

  return [
    {
      text: '📖 主线章节',
      items: mainlineItems
    }
  ]
}

const guideSidebar = buildGuideSidebar()

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Project Araso',
  description: 'maimai DX 简明指南',
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
        editLink: {
          pattern: 'https://github.com/BGcatCN/project-araso/edit/main/docs/:path',
          text: '在 GitHub 上参与编辑'
        },
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
          '/guide/': guideSidebar
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
