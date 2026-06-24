"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { useAuth } from "@/context/AuthContext";
import styles from "./page.module.css";
import { 
  User, Video, Star, MessageSquare, Calendar, Eye, Heart, 
  Settings, Save, AlertTriangle, CheckCircle, Info, Lock, Play
} from "lucide-react";
import Link from "next/link";

interface UserProfile {
  id: number;
  username: string;
  email: string;
  avatarUrl: string;
  regTime: string;
  status: string;
}

interface UserVideo {
  id: number;
  title: string;
  description: string;
  filePath: string;
  uploadTime: string;
  playCount: number;
  likeCount: number;
  reviewStatus: string;
  reviewOpinion: string | null;
  category: { name: string } | null;
}

interface FavoriteVideo {
  id: number;
  title: string;
  description: string;
  playCount: number;
  uploader: { username: string } | null;
  category: { name: string } | null;
}

interface UserComment {
  id: number;
  content: string;
  publishTime: string;
  video: { id: number; title: string } | null;
}

export default function UserCenterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authUser, loading: authLoading } = useAuth();
  
  // Tab state
  const activeTab = searchParams.get("tab") || "videos";

  // Data states
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [videos, setVideos] = useState<UserVideo[]>([]);
  const [favorites, setFavorites] = useState<FavoriteVideo[]>([]);
  const [comments, setComments] = useState<UserComment[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile Edit states
  const [editMode, setEditMode] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  const [msgBox, setMsgBox] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Authenticate user
  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push("/login");
    }
  }, [authUser, authLoading, router]);

  // Load User Data
  useEffect(() => {
    if (!authUser || authUser.isAdmin) return;

    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch("/api/user/profile");
        const data = await res.json();
        
        if (data.success) {
          setProfile(data.profile);
          setVideos(data.videos);
          setFavorites(data.favorites);
          setComments(data.comments);
          
          // Pre-fill edit forms
          setEditUsername(data.profile.username);
          setEditEmail(data.profile.email);
          setEditAvatarUrl(data.profile.avatarUrl);
        } else {
          console.error("Load user data error:", data.error);
        }
      } catch (err) {
        console.error("Load user data exception:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [authUser]);

  const handleTabChange = (tabName: string) => {
    router.push(`/user?tab=${tabName}`);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUsername.trim() || !editEmail.trim()) {
      setMsgBox({ type: "error", text: "用户名和邮箱不能为空" });
      return;
    }

    setActionLoading(true);
    setMsgBox(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editUsername.trim(),
          email: editEmail.trim(),
          avatarUrl: editAvatarUrl.trim(),
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined
        })
      });
      const data = await res.json();

      if (data.success) {
        setProfile(data.profile);
        setMsgBox({ type: "success", text: "个人信息更新成功！" });
        setEditMode(false);
        setCurrentPassword("");
        setNewPassword("");
        // Reload page to update global Auth state
        window.location.reload();
      } else {
        setMsgBox({ type: "error", text: data.error || "更新失败，请重试" });
      }
    } catch (err: any) {
      setMsgBox({ type: "error", text: "操作出错: " + err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  if (authLoading || loading) {
    return (
      <div className={styles.wrapper}>
        <Header />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>正在努力为您加载个人中心，请稍候...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className={styles.wrapper}>
      <Header />

      <main className={styles.main}>
        <div className={styles.dashboard}>
          
          {/* User Profile Card */}
          <div className={`${styles.profileCard} glass-panel`}>
            <div className={styles.cardHeader}>
              <img
                src={profile.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"}
                alt={profile.username}
                className={styles.avatar}
              />
              <div className={styles.meta}>
                <h2>{profile.username}</h2>
                <p className={styles.email}>{profile.email}</p>
                <div className={styles.badgeRow}>
                  <span className={styles.roleBadge}>普通用户</span>
                  <span className={`${styles.statusBadge} ${profile.status === "正常" ? styles.statusActive : styles.statusBanned}`}>
                    {profile.status === "正常" ? "账号正常" : "账号禁用"}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setEditMode(!editMode)}
                className={styles.settingsBtn}
              >
                <Settings size={18} />
                <span>{editMode ? "取消修改" : "编辑资料"}</span>
              </button>
            </div>

            {/* Profile editing form */}
            {editMode && (
              <form onSubmit={handleProfileUpdate} className={styles.editForm}>
                <h3>修改个人信息</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>用户名</label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>电子邮箱</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>头像链接 (支持 URL)</label>
                    <input
                      type="text"
                      value={editAvatarUrl}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.passwordSection}>
                  <h4>修改账户密码 <span className={styles.pwdTip}>(不修改密码请留空)</span></h4>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>当前密码</label>
                      <input
                        type="password"
                        placeholder="当前账户密码"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>新密码</label>
                      <input
                        type="password"
                        placeholder="新账户密码"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={styles.input}
                      />
                    </div>
                  </div>
                </div>

                {msgBox && (
                  <div className={`${styles.messageBox} ${msgBox.type === "success" ? styles.msgSuccess : styles.msgError}`}>
                    {msgBox.type === "success" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                    <span>{msgBox.text}</span>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={actionLoading} 
                  className={styles.saveBtn}
                >
                  <Save size={16} />
                  <span>{actionLoading ? "保存中..." : "保存修改"}</span>
                </button>
              </form>
            )}

            <div className={styles.cardFooter}>
              <div className={styles.joined}>
                <Calendar size={15} />
                <span>注册时间: {formatDate(profile.regTime)}</span>
              </div>
            </div>
          </div>

          {/* User Tab Area */}
          <div className={styles.tabsSection}>
            <div className={styles.tabsHeader}>
              <button
                onClick={() => handleTabChange("videos")}
                className={`${styles.tabBtn} ${activeTab === "videos" ? styles.activeTab : ""}`}
              >
                <Video size={16} />
                <span>我的视频 ({videos.length})</span>
              </button>
              
              <button
                onClick={() => handleTabChange("favorites")}
                className={`${styles.tabBtn} ${activeTab === "favorites" ? styles.activeTab : ""}`}
              >
                <Star size={16} />
                <span>我的收藏 ({favorites.length})</span>
              </button>
              
              <button
                onClick={() => handleTabChange("comments")}
                className={`${styles.tabBtn} ${activeTab === "comments" ? styles.activeTab : ""}`}
              >
                <MessageSquare size={16} />
                <span>评论历史 ({comments.length})</span>
              </button>
            </div>

            {/* Tab content panels */}
            <div className={styles.tabContent}>
              
              {/* PANEL 1: Videos */}
              {activeTab === "videos" && (
                <div className={styles.panelVideos}>
                  {videos.length > 0 ? (
                    <div className={styles.videoTableList}>
                      {videos.map((vid) => (
                        <div key={vid.id} className={styles.tableRow}>
                          <div className={styles.tableCoverWrapper}>
                            <img
                              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=150&auto=format&fit=crop"
                              alt={vid.title}
                              className={styles.tableCover}
                            />
                            {vid.reviewStatus === "通过" && (
                              <Link href={`/video/${vid.id}`} className={styles.coverPlayOverlay}>
                                <Play size={16} fill="white" />
                              </Link>
                            )}
                          </div>
                          
                          <div className={styles.tableDetails}>
                            <h4 className={styles.tableTitle}>
                              {vid.reviewStatus === "通过" ? (
                                <Link href={`/video/${vid.id}`}>{vid.title}</Link>
                              ) : (
                                <span>{vid.title}</span>
                              )}
                            </h4>
                            <p className={styles.tableDesc}>{vid.description || "无视频描述"}</p>
                            
                            <div className={styles.tableMeta}>
                              <span>分类: {vid.category?.name || "未分类"}</span>
                              <span>•</span>
                              <span>播放: {vid.playCount}</span>
                              <span>•</span>
                              <span>点赞: {vid.likeCount}</span>
                              <span>•</span>
                              <span>发布: {formatDate(vid.uploadTime)}</span>
                            </div>

                            {/* Rejection comment display */}
                            {vid.reviewStatus === "驳回" && vid.reviewOpinion && (
                              <div className={styles.opinionBox}>
                                <Info size={14} />
                                <span>驳回意见: {vid.reviewOpinion}</span>
                              </div>
                            )}
                          </div>

                          <div className={styles.tableStatusColumn}>
                            <span className={`${styles.badge} ${
                              vid.reviewStatus === "通过" ? styles.badgeSuccess : 
                              vid.reviewStatus === "待审核" ? styles.badgePending : styles.badgeDanger
                            }`}>
                              {vid.reviewStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyPanel}>
                      <Video size={40} className={styles.emptyIcon} />
                      <p>您还没有发布过视频投稿。</p>
                      <Link href="/upload" className={styles.emptyAction}>立即去上传</Link>
                    </div>
                  )}
                </div>
              )}

              {/* PANEL 2: Favorites */}
              {activeTab === "favorites" && (
                <div className={styles.panelFavorites}>
                  {favorites.length > 0 ? (
                    <div className={styles.favoritesGrid}>
                      {favorites.map((fav) => (
                        <Link 
                          href={`/video/${fav.id}`} 
                          key={fav.id} 
                          className={styles.favCard}
                        >
                          <div className={styles.favThumbWrapper}>
                            <img
                              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop"
                              alt={fav.title}
                              className={styles.favThumb}
                            />
                            <div className={styles.favPlayOverlay}>
                              <Play size={24} fill="white" />
                            </div>
                            {fav.category && <span className={styles.favCatBadge}>{fav.category.name}</span>}
                          </div>
                          <div className={styles.favInfo}>
                            <h4 className={styles.favTitle}>{fav.title}</h4>
                            <p className={styles.favUploader}>作者: {fav.uploader?.username || "未知"}</p>
                            <p className={styles.favMeta}>{fav.playCount} 次播放</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyPanel}>
                      <Star size={40} className={styles.emptyIcon} />
                      <p>您还没有收藏过任何视频。</p>
                      <Link href="/" className={styles.emptyAction}>去首页逛逛</Link>
                    </div>
                  )}
                </div>
              )}

              {/* PANEL 3: Comments */}
              {activeTab === "comments" && (
                <div className={styles.panelComments}>
                  {comments.length > 0 ? (
                    <div className={styles.commentsHistoryList}>
                      {comments.map((comm) => (
                        <div key={comm.id} className={styles.commCard}>
                          <div className={styles.commHeader}>
                            <div className={styles.commTime}>
                              <Calendar size={13} />
                              <span>发表于 {formatDate(comm.publishTime)}</span>
                            </div>
                            {comm.video && (
                              <Link 
                                href={`/video/${comm.video.id}`} 
                                className={styles.commVideoLink}
                              >
                                关联视频: {comm.video.title}
                              </Link>
                            )}
                          </div>
                          <p className={styles.commContent}>{comm.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyPanel}>
                      <MessageSquare size={40} className={styles.emptyIcon} />
                      <p>您还没有发表过任何评论。</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
