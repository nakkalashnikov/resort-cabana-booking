using ResortMap.Api.Models;

namespace ResortMap.Api.Tests;

public static class Fixtures
{
    // Three cabanas: 1-1, 1-2, 3-1 — three so the 2-cabana-per-guest limit can be exercised
    // (book 2, the 3rd should be rejected). A pool tile and a chalet tile are included so
    // MapParser is exercised against every legend character, not just W.
    public const string TinyMap = "....\n.WWc\n.pp.\n.W..";

    public static List<Guest> Guests => new()
    {
        new Guest("101", "Alice Smith"),
        new Guest("102", "Bob Jones"),
    };
}
