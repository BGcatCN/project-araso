import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import StatChart from './components/StatChart.vue'
import ReadingTime from './components/ReadingTime.vue'
import ApiDemo from './components/ApiDemo.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('StatChart', StatChart)
    app.component('ReadingTime', ReadingTime)
    app.component('ApiDemo', ApiDemo)
  },
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'doc-before': () => h(ReadingTime)
    })
  }
}
