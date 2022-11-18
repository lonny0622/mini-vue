import { VNode } from "./models";

/**
 * 判断是否需要更新节点
 * @param prevVNode
 * @param nextVNode
 * @returns
 */
export function shouldUpdateComponent(prevVNode: VNode, nextVNode: VNode) {
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;

    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }

    return false;
}
