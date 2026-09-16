import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TableBuilderModal from './TableBuilderModal.jsx';

describe('TableBuilderModal', () => {
  it('locks page scrolling while open', () => {
    document.body.style.overflow = 'auto';
    const { unmount } = render(<TableBuilderModal open onClose={vi.fn()} onCreate={vi.fn()} />);

    expect(document.body.style.overflow).toBe('hidden');

    unmount();
  });
});
