import { isObject } from "../shared";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { VNode } from "./models";
import { createVNode, Fragment, Text } from "./vnode";

export function render(
    vnode: VNode,
    container: HTMLElement,
    parentComponent?: any
) {
    // patch
    //
    patch(vnode, container, parentComponent);
}

function patch(vnode: VNode, container: HTMLElement, parentComponent: any) {
    const { type, shapeFlag } = vnode;

    // Fragment -> 只渲染 children
    switch (type) {
        case Fragment:
            processFragment(vnode, container, parentComponent);
            break;
        case Text:
            processText(vnode, container);
            break;
        default:
            // 判断是不是 element
            // 是element 就应该处理 element
            if (shapeFlag & ShapeFlags.ELEMENT) {
                processElement(vnode, container, parentComponent);
            } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                processComponent(vnode, container, parentComponent);
            }
    }
}

function processFragment(
    vnode: VNode,
    container: HTMLElement,
    parentComponent: any
) {
    // Implement
    mountChildren(vnode, container, parentComponent);
}

function processText(vnode: VNode, container: HTMLElement) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children as string));
    container.append(textNode);
}

function processElement(
    vnode: VNode,
    container: HTMLElement,
    parentComponent: any
) {
    mountElement(vnode, container, parentComponent);
}

function mountElement(
    vnode: VNode,
    container: HTMLElement,
    parentComponent: any
) {
    const el = (vnode.el = document.createElement(vnode.type as string));
    const { children, shapeFlag } = vnode;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        el.textContent = children as string;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        mountChildren(vnode, el, parentComponent);
    }
    const { props } = vnode;
    for (const key in props) {
        const val = props[key];
        console.log(key);
        const isOn = (key: string) => /^on[A-Z]/.test(key);
        if (isOn(key)) {
            const event = key.slice(2).toLowerCase();
            el.addEventListener(event, val);
        } else {
            el.setAttribute(key, val);
        }
    }

    container.append(el);
}

function mountChildren(
    vnode: VNode,
    container: HTMLElement,
    parentComponent: any
) {
    if (vnode.children && Array.isArray(vnode.children))
        vnode.children.forEach((v: VNode) => {
            patch(v, container, parentComponent);
        });
}

function processComponent(
    vnode: VNode,
    container: HTMLElement,
    parentComponent: any
) {
    mountComponent(vnode, container, parentComponent);
}

function mountComponent(
    initialVnode: VNode,
    container: HTMLElement,
    parentComponent: any
) {
    const instance = createComponentInstance(initialVnode, parentComponent);
    setupComponent(instance);
    setupRenderEffect(instance, initialVnode, container);
}
function setupRenderEffect(
    instance: any,
    initialVnode: VNode,
    container: HTMLElement
) {
    const { proxy } = instance;

    const subTree = instance.render.call(proxy);
    // vnode => patch
    // vnode => element => mountElement

    patch(subTree, container, instance);
    initialVnode.el = subTree.el;
}
