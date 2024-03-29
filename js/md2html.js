import furigana from "./markdownitFurigana.js";
window.mdit = markdownit({ html: true, breaks: true })
    .use(furigana, {fallbackParens: '{}'})
    .use(window.markdownitMultimdTable, { rowspan: true, headerless: true })
    .use(window.markdownitMark)
    .use(window.markdownItAttrs)
    .use(window.markdownitEmoji, { defs: { v: '✔️', x: '❌' } });


import normalize from "./path-normalize.js";
import * as helpers from "./helpers.js";
import * as toc from "./toc.js";
import * as ruby from "./ruby.js"
import * as annotation from "./annotation.js"

/*
url format: /1.html?/absolute/path/of/mdfile
*/
let htmlpath = location.pathname;
let mdpath = location.search.substring(1);
mdpath = mdpath === "" ? "/index" : mdpath;

// let mdxhr = new XMLHttpRequest();
// mdxhr.addEventListener("load", onMdLoaded);
// mdxhr.open("GET", mdpath + ".md");
// if (helpers.pageAccessedByReload()) {
//     mdxhr.setRequestHeader("Cache-Control", "no-cache, no-store, max-age=0");
// }
// mdxhr.send();

let reload = helpers.pageAccessedByReload();
let mdLoaded = fetch(mdpath + ".md", { cache: reload ? 'no-cache' : 'default' })
    .then(response => response.text()).then(onMdLoaded);

if (mdpath.endsWith('/index')) {
    let utaLoaded = fetch('/ohmy/uta.md', { cache: reload ? 'no-cache' : 'default' })
        .then(response => response.text()).then(onUtaLoaded);
    Promise.all([mdLoaded, utaLoaded]).then(([_, uta]) => addUta(uta));
}
convertHref(document.getElementById('header'));
toc.setTocButtonsEvent();

let preprocessMd = mdPreprocessor();

/** @param {string} md */
function onMdLoaded(md) {
    let mdcontent = document.getElementById("mdcontent");

    console.time('preprocess');
    let { md: md2, styles, scripts } = preprocessMd(md);
    console.timeEnd('preprocess');

    addStyles(styles);

    mdcontent.innerHTML = mdit.render(md2);
    let headings = Array.from(mdcontent.children).filter(elem => elem instanceof HTMLHeadingElement);

    let h1 = headings.find(h => h.tagName === 'H1');
    if (h1) {
        document.title = h1.textContent.replace(/\{.*?\}/g, '');
    }
    
    let mdtoc = document.getElementById('mdtoc');

    toc.generateToc(mdtoc, headings);
    convertHref(mdcontent);
    convertImgSrc(mdcontent);
    convertTableColWidth(mdcontent);
    convertTableMarkers(mdcontent);
    setSvgViewBox(mdcontent);
    ruby.convertRubyToSpan(mdcontent);
    ruby.setSpanRubyStyle(mdcontent);
    annotation.initAnnotations(mdcontent);

    executeScripts(scripts);
    setButtonEvent(mdcontent);

    toc.addListenersForToc(mdtoc, mdcontent, headings);

    if (location.hash !== "") {
        location.replace(location.href);
    }
}

function onUtaLoaded(utaMd) {
    let { md: utaMd2 } = preprocessMd(utaMd);
    let all = document.createElement('div');
    all.innerHTML = mdit.render(utaMd2);
    let uta = all.children[Math.floor(all.childElementCount * Math.random())];
    uta.remove();
    convertHref(uta);
    convertImgSrc(uta);
    return uta;
}

/** @param {HTMLElement} uta */
function addUta(uta) {
    uta.classList.add('uta');
    let mdcontent = document.getElementById("mdcontent");
    mdcontent.append(uta);
}


