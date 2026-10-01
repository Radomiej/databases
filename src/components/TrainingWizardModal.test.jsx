import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TrainingWizardModal from './TrainingWizardModal.jsx';

describe('kreator treningu', () => {
  it('po wyborze parametrów generuje zestaw i przekazuje gotowy sandbox', async () => {
    const generate = vi.fn().mockResolvedValue({ version: 1, tasks: [] });
    const onGenerate = vi.fn();
    render(<TrainingWizardModal open onClose={() => {}} onGenerate={onGenerate} generate={generate} />);
    fireEvent.change(screen.getByLabelText('Kod zestawu'), { target: { value: 'KLASA-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Utwórz sandbox' }));
    await waitFor(() => expect(onGenerate).toHaveBeenCalledWith({ version: 1, tasks: [] }));
    expect(generate).toHaveBeenCalledWith(expect.objectContaining({ seed: 'KLASA-1', start: 1, end: 5 }));
  });

  it('nie uruchamia zestawu po anulowaniu trwającego generowania', async () => {
    let complete;
    const generate = () => new Promise((resolve) => { complete = resolve; });
    const onGenerate = vi.fn();
    const { rerender } = render(<TrainingWizardModal open onClose={() => {}} onGenerate={onGenerate} generate={generate} />);
    fireEvent.click(screen.getByRole('button', { name: 'Utwórz sandbox' }));
    rerender(<TrainingWizardModal open={false} onClose={() => {}} onGenerate={onGenerate} generate={generate} />);
    complete({ tasks: [] });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(onGenerate).not.toHaveBeenCalled();
  });
});
