import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BookingPanel } from './BookingPanel';
import { identity, sampleMap } from '../test/fixtures';
import * as api from '../api';

vi.mock('../api', async () => {
  const actual = await vi.importActual<typeof api>('../api');
  return { ...actual, postBooking: vi.fn(), cancelBooking: vi.fn() };
});

const availableCabana = sampleMap.cabanas[0]; // 1-1, available
const takenByOtherCabana = sampleMap.cabanas[1]; // 1-2, booked, not mine
const mineCabana = sampleMap.cabanas[2]; // 4-1, booked, mine

beforeEach(() => {
  vi.mocked(api.postBooking).mockReset();
  vi.mocked(api.cancelBooking).mockReset();
});

describe('BookingPanel — default state', () => {
  it('shows available/booked counts and how many of mine are booked', () => {
    render(
      <BookingPanel
        cabanas={sampleMap.cabanas}
        identity={identity}
        selected={null}
        onDeselect={() => {}}
        onBooked={() => {}}
        onCancelled={() => {}}
      />,
    );

    expect(screen.getByText('Pick a cabana')).toBeInTheDocument();
    const mineRow = screen.getByText('You have').closest('.summary-row');
    expect(mineRow).toHaveTextContent('1/2');
  });
});

describe('BookingPanel — booking flow', () => {
  it('books in one click and returns to overview', async () => {
    vi.mocked(api.postBooking).mockResolvedValue({
      cabanaId: '1-1',
      room: identity.room,
      guestName: identity.guestName,
      confirmed: true,
    });
    const onBooked = vi.fn();
    const onDeselect = vi.fn();
    const user = userEvent.setup();

    render(
      <BookingPanel
        cabanas={sampleMap.cabanas}
        identity={identity}
        selected={availableCabana}
        onDeselect={onDeselect}
        onBooked={onBooked}
        onCancelled={() => {}}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Confirm booking' }));

    expect(api.postBooking).toHaveBeenCalledWith('1-1', identity);
    expect(onBooked).toHaveBeenCalledWith('1-1');
    expect(onDeselect).toHaveBeenCalled();
  });

  it('shows an inline error and does not call onBooked when booking fails', async () => {
    vi.mocked(api.postBooking).mockRejectedValue(new Error('You already have 2 cabanas booked.'));
    const onBooked = vi.fn();
    const user = userEvent.setup();

    render(
      <BookingPanel
        cabanas={sampleMap.cabanas}
        identity={identity}
        selected={availableCabana}
        onDeselect={() => {}}
        onBooked={onBooked}
        onCancelled={() => {}}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Confirm booking' }));

    expect(await screen.findByText('You already have 2 cabanas booked.')).toBeInTheDocument();
    expect(onBooked).not.toHaveBeenCalled();
  });

  it('offers no booking action once the guest is at the limit', () => {
    const twoMineCabanas = [
      availableCabana,
      { ...takenByOtherCabana, mine: true },
      mineCabana,
    ];

    render(
      <BookingPanel
        cabanas={twoMineCabanas}
        identity={identity}
        selected={availableCabana}
        onDeselect={() => {}}
        onBooked={() => {}}
        onCancelled={() => {}}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Confirm booking' })).not.toBeInTheDocument();
    expect(screen.getByText(/You already have 2 cabanas booked/)).toBeInTheDocument();
  });
});

describe('BookingPanel — a cabana taken by someone else', () => {
  it('shows a plain message with no interactive booking/release action', () => {
    render(
      <BookingPanel
        cabanas={sampleMap.cabanas}
        identity={identity}
        selected={takenByOtherCabana}
        onDeselect={() => {}}
        onBooked={() => {}}
        onCancelled={() => {}}
      />,
    );

    expect(screen.getByText('This cabana is taken')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /release/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});

describe('BookingPanel — release flow (mine)', () => {
  it('releases in one click and returns to overview', async () => {
    vi.mocked(api.cancelBooking).mockResolvedValue({ cabanaId: '4-1', released: true });
    const onCancelled = vi.fn();
    const onDeselect = vi.fn();
    const user = userEvent.setup();

    render(
      <BookingPanel
        cabanas={sampleMap.cabanas}
        identity={identity}
        selected={mineCabana}
        onDeselect={onDeselect}
        onBooked={() => {}}
        onCancelled={onCancelled}
      />,
    );

    expect(screen.getByText('This is your cabana')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Release cabana' }));

    expect(api.cancelBooking).toHaveBeenCalledWith('4-1', identity);
    expect(onCancelled).toHaveBeenCalledWith('4-1');
    expect(onDeselect).toHaveBeenCalled();
  });

  it('shows an inline error when release fails', async () => {
    vi.mocked(api.cancelBooking).mockRejectedValue(new Error('Something went wrong. Please try again.'));
    const onCancelled = vi.fn();
    const user = userEvent.setup();

    render(
      <BookingPanel
        cabanas={sampleMap.cabanas}
        identity={identity}
        selected={mineCabana}
        onDeselect={() => {}}
        onBooked={() => {}}
        onCancelled={onCancelled}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Release cabana' }));

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument();
    expect(onCancelled).not.toHaveBeenCalled();
  });
});
