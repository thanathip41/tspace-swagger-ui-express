type TSwaggerFormat = "string" | "number" | "integer" | "boolean" | "object" | "array" | "date" | "date-time" | "password" | "int32" | "int64" | "float" | "double" | "byte" | "binary" | "base64" | "email" | "uuid" | "uri" | "hostname" | "ipv4" | "ipv6" | "json" | "xml";

type TSwaggerType = "string" | "number" | "integer" | "boolean" | "object" | "array" | "date" | "date-time" | "file"

export type TMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'get' | 'post' | 'put' | 'patch' | 'delete'

export type TSwagger = {
    match : {
        path : string
        method : TMethod | TMethod[]
    },
    controllers ?: any[],
    description ?: string
    summary ?: string,
    bearerToken ?: boolean
    tags        ?: string[]
    params ?: Record<string , {
        description ?: string,
        type ?: TSwaggerType
        example ?: any
    }>
    query ?: Record<string , {
        required ?: boolean,
        description ?: string,
        type ?: TSwaggerType
        example ?: any
    }>
    body  ?: {
        required ?: boolean,
        description ?: string,
        properties : Record<string , {
            type : TSwaggerType
            example ?: any
        }>
    }
    files  ?: {
        required ?: boolean,
        description ?: string,
        properties : Record<string , {
            type : TSwaggerType
            format ?: TSwaggerFormat,
            items ?: any,
            example ?: any
        }>
    }
    cookies ?: {
        names : string[],
        required ?: boolean,
        description ?: string
    }
    responses ?: {
        status : number,
        description : string,
        example ?: Record<string,any>
    }[]
}

export type TSwaggerDoc = {
    customOnly ?: boolean
    excepts ?: (string | RegExp | { path : string | RegExp , method : TMethod | TMethod[] })[]
    use ?: `${string}.json` | `${string}.yaml`
    path ?: string
    staticUrl ?: string
    controllers ?: (new () => any)[] | { folder : string ,  name ?: RegExp}
    servers ?: { url : string , description ?: string }[]
    tags ?: string[]
    openapi ?: string
    info ?: {
        title ?: string,
        description ?: string,
        version ?: string
    }
    responses ?: {
        status : number,
        description : string,
        example ?: Record<string,any>
    }[]
}
