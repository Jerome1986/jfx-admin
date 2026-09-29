import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import * as Vue from 'vue'
import { parse, compileScript } from 'vue/compiler-sfc'

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const evaluate = (source, imports = {}) => {
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const context = {
    exports: {},
    require: (name) => {
      assert.ok(name in imports, `Unexpected import: ${name}`)
      return imports[name]
    },
  }
  vm.runInNewContext(code, context)
  return context.exports
}
const clone = (value) => JSON.parse(JSON.stringify(value))
const response = (params, list = []) => ({
  data: {
    list,
    total: 80,
    pageNum: Number(params.pageNum),
    pageSize: Number(params.pageSize),
    totalPage: Math.ceil(80 / Number(params.pageSize)),
  },
})
function setup(t, list = async (params) => response(params), reply = async () => ({})) {
  const calls = []
  const replyCalls = []
  const messages = []
  let mounted
  const { descriptor } = parse(read('src/views/support/feedback.vue'))
  const component = evaluate(compileScript(descriptor, { id: 'feedback' }).content, {
    vue: {
      ...Vue,
      onMounted: (callback) => {
        mounted = callback
      },
      onBeforeUnmount: () => {},
    },
    'element-plus': { ElMessage: { success: (message) => messages.push(message) } },
    '@/api/feedback': {
      feedbackApi: {
        reply: (id, data) => {
          replyCalls.push({ id, data: clone(data) })
          return reply(id, data)
        },
        list: (params) => {
          calls.push(clone(params))
          return list(params)
        },
      },
    },
    '@/types/feedback': evaluate(read('src/types/feedback.ts')),
  }).default
  const scope = Vue.effectScope()
  t.after(() => scope.stop())
  const state = scope.run(() => component.setup({}, { expose() {} }))
  return { state, calls, replyCalls, messages, mount: () => mounted() }
}

test('list uses the supplied GET endpoint and query parameters', async () => {
  let config
  const api = evaluate(read('src/api/feedback.ts'), {
    '@/utils/request': {
      request: async (value) => {
        config = clone(value)
      },
    },
  }).feedbackApi
  await api.list({ keyWords: 'FB1', status: 'REPLIED', pageNum: '2', pageSize: '20' })
  assert.deepEqual(config, {
    method: 'GET',
    url: '/feedback/all',
    params: { keyWords: 'FB1', status: 'REPLIED', pageNum: '2', pageSize: '20' },
  })
})

test('initial load, search, pagination, page size and reset send expected queries', async (t) => {
  const { state, calls, mount } = setup(t)
  await mount()
  assert.deepEqual(calls.at(-1), { status: 'ALL', pageNum: '1', pageSize: '10' })
  state.query.keyWords = '  13800138000  '
  state.query.status = 'REPLIED'
  await state.search()
  assert.deepEqual(calls.at(-1), {
    keyWords: '13800138000',
    status: 'REPLIED',
    pageNum: '1',
    pageSize: '10',
  })
  state.query.keyWords = '尚未搜索的输入'
  await state.changePage(3, 10)
  assert.equal(calls.at(-1).keyWords, '13800138000')
  assert.equal(calls.at(-1).pageNum, '3')
  await state.changePage(3, 20)
  assert.equal(calls.at(-1).pageNum, '1')
  assert.equal(calls.at(-1).pageSize, '20')
  const count = calls.length
  await state.changePage(1, 20)
  assert.equal(calls.length, count)
  await state.resetQuery()
  assert.deepEqual(calls.at(-1), { status: 'ALL', pageNum: '1', pageSize: '20' })
  assert.equal(state.total.value, 80)
})

test('stale requests cannot overwrite the latest search or clear its loading state', async (t) => {
  const pending = []
  const { state } = setup(
    t,
    (params) => new Promise((resolve) => pending.push({ params, resolve })),
  )
  const first = state.search()
  state.query.keyWords = 'new'
  const second = state.search()
  pending[0].resolve(response(pending[0].params, [{ id: 1 }]))
  await first
  assert.equal(state.loading.value, true)
  assert.equal(state.rows.value.length, 0)
  pending[1].resolve(response(pending[1].params, [{ id: 2 }]))
  await second
  assert.equal(state.rows.value[0].id, 2)
  assert.equal(state.loading.value, false)
})

