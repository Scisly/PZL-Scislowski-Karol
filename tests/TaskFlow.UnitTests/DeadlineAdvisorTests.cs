using TaskFlow.Api.Infrastructure;
using TaskFlow.Api.Integrations;
using Xunit;

namespace TaskFlow.UnitTests;

public sealed class DeadlineAdvisorTests
{
    [Fact]
    public async Task ReturnsIndependentPastWeekendAndHolidayWarnings()
    {
        var client = new FakeHolidayClient([new(new(2026, 11, 21), "Test holiday")]);
        var advisor = new DeadlineAdvisor(client, new FixedTimeProvider(new(2026, 11, 23, 0, 0, 0, TimeSpan.Zero)));
        var advice = await advisor.GetAdviceAsync(new(2026, 11, 21));
        Assert.Equal(["past_date", "weekend", "public_holiday"], advice.Warnings.Select(x => x.Code).ToArray());
        Assert.Equal(2026, client.RequestedYear);
    }

    [Fact]
    public async Task CurrentWeekdayWithoutHolidayHasNoWarning()
    {
        var advisor = new DeadlineAdvisor(new FakeHolidayClient([]), new FixedTimeProvider(new(2026, 11, 23, 22, 0, 0, TimeSpan.Zero)));
        Assert.Empty((await advisor.GetAdviceAsync(new(2026, 11, 23))).Warnings);
    }

    [Fact]
    public async Task PreservesTheControlledErrorWhenTheCalendarIsUnavailable()
    {
        var unavailable = new ApiException(503, "holiday_service_unavailable", "Kalendarz świąt jest chwilowo niedostępny.");
        var advisor = new DeadlineAdvisor(new FakeHolidayClient([], unavailable), new FixedTimeProvider(new(2026, 11, 23, 0, 0, 0, TimeSpan.Zero)));

        var error = await Assert.ThrowsAsync<ApiException>(() => advisor.GetAdviceAsync(new(2026, 11, 23)));

        Assert.Equal(503, error.StatusCode);
        Assert.Equal("holiday_service_unavailable", error.Code);
    }

    [Fact]
    public async Task ForwardsCancellationToHolidayClient()
    {
        using var source = new CancellationTokenSource();
        source.Cancel();
        var advisor = new DeadlineAdvisor(new FakeHolidayClient([]), TimeProvider.System);
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => advisor.GetAdviceAsync(new(2026, 11, 23), source.Token));
    }

    private sealed class FakeHolidayClient(IReadOnlyList<PublicHoliday> holidays, ApiException? failure = null) : IHolidayClient
    {
        public int RequestedYear { get; private set; }
        public Task<IReadOnlyList<PublicHoliday>> GetPublicHolidaysAsync(int year, CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            RequestedYear = year;
            return failure is null ? Task.FromResult(holidays) : Task.FromException<IReadOnlyList<PublicHoliday>>(failure);
        }
    }
    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}
