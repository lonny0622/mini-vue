import { AstNode, NodeTypes } from "../ast";
import { TransformContext } from "../transform";

/**
 * 处理插值
 * @param node
 * @param context
 */
export function transformExpression(node: AstNode, context: TransformContext) {
    if (node.type === NodeTypes.INTERPOLATION) {
        node.content = processExpression(node.content);
    }
}
/**
 * 转换插值
 * @param node
 * @returns
 */
function processExpression(node: any) {
    node.content = `_ctx.${node.content}`;
    return node;
}
