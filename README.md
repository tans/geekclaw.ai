# geekclaw.ai

当前仓库用于维护 `geekclaw.ai` 的线上站点、后台和支付接入。

## 当前结构

- `payload/`
  - 当前主站与后台入口
  - 基于 `Payload + Next.js`
  - 承担 GeekClaw、OPC、LiloAvatar 官网内容、博客、普通页面、商品、订单、支付骨架与后台管理
- `halo/`
  - 备用静态站
  - 用于保留轻量落地页与历史素材承接
- `buytoken/`
  - 保留的独立项目
- `geekclaw/`
  - 历史项目与素材保留区
- `web/`
  - 历史网站源码保留区，当前不作为生产入口

## 当前运行状态

截至 `2026-06-11`，服务器上两个 PM2 进程都在线：

- `payload-geekclaw`
  - 当前主站服务
  - PM2 配置：`payload/ecosystem.config.cjs`
  - 端口：`26223`
- `halo`
  - 备用静态站
  - PM2 配置：`halo/ecosystem.config.cjs`
  - 端口：`26222`

当前内容维护应以 `payload/` 为准。

## 内容规划

- `geekclaw.ai`
  - GeekClaw 产品组合官网
  - 承接企业 AI、OPC、LiloAvatar 与主机销售入口
- `opc.geekclaw.ai`
  - OPC 官网入口
  - 面向开放能力、流程编排、工具接入和运行治理
- `geekclaw.ai/liloavatar`
  - LiloAvatar 官网入口
  - 面向数字人内容、记忆、互动和长期运营场景
- `/shop`
  - 主机销售与方案商品入口
  - 商品、价格、库存、上下架和履约说明均由 Payload 后台维护

页面可以参考行业竞品的信息架构和表达节奏，但不得在前台文案中暴露参考产品名称、来源或改写关系。

## 启动方式

主站：

```bash
cd /data/clawos/payload
npm run build
pm2 start ecosystem.config.cjs --only payload-geekclaw
pm2 save
```

如已存在进程：

```bash
cd /data/clawos/payload
npm run build
pm2 restart payload-geekclaw
```

备用静态站：

```bash
cd /data/clawos/halo
pm2 start ecosystem.config.cjs --only halo
pm2 save
```

## 当前已确认能力

- `/admin` 后台可访问
- `/blog` 博客列表可访问
- `/bailongma` 专题页可访问
- `pages` 集合中的普通页面，发布后可通过对应 `slug` 直接前台访问
- 不存在的普通页面会正常返回 `404`

## 维护约定

- 以 `payload/` 作为当前生产代码主线维护
- `halo/` 只作为备用和素材承接，不再作为主功能迭代入口
- 不把 `node_modules`、`.env`、构建产物和无关大文件提交进仓库
- 修改生产入口、端口、PM2 配置或路由能力时，先同步更新 README
