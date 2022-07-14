/*

[買い物]{かいもの} => 
<ruby>
買 <rp>{</rp> <rt>か</rt> <rp>}</rp>
い <rt></rt>
物 <rp>{</rp> <rt>もの</rt> <rp>}</rp>
</ruby>

*/


/**@param {HTMLElement} elem */
export function convertRubyToSpan(elem) {
    let rubys = Array.from(elem.getElementsByTagName('ruby'));
    let spanRubyArr = [];
    for (let ruby of rubys) {
        let sections = extractRuby(ruby);
        for (let sect of sections) {
            let rb = document.createTextNode(sect.rb);
            if (!sect.rt) {
                spanRubyArr.push(rb);
                continue;
            }
            let spanRuby = document.createElement('span');
            spanRuby.classList.add('ruby', ...ruby.classList);
            spanRuby.appendChild(rb);
            if (sect.rp1)
                addSpan(spanRuby, 'rp', sect.rp1);
            if (sect.rt)
                addSpan(spanRuby, 'rt', sect.rt);
            if (sect.rp2)
                addSpan(spanRuby, 'rp', sect.rp2);
            spanRubyArr.push(spanRuby);
        }

        ruby.replaceWith(...spanRubyArr);
        spanRubyArr.length = 0;
    }

    function addSpan(parent, cls, text) {
        let span = document.createElement('span');
        span.classList.add(cls);
        span.textContent = text;
        parent.appendChild(span);
    }
}

/**@param {HTMLElement} ruby */
function extractRuby(ruby) {
    let result = [];
    let index = 0;

    /**@type {{rb:string, rt:string, rp1:string, rp2:string}} */
    let sect = null;

    for (let rubyChild of ruby.childNodes) {
        if (rubyChild.nodeType === Node.TEXT_NODE) {
            if (sect)
                result.push(sect);
            sect = { rb: rubyChild.textContent };           
        }
        else if (rubyChild.tagName === 'RT') {
            sect.rt = rubyChild.textContent;
        }
        else if (rubyChild.tagName === 'RP') {
            if (sect.rp1 === undefined)
                sect.rp1 = rubyChild.textContent;
            else
                sect.rp2 = rubyChild.textContent;
        }
    }
    if (sect)
        result.push(sect);

    return result;
}


/**@param {HTMLElement} elem */
export function setSpanRubyStyle(elem) {
    const minScale = 2/3;
    const overhang = 1 / 4;
    
    /**@type {NodeListOf<HTMLElement>} */
    let spanRubys = elem.querySelectorAll('span.ruby');

    /**@typedef {object} InlineStyle 
     * @prop {HTMLElement} target
     * @prop {string} name
     * @prop {string} value
    */
    
    /**@type {InlineStyle[]} */
    let stylesToApply = [];

    for (let ruby of spanRubys) {
        /**@type {HTMLElement}*/
        let rt = ruby.getElementsByClassName('rt')[0];

        let rtWidth = rt.offsetWidth;
        let rubyWidth = ruby.offsetWidth;
        let overhangMax = overhang * parseFloat(getComputedStyle(ruby).fontSize);
        let overhangLeftMax = canOverhangLeft(ruby) ? overhangMax : 0;
        let overhangRightMax = canOverhangRight(ruby) ? overhangMax : 0;

        if (rtWidth <= rubyWidth) {
            // using CSS, do nothing
        }
        else if (rtWidth <= rubyWidth + overhangLeftMax + overhangRightMax) {
            // no scale
            let extraWidth = rtWidth - rubyWidth;
            let extraHalf = extraWidth * 0.5;
            let left = extraHalf;
            if (extraHalf > overhangLeftMax) {
                left = overhangLeftMax;
            }
            else if (extraHalf > overhangRightMax) {
                left = extraWidth - overhangRightMax;
            }
            stylesToApply.push({ target: rt, name: 'left', value: -left + 'px' });
        }
        else {
            let scale = (rubyWidth + overhangLeftMax + overhangRightMax) / rtWidth;
            let left = overhangLeftMax;
            if (scale < minScale) {
                scale = minScale;
                let rubyWidthExtended = rtWidth * scale - (overhangLeftMax + overhangRightMax);
                stylesToApply.push({ target: ruby, name: 'width', value: rubyWidthExtended + 'px' });        
            }
            stylesToApply.push({ target: rt, name: 'transform', value: `scale(${scale}, 1)` });
            stylesToApply.push({ target: rt, name: 'left', value: -left + 'px' });
        }
    }

    for (let { target, name, value } of stylesToApply) {
        target.style[name] = value;
    }
}

/**@param {HTMLElement} ruby */
function canOverhangLeft(ruby) {
    let leftText = lastTextNodeBefore(ruby);
    return leftText == null || leftText.parentElement.closest('span.ruby') == null;
}

/**@param {HTMLElement} ruby */
function canOverhangRight(ruby) {
    let rightText = firstTextNodeAfter(ruby);
    return rightText == null || rightText.parentElement.closest('span.ruby') == null;
}

/**@param {Node} node */
function firstTextNodeAfter(node) {
    let text = firstTextNodeAfterInclude(node.nextSibling);
    if (text)
        return text;
    if (isInline(node.parentElement))
        return firstTextNodeAfter(node.parentElement);
    return null;
}

/**@param {Node} node */
function lastTextNodeBefore(node) {
    let text = lastTextNodeBeforeInclude(node.previousSibling);
    if (text)
        return text;
    if (isInline(node.parentElement))
        return lastTextNodeBefore(node.parentElement);
    return null;
}

/**@param {Node} node 
 * @return {Node}
 * @description Find the first text node belongs to `node` and siblings of `node` that come after
*/
function firstTextNodeAfterInclude(node) {
    for (; node; node = node.nextSibling) {
        if (node.nodeType === Node.TEXT_NODE)
            return node;
        if (node.nodeType === Node.ELEMENT_NODE) {
            let firstTextDescendant = firstTextNodeAfterInclude(node.firstChild);
            if (firstTextDescendant)
                return firstTextDescendant;
        }
    }
    return null;
}

/**@param {Node} node
 * @return {Node}
 */
function lastTextNodeBeforeInclude(node) {
    for (; node; node = node.previousSibling) {
        if (node.nodeType === Node.TEXT_NODE)
            return node;
        if (node.nodeType === Node.ELEMENT_NODE) {
            let lastTextDescendant = lastTextNodeBeforeInclude(node.firstChild);
            if (lastTextDescendant)
                return lastTextDescendant;
        }
    }
    return null;
}

let inlineElems = new Set([
    'SPAN', 'A', 'B', 'DEL', 'EM', 'I', 'MARK', 'S', 'STRONG', 'U'
]);

/**@param {HTMLElement} elem */
function isInline(elem) {
    return elem != null && inlineElems.has(elem.tagName);
}