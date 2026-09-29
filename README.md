# 手游墓园 · Cœmeterium Ludorum

为关服游戏的单机复活版准备的展示页。纯静态，无构建步骤，直接部署到 GitHub Pages。

- **已安息**：已关服、已复活的游戏，每座墓碑一款。点击墓碑会把它从土里拔起、放大，碑文逐字刻出；可翻到**碑阴**查看更新日志。
- **待入土**：尚未关服的游戏，挖好了墓穴，只立了木牌。点击后展开羊皮卷，列出它的 MOD。

## 修改内容

**所有文字和数据都在 `config.js` 里**，其他文件不用动。

```js
{
  id: "artery-gear",        // 唯一 ID，也是分享链接：index.html#artery-gear
  type: "buried",           // buried = 已安息；open = 待入土
  name: "机动战姬：聚变",
  nameLatin: "Artery Gear: Fusion",
  born: "2019", died: "2023",
  epitaph: "钢铁与少女，于此长眠",
  version: "v0.1.0",
  platform: "Android",
  description: "支持 **粗体**、*斜体*、[链接](https://...) 和换行",
  stone: { shape: "gothic", material: "granite", emblem: "gear", gilt: false },
  offering: "candle",       // 碑前祭品：candle / flowers / none，不填则随机
  portrait: "assets/xx.png",// 可选：碑面椭圆瓷像
  tags: ["单机"],
  downloads: [{ label: "复活版 APK", url: "...", note: "累积更新包", icon: "android" }],
  changelog: [{ version: "v0.1.0", date: "2026-09-29", notes: ["..."] }]
}
```

| 字段 | 可选值 |
| --- | --- |
| `stone.shape` | `gothic` 尖拱 · `arch` 圆拱 · `shoulder` 耸肩 · `slab` 平顶 · `cross` 十字 |
| `stone.material` | `granite` 花岗岩 · `marble` 大理石 · `slate` 板岩 · `sandstone` 砂岩 · `basalt` 玄武岩 |
| `stone.emblem` | `gear` `moon` `cross` `sword` `rose` `skull` `star` `hourglass`，也可以填图片路径 |
| `icon`（下载） | `android` `windows` `github` `cloud` `link` `download` |

`stone` 里没填的项会按 `id` 生成固定的随机外观（每次打开都一样）。

待入土的条目用 `type: "open"`，填 `status`、`note`、`mods` 数组，以及可选的 `seal`（火漆印纹章，默认沙漏）；每个 MOD 可以有 `name` `version` `author` `description` `downloads` `changelog`。

`site`、`labels`、`effects` 分别控制站点文字、界面用语和氛围特效（雾浓度、鬼火数量、落叶、蝙蝠、闪电、魂火）。`site.ambientAudio` 填一个音频路径就会出现背景音按钮。

## 本地预览

直接双击 `index.html` 就能打开。

## 部署到 GitHub Pages

1. 新建仓库，把本目录所有文件推到 `main` 分支根目录（包括 `.nojekyll`）。
2. 仓库 **Settings → Pages → Build and deployment**，Source 选 **Deploy from a branch**，分支选 `main` / `/ (root)`。
3. 等一两分钟，访问 `https://<用户名>.github.io/<仓库名>/`。

## 说明

- 字体从 Google Fonts 加载；加载不到时会退回系统衬线体，页面照常可用。
- 开场铁门每个浏览器会话只播放一次；系统开启「减少动态效果」时会跳过开场并减弱特效。
- 键盘：`Esc` 关闭，`F` 翻转碑身；浏览器后退键也能关闭放大视图。
