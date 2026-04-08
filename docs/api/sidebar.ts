import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "api/appreal-api-business",
    },
    {
      type: "category",
      label: "Invoice",
      link: {
        type: "doc",
        id: "api/invoice",
      },
      items: [
        {
          type: "doc",
          id: "api/invoice-business-controller-create",
          label: "Create a new invoice",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/invoice-business-controller-list",
          label: "List invoices for the authenticated account",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/invoice-business-controller-find-one",
          label: "Get invoice by public ID",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/invoice-business-controller-update",
          label: "Update invoice fields",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "api/invoice-business-controller-activate",
          label: "Activate invoice",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/invoice-business-controller-cancel",
          label: "Cancel invoice",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "Balances",
      link: {
        type: "doc",
        id: "api/balances",
      },
      items: [
        {
          type: "doc",
          id: "api/account-balance-business-controller-get-balances",
          label: "Get account balances for the authenticated business",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/account-balance-business-controller-get-balance-by-id",
          label: "Get a specific account balance by public ID for the authenticated business",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/account-balance-business-controller-get-balance-history",
          label: "Get balance history for a specific account balance",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/account-balance-business-controller-export-history-by-balance-id",
          label: "Export balance history as CSV for a specific account balance",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Exchange Rates",
      link: {
        type: "doc",
        id: "api/exchange-rates",
      },
      items: [
        {
          type: "doc",
          id: "api/exchange-rate-business-controller-get-all-rates",
          label: "Get all crypto assets with exchange rates",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/exchange-rate-business-controller-get-crypto-rates",
          label: "Get exchange rates for a specific crypto asset",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Currencies",
      link: {
        type: "doc",
        id: "api/currencies",
      },
      items: [
        {
          type: "doc",
          id: "api/currency-business-controller-get-all",
          label: "List all supported crypto currencies/assets",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/currency-business-controller-get-by-alias",
          label: "Get currency by alias",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Networks",
      link: {
        type: "doc",
        id: "api/networks",
      },
      items: [
        {
          type: "doc",
          id: "api/network-business-controller-get-all",
          label: "List all supported blockchain networks",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/network-business-controller-get-by-network",
          label: "Get network by slug",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Payout",
      link: {
        type: "doc",
        id: "api/payout",
      },
      items: [
        {
          type: "doc",
          id: "api/payout-business-controller-get-business-payouts",
          label: "Get payouts for business API key",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/payout-business-controller-create-business-payout",
          label: "Create a new payout for business API key",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/payout-business-controller-inquire-business-account",
          label: "Inquire account details for business API key",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/payout-business-controller-get-business-payout-info",
          label: "Get payout information including fees and validation requirements for business API key",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/payout-business-controller-get-business-payout-status",
          label: "Get payout status for business API key",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/payout-business-controller-get-business-payout-details",
          label: "Get specific payout details for business API key",
          className: "api-method get",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
