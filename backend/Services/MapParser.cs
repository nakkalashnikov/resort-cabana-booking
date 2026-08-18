using ResortMap.Api.Models;

namespace ResortMap.Api.Services;

public static class MapParser
{
    public const char Cabana = 'W';
    public const char Pool = 'p';
    public const char Path = '#';
    public const char Chalet = 'c';
    public const char Empty = '.';

    public static (string[] Grid, List<Cabana> Cabanas) Parse(string mapText)
    {
        var rows = mapText
            .Replace("\r\n", "\n")
            .Split('\n')
            .Where(line => line.Length > 0)
            .ToArray();

        var width = rows.Length == 0 ? 0 : rows.Max(r => r.Length);
        var grid = rows.Select(r => r.PadRight(width, Empty)).ToArray();

        var cabanas = new List<Cabana>();
        for (var row = 0; row < grid.Length; row++)
        {
            for (var col = 0; col < grid[row].Length; col++)
            {
                if (grid[row][col] == Cabana)
                {
                    cabanas.Add(new Cabana($"{row}-{col}", row, col));
                }
            }
        }

        return (grid, cabanas);
    }
}
