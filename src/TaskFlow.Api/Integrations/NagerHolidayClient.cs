using System.Text.Json;
using TaskFlow.Api.Infrastructure;

namespace TaskFlow.Api.Integrations;

public sealed class NagerHolidayClient(HttpClient httpClient, ILogger<NagerHolidayClient> logger) : IHolidayClient
{
    public async Task<IReadOnlyList<PublicHoliday>> GetPublicHolidaysAsync(int year, CancellationToken cancellationToken = default)
    {
        try
        {
            using var response = await httpClient.GetAsync($"Holidays/PL/{year}", cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Holiday provider returned {StatusCode} for year {Year}", (int)response.StatusCode, year);
                throw new ApiException(503, "holiday_service_unavailable", "Kalendarz świąt jest chwilowo niedostępny.");
            }
            var responseItems = await response.Content.ReadFromJsonAsync<NagerHoliday?[]>(cancellationToken) ?? throw new JsonException("Missing holiday array.");
            var holidays = responseItems.Select(x => ValidateHoliday(x, year)).ToArray();
            logger.LogInformation("Holiday provider returned calendar for year {Year}", year);
            return holidays.Where(x => x.NationalHoliday && x.HolidayTypes.Contains("Public", StringComparer.Ordinal)).Select(x => new PublicHoliday(x.Date, x.Name)).ToArray();
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new ApiException(504, "holiday_service_timeout", "Kalendarz świąt nie odpowiedział w wymaganym czasie.");
        }
        catch (HttpRequestException)
        {
            throw new ApiException(503, "holiday_service_unavailable", "Kalendarz świąt jest chwilowo niedostępny.");
        }
        catch (JsonException)
        {
            throw new ApiException(503, "holiday_invalid_response", "Kalendarz świąt zwrócił nieprawidłowe dane.");
        }
    }

    private static NagerHoliday ValidateHoliday(NagerHoliday? holiday, int year)
    {
        if (holiday is null || holiday.Date.Year != year || holiday.CountryCode != "PL" ||
            string.IsNullOrWhiteSpace(holiday.Name) || holiday.HolidayTypes is null || holiday.HolidayTypes.Any(string.IsNullOrWhiteSpace))
            throw new JsonException("Invalid holiday model.");
        return holiday;
    }

    private sealed record NagerHoliday
    {
        public required DateOnly Date { get; init; }
        public required string Name { get; init; }
        public required string CountryCode { get; init; }
        public required bool NationalHoliday { get; init; }
        public required string[] HolidayTypes { get; init; }
    }
}