function mdPreprocessor() {
    let inside_triple_quote;
    let inside_single_quote;
    let inside_underline;

    let styles, scripts;
    function init() {
        inside_triple_quote = false;
        inside_single_quote = false;
        inside_underline = false;
        styles = [];
        scripts = [];
    }
    function clear() {
        styles = null; scripts = null;
    }

    const circledNumbers = '⓪①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳';

    let rules = [
        /^\[\[\[$/,         () => '<div class="boxed">\n',
        /^\]\]\]$/,         () => '</div>\n',
        /^\.$/,             () => '<p></p>\n',
        /\\\r?\n/,          () => '',
        /^>>>$/,            () => '<blockquote>\n',
        /^<<<$/,            () => '</blockquote>\n',
        /<>/,               () => '<span></span>',
        /[「【]/,           (_, m) => '<span lang="ja">' + m,
        /[」】]/,           (_, m) => m + '</span>',
        
        /\[\[/,             () => '<span class="term">',
        /\]\]/,             () => '</span>',    
        /^\{\{(?<anno_term>.+?)(?::|：)\s*/,
                            g => `<div class="annotation" data-term="${g.anno_term}">\n\n`,
        /\}\}$/,            () => '\n</div>\n',
            
        /\\u\{(?<unicode_hex>[\da-fA-F,\s]+)\}/,
                            g => String.fromCodePoint(...g.unicode_hex.split(/,\s*|\s+/).map(x=>parseInt(x,16))),
        /\\r\{(?<raw_text>[^]+?)\}/,
                            g => g.raw_text,
                            
        /(?<triple_quote_prefix>[> ]*)'''$/,
                            g => { 
                                let tag = inside_triple_quote ? '</div>\n' : '<div lang="ja">\n';
                                inside_triple_quote = !inside_triple_quote;
                                inside_single_quote = false;
                                return g.triple_quote_prefix + tag + g.triple_quote_prefix;
                            },
                            
        /\\'/,              () => `\\'`,
        /'/,                g => {
                                let tag = inside_single_quote ? '</span>' :
                                    inside_triple_quote ? '<span lang="zh-CN">' : '<span lang="ja">';
                                inside_single_quote = !inside_single_quote;
                                return tag;      
                            },

        /_/,       () => {
                                let tag = inside_underline ? '</u>' : '<u>';
                                inside_underline = !inside_underline;
                                return tag;
                            },
        
        /(?<attr>\{\s*(?:[.#][-_\w\d]+\s*|[-_\w\d]+(?:\s*=\s*(?:".*?"|'.*?'))?\s*)+\})/,
                            g => g.attr,
        
        /(?<link>\]\(.+?\))/, g => g.link,
        /(?<reflink_label>\]\[.+?\])/, g => g.reflink_label,
        /(?<reflink_label_def>\[.+?\]:.*$)/, g => g.reflink_label_def,
        
        /(?<furigana>\{=?[\u3040-\u30ff・/\s]+\})/,
                            g => g.furigana,
        /(?<easyfuri_kanji>\p{sc=Han}+)\{(?<easyfuri_kana>[\u3040-\u30ff・/\s]+)\}/u,
                            g => `[${g.easyfuri_kanji}]{${g.easyfuri_kana}}`,
        /(?<numfuri_number>[0-9０-９.]+)\{(?<numfuri_kana>[\u3040-\u30ff・/\s]+)\}/,
                            g => `[${g.numfuri_number}]{${g.numfuri_kana}}`,
        
        /(?<easytone_kana>[ぁ-ゖァ-ヺー]+)\{\s*(?:(?<easytone_num>\d+)|(?<easytone_hl>[hHlL]+))\s*\}/,
                            g => processTone({
                                tone_text: g.easytone_kana,
                                tone_num: g.easytone_num,
                                tone_hl: g.easytone_hl
                            }),
        /(?<kana>[ぁ-ゖァ-ヺー]+)/,
                            g => inside_triple_quote!=inside_single_quote ? g.kana : `<span lang="ja">${g.kana}</span>`,
                            
        /\[(?<tone_text>[^\]]+?)\]\{\s*(?:(?<tone_num>\d+)|(?<tone_hl>[hHlL]+))\s*\}/, processTone,

        /(?<kana_romaji>\[[\u3040-\u30ff]+\]\{\s*[a-zA-Z][a-zA-Z\s]*\})/,
                            g => inside_triple_quote!=inside_single_quote ? g.kana_romaji : `<span lang="ja">${g.kana_romaji}</span>`,

        /<style\W[^]*?<\/style>/,
                            (_, m) => {
                                styles.push(m);
                                return '';
                            },
        
        /<script\W[^]*?<\/script>/,
                            (_, m) => {
                                scripts.push(m);
                                return '';
                            },

        /\(\(\s*(?<circled_num>\d+)\s*\)\)/,
                            g => {
                                let num = Number(g.circled_num);
                                return num < circledNumbers.length ? circledNumbers[num] : circled_num;
                            }
    ];
    
    /**@param {{tone_text:string, tone_num:string|undefined, tone_hl:string|undefined}} groups */
    function processTone(groups) {
        let delim = /(?![ぁぃぅぇぉゃゅょゎァィゥェォャュョヮ])/;
        let moras = groups.tone_text.split(delim);

        let hl;
        if (groups.tone_num !== undefined) {
            let num = Number(groups.tone_num);
            hl = moras.map((_, i) => i + 1 == num ? 'h v'
                                    : i == 0 ? 'l v'
                                    : i + 1 < num || num == 0 ? 'h' : 'l');             
        }
        else {
            hl = groups.tone_hl.toLowerCase().split('');
            for (let i = 0; i < hl.length-1; ++i) {
                if (hl[i] !== hl[i + 1]) {
                    hl[i] = hl[i] === 'h' ? 'h v' : 'l v';
                }
            }
        }

        let spans = ['<span lang="ja">'];
        moras.forEach((mora, i) =>
            spans.push(i < hl.length ? `<span class="tone ${hl[i]}">${mora}</span>` : mora)
        );
        spans.push('</span>');  
        return spans.join('');
    }

    let ruleKeys = [];

    function buildMultiRegex() {
        let regexSrcList = [];
        for (let i = 0; i < rules.length; i += 2){
            let ruleKey = 'rule_' + (i / 2).toString();
            ruleKeys.push(ruleKey);
            regexSrcList.push(`(?:(?<${ruleKey}>)${rules[i].source})`);
        }
        return new RegExp(regexSrcList.join('|'), 'mgu');
    }

    let multiRegex = buildMultiRegex();

    function multiReplacer() {
        let match = arguments[0];
        let groups = arguments[arguments.length - 1];
        let ruleIndex = ruleKeys.findIndex((key) => groups[key] !== undefined);
        let replacer = rules[ruleIndex * 2 + 1];
        return replacer(groups, match);
    }

    return function preprocess(md) {
        init();
        md = md.replace(multiRegex, multiReplacer);
        let result = { md, styles, scripts };
        clear();
        return result;
    }
}

/** @param {HTMLElement} elem  */
function convertHref(elem) {
    let current_md_dir = mdpath.match(/^(.*\/)[^\/]*$/)[1];
    let http_pattern = /^https?:\/\//;

    let links = elem.getElementsByTagName("a");
    for (let a of links) {
        let href = a.getAttribute('href');
        let otherSite = http_pattern.test(href);
        if (otherSite) {
            a.target = '_blank';
        }
        if (href.startsWith("#") || otherSite || a.hasAttribute("onclick")) {
            continue;
        }

        let mdpath = a.pathname;
        // ./chapter2
        // chapter2.md
        // relative/path/of/mdfile.md
        // /absolute/path/of/mdfile.md
        if (mdpath.endsWith(".md")) {
            mdpath = mdpath.substring(0, mdpath.length - 3);
        }
        if (!href.startsWith("/")) {
            mdpath = normalize(current_md_dir + mdpath.substring(1));
        }

        a.pathname = htmlpath;
        a.search = "?" + mdpath;
    }
}

/** @param {HTMLElement} elem  */
function convertImgSrc(elem) {
    let current_md_dir = mdpath.match(/(.*\/)[^\/]*/)[1];
    let http_pattern = /^https?:\/\//;
    
    let imgs = elem.getElementsByTagName("img");
    for (let img of imgs) {
        let src = img.getAttribute('src');
        if (http_pattern.test(src) || src.startsWith('/')) {
            continue;
        }
        img.src = normalize(current_md_dir + src);
    }
}

/** @param {HTMLElement} elem  */
function convertTableMarkers(elem) {
    let tables = elem.getElementsByTagName("table");
    for (let table of tables) {
        let markersStr = table.getAttribute("markers");
        let markers = new Map();
        if (markersStr) {
            for (let kvStr of markersStr.split(/;\s?|,\s?|\s+/)) {
                let kv = kvStr.match(/(?<key>[^\s])[=:](?<value>[^\s]+)/);
                markers.set(kv.groups.key, kv.groups.value);
            }
        }

        if (!markers.has('!')) {
            markers.set('!', 'split');
        }

        for (let cell of table.querySelectorAll("th, td")) {
            let last = cell.lastChild;
            if (last === null || last.nodeType !== Node.TEXT_NODE)
                continue;
            let str = last.textContent.trimEnd();
            let i = str.length - 1;
            for (; i >= 0; --i){
                let cls = markers.get(str[i]);
                if (cls === undefined)
                    break;
                cell.classList.add(cls);
            }
            last.textContent = str.substring(0, i + 1).trimEnd();
        }
    }
}

/** @param {HTMLElement} elem  */
function convertTableColWidth(elem) {
    /** @type {NodeListOf<HTMLTableElement>}  */
    let tables = elem.querySelectorAll("table.col-width");  
    for (let table of tables) {
        let lastTr = table.rows[table.rows.length - 1];
        lastTr.remove();

        let colgroup = document.createElement('colgroup');
        
        /** @type {HTMLCollectionOf<HTMLTableCellElement>} */
        let lastTrCells = lastTr.children;
        for (let cell of lastTrCells) {
            let col = document.createElement('col');
            col.span = cell.colSpan;
            let width = cell.textContent.trim();
            if (width !== '') {
                col.style.width = width;
                col.style.minWidth = width;
            }
            colgroup.append(col);
        }

        if (table.caption) {
            table.caption.insertAdjacentElement('afterend', colgroup);
        }
        else {
            table.insertAdjacentElement('afterbegin', colgroup);
        }
    }
}

/** @param {HTMLElement} elem  */
function setSvgViewBox(elem) {
    let svgs = elem.getElementsByTagName('svg');
    for (let svg of svgs) {
        if (!svg.hasAttribute('viewBox')) {
            let width = svg.width.baseVal.value;
            let height = svg.height.baseVal.value;
            svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        }
    }
}

/**@param {string[]} styles */
function addStyles(styles) {
    let div = document.createElement('div');
    for (let style of styles) {
        div.innerHTML = style;
        let styleElem = div.children[0];
        document.head.append(styleElem);

        for (let rule of styleElem.sheet.cssRules) {
            rule.selectorText = rule.selectorText.split(',')
                .map(sel => '#mdcontent ' + sel.trim())
                .join(',');
        }
    }  
}

/**@param {string[]} scripts */
function executeScripts(scripts) {
    for (let script of scripts) {
        let parsed = helpers.parseElement(script);
        let elem = document.createElement('script');
        for (let attr of parsed.attrs) {
            elem.setAttribute(attr.name, attr.value);
        }
        elem.textContent = parsed.text;
        document.body.append(elem);
    }
}

/** @param {HTMLElement} elem  */
function setButtonEvent(elem) {
    for (let button of elem.getElementsByTagName('button')) {
        if (!button.hasAttributes())
            continue;
        let attrToRemove = [];
        for (let i = 0; i < button.attributes.length; ++i) {
            let attr = button.attributes[i];
            if (attr.name.startsWith('on')) {
                let eventName = attr.name.substring(2);
                button.addEventListener(eventName, window[attr.value]);
                attrToRemove.push(attr.name);
            }
        }
        for (let attrName of attrToRemove) {
            button.removeAttribute(attrName);
        }
    }
}

