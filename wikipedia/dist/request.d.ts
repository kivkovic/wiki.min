declare function makeRequest(params: any, redirect?: boolean): Promise<any>;
export declare function makeRestRequest(path: string, redirect?: boolean): Promise<any>;
export declare function returnRestUrl(path: string): string;
export declare function setAPIUrl(prefix: string): string;
export default makeRequest;
