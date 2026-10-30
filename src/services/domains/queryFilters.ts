/**
 * The PostgREST filter methods shared query helpers chain. Each returns the same builder,
 * so a helper typed `<Q extends FilterableQuery>(q: Q) => Q` keeps the caller's builder type.
 */
export interface FilterableQuery {
  eq(column: string, value: unknown): this;
  neq(column: string, value: unknown): this;
  in(column: string, values: readonly unknown[]): this;
  not(column: string, operator: string, value: unknown): this;
  or(filters: string): this;
  ilike(column: string, pattern: string): this;
  limit(count: number): this;
}
