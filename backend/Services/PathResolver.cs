namespace ResortMap.Api.Services;

public static class PathResolver
{
    /// <summary>
    /// Resolves a path against the current working directory, then walks a couple of
    /// parent directories of the content root as a fallback, so defaults keep working
    /// whether the app is launched from the repo root (via run.sh) or from backend/.
    /// </summary>
    public static string Resolve(string path, string contentRoot)
    {
        if (Path.IsPathRooted(path) && File.Exists(path))
        {
            return path;
        }

        var candidates = new List<string> { Path.Combine(Directory.GetCurrentDirectory(), path) };

        var dir = contentRoot;
        for (var i = 0; i < 3; i++)
        {
            candidates.Add(Path.Combine(dir, path));
            dir = Path.GetDirectoryName(dir) ?? dir;
        }

        var found = candidates.FirstOrDefault(File.Exists);
        return found ?? candidates[0];
    }

    public static string? ResolveDirectory(string dirName, string contentRoot)
    {
        var candidates = new List<string> { Path.Combine(Directory.GetCurrentDirectory(), dirName) };

        var dir = contentRoot;
        for (var i = 0; i < 3; i++)
        {
            candidates.Add(Path.Combine(dir, dirName));
            dir = Path.GetDirectoryName(dir) ?? dir;
        }

        return candidates.FirstOrDefault(Directory.Exists);
    }
}
