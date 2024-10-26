import { defineUserConfig } from "vuepress";

import theme from "./theme.js";

export default defineUserConfig({
  base: "/",

  lang: "zh-CN",
  title: "南风文档",
  description: "南风的个人文档",

  theme,

  // 和 PWA 一起启用
  // shouldPrefetch: false,
});
