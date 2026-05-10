import { describe, it, expect, vi } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App', () => {
  beforeEach(() => {

    const MockResizeObserver = vi.fn(class {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    })
    global.ResizeObserver = MockResizeObserver
  })

  it('mounts renders properly', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('La Rampa')
  })
})
