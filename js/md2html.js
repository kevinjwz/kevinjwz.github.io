import furigana from "./markdownitFurigana.js";
let mdit = markdownit({ html: true }).use(furigana);

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
mdxhr.send();

function onMdLoaded() {
    let mdcontent = document.getElementById("mdcontent");

    let md = this.responseText;
    mdcontent.innerHTML = mdit.render(convertSpan(md));
    convertHref(mdcontent);

    let h1 = mdcontent.getElementsByTagName("H1");
    if (h1.length > 0) {
        document.title = h1[0].innerText;
    }

    if (location.hash !== "") {
        location.replace(location.href);
    }
}

function convertSpan(md) {
    let pattern = /`(.+)'/g;
    let span = '<span lang="ja">$1</span>';
    return md.replace(pattern, span);
}


let current_md_dir = mdpath.match(/(.*\/)[^\/]*/)[1];
let http_pattern = /^https?:\/\//;

/** @param {HTMLElement} elem  */
function convertHref(elem) {
    if (elem.tagName === "A") {
        /** @type {HTMLAnchorElement}  */
        let a = elem;
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
    else {
        for (let child of elem.children) {
            convertHref(child);
        }
    }
}
