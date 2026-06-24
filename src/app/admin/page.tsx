"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { useAuth } from "@/context/AuthContext";
import styles from "./page.module.css";
import { 
  LayoutDashboard, ClipboardCheck, Users, Tags, ArrowRight,
  TrendingUp, PlayCircle, ThumbsUp, ShieldAlert, Check, X, 
  Trash2, Ban, UserCheck, Plus, AlertCircle, Eye
} from "lucide-react";

interface AdminStats {
  userCount: number;
  videoCount: number;
  totalPlayCount: number;
  totalLikeCount: number;
  trendData: { date: string; plays: number }[];
  categoryDistribution: { name: string; value: number }[];
}

interface AdminVideo {
  id: number;
  title: string;
  description: string;
  filePath: string;
  uploadTime: string;
  playCount: number;
  likeCount: number;
  reviewStatus: string;
  reviewOpinion: string | null;
  uploader: { username: string; email: string };
  category: { name: string } | null;
}

interface AdminUser {
  id: number;
  username: string;
  email: string;
  avatarUrl: string;
  regTime: string;
  status: string;
}

interface CategoryItem {
  id: number;
  name: string;
  description: string | null;
  createTime: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"dashboard" | "audit" | "users" | "categories">("dashboard");

  // Admin Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms states
  const [auditOpinions, setAuditOpinions] = useState<Record<number, string>>({});
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Authenticate Admin
  useEffect(() => {
    if (!authLoading) {
      if (!authUser) {
        router.push("/login");
      } else if (!authUser.isAdmin) {
        // Redirect standard users back to home
        router.push("/");
      }
    }
  }, [authUser, authLoading, router]);

