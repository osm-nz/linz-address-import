/**
 * we expect `addr:street` to exactly match the LINZ dataset,
 * except for the cases listed here, where we allow an inconsistency.
 *
 * This list should be kept to an absolute minimum, ideally we don't
 * allow any exceptions.
 */
export const normaliseStreet = (street: string | undefined) =>
  street?.replace(/\bSaint\b/, 'St');
