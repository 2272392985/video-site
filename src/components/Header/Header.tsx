"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./Header.module.css";
import { Search, Upload, User, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchVal, setSearchVal] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    setSearchVal(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/?search=${encodeURIComponent(searchVal.trim())}`);
    } else {
      router.push("/");
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}>视界</span>
          <span className={styles.logoSub}>VISION</span>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.searchWrapper}>
            <input
              type="text"
              placeholder="搜索视频标题或简介..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchButton}>
              <Search size={18} />
            </button>
          </div>
        </form>

        {/* Navigation */}
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>
            首页
          </Link>
          
          {user ? (
            <>
              {!user.isAdmin && (
                <Link href="/upload" className={styles.uploadBtn}>
                  <Upload size={16} />
                  <span>投稿</span>
                </Link>
              )}
              {user.isAdmin && (
                <Link href="/admin" className={styles.adminLink}>
                  <LayoutDashboard size={16} />
                  <span>管理后台</span>
                </Link>
              )}
              
              {/* User Dropdown */}
              <div className={styles.profileContainer}>
                <div 
                  className={styles.profileTrigger}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <img 
                    src={user.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"} 
                    alt={user.username} 
                    className={styles.avatar}
                  />
                  <span className={styles.username}>{user.username}</span>
                  <ChevronDown size={14} className={styles.chevron} />
                </div>

                {dropdownOpen && (
                  <>
                    <div className={styles.backdrop} onClick={() => setDropdownOpen(false)} />
                    <div className={styles.dropdown}>
                      <div className={styles.dropdownHeader}>
                        <p className={styles.userRole}>{user.isAdmin ? `${user.role}管理员` : "普通用户"}</p>
                        <p className={styles.userEmail}>{user.email}</p>
                      </div>
                      
                      {!user.isAdmin && (
                        <Link 
                          href="/user" 
                          className={styles.dropdownItem}
                          onClick={() => setDropdownOpen(false)}
                        >
                          <User size={16} />
                          <span>个人中心</span>
                        </Link>
                      )}
                      
                      <button 
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                        }}
                        className={`${styles.dropdownItem} ${styles.logoutBtn}`}
                      >
                        <LogOut size={16} />
                        <span>退出登录</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <Link href="/login" className={styles.loginBtn}>
              登录 / 注册
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
