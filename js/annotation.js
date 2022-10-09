import * as helpers from "./helpers.js";

/**@param {HTMLDivElement} content */
export function initAnnotations(content) {
    /**@type {NodeListOf<HTMLElement>} */
    let termsAndAnnos = content.querySelectorAll('span.term, div.annotation');
    for (let i = 0; i < termsAndAnnos.length; ++i) {
        if (termsAndAnnos[i].classList.contains('term')) {
            let term = termsAndAnnos[i];
            let termText = getTextWithoutFurigana(termsAndAnnos[i]).toLowerCase();
            let j;
            for (j = i + 1; j < termsAndAnnos.length; ++j){
                if (termsAndAnnos[j].classList.contains('term'))
                    continue;
                if (termsAndAnnos[j].dataset.term.toLowerCase() === termText)
                    break;
            }
            if (j < termsAndAnnos.length) {
                let anno = termsAndAnnos[j];
                let annoId = "anno-" + j;
                anno.id = annoId;
                term.dataset.annoId = annoId;
            }
        }
    }

    for (let elem of termsAndAnnos) {
        if (elem.classList.contains('term')) {
            elem.addEventListener('click', onClickTerm);
        }
        else {
            elem.addEventListener('click', onClickAnnotation);
        }
    }

    window.addEventListener('resize', helpers.throttle(onWindowResize, 200));
    document.body.addEventListener('click', onClickBody);

    /**@return {string} */
    function getTextWithoutFurigana(elem) {
        return elem.textContent.replace(/\{.*?\}/g, '');
    }
}

/**@type {HTMLDivElement} */
let annoShown = null;

let termClicked = null;

/**@param {PointerEvent} ev */
function onClickTerm(ev) {
    termClicked = ev.target;
    let anno = document.getElementById(termClicked.dataset.annoId);

    if (annoShown) {
        annoShown.classList.remove('show');
    }

    if (annoShown === anno) {
        annoShown = null;
    }
    else {
        anno.classList.add('show');
        annoShown = anno;
        setAnnotationPosition(termClicked, anno);
    }
    ev.stopPropagation();
}

/**@param {PointerEvent} ev */
function onClickAnnotation(ev) {
    ev.stopPropagation();
}

function onWindowResize() {
    if (annoShown) {
        setAnnotationPosition(termClicked, annoShown);
    }
}

function onClickBody(ev) {
    if (annoShown) {
        annoShown.classList.remove('show');
        annoShown = null;
    }
}

/**
 * @param {HTMLDivElement} anno 
 * @param {HTMLSpanElement} term */
function setAnnotationPosition(term, anno) {
    anno.removeAttribute('style');
    let termRects = term.getClientRects();

    let heightAbove = termRects[0].top;

    let annoWidth = anno.offsetWidth;
    let annoHeight = anno.offsetHeight;
    let bodyWidth = document.body.scrollWidth;

    let termRectTarget;
    if (annoHeight <= heightAbove) {
        termRectTarget = termRects[0];
        anno.style.top = (window.pageYOffset + termRectTarget.top - annoHeight) + "px";  
    }
    else {
        termRectTarget = termRects[termRects.length - 1];
        anno.style.top = (window.pageYOffset + termRectTarget.bottom) + "px"; 

        let bodyWidthNew = document.body.scrollWidth;
        if (bodyWidthNew !== bodyWidth) {
            bodyWidth = bodyWidthNew;
            termRects = term.getClientRects();
            termRectTarget = termRects[termRects.length - 1];
            anno.style.top = (window.pageYOffset + termRectTarget.bottom) + "px";
        }
    }

    let termLeft = window.pageXOffset + termRectTarget.left;
    if (annoWidth + termLeft <= bodyWidth) {
        anno.style.left = termLeft + "px";
        anno.style.right = "unset";
    }
    else {
        anno.style.right = "0";
        anno.style.left = "unset";
    }

}