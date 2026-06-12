# Payload for geekclaw.ai

`geekclaw.ai` 当前主站和后台基于 `Payload + Next.js`，覆盖内容站、博客、专题页、商品、订单、支付联调和运营后台。

## 当前状态

已完成：

- 官网前台：`/`、`/blog`、`/blog/[slug]`、`/shop`、`/shop/[slug]`、`/bailongma`、`/[slug]`
- Payload 后台：`/admin`
- 内容模型：页面、文章、媒体、站点设置、文章分类/标签
- 商城模型：商品、订单、商品分类/标签
- 支付配置模型：独立 `payment-settings` 全局，和首页内容配置分离
- 支付迁移闭环：`/admin/payment-readiness` 可识别旧 `site-settings.payment` 遗留，并支持一键迁移到 `payment-settings`
- 支付来源追踪：联调页可明确区分环境变量、`payment-settings`、旧 `site-settings.payment` 遗留和最终回退值
- 环境覆盖可见：联调页、前台诊断页和 `payment-settings` 侧栏都会明确提示哪些支付字段正被环境变量覆盖，避免后台改值后误判“未生效”
- Notify 单独判定：诊断页和联调页会单独显示“异步通知是否具备验签与订单回写前提”，避免只看支付跳转就误判真实接入已完成
- 密钥维护收口：`payment-settings` 不再直接回显完整私钥/公钥，改为摘要状态 + 单独轮换面板，并支持 PEM 校验与显式清空后台回退密钥
- 首页编排：首页 hero、推荐页面、推荐文章、推荐商品、CTA、导航、页脚、SEO 都由后台驱动
- 博客/商城前台筛选：支持分类和标签筛选
- 订单链路：创建订单、支付发起、Mock 支付、支付回跳、notify、失败页、订单详情页
- 支付运营：支付诊断页、支付联调就绪页、支付观测页、支付复核、主动查单、批量查单、超时关单
- 订单运营：订单工作台、单品订单台、库存占用台、销售与履约报表、订单导出、后台录单
- 内容治理：内容治理台、素材治理台、后台首页内容/库存/支付摘要
- 角色权限：`super-admin / ops / editor`
- 权限落地：集合/全局访问控制、高风险订单 API 限权、后台入口裁剪、原生导航按业务域裁剪、集合直链访问按业务域拒绝、支付配置独立授权、订单操作按钮级裁剪
- 常驻任务：`payload-orders-maintenance` 定时执行超时关单和 stale processing 查单

仍未完成：

- 支付宝真实密钥接入后的完整联调
- 支付宝异步通知真实验签与生产回调验证
- 真实支付成功后的对账、异常补偿和长期运维细节
- 更细的后台导航定制和角色化原生 Admin 体验

## 环境与运行

开发：

```bash
cd /data/clawos/payload
cp .env.local.example .env.local
npm install
npm run seed
npm run dev
```

生产构建与启动：

```bash
cd /data/clawos/payload
npm run build
pm2 start ecosystem.config.cjs
```

已存在 PM2 进程时：

```bash
cd /data/clawos/payload
npm run build
pm2 restart payload-geekclaw
pm2 restart payload-orders-maintenance
```

当前生产端口：

```text
http://127.0.0.1:26223
```

当前 PM2 进程：

- `payload-geekclaw`
- `payload-orders-maintenance`

## 常用脚本

```bash
npm run seed
npm run build
npm run smoke:payment
npm run close:expired-orders
npm run sync:processing-orders
npm run orders:maintenance
npm run backfill:order-payment-chain
npm run payload -- generate:types
```

## 支付说明

当前默认仍允许 `mock` 支付闭环，便于开发和回归：

- `GET /payment-diagnostics`
- `GET /pay/mock/[orderNo]`
- `POST /api/pay/mock/complete`
- `POST /api/orders/pay`
- `POST /api/orders/query-payment`
- `POST /api/orders/review-payment`
- `POST /api/orders/close-expired`
- `POST /api/orders/sync-processing`

支付冒烟：

```bash
cd /data/clawos/payload
npm run smoke:payment
```

如需指定目标地址：

```bash
cd /data/clawos/payload
PAYMENT_SMOKE_BASE_URL=http://127.0.0.1:3000 npm run smoke:payment
```

当前冒烟覆盖：

- 创建测试订单
- 错误金额访问 `/pay-success` 不会误改为已支付
- 发起 `/api/orders/pay`
- 缺少真实支付宝公钥时，`/api/pay/alipay/notify` 被阻断
- `query-payment`、`sync-processing`、`close-expired` 可正常执行
- 已关闭订单不能重新进入支付

## 角色与权限

- `super-admin`
  可管理所有内容、商城、支付、用户与系统入口
- `ops`
  可管理商品、订单、支付、履约、录单、库存、报表和 `payment-settings`
- `editor`
  可管理页面、文章、媒体、站点设置与内容治理

当前已额外收口：

- `editor` 在 Payload 原生左侧导航里不再看到商品、订单、商城 taxonomy
- `ops` 在 Payload 原生左侧导航里不再看到页面、文章、内容 taxonomy
- `editor` 即使拿到商城集合直链，也不能再进入 `products / orders / product-categories / product-tags` 的原生 Admin
- `ops` 即使拿到内容集合直链，也不能再进入 `pages / posts / post-categories / post-tags` 的原生 Admin
- 支付参数已从 `site-settings` 拆到独立的 `payment-settings` 全局，避免内容配置和支付密钥混在一起
- 联调页会检测旧支付配置遗留，必要时可直接从后台一键迁移
- `editor` 不再看到订单工作台里的批量取消、支付复核、履约推进、交付维护和运营备注操作
- `editor` 不再看到原生订单编辑摘要里的支付复核与履约操作
- 公开订单详情页只有已登录的 `super-admin / ops` 才会看到后台处理区

## 当前主要后台入口

- `/admin`
- `/admin/ops-center`
- `/admin/orders-workbench`
- `/admin/manual-order`
- `/admin/payment-readiness`
- `/admin/payment-observability`
- `/admin/globals/payment-settings`
- `/admin/inventory-occupancy`
- `/admin/product-orders`
- `/admin/sales-fulfillment`
- `/admin/content-governance`
- `/admin/media-governance`

## 目录

- `src/app/(frontend)/`
  官网前台
- `src/app/(payload)/`
  Payload Admin 与后台页
- `src/app/api/`
  订单、支付、导出、维护接口
- `src/collections/`
  页面、文章、商品、订单、素材、taxonomy 集合
- `src/globals/`
  站点设置与支付设置
- `src/components/admin/`
  后台运营组件
- `src/lib/`
  订单、支付、治理、权限、前台数据逻辑
- `src/scripts/`
  seed、支付冒烟、维护、回填脚本

## 运维备注

- 当前服务器依赖 `4G swap` 来降低 `next build` 被 OOM kill 的风险
- 支付配置读取顺序为：环境变量优先，`payment-settings` 回退
- 若修改了 PM2 环境变量，需要重启 `payload-geekclaw`
- 真实支付宝联调前，不要把 `mock` 链路当成生产验收完成
