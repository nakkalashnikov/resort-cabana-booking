using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using ResortMap.Api.Models;
using ResortMap.Api.Services;

var builder = WebApplication.CreateBuilder(args);

var mapPath = builder.Configuration.GetValue<string>("map") ?? "map.ascii";
var bookingsPath = builder.Configuration.GetValue<string>("bookings") ?? "bookings.json";

var resolvedMapPath = PathResolver.Resolve(mapPath, builder.Environment.ContentRootPath);
var resolvedBookingsPath = PathResolver.Resolve(bookingsPath, builder.Environment.ContentRootPath);
var assetsDir = PathResolver.ResolveDirectory("assets", builder.Environment.ContentRootPath);

var (grid, cabanas) = MapParser.Parse(File.ReadAllText(resolvedMapPath));
var guests = JsonSerializer.Deserialize<List<Guest>>(
    File.ReadAllText(resolvedBookingsPath),
    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? [];

builder.Services.AddSingleton(new BookingService(grid, cabanas, guests));
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy => policy
        .AllowAnyOrigin()
        .AllowAnyMethod()
        .AllowAnyHeader());
});

var app = builder.Build();

app.UseCors();
app.UseDefaultFiles();
app.UseStaticFiles();

if (assetsDir is not null)
{
    app.UseStaticFiles(new Microsoft.AspNetCore.Builder.StaticFileOptions
    {
        FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(assetsDir),
        RequestPath = "/assets"
    });
}

app.MapGet("/api/map", (BookingService bookings) =>
{
    var dto = new MapDto(
        bookings.Width,
        bookings.Height,
        bookings.Grid,
        bookings.Cabanas.Select(c => new CabanaDto(c.Id, c.Row, c.Col, c.Available)).ToArray());
    return Results.Ok(dto);
});

app.MapPost("/api/bookings", (BookingRequest request, BookingService bookings) =>
{
    if (string.IsNullOrWhiteSpace(request.Room) || string.IsNullOrWhiteSpace(request.GuestName))
    {
        return Results.BadRequest(new ErrorResponse("Room number and guest name are required."));
    }

    var (outcome, cabana) = bookings.TryBook(request.CabanaId, request.Room, request.GuestName);

    return outcome switch
    {
        BookingService.BookingOutcome.Success => Results.Ok(new BookingResponse(
            cabana!.Id, request.Room, request.GuestName, true)),
        BookingService.BookingOutcome.AlreadyBooked => Results.Conflict(
            new ErrorResponse("This cabana is already booked.")),
        BookingService.BookingOutcome.GuestNotFound => Results.BadRequest(
            new ErrorResponse("No guest found with that room number and name.")),
        BookingService.BookingOutcome.GuestAlreadyHasCabana => Results.Conflict(
            new ErrorResponse("This guest already has a cabana booked. Release it first to book another.")),
        BookingService.BookingOutcome.CabanaNotFound => Results.NotFound(
            new ErrorResponse("Cabana not found.")),
        _ => Results.Problem("Unexpected error.")
    };
});

app.MapDelete("/api/bookings/{cabanaId}", (string cabanaId, [FromBody] CancelRequest request, BookingService bookings) =>
{
    if (string.IsNullOrWhiteSpace(request.Room) || string.IsNullOrWhiteSpace(request.GuestName))
    {
        return Results.BadRequest(new ErrorResponse("Room number and guest name are required."));
    }

    var (outcome, _) = bookings.TryCancel(cabanaId, request.Room, request.GuestName);

    return outcome switch
    {
        BookingService.CancelOutcome.Success => Results.Ok(new CancelResponse(cabanaId, true)),
        BookingService.CancelOutcome.NotBooked => Results.Conflict(
            new ErrorResponse("This cabana isn't booked.")),
        BookingService.CancelOutcome.GuestMismatch => Results.BadRequest(
            new ErrorResponse("Room number and guest name don't match this booking.")),
        BookingService.CancelOutcome.CabanaNotFound => Results.NotFound(
            new ErrorResponse("Cabana not found.")),
        _ => Results.Problem("Unexpected error.")
    };
});

app.MapFallbackToFile("index.html");

app.Run();

public partial class Program;
