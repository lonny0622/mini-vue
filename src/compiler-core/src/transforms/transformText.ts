import { AstNode, NodeTypes } from "../ast";
import { isText } from "../utils";

/**
 * 处理文本包括文字和插值
 * @param node
 * @returns
 */
export function transformText(node: AstNode) {
    if (node.type === NodeTypes.ELEMENT) {
        // 如果类型时element则要处理其子节点，调用循环对子节点中的文本、插值分别处理
        return () => {
            let currentContainer;
            const children = node.children || [];

            // 循环处理知道碰到element
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        if (isText(next)) {
                            if (!currentContainer) {
                                currentContainer = children[i] = {
                                    type: NodeTypes.COMPOUND_EXPRESSION,
                                    children: [child],
                                };
                            }
                            currentContainer.children.push(" + ");
                            currentContainer.children.push(next);
                            children.splice(j, 1);
                            j--;
                        }
                    }
                } else {
                    currentContainer = undefined;
                    break;
                }
            }
        };
    }
}
