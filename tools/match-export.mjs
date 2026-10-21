import {replayMatch,gameLabel} from './scoring.mjs';
export function matchExportModel(record){
 const s=replayMatch(record.config,record.history);
 if(s.winner!==null)return {status:'completed',format:s.config.format,gamesPerSet:s.config.gamesPerSet,names:s.config.names,winner:s.winner,sets:s.sets.map(set=>({kind:set.kind,a:set.score[0],b:set.score[1],...(set.tiebreak?{tiebreak:[...set.tiebreak]}:{})}))};
 return {status:'in-progress',format:s.config.format,gamesPerSet:s.config.gamesPerSet,names:s.config.names,winner:null,sets:s.sets.map(set=>({kind:set.kind,a:set.score[0],b:set.score[1],...(set.tiebreak?{tiebreak:set.tiebreak}:{})})),current:{games:[...s.games],points:s.tie?[...s.points]:gameLabel(s.points),kind:s.tie?s.tie.kind==='match'?'match':'tiebreak':'game',server:s.server,target:s.tie?.target||null}};
}
