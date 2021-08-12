export function then<T, R = any>(
  data: T | Promise<T>,
  fn: (data: T) => R,
): R | Promise<R> {
  const p = data as Promise<T>
  if (p && typeof p.then === 'function') {
    return p.then(fn)
  } else {
    return fn(data as T)
  }
}
