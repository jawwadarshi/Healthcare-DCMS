/*import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";
export const validateRequest = (schema: ZodTypeAny): RequestHandler => {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      // Forward the ZodError to the centralized error handler,
      // which returns consistent, production-friendly validation responses.
      return next(result.error);
    }

    // Assign validated values back onto req so downstream layers
    // can rely on typed/validated data.
    const data = result.data as { body: any; query: any; params: any };
    req.body = data.body;
    // Express typings keep req.query/req.params as broad types, so we cast.
    req.query = data.query;
    req.params = data.params;

    return next();
  };
}; */

import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

export const validateRequest = (schema: ZodTypeAny): RequestHandler => {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      // Forward the ZodError to the centralized error handler
      return next(result.error);
    }

    // Assign validated values back onto req.
    // We overwrite req.body (Express allows this), but we use 
    // Object.assign for query and params because they are read-only getters in some environments.
    const data = result.data as { body: any; query: any; params: any };

    req.body = data.body;

    if (data.query) {
      Object.assign(req.query, data.query);
    }

    if (data.params) {
      Object.assign(req.params, data.params);
    }

    return next();
  };
};
