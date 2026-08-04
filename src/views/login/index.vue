<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Lock, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

import compactLogo from '@/assets/logo/logo.png'
import fullLogo from '@/assets/logo/logo2.png'

const router = useRouter()
const loading = ref(false)
const showPassword = ref(false)
const rememberMe = ref(true)
const form = reactive({ username: '', password: '' })
const errors = reactive({ username: '', password: '' })

function validate() {
  errors.username = form.username.trim() ? '' : '请输入账号'
  errors.password = form.password ? '' : '请输入密码'
  return !errors.username && !errors.password
}

async function handleLogin() {
  if (!validate()) return

  loading.value = true
  await new Promise((resolve) => window.setTimeout(resolve, 650))
  loading.value = false
  ElMessage.success('登录成功 欢迎回来')
  await router.push('/dashboard/overview')
}
</script>

<template>
  <main class="login-page">
    <section class="brand-panel">
      <div class="brand-panel__glow" />
      <div class="brand-panel__content">
        <div class="brand-lockup">
          <img :src="compactLogo" alt="家翻新" />
          <span>家翻新 管理后台</span>
        </div>

        <div class="brand-message">
          <span class="brand-message__eyebrow">JIAFANXIN ADMIN</span>
          <h1>让每一次焕新<br />都更有章法</h1>
          <p>一个清晰高效的业务工作台 帮助团队从容管理每一项服务</p>
        </div>

        <div class="brand-signature" aria-hidden="true">
          <div class="brand-signature__line" />
          <span>专注老房焕新服务</span>
        </div>
      </div>
      <div class="brand-panel__ring brand-panel__ring--one" />
      <div class="brand-panel__ring brand-panel__ring--two" />
    </section>

    <section class="login-panel">
      <div class="login-card">
        <div class="mobile-brand">
          <img :src="compactLogo" alt="家翻新" />
          <span>家翻新管理后台</span>
        </div>

        <header class="login-card__header">
          <span class="login-card__label">WELCOME BACK</span>
          <h2>欢迎回来</h2>
          <p>请输入您的管理员账号 继续处理今日工作</p>
        </header>

        <form class="login-form" @submit.prevent="handleLogin">
          <label class="field-label" for="username">账号</label>
          <el-input
            id="username"
            v-model="form.username"
            :prefix-icon="User"
            placeholder="请输入管理员账号"
            size="large"
            autocomplete="username"
            :class="{ 'is-error': errors.username }"
            @input="errors.username = ''"
          />
          <span v-if="errors.username" class="field-error">{{ errors.username }}</span>

          <div class="password-label">
            <label class="field-label" for="password">密码</label>
            <button type="button" tabindex="-1">忘记密码</button>
          </div>
          <el-input
            id="password"
            v-model="form.password"
            :prefix-icon="Lock"
            :type="showPassword ? 'text' : 'password'"
            placeholder="请输入登录密码"
            size="large"
            autocomplete="current-password"
            :class="{ 'is-error': errors.password }"
            @input="errors.password = ''"
          >
            <template #suffix>
              <button
                class="password-toggle"
                type="button"
                :aria-label="showPassword ? '隐藏密码' : '显示密码'"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? '隐藏' : '显示' }}
              </button>
            </template>
          </el-input>
          <span v-if="errors.password" class="field-error">{{ errors.password }}</span>

          <el-checkbox v-model="rememberMe">保持登录状态</el-checkbox>

          <el-button class="login-button" type="primary" native-type="submit" :loading="loading">
            登录管理后台
          </el-button>
        </form>

      </div>

      <footer class="login-footer">
        <div class="full-logo" aria-label="家翻新 老房装修专家">
          <img :src="fullLogo" alt="家翻新 老房装修专家" />
        </div>
        <p class="copyright">2026 家翻新 安全管理中心</p>
      </footer>
    </section>
  </main>
</template>

<style scoped lang="scss">
.login-page {
  display: grid;
  width: 100%;
  min-height: 100%;
  grid-template-columns: minmax(420px, 1.05fr) minmax(480px, 0.95fr);
  background: #fbfaf8;
}

.brand-panel {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  color: #fff;
  background:
    linear-gradient(145deg, rgb(102 14 12 / 96%), rgb(184 25 20 / 96%) 58%, rgb(217 45 32 / 94%)),
    #b82018;
}

.brand-panel::before {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgb(255 255 255 / 15%) 0.7px, transparent 0.7px);
  background-size: 7px 7px;
  opacity: 0.3;
  content: '';
}

.brand-panel__glow {
  position: absolute;
  top: 24%;
  left: 26%;
  width: 420px;
  height: 420px;
  background: rgb(255 140 112 / 24%);
  border-radius: 50%;
  filter: blur(80px);
}

.brand-panel__content {
  position: relative;
  z-index: 2;
  display: flex;
  width: min(70%, 590px);
  height: 100%;
  min-height: 100vh;
  margin: auto;
  padding: 48px 0 56px;
  flex-direction: column;
  justify-content: space-between;
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 13px;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 1.5px;

  img {
    width: 42px;
    height: 42px;
    object-fit: cover;
    background: #fff;
    border: 1px solid rgb(255 255 255 / 35%);
    border-radius: 12px;
    box-shadow: 0 10px 26px rgb(70 0 0 / 20%);
  }
}

