import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';
import apiSidebar from './docs/api/sidebar';

const sidebars: SidebarsConfig = {
  guideSidebar: ['intro', 'authentication'],
  apiSidebar: apiSidebar,
};

export default sidebars;
