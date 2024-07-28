namespace ReverseProxy;

using System.Diagnostics;
using System.Net;

using Yarp.ReverseProxy.Forwarder;

public static class ReverseProxyExtensions
{
    #region Static Fields

    private const string ProxyPrefix = "/rproxy/";
    private static readonly CustomTransformer CustomHttpTransformer = new(ProxyPrefix);

    #endregion

    #region Public Methods and Operators

    public static WebApplication MapReverseProxy(this WebApplication webApplication)
    {
        // Configure our own HttpMessageInvoker for outbound calls for proxy operations
        var httpClient = new HttpMessageInvoker(new SocketsHttpHandler
        {
            UseProxy = false,
            AllowAutoRedirect = false,
            AutomaticDecompression = DecompressionMethods.None,
            UseCookies = false,
            EnableMultipleHttp2Connections = true,
            ActivityHeadersPropagator = new ReverseProxyPropagator(DistributedContextPropagator.Current),
            ConnectTimeout = TimeSpan.FromSeconds(15)
        });

        // Setup our own request transform class
        var requestOptions = new ForwarderRequestConfig { ActivityTimeout = TimeSpan.FromSeconds(100) };

        webApplication.Map($"{ProxyPrefix}{{**catch-all}}", async (HttpContext httpContext, IHttpForwarder forwarder, ILogger<CustomTransformer> logger) =>
        {
            var destinationUri = httpContext.Request.GetRequestUriWithOffset(ProxyPrefix.Length);
            var destinationPrefix = destinationUri.GetLeftPart(UriPartial.Authority);

            // Ignore return value because we ignore errors.
            await forwarder.SendAsync(httpContext, destinationPrefix, httpClient, requestOptions, CustomHttpTransformer);
        });

        return webApplication;
    }

    #endregion
}
