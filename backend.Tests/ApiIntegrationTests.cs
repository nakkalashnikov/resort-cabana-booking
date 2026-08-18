using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using ResortMap.Api.Models;

namespace ResortMap.Api.Tests;

// Program.cs reads --map/--bookings before builder.Build(), which runs before
// WebApplicationFactory customization hooks (ConfigureAppConfiguration etc.) would
// take effect. Environment variables ARE picked up at that point (they're part of
// WebApplication.CreateBuilder's default config sources), so fixture files are
// wired in that way instead. Tests in this class run sequentially (xunit doesn't
// parallelize within a class), so mutating process-wide env vars per test is safe.
public class ApiIntegrationTests : IDisposable
{
    private readonly string _mapPath = Path.GetTempFileName();
    private readonly string _bookingsPath = Path.GetTempFileName();
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public ApiIntegrationTests()
    {
        File.WriteAllText(_mapPath, Fixtures.TinyMap);
        File.WriteAllText(_bookingsPath, JsonSerializer.Serialize(Fixtures.Guests));

        Environment.SetEnvironmentVariable("map", _mapPath);
        Environment.SetEnvironmentVariable("bookings", _bookingsPath);

        _factory = new WebApplicationFactory<Program>();
        _client = _factory.CreateClient();
    }

    public void Dispose()
    {
        _client.Dispose();
        _factory.Dispose();
        File.Delete(_mapPath);
        File.Delete(_bookingsPath);
        Environment.SetEnvironmentVariable("map", null);
        Environment.SetEnvironmentVariable("bookings", null);
    }

    [Fact]
    public async Task GetMap_ReturnsSeededGridAndCabanas()
    {
        var map = await _client.GetFromJsonAsync<MapDto>("/api/map");

        Assert.NotNull(map);
        Assert.Equal(2, map!.Cabanas.Length);
        Assert.All(map.Cabanas, c => Assert.True(c.Available));
    }

    [Fact]
    public async Task PostBooking_ValidGuest_MarksCabanaUnavailableInSubsequentGet()
    {
        var response = await _client.PostAsJsonAsync("/api/bookings",
            new BookingRequest("1-1", "101", "Alice Smith"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var map = await _client.GetFromJsonAsync<MapDto>("/api/map");
        var booked = map!.Cabanas.Single(c => c.Id == "1-1");
        Assert.False(booked.Available);
    }

    [Fact]
    public async Task PostBooking_UnknownGuest_ReturnsBadRequest()
    {
        var response = await _client.PostAsJsonAsync("/api/bookings",
            new BookingRequest("1-1", "999", "Nobody"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PostBooking_AlreadyBooked_ReturnsConflict()
    {
        await _client.PostAsJsonAsync("/api/bookings", new BookingRequest("1-1", "101", "Alice Smith"));

        var response = await _client.PostAsJsonAsync("/api/bookings",
            new BookingRequest("1-1", "102", "Bob Jones"));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task PostBooking_GuestAlreadyHoldingAnotherCabana_ReturnsConflict()
    {
        await _client.PostAsJsonAsync("/api/bookings", new BookingRequest("1-1", "101", "Alice Smith"));

        var response = await _client.PostAsJsonAsync("/api/bookings",
            new BookingRequest("1-2", "101", "Alice Smith"));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var map = await _client.GetFromJsonAsync<MapDto>("/api/map");
        Assert.True(map!.Cabanas.Single(c => c.Id == "1-2").Available);
    }

    [Fact]
    public async Task DeleteBooking_MatchingGuest_ReleasesCabana()
    {
        await _client.PostAsJsonAsync("/api/bookings", new BookingRequest("1-1", "101", "Alice Smith"));

        var request = new HttpRequestMessage(HttpMethod.Delete, "/api/bookings/1-1")
        {
            Content = JsonContent.Create(new CancelRequest("101", "Alice Smith")),
        };
        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var map = await _client.GetFromJsonAsync<MapDto>("/api/map");
        Assert.True(map!.Cabanas.Single(c => c.Id == "1-1").Available);
    }

    [Fact]
    public async Task DeleteBooking_MismatchedGuest_ReturnsBadRequestAndKeepsBooking()
    {
        await _client.PostAsJsonAsync("/api/bookings", new BookingRequest("1-1", "101", "Alice Smith"));

        var request = new HttpRequestMessage(HttpMethod.Delete, "/api/bookings/1-1")
        {
            Content = JsonContent.Create(new CancelRequest("101", "Someone Else")),
        };
        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var map = await _client.GetFromJsonAsync<MapDto>("/api/map");
        Assert.False(map!.Cabanas.Single(c => c.Id == "1-1").Available);
    }
}
