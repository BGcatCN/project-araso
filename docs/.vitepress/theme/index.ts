import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import StatChart from './components/StatChart.vue'
import ReadingTime from './components/ReadingTime.vue'
import ApiDemo from './components/ApiDemo.vue'
import ReadingBranch from './components/ReadingBranch.vue'
import TextAnnotation from './components/TextAnnotation.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('StatChart', StatChart)
    app.component('ReadingTime', ReadingTime)
    app.component('ApiDemo', ApiDemo)
    app.component('ReadingBranch', ReadingBranch)
    app.component('Annotation', TextAnnotation)
  },
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'doc-before': () => h(ReadingTime)
    })
  }
}
