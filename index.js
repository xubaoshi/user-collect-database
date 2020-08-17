const koa = require('koa')
const Router = require('koa-router')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

function paresPostData(ctx) {
  return new Promise((resolve, reject) => {
    try {
      let postData = ''
      ctx.req.addListener('data', (data) => {
        postData += data
      })
      ctx.req.on('end', () => {
        resolve(decodeURIComponent(postData))
      })
    } catch (err) {
      reject(err)
    }
  })
}

// 创建一个 app
const app = new koa()
// 创建一个路由实例
const router = new Router()
// 创建一个数据库实例
const adapter = new FileSync('db.json')
const db = low(adapter)

// 初始化数据库
db.defaults({ visits: [], count: 0 }).write()

router.all('/log/user/track/event', async (ctx, next) => {
  let postData = await paresPostData(ctx)
  db.get('visits').push(JSON.parse(postData)[0]).write()
  db.update('count', (n) => n + 1).write()

  ctx.body = { success: 1, visits: db.get('count') }
})

router.get('/log/event', async (ctx, next) => {
  const query = ctx.query
  if (query.pageView) {
    const logs = db.get('visits').filter({ pageView: query.pageView }).value()
    ctx.body = { success: 1, logs }
  } else {
    ctx.body = { success: 0 }
  }
})

app
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(7000, '0.0.0.0', () => {
    console.log('server start!!!!')
  })
