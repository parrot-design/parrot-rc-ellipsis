

import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { getComputedStyle, getBoundingClientRect } from '@parrotjs/dom-utils';

function computedHeight(dom:any) {
    return pxToNumber(getComputedStyle(dom)['height']);
}

interface MeasureResult {
    finished: boolean;
    reactNode: React.ReactNode;
}

let ellipsisContainer:any;

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const COMMENT_NODE = 8;

const wrapperStyle: React.CSSProperties = {
    padding: 0,
    margin: 0,
    display: 'inline',
    lineHeight: 'inherit',
};

function styleToString(style: CSSStyleDeclaration) {
    const styleNames: string[] = Array.prototype.slice.apply(style);
    return styleNames.map(name => `${name}: ${style.getPropertyValue(name)};`).join('');
}

function resetDomStyles(target:any, origin:any) {

    const originStyle = getComputedStyle(origin);
    const originCSS = styleToString(originStyle);

    target.setAttribute('style', originCSS);
    target.style.position = 'fixed';
    target.style.left = '0';
    target.style.height = 'auto';
    target.style.minHeight = 'auto';
    target.style.maxHeight = 'auto';
    target.style.top = '-999999px';
    target.style.zIndex = '-1000';

    target.style.textOverflow = 'clip';
    target.style.whiteSpace = 'normal';
    (target.style as any).webkitLineClamp = 'none';
}

function pxToNumber(value: string | null): number {
    if (!value) {
        return 0;
    }
    const match = value.match(/^\d*(\.\d*)?/);
    return match ? Number(match[0]) : 0;
}

function getRealLineHeight(originElement: HTMLElement) {
    const heightContainer = document.createElement('div');
    resetDomStyles(heightContainer, originElement);
    heightContainer.appendChild(document.createTextNode('text'));
    document.body.appendChild(heightContainer);
    const { offsetHeight } = heightContainer;
    const lineHeight = pxToNumber(getComputedStyle(originElement).lineHeight);
    document.body.removeChild(heightContainer);
    return offsetHeight > lineHeight ? offsetHeight : lineHeight;
}

export default function measure(
    originElement: HTMLElement,
    rows: number,
    content: React.ReactNode,
    // fixedContent: React.ReactNode[],
    ellipsisStr: string
) {

    if (!ellipsisContainer) {
        ellipsisContainer = document.createElement('div');
        document.body.appendChild(ellipsisContainer);
    }

    const originStyle = getComputedStyle(originElement);
    const lineHeight = getRealLineHeight(originElement);

    const maxHeight = Math.floor(lineHeight) * (rows + 1) +
        pxToNumber(originStyle.paddingTop) +
        pxToNumber(originStyle.paddingBottom);

    resetDomStyles(ellipsisContainer, originElement);

    render(
        <div style={wrapperStyle}>
            <span style={wrapperStyle}>
                {content}
            </span>
            <span style={wrapperStyle}>
                <a
                    key="expand"
                >
                    {'展开'}
                </a>
            </span>
        </div>,
        ellipsisContainer
    );
    //max height less than fake height
    function inRange() {
        return Math.ceil(computedHeight(ellipsisContainer)) < maxHeight;
    }

    if (inRange()) {
        unmountComponentAtNode(ellipsisContainer);
        return {
            content,
            text: ellipsisContainer.innerHTML,
            ellipsis: false
        }
    }

    const childNodes = Array.prototype.slice
        .apply(ellipsisContainer.childNodes[0].childNodes[0].cloneNode(true).childNodes)
        .filter(({ nodeType }) => nodeType !== COMMENT_NODE);

    const fixedNodes: ChildNode[] = Array.prototype.slice.apply(
        ellipsisContainer.childNodes[0].childNodes[1].cloneNode(true).childNodes
    );

    unmountComponentAtNode(ellipsisContainer);

    const ellipsisChildren:any = [];
    ellipsisContainer.innerHTML = '';

    const ellipsisContentHolder = document.createElement('span');
    ellipsisContainer.appendChild(ellipsisContentHolder);

    const ellipsisTextNode = document.createTextNode(ellipsisStr);
    ellipsisContentHolder.appendChild(ellipsisTextNode);

    fixedNodes.forEach(childNode => {
        ellipsisContainer.appendChild(childNode);
    });

    // Append before fixed nodes
    function appendChildNode(node: ChildNode) {
        ellipsisContentHolder.insertBefore(node, ellipsisTextNode);
    }

    function measureText(
        textNode:Text,
        fullText:string,
        startLoc=0,
        endLoc = fullText.length,
        lastSuccessLoc = 0
    ):any{
        const midLoc = Math.floor((startLoc + endLoc) / 2);
        const currentText = fullText.slice(0, midLoc);
        textNode.textContent = currentText; 

        if (startLoc >= endLoc - 1) {
            for (let step = endLoc; step >= startLoc; step -= 1) {
                const currentStepText = fullText.slice(0, step);
                textNode.textContent = currentStepText;

                if (inRange() || !currentStepText) {
                    return step === fullText.length
                        ? {
                            finished: false,
                            reactNode: fullText,
                        }
                        : {
                            finished: true,
                            reactNode: currentStepText,
                        };
                }
            }
        } 

        if (inRange()) {
            return measureText(textNode, fullText, midLoc, endLoc, midLoc)
        }
        return measureText(textNode, fullText, startLoc, midLoc, lastSuccessLoc);
    }

    function measureNode(childNode:any) { 

        const type = childNode.nodeType;

        if (type === TEXT_NODE) {
            const fullText = childNode.textContent || ''; 
            const textNode = document.createTextNode(fullText); 
            appendChildNode(textNode);
            return measureText(textNode, fullText);
        }

        return {
            finished: false,
            reactNode: null
        }
    }

    childNodes.some((childNode) => {
        const { finished, reactNode } = measureNode(childNode);
        if (reactNode) {
            ellipsisChildren.push(reactNode);
        }
        return finished;
    }); 

    return {
        content: ellipsisChildren,
        text: ellipsisContainer.innerHTML,
        ellipsis: true,
      };

}