import React from 'react';
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from '../App';
import { ShareModal } from '../components/modals/ShareModal';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

const nav = navigator as unknown as Record<string, unknown>;
const secure = Object.getOwnPropertyDescriptor(window, 'isSecureContext');

afterEach(() => {
  delete nav.share;
  delete nav.canShare;
  Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  if (secure) Object.defineProperty(window, 'isSecureContext', secure);
  vi.restoreAllMocks();
});

function openShare() {
  localStorage.clear();
  render(<App />);
  fireEvent.click(screen.getAllByRole('button', { name: /menu/i })[0]);
  fireEvent.click(screen.getByText('Share'));
}

describe('Share', () => {
  it('opens the share sheet with the same link', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    nav.share = share;
    openShare();
    expect(share).toHaveBeenCalledTimes(1);
    const data = share.mock.calls[0][0] as ShareData;
    expect(data.url).toMatch(/#share=/);
    await act(async () => {});
    expect(screen.queryByText('Share Link')).toBeNull();
  });

  it('does nothing else when the sheet is closed', async () => {
    nav.share = vi.fn().mockRejectedValue(Object.assign(new Error('closed'), { name: 'AbortError' }));
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    openShare();
    await act(async () => {});
    expect(writeText).not.toHaveBeenCalled();
    expect(screen.queryByText('Share Link')).toBeNull();
    expect(screen.queryByText(/copied to clipboard/)).toBeNull();
  });

  it('copies the link when there is no share sheet', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    openShare();
    await waitFor(() => expect(screen.getByText(/copied to clipboard/)).toBeInTheDocument());
    expect(writeText.mock.calls[0][0]).toMatch(/#share=/);
  });

  it('shows the link box when the sheet fails for another reason', async () => {
    nav.share = vi.fn().mockRejectedValue(Object.assign(new Error('nope'), { name: 'NotAllowedError' }));
    openShare();
    await waitFor(() => expect(screen.getByText('Share Link')).toBeInTheDocument());
  });
});

describe('Share link box', () => {
  it('Copy copies the link and says Copied', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<ShareModal url="https://example.test/#share=abc" onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalledWith('https://example.test/#share=abc');
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });

  it('opens fresh after Done, even for the same link', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockResolvedValue(undefined) }, configurable: true });
    const url = 'https://example.test/#share=abc';
    const { rerender } = render(<ShareModal url={url} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await screen.findByRole('button', { name: 'Copied' });
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    rerender(<ShareModal url={null} onClose={() => {}} />);
    rerender(<ShareModal url={url} onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
  });

  it('selects the link when copying is refused', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockRejectedValue(new Error('no')) }, configurable: true });
    render(<ShareModal url="https://example.test/#share=abc" onClose={() => {}} />);
    const input = screen.getByLabelText(/Copy this link/) as HTMLInputElement;
    const select = vi.spyOn(input, 'select');
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() => expect(select).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
  });
});
