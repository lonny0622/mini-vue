import { NodeTypes } from "./ast";

const enum TagType {
    START,
    END,
}

export interface Context {
    source: string;
}

export function baseParse(content: string) {
    const context = createParserContext(content);
    return createRoot(parseChildren(context, []));
}

function parseChildren(context: Context, ancestors: string[]) {
    const nodes: any[] = [];
    while (!isEnd(context, ancestors)) {
        let node;
        const s = context.source;
        if (s.startsWith("{{")) {
            node = parseInterpolation(context);
        } else if (s[0] === "<") {
            if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors);
            }
        }

        if (!node) {
            node = parseText(context);
        }

        nodes.push(node);
    }

    return nodes;
}

function isEnd(context: Context, ancestors: string[]) {
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

function parseText(context: Context): any {
    let endIndex = context.source.length;
    let endTokens = ["<", "{{"];
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

function parseTextData(context: Context, length: number) {
    const content = context.source.slice(0, length);
    // 2.推进
    advanceBy(context, content.length);
    return content;
}

function parseElement(context: Context, ancestors: string[]) {
    const element: any = parseTag(context, TagType.START);
    ancestors.push(element.tag);
    element.children = parseChildren(context, ancestors);
    ancestors.pop();
    if (isStartsWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, TagType.END);
    } else {
        throw new Error(`缺少结束标签:${element.tag}`);
    }

    return element;
}

function isStartsWithEndTagOpen(source: string, tag: string) {
    return (
        source.startsWith("</") &&
        source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
    );
}

function parseTag(context: Context, type: TagType) {
    // 1.解析tag

    const match: any = /^<\/?([a-z]*)/i.exec(context.source);
    const tag = match[1];
    // 2.删除处理完的代码
    advanceBy(context, match[0].length);
    advanceBy(context, 1);

    if (type === TagType.END) return;

    return {
        type: NodeTypes.ELEMENT,
        tag,
    };
}

function parseInterpolation(context: Context) {
    // 解析 {{message}}

    const openDelimiter = "{{";
    const closeDelimiter = "}}";

    const closeIndex = context.source.indexOf(
        closeDelimiter,
        openDelimiter.length
    );

    advanceBy(context, openDelimiter.length);

    const rawContentLength = closeIndex - openDelimiter.length;
    const rawContent = parseTextData(context, rawContentLength);
    const content = rawContent.trim();
    advanceBy(context, closeDelimiter.length);
    return {
        type: NodeTypes.INTERPOLATION,
        content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: content,
        },
    };
}

function advanceBy(context: Context, length: number) {
    context.source = context.source.slice(length);
}

function createRoot(children: any) {
    return {
        children,
        type: NodeTypes.ROOT,
    };
}

function createParserContext(content: string): any {
    return {
        source: content,
    };
}
