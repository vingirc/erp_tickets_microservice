export interface ApiResponse<T = any> {
    statusCode: number;
    intOpCode: string;
    data: T;
}

export function createResponse<T>(statusCode: number, intOpCode: string, data: T): ApiResponse<T> {
    return { statusCode, intOpCode, data };
}