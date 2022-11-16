import { NodeTypes } from "./ast";
import { Context } from "./parse";
import { TO_DISPLAY_STRING } from "./runtimeHelper";

export interface TransformOptions {
    nodeTransforms?: Function[];
}

export interface TransformContext {
    root: any;
    nodeTransforms: Function[];
    helpers: Map<Symbol, any>;
    helper: (key: Symbol) => void;
}

export function transform(root: any, options: TransformOptions = {}) {
    const context = createTransformContext(root, options);

    // 1.遍历 - 深度优先遍历
    traverseNode(root, context);

    createRootCodegen(root);
    root.helpers = [...context.helpers.keys()];
}

function createRootCodegen(root: any) {
    const child = root.children[0];
    if (child.type === NodeTypes.ELEMENT) {
        root.codegenNode = child.codegenNode;
    } else {
        root.codegenNode = root.children[0];
    }
}

function createTransformContext(
    root: any,
    options: TransformOptions
): TransformContext {
    const context: TransformContext = {
        root,
        nodeTransforms: options.nodeTransforms ?? [],
        helpers: new Map(),
        helper(key: Symbol) {
            context.helpers.set(key, 1);
        },
    };
    return context;
}

function traverseNode(node: any, context: TransformContext) {
    const nodeTransforms = context.nodeTransforms;

    const exitFns: any = [];

    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        const onExit = transform(node, context);
        if (onExit) exitFns.push(onExit);
    }

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
    let i = exitFns.length;
    while (i--) {
        exitFns[i]();
    }
}
function traverseChildren(node: any, context: TransformContext) {
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const node = children[i];
        traverseNode(node, context);
    }
}
