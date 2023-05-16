---
title: Sophos Firewall v19.5 MR-2
date: 2023-05-16T21:00:00+09:00
tags:
  - XG Firewall
categories:
  - Security
---
{% asset_img title.png alt %}

## Sophos Firewall v19.5 MR2

Sophos Firewall v19.5 MR2が2023年5月8日に発表されました。
<!-- more -->

## 主なエンハンスの内容

MR2ではセキュリティ向上と4,000のマルチキャストグループのルーティングに対応しています。ホームユーザーにとって新機能が無いのは少し寂しいですが、安定性はv19以降でかなり向上しています。
WANセグメントに管理画面を開放している場合、ACLで厳格にアクセスリストを求められるようになります。部門のFirewallを想定しているのかもしれませんね。個人ではWANに管理画面を開放するようなことはありませんが。。。

v19.5 MR2の詳細な説明はRelease Notesを参照してください。
> <https://docs.sophos.com/releasenotes/index.html?productGroupID=nsg&productID=xg&versionID=19.5>

## Sophos Firewallのアップデート

XGの管理画面にログイン後、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアの確認 %}に通知が来る場合があります。

{% asset_img notice.png 480 alt %}

また、アップデートの案内が来ていなくても、MySophosにログインし、バージョンアップの差分モジュールをダウンロードします。

1. Sophosのサイトの上部の「ソフォスについて」のプルダウンメニューから、{% label primary @ライセンスとアカウント %}をクリックします。
 > <https://www.sophos.com/ja-jp.aspx>
1. Sophos IDをお持ちでなければIDを作成します。
2. ログイン後、{% label primary @Network Protection %}をクリックします。
3. {% label primary @Firmware Updates %}をクリックします。
4. 「製品名/OSを使った検索」で”Firewall”を選択し、その後現れるプルダウンは"Software"を選択します。
5. {% label primary @Show Available Downloads %}ボタンをクリックします。

{% asset_img mysophos.png 800 alt %}

1. 上記画面で"SW-19.5.2_MR-3.SFW-624.sig"というアップデータが表示されますのでダウンロードします。
2. MY Sophosはここで終了してXGの管理画面にログインし、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアのタブメニュー %}から以下の画面に赤丸で囲った矢印のアイコンをクリックし、ダウンロードしたモジュールをアップロードします。

{% asset_img verup.png 800 alt %}

アップロード＆再起動ボタンをクリックし、v19.5 MR2へのアップグレードを完了させます。

{% asset_img upgrade.png 800 alt %}

{% note info %}
仮想環境（ESXi）上にFirewallをインストールされている方はアップグレードの前に、「{% post_link esxi-backup %}」を参考に、バックアップを確保される事をお勧めします。
{% endnote %}
