"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./page.module.css";
import { User, Mail, Lock, ShieldAlert, CheckCircle2, UserCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  
  // Toggle states
  const [isRegister, setIsRegister] = useState(false);
  
  // Login fields
  const [loginAccount, setLoginAccount] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register fields
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  // Message states
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to home
  useEffect(() => {
    if (user) {
      if (user.isAdmin) {
        router.push("/admin");
      } else {
        router.push("/");
      }
    }
  }, [user, router]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginAccount.trim() || !loginPassword) {
      setErrorMsg("请填写账号和密码");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const res = await login(loginAccount.trim(), loginPassword);
    if (res.success) {
      setSuccessMsg("登录成功！正在跳转...");
      // Redirect happens automatically due to useEffect above
    } else {
      setErrorMsg(res.error || "登录失败，请检查账号和密码");
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername.trim() || !regEmail.trim() || !regPassword || !regConfirmPassword) {
      setErrorMsg("请填写所有必填字段");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg("两次输入的密码不一致");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: regUsername.trim(),
          email: regEmail.trim(),
          password: regPassword
        })
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg("注册成功！请使用刚注册的账号进行登录。");
        // Clear fields
        setRegUsername("");
        setRegEmail("");
        setRegPassword("");
        setRegConfirmPassword("");
        // Toggle view
        setIsRegister(false);
      } else {
        setErrorMsg(data.error || "注册失败，请重新尝试");
      }
    } catch (err: any) {
      setErrorMsg("网络请求出错: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick fill account details for demonstration
  const handleQuickFill = (role: "user" | "admin") => {
    setErrorMsg("");
    setSuccessMsg("");
    if (role === "admin") {
      setLoginAccount("admin");
      setLoginPassword("Admin@123");
    } else {
      setLoginAccount("user1");
      setLoginPassword("User@123");
    }
  };

  return (
    <div className={styles.container}>
      {/* Background Gradient Orbs */}
      <div className={styles.bgOrb1}></div>
      <div className={styles.bgOrb2}></div>

      {/* Header back button */}
      <Link href="/" className={styles.backHomeBtn}>
        <ArrowLeft size={16} />
        <span>返回首页</span>
      </Link>

      <div className={`${styles.card} glass-panel`}>
        
        {/* Tab Headers */}
        <div className={styles.tabHeaders}>
          <button 
            onClick={() => {
              setIsRegister(false);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`${styles.tabBtn} ${!isRegister ? styles.activeTab : ""}`}
          >
            密码登录
          </button>
          <button 
            onClick={() => {
              setIsRegister(true);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`${styles.tabBtn} ${isRegister ? styles.activeTab : ""}`}
          >
            注册账号
          </button>
        </div>

        {/* Dynamic Forms */}
        {!isRegister ? (
          /* Login Form */
          <form onSubmit={handleLoginSubmit} className={styles.form}>
            <div className={styles.inputWrapper}>
              <User className={styles.inputIcon} size={18} />
              <input
                type="text"
                placeholder="用户名 / 电子邮箱 / 管理员账号"
                value={loginAccount}
                onChange={(e) => setLoginAccount(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.inputWrapper}>
              <Lock className={styles.inputIcon} size={18} />
              <input
                type="password"
                placeholder="密码"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className={styles.input}
              />
            </div>

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? "正在登录..." : "登 录"}
            </button>

            {/* Quick Fill Box for testing */}
            <div className={styles.quickFillContainer}>
              <p className={styles.quickFillTitle}>快速演示通道 (一键填入测试账号):</p>
              <div className={styles.quickFillButtons}>
                <button 
                  type="button" 
                  onClick={() => handleQuickFill("user")} 
                  className={styles.quickFillBtn}
                >
                  <UserCheck size={14} />
                  <span>普通用户 (user1)</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => handleQuickFill("admin")} 
                  className={`${styles.quickFillBtn} ${styles.qfAdmin}`}
                >
                  <UserCheck size={14} />
                  <span>超级管理员 (admin)</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegisterSubmit} className={styles.form}>
            <div className={styles.inputWrapper}>
              <User className={styles.inputIcon} size={18} />
              <input
                type="text"
                placeholder="用户名 (最少 3 个字符)"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.inputWrapper}>
              <Mail className={styles.inputIcon} size={18} />
              <input
                type="email"
                placeholder="电子邮箱 (例如 user@example.com)"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.inputWrapper}>
              <Lock className={styles.inputIcon} size={18} />
              <input
                type="password"
                placeholder="账户密码 (最少 6 位)"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.inputWrapper}>
              <Lock className={styles.inputIcon} size={18} />
              <input
                type="password"
                placeholder="确认密码"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                className={styles.input}
              />
            </div>

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? "正在注册..." : "注 册"}
            </button>
          </form>
        )}

        {/* Message indicators */}
        {errorMsg && (
          <div className={styles.errorBox}>
            <ShieldAlert size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className={styles.successBox}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Footer notice */}
        <div className={styles.footerNote}>
          <p>注册即表示同意《用户协议》和《社区准则》</p>
        </div>

      </div>
    </div>
  );
}
