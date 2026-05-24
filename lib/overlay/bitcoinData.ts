export async function fetchReserveRisk() {
  try {
    const response = await fetch('https://bitcoin-data.com/api/v1/reserve-risk/last', {
      next: { revalidate: 43200 }
    });
    if (!response.ok) throw new Error('bitcoin-data.com error');
    const data = await response.json();
    return {
      status: 'success',
      reserveRisk: data.reserveRisk,
      fetchedAt: Date.now()
    };
  } catch (error) {
    return { status: 'unavailable', error: 'Fetch failed' };
  }
}

export async function fetchPuellMultiple() {
  try {
    const response = await fetch('https://bitcoin-data.com/api/v1/puell-multiple/last', {
      next: { revalidate: 43200 }
    });
    if (!response.ok) throw new Error('bitcoin-data.com error');
    const data = await response.json();
    return {
      status: 'success',
      puellMultiple: data.puellMultiple,
      fetchedAt: Date.now()
    };
  } catch (error) {
    return { status: 'unavailable', error: 'Fetch failed' };
  }
}
