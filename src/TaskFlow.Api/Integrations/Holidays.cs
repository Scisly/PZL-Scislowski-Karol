namespace TaskFlow.Api.Integrations;

public sealed record PublicHoliday(DateOnly Date, string Name);
public interface IHolidayClient
{
    Task<IReadOnlyList<PublicHoliday>> GetPublicHolidaysAsync(int year, CancellationToken cancellationToken = default);
}

public sealed record DeadlineWarning(string Code, string Message);
public sealed record DeadlineAdvice(DateOnly Date, IReadOnlyList<DeadlineWarning> Warnings);

public sealed class DeadlineAdvisor(IHolidayClient holidayClient, TimeProvider timeProvider)
{
    public async Task<DeadlineAdvice> GetAdviceAsync(DateOnly date, CancellationToken cancellationToken = default)
    {
        var warnings = new List<DeadlineWarning>();
        if (date < DateOnly.FromDateTime(timeProvider.GetUtcNow().UtcDateTime)) warnings.Add(new("past_date", "Wybrany termin jest w przeszłości."));
        if (date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday) warnings.Add(new("weekend", "Wybrany termin wypada w weekend."));
        var holidays = await holidayClient.GetPublicHolidaysAsync(date.Year, cancellationToken);
        if (holidays.Any(x => x.Date == date)) warnings.Add(new("public_holiday", "Wybrany termin jest dniem świątecznym w Polsce."));
        return new(date, warnings);
    }
}
