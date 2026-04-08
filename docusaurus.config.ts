import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import type { ScalarOptions } from '@scalar/docusaurus';

const config: Config = {
  title: 'Appreal API',
  tagline: 'Accept cryptocurrency payments with a single API',
  url: 'https://appreal-docs.netlify.app',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      '@scalar/docusaurus',
      {
        label: 'API Reference',
        route: '/api',
        showNavLink: false,
        configuration: {
          url: '/openapi.json',
          hideClientButton: true,
          hideModels: true,
        },
      } as ScalarOptions,
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'Appreal API',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'guideSidebar',
          position: 'left',
          label: 'Guides',
        },
        {
          label: 'API Reference',
          to: '/api',
          position: 'left',
        },
        {
          type: 'html',
          position: 'right',
          value: '<span class="api-version-badge">v1.0</span>',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} Appreal`,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
