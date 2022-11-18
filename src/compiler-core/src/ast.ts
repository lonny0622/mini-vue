import { ParserNode } from "./parse";
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
export interface AstNode extends ParserNode {}

/**
 * 创建node节点
 * @param context
 * @param tag
 * @param props
 * @param children
 * @returns
 */
export function createVNodeCall(
    context: TransformContext,
    tag: string,
    props: any,
    children: string | any
): AstNode {
    context.helper(CREATE_ELEMENT_VNODE);

    return {
        type: NodeTypes.ELEMENT,
        tag,
        props,
        children,
    };
}
