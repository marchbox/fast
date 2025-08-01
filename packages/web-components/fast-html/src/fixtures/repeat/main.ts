import { RenderableFASTElement, TemplateElement } from "@microsoft/fast-html";
import { FASTElement, observable } from "@microsoft/fast-element";

class TestElement extends FASTElement {
    @observable
    list: Array<string> = ["Foo", "Bar"];

    parent: string = "Bat";
}
RenderableFASTElement(TestElement).defineAsync({
    name: "test-element",
    templateOptions: "defer-and-hydrate",
});

class TestElementInnerWhen extends FASTElement {
    @observable
    list: Array<any> = [
        {
            show: true,
            text: "Foo",
        },
        {
            show: false,
            text: "Bar",
        },
    ];
}
RenderableFASTElement(TestElementInnerWhen).defineAsync({
    name: "test-element-inner-when",
    templateOptions: "defer-and-hydrate",
});

TemplateElement.define({
    name: "f-template",
});
