import app from './index'

export const onRequest = (context: any) => {
  return app.fetch(context.request, context.env, context.executionCtx)
}
