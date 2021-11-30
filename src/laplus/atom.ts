export type AtomListener<Value> = (value: Value) => void

export type AtomUnsubscribe = () => void

export type Atom<Value> = {
  readonly value: Value
  set: (value: Value) => void
  listen: (listener: AtomListener<Value>) => AtomUnsubscribe
}

export function createAtom<Value>(initialValue: Value): Atom<Value> {
  let value = initialValue
  let listeners = new Set<AtomListener<Value>>()

  function set(newValue: Value) {
    value = newValue
    listeners.forEach((listener) => listener(newValue))
  }

  function listen(listener: AtomListener<Value>) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  return {
    get value() {
      return value
    },
    set,
    listen,
  }
}
