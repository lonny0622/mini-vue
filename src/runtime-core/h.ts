import { createVNode } from "./vnode";

export function h(type: string, props?: any, children?: any) {
    return createVNode(type, props, children);
}
