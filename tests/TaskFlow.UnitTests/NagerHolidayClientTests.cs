using System.Net;
using Microsoft.Extensions.Logging.Abstractions;
using TaskFlow.Api.Infrastructure;
using TaskFlow.Api.Integrations;
using Xunit;

namespace TaskFlow.UnitTests;

public sealed class NagerHolidayClientTests
{
    [Fact]
    public async Task MapsOnlyNationalPublicHolidaysFromV4Contract()
    {
        const string json = """
            [{"date":"2026-05-01","name":"Labour Day","countryCode":"PL","nationalHoliday":true,"holidayTypes":["Public"]},
             {"date":"2026-05-02","name":"Observance","countryCode":"PL","nationalHoliday":true,"holidayTypes":["Observance"]},
             {"date":"2026-05-03","name":"Regional","countryCode":"PL","nationalHoliday":false,"holidayTypes":["Public"]}]
            """;
        var result = await Client(new ReplyHandler(HttpStatusCode.OK, json)).GetPublicHolidaysAsync(2026);
        Assert.Equal(new PublicHoliday(new(2026, 5, 1), "Labour Day"), Assert.Single(result));
    }

    [Fact]
    public async Task MapsFirstCalendarDateWhenRequestedYearIsOne()
    {
        const string json = """
            [{"date":"0001-01-01","name":"New Year's Day","countryCode":"PL","nationalHoliday":true,"holidayTypes":["Public"]}]
            """;
        var result = await Client(new ReplyHandler(HttpStatusCode.OK, json)).GetPublicHolidaysAsync(1);
        Assert.Equal(new PublicHoliday(new(1, 1, 1), "New Year's Day"), Assert.Single(result));
    }

    [Theory]
    [InlineData(HttpStatusCode.NotFound)]
    [InlineData(HttpStatusCode.TooManyRequests)]
    [InlineData(HttpStatusCode.ServiceUnavailable)]
    public async Task ProviderHttpFailureHasSafe503(HttpStatusCode status)
    {
        var error = await Assert.ThrowsAsync<ApiException>(() => Client(new ReplyHandler(status, "secret provider detail")).GetPublicHolidaysAsync(2026));
        Assert.Equal(503, error.StatusCode);
        Assert.DoesNotContain("secret", error.Message);
    }

    [Fact]
    public async Task InvalidJsonHas503()
    {
        var error = await Assert.ThrowsAsync<ApiException>(() => Client(new ReplyHandler(HttpStatusCode.OK, "not json")).GetPublicHolidaysAsync(2026));
        Assert.Equal(503, error.StatusCode);
    }

    [Theory]
    [InlineData("[null]", 2026)]
    [InlineData("[{\"date\":\"2026-05-01\",\"name\":\"Labour Day\",\"countryCode\":\"PL\",\"nationalHoliday\":true,\"holidayTypes\":[\"Public\"]},null]", 2026)]
    [InlineData("{}", 2026)]
    [InlineData("[{}]", 2026)]
    [InlineData("[{\"date\":\"0001-01-01\",\"name\":\"Wrong year\",\"countryCode\":\"PL\",\"nationalHoliday\":true,\"holidayTypes\":[\"Public\"]}]", 2026)]
    [InlineData("[{\"date\":\"2026-05-01\",\"name\":\"Missing type\",\"countryCode\":\"PL\",\"nationalHoliday\":true,\"holidayTypes\":[null]}]", 2026)]
    public async Task InvalidProviderModelHasSafe503(string json, int year)
    {
        var error = await Assert.ThrowsAsync<ApiException>(() => Client(new ReplyHandler(HttpStatusCode.OK, json)).GetPublicHolidaysAsync(year));
        Assert.Equal(503, error.StatusCode);
        Assert.Equal("holiday_invalid_response", error.Code);
    }

    [Fact]
    public async Task HttpTimeoutHas504()
    {
        using var http = new HttpClient(new NeverReplyHandler()) { BaseAddress = new("https://example.test/api/v4/"), Timeout = TimeSpan.FromMilliseconds(25) };
        var error = await Assert.ThrowsAsync<ApiException>(() => new NagerHolidayClient(http, NullLogger<NagerHolidayClient>.Instance).GetPublicHolidaysAsync(2026));
        Assert.Equal(504, error.StatusCode);
    }

    private static NagerHolidayClient Client(HttpMessageHandler handler) => new(new HttpClient(handler) { BaseAddress = new("https://example.test/api/v4/") }, NullLogger<NagerHolidayClient>.Instance);
    private sealed class ReplyHandler(HttpStatusCode status, string content) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) => Task.FromResult(new HttpResponseMessage(status) { Content = new StringContent(content) });
    }
    private sealed class NeverReplyHandler : HttpMessageHandler
    {
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            await Task.Delay(Timeout.InfiniteTimeSpan, cancellationToken);
            return new(HttpStatusCode.OK);
        }
    }
}
