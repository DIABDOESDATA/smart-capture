import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TemplateManager } from '@/components/templates/TemplateManager';
import { PhotographyStandardsEditor } from '@/components/templates/PhotographyStandardsEditor';
import { getDefaultTemplates } from '@/services/templates/defaultTemplates';
import { CaptureTemplate } from '@/types/template';
import { PhotographyStandard } from '@/types/capture';

const mocks = vi.hoisted(() => ({ load: vi.fn(), persist: vi.fn(), get: vi.fn(), put: vi.fn() }));
vi.mock('@/services/templates/repository', () => ({
  loadTemplates: mocks.load,
  persistTemplates: mocks.persist,
}));
vi.mock('@/services/storage/indexedDb', () => ({ getSetting: mocks.get, putSetting: mocks.put }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

it('waits for saved templates before permitting ratio edits', async () => {
  let resolve!: (value: CaptureTemplate[]) => void;
  mocks.load.mockReturnValue(
    new Promise<CaptureTemplate[]>((r) => {
      resolve = r;
    })
  );
  mocks.get.mockResolvedValue(undefined);
  mocks.persist.mockResolvedValue(undefined);
  render(<TemplateManager dealershipId="test" onBack={vi.fn()} />);
  expect(screen.getByRole('status')).toHaveTextContent('Loading your saved templates');
  expect(screen.queryByLabelText('Template aspect ratio')).not.toBeInTheDocument();
  resolve(getDefaultTemplates('test'));
  const ratio = await screen.findByLabelText('Template aspect ratio');
  fireEvent.change(ratio, { target: { value: '16:9' } });
  fireEvent.click(screen.getAllByRole('button', { name: 'Required' })[0]);
  fireEvent.click(screen.getByRole('button', { name: 'Save templates' }));
  await waitFor(() => expect(mocks.persist).toHaveBeenCalledOnce());
  expect(mocks.persist.mock.calls[0][1][0]).toMatchObject({
    aspectRatio: '16:9',
    aspectRatioOverride: true,
  });
  expect(mocks.persist.mock.calls[0][1][0].shots[0].isRequired).toBe(false);
});

it('disables standards editing until its independent stored settings load', async () => {
  let resolve!: (value: PhotographyStandard | undefined) => void;
  mocks.get.mockReturnValue(
    new Promise<PhotographyStandard | undefined>((r) => {
      resolve = r;
    })
  );
  mocks.put.mockResolvedValue(undefined);
  render(<PhotographyStandardsEditor dealer="test" />);
  fireEvent.click(screen.getByText('Dealership photography standard'));
  const ratio = screen.getByLabelText('Preferred ratio');
  expect(ratio).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Save dealership standard' })).toBeDisabled();
  resolve(undefined);
  await waitFor(() => expect(ratio).toBeEnabled());
  fireEvent.change(ratio, { target: { value: '16:9' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save dealership standard' }));
  await waitFor(() =>
    expect(mocks.put).toHaveBeenCalledWith(
      'standard:test',
      expect.objectContaining({ aspectRatio: '16:9' })
    )
  );
});
