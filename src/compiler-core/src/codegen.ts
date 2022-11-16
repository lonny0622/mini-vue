import { isString } from "../../shared";
import { NodeTypes } from "./ast";
import {
    CREATE_ELEMENT_VNODE,
    helperMapName,
    TO_DISPLAY_STRING,
} from "./runtimeHelper";

export interface CodegenContext {
    code: string;
    push: (source: string) => void;
    helper: (key: any) => string;
}

export function generate(ast: any) {
    const Context = createCodegenContext();
    const { push } = Context;

    genFunctionPreamble(ast, Context);

    const functionName = "render";
    const args = ["_ctx", "_cache"];
    const signature = args.join(",");

    push(`function ${functionName}(${signature}){`);
    push("return ");
    genNode(ast.codegenNode, Context);
    push("}");
    return {
        code: Context.code,
    };
}

function genFunctionPreamble(ast: any, context: CodegenContext) {
    const { push } = context;
    const VueBinging = "Vue";
    const aliasHelper = (s: any) => `${helperMapName[s]}: _${helperMapName[s]}`;
    if (ast.helpers.length > 0) {
        push(
            `const { ${ast.helpers
                .map(aliasHelper)
                .join(",")} } = ${VueBinging}`
        );
        push("\n");
    }

    push("return ");
}

function createCodegenContext(): CodegenContext {
    const context: CodegenContext = {
        code: "",
        push(source: string) {
            context.code += source;
        },
        helper(key: any) {
            return `_${helperMapName[key]}`;
        },
    };
    return context;
}

function genNode(node: any, context: CodegenContext) {
    switch (node.type) {
        case NodeTypes.TEXT:
            genText(node, context);
            break;
        case NodeTypes.INTERPOLATION:
            genInterpolation(node, context);
            break;
        case NodeTypes.SIMPLE_EXPRESSION:
            genExpression(node, context);
            break;
        case NodeTypes.ELEMENT:
            genElement(node, context);
            break;
        case NodeTypes.COMPOUND_EXPRESSION:
            genCompoundExpression(node, context);
            break;
        default:
            break;
    }
}

function genCompoundExpression(node: any, context: CodegenContext) {
    const { push } = context;
    const { children } = node;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isString(child)) {
            push(child);
        } else {
            genNode(child, context);
        }
    }
}

// 处理element
function genElement(node: any, context: CodegenContext) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    genNodeList(genNullAble([tag, props, children]), context);
    push(")");
}

function genNodeList(nodes: any[], context: CodegenContext) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (isString(node)) {
            push(node);
        } else {
            genNode(node, context);
        }
        if (i < nodes.length - 1) {
            push(", ");
        }
    }
}

function genNullAble(args: any[]) {
    return args.map((arg) => arg || "null");
}

// 处理插值
function genExpression(node: any, context: CodegenContext) {
    const { push } = context;
    push(`${node.content}`);
}

// 处理文字
function genText(node: any, context: CodegenContext) {
    const { push } = context;
    push(`'${node.content}'`);
}

function genInterpolation(node: any, context: CodegenContext) {
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(")");
}
