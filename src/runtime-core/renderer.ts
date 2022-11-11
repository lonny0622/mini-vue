import { effect } from "../reactivity/effect";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { Instance, VNode } from "./models";
import { Fragment, Text } from "./vnode";

export function createRenderer(options: any) {
    const {
        createElement: hostCreateElement,
        patchProp: hostPatchProp,
        insert: hostInsert,
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
        mountChildren(n2, container, parentComponent);
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
            patchElement(n1, n2, container);
        }
    }

    function patchElement(n1: VNode | null, n2: VNode, container: HTMLElement) {
        console.log("patchElement");
        // props
        //
    }

    function mountElement(
        vnode: VNode,
        container: HTMLElement,
        parentComponent: any
    ) {
        const el = hostCreateElement(vnode.type as string);
        const { children, shapeFlag } = vnode;
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            el.textContent = children as string;
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(vnode, el, parentComponent);
        }
        const { props } = vnode;
        for (const key in props) {
            const val = props[key];
            hostPatchProp(el, key, val);
        }

        hostInsert(el, container);
    }

    function mountChildren(
        vnode: VNode,
        container: HTMLElement,
        parentComponent: any
    ) {
        if (vnode.children && Array.isArray(vnode.children))
            vnode.children.forEach((v: VNode) => {
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
