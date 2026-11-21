using System.Net;
using System.Text;
using System.Text.Json;

namespace TaskFlow.Api.Integrations;

public sealed class HolidayStubHandler(IConfiguration configuration) : HttpMessageHandler
{
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var scenario = configuration["HolidayApi:StubScenario"] ?? "Success";
        if (scenario == "Timeout") await Task.Delay(Timeout.InfiniteTimeSpan, cancellationToken);
        var status = scenario switch { "NotFound" => HttpStatusCode.NotFound, "RateLimited" => HttpStatusCode.TooManyRequests, "Unavailable" => HttpStatusCode.ServiceUnavailable, _ => HttpStatusCode.OK };
        if (scenario == "InvalidJson") return new(HttpStatusCode.OK) { Content = new StringContent("{invalid json", Encoding.UTF8, "application/json") };
        if (status != HttpStatusCode.OK) return new(status);
        var year = int.Parse(request.RequestUri!.Segments[^1], System.Globalization.CultureInfo.InvariantCulture);
        var days = new (int Month, int Day, string Name)[] { (1, 1, "New Year's Day"), (1, 6, "Epiphany"), (5, 1, "Labour Day"), (5, 3, "Constitution Day"), (8, 15, "Assumption Day"), (11, 1, "All Saints' Day"), (11, 11, "Independence Day"), (12, 24, "Christmas Eve"), (12, 25, "Christmas Day"), (12, 26, "Second Day of Christmas") };
        var holidays = days.Select(x => new { date = new DateOnly(year, x.Month, x.Day), name = x.Name, countryCode = "PL", nationalHoliday = true, holidayTypes = new[] { "Public" } });
        return new(HttpStatusCode.OK) { Content = new StringContent(JsonSerializer.Serialize(holidays), Encoding.UTF8, "application/json") };
    }
}
