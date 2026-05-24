import { fetchDuneEtfFlows } from './dune';
import { fetchReserveRisk, fetchPuellMultiple } from './bitcoinData';

export async function getOverlayData() {
  const [etfFlows, reserveRisk, puellMultiple] = await Promise.all([
    fetchDuneEtfFlows(),
    fetchReserveRisk(),
    fetchPuellMultiple()
  ]);

  return {
    etfFlows,
    reserveRisk,
    puellMultiple,
    fetchedAt: Date.now()
  };
}
