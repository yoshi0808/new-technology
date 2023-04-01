---
title: Sophos Firewall v19 MR-1
date: 2022-07-30 06:00:00
tags:
categories:
---
{% asset_img title.png alt %}

## Sophos Firewall v19 MR-1

Sophos Firewall v19 MR-1が2022年7月25日に発表されました。ほとんと微修正で大きなエンハンスではなさそうです。
<!-- more -->

## 主なエンハンスの内容

（8/16更新）
V19 MR-1の再リリースということで、2022年8月15日に「Sophos Firewall OS v19 MR1 re-release (Build 365) is Now Available」の案内がありました。不具合の緊急対応も含まれるようです。

- マルウェアエンジンの64ビット対応
- Sophos Assistantオプトアウト機能

v19の詳細な説明はRelease Note（英語）を参照してください。
> <https://docs.sophos.com/releasenotes/index.html?productGroupID=nsg&productID=xg&versionID=19.0>

## Sophos Firewallのアップデート

XGの管理画面にログイン後、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアの確認 %}ではただちに全てのユーザーにアップデートの案内が来るわけでは無いので、アップデートにはMySophosにログインし、バージョンアップの差分モジュールをダウンロードします。

1. Sophosのサイトの右上のプルダウンメニューから、{% label primary @ライセンスとアカウント %}をクリックします。
 > https://www.sophos.com/ja-jp.aspx
2. Sophos IDをお持ちでなければIDを作成します。
3. ログイン後、{% label primary @Network Protection %}をクリックします。
4. {% label primary @ファームウェアの更新 %}をクリックします。
5. 「製品名/OSを使った検索」で”ファイアーウォール”を選択し、その後現れるプルダウンは"ソフトウェア"を選択します。
6. {% label primary @選択可能なダウンロードを表示 %}ボタンをクリックします。

{% asset_img mysophos.png 800 alt %}

1. 上記画面で"SW-19.0.1_MR-1.SFW-365.sig"というアップデータが表示されますのでダウンロードします。
2. MY Sophosはここで終了してXGの管理画面にログインし、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアのタブメニュー %}から以下の画面に赤丸で囲った矢印のアイコンをクリックし、ダウンロードしたモジュールをアップロードします。

{% asset_img verup.png 800 alt %}

アップロード＆再起動ボタンをクリックし、v19 MR-1へのアップグレードを完了させます。

{% asset_img upgrade.png 800 alt %}

{% note info %}
仮想環境（ESXi）上にFirewallをインストールされている方はアップグレードの前に、「{% post_link esxi-backup %}」を参考に、バックアップを確保される事をお勧めします。
{% endnote %}
