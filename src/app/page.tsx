"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import styles from "./page.module.css";
import { Play, Heart, Eye, Calendar, ChevronLeft, ChevronRight, MessageSquare, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Video {
  id: number;
  title: string;
  description: string;
  filePath: string;
  uploadTime: string;
  playCount: number;
  likeCount: number;
  reviewStatus: string;
  category: { id: number; name: string } | null;
  uploader: { id: number; username: string; avatarUrl: string };
}

interface Recommendation {
  id: number;
  name: string;
  description: string;
  videos: Video[];
}

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const searchKeyword = searchParams.get("search") || "";
  const currentCategory = searchParams.get("category") || "全部";

  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [carouselVideos, setCarouselVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch categories
        const catRes = await fetch("/api/categories");
        const catData = await catRes.json();
        if (catData.success) {
          setCategories(catData.categories);
        }

        // Fetch recommendations (Carousel)
        const recRes = await fetch("/api/recommendations");
        const recData = await recRes.json();
        if (recData.success && recData.recommendations.home_carousel) {
          setCarouselVideos(recData.recommendations.home_carousel.videos || []);
        }
      } catch (err) {
        console.error("Fetch initial home data error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Fetch videos when search keywords or category filters change
  useEffect(() => {
    async function fetchVideos() {
      try {
        let url = `/api/videos?status=通过`;
        if (currentCategory && currentCategory !== "全部") {
          url += `&category=${encodeURIComponent(currentCategory)}`;
        }
        if (searchKeyword) {
          url += `&search=${encodeURIComponent(searchKeyword)}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setVideos(data.videos);
        }
      } catch (err) {
        console.error("Fetch filtered videos error:", err);
      }
    }
    fetchVideos();
  }, [searchKeyword, currentCategory]);

  // Carousel timer
  useEffect(() => {
    if (carouselVideos.length <= 1) return;
    
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselVideos.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [carouselVideos]);

  const handleCategoryClick = (catName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (catName === "全部") {
      params.delete("category");
    } else {
      params.set("category", catName);
    }
    router.push(`/?${params.toString()}`);
  };

  const handlePrevCarousel = () => {
    setCarouselIndex((prev) => (prev - 1 + carouselVideos.length) % carouselVideos.length);
  };

  const handleNextCarousel = () => {
    setCarouselIndex((prev) => (prev + 1) % carouselVideos.length);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <div className={styles.wrapper}>
      <Header />

      <main className={styles.main}>
        {/* Carousel Banner (Only show when not searching and on "全部" category) */}
        {!searchKeyword && currentCategory === "全部" && carouselVideos.length > 0 && (
          <section className={styles.carouselSection}>
            <div className={styles.carousel}>
              {carouselVideos.map((video, idx) => (
                <div
                  key={video.id}
                  className={`${styles.carouselSlide} ${idx === carouselIndex ? styles.activeSlide : ""}`}
                  style={{
                    backgroundImage: `linear-gradient(to top, rgba(11, 12, 22, 0.95) 10%, rgba(11, 12, 22, 0.4) 60%, rgba(11, 12, 22, 0.1) 100%), url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop')` // Mock cover placeholder
                  }}
                >
                  <div className={styles.carouselContent}>
                    <span className={styles.carouselBadge}>编辑精选</span>
                    <h2 className={styles.carouselTitle}>{video.title}</h2>
                    <p className={styles.carouselDesc}>{video.description}</p>
                    <div className={styles.carouselMeta}>
                      <span className={styles.metaItem}>
                        <Eye size={16} />
                        <span>{video.playCount} 次播放</span>
                      </span>
                      <span className={styles.metaItem}>
                        <Heart size={16} />
                        <span>{video.likeCount} 点赞</span>
                      </span>
                    </div>
                    <Link href={`/video/${video.id}`} className={styles.playBtn}>
                      <Play size={18} fill="white" />
                      <span>立即播放</span>
                    </Link>
                  </div>
                </div>
              ))}

              {/* Carousel controls */}
              {carouselVideos.length > 1 && (
                <>
                  <button onClick={handlePrevCarousel} className={styles.carouselControlLeft}>
                    <ChevronLeft size={24} />
                  </button>
                  <button onClick={handleNextCarousel} className={styles.carouselControlRight}>
                    <ChevronRight size={24} />
                  </button>
                  <div className={styles.carouselIndicators}>
                    {carouselVideos.map((_, idx) => (
                      <span
                        key={idx}
                        onClick={() => setCarouselIndex(idx)}
                        className={`${styles.indicator} ${idx === carouselIndex ? styles.activeIndicator : ""}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* Category Navigation */}
        <section className={styles.categorySection}>
          <div className={styles.categoryList}>
            <button
              onClick={() => handleCategoryClick("全部")}
              className={`${styles.categoryTab} ${currentCategory === "全部" ? styles.activeTab : ""}`}
            >
              全部
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.name)}
                className={`${styles.categoryTab} ${currentCategory === cat.name ? styles.activeTab : ""}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        {/* Search Results Header */}
        {searchKeyword && (
          <div className={styles.searchHeader}>
            <p>
              关于“<span className={styles.keywordHighlight}>{searchKeyword}</span>”的搜索结果：
              <span className={styles.searchCount}>{videos.length} 个视频</span>
            </p>
          </div>
        )}

        {/* Video Grid */}
        <section className={styles.videoSection}>
          {loading ? (
            <div className={styles.loaderContainer}>
              <div className={styles.spinner}></div>
              <p>正在努力加载精彩视频...</p>
            </div>
          ) : videos.length > 0 ? (
            <div className={styles.videoGrid}>
              {videos.map((video) => (
                <Link href={`/video/${video.id}`} key={video.id} className={styles.videoCard}>
                  {/* Card Thumbnail */}
                  <div className={styles.thumbnailWrapper}>
                    <img
                      src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop" // Mock dynamic gradient cover
                      alt={video.title}
                      className={styles.thumbnail}
                    />
                    <div className={styles.thumbnailOverlay}>
                      <span className={styles.cardPlayIcon}>
                        <Play size={20} fill="white" />
                      </span>
                    </div>
                    {/* Category Label */}
                    {video.category && (
                      <span className={styles.cardCategory}>{video.category.name}</span>
                    )}
                  </div>

                  {/* Card Details */}
                  <div className={styles.cardDetails}>
                    <h3 className={styles.cardTitle}>{video.title}</h3>
                    <p className={styles.cardDesc}>{video.description}</p>
                    
                    <div className={styles.cardFooter}>
                      {/* Uploader */}
                      <div className={styles.uploader}>
                        <img
                          src={video.uploader.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"}
                          alt={video.uploader.username}
                          className={styles.uploaderAvatar}
                        />
                        <span className={styles.uploaderName}>{video.uploader.username}</span>
                      </div>
                      
                      {/* Play count */}
                      <div className={styles.cardMeta}>
                        <Eye size={13} />
                        <span>{video.playCount >= 10000 ? `${(video.playCount / 10000).toFixed(1)}万` : video.playCount}</span>
                      </div>
                    </div>
                    
                    <div className={styles.cardBottomMeta}>
                      <span className={styles.cardDate}>
                        <Calendar size={12} />
                        <span>{formatDate(video.uploadTime)}</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.emptyContainer}>
              <AlertCircle size={48} className={styles.emptyIcon} />
              <h3>暂无相关视频</h3>
              <p>换个关键词或分类试试吧，精彩马上回来。</p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
