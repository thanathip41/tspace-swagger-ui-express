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
```js

// in UserController.ts
import { Request , Response , NextFunction } from 'express';
import { Swagger } from 'tspace-swagger-ui-express';

class UserController {
  @Swagger({
    path : "/v1/users",
    bearerToken : true,
    responses : [
      { status : 200 , description : "OK" , example : { id : 'catzxxxxxx' }},
      { status : 400 , description : "Bad request" , example : { id : 'catz' }}
    ]
  })
  public index (req : Request , res : Response , next : NextFunction) {
    return res.json({ message : 'hello world' });
  }

  @Swagger({
    path : "/v1/users/:uuid",
    responses : [
      { status : 200 , description : "OK" , example : { id : 'catz' }},
      { status : 400 , description : "Bad request" , example : { id : 'catz' }}
    ]

  })
  public show (req : Request , res : Response , next : NextFunction) {
    return res.json({ message : req.params });
  }

  @Swagger({
    path : "/v1/users",
    bearerToken : true,
    body : {
      description : 'The description !',
      required : true,
      properties : {
        id : {
          type : 'integer',
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
    path : "/v1/users/:uuid",
    bearerToken : true,
    body : {
      description : 'The description !',
      required : true,
      properties : {
        id : {
          type : 'integer',
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
    return {
      body : req.body
    }
  }

  @Swagger({
    path : "/v1/users/:uuid",
    bearerToken : true,
    body : {
      description : 'The description !',
      required : true,
      properties : {
        id : {
          type : 'integer',
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
    return {
      body : req.body
    }
  }

  @Swagger({
    path : "/v1/users/:uuid",
    bearerToken : true
  })
  public async delete(req : Request , res : Response , next : NextFunction) {
    return {
      params : req.params
    }
  }

  @Swagger({
    path : "/v1/users",
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
    return {
      files : req.files
    }
  }
}

export default UserController

------------------------------------------------------------------------

// in userRouter.ts
import { Router } from "express"
import { UserController } from "./UserController"
const router = Router()

router.get('/' , new UserController().index)
router.post('/' , new UserController().store)
router.post('/upload' , new UserController().upload)
router.get('/:uuid' , new UserController().show)
router.put('/:uuid' , new UserController().update)
router.patch('/:uuid' , new UserController().updated)
router.delete('/:uuid' , new UserController().delete)


export default router

------------------------------------------------------------------------

import express , { Request , Response , NextFunction } from 'express';
import swagger from 'tspace-swagger-ui-express';
import userRoute from './userRoute';
import UserController from './UserController';

(async() => { 

  const app = express()

  app.get('/', (req : Request, res : Response , next : NextFunction) => {
    return res.send('Hello, world!');
  });

  app.use('/api/v1/users',userRoute)

  app.use(swagger(app , { 
    path : "/api/docs",
    servers : [
      { url : "http://localhost:3000" , description : "development"}, 
      { url : "http://localhost:8000" , description : "production"}
    ],
    info : {
      "title" : "Welcome to the the documentation",
      "description" : "This is the documentation"
    },
    controllers : [UserController] // for custom in controllers with decorators @Swaggger
  }))
  
  const PORT = 3000;
  
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
  
})()
```