  // Load Data based on active tab
  useEffect(() => {
    if (!authUser || !authUser.isAdmin) return;

    async function loadData() {
      setLoading(true);
      setMsg(null);
      try {
        if (activeTab === "dashboard") {
          const res = await fetch("/api/admin/stats");
          const data = await res.json();
          if (data.success) setStats(data.stats);
        } else if (activeTab === "audit") {
          const res = await fetch("/api/admin/videos");
          const data = await res.json();
          if (data.success) setVideos(data.videos);
        } else if (activeTab === "users") {
          const res = await fetch("/api/admin/users");
          const data = await res.json();
          if (data.success) setUsers(data.users);
        } else if (activeTab === "categories") {
          const res = await fetch("/api/categories");
          const data = await res.json();
          if (data.success) setCategories(data.categories);
        }
      } catch (err) {
        console.error("Load admin data error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeTab, authUser]);

  // Handle Video Audit (Pass / Reject)
  const handleAudit = async (videoId: number, status: "通过" | "驳回") => {
    setActionLoading(true);
    setMsg(null);
    const opinion = auditOpinions[videoId] || "";

    try {
      const res = await fetch(`/api/admin/videos/${videoId}/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, opinion })
      });
      const data = await res.json();

      if (data.success) {
        setMsg({ type: "success", text: data.message || "审核操作成功" });
        // Refresh videos list
        setVideos((prev) =>
          prev.map((v) => (v.id === videoId ? { ...v, reviewStatus: status, reviewOpinion: opinion } : v))
        );
        // Clear opinions input
        setAuditOpinions((prev) => ({ ...prev, [videoId]: "" }));
      } else {
        setMsg({ type: "error", text: data.error || "操作失败，请重试" });
      }
    } catch (err: any) {
      setMsg({ type: "error", text: "审核提交出错: " + err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle User Status Toggle (Ban / Unban)
  const handleToggleUserStatus = async (userId: number, currentStatus: string) => {
    setActionLoading(true);
    setMsg(null);
    const newStatus = currentStatus === "正常" ? "禁用" : "正常";

    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();

      if (data.success) {
        setMsg({ type: "success", text: data.message || "用户状态已更新" });
        // Update local state
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
        );
      } else {
        setMsg({ type: "error", text: data.error || "状态更新失败，请重试" });
      }
    } catch (err: any) {
      setMsg({ type: "error", text: "修改用户状态出错: " + err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setMsg({ type: "error", text: "分类名称不能为空" });
      return;
    }

    setActionLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim(), description: newCatDesc.trim() })
      });
      const data = await res.json();

      if (data.success) {
        setMsg({ type: "success", text: "新分类创建成功！" });
        setCategories((prev) => [...prev, data.category]);
        setNewCatName("");
        setNewCatDesc("");
      } else {
        setMsg({ type: "error", text: data.error || "分类创建失败" });
      }
    } catch (err: any) {
      setMsg({ type: "error", text: "创建分类出错: " + err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  if (authLoading || !authUser || !authUser.isAdmin) {
    return (
      <div className={styles.wrapper}>
        <Header />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>正在验证管理员权限...</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Calculate SVG Chart dimensions and coordinates
  const renderTrendChart = () => {
    if (!stats || !stats.trendData || stats.trendData.length === 0) return null;
    
    const data = stats.trendData;
    const width = 650;
    const height = 220;
    const padding = 35;
    
    const maxVal = Math.max(...data.map(d => d.plays), 100);
    const minVal = 0;
    
    const getX = (index: number) => padding + (index * (width - 2 * padding)) / (data.length - 1);
    const getY = (value: number) => height - padding - ((value - minVal) * (height - 2 * padding)) / (maxVal - minVal);
    
    // Build path string
    let pathD = `M ${getX(0)} ${getY(data[0].plays)}`;
    for (let i = 1; i < data.length; i++) {
      pathD += ` L ${getX(i)} ${getY(data[i].plays)}`;
    }

    // Build area path string (goes down to bottom axis and back to start)
    const areaD = `${pathD} L ${getX(data.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`;

    return (
      <div className={styles.chartWrapper}>
        <svg viewBox={`0 0 ${width} ${height}`} className={styles.svgChart}>
          {/* Grids */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const yVal = height - padding - ratio * (height - 2 * padding);
            return (
              <g key={idx}>
                <line 
                  x1={padding} 
                  y1={yVal} 
                  x2={width - padding} 
                  y2={yVal} 
                  className={styles.chartGridLine} 
                />
                <text 
                  x={padding - 10} 
                  y={yVal + 4} 
                  textAnchor="end" 
                  className={styles.chartText}
                >
                  {Math.round(minVal + ratio * (maxVal - minVal))}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaD} className={styles.chartArea} />
          
          {/* Stroke path */}
          <path d={pathD} className={styles.chartStroke} />

          {/* Dots and Labels */}
          {data.map((d, idx) => (
            <g key={idx}>
              <circle 
                cx={getX(idx)} 
                cy={getY(d.plays)} 
                r={4} 
                className={styles.chartDot} 
              />
              <text 
                x={getX(idx)} 
                y={height - 8} 
                textAnchor="middle" 
                className={styles.chartText}
              >
                {d.date}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className={styles.wrapper}>
      <Header />

      <main className={styles.main}>
        <div className={styles.layout}>
          
          {/* Sidebar Menu */}
          <aside className={styles.sidebar}>
            <div className={styles.adminProfile}>
              <div className={styles.adminAvatar}>
                <LayoutDashboard size={24} />
              </div>
              <div>
                <h3>{authUser.username}</h3>
                <p>{authUser.role}管理员</p>
              </div>
            </div>
            
            <nav className={styles.sidebarNav}>
              <button 
                onClick={() => setActiveTab("dashboard")}
                className={`${styles.navBtn} ${activeTab === "dashboard" ? styles.activeNavBtn : ""}`}
              >
                <LayoutDashboard size={16} />
                <span>数据看板</span>
              </button>
              
              <button 
                onClick={() => setActiveTab("audit")}
                className={`${styles.navBtn} ${activeTab === "audit" ? styles.activeNavBtn : ""}`}
              >
                <ClipboardCheck size={16} />
                <span>视频审核</span>
              </button>
              
              <button 
                onClick={() => setActiveTab("users")}
                className={`${styles.navBtn} ${activeTab === "users" ? styles.activeNavBtn : ""}`}
              >
                <Users size={16} />
                <span>用户管理</span>
              </button>
              
              <button 
                onClick={() => setActiveTab("categories")}
                className={`${styles.navBtn} ${activeTab === "categories" ? styles.activeNavBtn : ""}`}
              >
                <Tags size={16} />
                <span>分类管理</span>
              </button>
            </nav>
          </aside>

          {/* Main Content Area */}
          <section className={styles.content}>
            
            {/* Global Admin Message Box */}
            {msg && (
              <div className={`${styles.messageBox} ${msg.type === "success" ? styles.msgSuccess : styles.msgError}`}>
                {msg.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
                <span>{msg.text}</span>
              </div>
            )}

            {loading ? (
              <div className={styles.loader}>
                <div className={styles.spinner}></div>
                <p>正在拉取最新后台数据...</p>
              </div>
            ) : (
              <>
                {/* 1. DASHBOARD TAB */}
                {activeTab === "dashboard" && stats && (
                  <div className={styles.tabPanel}>
                    <div className={styles.panelTitle}>
                      <h2>系统运行数据总览</h2>
                      <p>截止目前平台的整体运营与用户活动数据大屏。</p>
                    </div>

                    {/* Stats Grid Cards */}
                    <div className={styles.statsGrid}>
                      <div className={`${styles.statCard} glass-panel`}>
                        <div className={styles.scHeader}>
                          <Users size={24} className={styles.scIconUsers} />
                          <span className={styles.scTitle}>总用户量</span>
                        </div>
                        <p className={styles.scValue}>{stats.userCount}</p>
                        <p className={styles.scDesc}>注册账号总量</p>
                      </div>

                      <div className={`${styles.statCard} glass-panel`}>
                        <div className={styles.scHeader}>
                          <PlayCircle size={24} className={styles.scIconVideos} />
                          <span className={styles.scTitle}>总视频量</span>
                        </div>
                        <p className={styles.scValue}>{stats.videoCount}</p>
                        <p className={styles.scDesc}>全站上传投稿数</p>
                      </div>

                      <div className={`${styles.statCard} glass-panel`}>
                        <div className={styles.scHeader}>
                          <Eye size={24} className={styles.scIconPlays} />
                          <span className={styles.scTitle}>总播放量</span>
                        </div>
                        <p className={styles.scValue}>{stats.totalPlayCount}</p>
                        <p className={styles.scDesc}>视频累计播放量</p>
                      </div>

                      <div className={`${styles.statCard} glass-panel`}>
                        <div className={styles.scHeader}>
                          <ThumbsUp size={24} className={styles.scIconLikes} />
                          <span className={styles.scTitle}>总点赞数</span>
                        </div>
                        <p className={styles.scValue}>{stats.totalLikeCount}</p>
                        <p className={styles.scDesc}>全站视频点赞互动量</p>
                      </div>
                    </div>

                    {/* Chart Section */}
                    <div className={`${styles.chartSection} glass-panel`}>
                      <div className={styles.chartHeader}>
                        <TrendingUp size={18} />
                        <h3>全站播放量趋势 (过去 7 天)</h3>
                      </div>
                      {renderTrendChart()}
                    </div>

                    {/* Category Distribution Section */}
                    <div className={styles.distribSection}>
                      <div className={`${styles.distribCard} glass-panel`}>
                        <h3>分类视频占比</h3>
                        <div className={styles.distribList}>
                          {stats.categoryDistribution.map((item, idx) => (
                            <div key={idx} className={styles.distribItem}>
                              <div className={styles.distribMeta}>
                                <span>{item.name}</span>
                                <strong>{item.value} 个视频</strong>
                              </div>
                              <div className={styles.progressBarBg}>
                                <div 
                                  className={styles.progressBarFill} 
                                  style={{ width: `${stats.videoCount > 0 ? (item.value / stats.videoCount) * 100 : 0}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. VIDEO AUDIT TAB */}
                {activeTab === "audit" && (
                  <div className={styles.tabPanel}>
                    <div className={styles.panelTitle}>
                      <h2>视频投稿审核中心</h2>
                      <p>管理用户上传的视频作品，进行多维度安全审查与合规判断。</p>
                    </div>

                    {videos.length > 0 ? (
                      <div className={styles.auditList}>
                        {videos.map((vid) => (
                          <div key={vid.id} className={`${styles.auditCard} glass-panel`}>
                            <div className={styles.acLayout}>
                              {/* Left: video preview mock */}
                              <div className={styles.acPreview}>
                                <video 
                                  src={vid.filePath} 
                                  controls 
                                  className={styles.acVideo} 
                                />
                                <span className={styles.acDuration}>在线预览</span>
                              </div>
                              
                              {/* Right: info & form */}
                              <div className={styles.acDetails}>
                                <div className={styles.acTitleRow}>
                                  <h3>{vid.title}</h3>
                                  <span className={`${styles.badge} ${
                                    vid.reviewStatus === "通过" ? styles.badgeSuccess : 
                                    vid.reviewStatus === "待审核" ? styles.badgePending : styles.badgeDanger
                                  }`}>
                                    {vid.reviewStatus}
                                  </span>
                                </div>
                                <p className={styles.acDesc}>{vid.description || "无简介"}</p>
                                
                                <div className={styles.acMeta}>
                                  <span>分类: {vid.category?.name || "未指定"}</span>
                                  <span>•</span>
                                  <span>投递人: {vid.uploader.username} ({vid.uploader.email})</span>
                                  <span>•</span>
                                  <span>投递日期: {formatDate(vid.uploadTime)}</span>
                                </div>

                                {vid.reviewStatus === "待审核" ? (
                                  /* Form */
                                  <div className={styles.auditForm}>
                                    <input
                                      type="text"
                                      placeholder="驳回意见说明 (通过请留空，驳回必填)..."
                                      value={auditOpinions[vid.id] || ""}
                                      onChange={(e) => setAuditOpinions({ ...auditOpinions, [vid.id]: e.target.value })}
                                      className={styles.auditInput}
                                    />
                                    <div className={styles.auditActions}>
                                      <button
                                        onClick={() => handleAudit(vid.id, "通过")}
                                        disabled={actionLoading}
                                        className={styles.btnApprove}
                                      >
                                        <Check size={14} />
                                        <span>审核通过</span>
                                      </button>
                                      
                                      <button
                                        onClick={() => {
                                          if (!auditOpinions[vid.id]?.trim()) {
                                            alert("驳回视频必须填写审核驳回意见！");
                                            return;
                                          }
                                          handleAudit(vid.id, "驳回");
                                        }}
                                        disabled={actionLoading}
                                        className={styles.btnReject}
                                      >
                                        <X size={14} />
                                        <span>审核驳回</span>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* Audited state details */
                                  <div className={styles.auditedMeta}>
                                    {vid.reviewOpinion && (
                                      <p className={styles.acOpinion}>
                                        <strong>审核批语:</strong> {vid.reviewOpinion}
                                      </p>
                                    )}
                                    <p className={styles.auditStatusDone}>视频审核流程已终结。</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={styles.empty}>
                        <ClipboardCheck size={48} />
                        <h3>暂无待审核视频</h3>
                        <p>平台用户投稿视频已全部审核完毕，运行状态良好。</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. USER MANAGEMENT TAB */}
                {activeTab === "users" && (
                  <div className={styles.tabPanel}>
                    <div className={styles.panelTitle}>
                      <h2>注册用户账号管理</h2>
                      <p>查看并管理平台所有注册用户，维护健康的社区生态环境。</p>
                    </div>

                    <div className={styles.tableWrapper}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>用户 ID</th>
                            <th>用户名</th>
                            <th>邮箱</th>
                            <th>注册时间</th>
                            <th>账号状态</th>
                            <th>管理操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((u) => (
                            <tr key={u.id}>
                              <td>{u.id}</td>
                              <td>
                                <div className={styles.tableUser}>
                                  <img 
                                    src={u.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"} 
                                    alt={u.username} 
                                    className={styles.tableUserAvatar}
                                  />
                                  <span>{u.username}</span>
                                </div>
                              </td>
                              <td>{u.email}</td>
                              <td>{formatDate(u.regTime)}</td>
                              <td>
                                <span className={`${styles.statusLabel} ${u.status === "正常" ? styles.statusNormal : styles.statusDisabled}`}>
                                  {u.status}
                                </span>
                              </td>
                              <td>
                                <button
                                  onClick={() => handleToggleUserStatus(u.id, u.status)}
                                  disabled={actionLoading}
                                  className={`${styles.rowActionBtn} ${u.status === "正常" ? styles.btnDisable : styles.btnEnable}`}
                                >
                                  {u.status === "正常" ? (
                                    <>
                                      <Ban size={13} />
                                      <span>禁用账号</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck size={13} />
                                      <span>解冻启用</span>
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 4. CATEGORY MANAGEMENT TAB */}
                {activeTab === "categories" && (
                  <div className={styles.tabPanel}>
                    <div className={styles.panelTitle}>
                      <h2>视频分类目录运营</h2>
                      <p>创建和管理视频的分类板块，便于用户发现精彩内容。</p>
                    </div>

                    <div className={styles.catLayout}>
                      {/* Left: Add category form */}
                      <div className={`${styles.catFormCard} glass-panel`}>
                        <h3>创建新分类</h3>
                        <form onSubmit={handleCreateCategory} className={styles.catForm}>
                          <div className={styles.catFormGroup}>
                            <label>分类名称</label>
                            <input
                              type="text"
                              placeholder="分类名称 (如：科幻, 搞笑)..."
                              value={newCatName}
                              onChange={(e) => setNewCatName(e.target.value)}
                              className={styles.catInput}
                            />
                          </div>
                          
                          <div className={styles.catFormGroup}>
                            <label>分类描述</label>
                            <textarea
                              placeholder="对该分类板块的定位进行简要说明..."
                              value={newCatDesc}
                              onChange={(e) => setNewCatDesc(e.target.value)}
                              rows={4}
                              className={styles.catTextarea}
                            />
                          </div>

                          <button 
                            type="submit" 
                            disabled={actionLoading}
                            className={styles.btnCreate}
                          >
                            <Plus size={16} />
                            <span>{actionLoading ? "创建中..." : "创建分类"}</span>
                          </button>
                        </form>
                      </div>

                      {/* Right: Category List */}
                      <div className={styles.catListCol}>
                        <div className={styles.tableWrapper}>
                          <table className={styles.table}>
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>分类名称</th>
                                <th>分类描述</th>
                                <th>创建日期</th>
                              </tr>
                            </thead>
                            <tbody>
                              {categories.map((cat) => (
                                <tr key={cat.id}>
                                  <td>{cat.id}</td>
                                  <td><strong>{cat.name}</strong></td>
                                  <td><span className={styles.catTableDesc}>{cat.description || "无"}</span></td>
                                  <td>{formatDate(cat.createTime)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
