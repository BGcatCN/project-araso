<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, useSlots, nextTick } from 'vue'

const props = defineProps<{
  id?: string
  /** 简短纯文本注释（不含 markdown/HTML） */
  note?: string
}>()

const isVisible = ref(false)
const isTouchDevice = ref(false)
const markerRef = ref<HTMLElement | null>(null)
const popoverRef = ref<HTMLElement | null>(null)
const popoverStyle = ref({})

const slots = useSlots()
const hasRichNote = computed(() => !!slots.note)

/** 将行内 Markdown 语法转为 HTML（链接、加粗、斜体、行内代码） */
function renderInlineMarkdown(src: string): string {
  return src
    // 行内代码 `` `code` `` — 优先处理，避免干扰其他规则
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // 图片 ![alt](url)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="annotation-img" />')
    // 链接 [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // 加粗 **text**
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // 斜体 *text*
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
}

const noteHtml = computed(() => props.note ? renderInlineMarkdown(props.note) : '')

onMounted(() => {
  isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  document.addEventListener('click', handleOutsideClick)
  window.addEventListener('scroll', reposition, true)
  window.addEventListener('resize', reposition)
})
onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
  window.removeEventListener('scroll', reposition, true)
  window.removeEventListener('resize', reposition)
})

/* ---- 定位 popover ---- */
function reposition() {
  if (!isVisible.value || !markerRef.value || !popoverRef.value) return

  if (isTouchDevice.value) {
    // 移动端：居中显示
    popoverStyle.value = {
      position: 'fixed',
      left: '50vw',
      top: '50vh',
      transform: 'translate(-50%, -50%)'
    }
    return
  }

  // PC 端：跟随标注位置
  const markerRect = markerRef.value.getBoundingClientRect()
  const popoverEl = popoverRef.value
  const popoverWidth = popoverEl.offsetWidth

  let left = markerRect.left + markerRect.width / 2 - popoverWidth / 2
  if (left < 8) left = 8
  if (left + popoverWidth > window.innerWidth - 8) {
    left = window.innerWidth - popoverWidth - 8
  }

  const top = markerRect.top - popoverEl.offsetHeight - 10
  const bottom = markerRect.bottom + 10

  if (top >= 0) {
    popoverStyle.value = {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`
    }
  } else {
    popoverStyle.value = {
      position: 'fixed',
      left: `${left}px`,
      top: `${bottom}px`
    }
  }
}

function showPopover() {
  isVisible.value = true
  nextTick(() => reposition())
}

function hidePopover() {
  isVisible.value = false
}

/* ---- mouse hover ---- */
let insideMarker = false
let insidePopover = false

function onMarkerEnter() {
  insideMarker = true
  if (!isTouchDevice.value) showPopover()
}

function onMarkerLeave() {
  insideMarker = false
  if (!isTouchDevice.value) scheduleHide()
}

function onPopoverEnter() {
  insidePopover = true
  if (!isTouchDevice.value) showPopover()
}

function onPopoverLeave() {
  insidePopover = false
  if (!isTouchDevice.value) scheduleHide()
}

function scheduleHide() {
  setTimeout(() => {
    if (!insideMarker && !insidePopover) hidePopover()
  }, 80)
}

/* ---- 点击/触摸切换（PC 和移动端均生效） ---- */
function onTap() {
  if (isVisible.value) {
    hidePopover()
  } else {
    showPopover()
  }
}

function handleOutsideClick(e: MouseEvent) {
  if (!isVisible.value) return
  const target = e.target as Node
  if (markerRef.value?.contains(target) || popoverRef.value?.contains(target)) return
  hidePopover()
}
</script>

<template>
  <span
    ref="markerRef"
    class="annotation-marker"
    :class="{ active: isVisible }"
    @mouseenter="onMarkerEnter"
    @mouseleave="onMarkerLeave"
    @click="onTap"
    @touchend.prevent="onTap"
  >
    <slot />
    <span class="annotation-dots" />
    <Teleport to="body">
      <Transition name="annotation">
        <span
          v-if="isVisible"
          class="annotation-backdrop is-mobile"
        />
      </Transition>
      <Transition name="annotation">
        <span
          v-if="isVisible"
          ref="popoverRef"
          class="annotation-popover"
          :class="{ 'is-mobile': isTouchDevice }"
          :style="popoverStyle"
          @mouseenter="onPopoverEnter"
          @mouseleave="onPopoverLeave"
        >
          <!-- 优先使用 #note 具名插槽（支持富文本 / 链接） -->
          <slot name="note" />
          <!-- 降级使用 note prop（渲染行内 Markdown） -->
          <template v-if="!hasRichNote && note"><span v-html="noteHtml" /></template>
        </span>
      </Transition>
    </Teleport>
  </span>
</template>

<style scoped>
.annotation-marker {
  position: relative;
  display: inline;
  cursor: help;
  border-bottom: 1.5px dashed var(--vp-c-brand-2, #2c7a7b);
  transition: background 0.2s;
}

.annotation-marker.active {
  background: rgba(44, 122, 123, 0.08);
}

.annotation-dots {
  display: inline;
}

/* ---- Popover ---- */
.annotation-popover {
  z-index: 999;
  max-width: min(420px, 92vw);
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.88rem;
  line-height: 1.65;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft, #f8fafc);
  border: 1px solid var(--vp-c-divider, #e2e8f0);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  pointer-events: auto;
  white-space: normal;
  word-break: break-word;
}

/* ---- 移动端: 更大字体 (定位由 JS 处理) ---- */
.annotation-popover.is-mobile {
  width: min(480px, 90vw);
  max-width: 90vw;
  padding: 20px 24px;
  font-size: 1rem;
  line-height: 1.7;
  z-index: 9999;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
}

/* 移动端全屏遮罩 + 背景模糊 */
.annotation-backdrop.is-mobile {
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  pointer-events: none;  /* 让点击穿透到 handleOutsideClick */
}

.annotation-popover :deep(a) {
  color: var(--vp-c-brand-1);
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.annotation-popover :deep(a:hover) {
  color: var(--vp-c-brand-2);
}
</style>

<!-- 进入/离开动画 (Teleport 到 body，使用非 scoped 样式) -->
<style>
.annotation-enter-active {
  transition: opacity 0.18s ease-out, transform 0.18s ease-out;
}
.annotation-leave-active {
  transition: opacity 0.12s ease-in, transform 0.12s ease-in;
}
.annotation-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.annotation-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
