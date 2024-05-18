import 'reflect-metadata';
import { Application, NextFunction, Request, Response } from "express";
import { TSwagger, TSwaggerDoc } from "./types";
export declare const Swagger: (data: TSwagger) => (target: any, propertyKey: any) => void;
declare const _default: (express: Application, doc?: TSwaggerDoc) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export default _default;
