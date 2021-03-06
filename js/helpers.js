/**
 * Find the smallest integer `i`, in `[begin, end)`, that makes `pred(i) == true`.
 * The values of `pred(i)` for `[begin, end)` must be monotonically increasing.
 * @param {number} begin Integer
 * @param {number} end Integer
 * @param {(index:number)=>boolean} pred 
 * @returns {?number} The result `i`, or `null` when there is no such `i`.
 */
export function binarySearch(begin, end, pred) {
    end -= 1;
    // find in [begin, end]
    let trueAfterEnd = false;
    while (begin < end) {
        let middle = Math.floor((begin + end) / 2);
        if (pred(middle)) {
            end = middle - 1;
            trueAfterEnd = true;
        }
        else {
            begin = middle + 1;
        }
    }

    if (begin == end && pred(begin))
        return begin;
    
    return trueAfterEnd ? end + 1 : null;
}

export function search(begin, end, pred) {
    while (begin < end) {
        if (pred(begin))
            return begin;
        begin += 1;
    }
    return null;
}

export function throttle(func, waitMs) {
    let waiting = false;
    let lastRun = Number.NEGATIVE_INFINITY;

    return function () {
        if (waiting) {
            return;
        }

        let time = performance.now();
        if (time - lastRun >= waitMs) {
            lastRun = time;
            func.apply(this, arguments);
        }
        else {
            waiting = true;
        
            setTimeout(() => {
                lastRun = performance.now();
                func.apply(this, arguments);
                waiting = false;
            }, waitMs);
        }
    };
}

let elemRegex = /<(?<tag>\w+)(?<attr>([^'"]|'.*?'|".*?")*?)>(?<text>[^]*?)<\/\w+>/;
let attrRegex = /(?<name>[\w-]+)(\s*=\s*('(?<value1>.*?)'|"(?<value2>.*?)"))?/g;

export function parseElement(elem) {
    let g = elem.match(elemRegex).groups;
    let attrs = [];
    while (g.attr !== undefined) {
        let matchAttr = attrRegex.exec(g.attr);
        if (!matchAttr) break;
        let name = matchAttr.groups.name;
        let value = matchAttr.groups.value1;
        if (value === undefined)
            value = matchAttr.groups.value2;
        attrs.push({ name, value });
    }
    return { tag: g.tag, attrs, text: g.text };
}


export function pageAccessedByReload() {
    return (window.performance.navigation && window.performance.navigation.type === 1)
        || window.performance
            .getEntriesByType('navigation')
            .map((nav) => nav.type)
            .includes('reload');
}