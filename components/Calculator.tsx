"use client";

import { useMemo, useState } from "react";

type Inputs = {
  mau: number; dauRate: number; sessions: number; reads: number; writes: number;
  deletes: number; firestoreGb: number; realtime: boolean; auth: "standard" | "identity";
  smsDay: number; storageGb: number; uploadDay: number; downloadMbDay: number; downloadOpsDay: number;
  functionsMonth: number; functionSeconds: number; functionMemory: number;
  hostingGbDay: number; usdJpy: number;
};

const pricing = {
  version: "2026-08-08", days: 30,
  firestore: { freeReadDay: 50000, freeWriteDay: 20000, freeDeleteDay: 20000, read100k: .03, write100k: .09, delete100k: .01, freeStorage: 1, storageGb: .18 },
  sms: { freeDay: 10, each: .03 },
  storage: { freeStorage: 5, storageGb: .026, freeDownloadDay: 1, downloadGb: .12, freeUploadDay: 20000, upload10k: .05, freeDownloadOpsDay: 50000, download10k: .004 },
  functions: { freeInvocations: 2_000_000, invocationMillion: .4, freeGbSeconds: 400_000, gbSecond: .0000025 },
  hosting: { freeGbDay: .36, gb: .15 },
};

const presets: Record<string, Pick<Inputs, "reads" | "writes" | "deletes">> = {
  light: { reads: 6, writes: 1, deletes: .05 },
  standard: { reads: 20, writes: 3, deletes: .1 },
  realtime: { reads: 60, writes: 5, deletes: .2 },
};

const initial: Inputs = {
  mau: 10000, dauRate: 30, sessions: 2, reads: 20, writes: 3, deletes: .1,
  firestoreGb: 1, realtime: false, auth: "standard", smsDay: 0, storageGb: 3,
  uploadDay: 500, downloadMbDay: 500, downloadOpsDay: 5000, functionsMonth: 1_000_000,
  functionSeconds: .2, functionMemory: .5, hostingGbDay: .2, usdJpy: 150,
};

function identityCost(mau: number) {
  let left = Math.max(0, mau - 50000), cost = 0;
  const bands = [[50000, .0055], [900000, .0046], [9000000, .0032], [Infinity, .0025]];
  for (const [size, rate] of bands) { const qty = Math.min(left, size); cost += qty * rate; left -= qty; if (left <= 0) break; }
  return cost;
}

function estimate(v: Inputs, mau = v.mau) {
  const dau = mau * v.dauRate / 100;
  const dailySessions = dau * v.sessions;
  const f = pricing.firestore;
  const firestoreOps = Math.max(0, dailySessions * v.reads * (v.realtime ? 1.6 : 1) - f.freeReadDay) / 100000 * f.read100k * 30
    + Math.max(0, dailySessions * v.writes - f.freeWriteDay) / 100000 * f.write100k * 30
    + Math.max(0, dailySessions * v.deletes - f.freeDeleteDay) / 100000 * f.delete100k * 30;
  const firestore = firestoreOps + Math.max(0, v.firestoreGb - f.freeStorage) * f.storageGb;
  const auth = v.auth === "identity" ? identityCost(mau) : 0;
  const sms = Math.max(0, v.smsDay - pricing.sms.freeDay) * pricing.sms.each * 30;
  const st = pricing.storage;
  const storage = Math.max(0, v.storageGb - st.freeStorage) * st.storageGb
    + Math.max(0, v.downloadMbDay / 1024 - st.freeDownloadDay) * st.downloadGb * 30
    + Math.max(0, v.uploadDay - st.freeUploadDay) / 10000 * st.upload10k * 30
    + Math.max(0, v.downloadOpsDay - st.freeDownloadOpsDay) / 10000 * st.download10k * 30;
  const gbSeconds = v.functionsMonth * v.functionSeconds * v.functionMemory;
  const functions = Math.max(0, v.functionsMonth - pricing.functions.freeInvocations) / 1_000_000 * pricing.functions.invocationMillion
    + Math.max(0, gbSeconds - pricing.functions.freeGbSeconds) * pricing.functions.gbSecond;
  const hosting = Math.max(0, v.hostingGbDay - pricing.hosting.freeGbDay) * pricing.hosting.gb * 30;
  const parts = { Firestore: firestore, Authentication: auth, "SMS認証": sms, Storage: storage, Functions: functions, Hosting: hosting };
  return { dau, dailySessions, parts, total: Object.values(parts).reduce((a, b) => a + b, 0) };
}

