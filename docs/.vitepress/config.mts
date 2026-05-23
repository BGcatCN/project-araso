import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vitepress'

type PageMeta = {
  text: string
  link: string
  sidebarOrder: number
  appendixOf?: string
}

type SidebarItem = {
  text: string
  link?: string
  collapsed?: boolean
  items?: SidebarItem[]
}

const docsRoot = path.resolve(__dirname, '..')

/** 递归收集目录下所有 .md 文件路径 */
function walkMarkdownFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return walkMarkdownFiles(fullPath)
    return entry.isFile() && entry.name.endsWith('.md') ? [fullPath] : []
  })
}

/** 提取 frontmatter 原始文本 */
function getFrontmatterBlock(source: string): string {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  return match?.[1] ?? ''
}

/** 从 frontmatter 文本中取某 key 的值（字符串） */
function getFrontmatterValue(frontmatter: string, key: string): string | undefined {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = frontmatter.match(new RegExp(`^${escapedKey}:\\s*(.+)$`, 'm'))
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, '')
}

/** 取文件中第一个 # 一级标题 */
function getFirstHeading(source: string): string | undefined {
  const match = source.match(/^#\s+(.+)$/m)
  return match?.[1]?.trim()
}

/** 从绝对路径转成 VitePress 可链接路径（去掉 .md） */
function toSiteLink(filePath: string): string {
  const relativePath = path.relative(docsRoot, filePath).replace(/\\/g, '/')
  return `/${relativePath.replace(/\.md$/, '')}`
}

/* ===== 通用区块扫描 ===== */

type SectionConfig = { dir: string; groupLabel: string }

/**
 * 扫描一个区块（如 guide/ 或 advanced/），读取 sidebarOrder / appendixOf，
 * 返回按 sidebarOrder 排序的 PageMeta 列表。
 */
function scanSection(config: SectionConfig): PageMeta[] {
  const sectionDir = path.resolve(docsRoot, config.dir)
  if (!fs.existsSync(sectionDir)) return []

  return walkMarkdownFiles(sectionDir)
    .map((filePath) => {
      const source = fs.readFileSync(filePath, 'utf8')
      const frontmatter = getFrontmatterBlock(source)
      const heading = getFirstHeading(source)
      const orderStr = getFrontmatterValue(frontmatter, 'sidebarOrder')
      const sidebarOrder = isNaN(Number(orderStr)) ? 999 : Number(orderStr)

      return {
        text: heading ?? getFrontmatterValue(frontmatter, 'title') ?? path.basename(filePath, '.md'),
        link: toSiteLink(filePath),
        sidebarOrder,
        appendixOf: getFrontmatterValue(frontmatter, 'appendixOf')
      }
    })
    .sort((a, b) => a.sidebarOrder - b.sidebarOrder || a.link.localeCompare(b.link))
}

/**
 * 将 PageMeta[] 构建为 VitePress sidebar 区块（支持附录嵌套）。
 */
function buildSectionBlock(pages: PageMeta[], groupLabel: string): SidebarItem {
  const appendixMap = new Map<string, SidebarItem[]>()

  for (const page of pages) {
    if (!page.appendixOf) continue
    const list = appendixMap.get(page.appendixOf) ?? []
    list.push({ text: page.text, link: page.link })
    appendixMap.set(page.appendixOf, list)
  }

  // 附录子项也按 sidebarOrder 排序
  for (const [, items] of appendixMap) {
    items.sort((a, b) => {
      const pa = pages.find((p) => p.link === a.link)
      const pb = pages.find((p) => p.link === b.link)
      return (pa?.sidebarOrder ?? 999) - (pb?.sidebarOrder ?? 999)
    })
  }

  const mainlineItems = pages
    .filter((p) => !p.appendixOf)
    .map<SidebarItem>((page) => {
      const sub = appendixMap.get(page.link)
      if (!sub?.length) return { text: page.text, link: page.link }
      return { text: page.text, link: page.link, collapsed: false, items: sub }
    })

  return { text: groupLabel, items: mainlineItems }
}

/* ===== 扫描 docs 根目录下的独立页面（如 prologue.md） ===== */

function scanRootPages(): PageMeta[] {
  const files = fs.readdirSync(docsRoot)
    .filter((f) => f.endsWith('.md') && f !== 'index.md')

  return files.map((f) => {
    const filePath = path.join(docsRoot, f)
    const source = fs.readFileSync(filePath, 'utf8')
    const frontmatter = getFrontmatterBlock(source)
    const heading = getFirstHeading(source)
    const orderStr = getFrontmatterValue(frontmatter, 'sidebarOrder')
    const sidebarOrder = isNaN(Number(orderStr)) ? 999 : Number(orderStr)

    return {
      text: heading ?? getFrontmatterValue(frontmatter, 'title') ?? f.replace(/\.md$/, ''),
      link: toSiteLink(filePath),
      sidebarOrder
    }
  }).sort((a, b) => a.sidebarOrder - b.sidebarOrder)
}

/* ===== 构建侧边栏 ===== */

const rootPages = scanRootPages()
const guidePages = scanSection({ dir: 'guide', groupLabel: '📖 主线章节' })
const advancedPages = scanSection({ dir: 'advanced', groupLabel: '🚀 进阶内容' })

/* 统一的侧边栏：序章 → 主线 → 进阶，挂载到 / 下对所有页面生效 */
const combinedSidebar: SidebarItem[] = []

if (rootPages.length) {
  combinedSidebar.push({
    text: '📜 序章',
    items: rootPages.map((p) => ({ text: p.text, link: p.link }))
  })
}

combinedSidebar.push(buildSectionBlock(guidePages, '📖 主线章节'))

if (advancedPages.length) {
  combinedSidebar.push(buildSectionBlock(advancedPages, '🚀 进阶内容'))
}

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
          { text: '开始阅读', link: '/guide/1-newcomer' }
        ],
        sidebar: {
          '/': combinedSidebar
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
