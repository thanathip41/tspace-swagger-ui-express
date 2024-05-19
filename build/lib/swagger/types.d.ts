type TSwaggerFormat = "string" | "number" | "integer" | "boolean" | "object" | "array" | "date" | "date-time" | "password" | "int32" | "int64" | "float" | "double" | "byte" | "binary" | "base64" | "email" | "uuid" | "uri" | "hostname" | "ipv4" | "ipv6" | "json" | "xml";
type TSwaggerType = "string" | "number" | "integer" | "boolean" | "object" | "array" | "date" | "date-time" | "file";
export type TSwagger = {
    match: {
        path: string;
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'get' | 'post' | 'put' | 'patch' | 'delete';
    };
    controllers?: any[];
    description?: string;
    bearerToken?: boolean;
    tags?: string[];
    cookies?: {
        names: string[];
        required?: boolean;
        description?: string;
    };
    query?: Record<string, {
        required?: boolean;
        description?: string;
        type: TSwaggerType;
        example?: any;
    }>;
    body?: {
        required?: boolean;
        description?: string;
        properties: Record<string, {
            type: TSwaggerType;
            example?: any;
        }>;
    };
    files?: {
        required?: boolean;
        description?: string;
        properties: Record<string, {
            type: TSwaggerType;
            format?: TSwaggerFormat;
            items?: any;
            example?: any;
        }>;
    };
    responses?: {
        status: number;
        description: string;
        example?: Record<string, any>;
    }[];
};
export type TSwaggerDoc = {
    path?: string;
    staticUrl?: string;
    controllers?: any[];
    servers?: {
        url: string;
        description?: string;
    }[];
    tags?: string[];
    openapi?: string;
    info?: {
        title?: string;
        description?: string;
        version?: string;
    };
    responses?: {
        status: number;
        description: string;
        example?: Record<string, any>;
    }[];
};
export {};
