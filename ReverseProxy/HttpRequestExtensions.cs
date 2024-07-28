namespace ReverseProxy;

using Microsoft.AspNetCore.Http.Extensions;

public static class HttpRequestExtensions
{
    #region Public Methods and Operators

    public static Uri GetRequestUriWithOffset(this HttpRequest httpRequest, int offset)
    {
        var requestUrl = httpRequest.GetEncodedPathAndQuery();
        if (requestUrl.Length < offset + 1)
        {
            throw new BadHttpRequestException("No URL provided to proxy to.");
        }

        return new Uri(requestUrl.AsSpan(offset).ToString());
    }

    #endregion
}
