import { RuntimeApi } from "../models";
import { effect } from "../reactivity/effect";
import { EMPTY_OBJ } from "../shared";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { Instance, VNode } from "./models";
import { Fragment, Text } from "./vnode";

export function createRenderer(options: RuntimeApi) {
    const {
        createElement: hostCreateElement,
        patchProp: hostPatchProp,
        insert: hostInsert,
        remove: hostRemove,
        setElementText: hostSetElementText,
    } = options;

    function render(
        vnode: VNode,
        container: HTMLElement,
        parentComponent?: any
    ) {
        // patch
        //
        patch(null, vnode, container, parentComponent);
    }

    function patch(
        n1: VNode | null,
        n2: VNode,
        container: HTMLElement,
        parentComponent: any
    ) {
        const { type, shapeFlag } = n2;

        // Fragment -> 只渲染 children
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                // 判断是不是 element
                // 是element 就应该处理 element
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container, parentComponent);
                } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    processComponent(n1, n2, container, parentComponent);
                }
        }
    }

    function processFragment(
        n1: VNode | null,
        n2: VNode,
        container: HTMLElement,
        parentComponent: any
    ) {
        // Implement
        mountChildren(n2.children as VNode[], container, parentComponent);
    }

    function processText(n1: VNode | null, n2: VNode, container: HTMLElement) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children as string));
        container.append(textNode);
    }

    function processElement(
        n1: VNode | null,
        n2: VNode,
        container: HTMLElement,
        parentComponent: any
    ) {
        if (!n1) {
            mountElement(n2, container, parentComponent);
        } else {
            patchElement(n1, n2, container, parentComponent);
        }
    }

    function patchElement(
        n1: VNode | null,
        n2: VNode,
        container: HTMLElement,
        parentComponent: any
    ) {
        console.log("patchElement");
        console.log({ n1, n2 });
        const oldProps = n1?.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;

        const el = (n2.el = n1?.el);
        if (n1) patchChildren(n1, n2, el, parentComponent);
        patchProps(el, oldProps, newProps);
    }

    function patchChildren(
        n1: VNode,
        n2: VNode,
        container: HTMLElement,
        parentComponent: any
    ) {
        const preShapeFlag = n1?.shapeFlag ?? 0;
        const shapeFlag = n2.shapeFlag;
        const c1 = n1.children;
        const c2 = n2.children;
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // 1.把老的 children 清空
                unmountChildren(n1.children as VNode[]);
            }
            if (c1 !== c2) {
                hostSetElementText(container, c2 as string);
            }
        } else {
            if (preShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                hostSetElementText(container, "");
                mountChildren(c2 as VNode[], container, parentComponent);
            }
        }
    }

    function unmountChildren(children: VNode[]) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            // remove
            hostRemove(el);
        }
    }

    function patchProps(el: HTMLElement, oldProps: any, newProps: any) {
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }

            if (oldProps !== EMPTY_OBJ) {
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }

    function mountElement(
        vnode: VNode,
        container: HTMLElement,
        parentComponent: any
    ) {
        const el = (vnode.el = hostCreateElement(vnode.type as string));
        const { children, shapeFlag } = vnode;
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            el.textContent = children as string;
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(vnode.children as any[], el, parentComponent);
        }
        const { props } = vnode;
        for (const key in props) {
            const val = props[key];
            hostPatchProp(el, key, null, val);
        }

        hostInsert(el, container);
    }

    function mountChildren(
        children: VNode[],
        container: HTMLElement,
        parentComponent: any
    ) {
        if (children && Array.isArray(children))
            children.forEach((v: VNode) => {
                patch(null, v, container, parentComponent);
            });
    }

    function processComponent(
        n1: VNode | null,
        n2: VNode,
        container: HTMLElement,
        parentComponent: any
    ) {
        mountComponent(n2, container, parentComponent);
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
        instance: Instance,
        initialVnode: VNode,
        container: HTMLElement
    ) {
        effect(() => {
            if (!instance.isMounted) {
                console.log("init");
                const { proxy } = instance;
                const subTree = (instance.subTree =
                    instance.render?.call(proxy));
                console.log(subTree);
                // vnode => patch
                // vnode => element => mountElement
                patch(null, subTree, container, instance);
                initialVnode.el = subTree.el;

                instance.isMounted = true;
            } else {
                console.log("update");
                const { proxy } = instance;
                const subTree = instance.render?.call(proxy);
                console.log({ subTree });
                const prevSubTree = instance.subTree;
                console.log({ prevSubTree });
                instance.subTree = subTree;
                // vnode => patch
                // vnode => element => mountElement
                patch(prevSubTree, subTree, container, instance);
                // initialVnode.el = subTree.el;
            }
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}
