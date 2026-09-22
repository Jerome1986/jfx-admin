import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import ts from 'typescript'
import * as Vue from 'vue'
import { parse, compileScript } from 'vue/compiler-sfc'
import { isAxiosError } from 'axios'

// Runs real SFC setup functions and form rules; HTTP calls are isolated test doubles.
// This is not a browser or real-database integration test.
const require = createRequire(import.meta.url)
const Schema = createRequire(require.resolve('element-plus'))('async-validator').default
const root = new URL('../', import.meta.url)
const read = (path) => fs.readFileSync(new URL(path, root), 'utf8')
function evaluate(source, imports = {}) {
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const context = {
    exports: {},
    Error,
    Date,
    console,
    require(name) {
      if (name in imports) return imports[name]
      if (name.endsWith('.vue')) return { default: {} }
      throw new Error(`Unexpected import: ${name}`)
    },
  }
  vm.runInNewContext(code, context)
  return context.exports
}
const math = evaluate(read('src/utils/project.ts'))
const types = evaluate(read('src/types/project.ts'))
const clone = (value) => JSON.parse(JSON.stringify(value))
const pending = () => {
  let resolve, reject
  const promise = new Promise((a, b) => {
    resolve = a
    reject = b
  })
  return { promise, resolve, reject }
}
const flush = async () => {
  for (let i = 0; i < 12; i++) await Vue.nextTick()
}
const employee = (id) => ({
  id,
  employeeNo: `E${id}`,
  status: true,
  user: { role: 'EMPLOYEE', status: true, realName: `Employee ${id}` },
})
const page = (list, pageNum = 1, totalPage = 1) => ({
  data: { list, pageNum, totalPage, total: list.length, pageSize: 100 },
})
const item = (patch = {}) => ({
  id: 8,
  productId: 5,
  category: '主材',
  name: 'Tile',
  description: '',
  unit: 'm2',
  unitPrice: '100.00',
  quantity: '20',
  amount: '2000.00',
  image: null,
  sort: 0,
  ...patch,
})
const project = (patch = {}) => ({
  id: 7,
  name: 'Kitchen',
  customerName: 'Customer',
  mobile: '13800138000',
  serviceAddress: 'Shanghai',
  remark: '',
  employeeId: 3,
  employeeName: 'Employee 3',
  quoteVersion: 4,
  status: 'PENDING_CONFIRM',
  quotedAmount: '2000.00',
  items: [item()],
  progressRecords: [],
  followUps: [],
  ...patch,
})
const httpError = (status) =>
  Object.assign(new Error(`HTTP ${status}`), { isAxiosError: true, response: { status } })
function component(t, file, initial, overrides = {}) {
  const calls = [],
    events = [],
    messages = []
  const api = {}
  for (const name of [
    'list',
    'detail',
    'create',
    'update',
    'assign',
    'quotation',
    'progress',
    'followUp',
    'convert',
    'createFollowUp',
  ]) {
    api[name] = async (...args) => {
      calls.push({ name, args: clone(args) })
      return overrides[name] ? overrides[name](...args) : { data: project() }
    }
  }
  const imports = {
    vue: { ...Vue, onMounted: () => {} },
    axios: { isAxiosError },
    'element-plus': {
      ElMessage: Object.fromEntries(
        ['success', 'warning', 'error'].map((key) => [key, (text) => messages.push({ key, text })]),
      ),
    },
    '@/api/projects': { projectApi: api },
    '@/api/appointments': { appointmentApi: api },
    '@/api/employees': {
      employeeApi: { list: overrides.employees || (async () => page([employee(3), employee(4)])) },
    },
    '@/api/users': { userApi: { list: overrides.users || (async () => page([])) } },
    '@/api/renewalPlans': {
      renewalPlanApi: { list: overrides.plans || (async () => ({ data: [] })) },
    },
    '@/api/products': { productApi: { page: overrides.products || (async () => page([])) } },
    '@/types/project': types,
    '@/utils/project': math,
  }
  const { descriptor } = parse(read(file), { filename: file })
  const script = compileScript(descriptor, { id: file })
  const compiled = evaluate(script.content, imports).default
  const props = Vue.reactive(initial)
  const scope = Vue.effectScope()
  const state = scope.run(() =>
    compiled.setup(props, { expose() {}, emit: (...args) => events.push(args) }),
  )
  t.after(() => scope.stop())
  if (state.formRef)
    state.formRef.value = {
      clearValidate() {},
      async validate() {
        await new Schema(
          Object.fromEntries(
            Object.entries(state.rules.value).map(([key, rules]) => [
              key,
              rules.map((rule) => ({
                ...Object.fromEntries(Object.entries(rule).filter(([key]) => key !== 'trigger')),
                ...(rule.pattern
                  ? { pattern: new RegExp(rule.pattern.source, rule.pattern.flags) }
                  : {}),
              })),
            ]),
          ),
        ).validate(state.form)
        return true
      },
    }
  return {
    state,
    props,
    calls,
    events,
    messages,
    async open() {
      props.modelValue = true
      await flush()
    },
  }
}
const action = (t, mode, patch = {}, overrides = {}) =>
  component(
    t,
    'src/views/renovation/components/ProjectActionDialog.vue',
    { modelValue: false, mode, project: mode === 'create' ? undefined : project(patch) },
    overrides,
  )
