import { isObject } from "../shared";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { VNode } from "./models";
import { createVNode } from "./vnode";

export function render(vnode: VNode, container: any) {
    // patch
    //
    patch(vnode, container);
}

function patch(vnode: VNode, container: any) {
    // 去去除组件

    // 判断是不是 element
    // 是element 就应该处理 element
    const { shapeFlag } = vnode;
    if (shapeFlag & ShapeFlags.ELEMENT) {
        processElement(vnode, container);
    } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container);
    }
}

function processElement(vnode: VNode, container: any) {
    mountElement(vnode, container);
}

function mountElement(vnode: VNode, container: HTMLElement) {
    const el = (vnode.el = document.createElement(vnode.type));
    const { children, shapeFlag } = vnode;
    if (shapeFlag & ShapeFlags.ELEMENT) {
        el.textContent = children as string;
    } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        mountChildren(vnode, el);
    }
    const { props } = vnode;
    for (const key in props) {
        const val = props[key];
        el.setAttribute(key, val);
    }

    container.append(el);
}

function mountChildren(vnode: VNode, container: HTMLElement) {
    if (vnode.children && Array.isArray(vnode.children))
        vnode.children.forEach((v: VNode) => {
            patch(v, container);
        });
}

function processComponent(vnode: VNode, container: any) {
    mountComponent(vnode, container);
}

function mountComponent(initialVnode: VNode, container: any) {
    const instance = createComponentInstance(initialVnode);
    setupComponent(instance);
    setupRenderEffect(instance, initialVnode, container);
}
function setupRenderEffect(instance: any, initialVnode: VNode, container: any) {
    const { proxy } = instance;

    const subTree = instance.render.call(proxy);
    // vnode => patch
    // vnode => element => mountElement

    patch(subTree, container);
    initialVnode.el = subTree.el;
}
