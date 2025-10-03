<template>
  <nav class="footer-navigation">
    <router-link
      v-for="item in navigationItems"
      :key="item.name"
      :to="item.to"
      class="nav-item"
      :class="{ active: $route.name === item.name }"
    >
      <div class="nav-icon">
        <component :is="item.icon" />
      </div>
      <span class="nav-label">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script>
import { defineComponent } from 'vue'

// アイコンコンポーネント
const HomeIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>
  `
}

const SearchIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
    </svg>
  `
}

const QuizIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.5,1L2,6V8H21V6M16,10V17H19V19H5V17H8V10H10V15H14V10M2,20V22H21V20"/>
    </svg>
  `
}

export default defineComponent({
  name: 'FooterNavigation',
  components: {
    HomeIcon,
    SearchIcon,
    QuizIcon
  },
  setup() {
    const navigationItems = [
      {
        name: 'Home',
        label: 'ホーム',
        to: '/',
        icon: 'HomeIcon'
      },
      {
        name: 'Search',
        label: '検索',
        to: '/search',
        icon: 'SearchIcon'
      },
      {
        name: 'Quiz',
        label: 'クイズ',
        to: '/quiz',
        icon: 'QuizIcon'
      }
    ]

    return {
      navigationItems
    }
  }
})
</script>

<style scoped>
.footer-navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 8px 0;
  padding-bottom: max(8px, env(safe-area-inset-bottom));
  z-index: 1000;
  height: 70px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.2s ease;
  padding: 8px 12px;
  border-radius: 12px;
  min-width: 60px;
  position: relative;
}

.nav-item:hover {
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.05);
}

.nav-item.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  top: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 3px;
  background: #ff4444;
  border-radius: 2px;
}

.nav-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-icon svg {
  width: 100%;
  height: 100%;
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
  text-align: center;
  line-height: 1.2;
}

/* アニメーション効果 */
.nav-item.active .nav-icon {
  animation: bounce 0.3s ease;
}

@keyframes bounce {
  0%, 20%, 60%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-4px);
  }
  80% {
    transform: translateY(-2px);
  }
}

/* レスポンシブ対応 */
@media (max-width: 320px) {
  .nav-label {
    font-size: 10px;
  }
  
  .nav-icon {
    width: 20px;
    height: 20px;
  }
}

@media (min-width: 768px) {
  .footer-navigation {
    max-width: 400px;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 20px 20px 0 0;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
  }
}

/* ダークモード対応 */
@media (prefers-color-scheme: light) {
  .footer-navigation {
    background: rgba(255, 255, 255, 0.9);
    border-top-color: rgba(0, 0, 0, 0.1);
  }
  
  .nav-item {
    color: rgba(0, 0, 0, 0.6);
  }
  
  .nav-item:hover {
    color: rgba(0, 0, 0, 0.8);
    background: rgba(0, 0, 0, 0.05);
  }
  
  .nav-item.active {
    color: #000;
    background: rgba(0, 0, 0, 0.1);
  }
}
</style>