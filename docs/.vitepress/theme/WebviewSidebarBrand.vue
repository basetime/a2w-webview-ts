<script setup lang="ts">
import { withBase } from 'vitepress';

const LOGO_URL = 'https://cdn.addtowallet.io/img/a2w-webview-ts-logo.png';
const homeHref = withBase('/');
</script>

<template>
  <a class="webview-sidebar-brand" :href="homeHref" aria-label="a2w-webview-ts">
    <img :src="LOGO_URL" alt="a2w-webview-ts" width="500" height="191" decoding="async" />
  </a>
</template>
