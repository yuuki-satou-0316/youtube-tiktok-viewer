<template>
  <div class="app">
    <!-- メインコンテンツ -->
    <main class="main-content">
      <router-view />
    </main>
    
    <!-- フッターナビゲーション -->
    <FooterNavigation />
  </div>
</template>

<script>
import FooterNavigation from './components/FooterNavigation.vue'

export default {
  name: 'App',
  components: {
    FooterNavigation
  }
}
</script>

<style scoped>
.app {
  width: 100vw;
  height: 100vh;
  height: 100svh;
  background: #000;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: hidden;
}</style>