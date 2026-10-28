// Only bounded categories, never claims, headers, URLs, exception messages or tokens.
const categories=new Set(['assertion-missing','expired','signature-invalid','claims-invalid','keys-unavailable','verification-failed','owner-denied','independent-mfa-policy-unverified','application-session','application-policy','policy-binding','owner-policy','policy-mfa','session-predates-policy','amr-absent','mfa-marker-absent']);
export function authDiagnostic(error,stage){
 if(!['private-editor','weekly'].includes(stage)||error?.status!==403)return {};
 const code=error.authCode;
 if(typeof code!=='string'||!(categories.has(code)||/^policy-api-[1-5][0-9]{2}$/.test(code)||/^policy-unavailable-(TypeError|SyntaxError|TimeoutError|AbortError|other)$/.test(code)))return {};
 return {diagnostic:{stage,category:code}};
}
