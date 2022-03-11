export function handler(context: FaasHandlerContext, callback: FaaSHandlerCallback) {
    return callback(undefined, {status: "done"});
}
