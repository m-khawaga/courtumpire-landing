import {createPrivateHandler} from './worker.mjs';
import assets from './assets.generated.mjs';
const handle=createPrivateHandler();
export default {fetch:(request,env)=>handle(request,{...env,PRIVATE_ASSETS:assets})};

