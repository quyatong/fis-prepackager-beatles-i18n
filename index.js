var fs = require('fs');

/**
 * 根据语言获取字体
 *
 * @param  {Array}  langPkg 根据语言获取字体
 * @param  {string} zh_cn   中文内容
 * @param  {string} lang    要转的语言
 * @param  {string} pkgPath 语言包文件的路径
 * @return {string}         查询出来的语言文字
 */
var getTextByLang = function (langPkg, zh_cn, lang, pkgPath) {
    var text;

    langPkg.forEach(function (item) {
        if (zh_cn == item.zh_cn) {
            text = item[lang];
        }
    });

    if (text) {
        return text;
    }
    console.log('can not find "' + zh_cn + '" in ' + pkgPath);

    return '';
};


/**
 * 处理js文件及css文件中的多语言逻辑
 *
 * @param  {string} content 文件内容
 * @param  {string} lang    使用语言
 * @return {string}         处理后的内容
 */
var handleJsAndCss = function (content, lang) {

    return content.replace(
        /\/\*\*\s*start\s*:\s*(\S*?)\s*\*\*\/([\s\S]*?)\/\*\*\s*end\s*:\s*(\1)\s*\*\*\//g,
        function (match, start, section, end) {
            if (start == end && start == lang) {
                return section;
            }
            return '';
        }
    );
};

/**
 * 处理html文件中的多语言逻辑
 *
 * @param  {string} content 文件内容
 * @param  {string} lang    使用语言
 * @return {string}         处理后的内容
 */
var handleHtml = function (content, lang) {
    return content.replace(
        /<!--\s*(\S*?)\s*-->([\s\S]*?)<!--\s*\/\s*(\1)\s*-->/g,
        function (match, start, section, end) {
            if (start == end && start == lang) {
                return section;
            }
            return '';
        }
    );
};

/**
 * 处理deploy
 *
 * @param  {Object} obj    值
 * @param  {Object} parent 原始对象
 * @param  {string} key    key
 * @param  {Object} opt    配置
 */
var handleVariable = function (obj, parent, key, opt) {

    if (Object.prototype.toString.call(obj) == '[object Object]') {
        for (var key in obj) {
            handleVariable(obj[key], obj, key, opt);
        }
    }
    else if (Object.prototype.toString.call(obj) == '[object Array]') {
        obj.forEach(function (item, index) {
            handleVariable(obj[index], obj, index, opt);
        });
    }
    else {
        parent[key] = (parent[key] + '').replace(/\$\{\s*(.*?)\s*\}/g, function (match, variable) {
            return opt[variable] || '';
        });
    }
};


module.exports = function (ret, conf, settings, opt) {
    handleVariable(fis.config.get('deploy'), null, null, opt);
    var lang =  opt.lang;

    fis.util.map(ret.src, function(subpath, file) {

        if (!file.isHtmlLike && !file.isJsLike && !file.isCssLike) {
            return;
        }

        var filePath = file.origin.replace(
            /(.*)(template|page|component_modules|components)(\/[^/]*\/)(.*)/g,
            function (match, project, dir, feature) {
                return project + dir + feature;
            }
        ) + 'lang.json';

        var content = file.getContent();

        var langPkg = [];
        if (fs.existsSync(filePath)) {
            langPkg = require(filePath);
        }

        // 类html
        if (/\.(html|tpl|tmpl)$/g.test(file.origin)) {
            content = handleHtml(content, lang)
        }
        // js和css
        else if (/\.(js|css|less|sass|styl)$/g.test(file.origin)) {
            content = handleJsAndCss(content, lang);
        }

        langPkg
        .sort(function (a, b) {
            return a.zh_cn.length - b.zh_cn.length;
        })
        .forEach(function (item) {
            content = content.replace(
                new RegExp(''
                    + '__i18n\\\('
                    + item.zh_cn
                        .replace(/\+/g, '\\\+')
                        .replace(/\+/g, '\\\+')
                        .replace(/\?/g, '\\\?')
                        .replace(/\./g, '\\\.')
                        .replace(/\*/g, '\\\*')
                        .replace(/\{/g, '\\\{')
                        .replace(/\}/g, '\\\}')
                        .replace(/\)/g, '\\\)')
                        .replace(/\(/g, '\\\(')
                    + '\\\)', 'ig'),
                function (macth) {
                    return item[lang];
                }
            );
        });

        file.setContent(content);
    });
};
