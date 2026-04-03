<template>
  <div class="min-h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
    <aside class="w-72 p-4 border-r border-white/10 bg-white/5 backdrop-blur-xl">
      <div class="rounded-2xl bg-white/10 p-4 mb-4 shadow-lg border border-white/10">
        <div class="text-lg font-bold tracking-wide">TG Album</div>
        <div class="text-xs text-white/60 mt-1">Cloudflare Pages + D1</div>
      </div>
      <el-menu class="bg-transparent border-none" router :default-active="$route.path" text-color="#fff" active-text-color="#60a5fa">
        <el-menu-item index="/admin/dashboard">Dashboard</el-menu-item>
        <el-menu-item index="/admin/photos">Photos</el-menu-item>
        <el-menu-item index="/admin/albums">Albums</el-menu-item>
        <el-menu-item index="/admin/recycle">Recycle Bin</el-menu-item>
      </el-menu>
    </aside>

    <div class="flex-1 flex flex-col">
      <header class="h-16 px-6 flex items-center justify-between border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div class="text-sm text-white/70">Admin Console</div>
        <div class="text-xs text-white/50">Hash Router • D1 • Pages Functions</div>
      </header>
      <main class="flex-1 p-6 overflow-auto">
        <div class="max-w-7xl mx-auto">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>
