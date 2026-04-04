import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const routes = [
  { path: '/', component: () => import('@/pages/PublicHome.vue') },
  { path: '/login', component: () => import('@/pages/Login.vue') },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    children: [
      { path: 'dashboard', component: () => import('@/pages/Dashboard.vue') },
      { path: 'photos', component: () => import('@/pages/Photos.vue') },
      { path: 'albums', component: () => import('@/pages/Albums.vue') },
      { path: 'pools', component: () => import('@/pages/Pools.vue') },
      { path: 'recycle', component: () => import('@/pages/RecycleBin.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.path.startsWith('/admin') && !auth.token) return '/login'
  if (to.path === '/login' && auth.token) return '/admin/dashboard'
})

export default router
