import * as helpers from "./helpers.js";

/** 
 * @param {HTMLElement} toc
 * @param {HTMLHeadingElement[]} headings 
 */
export function generateToc(toc, headings) {
    let i = 0;
    while (i < headings.length) {
        let ret = buildUList(headings, i);
        toc.append(ret.ul);
        i = ret.endIndex;
    }

    /** 
     * @param {HTMLHeadingElement[]} headings 
     * @param {number} i 
     * @returns {{ul:HTMLUListElement, endIndex:number}}
     * */
    function buildUList(headings, i) {
        let ul = document.createElement('ul');
        if (!headings[i])
            return { ul: ul, endIndex: i };
    
        let hLevelOfLi = headingLevel(headings[i]);
        while (i < headings.length) {
            let hLevel = headingLevel(headings[i]);
        
            if (hLevel == hLevelOfLi) {
                let li = createUListItem(headings[i]);
                ul.append(li);
                i += 1;
            }
            else if (hLevel > hLevelOfLi) {
                let li = ul.lastElementChild;
                let ret = buildUList(headings, i);
                li.append(ret.ul);
                i = ret.endIndex;
            }
            else {
                break;
            }
        }

        return { ul: ul, endIndex: i };
    }

    function headingLevel(h) {
        return parseInt(h.tagName.substring(1));
    }

    /** @param {HTMLHeadingElement} heading */
    function createUListItem(heading) {
        let li = document.createElement('li');
        let a = document.createElement('a');
        let text = getTextWithoutFurigana(heading);
        let id = heading.id;
        
        if (id === '') {
            id = convertTextToId(text);
            let rawId = id;
            let num = 1;
            while (document.getElementById(id) !== null) {
                id = rawId + '_' + num.toString();
                num += 1;
            }
            heading.id = id;
        }

        a.textContent = text;
        a.href = '#' + id;
        li.append(a);    

        return li;
    }

    function getTextWithoutFurigana(heading) {
        return heading.textContent.replace(/\{.*?\}/g, '');
    }

    /** @param {string} text */
    function convertTextToId(text) {
        return text.replace(/\s+|[%#]/g, match => /\s+/.test(match) ? '-' : '');
    }
}

/** 
 * @param {HTMLElement} toc
 * @param {HTMLElement} content 
 * @param {HTMLHeadingElement[]} headings
 */
export function addListenersForToc(toc, content, headings) {
    window.addEventListener('scroll', helpers.throttle(_onScroll, 200));
    window.addEventListener('load', _onScroll);
    content.addEventListener('resize', helpers.throttle(_onResize, 500));

    /** @type {[number,number][]} */
    let sections = [];
    rebuildSections();

    let lis = Array.from(toc.getElementsByTagName('li'));

    /** @type {?number} */
    let prevIndex = null;

    function _onScroll() {
        let vpTop = window.pageYOffset;
        let vpHeight = document.documentElement.clientHeight;
        let vpBottom = vpTop + vpHeight;

        let displayedBegin = helpers.binarySearch(0, sections.length, i => sections[i][1] > vpTop);
        if (displayedBegin === null) {
            updateActiveLi(null);
            return;
        }

        let displayedEnd = helpers.binarySearch(displayedBegin + 1, sections.length, i => sections[i][0] >= vpBottom);
        displayedEnd ??= sections.length;

        console.log('begin: ' + headings[displayedBegin].innerText);

        let activeIndex = helpers.search(displayedBegin, displayedEnd, isCandidate);
        updateActiveLi(activeIndex);

        function isCandidate(index) {
            let [sectionTop, sectionBottom] = sections[index];     
            let sectionHeight = sectionBottom - sectionTop;
            
            let displayedTop = Math.max(sectionTop, vpTop);
            let displayedBottom = Math.min(sectionBottom, vpBottom);

            let displayedBySection = (displayedBottom - displayedTop) / sectionHeight;
            let displayedByVp = (displayedBottom - displayedTop) / vpHeight;
           
            return displayedBySection >= 0.8 || displayedByVp >= 0.4;
        }

        /** @param {?number} index */
        function updateActiveLi(index) {
            if (index === prevIndex)
                return;
            
            if (prevIndex !== null) {
                lis[prevIndex].classList.remove('toc-current');
            }      
            if (index !== null) {
                lis[index].classList.add('toc-current');
            }
            prevIndex = index;
        }
    }

    function _onResize() {
        rebuildSections();
    }

    function rebuildSections() {
        while (sections.length < headings.length) {
            sections.push([0, 0]);
        }
        
        let scrollY = window.pageYOffset;
        for (let index = 0; index < headings.length; ++index) {
            let topBottom = sections[index];
            topBottom[0] = headings[index].getBoundingClientRect().top + scrollY;

            let sectionEnding = index < headings.length - 1 ?
                headings[index + 1].previousElementSibling :
                headings[index].parentElement.lastElementChild;
            
            topBottom[1] = sectionEnding.getBoundingClientRect().bottom + scrollY;
        }
    }
}

export function setTocButtonsEvent() {
    let btnShowToc = document.getElementById('show-toc');
    let btnHideToc = document.getElementById('hide-toc');
    let tocContainer = document.getElementById('side-sticky');
    let mdtoc = document.getElementById('mdtoc');

    btnShowToc.addEventListener('click', showToc);
    btnHideToc.addEventListener('click', hideToc);
    mdtoc.addEventListener('click', ev => {
        if (ev.target.tagName === 'A') {
            hideToc();
        }
    });

    function showToc() {
        btnShowToc.classList.add('hidden');
        btnHideToc.classList.add('show');
        tocContainer.classList.add('show');
    }

    function hideToc() {
        btnShowToc.classList.remove('hidden');
        btnHideToc.classList.remove('show');
        tocContainer.classList.remove('show');
    }
}