import { ShapeFlags } from "../shared/ShapeFlags";
import { VNode } from "./models";

export const Fragment = Symbol("Fragment");
export const Text = Symbol("Text");

export { createVNode as createElementVNode };

/**
 * 创建VNode
 * @param type
 * @param props
 * @param children
 * @returns
 */
export function createVNode(
    type: string | symbol,
    props?: any,
    children?: string | Array<any> | VNode
) {
    const vnode: VNode = {
        type,
        props,
        children,
        component: null,
        key: props && props.key,
        shapeFlag: getShapeFlag(type),
        el: null,
    };

    // 判断child的类型并打上标记
    if (typeof children === "string") {
        vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    } else if (Array.isArray(children)) {
        vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    }

    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        if (typeof children === "object") {
            vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN;
        }
    }

    return vnode;
}

/**
 * 创建文本节点
 * @param text
 * @returns
 */
export function createTextVNode(text: string) {
    return createVNode(Text, {}, text);
}

/**
 * 获取节点类型
 * @param type
 * @returns
 */
function getShapeFlag(type: any) {
    return typeof type === "string"
        ? ShapeFlags.ELEMENT
        : ShapeFlags.STATEFUL_COMPONENT;
}
