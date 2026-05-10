import { effectScope } from 'vue'

/**
 * Run a composable in a reactive scope outside a component.
 * Suitable for composables that only use ref/computed/watch (no lifecycle hooks).
 */
export function withSetup<T>(composable: () => T): T {
  let result!: T
  effectScope().run(() => {
    result = composable()
  })
  return result
}
