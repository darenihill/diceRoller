import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { useNewVersion, mainScriptName } from '../hooks/useNewVersion';

// Owner's pick, 2026-11-03: "The installed app shows a bar when a new version is ready"
function Bar() {
  const v = useNewVersion();
  return v.ready ? <div data-testid="bar"><button onClick={v.later}>Later</button></div> : null;
}

function addScript(name: string) {
  const s = document.createElement('script');
  s.type = 'module';
  s.setAttribute('src', `/assets/${name}`);
  document.head.appendChild(s);
  return s;
}

const page = (name: string) => `<html><head><script type="module" crossorigin src="/assets/${name}"></script></head></html>`;
const comeBack = () => act(() => { document.dispatchEvent(new Event('visibilitychange')); });

afterEach(() => {
  vi.unstubAllGlobals();
  document.head.querySelectorAll('script[type="module"]').forEach(s => s.remove());
});

describe('New version bar', () => {
  it('reads the main script name from a page', () => {
    expect(mainScriptName(page('main-B7xnGLqp.js'))).toBe('main-B7xnGLqp.js');
    expect(mainScriptName('<html></html>')).toBeNull();
  });

  it('shows when the live page has a newer script, and Later hides it', async () => {
    addScript('main-OLD1.js');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(page('main-NEW2.js')) });
    vi.stubGlobal('fetch', fetchMock);
    render(<Bar />);
    expect(screen.queryByTestId('bar')).toBeNull();
    comeBack();
    await waitFor(() => expect(screen.getByTestId('bar')).toBeInTheDocument());
    expect(fetchMock.mock.calls[0][0]).toMatch(/index\.html\?version-check=\d+/);
    expect(fetchMock.mock.calls[0][1]).toEqual({ cache: 'no-store' });
    fireEvent.click(screen.getByText('Later'));
    expect(screen.queryByTestId('bar')).toBeNull();
  });

  it('stays hidden when the live page is the same version', async () => {
    addScript('main-SAME.js');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(page('main-SAME.js')) });
    vi.stubGlobal('fetch', fetchMock);
    render(<Bar />);
    comeBack();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.queryByTestId('bar')).toBeNull();
  });

  it('does nothing without a built script (dev server, tests)', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<Bar />);
    comeBack();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('no signal: no bar and no error', async () => {
    addScript('main-OLD1.js');
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('offline'));
    vi.stubGlobal('fetch', fetchMock);
    render(<Bar />);
    comeBack();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.queryByTestId('bar')).toBeNull();
  });

  it('the offline worker lets the check reach the network', () => {
    const sw = readFileSync('public/sw.js', 'utf8');
    expect(sw).toMatch(/searchParams\.has\('version-check'\)\) return;/);
  });
});
