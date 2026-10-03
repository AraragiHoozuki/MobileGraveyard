/* =====================================================================
 *  墓园配置文件 —— 网站的全部文字与数据都在这里修改
 *  ---------------------------------------------------------------------
 *  · 纯 JS 对象，可写注释；直接用浏览器打开 index.html 也能读取
 *  · 文本字段支持极简标记：**粗体**  *斜体*  [文字](链接)  以及换行
 *  · type: "buried" = 已关服、已立碑的墓（你的单机复活版）
 *    type: "open"   = 挖好未填的墓（尚未关服的游戏，展示它们的 MOD）
 *    type: "alive"  = 长明灯（本就是单机的游戏，展示它们的 MOD）
 *  · 以下游戏数据均为示例，请替换为真实内容
 * ===================================================================== */
window.GRAVEYARD = {
  site: {
    title: "游戏墓园",
    titleLatin: "Cœmeterium Ludorum",
    subtitle: "为关服的游戏立碑，让它们以单机之身重返人间",
    epigraph: "“凡被铭记者，从未真正死去。”",
    enterText: "推开墓园之门",
    enterHint: "IN MEMORIAM",
    intro: true,              // 是否显示开场铁门动画（同一会话只播放一次）
    ambientAudio: "",         // 可选背景音，如 "assets/ambient.mp3"，留空则不显示音频按钮
    footer: "此处长眠着我们的青春。愿每一个被关闭的世界，都有人为它点一盏灯。",
    links: [
      { label: "BILIBILI", url: "https://space.bilibili.com/3325311" },
      { label: "GitHub", url: "https://github.com/AraragiHoozuki" },
      { label: "QQ", url: "https://qm.qq.com/q/bAY11Mr5v2" }
    ]
  },

  /* 界面文字，可按需改成其他语言 */
  labels: {
    buried: "已安息",
    open: "待入土",
    born: "生",
    died: "殁",
    version: "版本",
    downloads: "遗物 · 下载",
    changelog: "碑阴 · 更新记",
    flipToBack: "翻转碑身",
    flipToFront: "回到碑面",
    close: "离开",
    mods: "陪葬品 · MOD",
    openNote: "墓穴已掘，尚未合土",
    scrollHint: "步入墓园",
    noChangelog: "碑阴尚无刻字",
    platform: "平台",
    by: "制作",
    modUnit: "件陪葬品",
    modChangelog: "修订记",
    alive: "长明灯",
    aliveNote: "为它们点一盏不灭的灯",
    aliveLedgerNote: "灯火长明",
    aliveUnit: "份灯油",
    aliveMods: "灯油 · MOD",
    aliveChangelog: "添油记",
    // 首屏统计，{buried} {open} {alive} 会被替换为数量
    stats: "此处长眠 {buried} 款游戏 ✝ 另有 {open} 座墓穴虚位以待 ✝ {alive} 盏长明灯"
  },

  /* 氛围特效，数值越大越浓；设为 0 / false 关闭 */
  effects: {
    fog: 1,           // 雾气浓度 0 ~ 2
    wisps: 14,        // 鬼火数量
    dust: 70,         // 浮尘数量
    leaves: true,     // 飘落枯叶
    bats: true,       // 掠过月亮的蝙蝠
    lightning: true,  // 偶发远雷闪光
    souls: true       // 悬停墓碑时升起的魂火
  },

  graves: [
    {
      id: "tenkahyakken",                 // 唯一 ID，分享链接为 index.html#artery-gear
      type: "buried",
      name: "天华百剑斩",
      nameLatin: "Tenkahyakken Zan",
      born: "2017.04",                      // 开服时间（示例）
      died: "2021.08",                      // 关服时间（示例）
      epitaph: "闇を切り裂、いざ　咲き誇らん",      // 碑面小字
      version: "v5.9.3",
      platform: "Android",
      description:
        "战乱的刀剑时代已经终结，到来的是新的铭治时代和无数剑士们开创历史、名刀的巫女们「巫剑」也在新时代迈向全新的未来立下了「百华之誓」…",
      stone: { shape: "blade", material: "sakura", emblem: "blades" },
      portrait: "",                      // 可选：碑面瓷像图片，如 "assets/artery-gear.png"
      tags: ["单机", "内置服务端", "安卓"],
      downloads: [
        { label: "v5.9.3", url: "https://pan.quark.cn/s/6dd6d9595805?pwd=NVTC", note: "完整包", icon: "android" },
        { label: "v5.8.5", url: "https://pan.quark.cn/s/b4025c52c788?pwd=ifwS", note: "完整包", icon: "android" }
      ],
      changelog: [
        { version: "v5.7.3", date: "2026-09-16", notes: ["首个可玩版本"] },
        { version: "v5.7.5", date: "2026-09-17", notes: ["添加存档导入导出功能", "添加高难模式", "添加一键开花"] },
        { version: "v5.8.5", date: "2026-09-19", notes: ["无条件显示擦刀按钮", "任意关卡会掉落红水滴和狗粮", "依赖会奖励红水滴", "修复资源下载错误以及部分无限加载的问题"] },
        { version: "v5.8.8", date: "2026-09-20", notes: ["修复后台未结束战斗导致无法更换刀装等问题", "添加仓库上限到10000", "优化高难模式", "助战可以选择自己的巫剑"] },
        { version: "v5.9.3", date: "2026-09-20", notes: ["优化高难模式", "添加几种新的刀装", "优化高难模式", "出售时可以自动选择UR，且一次自动选择数量无上限"] },
      ]
    },
    {
      id: "tagatame",
      type: "buried",
      name: "誰ガ為のアルケミスト",
      nameLatin: "Tagatame",
      born: "2016.01",
      died: "2024.11",
      epitaph: "私は絶対に、負けるわけにはいかないの！",
      version: "v2.0",
      platform: "Windows / Android",
      description: "Server 需要 .Net10\n" + 
      "PC端需要MSVC++2013及DirectX 12（官方原本需求）",
      stone: { shape: "crystal", material: "bronze", emblem: "circle" },
      tags: ["战棋", "剧情", "外置服务器"],
      downloads: [
        { label: "数据包", url: "https://pan.baidu.com/s/1d-2na9C3FeDk-aYlrs00iA?pwd=a5mb", note: "密码：为谁炼金吧", icon: "download" },
        { label: "服务器+PC补丁V2.0", url: "https://pan.quark.cn/s/837516beb804?pwd=gkj3", icon: "windows" },
        { label: "安卓客户端V2.0", url: "https://pan.quark.cn/s/3491a9267d93?pwd=XiVk", icon: "android" },
        { label: ".Net10", url: "https://builds.dotnet.microsoft.com/dotnet/Sdk/10.0.401/dotnet-sdk-10.0.401-win-x64.exe", icon: "cloud" },
        { label: "食用教程", url: "https://araragihoozuki.github.io/2026/09/15/TagatameRevive/", icon: "cloud" }
      ],
      changelog: [
        { version: "v1.4", date: "2026-09-16", notes: ["修复已知bug", "商店出售战斗道具"] },
        { version: "v1.5", date: "2026-09-17", notes: ["提高刻印容量至5000", "武辉石只生成Lv3词条", "修复小蛇关卡结算", "提高角色卡池new概率以及重复角色转换碎片数量"] },
        { version: "v1.51", date: "2026-09-19", notes: ["修复85战技有些时候不显示的问题", "修复念装不能出售问题", "修复换职业等行动后皮肤重置的问题", "修复一键开眼后开眼灵装不会立即刷新的问题"] },
        { version: "v1.6", date: "2026-09-25", notes: ["支持扫荡", "优化服务器后台页面，开启服务器后访问 http://127.0.0.1:5137/admin/ 进入后台"] },
        { version: "v1.7", date: "2026-10-01", notes: ["添加了启动器", "开启代理也能正常连接服务器", "修复进入幻影记忆仓库报错的问题"] },
         { version: "v2.0", date: "2026-10-03", notes: ["支持安卓端", "支持账号引继", "添加授权验证，需要通过QQ群机器人获得授权"] }
      ]
    },
    {
      id: "kingsraid",
      type: "buried",
      name: "King's Raid",
      nameLatin: "KingsRaid",
      born: "2016.09",
      died: "2025.03",
      epitaph: "策划乱改数值的牺牲品",
      version: "v5.12.0",
      platform: "Android",
      description: "embedded版：内置服务器版\nexternal版：外置服务器版\nserver：win端服务器",
      stone: { shape: "obelisk", material: "obsidian", emblem: "star" },
      tags: [],
      downloads: [
        { label: "数据包", url: "https://pan.quark.cn/s/da678a5150c1?pwd=9tZn", note: "标清", icon: "download" },
        { label: "v5.12.0", url: "https://pan.quark.cn/s/4ef3e5b422a3?pwd=1eTk", icon: "android" }
      ],
      changelog: [
        { version: "v5.10.0", date: "2026-09-29", notes: ["游戏关服版本，初步可玩"] },
        { version: "v5.11.0", date: "2026-10-01", notes: ["修复了有时需要下载视频资源的问题", "优化了In App Check 时间（应该）", "支持了更换皮肤API、物品分解API"] },
        { version: "v5.11.1", date: "2026-10-03", notes: ["修复了需要下载视频的问题"] },
        { version: "v5.12.0", date: "2026-10-03", notes: ["添加存档导入导出功能", "添加了锁定装备功能", "修复了部分已知bug"] }
      ]
    },
    {
      id: "sdorica",
      type: "open",
      name: "万象物语",
      nameLatin: "Sdorica",
      status: "停止更新",
      note: "",
      seal: "crystal",
      mods: [
        {
          name: "内置服务器离线客户端",
          version: "v1.0",
          author: "Georges Zebit",
          description: "未实现协会功能，改为协会参谋可以选自己的角色",
          downloads: [{ label: "暂不提供下载", url: "#", icon: "link" }],
          changelog: [{ version: "v1.0", date: "2026-09-29", notes: ["初版开发完成"] }]
        }
      ]
    },
    {
      // 示例条目：请替换为你真正做了 MOD 的单机游戏
      id: "example-single",
      type: "alive",
      name: "占位符",
      nameLatin: "Exemplum",
      status: "单机",
      flame: "violet",                     // 灯火颜色：amber 琥珀 / jade 翠玉 / violet 紫 / azure 蓝
      stone: { material: "granite" },   // 灯身材质，同墓碑材质
      note: "",
      mods: [
        {
          name: "示例 MOD",
          version: "v0.1",
          author: "Georges Zebit",
          description: "在这里写 MOD 的说明",
          downloads: [{ label: "暂不提供下载", url: "#", icon: "link" }],
          changelog: [{ version: "v0.1", date: "2026-09-30", notes: ["占位"] }]
        }
      ]
    },
  ]
};
