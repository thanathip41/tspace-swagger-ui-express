import 'reflect-metadata';
import expressEx, { Application, NextFunction, Request, Response } from "express";
import swaggerUiDist from 'swagger-ui-dist'
import yaml from 'js-yaml'
import path from 'path'
import fs from 'fs'
import { TSwagger, TSwaggerDoc , TMethod} from "./types";


const expandedSwagger = (swaggers : TSwagger[]) => {

    return swaggers.reduce((acc : TSwagger[], v : TSwagger) => {
        if (!Array.isArray(v.match?.method)) {
            acc.push(v)
            return acc
        }

        v.match?.method.forEach(method => {
            acc.push({
                ...v,
                match: {
                    ...v.match,
                    method
                }
            })
        })

        return acc
        
    }, [])
}

const deepImport = async (dir: string , pattern ?: RegExp): Promise<string[]> => {
    const directories = fs.readdirSync(dir, { withFileTypes: true });
    const files: any[] = (await Promise.all(
      directories.map((directory) => {
        const newDir = path.resolve(String(dir), directory.name);

        if(pattern == null) {
            return directory.isDirectory() ? deepImport(newDir,pattern) : newDir;
        }
        
        return directory.isDirectory() 
        ? deepImport(newDir,pattern) 
        : pattern.test(directory.name) 
          ? newDir
          : null
      })
    )).filter(d => d != null)

    return [].concat(...files);
}

const getRouteParams = (path: string): string[] => {
    const params: string[] = [];
    const regex = /:([^\/]+)/g;
    let match;
    while ((match = regex.exec(path)) !== null) {
        params.push(match[1]);
    }
    return params;
}

