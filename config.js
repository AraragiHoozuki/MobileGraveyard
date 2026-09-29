/* =====================================================================
 *  墓园配置文件 —— 网站的全部文字与数据都在这里修改
 *  ---------------------------------------------------------------------
 *  · 纯 JS 对象，可写注释；直接用浏览器打开 index.html 也能读取
 *  · 文本字段支持极简标记：**粗体**  *斜体*  [文字](链接)  以及换行
 *  · type: "buried" = 已关服、已立碑的墓（你的单机复活版）
 *    type: "open"   = 挖好未填的墓（尚未关服的游戏，展示它们的 MOD）
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
      { label: "GitHub", url: "https://github.com/" },
      { label: "反馈", url: "https://github.com/" }
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
    // 首屏统计，{buried} {open} 会被替换为数量
    stats: "此处长眠 {buried} 款游戏 ✝ 另有 {open} 座墓穴虚位以待"
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
      epitaph: "DENA, 还我老婆！",      // 碑面小字
      version: "v5.9.3",
      platform: "Android",
      description:
        "战乱的刀剑时代已经终结，到来的是新的铭治时代和无数剑士们开创历史、名刀的巫女们「巫剑」也在新时代迈向全新的未来立下了「百华之誓」…\n",
      stone: { shape: "slab", material: "marble", emblem: "sword" },
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
      id: "pale-corridor",
      type: "buried",
      name: "苍白回廊",
      nameLatin: "The Pale Corridor",
      born: "2017.03",
      died: "2021.11",
      epitaph: "最后一盏灯，留给迟到的旅人",
      version: "v1.2.0",
      platform: "Android / Windows",
      description: "示例条目：一款哥特风卡牌游戏。复活版修复了全部剧情关卡，并开放了原本需要联网的**深渊模式**。",
      stone: { shape: "arch", material: "marble", emblem: "rose" },
      tags: ["卡牌", "剧情完整"],
      downloads: [
        { label: "安卓版", url: "#", note: "820 MB", icon: "android" },
        { label: "网盘备份", url: "#", icon: "cloud" }
      ],
      changelog: [
        { version: "v1.2.0", date: "2026-06-12", notes: ["开放深渊模式", "修复第七章卡死"] },
        { version: "v1.0.0", date: "2025-12-24", notes: ["首个完整版本"] }
      ]
    },
    {
      id: "arc-zero",
      type: "buried",
      name: "零式方舟",
      nameLatin: "Arc Zero",
      born: "2018.07",
      died: "2022.05",
      epitaph: "舰队已归港，星海仍未眠",
      version: "v0.8.5",
      platform: "Android",
      description: "示例条目：太空舰队策略游戏。当前版本可游玩主线前六章。",
      stone: { shape: "cross", material: "slate", emblem: "moon" },
      tags: ["策略", "测试中"],
      downloads: [{ label: "安卓版", url: "#", icon: "android" }],
      changelog: [{ version: "v0.8.5", date: "2026-04-02", notes: ["新增第六章", "舰船数据修正"] }]
    },
    {
      id: "iron-requiem",
      type: "buried",
      name: "铁之安魂曲",
      nameLatin: "Iron Requiem",
      born: "2016.10",
      died: "2020.08",
      epitaph: "剑已入鞘",
      version: "v2.0.1",
      platform: "Android",
      description: "示例条目：横版动作游戏，复活版恢复了全部角色与活动副本。",
      stone: { shape: "shoulder", material: "sandstone", emblem: "sword" },
      tags: ["动作"],
      downloads: [{ label: "安卓版", url: "#", icon: "android" }],
      changelog: []
    },
    {
      id: "eternal-oath",
      type: "open",
      name: "永夜誓约",
      nameLatin: "Oath of Endless Night",
      status: "仍在运营",
      note: "它仍在人间呼吸。在它安息之前，这里先存放为它打造的 MOD。",
      mods: [
        {
          name: "高清立绘补丁",
          version: "v3.1",
          author: "守墓人",
          description: "替换全部角色立绘为 2K 版本。",
          downloads: [{ label: "下载补丁", url: "#", icon: "link" }],
          changelog: [{ version: "v3.1", date: "2026-09-01", notes: ["新增 12 名角色"] }]
        },
        {
          name: "剧情文本修订",
          version: "v1.0",
          author: "守墓人",
          description: "修正机翻与错别字。",
          downloads: [{ label: "下载", url: "#", icon: "github" }]
        }
      ]
    },
    {
      id: "clockwork-sky",
      type: "open",
      name: "齿轮苍穹",
      nameLatin: "Clockwork Sky",
      status: "运营中 · 已公告停更",
      note: "丧钟已经敲响，墓穴也已备好。",
      mods: [
        {
          name: "离线资源备份工具",
          version: "v0.3",
          description: "在关服前把游戏资源完整备份到本地，为日后的复活做准备。",
          downloads: [{ label: "Windows 工具", url: "#", icon: "windows" }]
        }
      ]
    }
  ]
};
