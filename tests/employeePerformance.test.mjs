import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import * as Vue from 'vue'
import { parse, compileScript } from 'vue/compiler-sfc'

const source = fs.readFileSync(
  new URL('../src/views/employee/performance.vue', import.meta.url),
  'utf8',
)
const code = ts.transpileModule(
  compileScript(parse(source).descriptor, { id: 'performance' }).content,
  {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  },
).outputText
const response = (params, list = []) => ({
  data: {
    month: params.month,
    list,
    total: 40,
    pageNum: params.pageNum,
    pageSize: params.pageSize,
    totalPage: 4,
  },
})
const flush = () => new Promise((resolve) => setImmediate(resolve))
function setup(t, handler = async (params) => response(params)) {
  const calls = []
  const imports = {
    vue: { ...Vue, onMounted() {}, onBeforeUnmount() {} },
    'element-plus': { ElMessage: { warning() {} } },
    '@/api/employeePerformance': {
      employeePerformanceApi: {
        list(params) {
          calls.push(JSON.parse(JSON.stringify(params)))
          return handler(params)
        },
      },
    },
  }
  const context = {
    exports: {},
    require: (name) => {
      assert.ok(name in imports)
      return imports[name]
    },
  }
  vm.runInNewContext(code, context)
  const scope = Vue.effectScope()
  t.after(() => scope.stop())
  const state = scope.run(() => context.exports.default.setup({}, { expose() {} }))
  return { state, calls }
}
test('cumulative query preserves false status and trims search; paging uses submitted filters', async (t) => {
  const { state, calls } = setup(t)
  Object.assign(state.query, {
    period: 'all',
    keyword: ' E021 ',
    department: ' 设计部 ',
    status: false,
  })
  state.search()
  await flush()
  assert.deepEqual(calls[0], {
    month: 'all',
    keyword: 'E021',
    department: '设计部',
    status: false,
    pageNum: 1,
    pageSize: 10,
  })
  state.query.keyword = 'unsent'
  state.pagination.pageNum = 2
  await state.loadData()
  assert.equal(calls[1].keyword, 'E021')
  assert.equal(calls[1].pageNum, 2)
  state.resetQuery()
  await flush()
  assert.match(calls[2].month, /^\d{4}-\d{2}$/)
  assert.equal('status' in calls[2], false)
  assert.equal(calls[2].pageNum, 1)
})
test('company ranks including null and ties remain as returned; amounts retain two decimal places', async (t) => {
  const list = [
    { employeeId: 1, companyRank: null },
    { employeeId: 2, companyRank: 3 },
    { employeeId: 3, companyRank: 3 },
  ]
  const { state } = setup(t, async (params) => response(params, list))
  await state.loadData()
  assert.deepEqual(
    Array.from(state.rows.value, (row) => row.companyRank),
    [null, 3, 3],
  )
  assert.equal(state.formatMoney('180000.00'), '¥180,000.00')
  assert.equal(state.formatMoney('0.00'), '¥0.00')
})
test('late responses cannot overwrite a newer query', async (t) => {
  const pending = []
  const { state } = setup(
    t,
    (params) => new Promise((resolve) => pending.push({ params, resolve })),
  )
  const first = state.loadData()
  state.query.period = 'all'
  state.search()
  pending[1].resolve(response(pending[1].params, [{ employeeId: 2 }]))
  await flush()
  pending[0].resolve(response(pending[0].params, [{ employeeId: 1 }]))
  await first
  assert.equal(state.rows.value[0].employeeId, 2)
  assert.equal(state.displayedMonth.value, 'all')
  assert.equal(state.loading.value, false)
})
test('failure clears stale data and exposes retry state, successful retry recovers', async (t) => {
  let fail = false
  const { state } = setup(t, async (params) => {
    if (fail) throw new Error('403')
    return response(params, [{ employeeId: 1 }])
  })
  await state.loadData()
  fail = true
  await state.loadData()
  assert.equal(state.rows.value.length, 0)
  assert.equal(state.total.value, 0)
  assert.ok(state.loadError.value)
  assert.equal(state.loading.value, false)
  fail = false
  await state.loadData()
  assert.equal(state.loadError.value, '')
  assert.equal(state.rows.value.length, 1)
})
test('out of range page recovers to last page', async (t) => {
  const { state, calls } = setup(t)
  state.pagination.pageNum = 8
  await state.loadData()
  assert.deepEqual(
    calls.map((item) => item.pageNum),
    [8, 4],
  )
  assert.equal(state.pagination.pageNum, 4)
})
