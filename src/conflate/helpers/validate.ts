import { Status, StatusDiagnostics } from '../../types';

/** does nothing except validate the types */
export const validate = <T extends Status>(x: {
  status: T;
  diagnostics: StatusDiagnostics[T];
}) => x;
