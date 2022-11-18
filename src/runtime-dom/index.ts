import { createRenderer } from "../runtime-core";
import { VNode } from "../runtime-core/models";
/**
 * 创建Dom元素
 * @param type
 * @returns
 */
function createElement(type: string) {
    // console.log("-------------createElement----------------");
    return document.createElement(type);
}

/**
 * 设置Dom袁术的Props
 * @param el
 * @param key
 * @param preVal
 * @param nextVal
 */
function patchProp(el: HTMLElement, key: string, preVal: any, nextVal: any) {
    // console.log("---------------patchProp------------------");
    // 判断是不是事件响应函数
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

/**
 * 在指定的锚点前插入元素
 * @param child
 * @param parent
 * @param anchor
 */
function insert(
    child: HTMLElement,
    parent: HTMLElement,
    anchor?: HTMLElement | null
) {
    // console.log("----------------insert--------------------");
    // container.append(el);
    parent.insertBefore(child, anchor || null);
}

/**
 * 移除指定元素
 * @param child
 */
function remove(child: HTMLElement) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}

/**
 * 设置元素的文本内容
 * @param el
 * @param text
 */
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

/**
 * 入口函数
 * @param args
 * @returns
 */
export function createApp(...args: any) {
    return renderer.createApp?.(...args);
}
export * from "../runtime-core";
