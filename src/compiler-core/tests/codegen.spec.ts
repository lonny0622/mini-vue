import { AstNode } from "../src/ast";
import { generate } from "../src/codegen";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";
import { transformElement } from "../src/transforms/transformElement";
import { transformExpression } from "../src/transforms/transformExpression";
import { transformText } from "../src/transforms/transformText";

describe("codegen", () => {
    it("string", () => {
        const ast = baseParse("hi");
        transform(ast);
        const { code } = generate(ast as AstNode);
        // 快照
        // 1. 抓bug
        // 2. 有意的，需主动更新快照
        expect(code).toMatchSnapshot();
    });
    it("interpolation", () => {
        const ast = baseParse("{{message}}");
        transform(ast, {
            nodeTransforms: [transformExpression],
        });
        const { code } = generate(ast as AstNode);
        expect(code).toMatchSnapshot();
    });
    it("element", () => {
        const ast: any = baseParse("<div>hi, {{message}}</div>");
        transform(ast, {
            nodeTransforms: [
                transformExpression,
                transformElement,
                transformText,
            ],
        });
        const { code } = generate(ast);
        expect(code).toMatchSnapshot();
    });
});