const quote = (t, patch = {}, overrides = {}) =>
  component(
    t,
    'src/views/renovation/components/ProjectQuotationDialog.vue',
    { modelValue: false, project: project(patch) },
    overrides,
  )

test('API: all seven status filters serialize correctly without mutating input', () => {
  const calls = []
  const { projectApi } = evaluate(read('src/api/projects.ts'), {
    '@/utils/request': { request: (config) => calls.push(config) },
  })
  for (const status of [
    '',
    undefined,
    'PENDING_QUOTE',
    'PENDING_CONFIRM',
    'IN_SERVICE',
    'COMPLETED',
    'CANCELED',
  ]) {
    const params = { pageNum: 1, pageSize: 10, status }
    projectApi.list(params)
    assert.equal(calls.at(-1).params.status, status || 'ALL')
    assert.equal(params.status, status)
  }
})
test('API: endpoints and write methods match backend contract', () => {
  const calls = []
  const imports = { '@/utils/request': { request: (config) => calls.push(config) } }
  const { projectApi: api } = evaluate(read('src/api/projects.ts'), imports)
  api.detail(7)
  api.create({})
  api.update(7, {})
  api.assign(7, 3)
  api.quotation(7, 4, [])
  api.progress(7, {})
  api.followUp(7, {})
  const { appointmentApi } = evaluate(read('src/api/appointments.ts'), imports)
  appointmentApi.convert(8, {})
  assert.deepEqual(
    calls.map((c) => [c.method, c.url]),
    [
      ['GET', '/project/7'],
      ['POST', '/project'],
      ['PATCH', '/project/7'],
      ['PATCH', '/project/7/assignee'],
      ['PUT', '/project/7/quotation'],
      ['POST', '/project/7/progress'],
      ['POST', '/project/7/follow-up'],
      ['POST', '/appointment/8/convert'],
    ],
  )
  assert.equal(calls[4].data.quoteVersion, 4)
})
test('money: row rounding, zero price and maximum precision', () => {
  assert.equal(math.centsText(math.quoteLineCents('0.05', '0.10')), '0.01')
  assert.equal(math.centsText(math.quoteLineCents('0.05', '0.10') * 2n), '0.02')
  assert.equal(math.centsText(math.quoteLineCents('0', '2')), '0.00')
  assert.equal(math.centsText(math.quoteLineCents('99999999.99', '1')), '99999999.99')
  for (const value of ['-1', '1.001', '100000000', '1e2', '', 'NaN'])
    assert.throws(() => math.decimalHundredths(value))
})
test('create: validates mandatory fields and mainland mobile', async (t) => {
  const c = action(t, 'create')
  await c.open()
  Object.assign(c.state.form, { customerName: 'Customer', mobile: '13800138000' })
  for (const value of ['', '   ']) {
    c.state.form.name = value
    await c.state.submit()
  }
  c.state.form.name = 'Kitchen'
  c.state.form.mobile = '12345678901'
  await c.state.submit()
  assert.equal(c.calls.length, 0)
})
test('create: optional associations are null and successful save closes dialog', async (t) => {
  const c = action(t, 'create')
  await c.open()
  Object.assign(c.state.form, { name: 'Kitchen', customerName: 'Customer', mobile: '13800138000' })
  await c.state.submit()
  assert.equal(c.calls[0].name, 'create')
  assert.equal(c.calls[0].args[0].employeeId, null)
  assert.equal(c.calls[0].args[0].userId, null)
  assert.equal(c.calls[0].args[0].planId, null)
  assert.ok(c.events.some((e) => e[0] === 'saved'))
})
test('edit: request includes only editable fields, allows clearing address', async (t) => {
  const c = action(t, 'edit')
  await c.open()
  c.state.form.serviceAddress = ''
  await c.state.submit()
  assert.deepEqual(Object.keys(c.calls[0].args[1]).sort(), [
    'customerName',
    'mobile',
    'name',
    'remark',
    'serviceAddress',
  ])
  assert.equal(c.calls[0].args[1].serviceAddress, '')
})
test('submit: duplicate clicks produce one request', async (t) => {
  const deferred = pending()
  const c = action(t, 'edit', {}, { update: () => deferred.promise })
  await c.open()
  const first = c.state.submit()
  const second = c.state.submit()
  await flush()
  assert.equal(c.calls.length, 1)
  deferred.resolve({ data: project() })
  await Promise.all([first, second])
  assert.equal(c.state.saving.value, false)
})
test('ordinary save failure preserves form and emits no success', async (t) => {
  const c = action(t, 'edit', {}, { update: () => Promise.reject(httpError(400)) })
  await c.open()
  c.state.form.name = 'Unsaved'
  await c.state.submit()
  assert.equal(c.state.form.name, 'Unsaved')
  assert.equal(c.events.length, 0)
  assert.equal(c.state.saving.value, false)
})
test('409 closes stale action and requests refreshed detail, with no auto retry', async (t) => {
  const c = action(t, 'follow-up', {}, { followUp: () => Promise.reject(httpError(409)) })
  await c.open()
  c.state.form.content = 'Follow'
  await c.state.submit()
  assert.equal(c.calls.length, 1)
  assert.ok(c.events.some((e) => e[0] === 'conflict'))
  assert.ok(c.events.some((e) => e[0] === 'update:modelValue' && !e[1]))
  assert.ok(!c.events.some((e) => e[0] === 'saved'))
})
test('assignee: load all pages and filter disabled or nonemployee accounts', async (t) => {
  const c = action(
    t,
    'assign',
    {},
    {
      employees: async ({ pageNum }) =>
        page(
          pageNum === 1
            ? [employee(3), { ...employee(5), user: { role: 'EMPLOYEE', status: false } }]
            : [employee(4), { ...employee(6), user: { role: 'CUSTOMER', status: true } }],
          pageNum,
          2,
        ),
    },
  )
  await c.open()
  assert.deepEqual(clone(c.state.employees.value.map((e) => e.id)), [3, 4])
  c.state.form.employeeId = 3
  await c.state.submit()
  assert.equal(c.calls.length, 0)
  c.state.form.employeeId = 4
  await c.state.submit()
  assert.deepEqual(c.calls[0].args, [7, 4])
})
test('assignee: mid-pagination failure exposes no partial options', async (t) => {
  const c = action(
    t,
    'assign',
    {},
    {
      employees: async ({ pageNum }) => {
        if (pageNum === 2) throw httpError(500)
        return page([employee(4)], 1, 2)
      },
    },
  )
  await c.open()
  assert.equal(c.state.optionsError.value, true)
  assert.equal(c.state.employees.value.length, 0)
})
test('assignee: latest reload wins over a slower earlier request', async (t) => {
  const first = pending(),
    second = pending()
  let n = 0
  const c = action(
    t,
    'assign',
    {},
    { employees: () => (++n === 1 ? first.promise : second.promise) },
  )
  await c.open()
  const reload = c.state.loadOptions()
  second.resolve(page([employee(4)]))
  await reload
  first.resolve(page([employee(3)]))
  await flush()
  assert.deepEqual(clone(c.state.employees.value.map((e) => e.id)), [4])
})
test('follow-up: requires assignee and submits captured assignee plus ISO date', async (t) => {
  const c = action(t, 'follow-up', { employeeId: null })
  await c.open()
  c.state.form.content = 'Follow'
  await c.state.submit()
  assert.equal(c.calls.length, 0)
  c.props.project.employeeId = 3
  c.state.form.nextFollowAt = new Date('2026-09-23T02:00:00Z')
  await c.state.submit()
  assert.deepEqual(c.calls[0].args[1], {
    employeeId: 3,
    content: 'Follow',
    nextFollowAt: '2026-09-23T02:00:00.000Z',
  })
})
test('progress: prevents skip, rollback and historical-state updates', async (t) => {
  const c = action(t, 'progress')
  await c.open()
  c.state.form.content = 'Update'
  c.state.form.status = 'COMPLETED'
  await c.state.submit()
  assert.equal(c.calls.length, 0)
  for (const status of ['PENDING_QUOTE', 'CANCELED']) {
    c.props.project.status = status
    c.state.form.status = status
    await c.state.submit()
  }
  assert.equal(c.calls.length, 0)
})
test('progress: starting service requires quote rows and includes version plus zero contract', async (t) => {
  const c = action(t, 'progress', { items: [] })
  await c.open()
  c.state.form.content = 'Confirmed'
  c.state.form.status = 'IN_SERVICE'
  c.state.form.contractAmount = '0.00'
  await c.state.submit()
  assert.equal(c.calls.length, 0)
  c.props.project.items = [item()]
  await c.state.submit()
  assert.deepEqual(c.calls[0].args[1], {
    status: 'IN_SERVICE',
    content: 'Confirmed',
    quoteVersion: 4,
    contractAmount: '0.00',
  })
})
test('progress: same-state notes and completion omit contract and version', async (t) => {
  const c = action(t, 'progress', { status: 'IN_SERVICE' })
  await c.open()
  c.state.form.content = 'Update'
  await c.state.submit()
  c.state.form.status = 'COMPLETED'
  await c.state.submit()
  for (const call of c.calls) {
    assert.equal('contractAmount' in call.args[1], false)
    assert.equal('quoteVersion' in call.args[1], false)
  }
  assert.equal(c.calls.length, 2)
})
test('quotation: submit snapshot excludes IDs/amount and preserves captured version', async (t) => {
  const c = quote(t)
  await c.open()
  c.state.rows.value[0].name = 'Updated'
  await c.state.submit()
  assert.equal(c.calls[0].args[1], 4)
  assert.equal('id' in c.calls[0].args[2][0], false)
  assert.equal('amount' in c.calls[0].args[2][0], false)
  assert.equal(c.props.project.items[0].name, 'Tile')
})
test('quotation: empty rows, zero quantity, excessive precision and excessive total rejected', async (t) => {
  const c = quote(t)
  await c.open()
  for (const rows of [
    [],
    [item({ quantity: '0' })],
    [item({ unitPrice: '1.001' })],
    [item({ unitPrice: '99999999.99', quantity: '2' })],
  ]) {
    c.state.rows.value = rows
    await c.state.submit()
  }
  assert.equal(c.calls.length, 0)
})
test('quotation: locked projects cannot submit', async (t) => {
  for (const status of ['IN_SERVICE', 'COMPLETED', 'PENDING_QUOTE', 'CANCELED']) {
    const c = quote(t, { status })
    await c.open()
    await c.state.submit()
    assert.equal(c.calls.length, 0)
  }
})
test('quotation: product replacement updates snapshot but preserves quantity and unit', async (t) => {
  const c = quote(t)
  await c.open()
  c.state.pick(c.state.rows.value[0])
  c.state.choose({
    id: 19,
    name: 'New tile',
    price: '23.45',
    description: 'New',
    mainImage: 'image.png',
  })
  assert.equal(c.state.rows.value[0].productId, 19)
  assert.equal(c.state.rows.value[0].unitPrice, '23.45')
  assert.equal(c.state.rows.value[0].quantity, '20')
  assert.equal(c.state.rows.value[0].unit, 'm2')
})
test('quotation: conflict refreshes and does not overwrite automatically', async (t) => {
  const c = quote(t, {}, { quotation: () => Promise.reject(httpError(409)) })
  await c.open()
  await c.state.submit()
  assert.equal(c.calls.length, 1)
  assert.ok(c.events.some((e) => e[0] === 'conflict'))
  assert.ok(!c.events.some((e) => e[0] === 'saved'))
})
test('quotation: ordinary error keeps editor content', async (t) => {
  const c = quote(t, {}, { quotation: () => Promise.reject(httpError(400)) })
  await c.open()
  await c.state.submit()
  assert.equal(c.events.length, 0)
  assert.equal(c.state.rows.value.length, 1)
})
test('list: latest request wins; reset restores first page and empty filters', async (t) => {
  const first = pending(),
    second = pending()
  let n = 0
  const c = component(
    t,
    'src/views/renovation/projects.vue',
    {},
    { list: () => (++n === 1 ? first.promise : second.promise) },
  )
  const a = c.state.load(),
    b = c.state.load()
  second.resolve(page([project({ id: 9 })]))
  await b
  first.resolve(page([project({ id: 8 })]))
  await a
  assert.equal(c.state.rows.value[0].id, 9)
  c.state.query.pageNum = 5
  c.state.query.status = 'COMPLETED'
  c.state.query.keyword = 'Kitchen'
  c.state.reset()
  await flush()
  assert.equal(c.state.query.pageNum, 1)
  assert.equal(c.state.query.status, '')
  assert.equal(c.state.query.keyword, '')
})
test('detail: old project response cannot replace newly selected project', async (t) => {
  const first = pending(),
    second = pending()
  const c = component(
    t,
    'src/views/renovation/components/ProjectDetailDrawer.vue',
    { modelValue: false, projectId: 7 },
    { detail: (id) => (id === 7 ? first.promise : second.promise) },
  )
  await c.open()
  c.props.projectId = 8
  await flush()
  second.resolve({ data: project({ id: 8 }) })
  await flush()
  first.resolve({ data: project({ id: 7 }) })
  await flush()
  assert.equal(c.state.project.value.id, 8)
})
test('appointment conversion: incomplete appointments do not write; completed appointments call convert', async (t) => {
  const c = component(t, 'src/views/renovation/components/AppointmentActionDialog.vue', {
    modelValue: false,
    mode: 'convert',
    appointment: {
      id: 12,
      status: 'PENDING_VISIT',
      customerName: 'Customer',
      mobile: '13800138000',
      employeeId: null,
    },
  })
  await c.open()
  await c.state.submit()
  assert.equal(c.calls.length, 0)
  c.props.appointment.status = 'COMPLETED'
  await c.state.submit()
  assert.equal(c.calls[0].name, 'convert')
  assert.equal(c.calls[0].args[0], 12)
})
test('conversion feedback contains readable Chinese rather than question marks', async (t) => {
  const c = component(t, 'src/views/renovation/components/AppointmentActionDialog.vue', {
    modelValue: false,
    mode: 'convert',
    appointment: { id: 12, status: 'COMPLETED', customerName: 'Customer', mobile: '13800138000' },
  })
  await c.open()
  await c.state.submit()
  assert.ok(c.messages.some((m) => m.key === 'success' && /[\u4e00-\u9fff]/.test(m.text)))
})
