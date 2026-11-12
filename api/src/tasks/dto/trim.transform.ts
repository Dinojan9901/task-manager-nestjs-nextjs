import type { TransformFnParams } from 'class-transformer';

/** Removes spaces at the start and end of strings, so "   " counts as empty. */
export const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;
