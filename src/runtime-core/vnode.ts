export function createVNode(
    type: string,
    props?: undefined,
    children?: undefined
) {
    const vnode = {
        type,
        props,
        children,
    };
    return vnode;
}
