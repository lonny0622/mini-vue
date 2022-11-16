import { NodeTypes } from "../ast";
import { TransformContext } from "../transform";

export function transformExpression(node: any, context: TransformContext) {
    if (node.type === NodeTypes.INTERPOLATION) {
        node.content = processExpression(node.content);
    }
}

function processExpression(node: any) {
    node.content = `_ctx.${node.content}`;
    return node;
}
