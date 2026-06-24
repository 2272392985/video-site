import React from "react";
import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brandSection}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoText}>视界</span>
          </Link>
          <p className={styles.desc}>
            探索海量精彩视频，发现更广阔的世界。分享你的创意，连接世界的精彩。
          </p>
        </div>
        
        <div className={styles.linksGrid}>
          <div className={styles.linkCol}>
            <h4 className={styles.colTitle}>关于我们</h4>
            <Link href="/" className={styles.link}>关于视界</Link>
            <Link href="/" className={styles.link}>社区准则</Link>
            <Link href="/" className={styles.link}>加入我们</Link>
          </div>
          
          <div className={styles.linkCol}>
            <h4 className={styles.colTitle}>帮助支持</h4>
            <Link href="/" className={styles.link}>帮助中心</Link>
            <Link href="/" className={styles.link}>使用指南</Link>
            <Link href="/" className={styles.link}>投稿规范</Link>
          </div>
          
          <div className={styles.linkCol}>
            <h4 className={styles.colTitle}>条款协议</h4>
            <Link href="/" className={styles.link}>用户协议</Link>
            <Link href="/" className={styles.link}>隐私政策</Link>
            <Link href="/" className={styles.link}>版权申明</Link>
          </div>
        </div>
      </div>
      
      <div className={styles.bottomBar}>
        <div className={styles.bottomContainer}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} 视界 Vision. All rights reserved. 数据库系统实践项目.
          </p>
          <div className={styles.socials}>
            <span>关注我们:</span>
            <Link href="/" className={styles.socialLink}>微信</Link>
            <Link href="/" className={styles.socialLink}>微博</Link>
            <Link href="/" className={styles.socialLink}>GitHub</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
