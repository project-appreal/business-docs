const { readFileSync } = require('fs');
const { resolve } = require('path');

module.exports = function apiEndpointPages(context) {
  const manifest = JSON.parse(
    readFileSync(resolve(context.siteDir, 'static/api-specs/_manifest.json'), 'utf-8')
  );

  return {
    name: 'api-endpoint-pages',

    // Scalar CDN is loaded dynamically per-page by ApiEndpointPage.tsx
    // (not injected globally) to avoid loading on guide pages.

    async contentLoaded({ actions }) {
      const { addRoute, createData } = actions;

      const manifestPath = await createData(
        'api-manifest.json',
        JSON.stringify(manifest)
      );

      // Index page at /api
      addRoute({
        path: '/api',
        component: resolve(__dirname, '../src/components/ApiIndexPage.tsx'),
        exact: true,
        modules: {
          manifest: manifestPath,
        },
      });

      // Per-endpoint pages
      for (const ep of manifest) {
        const epDataPath = await createData(
          `api-ep-${ep.slug}.json`,
          JSON.stringify(ep)
        );

        addRoute({
          path: `/api/${ep.slug}`,
          component: resolve(__dirname, '../src/components/ApiEndpointPage.tsx'),
          exact: true,
          modules: {
            endpoint: epDataPath,
            manifest: manifestPath,
          },
        });
      }
    },
  };
};
