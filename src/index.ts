import { baseCompile } from "./compiler-core/src";

// mini-vue的出口
export * from "./runtime-dom";
export * from "./reactivity";
import * as runtimeDom from "./runtime-dom";
import { registerRuntimeCompiler } from "./runtime-dom";

function compileToFunction(template: string) {
    const { code } = baseCompile(template);
    const render = new Function("Vue", code)(runtimeDom);
    return render;
}
registerRuntimeCompiler(compileToFunction);
