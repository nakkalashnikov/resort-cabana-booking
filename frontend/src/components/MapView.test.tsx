import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MapView } from './MapView';
import { sampleMap } from '../test/fixtures';

describe('MapView', () => {
  it('renders one focusable cabana tile per cabana with the right available/booked/mine state', () => {
    render(<MapView map={sampleMap} selectedCabanaId={null} onSelectCabana={() => {}} />);

    const available = screen.getByRole('button', { name: 'Cabana 1-1, available' });
    const booked = screen.getByRole('button', { name: 'Cabana 1-2, booked' });
    const mine = screen.getByRole('button', { name: 'Cabana 4-1, yours' });

    expect(available).toHaveClass('state-available');
    expect(booked).toHaveClass('state-booked');
    expect(mine).toHaveClass('state-mine');
  });

  it('calls onSelectCabana with the cabana id when a tile is clicked', async () => {
    const user = userEvent.setup();
    const onSelectCabana = vi.fn();
    render(<MapView map={sampleMap} selectedCabanaId={null} onSelectCabana={onSelectCabana} />);

    await user.click(screen.getByRole('button', { name: 'Cabana 1-1, available' }));

    expect(onSelectCabana).toHaveBeenCalledWith('1-1');
  });

  it('marks the selected cabana with the is-selected class', () => {
    render(<MapView map={sampleMap} selectedCabanaId="1-2" onSelectCabana={() => {}} />);

    expect(screen.getByRole('button', { name: 'Cabana 1-2, booked' })).toHaveClass('is-selected');
  });
});
