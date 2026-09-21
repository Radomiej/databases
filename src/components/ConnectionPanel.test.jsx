import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ConnectionPanel from './ConnectionPanel.jsx';

const connection = { host: '127.0.0.1', port: 3306, database: 'inf03_lab', user: 'root', password: '' };

describe('ConnectionPanel', () => {
  it('exposes schema changes as a separate MySQL capability', () => {
    const onAllowSchemaMutationsChange = vi.fn();

    render(
      <ConnectionPanel
        connection={connection}
        onChange={vi.fn()}
        onTest={vi.fn()}
        schemaMutationsAvailable
        onAllowSchemaMutationsChange={onAllowSchemaMutationsChange}
      />,
    );

    const checkbox = screen.getByLabelText('Zezwól na zmiany struktury');
    expect(checkbox).toBeEnabled();
    fireEvent.click(checkbox);
    expect(onAllowSchemaMutationsChange).toHaveBeenCalledWith(true);
  });
});
