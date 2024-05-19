# tspace-swagger-ui-express

[![NPM version](https://img.shields.io/npm/v/tspace-swagger-ui-express.svg)](https://www.npmjs.com)
[![NPM downloads](https://img.shields.io/npm/dm/tspace-swagger-ui-express.svg)](https://www.npmjs.com)

tspace-swagger-ui-express is an auto-generated Swagger-UI API documentation tool for Express applications.

## Install

Install with [npm](https://www.npmjs.com/):

```sh
npm install tspace-swagger-ui-express --save

```
## Basic Usage
- [Setup](#setup)
- [Custom](#custom)
  - [Server](#server)
  - [Controller](#controller)
  - [Router](#router)

## Setup
```js
import express , { Request , Response , NextFunction } from 'express';
import swagger from 'tspace-swagger-ui-express';

(async() => { 

  const app = express()

  app.get("/", (req : Request, res : Response , next : NextFunction) => {
    return res.send("Hello, world!");
  });

   app.get("/:uuid", (req : Request, res : Response , next : NextFunction) => {
    return res.send(`Hello, world! with uuid : ${req.params.uuid}`);
  });

  app.use(swagger(app))
  
  const PORT = 3000;

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  })
  
})()

```
## Custom

### Server
```js
import express , { Request , Response , NextFunction } from 'express';
import swagger from 'tspace-swagger-ui-express';
import catRoute from './catRoute';
import CatController from './CatController';

(async() => { 

  const app = express()

  app.get("/", (req : Request, res : Response , next : NextFunction) => {
    return res.send("Hello, world!");
  });

  app.use("/api/v1/cats",catRoute)

  app.use(swagger(app , { 
    path : "/api/docs",
    servers : [
      { url : "http://localhost:3000" , description : "development"}, 
      { url : "http://localhost:8000" , description : "production"}
    ],
    info : {
      "title" : "Welcome to the documentation of the 'cats' story",
      "description" : "This is the documentation description about around the 'cats' story"
    },
    responses : [
      { status : 200 , description : "OK" , example : { success : true , message : "Cats say 'OK, slave'😻" , statsCode : 200 }},
      { status : 201 , description : "Created" , example : { success : true , message : "Cats say 'Welcome, new slave'😻" , statsCode : 201 }},
      { status : 400 , description : "Bad Request" , example : { success : false , message : "Cats say 'Bad foods'😻" , statsCode : 400 }},
      { status : 401 , description : "Unauthorized" , example : { success : false , message : "Cats say 'Give me the food first'😻" , statsCode : 401 }},
      { status : 403 , description : "Forbidden" , example : { success : false , message : "Cats say 'Not your business, slave'😻" , statsCode : 401 }},
      { status : 500 , description : "Server Error" , example : { success : false , message : "Cats can't say 'What's the curse'😻" , statsCode : 500 }}
    ],
    controllers : [CatController] // For custom requests related to controllers with decorators such as @Swagger.
  }))
  
  const PORT = 3000;
  
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
  
})()

```

### Controller
```js
import { Request , Response , NextFunction } from 'express';
import { Swagger } from 'tspace-swagger-ui-express';

class CatController {
  @Swagger({
    match : {
      path : "/v1/cats",
      method : 'GET',
    },
    query : {
      id: {
        type : 'string',
        required: true,
        description : "The 'id' of the cat"
      },
      name: {
        type : 'string',
      }
    },
    cookies : {
     values : ['id', 'name'],
     description : 'The cookies for every logged'
    },
    bearerToken : true,
    responses : [
      { status : 200 , description : "OK" , example : { id : 1 , name : 'catz' }},
      { status : 400 , description : "Bad request" , example : { message : "Bad Bad Bad food" }}
    ]
  })
  public index (req : Request , res : Response , next : NextFunction) {
    return res.json({ message : 'hello world' });
  }

  @Swagger({
    match : {
      path : "/v1/cats",
      method : 'POST',
    },
    bearerToken : true,
    body : {
      description : 'The description !',
      required : true,
      properties : {
        id : {
          type : 'number',
          example : 1
        },
        name :  {
          type : 'string',
          example : "xxxxx"
        }
      }
    }
  })
  public store (req : Request , res : Response , next : NextFunction) {
    return res.json({ message : req.params });
  }

  @Swagger({
    match : {
      path : "/v1/cats/:uuid",
      method : 'GET',
    },
    responses : [
      { status : 200 , description : "OK" , example : { id : 'catz' }},
      { status : 400 , description : "Bad request" , example : { id : 'catz' }}
    ]

  })
  public show (req : Request , res : Response , next : NextFunction) {
    return res.json({ message : req.params });
  }


  @Swagger({
    match : {
      path : "/v1/cats/:uuid",
      method : 'PATCH',
    },
    bearerToken : true,
    body : {
      description : 'The description !',
      required : true,
      properties : {
        id : {
          type : 'number',
          example : 1
        },
        name :  {
          type : 'string',
          example : "xxxxx"
        }
      }
    }
  })
  public async updated (req : Request , res : Response , next : NextFunction) {
    return res.json({ body : req.body})
  }

  @Swagger({
    match : {
      path : "/v1/cats/:uuid",
      method : 'PUT',
    },
    bearerToken : true,
    body : {
      description : 'The description !',
      required : true,
      properties : {
        id : {
          type : 'number',
          example : 1
        },
        name :  {
          type : 'string',
          example : "xxxxx"
        }
      }
    }
  })
  public async update (req : Request , res : Response , next : NextFunction) {
    return res.json({ body : req.body})
  }

  @Swagger({
    match : {
      path : "/v1/cats/:uuid",
      method : 'DELETE',
    },
    bearerToken : true
  })
  public async delete(req : Request , res : Response , next : NextFunction) {
    return res.json({ params : req.params})
  }

  @Swagger({
    match : {
      path : "/v1/cats/upload",
      method : "POST",
    },
    bearerToken : true,
    files : {
      required : true,
      properties : {
        file : {
          type : 'array',
          items: {
            type:"file",
            format:"binary"
          }
        },
        name : {
          type : 'string'
        }
      }
    }
  })
  public async upload (req : Request , res : Response , next : NextFunction) {
    return res.json({ files : 'files' })
  }
}

export {CatController }
export default CatController
```

### Router
```js
import { Router } from "express"
import { CatController } from "./CatController"
const catRouter = Router()
const catInstance = new CatController()

catRouter
.get('/' , catInstance.index)
.post('/' , catInstance.store)
.post('/upload' , catInstance.upload)
.get('/:uuid' , catInstance.show)
.put('/:uuid' , catInstance.update)
.patch('/:uuid' , catInstance.updated)
.delete('/:uuid' , catInstance.delete)

export { catRouter }
export default catRouter
```