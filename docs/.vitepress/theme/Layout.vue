<script setup lang="ts">
import DefaultTheme from 'vitepress/theme';
import WebviewSidebarBrand from './WebviewSidebarBrand.vue';

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #sidebar-nav-before>
      <WebviewSidebarBrand />
    </template>
  </Layout>
</template>
