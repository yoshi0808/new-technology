---
title: Sophos Firewall v19.5 MR-1
date: 2023-02-23T15:34:42+09:00
tags:
  - XG Firewall
categories:
  - Security
---
{% asset_img title.png alt %}

## Sophos Firewall v19.5 MR1

Sophos Firewall v19.5 MR1が2023年2月15日に発表されました。
<!-- more -->

## 主なエンハンスの内容

Home Editionとしてはバグフィックスのみで機能向上はなさそうです。新機能が無いのは少し寂しいですが、安定性はv19以降でかなり向上したと感じます。

v19.5 MR1の詳細な説明はRelease Notesを参照してください。
> <https://docs.sophos.com/releasenotes/index.html?productGroupID=nsg&productID=xg&versionID=19.5>

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

1. 上記画面で"SW-19.5.1_MR-1.SFW-278.sig"というアップデータが表示されますのでダウンロードします。
2. MY Sophosはここで終了してXGの管理画面にログインし、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアのタブメニュー %}から以下の画面に赤丸で囲った矢印のアイコンをクリックし、ダウンロードしたモジュールをアップロードします。

{% asset_img verup.png 800 alt %}

アップロード＆再起動ボタンをクリックし、v19.5へのアップグレードを完了させます。

{% asset_img upgrade.png 800 alt %}

{% note info %}
仮想環境（ESXi）上にFirewallをインストールされている方はアップグレードの前に、「{% post_link esxi-backup %}」を参考に、バックアップを確保される事をお勧めします。
{% endnote %}
