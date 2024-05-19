import 'reflect-metadata';
import expressEx, { Application, NextFunction, Request, Response } from "express";
import { TSwagger, TSwaggerDoc } from "./types";
/**
 *
 * @param {Object} data
 * @property {string} data.mapPath
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
export declare const Swagger: (data: TSwagger) => (target: {
    constructor: any;
}, propertyKey: string) => void;
/**
 *
 * @param {Application} express  Application express() instance
 * @param {Object} doc
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
declare const _default: (express: Application, doc?: TSwaggerDoc) => (req: Request, res: Response, next: NextFunction) => Promise<void | expressEx.Response<any, Record<string, any>>>;
export default _default;
