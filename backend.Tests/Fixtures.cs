using ResortMap.Api.Models;

namespace ResortMap.Api.Tests;

public static class Fixtures
{
    // Two cabanas: 1-1 and 1-2. A pool tile and a chalet tile are included
    // so MapParser is exercised against every legend character, not just W.
    public const string TinyMap = "....\n.WWc\n.pp.\n....";

    public static List<Guest> Guests => new()
    {
        new Guest("101", "Alice Smith"),
        new Guest("102", "Bob Jones"),
    };
}
