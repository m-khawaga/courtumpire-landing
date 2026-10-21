// The shared analytics wrapper fails closed without affecting any tool.
export function track(name,parameters={},options={}){try{return window.CourtUmpireAnalytics?.track(name,parameters,options)??false;}catch{return false;}}
