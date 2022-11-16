import { CREATE_ELEMENT_VNODE } from "./runtimeHelper";
import { TransformContext } from "./transform";

export const enum NodeTypes {
    INTERPOLATION,
    SIMPLE_EXPRESSION,
    ELEMENT,
    TEXT,
    ROOT,
    COMPOUND_EXPRESSION,
}

export function createVNodeCall(
    context: TransformContext,
    tag: any,
    props: any,
    children: any
) {
    context.helper(CREATE_ELEMENT_VNODE);

    return {
        type: NodeTypes.ELEMENT,
        tag,
        props,
        children,
    };
}
