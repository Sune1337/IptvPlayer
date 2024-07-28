namespace ReverseProxy;

using System.Diagnostics;
using System.Net;

using Microsoft.Extensions.Options;

using ReverseProxy.Configuration;

using Yarp.ReverseProxy.Forwarder;

public static class ReverseProxyExtensions
{
    #region Static Fields

    private static string? _reverseProxyPath;

    #endregion

    #region Public Methods and Operators

    public static IServiceCollection AddCustomReverseProxy(this IServiceCollection services)
    {
        services.AddHttpForwarder();
        services.AddSingleton<CustomTransformer>();
        return services;
    }

    public static WebApplication MapReverseProxy(this WebApplication webApplication)
    {
        var reverseProxyOptions = webApplication.Services.GetRequiredService<IOptions<ReverseProxyOptions>>();
        _reverseProxyPath = reverseProxyOptions.Value.ReverseProxyPath ?? $"/{new Guid().ToString()}/";

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

        webApplication.Map($"{_reverseProxyPath}{{**catch-all}}", async (HttpContext httpContext, IHttpForwarder forwarder, CustomTransformer customTransformer) =>
        {
            var destinationUri = httpContext.Request.GetRequestUriWithOffset(_reverseProxyPath.Length);
            var destinationPrefix = destinationUri.GetLeftPart(UriPartial.Authority);

            // Ignore return value because we ignore errors.
            await forwarder.SendAsync(httpContext, destinationPrefix, httpClient, requestOptions, customTransformer);
        });

        return webApplication;
    }

    #endregion
}
