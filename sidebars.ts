import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  guideSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      items: ['intro', 'authentication'],
    },
    {
      type: 'category',
      label: 'Invoice',
      items: [
        'checkout/overview',
        'checkout/creating-your-first-invoice',
        'checkout/processing-webhooks',
        'checkout/invoice-lifecycle',
        'checkout/handling-invoice-exceptions',
      ],
    },
    {
      type: 'category',
      label: 'Payouts',
      items: [
        'payouts/overview',
        'payouts/sending-a-payout',
        'payouts/payout-lifecycle',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      items: [
        'reference/supported-networks',
        'reference/supported-currencies',
      ],
    },
  ],
};

export default sidebars;