const money = (n: number) => n < .01 && n > 0 ? `$${n.toFixed(4)}` : `$${n.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;

function Field({ label, value, onChange, step = 1, suffix, min = 0 }: { label: string; value: number; onChange: (n: number) => void; step?: number; suffix?: string; min?: number }) {
  return <label className="field"><span>{label}</span><span className="input-wrap"><input type="number" min={min} step={step} value={value} onChange={e => onChange(Math.max(min, Number(e.target.value)))} />{suffix && <b>{suffix}</b>}</span></label>;
}

export default function Calculator() {
  const [v, setV] = useState(initial);
  const [mode, setMode] = useState<"simple" | "detail">("simple");
  const result = useMemo(() => estimate(v), [v]);
  const set = <K extends keyof Inputs>(key: K, value: Inputs[K]) => setV(old => ({ ...old, [key]: value }));
  const maxPart = Math.max(...Object.values(result.parts), .01);
  return <main>
    <header className="topbar"><a className="brand" href="#top"><span className="brandmark">F</span> Firebase Cost Lab</a><div className="status"><i /> 料金データ {pricing.version}</div></header>
    <section className="hero" id="top">
      <div><p className="eyebrow">BLAZE PLAN ESTIMATOR</p><h1>成長しても、<br /><em>請求額で驚かない。</em></h1><p className="lead">ユーザー数と使われ方から、Firebaseの月額コストをその場で試算。無料枠は日単位で正しく差し引きます。</p></div>
      <aside className="hero-note"><span>POINT 01</span><strong>Blazeに固定月額はありません</strong><p>無料枠を超えた分だけ支払う従量課金です。</p></aside>
    </section>

    <section className="tool">
      <div className="controls">
        <div className="mode-tabs"><button className={mode === "simple" ? "active" : ""} onClick={() => setMode("simple")}>かんたん見積もり</button><button className={mode === "detail" ? "active" : ""} onClick={() => setMode("detail")}>詳細見積もり</button></div>
        {mode === "simple" ? <>
          <div className="section-label">01 — AUDIENCE</div>
          <Field label="月間ユーザー数（MAU）" value={v.mau} onChange={n => set("mau", n)} suffix="人" />
          <Field label="1日に利用する割合（DAU / MAU）" value={v.dauRate} onChange={n => set("dauRate", n)} suffix="%" />
          <Field label="1人あたり1日の起動回数" value={v.sessions} onChange={n => set("sessions", n)} step={.1} suffix="回" />
          <div className="section-label">02 — APP TYPE</div>
          <label className="field stack"><span>アプリの使われ方</span><select aria-label="アプリの使われ方" value={v.realtime ? "realtime" : v.reads === 6 ? "light" : "standard"} onChange={e => { const p = presets[e.target.value]; setV(old => ({ ...old, ...p, realtime: e.target.value === "realtime" })); }}><option value="light">軽量な閲覧中心アプリ</option><option value="standard">普通のCRUDアプリ</option><option value="realtime">リアルタイム更新が多いアプリ</option></select></label>
          <label className="toggle"><span><strong>Identity Platform</strong><small>50,000 MAUを超えると段階課金</small></span><input aria-label="Identity Platformを使用" type="checkbox" checked={v.auth === "identity"} onChange={e => set("auth", e.target.checked ? "identity" : "standard")} /><i /></label>
          <Field label="電話番号認証（1日）" value={v.smsDay} onChange={n => set("smsDay", n)} suffix="SMS" />
        </> : <>
          <div className="section-label">USAGE — 詳細入力</div>
          <div className="grid2"><Field label="MAU" value={v.mau} onChange={n => set("mau", n)} /><Field label="DAU率" value={v.dauRate} onChange={n => set("dauRate", n)} suffix="%" /><Field label="起動 / 人・日" value={v.sessions} onChange={n => set("sessions", n)} step={.1} /><Field label="Reads / セッション" value={v.reads} onChange={n => set("reads", n)} /><Field label="Writes / セッション" value={v.writes} onChange={n => set("writes", n)} /><Field label="Deletes / セッション" value={v.deletes} onChange={n => set("deletes", n)} step={.1} /><Field label="Firestore保存" value={v.firestoreGb} onChange={n => set("firestoreGb", n)} step={.1} suffix="GiB" /><Field label="SMS / 日" value={v.smsDay} onChange={n => set("smsDay", n)} /></div>
          <label className="toggle"><span><strong>リアルタイムリスナー</strong><small>readを1.6倍で概算</small></span><input aria-label="リアルタイムリスナーを使用" type="checkbox" checked={v.realtime} onChange={e => set("realtime", e.target.checked)} /><i /></label>
          <label className="toggle"><span><strong>Identity Platform</strong><small>通常Firebase Authは無料で計算</small></span><input aria-label="Identity Platformを使用" type="checkbox" checked={v.auth === "identity"} onChange={e => set("auth", e.target.checked ? "identity" : "standard")} /><i /></label>
          <div className="section-label">STORAGE & COMPUTE</div>
          <div className="grid2"><Field label="Storage保存" value={v.storageGb} onChange={n => set("storageGb", n)} step={.1} suffix="GB" /><Field label="Storage DL / 日" value={v.downloadMbDay} onChange={n => set("downloadMbDay", n)} suffix="MB" /><Field label="Upload操作 / 日" value={v.uploadDay} onChange={n => set("uploadDay", n)} /><Field label="Download操作 / 日" value={v.downloadOpsDay} onChange={n => set("downloadOpsDay", n)} /><Field label="Functions / 月" value={v.functionsMonth} onChange={n => set("functionsMonth", n)} /><Field label="平均実行時間" value={v.functionSeconds} onChange={n => set("functionSeconds", n)} step={.1} suffix="秒" /><Field label="メモリ" value={v.functionMemory} onChange={n => set("functionMemory", n)} step={.25} suffix="GiB" /><Field label="Hosting転送 / 日" value={v.hostingGbDay} onChange={n => set("hostingGbDay", n)} step={.1} suffix="GB" /></div>
        </>}
      </div>

      <div className="results">
        <p className="eyebrow">MONTHLY ESTIMATE</p><div className="total"><span>推定月額</span><strong>{money(result.total)}</strong><small>約 ¥{Math.round(result.total * v.usdJpy).toLocaleString("ja-JP")} / 月</small></div>
        <div className="result-meta"><span>推定DAU <b>{Math.round(result.dau).toLocaleString()}人</b></span><span>1日セッション <b>{Math.round(result.dailySessions).toLocaleString()}回</b></span></div>
        <div className="breakdown"><div className="break-title"><span>サービス別内訳</span><b>USD / 月</b></div>{Object.entries(result.parts).map(([name, cost]) => <div className="bar-row" key={name}><div><span>{name}</span><b>{money(cost)}</b></div><div className="bar"><i style={{ width: `${Math.max(cost ? 2 : 0, cost / maxPart * 100)}%` }} /></div></div>)}</div>
        <div className="yearly"><span>年間予算の目安</span><strong>{money(result.total * 12)}</strong></div>
        <label className="rate"><span>参考レート</span><span><input type="number" value={v.usdJpy} onChange={e => set("usdJpy", Number(e.target.value))} /> 円 / USD</span></label>
      </div>
    </section>

    <section className="growth"><div><p className="eyebrow">GROWTH SIMULATION</p><h2>ユーザーが増えたら？</h2><p>同じ利用パターンのまま成長した場合の概算です。</p></div><div className="growth-cards">{[100000, 1000000].map(n => { const r = estimate(v, n); return <article key={n}><span>MAU</span><strong>{n.toLocaleString()}</strong><div>{money(r.total)}<small>/ 月</small></div></article>; })}</div></section>

    <section className="notes"><div><span>計算について</span><h2>概算を、意思決定の<br />スタート地点に。</h2></div><div className="note-grid"><p><b>日次無料枠を反映</b>Firestore・Hosting・SMSは、月合算ではなく1日ごとに無料枠を差し引いています。</p><p><b>リージョンに注意</b>Firestoreはus-central1、Storageは旧appspot.comバケットの基準価格による概算です。</p><p><b>含まれない費用</b>CPU、外向き通信、Cloud Build、Artifact Registry、App Hosting等の一部費用は含みません。</p><p><b>最終確認は公式で</b>実際の料金はリージョン・通貨・構成で異なります。導入前に公式料金ページを確認してください。</p></div></section>
    <footer><div className="brand"><span className="brandmark">F</span> Firebase Cost Lab</div><p>非公式の概算ツールです。Google / Firebaseとは関係ありません。</p><div><a href="https://firebase.google.com/pricing" target="_blank" rel="noreferrer">Firebase料金</a><a href="https://cloud.google.com/firestore/pricing" target="_blank" rel="noreferrer">Firestore料金</a></div></footer>
  </main>;
}
