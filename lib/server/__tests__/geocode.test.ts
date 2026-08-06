import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { geocodeAddress } from '../geocode';

describe('geocodeAddress', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('returns null for a blank address without calling fetch', async () => {
    const result = await geocodeAddress('   ');
    expect(result).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns coordinates parsed from a successful response', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => [{ lat: '51.0447', lon: '-114.0719' }],
    } as Response);

    const result = await geocodeAddress('1613 9 St SW, Calgary, AB');
    expect(result).toEqual({ latitude: 51.0447, longitude: -114.0719 });
  });

  it('sends a descriptive User-Agent (Nominatim usage policy)', async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => [] } as Response);
    await geocodeAddress('123 Main St');
    const [, init] = vi.mocked(global.fetch).mock.calls[0];
    expect((init?.headers as Record<string, string>)['User-Agent']).toContain('BrewAndTheCity');
  });

  it('returns null when no results are found', async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => [] } as Response);
    const result = await geocodeAddress('an address that does not exist anywhere');
    expect(result).toBeNull();
  });

  it('returns null on a non-ok response rather than throwing', async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: false, status: 503 } as Response);
    const result = await geocodeAddress('123 Main St');
    expect(result).toBeNull();
  });

  it('returns null on a network error rather than throwing', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('network down'));
    const result = await geocodeAddress('123 Main St');
    expect(result).toBeNull();
  });

  it('returns null when the response has malformed coordinates', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => [{ lat: 'not-a-number', lon: '-114.0719' }],
    } as Response);
    const result = await geocodeAddress('123 Main St');
    expect(result).toBeNull();
  });
});
