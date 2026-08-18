namespace ResortMap.Api.Models;

public record Guest(string Room, string GuestName);

public record Cabana(string Id, int Row, int Col)
{
    public bool Available { get; set; } = true;
    public string? BookedRoom { get; set; }
    public string? BookedGuestName { get; set; }
}

public record MapDto(int Width, int Height, string[] Grid, CabanaDto[] Cabanas);

public record CabanaDto(string Id, int Row, int Col, bool Available, bool Mine);

public record BookingRequest(string CabanaId, string Room, string GuestName);

public record BookingResponse(string CabanaId, string Room, string GuestName, bool Confirmed);

public record CancelRequest(string Room, string GuestName);

public record CancelResponse(string CabanaId, bool Released);

public record ErrorResponse(string Error);
