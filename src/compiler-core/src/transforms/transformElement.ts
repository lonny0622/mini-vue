import { AstNode, createVNodeCall, NodeTypes } from "../ast";
import { CREATE_ELEMENT_VNODE } from "../runtimeHelper";
import { TransformContext } from "../transform";

/**
 * 处理Element节点
 * @param node
 * @param context
 * @returns
 */
export function transformElement(node: AstNode, context: TransformContext) {
    if (node.type === NodeTypes.ELEMENT) {
        return () => {
            // 中间处理层
            // tag
            const vnodeTag = `'${node.tag}'`;

            // props
            let vnodeProps;

            // children
            const children = node.children as (string | AstNode)[];
            let vNodeChildren = children[0];

            node.codegenNode = createVNodeCall(
                context,
                vnodeTag,
                vnodeProps,
                vNodeChildren
            );
        };
    }
}