.brand-message {
  max-width: 570px;
  margin-top: -3vh;

  h1 {
    margin: 21px 0 24px;
    font-size: clamp(42px, 4.6vw, 70px);
    font-weight: 600;
    line-height: 1.18;
    letter-spacing: -2px;
  }

  p {
    max-width: 460px;
    margin: 0;
    color: rgb(255 255 255 / 72%);
    font-size: 16px;
    line-height: 1.9;
  }
}

.brand-message__eyebrow {
  color: rgb(255 255 255 / 62%);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 4px;
}

.brand-signature {
  display: flex;
  align-items: center;
  gap: 16px;
  color: rgb(255 255 255 / 58%);
  font-size: 12px;
  letter-spacing: 3px;
}

.brand-signature__line {
  width: 46px;
  height: 1px;
  background: rgb(255 255 255 / 42%);
}

.brand-panel__ring {
  position: absolute;
  border: 1px solid rgb(255 255 255 / 13%);
  border-radius: 50%;
}

.brand-panel__ring--one {
  right: -170px;
  bottom: -160px;
  width: 520px;
  height: 520px;
}

.brand-panel__ring--two {
  right: -90px;
  bottom: -80px;
  width: 360px;
  height: 360px;
}

.login-panel {
  position: relative;
  display: grid;
  min-height: 100vh;
  padding: 48px 8vw;
  place-items: center;
}

.login-card {
  width: min(100%, 420px);
}

.mobile-brand {
  display: none;
}

.login-card__header {
  margin-bottom: 38px;

  h2 {
    margin: 10px 0 12px;
    color: #211f1d;
    font-size: 38px;
    font-weight: 650;
    letter-spacing: -1.5px;
  }

  p {
    margin: 0;
    color: #8c8884;
    font-size: 14px;
    line-height: 1.8;
  }
}

.login-card__label {
  color: var(--jfx-primary);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 3px;
}

.login-form {
  display: flex;
  flex-direction: column;

  :deep(.el-input__wrapper) {
    min-height: 52px;
    padding: 0 16px;
    background: #fff;
    border: 1px solid #e8e3df;
    border-radius: 10px;
    box-shadow: none;
    transition: 0.2s ease;
  }

  :deep(.el-input__wrapper:hover) {
    border-color: #d0c8c2;
  }

  :deep(.el-input__wrapper.is-focus) {
    border-color: var(--jfx-primary);
    box-shadow: 0 0 0 3px rgb(217 45 32 / 9%);
  }

  :deep(.el-input__prefix) {
    margin-right: 7px;
    color: #a19b96;
  }

  .is-error :deep(.el-input__wrapper) {
    border-color: #e04a3f;
  }

  .el-checkbox {
    width: fit-content;
    margin: 20px 0 26px;
    color: #716c68;
  }
}

.field-label {
  margin-bottom: 9px;
  color: #373330;
  font-size: 13px;
  font-weight: 600;
}

.password-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 22px;

  .field-label {
    margin-bottom: 9px;
  }

  button {
    margin-bottom: 9px;
    padding: 0;
    color: #9b4b45;
    background: none;
    border: 0;
    cursor: pointer;
    font-size: 12px;
  }
}

.password-toggle {
  padding: 4px 0 4px 8px;
  color: #8c8580;
  background: transparent;
  border: 0;
  cursor: pointer;
  font-size: 12px;
}

.field-error {
  margin-top: 6px;
  color: #d92d20;
  font-size: 12px;
}

.login-button.el-button {
  width: 100%;
  height: 52px;
  border: 0;
  border-radius: 10px;
  box-shadow: 0 14px 30px rgb(183 35 25 / 20%);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1px;

  &:hover {
    background: #bf241a;
    transform: translateY(-1px);
  }
}

.full-logo {
  position: relative;
  width: 176px;
  height: 61px;
  margin: 0 auto 8px;
  overflow: hidden;
  opacity: 0.48;

  img {
    position: absolute;
    top: -57px;
    left: 0;
    width: 176px;
    height: auto;
  }
}

.login-footer {
  position: absolute;
  right: 0;
  bottom: 28px;
  left: 0;
  opacity: 0.82;
}

.copyright {
  margin: 0;
  color: #b1ada9;
  font-size: 11px;
  text-align: center;
}

@media (max-width: 900px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .brand-panel {
    display: none;
  }

  .login-panel {
    display: block;
    padding: 36px 24px;
  }

  .login-card {
    margin: auto;
  }

  .login-footer {
    position: static;
    margin-top: 58px;
  }

  .mobile-brand {
    display: flex;
    align-items: center;
    gap: 11px;
    margin-bottom: 64px;
    color: #35312f;
    font-size: 15px;
    font-weight: 600;

    img {
      width: 38px;
      height: 38px;
      border-radius: 10px;
    }
  }
}

@media (max-width: 480px) {
  .login-panel {
    align-items: start;
    padding-top: 26px;
  }

  .mobile-brand {
    margin-bottom: 48px;
  }

  .login-card__header h2 {
    font-size: 33px;
  }
}
</style>
