interface FunctionEvent {
    body: string;
    headers: {};
    method: string;
    query: string;
    path: string;
}

interface FunctionContext {
    value: number;
    cb: () => any;
    headerValues: {};
    cbCalled: number;

    status(value): FunctionContext;
    status(): number;
    headers(value): FunctionContext;
    headers(): {};
    succeed(value): void;
    fail(value): void;
}