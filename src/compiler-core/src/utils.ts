import { NodeTypes } from "./ast";

/**
 * 判断是否为文本或者插值
 * @param node
 * @returns
 */
export function isText(node: any) {
    return (
        node.type === NodeTypes.TEXT || node.type === NodeTypes.INTERPOLATION
    );
}
