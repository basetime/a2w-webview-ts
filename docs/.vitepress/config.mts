import { defineConfig } from 'vitepress';
import pkg from '../../package.json';
import { toAnchor } from '../../scripts/docs-slugger.mjs';
import { sidebar } from './sidebar.generated';

const siteBase = '/a2w-webview-ts/';

const withSiteBase = (path: string) => {
  if (!path.startsWith('/') || path.startsWith(siteBase) || path.startsWith('//')) {
    return path;
  }

  return `${siteBase.replace(/\/$/, '')}${path}`;
};

export default defineConfig({
  title: 'a2w-webview-ts',
  description: 'SDK for webview apps running inside the Addtowallet scanner.',
  base: siteBase,
  appearance: 'force-dark',
  cleanUrls: true,
  vite: {
    publicDir: '.vitepress/static',
  },
  ignoreDeadLinks: [/^https?:\/\/localhost(?::\d+)?(?:\/|$)/],
  markdown: {
    anchor: {
      slugify: toAnchor,
    },
    config(md) {
      const defaultRender =
        md.renderer.rules.image ??
        ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

      md.renderer.rules.image = (tokens, idx, options, env, self) => {
        const renderedImage = defaultRender(tokens, idx, options, env, self);
        const token = tokens[idx];
        const src = token.attrGet('src');
        const isAlreadyLinked =
          tokens[idx - 1]?.type === 'link_open' && tokens[idx + 1]?.type === 'link_close';

        if (!src || isAlreadyLinked) {
          return renderedImage;
        }

        return `<a class="vp-doc-image-link" href="${md.utils.escapeHtml(withSiteBase(src))}" target="_blank" rel="noopener noreferrer">${renderedImage}</a>`;
      };
    },
    gfmAlerts: true,
    languageAlias: {
      env: 'dotenv',
    },
  },
  themeConfig: {
    // Compact mark for the mobile nav bar; desktop uses the full-width
    // sidebar brand (see theme/WebviewSidebarBrand.vue + custom.css).
    logo: {
      src: 'https://cdn.addtowallet.io/img/a2w-webview-ts-logo.png',
      alt: 'a2w-webview-ts',
    },
    siteTitle: false,
    nav: [
      {
        text: `v${pkg.version}`,
        link: 'https://github.com/basetime/a2w-webview-ts/releases',
      },
    ],
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/basetime/a2w-webview-ts',
        ariaLabel: 'a2w-webview-ts on GitHub',
      },
    ],
    sidebar,
    outline: {
      level: [2, 3],
      label: 'On this page',
    },
    search: {
      provider: 'local',
    },
  },
});
