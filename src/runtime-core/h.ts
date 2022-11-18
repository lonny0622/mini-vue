import { createVNode } from "./vnode";

/**
 * 用户创建VNode节点
 * @param type
 * @param props
 * @param children
 * @returns
 */
export function h(type: string, props?: any, children?: any) {
    return createVNode(type, props, children);
}
