import { VNode } from "./models";

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
