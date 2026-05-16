<script setup lang="ts">
interface ChoiceCard {
  title: string
  link: string
  description: string
  badge?: string
}

defineProps<{
  title?: string
  description?: string
  appendix: ChoiceCard
  mainline: ChoiceCard
}>()
</script>

<template>
  <section class="reading-branch">
    <div class="reading-branch__header">
      <p class="reading-branch__eyebrow">阅读分流</p>
      <h2 class="reading-branch__title">{{ title || '你想怎么继续？' }}</h2>
      <p v-if="description" class="reading-branch__description">{{ description }}</p>
    </div>

    <div class="reading-branch__grid">
      <a class="reading-branch__card reading-branch__card--appendix" :href="appendix.link">
        <span v-if="appendix.badge" class="reading-branch__badge">{{ appendix.badge }}</span>
        <strong class="reading-branch__card-title">{{ appendix.title }}</strong>
        <span class="reading-branch__card-text">{{ appendix.description }}</span>
      </a>

      <a class="reading-branch__card reading-branch__card--mainline" :href="mainline.link">
        <span v-if="mainline.badge" class="reading-branch__badge">{{ mainline.badge }}</span>
        <strong class="reading-branch__card-title">{{ mainline.title }}</strong>
        <span class="reading-branch__card-text">{{ mainline.description }}</span>
      </a>
    </div>
  </section>
</template>

<style scoped>
.reading-branch {
  margin: 32px 0;
  padding: 24px;
  border: 1px solid color-mix(in srgb, var(--vp-c-divider) 75%, white 25%);
  border-radius: 20px;
  background:
    radial-gradient(circle at top left, rgba(44, 122, 123, 0.12), transparent 42%),
    linear-gradient(135deg, rgba(244, 248, 247, 0.96), rgba(255, 255, 255, 0.98));
}

.dark .reading-branch {
  background:
    radial-gradient(circle at top left, rgba(106, 190, 179, 0.18), transparent 40%),
    linear-gradient(135deg, rgba(24, 30, 33, 0.96), rgba(30, 37, 41, 0.98));
}

.reading-branch__header {
  margin-bottom: 18px;
}

.reading-branch__eyebrow {
  margin: 0 0 8px;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #2f7f78;
}

.reading-branch__title {
  margin: 0;
  font-size: 1.35rem;
}

.reading-branch__description {
  margin: 10px 0 0;
  color: var(--vp-c-text-2);
}

.reading-branch__grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.reading-branch__card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 176px;
  padding: 20px;
  border-radius: 16px;
  text-decoration: none;
  border: 1px solid transparent;
  color: inherit;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.reading-branch__card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(20, 33, 39, 0.08);
}

.reading-branch__card--appendix {
  background: rgba(253, 246, 221, 0.92);
  border-color: rgba(210, 162, 58, 0.35);
}

.reading-branch__card--mainline {
  background: rgba(224, 244, 239, 0.96);
  border-color: rgba(47, 127, 120, 0.28);
}

.dark .reading-branch__card--appendix {
  background: rgba(70, 56, 19, 0.68);
  border-color: rgba(229, 188, 87, 0.32);
}

.dark .reading-branch__card--mainline {
  background: rgba(18, 60, 55, 0.76);
  border-color: rgba(90, 205, 188, 0.28);
}

.reading-branch__badge {
  align-self: flex-start;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.72);
}

.dark .reading-branch__badge {
  background: rgba(255, 255, 255, 0.12);
}

.reading-branch__card-title {
  font-size: 1.08rem;
}

.reading-branch__card-text {
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

@media (max-width: 640px) {
  .reading-branch {
    padding: 18px;
  }

  .reading-branch__grid {
    grid-template-columns: 1fr;
  }

  .reading-branch__card {
    min-height: auto;
  }
}
</style>