import client from './client';

export async function fetchVoteCounts(dealId) {
  const { data } = await client.get(`/deals/${dealId}/votes`);
  return data;
}

export async function fetchMyVote(dealId) {
  const { data } = await client.get(`/deals/${dealId}/votes/mine`);
  return data.voteType;
}

export async function castVote(dealId, voteType) {
  const { data } = await client.post(`/deals/${dealId}/votes`, { voteType });
  return data;
}

export async function removeVote(dealId) {
  const { data } = await client.delete(`/deals/${dealId}/votes`);
  return data;
}