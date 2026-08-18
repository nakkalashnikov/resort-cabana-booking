using System.Collections.Concurrent;
using ResortMap.Api.Models;

namespace ResortMap.Api.Services;

public class BookingService
{
    private readonly string[] _grid;
    private readonly ConcurrentDictionary<string, Cabana> _cabanas;
    private readonly List<Guest> _guests;

    public BookingService(string[] grid, List<Cabana> cabanas, List<Guest> guests)
    {
        _grid = grid;
        _cabanas = new ConcurrentDictionary<string, Cabana>(cabanas.ToDictionary(c => c.Id));
        _guests = guests;
    }

    public int Width => _grid.Length == 0 ? 0 : _grid[0].Length;
    public int Height => _grid.Length;
    public string[] Grid => _grid;

    public IReadOnlyCollection<Cabana> Cabanas => _cabanas.Values.ToList();

    // Guards every read-check-write across TryBook/TryCancel. A per-cabana lock isn't enough
    // once TryBook has to check state on OTHER cabanas too (one-cabana-per-guest), so this is
    // a single coarse lock for the whole service instead — fine at this scale.
    private readonly object _lock = new();

    public enum BookingOutcome
    {
        Success,
        CabanaNotFound,
        AlreadyBooked,
        GuestNotFound,
        GuestAlreadyHasCabana
    }

    public enum CancelOutcome
    {
        Success,
        CabanaNotFound,
        NotBooked,
        GuestMismatch
    }

    private static bool Matches(string? a, string b) =>
        string.Equals(a?.Trim(), b.Trim(), StringComparison.OrdinalIgnoreCase);

    public (BookingOutcome Outcome, Cabana? Cabana) TryBook(string cabanaId, string room, string guestName)
    {
        lock (_lock)
        {
            if (!_cabanas.TryGetValue(cabanaId, out var cabana))
            {
                return (BookingOutcome.CabanaNotFound, null);
            }

            if (!cabana.Available)
            {
                return (BookingOutcome.AlreadyBooked, cabana);
            }

            var isValidGuest = _guests.Any(g => Matches(g.Room, room) && Matches(g.GuestName, guestName));

            if (!isValidGuest)
            {
                return (BookingOutcome.GuestNotFound, null);
            }

            // One cabana per guest at a time — a room+name pair identifies a single guest,
            // and a guest holding two cabanas simultaneously isn't a real scenario worth
            // supporting just because the spec doesn't explicitly forbid it.
            var alreadyHoldsACabana = _cabanas.Values.Any(c =>
                !c.Available && Matches(c.BookedRoom, room) && Matches(c.BookedGuestName, guestName));

            if (alreadyHoldsACabana)
            {
                return (BookingOutcome.GuestAlreadyHasCabana, null);
            }

            cabana.Available = false;
            cabana.BookedRoom = room;
            cabana.BookedGuestName = guestName;
            return (BookingOutcome.Success, cabana);
        }
    }

    public (CancelOutcome Outcome, Cabana? Cabana) TryCancel(string cabanaId, string room, string guestName)
    {
        lock (_lock)
        {
            if (!_cabanas.TryGetValue(cabanaId, out var cabana))
            {
                return (CancelOutcome.CabanaNotFound, null);
            }

            if (cabana.Available)
            {
                return (CancelOutcome.NotBooked, cabana);
            }

            var matchesBooking = Matches(cabana.BookedRoom, room) && Matches(cabana.BookedGuestName, guestName);

            if (!matchesBooking)
            {
                return (CancelOutcome.GuestMismatch, null);
            }

            cabana.Available = true;
            cabana.BookedRoom = null;
            cabana.BookedGuestName = null;
            return (CancelOutcome.Success, cabana);
        }
    }
}
