"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { useAuth } from "@/context/AuthContext";
import styles from "./page.module.css";
import { 
  Play, Heart, Star, Share2, MessageSquare, Calendar, Eye, 
  Send, CornerDownRight, ThumbsUp, AlertCircle 
} from "lucide-react";
import Link from "next/link";

interface VideoDetail {
  id: number;
  title: string;
  description: string;
  filePath: string;
  uploadTime: string;
  playCount: number;
  likeCount: number;
  category: { id: number; name: string } | null;
  uploader: { id: number; username: string; avatarUrl: string };
}

interface Comment {
  id: number;
  content: string;
  publishTime: string;
  likeCount: number;
  user: { id: number; username: string; avatarUrl: string };
  parentId: number | null;
  replies?: Comment[];
}

export default function VideoDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const videoId = parseInt(id as string);

  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedVideos, setRelatedVideos] = useState<VideoDetail[]>([]);
  
  // Interactive states
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [likedCommentIds, setLikedCommentIds] = useState<number[]>([]);

  // Input states
  const [commentInput, setCommentInput] = useState("");
  const [replyInput, setReplyInput] = useState<Record<number, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch video data and comments
  useEffect(() => {
    if (isNaN(videoId)) return;

    async function loadData() {
      setLoading(true);
      try {
        // 1. Fetch video details
        const videoRes = await fetch(`/api/videos/${videoId}`);
        const videoData = await videoRes.json();
        
        if (videoData.success) {
          setVideo(videoData.video);
          setIsLiked(videoData.isLiked);
          setIsFavorited(videoData.isFavorited);
          setLikeCount(videoData.video.likeCount);
          setFavoriteCount(videoData.favoriteCount);
          
          // 2. Fetch related videos of the same category
          const catName = videoData.video.category?.name || "";
          const relatedRes = await fetch(`/api/videos?category=${encodeURIComponent(catName)}&status=通过`);
          const relatedData = await relatedRes.json();
          if (relatedData.success) {
            // Filter out current video
            setRelatedVideos(relatedData.videos.filter((v: VideoDetail) => v.id !== videoId).slice(0, 6));
          }
        } else {
          console.error("Video load error:", videoData.error);
        }

        // 3. Fetch comments
        const commentRes = await fetch(`/api/videos/${videoId}/comments`);
        const commentData = await commentRes.json();
        if (commentData.success) {
          setComments(commentData.comments);
          setLikedCommentIds(commentData.likedCommentIds || []);
        }
      } catch (err) {
        console.error("Load video detail page error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [videoId]);

  // Toggle Like
  const handleLike = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      const res = await fetch(`/api/videos/${videoId}/like`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setIsLiked(data.liked);
        setLikeCount(data.likeCount);
      }
    } catch (err) {
      console.error("Toggle like error:", err);
    }
  };

  // Toggle Favorite
  const handleFavorite = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      const res = await fetch(`/api/videos/${videoId}/favorite`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setIsFavorited(data.favorited);
        setFavoriteCount(data.favoriteCount);
      }
    } catch (err) {
      console.error("Toggle favorite error:", err);
    }
  };

  // Share URL
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  // Submit comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }
    if (!commentInput.trim()) return;

    try {
      const res = await fetch(`/api/videos/${videoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentInput }),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh comments list
        const updatedRes = await fetch(`/api/videos/${videoId}/comments`);
        const updatedData = await updatedRes.json();
        if (updatedData.success) {
          setComments(updatedData.comments);
        }
        setCommentInput("");
      }
    } catch (err) {
      console.error("Post comment error:", err);
    }
  };

  // Submit reply
  const handlePostReply = async (parentId: number) => {
    if (!user) {
      router.push("/login");
      return;
    }
    const text = replyInput[parentId];
    if (!text || !text.trim()) return;

    try {
      const res = await fetch(`/api/videos/${videoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, parentId }),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh comments list
        const updatedRes = await fetch(`/api/videos/${videoId}/comments`);
        const updatedData = await updatedRes.json();
        if (updatedData.success) {
          setComments(updatedData.comments);
        }
        setReplyInput((prev) => ({ ...prev, [parentId]: "" }));
        setActiveReplyId(null);
      }
    } catch (err) {
      console.error("Post reply error:", err);
    }
  };

  // Toggle Comment Like
  const handleCommentLike = async (commentId: number) => {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      const res = await fetch(`/api/comments/${commentId}/like`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        // Update liked status locally
        if (data.liked) {
          setLikedCommentIds((prev) => [...prev, commentId]);
        } else {
          setLikedCommentIds((prev) => prev.filter((cid) => cid !== commentId));
        }
        // Update comment like count locally
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === commentId) {
              return { ...c, likeCount: data.likeCount };
            }
            if (c.replies) {
              return {
                ...c,
                replies: c.replies.map((r) => (r.id === commentId ? { ...r, likeCount: data.likeCount } : r))
              };
            }
            return c;
          })
        );
      }
    } catch (err) {
      console.error("Toggle comment like error:", err);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <Header />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>正在努力为您加载精彩视频，请稍候...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!video) {
    return (
      <div className={styles.wrapper}>
        <Header />
        <div className={styles.errorContainer}>
          <AlertCircle size={48} className={styles.errorIcon} />
          <h2>视频未找到</h2>
          <p>该视频不存在，或已被作者删除，或审核未通过。</p>
          <Link href="/" className={styles.backBtn}>返回首页</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <Header />

      <main className={styles.main}>
        <div className={styles.contentGrid}>
          {/* Left Column: Player & Info & Comments */}
          <div className={styles.leftCol}>
            {/* Video Player */}
            <div className={styles.playerContainer}>
              <video
                ref={videoRef}
                src={video.filePath}
                controls
                autoPlay
                className={styles.player}
                poster="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop"
              />
            </div>

            {/* Video Title and Stats */}
            <div className={styles.infoSection}>
              <h1 className={styles.videoTitle}>{video.title}</h1>
              
              <div className={styles.metaRow}>
                <div className={styles.stats}>
                  <span className={styles.statItem}>
                    <Eye size={16} />
                    <span>{video.playCount} 次播放</span>
                  </span>
                  <span className={styles.statItem}>
                    <Calendar size={16} />
                    <span>{formatDate(video.uploadTime)}</span>
                  </span>
                  {video.category && (
                    <span className={styles.categoryBadge}>{video.category.name}</span>
                  )}
                </div>

                {/* Interaction Buttons */}
                <div className={styles.interactions}>
                  <button 
                    onClick={handleLike} 
                    className={`${styles.actionBtn} ${isLiked ? styles.activeAction : ""}`}
                  >
                    <Heart size={18} fill={isLiked ? "var(--text-error)" : "none"} />
                    <span>{likeCount}</span>
                  </button>
                  
                  <button 
                    onClick={handleFavorite} 
                    className={`${styles.actionBtn} ${isFavorited ? styles.activeAction : ""}`}
                  >
                    <Star size={18} fill={isFavorited ? "gold" : "none"} />
                    <span>{isFavorited ? "已收藏" : `${favoriteCount} 收藏`}</span>
                  </button>
                  
                  <button onClick={handleShare} className={styles.actionBtn}>
                    <Share2 size={18} />
                    <span>{shareCopied ? "链接已复制" : "分享"}</span>
                  </button>
                </div>
              </div>

              {/* Uploader Profile */}
              <div className={styles.uploaderRow}>
                <img
                  src={video.uploader.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"}
                  alt={video.uploader.username}
                  className={styles.uploaderAvatar}
                />
                <div className={styles.uploaderInfo}>
                  <h3 className={styles.uploaderName}>{video.uploader.username}</h3>
                  <p className={styles.uploaderSub}>视频创作者</p>
                </div>
                {!user?.isAdmin && user?.id !== video.uploader.id && (
                  <button className={styles.followBtn}>关注作者</button>
                )}
              </div>

              {/* Video Description */}
              <div className={styles.descriptionBox}>
                <p className={styles.descriptionText}>
                  {video.description || "作者很懒，什么视频简介都没有留下。"}
                </p>
              </div>
            </div>

            {/* Comment Section */}
            <div className={styles.commentSection}>
              <div className={styles.commentHeader}>
                <MessageSquare size={20} />
                <h2>评论 ({comments.length + comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0)})</h2>
              </div>

              {/* Comment Input */}
              {user ? (
                <form onSubmit={handlePostComment} className={styles.commentForm}>
                  <textarea
                    placeholder="发表你的精彩评论，共同探讨..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    className={styles.commentInput}
                    rows={3}
                  />
                  <div className={styles.formFooter}>
                    <span className={styles.wordCount}>{commentInput.length}/200</span>
                    <button type="submit" className={styles.commentSubmit}>
                      <Send size={14} />
                      <span>发布评论</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className={styles.loginPrompt}>
                  <p>您需要 <Link href="/login" className={styles.loginLink}>登录</Link> 后才能发表评论。</p>
                </div>
              )}

              {/* Comments List */}
              <div className={styles.commentsList}>
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className={styles.commentItem}>
                      {/* Top level comment */}
                      <div className={styles.commentMain}>
                        <img
                          src={comment.user.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"}
                          alt={comment.user.username}
                          className={styles.commentAvatar}
                        />
                        <div className={styles.commentBody}>
                          <div className={styles.commentMeta}>
                            <span className={styles.commentUser}>{comment.user.username}</span>
                            <span className={styles.commentTime}>{formatDate(comment.publishTime)}</span>
                          </div>
                          <p className={styles.commentContent}>{comment.content}</p>
                          <div className={styles.commentActions}>
                            <button 
                              onClick={() => handleCommentLike(comment.id)}
                              className={`${styles.commentActionBtn} ${likedCommentIds.includes(comment.id) ? styles.activeCommentAction : ""}`}
                            >
                              <ThumbsUp size={14} fill={likedCommentIds.includes(comment.id) ? "var(--secondary)" : "none"} />
                              <span>{comment.likeCount}</span>
                            </button>
                            {!user?.isAdmin && (
                              <button 
                                onClick={() => setActiveReplyId(activeReplyId === comment.id ? null : comment.id)}
                                className={styles.commentActionBtn}
                              >
                                回复
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Reply Input Form */}
                      {activeReplyId === comment.id && (
                        <div className={styles.replyFormWrapper}>
                          <textarea
                            placeholder={`回复 @${comment.user.username}...`}
                            value={replyInput[comment.id] || ""}
                            onChange={(e) => setReplyInput({ ...replyInput, [comment.id]: e.target.value })}
                            className={styles.replyInput}
                            rows={2}
                          />
                          <div className={styles.replyFormActions}>
                            <button 
                              onClick={() => setActiveReplyId(null)}
                              className={styles.replyCancelBtn}
                            >
                              取消
                            </button>
                            <button 
                              onClick={() => handlePostReply(comment.id)}
                              className={styles.replySubmitBtn}
                            >
                              发送
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Replies list */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className={styles.repliesList}>
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className={styles.replyItem}>
                              <CornerDownRight className={styles.replyArrow} size={16} />
                              <img
                                src={reply.user.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"}
                                alt={reply.user.username}
                                className={styles.replyAvatar}
                              />
                              <div className={styles.replyBody}>
                                <div className={styles.commentMeta}>
                                  <span className={styles.commentUser}>{reply.user.username}</span>
                                  <span className={styles.commentTime}>{formatDate(reply.publishTime)}</span>
                                </div>
                                <p className={styles.commentContent}>{reply.content}</p>
                                <div className={styles.commentActions}>
                                  <button 
                                    onClick={() => handleCommentLike(reply.id)}
                                    className={`${styles.commentActionBtn} ${likedCommentIds.includes(reply.id) ? styles.activeCommentAction : ""}`}
                                  >
                                    <ThumbsUp size={14} fill={likedCommentIds.includes(reply.id) ? "var(--secondary)" : "none"} />
                                    <span>{reply.likeCount}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className={styles.noComments}>
                    <p>暂无评论，快来发表第一条评论发表你的看法吧！</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Related Videos */}
          <div className={styles.rightCol}>
            <h2 className={styles.sidebarTitle}>相关视频推荐</h2>
            <div className={styles.sidebarGrid}>
              {relatedVideos.length > 0 ? (
                relatedVideos.map((rVideo) => (
                  <Link 
                    href={`/video/${rVideo.id}`} 
                    key={rVideo.id} 
                    className={styles.sideCard}
                  >
                    <div className={styles.sideThumbWrapper}>
                      <img
                        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=150&auto=format&fit=crop"
                        alt={rVideo.title}
                        className={styles.sideThumb}
                      />
                      <span className={styles.sidePlayIcon}>
                        <Play size={10} fill="white" />
                      </span>
                    </div>
                    <div className={styles.sideDetails}>
                      <h4 className={styles.sideTitle}>{rVideo.title}</h4>
                      <p className={styles.sideUploader}>{rVideo.uploader.username}</p>
                      <div className={styles.sideMeta}>
                        <span>{rVideo.playCount >= 10000 ? `${(rVideo.playCount / 10000).toFixed(1)}万` : rVideo.playCount} 次播放</span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className={styles.noRelated}>
                  <p>没有找到相关视频推荐。</p>
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
