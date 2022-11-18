import { RuntimeDomApi } from "../models";
import { effect } from "../reactivity/effect";
import { EMPTY_OBJ } from "../shared";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { shouldUpdateComponent } from "./componentUpdateUtils";
import { createAppAPI } from "./createApp";
import { Instance, VNode } from "./models";
import { queueJobs } from "./scheduler";
import { Fragment, Text } from "./vnode";

/**
 * 创建render函数
 * @param options 自定义渲染
 * @returns 
 */
export function createRenderer(options: RuntimeDomApi) {
    const {
        createElement: hostCreateElement,
        patchProp: hostPatchProp,
        insert: hostInsert,
        remove: hostRemove,
        setElementText: hostSetElementText,
    } = options;

    /**
     * 入口函数
     * @param vnode 待渲染的节点
     * @param container 容器
     * @param parentComponent 父节点
     */
    function render(
        vnode: VNode,
        container: HTMLElement|any,
        parentComponent?:Instance
    ) {
        patch(null, vnode, container, parentComponent, null);
    }

    /**
     * 派发器，更具节点的类型调用不同的渲染函数
     * @param n1 旧节点
     * @param n2 新节点
     * @param container 容器
     * @param parentComponent 父节点
     * @param anchor 
     */
    function patch(
        n1: VNode | null,
        n2: VNode,
        container: HTMLElement|any,
        parentComponent: Instance|undefined,
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
    /**
     * Fragment 只用渲染子节点
     * @param n1 旧节点
     * @param n2 新节点
     * @param container 容器
     * @param parentComponent 父组件实例
     */
    function processFragment(
        n1: VNode | null,
        n2: VNode,
        container: HTMLElement,
        parentComponent: Instance|undefined
    ) {
        // Implement
        mountChildren(n2.children as VNode[], container, parentComponent);
    }
    /**
     * 渲染文本节点
     * @param n1 
     * @param n2 
     * @param container 
     */
    function processText(n1: VNode | null, n2: VNode, container: HTMLElement) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children as string));
        container.append(textNode);
    }

    /**
     * 渲染element
     * @param n1 
     * @param n2 
     * @param container 
     * @param parentComponent 
     * @param anchor 锚点，在谁之前渲染这个元素
     */
    function processElement(
        n1: VNode | null,
        n2: VNode,
        container: HTMLElement,
        parentComponent: Instance|undefined,
        anchor: HTMLElement | null
    ) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        } else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    /**
     * 当新旧节点需要对比更新时在此处派发逻辑
     * @param n1 
     * @param n2 
     * @param container 
     * @param parentComponent 
     * @param anchor 锚点，在谁之前渲染这个元素
     */
    function patchElement(
        n1: VNode | null,
        n2: VNode,
        container: HTMLElement,
        parentComponent: Instance |undefined,
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

    /**
     * 对比新旧节点的子元素进行更新
     * @param n1 
     * @param n2 
     * @param container 
     * @param parentComponent 
     * @param anchor 
     */
    function patchChildren(
        n1: VNode,
        n2: VNode,
        container: HTMLElement,
        parentComponent: Instance|undefined,
        anchor: HTMLElement | null
    ) {
        const preShapeFlag = n1?.shapeFlag ?? 0;
        const shapeFlag = n2.shapeFlag;
        const c1 = n1.children;
        const c2 = n2.children;
        // 如果新的节点为文本节点
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            // 当老的为array直接全部清除
            if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // 1.把老的 children 清空
                unmountChildren(n1.children as VNode[]);
            }
            // 只有新旧节点不同时才需要更新
            if (c1 !== c2) {
                hostSetElementText(container, c2 as string);
            }
        } else {
            // 当旧的节点为文本节点时，清除文本后插入即可
            if (preShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                hostSetElementText(container, "");
                mountChildren(c2 as VNode[], container, parentComponent);
            } else {
                // 否则则需要调用diff算法进行比较更新
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
    /**
     * 判断新旧节点是否为同类型节点
     * @param n1 
     * @param n2 
     * @returns 
     */
    function isSameVNodeType(n1: VNode, n2: VNode) {
        return n1.type === n2.type && n1.key === n2.key;
    }
    /**
     * 双端对比 diff核心算法
     * 根据前端业务场景的优化算法，一般更新时都是两端不变中间变化，所以逻辑如下
     * 1、进行左侧与右侧对比，找出需要更新的范围
     * 2、在需更新的范围中，新的比老的多（仅仅新增了节点）则只需要在锚点前插入新节点即可
     * 3、当新的比老的少（仅仅删除了节点）则只需要删除对应的节点即可
     * 4、否则则需要进行中间对比，又分为移动、插入、删除三个策略
     *    a、遍历旧的点找出需要移动的节点（新节点中有与之对应的节点）并将旧节点Dom的引用赋值给新节点
     *    b、使用最长递增子序列算法找出不需要移动的子节点
     *    c、遍历新节点，对旧节点中有的节点进行移动，没有的调用patch生成新的Dom,并插入到锚点之前
     * 5、完成更新
     * @param c1 旧节点
     * @param c2 新节点
     * @param container 容器
     * @param parentComponent 父组件
     * @param parentAnchor 父锚点
     */
    function patchKeyedChildren(
        c1: VNode[],
        c2: VNode[],
        container:  HTMLElement|any,
        parentComponent: Instance|undefined,
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

            // 新节点key与index的映射
            const keyToNewIndexMap = new Map();
            // 需要移动的节点映射
            const newIndexToOldIndexMap = new Array(toBePatched);

            // 是否有节点移动位置
            let moved = false;
            // 最近的需要移动的节点
            let maxNewIndexSoFar = 0;

            // 初始化
            for (let index = 0; index < toBePatched; index++)
                newIndexToOldIndexMap[index] = 0;
            
            // 初始化新节点key与index的映射表
            for (let index = s2; index <= e2; index++) {
                const nextChild = c2[index];
                keyToNewIndexMap.set(nextChild.key, index);
            }

            // 循环旧节点 找出旧节点与新节点的映射关系，便于重复利用
            for (let index = s1; index <= e1; index++) {
                // 当前旧节点
                const prevChild = c1[index];

                // 当所有新的节点都被遍历过，说明当前旧的节点一定被移除了这里直接删除
                if (patchedSum >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                
                // 移动后新的位置
                let newIndex;
                if (prevChild.key !== null) {
                    // 如果有key则直接通过map获取到
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                } else {
                    // 没有的话则需要一次循环新节点找到
                    for (let j = s2; j <= e2; j++) {
                        if (isSameVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                // 如果newIndex为undefined，该节点没有在新节点中找到，说明该节点已被删除，这里直接删除即可
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                } else {
                    // 更新最近移动的节点index
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    } else {
                        moved = true;
                    }

                    // 更新节点映射关系表
                    newIndexToOldIndexMap[newIndex - s2] = index + 1;

                    // 并对这两个相同类型的节点进行比较看他们的属性是否更新
                    patch(
                        prevChild,
                        c2[newIndex],
                        container,
                        parentComponent,
                        null
                    );
                    // 并记录已经移动的元素数量
                    patchedSum++;
                }
            }

            // 只有有元素移动了才需要获取最长递增子序列，否则全部删除更新即可
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            let j = increasingNewIndexSequence.length - 1;

            for (let index = toBePatched - 1; index >= 0; index--) {
                // 获取需要插入的元素以及锚点
                const nextIndex = index + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                
                // 当index为0说明该节点没有旧节点与之对应，在首次渲染或者没有移动节点时所有的都为0，这里就需要重新patch来生成对应的Dom节点
                if (newIndexToOldIndexMap[index] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor);
                } 
                // 只有需要移动元素时才需要
                else if (moved) {
                    if (index !== increasingNewIndexSequence[j]) {
                        // 复用节点Dom元素插入即可
                        hostInsert(nextChild.el, container, anchor);
                    } else {
                        j--;
                    }
                }
            }
        }
    }

    /**
     * 移除子节点
     * @param children 
     */
    function unmountChildren(children: VNode[]) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            // remove
            hostRemove(el);
        }
    }
    /**
     * 更新节点的props
     * @param el 
     * @param oldProps 
     * @param newProps 
     */
    function patchProps(el: HTMLElement, oldProps: any, newProps: any) {
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                // 只有不同时才需要更新
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

    /**
     * 将节点渲染成Dom元素
     * @param vnode 
     * @param container 
     * @param parentComponent 
     * @param anchor 
     */
    function mountElement(
        vnode: VNode,
        container: HTMLElement,
        parentComponent: Instance|undefined,
        anchor: HTMLElement | null
    ) {
        const el = (vnode.el = hostCreateElement(vnode.type as string));
        const { children, shapeFlag } = vnode;
        // 如果child是文本节点直接赋值即可
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            el.textContent = children as string;
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            // 否则需要渲染子节点
            mountChildren(vnode.children as any[], el, parentComponent);
        }
        const { props } = vnode;
        // 设置props
        for (const key in props) {
            const val = props[key];
            hostPatchProp(el, key, null, val);
        }

        hostInsert(el, container, anchor);
    }
    /**
     * 渲染子节点
     * @param children 
     * @param container 
     * @param parentComponent 
     */
    function mountChildren(
        children: VNode[],
        container: HTMLElement,
        parentComponent: Instance|undefined
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
        // 没有旧节点时直接渲染即可
        if (!n1) {
            mountComponent(n2, container, parentComponent);
        }
        // 否则需要更新 
        else {
            updateComponent(n1, n2);
        }
    }
    /**
     * 更新节点
     * @param n1 
     * @param n2 
     */
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
    /**
     * 将节点渲染成DOm
     * @param initialVnode 
     * @param container 
     * @param parentComponent 
     */
    function mountComponent(
        initialVnode: VNode,
        container: HTMLElement,
        parentComponent: Instance|undefined
    ) {
        const instance = (initialVnode.component = createComponentInstance(
            initialVnode,
            parentComponent
        ));
        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container);
    }
    /**
     * 在这里进行setup中依赖的收集，实现修改数据页面自动更新
     * @param instance 
     * @param initialVnode 
     * @param container 
     */
    function setupRenderEffect(
        instance: Instance,
        initialVnode: VNode,
        container: HTMLElement
    ) {
        instance.update = effect(
            () => {
                // 当没有mount时说明是初始化阶段，否则为更新阶段
                if (!instance.isMounted) {
                    const { proxy } = instance;
                    const subTree = (instance.subTree = instance.render?.call(
                        proxy,
                        proxy
                    ));
                    patch(null, subTree, container, instance, null);
                    initialVnode.el = subTree.el;
                    instance.isMounted = true;
                } else {
                    const { next, vnode } = instance;
                    if (next) {
                        next.el = vnode.el;
                        updateComponentPreRender(instance, next);
                    }
                    const { proxy } = instance;
                    const subTree = instance.render?.call(proxy, proxy);
                    const prevSubTree = instance.subTree;
                    instance.subTree = subTree;
                    patch(prevSubTree, subTree, container, instance, null);
                }
            },
            {
                // 传入scheduler自定义更新函数
                scheduler() {
                    queueJobs(instance.update);
                },
            }
        );
    }
    return {
        createApp: createAppAPI(render),
    };
}
/**
 * 更新页面时的初始化函数
 * @param instance 
 * @param nextVNode 
 */
function updateComponentPreRender(instance: Instance, nextVNode: VNode) {
    instance.vnode = nextVNode;
    instance.next = null;
    instance.props = nextVNode.props;
}

/**
 * 提取出最长递增子序列
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
