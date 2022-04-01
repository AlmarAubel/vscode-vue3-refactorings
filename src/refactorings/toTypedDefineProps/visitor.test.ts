import { assert, expect, test } from "vitest";
import { Range } from "vscode";
import { doeIets } from "./visitor";

const definePropsCode = `
defineProps({
    productId: {
        type: String,
        required: true
    },
    vraag: {
        type: Object as PropType<VragenProductVraagDefinitiesProductVraagDto>,
        required: true
    },
    vragen: String,  
});`;
const definePropsCodeWithTypeDeclaration = `
const x = {
    productId: {
        type: String,
        required: true
    },
    vraag: {
        type: Object as PropType<VragenProductVraagDefinitiesProductVraagDto>,
        required: true
    },
    vragen: String,  
}
defineProps(x);
aap(1,2);`;

test("Doe iets", () => {
  doeIets(definePropsCode, new Range(1, 1, 2, 3));
});

test("Doe iets2", () => {
  doeIets(text2, new Range(1, 1, 1, 1));
});
