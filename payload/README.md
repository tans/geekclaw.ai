# Payload for geekclaw.ai

这是 `geekclaw.ai` 的主站与后台，基于 `Payload + Next.js`。

## 目标

- 一个专业内容站后台
- 一个可管理商品、订单的商城后台
- 支持专题二级页面
- 支持博客/文章发布
- 支持 GeekClaw、OPC、LiloAvatar 三条产品线的官网表达

## 当前阶段

当前已完成：

- Payload 项目骨架
- 页面、文章、商品、订单、媒体、站点设置模型
- 订单模型已补充履约字段：履约状态、交付方式、跟踪号、交付备注、交付时间
- `/bailongma` 二级页面前台入口
- `/blog` 与 `/shop` 前台结构
- 博客详情页与商品详情页路由
- 后台 `/admin` 已可进入初始化/登录
- 默认内容种子脚本可执行
- 前台已优先读取 Payload 内容与站点设置
- 商品详情页已可创建订单并写入后台
- `/api/orders/pay` 已可发起支付骨架，订单会进入 `processing`
- `/pay/alipay/redirect` 已作为真实支付宝跳转前的占位桥接页
- `.env` / 站点设置已支持支付宝参数读取，且 env 优先
- `/api/pay/alipay/notify`、`/pay-success`、`/pay-failed` 已补齐基础支付回流骨架
- `/pay-success` 在带回 `trade_status=TRADE_SUCCESS/TRADE_FINISHED` 时，会先做一次同步返回兜底回写，最终状态仍以 notify 为准
- `/pay/mock/[orderNo]` 与 `/api/pay/mock/complete` 已补齐 mock 支付闭环，前台点击即可真实回写订单状态
- `/orders/[orderNo]` 已可查看订单详情与支付状态
- `/payment-diagnostics` 与 `/api/payment/diagnostics` 已可检查当前支付宝配置是否会走真实支付或 mock
- `bailongma` 已升级为区块化专题页结构，可后台管理 hero / feature grid / stats / cta
- 站点设置已驱动前台基础品牌层：SEO metadata、主题主色、页脚联系信息、导航与站点名称
- 博客与商品详情页已开始消费 Payload 内容字段：摘要、正文、发布时间、封面图、商品图库与页面级 metadata
- 博客列表与商品列表已升级为内容卡片结构，可消费摘要、主图和基础信息
- 首页已升级为聚合入口，串联专题页、最新文章、精选商品、后台入口与支付诊断
- 通用页面路由已打通，后台新建并发布的普通页面可直接通过 slug 前台访问
- `payload-geekclaw` 已在服务器通过 `pm2` 跑通，生产端口为 `26223`
- `geekclaw.ai` 当前承接 GeekClaw 产品组合官网
- `opc.geekclaw.ai` 当前承接 OPC 官网入口
- `geekclaw.ai/liloavatar` 当前承接 LiloAvatar 官网入口

当前未完成：

- 支付宝真实密钥配置后的联调
- 支付宝真实密钥配置后的联调
- 支付成功后的真实异步通知联调与状态回写验证
- 商品订单的支付成功/失败页细化与用户提示优化

## 初始化步骤

安装依赖后，使用：

```bash
npm install
npm run seed
```

当前服务器如果内存较小，建议至少保留 `4G` swap，否则 `next build` 可能被系统 OOM killer 杀掉。

后台入口预期为：

```text
/admin
```

## 开发运行

```bash
cd /data/clawos/payload
cp .env.local.example .env.local
npm run dev
```

当前开发默认端口：

```text
3000
```

## 线上运行

当前 `geekclaw.ai` 和 `opc.geekclaw.ai` 通过 1Panel/OpenResty 反向代理到：

```text
http://127.0.0.1:26223
```

对应 PM2 进程为 `payload-geekclaw`。

## 内容边界

- 前台文案只使用自有品牌：GeekClaw、OPC、LiloAvatar
- 可以参考行业产品的信息架构，但不得暴露参考产品名称、来源或改写关系
- 主机销售、电商商品、价格、库存、履约说明均保留在 Payload 后台编辑

## PM2 运行

```bash
cd /data/clawos/payload
pm2 start ecosystem.config.cjs --only payload-geekclaw
```

如已存在进程，使用：

```bash
cd /data/clawos/payload
npm run build
pm2 restart payload-geekclaw
```

## 支付联调

本地可重复执行支付冒烟脚本：

```bash
cd /data/clawos/payload
npm run smoke:payment
```

默认会请求 `http://127.0.0.1:26223`，也可以覆盖：

```bash
cd /data/clawos/payload
PAYMENT_SMOKE_BASE_URL=http://127.0.0.1:3000 npm run smoke:payment
```

当前脚本会覆盖这些关键分支：

- 创建一张测试订单
- 用错误金额访问 `/pay-success`，确认不会误把订单改成已支付
- 发起 `/api/orders/pay`，确认支付入口仍可用
- 构造基础 `/api/pay/alipay/notify`
- 当前未配置支付宝公钥时，应返回 `missing public key`
- 若未来配置了支付宝公钥，则至少会拒绝缺少 `trade_status` 的 notify

