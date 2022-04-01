import { assert, expect, test } from "vitest";
//import { Range } from "vscode";
import { doeIets } from "./visitor";

const definePropsCode = `
defineProps({
    productId: {
        type: String,
        required: true
    },
    vraag: {
        type: Object as PropType<VragenProductVraagDefinitiesProductVraagDto>,
        required: false
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
  doeIets(definePropsCode);
});

// test("Doe iets2", () => {
//   doeIets(definePropsCodeWithTypeDeclaration, new Range(1, 1, 1, 1));
// });
