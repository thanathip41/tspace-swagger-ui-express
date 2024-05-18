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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Swagger = void 0;
require("reflect-metadata");
const getRouteParams = (path) => {
    const params = [];
    const regex = /:([^\/]+)/g;
    let match;
    while ((match = regex.exec(path)) !== null) {
        params.push(match[1]);
    }
    return params;
};
const specPaths = (routes, options) => {
    var _a, _b, _c, _d;
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
                return String(v === null || v === void 0 ? void 0 : v.path).replace(/:(\w+)/g, "{$1}") === path ||
                    `/api${v === null || v === void 0 ? void 0 : v.path}`.replace(/:(\w+)/g, "{$1}") === path;
            });
            if (match == null)
                return null;
            return match;
        }).filter(d => d != null)[0];
        if (swagger != null) {
            const spec = {};
            if (swagger.bearerToken) {
                spec.security = [{ "BearerToken": [] }];
            }
            if (swagger.description != null) {
                spec.summary = swagger.description;
            }
            const tags = /\/api\/v\d+/.test(r.path)
                ? r.path.split('/')[3]
                : /\/api/.test(r.path)
                    ? r.path.split('/')[2]
                    : r.path.split('/')[1];
            spec.tags = [
                swagger.tags == null
                    ? tags == null || tags === '' ? 'default' : tags
                    : swagger.tags
            ];
            if (Array.from(r.params).length) {
                spec.parameters = Array.from(r === null || r === void 0 ? void 0 : r.params).map(p => {
                    return {
                        name: p,
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
                spec.parameters = Object.entries(swagger.query).map(([k, v]) => {
                    return {
                        name: k,
                        in: "query",
                        required: v.required == null ? false : true,
                        schema: {
                            type: v.type
                        }
                    };
                });
            }
            if (swagger.body != null) {
                spec.requestBody = {
                    description: ((_a = swagger.body) === null || _a === void 0 ? void 0 : _a.description) == null ? "description" : swagger.body.description,
                    required: ((_b = swagger.body) === null || _b === void 0 ? void 0 : _b.required) == null ? false : true,
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
                    description: ((_c = swagger.files) === null || _c === void 0 ? void 0 : _c.description) == null ? "description" : swagger.files.description,
                    required: ((_d = swagger.files) === null || _d === void 0 ? void 0 : _d.required) == null ? false : true,
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
            spec.responses = {};
            if (swagger.responses != null) {
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
                                    properties: Object.keys(response.example)
                                        .reduce((prev, key) => {
                                        prev[key] = { example: response.example[key] };
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
        const spec = {};
        const tags = /\/api\/v\d+/.test(path)
            ? path.split('/')[3]
            : /\/api/.test(path)
                ? path.split('/')[2]
                : path.split('/')[1];
        spec.tags = [
            tags == null || tags === '' ? 'default' : tags
        ];
        if (Array.from(r.params).length) {
            spec.parameters = Array.from(r.params).map(params => {
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
        spec.responses = {};
        paths[path][method] = spec;
    }
    return paths;
};
const normalizePath = (...paths) => {
    const path = paths
        .join('/')
        .replace(/\/+/g, '/')
        .replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return /\/api\/api/.test(normalizedPath) ? normalizedPath.replace(/\/api\/api\//, "/api/") : normalizedPath;
};
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
exports.default = (express, doc = {}) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g;
        try {
            const swaggers = [];
            const controllers = [...new Set((_a = doc === null || doc === void 0 ? void 0 : doc.controllers) !== null && _a !== void 0 ? _a : [])];
            for (const controller of controllers) {
                const swagger = (_b = Reflect.getMetadata("swaggers", controller)) !== null && _b !== void 0 ? _b : [];
                if (!swagger.length)
                    continue;
                swaggers.push(() => swagger);
            }
            const spec = {
                "openapi": (_c = doc.openapi) !== null && _c !== void 0 ? _c : "3.1.0",
                "info": (_d = doc.info) !== null && _d !== void 0 ? _d : {
                    title: 'API Documentation',
                    description: "Documentation",
                    version: '1.0.0'
                },
                "components": {
                    "securitySchemes": {
                        "BearerToken": {
                            "type": "apiKey",
                            "name": "Authorization",
                            "in": "header",
                            "description": "Enter your token in the format : 'Bearer YOUR_TOKEN'"
                        }
                    }
                },
                "servers": (_e = doc.servers) !== null && _e !== void 0 ? _e : [{ url: "", description: 'default' }],
                "tags": (_f = doc.tags) !== null && _f !== void 0 ? _f : [],
                "paths": {},
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
            spec.paths = specPaths(routes, swaggers);
            const html = `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
                    <meta name="description" content="SwaggerUI" />
                    <title>SwaggerUI</title>
                    <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@3.23.4/favicon-32x32.png" sizes="32x32">
                    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
                </head>
                <body>
                    <div id="swagger-ui"></div>
                </body>
                <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>
                <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js" crossorigin></script>
                <script>
                    window.onload = () => {
                        window.ui = SwaggerUIBundle({ spec : {{spec}} , dom_id: '#swagger-ui',presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset], layout: "StandaloneLayout"});
                    };
                </script>
            </html>
            `.replace('{{spec}}', `${JSON.stringify(spec)}`);
            express.use((_g = doc.path) !== null && _g !== void 0 ? _g : '/api/docs', (req, res) => {
                return res.send(html);
            });
            return next();
        }
        catch (err) {
            return next(err);
        }
    });
};
