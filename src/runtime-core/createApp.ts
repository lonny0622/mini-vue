import { createVNode } from "./vnode";

export function createAppAPI(render: Function) {
    return function createApp(rootComponent: any) {
        return {
            mount(rootContainer: any) {
                //先转换成虚拟节点(vnode),所有的逻辑操作都会基于 vnode做处理
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            },
        };
    };
}
