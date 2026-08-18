using System.Collections.Concurrent;
using ResortMap.Api.Models;

namespace ResortMap.Api.Services;

public class BookingService
{
    public const int MaxCabanasPerGuest = 2;

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

    // Guards every read-check-write across TryBook/TryCancel — a per-cabana lock isn't enough
    // once checks span multiple cabanas (booking limit), so this is a single coarse lock for
    // the whole service instead — fine at this scale.
    private readonly object _lock = new();

    public enum BookingOutcome
    {
        Success,
        CabanaNotFound,
        AlreadyBooked,
        GuestNotFound,
        GuestAtBookingLimit
    }

    public enum CancelOutcome
    {
        Success,
        CabanaNotFound,
        NotBooked,
        GuestMismatch
    }

    public static bool Matches(string? a, string b) =>
        string.Equals(a?.Trim(), b.Trim(), StringComparison.OrdinalIgnoreCase);

    public bool IsValidGuest(string room, string guestName) =>
        _guests.Any(g => Matches(g.Room, room) && Matches(g.GuestName, guestName));

    public bool IsBookedBy(Cabana cabana, string room, string guestName) =>
        !cabana.Available && Matches(cabana.BookedRoom, room) && Matches(cabana.BookedGuestName, guestName);

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

            if (!IsValidGuest(room, guestName))
            {
                return (BookingOutcome.GuestNotFound, null);
            }

            var heldCount = _cabanas.Values.Count(c => IsBookedBy(c, room, guestName));

            if (heldCount >= MaxCabanasPerGuest)
            {
                return (BookingOutcome.GuestAtBookingLimit, null);
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

            if (!IsBookedBy(cabana, room, guestName))
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
