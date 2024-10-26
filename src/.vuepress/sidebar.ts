import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    "",
    // "portfolio",
    // {
    //   text: "案例",
    //   icon: "laptop-code",
    //   prefix: "demo/",
    //   link: "demo/",
    //   children: "structure",
    // },
    
    
    
    // {
    //   text: "幻灯片",
    //   icon: "person-chalkboard",
    //   link: "https://ecosystem.vuejs.press/zh/plugins/markdown/revealjs/demo.html",
    // },
  ],
  "/cpp/":[
    {
      text: "C++之旅",
      icon: "book",
      prefix: "/cpp/",
      children: [
        '/cpp/chapter00/',
        '/cpp/chapter01/',
        '/cpp/chapter02/',
        '/cpp/chapter03/',
        '/cpp/chapter04/',
        '/cpp/chapter05/',
        '/cpp/chapter06/',
        '/cpp/chapter07/',
        '/cpp/chapter08/',
        '/cpp/chapter09/',
        '/cpp/chapter10/',
        '/cpp/chapter11/',
        '/cpp/chapter12/',
        '/cpp/chapter13/',
        '/cpp/chapter14/',
        '/cpp/chapter15/',
        '/cpp/chapter16/',
        '/cpp/chapter17/',
        '/cpp/chapter18/',
        '/cpp/chapter19/',
        '/cpp/chapter20/',
      ]
    },
  ],
  "/cptnet/":[
    {
      text: '计算机网络',
      icon: "book",
      prefix: "/cptnet/",
      children: [
        '/cptnet/chapter01/',
        '/cptnet/chapter02/',
        '/cptnet/chapter03/',
        '/cptnet/chapter04/',
        '/cptnet/chapter05/',
        '/cptnet/chapter06/',
        '/cptnet/chapter07/',
        '/cptnet/chapter08/'
      ]
    },
  ],
"/js/":[{
  text: 'JavaScript',
  icon: "book",
  prefix: "/js/",
  children: [
    '/js/chapter03/',
    '/js/chapter04/',
    '/js/chapter05/',
    '/js/chapter06/',
    '/js/chapter07/',
    '/js/chapter08/',
    '/js/chapter09/',
    '/js/chapter10/',
    '/js/chapter11/',
    '/js/chapter12/',
    '/js/chapter13/',
    '/js/chapter14/',
    '/js/chapter15/',
    '/js/chapter16/',
    '/js/chapter17/',
    '/js/chapter18/',
    '/js/chapter19/',
    '/js/chapter20/',
    '/js/chapter21/',
    '/js/chapter22/',
    '/js/chapter23/',
    '/js/chapter24/',
    '/js/chapter25/',
    '/js/chapter26/',
    '/js/chapter27/']
}]
});
