import { h } from "../../lib/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";

export const App = {
    name: "App",
    render() {
        return h(
            "div",
            {
                id: "root",
                class: ["red", "hard"],
            },
            [
                h("div", {}, "hi " + this.msg),
                h(Foo, {
                    onAdd(a, b) {
                        console.log("onAdd", a, b);
                    },
                    onAddFoo(a, b) {
                        console.log("onAddFoo", a, b);
                    },
                }),
            ]
            // "hi," + this.msg
            // "hi,mini-vue",
            // [
            //     h("p", { class: "red" }, "hi"),
            //     h("p", { class: "blue" }, "mini-vue"),
            // ]
        );
    },
    setup() {
        return {
            msg: "mini-vue--haha",
        };
    },
};
