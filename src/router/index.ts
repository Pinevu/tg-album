import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'
import { useAuthStore } from '@/store/auth'

const routes = [
  { path: '/', component: () => import('@/pages/PublicHome.vue') },
  { path: '/app/:slug', component: () => import('@/pages/PublicHome.vue') },
  { path: '/:slug', component: () => import('@/pages/PublicHome.vue') },
  { path: '/login', component: () => import('@/pages/Login.vue') },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    children: [
      { path: 'dashboard', component: () => import('@/pages/Dashboard.vue') },
      { path: 'photos', component: () => import('@/pages/Photos.vue') },
      { path: 'albums', component: () => import('@/pages/Albums.vue') },
      { path: 'pools', component: () => import('@/pages/Pools.vue') },
      { path: 'recycle', component: () => import('@/pages/RecycleBin.vue') },
      { path: 'settings', component: () => import('@/pages/Settings.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.path.startsWith('/admin') && !auth.token) return '/login'
  if (to.path === '/login' && auth.token) return '/admin/dashboard'
})

router.afterEach(async (to) => {
  if (!to.path.startsWith('/admin')) return
  await nextTick()
  const blurNow = () => {
    const active = document.activeElement as HTMLElement | null
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) active.blur()
  }
  blurNow()
  setTimeout(blurNow, 50)
  setTimeout(blurNow, 250)
})

export default router
