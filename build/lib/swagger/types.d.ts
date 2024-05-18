export type TSwaggerFormat = "string" | "number" | "integer" | "boolean" | "object" | "array" | "date" | "date-time" | "password" | "int32" | "int64" | "float" | "double" | "byte" | "binary" | "base64" | "email" | "uuid" | "uri" | "hostname" | "ipv4" | "ipv6" | "json" | "xml";
export type TSwaggerType = "string" | "number" | "integer" | "boolean" | "object" | "array" | "date" | "date-time" | "file";
export type TSwagger = {
    path: string;
    controllers?: any[];
    description?: string;
    bearerToken?: boolean;
    tags?: string[];
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
        example?: any;
    }[];
};
export type TSwaggerDoc = {
    controllers?: any[];
    path?: `/${string}`;
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
};
