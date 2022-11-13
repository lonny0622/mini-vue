import { ShapeFlags } from "../shared/ShapeFlags";
import { VNode } from "./models";

export const Fragment = Symbol("Fragment");
export const Text = Symbol("Text");

export function createVNode(
    type: string | symbol,
    props?: any,
    children?: any
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

export function createTextVNode(text: string) {
    return createVNode(Text, {}, text);
}

function getShapeFlag(type: any) {
    return typeof type === "string"
        ? ShapeFlags.ELEMENT
        : ShapeFlags.STATEFUL_COMPONENT;
}
