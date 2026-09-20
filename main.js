// Madoka DeskPet —— Driftlet 皮肤
// 模型: Cubism 3 (moc3) via pixi-live2d-display + Cubism Core
// 功能: 鼠标跟随 / 自动眨眼 / 自然呼吸 / 发光表情（常亮 + 自动脉冲）/ 长跑自刷新 / 设置联动
//
// Driftlet 皮肤协议适配：
//   页面经 skin:// 协议加载，Windows WebView2 改写为 http://skin.localhost/<id>/。
//   pixi-live2d-display 的 ModelSettings 要求 json.url 字段作为子文件解析基准。
//   方案：fetch model3.json → 注入绝对 url 字段 → 传入库，让默认 resolveURL 工作。
//
// 呼吸修复说明：
//   库内置 breath 参数 ParamBreath: offset=0, peak=0.5 → 正弦值域 -0.5~+0.5，
//   而模型该参数有效范围 0~1，负半周被钳成 0（只剩半个呼吸周期）。
//   加载后按模型实际 min/max 重写呼吸参数，让正弦铺满整个有效区间。
//
// 眨眼说明：
//   库只在 model3.json 含 "Groups" 段（Name=EyeBlink）时才创建 eyeBlink——
//   已在 model 文件夹的 model3.json 补上该段。开关经 eyeBlink.setBlinkingInterval 实现。
//
// 长跑自刷新说明（皮肤开发指南 §3.7）：
//   WebView 连跑多天会自然累积内存，皮肤可在「自己状态安全的时刻」调 location.reload()
//   回到干净基线。本皮肤是重 WebGL（Live2D 模型 + 大纹理），按指南建议取 12 小时一档。
//   安全点判定：模型就绪、发光脉冲未进行、用户刚没交互过（设置写入可能在途）；
//   不安全则顺延 1 小时重试（与官方 examples/shared/base.js 的 Isles.selfRefresh 同口径）。
(() => {
  'use strict';

  const bridge = () => window.driftlet || window.__DESK_PP__ || null;
  const settings = () => bridge()?.settings || {};

  // ── 推断皮肤 id ──
  function detectSkinId() {
    try {
      const url = new URL(window.location.href);
      if (url.hostname === 'skin.localhost') {
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length > 0) return parts[0];
      }
    } catch { }
    return 'madoka-deskpet';
  }
  const SKIN_ID = detectSkinId();
  const IS_DRIFTLET = window.location.hostname === 'skin.localhost';

  // ── 获取设置值 ──
  function getSettings() {
    const s = settings();
    return {
      glow: s.glow ?? false,
      auto_glow: s.auto_glow ?? true,
      model_scale: s.model_scale ?? 1.0,
      mouse_tracking: s.mouse_tracking ?? false,
      auto_blink: s.auto_blink ?? true,
      auto_refresh: s.auto_refresh ?? true,
      refresh_hours: s.refresh_hours ?? 12,
    };
  }

  // ── DOM ──
  const container = document.getElementById('canvas-container');
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error-msg');

  // ── 状态 ──
  let app = null;
  let model = null;
  let modelReady = false;
  let glowPulseTimer = 0;
  let glowRestoreTimer = 0;
  let selfRefreshTimer = 0;
  // 发光脉冲是否正在演出（自刷新的安全点判定要用：半途重载会把脉冲切成两截）
  let glowPulsing = false;
  // 最近一次用户交互时刻（performance.now()；0 = 本次页面还没交互过）
  let lastInteractionAt = 0;
  // 发光常亮状态的唯一事实源（不用桥 settings——自己写设置后它是异步同步的，
  // 立刻回读会拿到旧值，曾导致「点击关常亮后自动脉冲不再排期」的竞态）
  let glowOn = false;

  function showError(msg) {
    loadingEl.classList.add('hidden');
    errorEl.textContent = msg;
    errorEl.classList.add('visible');
    console.error('[Live2D Waifu]', msg);
  }

  function hideLoading() { loadingEl.classList.add('hidden'); }

  // ── PixiJS 初始化 ──
  function initPixi() {
    app = new PIXI.Application({
      width: container.clientWidth || 300,
      height: container.clientHeight || 400,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    container.appendChild(app.view);
  }

  function resizeCanvas() {
    if (!app) return;
    const w = container.clientWidth, h = container.clientHeight;
    if (w > 0 && h > 0) { app.renderer.resize(w, h); repositionModel(); }
  }

  function repositionModel() {
    if (!model || !app) return;
    const cfg = getSettings();
    const modelH = model.internalModel?.originalHeight || 400;
    const canvasW = app.renderer.width / app.renderer.resolution;
    const canvasH = app.renderer.height / app.renderer.resolution;
    model.scale.set((canvasH / modelH) * cfg.model_scale);
    model.x = canvasW / 2;
    model.y = canvasH / 2;
    model.anchor.set(0.5, 0.5);
  }

  // ── 呼吸修复：按模型参数实际范围重写 breath 参数 ──
  function fixBreath() {
    const im = model?.internalModel;
    const breath = im?.breath;
    const BPD = PIXI.live2d?.BreathParameterData;
    if (!im || !breath || !BPD) return;

    // 读 ParamBreath 实际 min/max，让正弦波铺满有效区间（修「只有前半」）
    let offset = 0.5, peak = 0.5;
    try {
      const idx = im.coreModel.getParameterIndex('ParamBreath');
      const min = im.coreModel.getParameterMinimumValue(idx);
      const max = im.coreModel.getParameterMaximumValue(idx);
      if (Number.isFinite(min) && Number.isFinite(max) && max > min) {
        offset = (min + max) / 2;
        peak = (max - min) / 2;
      }
    } catch { }

    breath.setParameters([
      // 呼吸主参数：完整起伏，周期 ~4.2s，权重 1（原库 0.5 且中心在 0 → 被钳半周）
      new BPD('ParamBreath', offset, peak, 4.2, 1.0),
      // 轻微身体摆动（降幅，避免与鼠标跟随打架）
      new BPD('ParamBodyAngleX', 0, 1.5, 15.5345, 0.3),
      new BPD('ParamBodyAngleZ', 0, 1.5, 11.2345, 0.3),
      new BPD('ParamAngleZ', 0, 1.5, 5.5345, 0.2),
    ]);
    console.log('[Live2D Waifu] Breath fixed: offset=%s peak=%s', offset, peak);
  }

  // ── 眨眼开关（eyeBlink 由 model3.json 的 Groups 段驱动创建） ──
  function applyBlinkSetting() {
    const eb = model?.internalModel?.eyeBlink;
    if (!eb) return;
    // 关闭 = 间隔拉到极大（等价不眨眼，且眼睛保持自然睁开）
    eb.setBlinkingInterval(getSettings().auto_blink ? 4 : 999999);
  }

  // ── 表情（按名字调用，避免索引顺序坑） ──
  function applyExpression(name) {
    if (!model || !modelReady) return;
    model.expression(name).catch(() => {});
  }

  // ── 发光：常亮 + 自动脉冲 ──
  function clearGlowTimers() {
    clearTimeout(glowPulseTimer);
    clearTimeout(glowRestoreTimer);
    glowPulseTimer = 0;
    glowRestoreTimer = 0;
    glowPulsing = false;
  }

  function applyGlowState() {
    clearGlowTimers();
    if (glowOn) {
      applyExpression('beijingchuxian'); // 常亮
    } else {
      applyExpression('idle');
      scheduleGlowPulse();               // 常亮关 → 自动脉冲接管
    }
  }

  function scheduleGlowPulse() {
    clearGlowTimers();
    if (!getSettings().auto_glow || glowOn || !modelReady) return;
    // 8~20s 后触发一次发光脉冲
    glowPulseTimer = setTimeout(fireGlowPulse, 8000 + Math.random() * 12000);
  }

  function fireGlowPulse() {
    if (!modelReady || glowOn || !getSettings().auto_glow) return;
    glowPulsing = true;
    applyExpression('beijingchuxian');
    // 持续 3~6s 后恢复，并预约下一次
    glowRestoreTimer = setTimeout(() => {
      glowPulsing = false;
      if (!glowOn) applyExpression('idle');
      scheduleGlowPulse();
    }, 3000 + Math.random() * 3000);
  }

  // ── 长跑自刷新（皮肤开发指南 §3.7） ──
  // 重 WebGL 皮肤：连续运行每 12 小时回到干净基线一次（间隔可在设置里调/可关）。
  // 重载后页面照常启动，宿主烘焙的入场淡入会自动重播，用户只看到一次普通淡入。
  // 只有皮肤自己知道什么时候刷新是安全的——不安全就顺延 1 小时再试，
  // 重载后计时链从 0 重走，因此不会叠加定时器。
  const SELF_REFRESH_RETRY_MS = 3600 * 1000;  // 不安全顺延：1 小时
  const INTERACTION_QUIET_MS = 10000;         // 交互后静默窗：10 秒内不刷
  const REFRESH_HOURS_DEFAULT = 12;           // 重 JS / WebGL 皮肤建议档
  const REFRESH_HOURS_MIN = 1;
  const REFRESH_HOURS_MAX = 24;
  // 自刷新配置的唯一事实源（同 glowOn 的理由：桥 settings 的同步时机不可依赖，
  // 管理器侧改动读事件里的 value 最稳）
  let selfRefreshOn = true;
  let selfRefreshHours = REFRESH_HOURS_DEFAULT;

  function clampRefreshHours(h) {
    const n = Number(h);
    if (!Number.isFinite(n)) return REFRESH_HOURS_DEFAULT;
    return Math.min(REFRESH_HOURS_MAX, Math.max(REFRESH_HOURS_MIN, n));
  }

  function selfRefreshSafeNow() {
    // 模型没就绪（加载中/加载失败）不是基线，重载只会再来一遍
    if (!modelReady || !model) return false;
    // 发光脉冲演到一半：等它演完再刷，别把脉冲切成两截
    if (glowPulsing) return false;
    // 刚交互过：点击会写 glow 设置（skin_set_setting 在途），等落盘后再刷
    if (performance.now() - lastInteractionAt < INTERACTION_QUIET_MS) return false;
    return true;
  }

  function selfRefreshTick() {
    if (selfRefreshSafeNow()) {
      console.log('[Live2D Waifu] Self-refresh: reload for a clean baseline');
      location.reload();
      // 兜底：重载真的发生时页面随即销毁、这条排期跟着消失；万一因故没生效，
      // 下面这行会让它 1 小时后重新排队，自刷新不会静默失效
    }
    // 不安全 → 顺延 1 小时再试
    selfRefreshTimer = setTimeout(selfRefreshTick, SELF_REFRESH_RETRY_MS);
  }

  // 排期/撤期（设置变更时重排；关闭自动刷新 = 撤掉定时器，本地皮肤就是这么关的）
  function armSelfRefresh() {
    clearTimeout(selfRefreshTimer);
    selfRefreshTimer = 0;
    if (!selfRefreshOn) return;
    selfRefreshTimer = setTimeout(selfRefreshTick, selfRefreshHours * 3600 * 1000);
  }

  // 启动时按桥烘焙的设置取初值（缺省：开、12 小时）
  function initSelfRefresh() {
    const cfg = getSettings();
    selfRefreshOn = cfg.auto_refresh !== false;
    selfRefreshHours = clampRefreshHours(cfg.refresh_hours);
    armSelfRefresh();
  }

  // ── 鼠标跟随 ──
  function setupMouseTracking() {
    document.addEventListener('mousemove', (e) => {
      if (!getSettings().mouse_tracking || !modelReady) return;
      const rect = container.getBoundingClientRect();
      model.focus(e.clientX - rect.left, e.clientY - rect.top);
    });
  }

  // ── 点击：切换常亮发光 ──
  function setupClickInteraction() {
    container.addEventListener('pointerdown', (e) => {
      if (!modelReady) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      if (model.hitTest(x, y).length > 0 || isPointOnModel(x, y)) {
        // 先翻本地状态再写设置——状态立即生效，不等待桥同步（无竞态）
        glowOn = !glowOn;
        const invoke = bridge()?.invoke;
        if (invoke) {
          // 写设置（管理器侧同步；desk-setting-changed 不会回派给自己）
          invoke('skin_set_setting', { key: 'glow', value: glowOn }).catch(() => {});
        }
        applyGlowState();
      }
    });
  }

  function isPointOnModel(x, y) {
    if (!model || !app) return false;
    const cw = app.renderer.width / app.renderer.resolution;
    const ch = app.renderer.height / app.renderer.resolution;
    return Math.abs(x - cw / 2) < cw * 0.4 && Math.abs(y - ch / 2) < ch * 0.45;
  }

  // ── 加载模型 ──
  async function loadModel() {
    try {
      PIXI.live2d.Live2DModel.registerTicker(PIXI.Ticker);

      // 1. fetch model3.json
      const resp = await fetch('model/339.model3.json');
      if (!resp.ok) throw new Error(`fetch model3.json: HTTP ${resp.status}`);
      const modelJson = await resp.json();

      // 2. 注入 url 字段（ModelSettings 构造函数要求，且作为子文件解析基准）
      if (IS_DRIFTLET) {
        modelJson.url = `http://skin.localhost/${SKIN_ID}/model/339.model3.json`;
      } else {
        modelJson.url = new URL('model/339.model3.json', window.location.href).href;
      }

      // 3. 创建 settings 并加载模型
      const modelSettings = new PIXI.live2d.Cubism4ModelSettings(modelJson);

      // 4. 额外保险：重写 resolveURL，确保所有子文件走 skin.localhost 绝对路径
      modelSettings.resolveURL = (relPath) => {
        if (/^(https?:|data:|blob:)/i.test(relPath)) return relPath;
        if (IS_DRIFTLET) return `http://skin.localhost/${SKIN_ID}/model/${relPath}`;
        return new URL(relPath, modelJson.url).href;
      };

      // 5. 加载
      model = await PIXI.live2d.Live2DModel.from(modelSettings, {
        autoUpdate: true,
        autoInteract: false,
      });

      app.stage.addChild(model);
      modelReady = true;

      repositionModel();
      fixBreath();          // 修呼吸（全周期自然起伏）
      applyBlinkSetting();  // 应用眨眼开关
      glowOn = !!getSettings().glow;  // 初始化本地发光状态（桥设置在页面加载前已烘焙，无竞态）
      applyGlowState();     // 应用发光状态（常亮或自动脉冲）
      setupMouseTracking();
      setupClickInteraction();
      hideLoading();
      console.log('[Live2D Waifu] Model loaded');
    } catch (err) {
      console.error('[Live2D Waifu] Load error:', err);
      showError('模型加载失败: ' + (err?.message || err));
    }
  }

  // ── 设置联动 ──
  function onSettingChanged(e) {
    const { key, value } = e.detail || {};
    switch (key) {
      case 'glow':
        // 管理器侧修改：同步进本地状态再应用（本地状态是唯一事实源）
        glowOn = !!value;
        applyGlowState();
        break;
      case 'auto_glow':
        if (value) scheduleGlowPulse();
        else clearGlowTimers();
        break;
      case 'model_scale':
        repositionModel();
        break;
      case 'auto_blink':
        applyBlinkSetting();
        break;
      case 'auto_refresh':
        // 关 = 撤掉排期；开 = 从当下重新计时
        selfRefreshOn = !!value;
        armSelfRefresh();
        break;
      case 'refresh_hours':
        // 改间隔也从当下重新计时（value 来自事件，不依赖桥同步时机）
        selfRefreshHours = clampRefreshHours(value);
        armSelfRefresh();
        break;
    }
  }

  // ── 启动 ──
  async function start() {
    try {
      initPixi();
      await loadModel();
      document.addEventListener('desk-setting-changed', onSettingChanged);
      window.addEventListener('resize', resizeCanvas);
      document.addEventListener('desk-window-config-changed', (e) => {
        const { key } = e.detail || {};
        if (key === 'width' || key === 'height') setTimeout(resizeCanvas, 50);
      });
      // 用户交互计时（自刷新安全点用）：捕获阶段，点画布/点模型都算
      container.addEventListener('pointerdown', () => {
        lastInteractionAt = performance.now();
      }, true);
      // 长跑自刷新排期（模型加载失败也排——重载本身就是一次恢复机会）
      initSelfRefresh();
      console.log('[Live2D Waifu] Started, id:', SKIN_ID, 'driftlet:', IS_DRIFTLET);
    } catch (err) {
      showError('初始化失败: ' + (err?.message || err));
    }
  }

  // ── 页面隐藏暂停 ──
  document.addEventListener('visibilitychange', () => {
    if (!app) return;
    document.hidden ? app.stop() : app.start();
  });

  // ── 启动 ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
