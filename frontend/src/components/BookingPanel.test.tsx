import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BookingPanel } from './BookingPanel';
import { sampleMap } from '../test/fixtures';
import * as api from '../api';

vi.mock('../api', async () => {
  const actual = await vi.importActual<typeof api>('../api');
  return { ...actual, postBooking: vi.fn(), cancelBooking: vi.fn() };
});

const availableCabana = sampleMap.cabanas[0]; // 1-1, available
const bookedCabana = sampleMap.cabanas[1]; // 1-2, booked by Alice Smith / room 101

beforeEach(() => {
  vi.mocked(api.postBooking).mockReset();
  vi.mocked(api.cancelBooking).mockReset();
});

describe('BookingPanel — default state', () => {
  it('shows available/booked counts and the hint when nothing is selected', () => {
    render(
      <BookingPanel
        cabanas={sampleMap.cabanas}
        selected={null}
        onDeselect={() => {}}
        onBooked={() => {}}
        onCancelled={() => {}}
      />,
    );

    expect(screen.getByText('Pick a cabana')).toBeInTheDocument();
    const availableRow = screen.getByText('Available now').closest('.summary-row');
    expect(availableRow).toHaveTextContent('1');
    const totalRow = screen.getByText('Total cabanas').closest('.summary-row');
    expect(totalRow).toHaveTextContent('2');
  });
});

describe('BookingPanel — booking flow', () => {
  it('books successfully with a valid room/name and calls onBooked', async () => {
    vi.mocked(api.postBooking).mockResolvedValue({
      cabanaId: '1-1',
      room: '102',
      guestName: 'Bob Jones',
      confirmed: true,
    });
    const onBooked = vi.fn();
    const user = userEvent.setup();

    render(
      <BookingPanel
        cabanas={sampleMap.cabanas}
        selected={availableCabana}
        onDeselect={() => {}}
        onBooked={onBooked}
        onCancelled={() => {}}
      />,
    );

    await user.type(screen.getByLabelText('Room number'), '102');
    await user.type(screen.getByLabelText('Guest name'), 'Bob Jones');
    await user.click(screen.getByRole('button', { name: 'Confirm booking' }));

    expect(api.postBooking).toHaveBeenCalledWith('1-1', '102', 'Bob Jones');
    expect(onBooked).toHaveBeenCalledWith('1-1', '102', 'Bob Jones');
  });

  it('shows an inline error and does not call onBooked when the guest is invalid', async () => {
    vi.mocked(api.postBooking).mockRejectedValue(
      new Error('No guest found with that room number and name.'),
    );
    const onBooked = vi.fn();
    const user = userEvent.setup();

    render(
      <BookingPanel
        cabanas={sampleMap.cabanas}
        selected={availableCabana}
        onDeselect={() => {}}
        onBooked={onBooked}
        onCancelled={() => {}}
      />,
    );

    await user.type(screen.getByLabelText('Room number'), '999');
    await user.type(screen.getByLabelText('Guest name'), 'Nobody');
    await user.click(screen.getByRole('button', { name: 'Confirm booking' }));

    expect(await screen.findByText('No guest found with that room number and name.')).toBeInTheDocument();
    expect(onBooked).not.toHaveBeenCalled();
  });
});

describe('BookingPanel — cancel flow', () => {
  it('shows the guest card for a booked cabana and releases it on confirm', async () => {
    vi.mocked(api.cancelBooking).mockResolvedValue({ cabanaId: '1-2', released: true });
    const onCancelled = vi.fn();
    const user = userEvent.setup();

    render(
      <BookingPanel
        cabanas={sampleMap.cabanas}
        selected={bookedCabana}
        onDeselect={() => {}}
        onBooked={() => {}}
        onCancelled={onCancelled}
      />,
    );

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Room 101')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Release cabana' }));
    await user.click(screen.getByRole('button', { name: 'Confirm release' }));

    expect(api.cancelBooking).toHaveBeenCalledWith('1-2', '101', 'Alice Smith');
    expect(onCancelled).toHaveBeenCalledWith('1-2');
  });
});
