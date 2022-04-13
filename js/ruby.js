
/**@param {HTMLElement} elem */
export function convertRubyToSpan(elem) {
    let rubys = Array.from(elem.getElementsByTagName('ruby'));
    let spanRubyArr = [];
    for (let ruby of rubys) {
        let spanRuby;
        for (let rubyChild of ruby.childNodes) {
            if (rubyChild.nodeType === Node.TEXT_NODE) {
                if (spanRuby) {
                    spanRubyArr.push(spanRuby);
                }
                spanRuby = document.createElement('span');
                spanRuby.classList.add('ruby', ...ruby.classList);
                spanRuby.appendChild(rubyChild.cloneNode());
            }
            else if (rubyChild.tagName === 'RT' || rubyChild.tagName === 'RP') {
                let spanRtRp = document.createElement('span');
                spanRtRp.classList.add(rubyChild.tagName.toLowerCase());
                spanRtRp.textContent = rubyChild.textContent;
                spanRuby.appendChild(spanRtRp);
            }
        }
        if (spanRuby) {
            spanRubyArr.push(spanRuby);
        }

        ruby.replaceWith(...spanRubyArr);
        spanRubyArr.length = 0;
    }
}

/**@param {HTMLElement} elem */
export function setSpanRubyStyle(elem) {
    const minScale = 2/3;
    const overhang = 1 / 3;
    
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

        if (canOverhang(ruby)) {
            let rtWidth = rt.offsetWidth;
            let rubyWidth = ruby.offsetWidth;
            let overhangMax = overhang * parseFloat(getComputedStyle(ruby).fontSize);
            let rubyWidthOverhang = rubyWidth + 2 * overhangMax;
            
            if (rtWidth > rubyWidthOverhang) {
                let scale = rubyWidthOverhang / rtWidth;
                if (scale < minScale) {
                    scale = minScale;
                    stylesToApply.push({
                        target: ruby, name: 'width',
                        value: (rtWidth * minScale - 2 * overhangMax) + 'px'
                    });
                }
                stylesToApply.push({ target: rt, name: 'transform', value: `scale(${scale}, 1)` });
            }
            if (rtWidth > rubyWidth) {
                stylesToApply.push({
                    target: rt, name: 'left',
                    value: -Math.min(0.5 * (rtWidth - rubyWidth), overhangMax) + 'px'
                });
            }
        }
        else {
            let rtWidth = rt.offsetWidth;
            let rubyWidth = ruby.offsetWidth;
            if (rtWidth > rubyWidth) {
                let scale = rubyWidth / rtWidth;

                if (scale < minScale) {
                    scale = minScale;
                    stylesToApply.push({ target: ruby, name: 'width', value: rtWidth * minScale + 'px' });
                }
                stylesToApply.push({ target: rt, name: 'transform', value: `scale(${scale}, 1)` })
            }
        }
    }

    for (let { target, name, value } of stylesToApply) {
        target.style[name] = value;
    }
}

/**@param {HTMLElement} ruby */
function canOverhang(ruby) {
    let left = ruby.previousSibling;
    let leftText = lastTextNodeBeforeInclude(left);
    let leftSafe = leftText == null || leftText.parentElement.closest('span.ruby') == null;

    if (!leftSafe) return false;

    let right = ruby.nextSibling;
    let rightText = firstTextNodeAfterInclude(right);
    let rightSafe = rightText == null || rightText.parentElement.closest('span.ruby') == null;

    return rightSafe;
}

/**@param {Node} node */
function firstTextNode(node) {
    if (node.nodeType === Node.TEXT_NODE)
        return node;
    if (node.nodeType === Node.ELEMENT_NODE) {
        for (let child of node.childNodes) {
            let textNode = firstTextNode(child);
            if (textNode)
                return textNode;
        }
    }
    return null;
}

/**@param {Node} node */
function lastTextNode(node) {
    if (node.nodeType === Node.TEXT_NODE)
        return node;
    if (node.nodeType === Node.ELEMENT_NODE) {
        let childNodeCount = node.childNodes.length;
        for (let i = childNodeCount - 1; i >= 0; --i) {
            let child = node.childNodes[i];
            let textNode = lastTextNode(child);
            if (textNode)
                return textNode;
        }
    }
    return null;
}

/**@param {Node} node 
 * @return {Node}
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