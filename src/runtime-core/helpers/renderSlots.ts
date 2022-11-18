import { createVNode, Fragment } from "../vnode";

/**
 * 渲染插槽中的内容
 * @param slots
 * @param name
 * @param props
 * @returns
 */
export function renderSlots(slots: any, name: string, props: any) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === "function") {
            return createVNode(Fragment, {}, slot(props));
        } else {
            return createVNode(Fragment, {}, slot);
        }
    }
}
