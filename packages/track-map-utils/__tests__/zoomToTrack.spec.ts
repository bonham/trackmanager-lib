import { describe, test, expect, vi, beforeEach } from 'vitest'
import { zoomToTrack } from '@bonham/track-map-utils'

const { mockIsEmpty } = vi.hoisted(() => ({ mockIsEmpty: vi.fn() }))

vi.mock('ol/extent', () => ({ isEmpty: mockIsEmpty }))
vi.mock('ol/source/Vector', () => ({ default: vi.fn() }))
vi.mock('ol/Feature', () => ({ default: vi.fn() }))

describe('zoomToTrack', () => {
  const mockFit = vi.fn()
  const mockGetExtent = vi.fn()

  const mockSource = { getExtent: mockGetExtent } as never
  const mockMap = {
    getView: () => ({ fit: mockFit }),
  } as never

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetExtent.mockReturnValue([0, 0, 100, 100])
  })

  test('calls fit twice with correct options when extent is non-empty', () => {
    mockIsEmpty.mockReturnValue(false)
    zoomToTrack(mockMap, mockSource)
    expect(mockFit).toHaveBeenCalledTimes(2)
    expect(mockFit).toHaveBeenNthCalledWith(1, [0, 0, 100, 100], {
      padding: [50, 50, 50, 50],
      maxZoom: 17,
      duration: 1000,
    })
    expect(mockFit).toHaveBeenNthCalledWith(2, [0, 0, 100, 100], {
      padding: [40, 40, 40, 40],
      duration: 800,
    })
  })

  test('does not call fit when extent is empty', () => {
    mockIsEmpty.mockReturnValue(true)
    zoomToTrack(mockMap, mockSource)
    expect(mockFit).not.toHaveBeenCalled()
  })

  test('does not call fit when extent is null', () => {
    mockGetExtent.mockReturnValue(null)
    mockIsEmpty.mockReturnValue(false)
    zoomToTrack(mockMap, mockSource)
    expect(mockFit).not.toHaveBeenCalled()
  })
})
