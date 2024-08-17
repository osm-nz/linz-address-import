import type { Status, StatusDiagnostics } from '../../types.js';

/** does nothing except validate the types */
export const validate = <T extends Status>(x: {
  status: T;
  diagnostics: StatusDiagnostics[T];
}) => x;
