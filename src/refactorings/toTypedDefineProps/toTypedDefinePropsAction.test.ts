import { assert, expect, test } from 'vitest';
import { TypedDefinePropsAction } from './toTypedDefinePropsAction';

const definePropsCode = `
defineProps({
    productId: {
        type: String,
        required: true
    },
    antwoord: {
        type: String,
        required: true,
        default:'Sheep',
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

//Ook nog andere cases fixen zie -> https://vuejs.org/guide/components/props.html#prop-validation
test('To typed define props test', () => {
  const action = new TypedDefinePropsAction();
  const res = action.visitNodes(definePropsCode);
  expect(res.getText()).toEqual(
    `defineProps<{ productId: string; antwoord: string; vraag?: VragenProductVraagDefinitiesProductVraagDto; vragen?: string }>();`
  );
});

// test("Doe iets2", () => {
//   doeIets(definePropsCodeWithTypeDeclaration, new Range(1, 1, 1, 1));
// });
