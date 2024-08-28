---
title: Sophos Firewall v20 MR2
date: 2024-08-25T18:28:23+09:00
tags: XG Firewall
categories: Security
---

{% asset_img Title.png alt %}

## Sophos Firewall v20

Sophos Firewall v20 MR2が2024年07月23日に発表されました。異なるFirewallへの移行を意図したバックアップ、レストアの機能が実装されています。
<!-- more -->

v20　MR2の詳細な説明はSophos Communityを参照してください。
> <https://community.sophos.com/sophos-xg-firewall/b/blog/posts/sophos-firewall-os-v20-mr2-is-now-available>

リリースノートはこちらです
> <https://docs.sophos.com/releasenotes/index.html?productGroupID=nsg&productID=xg&versionID=20.0>
- SafeSearch、YouTubeの制限、Google Appのログインドメインの制限、およびAzure ADテナントの制限を強制する際に、システム負荷を軽減してWeb保護のパフォーマンスを強化しました。
- 45以上の重要なパフォーマンス、信頼性、安定性、セキュリティの修正を解決します。

## Sophos Firewallのアップデート

管理画面にログイン後、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアの確認 %}でアップデートの案内が順次来ます。以下はv20 MR1のものですが、ここでMR2の表示がなされます。

{% asset_img mr1-1.png 800 alt %}

個別にバージョンアップのファイルを入手するには、以下のURLからダウンロードします。

<https://support.sophos.com/support/s/article/KBA-000007972?language=ja>

1. 上記画面で{% label primary @Sophos Firewall %}の{% label primary @ファームウェア %}の{% label primary @ソフトウェア %}のLinkをクリックします。
2. "SW-20.0.2_MR-2.SFW-378.sig"をダウンロードします。
3. Sophos Firewallの管理画面にログインし、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアのタブメニュー %}から以下の画面に赤丸で囲った矢印のアイコンをクリックし、ダウンロードしたモジュールをアップロードします。

{% asset_img verup.png 800 alt %}

アップロード＆再起動ボタンをクリックし、v20 MR2へのアップグレードを完了させます。

数年間利用しているSophos Firewallですが、特段の問題なく、仮想環境（ESXi8）配下で安定して稼働しています。そういえば、Sophos Firewallのセットアップに関する私の記事はESXi前提で、現時点でのホームユーザー向けにはProxmox向けの手順を改めて記載すべきと認識しています。但し、Proxmox上のSophos Firewallのセットアップは特段苦労することもありませんので、興味のある方はチャレンジしてみてください。