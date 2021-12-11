---
title: Sophos Firewall v18.5 MR-2
date: 2021-12-11 07:53:53
tags:
  - XG Firewall
categories:
  - Security

---
{% asset_img title.png alt %}

## Sophos Firewall v18.5 MR-2

Sophos Firewall v18.5 MR2が2021年11月29日に発表されました。主としては不具合の解消がメインです。adminユーザーは2要素認証の設定が可能になりました。
<!-- more -->

## 主なエンハンスの内容

- IPSec VPNの高速化
- Sophos Assistant ファイアウォール設定支援ガイドの提供
-  adminユーザーの2要素認証
-  DDNSでCloudflareのサポート
-  画面応答の高速化（JQueryのバージョンを3.5にアップデート）
-  100以上の問題の解決

v18.5 MR-2の詳細な説明はSophos Communityを参照してください。可能な限り迅速にアップグレードするように推奨されています。
> <https://community.sophos.com/sophos-xg-firewall/b/blog/posts/sophos-firewall-v18-5-mr2-is-now-available>

>We encourage all customers to update their firewall to the latest firmware release to take advantage of these new features, ensure their firewall is performing optimally, and is best protected with the latest security enhancements.

>これらの新機能を利用し、ファイアウォールが最適なパフォーマンスを発揮し、最新のセキュリティ強化で最善の保護を受けられるよう、すべてのお客様に最新のファームウェアリリースに更新することをお勧めします。

## Sophos Firewallのアップデート

XGの管理画面にログイン後、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアの確認 %}ではただちに全てのユーザーにアップデートの案内が来るわけでは無いようなので、アップデートにはMySophosにログインし、バージョンアップの差分モジュールをダウンロードします。

1. Sophosのサイトの右上のプルダウンメニューから、{% label primary @ライセンスとアカウント %}をクリックします。
 > https://www.sophos.com/ja-jp.aspx
2. Sophos IDをお持ちでなければIDを作成します。
3. ログイン後、{% label primary @Network Protection %}をクリックします。
4. {% label primary @ファームウェアの更新 %}をクリックします。
5. 「製品名/OSを使った検索」で”ファイアーウォール”を選択し、その後現れるプルダウンは"ソフトウェア"を選択します。
6. {% label primary @選択可能なダウンロードを表示 %}ボタンをクリックします。

{% asset_img mysophos.png 800 alt %}

7. 上記画面で"SFOS 18.5.2 MR2-Build380"というアップデータが表示されますのでダウンロードします。
8. MY Sophosはここで終了してXGの管理画面にログインし、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアのタブメニュー %}から以下の画面に赤丸で囲った矢印のアイコンをクリックし、ダウンロードしたモジュールをアップロードします。

{% asset_img verup.png 800 alt %}

アップロード＆再起動ボタンをクリックし、MR2へのアップグレードを完了させます。

{% asset_img upgrade.png 800 alt %}

{% note info %}
仮想環境（ESXi）上にFirewallをインストールされている方はアップグレードの前に、「{% post_link esxi-backup %}」を参考に、バックアップを確保される事をお勧めします。
{% endnote %}