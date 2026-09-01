import { CuratedTemplateAdapter } from './curated-template.adapter';

describe('CuratedTemplateAdapter', () => {
  let adapter: CuratedTemplateAdapter;

  beforeEach(() => {
    adapter = new CuratedTemplateAdapter();
  });

  it('should generate offline guide answer with key Alanya attractions', async () => {
    const answer = await adapter.generateGuideAnswer({
      userQuestion: 'What to see in Alanya?',
    });

    expect(answer).toContain('Alanya Castle');
    expect(answer).toContain('Kleopatra Beach');
    expect(answer).toContain('Damlatas Cave');
  });

  it('should generate deterministic multi-day itinerary without external calls', async () => {
    const result = await adapter.generateItineraryPlan({
      days: 3,
      district: 'Kleopatra',
    });

    expect(result.district).toBe('Kleopatra');
    expect(result.title).toBe('3-Day Curated Kleopatra Itinerary');
    expect(result.days).toHaveLength(3);
    expect(result.days?.[0].items.length).toBeGreaterThan(0);
    expect(result.days?.[0].dayLabel).toBe('Day 1');
  });

  it('should constrain days between 1 and 14 days', async () => {
    const minResult = await adapter.generateItineraryPlan({ days: 0 });
    expect(minResult.days).toHaveLength(1);

    const maxResult = await adapter.generateItineraryPlan({ days: 20 });
    expect(maxResult.days).toHaveLength(14);
  });
});
