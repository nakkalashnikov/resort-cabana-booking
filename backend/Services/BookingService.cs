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

    public IReadOnlyCollection<Cabana> Cabanas => _cabanas.Values;

    public enum BookingOutcome
    {
        Success,
        CabanaNotFound,
        AlreadyBooked,
        GuestNotFound
    }

    public (BookingOutcome Outcome, Cabana? Cabana) TryBook(string cabanaId, string room, string guestName)
    {
        if (!_cabanas.TryGetValue(cabanaId, out var cabana))
        {
            return (BookingOutcome.CabanaNotFound, null);
        }

        lock (cabana)
        {
            if (!cabana.Available)
            {
                return (BookingOutcome.AlreadyBooked, cabana);
            }

            var isValidGuest = _guests.Any(g =>
                string.Equals(g.Room.Trim(), room.Trim(), StringComparison.OrdinalIgnoreCase) &&
                string.Equals(g.GuestName.Trim(), guestName.Trim(), StringComparison.OrdinalIgnoreCase));

            if (!isValidGuest)
            {
                return (BookingOutcome.GuestNotFound, null);
            }

            cabana.Available = false;
            cabana.BookedRoom = room;
            cabana.BookedGuestName = guestName;
            return (BookingOutcome.Success, cabana);
        }
    }
}
