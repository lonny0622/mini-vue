import { NodeTypes } from "./ast";
import { ParserContext, ParserNode } from "./parse";
import { TO_DISPLAY_STRING } from "./runtimeHelper";

export interface TransformOptions {
    nodeTransforms?: Function[];
}

export interface TransformContext {
    root: any;
    nodeTransforms: Function[];
    helpers: Map<Symbol, 1>;
    helper: (key: Symbol) => void;
}

/**
 * 转换函数
 * @param root 根节点
 * @param options 处理插件函数
 */
export function transform(root: ParserNode, options: TransformOptions = {}) {
    const context = createTransformContext(root, options);

    // 1.遍历 - 深度优先遍历
    traverseNode(root, context);

    createRootCodegen(root);
    root.helpers = [...context.helpers.keys()];
}

/**
 * 创建根节点
 * @param root
 */
function createRootCodegen(root: ParserNode) {
    // 获取ParserRoot的child的codegenNode并赋值给root节点
    const child = root.children?.[0];
    if (child?.type === NodeTypes.ELEMENT) {
        root.codegenNode = child.codegenNode;
    } else {
        root.codegenNode = root.children?.[0];
    }
}

/**
 * 创建Transform上下文
 * @param root
 * @param options
 * @returns
 */
function createTransformContext(
    root: ParserNode,
    options: TransformOptions
): TransformContext {
    const context: TransformContext = {
        root,
        nodeTransforms: options.nodeTransforms ?? [],
        helpers: new Map<Symbol, 1>(),
        helper(key: Symbol) {
            context.helpers.set(key, 1);
        },
    };
    return context;
}

/**
 * 递归遍历节点，并调用响应的处理函数
 * @param node
 * @param context
 */
function traverseNode(node: ParserNode, context: TransformContext) {
    const nodeTransforms = context.nodeTransforms;

    const exitFns: any = [];

    // 先调用一遍处理插件函数将内容进行转换便于处理
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        // 有的会返回后处理函数，为的是避免某些函数处理后的结果影响后面处理
        const onExit = transform(node, context);
        if (onExit) exitFns.push(onExit);
    }
    // 更具节点的类型调用对应函数分别处理
    switch (node.type) {
        case NodeTypes.INTERPOLATION:
            context.helper(TO_DISPLAY_STRING);
            break;
        case NodeTypes.ROOT:
        case NodeTypes.ELEMENT:
            traverseChildren(node, context);
            break;
        default:
            break;
    }
    // 调用后处理函数继续处理节点
    let i = exitFns.length;
    while (i--) {
        exitFns[i]();
    }
}
/**
 * 处理所有子节点
 * @param node
 * @param context
 */
function traverseChildren(node: ParserNode, context: TransformContext) {
    const children = node.children || [];
    for (let i = 0; i < children.length; i++) {
        const node = children[i];
        // 递归处理
        traverseNode(node, context);
    }
}
