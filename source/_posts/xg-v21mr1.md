---
title: Sophos Firewall v21 MR1
date: 2025-03-16T14:47:16+09:00
tags: XG Firewall
categories: Security
---

{% asset_img Title.png alt %}

## Sophos Firewall v21 MR1

Sophos Firewall v21 MR1が2024年03月13日に発表されました。VPNのエンハンス、DHCPのエラーからの回復機能追加などが挙げられます。IPv6のみのクライアント（IPv4を持たない）に対しIPv6からのNAT機能でIPv4サイトを閲覧できるProxy機能が加えられました。 
<!-- more -->

v21 MR1の詳細な説明はSophos Communityを参照してください。
> <https://community.sophos.com/sophos-xg-firewall/b/blog/posts/sophos-firewall-os-v21-mr1-rerelease-build-272-is-now-available>

リリースノートはこちらです。
> <https://docs.sophos.com/releasenotes/index.html?productGroupID=nsg&productID=xg&versionID=21.0>

## Sophos Firewallのアップデート

管理画面にログイン後、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアの確認 %}でアップデートの案内が順次来ます。ただし、これはかなり時間が経過してから通知が行われるのが通常のようです。

{% asset_img mr1-1.png 800 alt %}

※上記はv19稼働中において、v20のファームウェアが通知されたところです。

個別にバージョンアップのファイルを入手するには、以下のURLからダウンロードします。

<https://support.sophos.com/support/s/article/KB-000043162?language=en_US>

1. 上記画面で{% label primary @Sophos Firewall %}の{% label primary @ファームウェア %}の{% label primary @ソフトウェア %}のLinkをクリックします。
2. "SW-21.0.1_MR-1.SFW-272.sig"をダウンロードします。
3. Sophos Firewallの管理画面にログインし、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアのタブメニュー %}から以下の画面に赤丸で囲った矢印のアイコンをクリックし、ダウンロードしたモジュールをアップロードします。

{% asset_img verup.png 800 alt %}

アップロード＆再起動ボタンをクリックし、v21 MR1へのアップグレードを完了させます。

## 補足

実は、v21 MR1は2025-02-18に一度リリースされましたが、Let's Encryptで証明書の生成に関する問題が発生していました。ホームユーザーにとってはLet's Encryptの再登録はそれなりに手間で大変助かる機能ですので、これの適用は一旦見送っていました。今回無事に改修された新たなv21 MR1が提供されました。
