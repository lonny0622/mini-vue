import { createComponentInstance, setupComponent } from "./component";

export function render(vnode: any, container: any) {
    // patch
    //
}

function patch(vnode: any, container: any) {
    // 去去除组件

    // 判断是不是 element
    processComponent(vnode, container);
}
function processComponent(vnode: any, container: any) {
    mountComponent(vnode, container);
}

function mountComponent(vnode: any, container: any) {
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance, container);
}
function setupRenderEffect(instance: any, container: any) {
    const subTree = instance.render();
    // vnode => patch
    // vnode => element => mountElement

    patch(subTree, container);
}