test('failed requests clear stale data and allow retry', async (t) => {
  let fail = false
  const { state, mount } = setup(t, async (params) => {
    if (fail) throw new Error('network error')
    return response(params, [{ id: 1 }])
  })
  await mount()
  fail = true
  await state.search()
  assert.equal(state.rows.value.length, 0)
  assert.equal(state.total.value, 0)
  assert.equal(state.loadFailed.value, true)
  assert.equal(state.loading.value, false)
  fail = false
  await state.loadData()
  assert.equal(state.rows.value.length, 1)
  assert.equal(state.loadFailed.value, false)
})

test('reply sends PATCH with only the reply content', async () => {
  let config
  const api = evaluate(read('src/api/feedback.ts'), {
    '@/utils/request': {
      request: async (value) => {
        config = clone(value)
      },
    },
  }).feedbackApi
  await api.reply(8, { reply: '感谢反馈' })
  assert.deepEqual(config, {
    method: 'PATCH',
    url: '/feedback/8/reply',
    data: { reply: '感谢反馈' },
  })
})

test('reply validates input and prevents replying to completed feedback', async (t) => {
  const { state, replyCalls } = setup(t)
  state.openReply({ id: 8, status: 'PENDING' })
  state.replyContent.value = '   '
  await state.submitReply()
  assert.equal(replyCalls.length, 0)
  assert.equal(state.replyError.value, '请输入回复内容')
  state.replyContent.value = 'a'.repeat(5001)
  await state.submitReply()
  assert.equal(replyCalls.length, 0)
  assert.equal(state.replyError.value, '回复内容不能超过 5000 字符')
  for (const status of ['REPLIED', 'CLOSED']) {
    state.selectedFeedback.value = { id: 8, status }
    state.replyContent.value = '不能覆盖'
    await state.submitReply()
    assert.equal(replyCalls.length, 0)
  }
})

test('successful reply prevents duplicate requests, closes dialog and refreshes list', async (t) => {
  let finish
  const { state, replyCalls, calls, messages } = setup(
    t,
    undefined,
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  state.openReply({ id: 8, status: 'PROCESSING' })
  state.replyContent.value = '  感谢反馈  '
  const pending = state.submitReply()
  assert.equal(state.submitting.value, true)
  await state.submitReply()
  assert.equal(replyCalls.length, 1)
  assert.deepEqual(replyCalls[0], { id: 8, data: { reply: '感谢反馈' } })
  finish({})
  await pending
  assert.equal(state.submitting.value, false)
  assert.equal(state.dialogVisible.value, false)
  assert.equal(state.replyContent.value, '')
  assert.deepEqual(messages, ['回复成功'])
  assert.equal(calls.length, 1)
})

test('reply errors retain draft and dialog without claiming success', async (t) => {
  const { state, calls, messages } = setup(t, undefined, async () => {
    throw new Error('反馈已回复或已关闭，不能重复回复')
  })
  state.openReply({ id: 8, status: 'PENDING' })
  state.replyContent.value = '保留草稿'
  await state.submitReply()
  assert.equal(state.dialogVisible.value, true)
  assert.equal(state.replyContent.value, '保留草稿')
  assert.equal(state.submitting.value, false)
  assert.equal(calls.length, 0)
  assert.equal(messages.length, 0)
})

test('refresh after reply returns from an empty last page to the last valid page', async (t) => {
  const { state, calls } = setup(t, async (params) => ({
    data: {
      list: params.pageNum === '2' ? [] : [{ id: 1 }],
      total: 10,
      pageNum: Number(params.pageNum),
      pageSize: 10,
      totalPage: 1,
    },
  }))
  state.pagination.pageNum = 2
  state.openReply({ id: 8, status: 'PENDING' })
  state.replyContent.value = '已处理'
  await state.submitReply()
  assert.deepEqual(
    calls.map((call) => call.pageNum),
    ['2', '1'],
  )
  assert.equal(state.pagination.pageNum, 1)
  assert.equal(state.rows.value[0].id, 1)
})
