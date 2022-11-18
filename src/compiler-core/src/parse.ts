import { NodeTypes } from "./ast";

const enum TagType {
    START,
    END,
}

export interface ParserContext {
    source: string;
}

export interface ParserNode {
    type: NodeTypes;
    content?: string | ParserNode;
    tag?: string;
    children?: (ParserNode | string)[];
    helpers?: Symbol[];
    codegenNode?: any;
    props?: any;
}

/**
 * 分析模块入口
 * @param content
 * @returns
 */
export function baseParse(content: string) {
    // 创建ParserContext
    const context = createParserContext(content);
    return createRoot(parseChildren(context, []));
}
/**
 * 分析子节点
 * @param context
 * @param ancestors 祖先节点
 * @returns
 */
function parseChildren(context: ParserContext, ancestors: string[]) {
    const nodes: ParserNode[] = [];
    while (!isEnd(context, ancestors)) {
        let node;
        const s = context.source;
        if (s.startsWith("{{")) {
            // 提取差值
            node = parseInterpolation(context);
        } else if (s[0] === "<") {
            // 处理Dom
            if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors);
            }
        }

        // 处理文本节点
        if (!node) {
            node = parseText(context);
        }

        nodes.push(node);
    }

    return nodes;
}

/**
 * 判断是否应该结束解析
 * @param context
 * @param ancestors
 * @returns
 */
function isEnd(context: ParserContext, ancestors: string[]) {
    // 停止条件
    // 1. 当source没有值得时候
    // 2. 当遇到结束标签的时候
    const s = context.source;

    if (s.startsWith("</")) {
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const tag = ancestors[i];
            if (isStartsWithEndTagOpen(s, tag)) {
                return true;
            }
        }
    }
    return !s;
}
/**
 * 处理文本节点
 * @param context
 * @returns
 */
function parseText(context: ParserContext): ParserNode {
    let endIndex = context.source.length;
    let endTokens = ["<", "{{"];
    // 获取结束的index,当碰到"<"(DOM元素) "{{"（插值）时意味着文本结束
    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i]);
        if (index !== -1 && endIndex > index) {
            endIndex = index;
        }
    }

    // 1.获取当前content
    const content = parseTextData(context, endIndex);
    return {
        type: NodeTypes.TEXT,
        content,
    };
}

/**
 * 提取指定长度的文本，并删除原context对应的部分
 * @param context
 * @param length
 * @returns
 */
function parseTextData(context: ParserContext, length: number) {
    const content = context.source.slice(0, length);
    // 2.推进
    advanceBy(context, content.length);
    return content;
}

function parseElement(context: ParserContext, ancestors: string[]): ParserNode {
    // 获取
    const element: any = parseTag(context, TagType.START);
    // 将对应的tag值压入栈顶
    ancestors.push(element.tag);
    // 继续处理子元素
    element.children = parseChildren(context, ancestors);
    // 弹出tag值
    ancestors.pop();
    // 检测是否含有结束标签
    if (isStartsWithEndTagOpen(context.source, element.tag)) {
        // 有的话将其删除
        parseTag(context, TagType.END);
    } else {
        // 没有则报错
        throw new Error(`缺少结束标签:${element.tag}`);
    }

    return element;
}
/**
 * 检测是否为指定标签的结束标签
 * @param source
 * @param tag
 * @returns
 */
function isStartsWithEndTagOpen(source: string, tag: string) {
    return (
        source.startsWith("</") &&
        source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
    );
}
/**
 * 解析tag并在原context上删除对应部分
 * @param context
 * @param type
 * @returns
 */
function parseTag(context: ParserContext, type: TagType) {
    // 1.解析tag
    const match: any = /^<\/?([a-z]*)/i.exec(context.source);
    const tag = match[1] as string;
    // 2.删除处理完的代码
    advanceBy(context, match[0].length);
    advanceBy(context, 1);

    // 如果是结束标签则不用返回值
    if (type === TagType.END) return;

    return {
        type: NodeTypes.ELEMENT,
        tag,
    };
}
/**
 * 解析 插值如{{message}}
 * @param context
 * @returns
 */
function parseInterpolation(context: ParserContext): ParserNode {
    const openDelimiter = "{{";
    const closeDelimiter = "}}";

    const closeIndex = context.source.indexOf(
        closeDelimiter,
        openDelimiter.length
    );
    // 去除 {{
    advanceBy(context, openDelimiter.length);
    // 获取变量名的长度
    const rawContentLength = closeIndex - openDelimiter.length;
    // 获取变量名的值
    const rawContent = parseTextData(context, rawContentLength);
    // 去除前后空格
    const content = rawContent.trim();
    // 去除}}
    advanceBy(context, closeDelimiter.length);
    return {
        type: NodeTypes.INTERPOLATION,
        content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: content,
        },
    };
}

/**
 * 进一步处理 用于删除已经处理完的内容
 * @param context
 * @param length
 */
function advanceBy(context: ParserContext, length: number) {
    context.source = context.source.slice(length);
}

/**
 * 创建根节点
 * @param children
 * @returns
 */
function createRoot(children: ParserNode[]): ParserNode {
    return {
        children,
        type: NodeTypes.ROOT,
    };
}

/**
 * 创建context
 * @param content
 * @returns
 */
function createParserContext(content: string): ParserContext {
    return {
        source: content,
    };
}
