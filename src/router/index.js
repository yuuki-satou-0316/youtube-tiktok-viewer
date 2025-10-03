import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Search from '../views/Search.vue'
import Quiz from '../views/Quiz.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: 'ホーム - YouTube TikTok Viewer'
    }
  },
  {
    path: '/search',
    name: 'Search',
    component: Search,
    meta: {
      title: '検索 - YouTube TikTok Viewer'
    }
  },
  {
    path: '/quiz',
    name: 'Quiz',
    component: Quiz,
    meta: {
      title: 'クイズ - YouTube TikTok Viewer'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// ページタイトルを更新
router.afterEach((to) => {
  document.title = to.meta.title || 'YouTube TikTok Viewer'
})

export default router