export type Awaited<T> = T extends PromiseLike<infer U>
  ? Awaited<U>
  : T

export type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never
