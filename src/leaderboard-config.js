// One AIWANNA board: the Triple Crown, the sum of a player's best flying lap on all three circuits.
export const TRIPLE_CROWN='triple-crown-v1';
export const leaderboardConfig = {
 origin: 'https://www.aiwanna.games',
 origins: ['https://www.aiwanna.games','https://aiwanna.games','https://www.ai-made.games','https://ai-made.games','https://1gp-game-platform.vercel.app'],
 gameId: '82851460-cb8e-4a38-bb19-284e81fb5e66', gameSlug: 'b3f91cd4cc13ec1f947ac2f809f1ae2a-2c49ebfa',
 boards: {[TRIPLE_CROWN]:'c1850a19-0a0b-4621-997e-b1b48478049d'},
};
export const boardDefinition = {
 key:TRIPLE_CROWN,name:'Triple Crown · best laps',
 description:'Your fastest flying lap on each of the three circuits, added together. Any mode, any assist. Lower wins.',
 order:'asc',unit:'milliseconds',minScore:20000,maxScore:300000,minPlayMs:30000,
};
