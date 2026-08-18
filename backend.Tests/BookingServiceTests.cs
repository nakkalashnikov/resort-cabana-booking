using ResortMap.Api.Services;

namespace ResortMap.Api.Tests;

public class BookingServiceTests
{
    private static BookingService NewService()
    {
        var (grid, cabanas) = MapParser.Parse(Fixtures.TinyMap);
        return new BookingService(grid, cabanas, Fixtures.Guests);
    }

    [Fact]
    public void TryBook_ValidGuestAndAvailableCabana_Succeeds()
    {
        var service = NewService();

        var (outcome, cabana) = service.TryBook("1-1", "101", "Alice Smith");

        Assert.Equal(BookingService.BookingOutcome.Success, outcome);
        Assert.False(cabana!.Available);
        Assert.Equal("101", cabana.BookedRoom);
        Assert.Equal("Alice Smith", cabana.BookedGuestName);
    }

    [Fact]
    public void TryBook_RoomAndNameMatchingIsCaseInsensitiveAndTrimmed()
    {
        var service = NewService();

        var (outcome, _) = service.TryBook("1-1", " 101 ", " alice smith ");

        Assert.Equal(BookingService.BookingOutcome.Success, outcome);
    }

    [Fact]
    public void TryBook_UnknownGuest_ReturnsGuestNotFound()
    {
        var service = NewService();

        var (outcome, cabana) = service.TryBook("1-1", "999", "Nobody");

        Assert.Equal(BookingService.BookingOutcome.GuestNotFound, outcome);
        Assert.Null(cabana);
    }

    [Fact]
    public void TryBook_AlreadyBookedCabana_ReturnsAlreadyBooked()
    {
        var service = NewService();
        service.TryBook("1-1", "101", "Alice Smith");

        var (outcome, _) = service.TryBook("1-1", "102", "Bob Jones");

        Assert.Equal(BookingService.BookingOutcome.AlreadyBooked, outcome);
    }

    [Fact]
    public void TryBook_UnknownCabana_ReturnsCabanaNotFound()
    {
        var service = NewService();

        var (outcome, _) = service.TryBook("99-99", "101", "Alice Smith");

        Assert.Equal(BookingService.BookingOutcome.CabanaNotFound, outcome);
    }

    [Fact]
    public void TryBook_GuestAlreadyHoldingAnotherCabana_ReturnsGuestAlreadyHasCabana()
    {
        var service = NewService();
        service.TryBook("1-1", "101", "Alice Smith");

        var (outcome, cabana) = service.TryBook("1-2", "101", "Alice Smith");

        Assert.Equal(BookingService.BookingOutcome.GuestAlreadyHasCabana, outcome);
        Assert.Null(cabana);
        Assert.True(service.Cabanas.Single(c => c.Id == "1-2").Available);
    }

    [Fact]
    public void TryCancel_MatchingRoomAndName_ReleasesCabana()
    {
        var service = NewService();
        service.TryBook("1-1", "101", "Alice Smith");

        var (outcome, cabana) = service.TryCancel("1-1", "101", "Alice Smith");

        Assert.Equal(BookingService.CancelOutcome.Success, outcome);
        Assert.True(cabana!.Available);
        Assert.Null(cabana.BookedRoom);
        Assert.Null(cabana.BookedGuestName);
    }

    [Fact]
    public void TryCancel_MismatchedGuest_ReturnsGuestMismatchAndLeavesBookingIntact()
    {
        var service = NewService();
        service.TryBook("1-1", "101", "Alice Smith");

        var (outcome, _) = service.TryCancel("1-1", "101", "Someone Else");

        Assert.Equal(BookingService.CancelOutcome.GuestMismatch, outcome);
        var stillBooked = service.Cabanas.Single(c => c.Id == "1-1");
        Assert.False(stillBooked.Available);
    }

    [Fact]
    public void TryCancel_CabanaNotBooked_ReturnsNotBooked()
    {
        var service = NewService();

        var (outcome, _) = service.TryCancel("1-1", "101", "Alice Smith");

        Assert.Equal(BookingService.CancelOutcome.NotBooked, outcome);
    }
}
