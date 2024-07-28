using ReverseProxy;
using ReverseProxy.Configuration;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

// Add reverse proxy services.
builder.Services.Configure<ReverseProxyOptions>(builder.Configuration.GetSection(nameof(ReverseProxyOptions)));
builder.Services.AddCustomReverseProxy();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();

// Map reverse proxy routes.
app.MapReverseProxy();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller}/{action=Index}/{id?}");

app.MapFallbackToFile("index.html");

app.Run();
