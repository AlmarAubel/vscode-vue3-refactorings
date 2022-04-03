import { hasUncaughtExceptionCaptureCallback } from 'process';

export function vueTypeToTsStype(vueType: string): string {
  switch (vueType) {
    case 'String':
      return 'string';
    case 'Number':
      return 'number';
    case 'Boolean':
      return 'boolean';
    case 'Object':
      return 'object';
    case 'Array':
    case 'Date':
    case 'Function':
    case 'Symbol':
      return vueType;
    default:
      throw new Error('Could not find type');
  }
}
