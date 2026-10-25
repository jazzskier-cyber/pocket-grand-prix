// Real IDs returned by AIWANNA for this game and its six time-trial boards.
export const leaderboardConfig = {
 origin: 'https://www.aiwanna.games', gameId: '82851460-cb8e-4a38-bb19-284e81fb5e66', gameSlug: 'b3f91cd4cc13ec1f947ac2f809f1ae2a-2c49ebfa',
 boards: {
  'trial-v1-clover-assist':'fdf205a9-1f2c-4daa-bb5b-6882a858417e','trial-v1-clover-manual':'ee4ebea1-cf68-4916-9ef4-8ac76ce653cd',
  'trial-v1-copper-assist':'34ff61c9-58a9-4bd4-a731-6be9646f3ccb','trial-v1-copper-manual':'e1c69d95-9362-43e4-89a8-497137d3831c',
  'trial-v1-marina-assist':'024afe0b-2d91-4659-90e7-5da8db588188','trial-v1-marina-manual':'ee3cc36d-5f97-4316-b31a-7e0a910abd89',
 },
};
export const boardKey=(trackIndex,assist)=>`trial-v1-${['clover','copper','marina'][trackIndex]}-${assist?'assist':'manual'}`;
export const boardDefinitions = ['Clover Coast','Copper Canyon','Moonlight Marina'].flatMap((name,i)=>[true,false].map(assist=>({
 key:boardKey(i,assist),name:`${name} · ${assist?'Assisted':'Unassisted'}`,
 description:'Three-lap time trial. Lower elapsed time wins. Personal best only. Pauses excluded. No rivals or slipstream. Standard car and boost. Ties share rank.',
 sortDirection:'asc',aggregation:'best',scoreType:'time',unit:'ms',minScore:30000,maxScore:600000,minPlayTimeSeconds:30,
})));
