# fis多语言处理器

基于fis的多语言处理器，需要依赖语言包（lang.json）及__i18n(xxxx)语法


- 线下语言包

````
lang.json

[
    {
        zh_cn: '中文简体',
        zh_tw: '中文繁體',
        en_us: 'english',
    },
    ...
]


````


- 支持 __i18n 语法处理

````
__i18n(中文)

````


- 处理过程

构建阶段找到所有的`__i18n`获取到其中的内容，从`lang.json`中获取到所有的语言，根据`__i18n`的内容进行遍历，找到对应的所有语言，按照fis-conf.js中的lang配置，将内容替换为对应的语言
