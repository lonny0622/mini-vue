import { createRenderer } from "../runtime-core";
import { VNode } from "../runtime-core/models";

function createElement(type: string) {
    // console.log("-------------createElement----------------");
    return document.createElement(type);
}

function patchProp(el: HTMLElement, key: string, preVal: any, nextVal: any) {
    // console.log("---------------patchProp------------------");
    const isOn = (key: string) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextVal);
    } else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        } else {
            el.setAttribute(key, nextVal);
        }
    }
}

function insert(
    child: HTMLElement,
    parent: HTMLElement,
    anchor?: HTMLElement | null
) {
    // console.log("----------------insert--------------------");
    // container.append(el);
    parent.insertBefore(child, anchor || null);
}

function remove(child: any) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}

function setElementText(el: HTMLElement, text: string) {
    el.textContent = text;
}

const renderer: any = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText,
});

export function createApp(...args: any) {
    return renderer.createApp?.(...args);
}
export * from "../runtime-core";
