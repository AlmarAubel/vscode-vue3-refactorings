import { ScriptSetupRefactoring } from "./toScriptSetupAction";
import { toScriptSetupDiagnostic } from "./toScriptSetupDiagnostic";
export default {
  diagnostic: toScriptSetupDiagnostic,
  action: ScriptSetupRefactoring,
};
