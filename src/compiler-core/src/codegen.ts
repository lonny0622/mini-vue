import { isString } from "../../shared";
import { AstNode, NodeTypes } from "./ast";
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
/**
 * 编码模块入口函数，返回生成的代码
 * @param ast
 * @returns
 */
export function generate(ast: AstNode) {
    // 创建上下文对象
    const Context = createCodegenContext();
    // push 用于连接代码字符串
    const { push } = Context;

    // 获取需要的处理函数
    genFunctionPreamble(ast, Context);

    // 定义需要用到的字符串
    const functionName = "render";
    const args = ["_ctx", "_cache"];
    const signature = args.join(",");
    // 构建函数
    push(`function ${functionName}(${signature}){`);
    push("return ");
    // 生成render函数
    genNode(ast.codegenNode, Context);
    push("}");
    return {
        code: Context.code,
    };
}
/**
 * 生成代码所需要的处理函数
 * @param ast
 * @param context
 */
function genFunctionPreamble(ast: any, context: CodegenContext) {
    const { push } = context;
    const VueBinging = "Vue";
    // 重命名处理函数避免冲突
    const aliasHelper = (s: any) => `${helperMapName[s]}: _${helperMapName[s]}`;
    // 逐个加入
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

/**
 * 创建编译模块上下文对象
 * @returns
 */
function createCodegenContext(): CodegenContext {
    const context: CodegenContext = {
        code: "",
        push(source: string) {
            context.code += source;
        },
        helper(key: symbol) {
            return `_${helperMapName[key]}`;
        },
    };
    return context;
}

/**
 * 根据对象语法树节点的类型调用不同的处理函数
 * @param node
 * @param context
 */
function genNode(node: AstNode, context: CodegenContext) {
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
/**
 * 处理复杂的组合节点 例如 "<div>hi, {{message}}</div>"
 * @param node
 * @param context
 */
function genCompoundExpression(node: AstNode, context: CodegenContext) {
    const { push } = context;
    const children = node.children ?? [];
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        // 如果是string类型则直接push
        if (isString(child)) {
            push(child as string);
        }
        // 否则递归继续处理
        else {
            genNode(child as AstNode, context);
        }
    }
}

/**
 * 处理element
 * @param node
 * @param context
 */
function genElement(node: AstNode, context: CodegenContext) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    // 做一层处理，将undefined的值设为null
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

/**
 * 将空值设为null
 * @param args
 * @returns
 */
function genNullAble(args: any[]) {
    return args.map((arg) => arg || "null");
}

/**
 * 处理简单表达式 例如 {{message}} 只包含插值，没有文本和element
 * @param node
 * @param context
 */
function genExpression(node: AstNode, context: CodegenContext) {
    const { push } = context;
    push(`${node.content}`);
}

/**
 * 处理文本节点
 * @param node
 * @param context
 */
function genText(node: AstNode, context: CodegenContext) {
    const { push } = context;
    push(`'${node.content}'`);
}
/**
 * 处理插值节点
 * @param node
 * @param context
 */
function genInterpolation(node: any, context: CodegenContext) {
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(")");
}
