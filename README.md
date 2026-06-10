# geekclaw.ai

当前仓库用于维护 `geekclaw.ai` 的线上内容。

## 当前结构

- `halo/`
  - 当前线上官网入口
  - 轻量静态站点，使用 `bun + node:http`
  - 不依赖前端框架，不需要额外构建
- `buytoken/`
  - 保留的独立项目
- `geekclaw/`
  - 历史项目与素材保留区
- `web/`
  - 历史网站源码保留区，当前不作为线上入口

## 当前线上入口

当前 `geekclaw.ai` 使用 `halo` 目录运行。

- PM2 配置: `halo/ecosystem.config.cjs`
- 默认端口: `26222`
- 健康检查: `/health`

## 启动方式

在服务器上：

```bash
cd /data/clawos/halo
pm2 start ecosystem.config.cjs --only halo
pm2 save
```

本地直接运行：

```bash
cd /data/clawos/halo
bun run start
```

## 素材来源

`halo/public/` 当前使用的以下素材来自历史 `geekclaw` 项目：

- `logo.png`
- `screenshot1.jpg`
- `screenshot2.jpg`

## 维护约定

- 优先保持线上入口简单、稳定、可恢复
- 不把 `node_modules`、`.env`、构建产物和无关大文件提交进仓库
- 修改线上入口时，先更新本 README
