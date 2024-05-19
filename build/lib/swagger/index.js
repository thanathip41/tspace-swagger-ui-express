"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerJSON = exports.swaggerYAML = exports.Swagger = void 0;
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const swagger_ui_dist_1 = __importDefault(require("swagger-ui-dist"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const getRouteParams = (path) => {
    const params = [];
    const regex = /:([^\/]+)/g;
    let match;
    while ((match = regex.exec(path)) !== null) {
        params.push(match[1]);
    }
    return params;
};
const normalizePath = (...paths) => {
    const path = paths
        .join('/')
        .replace(/\/+/g, '/')
        .replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return /\/api\/api/.test(normalizedPath) ? normalizedPath.replace(/\/api\/api\//, "/api/") : normalizedPath;
};
const specPaths = (routes, options, httpResponse) => {
    var _a, _b, _c, _d, _e;
    const paths = {};
    for (const r of routes) {
        if (r.path === '*')
            continue;
        const path = r.path.replace(/:(\w+)/g, "{$1}");
        const method = r.method.toLocaleLowerCase();
        if (paths[path] == null) {
            paths[path] = {
                [method]: {}
            };
        }
        const swagger = options.map((option) => {
            const values = option();
            const match = values.find((v) => {
                var _a, _b, _c;
                return (String((_a = v === null || v === void 0 ? void 0 : v.match) === null || _a === void 0 ? void 0 : _a.method).toLocaleLowerCase() === method.toLocaleLowerCase()) &&
                    (String((_b = v === null || v === void 0 ? void 0 : v.match) === null || _b === void 0 ? void 0 : _b.path).replace(/:(\w+)/g, "{$1}") === path ||
                        `/api${(_c = v === null || v === void 0 ? void 0 : v.match) === null || _c === void 0 ? void 0 : _c.path}`.replace(/:(\w+)/g, "{$1}") === path);
            });
            if (match == null)
                return null;
            return match;
        }).filter(d => d != null)[0];
        const spec = {};
        spec.tags = [];
        spec.parameters = [];
        spec.responses = {};
        if (httpResponse != null) {
            const responses = {};
            for (const response of httpResponse) {
                if (response == null || !Object.keys(response).length)
                    continue;
                responses[`${response.status}`] = {
                    description: response.description,
                    content: {
                        "application/json": {
                            schema: {
                                type: 'object',
                                properties: response.example == null
                                    ? {}
                                    : Object.keys(response.example)
                                        .reduce((prev, key) => {
                                        var _a, _b;
                                        prev[key] = { example: (_b = ((_a = response === null || response === void 0 ? void 0 : response.example) !== null && _a !== void 0 ? _a : {})[key]) !== null && _b !== void 0 ? _b : {} };
                                        return prev;
                                    }, {})
                            }
                        }
                    }
                };
            }
            spec.responses = Object.assign({}, responses);
        }
        const tags = /\/api\/v\d+/.test(r.path)
            ? `${r.path.split('/')[3]}`
            : /\/api/.test(r.path)
                ? r.path.split('/')[2]
                : r.path.split('/')[1];
        spec.tags = [
            (swagger === null || swagger === void 0 ? void 0 : swagger.tags) == null
                ? tags == null || tags === '' || /^:[^:]*$/.test(tags) ? 'default' : tags
                : swagger.tags
        ];
        if (swagger != null) {
            if (swagger.bearerToken) {
                spec.security = [{ "BearerToken": [], "cookies": [] }];
            }
            if (swagger.description != null) {
                spec.summary = swagger.description;
            }
            if (Array.from(r.params).length) {
                spec.parameters = Array.from(r === null || r === void 0 ? void 0 : r.params).map(params => {
                    return {
                        name: params,
                        in: "path",
                        required: true,
                        schema: {
                            type: "string"
                        }
                    };
                });
                if (swagger.query != null) {
                    spec.parameters = [
                        ...spec.parameters,
                        Object.entries(swagger.query).map(([k, v]) => {
                            return {
                                name: k,
                                in: "query",
                                required: v.required == null ? false : true,
                                schema: {
                                    type: v.type
                                }
                            };
                        })
                    ];
                }
            }
            if (swagger.query != null) {
                spec.parameters = Object.entries(swagger.query)
                    .map(([k, v]) => {
                    return {
                        name: k,
                        in: "query",
                        required: v.required == null ? false : true,
                        schema: {
                            type: v.type
                        },
                        description: v.description
                    };
                });
            }
            if (swagger.cookies != null) {
                spec.parameters = [
                    ...spec.parameters,
                    ...[{
                            name: "Cookie",
                            in: "header",
                            required: swagger.cookies.required == null ? false : true,
                            schema: {
                                type: "string"
                            },
                            example: swagger.cookies.names.map((v, i) => `${v}={value${i + 1}}`).join(' ; '),
                            description: (_a = swagger.cookies) === null || _a === void 0 ? void 0 : _a.description
                        }]
                ];
            }
            if (swagger.body != null) {
                spec.requestBody = {
                    description: ((_b = swagger.body) === null || _b === void 0 ? void 0 : _b.description) == null ? "description" : swagger.body.description,
                    required: ((_c = swagger.body) === null || _c === void 0 ? void 0 : _c.required) == null ? false : true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: swagger.body.properties
                            }
                        }
                    }
                };
            }
            if (swagger.files != null) {
                spec.requestBody = {
                    description: ((_d = swagger.files) === null || _d === void 0 ? void 0 : _d.description) == null ? "description" : swagger.files.description,
                    required: ((_e = swagger.files) === null || _e === void 0 ? void 0 : _e.required) == null ? false : true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                properties: swagger.files.properties
                            }
                        }
                    }
                };
            }
            if (swagger.responses != null) {
                spec.responses = {};
                const responses = {};
                for (const response of swagger.responses) {
                    if (response == null || !Object.keys(response).length)
                        continue;
                    responses[`${response.status}`] = {
                        description: response.description,
                        content: {
                            "application/json": {
                                schema: {
                                    type: 'object',
                                    properties: response.example == null
                                        ? {}
                                        : Object.keys(response.example)
                                            .reduce((prev, key) => {
                                            var _a, _b;
                                            prev[key] = { example: (_b = ((_a = response === null || response === void 0 ? void 0 : response.example) !== null && _a !== void 0 ? _a : {})[key]) !== null && _b !== void 0 ? _b : {} };
                                            return prev;
                                        }, {})
                                }
                            }
                        }
                    };
                }
                spec.responses = Object.assign({}, responses);
            }
            paths[path][method] = spec;
            continue;
        }
        if (Array.from(r.params).length) {
            spec.parameters = Array.from(r.params)
                .map(params => {
                return {
                    name: params,
                    in: "path",
                    required: true,
                    schema: {
                        type: "string"
                    }
                };
            });
        }
        paths[path][method] = spec;
    }
    return paths;
};
const specSwagger = (express, doc = {}) => {
    var _a, _b, _c, _d, _e, _f;
    const swaggers = [];
    const controllers = [...new Set((_a = doc === null || doc === void 0 ? void 0 : doc.controllers) !== null && _a !== void 0 ? _a : [])];
    for (const controller of controllers) {
        const swagger = (_b = Reflect.getMetadata("swaggers", controller)) !== null && _b !== void 0 ? _b : [];
        if (!swagger.length)
            continue;
        swaggers.push(() => swagger);
    }
    const spec = {
        openapi: (_c = doc.openapi) !== null && _c !== void 0 ? _c : "3.1.0",
        info: (_d = doc.info) !== null && _d !== void 0 ? _d : {
            title: 'API Documentation',
            description: "Documentation",
            version: '1.0.0'
        },
        components: {
            securitySchemes: {
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
        servers: (_e = doc.servers) !== null && _e !== void 0 ? _e : [{ url: "", description: 'default' }],
        tags: (_f = doc.tags) !== null && _f !== void 0 ? _f : [],
        paths: {},
    };
    const routes = [];
    for (const middleware of express._router.stack) {
        if (middleware.route) {
            const route = {
                method: middleware.route.stack[0].method.toUpperCase(),
                path: normalizePath(middleware.route.path),
                params: getRouteParams(middleware.route.path)
            };
            routes.push(route);
            continue;
        }
        if (middleware.name === 'router') {
            middleware.handle.stack.forEach((handler) => {
                const route = {
                    method: handler.route.stack[0].method.toUpperCase(),
                    path: normalizePath(middleware.regexp.toString()
                        .replace("/^\\", '')
                        .replace('\\/?(?=\\/|$)/i', '')
                        .replace(/\\\//g, "/"), handler.route.path).replace(/:(\w+)/g, "{$1}"),
                    params: getRouteParams(handler.route.path)
                };
                routes.push(route);
            });
        }
    }
    spec.paths = specPaths(routes, swaggers, doc.responses);
    return spec;
};
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
const Swagger = (data) => {
    return (target, propertyKey) => {
        const controller = target.constructor;
        const swaggers = Reflect.hasMetadata("swaggers", controller)
            ? Reflect.getMetadata("swaggers", controller)
            : [];
        swaggers.push(Object.assign({ handler: propertyKey }, data));
        Reflect.defineMetadata("swaggers", swaggers, controller);
    };
};
exports.Swagger = Swagger;
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
const swaggerYAML = (express, doc = {}) => {
    return js_yaml_1.default.dump(specSwagger(express, doc));
};
exports.swaggerYAML = swaggerYAML;
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
const swaggerJSON = (express, doc = {}) => {
    return JSON.stringify(specSwagger(express, doc), null, 2);
};
exports.swaggerJSON = swaggerJSON;
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
exports.default = (express, doc = {}) => {
    const STATIC_URL = '/api/static/swagger-ui';
    express.use(STATIC_URL, express_1.default.static(swagger_ui_dist_1.default.getAbsoluteFSPath()));
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        try {
            if (req.path !== ((_a = doc.path) !== null && _a !== void 0 ? _a : '/api/docs'))
                return next();
            const spec = specSwagger(express, doc);
            const iconURL = normalizePath((_b = doc.staticUrl) !== null && _b !== void 0 ? _b : '', `${STATIC_URL}/favicon-32x32.png`).replace(/^\/(http[s]?:\/{0,2})/, '$1');
            const cssURL = normalizePath((_c = doc.staticUrl) !== null && _c !== void 0 ? _c : '', `${STATIC_URL}/swagger-ui.css`).replace(/^\/(http[s]?:\/{0,2})/, '$1');
            const scriptBundle = normalizePath((_d = doc.staticUrl) !== null && _d !== void 0 ? _d : '', `${STATIC_URL}/swagger-ui-bundle.js`).replace(/^\/(http[s]?:\/{0,2})/, '$1');
            const scriptStandalonePreset = normalizePath((_e = doc.staticUrl) !== null && _e !== void 0 ? _e : '', `${STATIC_URL}/swagger-ui-standalone-preset.js`).replace(/^\/(http[s]?:\/{0,2})/, '$1');
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
                        window.ui = SwaggerUIBundle({ spec : ${JSON.stringify(spec)} , 
                        dom_id: '#swagger-ui',
                        withCredentials: true,
                        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset], layout: "StandaloneLayout"});
                    };
                </script>
            </html>
            `;
            return res.send(html);
        }
        catch (err) {
            return next(err);
        }
    });
};
