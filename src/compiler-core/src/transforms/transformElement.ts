import { createVNodeCall, NodeTypes } from "../ast";
import { CREATE_ELEMENT_VNODE } from "../runtimeHelper";
import { TransformContext } from "../transform";

export function transformElement(node: any, context: TransformContext) {
    if (node.type === NodeTypes.ELEMENT) {
        return () => {
            // 中间处理层
            // tag
            const vnodeTag = `'${node.tag}'`;

            // props
            let vnodeProps;

            // children
            const children = node.children;
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
