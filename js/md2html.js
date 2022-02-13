import furigana from "./markdownitFurigana.js";
window.mdit = markdownit({ html: true, breaks: true })
    .use(furigana)
    .use(window.markdownitMultimdTable, { rowspan: true, headerless: true })
    .use(window.markdownitMark)
    .use(window.markdownItAttrs);



import normalize from "./path-normalize.js";

/*
url format: /1.html?/absolute/path/of/mdfile
*/
let htmlpath = location.pathname;
let mdpath = location.search.substring(1);
mdpath = mdpath === "" ? "/index" : mdpath;

let mdxhr = new XMLHttpRequest();
mdxhr.addEventListener("load", onMdLoaded);
mdxhr.open("GET", mdpath + ".md");
if (pageAccessedByReload()) {
    mdxhr.setRequestHeader("Cache-Control", "no-cache, no-store, max-age=0");
}
mdxhr.send();

/** @this {XMLHttpRequest} */
function onMdLoaded() {

    let mdcontent = document.getElementById("mdcontent");

    let md = this.responseText;
    mdcontent.innerHTML = mdit.render(convertLangBlock(md));
    let h1 = mdcontent.getElementsByTagName("H1");
    if (h1.length > 0) {
        document.title = h1[0].innerText;
    }
    
    convertHref(mdcontent);
    convertTableMarkers(mdcontent);


    if (location.hash !== "") {
        location.replace(location.href);
    }
}

// function convertSpan(md) {
//     let pattern = /(?<!\\)'([^']+)(?<!\\)'/g;
//     let span = '<span lang="ja">$1</span>';
//     return md.replace(pattern, span);
// }

/**@param {String} md*/
function convertLangBlock(md) {
    // remove \ + \n
    md = md.replaceAll(/(?<!\\)\\\r?\n/g, "");

    let delim = /(^'''$|^\[\[\[$|^\]\]\]$|^\.$)/m;
    let single_quoted_pattern = /(?<!\\)'([^']+)(?<!\\)'/g;
    let segments = md.split(delim);
    let outputs = [];
    let inside_triple_quote = false;
    for (let seg of segments) {
        if (seg === "'''") {
            if (!inside_triple_quote) {
                outputs.push('<div lang="ja">\n');
            }
            else {
                outputs.push('</div>\n');
            }
            inside_triple_quote = !inside_triple_quote;
        }
        else if (seg === "[[[") {
            outputs.push('<div class="boxed">\n')
        }
        else if (seg === "]]]") {
            outputs.push('</div>\n')
        }
        else if (seg === ".") {
            outputs.push('<p></p>\n')
        }
        else {
            if (inside_triple_quote) {              
                outputs.push(seg.replaceAll(single_quoted_pattern, '<span lang>$1</span>'));               
            }
            else {
                outputs.push(seg.replaceAll(single_quoted_pattern, '<span lang="ja">$1</span>'));
            }
        }
        
    }
    return outputs.join("");
}


let current_md_dir = mdpath.match(/(.*\/)[^\/]*/)[1];
let http_pattern = /^https?:\/\//;

/** @param {HTMLElement} elem  */
function convertHref(elem) {
    let links = elem.getElementsByTagName("a");
    for (let a of links) {
        let href = a.getAttribute("href");
        if (href.startsWith("#") || http_pattern.test(href)) {
            return;
        }

        let mdpath = a.pathname;
        // ./chapter2
        // chapter2.md
        // relative/path/of/mdfile.md
        // /absolute/path/of/mdfile.md
        if (mdpath.endsWith(".md")) {
            mdpath = mdpath.substring(0, mdpath.length - 3);
        }
        if (!mdpath.startsWith("/")) {
            mdpath = normalize(current_md_dir + mdpath);
        }

        a.pathname = htmlpath;
        a.search = "?" + mdpath;
    }
}

/** @param {HTMLElement} elem  */
function convertTableMarkers(elem) {
    let tables = elem.getElementsByTagName("table");
    for (let table of tables) {
        let markersStr = table.getAttribute("markers");
        if (markersStr === null)
            continue;

        let markers = new Map();
        for (let kvStr of markersStr.split(/;\s?|,\s?|\s+/)) {
            let kv = kvStr.match(/(?<key>[^\s])=(?<value>[^\s]+)/);
            markers.set(kv.groups.key, kv.groups.value);
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

function pageAccessedByReload() {
    return (window.performance.navigation && window.performance.navigation.type === 1)
        || window.performance
            .getEntriesByType('navigation')
            .map((nav) => nav.type)
            .includes('reload');
}