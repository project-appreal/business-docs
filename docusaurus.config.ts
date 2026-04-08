import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import type * as OpenApiPlugin from 'docusaurus-plugin-openapi-docs';
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
          docItemComponent: '@theme/ApiItem',
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
        label: 'API Client',
        route: '/api-client',
        showNavLink: false,
        configuration: {
          url: '/openapi.json',
        },
      } as ScalarOptions,
    ],
    [
      'docusaurus-plugin-openapi-docs',
      {
        id: 'api',
        docsPluginId: 'classic',
        config: {
          appreal: {
            specPath: 'static/openapi.json',
            outputDir: 'docs/api',
            sidebarOptions: {
              groupPathsBy: 'tag',
              categoryLinkSource: 'tag',
            },
            showSchemas: false,
            downloadUrl: '/openapi.json',
          } satisfies OpenApiPlugin.Options,
        },
      },
    ],
  ],

  themes: ['docusaurus-theme-openapi-docs'],

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
          type: 'docSidebar',
          sidebarId: 'apiSidebar',
          position: 'left',
          label: 'API Reference',
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
    languageTabs: [
      {
        highlight: 'bash',
        language: 'curl',
        logoClass: 'bash',
      },
      {
        highlight: 'python',
        language: 'python',
        logoClass: 'python',
      },
      {
        highlight: 'javascript',
        language: 'nodejs',
        logoClass: 'nodejs',
      },
      {
        highlight: 'go',
        language: 'go',
        logoClass: 'go',
      },
      {
        highlight: 'php',
        language: 'php',
        logoClass: 'php',
      },
    ],
    api: {
      authPersistance: 'localStorage',
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
