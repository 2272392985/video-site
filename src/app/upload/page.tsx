"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { useAuth } from "@/context/AuthContext";
import styles from "./page.module.css";
import {
  Upload, Link2, FileVideo, CheckCircle2,
  AlertCircle, PlayCircle, Info, X,
} from "lucide-react";
import Link from "next/link";

const MAX_FILE_MB = 4;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

const SAMPLE_URLS = [
  { label: "旅行风光", url: "https://assets.mixkit.co/videos/4634/4634-720.mp4" },
  { label: "科技数码", url: "https://assets.mixkit.co/videos/5215/5215-720.mp4" },
  { label: "美食料理", url: "https://assets.mixkit.co/videos/4990/4990-720.mp4" },
  { label: "音乐演奏", url: "https://assets.mixkit.co/videos/5069/5069-720.mp4" },
  { label: "游戏竞技", url: "https://assets.mixkit.co/videos/5241/5241-720.mp4" },
];

type Mode = "url" | "file";

export default function UploadPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("url");

  // Common fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  // URL mode
  const [videoUrl, setVideoUrl] = useState("");
  const [previewActive, setPreviewActive] = useState(false);

  // File mode
  const [file, setFile] = useState<File | null>(null);
  const [fileSizeError, setFileSizeError] = useState("");

  // Submission
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [submittedTitle, setSubmittedTitle] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  // Load categories
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.categories.length > 0) {
          setCategories(data.categories);
          setCategoryName(data.categories[0].name);
        }
      });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFileSizeError("");
    if (!f) { setFile(null); return; }
    if (f.size > MAX_FILE_BYTES) {
      setFileSizeError(`文件大小 ${(f.size / 1024 / 1024).toFixed(1)} MB，超过 ${MAX_FILE_MB} MB 上限，请压缩后重试或改用外链投稿。`);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ""));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim()) { setErrorMsg("请填写视频标题"); return; }
    if (!categoryName) { setErrorMsg("请选择视频分类"); return; }

    if (mode === "url") {
      if (!videoUrl.trim()) { setErrorMsg("请填写视频链接"); return; }
      try { new URL(videoUrl.trim()); } catch {
        setErrorMsg("视频链接格式不正确，请输入完整的 https:// 链接");
        return;
      }
    } else {
      if (!file) { setErrorMsg("请选择要上传的视频文件"); return; }
    }

    setUploading(true);
    try {
      let res: Response;

      if (mode === "url") {
        // JSON request for URL mode
        res = await fetch("/api/videos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            category: categoryName,
            videoUrl: videoUrl.trim(),
          }),
        });
      } else {
        // FormData request for file upload mode
        const fd = new FormData();
        fd.append("title", title.trim());
        fd.append("description", description.trim());
        fd.append("category", categoryName);
        fd.append("file", file!);
        res = await fetch("/api/videos", { method: "POST", body: fd });
      }

      const data = await res.json();
      if (data.success) {
        setSubmittedTitle(title.trim());
        setUploadSuccess(true);
        setTitle(""); setDescription(""); setVideoUrl(""); setFile(null);
        setPreviewActive(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setErrorMsg(data.error || "提交失败，请重试");
      }
    } catch (err: any) {
      setErrorMsg("网络请求出错: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className={styles.wrapper}>
        <Header />
        <div className={styles.loading}><div className={styles.spinner} /><p>正在验证身份...</p></div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.headerTitle}>
            <h1>投稿发布</h1>
            <p>分享你的精彩创作，与世界共同见证。</p>
          </div>

          <div className={styles.uploadBox}>
            {uploadSuccess ? (
              <div className={styles.successPanel}>
                <CheckCircle2 size={64} className={styles.successIcon} />
                <h2>视频已提交审核</h2>
                <p>
                  您的投稿"<strong>{submittedTitle || "新视频"}</strong>"已提交至后台！<br />
                  审核人员通过后，它将展示在平台首页及对应分类中。
                </p>
                <div className={styles.successActions}>
                  <Link href="/user?tab=videos" className={styles.btnPrimary}>前往个人中心查看</Link>
                  <button onClick={() => setUploadSuccess(false)} className={styles.btnSecondary}>继续发布投稿</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.form}>

                {/* ── Mode Tabs ─────────────────────────────────────────── */}
                <div className={styles.modeTabs}>
                  <button
                    type="button"
                    className={`${styles.modeTab} ${mode === "url" ? styles.modeTabActive : ""}`}
                    onClick={() => { setMode("url"); setErrorMsg(""); }}
                  >
                    <Link2 size={16} /> 填写外部链接
                  </button>
                  <button
                    type="button"
                    className={`${styles.modeTab} ${mode === "file" ? styles.modeTabActive : ""}`}
                    onClick={() => { setMode("file"); setErrorMsg(""); setPreviewActive(false); }}
                  >
                    <Upload size={16} /> 上传本地文件
                  </button>
                </div>

                {/* ── URL Mode ──────────────────────────────────────────── */}
                {mode === "url" && (
                  <div className={styles.section}>
                    <div className={styles.infoBanner}>
                      <Info size={15} />
                      <span>填写可公开访问的视频直链（.mp4 / .webm），平台将嵌入该链接播放，无大小限制。</span>
                    </div>
                    <div className={styles.urlRow}>
                      <Link2 size={18} className={styles.urlIcon} />
                      <input
                        type="url"
                        placeholder="https://example.com/your-video.mp4"
                        value={videoUrl}
                        onChange={(e) => { setVideoUrl(e.target.value); setPreviewActive(false); }}
                        className={styles.urlInput}
                      />
                      {videoUrl && (
                        <button type="button" className={styles.previewBtn}
                          onClick={() => setPreviewActive((v) => !v)}>
                          <PlayCircle size={14} /> {previewActive ? "收起" : "预览"}
                        </button>
                      )}
                    </div>

                    {/* Sample chips */}
                    <div className={styles.sampleUrls}>
                      <span className={styles.sampleLabel}>示例链接：</span>
                      {SAMPLE_URLS.map((s, i) => (
                        <button key={i} type="button" className={styles.sampleChip}
                          onClick={() => { setVideoUrl(s.url); setPreviewActive(false); }}>
                          {s.label}
                        </button>
                      ))}
                    </div>

                    {previewActive && videoUrl && (
                      <div className={styles.previewBox}>
                        <video src={videoUrl} controls className={styles.previewVideo}
                          onError={() => { setErrorMsg("该链接无法播放，请检查是否有效"); setPreviewActive(false); }} />
                      </div>
                    )}
                  </div>
                )}

                {/* ── File Mode ─────────────────────────────────────────── */}
                {mode === "file" && (
                  <div className={styles.section}>
                    <div className={`${styles.infoBanner} ${styles.infoBannerWarn}`}>
                      <AlertCircle size={15} />
                      <span>
                        由于服务器限制，本地文件最大支持 <strong>{MAX_FILE_MB} MB</strong>。
                        大于 {MAX_FILE_MB} MB 的视频请先压缩，或切换到「填写外部链接」方式投稿。
                      </span>
                    </div>

                    <div
                      className={`${styles.fileDropZone} ${file ? styles.fileDropZoneActive : ""}`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/*"
                        onChange={handleFileChange}
                        className={styles.fileInputHidden}
                      />
                      {file ? (
                        <div className={styles.fileSelected}>
                          <FileVideo size={40} className={styles.videoIcon} />
                          <div className={styles.fileInfo}>
                            <span className={styles.fileName}>{file.name}</span>
                            <span className={styles.fileSize}>
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                              <span className={styles.fileSizeLimit}>&nbsp;/ {MAX_FILE_MB} MB 上限</span>
                            </span>
                          </div>
                          <button
                            type="button"
                            className={styles.clearFileBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setFile(null);
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className={styles.filePrompt}>
                          <Upload size={44} className={styles.uploadIcon} />
                          <span className={styles.promptMain}>点击选择视频文件</span>
                          <span className={styles.promptSub}>
                            支持 MP4、WebM 格式 · 最大 <strong>{MAX_FILE_MB} MB</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {fileSizeError && (
                      <div className={styles.errorBox} style={{ marginTop: 10 }}>
                        <AlertCircle size={16} /><span>{fileSizeError}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Common Fields ─────────────────────────────────────── */}
                <div className={styles.fields}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>视频标题 <span className={styles.required}>*</span></label>
                    <input
                      type="text"
                      placeholder="给视频取一个吸睛的标题吧..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={200}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>视频分类 <span className={styles.required}>*</span></label>
                    <select
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      className={styles.select}
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>视频简介</label>
                    <textarea
                      placeholder="介绍一下你的视频内容，让更多人了解它..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className={styles.textarea}
                    />
                  </div>
                </div>

                {/* Error */}
                {errorMsg && (
                  <div className={styles.errorBox}>
                    <AlertCircle size={18} /><span>{errorMsg}</span>
                  </div>
                )}

                {/* Submit */}
                <button type="submit" disabled={uploading} className={styles.submitBtn}>
                  {uploading
                    ? <><div className={styles.miniSpinner} /><span>正在提交...</span></>
                    : <span>提交投稿</span>}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
