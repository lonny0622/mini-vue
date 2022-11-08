import { VNode } from "./models";

export function createVNode(
    type: string,
    props?: undefined,
    children?: undefined
) {
    const vnode: VNode = {
        type,
        props,
        children,
    };
    return vnode;
}
