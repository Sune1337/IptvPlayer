namespace ReverseProxy;

using Microsoft.Extensions.Options;

using ReverseProxy.Configuration;

using Yarp.ReverseProxy.Forwarder;

/// <summary>
/// Custom request transformation
/// </summary>
internal class CustomTransformer : HttpTransformer
{
    #region Fields

    private readonly ReverseProxyOptions _reverseProxyOptions;

    #endregion

    #region Constructors and Destructors

    public CustomTransformer(IOptions<ReverseProxyOptions> reverseProxyOptions)
    {
        _reverseProxyOptions = reverseProxyOptions.Value;
    }

    #endregion

    #region Public Methods and Operators

    public override async ValueTask TransformRequestAsync(HttpContext httpContext, HttpRequestMessage proxyRequest, string destinationPrefix, CancellationToken cancellationToken)
    {
        // Copy all request headers
        await base.TransformRequestAsync(httpContext, proxyRequest, destinationPrefix, cancellationToken);

        if (_reverseProxyOptions.ReverseProxyPath == null)
        {
            throw new ArgumentNullException(nameof(_reverseProxyOptions.ReverseProxyPath));
        }

        // Assign the custom uri. Be careful about extra slashes when concatenating here. RequestUtilities.MakeDestinationAddress is a safe default.
        proxyRequest.RequestUri = httpContext.Request.GetRequestUriWithOffset(_reverseProxyOptions.ReverseProxyPath.Length);

        // Suppress the original request header, use the one from the destination Uri.
        proxyRequest.Headers.Host = null;

        // Remove referrer header so that backend cannot see which site the request is coming from.
        proxyRequest.Headers.Referrer = null;
    }

    public override ValueTask<bool> TransformResponseAsync(HttpContext httpContext, HttpResponseMessage? proxyResponse, CancellationToken cancellationToken)
    {
        var proxyToClient = base.TransformResponseAsync(httpContext, proxyResponse, cancellationToken);
        var location = proxyResponse?.Headers.Location;
        if (location != null)
        {
            httpContext.Response.Headers.Location = _reverseProxyOptions.ReverseProxyPath + location;
        }

        return proxyToClient;
    }

    #endregion
}
