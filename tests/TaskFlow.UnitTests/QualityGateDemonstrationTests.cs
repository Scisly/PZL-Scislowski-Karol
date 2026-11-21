using Xunit;

namespace TaskFlow.UnitTests;

// Controlled Topic 11 exercise, isolated from main. Removed after collecting CI evidence.
public sealed class QualityGateDemonstrationTests
{
    [Fact]
    public void DeliberateFailureMustStopThePipeline() =>
        Assert.Fail("Kontrolowana próba quality gate: ten branch celowo zawiera failing test.");
}
