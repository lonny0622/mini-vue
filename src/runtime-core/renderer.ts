import { RuntimeDomApi } from "../models";
import { effect } from "../reactivity/effect";
import { EMPTY_OBJ } from "../shared";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { shouldUpdateComponent } from "./componentUpdateUtils";
import { createAppAPI } from "./createApp";
import { Instance, VNode } from "./models";
import { Fragment, Text } from "./vnode";

export function createRenderer(options: RuntimeDomApi) {
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
        patch(null, vnode, container, parentComponent, null);
    }

    function patch(
        n1: VNode | null,
        n2: VNode,
        container: HTMLElement,
        parentComponent: any,
        anchor: HTMLElement | null
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
                    processElement(n1, n2, container, parentComponent, anchor);
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
        parentComponent: any,
        anchor: HTMLElement | null
    ) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        } else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }

    function patchElement(
        n1: VNode | null,
        n2: VNode,
        container: HTMLElement,
        parentComponent: any,
        anchor: HTMLElement | null
    ) {
        console.log("patchElement");
        console.log({ n1, n2 });
        const oldProps = n1?.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;

        const el = (n2.el = n1?.el);
        if (n1) patchChildren(n1, n2, el, parentComponent, anchor);
        patchProps(el, oldProps, newProps);
    }

    function patchChildren(
        n1: VNode,
        n2: VNode,
        container: HTMLElement,
        parentComponent: any,
        anchor: HTMLElement | null
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
            } else {
                // array diff array
                patchKeyedChildren(
                    c1 as VNode[],
                    c2 as VNode[],
                    container,
                    parentComponent,
                    anchor
                );
            }
        }
    }

    function isSameVNodeType(n1: VNode, n2: VNode) {
        return n1.type === n2.type && n1.key === n2.key;
    }
    /**
     * 双端对比 diff核心算法
     * @param c1 旧节点
     * @param c2 新节点
     * @param container 容器
     * @param parentComponent 父组件
     * @param parentAnchor 父锚点
     */
    function patchKeyedChildren(
        c1: VNode[],
        c2: VNode[],
        container: any,
        parentComponent: any,
        parentAnchor: HTMLElement | null
    ) {
        const l2 = c2.length;
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        // 左侧对比
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            } else {
                break;
            }
            i++;
        }
        // 右侧对比
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            } else {
                break;
            }
            e1--;
            e2--;
        }
        // 3.新的比老的多
        if (i > e1) {
            if (i <= e2) {
                const nextPos = e2 + 1;
                const anchor = nextPos < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    console.log(anchor);
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        // 4.新的比老的少
        else if (i > e2) {
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        // 中间对比
        else {
            let s1 = i;
            let s2 = i;

            // 当前需要处理的数量
            const toBePatched = e2 - s2 + 1;
            // 已经被处理的数量
            let patchedSum = 0;

            const keyToNewIndexMap = new Map();
            const newIndexToOldIndexMap = new Array(toBePatched);

            // 是否有节点移动位置
            let moved = false;
            let maxNewIndexSoFar = 0;

            for (let index = 0; index < toBePatched; index++)
                newIndexToOldIndexMap[index] = 0;

            for (let index = s2; index <= e2; index++) {
                const nextChild = c2[index];
                keyToNewIndexMap.set(nextChild.key, index);
            }

            for (let index = s1; index <= e1; index++) {
                const prevChild = c1[index];

                // 当所有新的节点都被遍历过，说明当前旧的节点一定被移除了这里直接删除
                if (patchedSum >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }

                let newIndex;
                if (prevChild.key !== null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                } else {
                    for (let j = s2; j <= e2; j++) {
                        if (isSameVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                } else {
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    } else {
                        moved = true;
                    }

                    newIndexToOldIndexMap[newIndex - s2] = index + 1;

                    patch(
                        prevChild,
                        c2[newIndex],
                        container,
                        parentComponent,
                        null
                    );
                    patchedSum++;
                }
            }

            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            let j = increasingNewIndexSequence.length - 1;

            for (let index = toBePatched - 1; index >= 0; index--) {
                const nextIndex = index + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;

                if (newIndexToOldIndexMap[index] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor);
                } else if (moved) {
                    if (index !== increasingNewIndexSequence[j]) {
                        console.log("移动位置");
                        hostInsert(nextChild.el, container, anchor);
                    } else {
                        j--;
                    }
                }
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
        parentComponent: any,
        anchor: HTMLElement | null
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

        hostInsert(el, container, anchor);
    }

    function mountChildren(
        children: VNode[],
        container: HTMLElement,
        parentComponent: any
    ) {
        if (children && Array.isArray(children))
            children.forEach((v: VNode) => {
                patch(null, v, container, parentComponent, null);
            });
    }
    /**
     * 组件更新过程
     * @param n1 旧节点
     * @param n2 新节点
     * @param container 容器
     * @param parentComponent 父组件
     */
    function processComponent(
        n1: VNode | null,
        n2: VNode,
        container: HTMLElement,
        parentComponent: any
    ) {
        if (!n1) {
            mountComponent(n2, container, parentComponent);
        } else {
            updateComponent(n1, n2);
        }
    }

    function updateComponent(n1: VNode, n2: VNode) {
        const instance = (n2.component = n1.component ?? ({} as Instance));
        // 只有props变化时才需要更新
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance?.update();
        } else {
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }

    function mountComponent(
        initialVnode: VNode,
        container: HTMLElement,
        parentComponent: any
    ) {
        const instance = (initialVnode.component = createComponentInstance(
            initialVnode,
            parentComponent
        ));
        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container);
    }
    function setupRenderEffect(
        instance: Instance,
        initialVnode: VNode,
        container: HTMLElement
    ) {
        instance.update = effect(() => {
            if (!instance.isMounted) {
                console.log("init");
                const { proxy } = instance;
                const subTree = (instance.subTree =
                    instance.render?.call(proxy));
                console.log(subTree);
                // vnode => patch
                // vnode => element => mountElement
                patch(null, subTree, container, instance, null);
                initialVnode.el = subTree.el;

                instance.isMounted = true;
            } else {
                console.log("update");
                const { next, vnode } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const { proxy } = instance;
                const subTree = instance.render?.call(proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                // vnode => patch
                // vnode => element => mountElement
                patch(prevSubTree, subTree, container, instance, null);
            }
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}

function updateComponentPreRender(instance: Instance, nextVNode: VNode) {
    instance.vnode = nextVNode;
    instance.next = null;

    instance.props = nextVNode.props;
}

/**
 * 取出最长递增子序列
 * @param arr
 * @returns
 */
function getSequence(arr: number[]): number[] {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                } else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}