const normalizePath = (...paths: string[]) : string => {
    const path = paths
    .join('/')
    .replace(/\/+/g, '/')
    .replace(/\/+$/, '')

    const normalizedPath = path.startsWith('/') ? path : `/${path}`

    return /\/api\/api/.test(normalizedPath) ? normalizedPath.replace(/\/api\/api\//, "/api/") : normalizedPath
}

const pathIsExcepts = ({ excepts , path , method } :{
    excepts : (string | RegExp | { path : string | RegExp , method : TMethod | TMethod[] })[],
    path : string,
    method : string
}) => {
    return Array.from(excepts).some((except) => {

        const orginPath = path.replace(/{(\w+)}/g, ":$1")
    
        if(except instanceof RegExp) {
            return except.test(orginPath)
        }
    
        if(typeof except === 'string') {
            return except === orginPath
        }
    
        if(except.path instanceof RegExp) {
            return except.path.test(orginPath) && 
            Array.isArray(except.method) 
                ? Array.from(except.method).some(m => m.toLocaleLowerCase() === method)
                : String(except.method).toLocaleLowerCase() === method
        }
    
        return String(except.path) === orginPath && 
        Array.isArray(except.method) 
            ? Array.from(except.method).some(m => m.toLocaleLowerCase() === method)
            : String(except.method).toLocaleLowerCase() === method
       
    })
}

const specPaths = (
    routes : { method : string , path : string , params : string[] }[] , 
    options : Function[] , 
    doc : TSwaggerDoc,
    ) => {

    const paths : Record<string,any> = {}

    for(const r of routes) {

        if(r.path === '*') continue
        
        const path = r.path.replace(/:(\w+)/g, "{$1}")
        const method = r.method.toLocaleLowerCase()

        if(doc.excepts != null && pathIsExcepts({
            excepts : doc.excepts,
            path,
            method
        })) continue
        
        if(paths[path] == null) {
            paths[path] = {
                [method]: {}
            }
        }

        const swagger = options.map((option : Function) => {
            const values = option() as { match : { path : string , method : string } }[]
            const match = values.find((v: { match : { path: string; method : string }}) => {
                return (String(v?.match?.method).toLocaleLowerCase() === method.toLocaleLowerCase()) && 
                (String(v?.match?.path).replace(/:(\w+)/g, "{$1}") === path || 
                `/api${v?.match?.path}`.replace(/:(\w+)/g, "{$1}") === path)
            })
            if(match == null) return null
            return match
        }).filter(d => d != null)[0] as TSwagger | null

        const spec : Record<string,any> = {}
        spec.tags = []
        spec.parameters = []
        spec.responses = {}

        if(doc.responses != null) {
            const responses : Record<string,any> = {}
            for(const response of doc.responses) {
           
                if(response == null || !Object.keys(response).length) continue

                responses[`${response.status}`] = {
                    description: response.description, 
                    content: {
                        "application/json": {
                            schema : {
                                type: 'object', 
                                properties: response.example == null 
                                ? {} 
                                : Object.keys(response.example)
                                .reduce((prev : Record<string,any>, key : string) => {
                                    prev[key] = { example : (response?.example ?? {})[key] ?? {} }
                                    return prev;
                                }, {})
                            }
                        }
                    }
                }
            }

            spec.responses = {
                ...responses
            }
        }

        const tags = /\/api\/v\d+/.test(r.path)
        ? `${ r.path.split('/')[3]}`
        : /\/api/.test(r.path)
            ? r.path.split('/')[2]
            : r.path.split('/')[1]

        spec.tags = [
            swagger?.tags == null
            ? tags == null || tags === '' || /^:[^:]*$/.test(tags) ? 'default' : tags
            : swagger.tags
        ]

        if((doc.customOnly != null && doc.customOnly) && swagger == null) {
            delete paths[path][method]
            continue 
        }
            

        if(swagger != null) {

            if(swagger.bearerToken) {
                spec.security = [{ "BearerToken": [] , "cookies": [] }]
            }

            if(swagger.description != null) {
                spec.summary = swagger.description
            } 
           
            if(Array.from(r.params).length) {
                spec.parameters = Array.from(r?.params).map(params => {
                    if(swagger.params != null && swagger.params[`${params}`]) {
                        const v = swagger.params[`${params}`]
                        return {
                            name : params,
                            in : "path",
                            required: true,
                            schema: {
                                type: v.type ?? "string"
                            },
                            example: v.example,
                            description : v.description
                        }
                    }
                
                    return {
                        name : params,
                        in : "path",
                        required: true,
                        schema: {
                            type: "string"
                        }
                    }
                    
                })

                if(swagger.query != null) {
                    spec.parameters = [
                        ...spec.parameters,
                        Object.entries(swagger.query).map(([k , v]) => {
                            return {
                                name : k,
                                in : "query",
                                required: v.required == null ? false : true,
                                schema: {
                                    type: v.type ?? "string"
                                },
                                example: v.example,
                                description : v.description
                            }
                        })
                    ]
                }
            }

            if(swagger.query != null) {
                spec.parameters = Object.entries(swagger.query)
                .map(([k , v]) => {
                    return {
                        name : k,
                        in : "query",
                        required: v.required == null ? false : true,
                        schema: {
                            type: v.type ?? "string"
                        },
                        example: v.example,
                        description : v.description
                    }
                })
            }

            if(swagger.cookies != null) {
                spec.parameters = [
                    ...spec.parameters,
                    ...[{
                        name : "Cookie",
                        in : "header",
                        required: swagger.cookies.required == null ? false : true,
                        schema: {
                            type: "string"
                        },
                        example : swagger.cookies.names.map((v,i) => `${v}={value${i+1}}`).join(' ; '),
                        description : swagger.cookies?.description
                    }]
                ]
            }

            if(swagger.body != null) {
                spec.requestBody = {
                    description: swagger.body?.description == null ? "description" : swagger.body.description,
                    required: swagger.body?.required == null ? false : true,
                    content : {
                        "application/json" : {
                            schema : {
                                type: "object",
                                properties: swagger.body.properties
                            }
                        }
                    }
                }
            }

            if(swagger.files != null) {
                spec.requestBody = {
                    description: swagger.files?.description == null ? "description" : swagger.files.description,
                    required: swagger.files?.required == null ? false : true,
                    content : {
                        "multipart/form-data" : {
                            schema : {
                                type: "object",
                                properties: swagger.files.properties
                            }
                        }
                    }
                }
            }

            if(swagger.responses != null) {
                spec.responses = {}
                const responses : Record<string,any> = {}
                for(const response of swagger.responses) {
               
                    if(response == null || !Object.keys(response).length) continue

                    responses[`${response.status}`] = {
                        description: response.description, 
                        content: {
                            "application/json": {
                                schema : {
                                    type: 'object', 
                                    properties: response.example == null 
                                    ? {} 
                                    : Object.keys(response.example)
                                    .reduce((prev : Record<string,any>, key : string) => {
                                        prev[key] = { example : (response?.example ?? {})[key] ?? {} }
                                        return prev;
                                    }, {})
                                }
                            }
                        }
                    }
                }

                spec.responses = {
                    ...responses
                }
            }
        
            paths[path][method] = spec
            
            continue
        }

        if(Array.from(r.params).length) {
            spec.parameters = Array.from(r.params)
            .map(params => {
                return {
                    name : params,
                    in : "path",
                    required: true,
                    schema: {
                        type: "string"
                    }
                }
            })
        }

        paths[path][method] = spec           

    }

    return paths
    
}

const specSwagger =  async (express : Application, doc : TSwaggerDoc = {}) => {

    const swaggerHandler = async (controllers ?: any[] | { folder : string ,  name ?: RegExp}) => {
        
        const swaggers: Function[] = []

        if(controllers == null) return swaggers

        if(!Array.isArray(controllers)) {

            const c = await deepImport(controllers.folder , controllers.name)

            for(const file of c) {

               try {

                const response = await import(file)

                const controller = response?.default ?? Object.values(response)[0]

                if(controller == null) continue

                if(!(
                    controller?.prototype && 
                    controller?.prototype?.constructor === controller
                )) continue

                const swagger: TSwagger[] = Reflect.getMetadata("swaggers",controller) ?? []

                if(!Array.isArray(swagger) || !swagger.length) continue

                swaggers.push(() => expandedSwagger(swagger))

               } catch (e) {
                continue
               }
            }

            return swaggers
        }

        for(const controller of controllers) {
            const swagger: TSwagger[] = Reflect.getMetadata("swaggers",controller) ?? []
    
            if(!swagger.length) continue
    
            swaggers.push(() => swagger)
        }

        return swaggers
    }
    const swaggers = await swaggerHandler(doc.controllers)
    
    const spec = {
        openapi : doc.openapi ?? "3.1.0",
        info: doc.info ?? {
            title : 'API Documentation',
            description : "Documentation",
            version : '1.0.0'
        },
        components : {
            securitySchemes : {
                BearerToken: {
                    type: "http",
                    scheme: "bearer",
                    name: "Authorization",
                    description: "Enter your token in the format : 'Bearer {TOKEN}'"
                },
                cookies: {
                    type: "apiKey",
                    in: "header",
                    name: "Cookie",
                    description: "Enter your cookies in the headers"
                }
            }
        },
        servers: doc.servers ?? [{ url : "" , description : 'default' }],
        tags: doc.tags ?? [],
        paths: {},
    }

    const routes: { method: string; path: string; params: string[] }[] = [];

    for (const middleware of express._router.stack) {
        if (middleware.route) {
            const route = {
                method: middleware.route.stack[0].method.toUpperCase(),
                path: normalizePath(middleware.route.path),
                params: getRouteParams(middleware.route.path)
            }

            routes.push(route)

            continue
        } 
        
        if (middleware.name === 'router') {
            middleware.handle.stack.forEach((handler: any) => {
                const route = {
                    method: handler.route.stack[0].method.toUpperCase(),
                    path: normalizePath(
                        middleware.regexp.toString()
                        .replace("/^\\",'')
                        .replace('\\/?(?=\\/|$)/i','')
                        .replace(/\\\//g, "/")
                        ,
                        handler.route.path
                    ).replace(/:(\w+)/g, "{$1}"),
                    params: getRouteParams(handler.route.path)
                }

                routes.push(route)
            })
        }
    }

    spec.paths = specPaths(routes , swaggers , doc)

    return spec
}
/**
 * 
 * @param {object} data
 * @property {object} data.match - { page : string , method : string}
 * @property {string} data.method
 * @property {string | null} data.description
 * @property {boolean | null} data.bearerToken
 * @property {object | null} data.query
 * @property {object | null} data.body
 * @property {object | null} data.files
 * @property {object | null} data.cookies
 * @property {array | null} data.responses
 * 
 * @example
 * 
 *  @Swagger({
 *   path : "/v1/users",
 *   method : 'GET',
 *   bearerToken : true,
 *   responses : [
 *     { status : 200 , description : "OK" , example : { id : 'catz' }},
 *     { status : 400 , description : "Bad request" , example : { message : 'bad request for catz' }}
 *   ]
 * })
 * @returns 
 */
export const Swagger = (data : TSwagger) => {
    return (target: { constructor: any; }, propertyKey: string) => {
        const controller = target.constructor;
        
        const swaggers: (TSwagger & { handler : string })[] = Reflect.hasMetadata("swaggers",controller) 
        ? Reflect.getMetadata("swaggers",controller) 
        : [];

        swaggers.push({
            handler :propertyKey,
            ...data
        });
  
        Reflect.defineMetadata("swaggers", swaggers, controller);
      }
}

/**
 * 
 * @param {Application} express  Application express() instance
 * @param {object} doc
 * @property {string | null} data.path
 * @property {string | null} data.staticUrl
 * @property {Array | null} data.controllers
 * @property {Array | null} data.servers
 * @property {Array | null} data.tags
 * @property {string | null} data.openapi
 * @property {object | null} data.info
 * @property {object | null} data.cookies
 * @property {Array | null} data.responses
 * 
 */
export const swaggerYAML = async (express : Application, doc : TSwaggerDoc = {}) => {
    return yaml.dump(await specSwagger(express , doc))
}

/**
 * 
 * @param {Application} express  Application express() instance
 * @param {object} doc
 * @property {string | null} data.path
 * @property {string | null} data.staticUrl
 * @property {Array | null} data.controllers
 * @property {Array | null} data.servers
 * @property {Array | null} data.tags
 * @property {string | null} data.openapi
 * @property {object | null} data.info
 * @property {object | null} data.cookies
 * @property {Array | null} data.responses
 *
 */
export const swaggerJSON = async (express : Application, doc : TSwaggerDoc = {}) => {
    return JSON.stringify(await specSwagger(express , doc),null,2)
}

/**
 * 
 * @param {Application} express  Application express() instance
 * @param {object} doc
 * @property {string | null} data.path
 * @property {string | null} data.staticUrl
 * @property {Array | null} data.controllers
 * @property {Array | null} data.servers
 * @property {Array | null} data.tags
 * @property {string | null} data.openapi
 * @property {object | null} data.info
 * @property {object | null} data.cookies
 * @property {Array | null} data.responses
 * 
 * @example
 * import express , { Request , Response , NextFunction } from 'express';
 * import swagger from 'tspace-swagger-ui-express';
 * const app = express()
 *
 * app.get("/", (req : Request, res : Response , next : NextFunction) => {
 *   return res.send("Hello, world!")
 * })
 * app.use(swagger(app))
 * 
 * const PORT = 3000
 * 
 * app.listen(PORT, () => {
 *   console.log(`Server is running on http://localhost:${PORT}`);
 * })
 * 
 * // open the localhost:3000/api/docs 
 */
export default (express : Application, doc : TSwaggerDoc = {}) => {

    const STATIC_URL = '/api/static/swagger-ui'

    express.use(STATIC_URL, expressEx.static(swaggerUiDist.getAbsoluteFSPath()))

    return async (req : Request, res : Response , next : NextFunction) => { 

        try {

            if (req.path !== (doc.path ?? '/api/docs')) return next()

            const spec = doc.use == null 
            ? JSON.stringify(await specSwagger(express , doc))
            : String(doc.use).endsWith('.yaml')
              ? JSON.stringify(yaml.load(fs.readFileSync(doc.use, 'utf8')))
              : String(doc.use).endsWith('.json')
                ? fs.readFileSync(doc.use, 'utf8')
                : JSON.stringify(await specSwagger(express , doc))

            const iconURL = normalizePath(doc.staticUrl ?? '', `${STATIC_URL}/favicon-32x32.png`).replace(/^\/(http[s]?:\/{0,2})/, '$1')
            const cssURL  = normalizePath(doc.staticUrl ?? '', `${STATIC_URL}/swagger-ui.css`).replace(/^\/(http[s]?:\/{0,2})/, '$1')
            const scriptBundle = normalizePath(doc.staticUrl ??'' , `${STATIC_URL}/swagger-ui-bundle.js`).replace(/^\/(http[s]?:\/{0,2})/, '$1')
            const scriptStandalonePreset = normalizePath(doc.staticUrl ?? '' , `${STATIC_URL}/swagger-ui-standalone-preset.js`).replace(/^\/(http[s]?:\/{0,2})/, '$1')
        
            const html = `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
                    <meta name="description" content="SwaggerUI" />
                    <title>SwaggerUI</title>
                    <link rel="icon" href="${iconURL}">
                    <link rel="stylesheet" href="${cssURL}" />
                </head>
                <body>
                    <div id="swagger-ui"></div>
                </body>
                <script src="${scriptBundle}"></script>
                <script src="${scriptStandalonePreset}"></script>
                <script>
                    window.onload = () => {
                        window.ui = SwaggerUIBundle({ 
                            spec : ${spec}, 
                            dom_id: '#swagger-ui',
                            withCredentials: true,
                            presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset], 
                            layout: "StandaloneLayout"
                        });
                    };
                </script>
            </html>
            `
            
            return res.send(html)

        } catch (err) {
            
            return next(err)
        }
    }
}