"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { useAuth } from "@/context/AuthContext";
import styles from "./page.module.css";
import { Upload, FileVideo, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Authenticate user
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (data.success) {
          setCategories(data.categories);
          if (data.categories.length > 0) {
            setCategoryName(data.categories[0].name); // Select first by default
          }
        }
      } catch (err) {
        console.error("Load upload page categories error:", err);
      }
    }
    loadCategories();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setErrorMsg("");
      
      // Auto-fill title with filename if empty
      if (!title) {
        const nameWithoutExt = e.target.files[0].name.replace(/\.[^/.]+$/, "");
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("请填写视频标题");
      return;
    }
    if (!categoryName) {
      setErrorMsg("请选择视频分类");
      return;
    }

    setUploading(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("category", categoryName);
      if (file) {
        formData.append("file", file);
      }

      const res = await fetch("/api/videos", {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        setUploadSuccess(true);
        setTitle("");
        setDescription("");
        setFile(null);
      } else {
        setErrorMsg(data.error || "视频提交失败，请重试");
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
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>正在验证身份...</p>
        </div>
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
              /* Success Panel */
              <div className={styles.successPanel}>
                <CheckCircle2 size={64} className={styles.successIcon} />
                <h2>视频已提交审核</h2>
                <p>
                  您的投稿“<strong>{title || "新视频"}</strong>”已提交至后台！<br />
                  审核人员通过后，它将展示在平台的首页及对应分类中。
                </p>
                <div className={styles.successActions}>
                  <Link href="/user?tab=videos" className={styles.btnPrimary}>
                    前往个人中心查看
                  </Link>
                  <button 
                    onClick={() => setUploadSuccess(false)}
                    className={styles.btnSecondary}
                  >
                    继续发布投稿
                  </button>
                </div>
              </div>
            ) : (
              /* Form Panel */
              <form onSubmit={handleUploadSubmit} className={styles.form}>
                
                {/* File Upload drag-drop area */}
                <div className={styles.fileDropZone}>
                  <input
                    type="file"
                    accept="video/*"
                    id="video-upload"
                    onChange={handleFileChange}
                    className={styles.fileInput}
                  />
                  <label htmlFor="video-upload" className={styles.fileLabel}>
                    {file ? (
                      <div className={styles.fileSelected}>
                        <FileVideo size={48} className={styles.videoIcon} />
                        <span className={styles.fileName}>{file.name}</span>
                        <span className={styles.fileSize}>
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                    ) : (
                      <div className={styles.filePrompt}>
                        <Upload size={48} className={styles.uploadIcon} />
                        <span className={styles.promptMain}>点击选择视频文件</span>
                        <span className={styles.promptSub}>支持 MP4, WebM 格式，大小建议 100MB 以内</span>
                      </div>
                    )}
                  </label>
                </div>

                {/* Form fields */}
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
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>视频简介</label>
                    <textarea
                      placeholder="介绍一下你的视频内容，让更多人了解它..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      className={styles.textarea}
                    />
                  </div>
                </div>

                {/* Error message */}
                {errorMsg && (
                  <div className={styles.errorBox}>
                    <AlertCircle size={18} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={uploading}
                  className={styles.submitBtn}
                >
                  {uploading ? (
                    <>
                      <div className={styles.miniSpinner}></div>
                      <span>正在上传视频并保存数据...</span>
                    </>
                  ) : (
                    <span>提交投稿</span>
                  )}
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
