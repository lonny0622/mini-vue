import { createRenderer } from "../runtime-core";

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

function insert(el: HTMLElement, container: HTMLElement) {
    // console.log("----------------insert--------------------");
    container.append(el);
}

const renderer: any = createRenderer({
    createElement,
    patchProp,
    insert,
});

export function createApp(...args: any) {
    return renderer.createApp(...args);
}
export * from "../runtime-core";