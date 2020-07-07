const express = require('express')
const { ApolloServer, makeExecutableSchema } = require('apollo-server-express')

const {
  rootSchema,
  adminSchema,
  authSchema,
  guestSchema
} = require('./schema/schema')
const {
  guestResolvers,
  authorizedResolvers,
  adminResolvers
} = require('./resolvers')

const merge = require('lodash/merge')

const app = express()

const resolversMerged = merge(
  guestResolvers,
  authorizedResolvers,
  adminResolvers
)

const schema = makeExecutableSchema({
  typeDefs: [rootSchema, adminSchema, authSchema, guestSchema],
  resolvers: resolversMerged
})

const server = new ApolloServer({
  schema,
  // Контекст доступен для каждого запроса
  context: getContextFromRequest,
  playground: true
})

server.applyMiddleware({ app })

app.listen({ port: 8080 }, () =>
  console.log(`🚀 Server ready at http://localhost:8080${server.graphqlPath}`)
)

const hasRole = user => role => {
  // Примитивный поиск по ролям
  if (user && Array.isArray(user.roles)) {
    return user.roles.includes(role)
  }

  return false
}

async function getContextFromRequest({ req }) {
  let user

  try {
    user = await getUserFromReq(req)
  } catch (e) {
    throw new Error('You provide incorrect token!')
  }

  return { request: req, session: { ...user }, hasRole: hasRole(user) }
}

async function getUserFromReq(req) {
  // const token = req?.cookies?.token || req?.headers?.authorization
  const token = 'req.headers.authorization'

  if (token) {
    const userId = token

    if (userId) {
      const user = {
        name: 'bogdan',
        token,
        isBanned: false,
        roles: ['ADMIN']
      }

      if (user) {
        if (user.isBanned) {
          throw new Error('user banned!')
        }

        return user
      }
    }
  }

  return null
}

function getPathFromInfo(info) {
  // const path = getPathFromInfo(info);
  // if (!context.hasAccess(path)) return null;

  if (!info || !info.path) {
    return false
  }

  const res = []
  let curPath = info.path

  while (curPath) {
    if (curPath.key) {
      res.unshift(curPath.key)
      if (curPath.prev) curPath = curPath.prev
      else break
    } else break
  }

  return res
}
