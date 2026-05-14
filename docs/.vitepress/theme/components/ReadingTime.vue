<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useData } from 'vitepress'

const route = useRoute()
const { frontmatter } = useData()
const readingTime = ref(0)
const wordCount = ref(0)

const isHome = computed(() => frontmatter.value.layout === 'home')

const calculateReadingTime = () => {
  if (isHome.value) {
    wordCount.value = 0
    return
  }
  const content = document.querySelector('.vp-doc')
  if (!content) return

  const text = content.innerText || ''
  // 匹配中文字符、英文字母和数字
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || []
  const englishWords = text.match(/[a-zA-Z0-9]+/g) || []
  
  const count = chineseChars.length + englishWords.length
  wordCount.value = count
  
  // 设定平均阅读速度：300 字/分钟
  const minutes = Math.ceil(count / 300)
  readingTime.value = minutes > 0 ? minutes : 1
}

onMounted(() => {
  // 延时一点确保内容加载完成
  setTimeout(calculateReadingTime, 100)
})

// 当路由改变时重新计算
watch(() => route.path, () => {
  setTimeout(calculateReadingTime, 500)
})
</script>

<template>
  <div class="reading-info" v-if="wordCount > 0">
    <span class="item">
      <span class="icon">📝</span>
      字数：{{ wordCount }} 字
    </span>
    <span class="item">
      <span class="icon">⏱️</span>
      预计阅读时间：{{ readingTime }} 分钟
    </span>
  </div>
</template>

<style scoped>
.reading-info {
  display: flex;
  gap: 16px;
  font-size: 0.9em;
  color: var(--vp-c-text-2);
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px dashed var(--vp-c-divider);
}

.item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon {
  font-size: 1.1em;
}

@media (max-width: 640px) {
  .reading-info {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
