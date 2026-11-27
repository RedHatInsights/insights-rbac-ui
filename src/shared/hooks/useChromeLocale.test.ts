import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useChromeLocale } from './useChromeLocale';

const mockUseChrome = vi.hoisted(() => vi.fn());

vi.mock('@redhat-cloud-services/frontend-components/useChrome', () => ({
  default: mockUseChrome,
}));

describe('useChromeLocale', () => {
  it('returns the language resolved by Chrome', () => {
    mockUseChrome.mockReturnValue({ language: 'zh-CN' });
    expect(renderHook(useChromeLocale).result.current).toBe('zh-CN');
  });

  it('defaults to English when Chrome has no language', () => {
    mockUseChrome.mockReturnValue({});
    expect(renderHook(useChromeLocale).result.current).toBe('en');
  });

  it('defaults to English when Chrome is unavailable', () => {
    mockUseChrome.mockReturnValue(undefined);
    expect(renderHook(useChromeLocale).result.current).toBe('en');
  });
});
