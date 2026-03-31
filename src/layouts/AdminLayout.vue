<template>
  <div class="min-h-screen flex bg-gray-900 text-white">
    <aside class="w-64 backdrop-blur-lg bg-white/10 p-4">
      <div class="text-lg font-bold mb-4">TG Album</div>
      <el-menu class="bg-transparent" router>
        <el-menu-item index="/admin/dashboard">Dashboard</el-menu-item>
        <el-menu-item index="/admin/photos">Photos</el-menu-item>
        <el-menu-item index="/admin/albums">Albums</el-menu-item>
        <el-menu-item index="/admin/recycle">Recycle Bin</el-menu-item>
      </el-menu>
    </aside>
    <main class="flex-1 p-6">
      <router-view />
    </main>
  </div>
</template>
