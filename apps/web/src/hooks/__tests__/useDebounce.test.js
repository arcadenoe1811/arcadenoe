import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '../useDebounce'

describe('useDebounce', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('retorna el valor inicial inmediatamente', () => {
    const { result } = renderHook(() => useDebounce('maz', 300))
    expect(result.current).toBe('maz')
  })

  it('actualiza el valor después del retraso', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ valor }) => useDebounce(valor, 300), {
      initialProps: { valor: 'maz' },
    })

    rerender({ valor: 'maza' })
    expect(result.current).toBe('maz') // aún no actualiza

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe('maza') // ahora sí
  })

  it('reinicia el temporizador si el valor cambia antes del retraso', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ valor }) => useDebounce(valor, 300), {
      initialProps: { valor: 'm' },
    })

    rerender({ valor: 'ma' })
    act(() => {
      vi.advanceTimersByTime(200)
    })
    rerender({ valor: 'maz' })
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe('m') // el primer cambio nunca se aplicó

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(result.current).toBe('maz')
  })

  it('usa 300 ms por defecto', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ valor }) => useDebounce(valor), {
      initialProps: { valor: 'a' },
    })

    rerender({ valor: 'b' })
    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(result.current).toBe('a')
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('b')
  })
})