## 环境说明

- 当前服务器已挂载 `/swapfile.clawos` 作为 `4G` swap，用于稳定执行 `next build`
- Payload 已在配置中显式接入 `sharp`，图片尺寸处理警告应当消失
- 当前机器内存仍然不高，避免同时并发跑多个 `next dev` / `next build` 进程，否则仍可能触发 OOM

## 目录说明

- `src/collections/`
  页面、博客、商品、订单、媒体模型
- `src/globals/`
  站点设置与全局配置
- `src/app/(frontend)/`
  官网前台页面
- `src/app/(payload)/`
  Payload Admin 与 API
- `src/scripts/seed.ts`
  默认内容初始化脚本
- `docs/implementation-plan.md`
  当前实施计划

## 当前可用能力

- 页面管理：官网首页、专题页、二级页
- 专题页区块：Hero、Feature Grid、Stats、CTA
- 博客发布：文章分类、摘要、封面、SEO
- 商品管理：商品、价格、封面、详情、状态、SKU
- 商品可售控制：支持库存开关、库存数量、是否允许缺货接单、单笔限购
- 订单管理：订单号、支付状态、收货信息
- 订单后台：支持来源、邮箱、运营备注、支付流水查看
- 后台工作台：已支持查看最近异常/处理中订单，以及“已支付待履约”订单队列
- 订单运营工作台：新增 `/admin/orders-workbench`，集中查看待支付、待履约、异常单
- 工作台快捷操作：待履约订单支持直接标记“准备中 / 已完成”
- 工作台筛选跳转：支持一键跳到 Payload 后台的支付失败、支付中、待履约订单列表
- 订单取消：前台订单详情页和后台工作台都可取消未支付订单，取消后会释放库存占用
- 超时关闭：未支付订单支持按超时时间自动关闭，默认 30 分钟
- 履约快捷接口：`POST /api/orders/fulfillment` 已可供工作台直接更新订单履约状态
- 工作台交付录入：待履约订单支持直接填写交付方式、跟踪号和交付备注
- 订单事件时间线：支付动作、履约动作、运营备注变更都会写入统一事件流，前台订单详情和后台事件页可追踪
- 订单列表默认视图：已调整为偏运营处理的列组合，优先展示支付状态、履约状态、交付方式、金额和支付时间
- 后台仪表盘：支付状态面板已提供异常单、支付中、待履约列表的快捷入口
- 订单履约：后台可维护交付状态、交付方式、跟踪号和交付备注，前台订单详情可展示
- 订单一致性：后台修改 `paymentStatus` / `fulfillmentStatus` 时，会自动补齐 `paidAt` / `fulfilledAt`，并同步关键订单状态
- 支付诊断：支持检查 appId / 密钥 / notify / return / gateway 的配置状态与来源
- 超时关闭入口：支持受 `CRON_SECRET` 保护的 `POST /api/orders/close-expired`，也支持 `npm run close:expired-orders`
- 支付骨架：订单创建、支付发起、mock 支付、支付跳转占位页、notify/return/失败页
- 下单校验：创建订单时会校验商品是否上架、是否超出单笔限购，以及库存不足时阻止超卖
- 取消保护：已取消订单会拒绝后续支付发起、mock 支付回写和支付宝回调成功回写
- 超时关闭保护：超时关闭后的订单同样不能重新进入支付流程
- 支付承接页：已支持订单创建后发起支付、失败后重新发起、mock 成功/失败状态回写，以及成功/失败页展示订单摘要
- 支付成功兜底：当支付宝同步返回带回 `trade_status=TRADE_SUCCESS/TRADE_FINISHED` 时，成功页会先把 `processing` 订单兜底更新为 `paid`，并写入支付事件
- 媒体管理：图片与素材上传
- 站点设置：品牌、SEO、导航、页脚、联系信息、主题主色
- 前台壳层：已消费站点名称、主色、SEO 元信息，并为 logo 接入预留了前台展示
- 内容详情页：博客详情已支持发布时间/摘要/正文/封面；商品详情已支持摘要/正文/封面/图库与页面级 SEO
- 内容列表页：博客列表已支持卡片化展示与时间信息；商品列表已支持卡片化展示、可售状态与封面图入口
- 商城详情页：已展示 SKU、购买说明、库存提示与缺货/限购状态
- 首页聚合：已支持专题入口、最新文章、精选商品和后台工作流说明
- 普通页面发布：`pages` 集合中的非保留 slug 页面已可直接前台访问，并消费页面级 SEO

## 下一步

- 用真实支付宝密钥完成联调
- 完成支付成功后的异步通知与订单状态自动回写验证
- 继续扩展专题页区块，向 `bailongma.top` 的表达力靠拢
- 增加订单列表筛选、批量处理与更细的运营备注工作流
