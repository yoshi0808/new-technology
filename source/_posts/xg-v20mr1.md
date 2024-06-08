---
title:  Sophos Firewall v20 MR1
date: 2024-06-08T13:01:00+09:00
tags: XG Firewall
categories: Security
---

{% asset_img Title.png alt %}

## Sophos Firewall v20

Sophos Firewall v20 MR1が2024年05月15日に発表されました。デバイスからのアクセス制御でAD SSO, Captive Portal, RADIUS SSO, Client Authentication, Chromebookなどの認証制御が細かく設定できること、VPNのエンハンスが挙げられます。 
<!-- more -->

v20　MR1の詳細な説明はSophos Communityを参照してください。
> <https://community.sophos.com/sophos-xg-firewall/b/blog/posts/sophos-firewall-os-v20-mr1-is-now-available>

リリースノートはこちらです
> <https://docs.sophos.com/releasenotes/index.html?productGroupID=nsg&productID=xg&versionID=20.0>

## Sophos Firewallのアップデート

管理画面にログイン後、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアの確認 %}でアップデートの案内が順次来ます。

{% asset_img mr1-1.png 800 alt %}

個別にバージョンアップのファイルを入手するには、以下のURLからダウンロードします。

<https://support.sophos.com/support/s/article/KB-000043162?language=en_US>

1. 上記画面で{% label primary @Sophos Firewall %}の{% label primary @ファームウェア %}の{% label primary @ソフトウェア %}のLinkをクリックします。
2. "SW-20.0.1_MR-1.SFW-342.sig"をダウンロードします。
3. Sophos Firewallの管理画面にログインし、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアのタブメニュー %}から以下の画面に赤丸で囲った矢印のアイコンをクリックし、ダウンロードしたモジュールをアップロードします。

{% asset_img verup.png 800 alt %}

アップロード＆再起動ボタンをクリックし、v20 MR1へのアップグレードを完了させます。

