using ResortMap.Api.Services;

namespace ResortMap.Api.Tests;

public class MapParserTests
{
    [Fact]
    public void Parse_ReturnsGridWithCorrectDimensions()
    {
        var (grid, _) = MapParser.Parse(Fixtures.TinyMap);

        Assert.Equal(4, grid.Length);
        Assert.All(grid, row => Assert.Equal(4, row.Length));
    }

    [Fact]
    public void Parse_FindsAllCabanasWithCoordinateIds()
    {
        var (_, cabanas) = MapParser.Parse(Fixtures.TinyMap);

        Assert.Equal(3, cabanas.Count);
        Assert.Contains(cabanas, c => c.Id == "1-1" && c.Row == 1 && c.Col == 1);
        Assert.Contains(cabanas, c => c.Id == "1-2" && c.Row == 1 && c.Col == 2);
        Assert.Contains(cabanas, c => c.Id == "3-1" && c.Row == 3 && c.Col == 1);
    }

    [Fact]
    public void Parse_CabanasStartAvailable()
    {
        var (_, cabanas) = MapParser.Parse(Fixtures.TinyMap);

        Assert.All(cabanas, c => Assert.True(c.Available));
    }

    [Fact]
    public void Parse_PadsShorterRowsWithEmptySpace()
    {
        var (grid, _) = MapParser.Parse("..\n.W.\n.");

        Assert.Equal(3, grid.Length);
        Assert.All(grid, row => Assert.Equal(3, row.Length));
        Assert.Equal("...", grid[0]);
    }
}
