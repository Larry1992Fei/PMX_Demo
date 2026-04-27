/**
 * Payment Link Domain Type Definitions
 * 链接支付业务领域的 TypeScript 类型系统
 */

export type LinkMode = 'dashboard' | 'api';

export const LINK_MODE_CONFIG: Record<LinkMode, { label: string; desc: string }> = {
  dashboard: {
    label: '商户管理后台创建链接',
    desc: '在 PayerMax 商户后台通过交互式界面生成支付链接，无需开发集成'
  },
  api: {
    label: 'API 创建链接',
    desc: '通过调用接口动态生成支付链接，适用于自动化、大规模分发场景'
  }
};
