/**
 * Pathname configuration type.
 * V1 paths: src/v1/utilities/pathnames.ts
 * V2 paths: src/v2/utilities/pathnames.ts
 */
export interface PathnameConfig<T extends (...args: never[]) => string = () => string> {
  link: T;
  path: string;
  title: string;
}
